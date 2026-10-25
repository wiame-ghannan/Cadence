from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.task import Task
from app.models.task_dependency import TaskDependency


#  get the tasks of the project from the database
async def get_tasks(db: AsyncSession, project_id: int):
    result = await db.execute(select(Task).where(Task.project_id == project_id))
    return result.scalars().all()


# get the dependencies of those tasks from the database
async def get_dependencies(db: AsyncSession, task_ids: list[int]):
    result = await db.execute(
        select(TaskDependency).where(TaskDependency.task_id.in_(task_ids))
    )
    return result.scalars().all()



def make_graph(tasks, dependencies):
    duration = {}
    adj = {}
    indegree = {}

    # One entry per task, even for tasks with no dependency
    for task in tasks:
        duration[task.id] = task.duration
        adj[task.id] = []
        indegree[task.id] = 0

    # One arrow per dependency: prerequisite -> task that waits for it
    for dep in dependencies:
        prev = dep.depends_on_task_id
        nxt = dep.task_id
        adj[prev].append(nxt)
        indegree[nxt] += 1

    return adj, indegree, duration

# Call the three functions in order
async def build_graph(db: AsyncSession, project_id: int):
    tasks = await get_tasks(db, project_id)

    task_ids = []
    for task in tasks:
        task_ids.append(task.id)

    dependencies = await get_dependencies(db, task_ids)

    adj, indegree, duration = make_graph(tasks, dependencies)
    return adj, indegree, duration