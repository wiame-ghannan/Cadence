from app.database import Base
from sqlalchemy.orm import mapped_column, Mapped, relationship
from sqlalchemy import ForeignKey


class TaskDependency(Base):
    __tablename__ = "task_dependencies"
    id: Mapped[int] = mapped_column(primary_key=True)
    task_id: Mapped[int] = mapped_column(ForeignKey("tasks.id"))
    depends_on_task_id: Mapped[int] = mapped_column(ForeignKey("tasks.id"))

    task: Mapped["Task"] = relationship(foreign_keys=[task_id], back_populates="dependencies")
    depends_on_task: Mapped["Task"] = relationship(foreign_keys=[depends_on_task_id], back_populates="dependents")