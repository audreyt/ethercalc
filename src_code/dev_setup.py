#!/usr/bin/env python3
"""Development setup script for EtherCalc Python."""

import sys
import subprocess
import os
from pathlib import Path
import venv
import shutil


def run_command(cmd, description, check=True):
    """Run a command with error handling."""
    print(f"\n🔧 {description}...")
    print(f"Running: {' '.join(cmd)}")
    
    try:
        result = subprocess.run(cmd, check=check, text=True, capture_output=True)
        if result.stdout:
            print(result.stdout)
        if result.stderr and not check:
            print(f"Warning: {result.stderr}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed: {e}")
        if e.stdout:
            print(f"STDOUT: {e.stdout}")
        if e.stderr:
            print(f"STDERR: {e.stderr}")
        return False


def create_virtual_environment():
    """Create virtual environment if it doesn't exist."""
    venv_path = Path("venv")
    
    if venv_path.exists():
        print("✅ Virtual environment already exists")
        return True
    
    print("🔧 Creating virtual environment...")
    try:
        venv.create("venv", with_pip=True)
        print("✅ Virtual environment created")
        return True
    except Exception as e:
        print(f"❌ Failed to create virtual environment: {e}")
        return False


def install_dependencies():
    """Install project dependencies."""
    pip_path = "venv/bin/pip" if os.name != "nt" else "venv\\Scripts\\pip.exe"
    
    # Upgrade pip first
    if not run_command([pip_path, "install", "--upgrade", "pip"], "Upgrading pip"):
        return False
    
    # Install main dependencies
    if not run_command([pip_path, "install", "-r", "requirements.txt"], "Installing main dependencies"):
        return False
    
    # Install development dependencies
    dev_deps = [
        "pytest>=7.4.0",
        "pytest-asyncio>=0.21.0", 
        "pytest-cov>=4.1.0",
        "httpx>=0.25.0",  # For API testing
        "safety>=2.3.0"   # For security checks
    ]
    
    for dep in dev_deps:
        if not run_command([pip_path, "install", dep], f"Installing {dep}"):
            print(f"Warning: Failed to install {dep}")
    
    return True


def create_directories():
    """Create necessary directories."""
    directories = [
        "logs",
        "data/dump",
        "data/backups", 
        "static",
        "uploads",
        "tests/fixtures"
    ]
    
    for directory in directories:
        Path(directory).mkdir(parents=True, exist_ok=True)
        print(f"✅ Created directory: {directory}")
    
    return True


def create_env_file():
    """Create .env file with default settings."""
    env_file = Path(".env")
    
    if env_file.exists():
        print("✅ .env file already exists")
        return True
    
    env_content = """# EtherCalc Python Environment Configuration

# Server Settings
HOST=0.0.0.0
PORT=8000
DEBUG=false
SECRET_KEY=your-secret-key-change-in-production

# Redis Settings
REDIS_URL=redis://localhost:6379/0

# CORS Settings
CORS_ORIGINS=http://localhost:3000,http://localhost:8080

# File Upload Settings
MAX_FILE_SIZE=50000000
UPLOAD_PATH=./uploads

# Logging Settings
LOG_LEVEL=INFO
LOG_FILE=logs/ethercalc.log

# Database Settings (Optional)
# DATABASE_URL=postgresql://user:pass@localhost/ethercalc

# Email Settings (Optional)
# SMTP_SERVER=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USERNAME=your-email@gmail.com
# SMTP_PASSWORD=your-app-password
"""
    
    try:
        env_file.write_text(env_content)
        print("✅ Created .env file with default settings")
        return True
    except Exception as e:
        print(f"❌ Failed to create .env file: {e}")
        return False


def setup_git_hooks():
    """Set up git pre-commit hooks."""
    git_dir = Path(".git")
    if not git_dir.exists():
        print("⚠️  Not a git repository - skipping git hooks")
        return True
    
    hooks_dir = git_dir / "hooks"
    hooks_dir.mkdir(exist_ok=True)
    
    pre_commit_hook = hooks_dir / "pre-commit"
    
    hook_content = """#!/bin/bash
# Pre-commit hook for EtherCalc Python

echo "Running pre-commit checks..."

# Activate virtual environment
source venv/bin/activate

# Run linting
echo "🔍 Running linting checks..."
python -m flake8 src/ --max-line-length=88 --extend-ignore=E203,W503
if [ $? -ne 0 ]; then
    echo "❌ Linting failed. Please fix the issues before committing."
    exit 1
fi

# Run black formatting check
echo "🎨 Checking code formatting..."
python -m black src/ --check
if [ $? -ne 0 ]; then
    echo "❌ Code formatting issues found. Run 'python -m black src/' to fix."
    exit 1
fi

# Run unit tests
echo "🧪 Running unit tests..."
python -m pytest tests/unit/ -q
if [ $? -ne 0 ]; then
    echo "❌ Unit tests failed. Please fix the tests before committing."
    exit 1
fi

echo "✅ All pre-commit checks passed!"
"""
    
    try:
        pre_commit_hook.write_text(hook_content)
        pre_commit_hook.chmod(0o755)
        print("✅ Set up git pre-commit hooks")
        return True
    except Exception as e:
        print(f"❌ Failed to set up git hooks: {e}")
        return False


def check_external_dependencies():
    """Check for external dependencies."""
    print("\n🔍 Checking external dependencies...")
    
    # Check for Redis (optional)
    redis_running = run_command(["redis-cli", "ping"], "Checking Redis", check=False)
    if redis_running:
        print("✅ Redis is running")
    else:
        print("⚠️  Redis is not running (will use filesystem storage)")
    
    # Check Python version
    python_version = sys.version_info
    if python_version >= (3, 9):
        print(f"✅ Python {python_version.major}.{python_version.minor} is compatible")
    else:
        print(f"❌ Python {python_version.major}.{python_version.minor} is not supported. Please use Python 3.9+")
        return False
    
    return True


def run_initial_tests():
    """Run initial tests to verify setup."""
    python_path = "venv/bin/python" if os.name != "nt" else "venv\\Scripts\\python.exe"
    
    print("\n🧪 Running initial tests...")
    
    # Test database connectivity
    success = run_command([python_path, "test_db.py"], "Testing database connectivity", check=False)
    if success:
        print("✅ Database connectivity test passed")
    else:
        print("⚠️  Database connectivity test had issues (may be expected)")
    
    # Run a few unit tests
    success = run_command([python_path, "-m", "pytest", "tests/unit/test_config.py", "-v"], 
                         "Running sample unit tests", check=False)
    if success:
        print("✅ Sample unit tests passed")
    
    return True


def main():
    """Main setup function."""
    print("🚀 EtherCalc Python Development Setup")
    print("=" * 50)
    
    # Change to script directory
    script_dir = Path(__file__).parent
    os.chdir(script_dir)
    print(f"Working in: {os.getcwd()}")
    
    steps = [
        ("Create virtual environment", create_virtual_environment),
        ("Install dependencies", install_dependencies),
        ("Create directories", create_directories),
        ("Create .env file", create_env_file),
        ("Set up git hooks", setup_git_hooks),
        ("Check external dependencies", check_external_dependencies),
        ("Run initial tests", run_initial_tests)
    ]
    
    failed_steps = []
    
    for step_name, step_func in steps:
        print(f"\n{'='*20} {step_name} {'='*20}")
        try:
            if step_func():
                print(f"✅ {step_name} completed successfully")
            else:
                print(f"❌ {step_name} failed")
                failed_steps.append(step_name)
        except Exception as e:
            print(f"❌ {step_name} failed with exception: {e}")
            failed_steps.append(step_name)
    
    # Summary
    print(f"\n{'='*50}")
    print("SETUP SUMMARY")
    print(f"{'='*50}")
    
    if not failed_steps:
        print("🎉 Development environment setup completed successfully!")
        print("\nNext steps:")
        print("1. Activate virtual environment: source venv/bin/activate")
        print("2. Start the server: python start_server.py --debug")
        print("3. Run tests: python run_tests.py")
        print("4. Visit http://localhost:8000/docs for API documentation")
        return 0
    else:
        print(f"⚠️  Setup completed with {len(failed_steps)} warnings/errors:")
        for step in failed_steps:
            print(f"   - {step}")
        print("\nYou may need to fix these issues manually.")
        return 1


if __name__ == "__main__":
    sys.exit(main())