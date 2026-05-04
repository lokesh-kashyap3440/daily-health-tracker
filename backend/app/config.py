from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://ht_user:changeme@db:5432/healthtracker"

    # Redis
    REDIS_URL: str = "redis://@redis:6379/0"

    # RabbitMQ — leave empty to disable (no-op connect/publish)
    RABBITMQ_URL: str = ""

    # DeepSeek API
    DEEPSEEK_API_KEY: str = ""
    DEEPSEEK_MODEL: str = "deepseek-chat"
    DEEPSEEK_MAX_TOKENS: int = 1024
    DEEPSEEK_TEMPERATURE: float = 0.7
    DEEPSEEK_TIMEOUT: int = 30

    # JWT
    JWT_SECRET: str = "change-me-to-a-long-random-string-at-least-32-chars"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # App
    APP_ENV: str = "development"
    APP_DEBUG: bool = True
    LOG_LEVEL: str = "info"
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 100
    RATE_LIMIT_CHAT_PER_MINUTE: int = 10


    @property
    def async_database_url(self) -> str:
        """Convert provider URLs to asyncpg-compatible format.

        Render and other cloud providers supply postgresql:// or postgres:// URLs.
        asyncpg needs postgresql+asyncpg:// and uses 'ssl' not 'sslmode'.
        """
        url = self.DATABASE_URL

        # Normalize postgres:// → postgresql://
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)

        # Add asyncpg driver
        if url.startswith("postgresql://") and "+asyncpg" not in url:
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)

        # asyncpg uses 'ssl' parameter, not 'sslmode'
        if "sslmode=" in url:
            import re
            sslmode = re.search(r"sslmode=(\w+)", url)
            if sslmode:
                mode = sslmode.group(1)
                url = re.sub(r"[?&]sslmode=\w+", "", url)
                ssl_val = "true" if mode in ("require", "verify-ca", "verify-full") else mode
                connector = "&" if "?" in url else "?"
                url = f"{url}{connector}ssl={ssl_val}"

        return url


settings = Settings()
