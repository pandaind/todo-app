#!/bin/bash

# Start Todo App - Both Backend and Frontend

echo "🚀 Starting Todo App..."
echo "================================="

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command_exists python3; then
    echo "❌ Python 3 is required but not installed."
    exit 1
fi

if ! command_exists node; then
    echo "❌ Node.js is required but not installed."
    exit 1
fi

if ! command_exists npm; then
    echo "❌ npm is required but not installed."
    exit 1
fi

echo "✅ All prerequisites are met!"
echo ""

# Start backend
echo "🔧 Starting Backend Server..."
cd backend
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate
pip install -r requirements.txt > /dev/null 2>&1

echo "Backend starting on http://localhost:5000"
python app.py &
BACKEND_PID=$!

# Start frontend
echo "⚛️  Starting Frontend Development Server..."
cd ../frontend

# Clean Vite cache to avoid permission issues
if [ -d "node_modules/.vite" ]; then
    echo "Cleaning Vite cache..."
    # Try to remove with current user permissions first
    rm -rf node_modules/.vite 2>/dev/null || {
        echo "Permission denied for some files. Trying with sudo..."
        sudo rm -rf node_modules/.vite 2>/dev/null || {
            echo "Warning: Could not clean Vite cache. This might cause startup issues."
            echo "You can manually run: sudo rm -rf frontend/node_modules/.vite"
        }
    }
fi

if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install > /dev/null 2>&1
fi

echo "Frontend starting on http://localhost:3000"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "🎉 Todo App is starting up!"
echo "================================="
echo "Frontend: http://localhost:3000"
echo "Backend API: http://localhost:5000"
echo "API Docs: http://localhost:5000/docs"
echo "Press Ctrl+C to stop both servers"

# Function to cleanup processes
cleanup() {
    echo
    echo "Stopping servers..."
    
    # Kill processes if they exist
    if kill -0 $BACKEND_PID 2>/dev/null; then
        kill $BACKEND_PID
        echo "Backend server stopped."
    fi
    
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        kill $FRONTEND_PID
        echo "Frontend server stopped."
    fi
    
    exit 0
}

# Wait for interrupt signal
trap cleanup INT

# Wait for both processes
wait
