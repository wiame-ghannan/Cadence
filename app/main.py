from fastapi import FastAPI,status,HTTPException,Response,Depends
from app.database import Base,engine,get_db
from app.models.user import User
from sqlalchemy.ext.asyncio import AsyncSession
from app.schemas.user import UserCreate,UserOut
from app.models.user import User
from app.core.security import get_password_hash
from app.routers import auth

app = FastAPI()
app.include_router(auth.router)

@app.on_event("startup")
async def on_startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


