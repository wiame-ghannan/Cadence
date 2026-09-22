from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from app.models.task import TaskStatus, TaskPriority


class CreateTask(BaseModel):
    title: str
    description: Optional[str] = None
    priority: TaskPriority
    duration: int
    project_id: int
    assigned_to: Optional[int] = None
    depends_on: List[int] = []


class UpdateTask(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    duration: Optional[int] = None
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