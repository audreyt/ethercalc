"""Logging configuration for EtherCalc Python."""

import logging
import logging.handlers
import os
from pathlib import Path
from typing import Dict, Any

from .config import get_settings


def setup_logging(log_level: str = None, log_file: str = None) -> None:
    """Set up logging configuration for the application."""
    settings = get_settings()
    
    # Use provided values or fall back to settings
    log_level = log_level or settings.log_level
    log_file = log_file or settings.log_file
    
    # Create logs directory if it doesn't exist
    log_dir = Path(log_file).parent
    log_dir.mkdir(exist_ok=True, parents=True)
    
    # Define log format
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Create root logger
    logger = logging.getLogger()
    logger.setLevel(getattr(logging, log_level.upper()))
    
    # Clear any existing handlers
    logger.handlers.clear()
    
    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(getattr(logging, log_level.upper()))
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    
    # File handler with rotation
    file_handler = logging.handlers.RotatingFileHandler(
        log_file,
        maxBytes=10 * 1024 * 1024,  # 10MB
        backupCount=5
    )
    file_handler.setLevel(getattr(logging, log_level.upper()))
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)
    
    # Configure specific loggers
    configure_loggers(log_level)


def configure_loggers(log_level: str) -> None:
    """Configure specific loggers for different components."""
    loggers_config = {
        'ethercalc.database': log_level,
        'ethercalc.api': log_level,
        'ethercalc.websocket': log_level,
        'ethercalc.core': log_level,
        'uvicorn.access': 'WARNING',  # Reduce uvicorn noise
        'uvicorn.error': 'INFO',
        'fastapi': 'INFO'
    }
    
    for logger_name, level in loggers_config.items():
        logger = logging.getLogger(logger_name)
        logger.setLevel(getattr(logging, level.upper()))


def get_logger(name: str) -> logging.Logger:
    """Get a logger instance for a specific module."""
    return logging.getLogger(f"ethercalc.{name}")


class LoggerMixin:
    """Mixin class to add logging functionality to other classes."""
    
    @property
    def logger(self) -> logging.Logger:
        """Get logger for this class."""
        return get_logger(self.__class__.__name__.lower())


# Audit logging functionality
class AuditLogger:
    """Specialized logger for audit events."""
    
    def __init__(self, audit_file: str = "logs/audit.log"):
        """Initialize audit logger."""
        self.audit_file = audit_file
        
        # Create audit logs directory
        log_dir = Path(audit_file).parent
        log_dir.mkdir(exist_ok=True, parents=True)
        
        # Set up audit logger
        self.logger = logging.getLogger("ethercalc.audit")
        
        # Audit log handler with rotation
        handler = logging.handlers.RotatingFileHandler(
            audit_file,
            maxBytes=50 * 1024 * 1024,  # 50MB
            backupCount=10
        )
        
        # Audit log format (JSON-like for easy parsing)
        formatter = logging.Formatter(
            '%(asctime)s | %(message)s'
        )
        handler.setFormatter(formatter)
        
        if not self.logger.handlers:
            self.logger.addHandler(handler)
            self.logger.setLevel(logging.INFO)
    
    def log_spreadsheet_created(self, spreadsheet_id: str, user_id: str = None):
        """Log spreadsheet creation."""
        self.logger.info(f"SPREADSHEET_CREATED | id={spreadsheet_id} | user={user_id}")
    
    def log_spreadsheet_deleted(self, spreadsheet_id: str, user_id: str = None):
        """Log spreadsheet deletion."""
        self.logger.info(f"SPREADSHEET_DELETED | id={spreadsheet_id} | user={user_id}")
    
    def log_cell_updated(self, spreadsheet_id: str, cell: str, old_value: str = None, 
                        new_value: str = None, user_id: str = None):
        """Log cell update."""
        self.logger.info(
            f"CELL_UPDATED | sheet={spreadsheet_id} | cell={cell} | "
            f"old={old_value} | new={new_value} | user={user_id}"
        )
    
    def log_import(self, spreadsheet_id: str, file_type: str, filename: str, 
                  user_id: str = None):
        """Log file import."""
        self.logger.info(
            f"FILE_IMPORTED | sheet={spreadsheet_id} | type={file_type} | "
            f"file={filename} | user={user_id}"
        )
    
    def log_export(self, spreadsheet_id: str, file_type: str, user_id: str = None):
        """Log file export."""
        self.logger.info(
            f"FILE_EXPORTED | sheet={spreadsheet_id} | type={file_type} | user={user_id}"
        )
    
    def log_collaboration(self, spreadsheet_id: str, event: str, user_id: str = None, 
                         details: Dict[str, Any] = None):
        """Log collaboration events."""
        details_str = f" | details={details}" if details else ""
        self.logger.info(
            f"COLLABORATION | sheet={spreadsheet_id} | event={event} | "
            f"user={user_id}{details_str}"
        )
    
    def log_error(self, error_type: str, message: str, context: Dict[str, Any] = None):
        """Log error events."""
        context_str = f" | context={context}" if context else ""
        self.logger.error(f"ERROR | type={error_type} | msg={message}{context_str}")


# Global audit logger instance
audit_logger = AuditLogger()


# Performance logging
class PerformanceLogger:
    """Logger for performance metrics."""
    
    def __init__(self, perf_file: str = "logs/performance.log"):
        """Initialize performance logger."""
        self.perf_file = perf_file
        
        # Create performance logs directory
        log_dir = Path(perf_file).parent
        log_dir.mkdir(exist_ok=True, parents=True)
        
        # Set up performance logger
        self.logger = logging.getLogger("ethercalc.performance")
        
        # Performance log handler
        handler = logging.handlers.RotatingFileHandler(
            perf_file,
            maxBytes=25 * 1024 * 1024,  # 25MB
            backupCount=5
        )
        
        # Performance log format
        formatter = logging.Formatter(
            '%(asctime)s | %(message)s'
        )
        handler.setFormatter(formatter)
        
        if not self.logger.handlers:
            self.logger.addHandler(handler)
            self.logger.setLevel(logging.INFO)
    
    def log_api_call(self, endpoint: str, method: str, duration: float, 
                    status_code: int, user_id: str = None):
        """Log API call performance."""
        self.logger.info(
            f"API_CALL | endpoint={endpoint} | method={method} | "
            f"duration={duration:.3f}s | status={status_code} | user={user_id}"
        )
    
    def log_database_operation(self, operation: str, duration: float, 
                              spreadsheet_id: str = None):
        """Log database operation performance."""
        sheet_info = f" | sheet={spreadsheet_id}" if spreadsheet_id else ""
        self.logger.info(f"DB_OP | op={operation} | duration={duration:.3f}s{sheet_info}")
    
    def log_websocket_message(self, message_type: str, processing_time: float, 
                             user_id: str = None):
        """Log WebSocket message processing."""
        self.logger.info(
            f"WS_MESSAGE | type={message_type} | duration={processing_time:.3f}s | "
            f"user={user_id}"
        )
    
    def log_file_processing(self, operation: str, file_type: str, file_size: int, 
                          duration: float):
        """Log file processing performance."""
        self.logger.info(
            f"FILE_PROCESSING | op={operation} | type={file_type} | "
            f"size={file_size} | duration={duration:.3f}s"
        )


# Global performance logger instance
performance_logger = PerformanceLogger()