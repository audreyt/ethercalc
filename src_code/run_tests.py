#!/usr/bin/env python3
"""Test runner script for EtherCalc Python."""

import sys
import subprocess
import argparse
import os
from pathlib import Path


def run_command(cmd, description):
    """Run a command and return success status."""
    print(f"\n{'='*60}")
    print(f"Running: {description}")
    print(f"Command: {' '.join(cmd)}")
    print(f"{'='*60}")
    
    try:
        result = subprocess.run(cmd, check=True, capture_output=True, text=True)
        print(result.stdout)
        if result.stderr:
            print("STDERR:", result.stderr)
        print(f"✅ {description} - PASSED")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} - FAILED")
        print(f"Return code: {e.returncode}")
        print(f"STDOUT: {e.stdout}")
        print(f"STDERR: {e.stderr}")
        return False


def run_unit_tests():
    """Run unit tests."""
    return run_command(
        ["python", "-m", "pytest", "tests/unit/", "-v", "--tb=short"],
        "Unit Tests"
    )


def run_integration_tests():
    """Run integration tests."""
    return run_command(
        ["python", "-m", "pytest", "tests/integration/", "-v", "--tb=short"],
        "Integration Tests"
    )


def run_all_tests():
    """Run all tests."""
    return run_command(
        ["python", "-m", "pytest", "tests/", "-v", "--tb=short"],
        "All Tests"
    )


def run_tests_with_coverage():
    """Run tests with coverage report."""
    success = run_command(
        ["python", "-m", "pytest", "tests/", "--cov=src/ethercalc", "--cov-report=term-missing", "--cov-report=html"],
        "Tests with Coverage"
    )
    
    if success:
        print("\n📊 Coverage report generated in htmlcov/index.html")
    
    return success


def run_linting():
    """Run code linting."""
    commands = [
        (["python", "-m", "flake8", "src/", "--max-line-length=88", "--extend-ignore=E203,W503"], "Flake8 Linting"),
        (["python", "-m", "black", "src/", "--check"], "Black Formatting Check"),
        (["python", "-m", "isort", "src/", "--check-only"], "Import Sorting Check"),
    ]
    
    results = []
    for cmd, desc in commands:
        results.append(run_command(cmd, desc))
    
    return all(results)


def run_type_checking():
    """Run type checking."""
    return run_command(
        ["python", "-m", "mypy", "src/ethercalc/", "--ignore-missing-imports"],
        "Type Checking (MyPy)"
    )


def run_security_check():
    """Run security checks."""
    # Install safety if not present
    try:
        subprocess.run(["pip", "show", "safety"], check=True, capture_output=True)
    except subprocess.CalledProcessError:
        print("Installing safety for security checks...")
        subprocess.run(["pip", "install", "safety"], check=True)
    
    return run_command(
        ["safety", "check"],
        "Security Check (Safety)"
    )


def main():
    """Main test runner function."""
    parser = argparse.ArgumentParser(description="EtherCalc Test Runner")
    parser.add_argument("--unit", action="store_true", help="Run only unit tests")
    parser.add_argument("--integration", action="store_true", help="Run only integration tests")
    parser.add_argument("--coverage", action="store_true", help="Run tests with coverage")
    parser.add_argument("--lint", action="store_true", help="Run linting checks")
    parser.add_argument("--type-check", action="store_true", help="Run type checking")
    parser.add_argument("--security", action="store_true", help="Run security checks")
    parser.add_argument("--all", action="store_true", help="Run all checks")
    parser.add_argument("--quick", action="store_true", help="Run quick test suite")
    
    args = parser.parse_args()
    
    # Change to script directory
    script_dir = Path(__file__).parent
    os.chdir(script_dir)
    
    # Activate virtual environment if it exists
    venv_activate = script_dir / "venv" / "bin" / "activate"
    if venv_activate.exists():
        print("🔧 Virtual environment detected - make sure it's activated!")
    
    print("🧪 EtherCalc Python Test Suite")
    print(f"Working directory: {os.getcwd()}")
    
    # Track results
    results = []
    
    if args.unit:
        results.append(run_unit_tests())
    elif args.integration:
        results.append(run_integration_tests())
    elif args.coverage:
        results.append(run_tests_with_coverage())
    elif args.lint:
        results.append(run_linting())
    elif args.type_check:
        results.append(run_type_checking())
    elif args.security:
        results.append(run_security_check())
    elif args.quick:
        print("\n🚀 Running Quick Test Suite...")
        results.extend([
            run_unit_tests(),
            run_linting()
        ])
    elif args.all:
        print("\n🔍 Running Complete Test Suite...")
        results.extend([
            run_unit_tests(),
            run_integration_tests(),
            run_linting(),
            run_type_checking(),
            run_tests_with_coverage()
        ])
    else:
        # Default: run all tests
        results.append(run_all_tests())
    
    # Summary
    print(f"\n{'='*60}")
    print("TEST SUMMARY")
    print(f"{'='*60}")
    
    passed = sum(results)
    total = len(results)
    
    if total == 0:
        print("No tests were run.")
        return 0
    
    print(f"Passed: {passed}/{total}")
    
    if passed == total:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"❌ {total - passed} test(s) failed!")
        return 1


if __name__ == "__main__":
    sys.exit(main())