from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime, Date, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import enum
import os
import urllib.parse

# SQLAlchemy setup - support both SQLite (dev) and PostgreSQL (prod)
def get_database_url():
    """Construct database URL from environment variables with proper URL encoding"""
    # Check for individual database components (from AWS Secrets Manager)
    db_username = os.getenv('DB_USERNAME')
    db_password = os.getenv('DB_PASSWORD')
    db_host = os.getenv('DB_HOST')
    db_name = os.getenv('DB_NAME')
    
    if db_username and db_password and db_host and db_name:
        # URL encode the password to handle special characters
        encoded_password = urllib.parse.quote_plus(db_password)
        # Extract host and port from host string if it contains port
        if ':' in db_host:
            host_parts = db_host.split(':')
            host = host_parts[0]
            port = host_parts[1]
        else:
            host = db_host
            port = '5432'
        
        return f"postgresql://{db_username}:{encoded_password}@{host}:{port}/{db_name}"
    
    # Fallback to DATABASE_URL environment variable or SQLite
    return os.getenv('DATABASE_URL', "sqlite:///./todos.db")

DATABASE_URL = get_database_url()

if DATABASE_URL.startswith('sqlite'):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    # PostgreSQL configuration
    engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Priority enum for SQLAlchemy
class PriorityEnum(enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    urgent = "urgent"

# SQLAlchemy models
class UserDB(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class TodoDB(Base):
    __tablename__ = "todos"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    completed = Column(Boolean, default=False)
    priority = Column(Enum(PriorityEnum), default=PriorityEnum.medium)
    due_date = Column(Date, nullable=True)
    category = Column(String, nullable=True)
    user_id = Column(Integer, nullable=True)  # Added user_id for user association
    starred = Column(Boolean, default=False)  # Added starred field
    archived = Column(Boolean, default=False)  # Added archived field
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Create tables
Base.metadata.create_all(bind=engine)

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
