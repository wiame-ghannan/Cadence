from fastapi import FastAPI
from app.database import Base, engine
from app.routers import auth, project, task, project_member, schedule, task_dependency
from app.models import User, Project, ProjectMember, Task, TaskDependency

app = FastAPI()
app.include_router(auth.router)
app.include_router(project.router)
app.include_router(task.router)
app.include_router(project_member.router)
app.include_router(schedule.router)
app.include_router(task_dependency.router)


@app.on_event("startup")
async def on_startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)