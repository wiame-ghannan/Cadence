from sqlalchemy.ext.asyncio import AsyncSession
from datetime import timedelta
from app.models.user import User
from app.schemas.user import UserCreate
from app.core.security import get_password_hash, authenticate_user, create_access_token
from app.config import get_settings

settings = get_settings()


async def register_user(db: AsyncSession, user_data: UserCreate) -> User:
    new_user = User(
        email=user_data.email,
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