from pwdlib import PasswordHash
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from sqlalchemy import select, func
from datetime import datetime, timedelta, timezone
import jwt
from app.database import get_db
from fastapi import Depends,HTTPException, status
from jwt.exceptions import InvalidTokenError
from typing import Annotated
from fastapi.security import OAuth2PasswordBearer
from app.config import get_settings

settings=get_settings()

SECRET_KEY=settings.secret_key
ALGORITHM=settings.algorithm
ACCESS_TOKEN_EXPIRES_MINUTES=settings.access_token_expire_minutes

password_hash = PasswordHash.recommended()
DUMMY_HASH = password_hash.hash("dummypassword")
def verify_password(plain_password, hashed_password):
    return password_hash.verify(plain_password, hashed_password)


def get_password_hash(password):
    return password_hash.hash(password)

async def get_user(db: AsyncSession,email:str):
        # Emails are compared without case: "Alice@x.com" and "alice@x.com" are the same account
        user = await db.execute( select(User).where(func.lower(User.email) == email.lower()))
        return user.scalar_one_or_none()
     
         
async def authenticate_user(db: AsyncSession, email: str, password: str):
     user =await get_user(db, email)
     if not user:
          verify_password(password, DUMMY_HASH)
          return False
     if not verify_password(password, user.password):
         return False
     return user


def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRES_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)],db: AsyncSession=Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if email is None:
            raise credentials_exception
    except InvalidTokenError:
        raise credentials_exception
    user = await get_user(db, email)
    if user is None:
        raise credentials_exception
    return user