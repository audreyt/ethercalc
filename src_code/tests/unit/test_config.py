"""Unit tests for configuration module."""

import pytest
import os
from unittest.mock import patch

from ethercalc.config import Settings, get_settings


class TestSettings:
    """Test Settings class."""

    def test_default_settings(self):
        """Test default configuration values."""
        settings = Settings()
        
        assert settings.app_name == "EtherCalc Python"
        assert settings.app_version == "1.0.0"
        assert settings.debug is False
        assert settings.host == "0.0.0.0"
        assert settings.port == 8000
        assert settings.redis_url == "redis://localhost:6379/0"

    def test_custom_settings(self):
        """Test custom configuration values."""
        settings = Settings(
            debug=True,
            port=9000,
            host="127.0.0.1"
        )
        
        assert settings.debug is True
        assert settings.port == 9000
        assert settings.host == "127.0.0.1"

    def test_cors_origins_string_parsing(self):
        """Test CORS origins parsing from string."""
        settings = Settings(cors_origins="http://localhost:3000,http://localhost:8080")
        
        assert settings.cors_origins == ["http://localhost:3000", "http://localhost:8080"]

    def test_cors_origins_list(self):
        """Test CORS origins as list."""
        origins = ["http://localhost:3000", "http://localhost:8080"]
        settings = Settings(cors_origins=origins)
        
        assert settings.cors_origins == origins

    def test_cors_methods_string_parsing(self):
        """Test CORS methods parsing from string."""
        settings = Settings(cors_allow_methods="GET,POST,PUT")
        
        assert settings.cors_allow_methods == ["GET", "POST", "PUT"]

    def test_file_types_string_parsing(self):
        """Test file types parsing from string."""
        settings = Settings(allowed_file_types="csv,xlsx,pdf")
        
        assert settings.allowed_file_types == ["csv", "xlsx", "pdf"]

    def test_environment_variables(self):
        """Test loading from environment variables."""
        with patch.dict(os.environ, {
            'DEBUG': 'true',
            'PORT': '9000',
            'HOST': '127.0.0.1',
            'REDIS_URL': 'redis://localhost:6379/1'
        }):
            settings = Settings()
            
            assert settings.debug is True
            assert settings.port == 9000
            assert settings.host == "127.0.0.1"
            assert settings.redis_url == "redis://localhost:6379/1"

    def test_get_settings_function(self):
        """Test get_settings function."""
        settings = get_settings()
        
        assert isinstance(settings, Settings)
        assert settings.app_name == "EtherCalc Python"

    def test_websocket_settings(self):
        """Test WebSocket configuration."""
        settings = Settings()
        
        assert settings.ws_ping_interval == 30
        assert settings.ws_ping_timeout == 10
        assert settings.ws_max_connections == 1000

    def test_cache_settings(self):
        """Test cache configuration."""
        settings = Settings()
        
        assert settings.cache_ttl == 3600
        assert settings.cache_max_size == 1000

    def test_rate_limit_settings(self):
        """Test rate limiting configuration."""
        settings = Settings()
        
        assert settings.rate_limit_requests == 100
        assert settings.rate_limit_window == 60

    def test_file_upload_settings(self):
        """Test file upload configuration."""
        settings = Settings()
        
        assert settings.max_file_size == 50000000  # 50MB
        assert "csv" in settings.allowed_file_types
        assert "xlsx" in settings.allowed_file_types