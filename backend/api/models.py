from datetime import datetime, date
from enum import Enum
from typing import List, Optional, Dict

from pydantic import BaseModel, Field


class Priority(str, Enum):
    """Priority levels for todos."""
    low = "low"
    medium = "medium"
    high = "high"
    urgent = "urgent"


class TodoCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    priority: Priority = Priority.medium
    due_date: Optional[date] = None
    category: Optional[str] = Field(None, max_length=50)
    user_id: Optional[int] = None
    starred: bool = False


class TodoUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    completed: Optional[bool] = None
    priority: Optional[Priority] = None
    due_date: Optional[date] = None
    category: Optional[str] = Field(None, max_length=50)
    starred: Optional[bool] = None
    archived: Optional[bool] = None


class Todo(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    completed: bool = False
    priority: Priority = Priority.medium
    due_date: Optional[date] = None
    category: Optional[str] = None
    user_id: Optional[int] = None
    starred: bool = False
    archived: bool = False
    created_at: datetime
    updated_at: datetime


class TodoStats(BaseModel):
    total: int
    completed: int
    pending: int
    by_priority: Dict[str, int]
    by_category: Dict[str, int]
    completion_rate: float


class BulkUpdateRequest(BaseModel):
    todo_ids: List[int]
    updates: TodoUpdate
