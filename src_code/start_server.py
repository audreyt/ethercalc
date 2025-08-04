#!/usr/bin/env python3
"""
EtherCalc Python Server Startup Script
"""

import argparse
import os
import sys
import uvicorn
from pathlib import Path

# Add the src directory to the Python path
src_dir = Path(__file__).parent / "src"
sys.path.insert(0, str(src_dir))

from ethercalc.config import get_settings


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description="EtherCalc Python Server")
    parser.add_argument("--host", default="0.0.0.0", help="Host to bind to")
    parser.add_argument("--port", type=int, default=8000, help="Port to listen on") 
    parser.add_argument("--workers", type=int, default=1, help="Number of worker processes")
    parser.add_argument("--reload", action="store_true", help="Enable auto-reload for development")
    parser.add_argument("--debug", action="store_true", help="Enable debug mode")
    parser.add_argument("--redis-url", default="redis://localhost:6379/0", help="Redis URL")
    parser.add_argument("--data-dir", default="./data", help="Data directory for filesystem storage")
    
    args = parser.parse_args()
    
    # Set environment variables
    os.environ["HOST"] = args.host
    os.environ["PORT"] = str(args.port)
    os.environ["DEBUG"] = str(args.debug)
    os.environ["REDIS_URL"] = args.redis_url
    
    # Create data directory
    os.makedirs(args.data_dir, exist_ok=True)
    
    print(f"Starting EtherCalc Python server...")
    print(f"Host: {args.host}")
    print(f"Port: {args.port}")
    print(f"Workers: {args.workers}")
    print(f"Debug: {args.debug}")
    print(f"Redis: {args.redis_url}")
    print(f"Data directory: {args.data_dir}")
    print()
    
    # Configure uvicorn
    config = {
        "app": "ethercalc.main:app",
        "host": args.host,
        "port": args.port,
        "workers": 1 if args.reload or args.debug else args.workers,
        "reload": args.reload or args.debug,
        "access_log": True,
        "loop": "asyncio",
        "interface": "asgi3"
    }
    
    if args.debug:
        config["log_level"] = "debug"
    
    try:
        uvicorn.run(**config)
    except KeyboardInterrupt:
        print("\nShutdown requested by user")
    except Exception as e:
        print(f"Error starting server: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()