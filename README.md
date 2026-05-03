# Daily Health Tracker

A full-stack web application for logging daily health metrics, receiving AI-powered health suggestions, and chatting with an intelligent assistant. Built with FastAPI, React, PostgreSQL, Redis, RabbitMQ, and the DeepSeek API.

## Quick Start

### Prerequisites

- Docker Engine 24+
- Docker Compose 2.24+

### Run the Application

```bash
# Clone the repository
git clone <repository-url>
cd health-tracker

# Set up environment variables
cp .env .env.local  # Edit as needed

# Build and start all services
docker compose up --build
```

The application will be available at:

| Service      | URL                                |
|--------------|------------------------------------|
| Web App      | http://localhost                   |
| API Docs     | http://localhost/api/docs          |
| RabbitMQ UI  | http://localhost:15672 (guest/guest) |

### Stop the Application

```bash
docker compose down
```

To also remove persistent volumes (deletes all data):

```bash
docker compose down -v
```

## Architecture

```
health-tracker/
├── backend/              # FastAPI Python application
│   ├── app/
│   │   ├── auth/         # User registration, login, JWT tokens
│   │   ├── logs/         # Daily health log CRUD
│   │   ├── chatbot/      # AI chat assistant (DeepSeek API)
│   │   └── suggestions/  # Background suggestion generation worker
│   └── Dockerfile
├── frontend/             # React + Vite + TailwindCSS SPA
│   ├── src/
│   │   ├── routes/       # Page components (Dashboard, DailyLog, Chat, etc.)
│   │   ├── hooks/        # React Query hooks for API data
│   │   └── api/          # Axios client with JWT interceptor
│   └── Dockerfile
├── scripts/              # Utility scripts (DB init, etc.)
├── docker-compose.yml    # Service orchestration
└── .env                  # Environment variables
```

### Services

| Service            | Role                                       |
|--------------------|--------------------------------------------|
| **PostgreSQL**     | Primary database (health logs, users, etc.)|
| **Redis**          | Caching, rate limiting, chat context       |
| **RabbitMQ**       | Async task dispatch for suggestion worker  |
| **Backend API**    | FastAPI REST API on port 8000              |
| **Suggestion Worker** | Background consumer for DeepSeek tasks  |
| **Frontend**       | Nginx-served React SPA                     |
| **Nginx**          | Reverse proxy (routes /api to backend)     |

### Communication Flow

```
Browser --> Nginx (:80)
              ├── /api/* --> Backend (:8000) --> PostgreSQL / Redis
              └── /*     --> Frontend (static files)
Backend --> RabbitMQ --> Suggestion Worker --> DeepSeek API
```

## API Documentation

Once the application is running, interactive API documentation is available at:

- **Swagger UI:** http://localhost/api/docs
- **ReDoc:** http://localhost/api/redoc

### Key Endpoints

| Method | Path              | Description              |
|--------|-------------------|--------------------------|
| POST   | /api/auth/register| Register a new user       |
| POST   | /api/auth/login   | Login and receive JWT     |
| POST   | /api/auth/refresh | Refresh access token      |
| GET    | /api/logs         | List health logs (paginated)|
| POST   | /api/logs         | Create a health log       |
| GET    | /api/chat         | Get chat history          |
| POST   | /api/chat         | Send a chat message (SSE) |
| GET    | /api/suggestions  | List suggestions          |

## Environment Variables

| Variable                     | Default                                    | Description                     |
|------------------------------|--------------------------------------------|---------------------------------|
| `DATABASE_URL`               | postgresql+asyncpg://...                   | PostgreSQL async connection URL |
| `REDIS_URL`                  | redis://redis:6379/0                       | Redis connection URL            |
| `RABBITMQ_URL`               | amqp://guest:guest@rabbitmq:5672/          | RabbitMQ connection URL         |
| `DEEPSEEK_API_KEY`           | sk-your-key-here                           | DeepSeek API key                |
| `DEEPSEEK_BASE_URL`          | https://api.deepseek.com                   | DeepSeek API base URL           |
| `JWT_SECRET_KEY`             | (required)                                 | Secret for signing access tokens|
| `JWT_REFRESH_SECRET_KEY`     | (required)                                 | Secret for signing refresh tokens|
| `ACCESS_TOKEN_EXPIRE_MINUTES`| 15                                         | Access token lifetime           |
| `REFRESH_TOKEN_EXPIRE_DAYS`  | 7                                          | Refresh token lifetime          |
| `CORS_ORIGINS`               | http://localhost:5173,...                  | Allowed CORS origins            |
| `ENVIRONMENT`                | development                                | Runtime environment             |

## Development

```bash
# Backend (local)
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend (local)
cd frontend
npm install
npm run dev
```

## Deployment

For production deployment, ensure the following:

1. Generate strong `JWT_SECRET_KEY` and `JWT_REFRESH_SECRET_KEY`
2. Set a valid `DEEPSEEK_API_KEY`
3. Change database and RabbitMQ credentials from defaults
4. Configure `CORS_ORIGINS` to match your production domain
5. Use `docker compose up --build -d` for detached mode
