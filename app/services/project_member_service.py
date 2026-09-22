from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
from app.models.project_member import ProjectMember, ProjectRole
from app.schemas.project_member import AddProjectMember, UpdateProjectMemberRole


async def get_membership(db: AsyncSession, project_id: int, user_id: int) -> ProjectMember | None:
    result = await db.execute(
        select(ProjectMember).where(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == user_id,
        )
    )
    return result.scalar_one_or_none()


async def check_is_owner(db: AsyncSession, project_id: int, user_id: int) -> None:
    membership = await get_membership(db, project_id, user_id)
    if membership is None or membership.role != ProjectRole.OWNER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the project owner can perform this action",
        )


async def add_member(
    db: AsyncSession, project_id: int, member_data: AddProjectMember, current_user_id: int
) -> ProjectMember:
    await check_is_owner(db, project_id, current_user_id)

    existing = await get_membership(db, project_id, member_data.user_id)
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already a member of this project",
        )

    new_member = ProjectMember(
        user_id=member_data.user_id, project_id=project_id, role=member_data.role
    )
    db.add(new_member)
    await db.commit()
    await db.refresh(new_member)
    return new_member


async def list_members(db: AsyncSession, project_id: int) -> list[ProjectMember]:
    result = await db.execute(select(ProjectMember).where(ProjectMember.project_id == project_id))
    return result.scalars().all()


async def update_member_role(
    db: AsyncSession,
    project_id: int,
    target_user_id: int,
    role_data: UpdateProjectMemberRole,
    current_user_id: int,
) -> ProjectMember:
    await check_is_owner(db, project_id, current_user_id)

    membership = await get_membership(db, project_id, target_user_id)
    if membership is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

    membership.role = role_data.role
    await db.commit()
    await db.refresh(membership)
    return membership


async def remove_member(db: AsyncSession, project_id: int, target_user_id: int, current_user_id: int) -> None:
    await check_is_owner(db, project_id, current_user_id)

    membership = await get_membership(db, project_id, target_user_id)
    if membership is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

    await db.delete(membership)
    await db.commit()