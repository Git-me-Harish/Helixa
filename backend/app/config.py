from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from functools import lru_cache


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Database
    database_url: str = Field(..., description="Async PostgreSQL connection URL")

    # Auth
    jwt_secret: str = Field(..., description="HS256 signing secret — minimum 32 chars")
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7

    # AI providers
    groq_api_key: str = Field(..., description="From console.groq.com — free tier")
    groq_model: str = "llama-3.3-70b-versatile"
    groq_fallback_model: str = "llama-3.1-8b-instant"

    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3.1:8b"
    ollama_medical_model: str = "meditron:7b"

    # Storage
    upload_dir: str = "./uploads"
    max_upload_size_mb: int = 20

    # Vector DB
    qdrant_path: str = "./qdrant_storage"
    qdrant_collection: str = "medical_knowledge"
    embedding_model: str = "NeuML/pubmedbert-base-embeddings"
    rag_top_k: int = 3
    rag_score_threshold: float = 0.65

    # CORS
    frontend_url: str = "http://localhost:3000"

    # Rate limiting
    auth_rate_limit: str = "5/minute"
    upload_rate_limit: str = "10/minute"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
