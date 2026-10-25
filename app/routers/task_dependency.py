from fastapi import status, Depends, APIRouter
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.user import User
from app.core.security import get_current_user
from app.schemas.task_dependency import AddDependency, DependencyOut
from app.services import task_dependency_service


router = APIRouter()


@router.post(
    "/tasks/{task_id}/dependencies",
    status_code=status.HTTP_201_CREATED,
    response_model=DependencyOut,
)
async def add_dependency(
    task_id: int,
    dependency: AddDependency,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await task_dependency_service.add_dependency(
        db, task_id, dependency.depends_on_task_id, current_user.id
    )


@router.get("/tasks/{task_id}/dependencies", response_model=list[DependencyOut])
async def list_dependencies(
    task_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await task_dependency_service.list_dependencies(db, task_id, current_user.id)


@router.delete(
    "/tasks/{task_id}/dependencies/{depends_on_task_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def remove_dependency(
    task_id: int,
    depends_on_task_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await task_dependency_service.remove_dependency(
        db, task_id, depends_on_task_id, current_user.id
    )