from sqlalchemy.orm import mapped_column,Mapped
from app.database import Base
from sqlalchemy import ForeignKey,Enum
import enum

class ProjectRole(str, enum.Enum):
    OWNER = "owner"
    MEMBER = "member"

class ProjectMember(Base):
    __tablename__="project_members"
    id:Mapped[int]=mapped_column(primary_key=True)
    id_user:Mapped[int]=mapped_column(ForeignKey("users.id"))
    id_project:Mapped[int]=mapped_column(ForeignKey("projects.id"))
    role: Mapped[ProjectRole] = mapped_column(Enum(ProjectRole), default=ProjectRole.MEMBER)
    
