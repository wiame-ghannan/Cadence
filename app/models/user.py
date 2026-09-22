from sqlalchemy.orm import mapped_column, Mapped, relationship
from app.database import Base
from typing import List


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(nullable=False, unique=True)
    password: Mapped[str] = mapped_column(nullable=False)
    name: Mapped[str] = mapped_column(nullable=False)

    project_memberships: Mapped[List["ProjectMember"]] = relationship(back_populates="user")
    assigned_tasks: Mapped[List["Task"]] = relationship(back_populates="assignee")