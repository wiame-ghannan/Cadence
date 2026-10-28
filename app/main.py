import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import get_settings
from app.database import Base, engine
from app.routers import auth, project, task, project_member, schedule, task_dependency
from app.models import User, Project, ProjectMember, Task, TaskDependency

logger = logging.getLogger(__name__)
settings = get_settings()

app = FastAPI()


# Turn any unexpected crash into a JSON 500 answer.
# This middleware is added before CORSMiddleware, so CORS wraps it and adds its
# headers: the browser can read the error instead of showing "Failed to fetch".
@app.middleware("http")
async def catch_unexpected_errors(request: Request, call_next):
    try:
        return await call_next(request)
    except Exception:
        logger.exception("Unexpected error on %s %s", request.method, request.url.path)
        return JSONResponse(status_code=500, content={"detail": "Internal server error"})


# Allow the React app to call this API from the browser.
# The addresses come from the ALLOWED_ORIGINS environment variable
# (local addresses by default, the deployed frontend address in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

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