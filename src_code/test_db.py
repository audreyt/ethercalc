#!/usr/bin/env python3
"""Test database connectivity."""

import asyncio
import sys
import os
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / "src"))

# Import database manager directly
from ethercalc.database import DatabaseManager


async def test_database():
    """Test database connectivity and functionality."""
    print("=== EtherCalc Database Migration Test ===")
    
    # Initialize database manager
    db = DatabaseManager(data_dir="./data")
    
    print("\n1. Testing database connectivity...")
    connected = await db.connect()
    print(f"   Connection result: {connected}")
    
    print("\n2. Getting health status...")
    health = await db.health_check()
    print(f"   Health status: {health}")
    
    print("\n3. Testing basic CRUD operations...")
    
    # Test spreadsheet creation
    test_spreadsheet = {
        "id": "test_migration_check",
        "metadata": {
            "title": "Migration Test Spreadsheet",
            "version": 1
        },
        "cells": {
            "A1": {"value": "Hello", "type": "text"},
            "B1": {"value": "World", "type": "text"},
            "A2": {"value": "42", "type": "number"}
        }
    }
    
    save_result = await db.save_spreadsheet(test_spreadsheet)
    print(f"   Save result: {save_result}")
    
    # Test retrieving spreadsheet
    retrieved = await db.get_spreadsheet("test_migration_check")
    print(f"   Retrieved spreadsheet: {retrieved is not None}")
    
    # Test getting all spreadsheet IDs
    all_ids = await db.get_all_spreadsheet_ids()
    print(f"   All spreadsheet IDs: {all_ids}")
    
    # Test getting stats
    stats = await db.get_spreadsheet_stats("test_migration_check")
    print(f"   Spreadsheet stats: {stats}")
    
    # Test audit log
    await db.save_audit_log("test_migration_check", {
        "operation": "create",
        "user": "migration_test"
    })
    
    audit_log = await db.get_audit_log("test_migration_check")
    print(f"   Audit log entries: {len(audit_log)}")
    
    print("\n4. Testing backup functionality...")
    backup_result = await db.backup_all_data()
    print(f"   Backup result: {backup_result}")
    
    print("\n5. Cleanup...")
    delete_result = await db.delete_spreadsheet("test_migration_check")
    print(f"   Delete result: {delete_result}")
    
    await db.disconnect()
    print("\n=== Database Migration Test Complete ===")
    
    if connected and save_result and retrieved and backup_result:
        print("✅ All tests passed - migration appears successful!")
        return True
    else:
        print("❌ Some tests failed - migration needs attention")
        return False


if __name__ == "__main__":
    result = asyncio.run(test_database())
    sys.exit(0 if result else 1)