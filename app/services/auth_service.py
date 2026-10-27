from sqlalchemy.ext.asyncio import AsyncSession
from datetime import timedelta
from fastapi import HTTPException, status
from app.models.user import User
from app.schemas.user import UserCreate
from app.core.security import get_password_hash, authenticate_user, create_access_token, get_user
from app.config import get_settings

settings = get_settings()


async def register_user(db: AsyncSession, user_data: UserCreate) -> User:
    # One account per email: without this check the database refuses the insert (500)
    if await get_user(db, user_data.email) is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists",
        )

    new_user = User(
        email=user_data.email.lower(),
        name=user_data.name,
        password=get_password_hash(user_data.password),
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user


async def login(db: AsyncSession, email: str, password: str) -> str:
    user = await authenticate_user(db, email, password)
    if not user:
        return None

    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(data={"sub": user.email}, expires_delta=access_token_expires)
    return access_token
