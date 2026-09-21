
from fastapi import status,HTTPException,Response,Depends,APIRouter
from app.models.user import User
from sqlalchemy.ext.asyncio import AsyncSession
from app.schemas.user import UserCreate,UserOut,UserLogin
from app.schemas.token import Token
from app.models.user import User
from app.core.security import get_password_hash,authenticate_user,create_access_token,get_current_user
from app.database import get_db
from datetime import timedelta
from app.config import get_settings
from fastapi.security import  OAuth2PasswordRequestForm
from typing import Annotated

settings =get_settings()
ACCESS_TOKEN_EXPIRES_MINUTES=settings.access_token_expire_minutes

router=APIRouter(tags=["users"])

@router.post("/users",status_code=status.HTTP_201_CREATED,response_model=UserOut)
async def create_user(user:UserCreate,db: AsyncSession = Depends(get_db)):
    new_user=User(email=user.email,name=user.name,password=get_password_hash(user.password))
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user

@router.post("/token")
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],db: AsyncSession = Depends(get_db)) -> Token:
    user = await authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRES_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email},expires_delta=access_token_expires
    )
    return Token(access_token=access_token, token_type="bearer")

@router.get("/users/me/")
async def read_users_me(
    current_user: Annotated[UserLogin, Depends(get_current_user)],
) -> UserOut:
    return current_user


