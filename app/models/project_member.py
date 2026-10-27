import enum
from sqlalchemy import Enum, ForeignKey
from sqlalchemy.orm import mapped_column, Mapped, relationship
from app.database import Base


class ProjectRole(str, enum.Enum):
    OWNER = "owner"
    MEMBER = "member"


class ProjectMember(Base):
    __tablename__ = "project_members"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"))
    role: Mapped[ProjectRole] = mapped_column(Enum(ProjectRole), default=ProjectRole.MEMBER)

    # Always loaded with the member, so its name and email can be sent to the client
    user: Mapped["User"] = relationship(back_populates="project_memberships", lazy="selectin")
    project: Mapped["Project"] = relationship(back_populates="members")

    @property
    def name(self) -> str:
        return self.user.name

    @property
    def email(self) -> str:
        return self.user.email
