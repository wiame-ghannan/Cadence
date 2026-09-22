from fastapi import status, Depends, APIRouter
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.project import CreateProject, UpdateProject, ProjectOut
from app.models.user import User
from app.core.security import get_current_user
from app.services import project_service


router = APIRouter()


@router.post("/project", status_code=status.HTTP_201_CREATED, response_model=ProjectOut)
async def create_project(
    project: CreateProject,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await project_service.create_project(db, project, current_user)


@router.get("/project/{project_id}", response_model=ProjectOut)
async def get_project(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await project_service.get_project(db, project_id, current_user.id)


@router.get("/projects", response_model=list[ProjectOut])
async def list_projects(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await project_service.list_projects(db, current_user.id)


@router.patch("/project/{project_id}", response_model=ProjectOut)
async def update_project(
    project_id: int,
    project: UpdateProject,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await project_service.update_project(db, project_id, project, current_user.id)


@router.delete("/project/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await project_service.delete_project(db, project_id, current_user.id)