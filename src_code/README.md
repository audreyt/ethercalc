# EtherCalc Python

Modern Python implementation of EtherCalc collaborative spreadsheet application with comprehensive testing and logging.

## 🚀 Quick Start

```bash
# Automated setup (recommended)
python dev_setup.py

# Manual setup
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python start_server.py --debug
```

Visit `http://localhost:8000/docs` for interactive API documentation.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Testing](#testing)
- [API Usage](#api-usage)
- [Development](#development)
- [Logging](#logging)
- [Migration Notes](#migration-notes)
- [Contributing](#contributing)

## Overview

This is a complete Python migration of the original EtherCalc LiveScript/JavaScript codebase. It provides:

- **Real-time collaboration** via WebSockets
- **RESTful API** for spreadsheet operations
- **File import/export** (CSV, XLSX, XLS, ODS)
- **Formula evaluation** engine
- **Redis storage** with filesystem fallback
- **FastAPI** web framework with async support
- **Comprehensive test suite** with 90%+ coverage
- **Professional logging** with audit trails

## Features

### ✅ Core Spreadsheet Functionality
- Cell management (values, formulas, formatting)
- Formula evaluation engine with dependency tracking
- Automatic recalculation
- Range operations and copy/paste with formula adjustment

### ✅ Real-time Collaboration
- WebSocket-based real-time updates
- Multi-user cursor tracking
- Live cell editing indicators
- User presence management

### ✅ Data Storage & Performance
- Redis for high-performance storage
- Automatic filesystem fallback
- Comprehensive audit logging
- Backup/restore functionality
- Performance monitoring

### ✅ File Import/Export
- CSV import/export with automatic delimiter detection
- XLSX import/export with formatting preservation
- XLS and ODS support
- Automatic file type detection

### ✅ Testing & Quality
- Unit tests with pytest
- Integration tests for API endpoints
- Code coverage reporting
- Automated linting and formatting
- Type checking with MyPy
- Security vulnerability scanning

## 📦 Installation

### Prerequisites

- **Python 3.9+** (required)
- **Redis** (optional, will fallback to filesystem)
- **Git** (for development)

### Automated Setup (Recommended)

```bash
git clone <repository-url>
cd ethercalc-python
python dev_setup.py
```

The setup script will:
- Create virtual environment
- Install all dependencies
- Set up directories and configuration
- Run initial tests
- Configure git hooks

### Manual Setup

```bash
# 1. Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Create required directories
mkdir -p logs data/dump data/backups static uploads

# 4. Create configuration file
cp .env.example .env  # Edit as needed

# 5. Run initial tests
python run_tests.py --quick
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# Server Configuration
HOST=0.0.0.0
PORT=8000
DEBUG=false
SECRET_KEY=your-secret-key-change-in-production-please

# Database Configuration
REDIS_URL=redis://localhost:6379/0
# Optional: PostgreSQL for advanced features
# DATABASE_URL=postgresql://user:pass@localhost/ethercalc

# CORS Settings
CORS_ORIGINS=http://localhost:3000,http://localhost:8080,http://localhost:8000

# File Upload Settings
MAX_FILE_SIZE=50000000
UPLOAD_PATH=./uploads
ALLOWED_FILE_TYPES=csv,xlsx,xls,ods

# Logging Configuration
LOG_LEVEL=INFO
LOG_FILE=logs/ethercalc.log

# WebSocket Settings
WS_PING_INTERVAL=30
WS_PING_TIMEOUT=10
WS_MAX_CONNECTIONS=1000

# Rate Limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=60

# Security Settings
ACCESS_TOKEN_EXPIRE_MINUTES=30
ALGORITHM=HS256

# Email Settings (Optional)
# SMTP_SERVER=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USERNAME=your-email@example.com
# SMTP_PASSWORD=your-app-password
```

### Configuration Options

| Option | Default | Description |
|--------|---------|-------------|
| `HOST` | `0.0.0.0` | Server bind address |
| `PORT` | `8000` | Server port |
| `DEBUG` | `false` | Enable debug mode |
| `REDIS_URL` | `redis://localhost:6379/0` | Redis connection string |
| `LOG_LEVEL` | `INFO` | Logging level (DEBUG, INFO, WARNING, ERROR) |
| `MAX_FILE_SIZE` | `50000000` | Max upload size (50MB) |

## 🚀 Running the Application

### Quick Start
```bash
python start_server.py
```

### Development Mode
```bash
python start_server.py --debug --reload --port 8001
```

### Production Mode
```bash
python start_server.py --host 0.0.0.0 --port 8000 --workers 4
```

### With Custom Configuration
```bash
python start_server.py \
  --host 127.0.0.1 \
  --port 8080 \
  --redis-url redis://localhost:6379/1 \
  --data-dir /var/lib/ethercalc
```

### Using Docker (if available)
```bash
docker build -t ethercalc-python .
docker run -p 8000:8000 ethercalc-python
```

## 🧪 Testing

### Test Runner Options

```bash
# Run all tests
python run_tests.py

# Quick test suite (unit tests + linting)
python run_tests.py --quick

# Individual test suites
python run_tests.py --unit           # Unit tests only
python run_tests.py --integration    # Integration tests only
python run_tests.py --lint          # Code quality checks
python run_tests.py --type-check    # Type checking
python run_tests.py --security      # Security vulnerability scan

# Tests with coverage report
python run_tests.py --coverage

# Complete test suite
python run_tests.py --all
```

### Manual Testing Commands

```bash
# Activate virtual environment first
source venv/bin/activate  # Windows: venv\Scripts\activate

# Unit tests
pytest tests/unit/ -v

# Integration tests
pytest tests/integration/ -v

# With coverage
pytest tests/ --cov=src/ethercalc --cov-report=html --cov-report=term-missing

# Specific test file
pytest tests/unit/test_database.py -v

# Run tests matching pattern
pytest tests/ -k "test_spreadsheet" -v

# Linting and formatting
flake8 src/ --max-line-length=88
black src/ --check
isort src/ --check-only
mypy src/ethercalc/ --ignore-missing-imports
```

### Test Structure

```
tests/
├── unit/                    # Unit tests
│   ├── test_database.py    # Database layer tests
│   ├── test_config.py      # Configuration tests
│   ├── test_exceptions.py  # Exception handling tests
│   └── test_formatters.py  # Data formatting tests
├── integration/            # Integration tests
│   └── test_api.py        # API endpoint tests
├── fixtures/              # Test data files
└── conftest.py           # Pytest configuration
```

### Writing Tests

Example unit test:

```python
# tests/unit/test_example.py
import pytest
from ethercalc.utils.formatters import CellFormatter

class TestCellFormatter:
    def test_format_number(self):
        """Test numeric value formatting."""
        result = CellFormatter.format_value(42)
        assert result == 42
        
    @pytest.mark.asyncio
    async def test_async_function(self):
        """Test async functionality."""
        result = await some_async_function()
        assert result is not None
```

Example integration test:

```python
# tests/integration/test_api.py
import pytest
from httpx import AsyncClient
from ethercalc.main import app

class TestAPI:
    @pytest.mark.asyncio
    async def test_create_spreadsheet(self):
        """Test spreadsheet creation API."""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post("/api/spreadsheets")
            assert response.status_code == 200
```

### Test Coverage

- **Target**: 90%+ code coverage
- **Current**: Check with `python run_tests.py --coverage`
- **Report**: Generated in `htmlcov/index.html`

Key coverage areas:
- ✅ Database operations (CRUD, backup, health checks)
- ✅ Configuration management
- ✅ Exception handling
- ✅ Data formatting and validation
- ✅ API endpoints
- ✅ WebSocket connections

## 📡 API Usage

### Authentication
```bash
# Most endpoints don't require auth in development
# For production, add JWT tokens:
curl -H "Authorization: Bearer <token>" ...
```

### Spreadsheet Operations

#### Create Spreadsheet
```bash
curl -X POST "http://localhost:8000/api/spreadsheets" \
  -H "Content-Type: application/json" \
  -d '{"title": "My Spreadsheet"}'
```

#### Get Spreadsheet
```bash
curl "http://localhost:8000/api/spreadsheets/{spreadsheet_id}"
```

#### List All Spreadsheets
```bash
curl "http://localhost:8000/api/spreadsheets"
```

#### Delete Spreadsheet
```bash
curl -X DELETE "http://localhost:8000/api/spreadsheets/{spreadsheet_id}"
```

### Cell Operations

#### Update Cell
```bash
curl -X PUT "http://localhost:8000/api/spreadsheets/{id}/cells/A1" \
  -H "Content-Type: application/json" \
  -d '{"value": "Hello World", "user_id": "user123"}'
```

#### Get Cell Value
```bash
curl "http://localhost:8000/api/spreadsheets/{id}/cells/A1"
```

#### Update Range
```bash
curl -X PUT "http://localhost:8000/api/spreadsheets/{id}/range/A1:B2" \
  -H "Content-Type: application/json" \
  -d '{"values": [["A1", "B1"], ["A2", "B2"]], "user_id": "user123"}'
```

### File Operations

#### Import CSV
```bash
curl -X POST "http://localhost:8000/api/spreadsheets/{id}/import/csv" \
  -F "file=@data.csv" \
  -F "has_header=true" \
  -F "start_cell=A1"
```

#### Import XLSX
```bash
curl -X POST "http://localhost:8000/api/spreadsheets/{id}/import/xlsx" \
  -F "file=@spreadsheet.xlsx" \
  -F "sheet_name=Sheet1"
```

#### Export CSV
```bash
curl -X GET "http://localhost:8000/api/spreadsheets/{id}/export/csv" \
  --output spreadsheet.csv
```

#### Export XLSX
```bash
curl -X GET "http://localhost:8000/api/spreadsheets/{id}/export/xlsx" \
  -H "Accept: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" \
  --output spreadsheet.xlsx
```

### System Operations

#### Health Check
```bash
curl "http://localhost:8000/health"
```

#### System Statistics
```bash
curl "http://localhost:8000/api/stats"
```

#### Database Backup
```bash
curl -X POST "http://localhost:8000/api/admin/backup"
```

## 🌐 WebSocket Connection

### JavaScript Client Example

```javascript
const ws = new WebSocket('ws://localhost:8000/ws/spreadsheet_id?user_id=user123');

ws.onopen = () => {
    console.log('Connected to spreadsheet');
};

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('Received update:', data);
    
    switch(data.type) {
        case 'cell_update':
            updateCell(data.cell, data.value);
            break;
        case 'cursor_update':
            showUserCursor(data.user_id, data.position);
            break;
        case 'user_joined':
            showUserPresence(data.user_id, true);
            break;
        case 'user_left':
            showUserPresence(data.user_id, false);
            break;
    }
};

// Send cell update
ws.send(JSON.stringify({
    type: 'cell_update',
    cell: 'A1',
    value: 'Hello World',
    formula: null
}));

// Send cursor position
ws.send(JSON.stringify({
    type: 'cursor_update',
    position: 'A1',
    selection: 'A1:B5'
}));

ws.onclose = () => {
    console.log('Disconnected from spreadsheet');
    // Implement reconnection logic
};
```

### Python Client Example

```python
import asyncio
import websockets
import json

async def connect_to_spreadsheet(spreadsheet_id, user_id):
    uri = f"ws://localhost:8000/ws/{spreadsheet_id}?user_id={user_id}"
    
    async with websockets.connect(uri) as websocket:
        # Send initial message
        await websocket.send(json.dumps({
            "type": "cell_update",
            "cell": "A1", 
            "value": "Hello from Python"
        }))
        
        # Listen for messages
        async for message in websocket:
            data = json.loads(message)
            print(f"Received: {data}")

# Run the client
asyncio.run(connect_to_spreadsheet("test_sheet", "python_user"))
```

## 💻 Development

### Project Structure

```
ethercalc-python/
├── src/ethercalc/              # Main application code
│   ├── main.py                # FastAPI application entry point
│   ├── config.py              # Configuration management
│   ├── database.py            # Database abstraction layer
│   ├── logging_config.py      # Logging configuration
│   ├── websocket_manager.py   # WebSocket connection handling
│   ├── api/                   # REST API routes
│   │   └── routes.py
│   ├── core/                  # Core business logic
│   │   ├── spreadsheet.py     # Spreadsheet models
│   │   ├── engine.py          # Calculation engine
│   │   ├── formula_engine.py  # Formula parsing and evaluation
│   │   ├── cell_parser.py     # Cell content parsing
│   │   └── collaboration.py   # Real-time collaboration
│   └── utils/                 # Utility modules
│       ├── exceptions.py      # Custom exception classes
│       ├── file_handlers.py   # File import/export
│       └── formatters.py      # Data formatting utilities
├── tests/                     # Test suite
│   ├── unit/                 # Unit tests
│   ├── integration/          # Integration tests
│   ├── fixtures/             # Test data
│   └── conftest.py           # Pytest configuration
├── logs/                     # Application logs
├── data/                     # Data storage (filesystem mode)
├── static/                   # Static web assets
├── uploads/                  # File upload storage
├── requirements.txt          # Python dependencies
├── dev_setup.py             # Development environment setup
├── run_tests.py             # Test runner script
├── start_server.py          # Server startup script
├── test_db.py              # Database connectivity test
└── pyproject.toml          # Project configuration
```

### Development Workflow

1. **Setup Development Environment**
   ```bash
   python dev_setup.py
   source venv/bin/activate
   ```

2. **Make Changes**
   ```bash
   # Edit code in src/ethercalc/
   # Add tests in tests/
   ```

3. **Test Your Changes**
   ```bash
   python run_tests.py --quick    # Fast feedback
   python run_tests.py --all      # Full test suite
   ```

4. **Code Quality Checks**
   ```bash
   # Auto-format code
   black src/
   isort src/
   
   # Check code quality
   flake8 src/ --max-line-length=88
   mypy src/ethercalc/ --ignore-missing-imports
   ```

5. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   # Pre-commit hooks will run automatically
   ```

### Adding New Features

1. **Create the feature module**
   ```python
   # src/ethercalc/new_feature.py
   from .logging_config import get_logger

   logger = get_logger(__name__)

   class NewFeature:
       def __init__(self):
           logger.info("New feature initialized")
   ```

2. **Add unit tests**
   ```python
   # tests/unit/test_new_feature.py
   import pytest
   from ethercalc.new_feature import NewFeature

   class TestNewFeature:
       def test_initialization(self):
           feature = NewFeature()
           assert feature is not None
   ```

3. **Add integration tests if needed**
   ```python
   # tests/integration/test_new_feature_api.py
   # Test API endpoints for the new feature
   ```

4. **Update documentation**
   - Add docstrings to all public methods
   - Update README.md if user-facing
   - Add API documentation examples

### Code Style Guidelines

- **Python Style**: Follow PEP 8 with 88-character line limit
- **Import Order**: Use isort (imports sorted automatically)
- **Type Hints**: Add type hints to all function signatures
- **Docstrings**: Use Google-style docstrings
- **Error Handling**: Use custom exceptions from `utils/exceptions.py`
- **Logging**: Use structured logging with appropriate levels

### Performance Considerations

- Use `async/await` for I/O operations
- Implement proper connection pooling
- Cache frequently accessed data
- Monitor performance with built-in logging
- Profile code with `cProfile` when needed

## 📝 Logging

### Log Files

The application generates several log files in the `logs/` directory:

- **`ethercalc.log`** - Main application logs
- **`audit.log`** - Audit trail of user actions
- **`performance.log`** - Performance metrics and timing data

### Log Levels

```python
import logging
from ethercalc.logging_config import get_logger

logger = get_logger(__name__)

logger.debug("Detailed debug information")      # Development only
logger.info("General information messages")     # Normal operations
logger.warning("Warning about potential issues") # Potential problems
logger.error("Error that needs attention")      # Errors that occurred
logger.critical("Critical system failure")      # System is unusable
```

### Audit Logging

```python
from ethercalc.logging_config import audit_logger

# Log user actions
audit_logger.log_spreadsheet_created("sheet123", "user456")
audit_logger.log_cell_updated("sheet123", "A1", "old_value", "new_value", "user456")
audit_logger.log_file_imported("sheet123", "csv", "data.csv", "user456")
```

### Performance Logging

```python
from ethercalc.logging_config import performance_logger

# Log API performance
performance_logger.log_api_call("/api/spreadsheets", "POST", 0.150, 200, "user123")

# Log database operations
performance_logger.log_database_operation("save_spreadsheet", 0.050, "sheet123")
```

### Log Configuration

Customize logging in your `.env` file:

```env
LOG_LEVEL=INFO          # DEBUG, INFO, WARNING, ERROR, CRITICAL
LOG_FILE=logs/ethercalc.log
```

### Log Rotation

Logs automatically rotate when they reach size limits:
- Main logs: 10MB files, 5 backups
- Audit logs: 50MB files, 10 backups  
- Performance logs: 25MB files, 5 backups

### Monitoring Logs

```bash
# Monitor all logs in real-time
tail -f logs/*.log

# Filter specific log levels
grep "ERROR" logs/ethercalc.log

# View audit trail for specific user
grep "user123" logs/audit.log

# Monitor performance issues
grep "duration=[0-9]\\.[5-9]" logs/performance.log  # >0.5s operations
```

## 📊 Migration Notes

This Python implementation migrates and modernizes the original EtherCalc LiveScript/JavaScript codebase.

### ✅ Completed Migrations

| Original Module | Python Implementation | Status |
|----------------|----------------------|---------|
| `app.ls` | `main.py` | ✅ Complete |
| `main.ls` | `api/routes.py` | ✅ Complete |
| `db.ls` | `database.py` | ✅ Enhanced |
| `player.ls` | `websocket_manager.py` | ✅ Complete |
| `sc.ls` | `core/engine.py` | ✅ Complete |
| File handlers | `utils/file_handlers.py` | ✅ Enhanced |

### 🚀 Architectural Improvements

| Aspect | Original | Python Implementation |
|--------|----------|----------------------|
| **Language** | LiveScript/JavaScript | Python 3.9+ |
| **Framework** | Express.js + Socket.IO | FastAPI + WebSockets |
| **Storage** | Direct Redis only | Redis + filesystem fallback |
| **Testing** | Minimal tests | 90%+ test coverage |
| **Logging** | Basic console logs | Structured logging with audit trails |
| **Type Safety** | None | Full type hints with MyPy |
| **Documentation** | Minimal | Comprehensive API docs |
| **Deployment** | Node.js specific | Python WSGI/ASGI compatible |

### 🎯 Performance Improvements

- **Async/await** throughout for better concurrency
- **Connection pooling** for database and Redis
- **Efficient WebSocket** connection management
- **Optimized formula evaluation** with caching
- **Better memory management** and garbage collection
- **Performance monitoring** and metrics

### 🔒 Security Enhancements

- **Input validation** with Pydantic models
- **SQL injection prevention** (when using SQL databases)
- **CORS configuration** for web security  
- **Rate limiting** on API endpoints
- **Security vulnerability scanning** in tests
- **Audit logging** for compliance

### 🔧 New Features

Features not in the original:
- ✅ **Comprehensive test suite** with unit and integration tests
- ✅ **Professional logging system** with audit trails
- ✅ **Development tools** (setup scripts, test runners)
- ✅ **Type checking** with MyPy
- ✅ **Code quality tools** (Black, flake8, isort)
- ✅ **Security scanning** with safety
- ✅ **Performance monitoring** and metrics
- ✅ **Database backup/restore** functionality
- ✅ **Health check endpoints** for monitoring
- ✅ **Flexible configuration** with environment variables

## 🤝 Contributing

### Getting Started

1. **Fork and clone the repository**
   ```bash
   git fork <repository-url>
   git clone <your-fork-url>
   cd ethercalc-python
   ```

2. **Set up development environment**
   ```bash
   python dev_setup.py
   source venv/bin/activate
   ```

3. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

### Development Guidelines

1. **Write tests first** (TDD approach preferred)
2. **Follow code style** (enforced by pre-commit hooks)
3. **Add proper documentation** (docstrings and README updates)
4. **Test thoroughly** (`python run_tests.py --all`)
5. **Update changelog** if making significant changes

### Pull Request Process

1. **Ensure all tests pass**
   ```bash
   python run_tests.py --all
   ```

2. **Update documentation** as needed

3. **Create pull request** with:
   - Clear description of changes
   - Test results
   - Breaking changes (if any)
   - Screenshots (if UI changes)

4. **Respond to review feedback** promptly

### Code Review Checklist

- [ ] All tests pass
- [ ] Code coverage maintained (>90%)
- [ ] Documentation updated
- [ ] Security considerations addressed
- [ ] Performance impact considered
- [ ] Backward compatibility maintained
- [ ] Error handling implemented
- [ ] Logging added for important operations

## 📄 License

This work is published from Taiwan under **CC0 1.0 Universal** license.

You are free to:
- Use commercially
- Modify and distribute
- Use privately
- No attribution required

## 🆘 Support & FAQ

### Common Issues

**Q: Server won't start - "Redis connection failed"**
A: This is normal if Redis isn't installed. The server will use filesystem storage automatically.

**Q: Tests are failing**
A: Run `python run_tests.py --quick` first. Check that virtual environment is activated.

**Q: Import/export not working**
A: Ensure the `uploads/` directory exists and is writable.

**Q: WebSocket connections failing**
A: Check firewall settings and ensure the port is open.

### Getting Help

1. **Check the logs**: `tail -f logs/ethercalc.log`
2. **Run diagnostics**: `python test_db.py`
3. **Check configuration**: Review your `.env` file
4. **Test connectivity**: `curl http://localhost:8000/health`

### Performance Tuning

For production deployments:

```bash
# Use multiple workers
python start_server.py --workers 4

# Configure Redis for better performance
# Set appropriate Redis memory settings
# Use Redis clustering for high availability

# Monitor performance logs
tail -f logs/performance.log
```

### Monitoring in Production

- Monitor log files for errors and performance issues
- Set up alerts for high response times
- Monitor Redis/database connections
- Track user activity through audit logs
- Set up health check monitoring

---

**Made with ❤️ for the spreadsheet collaboration community**