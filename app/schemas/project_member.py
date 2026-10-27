from typing import Optional
from pydantic import BaseModel, EmailStr, model_validator
from app.models.project_member import ProjectRole


class AddProjectMember(BaseModel):
    # The user to add, given by id or by email (exactly one of them)
    user_id: Optional[int] = None
    email: Optional[EmailStr] = None
    role: ProjectRole = ProjectRole.MEMBER

    @model_validator(mode="after")
    def check_one_identifier(self):
        if (self.user_id is None) == (self.email is None):
            raise ValueError("Give either user_id or email")
        return self


class UpdateProjectMemberRole(BaseModel):
    role: ProjectRole


class ProjectMemberOut(BaseModel):
    id: int
    user_id: int
    project_id: int
    role: ProjectRole
    name: str
    email: str

    class Config:
        from_attributes = True
