"""SocialCalc engine wrapper with Python implementation."""

from typing import Any, Dict, List, Optional, Set, Tuple
import asyncio
from datetime import datetime

from .spreadsheet import Spreadsheet, Cell, CellType
from .formula_engine import FormulaEngine
from ..utils.exceptions import CircularReferenceError, FormulaError


class SpreadsheetEngine:
    """Main spreadsheet calculation engine."""
    
    def __init__(self):
        """Initialize the spreadsheet engine."""
        self.formula_engine = FormulaEngine()
        self.spreadsheets: Dict[str, Spreadsheet] = {}
        self._calculation_queue = asyncio.Queue()
        self._calculating_cells: Set[str] = set()
    
    async def create_spreadsheet(self, spreadsheet_id: Optional[str] = None) -> Spreadsheet:
        """Create a new spreadsheet."""
        spreadsheet = Spreadsheet(spreadsheet_id)
        self.spreadsheets[spreadsheet.id] = spreadsheet
        return spreadsheet
    
    async def get_spreadsheet(self, spreadsheet_id: str) -> Optional[Spreadsheet]:
        """Get spreadsheet by ID."""
        return self.spreadsheets.get(spreadsheet_id)
    
    async def load_spreadsheet(self, spreadsheet_data: Dict[str, Any]) -> Spreadsheet:
        """Load spreadsheet from data."""
        spreadsheet = Spreadsheet.from_dict(spreadsheet_data)
        self.spreadsheets[spreadsheet.id] = spreadsheet
        
        # Recalculate all formulas
        await self.recalculate_all(spreadsheet.id)
        
        return spreadsheet
    
    async def set_cell_value(self, spreadsheet_id: str, cell_ref: str, 
                           value: Any = None, formula: Optional[str] = None,
                           user_id: Optional[str] = None) -> Tuple[Cell, List[str]]:
        """
        Set cell value or formula and recalculate dependents.
        
        Returns:
            Tuple of (updated_cell, list_of_recalculated_cells)
        """
        spreadsheet = await self.get_spreadsheet(spreadsheet_id)
        if not spreadsheet:
            raise ValueError(f"Spreadsheet {spreadsheet_id} not found")
        
        # Update the cell
        old_cell = spreadsheet.get_cell(cell_ref)
        updated_cell = spreadsheet.set_cell(cell_ref, value, formula, user_id)
        
        # If formula changed, update dependencies
        if old_cell.formula != updated_cell.formula:
            await self._update_dependencies(spreadsheet, cell_ref, updated_cell.formula)
        
        # Recalculate this cell if it has a formula
        if updated_cell.formula:
            calculated_value = await self.evaluate_cell(spreadsheet_id, cell_ref, updated_cell.formula)
            updated_cell.value = calculated_value
            spreadsheet.cells[cell_ref] = updated_cell
        
        # Recalculate dependent cells
        recalculated_cells = await self.recalculate_dependents(spreadsheet_id, cell_ref)
        
        return updated_cell, recalculated_cells
    
    async def evaluate_cell(self, spreadsheet_id: str, cell_ref: str, formula: str) -> Any:
        """Evaluate a single cell formula."""
        spreadsheet = await self.get_spreadsheet(spreadsheet_id)
        if not spreadsheet:
            raise ValueError(f"Spreadsheet {spreadsheet_id} not found")
        
        # Check for circular references
        if cell_ref in self._calculating_cells:
            raise CircularReferenceError(f"Circular reference detected in cell {cell_ref}")
        
        self._calculating_cells.add(cell_ref)
        
        try:
            # Create cell getter function
            def cell_getter(ref: str) -> Any:
                cell = spreadsheet.get_cell(ref)
                if cell.formula:
                    # If cell has formula, return its calculated value
                    return cell.value if cell.value is not None else 0
                else:
                    # Return raw value
                    return cell.value if cell.value is not None else 0
            
            # Evaluate the formula
            result = self.formula_engine.evaluate_formula(formula, cell_getter, cell_ref)
            return result
            
        finally:
            self._calculating_cells.discard(cell_ref)
    
    async def recalculate_dependents(self, spreadsheet_id: str, cell_ref: str) -> List[str]:
        """Recalculate all cells that depend on the given cell."""
        spreadsheet = await self.get_spreadsheet(spreadsheet_id)
        if not spreadsheet:
            return []
        
        recalculated = []
        dependencies = spreadsheet.get_cell_dependencies(cell_ref)
        
        # Use topological sort to handle nested dependencies
        ordered_deps = await self._topological_sort_dependencies(spreadsheet, dependencies)
        
        for dep_ref in ordered_deps:
            dep_cell = spreadsheet.get_cell(dep_ref)
            if dep_cell.formula:
                try:
                    new_value = await self.evaluate_cell(spreadsheet_id, dep_ref, dep_cell.formula)
                    dep_cell.value = new_value
                    dep_cell.last_modified = datetime.now()
                    spreadsheet.cells[dep_ref] = dep_cell
                    recalculated.append(dep_ref)
                except Exception as e:
                    # Set error value
                    dep_cell.value = f"#ERROR: {str(e)}"
                    spreadsheet.cells[dep_ref] = dep_cell
                    recalculated.append(dep_ref)
        
        return recalculated
    
    async def recalculate_all(self, spreadsheet_id: str) -> List[str]:
        """Recalculate all formula cells in the spreadsheet."""
        spreadsheet = await self.get_spreadsheet(spreadsheet_id)
        if not spreadsheet:
            return []
        
        recalculated = []
        formula_cells = [
            (ref, cell) for ref, cell in spreadsheet.cells.items() 
            if cell.formula
        ]
        
        # Sort by dependencies to avoid recalculating in wrong order
        ordered_cells = await self._topological_sort_cells(spreadsheet, formula_cells)
        
        for cell_ref, cell in ordered_cells:
            try:
                new_value = await self.evaluate_cell(spreadsheet_id, cell_ref, cell.formula)
                cell.value = new_value
                cell.last_modified = datetime.now()
                spreadsheet.cells[cell_ref] = cell
                recalculated.append(cell_ref)
            except Exception as e:
                cell.value = f"#ERROR: {str(e)}"
                spreadsheet.cells[cell_ref] = cell
                recalculated.append(cell_ref)
        
        return recalculated
    
    async def validate_formula(self, formula: str) -> Dict[str, Any]:
        """Validate a formula without evaluating it."""
        try:
            # Basic syntax validation
            if not formula.strip():
                return {"valid": False, "error": "Empty formula"}
            
            # Remove leading = if present
            if formula.startswith('='):
                formula = formula[1:]
            
            # Check for balanced parentheses
            paren_count = 0
            for char in formula:
                if char == '(':
                    paren_count += 1
                elif char == ')':
                    paren_count -= 1
                    if paren_count < 0:
                        return {"valid": False, "error": "Mismatched parentheses"}
            
            if paren_count != 0:
                return {"valid": False, "error": "Mismatched parentheses"}
            
            # Check for valid function names
            import re
            func_pattern = r'([A-Z_][A-Z0-9_]*)\s*\('
            functions = re.findall(func_pattern, formula.upper())
            
            for func_name in functions:
                if func_name not in self.formula_engine.functions:
                    return {"valid": False, "error": f"Unknown function: {func_name}"}
            
            return {"valid": True, "functions_used": functions}
            
        except Exception as e:
            return {"valid": False, "error": str(e)}
    
    async def get_cell_dependencies(self, spreadsheet_id: str, cell_ref: str) -> Set[str]:
        """Get all cells that the given cell depends on."""
        spreadsheet = await self.get_spreadsheet(spreadsheet_id)
        if not spreadsheet:
            return set()
        
        cell = spreadsheet.get_cell(cell_ref)
        if not cell.formula:
            return set()
        
        # Extract cell references from formula
        import re
        cell_refs = re.findall(r'[A-Z]+\d+', cell.formula.upper())
        return set(cell_refs)
    
    async def get_cell_dependents(self, spreadsheet_id: str, cell_ref: str) -> Set[str]:
        """Get all cells that depend on the given cell."""
        spreadsheet = await self.get_spreadsheet(spreadsheet_id)
        if not spreadsheet:
            return set()
        
        return spreadsheet.get_cell_dependencies(cell_ref)
    
    async def _update_dependencies(self, spreadsheet: Spreadsheet, cell_ref: str, formula: Optional[str]) -> None:
        """Update dependency graph when cell formula changes."""
        # Remove old dependencies
        old_precedents = spreadsheet.get_cell_precedents(cell_ref)
        for precedent in old_precedents:
            spreadsheet.remove_dependency(precedent, cell_ref)
        
        # Add new dependencies
        if formula:
            import re
            new_precedents = re.findall(r'[A-Z]+\d+', formula.upper())
            for precedent in new_precedents:
                spreadsheet.add_dependency(precedent, cell_ref)
    
    async def _topological_sort_dependencies(self, spreadsheet: Spreadsheet, dependencies: Set[str]) -> List[str]:
        """Sort dependencies in topological order to avoid calculation conflicts."""
        # Simple topological sort implementation
        visited = set()
        temp_visited = set()
        result = []
        
        def visit(cell_ref: str):
            if cell_ref in temp_visited:
                # Circular dependency detected, skip
                return
            if cell_ref in visited:
                return
            
            temp_visited.add(cell_ref)
            
            # Visit dependencies first
            cell_deps = spreadsheet.get_cell_dependencies(cell_ref)
            for dep in cell_deps:
                if dep in dependencies:  # Only consider cells in our dependency set
                    visit(dep)
            
            temp_visited.remove(cell_ref)
            visited.add(cell_ref)
            result.append(cell_ref)
        
        for dep in dependencies:
            if dep not in visited:
                visit(dep)
        
        return result
    
    async def _topological_sort_cells(self, spreadsheet: Spreadsheet, cells: List[Tuple[str, Cell]]) -> List[Tuple[str, Cell]]:
        """Sort cells in topological order based on dependencies."""
        cell_dict = {ref: cell for ref, cell in cells}
        cell_refs = set(cell_dict.keys())
        
        visited = set()
        temp_visited = set()
        result = []
        
        def visit(cell_ref: str):
            if cell_ref in temp_visited:
                return  # Circular dependency, skip
            if cell_ref in visited:
                return
            
            temp_visited.add(cell_ref)
            
            # Visit precedents first
            precedents = spreadsheet.get_cell_precedents(cell_ref)
            for prec in precedents:
                if prec in cell_refs:
                    visit(prec)
            
            temp_visited.remove(cell_ref)
            visited.add(cell_ref)
            result.append((cell_ref, cell_dict[cell_ref]))
        
        for cell_ref in cell_refs:
            if cell_ref not in visited:
                visit(cell_ref)
        
        return result
    
    async def copy_range(self, spreadsheet_id: str, source_range: str, 
                        dest_range: str, user_id: Optional[str] = None) -> List[str]:
        """Copy a range of cells to another location."""
        spreadsheet = await self.get_spreadsheet(spreadsheet_id)
        if not spreadsheet:
            raise ValueError(f"Spreadsheet {spreadsheet_id} not found")
        
        # Get source cells
        source_cells = spreadsheet.get_range(source_range)
        
        # Parse destination range
        if ':' in dest_range:
            dest_start = dest_range.split(':')[0]
        else:
            dest_start = dest_range
        
        dest_col, dest_row = spreadsheet._parse_cell_ref(dest_start)
        
        # Copy cells with relative formula adjustment
        copied_cells = []
        for source_ref, source_cell in source_cells.items():
            source_col, source_row = spreadsheet._parse_cell_ref(source_ref)
            
            # Calculate destination cell reference
            new_col = dest_col + (source_col - spreadsheet._parse_cell_ref(list(source_cells.keys())[0])[0])
            new_row = dest_row + (source_row - spreadsheet._parse_cell_ref(list(source_cells.keys())[0])[1])
            dest_ref = spreadsheet._create_cell_ref(new_col, new_row)
            
            # Copy cell with adjusted formula
            new_cell = Cell(
                value=source_cell.value,
                formula=self._adjust_formula_references(source_cell.formula, source_col, source_row, new_col, new_row) if source_cell.formula else None,
                cell_type=source_cell.cell_type,
                format=source_cell.format,
                last_modified_by=user_id
            )
            
            spreadsheet.cells[dest_ref] = new_cell
            copied_cells.append(dest_ref)
        
        # Recalculate copied cells with formulas
        for cell_ref in copied_cells:
            cell = spreadsheet.get_cell(cell_ref)
            if cell.formula:
                await self.recalculate_dependents(spreadsheet_id, cell_ref)
        
        return copied_cells
    
    def _adjust_formula_references(self, formula: str, old_col: int, old_row: int, 
                                 new_col: int, new_row: int) -> str:
        """Adjust cell references in formula when copying."""
        if not formula:
            return formula
        
        import re
        
        col_offset = new_col - old_col
        row_offset = new_row - old_row
        
        def adjust_ref(match):
            ref = match.group(0)
            col_str = ""
            row_str = ""
            
            for char in ref:
                if char.isalpha():
                    col_str += char
                else:
                    row_str += char
            
            # Convert to indices
            col = 0
            for char in col_str:
                col = col * 26 + (ord(char) - ord('A') + 1)
            col -= 1
            
            row = int(row_str) - 1
            
            # Apply offset
            new_col_idx = col + col_offset
            new_row_idx = row + row_offset
            
            # Convert back to reference
            new_col_str = ""
            temp_col = new_col_idx + 1
            while temp_col > 0:
                temp_col -= 1
                new_col_str = chr(ord('A') + temp_col % 26) + new_col_str
                temp_col //= 26
            
            return f"{new_col_str}{new_row_idx + 1}"
        
        # Replace all cell references
        adjusted_formula = re.sub(r'[A-Z]+\d+', adjust_ref, formula)
        return adjusted_formula
    
    async def delete_range(self, spreadsheet_id: str, range_ref: str) -> List[str]:
        """Delete cells in range."""
        spreadsheet = await self.get_spreadsheet(spreadsheet_id)
        if not spreadsheet:
            raise ValueError(f"Spreadsheet {spreadsheet_id} not found")
        
        deleted_cells = spreadsheet.clear_range(range_ref)
        
        # Recalculate cells that depended on deleted cells
        recalculated = []
        for cell_ref in deleted_cells:
            deps = await self.recalculate_dependents(spreadsheet_id, cell_ref)
            recalculated.extend(deps)
        
        return deleted_cells + recalculated
    
    async def get_spreadsheet_stats(self, spreadsheet_id: str) -> Dict[str, Any]:
        """Get spreadsheet statistics."""
        spreadsheet = await self.get_spreadsheet(spreadsheet_id)
        if not spreadsheet:
            return {}
        
        return spreadsheet.get_stats()