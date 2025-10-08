# Todo App

A modern full-stack application and cloud deployment capabilities.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://python.org)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg)](https://reactjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-latest-009688.svg)](https://fastapi.tiangolo.com)


## Features

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Python FastAPI + SQLAlchemy
- **Database**: PostgreSQL (production) / SQLite (development)
- **Authentication**: JWT-based authentication
- **Deployment**: AWS ECS with Terraform

## 📁 Project Structure

```text
todo-app/
├── backend/                 # Python FastAPI backend
│   ├── api/                # API routes and logic
│   ├── database/           # Database models
│   └── requirements.txt   # Python dependencies
├── frontend/               # React TypeScript frontend
│   ├── src/               # Source code
│   └── package.json       # Node.js dependencies
├── terraform/              # AWS Infrastructure
├── docker-compose.yml     # Local development
└── README.md             # This file
```

## Prerequisites

- **Docker Desktop**
- **Node.js** (v18+)
- **Python** (3.10+)

## Quick Start

### Using Docker (Recommended)

1. **Clone the repository**:

   ```bash
   git clone https://github.com/yourusername/todo-app.git
   cd todo-app
   ```

2. **Start the application**:

   ```bash
   docker-compose up --build
   ```

3. **Access the application**:

   - **Frontend**: <http://localhost:3000>
   - **Backend API**: <http://localhost:5000>
   - **API Documentation**: <http://localhost:5000/docs>

### Local Development

#### Backend Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Start development server
python -m uvicorn app:app --reload --host 0.0.0.0 --port 5000
```

#### Frontend Setup

```bash
cd frontend
npm install

# Start development server
npm run dev
```

## AWS Deployment

For AWS deployment using Terraform:

1. **Configure AWS credentials**:

   ```bash
   aws configure
   ```

2. **Deploy to AWS**:

   ```bash
   cd terraform
   ./deploy.sh dev apply
   ```

3. **Destroy infrastructure**:

   ```bash
   ./deploy.sh dev destroy
   ```

## API Endpoints

- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `GET /api/todos` - Get user's todos
- `POST /api/todos` - Create new todo
- `PUT /api/todos/{id}` - Update todo
- `DELETE /api/todos/{id}` - Delete todo

## Environment Variables

### Backend

- `DATABASE_URL` - Database connection string
- `SECRET_KEY` - JWT secret key

### Frontend

- `VITE_API_URL` - Backend API URL

## Issues

Found a bug or have a feature request? Please open an issue on GitHub.

## Support

If you found this project helpful, please give it a ⭐ on GitHub!

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
