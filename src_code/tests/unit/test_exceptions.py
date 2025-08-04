"""Unit tests for exceptions module."""

import pytest

from ethercalc.utils.exceptions import (
    EtherCalcError,
    FormulaError,
    CircularReferenceError,
    CollaborationError,
    ValidationError,
    FileProcessingError
)


class TestExceptions:
    """Test custom exceptions."""

    def test_ethercalc_error(self):
        """Test base EtherCalcError."""
        error = EtherCalcError("Base error")
        assert str(error) == "Base error"
        assert isinstance(error, Exception)

    def test_formula_error(self):
        """Test FormulaError."""
        error = FormulaError("Invalid formula", formula="=A1+B1", cell_ref="A1")
        assert "Invalid formula" in str(error)
        assert error.cell_ref == "A1"
        assert error.formula == "=A1+B1"
        assert isinstance(error, EtherCalcError)

    def test_formula_error_without_cell(self):
        """Test FormulaError without cell reference."""
        error = FormulaError("Invalid formula")
        assert "Invalid formula" in str(error)
        assert error.cell_ref is None

    def test_circular_reference_error(self):
        """Test CircularReferenceError."""
        error = CircularReferenceError("Circular reference detected", ["A1", "B1", "A1"])
        assert "Circular reference detected" in str(error)
        assert error.cell_chain == ["A1", "B1", "A1"]
        assert isinstance(error, FormulaError)

    def test_collaboration_error(self):
        """Test CollaborationError."""
        error = CollaborationError("User conflict", user_id="user123")
        assert "User conflict" in str(error)
        assert error.user_id == "user123"
        assert isinstance(error, EtherCalcError)

    def test_collaboration_error_without_user(self):
        """Test CollaborationError without user ID."""
        error = CollaborationError("General conflict")
        assert "General conflict" in str(error)
        assert error.user_id is None

    def test_validation_error(self):
        """Test ValidationError."""
        error = ValidationError("Invalid data", field="email")
        assert "Invalid data" in str(error)
        assert error.field == "email"
        assert isinstance(error, EtherCalcError)

    def test_validation_error_without_field(self):
        """Test ValidationError without field."""
        error = ValidationError("Invalid data")
        assert "Invalid data" in str(error)
        assert error.field is None

    def test_file_processing_error(self):
        """Test FileProcessingError."""
        error = FileProcessingError("Cannot read file", filename="data.csv")
        assert "Cannot read file" in str(error)
        assert error.filename == "data.csv"
        assert isinstance(error, EtherCalcError)

    def test_file_processing_error_without_filename(self):
        """Test FileProcessingError without filename."""
        error = FileProcessingError("General file error")
        assert "General file error" in str(error)
        assert error.filename is None

    def test_exception_inheritance(self):
        """Test exception inheritance chain."""
        # Test that all custom exceptions inherit from EtherCalcError
        assert issubclass(FormulaError, EtherCalcError)
        assert issubclass(CircularReferenceError, FormulaError)
        assert issubclass(CollaborationError, EtherCalcError)
        assert issubclass(ValidationError, EtherCalcError)
        assert issubclass(FileProcessingError, EtherCalcError)

    def test_raising_exceptions(self):
        """Test raising custom exceptions."""
        with pytest.raises(FormulaError) as exc_info:
            raise FormulaError("Test error", cell_ref="A1")
        
        assert str(exc_info.value) == "Test error"
        assert exc_info.value.cell_ref == "A1"

    def test_catching_base_exception(self):
        """Test catching exceptions through base class."""
        try:
            raise ValidationError("Test validation error")
        except EtherCalcError as e:
            assert isinstance(e, ValidationError)
            assert "Test validation error" in str(e)
        else:
            pytest.fail("Expected EtherCalcError to be raised")