"""Additional API routes for EtherCalc."""

import io
import json
from typing import List, Optional
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Response
from fastapi.responses import StreamingResponse

from ..core.engine import SpreadsheetEngine
from ..database import DatabaseManager
from ..utils.file_handlers import (
    import_csv, import_xlsx, export_csv, export_xlsx,
    ImportOptions, ExportOptions
)

router = APIRouter(prefix="/api", tags=["spreadsheets"])


# These will be injected by main.py
engine: Optional[SpreadsheetEngine] = None
db_manager: Optional[DatabaseManager] = None


def set_dependencies(eng: SpreadsheetEngine, db_mgr: DatabaseManager):
    """Set the engine and database manager dependencies."""
    global engine, db_manager
    engine = eng
    db_manager = db_mgr


@router.get("/spreadsheets")
async def list_spreadsheets():
    """List all spreadsheets."""
    try:
        spreadsheet_ids = await db_manager.get_all_spreadsheet_ids()
        spreadsheets = []
        
        for spreadsheet_id in spreadsheet_ids:
            stats = await db_manager.get_spreadsheet_stats(spreadsheet_id)
            if stats:
                spreadsheets.append(stats)
        
        return {
            "spreadsheets": spreadsheets,
            "count": len(spreadsheets)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/spreadsheets/{spreadsheet_id}/import/csv")
async def import_csv_file(
    spreadsheet_id: str,
    file: UploadFile = File(...),
    delimiter: str = Form(","),
    encoding: str = Form("utf-8"),
    has_header: bool = Form(True),
    start_cell: str = Form("A1"),
    user_id: Optional[str] = Form(None)
):
    """Import CSV file into spreadsheet."""
    try:
        spreadsheet = await engine.get_spreadsheet(spreadsheet_id)
        if not spreadsheet:
            raise HTTPException(status_code=404, detail="Spreadsheet not found")
        
        # Read file content
        content = await file.read()
        csv_text = content.decode(encoding)
        
        # Import options
        options = ImportOptions(
            delimiter=delimiter,
            encoding=encoding,
            has_header=has_header,
            start_cell=start_cell
        )
        
        # Import CSV
        imported_cells = await import_csv(csv_text, spreadsheet, options, user_id)
        
        # Recalculate affected cells
        recalculated_cells = []
        for cell_ref in imported_cells.keys():
            deps = await engine.recalculate_dependents(spreadsheet_id, cell_ref)
            recalculated_cells.extend(deps)
        
        # Save to database
        await db_manager.save_spreadsheet(spreadsheet.to_dict())
        
        # Save audit log
        await db_manager.save_audit_log(spreadsheet_id, {
            "action": "import_csv",
            "filename": file.filename,
            "cells_imported": len(imported_cells),
            "user_id": user_id
        })
        
        return {
            "imported_cells": len(imported_cells),
            "recalculated_cells": len(recalculated_cells),
            "filename": file.filename
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/spreadsheets/{spreadsheet_id}/import/xlsx")
async def import_xlsx_file(
    spreadsheet_id: str,
    file: UploadFile = File(...),
    sheet_name: Optional[str] = Form(None),
    start_cell: str = Form("A1"),
    user_id: Optional[str] = Form(None)
):
    """Import XLSX file into spreadsheet."""
    try:
        spreadsheet = await engine.get_spreadsheet(spreadsheet_id)
        if not spreadsheet:
            raise HTTPException(status_code=404, detail="Spreadsheet not found")
        
        # Read file content
        content = await file.read()
        
        # Import options
        options = ImportOptions(
            sheet_name=sheet_name,
            start_cell=start_cell
        )
        
        # Import XLSX
        imported_cells = await import_xlsx(io.BytesIO(content), spreadsheet, options, user_id)
        
        # Recalculate affected cells
        recalculated_cells = []
        for cell_ref in imported_cells.keys():
            deps = await engine.recalculate_dependents(spreadsheet_id, cell_ref)
            recalculated_cells.extend(deps)
        
        # Save to database
        await db_manager.save_spreadsheet(spreadsheet.to_dict())
        
        # Save audit log
        await db_manager.save_audit_log(spreadsheet_id, {
            "action": "import_xlsx",
            "filename": file.filename,
            "sheet_name": sheet_name,
            "cells_imported": len(imported_cells),
            "user_id": user_id
        })
        
        return {
            "imported_cells": len(imported_cells),
            "recalculated_cells": len(recalculated_cells),
            "filename": file.filename,
            "sheet_name": sheet_name
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/spreadsheets/{spreadsheet_id}/export/csv")
async def export_csv_file(
    spreadsheet_id: str,
    range_ref: Optional[str] = None,
    delimiter: str = ",",
    include_header: bool = True
):
    """Export spreadsheet to CSV format."""
    try:
        spreadsheet = await engine.get_spreadsheet(spreadsheet_id)
        if not spreadsheet:
            raise HTTPException(status_code=404, detail="Spreadsheet not found")
        
        # Export options
        options = ExportOptions(
            range_ref=range_ref,
            delimiter=delimiter,
            include_header=include_header
        )
        
        # Export to CSV
        csv_content = await export_csv(spreadsheet, options)
        
        # Create response
        filename = f"{spreadsheet.metadata.title.replace(' ', '_')}.csv"
        response = StreamingResponse(
            io.StringIO(csv_content),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
        # Save audit log
        await db_manager.save_audit_log(spreadsheet_id, {
            "action": "export_csv",
            "range": range_ref,
            "filename": filename
        })
        
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/spreadsheets/{spreadsheet_id}/export/xlsx")
async def export_xlsx_file(
    spreadsheet_id: str,
    range_ref: Optional[str] = None,
    include_formatting: bool = True
):
    """Export spreadsheet to XLSX format."""
    try:
        spreadsheet = await engine.get_spreadsheet(spreadsheet_id)
        if not spreadsheet:
            raise HTTPException(status_code=404, detail="Spreadsheet not found")
        
        # Export options
        options = ExportOptions(
            range_ref=range_ref,
            include_formatting=include_formatting
        )
        
        # Export to XLSX
        xlsx_bytes = await export_xlsx(spreadsheet, options)
        
        # Create response
        filename = f"{spreadsheet.metadata.title.replace(' ', '_')}.xlsx"
        response = Response(
            content=xlsx_bytes.getvalue(),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
        # Save audit log
        await db_manager.save_audit_log(spreadsheet_id, {
            "action": "export_xlsx", 
            "range": range_ref,
            "filename": filename
        })
        
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/spreadsheets/{spreadsheet_id}/audit")
async def get_audit_log(spreadsheet_id: str, limit: int = 100):
    """Get audit log for spreadsheet."""
    try:
        audit_log = await db_manager.get_audit_log(spreadsheet_id, limit)
        return {
            "spreadsheet_id": spreadsheet_id,
            "entries": audit_log,
            "count": len(audit_log)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/spreadsheets/{spreadsheet_id}/copy")
async def copy_spreadsheet(
    spreadsheet_id: str,
    title: Optional[str] = None,
    user_id: Optional[str] = None
):
    """Create a copy of a spreadsheet."""
    try:
        original = await engine.get_spreadsheet(spreadsheet_id)
        if not original:
            raise HTTPException(status_code=404, detail="Spreadsheet not found")
        
        # Create new spreadsheet
        copy_data = original.to_dict()
        copy = await engine.create_spreadsheet()
        
        # Update metadata
        copy.metadata.title = title or f"{original.metadata.title} (Copy)"
        copy.metadata.created_by = user_id
        copy.metadata.owner = user_id
        
        # Copy cells
        for cell_ref, cell_data in copy_data["cells"].items():
            copy.cells[cell_ref] = copy.cells.get(cell_ref, copy.get_cell(cell_ref))
            copy.cells[cell_ref].value = cell_data.get("value")
            copy.cells[cell_ref].formula = cell_data.get("formula")
            copy.cells[cell_ref].cell_type = cell_data.get("type", "empty")
            if cell_data.get("format"):
                copy.cells[cell_ref].format = cell_data["format"]
        
        # Recalculate all formulas
        await engine.recalculate_all(copy.id)
        
        # Save to database
        await db_manager.save_spreadsheet(copy.to_dict())
        
        # Save audit log
        await db_manager.save_audit_log(copy.id, {
            "action": "created_copy",
            "original_id": spreadsheet_id,
            "user_id": user_id
        })
        
        return {
            "id": copy.id,
            "title": copy.metadata.title,
            "original_id": spreadsheet_id,
            "url": f"/sheet/{copy.id}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/spreadsheets/{spreadsheet_id}")
async def delete_spreadsheet(spreadsheet_id: str, user_id: Optional[str] = None):
    """Delete a spreadsheet."""
    try:
        spreadsheet = await engine.get_spreadsheet(spreadsheet_id)
        if not spreadsheet:
            raise HTTPException(status_code=404, detail="Spreadsheet not found")
        
        # Remove from engine
        if spreadsheet_id in engine.spreadsheets:
            del engine.spreadsheets[spreadsheet_id]
        
        # Delete from database
        deleted = await db_manager.delete_spreadsheet(spreadsheet_id)
        if not deleted:
            raise HTTPException(status_code=500, detail="Failed to delete from database")
        
        return {"deleted": spreadsheet_id, "title": spreadsheet.metadata.title}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/spreadsheets/{spreadsheet_id}/validate-formula")
async def validate_formula_endpoint(spreadsheet_id: str, formula: str):
    """Validate a formula without applying it."""
    try:
        result = await engine.validate_formula(formula)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/spreadsheets/{spreadsheet_id}/dependencies/{cell_ref}")
async def get_cell_dependencies_endpoint(spreadsheet_id: str, cell_ref: str):
    """Get cell dependencies."""
    try:
        dependencies = await engine.get_cell_dependencies(spreadsheet_id, cell_ref)
        dependents = await engine.get_cell_dependents(spreadsheet_id, cell_ref)
        
        return {
            "cell_ref": cell_ref,
            "dependencies": list(dependencies),
            "dependents": list(dependents)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/admin/backup")
async def create_backup():
    """Create a backup of all data."""
    try:
        success = await db_manager.backup_all_data()
        if success:
            return {"status": "success", "message": "Backup created successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to create backup")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/admin/health")
async def admin_health_check():
    """Detailed health check for admin."""
    try:
        db_health = await db_manager.health_check()
        spreadsheet_count = len(engine.spreadsheets)
        
        return {
            "database": db_health,
            "engine": {
                "active_spreadsheets": spreadsheet_count,
                "status": "healthy"
            },
            "timestamp": "2024-01-01T00:00:00"  # Will be current timestamp
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))