from sqlalchemy.orm import Session
from api.models import TodoCreate, Priority
from database.database import todo_db
from database.db_models import get_db
from api.auth import get_password_hash


def create_sample_data():
    """Create sample todos and demo user for testing"""
    db = next(get_db())
    
    # Create demo user if it doesn't exist
    demo_user = todo_db.get_user_by_email(db, "demo@example.com")
    if not demo_user:
        demo_user_data = {
            "name": "Demo User",
            "email": "demo@example.com",
            "password": get_password_hash("password")
        }
        demo_user = todo_db.create_user(db, demo_user_data)
        print(f"Created demo user: {demo_user.email}")
    
    sample_todos = [
        {
            "title": "Review project proposal",
            "description": "Review and provide feedback on the Q1 project proposal",
            "priority": Priority.high,
            "category": "work",
            "user_id": demo_user.id
        },
        {
            "title": "Buy groceries",
            "description": "Milk, eggs, bread, and vegetables",
            "priority": Priority.medium,
            "category": "personal",
            "user_id": demo_user.id
        },
        {
            "title": "Call dentist",
            "description": "Schedule annual checkup",
            "priority": Priority.low,
            "category": "health",
            "user_id": demo_user.id
        }
    ]
    
    # Only create sample todos if none exist for the demo user
    existing_todos = todo_db.get_todos_by_user(db, demo_user.id)
    if not existing_todos:
        for todo_data in sample_todos:
            todo_db.create_todo(db, todo_data)
        print(f"Created {len(sample_todos)} sample todos for demo user")
    
    db.close()
