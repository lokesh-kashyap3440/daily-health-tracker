# Daily Health Tracker -- Low-Level Design (LLD)

## Table of Contents

1. [Component Specifications](#1-component-specifications)
2. [Data Models](#2-data-models)
3. [API Route Definitions](#3-api-route-definitions)
4. [Database Queries](#4-database-queries)
5. [Caching Strategy](#5-caching-strategy)
6. [Queue Message Schemas](#6-queue-message-schemas)
7. [Chatbot Service](#7-chatbot-service)
8. [Error Handling](#8-error-handling)
9. [Frontend Component Tree](#9-frontend-component-tree)
10. [Frontend State Management](#10-frontend-state-management)

---

## 1. Component Specifications

### 1.1 Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                    # FastAPI app factory, lifespan, middleware
│   ├── config.py                  # Pydantic Settings (env vars)
│   ├── database.py                # AsyncSession engine, sessionmaker
│   ├── dependencies.py            # Depends() for auth, DB session, etc.
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   ├── router.py          # Aggregates all v1 routers
│   │   │   ├── auth.py            # Endpoints: /auth/*
│   │   │   ├── users.py           # Endpoints: /users/*
│   │   │   ├── logs.py            # Endpoints: /logs/*
│   │   │   ├── meals.py           # Endpoints: /logs/meals/*
│   │   │   ├── workouts.py        # Endpoints: /logs/workouts/*
│   │   │   ├── chatbot.py         # Endpoints: /chatbot/*
│   │   │   ├── suggestions.py     # Endpoints: /suggestions/*
│   │   │   └── metrics.py         # Endpoints: /metrics/*
│   │   └── deps.py                # Route-level dependencies
│   │
│   ├── core/
│   │   ├── __init__.py
│   │   ├── auth.py                # JWT creation/validation, password hashing
│   │   ├── security.py            # Rate limiter, CORS config
│   │   └── exceptions.py          # Custom exception classes + handlers
│   │
│   ├── models/                    # SQLAlchemy ORM models
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── daily_log.py
│   │   ├── meal.py
│   │   ├── workout.py
│   │   ├── chat_message.py
│   │   ├── suggestion.py
│   │   ├── weight_record.py
│   │   └── refresh_token.py
│   │
│   ├── schemas/                   # Pydantic request/response schemas
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── user.py
│   │   ├── log.py
│   │   ├── meal.py
│   │   ├── workout.py
│   │   ├── chat.py
│   │   ├── suggestion.py
│   │   ├── metric.py
│   │   └── common.py              # Pagination, error response, etc.
│   │
│   ├── services/                  # Business logic layer
│   │   ├── __init__.py
│   │   ├── auth_service.py
│   │   ├── user_service.py
│   │   ├── log_service.py
│   │   ├── meal_service.py
│   │   ├── workout_service.py
│   │   ├── chatbot_service.py
│   │   ├── suggestion_service.py
│   │   └── metric_service.py
│   │
│   ├── tasks/                     # Celery tasks
│   │   ├── __init__.py
│   │   ├── celery_app.py          # Celery app instance + config
│   │   ├── suggestion_tasks.py    # Daily suggestion generation
│   │   ├── metric_tasks.py        # Background metric calculations
│   │   └── cleanup_tasks.py       # Data retention cleanup jobs
│   │
│   ├── integrations/              # External API clients
│   │   ├── __init__.py
│   │   ├── deepseek.py            # DeepSeek API client
│   │   └── circuit_breaker.py     # Circuit breaker implementation
│   │
│   ├── cache/                     # Redis caching layer
│   │   ├── __init__.py
│   │   ├── redis_client.py        # Redis connection pool
│   │   ├── user_cache.py
│   │   ├── dashboard_cache.py
│   │   └── suggestion_cache.py
│   │
│   └── queue/                     # RabbitMQ messaging
│       ├── __init__.py
│       ├── connection.py          # RabbitMQ connection manager
│       ├── publisher.py           # Event publisher
│       └── consumers.py           # Event consumers (if any in-app)
│
├── alembic/                       # DB migrations
│   ├── env.py
│   ├── versions/
│   └── alembic.ini
│
├── tests/
│   ├── conftest.py
│   ├── test_api/
│   ├── test_services/
│   └── test_tasks/
│
├── Dockerfile
├── requirements.txt
└── pyproject.toml
```

### 1.2 Core Service Specifications

#### 1.2.1 AuthService

```python
class AuthService:
    """
    Handles user registration, authentication, token management.

    Methods:
        register(email, password, name) -> User
            - Validate email uniqueness
            - Hash password with bcrypt (cost=12)
            - Create user record
            - Return user (no token -- login required)

        login(email, password) -> TokenPair
            - Look up user by email
            - Verify password against bcrypt hash
            - Generate access_token (15m) + refresh_token (7d)
            - Store refresh token JTI in DB
            - Return TokenPair(access_token, refresh_token)

        refresh_access_token(refresh_token_str) -> TokenPair
            - Decode refresh token, extract JTI
            - Verify JTI exists in refresh_tokens table (not revoked)
            - Revoke old refresh token
            - Issue new access_token + new refresh_token
            - Return new TokenPair

        logout(user_id, refresh_token_str)
            - Remove refresh token JTI from DB

        change_password(user_id, old_password, new_password)
            - Verify old password
            - Hash and update new password
            - Revoke all refresh tokens for user

        verify_access_token(token) -> TokenData
            - Decode and validate JWT
            - Check user is active
            - Return TokenData(sub=user_id, email, role)
    """

    # Dependencies:
    #   AsyncSession (DB)
    #   Redis (rate limiting, token blacklist)
    #   Settings (JWT keys, expiry config)
```

#### 1.2.2 LogService

```python
class LogService:
    """
    Manages daily health logs.

    Methods:
        get_or_create_today_log(user_id) -> DailyLog
            - Query daily_logs WHERE user_id AND date = today
            - If not found, create new empty log for today
            - Return log (with relationships: meals, workouts)

        get_log_by_date(user_id, date) -> DailyLog | None

        get_logs_in_range(user_id, start_date, end_date) -> List[DailyLog]

        update_water_intake(user_id, date, glasses) -> DailyLog
            - Upsert daily_log row for that date
            - Publish event: daily.log.created (if significant change)

        update_sleep_hours(user_id, date, hours) -> DailyLog

        update_mood(user_id, date, rating) -> DailyLog

        delete_log(user_id, log_id) -> None
            - Cascade delete meals, workouts associated with log
            - Invalidate dashboard cache
    """

    # Dependencies:
    #   AsyncSession (DB)
    #   RedisCache (invalidation)
    #   EventPublisher (RabbitMQ)
    #   UserService (validate user exists)
```

#### 1.2.3 ChatbotService

```python
class ChatbotService:
    """
    Manages chatbot conversations powered by DeepSeek API.

    Methods:
        send_message(user_id, conversation_id, content) -> ChatResponse
            - Load conversation history (last 20 messages)
            - Load user profile context for personalization
            - Build prompt with system + user context + history
            - Call DeepSeek API via DeepSeekClient
            - Persist user message + AI response
            - Return AI response text + metadata

        get_conversation_history(user_id, conversation_id, limit) -> List[ChatMessage]

        delete_conversation(user_id, conversation_id) -> None

        _build_prompt(user_profile, history, user_message) -> List[Dict]
            - Construct message array for DeepSeek API
            - System message with role, constraints, tone
            - Context messages with user profile summary
            - History messages (alternating user/assistant)
            - Current user message

    # Prompt Template (see Section 7 for full prompt design)
    """

    # Dependencies:
    #   DeepSeekClient (httpx-based)
    #   AsyncSession (DB)
    #   Redis (context caching, rate limiting)
    #   UserService (profile data)
```

#### 1.2.4 SuggestionService

```python
class SuggestionService:
    """
    Generates and manages AI-powered daily health suggestions.

    Methods:
        get_today_suggestion(user_id) -> Suggestion | None

        get_recent_suggestions(user_id, limit) -> List[Suggestion]

        generate_daily_suggestion(user_id) -> Suggestion
            - Load last 7 days of logs
            - Load user profile (goals, preferences, metrics)
            - Call DeepSeek API with structured suggestion prompt
            - Persist suggestion to DB
            - Cache in Redis
            - Return Suggestion

        refresh_suggestion(user_id) -> Suggestion
            - Same as generate but force-regenerates even if exists

        dismiss_suggestion(user_id, suggestion_id) -> None

        _build_suggestion_prompt(profile, recent_logs) -> str
            - Construct prompt that asks for a single actionable tip
    """

    # Dependencies:
    #   DeepSeekClient
    #   AsyncSession (DB)
    #   RedisCache (suggestion caching)
    #   LogService (recent logs)
    #   UserService (profile data)
```

---

## 2. Data Models

### 2.1 SQLAlchemy ORM Models

#### 2.1.1 Users

```python
# app/models/user.py
class User(Base):
    __tablename__ = "users"

    id            = Column(UUID, primary_key=True, default=uuid4)
    email         = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    name          = Column(String(100), nullable=False)
    role          = Column(String(20), default="user")  # user | premium | admin
    is_active     = Column(Boolean, default=True)

    # Profile
    age           = Column(Integer, nullable=True)
    height_cm     = Column(Float, nullable=True)         # in cm
    weight_kg     = Column(Float, nullable=True)         # in kg (current)
    dietary_prefs = Column(ARRAY(String), default=[])    # e.g. ["vegetarian", "gluten-free"]
    fitness_goal  = Column(String(50), nullable=True)    # e.g. "weight_loss", "muscle_gain", "general_fitness"
    activity_level = Column(String(20), default="moderate")  # sedentary | light | moderate | active | very_active

    # Settings
    suggestions_enabled = Column(Boolean, default=True)

    # Timestamps
    created_at    = Column(DateTime(timezone=True), server_default=func.now())
    updated_at    = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    daily_logs        = relationship("DailyLog", back_populates="user", cascade="all, delete-orphan")
    chat_messages     = relationship("ChatMessage", back_populates="user", cascade="all, delete-orphan")
    suggestions       = relationship("Suggestion", back_populates="user", cascade="all, delete-orphan")
    weight_records    = relationship("WeightRecord", back_populates="user", cascade="all, delete-orphan")
    refresh_tokens    = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")
```

#### 2.1.2 DailyLogs

```python
# app/models/daily_log.py
class DailyLog(Base):
    __tablename__ = "daily_logs"

    id            = Column(UUID, primary_key=True, default=uuid4)
    user_id       = Column(UUID, ForeignKey("users.id"), nullable=False, index=True)
    log_date      = Column(Date, nullable=False)                    # YYYY-MM-DD

    # Water & Sleep & Mood
    water_glasses = Column(Integer, default=0)                      # number of glasses (~250ml each)
    sleep_hours   = Column(Float, default=0.0)                      # decimal hours, e.g. 7.5
    mood_rating   = Column(Integer, default=3)                      # 1-5 scale

    # Timestamps
    created_at    = Column(DateTime(timezone=True), server_default=func.now())
    updated_at    = Column(DateTime(timezone=True), onupdate=func.now())

    # Constraints
    __table_args__ = (
        UniqueConstraint("user_id", "log_date", name="uq_user_log_date"),
        CheckConstraint("mood_rating >= 1 AND mood_rating <= 5", name="ck_mood_rating"),
        CheckConstraint("water_glasses >= 0", name="ck_water_glasses"),
        CheckConstraint("sleep_hours >= 0 AND sleep_hours <= 24", name="ck_sleep_hours"),
    )

    # Relationships
    user      = relationship("User", back_populates="daily_logs")
    meals     = relationship("Meal", back_populates="daily_log", cascade="all, delete-orphan")
    workouts  = relationship("Workout", back_populates="daily_log", cascade="all, delete-orphan")
```

#### 2.1.3 Meals

```python
# app/models/meal.py
class MealType(str, enum.Enum):
    BREAKFAST = "breakfast"
    LUNCH     = "lunch"
    DINNER    = "dinner"
    SNACK     = "snack"

class Meal(Base):
    __tablename__ = "meals"

    id            = Column(UUID, primary_key=True, default=uuid4)
    daily_log_id  = Column(UUID, ForeignKey("daily_logs.id"), nullable=False, index=True)
    meal_type     = Column(Enum(MealType), nullable=False)
    name          = Column(String(200), nullable=False)              # e.g. "Oatmeal with berries"
    description   = Column(Text, nullable=True)                      # optional notes
    calories      = Column(Integer, nullable=True)                   # estimated calories
    protein_g     = Column(Float, nullable=True)                     # grams
    carbs_g       = Column(Float, nullable=True)                     # grams
    fat_g         = Column(Float, nullable=True)                     # grams

    created_at    = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    daily_log = relationship("DailyLog", back_populates="meals")
```

#### 2.1.4 Workouts

```python
# app/models/workout.py
class Workout(Base):
    __tablename__ = "workouts"

    id            = Column(UUID, primary_key=True, default=uuid4)
    daily_log_id  = Column(UUID, ForeignKey("daily_logs.id"), nullable=False, index=True)
    exercise_type = Column(String(100), nullable=False)              # e.g. "running", "yoga", "weightlifting"
    duration_min  = Column(Integer, nullable=False)                  # minutes
    intensity     = Column(String(20), default="moderate")           # low | moderate | high
    calories_burned = Column(Integer, nullable=True)
    notes         = Column(Text, nullable=True)

    created_at    = Column(DateTime(timezone=True), server_default=func.now())

    # Constraints
    __table_args__ = (
        CheckConstraint("duration_min > 0", name="ck_duration_min"),
    )

    # Relationships
    daily_log = relationship("DailyLog", back_populates="workouts")
```

#### 2.1.5 ChatMessages

```python
# app/models/chat_message.py
class MessageRole(str, enum.Enum):
    USER      = "user"
    ASSISTANT = "assistant"
    SYSTEM    = "system"

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id              = Column(UUID, primary_key=True, default=uuid4)
    user_id         = Column(UUID, ForeignKey("users.id"), nullable=False, index=True)
    conversation_id = Column(UUID, default=uuid4, index=True)        # groups messages into conversations
    role            = Column(Enum(MessageRole), nullable=False)
    content         = Column(Text, nullable=False)
    metadata        = Column(JSONB, nullable=True)                   # token_count, model, latency_ms

    created_at      = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    # Indexes
    __table_args__ = (
        Index("ix_chat_messages_conversation_created", "conversation_id", "created_at"),
    )

    # Relationships
    user = relationship("User", back_populates="chat_messages")
```

#### 2.1.6 Suggestions

```python
# app/models/suggestion.py
class Suggestion(Base):
    __tablename__ = "suggestions"

    id            = Column(UUID, primary_key=True, default=uuid4)
    user_id       = Column(UUID, ForeignKey("users.id"), nullable=False, index=True)
    log_date      = Column(Date, nullable=False)                     # the date this suggestion is FOR
    category      = Column(String(30), nullable=False)               # diet | workout | hydration | sleep | general
    title         = Column(String(200), nullable=False)
    content       = Column(Text, nullable=False)                     # AI-generated tip text
    is_dismissed  = Column(Boolean, default=False)
    metadata      = Column(JSONB, nullable=True)                     # prompt_used, model, token_count

    created_at    = Column(DateTime(timezone=True), server_default=func.now())

    # Constraints
    __table_args__ = (
        UniqueConstraint("user_id", "log_date", name="uq_user_suggestion_date"),
    )

    # Relationships
    user = relationship("User", back_populates="suggestions")
```

#### 2.1.7 WeightRecords

```python
# app/models/weight_record.py
class WeightRecord(Base):
    __tablename__ = "weight_records"

    id            = Column(UUID, primary_key=True, default=uuid4)
    user_id       = Column(UUID, ForeignKey("users.id"), nullable=False, index=True)
    weight_kg     = Column(Float, nullable=False)
    record_date   = Column(Date, nullable=False)
    notes         = Column(Text, nullable=True)

    created_at    = Column(DateTime(timezone=True), server_default=func.now())

    # Constraints
    __table_args__ = (
        UniqueConstraint("user_id", "record_date", name="uq_user_weight_date"),
        CheckConstraint("weight_kg > 0 AND weight_kg < 500", name="ck_weight_kg"),
    )

    # Relationships
    user = relationship("User", back_populates="weight_records")
```

#### 2.1.8 RefreshTokens

```python
# app/models/refresh_token.py
class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id            = Column(UUID, primary_key=True, default=uuid4)
    user_id       = Column(UUID, ForeignKey("users.id"), nullable=False, index=True)
    jti           = Column(String(255), unique=True, nullable=False, index=True)
    expires_at    = Column(DateTime(timezone=True), nullable=False)
    is_revoked    = Column(Boolean, default=False)

    created_at    = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="refresh_tokens")
```

### 2.2 Pydantic Schemas

#### 2.2.1 Auth Schemas

```python
# app/schemas/auth.py

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    name: str = Field(..., min_length=1, max_length=100)

class RegisterResponse(BaseModel):
    user_id: UUID
    email: EmailStr
    name: str
    created_at: datetime

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int                               # seconds until access token expiry

class RefreshRequest(BaseModel):
    refresh_token: str

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=8, max_length=128)
```

#### 2.2.2 User Schemas

```python
# app/schemas/user.py

class UserProfile(BaseModel):
    id: UUID
    email: EmailStr
    name: str
    age: int | None = None
    height_cm: float | None = None
    weight_kg: float | None = None
    dietary_prefs: list[str] = []
    fitness_goal: str | None = None
    activity_level: str = "moderate"
    suggestions_enabled: bool = True

    model_config = ConfigDict(from_attributes=True)

class UpdateProfileRequest(BaseModel):
    name: str | None = None
    age: int | None = Field(None, ge=1, le=150)
    height_cm: float | None = Field(None, gt=0, le=300)
    weight_kg: float | None = Field(None, gt=0, le=500)
    dietary_prefs: list[str] | None = None
    fitness_goal: str | None = None
    activity_level: Literal["sedentary", "light", "moderate", "active", "very_active"] | None = None
    suggestions_enabled: bool | None = None
```

#### 2.2.3 Daily Log Schemas

```python
# app/schemas/log.py

class MealEntry(BaseModel):
    meal_type: Literal["breakfast", "lunch", "dinner", "snack"]
    name: str = Field(..., min_length=1, max_length=200)
    description: str | None = None
    calories: int | None = Field(None, ge=0)
    protein_g: float | None = Field(None, ge=0)
    carbs_g: float | None = Field(None, ge=0)
    fat_g: float | None = Field(None, ge=0)

class WorkoutEntry(BaseModel):
    exercise_type: str = Field(..., min_length=1, max_length=100)
    duration_min: int = Field(..., gt=0, le=1440)
    intensity: Literal["low", "moderate", "high"] = "moderate"
    calories_burned: int | None = Field(None, ge=0)
    notes: str | None = None

class CreateDailyLogRequest(BaseModel):
    log_date: date = Field(default_factory=date.today)
    water_glasses: int = Field(default=0, ge=0)
    sleep_hours: float = Field(default=0.0, ge=0, le=24)
    mood_rating: int = Field(default=3, ge=1, le=5)
    meals: list[MealEntry] = []
    workouts: list[WorkoutEntry] = []

class DailyLogResponse(BaseModel):
    id: UUID
    log_date: date
    water_glasses: int
    sleep_hours: float
    mood_rating: int
    meals: list[MealEntry]
    workouts: list[WorkoutEntry]
    created_at: datetime
    updated_at: datetime | None

    model_config = ConfigDict(from_attributes=True)

class UpdateWaterRequest(BaseModel):
    glasses: int = Field(..., ge=0)

class UpdateSleepRequest(BaseModel):
    hours: float = Field(..., ge=0, le=24)

class UpdateMoodRequest(BaseModel):
    rating: int = Field(..., ge=1, le=5)
```

#### 2.2.4 Chat Schemas

```python
# app/schemas/chat.py

class SendMessageRequest(BaseModel):
    conversation_id: UUID | None = None     # None = start new conversation
    content: str = Field(..., min_length=1, max_length=2000)

class ChatResponse(BaseModel):
    conversation_id: UUID
    message_id: UUID
    role: str = "assistant"
    content: str
    created_at: datetime

class ConversationMessage(BaseModel):
    id: UUID
    role: str
    content: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ConversationHistory(BaseModel):
    conversation_id: UUID
    messages: list[ConversationMessage]
    total_count: int
```

#### 2.2.5 Suggestion Schemas

```python
# app/schemas/suggestion.py

class SuggestionResponse(BaseModel):
    id: UUID
    log_date: date
    category: str                       # diet | workout | hydration | sleep | general
    title: str
    content: str
    is_dismissed: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class SuggestionListResponse(BaseModel):
    suggestions: list[SuggestionResponse]
    total: int
```

#### 2.2.6 Metric Schemas

```python
# app/schemas/metric.py

class RecordWeightRequest(BaseModel):
    weight_kg: float = Field(..., gt=0, le=500)
    record_date: date = Field(default_factory=date.today)
    notes: str | None = None

class WeightDataPoint(BaseModel):
    date: date
    weight_kg: float

class BMIDataPoint(BaseModel):
    date: date
    bmi: float                              # calculated as weight / (height_m)^2

class MetricsResponse(BaseModel):
    weight_history: list[WeightDataPoint]
    bmi_history: list[BMIDataPoint]

class MetricsSummary(BaseModel):
    period_start: date
    period_end: date
    avg_water_glasses: float
    avg_sleep_hours: float
    avg_mood: float
    total_workouts: int
    avg_daily_calories: float | None
    weight_change_kg: float | None
```

#### 2.2.7 Common Schemas

```python
# app/schemas/common.py

class ErrorResponse(BaseModel):
    detail: str
    error_code: str | None = None
    field: str | None = None                  # for validation errors

class PaginationParams(BaseModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)

class PaginatedResponse(BaseModel):
    items: list
    total: int
    page: int
    page_size: int
    total_pages: int
```

---

## 3. API Route Definitions

### 3.1 Auth Routes

```
POST /api/v1/auth/register
  Request:  RegisterRequest
  Response: 201 RegisterResponse
  Errors:   409 (email exists), 422 (validation)

POST /api/v1/auth/login
  Request:  LoginRequest
  Response: 200 TokenPair
  Errors:   401 (invalid credentials), 422 (validation)

POST /api/v1/auth/refresh
  Request:  RefreshRequest (or cookie)
  Response: 200 TokenPair
  Errors:   401 (invalid/expired refresh token)

POST /api/v1/auth/logout
  Headers:  Authorization: Bearer <access_token>
  Request:  { "refresh_token": "..." }
  Response: 204 No Content
  Errors:   401 (unauthorized)

POST /api/v1/auth/change-password
  Headers:  Authorization: Bearer <access_token>
  Request:  ChangePasswordRequest
  Response: 204 No Content
  Errors:   400 (wrong old password), 401 (unauthorized)
```

### 3.2 User Routes

```
GET /api/v1/users/me
  Headers:  Authorization: Bearer <access_token>
  Response: 200 UserProfile
  Errors:   401 (unauthorized)

PUT /api/v1/users/me
  Headers:  Authorization: Bearer <access_token>
  Request:  UpdateProfileRequest
  Response: 200 UserProfile
  Errors:   401, 422

GET /api/v1/users/me/preferences
  Headers:  Authorization: Bearer <access_token>
  Response: 200 { dietary_prefs, fitness_goal, activity_level, suggestions_enabled }
  Errors:   401

PUT /api/v1/users/me/preferences
  Headers:  Authorization: Bearer <access_token>
  Request:  { dietary_prefs?, fitness_goal?, activity_level?, suggestions_enabled? }
  Response: 200 (updated preferences)
  Errors:   401, 422
```

### 3.3 Daily Log Routes

```
POST /api/v1/logs/daily
  Headers:  Authorization: Bearer <access_token>
  Request:  CreateDailyLogRequest
  Response: 201 DailyLogResponse
  Errors:   401, 409 (log already exists for date), 422

GET /api/v1/logs/daily
  Headers:  Authorization: Bearer <access_token>
  Response: 200 DailyLogResponse (today's log, empty if none)
  Errors:   401

GET /api/v1/logs/daily/date/{date}
  Headers:  Authorization: Bearer <access_token>
  Params:   date (YYYY-MM-DD)
  Response: 200 DailyLogResponse | 404
  Errors:   401, 422

GET /api/v1/logs/daily/range
  Headers:  Authorization: Bearer <access_token>
  Query:    start (YYYY-MM-DD), end (YYYY-MM-DD), page, page_size
  Response: 200 PaginatedResponse[DailyLogResponse]
  Errors:   401, 422

DELETE /api/v1/logs/daily/{log_id}
  Headers:  Authorization: Bearer <access_token>
  Response: 204 No Content
  Errors:   401, 404, 403 (not owner)
```

### 3.4 Meal Routes

```
POST /api/v1/logs/meals
  Headers:  Authorization: Bearer <access_token>
  Request:  { daily_log_id, meal_type, name, description?, calories?, protein_g?, carbs_g?, fat_g? }
  Response: 201 MealEntry
  Errors:   401, 404 (daily_log not found), 422

PUT /api/v1/logs/meals/{meal_id}
  Headers:  Authorization: Bearer <access_token>
  Request:  Partial[MealEntry]
  Response: 200 MealEntry
  Errors:   401, 404, 403, 422

DELETE /api/v1/logs/meals/{meal_id}
  Headers:  Authorization: Bearer <access_token>
  Response: 204 No Content
  Errors:   401, 404, 403

GET /api/v1/logs/meals
  Headers:  Authorization: Bearer <access_token>
  Query:    start, end (optional date filter)
  Response: 200 list[MealEntry]
  Errors:   401
```

### 3.5 Workout Routes

```
POST /api/v1/logs/workouts
  Headers:  Authorization: Bearer <access_token>
  Request:  { daily_log_id, exercise_type, duration_min, intensity?, calories_burned?, notes? }
  Response: 201 WorkoutEntry
  Errors:   401, 404, 422

PUT /api/v1/logs/workouts/{workout_id}
  Headers:  Authorization: Bearer <access_token>
  Request:  Partial[WorkoutEntry]
  Response: 200 WorkoutEntry
  Errors:   401, 404, 403, 422

DELETE /api/v1/logs/workouts/{workout_id}
  Headers:  Authorization: Bearer <access_token>
  Response: 204 No Content
  Errors:   401, 404, 403

GET /api/v1/logs/workouts
  Headers:  Authorization: Bearer <access_token>
  Query:    start, end (optional date filter)
  Response: 200 list[WorkoutEntry]
  Errors:   401
```

### 3.6 Water, Sleep, Mood Routes

```
PUT /api/v1/logs/daily/water
  Headers:  Authorization: Bearer <access_token>
  Request:  UpdateWaterRequest
  Response: 200 DailyLogResponse
  Errors:   401, 422

PUT /api/v1/logs/daily/sleep
  Headers:  Authorization: Bearer <access_token>
  Request:  UpdateSleepRequest
  Response: 200 DailyLogResponse
  Errors:   401, 422

PUT /api/v1/logs/daily/mood
  Headers:  Authorization: Bearer <access_token>
  Request:  UpdateMoodRequest
  Response: 200 DailyLogResponse
  Errors:   401, 422
```

### 3.7 Chatbot Routes

```
POST /api/v1/chatbot/message
  Headers:  Authorization: Bearer <access_token>
  Request:  SendMessageRequest
  Response: 200 ChatResponse
  Errors:   401, 429 (rate limited), 502 (DeepSeek API error), 422

GET /api/v1/chatbot/history
  Headers:  Authorization: Bearer <access_token>
  Query:    conversation_id?, limit (default 50), before (cursor pagination)
  Response: 200 ConversationHistory
  Errors:   401

DELETE /api/v1/chatbot/history/{conversation_id}
  Headers:  Authorization: Bearer <access_token>
  Response: 204 No Content
  Errors:   401, 404
```

### 3.8 Suggestion Routes

```
GET /api/v1/suggestions/today
  Headers:  Authorization: Bearer <access_token>
  Response: 200 SuggestionResponse | 404 (not yet generated)
  Errors:   401

GET /api/v1/suggestions
  Headers:  Authorization: Bearer <access_token>
  Query:    limit (default 10), include_dismissed (bool)
  Response: 200 SuggestionListResponse
  Errors:   401

POST /api/v1/suggestions/refresh
  Headers:  Authorization: Bearer <access_token>
  Response: 200 SuggestionResponse (generated synchronously)
  Errors:   401, 429 (too frequent)

PUT /api/v1/suggestions/{id}/dismiss
  Headers:  Authorization: Bearer <access_token>
  Response: 204 No Content
  Errors:   401, 404, 403
```

### 3.9 Metric Routes

```
GET /api/v1/metrics/weight
  Headers:  Authorization: Bearer <access_token>
  Query:    days (default 30, max 365)
  Response: 200 { records: list[WeightDataPoint] }
  Errors:   401

GET /api/v1/metrics/bmi
  Headers:  Authorization: Bearer <access_token>
  Query:    days (default 30, max 365)
  Response: 200 { records: list[BMIDataPoint] }
  Errors:   401 (needs height set in profile)

POST /api/v1/metrics/weight
  Headers:  Authorization: Bearer <access_token>
  Request:  RecordWeightRequest
  Response: 201 WeightDataPoint
  Errors:   401, 409 (already recorded for date), 422

GET /api/v1/metrics/summary
  Headers:  Authorization: Bearer <access_token>
  Query:    start, end (default: last 7 days)
  Response: 200 MetricsSummary
  Errors:   401
```

### 3.10 Health Check

```
GET /api/v1/health
  Response: 200 {
    status: "healthy",
    version: "1.0.0",
    database: "connected",
    redis: "connected",
    rabbitmq: "connected",
    timestamp: "2026-05-03T12:00:00Z"
  }
```

---

## 4. Database Queries

### 4.1 SQLAlchemy Patterns

All queries use **async SQLAlchemy 2.0** style with `select()` constructs.

#### 4.1.1 User Lookup (Login)

```python
# AsyncSession: execute -> scalars -> one_or_none
stmt = select(User).where(User.email == email)
result = await db.execute(stmt)
user = result.scalars().one_or_none()
```

#### 4.1.2 Get or Create Today's Log

```python
@async_session_maker
async def get_or_create_today_log(db: AsyncSession, user_id: UUID) -> DailyLog:
    today = date.today()

    # Try to get existing log
    stmt = (
        select(DailyLog)
        .options(selectinload(DailyLog.meals), selectinload(DailyLog.workouts))
        .where(DailyLog.user_id == user_id, DailyLog.log_date == today)
    )
    result = await db.execute(stmt)
    log = result.scalars().one_or_none()

    if log:
        return log

    # Create new log for today
    log = DailyLog(user_id=user_id, log_date=today)
    db.add(log)
    await db.commit()
    await db.refresh(log)
    return log
```

#### 4.1.3 Date Range Query with Pagination

```python
async def get_logs_in_range(
    db: AsyncSession,
    user_id: UUID,
    start_date: date,
    end_date: date,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[DailyLog], int]:
    # Count total
    count_stmt = (
        select(func.count(DailyLog.id))
        .where(
            DailyLog.user_id == user_id,
            DailyLog.log_date.between(start_date, end_date),
        )
    )
    total = (await db.execute(count_stmt)).scalar_one()

    # Fetch page
    query = (
        select(DailyLog)
        .options(selectinload(DailyLog.meals), selectinload(DailyLog.workouts))
        .where(
            DailyLog.user_id == user_id,
            DailyLog.log_date.between(start_date, end_date),
        )
        .order_by(desc(DailyLog.log_date))
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    result = await db.execute(query)
    logs = result.scalars().unique().all()

    return logs, total
```

#### 4.1.4 Aggregate Metrics for Summary

```python
async def get_metrics_summary(
    db: AsyncSession,
    user_id: UUID,
    start_date: date,
    end_date: date,
) -> dict:
    stmt = (
        select(
            func.coalesce(func.avg(DailyLog.water_glasses), 0).label("avg_water"),
            func.coalesce(func.avg(DailyLog.sleep_hours), 0).label("avg_sleep"),
            func.coalesce(func.avg(DailyLog.mood_rating), 0).label("avg_mood"),
            func.count(DailyLog.id).label("total_days"),
        )
        .where(
            DailyLog.user_id == user_id,
            DailyLog.log_date.between(start_date, end_date),
        )
    )
    result = await db.execute(stmt)
    row = result.one()

    # Count workouts in range
    workout_stmt = (
        select(func.count(Workout.id))
        .join(DailyLog)
        .where(
            DailyLog.user_id == user_id,
            DailyLog.log_date.between(start_date, end_date),
        )
    )
    total_workouts = (await db.execute(workout_stmt)).scalar_one()

    # Average daily calories from meals
    calories_stmt = (
        select(func.coalesce(func.avg(Meal.calories), 0))
        .join(DailyLog)
        .where(
            DailyLog.user_id == user_id,
            DailyLog.log_date.between(start_date, end_date),
        )
    )
    avg_calories = (await db.execute(calories_stmt)).scalar_one()

    return {
        "avg_water": round(row.avg_water, 1),
        "avg_sleep": round(row.avg_sleep, 1),
        "avg_mood": round(row.avg_mood, 1),
        "total_workouts": total_workouts,
        "avg_calories": round(avg_calories, 0),
    }
```

#### 4.1.5 Last Weight Change

```python
async def get_weight_change(
    db: AsyncSession,
    user_id: UUID,
    start_date: date,
    end_date: date,
) -> float | None:
    # Get first and last weight record in range
    first_stmt = (
        select(WeightRecord.weight_kg)
        .where(
            WeightRecord.user_id == user_id,
            WeightRecord.record_date.between(start_date, end_date),
        )
        .order_by(WeightRecord.record_date.asc())
        .limit(1)
    )
    last_stmt = (
        select(WeightRecord.weight_kg)
        .where(
            WeightRecord.user_id == user_id,
            WeightRecord.record_date.between(start_date, end_date),
        )
        .order_by(WeightRecord.record_date.desc())
        .limit(1)
    )

    first = (await db.execute(first_stmt)).scalar_one_or_none()
    last = (await db.execute(last_stmt)).scalar_one_or_none()

    if first is not None and last is not None:
        return round(last - first, 2)
    return None
```

#### 4.1.6 Chat History Load (for context window)

```python
async def get_recent_conversation(
    db: AsyncSession,
    user_id: UUID,
    conversation_id: UUID,
    limit: int = 20,
) -> list[ChatMessage]:
    stmt = (
        select(ChatMessage)
        .where(
            ChatMessage.user_id == user_id,
            ChatMessage.conversation_id == conversation_id,
            ChatMessage.role.in_([MessageRole.USER, MessageRole.ASSISTANT]),
        )
        .order_by(desc(ChatMessage.created_at))
        .limit(limit)
    )
    result = await db.execute(stmt)
    messages = result.scalars().all()
    return list(reversed(messages))  # oldest first
```

### 4.2 Indexes

```sql
-- Composite indexes for common query patterns
CREATE INDEX ix_daily_logs_user_date ON daily_logs (user_id, log_date DESC);
CREATE INDEX ix_meals_log_type ON meals (daily_log_id, meal_type);
CREATE INDEX ix_workouts_log ON workouts (daily_log_id);
CREATE INDEX ix_chat_conversation_created ON chat_messages (conversation_id, created_at);
CREATE INDEX ix_weight_user_date ON weight_records (user_id, record_date DESC);
CREATE INDEX ix_suggestions_user_date ON suggestions (user_id, log_date DESC);
CREATE INDEX ix_refresh_tokens_jti ON refresh_tokens (jti);
```

---

## 5. Caching Strategy

### 5.1 Redis Connection

```python
# app/cache/redis_client.py
import redis.asyncio as aioredis

class RedisClient:
    def __init__(self, redis_url: str):
        self.pool = aioredis.ConnectionPool.from_url(
            redis_url,
            max_connections=20,
            decode_responses=True,
        )
        self.client: aioredis.Redis | None = None

    async def connect(self):
        self.client = aioredis.Redis(connection_pool=self.pool)

    async def close(self):
        if self.client:
            await self.client.close()

    async def ping(self) -> bool:
        try:
            return await self.client.ping()
        except Exception:
            return False

# Singleton
redis_client = RedisClient(settings.REDIS_URL)
```

### 5.2 Cache Decorator Pattern

```python
# app/cache/decorators.py
import hashlib
import json
from functools import wraps
from typing import Any, Callable

def cached(ttl: int, key_prefix: str):
    """
    Decorator that caches function return values in Redis.

    Key format: {key_prefix}:{arg_hash}
    TTL in seconds.
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Generate cache key from args
            cache_data = json.dumps({
                "args": [str(a) for a in args],
                "kwargs": {k: str(v) for k, v in kwargs.items()},
            }, sort_keys=True)
            key_hash = hashlib.md5(cache_data.encode()).hexdigest()
            cache_key = f"{key_prefix}:{key_hash}"

            # Try cache
            cached_value = await redis_client.client.get(cache_key)
            if cached_value is not None:
                return json.loads(cached_value)

            # Execute and cache
            result = await func(*args, **kwargs)
            await redis_client.client.setex(
                cache_key, ttl, json.dumps(result, default=str)
            )
            return result
        return wrapper
    return decorator
```

### 5.3 Cache Key Matrix

| Key Pattern | TTL | When Cached | When Invalidated | Data Stored |
|---|---|---|---|---|
| `user:{id}:profile` | 3600s (1h) | After profile fetch | On profile update | JSON `UserProfile` |
| `user:{id}:dashboard` | 300s (5m) | After dashboard load | On new log entry | JSON `DailyLogResponse` |
| `user:{id}:metrics:{days}` | 600s (10m) | After metrics fetch | On new weight record | JSON list of data points |
| `user:{id}:suggestion:today` | 14400s (4h) | After suggestion gen | On new log / refresh | JSON `SuggestionResponse` |
| `chatbot:conversation:{id}` | 3600s (1h) | After conversation load | On new message | JSON last N messages |
| `deepseek:response:{md5}` | 3600s (1h) | After successful API call | N/A (cache-aside) | JSON `ChatResponse` |
| `rate_limit:{user_id}:{ep}` | 60s (1m) | On each request | Auto-expire | Counter value |
| `health:cache` | 10s | Health check ping | Auto-expire | JSON status |

### 5.4 Invalidation Strategy

```python
# app/cache/invalidation.py

async def invalidate_user_cache(user_id: UUID):
    """Invalidate all caches for a user after a mutation."""
    await asyncio.gather(
        redis_client.client.delete(f"user:{user_id}:profile"),
        redis_client.client.delete(f"user:{user_id}:dashboard"),
        redis_client.client.delete(f"user:{user_id}:suggestion:today"),
        # Metrics cache is keyed by days param, so we delete pattern
        _delete_pattern(f"user:{user_id}:metrics:*"),
    )

async def _delete_pattern(pattern: str):
    """Delete all keys matching a glob pattern."""
    cursor = 0
    while True:
        cursor, keys = await redis_client.client.scan(
            cursor=cursor, match=pattern, count=100
        )
        if keys:
            await redis_client.client.delete(*keys)
        if cursor == 0:
            break
```

---

## 6. Queue Message Schemas

### 6.1 RabbitMQ Connection & Setup

```python
# app/queue/connection.py
import aio_pika

class QueueConnection:
    def __init__(self, rabbitmq_url: str):
        self.url = rabbitmq_url
        self.connection: aio_pika.RobustConnection | None = None
        self.channel: aio_pika.RobustChannel | None = None

    async def connect(self):
        self.connection = await aio_pika.connect_robust(self.url)
        self.channel = await self.connection.channel()
        await self._declare_topology()

    async def _declare_topology(self):
        # Main exchange
        self.main_exchange = await self.channel.declare_exchange(
            "health.direct", aio_pika.ExchangeType.DIRECT, durable=True
        )
        # DLX for dead letters
        self.dlx_exchange = await self.channel.declare_exchange(
            "health.dlx", aio_pika.ExchangeType.FANOUT, durable=True
        )
        # Queues
        log_queue = await self.channel.declare_queue(
            "daily.log.created", durable=True
        )
        await log_queue.bind(self.main_exchange, routing_key="log.created")

        suggestion_queue = await self.channel.declare_queue(
            "suggestion.generated", durable=True
        )
        await suggestion_queue.bind(self.main_exchange, routing_key="suggestion.generated")

        # DLQ for each primary queue
        dlq_log = await self.channel.declare_queue(
            "daily.log.created.dlq", durable=True
        )
        await dlq_log.bind(self.dlx_exchange)
```

### 6.2 Event Publisher

```python
# app/queue/publisher.py
import json
import uuid
from datetime import datetime, timezone

class EventPublisher:
    def __init__(self, channel):
        self.channel = channel
        self.exchange = "health.direct"

    async def publish(self, routing_key: str, data: dict):
        """Publish an event with guaranteed delivery."""
        message = aio_pika.Message(
            body=json.dumps({
                "event_id": str(uuid.uuid4()),
                "event_type": routing_key,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "data": data,
            }).encode(),
            delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
            content_type="application/json",
        )
        await self.channel.default_exchange.publish(
            message, routing_key=routing_key
        )
```

### 6.3 Message Formats

#### 6.3.1 `daily.log.created`

```json
{
  "event_id": "a1b2c3d4-...",
  "event_type": "daily.log.created",
  "timestamp": "2026-05-03T06:30:00.000Z",
  "data": {
    "user_id": "uuid-...",
    "log_id": "uuid-...",
    "log_date": "2026-05-03",
    "has_meals": true,
    "has_workouts": false,
    "water_glasses": 8,
    "sleep_hours": 7.5,
    "mood_rating": 4
  }
}
```

#### 6.3.2 `suggestion.generated`

```json
{
  "event_id": "b2c3d4e5-...",
  "event_type": "suggestion.generated",
  "timestamp": "2026-05-03T06:00:00.000Z",
  "data": {
    "user_id": "uuid-...",
    "suggestion_id": "uuid-...",
    "category": "diet",
    "title": "Hydrate Before Meals",
    "summary": "Drink a glass of water 30 minutes before each meal..."
  }
}
```

#### 6.3.4 Celery Beat Schedule

```python
# app/tasks/celery_app.py
from celery import Celery
from celery.schedules import crontab

celery_app = Celery("health_tracker")
celery_app.config_from_object({
    "broker_url": settings.RABBITMQ_URL,
    "result_backend": settings.REDIS_URL,
    "task_serializer": "json",
    "accept_content": ["json"],
    "result_serializer": "json",
    "task_track_started": True,
    "task_time_limit": 120,
    "task_soft_time_limit": 90,
    "worker_prefetch_multiplier": 1,
    "task_acks_late": True,
})

celery_app.conf.beat_schedule = {
    "generate-daily-suggestions": {
        "task": "app.tasks.suggestion_tasks.generate_daily_suggestions",
        "schedule": crontab(hour=6, minute=0),     # 6 AM daily
    },
    "cleanup-expired-refresh-tokens": {
        "task": "app.tasks.cleanup_tasks.cleanup_refresh_tokens",
        "schedule": crontab(hour=3, minute=0),     # 3 AM daily
    },
    "cleanup-old-chat-history": {
        "task": "app.tasks.cleanup_tasks.cleanup_chat_history",
        "schedule": crontab(hour=3, minute=30),    # 3:30 AM daily
    },
}
```

---

## 7. Chatbot Service

### 7.1 DeepSeek API Client

```python
# app/integrations/deepseek.py
import hashlib
import json
from typing import AsyncIterator

import httpx

class DeepSeekClient:
    """HTTP client for DeepSeek Chat Completions API."""

    BASE_URL = "https://api.deepseek.com/v1"

    def __init__(
        self,
        api_key: str,
        model: str = "deepseek-chat",
        max_tokens: int = 1024,
        temperature: float = 0.7,
        timeout: int = 30,
    ):
        self.api_key = api_key
        self.model = model
        self.max_tokens = max_tokens
        self.temperature = temperature
        self.timeout = timeout
        self.client = httpx.AsyncClient(
            base_url=self.BASE_URL,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            timeout=httpx.Timeout(timeout, connect=10),
        )

    async def chat_completion(
        self,
        messages: list[dict],
        user_id: str | None = None,
    ) -> dict:
        """Send chat messages to DeepSeek and get completion.

        Returns:
            {
                "content": str,
                "model": str,
                "usage": { "prompt_tokens": int, "completion_tokens": int, "total_tokens": int }
            }
        """
        payload = {
            "model": self.model,
            "messages": messages,
            "max_tokens": self.max_tokens,
            "temperature": self.temperature,
        }
        if user_id:
            payload["user"] = user_id

        response = await self.client.post("/chat/completions", json=payload)
        response.raise_for_status()

        data = response.json()
        choice = data["choices"][0]

        return {
            "content": choice["message"]["content"],
            "model": data["model"],
            "usage": data["usage"],
        }

    async def close(self):
        await self.client.aclose()
```

### 7.2 Prompt Engineering

#### 7.2.1 Chatbot System Prompt

```
You are an expert health and wellness coach powered by DeepSeek. Your role is to
provide personalized diet tips, workout advice, nutrition guidance, and general
wellness support. Follow these guidelines strictly:

1. BE SPECIFIC AND ACTIONABLE: Always give concrete, actionable advice. Avoid
   vague suggestions like "eat healthier." Instead say "swap white rice for
   quinoa or cauliflower rice to increase fiber intake."

2. USE USER CONTEXT: Reference the user's profile (age, goals, preferences,
   activity level) when giving advice. If they are vegetarian, do not recommend
   meat-based protein sources.

3. ADMIT LIMITATIONS: If asked for medical advice, diagnosis, or prescription
   information, clearly state "I am an AI wellness coach, not a medical
   professional. Please consult your doctor for medical advice."

4. STAY POSITIVE AND MOTIVATIONAL: Use encouraging language. Acknowledge the
   user's efforts. Keep tone warm, supportive, and professional.

5. BE CONCISE: Keep responses to 3-5 paragraphs maximum. Use bullet points
   for lists. No markdown formatting in responses.

6. PULL FROM RECENT LOGS: When the user references their recent activity,
   acknowledge their actual logged data (e.g., "I see you did 30 minutes of
   running yesterday -- great job!").

7. NO HALLUCINATED DATA: Never invent specific calorie counts, exercise
   regimens, or meal plans. Provide general guidance only.

8. RESPECT BOUNDARIES: Do not discuss sensitive health conditions, weight in
   judgmental terms, or encourage extreme dieting/exercise.
```

#### 7.2.2 Context Assembly

```python
# app/services/chatbot_service.py

async def _build_prompt(
    self,
    user_profile: UserProfile,
    recent_logs: list[DailyLog],
    conversation_history: list[ChatMessage],
    user_message: str,
) -> list[dict]:
    """Construct the message array for DeepSeek API."""

    system_prompt = _SYSTEM_PROMPT  # (from 7.2.1)

    # Build context block about user
    context_parts = [
        f"User Profile:",
        f"- Age: {user_profile.age or 'Not specified'}",
        f"- Height: {user_profile.height_cm or 'Not specified'} cm",
        f"- Dietary Preferences: {', '.join(user_profile.dietary_prefs) or 'None specified'}",
        f"- Fitness Goal: {user_profile.fitness_goal or 'Not specified'}",
        f"- Activity Level: {user_profile.activity_level}",
    ]

    # Add recent log summary if available
    if recent_logs:
        context_parts.append("\nRecent Activity (last 7 days):")
        for log in recent_logs[-7:]:
            meals_str = ", ".join(
                f"{m.meal_type.value}: {m.name}" for m in log.meals
            ) or "No meals logged"
            workouts_str = ", ".join(
                f"{w.exercise_type} ({w.duration_min}min)" for w in log.workouts
            ) or "No workouts"
            context_parts.append(
                f"- {log.log_date}: Meals [{meals_str}] | "
                f"Workouts [{workouts_str}] | "
                f"Water: {log.water_glasses} glasses | "
                f"Sleep: {log.sleep_hours}h | "
                f"Mood: {log.mood_rating}/5"
            )

    context_block = "\n".join(context_parts)

    # Build message list
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "system", "content": f"Here is the user's current context:\n{context_block}"},
    ]

    # Add conversation history (max 20 messages, exclude system messages in stored history)
    for msg in conversation_history[-20:]:
        messages.append({
            "role": msg.role.value,
            "content": msg.content,
        })

    # Add current user message
    messages.append({"role": "user", "content": user_message})

    return messages
```

#### 7.2.3 Suggestion Generation Prompt

```
Based on the user's health data below, generate ONE specific, actionable health
tip for today. The tip should address the most impactful area for improvement.

User Profile:
- Age: {age}
- Goals: {fitness_goal}
- Diet: {dietary_prefs}
- Activity: {activity_level}

Recent 7-Day Summary:
{recent_logs_summary}

Response format (return ONLY valid JSON, no other text):
{
  "category": "diet" | "workout" | "hydration" | "sleep" | "general",
  "title": "Short, catchy title (under 60 chars)",
  "content": "Specific actionable tip (2-4 sentences). Reference user's actual data."
}
```

### 7.3 Conversation Management

```python
# app/services/chatbot_service.py

MAX_HISTORY_LENGTH = 50  # max messages per conversation stored in DB
CONTEXT_WINDOW_SIZE = 20  # messages sent to DeepSeek per request
CACHE_TTL = 3600  # 1 hour cache for conversation context
RATE_LIMIT = 10  # max requests per minute per user

class ChatbotService:
    async def send_message(
        self,
        user_id: UUID,
        conversation_id: UUID | None,
        content: str,
    ) -> ChatResponse:
        # 1. Rate limiting check
        await self._check_rate_limit(user_id)

        # 2. Create or retrieve conversation
        if conversation_id is None:
            conversation_id = uuid4()

        # 3. Load conversation history
        history = await self._load_history(user_id, conversation_id)

        # 4. Load user profile and recent logs for context
        profile = await self.user_service.get_profile(user_id)
        recent_logs = await self.log_service.get_logs_in_range(
            user_id, date.today() - timedelta(days=7), date.today()
        )

        # 5. Build prompt
        messages = await self._build_prompt(profile, recent_logs, history, content)

        # 6. Call DeepSeek (with circuit breaker)
        try:
            response = await self.deepseek_client.chat_completion(
                messages, user_id=str(user_id)
            )
        except httpx.HTTPStatusError as e:
            raise ChatbotAPIError("DeepSeek API error", status_code=e.response.status_code)
        except httpx.TimeoutException:
            raise ChatbotTimeoutError("DeepSeek API timed out")

        # 7. Persist messages
        user_msg = ChatMessage(
            user_id=user_id,
            conversation_id=conversation_id,
            role=MessageRole.USER,
            content=content,
        )
        ai_msg = ChatMessage(
            user_id=user_id,
            conversation_id=conversation_id,
            role=MessageRole.ASSISTANT,
            content=response["content"],
            metadata={
                "model": response["model"],
                "prompt_tokens": response["usage"]["prompt_tokens"],
                "completion_tokens": response["usage"]["completion_tokens"],
                "total_tokens": response["usage"]["total_tokens"],
            },
        )
        self.db.add_all([user_msg, ai_msg])
        await self.db.commit()
        await self.db.refresh(ai_msg)

        # 8. Trim history if needed
        await self._trim_history_if_needed(user_id, conversation_id)

        # 9. Invalidate conversation cache
        await self.cache.delete(f"chatbot:conversation:{conversation_id}")

        return ChatResponse(
            conversation_id=conversation_id,
            message_id=ai_msg.id,
            content=response["content"],
            created_at=ai_msg.created_at,
        )
```

---

## 8. Error Handling

### 8.1 Custom Exception Classes

```python
# app/core/exceptions.py

class AppException(Exception):
    """Base application exception."""
    def __init__(self, detail: str, error_code: str | None = None, status_code: int = 500):
        self.detail = detail
        self.error_code = error_code
        self.status_code = status_code

class NotFoundException(AppException):
    def __init__(self, entity: str, entity_id: str):
        super().__init__(
            detail=f"{entity} not found: {entity_id}",
            error_code="NOT_FOUND",
            status_code=404,
        )

class UnauthorizedException(AppException):
    def __init__(self, detail: str = "Not authenticated"):
        super().__init__(detail=detail, error_code="UNAUTHORIZED", status_code=401)

class ForbiddenException(AppException):
    def __init__(self, detail: str = "Not authorized"):
        super().__init__(detail=detail, error_code="FORBIDDEN", status_code=403)

class ConflictException(AppException):
    def __init__(self, detail: str):
        super().__init__(detail=detail, error_code="CONFLICT", status_code=409)

class ValidationException(AppException):
    def __init__(self, detail: str, field: str | None = None):
        super().__init__(detail=detail, error_code="VALIDATION_ERROR", status_code=422)
        self.field = field

class RateLimitException(AppException):
    def __init__(self, detail: str = "Too many requests"):
        super().__init__(detail=detail, error_code="RATE_LIMITED", status_code=429)

class ExternalAPIException(AppException):
    def __init__(self, detail: str, status_code: int = 502):
        super().__init__(detail=detail, error_code="EXTERNAL_API_ERROR", status_code=status_code)
```

### 8.2 Global Exception Handler

```python
# app/main.py (inside app factory)

@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.detail,
            "error_code": exc.error_code,
        },
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    return JSONResponse(
        status_code=422,
        content={
            "detail": "Validation failed",
            "error_code": "VALIDATION_ERROR",
            "errors": [
                {
                    "field": ".".join(str(loc) for loc in err["loc"]),
                    "message": err["msg"],
                }
                for err in errors
            ],
        },
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception")
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "error_code": "INTERNAL_ERROR",
        },
    )
```

### 8.3 Retry & Circuit Breaker

```python
# app/integrations/circuit_breaker.py

import asyncio
from enum import Enum

class CircuitState(Enum):
    CLOSED = "closed"       # Normal operation
    OPEN = "open"           # Failing, rejecting requests
    HALF_OPEN = "half_open" # Testing if service recovered

class CircuitBreaker:
    """
    Circuit breaker for external API calls (DeepSeek).

    - CLOSED: requests pass through
    - OPEN after `failure_threshold` consecutive failures: requests rejected
    - HALF_OPEN after `recovery_timeout`: one test request allowed
    - Back to CLOSED on success, back to OPEN on failure
    """

    def __init__(
        self,
        name: str,
        failure_threshold: int = 5,
        recovery_timeout: float = 30.0,
    ):
        self.name = name
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.last_failure_time: float | None = None
        self._lock = asyncio.Lock()

    async def call(self, func, *args, **kwargs):
        async with self._lock:
            if self.state == CircuitState.OPEN:
                if time.monotonic() - self.last_failure_time >= self.recovery_timeout:
                    self.state = CircuitState.HALF_OPEN
                else:
                    raise CircuitBreakerOpenError(f"Circuit breaker {self.name} is OPEN")

        try:
            result = await func(*args, **kwargs)
        except Exception as e:
            async with self._lock:
                self.failure_count += 1
                self.last_failure_time = time.monotonic()
                if self.failure_count >= self.failure_threshold:
                    self.state = CircuitState.OPEN
            raise e

        async with self._lock:
            if self.state == CircuitState.HALF_OPEN:
                self.state = CircuitState.CLOSED
                self.failure_count = 0

        return result
```

### 8.4 Retry Policy

| Operation | Max Retries | Backoff | When |
|---|---|---|---|
| DeepSeek API call | 2 | Exponential (1s, 3s) | On 5xx or timeout |
| DB query | 1 | None | On connection error |
| RabbitMQ publish | 3 | Exponential (100ms, 500ms) | On connection error |
| Redis operation | 1 | None | On connection error |

### 8.5 HTTP Status Codes Used

| Code | Meaning | Usage |
|---|---|---|
| 200 | OK | Successful GET, PUT, POST (read/update) |
| 201 | Created | Successful POST (resource creation) |
| 204 | No Content | Successful DELETE, logout |
| 400 | Bad Request | Invalid input (e.g., wrong old password) |
| 401 | Unauthorized | Missing/invalid JWT |
| 403 | Forbidden | Not resource owner |
| 404 | Not Found | Resource does not exist |
| 409 | Conflict | Duplicate resource (existing email, date) |
| 422 | Validation Error | Pydantic schema validation failure |
| 429 | Rate Limited | Too many requests |
| 502 | Bad Gateway | External API failure (DeepSeek) |

---

## 9. Frontend Component Tree

### 9.1 Directory Structure

```
frontend/
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── src/
│   ├── main.tsx                         # Entry point
│   ├── App.tsx                          # Root component, router setup
│   ├── index.css                        # Tailwind directives + global styles
│   ├── vite-env.d.ts
│   │
│   ├── routes/
│   │   ├── ProtectedRoute.tsx           # Auth guard wrapper
│   │   └── AppRoutes.tsx                # All route definitions
│   │
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── DailyLogPage.tsx
│   │   ├── ChatbotPage.tsx
│   │   ├── MetricsPage.tsx
│   │   ├── ProfilePage.tsx
│   │   └── NotFoundPage.tsx
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.tsx             # Sidebar + header + main area
│   │   │   ├── Sidebar.tsx              # Navigation sidebar
│   │   │   ├── Header.tsx               # Top bar with user menu
│   │   │   └── MobileNav.tsx            # Bottom nav for mobile
│   │   │
│   │   ├── dashboard/
│   │   │   ├── TodayOverview.tsx        # Summary cards for today
│   │   │   ├── SuggestionCard.tsx       # AI suggestion display
│   │   │   ├── WeekSummary.tsx          # Weekly stats strip
│   │   │   └── QuickActions.tsx         # Quick log buttons
│   │   │
│   │   ├── logs/
│   │   │   ├── MealSection.tsx          # Meals by type (breakfast/lunch/dinner/snack)
│   │   │   ├── MealForm.tsx             # Add/edit meal form
│   │   │   ├── MealCard.tsx             # Individual meal display
│   │   │   ├── WorkoutSection.tsx
│   │   │   ├── WorkoutForm.tsx
│   │   │   ├── WorkoutCard.tsx
│   │   │   ├── WaterTracker.tsx         # Water glass counter UI
│   │   │   ├── SleepTracker.tsx         # Sleep hours input
│   │   │   └── MoodSelector.tsx         # 1-5 emoji mood picker
│   │   │
│   │   ├── chatbot/
│   │   │   ├── ChatWindow.tsx           # Message list container
│   │   │   ├── ChatMessage.tsx          # Single message bubble
│   │   │   ├── ChatInput.tsx            # Text input + send button
│   │   │   └── ChatHistory.tsx          # Conversation list sidebar
│   │   │
│   │   ├── metrics/
│   │   │   ├── WeightChart.tsx          # Weight line chart
│   │   │   ├── BMIChart.tsx             # BMI line chart
│   │   │   ├── MetricsSummary.tsx       # Summary stats cards
│   │   │   └── MetricFilter.tsx         # Date range selector
│   │   │
│   │   ├── profile/
│   │   │   ├── ProfileForm.tsx          # Edit profile form
│   │   │   ├── PreferencesForm.tsx      # Diet prefs + goals
│   │   │   └── ChangePasswordForm.tsx
│   │   │
│   │   └── common/
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       ├── Card.tsx
│   │       ├── Modal.tsx
│   │       ├── LoadingSpinner.tsx
│   │       ├── ErrorBoundary.tsx
│   │       ├── EmptyState.tsx
│   │       └── Pagination.tsx
│   │
│   ├── hooks/
│   │   ├── useAuth.ts                   # Auth state + actions
│   │   ├── useDailyLog.ts               # Log query/mutation hooks
│   │   ├── useChatbot.ts                # Chat message hooks
│   │   ├── useMetrics.ts                # Metrics data hooks
│   │   └── useSuggestions.ts            # Suggestion hooks
│   │
│   ├── services/
│   │   ├── api.ts                        # Axios instance, interceptors
│   │   ├── authApi.ts
│   │   ├── logApi.ts
│   │   ├── chatbotApi.ts
│   │   ├── suggestionApi.ts
│   │   ├── metricApi.ts
│   │   └── userApi.ts
│   │
│   ├── store/
│   │   ├── authStore.ts                 # Zustand store for auth state
│   │   └── uiStore.ts                   # Sidebar state, theme, modals
│   │
│   ├── types/
│   │   ├── auth.ts
│   │   ├── user.ts
│   │   ├── log.ts
│   │   ├── chat.ts
│   │   ├── suggestion.ts
│   │   └── metric.ts
│   │
│   └── utils/
│       ├── date.ts                       # Date formatting helpers
│       ├── constants.ts                  # API base URL, config
│       └── cn.ts                         # Tailwind class merge utility
```

### 9.2 Component Hierarchy

```
<App>
  <QueryClientProvider>                    # React Query provider
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute />}>     # Auth check wrapper
          <Route element={<AppShell />}>         # Layout with sidebar
            <Route path="/" element={<DashboardPage />} />
            <Route path="/log" element={<DailyLogPage />} />
            <Route path="/chatbot" element={<ChatbotPage />} />
            <Route path="/metrics" element={<MetricsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  </QueryClientProvider>
</App>

--- AppShell layout ---
<AppShell>
  <Sidebar />          # Left nav: Dashboard, Log, Chatbot, Metrics, Profile
  <div className="main">
    <Header />          # Top bar: page title, user avatar, logout
    <main>
      <Outlet />        # Page content rendered here
    </main>
  </div>
  <MobileNav />         # Bottom tab bar when viewport < md
</AppShell>

--- DashboardPage composition ---
<DashboardPage>
  <h1>Dashboard</h1>
  <TodayOverview />           # Cards: water, sleep, mood, meals count, workout count
  <SuggestionCard />          # AI daily tip with dismiss/refresh
  <WeekSummary />             # Mini bar chart of mood, water, sleep by day
  <QuickActions />            # Buttons: "Log Meal", "Log Workout", "Open Chatbot"
</DashboardPage>

--- DailyLogPage composition ---
<DailyLogPage>
  <DateSelector />            # Pick date (default today)
  <MealSection mealType="breakfast" />
  <MealSection mealType="lunch" />
  <MealSection mealType="dinner" />
  <MealSection mealType="snack" />
  <WorkoutSection />
  <WaterTracker />
  <SleepTracker />
  <MoodSelector />
</DailyLogPage>
```

---

## 10. Frontend State Management

### 10.1 State Architecture

| Concern | Tool | Scope |
|---|---|---|
| Server state | React Query (TanStack Query v5) | All API data: logs, metrics, suggestions, chat history |
| Auth state | Zustand | Access token, user object, isAuthenticated |
| UI state | Zustand | Sidebar open/closed, active modal, theme |
| Form state | React Hook Form + Zod | All form inputs with validation |
| URL state | React Router v6 | Current route, query params (date ranges, pagination) |

### 10.2 React Query Configuration

```typescript
// src/main.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,         // 5 min before refetch
      gcTime: 30 * 60 * 1000,            // 30 min garbage collection
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      refetchOnWindowFocus: false,        // Don't refetch on tab switch
    },
    mutations: {
      retry: 0,                           // Don't retry mutations
    },
  },
});
```

### 10.3 Query Hook Examples

```typescript
// src/hooks/useDailyLog.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { logApi } from "../services/logApi";

// Query Keys Factory
export const logKeys = {
  all:        ["logs"] as const,
  today:      ()          => [...logKeys.all, "today"] as const,
  byDate:     (date: string) => [...logKeys.all, "date", date] as const,
  range:      (start: string, end: string) => [...logKeys.all, "range", start, end] as const,
  meals:      (date?: string) => [...logKeys.all, "meals", date] as const,
  workouts:   (date?: string) => [...logKeys.all, "workouts", date] as const,
};

// Hooks
export function useTodayLog() {
  return useQuery({
    queryKey: logKeys.today(),
    queryFn: () => logApi.getTodayLog(),
    staleTime: 60 * 1000,         // 1 minute: dashboard data changes frequently
  });
}

export function useLogsInRange(start: string, end: string) {
  return useQuery({
    queryKey: logKeys.range(start, end),
    queryFn: () => logApi.getLogsInRange(start, end),
    enabled: !!start && !!end,    // Only run when params are defined
  });
}

export function useUpdateWater() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (glasses: number) => logApi.updateWater(glasses),
    onSuccess: () => {
      // Optimistic: invalidate all log queries (they refetch on next mount if stale)
      queryClient.invalidateQueries({ queryKey: logKeys.all });
    },
  });
}
```

### 10.4 Auth State (Zustand)

```typescript
// src/store/authStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  accessToken: string | null;
  user: User | null;
  isAuthenticated: boolean;

  setAuth: (accessToken: string, user: User) => void;
  clearAuth: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      isAuthenticated: false,

      setAuth: (accessToken, user) =>
        set({ accessToken, user, isAuthenticated: true }),

      clearAuth: () =>
        set({ accessToken: null, user: null, isAuthenticated: false }),

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
    }),
    {
      name: "auth-storage",
      // Only persist user object and auth flag; token is ephemeral
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
```

### 10.5 API Client with Token Injection

```typescript
// src/services/api.ts
import axios from "axios";
import { useAuthStore } from "../store/authStore";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1",
  headers: { "Content-Type": "application/json" },
});

// Request interceptor: inject access token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401, attempt token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue this request until refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          {},
          { withCredentials: true }   // refresh token in HTTP-only cookie
        );
        useAuthStore.getState().setAuth(data.access_token, useAuthStore.getState().user!);
        // Process queued requests
        failedQueue.forEach(({ resolve }) => resolve(data.access_token));
        failedQueue = [];
        originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        failedQueue.forEach(({ reject }) => reject(refreshError));
        failedQueue = [];
        useAuthStore.getState().clearAuth();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

### 10.6 Chatbot Streaming (Polling Alternative)

For a more responsive chatbot experience, use SSE or WebSocket instead of polling. The current LLD uses a simple POST/response pattern, but the design allows future upgrade:

```typescript
// src/hooks/useChatbot.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { chatbotApi } from "../services/chatbotApi";
import { useCallback, useState } from "react";

export function useSendMessage() {
  const queryClient = useQueryClient();
  const [isStreaming, setIsStreaming] = useState(false);

  const mutation = useMutation({
    mutationFn: (params: { conversationId?: string; content: string }) =>
      chatbotApi.sendMessage(params.conversationId, params.content),
    onMutate: async (params) => {
      // Optimistic: add user message to cache immediately
      await queryClient.cancelQueries({ queryKey: ["chatbot", "history", params.conversationId] });
      setIsStreaming(true);
    },
    onSuccess: (_, params) => {
      // Invalidate history to refetch with AI response included
      queryClient.invalidateQueries({ queryKey: ["chatbot", "history", params.conversationId] });
    },
    onSettled: () => {
      setIsStreaming(false);
    },
  });

  return { sendMessage: mutation.mutateAsync, isStreaming, ...mutation };
}

export function useConversationHistory(conversationId?: string) {
  return useQuery({
    queryKey: ["chatbot", "history", conversationId],
    queryFn: () => chatbotApi.getHistory(conversationId),
    enabled: !!conversationId,
    staleTime: 30 * 1000,    // 30 seconds
  });
}
```

### 10.7 Optimistic Updates Pattern

```typescript
// src/hooks/useMetrics.ts
export function useRecordWeight() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { weight_kg: number; record_date: string }) =>
      metricApi.recordWeight(data),

    // Optimistic update
    onMutate: async (newWeight) => {
      await queryClient.cancelQueries({ queryKey: metricKeys.weight("30") });
      const previousData = queryClient.getQueryData(metricKeys.weight("30"));

      queryClient.setQueryData(metricKeys.weight("30"), (old: any) => {
        if (!old) return { records: [{ ...newWeight }] };
        return {
          ...old,
          records: [...old.records, { ...newWeight }],
        };
      });

      return { previousData };
    },

    onError: (err, newWeight, context) => {
      // Rollback on error
      queryClient.setQueryData(metricKeys.weight("30"), context?.previousData);
    },

    onSettled: () => {
      // Always refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: metricKeys.all });
    },
  });
}
```

---

## Appendices

### A. Docker Compose Snippet

```yaml
# docker-compose.yml (production)
version: "3.9"

services:
  app:
    build:
      context: ./backend
      dockerfile: Dockerfile
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000
    env_file: ./backend/.env
    secrets:
      - jwt_private_key
      - jwt_public_key
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started
      rabbitmq:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/api/v1/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  worker:
    build:
      context: ./backend
      dockerfile: Dockerfile
    command: celery -A app.tasks.celery_app worker --loglevel=info --concurrency=4
    env_file: ./backend/.env
    depends_on: [db, redis, rabbitmq]

  beat:
    build:
      context: ./backend
      dockerfile: Dockerfile
    command: celery -A app.tasks.celery_app beat --loglevel=info
    env_file: ./backend/.env
    depends_on: [db, redis, rabbitmq]

  db:
    image: postgres:15-alpine
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: healthtracker
      POSTGRES_USER: ht_user
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ht_user -d healthtracker"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    volumes:
      - redisdata:/data

  rabbitmq:
    image: rabbitmq:3-management-alpine
    volumes:
      - rmqdata:/var/lib/rabbitmq
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "check_port_connectivity"]
      interval: 15s
      timeout: 5s
      retries: 5

  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./frontend/dist:/usr/share/nginx/html:ro
    ports:
      - "80:80"
      - "443:443"
    depends_on: [app]

volumes:
  pgdata:
  redisdata:
  rmqdata:

secrets:
  jwt_private_key:
    file: ./secrets/jwt_private.pem
  jwt_public_key:
    file: ./secrets/jwt_public.pem
  db_password:
    file: ./secrets/db_password.txt
```

### B. Nginx Configuration Snippet

```nginx
upstream fastapi_backend {
    server app:8000;
    # Add additional app instances for horizontal scaling:
    # server app2:8000;
}

server {
    listen 80;
    server_name api.healthtracker.example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.healthtracker.example.com;

    ssl_certificate     /etc/ssl/certs/cert.pem;
    ssl_certificate_key /etc/ssl/private/key.pem;
    ssl_protocols       TLSv1.3;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=60r/s;
    limit_req zone=api_limit burst=100 nodelay;

    location /api/ {
        proxy_pass http://fastapi_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 10s;
        proxy_read_timeout 60s;
        proxy_send_timeout 10s;
    }

    location / {
        # Serve React static build
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}
```
