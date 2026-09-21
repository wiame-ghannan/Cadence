from sqlalchemy.orm import mapped_column,Mapped
from app.database import Base

class User(Base):
    __tablename__='users'
    id:Mapped[int]=mapped_column(primary_key=True)
    email:Mapped[str]=mapped_column(nullable=False,unique=True)
    password:Mapped[str]=mapped_column(nullable=False)
    name:Mapped[str]=mapped_column(nullable=False)




