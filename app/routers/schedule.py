from fastapi import Depends, APIRouter
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.user import User
from app.core.security import get_current_user
from app.schemas.schedule import ScheduleOut, CriticalPathOut
from app.services import schedule_service


router = APIRouter()


@router.get("/projects/{project_id}/schedule", response_model=ScheduleOut)
async def get_schedule(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await schedule_service.get_schedule(db, project_id, current_user.id)


@router.get("/projects/{project_id}/critical-path", response_model=CriticalPathOut)
async def get_critical_path(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await schedule_service.get_critical_path(db, project_id, current_user.id)