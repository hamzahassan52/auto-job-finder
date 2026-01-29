from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional


class Settings(BaseSettings):
    # App
    APP_NAME: str = "Job Auto Sender"
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api/v1"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:password@localhost:5432/job_auto_sender"
    REDIS_URL: str = "redis://localhost:6379/0"

    # AI
    ANTHROPIC_API_KEY: str = ""
    OPENAI_API_KEY: Optional[str] = None
    GROQ_API_KEY: str = ""  # For fast testing
    AI_PROVIDER: str = "groq"  # groq, anthropic, openai

    # Email
    SENDGRID_API_KEY: str = ""
    FROM_EMAIL: str = "noreply@example.com"

    # Auth
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Scraping
    SCRAPE_DELAY_SECONDS: int = 2
    MAX_CONCURRENT_SCRAPES: int = 3

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
