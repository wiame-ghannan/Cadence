from fastapi import FastAPI
from app.database import Base,engine,get_db
from app.routers import auth
from app.models import User, Project, ProjectMember, Task, TaskDependency
app = FastAPI()
app.include_router(auth.router)

@app.on_event("startup")
async def on_startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


