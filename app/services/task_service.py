from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
from app.models.task import Task
from app.models.task_dependency import TaskDependency
from app.schemas.task import CreateTask, UpdateTask
from app.services.project_member_service import check_is_owner
from app.services.project_service import check_is_member
from sqlalchemy import select, update


async def _get_task_or_404(db: AsyncSession, task_id: int) -> Task:
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return task


async def create_task(
    db: AsyncSession, project_id: int, task_data: CreateTask, current_user_id: int
) -> Task:
    # Only an owner can create tasks
    await check_is_owner(db, project_id, current_user_id)

    # Every prerequisite must be an existing task of this same project
    prerequisite_ids = set(task_data.depends_on)
    if prerequisite_ids:
        result = await db.execute(
            select(Task.id).where(
                Task.id.in_(prerequisite_ids), Task.project_id == project_id
            )
        )
        if set(result.scalars().all()) != prerequisite_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="depends_on must contain existing tasks of this project",
            )

    new_task = Task(
        title=task_data.title,
        description=task_data.description,
        priority=task_data.priority,
        duration=task_data.duration,
        assigned_to=task_data.assigned_to,
        project_id=project_id,
    )
    db.add(new_task)
    await db.flush()

    for depends_on_id in prerequisite_ids:
        db.add(TaskDependency(task_id=new_task.id, depends_on_task_id=depends_on_id))

    await db.commit()
    await db.refresh(new_task)
    return new_task


async def get_task(db: AsyncSession, task_id: int, current_user_id: int) -> Task:
    task = await _get_task_or_404(db, task_id)
    await check_is_member(db, task.project_id, current_user_id)
    return task


async def list_tasks_by_project(db: AsyncSession, project_id: int, current_user_id: int) -> list[Task]:
    await check_is_member(db, project_id, current_user_id)
    result = await db.execute(select(Task).where(Task.project_id == project_id))
    return result.scalars().all()


async def update_task(
    db: AsyncSession, task_id: int, task_data: UpdateTask, current_user_id: int
) -> Task:
    # get_task checks that the task exists and that the user is a member of its project
    task = await get_task(db, task_id, current_user_id)

    # Fields to change: everything the client sent, except the version itself
    changes = task_data.model_dump(exclude_none=True, exclude={"version"})

    # The database compares the version and updates in a single step
    result = await db.execute(
        update(Task)
        .where(Task.id == task_id, Task.version == task_data.version)
        .values(**changes, version=Task.version + 1)
    )

    # No row updated: someone else changed the task since the client read it
    if result.rowcount == 0:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This task was modified by someone else, reload it and try again",
        )

    await db.commit()
    await db.refresh(task)
    return task

async def delete_task(db: AsyncSession, task_id: int, current_user_id: int) -> None:
    task = await _get_task_or_404(db, task_id)
    await check_is_owner(db, task.project_id, current_user_id)
    await db.delete(task)
    await db.commit()