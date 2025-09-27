from typing import List, Optional
from datetime import datetime, date, timedelta
from sqlalchemy.orm import Session
from database.database import todo_db
from api.models import Todo, Priority


def filter_todos(
    todos: List[Todo],
    completed: Optional[bool] = None,
    priority: Optional[Priority] = None,
    category: Optional[str] = None,
    due_before: Optional[date] = None
) -> List[Todo]:
    """Apply filters to todo list"""
    filtered_todos = todos
    
    if completed is not None:
        filtered_todos = [t for t in filtered_todos if t.completed == completed]
    
    if priority is not None:
        filtered_todos = [t for t in filtered_todos if t.priority == priority]
    
    if category is not None:
        filtered_todos = [t for t in filtered_todos if t.category == category]
    
    if due_before is not None:
        filtered_todos = [t for t in filtered_todos if t.due_date and t.due_date <= due_before]
    
    return filtered_todos


def paginate_todos(todos: List[Todo], offset: int = 0, limit: Optional[int] = None) -> List[Todo]:
    """Apply pagination to todo list"""
    # Sort by creation date (newest first)
    todos.sort(key=lambda x: x.created_at, reverse=True)
    
    # Apply pagination
    if offset:
        todos = todos[offset:]
    if limit:
        todos = todos[:limit]
    
    return todos


def search_todos(
    db: Session,
    query: str,
    include_completed: bool = True,
    limit: Optional[int] = 50
) -> List[Todo]:
    """Search todos by title, description, and category"""
    query_lower = query.lower()
    todos = todo_db.get_all_todos(db)
    
    # Filter by completion status if needed
    if not include_completed:
        todos = [t for t in todos if not t.completed]
    
    # Search in title, description, and category
    matching_todos = []
    for todo in todos:
        title_match = query_lower in todo.title.lower()
        desc_match = todo.description and query_lower in todo.description.lower()
        category_match = todo.category and query_lower in todo.category.lower()
        
        if title_match or desc_match or category_match:
            matching_todos.append(todo)
    
    # Sort by relevance (title matches first)
    def relevance_score(todo):
        score = 0
        if query_lower in todo.title.lower():
            score += 3
        if todo.description and query_lower in todo.description.lower():
            score += 2
        if todo.category and query_lower in todo.category.lower():
            score += 1
        return score
    
    matching_todos.sort(key=relevance_score, reverse=True)
    
    return matching_todos[:limit] if limit else matching_todos


def get_overdue_todos(db: Session) -> List[Todo]:
    """Get todos that are past their due date"""
    today = date.today()
    todos = todo_db.get_all_todos(db)
    overdue_todos = [
        todo for todo in todos
        if todo.due_date and todo.due_date < today and not todo.completed
    ]
    return sorted(overdue_todos, key=lambda x: x.due_date)


def get_due_soon_todos(db: Session, days: int = 7) -> List[Todo]:
    """Get todos due within the specified number of days"""
    today = date.today()
    future_date = today + timedelta(days=days)
    
    todos = todo_db.get_all_todos(db)
    due_soon_todos = [
        todo for todo in todos
        if todo.due_date and today <= todo.due_date <= future_date and not todo.completed
    ]
    return sorted(due_soon_todos, key=lambda x: x.due_date)


def get_unique_categories(db: Session) -> List[str]:
    """Get all unique categories"""
    todos = todo_db.get_all_todos(db)
    categories = set(todo.category for todo in todos if todo.category)
    return sorted(list(categories))


def bulk_update_todos(db: Session, todo_ids: List[int], update_data: dict) -> dict:
    """Update multiple todos at once"""
    updated_todos = []
    errors = []
    
    for todo_id in todo_ids:
        try:
            updated_todo = todo_db.update_todo(db, todo_id, update_data)
            if updated_todo:
                updated_todos.append(todo_id)
            else:
                errors.append(f"Todo {todo_id} not found")
        except Exception as e:
            errors.append(f"Error updating todo {todo_id}: {str(e)}")
    
    return {
        "updated_count": len(updated_todos),
        "updated_todos": updated_todos,
        "errors": errors
    }


def import_todos(db: Session, todos_data: List[dict]) -> dict:
    """Import multiple todos at once"""
    imported_todos = []
    errors = []
    
    for todo_data in todos_data:
        try:
            new_todo = todo_db.create_todo(db, todo_data)
            imported_todos.append(new_todo.id)
        except Exception as e:
            title = todo_data.get("title", "Unknown")
            errors.append(f"Error importing todo '{title}': {str(e)}")
    
    return {
        "imported_count": len(imported_todos),
        "imported_todo_ids": imported_todos,
        "errors": errors
    }
