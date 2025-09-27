#!/usr/bin/env python3
"""
Unified server that runs both FastAPI app and MCP server on the same port.
"""

import uvicorn
from fastapi import FastAPI
from datetime import datetime
import httpx
from fastmcp import FastMCP
from starlette.requests import Request
from starlette.responses import PlainTextResponse
from db_models import SessionLocal
from routes import router
from sample_data import create_sample_data

# Create FastAPI app
app = FastAPI(
    title="Intelligent Todo API with MCP", 
    description="A comprehensive todo application with advanced AI features and MCP integration",
    version="1.0.0"
)

# Include the todo routes
app.include_router(router)

@app.get("/", tags=["General"])
def read_root():
    return {"message": "Intelligent Todo API with MCP is running", "version": "1.0.0"}

@app.get("/health", tags=["General"])
def health_check():
    """Health check endpoint"""
    db = SessionLocal()
    try:
        # Simple database connectivity check
        from database import todo_db
        todos = todo_db.get_all_todos(db)
        todo_count = len(todos)
    except Exception:
        todo_count = 0
    finally:
        db.close()
    
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "todo_count": todo_count,
        "version": "2.0.0"
    }

# Create MCP server instance
mcp = FastMCP("Intelligent Todo MCP Server")

@mcp.custom_route("/mcp-health", methods=["GET"])
async def mcp_health_check(request: Request) -> PlainTextResponse:
    return PlainTextResponse("MCP Server OK")

@mcp.tool(name="get_all_tasks", description="get all tasks from the todo database")
def get_todo():
    """Fetches all todos from the database."""
    db = SessionLocal()
    try:
        from database import todo_db
        todos = todo_db.get_all_todos(db)
    except Exception:
        todos = []
    finally:
        db.close()
    return todos

@mcp.tool(name="get_todo_by_id", description="get a todo by its ID")
def get_todo_by_id(todo_id: int) -> dict:
    """Fetches a todo by its ID."""
    db = SessionLocal()
    try:
        from database import todo_db
        todo = todo_db.get_todo_by_id(db, todo_id)
    except Exception:
        todo = {}
    finally:
        db.close()
    return todo

@mcp.resource("request://structures")
def get_sample_requests() -> dict:
    """Samples for request json structures"""
    return {
        "create_todo": {
            "title": "Buy groceries",
            "description": "Milk, Bread, Eggs",
            "priority": "medium",
            "due_date": "2025-08-05",
            "category": "Shopping"
        },
        "update_todo": {
            "title": "Buy groceries and fruits",
            "description": "Milk, Bread, Eggs, Apples",
            "priority": "high",
            "due_date": "2025-08-06",
            "category": "Shopping"
        },
        "bulk_update": {
            "todo_ids": [1, 2],
            "updates": {
                "priority": "urgent",
                "completed": True
            }
        },
        "import_todos": [
            {
                "title": "Read a book",
                "description": "Start reading 'Atomic Habits'",
                "priority": "low",
                "due_date": "2025-08-15",
                "category": "Personal"
            },
            {
                "title": "Finish project report",
                "description": "Complete the final draft and send to manager",
                "priority": "high",
                "due_date": "2025-08-10",
                "category": "Work"
            }
        ],
        "search_todos": {
            "q": "project",
            "include_completed": True,
            "limit": 10
        }
    }

# Mount MCP server as a sub-application
app.mount("/mcp", mcp)

if __name__ == "__main__":
    # Create sample data
    create_sample_data()
    
    print("Starting unified server with both FastAPI and MCP on port 8000...")
    print("FastAPI endpoints available at: http://localhost:8000")
    print("MCP endpoints available at: http://localhost:8000/mcp")
    print("API documentation at: http://localhost:8000/docs")
    
    uvicorn.run(app, host="localhost", port=8000, log_level="info")
