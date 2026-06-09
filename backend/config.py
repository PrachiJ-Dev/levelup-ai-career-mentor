"""
LevelUp Configuration
Loads all settings from environment variables (or .env file via python-dotenv).
"""
import os
from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # MongoDB Atlas
    mongodb_url: str = "mongodb://localhost:27017"
    mongodb_db_name: str = "levelup"

    # JWT Auth
    jwt_secret: str = "changeme"
    jwt_expire_hours: int = 24

    # File Upload
    upload_dir: str = "uploads/resumes"
    max_file_size_mb: int = 10

    # Demo Mode (bypass ML inference, return hardcoded responses)
    demo_mode: bool = False

    # Groq API for Dynamic Generation
    groq_api_key: str | None = None

    # Redis (optional)
    redis_url: str = "redis://localhost:6379"

    # CORS
    allowed_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
