"""Real-time collaboration management for spreadsheets."""

import asyncio
from datetime import datetime
from typing import Any, Dict, List, Optional, Set
from uuid import uuid4

from .spreadsheet import UserSession, Spreadsheet
from ..utils.exceptions import CollaborationError


class CollaborationEvent:
    """Represents a collaboration event."""
    
    def __init__(self, event_type: str, user_id: str, spreadsheet_id: str, 
                 data: Dict[str, Any], timestamp: Optional[datetime] = None):
        """Initialize collaboration event."""
        self.id = str(uuid4())
        self.event_type = event_type
        self.user_id = user_id
        self.spreadsheet_id = spreadsheet_id
        self.data = data
        self.timestamp = timestamp or datetime.now()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert event to dictionary."""
        return {
            "id": self.id,
            "type": self.event_type,
            "userId": self.user_id,
            "spreadsheetId": self.spreadsheet_id,
            "data": self.data,
            "timestamp": self.timestamp.isoformat()
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'CollaborationEvent':
        """Create event from dictionary."""
        return cls(
            event_type=data["type"],
            user_id=data["userId"],
            spreadsheet_id=data["spreadsheetId"],
            data=data["data"],
            timestamp=datetime.fromisoformat(data["timestamp"])
        )


class CollaborationManager:
    """Manages real-time collaboration for spreadsheets."""
    
    def __init__(self):
        """Initialize collaboration manager."""
        self.active_sessions: Dict[str, Dict[str, UserSession]] = {}  # spreadsheet_id -> session_id -> session
        self.event_history: Dict[str, List[CollaborationEvent]] = {}  # spreadsheet_id -> events
        self.event_subscribers: Dict[str, Set[str]] = {}  # spreadsheet_id -> set of session_ids
        self.locks: Dict[str, Dict[str, str]] = {}  # spreadsheet_id -> cell_ref -> session_id
        self.max_history_size = 1000
    
    async def add_user_session(self, spreadsheet_id: str, user_session: UserSession) -> bool:
        """Add a user session to collaboration."""
        try:
            if spreadsheet_id not in self.active_sessions:
                self.active_sessions[spreadsheet_id] = {}
            
            self.active_sessions[spreadsheet_id][user_session.session_id] = user_session
            
            # Subscribe to events
            if spreadsheet_id not in self.event_subscribers:
                self.event_subscribers[spreadsheet_id] = set()
            self.event_subscribers[spreadsheet_id].add(user_session.session_id)
            
            # Broadcast user joined event
            await self._broadcast_event(
                spreadsheet_id,
                CollaborationEvent(
                    event_type="user_joined",
                    user_id=user_session.user_id,
                    spreadsheet_id=spreadsheet_id,
                    data={
                        "sessionId": user_session.session_id,
                        "username": user_session.username,
                        "permissions": user_session.permissions
                    }
                ),
                exclude_session=user_session.session_id
            )
            
            return True
            
        except Exception as e:
            raise CollaborationError(f"Failed to add user session: {str(e)}")
    
    async def remove_user_session(self, spreadsheet_id: str, session_id: str) -> bool:
        """Remove a user session from collaboration."""
        try:
            if spreadsheet_id not in self.active_sessions:
                return False
            
            if session_id not in self.active_sessions[spreadsheet_id]:
                return False
            
            user_session = self.active_sessions[spreadsheet_id][session_id]
            
            # Remove session
            del self.active_sessions[spreadsheet_id][session_id]
            
            # Unsubscribe from events
            if spreadsheet_id in self.event_subscribers:
                self.event_subscribers[spreadsheet_id].discard(session_id)
            
            # Release any locks held by this session
            await self._release_session_locks(spreadsheet_id, session_id)
            
            # Broadcast user left event
            await self._broadcast_event(
                spreadsheet_id,
                CollaborationEvent(
                    event_type="user_left",
                    user_id=user_session.user_id,
                    spreadsheet_id=spreadsheet_id,
                    data={
                        "sessionId": session_id,
                        "username": user_session.username
                    }
                )
            )
            
            # Clean up empty spreadsheet entries
            if not self.active_sessions[spreadsheet_id]:
                del self.active_sessions[spreadsheet_id]
                if spreadsheet_id in self.event_subscribers:
                    del self.event_subscribers[spreadsheet_id]
                if spreadsheet_id in self.locks:
                    del self.locks[spreadsheet_id]
                if spreadsheet_id in self.event_history:
                    del self.event_history[spreadsheet_id]
            
            return True
            
        except Exception as e:
            raise CollaborationError(f"Failed to remove user session: {str(e)}")
    
    async def update_user_cursor(self, spreadsheet_id: str, session_id: str, 
                               cursor_position: str, selection_range: Optional[str] = None) -> bool:
        """Update user cursor position."""
        try:
            if (spreadsheet_id not in self.active_sessions or 
                session_id not in self.active_sessions[spreadsheet_id]):
                return False
            
            user_session = self.active_sessions[spreadsheet_id][session_id]
            user_session.cursor_position = cursor_position
            user_session.selection_range = selection_range
            user_session.last_activity = datetime.now()
            
            # Broadcast cursor update
            await self._broadcast_event(
                spreadsheet_id,
                CollaborationEvent(
                    event_type="cursor_update",
                    user_id=user_session.user_id,
                    spreadsheet_id=spreadsheet_id,
                    data={
                        "sessionId": session_id,
                        "cursorPosition": cursor_position,
                        "selectionRange": selection_range,
                        "username": user_session.username
                    }
                ),
                exclude_session=session_id
            )
            
            return True
            
        except Exception as e:
            raise CollaborationError(f"Failed to update cursor: {str(e)}")
    
    async def broadcast_cell_update(self, spreadsheet_id: str, session_id: str,
                                  cell_ref: str, value: Any, formula: Optional[str] = None,
                                  recalculated_cells: Optional[List[str]] = None) -> bool:
        """Broadcast cell update to all collaborators."""
        try:
            if (spreadsheet_id not in self.active_sessions or 
                session_id not in self.active_sessions[spreadsheet_id]):
                return False
            
            user_session = self.active_sessions[spreadsheet_id][session_id]
            
            await self._broadcast_event(
                spreadsheet_id,
                CollaborationEvent(
                    event_type="cell_update",
                    user_id=user_session.user_id,
                    spreadsheet_id=spreadsheet_id,
                    data={
                        "cellRef": cell_ref,
                        "value": value,
                        "formula": formula,
                        "recalculatedCells": recalculated_cells or [],
                        "updatedBy": user_session.username or user_session.user_id,
                        "timestamp": datetime.now().isoformat()
                    }
                ),
                exclude_session=session_id
            )
            
            return True
            
        except Exception as e:
            raise CollaborationError(f"Failed to broadcast cell update: {str(e)}")
    
    async def acquire_cell_lock(self, spreadsheet_id: str, session_id: str, 
                              cell_ref: str, timeout: int = 30) -> bool:
        """Acquire exclusive lock on a cell."""
        try:
            if spreadsheet_id not in self.locks:
                self.locks[spreadsheet_id] = {}
            
            current_lock = self.locks[spreadsheet_id].get(cell_ref)
            
            # Check if already locked by another session
            if current_lock and current_lock != session_id:
                return False
            
            # Acquire lock
            self.locks[spreadsheet_id][cell_ref] = session_id
            
            # Broadcast lock acquired
            user_session = self.active_sessions[spreadsheet_id].get(session_id)
            if user_session:
                await self._broadcast_event(
                    spreadsheet_id,
                    CollaborationEvent(
                        event_type="cell_locked",
                        user_id=user_session.user_id,
                        spreadsheet_id=spreadsheet_id,
                        data={
                            "cellRef": cell_ref,
                            "lockedBy": user_session.username or user_session.user_id
                        }
                    ),
                    exclude_session=session_id
                )
            
            # Set up automatic lock release
            asyncio.create_task(self._auto_release_lock(spreadsheet_id, cell_ref, session_id, timeout))
            
            return True
            
        except Exception as e:
            raise CollaborationError(f"Failed to acquire cell lock: {str(e)}")
    
    async def release_cell_lock(self, spreadsheet_id: str, session_id: str, cell_ref: str) -> bool:
        """Release lock on a cell."""
        try:
            if (spreadsheet_id not in self.locks or 
                cell_ref not in self.locks[spreadsheet_id]):
                return False
            
            current_lock = self.locks[spreadsheet_id][cell_ref]
            if current_lock != session_id:
                return False  # Can only release own locks
            
            # Release lock
            del self.locks[spreadsheet_id][cell_ref]
            
            # Broadcast lock released
            user_session = self.active_sessions[spreadsheet_id].get(session_id)
            if user_session:
                await self._broadcast_event(
                    spreadsheet_id,
                    CollaborationEvent(
                        event_type="cell_unlocked",
                        user_id=user_session.user_id,
                        spreadsheet_id=spreadsheet_id,
                        data={
                            "cellRef": cell_ref,
                            "unlockedBy": user_session.username or user_session.user_id
                        }
                    )
                )
            
            return True
            
        except Exception as e:
            raise CollaborationError(f"Failed to release cell lock: {str(e)}")
    
    async def get_active_users(self, spreadsheet_id: str) -> List[Dict[str, Any]]:
        """Get list of active users in spreadsheet."""
        if spreadsheet_id not in self.active_sessions:
            return []
        
        users = []
        for session in self.active_sessions[spreadsheet_id].values():
            users.append({
                "userId": session.user_id,
                "sessionId": session.session_id,
                "username": session.username,
                "cursorPosition": session.cursor_position,
                "selectionRange": session.selection_range,
                "lastActivity": session.last_activity.isoformat(),
                "permissions": session.permissions
            })
        
        return users
    
    async def get_cell_locks(self, spreadsheet_id: str) -> Dict[str, str]:
        """Get all cell locks for a spreadsheet."""
        if spreadsheet_id not in self.locks:
            return {}
        
        # Return locks with username instead of session_id
        result = {}
        for cell_ref, session_id in self.locks[spreadsheet_id].items():
            user_session = self.active_sessions[spreadsheet_id].get(session_id)
            if user_session:
                result[cell_ref] = user_session.username or user_session.user_id
        
        return result
    
    async def get_event_history(self, spreadsheet_id: str, limit: int = 100) -> List[Dict[str, Any]]:
        """Get recent collaboration events."""
        if spreadsheet_id not in self.event_history:
            return []
        
        events = self.event_history[spreadsheet_id][-limit:]
        return [event.to_dict() for event in events]
    
    async def broadcast_message(self, spreadsheet_id: str, session_id: str, 
                              message: str, message_type: str = "chat") -> bool:
        """Broadcast chat message or notification."""
        try:
            user_session = self.active_sessions[spreadsheet_id].get(session_id)
            if not user_session:
                return False
            
            await self._broadcast_event(
                spreadsheet_id,
                CollaborationEvent(
                    event_type="message",
                    user_id=user_session.user_id,
                    spreadsheet_id=spreadsheet_id,
                    data={
                        "messageType": message_type,
                        "message": message,
                        "username": user_session.username or user_session.user_id,
                        "timestamp": datetime.now().isoformat()
                    }
                )
            )
            
            return True
            
        except Exception as e:
            raise CollaborationError(f"Failed to broadcast message: {str(e)}")
    
    async def _broadcast_event(self, spreadsheet_id: str, event: CollaborationEvent, 
                             exclude_session: Optional[str] = None) -> None:
        """Broadcast event to all subscribers."""
        # Add to history
        if spreadsheet_id not in self.event_history:
            self.event_history[spreadsheet_id] = []
        
        self.event_history[spreadsheet_id].append(event)
        
        # Trim history if too long
        if len(self.event_history[spreadsheet_id]) > self.max_history_size:
            self.event_history[spreadsheet_id] = self.event_history[spreadsheet_id][-self.max_history_size//2:]
        
        # Note: Actual broadcasting to WebSocket connections would be handled
        # by the WebSocket manager layer. This method would be called by that layer.
        # For now, we just store the event for retrieval by the WebSocket layer.
    
    async def _release_session_locks(self, spreadsheet_id: str, session_id: str) -> None:
        """Release all locks held by a session."""
        if spreadsheet_id not in self.locks:
            return
        
        locks_to_release = []
        for cell_ref, lock_session in self.locks[spreadsheet_id].items():
            if lock_session == session_id:
                locks_to_release.append(cell_ref)
        
        for cell_ref in locks_to_release:
            await self.release_cell_lock(spreadsheet_id, session_id, cell_ref)
    
    async def _auto_release_lock(self, spreadsheet_id: str, cell_ref: str, 
                               session_id: str, timeout: int) -> None:
        """Automatically release lock after timeout."""
        await asyncio.sleep(timeout)
        
        # Check if lock still exists and belongs to this session
        if (spreadsheet_id in self.locks and 
            cell_ref in self.locks[spreadsheet_id] and 
            self.locks[spreadsheet_id][cell_ref] == session_id):
            
            await self.release_cell_lock(spreadsheet_id, session_id, cell_ref)
    
    def get_collaboration_stats(self, spreadsheet_id: str) -> Dict[str, Any]:
        """Get collaboration statistics."""
        if spreadsheet_id not in self.active_sessions:
            return {
                "activeUsers": 0,
                "activeLocks": 0,
                "totalEvents": 0
            }
        
        active_users = len(self.active_sessions[spreadsheet_id])
        active_locks = len(self.locks.get(spreadsheet_id, {}))
        total_events = len(self.event_history.get(spreadsheet_id, []))
        
        return {
            "activeUsers": active_users,
            "activeLocks": active_locks,
            "totalEvents": total_events,
            "lastActivity": max([
                session.last_activity 
                for session in self.active_sessions[spreadsheet_id].values()
            ]).isoformat() if active_users > 0 else None
        }
    
    async def cleanup_inactive_sessions(self, timeout_minutes: int = 30) -> int:
        """Clean up inactive user sessions."""
        cutoff_time = datetime.now().timestamp() - (timeout_minutes * 60)
        cleaned_count = 0
        
        spreadsheets_to_remove = []
        
        for spreadsheet_id, sessions in self.active_sessions.items():
            sessions_to_remove = []
            
            for session_id, session in sessions.items():
                if session.last_activity.timestamp() < cutoff_time:
                    sessions_to_remove.append(session_id)
            
            for session_id in sessions_to_remove:
                await self.remove_user_session(spreadsheet_id, session_id)
                cleaned_count += 1
            
            if not self.active_sessions.get(spreadsheet_id):
                spreadsheets_to_remove.append(spreadsheet_id)
        
        # Clean up empty spreadsheet entries
        for spreadsheet_id in spreadsheets_to_remove:
            if spreadsheet_id in self.active_sessions:
                del self.active_sessions[spreadsheet_id]
            if spreadsheet_id in self.event_subscribers:
                del self.event_subscribers[spreadsheet_id]
            if spreadsheet_id in self.locks:
                del self.locks[spreadsheet_id]
            if spreadsheet_id in self.event_history:
                del self.event_history[spreadsheet_id]
        
        return cleaned_count