"""Cell value parsing and type detection utilities."""

import re
from datetime import datetime, date
from decimal import Decimal, InvalidOperation
from typing import Any, Tuple, Union, Optional

from .spreadsheet import CellType


class CellParser:
    """Handles parsing and type detection for cell values."""
    
    def __init__(self):
        """Initialize cell parser with patterns."""
        self.date_patterns = [
            r'^\d{4}-\d{2}-\d{2}$',  # YYYY-MM-DD
            r'^\d{2}/\d{2}/\d{4}$',  # MM/DD/YYYY
            r'^\d{2}-\d{2}-\d{4}$',  # MM-DD-YYYY
            r'^\d{1,2}/\d{1,2}/\d{2,4}$',  # M/D/YY or MM/DD/YYYY
        ]
        
        self.time_patterns = [
            r'^\d{1,2}:\d{2}$',      # H:MM
            r'^\d{1,2}:\d{2}:\d{2}$', # H:MM:SS
            r'^\d{1,2}:\d{2}\s*(AM|PM)$',  # H:MM AM/PM
        ]
        
        self.number_patterns = [
            r'^-?\d+$',                    # Integer
            r'^-?\d+\.\d+$',              # Decimal
            r'^-?\d{1,3}(,\d{3})*$',      # Integer with commas
            r'^-?\d{1,3}(,\d{3})*\.\d+$', # Decimal with commas
            r'^-?\d+\.?\d*[eE][+-]?\d+$', # Scientific notation
            r'^\$-?\d+\.?\d*$',           # Currency (simple)
            r'^-?\d+\.?\d*%$',            # Percentage
        ]
    
    def parse_cell_value(self, value: Any) -> Tuple[Any, CellType]:
        """
        Parse cell value and determine its type.
        
        Args:
            value: Raw cell value (usually string from input)
            
        Returns:
            Tuple of (parsed_value, cell_type)
        """
        if value is None:
            return None, CellType.EMPTY
        
        # Convert to string for parsing
        str_value = str(value).strip()
        
        if not str_value:
            return "", CellType.EMPTY
        
        # Check for formula (starts with =)
        if str_value.startswith('='):
            return str_value, CellType.FORMULA
        
        # Check for boolean values
        bool_result = self._parse_boolean(str_value)
        if bool_result is not None:
            return bool_result, CellType.BOOLEAN
        
        # Check for numbers
        number_result = self._parse_number(str_value)
        if number_result is not None:
            return number_result, CellType.NUMBER
        
        # Check for dates
        date_result = self._parse_date(str_value)
        if date_result is not None:
            return date_result, CellType.DATE
        
        # Default to text
        return str_value, CellType.TEXT
    
    def _parse_boolean(self, value: str) -> Optional[bool]:
        """Parse boolean values."""
        lower_value = value.lower()
        
        if lower_value in ['true', 'yes', '1', 'on', 'y']:
            return True
        elif lower_value in ['false', 'no', '0', 'off', 'n']:
            return False
        
        return None
    
    def _parse_number(self, value: str) -> Optional[Union[int, float, Decimal]]:
        """Parse numeric values."""
        # Remove common formatting
        clean_value = value.replace(',', '').replace('$', '').replace(' ', '')
        
        # Handle percentage
        is_percentage = clean_value.endswith('%')
        if is_percentage:
            clean_value = clean_value[:-1]
        
        # Try to parse as number
        try:
            # Check if it's an integer
            if '.' not in clean_value and 'e' not in clean_value.lower():
                result = int(clean_value)
            else:
                result = float(clean_value)
            
            # Apply percentage conversion
            if is_percentage:
                result = result / 100
            
            return result
            
        except (ValueError, InvalidOperation):
            return None
    
    def _parse_date(self, value: str) -> Optional[date]:
        """Parse date values."""
        # Try different date formats
        date_formats = [
            '%Y-%m-%d',      # YYYY-MM-DD
            '%m/%d/%Y',      # MM/DD/YYYY
            '%m-%d-%Y',      # MM-DD-YYYY
            '%m/%d/%y',      # MM/DD/YY
            '%d/%m/%Y',      # DD/MM/YYYY (European)
            '%d-%m-%Y',      # DD-MM-YYYY
            '%Y/%m/%d',      # YYYY/MM/DD
            '%B %d, %Y',     # Month DD, YYYY
            '%b %d, %Y',     # Mon DD, YYYY
            '%d %B %Y',      # DD Month YYYY
            '%d %b %Y',      # DD Mon YYYY
        ]
        
        for fmt in date_formats:
            try:
                parsed_date = datetime.strptime(value, fmt).date()
                return parsed_date
            except ValueError:
                continue
        
        return None
    
    def format_cell_value(self, value: Any, cell_type: CellType, 
                         format_options: Optional[dict] = None) -> str:
        """
        Format cell value for display.
        
        Args:
            value: Cell value
            cell_type: Cell type
            format_options: Formatting options
            
        Returns:
            Formatted string representation
        """
        if value is None or value == "":
            return ""
        
        format_options = format_options or {}
        
        if cell_type == CellType.NUMBER:
            return self._format_number(value, format_options)
        elif cell_type == CellType.DATE:
            return self._format_date(value, format_options)
        elif cell_type == CellType.BOOLEAN:
            return "TRUE" if value else "FALSE"
        elif cell_type == CellType.FORMULA:
            # For formulas, we typically display the calculated value
            return str(value)
        else:
            return str(value)
    
    def _format_number(self, value: Union[int, float], format_options: dict) -> str:
        """Format numeric values."""
        number_format = format_options.get('number_format', 'general')
        
        if number_format == 'general':
            # Default formatting
            if isinstance(value, int):
                return str(value)
            else:
                # Remove trailing zeros for floats
                return f"{value:g}"
        
        elif number_format == 'currency':
            return f"${value:,.2f}"
        
        elif number_format == 'percentage':
            return f"{value * 100:.1f}%"
        
        elif number_format.startswith('decimal_'):
            # Extract decimal places
            try:
                decimal_places = int(number_format.split('_')[1])
                return f"{value:.{decimal_places}f}"
            except (IndexError, ValueError):
                return str(value)
        
        elif number_format == 'scientific':
            return f"{value:.2e}"
        
        elif number_format == 'accounting':
            if value < 0:
                return f"(${abs(value):,.2f})"
            else:
                return f"${value:,.2f}"
        
        else:
            return str(value)
    
    def _format_date(self, value: Union[date, datetime], format_options: dict) -> str:
        """Format date values."""
        date_format = format_options.get('date_format', '%Y-%m-%d')
        
        if isinstance(value, datetime):
            return value.strftime(date_format)
        elif isinstance(value, date):
            return value.strftime(date_format)
        else:
            return str(value)
    
    def validate_cell_input(self, value: str, expected_type: Optional[CellType] = None) -> dict:
        """
        Validate cell input and provide feedback.
        
        Args:
            value: Input value
            expected_type: Expected cell type (optional)
            
        Returns:
            Dictionary with validation results
        """
        if not value or not value.strip():
            return {
                'valid': True,
                'parsed_value': "",
                'detected_type': CellType.EMPTY,
                'warnings': []
            }
        
        parsed_value, detected_type = self.parse_cell_value(value)
        warnings = []
        
        # Check type compatibility
        if expected_type and expected_type != detected_type:
            if expected_type == CellType.NUMBER and detected_type == CellType.TEXT:
                # Try to extract numbers from text
                number_match = re.search(r'-?\d+\.?\d*', value)
                if number_match:
                    warnings.append(f"Extracted number from text: {number_match.group()}")
                else:
                    warnings.append(f"Expected number but got text: '{value}'")
            
            elif expected_type == CellType.DATE and detected_type == CellType.TEXT:
                warnings.append(f"Could not parse date from: '{value}'")
        
        # Additional validations
        if detected_type == CellType.FORMULA:
            # Basic formula validation
            if not self._validate_formula_syntax(value):
                warnings.append("Formula syntax may be invalid")
        
        elif detected_type == CellType.NUMBER:
            # Check for potential precision issues
            if isinstance(parsed_value, float) and len(str(parsed_value)) > 15:
                warnings.append("Number may lose precision due to floating point limits")
        
        return {
            'valid': len(warnings) == 0 or all('Expected' not in w for w in warnings),
            'parsed_value': parsed_value,
            'detected_type': detected_type,
            'warnings': warnings
        }
    
    def _validate_formula_syntax(self, formula: str) -> bool:
        """Basic formula syntax validation."""
        # Remove leading =
        if formula.startswith('='):
            formula = formula[1:]
        
        # Check balanced parentheses
        paren_count = 0
        for char in formula:
            if char == '(':
                paren_count += 1
            elif char == ')':
                paren_count -= 1
                if paren_count < 0:
                    return False
        
        return paren_count == 0
    
    def extract_cell_references(self, formula: str) -> list:
        """Extract cell references from a formula."""
        if not formula:
            return []
        
        # Remove leading = if present
        if formula.startswith('='):
            formula = formula[1:]
        
        # Find all cell references (e.g., A1, B2, AA10)
        cell_refs = re.findall(r'[A-Z]+\d+', formula.upper())
        
        # Find range references (e.g., A1:B5)
        range_refs = re.findall(r'[A-Z]+\d+:[A-Z]+\d+', formula.upper())
        
        return list(set(cell_refs + range_refs))
    
    def extract_function_calls(self, formula: str) -> list:
        """Extract function calls from a formula."""
        if not formula:
            return []
        
        # Remove leading = if present
        if formula.startswith('='):
            formula = formula[1:]
        
        # Find function calls (function name followed by parentheses)
        functions = re.findall(r'([A-Z_][A-Z0-9_]*)\s*\(', formula.upper())
        
        return list(set(functions))
    
    def convert_value_type(self, value: Any, target_type: CellType) -> Tuple[Any, bool]:
        """
        Convert value to target type.
        
        Args:
            value: Source value
            target_type: Target cell type
            
        Returns:
            Tuple of (converted_value, success)
        """
        if value is None:
            return None, True
        
        try:
            if target_type == CellType.TEXT:
                return str(value), True
            
            elif target_type == CellType.NUMBER:
                if isinstance(value, (int, float)):
                    return value, True
                elif isinstance(value, str):
                    number_result = self._parse_number(value)
                    return number_result, number_result is not None
                elif isinstance(value, bool):
                    return 1 if value else 0, True
                else:
                    return float(value), True
            
            elif target_type == CellType.BOOLEAN:
                if isinstance(value, bool):
                    return value, True
                elif isinstance(value, str):
                    bool_result = self._parse_boolean(value)
                    return bool_result, bool_result is not None
                elif isinstance(value, (int, float)):
                    return bool(value), True
                else:
                    return bool(value), True
            
            elif target_type == CellType.DATE:
                if isinstance(value, (date, datetime)):
                    return value, True
                elif isinstance(value, str):
                    date_result = self._parse_date(value)
                    return date_result, date_result is not None
                else:
                    return value, False
            
            else:
                return value, True
        
        except Exception:
            return value, False