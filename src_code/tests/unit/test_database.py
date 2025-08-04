"""Unit tests for database module."""

import pytest
import json
import os
from unittest.mock import patch, AsyncMock

from ethercalc.database import DatabaseManager


class TestDatabaseManager:
    """Test DatabaseManager class."""

    def test_init(self, temp_dir):
        """Test database manager initialization."""
        db = DatabaseManager(data_dir=temp_dir)
        assert db.data_dir == os.path.abspath(temp_dir)
        assert db.use_redis is True
        assert os.path.exists(f"{temp_dir}/dump")

    @pytest.mark.asyncio
    async def test_connect_redis_success(self, mock_redis):
        """Test successful Redis connection."""
        db = DatabaseManager()
        
        with patch('redis.asyncio.from_url', return_value=mock_redis):
            result = await db.connect()
            assert result is True
            assert db.use_redis is True

    @pytest.mark.asyncio
    async def test_connect_redis_failure(self, temp_dir):
        """Test Redis connection failure and filesystem fallback."""
        db = DatabaseManager(data_dir=temp_dir)
        
        with patch('redis.asyncio.from_url') as mock_from_url:
            mock_redis = AsyncMock()
            mock_redis.ping.side_effect = Exception("Connection failed")
            mock_from_url.return_value = mock_redis
            
            result = await db.connect()
            assert result is False
            assert db.use_redis is False

    @pytest.mark.asyncio
    async def test_save_spreadsheet_filesystem(self, test_db, sample_spreadsheet):
        """Test saving spreadsheet to filesystem."""
        result = await test_db.save_spreadsheet(sample_spreadsheet)
        assert result is True
        
        # Check if file was created
        file_path = f"{test_db.data_dir}/dump/snapshot-{sample_spreadsheet['id']}.txt"
        assert os.path.exists(file_path)
        
        # Check file contents
        with open(file_path, 'r') as f:
            data = json.load(f)
            assert data == sample_spreadsheet

    @pytest.mark.asyncio
    async def test_get_spreadsheet_filesystem(self, test_db, sample_spreadsheet):
        """Test getting spreadsheet from filesystem."""
        # First save the spreadsheet
        await test_db.save_spreadsheet(sample_spreadsheet)
        
        # Then retrieve it
        result = await test_db.get_spreadsheet(sample_spreadsheet['id'])
        assert result == sample_spreadsheet

    @pytest.mark.asyncio
    async def test_get_nonexistent_spreadsheet(self, test_db):
        """Test getting non-existent spreadsheet."""
        result = await test_db.get_spreadsheet("nonexistent")
        assert result is None

    @pytest.mark.asyncio
    async def test_delete_spreadsheet_filesystem(self, test_db, sample_spreadsheet):
        """Test deleting spreadsheet from filesystem."""
        # First save the spreadsheet
        await test_db.save_spreadsheet(sample_spreadsheet)
        
        # Then delete it
        result = await test_db.delete_spreadsheet(sample_spreadsheet['id'])
        assert result is True
        
        # Check if file was deleted
        file_path = f"{test_db.data_dir}/dump/snapshot-{sample_spreadsheet['id']}.txt"
        assert not os.path.exists(file_path)

    @pytest.mark.asyncio
    async def test_get_all_spreadsheet_ids_filesystem(self, test_db, sample_spreadsheet):
        """Test getting all spreadsheet IDs from filesystem."""
        # Save a spreadsheet
        await test_db.save_spreadsheet(sample_spreadsheet)
        
        # Get all IDs
        ids = await test_db.get_all_spreadsheet_ids()
        assert sample_spreadsheet['id'] in ids

    @pytest.mark.asyncio
    async def test_save_audit_log_filesystem(self, test_db):
        """Test saving audit log to filesystem."""
        operation = {
            "operation": "create_cell",
            "cell": "A1",
            "value": "test",
            "user": "test_user"
        }
        
        result = await test_db.save_audit_log("test_sheet", operation)
        assert result is True
        
        # Check if audit file was created
        audit_file = f"{test_db.data_dir}/dump/audit-test_sheet.txt"
        assert os.path.exists(audit_file)

    @pytest.mark.asyncio
    async def test_get_audit_log_filesystem(self, test_db):
        """Test getting audit log from filesystem."""
        operation = {
            "operation": "create_cell",
            "cell": "A1",
            "value": "test",
            "user": "test_user"
        }
        
        # Save audit log entry
        await test_db.save_audit_log("test_sheet", operation)
        
        # Get audit log
        log = await test_db.get_audit_log("test_sheet")
        assert len(log) == 1
        assert log[0]["operation"] == "create_cell"
        assert "timestamp" in log[0]

    @pytest.mark.asyncio
    async def test_get_spreadsheet_stats(self, test_db, sample_spreadsheet):
        """Test getting spreadsheet statistics."""
        await test_db.save_spreadsheet(sample_spreadsheet)
        
        stats = await test_db.get_spreadsheet_stats(sample_spreadsheet['id'])
        
        assert stats is not None
        assert stats['id'] == sample_spreadsheet['id']
        assert stats['title'] == 'Test Spreadsheet'
        assert stats['total_cells'] == 4
        assert stats['non_empty_cells'] == 4
        assert stats['formula_cells'] == 1

    @pytest.mark.asyncio
    async def test_health_check_filesystem(self, test_db):
        """Test health check for filesystem storage."""
        health = await test_db.health_check()
        
        assert health['status'] == 'healthy'
        assert health['type'] == 'filesystem'
        assert health['connected'] is True
        assert 'data_directory' in health

    @pytest.mark.asyncio
    async def test_backup_all_data(self, test_db, sample_spreadsheet):
        """Test backing up all data."""
        # Save a spreadsheet
        await test_db.save_spreadsheet(sample_spreadsheet)
        
        # Create backup
        result = await test_db.backup_all_data()
        assert result is True
        
        # Check if backup directory exists
        backup_dir = f"{test_db.data_dir}/backups"
        assert os.path.exists(backup_dir)
        
        # Check if backup file was created
        backup_files = [f for f in os.listdir(backup_dir) if f.startswith('backup_')]
        assert len(backup_files) > 0

    @pytest.mark.asyncio
    async def test_save_spreadsheet_invalid_id(self, test_db):
        """Test saving spreadsheet without ID."""
        invalid_data = {"metadata": {"title": "No ID"}}
        
        with pytest.raises(ValueError, match="Spreadsheet ID is required"):
            await test_db.save_spreadsheet(invalid_data)