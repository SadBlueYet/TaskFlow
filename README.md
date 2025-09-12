# Task Flow

A Trello-like project built with FastAPI, SQLAlchemy, PostgreSQL, and React.

## Project Structure
```
trello/
├── backend/              # FastAPI backend
│   ├── alembic/         # Database migrations
│   ├── app/             # Backend application
│   │   ├── api/         # API endpoints
│   │   ├── core/        # Core functionality
│   │   ├── crud/        # CRUD operations
│   │   ├── db/          # Database
│   │   ├── models/      # SQLAlchemy models
│   │   └── schemas/     # Pydantic models
│   └── tests/           # Backend tests
├── frontend/            # React frontend
│   ├── public/          # Static files
│   └── src/             # React application
├── docker-compose.yml   # Docker configuration
└── .env                 # Environment variables
```

## Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL
- Redis
- Docker (optional)

## Setup

### Using Docker (Recommended)

1. Copy `.env.example` to `.env` and update the values if needed
2. Start the services:
```bash
docker-compose up -d
```

### Manual Setup

1. Create a PostgreSQL database
2. Copy `.env.example` to `.env` and update the values:
```
POSTGRES_SERVER=localhost
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=trello
POSTGRES_PORT=5432
```

3. Backend setup:
```bash
cd backend
pdm install
source .venv/bin/activate
alembic upgrade head
uvicorn app.main:app --reload
```

4. Frontend setup:
```bash
cd frontend
npm install
npm run dev
```

## Features

- User authentication with JWT
- Board management
- List management
- Card management with assignees
- Drag and drop interface
- Real-time updates using WebSocket
- Redis for caching and real-time features

## Development

- Backend API documentation: http://localhost:8000/docs
- Frontend development server: http://localhost:5173
