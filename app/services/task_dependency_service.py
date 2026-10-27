from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.task import TaskStatus
from app.models.task_dependency import TaskDependency
from app.services.task_service import get_task
from app.services.project_member_service import check_is_owner
from app.services.graph_service import build_graph
from app.services.topological_sort import topological_sort, CycleDetectedError


async def _find_dependency(db: AsyncSession, task_id: int, depends_on_task_id: int):
    result = await db.execute(
        select(TaskDependency).where(
            TaskDependency.task_id == task_id,
            TaskDependency.depends_on_task_id == depends_on_task_id,
        )
    )
    return result.scalar_one_or_none()


async def add_dependency(
    db: AsyncSession, task_id: int, depends_on_task_id: int, current_user_id: int
) -> TaskDependency:
    # A task cannot depend on itself
    if task_id == depends_on_task_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A task cannot depend on itself",
        )

    # The task must exist, and only an owner of its project can change dependencies
    task = await get_task(db, task_id, current_user_id)
    await check_is_owner(db, task.project_id, current_user_id)

    # The prerequisite must exist and belong to the same project
    prerequisite = await get_task(db, depends_on_task_id, current_user_id)
    if task.project_id != prerequisite.project_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Both tasks must belong to the same project",
        )

    # A task that has already started cannot wait for an unfinished task
    if task.status != TaskStatus.TODO and prerequisite.status != TaskStatus.DONE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This task has already started, it cannot wait for a task that is not done",
        )

    # The dependency must not already exist
    if await _find_dependency(db, task_id, depends_on_task_id) is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This dependency already exists",
        )

    # Add the new arrow in memory only, and check that no cycle appears
    adj, indegree, duration = await build_graph(db, task.project_id)
    adj[depends_on_task_id].append(task_id)
    indegree[task_id] += 1
    try:
        topological_sort(adj, indegree)
    except CycleDetectedError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": "This dependency creates a cycle", "cycle": e.cycle},
        )

    # All checks passed: save the dependency
    new_dependency = TaskDependency(
        task_id=task_id, depends_on_task_id=depends_on_task_id
    )
    db.add(new_dependency)
    await db.commit()
    await db.refresh(new_dependency)
    return new_dependency


async def list_dependencies(
    db: AsyncSession, task_id: int, current_user_id: int
) -> list[TaskDependency]:
    # Any member of the project can read the dependencies
    await get_task(db, task_id, current_user_id)
    result = await db.execute(
        select(TaskDependency).where(TaskDependency.task_id == task_id)
    )
    return result.scalars().all()


async def remove_dependency(
    db: AsyncSession, task_id: int, depends_on_task_id: int, current_user_id: int
) -> None:
    task = await get_task(db, task_id, current_user_id)
    await check_is_owner(db, task.project_id, current_user_id)

    dependency = await _find_dependency(db, task_id, depends_on_task_id)
    if dependency is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Dependency not found"
        )

    await db.delete(dependency)
    await db.commit()