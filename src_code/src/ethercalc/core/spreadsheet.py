"""Core spreadsheet data models and operations."""

import json
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional, Set, Tuple, Union
from uuid import uuid4

from pydantic import BaseModel, Field, validator


class CellType(str, Enum):
    """Cell value types."""
    TEXT = "text"
    NUMBER = "number"
    FORMULA = "formula"
    BOOLEAN = "boolean"
    DATE = "date"
    ERROR = "error"
    EMPTY = "empty"


class CellFormat(BaseModel):
    """Cell formatting options."""
    number_format: Optional[str] = None
    font_family: Optional[str] = None
    font_size: Optional[int] = None
    font_bold: Optional[bool] = None
    font_italic: Optional[bool] = None
    font_color: Optional[str] = None
    background_color: Optional[str] = None
    border_style: Optional[str] = None
    border_color: Optional[str] = None
    text_align: Optional[str] = None
    vertical_align: Optional[str] = None


class Cell(BaseModel):
    """Individual spreadsheet cell."""
    
    value: Any = None
    formula: Optional[str] = None
    cell_type: CellType = CellType.EMPTY
    format: Optional[CellFormat] = None
    last_modified: datetime = Field(default_factory=datetime.now)
    last_modified_by: Optional[str] = None
    locked: bool = False
    comment: Optional[str] = None
    
    class Config:
        """Pydantic config."""
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

    @validator('cell_type', always=True)
    def determine_cell_type(cls, v, values):
        """Automatically determine cell type based on value and formula."""
        if 'formula' in values and values['formula']:
            return CellType.FORMULA
        
        value = values.get('value')
        if value is None or value == "":
            return CellType.EMPTY
        elif isinstance(value, bool):
            return CellType.BOOLEAN
        elif isinstance(value, (int, float)):
            return CellType.NUMBER
        elif isinstance(value, str):
            # Try to detect if it's a date or number
            return CellType.TEXT
        else:
            return CellType.TEXT

    def to_dict(self) -> Dict[str, Any]:
        """Convert cell to dictionary."""
        return {
            "value": self.value,
            "formula": self.formula,
            "type": self.cell_type.value,
            "format": self.format.dict() if self.format else None,
            "lastModified": self.last_modified.isoformat(),
            "lastModifiedBy": self.last_modified_by,
            "locked": self.locked,
            "comment": self.comment
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Cell':
        """Create cell from dictionary."""
        format_data = data.get('format')
        return cls(
            value=data.get('value'),
            formula=data.get('formula'),
            cell_type=CellType(data.get('type', CellType.EMPTY.value)),
            format=CellFormat(**format_data) if format_data else None,
            last_modified=datetime.fromisoformat(data.get('lastModified', datetime.now().isoformat())),
            last_modified_by=data.get('lastModifiedBy'),
            locked=data.get('locked', False),
            comment=data.get('comment')
        )


class SpreadsheetMetadata(BaseModel):
    """Spreadsheet metadata."""
    
    id: str = Field(default_factory=lambda: str(uuid4()))
    title: str = "Untitled Spreadsheet"
    description: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    created_by: Optional[str] = None
    owner: Optional[str] = None
    version: int = 1
    is_public: bool = False
    password_protected: bool = False
    max_rows: int = 1000
    max_cols: int = 100
    
    class Config:
        """Pydantic config."""
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class UserSession(BaseModel):
    """User session information."""
    
    user_id: str
    session_id: str
    username: Optional[str] = None
    cursor_position: Optional[str] = None  # e.g., "A1"
    selection_range: Optional[str] = None  # e.g., "A1:B5"
    last_activity: datetime = Field(default_factory=datetime.now)
    connected: bool = True
    permissions: List[str] = Field(default_factory=list)
    
    class Config:
        """Pydantic config."""
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class Spreadsheet:
    """Main spreadsheet class with cell management."""
    
    def __init__(self, spreadsheet_id: Optional[str] = None, metadata: Optional[SpreadsheetMetadata] = None):
        """Initialize spreadsheet."""
        self.id = spreadsheet_id or str(uuid4())
        self.metadata = metadata or SpreadsheetMetadata(id=self.id)
        self.cells: Dict[str, Cell] = {}
        self.user_sessions: Dict[str, UserSession] = {}
        self._dependency_graph: Dict[str, Set[str]] = {}  # cell -> dependents
        self._precedent_graph: Dict[str, Set[str]] = {}   # cell -> precedents
    
    def get_cell(self, cell_ref: str) -> Cell:
        """Get cell by reference (e.g., 'A1')."""
        return self.cells.get(cell_ref, Cell())
    
    def set_cell(self, cell_ref: str, value: Any = None, formula: Optional[str] = None, 
                 user_id: Optional[str] = None, cell_format: Optional[CellFormat] = None) -> Cell:
        """Set cell value and/or formula."""
        cell = self.cells.get(cell_ref, Cell())
        
        # Update cell properties
        if value is not None:
            cell.value = value
        if formula is not None:
            cell.formula = formula
        if cell_format is not None:
            cell.format = cell_format
        
        cell.last_modified = datetime.now()
        cell.last_modified_by = user_id
        
        # Re-evaluate cell type
        cell = Cell(**cell.dict())  # This will trigger validators
        
        self.cells[cell_ref] = cell
        self.metadata.updated_at = datetime.now()
        self.metadata.version += 1
        
        return cell
    
    def get_range(self, range_ref: str) -> Dict[str, Cell]:
        """Get cells in range (e.g., 'A1:B5')."""
        if ':' not in range_ref:
            return {range_ref: self.get_cell(range_ref)}
        
        start_ref, end_ref = range_ref.split(':')
        start_col, start_row = self._parse_cell_ref(start_ref)
        end_col, end_row = self._parse_cell_ref(end_ref)
        
        result = {}
        for row in range(start_row, end_row + 1):
            for col in range(start_col, end_col + 1):
                cell_ref = self._create_cell_ref(col, row)
                result[cell_ref] = self.get_cell(cell_ref)
        
        return result
    
    def set_range(self, range_ref: str, values: List[List[Any]], 
                  user_id: Optional[str] = None) -> Dict[str, Cell]:
        """Set values for a range of cells."""
        if ':' not in range_ref:
            if values and values[0]:
                return {range_ref: self.set_cell(range_ref, values[0][0], user_id=user_id)}
            return {}
        
        start_ref, end_ref = range_ref.split(':')
        start_col, start_row = self._parse_cell_ref(start_ref)
        
        result = {}
        for row_idx, row_values in enumerate(values):
            for col_idx, value in enumerate(row_values):
                cell_ref = self._create_cell_ref(start_col + col_idx, start_row + row_idx)
                result[cell_ref] = self.set_cell(cell_ref, value, user_id=user_id)
        
        return result
    
    def delete_cell(self, cell_ref: str) -> bool:
        """Delete a cell."""
        if cell_ref in self.cells:
            del self.cells[cell_ref]
            self.metadata.updated_at = datetime.now()
            self.metadata.version += 1
            return True
        return False
    
    def clear_range(self, range_ref: str) -> List[str]:
        """Clear cells in range."""
        cells_in_range = self.get_range(range_ref)
        cleared_cells = []
        
        for cell_ref in cells_in_range:
            if self.delete_cell(cell_ref):
                cleared_cells.append(cell_ref)
        
        return cleared_cells
    
    def add_user_session(self, user_session: UserSession) -> None:
        """Add user session."""
        self.user_sessions[user_session.session_id] = user_session
    
    def remove_user_session(self, session_id: str) -> bool:
        """Remove user session."""
        if session_id in self.user_sessions:
            del self.user_sessions[session_id]
            return True
        return False
    
    def get_active_users(self) -> List[UserSession]:
        """Get list of active users."""
        return [session for session in self.user_sessions.values() if session.connected]
    
    def update_user_cursor(self, session_id: str, cursor_position: str, 
                          selection_range: Optional[str] = None) -> bool:
        """Update user cursor position."""
        if session_id in self.user_sessions:
            session = self.user_sessions[session_id]
            session.cursor_position = cursor_position
            session.selection_range = selection_range
            session.last_activity = datetime.now()
            return True
        return False
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert spreadsheet to dictionary."""
        return {
            "id": self.id,
            "metadata": self.metadata.dict(),
            "cells": {ref: cell.to_dict() for ref, cell in self.cells.items()},
            "userSessions": {sid: session.dict() for sid, session in self.user_sessions.items()}
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Spreadsheet':
        """Create spreadsheet from dictionary."""
        spreadsheet_id = data.get('id')
        metadata = SpreadsheetMetadata(**data.get('metadata', {}))
        
        spreadsheet = cls(spreadsheet_id, metadata)
        
        # Load cells
        cells_data = data.get('cells', {})
        for cell_ref, cell_data in cells_data.items():
            spreadsheet.cells[cell_ref] = Cell.from_dict(cell_data)
        
        # Load user sessions
        sessions_data = data.get('userSessions', {})
        for session_id, session_data in sessions_data.items():
            spreadsheet.user_sessions[session_id] = UserSession(**session_data)
        
        return spreadsheet
    
    def to_json(self) -> str:
        """Convert spreadsheet to JSON string."""
        return json.dumps(self.to_dict(), indent=2)
    
    @classmethod
    def from_json(cls, json_str: str) -> 'Spreadsheet':
        """Create spreadsheet from JSON string."""
        data = json.loads(json_str)
        return cls.from_dict(data)
    
    def _parse_cell_ref(self, cell_ref: str) -> Tuple[int, int]:
        """Parse cell reference (e.g., 'A1') to column and row indices."""
        col_str = ""
        row_str = ""
        
        for char in cell_ref:
            if char.isalpha():
                col_str += char
            else:
                row_str += char
        
        # Convert column letters to number (A=0, B=1, ..., Z=25, AA=26, etc.)
        col = 0
        for char in col_str.upper():
            col = col * 26 + (ord(char) - ord('A') + 1)
        col -= 1  # Convert to 0-based
        
        row = int(row_str) - 1  # Convert to 0-based
        
        return col, row
    
    def _create_cell_ref(self, col: int, row: int) -> str:
        """Create cell reference from column and row indices."""
        # Convert column number to letters
        col_str = ""
        col += 1  # Convert to 1-based
        while col > 0:
            col -= 1
            col_str = chr(ord('A') + col % 26) + col_str
            col //= 26
        
        return f"{col_str}{row + 1}"  # Convert row to 1-based
    
    def get_cell_dependencies(self, cell_ref: str) -> Set[str]:
        """Get cells that depend on this cell."""
        return self._dependency_graph.get(cell_ref, set())
    
    def get_cell_precedents(self, cell_ref: str) -> Set[str]:
        """Get cells that this cell depends on."""
        return self._precedent_graph.get(cell_ref, set())
    
    def add_dependency(self, cell_ref: str, dependent_ref: str) -> None:
        """Add dependency relationship."""
        if cell_ref not in self._dependency_graph:
            self._dependency_graph[cell_ref] = set()
        self._dependency_graph[cell_ref].add(dependent_ref)
        
        if dependent_ref not in self._precedent_graph:
            self._precedent_graph[dependent_ref] = set()
        self._precedent_graph[dependent_ref].add(cell_ref)
    
    def remove_dependency(self, cell_ref: str, dependent_ref: str) -> None:
        """Remove dependency relationship."""
        if cell_ref in self._dependency_graph:
            self._dependency_graph[cell_ref].discard(dependent_ref)
        
        if dependent_ref in self._precedent_graph:
            self._precedent_graph[dependent_ref].discard(cell_ref)
    
    def get_stats(self) -> Dict[str, Any]:
        """Get spreadsheet statistics."""
        non_empty_cells = len([cell for cell in self.cells.values() if cell.cell_type != CellType.EMPTY])
        formula_cells = len([cell for cell in self.cells.values() if cell.cell_type == CellType.FORMULA])
        
        return {
            "totalCells": len(self.cells),
            "nonEmptyCells": non_empty_cells,
            "formulaCells": formula_cells,
            "activeUsers": len(self.get_active_users()),
            "version": self.metadata.version,
            "lastUpdated": self.metadata.updated_at.isoformat()
        }