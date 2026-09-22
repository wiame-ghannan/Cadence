from fastapi import status, Depends, APIRouter
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.project_member import AddProjectMember, UpdateProjectMemberRole, ProjectMemberOut
from app.models.user import User
from app.core.security import get_current_user
from app.services import project_member_service

router = APIRouter(tags=["project_members"])


@router.post(
    "/projects/{project_id}/members",
    status_code=status.HTTP_201_CREATED,
    response_model=ProjectMemberOut,
)
async def add_member(
    project_id: int,
    member: AddProjectMember,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await project_member_service.add_member(db, project_id, member, current_user.id)


@router.get("/projects/{project_id}/members", response_model=list[ProjectMemberOut])
async def list_members(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await project_member_service.list_members(db, project_id)


@router.patch("/projects/{project_id}/members/{user_id}", response_model=ProjectMemberOut)
async def update_member_role(
    project_id: int,
    user_id: int,
    role: UpdateProjectMemberRole,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await project_member_service.update_member_role(
        db, project_id, user_id, role, current_user.id
    )


@router.delete("/projects/{project_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_member(
    project_id: int,
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await project_member_service.remove_member(db, project_id, user_id, current_user.id)