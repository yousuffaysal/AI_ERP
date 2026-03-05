from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI ERP Platform - ML Service"
    
    # We read the same DB credentials Django uses
    POSTGRES_DB: str = "core_db"
    POSTGRES_USER: str = "core_user"
    POSTGRES_PASSWORD: str = "core_pass123"
    POSTGRES_HOST: str = "db"  # 'db' for docker-compose, 'localhost' for local
    POSTGRES_PORT: str = "5432"

    @property
    def DATABASE_URL(self) -> str:
        # Using asyncpg for high performance async DB access
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
