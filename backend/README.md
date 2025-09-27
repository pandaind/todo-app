# Todo App Backend

This is the FastAPI backend for the Smart Todos application.

## Structure

```
backend/
├── app.py                    # Main FastAPI application entry point
├── requirements.txt          # Python dependencies
├── api/                      # API layer
│   ├── __init__.py
│   ├── routes.py            # API route handlers
│   ├── models.py            # Pydantic models and data schemas
│   └── utils.py             # Utility functions for data processing
├── database/                 # Database layer
│   ├── __init__.py
│   ├── database.py          # Database operations and business logic
│   ├── db_models.py         # SQLAlchemy models and database setup
│   ├── sample_data.py       # Sample data creation
│   └── todos.db             # SQLite database file (created on first run)
└── mcp/                      # MCP (Model Context Protocol) server
    ├── __init__.py
    ├── mcp_server.py        # MCP server implementation
    ├── unified_server.py    # Unified server
    └── mcp.json             # MCP configuration
```

## Features

- **CRUD Operations**: Create, read, update, and delete todos
- **Advanced Filtering**: Filter by completion status, priority, category, and due date
- **Search Functionality**: Search across title, description, and category
- **Statistics**: Comprehensive statistics including completion rates and breakdowns
- **Bulk Operations**: Update multiple todos at once
- **Import/Export**: Import and export todo data
- **Date Management**: Due date tracking with overdue and due-soon queries
- **Categories and Priorities**: Organize todos with categories and priority levels
- **SQLite Database**: Persistent data storage with SQLAlchemy ORM
- **MCP Integration**: Model Context Protocol server for AI integration

## Technology Stack

- **FastAPI**: Modern, fast web framework for building APIs
- **SQLAlchemy**: SQL toolkit and Object-Relational Mapping (ORM)
- **SQLite**: Lightweight, file-based database
- **Pydantic**: Data validation using Python type hints
- **Uvicorn**: ASGI web server implementation

## Installation

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Running the Backend

1. Start the FastAPI server:
   ```bash
   python app.py
   ```

2. The API will be available at:
   - Main API: `http://localhost:8000`
   - Interactive API docs: `http://localhost:8000/docs`
   - Alternative docs: `http://localhost:8000/redoc`

## API Endpoints

### Basic CRUD
- `POST /todos` - Create a new todo
- `GET /todos` - Get all todos with optional filtering
- `GET /todos/{id}` - Get a specific todo
- `PUT /todos/{id}` - Update a specific todo
- `DELETE /todos/{id}` - Delete a specific todo

### Advanced Features
- `GET /search` - Search todos by text
- `GET /statistics` - Get todo statistics
- `POST /todos/bulk-update` - Update multiple todos
- `GET /todos/overdue` - Get overdue todos
- `GET /todos/due-soon` - Get todos due soon
- `GET /categories` - Get all categories
- `GET /priorities` - Get all priority levels
- `POST /todos/import` - Import multiple todos
- `GET /export` - Export all todos
- `DELETE /todos` - Clear all todos

### Utility Endpoints
- `GET /` - API information
- `GET /health` - Health check

## Environment Variables

You can configure the following environment variables:

- `DATABASE_URL`: SQLite database path (default: `database/todos.db`)
- `PORT`: Server port (default: `8000`)
- `HOST`: Server host (default: `localhost`)

## Development

The application is organized into separate modules for maintainability:

- **api/models.py**: Contains all Pydantic models for data validation and API schemas
- **database/db_models.py**: SQLAlchemy models and database configuration
- **database/database.py**: Database layer with CRUD operations and business logic
- **api/routes.py**: FastAPI router with all API endpoint handlers organized by tags
- **api/utils.py**: Utility functions for filtering, searching, and data processing
- **database/sample_data.py**: Creates sample data for testing and development
- **app.py**: Main application entry point that ties everything together

This modular structure makes the code more maintainable, testable, and follows FastAPI best practices.

## MCP Integration

The backend includes a complete MCP (Model Context Protocol) server implementation featuring:

- **Tools**: Direct API interactions for todo management
- **Prompts**: AI-powered daily planning and productivity coaching
- **Resources**: Structured data access and export capabilities
- **Sampling**: Context-aware AI conversations

See the MCP directory for more details on the MCP server implementation.
