from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    DATABASE_URL: str = "postgresql+psycopg2://pmais:pmais@postgres:5432/pmais"
    JWT_SECRET: str = "change-me"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60 * 24

    RESEND_API_KEY: str = ""
    RESEND_FROM: str = "Pmais Eventos <noreply@pmaiseventos.com>"

    FRONTEND_ORIGIN: str = "http://localhost:3000"
    TIMEZONE: str = "America/Sao_Paulo"


settings = Settings()
