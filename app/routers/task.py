from fastapi import status, Depends, APIRouter
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.task import CreateTask, UpdateTask, TaskOut
from app.models.user import User
from app.core.security import get_current_user
from app.services import task_service


router = APIRouter()


@router.post("/projects/{project_id}/tasks", status_code=status.HTTP_201_CREATED, response_model=TaskOut)
async def create_task(
    project_id: int,
    task: CreateTask,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await task_service.create_task(db, project_id, task, current_user.id)


@router.get("/tasks/{task_id}", response_model=TaskOut)
async def get_task(
    task_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await task_service.get_task(db, task_id, current_user.id)


@router.get("/projects/{project_id}/tasks", response_model=list[TaskOut])
async def list_tasks_by_project(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await task_service.list_tasks_by_project(db, project_id, current_user.id)


@router.patch("/tasks/{task_id}", response_model=TaskOut)
async def update_task(
    task_id: int,
    task: UpdateTask,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await task_service.update_task(db, task_id, task, current_user.id)


@router.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await task_service.delete_task(db, task_id, current_user.id)