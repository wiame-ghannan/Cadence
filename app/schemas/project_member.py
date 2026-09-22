from pydantic import BaseModel
from app.models.project_member import ProjectRole


class AddProjectMember(BaseModel):
    user_id: int
    role: ProjectRole = ProjectRole.MEMBER


class UpdateProjectMemberRole(BaseModel):
    role: ProjectRole


class ProjectMemberOut(BaseModel):
    id: int
    user_id: int
    project_id: int
    role: ProjectRole

    class Config:
        from_attributes = True