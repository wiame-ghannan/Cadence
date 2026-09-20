from sqlalchemy.orm import mapped_column,Mapped
from app.database import Base
class User(Base):
    __tablename__='users'
    id:Mapped[int]=mapped_column(primary_key=True)
    email:Mapped[str]=mapped_column(nullable=False,unique=True)
    password:Mapped[str]=mapped_column(nullable=False)
    name:Mapped[str]=mapped_column(nullable=False)




  
"""
from sqlalchemy.orm import Mapped,mapped_comlumn
class Post(Base):
    __tablename__="posts"
    id:Mapped[int]=mapped_comlumn(Integer,primary_key=TRUE)
    title:Mapped[String]=mapped_comlumn(nullable=False)
    content:Mapped[String]=mapped_comlumn(nullable=False)
"""