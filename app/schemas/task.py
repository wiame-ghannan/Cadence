from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
from app.models.task import TaskStatus, TaskPriority
from app.schemas.user import NonEmptyStr


class CreateTask(BaseModel):
    title: NonEmptyStr
    description: Optional[str] = None
    priority: TaskPriority
    # A task lasts at least one day: negative durations break the schedule
    duration: int = Field(ge=1)
    assigned_to: Optional[int] = None
    depends_on: List[int] = []


class UpdateTask(BaseModel):
    # Version of the task as seen by the client, required to detect conflicts
    version: int
    # A field that is not sent stays unchanged.
    # description=null and assigned_to=null clear them; the other fields ignore null.
    title: Optional[NonEmptyStr] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    duration: Optional[int] = Field(default=None, ge=1)
    assigned_to: Optional[int] = None

class TaskOut(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    status: TaskStatus
    priority: TaskPriority
    duration: int
    version: int
    assigned_to: Optional[int] = None
    project_id: int
    created_at: datetime

    class Config:
        from_attributes = True
