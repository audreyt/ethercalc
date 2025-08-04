"""Data formatting utilities for different output formats."""

import json
import xml.etree.ElementTree as ET
from datetime import datetime, date
from decimal import Decimal
from typing import Any, Dict, List, Optional, Union, Tuple
import html
import csv
import io

from ..core.spreadsheet import Cell, CellType, CellFormat


class CellFormatter:
    """Formats individual cell values for different contexts."""
    
    @staticmethod
    def format_for_display(cell: Cell, format_options: Optional[Dict[str, Any]] = None) -> str:
        """Format cell value for display in UI."""
        if cell.value is None or cell.value == "":
            return ""
        
        format_options = format_options or {}
        
        if cell.cell_type == CellType.FORMULA and format_options.get('show_formulas', False):
            return cell.formula or ""
        
        if cell.cell_type == CellType.ERROR:
            return str(cell.value)
        
        if cell.cell_type == CellType.BOOLEAN:
            return "TRUE" if cell.value else "FALSE"
        
        if cell.cell_type == CellType.NUMBER:
            return CellFormatter._format_number(cell.value, cell.format)
        
        if cell.cell_type == CellType.DATE:
            return CellFormatter._format_date(cell.value, cell.format)
        
        return str(cell.value)
    
    @staticmethod
    def format_for_export(cell: Cell, export_format: str) -> str:
        """Format cell value for export."""
        if cell.value is None or cell.value == "":
            return ""
        
        if export_format.lower() == 'csv':
            # CSV export should include raw values
            if cell.cell_type == CellType.FORMULA:
                return str(cell.value) if cell.value is not None else ""
            return str(cell.value)
        
        elif export_format.lower() in ['xlsx', 'xls']:
            # Excel export preserves types
            return cell.value
        
        elif export_format.lower() == 'html':
            # HTML export needs escaping
            return html.escape(str(cell.value))
        
        elif export_format.lower() == 'json':
            # JSON export preserves types where possible
            if cell.cell_type == CellType.DATE:
                if isinstance(cell.value, (date, datetime)):
                    return cell.value.isoformat()
            return cell.value
        
        return str(cell.value)
    
    @staticmethod
    def _format_number(value: Union[int, float], cell_format: Optional[CellFormat] = None) -> str:
        """Format numeric values."""
        if cell_format and cell_format.number_format:
            fmt = cell_format.number_format
            
            if fmt == 'currency':
                return f"${value:,.2f}"
            elif fmt == 'percentage':
                return f"{value * 100:.1f}%"
            elif fmt.startswith('decimal_'):
                try:
                    decimals = int(fmt.split('_')[1])
                    return f"{value:.{decimals}f}"
                except (ValueError, IndexError):
                    pass
            elif fmt == 'scientific':
                return f"{value:.2e}"
            elif fmt == 'accounting':
                if value < 0:
                    return f"(${abs(value):,.2f})"
                else:
                    return f"${value:,.2f}"
        
        # Default number formatting
        if isinstance(value, int):
            return str(value)
        else:
            # Remove trailing zeros for floats
            return f"{value:g}"
    
    @staticmethod
    def _format_date(value: Union[date, datetime], cell_format: Optional[CellFormat] = None) -> str:
        """Format date values."""
        if not isinstance(value, (date, datetime)):
            return str(value)
        
        if cell_format and cell_format.number_format:
            try:
                return value.strftime(cell_format.number_format)
            except (ValueError, TypeError):
                pass
        
        # Default date formatting
        if isinstance(value, datetime):
            return value.strftime('%Y-%m-%d %H:%M:%S')
        else:
            return value.strftime('%Y-%m-%d')


class ExportFormatter:
    """Formats spreadsheet data for various export formats."""
    
    @staticmethod
    def to_csv(data: Dict[str, List[List[Any]]], sheet_name: str = None) -> str:
        """Convert spreadsheet data to CSV format."""
        # Use specified sheet or first sheet
        if sheet_name and sheet_name in data:
            rows = data[sheet_name]
        elif data:
            rows = next(iter(data.values()))
        else:
            rows = []
        
        output = io.StringIO()
        writer = csv.writer(output, quoting=csv.QUOTE_MINIMAL)
        
        for row in rows:
            # Convert all values to strings
            string_row = []
            for cell in row:
                if cell is None:
                    string_row.append("")
                elif isinstance(cell, bool):
                    string_row.append("TRUE" if cell else "FALSE")
                elif isinstance(cell, (date, datetime)):
                    string_row.append(cell.isoformat())
                else:
                    string_row.append(str(cell))
            
            writer.writerow(string_row)
        
        return output.getvalue()
    
    @staticmethod
    def to_html(data: Dict[str, List[List[Any]]], title: str = "Spreadsheet") -> str:
        """Convert spreadsheet data to HTML format."""
        html_parts = [
            '<!DOCTYPE html>',
            '<html>',
            '<head>',
            f'    <title>{html.escape(title)}</title>',
            '    <style>',
            '        table { border-collapse: collapse; width: 100%; }',
            '        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }',
            '        th { background-color: #f2f2f2; font-weight: bold; }',
            '        .sheet-title { margin: 20px 0 10px 0; font-size: 18px; font-weight: bold; }',
            '    </style>',
            '</head>',
            '<body>',
            f'    <h1>{html.escape(title)}</h1>'
        ]
        
        for sheet_name, rows in data.items():
            if len(data) > 1:
                html_parts.append(f'    <div class="sheet-title">{html.escape(sheet_name)}</div>')
            
            html_parts.extend([
                '    <table>',
                '        <tbody>'
            ])
            
            for row_idx, row in enumerate(rows):
                row_tag = 'th' if row_idx == 0 else 'td'
                html_parts.append('            <tr>')
                
                for cell in row:
                    cell_content = html.escape(str(cell)) if cell is not None else ""
                    html_parts.append(f'                <{row_tag}>{cell_content}</{row_tag}>')
                
                html_parts.append('            </tr>')
            
            html_parts.extend([
                '        </tbody>',
                '    </table>'
            ])
        
        html_parts.extend([
            '</body>',
            '</html>'
        ])
        
        return '\n'.join(html_parts)
    
    @staticmethod
    def to_json(data: Dict[str, List[List[Any]]], format_type: str = "sheets") -> str:
        """Convert spreadsheet data to JSON format."""
        if format_type == "sheets":
            # Format: {"sheet1": [["A1", "B1"], ["A2", "B2"]], "sheet2": [...]}
            json_data = {}
            for sheet_name, rows in data.items():
                json_data[sheet_name] = rows
            
        elif format_type == "cells":
            # Format: {"sheet1": {"A1": "value1", "B1": "value2"}, "sheet2": {...}}
            json_data = {}
            for sheet_name, rows in data.items():
                sheet_cells = {}
                for row_idx, row in enumerate(rows):
                    for col_idx, cell_value in enumerate(row):
                        if cell_value is not None and str(cell_value).strip():
                            cell_ref = ExportFormatter._index_to_cell_ref(col_idx, row_idx)
                            sheet_cells[cell_ref] = cell_value
                json_data[sheet_name] = sheet_cells
        
        elif format_type == "records":
            # Format: {"sheet1": [{"col1": "val1", "col2": "val2"}], "sheet2": [...]}
            json_data = {}
            for sheet_name, rows in data.items():
                records = []
                if rows:
                    headers = rows[0] if rows else []
                    for row in rows[1:]:
                        record = {}
                        for idx, header in enumerate(headers):
                            value = row[idx] if idx < len(row) else None
                            record[str(header)] = value
                        records.append(record)
                json_data[sheet_name] = records
        
        else:
            json_data = data
        
        return json.dumps(json_data, indent=2, default=ExportFormatter._json_serializer)
    
    @staticmethod
    def to_xml(data: Dict[str, List[List[Any]]], root_name: str = "spreadsheet") -> str:
        """Convert spreadsheet data to XML format."""
        root = ET.Element(root_name)
        
        for sheet_name, rows in data.items():
            sheet_elem = ET.SubElement(root, "sheet", name=sheet_name)
            
            for row_idx, row in enumerate(rows):
                row_elem = ET.SubElement(sheet_elem, "row", index=str(row_idx + 1))
                
                for col_idx, cell_value in enumerate(row):
                    cell_elem = ET.SubElement(row_elem, "cell", 
                                            column=ExportFormatter._index_to_column_letter(col_idx))
                    if cell_value is not None:
                        cell_elem.text = str(cell_value)
        
        # Pretty print XML
        ExportFormatter._indent_xml(root)
        return ET.tostring(root, encoding='unicode')
    
    @staticmethod
    def _index_to_cell_ref(col_idx: int, row_idx: int) -> str:
        """Convert column and row indices to cell reference (e.g., A1)."""
        col_letter = ExportFormatter._index_to_column_letter(col_idx)
        return f"{col_letter}{row_idx + 1}"
    
    @staticmethod
    def _index_to_column_letter(col_idx: int) -> str:
        """Convert column index to letter (0->A, 1->B, 25->Z, 26->AA)."""
        result = ""
        col_idx += 1  # Convert to 1-based
        
        while col_idx > 0:
            col_idx -= 1
            result = chr(ord('A') + col_idx % 26) + result
            col_idx //= 26
        
        return result
    
    @staticmethod
    def _json_serializer(obj: Any) -> Any:
        """Custom JSON serializer for special types."""
        if isinstance(obj, (date, datetime)):
            return obj.isoformat()
        elif isinstance(obj, Decimal):
            return float(obj)
        elif hasattr(obj, '__dict__'):
            return obj.__dict__
        else:
            return str(obj)
    
    @staticmethod
    def _indent_xml(elem: ET.Element, level: int = 0) -> None:
        """Add indentation to XML for pretty printing."""
        indent = "\n" + level * "  "
        if len(elem):
            if not elem.text or not elem.text.strip():
                elem.text = indent + "  "
            if not elem.tail or not elem.tail.strip():
                elem.tail = indent
            for elem in elem:
                ExportFormatter._indent_xml(elem, level + 1)
            if not elem.tail or not elem.tail.strip():
                elem.tail = indent
        else:
            if level and (not elem.tail or not elem.tail.strip()):
                elem.tail = indent


class ImportFormatter:
    """Formats imported data for spreadsheet consumption."""
    
    @staticmethod
    def normalize_imported_data(data: Dict[str, List[List[Any]]]) -> Dict[str, List[List[Any]]]:
        """Normalize imported data to ensure consistency."""
        normalized = {}
        
        for sheet_name, rows in data.items():
            normalized_rows = []
            max_cols = 0
            
            # First pass: find maximum columns
            for row in rows:
                max_cols = max(max_cols, len(row))
            
            # Second pass: normalize rows
            for row in rows:
                normalized_row = []
                for col_idx in range(max_cols):
                    if col_idx < len(row):
                        value = row[col_idx]
                        # Convert empty strings to None
                        if value == "":
                            value = None
                        normalized_row.append(value)
                    else:
                        normalized_row.append(None)
                
                # Remove trailing None values
                while normalized_row and normalized_row[-1] is None:
                    normalized_row.pop()
                
                if normalized_row or not normalized_rows:  # Keep at least one row
                    normalized_rows.append(normalized_row)
            
            normalized[sheet_name] = normalized_rows
        
        return normalized
    
    @staticmethod
    def detect_headers(rows: List[List[Any]]) -> Tuple[bool, List[str]]:
        """Detect if first row contains headers."""
        if not rows:
            return False, []
        
        first_row = rows[0]
        if len(rows) < 2:
            return False, [str(cell) if cell is not None else "" for cell in first_row]
        
        # Check if first row is different from second row in type patterns
        second_row = rows[1]
        
        header_indicators = 0
        total_cells = min(len(first_row), len(second_row))
        
        for i in range(total_cells):
            first_val = first_row[i]
            second_val = second_row[i]
            
            # Check for type differences that indicate headers
            if first_val is not None and second_val is not None:
                # Text in first row, number in second = likely header
                if (isinstance(first_val, str) and not first_val.replace('.', '').replace('-', '').isdigit() and 
                    (isinstance(second_val, (int, float)) or 
                     (isinstance(second_val, str) and second_val.replace('.', '').replace('-', '').isdigit()))):
                    header_indicators += 1
                
                # First row is descriptive text
                elif isinstance(first_val, str) and len(first_val) > 10 and ' ' in first_val:
                    header_indicators += 1
        
        has_headers = header_indicators > total_cells * 0.3  # 30% threshold
        header_names = [str(cell) if cell is not None else f"Column{i+1}" 
                       for i, cell in enumerate(first_row)]
        
        return has_headers, header_names
    
    @staticmethod
    def convert_data_types(data: Dict[str, List[List[Any]]]) -> Dict[str, List[List[Any]]]:
        """Convert string data to appropriate Python types."""
        from ..core.cell_parser import CellParser
        
        parser = CellParser()
        converted = {}
        
        for sheet_name, rows in data.items():
            converted_rows = []
            
            for row in rows:
                converted_row = []
                for cell in row:
                    if cell is None or cell == "":
                        converted_row.append(None)
                    else:
                        # Parse the cell value
                        parsed_value, _ = parser.parse_cell_value(cell)
                        converted_row.append(parsed_value)
                
                converted_rows.append(converted_row)
            
            converted[sheet_name] = converted_rows
        
        return converted
    
    @staticmethod
    def validate_sheet_names(data: Dict[str, List[List[Any]]]) -> Dict[str, List[List[Any]]]:
        """Validate and fix sheet names to ensure they're valid."""
        validated = {}
        used_names = set()
        
        for sheet_name, rows in data.items():
            # Clean sheet name
            clean_name = ImportFormatter._clean_sheet_name(sheet_name)
            
            # Ensure uniqueness
            original_name = clean_name
            counter = 1
            while clean_name in used_names:
                clean_name = f"{original_name}_{counter}"
                counter += 1
            
            used_names.add(clean_name)
            validated[clean_name] = rows
        
        return validated
    
    @staticmethod
    def _clean_sheet_name(name: str) -> str:
        """Clean sheet name to ensure it's valid."""
        # Remove invalid characters
        invalid_chars = ['\\', '/', '*', '[', ']', ':', '?']
        clean_name = name
        
        for char in invalid_chars:
            clean_name = clean_name.replace(char, '_')
        
        # Trim to maximum length
        clean_name = clean_name[:31]  # Excel limit
        
        # Ensure not empty
        if not clean_name.strip():
            clean_name = "Sheet1"
        
        return clean_name.strip()
    
    @staticmethod
    def create_summary(data: Dict[str, List[List[Any]]]) -> Dict[str, Any]:
        """Create import summary with statistics."""
        total_sheets = len(data)
        total_rows = sum(len(rows) for rows in data.values())
        total_cells = sum(len(row) for rows in data.values() for row in rows)
        non_empty_cells = sum(1 for rows in data.values() for row in rows for cell in row 
                             if cell is not None and str(cell).strip())
        
        sheet_info = []
        for sheet_name, rows in data.items():
            has_headers, headers = ImportFormatter.detect_headers(rows)
            max_cols = max(len(row) for row in rows) if rows else 0
            
            sheet_info.append({
                "name": sheet_name,
                "rows": len(rows),
                "columns": max_cols,
                "has_headers": has_headers,
                "headers": headers if has_headers else None
            })
        
        return {
            "total_sheets": total_sheets,
            "total_rows": total_rows,
            "total_cells": total_cells,
            "non_empty_cells": non_empty_cells,
            "sheets": sheet_info
        }