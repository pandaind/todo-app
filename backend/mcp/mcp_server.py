import httpx
from fastmcp import FastMCP
from starlette.requests import Request
from starlette.responses import PlainTextResponse
from db_models import SessionLocal

from app import app

client = httpx.AsyncClient(base_url="http://localhost:8000")
spec = httpx.get("http://localhost:8000/openapi.json").json()
mcp = FastMCP.from_openapi(openapi_spec=spec, client=client)

if __name__ == "__main__":
    mcp.run(
        transport="http",
        host="localhost",
        port=4200,
        path="/todo-mcp/http",
        log_level="debug",
    )

# mcp = FastMCP("Intelligent Todo MCP Server")


@mcp.custom_route("/health", methods=["GET"])
async def health_check(request: Request) -> PlainTextResponse:
    return PlainTextResponse("OK")

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
                "completed": true
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
            "include_completed": true,
            "limit": 10
        }
    }

if __name__ == "__main__":
    mcp.run(
        transport="http",
        host="localhost",
        port=4200,
        path="/todo-mcp/http",
        log_level="debug",
    )