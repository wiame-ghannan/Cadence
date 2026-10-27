from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
from app.models.project import Project
from app.models.project_member import ProjectMember
from app.models.user import User
from app.schemas.project import CreateProject, UpdateProject
from app.services.project_member_service import get_membership, check_is_owner


async def create_project(db: AsyncSession, project_data: CreateProject, current_user: User) -> Project:
    new_project = Project(name=project_data.name, description=project_data.description)
    db.add(new_project)
    await db.flush()

    new_project_member = ProjectMember(
        user_id=current_user.id, project_id=new_project.id, role="owner"
    )
    db.add(new_project_member)

    await db.commit()
    await db.refresh(new_project)
    return new_project


async def _get_project_or_404(db: AsyncSession, project_id: int) -> Project:
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project


async def check_is_member(db: AsyncSession, project_id: int, user_id: int) -> None:
    membership = await get_membership(db, project_id, user_id)
    if membership is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this project",
        )


async def get_project(db: AsyncSession, project_id: int, current_user_id: int) -> Project:
    await check_is_member(db, project_id, current_user_id)
    return await _get_project_or_404(db, project_id)


async def list_projects(db: AsyncSession, current_user_id: int) -> list[Project]:
    result = await db.execute(
        select(Project)
        .join(ProjectMember, ProjectMember.project_id == Project.id)
        .where(ProjectMember.user_id == current_user_id)
        .order_by(Project.id)
    )
    return result.scalars().all()


async def update_project(
    db: AsyncSession, project_id: int, project_data: UpdateProject, current_user_id: int
) -> Project:
    await check_is_owner(db, project_id, current_user_id)
    project = await _get_project_or_404(db, project_id)

    # Only the fields the client sent; the name can never be null
    changes = project_data.model_dump(exclude_unset=True)
    if changes.get("name") is not None:
        project.name = changes["name"]
    if "description" in changes:
        project.description = changes["description"]

    await db.commit()
    await db.refresh(project)
    return project


async def delete_project(db: AsyncSession, project_id: int, current_user_id: int) -> None:
    await check_is_owner(db, project_id, current_user_id)
    project = await _get_project_or_404(db, project_id)
    await db.delete(project)
    await db.commit()