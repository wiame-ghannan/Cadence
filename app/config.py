from functools import lru_cache
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


def to_asyncpg_url(url: str) -> str:
    # Hosts like Neon give postgresql://...?sslmode=require&channel_binding=require
    # SQLAlchemy needs the asyncpg driver in the scheme, and asyncpg does not
    # understand sslmode or channel_binding, so they are converted here
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://"):]
    if url.startswith("postgresql://"):
        url = "postgresql+asyncpg://" + url[len("postgresql://"):]

    parts = urlsplit(url)
    query = dict(parse_qsl(parts.query))
    sslmode = query.pop("sslmode", None)
    query.pop("channel_binding", None)
    if sslmode and sslmode != "disable":
        query["ssl"] = "require"

    return urlunsplit(parts._replace(query=urlencode(query)))


class Settings(BaseSettings):
    database_url: str
    test_database_url: str
    secret_key: str
    algorithm: str
    access_token_expire_minutes: int
    # Addresses allowed to call the API from a browser, separated by commas
    allowed_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    model_config = SettingsConfigDict(env_file=".env")

    @field_validator("database_url", "test_database_url")
    @classmethod
    def convert_database_url(cls, value: str) -> str:
        return to_asyncpg_url(value)

    @property
    def origins(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]


@lru_cache
def get_settings():
    return Settings()