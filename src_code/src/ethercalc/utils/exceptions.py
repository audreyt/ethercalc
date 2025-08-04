"""Custom exceptions for EtherCalc."""


class EtherCalcError(Exception):
    """Base exception for EtherCalc."""
    
    def __init__(self, message: str, error_code: str = None):
        """Initialize exception with message and optional error code."""
        super().__init__(message)
        self.message = message
        self.error_code = error_code
    
    def to_dict(self):
        """Convert exception to dictionary."""
        return {
            "error": self.__class__.__name__,
            "message": self.message,
            "error_code": self.error_code
        }


class FormulaError(EtherCalcError):
    """Exception raised for formula-related errors."""
    
    def __init__(self, message: str, formula: str = None, cell_ref: str = None):
        """Initialize formula error."""
        super().__init__(message, "FORMULA_ERROR")
        self.formula = formula
        self.cell_ref = cell_ref
    
    def to_dict(self):
        """Convert to dictionary with formula details."""
        result = super().to_dict()
        result.update({
            "formula": self.formula,
            "cell_ref": self.cell_ref
        })
        return result


class CircularReferenceError(FormulaError):
    """Exception raised when circular references are detected."""
    
    def __init__(self, message: str, cell_chain: list = None):
        """Initialize circular reference error."""
        super().__init__(message)
        self.error_code = "CIRCULAR_REFERENCE"
        self.cell_chain = cell_chain or []
    
    def to_dict(self):
        """Convert to dictionary with cell chain."""
        result = super().to_dict()
        result["cell_chain"] = self.cell_chain
        return result


class ValidationError(EtherCalcError):
    """Exception raised for validation errors."""
    
    def __init__(self, message: str, field: str = None, value: str = None):
        """Initialize validation error."""
        super().__init__(message, "VALIDATION_ERROR")
        self.field = field
        self.value = value
    
    def to_dict(self):
        """Convert to dictionary with field details."""
        result = super().to_dict()
        result.update({
            "field": self.field,
            "value": self.value
        })
        return result


class CollaborationError(EtherCalcError):
    """Exception raised for collaboration-related errors."""
    
    def __init__(self, message: str, user_id: str = None, session_id: str = None):
        """Initialize collaboration error."""
        super().__init__(message, "COLLABORATION_ERROR")
        self.user_id = user_id
        self.session_id = session_id
    
    def to_dict(self):
        """Convert to dictionary with user details."""
        result = super().to_dict()
        result.update({
            "user_id": self.user_id,
            "session_id": self.session_id
        })
        return result


class FileProcessingError(EtherCalcError):
    """Exception raised for file processing errors."""
    
    def __init__(self, message: str, filename: str = None, file_type: str = None):
        """Initialize file processing error."""
        super().__init__(message, "FILE_PROCESSING_ERROR")
        self.filename = filename
        self.file_type = file_type
    
    def to_dict(self):
        """Convert to dictionary with file details."""
        result = super().to_dict()
        result.update({
            "filename": self.filename,
            "file_type": self.file_type
        })
        return result


class DatabaseError(EtherCalcError):
    """Exception raised for database-related errors."""
    
    def __init__(self, message: str, operation: str = None):
        """Initialize database error."""
        super().__init__(message, "DATABASE_ERROR")
        self.operation = operation
    
    def to_dict(self):
        """Convert to dictionary with operation details."""
        result = super().to_dict()
        result["operation"] = self.operation
        return result


class AuthenticationError(EtherCalcError):
    """Exception raised for authentication errors."""
    
    def __init__(self, message: str = "Authentication failed"):
        """Initialize authentication error."""
        super().__init__(message, "AUTHENTICATION_ERROR")


class AuthorizationError(EtherCalcError):
    """Exception raised for authorization errors."""
    
    def __init__(self, message: str = "Access denied", resource: str = None, action: str = None):
        """Initialize authorization error."""
        super().__init__(message, "AUTHORIZATION_ERROR")
        self.resource = resource
        self.action = action
    
    def to_dict(self):
        """Convert to dictionary with resource details."""
        result = super().to_dict()
        result.update({
            "resource": self.resource,
            "action": self.action
        })
        return result


class RateLimitError(EtherCalcError):
    """Exception raised when rate limits are exceeded."""
    
    def __init__(self, message: str = "Rate limit exceeded", retry_after: int = None):
        """Initialize rate limit error."""
        super().__init__(message, "RATE_LIMIT_ERROR")
        self.retry_after = retry_after
    
    def to_dict(self):
        """Convert to dictionary with retry info."""
        result = super().to_dict()
        result["retry_after"] = self.retry_after
        return result


class ConfigurationError(EtherCalcError):
    """Exception raised for configuration errors."""
    
    def __init__(self, message: str, setting: str = None):
        """Initialize configuration error."""
        super().__init__(message, "CONFIGURATION_ERROR")
        self.setting = setting
    
    def to_dict(self):
        """Convert to dictionary with setting details."""
        result = super().to_dict()
        result["setting"] = self.setting
        return result


# Error type mapping for HTTP status codes
ERROR_STATUS_MAP = {
    ValidationError: 400,
    FormulaError: 400,
    CircularReferenceError: 400,
    FileProcessingError: 400,
    AuthenticationError: 401,
    AuthorizationError: 403,
    RateLimitError: 429,
    DatabaseError: 500,
    CollaborationError: 500,
    ConfigurationError: 500,
    EtherCalcError: 500,
}