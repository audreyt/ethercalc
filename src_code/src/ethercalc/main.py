"""Main FastAPI application."""

import asyncio
import json
from contextlib import asynccontextmanager
from typing import Dict, List, Optional, Set

import redis.asyncio as redis
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .config import get_settings
from .core.engine import SpreadsheetEngine
from .core.spreadsheet import Spreadsheet, Cell, CellFormat
from .database import DatabaseManager
from .websocket_manager import WebSocketManager
from .api.routes import router as api_router, set_dependencies


# Global instances
engine: Optional[SpreadsheetEngine] = None
db_manager: Optional[DatabaseManager] = None
websocket_manager: Optional[WebSocketManager] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    global engine, db_manager, websocket_manager
    
    settings = get_settings()
    
    # Initialize components
    engine = SpreadsheetEngine()
    db_manager = DatabaseManager(settings.redis_url)
    websocket_manager = WebSocketManager()
    
    await db_manager.connect()
    
    # Load existing spreadsheets from database
    spreadsheet_ids = await db_manager.get_all_spreadsheet_ids()
    for spreadsheet_id in spreadsheet_ids:
        spreadsheet_data = await db_manager.get_spreadsheet(spreadsheet_id)
        if spreadsheet_data:
            await engine.load_spreadsheet(spreadsheet_data)
    
    # Set dependencies for API routes
    set_dependencies(engine, db_manager)
    
    yield
    
    # Cleanup
    if db_manager:
        await db_manager.disconnect()


# Create FastAPI app
settings = get_settings()
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    debug=settings.debug,
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=settings.cors_allow_credentials,
    allow_methods=settings.cors_allow_methods,
    allow_headers=settings.cors_allow_headers,
)

# Include API routes
app.include_router(api_router)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
async def root():
    """Root endpoint."""
    return {"message": "EtherCalc Python API", "version": settings.app_version}


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    try:
        # Check Redis connection
        await db_manager.redis.ping()
        return {
            "status": "healthy",
            "redis": "connected",
            "active_spreadsheets": len(engine.spreadsheets),
            "active_connections": websocket_manager.connection_count
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "redis": "disconnected"
        }


@app.post("/api/spreadsheets")
async def create_spreadsheet(title: Optional[str] = "Untitled Spreadsheet"):
    """Create a new spreadsheet."""
    try:
        spreadsheet = await engine.create_spreadsheet()
        spreadsheet.metadata.title = title
        
        # Save to database
        await db_manager.save_spreadsheet(spreadsheet.to_dict())
        
        return {
            "id": spreadsheet.id,
            "title": spreadsheet.metadata.title,
            "created_at": spreadsheet.metadata.created_at.isoformat(),
            "url": f"/sheet/{spreadsheet.id}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/spreadsheets/{spreadsheet_id}")
async def get_spreadsheet(spreadsheet_id: str):
    """Get spreadsheet data."""
    try:
        spreadsheet = await engine.get_spreadsheet(spreadsheet_id)
        if not spreadsheet:
            raise HTTPException(status_code=404, detail="Spreadsheet not found")
        
        return spreadsheet.to_dict()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/spreadsheets/{spreadsheet_id}/cells/{cell_ref}")
async def update_cell(
    spreadsheet_id: str, 
    cell_ref: str, 
    value: Optional[str] = None,
    formula: Optional[str] = None,
    user_id: Optional[str] = None
):
    """Update a cell value or formula."""
    try:
        spreadsheet = await engine.get_spreadsheet(spreadsheet_id)
        if not spreadsheet:
            raise HTTPException(status_code=404, detail="Spreadsheet not found")
        
        # Update cell
        updated_cell, recalculated_cells = await engine.set_cell_value(
            spreadsheet_id, cell_ref, value, formula, user_id
        )
        
        # Save to database
        await db_manager.save_spreadsheet(spreadsheet.to_dict())
        
        # Broadcast update to connected clients
        update_data = {
            "type": "cell_update",
            "spreadsheet_id": spreadsheet_id,
            "cell_ref": cell_ref,
            "cell_data": updated_cell.to_dict(),
            "recalculated_cells": recalculated_cells,
            "user_id": user_id
        }
        await websocket_manager.broadcast_to_spreadsheet(spreadsheet_id, update_data)
        
        return {
            "cell": updated_cell.to_dict(),
            "recalculated_cells": recalculated_cells
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/spreadsheets/{spreadsheet_id}/range/{range_ref}")
async def get_range(spreadsheet_id: str, range_ref: str):
    """Get cell data for a range."""
    try:
        spreadsheet = await engine.get_spreadsheet(spreadsheet_id)
        if not spreadsheet:
            raise HTTPException(status_code=404, detail="Spreadsheet not found")
        
        cells = spreadsheet.get_range(range_ref)
        return {cell_ref: cell.to_dict() for cell_ref, cell in cells.items()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/spreadsheets/{spreadsheet_id}/range/{range_ref}")
async def update_range(
    spreadsheet_id: str, 
    range_ref: str, 
    values: List[List[str]],
    user_id: Optional[str] = None
):
    """Update a range of cells."""
    try:
        spreadsheet = await engine.get_spreadsheet(spreadsheet_id)
        if not spreadsheet:
            raise HTTPException(status_code=404, detail="Spreadsheet not found")
        
        # Update range
        updated_cells = spreadsheet.set_range(range_ref, values, user_id)
        
        # Recalculate affected cells
        recalculated_cells = []
        for cell_ref in updated_cells.keys():
            deps = await engine.recalculate_dependents(spreadsheet_id, cell_ref)
            recalculated_cells.extend(deps)
        
        # Save to database
        await db_manager.save_spreadsheet(spreadsheet.to_dict())
        
        # Broadcast update
        update_data = {
            "type": "range_update", 
            "spreadsheet_id": spreadsheet_id,
            "range_ref": range_ref,
            "updated_cells": {ref: cell.to_dict() for ref, cell in updated_cells.items()},
            "recalculated_cells": recalculated_cells,
            "user_id": user_id
        }
        await websocket_manager.broadcast_to_spreadsheet(spreadsheet_id, update_data)
        
        return {
            "updated_cells": {ref: cell.to_dict() for ref, cell in updated_cells.items()},
            "recalculated_cells": recalculated_cells
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/spreadsheets/{spreadsheet_id}/cells/{cell_ref}")
async def delete_cell(spreadsheet_id: str, cell_ref: str, user_id: Optional[str] = None):
    """Delete a cell."""
    try:
        spreadsheet = await engine.get_spreadsheet(spreadsheet_id)
        if not spreadsheet:
            raise HTTPException(status_code=404, detail="Spreadsheet not found")
        
        # Delete cell
        deleted = spreadsheet.delete_cell(cell_ref)
        if not deleted:
            raise HTTPException(status_code=404, detail="Cell not found")
        
        # Recalculate dependents
        recalculated_cells = await engine.recalculate_dependents(spreadsheet_id, cell_ref)
        
        # Save to database
        await db_manager.save_spreadsheet(spreadsheet.to_dict())
        
        # Broadcast update
        update_data = {
            "type": "cell_delete",
            "spreadsheet_id": spreadsheet_id,
            "cell_ref": cell_ref,
            "recalculated_cells": recalculated_cells,
            "user_id": user_id
        }
        await websocket_manager.broadcast_to_spreadsheet(spreadsheet_id, update_data)
        
        return {"deleted": cell_ref, "recalculated_cells": recalculated_cells}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/spreadsheets/{spreadsheet_id}/stats")
async def get_spreadsheet_stats(spreadsheet_id: str):
    """Get spreadsheet statistics."""
    try:
        stats = await engine.get_spreadsheet_stats(spreadsheet_id)
        if not stats:
            raise HTTPException(status_code=404, detail="Spreadsheet not found")
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.websocket("/ws/{spreadsheet_id}")
async def websocket_endpoint(websocket: WebSocket, spreadsheet_id: str):
    """WebSocket endpoint for real-time collaboration."""
    user_id = None
    try:
        await websocket.accept()
        
        # Get user info from query params or headers
        user_id = websocket.query_params.get("user_id", f"user_{asyncio.current_task().get_name()}")
        
        # Add connection to manager
        await websocket_manager.connect(websocket, spreadsheet_id, user_id)
        
        # Send current spreadsheet state
        spreadsheet = await engine.get_spreadsheet(spreadsheet_id)
        if spreadsheet:
            await websocket.send_json({
                "type": "spreadsheet_state",
                "data": spreadsheet.to_dict()
            })
        
        # Listen for messages
        while True:
            data = await websocket.receive_json()
            await handle_websocket_message(websocket, spreadsheet_id, user_id, data)
            
    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        if user_id:
            websocket_manager.disconnect(websocket, spreadsheet_id, user_id)


async def handle_websocket_message(websocket: WebSocket, spreadsheet_id: str, user_id: str, data: dict):
    """Handle incoming WebSocket messages."""
    try:
        msg_type = data.get("type")
        
        if msg_type == "cursor_update":
            # Update user cursor position
            cursor_data = {
                "type": "cursor_update",
                "user_id": user_id,
                "position": data.get("position"),
                "selection": data.get("selection")
            }
            await websocket_manager.broadcast_to_spreadsheet(
                spreadsheet_id, cursor_data, exclude_user=user_id
            )
            
        elif msg_type == "cell_edit_start":
            # Broadcast that user started editing a cell
            edit_data = {
                "type": "cell_edit_start",
                "user_id": user_id,
                "cell_ref": data.get("cell_ref")
            }
            await websocket_manager.broadcast_to_spreadsheet(
                spreadsheet_id, edit_data, exclude_user=user_id
            )
            
        elif msg_type == "cell_edit_end":
            # Broadcast that user finished editing a cell
            edit_data = {
                "type": "cell_edit_end",
                "user_id": user_id,
                "cell_ref": data.get("cell_ref")
            }
            await websocket_manager.broadcast_to_spreadsheet(
                spreadsheet_id, edit_data, exclude_user=user_id
            )
            
        elif msg_type == "cell_update":
            # Handle cell update through WebSocket
            cell_ref = data.get("cell_ref")
            value = data.get("value")
            formula = data.get("formula")
            
            if cell_ref:
                updated_cell, recalculated_cells = await engine.set_cell_value(
                    spreadsheet_id, cell_ref, value, formula, user_id
                )
                
                # Save to database
                spreadsheet = await engine.get_spreadsheet(spreadsheet_id)
                await db_manager.save_spreadsheet(spreadsheet.to_dict())
                
                # Broadcast update
                update_data = {
                    "type": "cell_update",
                    "cell_ref": cell_ref,
                    "cell_data": updated_cell.to_dict(),
                    "recalculated_cells": recalculated_cells,
                    "user_id": user_id
                }
                await websocket_manager.broadcast_to_spreadsheet(spreadsheet_id, update_data)
                
    except Exception as e:
        await websocket.send_json({
            "type": "error",
            "message": str(e)
        })


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        workers=1 if settings.debug else settings.workers
    )