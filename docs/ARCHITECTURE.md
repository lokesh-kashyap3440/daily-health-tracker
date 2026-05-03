# Daily Health Tracker -- System Architecture Document

> **Version:** 1.0  
> **Author:** System Architecture Team  
> **Last Updated:** 2026-05-03

---

## Table of Contents

1. [System Architecture](#1-system-architecture)
2. [Backend Architecture](#2-backend-architecture)
3. [Frontend Architecture](#3-frontend-architecture)
4. [Data Architecture](#4-data-architecture)
5. [Security Architecture](#5-security-architecture)
6. [Deployment Architecture](#6-deployment-architecture)
7. [Key Design Decisions](#7-key-design-decisions)

---

## 1. System Architecture

### 1.1 Overview

The Daily Health Tracker is a full-stack web application that allows users to log daily health metrics, receive AI-powered suggestions via a chatbot interface, and visualise trends on a dashboard. The system follows a **microservices-inspired monorepo** pattern: a single codebase containing four logical services that share a common database but are independently deployable and communicate over REST and a message broker.

### 1.2 Monorepo Structure

```
health-tracker/
├── backend/
│   ├── app/
│   │   ├── main.py                    # FastAPI application entry point
│   │   ├── core/
│   │   │   ├── config.py             # Application settings (pydantic-settings)
│   │   │   ├── security.py           # JWT, password hashing, CORS
│   │   │   ├── dependencies.py       # FastAPI dependency injection
│   │   │   ├── middleware.py         # Rate limiting, logging middleware
│   │   │   ├── database.py          # SQLAlchemy async engine + session
│   │   │   ├── redis.py             # Redis client singleton
│   │   │   └── rabbitmq.py          # RabbitMQ connection / publisher
│   │   ├── auth/
│   │   │   ├── router.py            # /auth/register, /auth/login, /auth/refresh
│   │   │   ├── service.py           # Business logic for auth
│   │   │   ├── models.py            # SQLAlchemy User model
│   │   │   └── schemas.py           # Pydantic request/response schemas
│   │   ├── logs/
│   │   │   ├── router.py            # /logs/ CRUD endpoints
│   │   │   ├── service.py           # Business logic for health logs
│   │   │   ├── models.py            # SQLAlchemy HealthLog model
│   │   │   └── schemas.py           # Pydantic schemas
│   │   ├── chatbot/
│   │   │   ├── router.py            # /chat/ endpoints
│   │   │   ├── service.py           # Chat orchestration
│   │   │   ├── client.py            # DeepSeek API async client
│   │   │   └── schemas.py           # Chat request/response schemas
│   │   ├── suggestions/
│   │   │   ├── router.py            # /suggestions/ endpoints
│   │   │   ├── service.py           # Suggestion generation logic
│   │   │   ├── worker.py            # RabbitMQ consumer (background task)
│   │   │   └── schemas.py           # Suggestion schemas
│   │   └── shared/
│   │       ├── pagination.py        # Reusable pagination schema
│   │       └── exceptions.py        # Custom exception handlers
│   ├── alembic/                     # Database migrations
│   ├── tests/
│   ├── requirements.txt
│   ├── Dockerfile
│   └── pyproject.toml
├── frontend/
│   ├── src/
│   │   ├── main.tsx                 # React entry point
│   │   ├── App.tsx                  # Root component + RouterProvider
│   │   ├── routes/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── DailyLog.tsx
│   │   │   ├── Chatbot.tsx
│   │   │   ├── Suggestions.tsx
│   │   │   ├── Login.tsx
│   │   │   └── Register.tsx
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── AppShell.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── Navbar.tsx
│   │   │   │   └── ProtectedRoute.tsx
│   │   │   ├── dashboard/
│   │   │   │   ├── MetricCard.tsx
│   │   │   │   ├── WeeklyChart.tsx
│   │   │   │   └── StreakBadge.tsx
│   │   │   ├── logs/
│   │   │   │   ├── LogForm.tsx
│   │   │   │   ├── LogHistory.tsx
│   │   │   │   └── LogItem.tsx
│   │   │   ├── chat/
│   │   │   │   ├── ChatWindow.tsx
│   │   │   │   ├── MessageBubble.tsx
│   │   │   │   └── ChatInput.tsx
│   │   │   └── suggestions/
│   │   │       ├── SuggestionCard.tsx
│   │   │       └── SuggestionList.tsx
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useHealthLogs.ts
│   │   │   └── useChat.ts
│   │   ├── api/
│   │   │   └── client.ts            # Axios instance, interceptors
│   │   ├── context/
│   │   │   └── AuthContext.tsx
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── styles/
│   │       └── globals.css          # Tailwind directives + custom tokens
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── postcss.config.js
│   ├── Dockerfile
│   └── package.json
├── docker/
│   ├── docker-compose.yml
│   ├── docker-compose.prod.yml
│   └── nginx/
│       └── default.conf
├── .env.example
├── .gitignore
└── README.md
```

### 1.3 Service Decomposition

The monorepo logically separates four services. Each maps to a top-level directory within `backend/app/` and can be scaled independently.

| Service           | Responsibility                                                        | Public API? |
|-------------------|-----------------------------------------------------------------------|-------------|
| **Auth Service**  | User registration, login, token refresh, password reset               | Yes         |
| **Log Service**   | CRUD for daily health logs (steps, sleep, water, mood, etc.)          | Yes         |
| **Chatbot Service** | Real-time conversational AI backed by DeepSeek API                  | Yes         |
| **Suggestion Service** | Generates proactive health suggestions in the background (RabbitMQ consumer) | No (internal worker) |

### 1.4 Communication Patterns

```
┌──────────────────────────────────────────────────────────────────────────┐
│                            CLIENT (Browser)                              │
│                    React + Vite + TailwindCSS                            │
└─────────────────────────┬────────────────────────────────────────────────┘
                          │ HTTPS
                          ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                          NGINX (Reverse Proxy)                           │
│                  /api/* ──► backend containers on :8000                  │
│                  /*     ──► frontend static on :5173                     │
└─────────────────────────┬────────────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                     FASTAPI APPLICATION (Uvicorn)                        │
│                                                                          │
│  ┌────────────┐  ┌────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │ Auth       │  │ Log        │  │ Chatbot      │  │ Suggestion     │  │
│  │ Router     │  │ Router     │  │ Router       │  │ Router         │  │
│  └─────┬──────┘  └─────┬──────┘  └──────┬───────┘  └───────┬────────┘  │
│        │                │                │                    │          │
│  ┌─────▼──────┐  ┌─────▼──────┐  ┌──────▼───────┐  ┌───────▼────────┐  │
│  │ Auth       │  │ Log        │  │ Chatbot      │  │ Suggestion     │  │
│  │ Service    │  │ Service    │  │ Service      │  │ Service        │  │
│  └─────┬──────┘  └─────┬──────┘  └──────┬───────┘  └───────┬────────┘  │
│        │                │                │                    │          │
│        └────────┬───────┴───────┬────────┴────────────────────┘          │
│                 │               │                                        │
│                 ▼               ▼                                        │
│        ┌────────────────┐ ┌──────────────────┐                          │
│        │  PostgreSQL    │ │  DeepSeek API    │                          │
│        │  (SQLAlchemy)  │ │  (Async HTTP)    │                          │
│        └────────────────┘ └──────────────────┘                          │
│                          │                                               │
│                 ┌────────┴────────┐                                      │
│                 │     Redis       │                                      │
│                 │ (Cache/Session) │                                      │
│                 └─────────────────┘                                      │
└──────────────────────────────────────────────────────────────────────────┘
                          │
                          │ Async Tasks (via RabbitMQ)
                          ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                    SUGGESTION WORKER (separate container)                 │
│                  Consumes from RabbitMQ queue                             │
│                  Calls DeepSeek API for batch suggestions                │
│                  Writes results to PostgreSQL                            │
└──────────────────────────────────────────────────────────────────────────┘
```

**Key communication rules:**

- **Synchronous REST (HTTP):** All client-to-server and inter-service queries that need an immediate response. The API gateway (NGINX) routes `/api/*` to FastAPI.
- **Asynchronous (RabbitMQ):** Background suggestion generation is offloaded to a worker. FastAPI publishes a message; the suggestion worker consumes it, calls DeepSeek, and writes the result back.

---

## 2. Backend Architecture

### 2.1 FastAPI Application Layout

The entry point is `backend/app/main.py`. It assembles the middleware stack, includes routers, and configures lifespan hooks for database / message broker connections.

#### `backend/app/main.py`

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.middleware import RateLimitMiddleware, RequestLoggingMiddleware
from app.auth.router import router as auth_router
from app.logs.router import router as logs_router
from app.chatbot.router import router as chatbot_router
from app.suggestions.router import router as suggestions_router
from app.core.database import engine, Base
from app.core.redis import redis_client
from app.core.rabbitmq import rabbitmq_connection


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await redis_client.initialize()
    await rabbitmq_connection.connect()
    yield
    # Shutdown
    await redis_client.close()
    await rabbitmq_connection.close()


app = FastAPI(
    title="Daily Health Tracker API",
    version="1.0.0",
    lifespan=lifespan,
)

# ── Middleware Stack (order matters) ──────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(RequestLoggingMiddleware)

# ── Routers ──────────────────────────────────────────────────────────
app.include_router(auth_router, prefix="/api/auth", tags=["Auth"])
app.include_router(logs_router, prefix="/api/logs", tags=["Logs"])
app.include_router(chatbot_router, prefix="/api/chat", tags=["Chatbot"])
app.include_router(suggestions_router, prefix="/api/suggestions", tags=["Suggestions"])
```

### 2.2 Middleware Stack

| Layer                | Order | Responsibility                                         |
|----------------------|-------|-------------------------------------------------------|
| CORSMiddleware       | 1     | Allow browser requests from frontend origin            |
| RateLimitMiddleware  | 2     | Sliding-window rate limit per IP / user (Redis-backed) |
| RequestLoggingMiddleware | 3 | Log method, path, status, duration for every request  |
| AuthMiddleware (via dependency) | Per-route | JWT verification injected via `Depends(get_current_user)` |

#### RateLimitMiddleware (conceptual)

```python
# backend/app/core/middleware.py
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from app.core.redis import redis_client

class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.url.path.startswith("/api/"):
            client_ip = request.client.host
            key = f"rate_limit:{client_ip}"
            current = await redis_client.incr(key)
            if current == 1:
                await redis_client.expire(key, 60)  # 60-second window
            if current > settings.RATE_LIMIT_PER_MINUTE:
                return JSONResponse(status_code=429, content={"detail": "Rate limit exceeded"})
        return await call_next(request)
```

### 2.3 Dependency Injection Patterns

FastAPI's `Depends` is used to wire dependencies cleanly and make testing trivial.

```
Request
  │
  ├─ Depends(get_current_user)          # JWT extraction + DB lookup
  │     │
  │     └─ Depends(get_db_session)      # AsyncSession per request
  │
  ├─ Depends(get_redis_client)          # Redis singleton
  │
  └─ Depends(get_pagination_params)     # ?page=1&size=20
```

#### `backend/app/core/dependencies.py`

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_session
from app.core.redis import get_redis
from app.core.security import decode_access_token
from app.auth.models import User
import redis.asyncio as aioredis

security_scheme = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
    db: AsyncSession = Depends(get_session),
) -> User:
    payload = decode_access_token(credentials.credentials)
    if payload is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
    user = await db.get(User, payload["sub"])
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
    return user

async def get_redis_client() -> aioredis.Redis:
    return await get_redis()
```

### 2.4 Background Task Handling with RabbitMQ

RabbitMQ is used to decouple suggestion generation from the request-response cycle.

#### Topology

```
Exchange: health.topic  (topic type)
  │
  ├─ Queue: suggestion.generate  ── routing_key: "suggestion.generate"
  │     └── Consumer: Suggestion Worker
  │
  └─ Queue: notification.send   ── routing_key: "notification.send"  (future)
```

#### Publisher (inside FastAPI endpoint)

```python
# backend/app/core/rabbitmq.py
import aio_pika
from app.core.config import settings

class RabbitMQConnection:
    def __init__(self):
        self._connection = None
        self._channel = None

    async def connect(self):
        self._connection = await aio_pika.connect_robust(settings.RABBITMQ_URL)
        self._channel = await self._connection.channel()
        await self._channel.declare_exchange("health.topic", type="topic", durable=True)

    async def publish(self, routing_key: str, body: dict):
        exchange = await self._channel.get_exchange("health.topic")
        await exchange.send(
            routing_key=routing_key,
            body=body.json().encode(),
            delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
        )

    async def close(self):
        await self._connection.close()

rabbitmq_connection = RabbitMQConnection()
```

#### Consumer (separate worker process)

```python
# backend/app/suggestions/worker.py
import asyncio
import aio_pika
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.core.database import get_session
from app.suggestions.service import generate_and_store_suggestion

async def process_message(message: aio_pika.IncomingMessage):
    async with message.process():
        data = json.loads(message.body)
        async with get_session() as db:
            await generate_and_store_suggestion(db, data["user_id"])

async def main():
    connection = await aio_pika.connect_robust(settings.RABBITMQ_URL)
    async with connection:
        channel = await connection.channel()
        await channel.set_qos(prefetch_count=1)
        queue = await channel.declare_queue("suggestion.generate", durable=True)
        await queue.consume(process_message)
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    asyncio.run(main())
```

### 2.5 DeepSeek API Client Design

The chatbot service wraps the DeepSeek API with an **async HTTP client** featuring retry logic with exponential backoff and a client-side rate limiter.

```python
# backend/app/chatbot/client.py
import asyncio
import aiohttp
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from app.core.config import settings


class DeepSeekClient:
    """Async HTTP client for DeepSeek Chat API with retry and rate limiting."""

    BASE_URL = "https://api.deepseek.com/v1"
    MAX_RETRIES = 3

    def __init__(self):
        self.api_key = settings.DEEPSEEK_API_KEY
        self._session: aiohttp.ClientSession | None = None
        self._rate_limiter = asyncio.Semaphore(5)  # max 5 concurrent requests

    async def _get_session(self) -> aiohttp.ClientSession:
        if self._session is None or self._session.closed:
            self._session = aiohttp.ClientSession(
                headers={"Authorization": f"Bearer {self.api_key}"},
                timeout=aiohttp.ClientTimeout(total=30),
            )
        return self._session

    @retry(
        stop=stop_after_attempt(MAX_RETRIES),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type(
            (aiohttp.ClientError, asyncio.TimeoutError)
        ),
    )
    async def chat_completion(self, messages: list[dict]) -> dict:
        async with self._rate_limiter:
            session = await self._get_session()
            async with session.post(
                f"{self.BASE_URL}/chat/completions",
                json={
                    "model": "deepseek-chat",
                    "messages": messages,
                    "temperature": 0.7,
                    "max_tokens": 1024,
                },
            ) as resp:
                resp.raise_for_status()
                return await resp.json()

    async def close(self):
        if self._session and not self._session.closed:
            await self._session.close()
```

**Design rationale:**
- **`aiohttp`** -- non-blocking HTTP, essential for keeping the event loop responsive under concurrent chat requests.
- **`tenacity.retry`** -- handles transient failures (network blips, 5xx) with exponential backoff + jitter.
- **`asyncio.Semaphore(5)`** prevents overwhelming the upstream API when many users chat simultaneously.
- **`ClientTimeout(30)`** ensures we don't hang indefinitely on a stalled connection.

---

## 3. Frontend Architecture

### 3.1 Project Structure

```
frontend/
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── postcss.config.js
├── tsconfig.json
├── package.json
└── src/
    ├── main.tsx                  # ReactDOM.createRoot, QueryClientProvider
    ├── App.tsx                   # RouterProvider + AuthProvider
    ├── routes/                   # Page-level components (one per route)
    ├── components/               # Reusable UI components
    ├── hooks/                    # Custom React hooks (React Query wrappers)
    ├── api/                      # Axios client + typed API functions
    ├── context/                  # React Context providers
    ├── types/                    # TypeScript type definitions
    └── styles/
        └── globals.css           # @tailwind base/components/utilities
```

### 3.2 Component Tree

```
<App>
  <AuthProvider>
    <QueryClientProvider>
      <RouterProvider>
        <AppShell>                         # Persistent layout wrapper
          <Sidebar />                      # Navigation links, user avatar
          <main>
            <Navbar />                     # Breadcrumb, logout button
            <Outlet />                     # React Router outlet
          </main>
        </AppShell>
      </RouterProvider>
    </QueryClientProvider>
  </AuthProvider>
</App>
```

### 3.3 React Router Route Map

| Path                | Page Component    | Auth Required | Description                   |
|---------------------|-------------------|---------------|-------------------------------|
| `/login`            | `Login`           | No            | Sign in                       |
| `/register`         | `Register`        | No            | Sign up                       |
| `/`                 | `Dashboard`       | Yes           | Main dashboard with summary   |
| `/logs`             | `DailyLog`        | Yes           | Log daily health metrics      |
| `/logs/:id`         | `DailyLog` (edit) | Yes           | Edit a specific day's log     |
| `/chat`             | `Chatbot`         | Yes           | Chat with AI assistant        |
| `/suggestions`      | `Suggestions`     | Yes           | View AI-generated suggestions |

Route protection is handled by a `<ProtectedRoute>` wrapper component that checks `AuthContext` and redirects to `/login` when no valid token exists.

```tsx
// frontend/src/components/layout/ProtectedRoute.tsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export function ProtectedRoute() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <Spinner />;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
```

### 3.4 State Management with React Query

**React Query (TanStack Query)** is chosen over Redux for the following reasons:

- The application is **server-state dominant** (health logs come from and belong to the server).
- React Query provides **caching, background refetching, optimistic updates, and pagination** out of the box.
- Auth state (the one piece of truly client-side state) lives in a lightweight `AuthContext` using the native `useContext` + `useReducer` pattern.

```tsx
// frontend/src/hooks/useHealthLogs.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../api/client";
import type { HealthLog, PaginatedResponse } from "../types";

export function useHealthLogs(page = 1, size = 20) {
  return useQuery<PaginatedResponse<HealthLog>>({
    queryKey: ["health-logs", { page, size }],
    queryFn: () =>
      apiClient.get("/logs", { params: { page, size } }).then((r) => r.data),
    staleTime: 30_000,         // consider data fresh for 30 s
    gcTime: 5 * 60_000,        // keep in cache for 5 min
    refetchOnWindowFocus: true,
  });
}

export function useCreateLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<HealthLog, "id" | "created_at">) =>
      apiClient.post("/logs", data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health-logs"] });
    },
  });
}
```

**Query key convention:**

```
["health-logs", { page, size, date? , sort? }]   # list queries
["health-logs", logId]                            # detail queries
["suggestions", { page, size }]
["chat", "history"]
["user", "me"]
```

### 3.5 TailwindCSS Design System

#### Theme Configuration

```ts
// frontend/tailwind.config.ts
import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",   // main brand -- fresh green
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
        },
        surface: {
          DEFAULT: "#ffffff",
          muted:   "#f8fafc",
          border:  "#e2e8f0",
        },
        mood: {
          great: "#22c55e",
          good:  "#84cc16",
          okay:  "#eab308",
          bad:   "#f97316",
          awful: "#ef4444",
        },
      },
      spacing: {
        "18": "4.5rem",
        "88": "22rem",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      fontFamily: {
        sans: ['"Inter"', "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [require("@tailwindcss/forms"), require("@tailwindcss/typography")],
} satisfies Config;
```

#### Component Tokens (used throughout the app)

| Token                  | Value             | Usage                        |
|------------------------|-------------------|------------------------------|
| `bg-primary-500`       | `#22c55e`         | Buttons, links, active nav   |
| `text-surface-muted`   | `#f8fafc`         | Page background              |
| `border-surface-border`| `#e2e8f0`        | Card borders, dividers       |
| `shadow-card`          | Tailwind shadow   | Card elevation               |
| `rounded-xl`           | `0.75rem`         | Card corners                 |
| `p-6`                  | `1.5rem`          | Card padding                 |

### 3.6 API Client Layer

```ts
// frontend/src/api/client.ts
import axios from "axios";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
});

// ── Request interceptor: attach JWT ──────────────────────────────
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: handle 401 → refresh ───────────────────
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem("refresh_token");
        const { data } = await axios.post("/api/auth/refresh", {
          refresh_token: refreshToken,
        });
        localStorage.setItem("access_token", data.access_token);
        originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
        return apiClient(originalRequest);
      } catch {
        localStorage.clear();
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);
```

---

## 4. Data Architecture

### 4.1 PostgreSQL Schema

The database uses a single PostgreSQL instance with multiple tables. All timestamps are stored as `TIMESTAMPTZ`.

#### Entity-Relationship Diagram (Text)

```
┌──────────────────┐       ┌───────────────────────┐
│      users       │       │      health_logs       │
├──────────────────┤       ├───────────────────────┤
│ id (UUID, PK)    │◄──────│ user_id (FK, UUID)    │
│ email (UQ)       │  1:N  │ id (UUID, PK)         │
│ password_hash    │       │ log_date (DATE, UQ*)  │
│ full_name        │       │ steps (INT)           │
│ created_at       │       │ sleep_hours (DECIMAL) │
│ updated_at       │       │ water_ml (INT)        │
│ last_login_at    │       │ mood (ENUM)           │
└──────────────────┘       │ weight_kg (DECIMAL)   │
        │                  │ systolic_bp (INT)     │
        │ 1:N              │ diastolic_bp (INT)    │
        │                  │ notes (TEXT)          │
        ▼                  │ created_at            │
┌──────────────────┐       │ updated_at            │
│   suggestions    │       └───────────────────────┘
├──────────────────┤       (* unique per user_id + log_date)
│ id (UUID, PK)    │
│ user_id (FK)     │       ┌───────────────────────┐
│ title (VARCHAR)  │       │   chat_messages       │
│ content (TEXT)   │       ├───────────────────────┤
│ category (ENUM)  │       │ id (UUID, PK)         │
│ priority (INT)   │       │ user_id (FK, UUID)    │
│ is_read (BOOL)   │       │ role (ENUM: user/assistant)
│ created_at       │       │ content (TEXT)         │
└──────────────────┘       │ created_at            │
                           └───────────────────────┘
```

#### DDL (Key Tables)

```sql
-- Users
CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name     VARCHAR(150) NOT NULL,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMPTZ
);
CREATE INDEX idx_users_email ON users (email);

-- Health Logs
CREATE TYPE mood_enum AS ENUM ('great', 'good', 'okay', 'bad', 'awful');

CREATE TABLE health_logs (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    log_date      DATE         NOT NULL,
    steps         INT          CHECK (steps >= 0),
    sleep_hours   DECIMAL(4,1) CHECK (sleep_hours >= 0 AND sleep_hours <= 24),
    water_ml      INT          CHECK (water_ml >= 0),
    mood          mood_enum,
    weight_kg     DECIMAL(5,2) CHECK (weight_kg > 0),
    systolic_bp   INT          CHECK (systolic_bp > 0),
    diastolic_bp  INT          CHECK (diastolic_bp > 0),
    notes         TEXT,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    UNIQUE (user_id, log_date)
);

-- Composite index for dashboard queries (fetch last N days for a user)
CREATE INDEX idx_health_logs_user_date
    ON health_logs (user_id, log_date DESC);

-- Suggestions
CREATE TYPE suggestion_category AS ENUM (
    'fitness', 'nutrition', 'sleep', 'mental_health', 'general'
);

CREATE TABLE suggestions (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID                NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title      VARCHAR(255)        NOT NULL,
    content    TEXT                NOT NULL,
    category   suggestion_category NOT NULL,
    priority   INT                 NOT NULL DEFAULT 0,
    is_read    BOOLEAN             NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_suggestions_user_read
    ON suggestions (user_id, is_read, priority DESC);

-- Chat Messages
CREATE TYPE message_role AS ENUM ('user', 'assistant');

CREATE TABLE chat_messages (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role       message_role  NOT NULL,
    content    TEXT          NOT NULL,
    created_at TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_chat_messages_user_created
    ON chat_messages (user_id, created_at);
```

### 4.2 Redis Cache Patterns

Redis serves three distinct caching concerns:

| Cache Key Pattern                     | TTL      | Purpose                                       |
|---------------------------------------|----------|-----------------------------------------------|
| `session:{user_id}`                   | 24 h     | Active session metadata (revoked tokens, etc.)|
| `suggestion:{user_id}:latest`         | 1 h      | Pre-computed latest suggestion to avoid DB hit|
| `rate_limit:{ip_or_user_id}`          | 60 s     | Sliding-window rate limit counter             |
| `chat:context:{user_id}`              | 30 min   | Recent conversation history for context window|

**Usage in pseudocode:**

```python
# Caching a suggestion
suggestion = await redis.get(f"suggestion:{user_id}:latest")
if suggestion is None:
    suggestion = await db.query(...)
    await redis.setex(f"suggestion:{user_id}:latest", 3600, suggestion)
```

### 4.3 RabbitMQ Topology

```
Exchange: health.topic (durable, topic type)
  │
  ├─ Queue:  q.suggestion.generate      (durable)
  │   ├─ Binding: "suggestion.*"
  │   └─ Consumer: suggestion_worker.py
  │
  ├─ Queue:  q.suggestion.email         (durable)        [future]
  │   └─ Binding: "suggestion.email.*"
  │
  └─ Queue:  q.analytics.aggregate      (durable)        [future]
      └─ Binding: "analytics.*"
```

### 4.4 Data Flow Diagrams

#### Scenario A: User Logs Daily Health Data

```
[React Form] ──POST /api/logs──► [FastAPI Log Router]
                                      │
                                      ▼
                              [Log Service]
                                      │
                          ┌───────────┴───────────┐
                          ▼                       ▼
                    [PostgreSQL]            [RabbitMQ]
                    INSERT health_logs      publish "suggestion.generate"
                          │                 with user_id + log_date
                          ▼                       │
                  Return 201 + log               │
                          │                      ▼
                    [React Query]         [Suggestion Worker]
                    invalidates            consumes message,
                    ["health-logs"]        calls DeepSeek API,
                    cache busted           INSERT into suggestions
```

#### Scenario B: User Opens Dashboard

```
[React Query useHealthLogs()]
        │
        ├─ Check cache ──hit──► Return cached data
        │
        └─ miss/miss ──► GET /api/logs?page=1&size=7
                              │
                              ▼
                        [FastAPI]
                              │
                              ▼
                      [PostgreSQL]
                      │
                      │  Index: idx_health_logs_user_date
                      │  Query: SELECT * FROM health_logs
                      │         WHERE user_id=$1
                      │         ORDER BY log_date DESC
                      │         LIMIT 7
                      ▼
                  Return data
                      │
                      ▼
            [React Query caches + renders]

    Concurrent call to GET /api/suggestions?limit=3
        │
        ├─ Redis cache check
        └─ DB query if cache miss
```

#### Scenario C: User Chatting with AI

```
[ChatWindow] ──messages──► [Chatbot Service]
                                │
                                ├─ Fetch recent history from Redis
                                │   (chat:context:{user_id})
                                │
                                ├─ Build prompt with context
                                │
                                ├───► [DeepSeek API (async)]
                                │         │
                                │         ◄── response
                                │
                                ├─ Store user msg + assistant reply
                                │   in PostgreSQL (chat_messages)
                                │
                                ├─ Update Redis context window
                                │
                                └─ Return assistant reply ──► [React UI]
```

---

## 5. Security Architecture

### 5.1 JWT Token Design

The application uses a **dual-token** strategy: a short-lived access token and a long-lived refresh token.

```python
# backend/app/core/security.py
from datetime import datetime, timedelta, timezone
import jwt
from passlib.context import CryptContext
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(user_id: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "iat": now,
        "exp": now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        "type": "access",
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "iat": now,
        "exp": now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        "type": "refresh",
        "jti": secrets.token_hex(16),  # unique ID for revocation
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict | None:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[ALGORITHM])
        if payload.get("type") != "access":
            return None
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None
```

| Token          | Lifetime | Stored In (Client) | Usage                               |
|----------------|----------|--------------------|--------------------------------------|
| Access Token   | 15 min   | `localStorage`     | Authorise every API request          |
| Refresh Token  | 7 days   | `localStorage`     | Obtain new access token transparently|

### 5.2 Password Hashing (bcrypt)

- **Algorithm:** bcrypt via `passlib` (Python) or `bcrypt` npm package (Node).
- **Work factor:** 12 rounds (configurable via `settings.BCRYPT_ROUNDS`).
- bcrypt automatically handles salting; no manual salt management needed.

### 5.3 API Rate Limiting

| Scope        | Window    | Max Requests | Applied To              |
|--------------|-----------|--------------|-------------------------|
| IP address   | 60 s      | 100          | All `/api/*` endpoints  |
| Authenticated user | 60 s | 200       | Log/Chat endpoints      |
| `/auth/login`   | 60 s   | 10           | Brute-force protection  |

Rate limit counters are stored in Redis with an expiry equal to the window duration, ensuring automatic cleanup.

### 5.4 Input Validation Strategy

- **Pydantic v2** for all request/response schemas. FastAPI automatically validates and returns 422 with structured error messages on failure.
- **SQL injection** is impossible -- SQLAlchemy uses parameterised queries throughout.
- **XSS** is prevented by React's default JSX escaping. Any user-rendered markdown in suggestion content is sanitized with DOMPurify before `dangerouslySetInnerHTML`.
- **No direct SQL execution** anywhere in the codebase.

```python
# backend/app/logs/schemas.py
from pydantic import BaseModel, Field, field_validator
from datetime import date
from decimal import Decimal
from typing import Optional
from enum import Enum

class MoodEnum(str, Enum):
    great = "great"
    good = "good"
    okay = "okay"
    bad = "bad"
    awful = "awful"

class HealthLogCreate(BaseModel):
    log_date: date
    steps: Optional[int] = Field(None, ge=0)
    sleep_hours: Optional[Decimal] = Field(None, ge=0, le=24)
    water_ml: Optional[int] = Field(None, ge=0)
    mood: Optional[MoodEnum] = None
    weight_kg: Optional[Decimal] = Field(None, gt=0)
    systolic_bp: Optional[int] = Field(None, gt=0)
    diastolic_bp: Optional[int] = Field(None, gt=0)
    notes: Optional[str] = Field(None, max_length=2000)

    @field_validator("notes")
    @classmethod
    def sanitise_notes(cls, v: str | None) -> str | None:
        if v:
            from markupsafe import escape
            return escape(v)
        return v
```

### 5.5 CORS Configuration

```python
# backend/app/core/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # ...
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",            # Vite dev server
        "http://localhost:3000",            # fallback
        "https://healthtracker.example.com", # production
    ]
    # ...

# Applied in main.py as:
# app.add_middleware(CORSMiddleware, allow_origins=settings.CORS_ORIGINS, ...)
```

In production, CORS origins are restricted to the actual deployed domain. `allow_credentials=True` is required because the frontend sends cookies (if any) and the `Authorization` header.

---

## 6. Deployment Architecture

### 6.1 Docker Container Layout

Each deployable unit gets its own Docker container:

```
┌─────────────────────────────────────────────────────────────────┐
│                        DOCKER COMPOSE                            │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │ nginx:1.25   │  │ frontend     │  │ backend              │   │
│  │ (reverse     │  │ (nginx       │  │ (uvicorn, :8000)     │   │
│  │  proxy)      │  │  static)     │  │                      │   │
│  │ ports: 80/443│  │ depends: top │  │ depends: db, redis,  │   │
│  └──────────────┘  └──────────────┘  │ rabbitmq             │   │
│                                       └──────────┬───────────┘   │
│  ┌──────────────┐  ┌──────────────┐              │               │
│  │ suggestion   │  │ postgres:16  │  ┌───────────┴───────────┐   │
│  │ worker       │  │ volumes:     │  │ redis:7-alpine        │   │
│  │ (python      │  │ pgdata       │  │ ports: 6379           │   │
│  │  consumer)   │  │ ports: 5432  │  └───────────────────────┘   │
│  └──────────────┘  └──────────────┘                              │
│                                       ┌───────────────────────┐   │
│                                       │ rabbitmq:3.12         │   │
│                                       │ ports: 5672, 15672    │   │
│                                       └───────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Docker Compose Service Definitions

```yaml
# docker/docker-compose.yml
version: "3.9"

services:
  # ── PostgreSQL ──────────────────────────────────────────────
  db:
    image: postgres:16-alpine
    container_name: healthtracker-db
    restart: unless-stopped
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: healthtracker
      POSTGRES_USER: ${DB_USER:-ht_user}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-changeme}
    ports:
      - "127.0.0.1:5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-ht_user}"]
      interval: 5s
      timeout: 5s
      retries: 5

  # ── Redis ───────────────────────────────────────────────────
  redis:
    image: redis:7-alpine
    container_name: healthtracker-redis
    restart: unless-stopped
    ports:
      - "127.0.0.1:6379:6379"
    volumes:
      - redisdata:/data
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD:-}
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

  # ── RabbitMQ ────────────────────────────────────────────────
  rabbitmq:
    image: rabbitmq:3.12-management-alpine
    container_name: healthtracker-rabbitmq
    restart: unless-stopped
    ports:
      - "127.0.0.1:5672:5672"    # AMQP
      - "127.0.0.1:15672:15672"  # Management UI
    environment:
      RABBITMQ_DEFAULT_USER: ${RABBITMQ_USER:-guest}
      RABBITMQ_DEFAULT_PASS: ${RABBITMQ_PASS:-guest}
    volumes:
      - rabbitmqdata:/var/lib/rabbitmq
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "check_port_connectivity"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ── Backend API ─────────────────────────────────────────────
  backend:
    build:
      context: ../backend
      dockerfile: Dockerfile
    container_name: healthtracker-backend
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
      rabbitmq:
        condition: service_healthy
    env_file: ../.env
    ports:
      - "127.0.0.1:8000:8000"
    command: >
      sh -c "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4"

  # ── Suggestion Worker ───────────────────────────────────────
  suggestion-worker:
    build:
      context: ../backend
      dockerfile: Dockerfile
    container_name: healthtracker-suggestion-worker
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
      rabbitmq:
        condition: service_healthy
    env_file: ../.env
    command: python -m app.suggestions.worker

  # ── Frontend ────────────────────────────────────────────────
  frontend:
    build:
      context: ../frontend
      dockerfile: Dockerfile
      target: production
    container_name: healthtracker-frontend
    restart: unless-stopped
    ports:
      - "127.0.0.1:5173:80"

  # ── Reverse Proxy ───────────────────────────────────────────
  nginx:
    image: nginx:1.25-alpine
    container_name: healthtracker-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/default.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on:
      - backend
      - frontend

volumes:
  pgdata:
  redisdata:
  rabbitmqdata:
```

### 6.3 Network Topology

All services reside on a single Docker bridge network `healthtracker-net` (created implicitly by Docker Compose). Communication:

```
                  internet
                     │
                [NGINX :80/:443]
                 /           \
        /api/*               /*
            │                  │
    [backend:8000]      [frontend:80]
        │     │     │
        │     │     └── [rabbitmq:5672]
        │     │
        │     └──────── [redis:6379]
        │
    [db:5432]
```

Only NGINX exposes ports to the host. Databases and message broker are accessible only within the Docker network (bound to `127.0.0.1` on the host for optional local tooling).

### 6.4 Volume Mounts for Persistence

| Volume         | Container Path              | Data                    |
|----------------|-----------------------------|-------------------------|
| `pgdata`       | `/var/lib/postgresql/data`  | PostgreSQL data files   |
| `redisdata`    | `/data`                     | Redis RDB/AOF snapshots |
| `rabbitmqdata` | `/var/lib/rabbitmq`         | RabbitMQ message store  |

### 6.5 Environment Variable Management

A single `.env` file at the project root is referenced by Docker Compose via `env_file: ../.env`. The FastAPI `Settings` class loads from this file using `pydantic-settings`.

```bash
# .env.example (commit this; never commit .env)
# Django-style SECRET_KEY: openssl rand -hex 32
JWT_SECRET=change-me-to-a-long-random-string
DEEPSEEK_API_KEY=sk-your-key-here

# Database
DB_USER=ht_user
DB_PASSWORD=change-me
DB_HOST=db
DB_PORT=5432
DB_NAME=healthtracker

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=

# RabbitMQ
RABBITMQ_HOST=rabbitmq
RABBITMQ_PORT=5672
RABBITMQ_USER=guest
RABBITMQ_PASS=guest

# Rate Limiting
RATE_LIMIT_PER_MINUTE=100

# Token Lifetimes
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS
CORS_ORIGINS=["http://localhost:5173","https://healthtracker.example.com"]
```

---

## 7. Key Design Decisions

### 7.1 Why FastAPI over Flask / Django

| Criteria            | FastAPI                          | Flask                       | Django                     |
|---------------------|----------------------------------|-----------------------------|----------------------------|
| Async support       | Native (`async def`)             | Flask 2.x async is bolted-on| Django 4.x async is partial|
| Performance         | ~50K req/s (uvicorn)             | ~5K req/s (WSGI)            | ~10K req/s (ASGI)          |
| Validation          | Pydantic v2 (automatic)          | Manual or Flask-Marshmallow | DRF Serializers (verbose)  |
| OpenAPI docs        | Automatic (Swagger UI, ReDoc)    | Flask-Spectree (manual)     | DRF Spectacular (manual)   |
| DI system           | Built-in (`Depends`)             | None (manual plumbing)      | None (class-based views)   |
| Codebase size       | Minimal boilerplate              | Small (but lots of extensions)| Large (batteries-included)|

**Decision:** FastAPI was chosen because the app is I/O-bound (database queries, external API calls to DeepSeek). Native async support maximises throughput under concurrent users. Pydantic integration eliminates a whole class of bugs. Automatic OpenAPI docs improve developer experience and frontend-backend contract adherence.

### 7.2 Why React Query over Redux

| Concern                | React Query (TanStack Query)             | Redux Toolkit                   |
|------------------------|------------------------------------------|---------------------------------|
| Server-state caching   | Built-in with `staleTime`, `gcTime`      | Manual thunks + createSlice     |
| Loading / error states | Automatic (`isLoading`, `isError`)       | Manual in slice state           |
| Background refetch     | Automatic on window focus / interval     | Manual dispatch                 |
| Optimistic updates     | `onMutate` / `onSettled`                 | Manual in thunk                 |
| Pagination / infinite  | `useInfiniteQuery` built-in              | Manual                          |
| Boilerplate            | Minimal (one hook per entity)            | Slice + thunk + selectors       |
| Bundle size            | ~12 kB                                  | ~30 kB (with Redux)             |

**Decision:** The application is dominated by server state (logs, suggestions, chat messages). React Query eliminates the need to write reducers, action creators, and thunks for data fetching. The one piece of client-only state (authentication) is handled by a lightweight `AuthContext` + `useReducer` (fewer than 30 lines). Adding Redux would triple boilerplate with no benefit.

### 7.3 Why Redis for Caching over In-Memory

| Concern             | Redis                              | In-Memory (Python dict / lru_cache) |
|---------------------|------------------------------------|-------------------------------------|
| Persistence         | RDB / AOF snapshots                | Lost on restart                     |
| Shared across workers| Yes (all uvicorn workers connect) | No (each worker has its own memory) |
| TTL expiration      | Automatic (`EXPIRE`, `SETEX`)      | Manual                              |
| Rate limiting       | Atomic `INCR` + `EXPIRE`           | Race conditions in threaded env     |
| Data structures     | String, List, Set, SortedSet, Hash | Dict / list only                    |
| Operational cost    | Separate process (Docker container)| Zero (built-in)                     |

**Decision:** Key factors are (a) **shared cache across uvicorn workers** -- in-memory caching would give each worker its own cache, causing data duplication and cache-miss storms on restart; (b) **rate limiting needs atomic increments** with automatic expiry, which Redis provides natively; (c) **persistence** avoids losing cached suggestions on container restart.

### 7.4 Why RabbitMQ for Async Tasks

| Concern              | RabbitMQ                         | Celery + Redis Broker          | In-process BackgroundTasks       |
|----------------------|----------------------------------|--------------------------------|----------------------------------|
| Message persistence | Yes (disk-backed)                | Yes (if Redis AOF enabled)     | N/A                              |
| Delivery guarantees | At-least-once (acks)             | At-least-once                  | Best-effort (lost on crash)      |
| Dead-letter queues  | Built-in                         | Custom implementation          | N/A                              |
| Monitoring          | Built-in UI (:15672)             | Flower                         | N/A                              |
| Scalability         | Multiple consumers, prefetch     | Multiple workers               | Single process only              |
| Operational scope   | Single-purpose (messaging)       | General-purpose task queue     | Lightweight (in-process)         |

**Decision:** The suggestion generation task is **fire-and-forget but must not be lost** -- it is acceptable for the user to wait a few seconds for a suggestion to appear, but losing the task entirely would degrade the experience. RabbitMQ provides durable queues, message acknowledgements, and dead-letter handling. Celery would add unnecessary complexity for a single consumer. FastAPI's `BackgroundTasks` is insufficient because it runs in the same process and suggestions are lost on server restart.

### 7.5 Database Indexing Strategy

| Table          | Index                                      | Rationale                                                    |
|----------------|--------------------------------------------|--------------------------------------------------------------|
| `users`        | `idx_users_email` on `email`               | Login lookup by email (O(1) on B-tree)                       |
| `health_logs`  | `idx_health_logs_user_date` on `(user_id, log_date DESC)` | Dashboard query: "last 7 days for this user", also enforces unique sort order |
| `suggestions`  | `idx_suggestions_user_read` on `(user_id, is_read, priority DESC)` | Dashboard: "show unread suggestions, highest priority first" |
| `chat_messages`| `idx_chat_messages_user_created` on `(user_id, created_at)` | Chat history retrieval ordered by time |

**No over-indexing.** Indexes add write overhead and consume storage. Every index above maps directly to a query in the application code. No full-text search indexes are created because the app does not perform text search; if needed in the future, a separate search index (Elasticsearch / Meilisearch) would be added.

---

## Appendix: Technology Versions

| Component            | Version       |
|----------------------|---------------|
| Python               | 3.12+         |
| FastAPI              | 0.115+        |
| SQLAlchemy           | 2.0+ (async)  |
| Alembic              | 1.13+         |
| Pydantic             | 2.7+          |
| aio-pika             | 9.4+          |
| aiohttp              | 3.9+          |
| Node.js              | 22 LTS        |
| React                | 19+           |
| Vite                 | 6+            |
| TailwindCSS          | 4+            |
| TanStack React Query | 5+            |
| PostgreSQL           | 16            |
| Redis                | 7             |
| RabbitMQ             | 3.12+         |
| Docker               | 24+           |
| Docker Compose       | 2.24+         |
| NGINX                | 1.25+         |

---

*End of Architecture Document*
