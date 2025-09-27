# Testing Production Configuration Locally

This guide shows how to test the production Docker builds locally before deploying to AWS ECS.

## Available Configurations

### 1. Development Mode (Default)
```bash
# Standard development with hot-reload
docker compose up -d

# Access:
# - Frontend: http://localhost:3000 (Vite dev server)
# - Backend: http://localhost:5000 (Python with hot-reload)
```

### 2. Production Mode
```bash
# Test production builds individually
docker compose -f docker-compose.test.yml --profile prod up -d

# Access:
# - Frontend: http://localhost:8081 (Nginx serving static files)
# - Backend: http://localhost:5001 (Gunicorn with multiple workers)
```

### 3. ALB Simulation Mode
```bash
# Test with ALB-like routing (simulates AWS ECS deployment)
docker compose -f docker-compose.test.yml --profile alb up -d

# Access:
# - Application: http://localhost:8080 (Nginx ALB simulator)
#   - Frontend routes: / (all non-API paths)
#   - Backend routes: /api/* (proxied to backend)
```

## What Each Mode Tests

### Development Mode
- ✅ Local development workflow
- ✅ Hot-reload functionality
- ✅ API proxy through Vite dev server
- ❌ Production build issues
- ❌ Real deployment architecture

### Production Mode
- ✅ Production Docker builds
- ✅ Gunicorn with multiple workers
- ✅ Nginx serving static files with API proxy
- ✅ Environment variable handling
- ❌ Load balancer routing patterns

### ALB Simulation Mode
- ✅ All of Production Mode benefits
- ✅ ALB-like routing (exactly matches AWS ECS setup)
- ✅ Single entry point for both frontend and API
- ✅ CORS with proper domain handling
- ✅ Closest simulation to AWS deployment

## Recommended Testing Flow

1. **Development**: Use default mode for daily development
2. **Pre-deployment**: Use ALB simulation to test production behavior
3. **Troubleshooting**: Use production mode to isolate service issues

## Environment Variables

The configurations support these environment variables:

### Backend
- `ENVIRONMENT`: production/development
- `DATABASE_URL`: Database connection string
- `ALB_DNS_NAME`: ALB domain for CORS
- `FRONTEND_URL`: Frontend URL for CORS

### Frontend
- `BACKEND_URL`: Backend API URL (used by nginx proxy)
- `NODE_ENV`: production/development

## Clean Up

```bash
# Stop all services
docker compose -f docker-compose.test.yml down

# Remove all containers and images
docker compose -f docker-compose.test.yml down --rmi all
```