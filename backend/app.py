from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from datetime import datetime
import uvicorn
import os
from api.routes import router
from api.auth import router as auth_router
from api.ai import router as ai_router
from database.sample_data import create_sample_data

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title="Intelligent Todo API",
        version="1.0.0",
        description="""
        A comprehensive todo application with advanced AI features and JWT authentication.
        
        ## Authentication
        
        This API uses JWT (JSON Web Token) authentication. To access protected endpoints:
        
        1. **Sign up** for a new account using `/auth/signup`
        2. **Login** using `/auth/login` to get an access token
        3. **Include the token** in the Authorization header: `Authorization: Bearer <your_token>`
        
        ## Features
        
        - User registration and authentication
        - CRUD operations for todos
        - AI-powered todo suggestions
        - Task filtering and search
        - Due date management
        
        ## Security
        
        All todo operations require authentication. Users can only access their own todos.
        """,
        routes=app.routes,
    )
    
    # Add security scheme for JWT
    openapi_schema["components"]["securitySchemes"] = {
        "Bearer": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "description": "Enter your JWT token. You can get this from the login endpoint."
        }
    }
    
    # Add security requirement to protected endpoints
    for path, methods in openapi_schema["paths"].items():
        # Skip auth endpoints from requiring authentication
        if "/auth/" in path:
            continue
            
        for method, operation in methods.items():
            if method in ["post", "put", "delete", "get"] and path not in ["/", "/health"]:
                operation["security"] = [{"Bearer": []}]
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app = FastAPI(
    title="Intelligent Todo API", 
    description="A comprehensive todo application with advanced AI features",
    version="1.0.0"
)

app.openapi = custom_openapi

# Add CORS middleware
allowed_origins = [
    "http://localhost:3000", 
    "http://localhost:5173",  # React dev servers
]

# Add production origin if FRONTEND_URL is set
frontend_url = os.getenv('FRONTEND_URL')
if frontend_url:
    allowed_origins.append(frontend_url)

# Add ALB origin if ALB_DNS_NAME is set  
alb_dns_name = os.getenv('ALB_DNS_NAME')
if alb_dns_name:
    allowed_origins.extend([
        f"http://{alb_dns_name}",
        f"https://{alb_dns_name}"
    ])

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routers with API prefix
app.include_router(router, prefix="/api")
app.include_router(auth_router, prefix="/api/auth")
app.include_router(ai_router, prefix="/api")

@app.get("/", tags=["General"])
def read_root():
    return {"message": "Intelligent Todo API is running", "version": "1.0.0"}

@app.get("/api/health", tags=["General"])
def health_check():
    """Health check endpoint"""
    from database.db_models import SessionLocal
    from database.database import todo_db
    db = SessionLocal()
    try:
        # Simple database connectivity check
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

if __name__ == "__main__":
    # Create sample data
    create_sample_data()
    
    uvicorn.run(app, host="0.0.0.0", port=5000)