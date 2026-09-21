from app.database import Base
from sqlalchemy.orm import mapped_column,Mapped
from sqlalchemy import ForeignKey

class TaskDependency(Base):
    __tablename__="task_dependencies"
    id:Mapped[int]=mapped_column(primary_key=True)
    task_id:Mapped[int]=mapped_column(ForeignKey("tasks.id"))
    depends_on_task_id:Mapped[int]=mapped_column(ForeignKey("tasks.id"))
    

