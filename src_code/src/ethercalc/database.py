"""Database manager for Redis and file system storage."""

import asyncio
import json
import os
from datetime import datetime
from typing import Dict, List, Optional, Set, Any
import aiofiles
import redis.asyncio as redis


class DatabaseManager:
    """Database manager with Redis and filesystem fallback."""
    
    def __init__(self, redis_url: str = "redis://localhost:6379/0", data_dir: str = "./data"):
        self.redis_url = redis_url
        self.data_dir = data_dir
        self.redis: Optional[redis.Redis] = None
        self.use_redis = True
        self.data_dir = os.path.abspath(data_dir)
        
        # Ensure data directory exists
        os.makedirs(self.data_dir, exist_ok=True)
        os.makedirs(f"{self.data_dir}/dump", exist_ok=True)
        
    async def connect(self) -> bool:
        """Connect to Redis server."""
        try:
            self.redis = redis.from_url(self.redis_url)
            await self.redis.ping()
            self.use_redis = True
            print(f"Connected to Redis: {self.redis_url}")
            return True
        except Exception as e:
            print(f"Redis connection failed: {e}")
            print(f"Falling back to filesystem storage: {self.data_dir}")
            self.use_redis = False
            return False
    
    async def disconnect(self) -> None:
        """Disconnect from Redis."""
        if self.redis:
            await self.redis.close()
    
    async def save_spreadsheet(self, spreadsheet_data: Dict[str, Any]) -> bool:
        """Save spreadsheet data."""
        spreadsheet_id = spreadsheet_data.get("id")
        if not spreadsheet_id:
            raise ValueError("Spreadsheet ID is required")
        
        try:
            if self.use_redis and self.redis:
                # Save to Redis
                key = f"spreadsheet:{spreadsheet_id}"
                data_json = json.dumps(spreadsheet_data)
                await self.redis.set(key, data_json)
                
                # Update timestamp
                timestamp_key = f"timestamp:{spreadsheet_id}"
                await self.redis.set(timestamp_key, datetime.now().isoformat())
                
                # Add to spreadsheet list
                await self.redis.sadd("spreadsheets", spreadsheet_id)
                
                return True
            else:
                # Save to filesystem
                file_path = f"{self.data_dir}/dump/snapshot-{spreadsheet_id}.txt"
                async with aiofiles.open(file_path, 'w') as f:
                    await f.write(json.dumps(spreadsheet_data, indent=2))
                
                # Update timestamp file
                timestamp_path = f"{self.data_dir}/dump/timestamp-{spreadsheet_id}.txt"
                async with aiofiles.open(timestamp_path, 'w') as f:
                    await f.write(datetime.now().isoformat())
                
                return True
        except Exception as e:
            print(f"Error saving spreadsheet {spreadsheet_id}: {e}")
            return False
    
    async def get_spreadsheet(self, spreadsheet_id: str) -> Optional[Dict[str, Any]]:
        """Get spreadsheet data."""
        try:
            if self.use_redis and self.redis:
                # Get from Redis
                key = f"spreadsheet:{spreadsheet_id}"
                data = await self.redis.get(key)
                if data:
                    return json.loads(data)
                return None
            else:
                # Get from filesystem
                file_path = f"{self.data_dir}/dump/snapshot-{spreadsheet_id}.txt"
                if os.path.exists(file_path):
                    async with aiofiles.open(file_path, 'r') as f:
                        content = await f.read()
                        return json.loads(content)
                return None
        except Exception as e:
            print(f"Error getting spreadsheet {spreadsheet_id}: {e}")
            return None
    
    async def delete_spreadsheet(self, spreadsheet_id: str) -> bool:
        """Delete spreadsheet data."""
        try:
            if self.use_redis and self.redis:
                # Delete from Redis
                key = f"spreadsheet:{spreadsheet_id}"
                timestamp_key = f"timestamp:{spreadsheet_id}"
                audit_key = f"audit:{spreadsheet_id}"
                
                deleted = await self.redis.delete(key, timestamp_key, audit_key)
                await self.redis.srem("spreadsheets", spreadsheet_id)
                
                return deleted > 0
            else:
                # Delete from filesystem
                files_to_delete = [
                    f"{self.data_dir}/dump/snapshot-{spreadsheet_id}.txt",
                    f"{self.data_dir}/dump/timestamp-{spreadsheet_id}.txt",
                    f"{self.data_dir}/dump/audit-{spreadsheet_id}.txt"
                ]
                
                deleted = False
                for file_path in files_to_delete:
                    if os.path.exists(file_path):
                        os.remove(file_path)
                        deleted = True
                
                return deleted
        except Exception as e:
            print(f"Error deleting spreadsheet {spreadsheet_id}: {e}")
            return False
    
    async def get_all_spreadsheet_ids(self) -> Set[str]:
        """Get all spreadsheet IDs."""
        try:
            if self.use_redis and self.redis:
                # Get from Redis
                ids = await self.redis.smembers("spreadsheets")
                return {id.decode() if isinstance(id, bytes) else id for id in ids}
            else:
                # Get from filesystem
                dump_dir = f"{self.data_dir}/dump"
                if not os.path.exists(dump_dir):
                    return set()
                
                ids = set()
                for filename in os.listdir(dump_dir):
                    if filename.startswith("snapshot-") and filename.endswith(".txt"):
                        spreadsheet_id = filename[9:-4]  # Remove "snapshot-" prefix and ".txt" suffix
                        ids.add(spreadsheet_id)
                
                return ids
        except Exception as e:
            print(f"Error getting spreadsheet IDs: {e}")
            return set()
    
    async def save_audit_log(self, spreadsheet_id: str, operation: Dict[str, Any]) -> bool:
        """Save an audit log entry."""
        try:
            operation["timestamp"] = datetime.now().isoformat()
            operation_json = json.dumps(operation)
            
            if self.use_redis and self.redis:
                # Append to Redis list
                key = f"audit:{spreadsheet_id}"
                await self.redis.lpush(key, operation_json)
                
                # Keep only last 1000 entries
                await self.redis.ltrim(key, 0, 999)
                
                return True
            else:
                # Append to filesystem
                file_path = f"{self.data_dir}/dump/audit-{spreadsheet_id}.txt"
                async with aiofiles.open(file_path, 'a') as f:
                    await f.write(operation_json + "\n")
                
                return True
        except Exception as e:
            print(f"Error saving audit log for {spreadsheet_id}: {e}")
            return False
    
    async def get_audit_log(self, spreadsheet_id: str, limit: int = 100) -> List[Dict[str, Any]]:
        """Get audit log entries."""
        try:
            if self.use_redis and self.redis:
                # Get from Redis
                key = f"audit:{spreadsheet_id}"
                entries = await self.redis.lrange(key, 0, limit - 1)
                return [json.loads(entry) for entry in entries]
            else:
                # Get from filesystem
                file_path = f"{self.data_dir}/dump/audit-{spreadsheet_id}.txt"
                if not os.path.exists(file_path):
                    return []
                
                entries = []
                async with aiofiles.open(file_path, 'r') as f:
                    lines = await f.readlines()
                    # Get last `limit` lines
                    for line in lines[-limit:]:
                        line = line.strip()
                        if line:
                            entries.append(json.loads(line))
                
                return entries[::-1]  # Reverse to match Redis order (newest first)
        except Exception as e:
            print(f"Error getting audit log for {spreadsheet_id}: {e}")
            return []
    
    async def get_spreadsheet_stats(self, spreadsheet_id: str) -> Optional[Dict[str, Any]]:
        """Get spreadsheet statistics."""
        try:
            spreadsheet_data = await self.get_spreadsheet(spreadsheet_id)
            if not spreadsheet_data:
                return None
            
            # Get timestamp
            if self.use_redis and self.redis:
                timestamp_key = f"timestamp:{spreadsheet_id}"
                timestamp = await self.redis.get(timestamp_key)
                last_modified = timestamp.decode() if timestamp else None
            else:
                timestamp_path = f"{self.data_dir}/dump/timestamp-{spreadsheet_id}.txt"
                if os.path.exists(timestamp_path):
                    async with aiofiles.open(timestamp_path, 'r') as f:
                        last_modified = await f.read()
                        last_modified = last_modified.strip()
                else:
                    last_modified = None
            
            # Calculate stats from spreadsheet data
            cells = spreadsheet_data.get("cells", {})
            non_empty_cells = sum(1 for cell in cells.values() if cell.get("value"))
            formula_cells = sum(1 for cell in cells.values() if cell.get("formula"))
            
            return {
                "id": spreadsheet_id,
                "title": spreadsheet_data.get("metadata", {}).get("title", "Untitled"),
                "total_cells": len(cells),
                "non_empty_cells": non_empty_cells,
                "formula_cells": formula_cells,
                "last_modified": last_modified,
                "version": spreadsheet_data.get("metadata", {}).get("version", 1)
            }
        except Exception as e:
            print(f"Error getting spreadsheet stats for {spreadsheet_id}: {e}")
            return None
    
    async def backup_all_data(self) -> bool:
        """Create a backup of all data."""
        try:
            backup_dir = f"{self.data_dir}/backups"
            os.makedirs(backup_dir, exist_ok=True)
            
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_file = f"{backup_dir}/backup_{timestamp}.json"
            
            all_data = {}
            
            if self.use_redis and self.redis:
                # Backup Redis data
                spreadsheet_ids = await self.get_all_spreadsheet_ids()
                
                for spreadsheet_id in spreadsheet_ids:
                    spreadsheet_data = await self.get_spreadsheet(spreadsheet_id)
                    if spreadsheet_data:
                        all_data[spreadsheet_id] = {
                            "spreadsheet": spreadsheet_data,
                            "audit_log": await self.get_audit_log(spreadsheet_id, limit=1000)
                        }
            else:
                # Backup filesystem data
                dump_dir = f"{self.data_dir}/dump"
                if os.path.exists(dump_dir):
                    for filename in os.listdir(dump_dir):
                        if filename.startswith("snapshot-") and filename.endswith(".txt"):
                            spreadsheet_id = filename[9:-4]
                            spreadsheet_data = await self.get_spreadsheet(spreadsheet_id)
                            if spreadsheet_data:
                                all_data[spreadsheet_id] = {
                                    "spreadsheet": spreadsheet_data,
                                    "audit_log": await self.get_audit_log(spreadsheet_id, limit=1000)
                                }
            
            # Save backup
            async with aiofiles.open(backup_file, 'w') as f:
                await f.write(json.dumps(all_data, indent=2))
            
            print(f"Backup created: {backup_file}")
            return True
        except Exception as e:
            print(f"Error creating backup: {e}")
            return False
    
    async def restore_from_backup(self, backup_file: str) -> bool:
        """Restore data from backup file."""
        try:
            if not os.path.exists(backup_file):
                print(f"Backup file not found: {backup_file}")
                return False
            
            async with aiofiles.open(backup_file, 'r') as f:
                backup_data = json.loads(await f.read())
            
            # Restore each spreadsheet
            for spreadsheet_id, data in backup_data.items():
                spreadsheet_data = data.get("spreadsheet")
                if spreadsheet_data:
                    await self.save_spreadsheet(spreadsheet_data)
                
                # Restore audit log
                audit_log = data.get("audit_log", [])
                for entry in audit_log:
                    await self.save_audit_log(spreadsheet_id, entry)
            
            print(f"Restored {len(backup_data)} spreadsheets from backup")
            return True
        except Exception as e:
            print(f"Error restoring from backup: {e}")
            return False
    
    async def health_check(self) -> Dict[str, Any]:
        """Check database health."""
        try:
            if self.use_redis and self.redis:
                # Check Redis
                await self.redis.ping()
                info = await self.redis.info()
                return {
                    "status": "healthy",
                    "type": "redis",
                    "connected": True,
                    "memory_usage": info.get("used_memory_human"),
                    "connected_clients": info.get("connected_clients")
                }
            else:
                # Check filesystem
                dump_dir = f"{self.data_dir}/dump"
                spreadsheet_count = len(await self.get_all_spreadsheet_ids())
                disk_usage = sum(
                    os.path.getsize(os.path.join(dump_dir, f))
                    for f in os.listdir(dump_dir)
                    if os.path.isfile(os.path.join(dump_dir, f))
                ) if os.path.exists(dump_dir) else 0
                
                return {
                    "status": "healthy", 
                    "type": "filesystem",
                    "connected": True,
                    "spreadsheet_count": spreadsheet_count,
                    "disk_usage_bytes": disk_usage,
                    "data_directory": self.data_dir
                }
        except Exception as e:
            return {
                "status": "unhealthy",
                "type": "redis" if self.use_redis else "filesystem",
                "connected": False,
                "error": str(e)
            }