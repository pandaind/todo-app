from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List, Optional
from datetime import datetime, date
from sqlalchemy.orm import Session
from api.models import Todo, TodoCreate, TodoUpdate, TodoStats, BulkUpdateRequest, Priority
from database.database import todo_db
from database.db_models import get_db
from api.auth import get_current_user
from api.utils import (
    filter_todos, paginate_todos, search_todos, get_overdue_todos,
    get_due_soon_todos, get_unique_categories, bulk_update_todos, import_todos
)

router = APIRouter()


@router.post(
    "/todos",
    response_model=Todo,
    tags=["Todos"],
    summary="Create a new todo",
    description="""
    Create a new todo item for the authenticated user.
    
    **Authentication Required**: This endpoint requires a valid JWT token.
    The todo will be automatically associated with the authenticated user.
    """,
    responses={
        200: {
            "description": "Created todo",
            "content": {
                "application/json": {
                    "example": {
                        "id": 1,
                        "title": "Buy groceries",
                        "description": "Milk, Bread, Eggs",
                        "completed": False,
                        "priority": "medium",
                        "due_date": "2025-08-05",
                        "category": "Shopping",
                        "created_at": "2025-08-01T10:00:00",
                        "updated_at": "2025-08-03T12:00:00"
                    }
                }
            }
        },
        422: {
            "description": "Validation Error",
            "content": {
                "application/json": {
                    "example": {"detail": [{"loc": ["body", "title"], "msg": "field required", "type": "value_error.missing"}]}
                }
            }
        }
    }
)
def create_todo(todo: TodoCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Create a new todo for the current user"""
    todo_data = todo.dict()
    # Automatically set the user_id to the current user
    todo_data["user_id"] = current_user.id
    return todo_db.create_todo(db, todo_data)


@router.get(
    "/todos",
    response_model=List[Todo],
    tags=["Todos"],
    summary="Get all todos",
    description="""
    Get todos for the authenticated user with optional filters and pagination.
    
    **Authentication Required**: This endpoint requires a valid JWT token.
    Only returns todos belonging to the authenticated user.
    """,
    responses={
        200: {
            "description": "List of todos",
            "content": {
                "application/json": {
                    "example": [
                        {
                            "id": 1,
                            "title": "Buy groceries",
                            "description": "Milk, Bread, Eggs",
                            "completed": False,
                            "priority": "medium",
                            "due_date": "2025-08-05",
                            "category": "Shopping",
                            "created_at": "2025-08-01T10:00:00",
                            "updated_at": "2025-08-03T12:00:00"
                        }
                    ]
                }
            }
        }
    }
)
def get_todos(
    completed: Optional[bool] = Query(None, description="Filter by completion status"),
    priority: Optional[Priority] = Query(None, description="Filter by priority"),
    category: Optional[str] = Query(None, description="Filter by category"),
    due_before: Optional[date] = Query(None, description="Filter by due date before this date"),
    limit: Optional[int] = Query(None, ge=1, le=100, description="Limit number of results"),
    offset: Optional[int] = Query(0, ge=0, description="Offset for pagination"),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Get todos for the current user with optional filters and pagination"""
    # Get todos only for the current user
    todos = todo_db.get_todos_by_user(db, current_user.id)
    
    # Apply filters
    todos = filter_todos(todos, completed, priority, category, due_before)
    
    # Apply pagination
    return paginate_todos(todos, offset, limit)


@router.get(
    "/todos/{todo_id}",
    response_model=Todo,
    tags=["Todos"],
    summary="Get a specific todo",
    description="Get a specific todo by ID.",
    responses={
        200: {
            "description": "A todo",
            "content": {
                "application/json": {
                    "example": {
                        "id": 1,
                        "title": "Buy groceries",
                        "description": "Milk, Bread, Eggs",
                        "completed": False,
                        "priority": "medium",
                        "due_date": "2025-08-05",
                        "category": "Shopping",
                        "created_at": "2025-08-01T10:00:00",
                        "updated_at": "2025-08-03T12:00:00"
                    }
                }
            }
        },
        404: {
            "description": "Todo not found",
            "content": {
                "application/json": {
                    "example": {"detail": "Todo not found"}
                }
            }
        }
    }
)
def get_todo(todo_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Get a specific todo by ID for the current user"""
    todo = todo_db.get_todo(db, todo_id)
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    
    # Check if todo belongs to current user
    if todo.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return todo


@router.put(
    "/todos/{todo_id}",
    response_model=Todo,
    tags=["Todos"],
    summary="Update a specific todo",
    description="Update a specific todo by ID.",
    responses={
        200: {
            "description": "Updated todo",
            "content": {
                "application/json": {
                    "example": {
                        "id": 1,
                        "title": "Buy groceries",
                        "description": "Milk, Bread, Eggs, Butter",
                        "completed": False,
                        "priority": "high",
                        "due_date": "2025-08-06",
                        "category": "Shopping",
                        "created_at": "2025-08-01T10:00:00",
                        "updated_at": "2025-08-04T12:00:00"
                    }
                }
            }
        },
        404: {
            "description": "Todo not found",
            "content": {
                "application/json": {
                    "example": {"detail": "Todo not found"}
                }
            }
        }
    }
)
def update_todo(todo_id: int, todo_update: TodoUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Update a specific todo for the current user"""
    todo = todo_db.get_todo(db, todo_id)
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    
    # Check if todo belongs to current user
    if todo.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    update_data = todo_update.dict(exclude_unset=True)
    updated_todo = todo_db.update_todo(db, todo_id, update_data)
    return updated_todo


@router.delete(
    "/todos/{todo_id}",
    tags=["Todos"],
    summary="Delete a specific todo",
    description="Delete a specific todo by ID.",
    responses={
        200: {
            "description": "Todo deleted",
            "content": {
                "application/json": {
                    "example": {"message": "Todo 'Buy groceries' deleted successfully"}
                }
            }
        },
        404: {
            "description": "Todo not found",
            "content": {
                "application/json": {
                    "example": {"detail": "Todo not found"}
                }
            }
        }
    }
)
def delete_todo(todo_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Delete a specific todo for the current user"""
    todo = todo_db.get_todo(db, todo_id)
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    
    # Check if todo belongs to current user
    if todo.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    deleted_todo = todo_db.delete_todo(db, todo_id)
    return {"message": f"Todo '{deleted_todo.title}' deleted successfully"}


@router.get(
    "/todos/completed/{completed}",
    response_model=List[Todo],
    tags=["Todos"],
    summary="Get todos by completion status",
    description="Get todos filtered by completion status.",
    responses={
        200: {
            "description": "List of todos",
            "content": {
                "application/json": {
                    "example": [
                        {
                            "id": 1,
                            "title": "Buy groceries",
                            "description": "Milk, Bread, Eggs",
                            "completed": True,
                            "priority": "medium",
                            "due_date": "2025-08-05",
                            "category": "Shopping",
                            "created_at": "2025-08-01T10:00:00",
                            "updated_at": "2025-08-03T12:00:00"
                        }
                    ]
                }
            }
        }
    }
)
def get_todos_by_status(completed: bool, db: Session = Depends(get_db)):
    """Get todos filtered by completion status"""
    todos = todo_db.get_all_todos(db)
    return [todo for todo in todos if todo.completed == completed]


@router.get(
    "/statistics",
    response_model=TodoStats,
    tags=["Statistics"],
    summary="Get todo statistics",
    description="Get comprehensive todo statistics.",
    responses={
        200: {
            "description": "Todo statistics",
            "content": {
                "application/json": {
                    "example": {
                        "total": 10,
                        "completed": 5,
                        "pending": 5,
                        "overdue": 2,
                        "due_soon": 3
                    }
                }
            }
        }
    }
)
def get_statistics(db: Session = Depends(get_db)):
    """Get comprehensive todo statistics"""
    return todo_db.get_stats(db)


@router.post(
    "/todos/bulk-update",
    response_model=List[Todo],
    tags=["Bulk Operations"],
    summary="Bulk update todos",
    description="Update multiple todos at once by providing a list of todo IDs and the fields to update.",
    responses={
        200: {
            "description": "List of updated todos",
            "content": {
                "application/json": {
                    "example": [
                        {
                            "id": 1,
                            "title": "Buy groceries",
                            "description": "Milk, Bread, Eggs",
                            "completed": False,
                            "priority": "medium",
                            "due_date": "2025-08-05",
                            "category": "Shopping",
                            "created_at": "2025-08-01T10:00:00",
                            "updated_at": "2025-08-03T12:00:00"
                        }
                    ]
                }
            }
        }
    }
)
def bulk_update(bulk_request: BulkUpdateRequest = Depends(), db: Session = Depends(get_db)):
    """Update multiple todos at once"""
    update_data = bulk_request.updates.dict(exclude_unset=True)
    return bulk_update_todos(db, bulk_request.todo_ids, update_data)


@router.get(
    "/search",
    response_model=List[Todo],
    tags=["Search"],
    summary="Search todos",
    description="Search todos by title, description, and category.",
    responses={
        200: {
            "description": "List of todos matching the search query",
            "content": {
                "application/json": {
                    "example": [
                        {
                            "id": 2,
                            "title": "Finish project report",
                            "description": "Complete the final draft and send to manager",
                            "completed": False,
                            "priority": "high",
                            "due_date": "2025-08-10",
                            "category": "Work",
                            "created_at": "2025-08-01T09:00:00",
                            "updated_at": "2025-08-03T11:00:00"
                        }
                    ]
                }
            }
        }
    }
)
def search(
    q: str = Query(..., min_length=1, description="Search query"),
    include_completed: bool = Query(True, description="Include completed todos in search"),
    limit: Optional[int] = Query(50, ge=1, le=100, description="Limit number of results"),
    db: Session = Depends(get_db)
):
    """Search todos by title, description, and category"""
    return search_todos(db, q, include_completed, limit)


@router.get(
    "/categories",
    response_model=List[str],
    tags=["Metadata"],
    summary="Get all unique categories",
    description="Get all unique categories.",
    responses={
        200: {
            "description": "List of categories",
            "content": {
                "application/json": {
                    "example": ["Shopping", "Work", "Personal"]
                }
            }
        }
    }
)
def get_categories(db: Session = Depends(get_db)):
    """Get all unique categories"""
    return get_unique_categories(db)


@router.get(
    "/priorities",
    response_model=List[str],
    tags=["Metadata"],
    summary="Get all available priority levels",
    description="Get all available priority levels.",
    responses={
        200: {
            "description": "List of priorities",
            "content": {
                "application/json": {
                    "example": ["low", "medium", "high", "urgent"]
                }
            }
        }
    }
)
def get_priorities():
    """Get all available priority levels"""
    return [priority.value for priority in Priority]


@router.get(
    "/todos/overdue",
    response_model=List[Todo],
    tags=["Date Queries"],
    summary="Get overdue todos",
    description="Get todos that are past their due date.",
    responses={
        200: {
            "description": "List of overdue todos",
            "content": {
                "application/json": {
                    "example": [
                        {
                            "id": 3,
                            "title": "Pay electricity bill",
                            "description": "Due last week",
                            "completed": False,
                            "priority": "urgent",
                            "due_date": "2025-07-27",
                            "category": "Bills",
                            "created_at": "2025-07-01T10:00:00",
                            "updated_at": "2025-07-28T12:00:00"
                        }
                    ]
                }
            }
        }
    }
)
def get_overdue(db: Session = Depends(get_db)):
    """Get todos that are past their due date"""
    return get_overdue_todos(db)


@router.get(
    "/todos/due-soon",
    response_model=List[Todo],
    tags=["Date Queries"],
    summary="Get todos due soon",
    description="Get todos due within the specified number of days.",
    responses={
        200: {
            "description": "List of todos due soon",
            "content": {
                "application/json": {
                    "example": [
                        {
                            "id": 4,
                            "title": "Submit tax documents",
                            "description": "Due in 3 days",
                            "completed": False,
                            "priority": "high",
                            "due_date": "2025-08-06",
                            "category": "Finance",
                            "created_at": "2025-08-01T10:00:00",
                            "updated_at": "2025-08-03T12:00:00"
                        }
                    ]
                }
            }
        }
    }
)
def get_due_soon(days: int = Query(7, ge=1, le=30, description="Number of days to look ahead"), db: Session = Depends(get_db)):
    """Get todos due within the specified number of days"""
    return get_due_soon_todos(db, days)


@router.post(
    "/todos/import",
    response_model=List[Todo],
    tags=["Import/Export"],
    summary="Import todos",
    description="Import multiple todos at once.",
    responses={
        200: {
            "description": "List of imported todos",
            "content": {
                "application/json": {
                    "example": [
                        {
                            "id": 5,
                            "title": "Read a book",
                            "description": "Start reading 'Atomic Habits'",
                            "completed": False,
                            "priority": "low",
                            "due_date": "2025-08-15",
                            "category": "Personal",
                            "created_at": "2025-08-03T10:00:00",
                            "updated_at": "2025-08-03T10:00:00"
                        }
                    ]
                }
            }
        }
    }
)
def import_todos_endpoint(todos: List[TodoCreate], db: Session = Depends(get_db)):
    """Import multiple todos at once"""
    todos_data = [todo.dict() for todo in todos]
    return import_todos(db, todos_data)


@router.get(
    "/export",
    response_model=List[Todo],
    tags=["Import/Export"],
    summary="Export all todos",
    description="Export all todos.",
    responses={
        200: {
            "description": "List of all todos",
            "content": {
                "application/json": {
                    "example": [
                        {
                            "id": 1,
                            "title": "Buy groceries",
                            "description": "Milk, Bread, Eggs",
                            "completed": False,
                            "priority": "medium",
                            "due_date": "2025-08-05",
                            "category": "Shopping",
                            "created_at": "2025-08-01T10:00:00",
                            "updated_at": "2025-08-03T12:00:00"
                        }
                    ]
                }
            }
        }
    }
)
def export_todos(db: Session = Depends(get_db)):
    """Export all todos"""
    return todo_db.get_all_todos(db)


@router.delete(
    "/todos",
    tags=["Bulk Operations"],
    summary="Clear all todos",
    description="Clear all todos (use with caution!)",
    responses={
        200: {
            "description": "Todos cleared",
            "content": {
                "application/json": {
                    "example": {"message": "Cleared 10 todos"}
                }
            }
        }
    }
)
def clear_all_todos(db: Session = Depends(get_db)):
    """Clear all todos (use with caution!)"""
    count = todo_db.clear_all(db)
    return {"message": f"Cleared {count} todos"}

