from sqlalchemy.orm import mapped_column,Mapped
from app.database import Base
from datetime import datetime
from sqlalchemy import DateTime,func,ForeignKey,Enum
from typing import Optional
import enum

class TaskStatus(str, enum.Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    DONE = "done"

class TaskPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class Task(Base):
    __tablename__="tasks"
    id:Mapped[int]=mapped_column(primary_key=True)
    title:Mapped[str]=mapped_column(nullable=False)
    description: Mapped[Optional[str]] = mapped_column()
    status: Mapped[TaskStatus] = mapped_column(Enum(TaskStatus), default=TaskStatus.TODO)
    priority: Mapped[TaskPriority] = mapped_column(Enum(TaskPriority))
    duration: Mapped[int] = mapped_column()
    version: Mapped[int] = mapped_column(default=1)
    assigned_to:Mapped[Optional[int]]=mapped_column(ForeignKey("users.id"))
    project_id:Mapped[int]=mapped_column(ForeignKey("projects.id"))
    created_at:Mapped[datetime]=mapped_column(DateTime(timezone=True), server_default=func.now())
