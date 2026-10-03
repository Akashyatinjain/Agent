import os
from pathlib import Path
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    # App Settings
    PORT: int = 8000
    NODE_ENV: str = "development"
    CLIENT_URL: str = "http://localhost:5173"
    SERVER_URL: str = "http://localhost:8000"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/akashagent"

    # JWT Authentication
    JWT_SECRET: str = "minigpt_super_secret_jwt_key_2026_dev"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRES_IN_DAYS: int = 7

    # LLM Providers
    GEMINI_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None
    MISTRAL_API_KEY: Optional[str] = None
    GROQ_API_KEY: Optional[str] = None

    # AWS S3 Storage
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_REGION: str = "ap-south-1"
    AWS_S3_BUCKET: str = "minigpt-uploads"

    # External Tools
    SERPAPI_KEY: Optional[str] = None
    OPENWEATHER_API_KEY: Optional[str] = None

    # Storage paths
    UPLOAD_DIR: str = str(BASE_DIR / "uploads")

    # Omnichannel Integration Settings (Telegram & WhatsApp)
    TELEGRAM_BOT_TOKEN: Optional[str] = None
    TELEGRAM_BOT_USERNAME: Optional[str] = None
    TELEGRAM_WEBHOOK_URL: Optional[str] = None
    TELEGRAM_POLLING: bool = False

    WHATSAPP_ACCOUNT_SID: Optional[str] = None
    WHATSAPP_AUTH_TOKEN: Optional[str] = None
    WHATSAPP_PHONE_NUMBER: Optional[str] = None
    WHATSAPP_WEBHOOK_VERIFY_TOKEN: Optional[str] = "minigpt_whatsapp_verify_token"

    model_config = SettingsConfigDict(
        env_file=(
            str(BASE_DIR / ".env"),
            str(BASE_DIR.parent / "backend" / ".env"),
            str(BASE_DIR.parent / ".env")
        ),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def async_database_url(self) -> str:
        url = self.DATABASE_URL
        if not url:
            return ""
        # Convert postgresql:// or postgres:// to postgresql+asyncpg://
        if url.startswith("postgresql://"):
            url = "postgresql+asyncpg://" + url[len("postgresql://"):]
        elif url.startswith("postgres://"):
            url = "postgresql+asyncpg://" + url[len("postgres://"):]
        
        # asyncpg doesn't accept channel_binding or sslmode query parameters in URL
        # We strip them and handle SSL in connect_args if needed
        if "?" in url:
            base, query = url.split("?", 1)
            params = [
                p for p in query.split("&")
                if not p.startswith("sslmode=") and not p.startswith("channel_binding=")
            ]
            if params:
                url = f"{base}?{'&'.join(params)}"
            else:
                url = base
        return url

    @property
    def cors_origins(self) -> List[str]:
        origins = [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000",
            "http://localhost:5000",
            "http://localhost:8000"
        ]
        if self.CLIENT_URL:
            # Strip trailing slash if any
            clean_client = self.CLIENT_URL.rstrip("/")
            if clean_client not in origins:
                origins.append(clean_client)
        return origins

settings = Settings()
