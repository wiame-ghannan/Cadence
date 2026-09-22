from sqlalchemy.orm import mapped_column,Mapped
from app.database import Base
from datetime import datetime
from sqlalchemy import DateTime,func

class Project(Base):
    __tablename__="projects"
    id:Mapped[int]=mapped_column(primary_key=True)
    name:Mapped[str]=mapped_column(nullable=False)
    description:Mapped[str]=mapped_column(nullable=True)
    created_at:Mapped[datetime]=mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True),default=func.now(), onupdate=func.now())
