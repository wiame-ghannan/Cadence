from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class CreateProject(BaseModel):
    name: str
    description: Optional[str] = None


class UpdateProject(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class ProjectOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True