from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update
from fastapi import HTTPException, status
from app.models.project_member import ProjectMember, ProjectRole
from app.models.task import Task
from app.models.user import User
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


async def _count_owners(db: AsyncSession, project_id: int) -> int:
    result = await db.execute(
        select(func.count()).where(
            ProjectMember.project_id == project_id,
            ProjectMember.role == ProjectRole.OWNER,
        )
    )
    return result.scalar_one()


async def _check_not_last_owner(db: AsyncSession, membership: ProjectMember) -> None:
    # Without an owner, nobody could manage the project any more
    if membership.role == ProjectRole.OWNER and await _count_owners(db, membership.project_id) <= 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A project must keep at least one owner",
        )


async def _find_user(db: AsyncSession, member_data: AddProjectMember) -> User:
    if member_data.user_id is not None:
        query = select(User).where(User.id == member_data.user_id)
    else:
        query = select(User).where(func.lower(User.email) == member_data.email.lower())
    user = (await db.execute(query)).scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


async def add_member(
    db: AsyncSession, project_id: int, member_data: AddProjectMember, current_user_id: int
) -> ProjectMember:
    await check_is_owner(db, project_id, current_user_id)

    # The user must exist: otherwise the database refuses the insert (500)
    user = await _find_user(db, member_data)

    existing = await get_membership(db, project_id, user.id)
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already a member of this project",
        )

    new_member = ProjectMember(user_id=user.id, project_id=project_id, role=member_data.role)
    db.add(new_member)
    await db.commit()
    # Read it again so its user (name, email) is loaded
    return await get_membership(db, project_id, user.id)


async def list_members(db: AsyncSession, project_id: int, current_user_id: int) -> list[ProjectMember]:
    # Only the members of a project can see who is in it
    if await get_membership(db, project_id, current_user_id) is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this project",
        )
    result = await db.execute(
        select(ProjectMember).where(ProjectMember.project_id == project_id).order_by(ProjectMember.id)
    )
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

    if role_data.role != ProjectRole.OWNER:
        await _check_not_last_owner(db, membership)

    membership.role = role_data.role
    await db.commit()
    return membership


async def remove_member(db: AsyncSession, project_id: int, target_user_id: int, current_user_id: int) -> None:
    # Anyone can leave a project; removing someone else is for owners only
    if target_user_id != current_user_id:
        await check_is_owner(db, project_id, current_user_id)

    membership = await get_membership(db, project_id, target_user_id)
    if membership is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

    await _check_not_last_owner(db, membership)

    # Tasks of this project assigned to the person become unassigned
    await db.execute(
        update(Task)
        .where(Task.project_id == project_id, Task.assigned_to == target_user_id)
        .values(assigned_to=None, version=Task.version + 1)
    )
    await db.delete(membership)
    await db.commit()
