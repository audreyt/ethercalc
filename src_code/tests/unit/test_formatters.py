"""Unit tests for formatters module."""

import pytest
import json
from datetime import datetime, date
from decimal import Decimal

from ethercalc.utils.formatters import CellFormatter, ExportFormatter, ImportFormatter


class TestCellFormatter:
    """Test CellFormatter class."""

    def test_format_text(self):
        """Test formatting text values."""
        result = CellFormatter.format_value("Hello World")
        assert result == "Hello World"

    def test_format_number(self):
        """Test formatting numeric values."""
        result = CellFormatter.format_value(42)
        assert result == 42

    def test_format_float(self):
        """Test formatting float values."""
        result = CellFormatter.format_value(3.14159)
        assert result == 3.14159

    def test_format_boolean(self):
        """Test formatting boolean values."""
        assert CellFormatter.format_value(True) is True
        assert CellFormatter.format_value(False) is False

    def test_format_none(self):
        """Test formatting None values."""
        result = CellFormatter.format_value(None)
        assert result == ""

    def test_format_datetime(self):
        """Test formatting datetime objects."""
        dt = datetime(2025, 7, 31, 10, 30, 0)
        result = CellFormatter.format_value(dt)
        assert result == "2025-07-31T10:30:00"

    def test_format_date(self):
        """Test formatting date objects."""
        d = date(2025, 7, 31)
        result = CellFormatter.format_value(d)
        assert result == "2025-07-31"

    def test_format_decimal(self):
        """Test formatting Decimal objects."""
        decimal_val = Decimal("123.45")
        result = CellFormatter.format_value(decimal_val)
        assert result == 123.45

    def test_format_currency(self):
        """Test currency formatting."""
        result = CellFormatter.format_currency(1234.56)
        assert "$1,234.56" in result or "1,234.56" in result

    def test_format_percentage(self):
        """Test percentage formatting."""
        result = CellFormatter.format_percentage(0.1234)
        assert "12.34%" in result or "0.1234" in str(result)

    def test_detect_type_text(self):
        """Test detecting text type."""
        result = CellFormatter.detect_type("Hello")
        assert result == "text"

    def test_detect_type_number(self):
        """Test detecting number type."""
        assert CellFormatter.detect_type(42) == "number"
        assert CellFormatter.detect_type("42") == "number"
        assert CellFormatter.detect_type(3.14) == "number"

    def test_detect_type_boolean(self):
        """Test detecting boolean type."""
        assert CellFormatter.detect_type(True) == "boolean"
        assert CellFormatter.detect_type("true") == "boolean"
        assert CellFormatter.detect_type("false") == "boolean"

    def test_detect_type_date(self):
        """Test detecting date type."""
        assert CellFormatter.detect_type("2025-07-31") == "date"
        assert CellFormatter.detect_type("07/31/2025") == "date"

    def test_detect_type_formula(self):
        """Test detecting formula type."""
        assert CellFormatter.detect_type("=A1+B1") == "formula"
        assert CellFormatter.detect_type("=SUM(A1:A10)") == "formula"


class TestExportFormatter:
    """Test ExportFormatter class."""

    def test_to_json(self):
        """Test JSON export formatting."""
        data = {"A1": {"value": "Hello", "type": "text"}}
        result = ExportFormatter.to_json(data)
        
        parsed = json.loads(result)
        assert parsed["A1"]["value"] == "Hello"

    def test_to_csv_simple(self):
        """Test simple CSV export."""
        data = {
            "A1": {"value": "Name", "type": "text"},
            "B1": {"value": "Age", "type": "text"},
            "A2": {"value": "John", "type": "text"},
            "B2": {"value": "30", "type": "number"}
        }
        
        result = ExportFormatter.to_csv(data)
        lines = result.strip().split('\n')
        assert "Name,Age" in lines[0]
        assert "John,30" in lines[1]

    def test_to_html_table(self):
        """Test HTML table export."""
        data = {
            "A1": {"value": "Hello", "type": "text"},
            "B1": {"value": "World", "type": "text"}
        }
        
        result = ExportFormatter.to_html(data)
        assert "<table>" in result
        assert "<td>Hello</td>" in result
        assert "<td>World</td>" in result

    def test_to_xml(self):
        """Test XML export."""
        data = {
            "A1": {"value": "Test", "type": "text"}
        }
        
        result = ExportFormatter.to_xml(data)
        assert "<spreadsheet>" in result
        assert "<cell>" in result
        assert "<value>Test</value>" in result


class TestImportFormatter:
    """Test ImportFormatter class."""

    def test_from_json(self):
        """Test JSON import."""
        json_data = '{"A1": {"value": "Hello", "type": "text"}}'
        result = ImportFormatter.from_json(json_data)
        
        assert result["A1"]["value"] == "Hello"
        assert result["A1"]["type"] == "text"

    def test_from_csv_with_headers(self, sample_csv_data):
        """Test CSV import with headers."""
        result = ImportFormatter.from_csv(sample_csv_data, has_header=True)
        
        # Check that we have the expected data
        assert "A1" in result  # Header row
        assert "A2" in result  # Data rows
        assert result["A1"]["value"] == "Name"
        assert result["B2"]["value"] == "25"

    def test_from_csv_without_headers(self):
        """Test CSV import without headers."""
        csv_data = "John,30\nJane,25"
        result = ImportFormatter.from_csv(csv_data, has_header=False)
        
        assert result["A1"]["value"] == "John"
        assert result["B1"]["value"] == "30"

    def test_detect_delimiter(self):
        """Test CSV delimiter detection."""
        # Test comma delimiter
        csv_comma = "a,b,c\n1,2,3"
        delimiter = ImportFormatter.detect_delimiter(csv_comma)
        assert delimiter == ","
        
        # Test semicolon delimiter
        csv_semicolon = "a;b;c\n1;2;3"
        delimiter = ImportFormatter.detect_delimiter(csv_semicolon)
        assert delimiter == ";"

    def test_detect_headers(self, sample_csv_data):
        """Test header detection."""
        lines = sample_csv_data.strip().split('\n')
        rows = [line.split(',') for line in lines]
        
        has_headers, headers = ImportFormatter.detect_headers(rows)
        assert has_headers is True
        assert headers == ["Name", "Age", "City"]

    def test_cell_address_conversion(self):
        """Test cell address conversion utilities."""
        # Test row/col to cell address
        assert ImportFormatter.row_col_to_cell(0, 0) == "A1"
        assert ImportFormatter.row_col_to_cell(0, 25) == "Z1"
        assert ImportFormatter.row_col_to_cell(1, 0) == "A2"

    def test_sanitize_value(self):
        """Test value sanitization."""
        # Test HTML escaping
        html_input = "<script>alert('xss')</script>"
        result = ImportFormatter.sanitize_value(html_input)
        assert "<script>" not in result
        assert "&lt;script&gt;" in result

    def test_validate_cell_range(self):
        """Test cell range validation."""
        # Valid ranges
        assert ImportFormatter.validate_range("A1:B2") is True
        assert ImportFormatter.validate_range("A1:Z100") is True
        
        # Invalid ranges
        assert ImportFormatter.validate_range("A1:A0") is False
        assert ImportFormatter.validate_range("invalid") is False