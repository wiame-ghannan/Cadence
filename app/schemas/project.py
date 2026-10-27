from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.schemas.user import NonEmptyStr


class CreateProject(BaseModel):
    name: NonEmptyStr
    description: Optional[str] = None


class UpdateProject(BaseModel):
    # A field that is not sent stays unchanged; description=null clears it
    name: Optional[NonEmptyStr] = None
    description: Optional[str] = None


class ProjectOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
