from typing import Dict, List, Optional
from datetime import datetime

import mcp
from sqlalchemy.orm import Session
from api.models import Todo, TodoStats, Priority
from database.db_models import TodoDB, UserDB, PriorityEnum, get_db


def convert_priority_to_enum(priority: Priority) -> PriorityEnum:
    """Convert Pydantic Priority to SQLAlchemy PriorityEnum"""
    return PriorityEnum(priority.value)


def convert_enum_to_priority(priority_enum: PriorityEnum) -> Priority:
    """Convert SQLAlchemy PriorityEnum to Pydantic Priority"""
    return Priority(priority_enum.value)


def db_todo_to_pydantic(db_todo: TodoDB) -> Todo:
    """Convert SQLAlchemy TodoDB to Pydantic Todo"""
    return Todo(
        id=db_todo.id,
        title=db_todo.title,
        description=db_todo.description,
        completed=db_todo.completed,
        priority=convert_enum_to_priority(db_todo.priority),
        due_date=db_todo.due_date,
        category=db_todo.category,
        user_id=db_todo.user_id,
        starred=db_todo.starred,
        archived=db_todo.archived,
        created_at=db_todo.created_at,
        updated_at=db_todo.updated_at
    )


class TodoDatabase:
    def __init__(self):
        pass

    def create_todo(self, db: Session, todo_data: dict) -> Todo:
        # Convert priority if present
        if "priority" in todo_data:
            todo_data["priority"] = convert_priority_to_enum(todo_data["priority"])
        
        db_todo = TodoDB(**todo_data)
        db.add(db_todo)
        db.commit()
        db.refresh(db_todo)
        return db_todo_to_pydantic(db_todo)

    def get_todo(self, db: Session, todo_id: int) -> Optional[Todo]:
        db_todo = db.query(TodoDB).filter(TodoDB.id == todo_id).first()
        return db_todo_to_pydantic(db_todo) if db_todo else None


    def get_all_todos(self, db: Session) -> List[Todo]:
        db_todos = db.query(TodoDB).all()
        return [db_todo_to_pydantic(db_todo) for db_todo in db_todos]

    def get_todos_by_user(self, db: Session, user_id: int) -> List[Todo]:
        """Get all todos for a specific user"""
        db_todos = db.query(TodoDB).filter(TodoDB.user_id == user_id).all()
        return [db_todo_to_pydantic(db_todo) for db_todo in db_todos]

    def update_todo(self, db: Session, todo_id: int, update_data: dict) -> Optional[Todo]:
        db_todo = db.query(TodoDB).filter(TodoDB.id == todo_id).first()
        if not db_todo:
            return None
        
        # Convert priority if present
        if "priority" in update_data:
            update_data["priority"] = convert_priority_to_enum(update_data["priority"])
        
        # Update fields
        for field, value in update_data.items():
            setattr(db_todo, field, value)
        
        db_todo.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_todo)
        return db_todo_to_pydantic(db_todo)

    def delete_todo(self, db: Session, todo_id: int) -> Optional[Todo]:
        db_todo = db.query(TodoDB).filter(TodoDB.id == todo_id).first()
        if not db_todo:
            return None
        
        todo_to_return = db_todo_to_pydantic(db_todo)
        db.delete(db_todo)
        db.commit()
        return todo_to_return

    def clear_all(self, db: Session) -> int:
        count = db.query(TodoDB).count()
        db.query(TodoDB).delete()
        db.commit()
        return count

    def get_stats(self, db: Session) -> TodoStats:
        """Calculate todo statistics"""
        todos = self.get_all_todos(db)
        total = len(todos)
        completed = len([t for t in todos if t.completed])
        pending = total - completed
        
        by_priority = {}
        for priority in Priority:
            by_priority[priority.value] = len([t for t in todos if t.priority == priority])
        
        by_category = {}
        categories = set(t.category for t in todos if t.category)
        for category in categories:
            by_category[category] = len([t for t in todos if t.category == category])
        
        completion_rate = (completed / total * 100) if total > 0 else 0
        
        return TodoStats(
            total=total,
            completed=completed,
            pending=pending,
            by_priority=by_priority,
            by_category=by_category,
            completion_rate=round(completion_rate, 2)
        )

    def create_user(self, db: Session, user_data: dict):
        """Create a new user"""
        db_user = UserDB(**user_data)
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user

    def get_user_by_email(self, db: Session, email: str):
        """Get user by email"""
        return db.query(UserDB).filter(UserDB.email == email).first()

    def get_user_by_id(self, db: Session, user_id: int):
        """Get user by ID"""
        return db.query(UserDB).filter(UserDB.id == user_id).first()


# Global database instance
todo_db = TodoDatabase()
