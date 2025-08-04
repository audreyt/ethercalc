"""WebSocket connection manager for real-time collaboration."""

import asyncio
import json
from typing import Dict, List, Optional, Set
from fastapi import WebSocket


class ConnectionInfo:
    """Information about a WebSocket connection."""
    
    def __init__(self, websocket: WebSocket, user_id: str, spreadsheet_id: str):
        self.websocket = websocket
        self.user_id = user_id
        self.spreadsheet_id = spreadsheet_id
        self.cursor_position: Optional[str] = None
        self.selection_range: Optional[str] = None
        self.editing_cell: Optional[str] = None


class WebSocketManager:
    """Manages WebSocket connections for real-time collaboration."""
    
    def __init__(self):
        # spreadsheet_id -> set of connections
        self.spreadsheet_connections: Dict[str, Set[ConnectionInfo]] = {}
        # websocket -> connection info
        self.connection_map: Dict[WebSocket, ConnectionInfo] = {}
        # user_id -> connection info  
        self.user_connections: Dict[str, ConnectionInfo] = {}
        
    @property
    def connection_count(self) -> int:
        """Get total number of active connections."""
        return len(self.connection_map)
    
    async def connect(self, websocket: WebSocket, spreadsheet_id: str, user_id: str) -> None:
        """Add a new WebSocket connection."""
        connection = ConnectionInfo(websocket, user_id, spreadsheet_id)
        
        # Add to spreadsheet connections
        if spreadsheet_id not in self.spreadsheet_connections:
            self.spreadsheet_connections[spreadsheet_id] = set()
        self.spreadsheet_connections[spreadsheet_id].add(connection)
        
        # Add to connection maps
        self.connection_map[websocket] = connection
        self.user_connections[user_id] = connection
        
        print(f"User {user_id} connected to spreadsheet {spreadsheet_id}")
        
        # Notify other users
        await self.broadcast_to_spreadsheet(
            spreadsheet_id, 
            {
                "type": "user_joined",
                "user_id": user_id,
                "active_users": self.get_active_users(spreadsheet_id)
            },
            exclude_user=user_id
        )
    
    def disconnect(self, websocket: WebSocket, spreadsheet_id: str, user_id: str) -> None:
        """Remove a WebSocket connection."""
        connection = self.connection_map.get(websocket)
        if not connection:
            return
            
        # Remove from spreadsheet connections
        if spreadsheet_id in self.spreadsheet_connections:
            self.spreadsheet_connections[spreadsheet_id].discard(connection)
            if not self.spreadsheet_connections[spreadsheet_id]:
                del self.spreadsheet_connections[spreadsheet_id]
        
        # Remove from connection maps
        self.connection_map.pop(websocket, None)
        self.user_connections.pop(user_id, None)
        
        print(f"User {user_id} disconnected from spreadsheet {spreadsheet_id}")
        
        # Notify other users (run in background since this might be called during cleanup)
        asyncio.create_task(self.broadcast_to_spreadsheet(
            spreadsheet_id,
            {
                "type": "user_left", 
                "user_id": user_id,
                "active_users": self.get_active_users(spreadsheet_id)
            },
            exclude_user=user_id
        ))
    
    def get_active_users(self, spreadsheet_id: str) -> List[Dict[str, str]]:
        """Get list of active users for a spreadsheet."""
        connections = self.spreadsheet_connections.get(spreadsheet_id, set())
        return [
            {
                "user_id": conn.user_id,
                "cursor_position": conn.cursor_position,
                "selection_range": conn.selection_range,
                "editing_cell": conn.editing_cell
            }
            for conn in connections
        ]
    
    async def send_to_user(self, user_id: str, message: dict) -> bool:
        """Send message to a specific user."""
        connection = self.user_connections.get(user_id)
        if not connection:
            return False
            
        try:
            await connection.websocket.send_json(message)
            return True
        except Exception as e:
            print(f"Error sending to user {user_id}: {e}")
            # Connection might be dead, clean it up
            self.disconnect(connection.websocket, connection.spreadsheet_id, user_id)
            return False
    
    async def broadcast_to_spreadsheet(
        self, 
        spreadsheet_id: str, 
        message: dict, 
        exclude_user: Optional[str] = None
    ) -> int:
        """Broadcast message to all users connected to a spreadsheet."""
        connections = self.spreadsheet_connections.get(spreadsheet_id, set()).copy()
        sent_count = 0
        dead_connections = []
        
        for connection in connections:
            if exclude_user and connection.user_id == exclude_user:
                continue
                
            try:
                await connection.websocket.send_json(message)
                sent_count += 1
            except Exception as e:
                print(f"Error broadcasting to user {connection.user_id}: {e}")
                dead_connections.append(connection)
        
        # Clean up dead connections
        for dead_conn in dead_connections:
            self.disconnect(dead_conn.websocket, spreadsheet_id, dead_conn.user_id)
        
        return sent_count
    
    async def broadcast_to_all(self, message: dict) -> int:
        """Broadcast message to all connected users."""
        sent_count = 0
        dead_connections = []
        
        for websocket, connection in self.connection_map.copy().items():
            try:
                await websocket.send_json(message)
                sent_count += 1
            except Exception as e:
                print(f"Error broadcasting to user {connection.user_id}: {e}")
                dead_connections.append(connection)
        
        # Clean up dead connections
        for dead_conn in dead_connections:
            self.disconnect(dead_conn.websocket, dead_conn.spreadsheet_id, dead_conn.user_id)
        
        return sent_count
    
    def update_user_cursor(self, user_id: str, cursor_position: Optional[str], selection_range: Optional[str] = None):
        """Update user cursor position."""
        connection = self.user_connections.get(user_id)
        if connection:
            connection.cursor_position = cursor_position
            connection.selection_range = selection_range
    
    def set_user_editing_cell(self, user_id: str, cell_ref: Optional[str]):
        """Set which cell a user is currently editing."""
        connection = self.user_connections.get(user_id)
        if connection:
            connection.editing_cell = cell_ref
    
    def get_spreadsheet_stats(self, spreadsheet_id: str) -> Dict[str, int]:
        """Get statistics for a spreadsheet's connections."""
        connections = self.spreadsheet_connections.get(spreadsheet_id, set())
        return {
            "active_users": len(connections),
            "editing_users": len([c for c in connections if c.editing_cell]),
            "total_connections": len(connections)
        }
    
    def get_all_stats(self) -> Dict[str, any]:
        """Get statistics for all connections."""
        return {
            "total_connections": self.connection_count,
            "spreadsheets": len(self.spreadsheet_connections),
            "unique_users": len(self.user_connections),
            "spreadsheet_stats": {
                spreadsheet_id: self.get_spreadsheet_stats(spreadsheet_id)
                for spreadsheet_id in self.spreadsheet_connections.keys()
            }
        }