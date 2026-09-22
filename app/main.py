from fastapi import FastAPI
from app.database import Base,engine,get_db
from app.routers import auth,project,task,project_member
from app.models import User, Project, ProjectMember, Task, TaskDependency
app = FastAPI()
app.include_router(auth.router)
app.include_router(project.router)
app.include_router(task.router)
app.include_router(project_member.router)


@app.on_event("startup")
async def on_startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


