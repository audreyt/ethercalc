"""Application configuration management."""

import os
from typing import List, Optional

from pydantic import validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings."""
    
    # Application
    app_name: str = "EtherCalc Python"
    app_version: str = "1.0.0"
    debug: bool = False
    secret_key: str = "your-secret-key-change-in-production"
    
    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    workers: int = 4
    
    # Redis
    redis_url: str = "redis://localhost:6379/0"
    redis_password: Optional[str] = None
    redis_db: int = 0
    redis_max_connections: int = 10
    
    # Database (Optional)
    database_url: Optional[str] = None
    database_pool_size: int = 20
    database_max_overflow: int = 30
    
    # CORS
    cors_origins: List[str] = ["http://localhost:3000", "http://localhost:8080"]
    cors_allow_credentials: bool = True
    cors_allow_methods: List[str] = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    cors_allow_headers: List[str] = ["*"]
    
    # File Upload
    max_file_size: int = 50000000  # 50MB
    allowed_file_types: List[str] = ["csv", "xlsx", "xls", "ods"]
    upload_path: str = "./uploads"
    
    # Email (Optional)
    smtp_server: Optional[str] = None
    smtp_port: int = 587
    smtp_username: Optional[str] = None
    smtp_password: Optional[str] = None
    email_from: str = "noreply@ethercalc.org"
    
    # Security
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 30
    algorithm: str = "HS256"
    
    # Logging
    log_level: str = "INFO"
    log_file: str = "logs/ethercalc.log"
    
    # WebSocket
    ws_ping_interval: int = 30
    ws_ping_timeout: int = 10
    ws_max_connections: int = 1000
    
    # Cache
    cache_ttl: int = 3600  # 1 hour
    cache_max_size: int = 1000
    
    # Rate Limiting
    rate_limit_requests: int = 100
    rate_limit_window: int = 60  # seconds

    class Config:
        """Pydantic config."""
        env_file = ".env"
        case_sensitive = False

    @validator('cors_origins', pre=True)
    def parse_cors_origins(cls, v):
        """Parse CORS origins from string or list."""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v

    @validator('cors_allow_methods', pre=True) 
    def parse_cors_methods(cls, v):
        """Parse CORS methods from string or list."""
        if isinstance(v, str):
            return [method.strip() for method in v.split(",")]
        return v

    @validator('cors_allow_headers', pre=True)
    def parse_cors_headers(cls, v):
        """Parse CORS headers from string or list."""
        if isinstance(v, str):
            return [header.strip() for header in v.split(",")]
        return v

    @validator('allowed_file_types', pre=True)
    def parse_file_types(cls, v):
        """Parse file types from string or list."""
        if isinstance(v, str):
            return [ftype.strip() for ftype in v.split(",")]
        return v


# Global settings instance
settings = Settings()


def get_settings() -> Settings:
    """Get settings instance."""
    return settings