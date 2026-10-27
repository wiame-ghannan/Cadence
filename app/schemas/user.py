from typing import Annotated
from pydantic import BaseModel,EmailStr,StringConstraints

# Text that cannot be empty or only spaces
NonEmptyStr = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]

class UserCreate(BaseModel):
    email:EmailStr
    password:Annotated[str, StringConstraints(min_length=1)]
    name:NonEmptyStr
class UserOut(BaseModel):
    id:int
    email:EmailStr
    name:str
class UserLogin(BaseModel):
    email:EmailStr
    password:str
