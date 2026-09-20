from pydantic import BaseModel,EmailStr

class UserCreate(BaseModel):
    email:EmailStr
    password:str
    name:str
class UserOut(BaseModel):
    id:int
    email:EmailStr
    name:str
class UserLogin(BaseModel):
    email:EmailStr
    password:str
