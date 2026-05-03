# Daily Health Tracker -- High-Level Design (HLD)

## Table of Contents

1. [System Overview](#1-system-overview)
2. [System Architecture](#2-system-architecture)
3. [Data Flow](#3-data-flow)
4. [API Design](#4-api-design)
5. [Authentication & Authorization](#5-authentication--authorization)
6. [Integration Points](#6-integration-points)
7. [Deployment Architecture](#7-deployment-architecture)
8. [Non-Functional Requirements](#8-non-functional-requirements)

---

## 1. System Overview

### 1.1 Purpose

The Daily Health Tracker is a full-stack web application that enables users to log their daily health routines, receive AI-powered diet and workout suggestions via a conversational chatbot, and track health metrics over time. The system leverages the DeepSeek API for natural-language interactions and personalized recommendations.

### 1.2 Key Capabilities

| Capability | Description |
|---|---|
| Daily Routine Logging | Record meals (breakfast, lunch, dinner, snacks), workouts, water intake, sleep hours, and mood ratings. |
| AI Chatbot | Conversational interface powered by DeepSeek API for diet tips, workout tips, and nutrition advice. |
| Daily AI Suggestions | Dashboard displays AI-generated health tips based on the user's recent logs. |
| Health Metrics Tracking | Track weight, BMI, and other metrics over time with visual charts. |
| User Profile Management | Age, height, weight, dietary preferences, and fitness goals. |

### 1.3 Architecture Diagram (ASCII)

```
+--------------------------------------------------------------------+
|                        CLIENT LAYER                                 |
|  +----------------------------------+  +-------------------------+  |
|  |   React SPA (Vite + Tailwind)    |  |   Mobile/Third-Party   |  |
|  |   - Dashboard                    |  |   (Future)             |  |
|  |   - Chatbot UI                   |  |                         |  |
|  |   - Log Forms                    |  +-------------------------+  |
|  |   - Charts (Recharts)            |                             |
|  +----------+-----------------------+                             |
+-------------|------------------------------------------------------+
              |  HTTPS / JWT
              v
+--------------------------------------------------------------------+
|                      API GATEWAY LAYER                             |
|  +--------------------------------------------------------------+  |
|  |  Nginx / Traefik Reverse Proxy                               |  |
|  |  - TLS Termination                                           |  |
|  |  - Rate Limiting                                             |  |
|  |  - Request Routing                                           |  |
|  +--------------------------------------------------------------+  |
+--------------------------------------------------------------------+
              |
              v
+--------------------------------------------------------------------+
|                    APPLICATION LAYER (FastAPI)                     |
|                                                                     |
|  +------------------+  +------------------+  +------------------+  |
|  | Auth Service     |  | User Service     |  | Log Service      |  |
|  | - Register/Login |  | - Profile CRUD   |  | - Meals          |  |
|  | - JWT Issuance   |  | - Preferences    |  | - Workouts       |  |
|  | - Token Refresh  |  | - Metrics        |  | - Water/Sleep    |  |
|  +------------------+  +------------------+  | - Mood           |  |
|                                               +------------------+  |
|  +------------------+  +------------------+                        |
|  | Chatbot Service  |  | Suggestion Svc   |                        |
|  | - DeepSeek Int.  |  | - AI Tip Gen     |                        |
|  | - Convo History  |  | - Scheduled      |                        |
|  | - Context Mgmt   |  | - Personalized   |                        |
|  +------------------+  +------------------+                        |
+--------------------------------------------------------------------+
              |              |              |
     +--------+      +-------+-------+     +--------+
     v                   v                   v
+---------+    +------------+    +---------------+
| Redis   |    | PostgreSQL  |    |   RabbitMQ    |
| Cache   |    | Primary DB  |    | Message Queue |
+---------+    +------------+    +---------------+
     |              |                   |
     |              v                   v
     |    +-------------------+  +-----------------+
     |    | Alembic Migrations|  | Celery Workers  |
     |    +-------------------+  | - Suggestion    |
     |                           | - Metric Calc   |
     |                           | - Notification  |
     |                           +-----------------+
     v
+-------------------+
| DeepSeek API      |
| (External)        |
+-------------------+
```

---

## 2. System Architecture

### 2.1 Architectural Style

The system follows a **modular monolithic** architecture packaged as microservices-in-waiting. All services run within the same FastAPI application process but are organized into distinct logical modules with well-defined interfaces. This provides:

- **Development simplicity** -- single deployable unit
- **Clear separation of concerns** -- modules can be extracted into independent services later
- **Shared infrastructure** -- common DB, cache, queue connections

### 2.2 Component Descriptions

| Component | Technology | Responsibility |
|---|---|---|
| **API Gateway** | Nginx | TLS termination, rate limiting, static asset serving |
| **Auth Module** | FastAPI + python-jose | JWT creation, validation, password hashing (bcrypt) |
| **User Module** | FastAPI + SQLAlchemy | Profile CRUD, preferences, metrics history |
| **Log Module** | FastAPI + SQLAlchemy | Meals, workouts, water, sleep, mood CRUD |
| **Chatbot Module** | FastAPI + httpx | DeepSeek API integration, conversation management |
| **Suggestion Module** | FastAPI + Celery | Scheduled AI tip generation, push to dashboard |
| **PostgreSQL** | 15+ | Primary data store |
| **Redis** | 7+ | Session cache, API response cache, rate-limit counters |
| **RabbitMQ** | 3.x | Async job queue for Celery workers |
| **Celery Workers** | Celery + Redis/RMQ | Background processing of suggestions, metric calculations |

### 2.3 Inter-Service Communication

```
 Synchronous (REST):
   Auth Service <---> User Service (via internal function calls)
   Log Service  <---> User Service (for user validation)
   Chatbot Svc  <---> DeepSeek API (external HTTPS)

 Asynchronous (RabbitMQ):
   Log Service  ----> [daily.log.created] ----> Suggestion Worker
   Suggestion Svc --> [suggestion.generated] --> Dashboard Polling
   Celery Beat  ----> [suggestion.daily.trigger] --> Suggestion Worker
```

---

## 3. Data Flow

### 3.1 Daily Log Submission Flow

```
User → POST /api/v1/logs/daily
  │
  ├─ 1. API Gateway terminates TLS
  ├─ 2. Auth middleware validates JWT → extracts user_id
  ├─ 3. Log Service validates request body via Pydantic
  ├─ 4. Log Service writes to PostgreSQL (daily_logs, meals, workouts)
  ├─ 5. Log Service publishes `daily.log.created` to RabbitMQ
  │      └─ Celery Worker consumes event:
  │            ├─ Invalidates Redis cache keys for user dashboard
  │            └─ Queues suggestion generation (if matching criteria met)
  ├─ 6. Log Service returns 201 Created with log summary
  └─ 7. Frontend React Query invalidates dashboard cache → refetch
```

### 3.2 Chatbot Conversation Flow

```
User → POST /api/v1/chatbot/message
  │
  ├─ 1. Auth middleware validates JWT
  ├─ 2. Chatbot Service loads recent conversation history from PostgreSQL
  ├─ 3. Chatbot Service builds prompt with:
  │      ├─ System prompt (role, constraints, tone)
  │      ├─ User profile context (dietary_prefs, goals, recent_logs)
  │      └─ Conversation history (last N messages)
  ├─ 4. Chatbot Service calls DeepSeek API (POST /chat/completions)
  │      └─ Uses httpx with 30s timeout, retry on 5xx
  ├─ 5. DeepSeek returns AI response
  ├─ 6. Chatbot Service persists user message + AI response to DB
  ├─ 7. Returns response to client
  └─ 8. Response cached in Redis for idempotent retries (TTL: 5 min)
```

### 3.3 Daily Suggestion Flow

```
[Celery Beat] -- every 6 AM --
  │
  ├─ 1. Celery Beat publishes `suggestion.daily.trigger` to RabbitMQ
  └─ 2. Suggestion Worker picks up task
        ├─ 3. Queries PostgreSQL for users with `suggestions_enabled=true`
        ├─ 4. For each user:
        │      ├─ Loads last 7 days of logs
        │      ├─ Loads user profile (goals, preferences)
        │      ├─ Calls DeepSeek API with structured prompt
        │      ├─ Persists generated suggestion to DB
        │      └─ Publishes `suggestion.generated` event
        └─ 5. Frontend polls /api/v1/suggestions/today (or uses WebSocket push)
```

### 3.4 Health Metrics Viewing Flow

```
User → GET /api/v1/metrics?days=30
  │
  ├─ 1. Auth middleware validates JWT
  ├─ 2. Metrics Service checks Redis cache:
  │      ├─ Cache HIT → return cached data
  │      └─ Cache MISS → continue
  ├─ 3. Query PostgreSQL for weight records in date range
  ├─ 4. Calculate derived metrics (BMI = weight / height^2)
  ├─ 5. Store result in Redis (TTL: 10 minutes)
  ├─ 6. Return JSON response with chart-ready arrays
  └─ 7. Frontend renders using Recharts line/bar charts
```

---

## 4. API Design

### 4.1 Base URL

```
Production:  https://api.healthtracker.example.com/api/v1
Local:       http://localhost:8000/api/v1
```

### 4.2 Endpoint Groups

#### 4.2.1 Authentication (`/auth`)

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/auth/register` | Create new user account | No |
| POST | `/auth/login` | Authenticate, return JWT pair | No |
| POST | `/auth/refresh` | Refresh access token | Refresh Token |
| POST | `/auth/logout` | Invalidate refresh token | Yes |
| POST | `/auth/change-password` | Change password | Yes |

#### 4.2.2 User Profile (`/users`)

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/users/me` | Get current user profile | Yes |
| PUT | `/users/me` | Update profile (age, height, weight, preferences, goals) | Yes |
| GET | `/users/me/preferences` | Get dietary preferences & goals | Yes |
| PUT | `/users/me/preferences` | Update preferences & goals | Yes |

#### 4.2.3 Daily Logs (`/logs`)

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/logs/daily` | Create/update today's daily log | Yes |
| GET | `/logs/daily` | Get today's daily log | Yes |
| GET | `/logs/daily/date/{date}` | Get log for specific date (YYYY-MM-DD) | Yes |
| GET | `/logs/daily/range` | Get logs for date range (`?start=&end=`) | Yes |
| DELETE | `/logs/daily/{log_id}` | Delete a daily log | Yes |

#### 4.2.4 Meals (`/logs/meals`)

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/logs/meals` | Add a meal entry (breakfast/lunch/dinner/snacks) | Yes |
| PUT | `/logs/meals/{meal_id}` | Update meal entry | Yes |
| DELETE | `/logs/meals/{meal_id}` | Delete meal entry | Yes |
| GET | `/logs/meals` | Get meals for date range (`?start=&end=`) | Yes |

#### 4.2.5 Workouts (`/logs/workouts`)

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/logs/workouts` | Add a workout entry | Yes |
| PUT | `/logs/workouts/{workout_id}` | Update workout entry | Yes |
| DELETE | `/logs/workouts/{workout_id}` | Delete workout entry | Yes |
| GET | `/logs/workouts` | Get workouts for date range | Yes |

#### 4.2.6 Water & Sleep (`/logs`)

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| PUT | `/logs/daily/water` | Update water intake (glasses) for today | Yes |
| PUT | `/logs/daily/sleep` | Update sleep hours for today | Yes |
| PUT | `/logs/daily/mood` | Update mood rating (1-5) for today | Yes |

#### 4.2.7 Chatbot (`/chatbot`)

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/chatbot/message` | Send message, get AI response | Yes |
| GET | `/chatbot/history` | Get conversation history | Yes |
| DELETE | `/chatbot/history/{conversation_id}` | Clear conversation history | Yes |

#### 4.2.8 Suggestions (`/suggestions`)

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/suggestions/today` | Get today's AI-generated suggestion | Yes |
| GET | `/suggestions` | Get recent suggestions (`?limit=`) | Yes |
| POST | `/suggestions/refresh` | Request immediate suggestion refresh | Yes |
| PUT | `/suggestions/{id}/dismiss` | Dismiss a suggestion | Yes |

#### 4.2.9 Health Metrics (`/metrics`)

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/metrics/weight` | Weight history (`?days=30`) | Yes |
| GET | `/metrics/bmi` | BMI history (`?days=30`) | Yes |
| POST | `/metrics/weight` | Record new weight entry | Yes |
| GET | `/metrics/summary` | Aggregated stats (averages over period) | Yes |

---

## 5. Authentication & Authorization

### 5.1 JWT Token Strategy

| Token | TTL | Storage | Purpose |
|---|---|---|---|
| Access Token | 15 minutes | Client memory (HTTP-only cookie or memory variable) | API authorization |
| Refresh Token | 7 days | Client HTTP-only cookie + DB whitelist | Obtain new access tokens |

### 5.2 Token Payload

```json
// Access Token
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "user",
  "iat": 1714690000,
  "exp": 1714690900
}

// Refresh Token
{
  "sub": "user-uuid",
  "type": "refresh",
  "jti": "unique-token-id",
  "iat": 1714690000,
  "exp": 1715294800
}
```

### 5.3 Auth Flow

```
REGISTER:
  1. Client POST /auth/register { email, password, name }
  2. Server hashes password (bcrypt, cost=12)
  3. Server creates user record in PostgreSQL
  4. Server returns 201 { user_id, email, name }

LOGIN:
  1. Client POST /auth/login { email, password }
  2. Server verifies password against bcrypt hash
  3. Server generates access_token (15m) + refresh_token (7d)
  4. Server stores refresh_token JTI in DB whitelist
  5. Server returns:
     - Access token in response body
     - Refresh token in HTTP-only, Secure, SameSite=Strict cookie
  6. Client stores access token in memory (NOT localStorage)

AUTHENTICATED REQUEST:
  1. Client includes header: Authorization: Bearer <access_token>
  2. Auth middleware (FastAPI Depends) validates:
     - Signature (RS256 using private/public key pair)
     - Expiration (not expired)
     - User exists and is active
  3. If valid → injects current user into request context
  4. If invalid → returns 401 Unauthorized

TOKEN REFRESH:
  1. Client POST /auth/refresh (refresh token from cookie)
  2. Server validates refresh token signature + expiry
  3. Server checks JTI is still in DB whitelist (not revoked)
  4. Server issues new access_token + new refresh_token
  5. Old refresh token JTI removed from whitelist
  6. Returns new tokens

LOGOUT:
  1. Client POST /auth/logout
  2. Server removes refresh token JTI from DB whitelist
  3. Client clears in-memory access token
```

### 5.4 Authorization

Role-based access control (RBAC) with initial roles:

| Role | Permissions |
|---|---|
| `user` | CRUD own data, access chatbot, view own metrics |
| `premium` | Extended history, priority suggestion generation |
| `admin` | User management, system configuration, audit logs |

---

## 6. Integration Points

### 6.1 DeepSeek API Integration

**Endpoint:** `https://api.deepseek.com/v1/chat/completions`

**Authentication:** Bearer token via `Authorization` header.

**Model:** `deepseek-chat` (or latest available)

**Configuration (environment variables):**

```
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxx
DEEPSEEK_MODEL=deepseek-chat
DEEPSEEK_MAX_TOKENS=1024
DEEPSEEK_TEMPERATURE=0.7
DEEPSEEK_TIMEOUT=30
```

**Rate Limiting:**
- Client-side rate limiter: max 10 requests per minute per user
- Server-side circuit breaker: trip after 5 consecutive failures, reset after 30s

### 6.2 Redis Caching Strategy

| Cache Key Pattern | TTL | Purpose | Invalidation |
|---|---|---|---|
| `user:{id}:profile` | 1 hour | User profile data | On profile update |
| `user:{id}:dashboard` | 5 minutes | Today's dashboard data | On new log entry |
| `user:{id}:metrics:{days}` | 10 minutes | Metrics history | On new weight entry |
| `user:{id}:suggestion:today` | 4 hours | Today's suggestion | On new log, or refresh |
| `chatbot:conversation:{id}` | 1 hour | Recent conversation context | On new message |
| `rate_limit:{user_id}:{endpoint}` | 1 minute | Rate limiting counters | Automatic expiry |
| `deepseek:response:{hash}` | 1 hour | Cache similar chatbot queries | N/A (cache-aside) |

### 6.3 RabbitMQ Messaging

**Exchanges & Queues:**

```
Exchange: health.direct (Direct)
  ├─ Queue: daily.log.created
  │     Routing Key: log.created
  │     Consumer: Suggestion Worker
  │
  ├─ Queue: suggestion.generated
  │     Routing Key: suggestion.generated
  │     Consumer: Notification Worker (future)
  │
  └─ Queue: metrics.calculated
        Routing Key: metrics.calculated
        Consumer: Dashboard update (future)

Exchange: health.delayed (Delayed Message Exchange)
  └─ Queue: suggestion.daily.trigger
        Routing Key: suggestion.daily.trigger
        Consumer: Suggestion Worker (scheduled via Celery Beat)
```

**Message Patterns:**

| Pattern | Description |
|---|---|
| Event-driven | Services publish events when state changes |
| Competing Consumers | Multiple worker instances consume from same queue for horizontal scaling |
| At-least-once delivery | Messages acknowledged only after successful processing |
| Dead Letter Queue | Failed messages routed to `health.dlx` for inspection |

**Sample Message Payload:**

```json
{
  "event_type": "daily.log.created",
  "timestamp": "2026-05-03T06:30:00Z",
  "data": {
    "user_id": "uuid",
    "log_id": "uuid",
    "log_date": "2026-05-03",
    "has_meals": true,
    "has_workouts": true,
    "water_intake": 8,
    "sleep_hours": 7.5,
    "mood_rating": 4
  }
}
```

---

## 7. Deployment Architecture

### 7.1 Docker Compose Topology

```
┌─────────────────────────────────────────────────────────────────┐
│                        Docker Network                           │
│                    health-tracker-network                       │
│                                                                 │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   │
│  │  Nginx   │   │ FastAPI  │   │ Celery   │   │ Celery   │   │
│  │ :443/80  │──>│ :8000    │   │ Worker   │   │ Beat     │   │
│  │ Gateway  │   │ App      │   │ (x2)     │   │ Scheduler│   │
│  └──────────┘   └────┬─────┘   └────┬─────┘   └────┬─────┘   │
│                      │              │              │          │
│                      ▼              ▼              ▼          │
│              ┌──────────┐   ┌──────────┐   ┌──────────┐      │
│              │PostgreSQL│   │  Redis   │   │ RabbitMQ │      │
│              │  :5432   │   │  :6379   │   │ :5672    │      │
│              │          │   │          │   │ :15672   │      │
│              └──────────┘   └──────────┘   └──────────┘      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Docker Compose Service Definitions (Summary)

| Service | Image | Replicas | Ports | Dependencies |
|---|---|---|---|---|
| `nginx` | nginx:alpine | 1 | 80, 443 | app |
| `app` | custom (Dockerfile) | 2 | 8000 | db, redis, rabbitmq |
| `worker` | custom (same image) | 2 | - | db, redis, rabbitmq |
| `beat` | custom (same image) | 1 | - | db, redis, rabbitmq |
| `db` | postgres:15-alpine | 1 | 5432 | - |
| `redis` | redis:7-alpine | 1 | 6379 | - |
| `rabbitmq` | rabbitmq:3-management | 1 | 5672, 15672 | - |

### 7.3 Networking

- All services on an internal bridge network `health-tracker-network`
- Only Nginx exposes ports to the host
- Database port 5432 is NOT exposed to host in production
- Redis and RabbitMQ ports are NOT exposed to host

### 7.4 Environment Segregation

```
dev/       # Docker Compose overrides for local dev (hot reload, exposed DB)
staging/   # Staging environment config
prod/      # Production config (resource limits, health checks, logging drivers)
```

---

## 8. Non-Functional Requirements

### 8.1 Performance

| Metric | Target | Measurement |
|---|---|---|
| API Response Time (p95) | < 500ms | Prometheus + Grafana |
| Chatbot Response Time (p95) | < 5s (includes DeepSeek API call) | Prometheus + Grafana |
| Dashboard Load Time | < 2s | Lighthouse |
| Concurrent Users | 1,000 | Load testing (Locust) |
| Database Query Time (p95) | < 100ms | PGStat statements + slow query log |

### 8.2 Security

- **Transport Security:** TLS 1.3 only (no HTTP in production)
- **Password Storage:** bcrypt with cost factor 12
- **JWT Signing:** RS256 with 2048-bit key pair
- **API Rate Limiting:** 60 req/min per user (general), 10 req/min (chatbot)
- **Input Validation:** Pydantic schemas on all endpoints
- **SQL Injection Prevention:** SQLAlchemy parameterized queries (no raw SQL)
- **CORS:** Whitelist only production frontend domain
- **Helmet Headers:** X-Content-Type-Options, X-Frame-Options, CSP headers via Nginx
- **Secrets Management:** Environment variables via Docker secrets (not plain env files)

### 8.3 Scalability

| Layer | Strategy |
|---|---|
| Application | Horizontal scaling (multiple FastAPI containers behind Nginx round-robin) |
| Database | Read replicas for analytics queries; connection pooling (pgbouncer) |
| Cache | Redis cluster mode for larger deployments |
| Queue | RabbitMQ clustering; competing consumers pattern |
| Workers | Auto-scaled based on queue depth (Celery + RabbitMQ management API) |

### 8.4 Availability

- **Target Uptime:** 99.9% (excluding planned maintenance)
- **Health Checks:** `/health` endpoint on all services (liveness + readiness)
- **Graceful Shutdown:** SIGTERM handler on FastAPI (complete in-flight requests)
- **Database Backups:** Daily automated pg_dump with 7-day retention
- **Disaster Recovery:** Point-in-time recovery from WAL archives

### 8.5 Observability

| Pillar | Tool | Details |
|---|---|---|
| Logging | JSON structured logging (structlog) | Centralized via Docker logging driver |
| Metrics | Prometheus + /metrics endpoint | Request count, latency, error rate, queue depth |
| Tracing | OpenTelemetry (future) | Distributed tracing across services |
| Alerts | Grafana | Alert on p95 latency > 1s, error rate > 1%, queue depth > 1000 |
| Dashboards | Grafana | Pre-built dashboard for system health, API performance, DB metrics |

### 8.6 Data Retention

| Data | Retention | Purge Policy |
|---|---|---|
| Daily logs | 2 years | Monthly batch delete for records > 2 years |
| Chat history | 6 months | Monthly batch delete for conversations > 6 months |
| Suggestions | 3 months | Monthly batch delete |
| Metrics | 5 years | Aggregated to weekly averages after 2 years |
| Refresh tokens | 30 days | Cleanup revoked/expired tokens daily |
| Access logs | 90 days | Log rotation |

---

## Appendices

### A. Technology Versions

| Technology | Version |
|---|---|
| Python | 3.12+ |
| FastAPI | 0.110+ |
| SQLAlchemy | 2.0+ |
| Alembic | 1.13+ |
| React | 18+ |
| Vite | 5+ |
| TailwindCSS | 3.4+ |
| PostgreSQL | 15+ |
| Redis | 7+ |
| RabbitMQ | 3.x |
| Celery | 5.4+ |
| Nginx | 1.25+ |

### B. Environment Variables

```
# Database
DATABASE_URL=postgresql+asyncpg://user:pass@db:5432/healthtracker

# Redis
REDIS_URL=redis://redis:6379/0

# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672/

# DeepSeek
DEEPSEEK_API_KEY=
DEEPSEEK_MODEL=deepseek-chat
DEEPSEEK_MAX_TOKENS=1024
DEEPSEEK_TEMPERATURE=0.7
DEEPSEEK_TIMEOUT=30

# JWT
JWT_PRIVATE_KEY_PATH=/run/secrets/jwt_private.pem
JWT_PUBLIC_KEY_PATH=/run/secrets/jwt_public.pem
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=15
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

# App
APP_ENV=production
APP_DEBUG=false
LOG_LEVEL=info
CORS_ORIGINS=https://app.healthtracker.example.com
```
