"""Pytest configuration and fixtures."""

import pytest
import asyncio
import tempfile
import shutil
from pathlib import Path
from unittest.mock import AsyncMock

import sys
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from ethercalc.database import DatabaseManager
from ethercalc.config import Settings


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def temp_dir():
    """Create a temporary directory for testing."""
    temp_dir = tempfile.mkdtemp()
    yield temp_dir
    shutil.rmtree(temp_dir)


@pytest.fixture
def test_db(temp_dir, event_loop):
    """Create a test database manager."""
    db = DatabaseManager(
        redis_url="redis://localhost:6379/15",  # Use test database
        data_dir=temp_dir
    )
    # Force filesystem mode for testing
    db.use_redis = False
    yield db
    event_loop.run_until_complete(db.disconnect())


@pytest.fixture
def test_settings():
    """Create test settings."""
    return Settings(
        debug=True,
        redis_url="redis://localhost:6379/15",
        host="127.0.0.1",
        port=8001
    )


@pytest.fixture
def sample_spreadsheet():
    """Sample spreadsheet data for testing."""
    return {
        "id": "test_spreadsheet_123",
        "metadata": {
            "title": "Test Spreadsheet",
            "version": 1,
            "created_at": "2025-07-31T10:00:00"
        },
        "cells": {
            "A1": {"value": "Hello", "type": "text"},
            "B1": {"value": "World", "type": "text"},
            "A2": {"value": "42", "type": "number"},
            "B2": {"formula": "=A2*2", "value": "84", "type": "number"}
        }
    }


@pytest.fixture
def sample_csv_data():
    """Sample CSV data for testing."""
    return """Name,Age,City
John Doe,30,New York
Jane Smith,25,Los Angeles
Bob Johnson,35,Chicago"""


@pytest.fixture
def mock_redis():
    """Mock Redis client."""
    mock = AsyncMock()
    mock.ping.return_value = True
    mock.get.return_value = None
    mock.set.return_value = True
    mock.delete.return_value = 1
    mock.smembers.return_value = set()
    mock.sadd.return_value = 1
    mock.srem.return_value = 1
    mock.lpush.return_value = 1
    mock.ltrim.return_value = True
    mock.lrange.return_value = []
    return mock