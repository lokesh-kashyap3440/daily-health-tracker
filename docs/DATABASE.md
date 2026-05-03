# Health Tracker — Database Schema Design

## PostgreSQL Schema

### ENUM Types

```sql
CREATE TYPE dietary_preference AS ENUM ('vegetarian', 'non_vegetarian', 'vegan', 'keto', 'paleo', 'mediterranean');
CREATE TYPE fitness_goal AS ENUM ('weight_loss', 'muscle_gain', 'maintenance', 'endurance', 'flexibility');
CREATE TYPE activity_level AS ENUM ('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active');
CREATE TYPE meal_type AS ENUM ('breakfast', 'lunch', 'dinner', 'snack');
CREATE TYPE workout_intensity AS ENUM ('low', 'medium', 'high');
CREATE TYPE chat_role AS ENUM ('user', 'assistant');
CREATE TYPE suggestion_category AS ENUM ('diet', 'workout', 'sleep', 'hydration', 'general_wellness');
CREATE TYPE goal_type AS ENUM ('weight', 'calories', 'protein', 'water', 'sleep', 'workout_frequency');
```

### Tables

```sql
-- ─── Users & Auth ───────────────────────────────────────────────

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100),
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    email_verified  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users (email);

CREATE TABLE refresh_tokens (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash      VARCHAR(255) NOT NULL UNIQUE,
    expires_at      TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens (user_id);
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens (expires_at);

-- ─── User Profiles ──────────────────────────────────────────────

CREATE TABLE user_profiles (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    age                 SMALLINT CHECK (age > 0 AND age < 150),
    height_cm           DECIMAL(5,1) CHECK (height_cm > 0),
    weight_kg           DECIMAL(5,1) CHECK (weight_kg > 0),
    dietary_preference  dietary_preference DEFAULT 'non_vegetarian',
    fitness_goal        fitness_goal DEFAULT 'maintenance',
    activity_level      activity_level DEFAULT 'moderately_active',
    allergies           TEXT[] DEFAULT '{}',
    cuisine_preference  VARCHAR(100),
    target_weight_kg    DECIMAL(5,1),
    target_date         DATE,
    workout_days_per_week SMALLINT DEFAULT 3 CHECK (workout_days_per_week BETWEEN 1 AND 7),
    daily_calorie_target INT DEFAULT 2000,
    daily_protein_target_g INT DEFAULT 50,
    daily_water_glasses  INT DEFAULT 8,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Daily Logs ─────────────────────────────────────────────────

CREATE TABLE daily_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    log_date        DATE NOT NULL,
    water_glasses   SMALLINT DEFAULT 0 CHECK (water_glasses >= 0),
    sleep_hours     DECIMAL(3,1) CHECK (sleep_hours >= 0 AND sleep_hours <= 24),
    sleep_quality   SMALLINT CHECK (sleep_quality BETWEEN 1 AND 5),
    mood_rating     SMALLINT CHECK (mood_rating BETWEEN 1 AND 5),
    weight_kg       DECIMAL(5,1) CHECK (weight_kg > 0),
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, log_date)
);

CREATE INDEX idx_daily_logs_user_date ON daily_logs (user_id, log_date DESC);
CREATE INDEX idx_daily_logs_date ON daily_logs (log_date);

-- ─── Meals ──────────────────────────────────────────────────────

CREATE TABLE meals (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    daily_log_id    UUID REFERENCES daily_logs(id) ON DELETE SET NULL,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    meal_type       meal_type NOT NULL,
    food_name       VARCHAR(255) NOT NULL,
    calories        INT CHECK (calories >= 0),
    protein_g       DECIMAL(5,1) CHECK (protein_g >= 0),
    carbs_g         DECIMAL(5,1) CHECK (carbs_g >= 0),
    fat_g           DECIMAL(5,1) CHECK (fat_g >= 0),
    serving_size    VARCHAR(100),
    consumed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_meals_user_date ON meals (user_id, consumed_at DESC);
CREATE INDEX idx_meals_daily_log ON meals (daily_log_id);
CREATE INDEX idx_meals_meal_type ON meals (user_id, meal_type, consumed_at);

-- ─── Workouts ───────────────────────────────────────────────────

CREATE TABLE workouts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    daily_log_id    UUID REFERENCES daily_logs(id) ON DELETE SET NULL,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    workout_type    VARCHAR(100) NOT NULL,
    duration_minutes INT NOT NULL CHECK (duration_minutes > 0),
    intensity       workout_intensity DEFAULT 'medium',
    calories_burned INT CHECK (calories_burned >= 0),
    notes           TEXT,
    performed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_workouts_user_date ON workouts (user_id, performed_at DESC);
CREATE INDEX idx_workouts_daily_log ON workouts (daily_log_id);

-- ─── Chatbot ────────────────────────────────────────────────────

CREATE TABLE chat_sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title           VARCHAR(255) DEFAULT 'New Chat',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chat_sessions_user ON chat_sessions (user_id, updated_at DESC);

CREATE TABLE chat_messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role            chat_role NOT NULL,
    content         TEXT NOT NULL,
    tokens_used     INT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_session ON chat_messages (session_id, created_at);

-- ─── AI Suggestions ─────────────────────────────────────────────

CREATE TABLE daily_suggestions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    suggestion_date DATE NOT NULL,
    content         TEXT NOT NULL,
    category        suggestion_category NOT NULL,
    is_read         BOOLEAN NOT NULL DEFAULT FALSE,
    is_helpful      BOOLEAN, -- user feedback
    generated_by    VARCHAR(50) DEFAULT 'deepseek',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, suggestion_date, category)
);

CREATE INDEX idx_suggestions_user_date ON daily_suggestions (user_id, suggestion_date DESC);
CREATE INDEX idx_suggestions_unread ON daily_suggestions (user_id, is_read) WHERE is_read = FALSE;

-- ─── Health Goals ───────────────────────────────────────────────

CREATE TABLE health_goals (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    goal_type       goal_type NOT NULL,
    target_value    DECIMAL(8,2) NOT NULL,
    current_value   DECIMAL(8,2) DEFAULT 0,
    unit            VARCHAR(50) NOT NULL, -- kg, cal, g, glasses, hours, days
    start_date      DATE NOT NULL DEFAULT CURRENT_DATE,
    target_date     DATE,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    achieved_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_goals_user_active ON health_goals (user_id, is_active) WHERE is_active = TRUE;
```

### Triggers

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_daily_logs_updated_at
    BEFORE UPDATE ON daily_logs FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_chat_sessions_updated_at
    BEFORE UPDATE ON chat_sessions FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_health_goals_updated_at
    BEFORE UPDATE ON health_goals FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
```

### Seed Data

```sql
INSERT INTO users (email, password_hash, first_name, last_name)
VALUES ('demo@healthtracker.app', '$2b$12$...', 'Demo', 'User');

INSERT INTO user_profiles (user_id, age, height_cm, weight_kg, dietary_preference, fitness_goal, allergies)
VALUES (
    (SELECT id FROM users WHERE email = 'demo@healthtracker.app'),
    28, 175, 78, 'non_vegetarian', 'weight_loss',
    ARRAY['peanuts']
);
```

---

## Redis Cache Design

### Key Patterns & TTLs

| Key Pattern | Type | TTL | Description |
|-------------|------|-----|-------------|
| `session:{session_id}` | hash | 15min | User session data |
| `user:{user_id}:profile` | hash | 1hr | Cached user profile |
| `user:{user_id}:daily_log:{date}` | hash | 5min | Today's log cache |
| `suggestions:{user_id}:{date}` | string (JSON) | 1hr | Daily AI suggestion |
| `chat:session:{session_id}:messages` | list | 30min | Recent chat messages |
| `ratelimit:{user_id}:{endpoint}` | string | varies | Rate limit counters |
| `leaderboard:weekly` | sorted set | 1hr | Weekly activity leaderboard |
| `metrics:{user_id}:{range}` | string (JSON) | 30min | Pre-computed chart data |

### Cache Invalidation Strategy

- **Write-through**: Update cache immediately on data change (profile updates, new log)
- **Cache-aside**: Check cache first, fall back to DB, populate cache on miss
- **TTL-based expiry**: All keys have TTL; stale data is acceptable within TTL window
- **Bulk invalidation**: On suggestion regeneration, delete all `suggestions:{user_id}:*` keys

### Redis Data Structures

```
# Daily summary (computed from meals/workouts/log)
user:{user_id}:summary:{date} → {
    "total_calories": 1850,
    "total_protein": 85,
    "total_carbs": 210,
    "total_fat": 55,
    "water_glasses": 6,
    "workout_minutes": 45,
    "calories_burned": 320
}
```

---

## RabbitMQ Topology

### Exchanges

| Exchange | Type | Description |
|----------|------|-------------|
| `health.events` | topic | Main event bus for health tracker events |
| `health.suggestions` | direct | Suggestion generation requests |
| `health.notifications` | fanout | Push/email notifications |

### Queues & Bindings

```
Exchange: health.events (topic)
├── queue: meal.logged
│   routing_key: meal.created, meal.updated, meal.deleted
├── queue: workout.logged
│   routing_key: workout.created, workout.updated, workout.deleted
├── queue: daily_log.updated
│   routing_key: log.updated
└── queue: user.profile_updated
    routing_key: profile.updated

Exchange: health.suggestions (direct)
└── queue: suggestion.generate
    routing_key: generate

Exchange: health.notifications (fanout)
├── queue: push.notification
└── queue: email.notification
```

### Message Schemas

```json
// meal.created / meal.updated
{
    "event": "meal.created",
    "payload": {
        "meal_id": "uuid",
        "user_id": "uuid",
        "meal_type": "breakfast",
        "food_name": "Oatmeal with berries",
        "calories": 350,
        "protein_g": 12.0,
        "carbs_g": 58.0,
        "fat_g": 8.0,
        "consumed_at": "2026-05-03T08:30:00Z"
    },
    "metadata": {
        "timestamp": "2026-05-03T08:30:01Z",
        "version": "1.0"
    }
}

// suggestion.generate
{
    "event": "suggestion.generate",
    "payload": {
        "user_id": "uuid",
        "date": "2026-05-03",
        "categories": ["diet", "workout"],
        "context": {
            "recent_meals_summary": "...",
            "recent_workouts_summary": "...",
            "profile": {...}
        }
    }
}
```

### Consumers

| Consumer | Queue | Action |
|----------|-------|--------|
| `SuggestionGenerator` | `suggestion.generate` | Calls DeepSeek API, stores result in DB + cache |
| `DailySummaryUpdater` | `meal.logged`, `workout.logged`, `daily_log.updated` | Recomputes Redis daily summary cache |
| `NotificationDispatcher` | `push.notification`, `email.notification` | Sends push/email reminders |
| `AnalyticsCollector` | All `health.events` queues | Aggregates data for metrics |

---

## Migration Strategy

Use Alembic for PostgreSQL migrations:

```
backend/
├── alembic/
│   ├── versions/
│   │   ├── 001_initial_schema.py
│   │   ├── 002_add_cuisine_preference.py
│   │   └── ...
│   └── env.py
└── alembic.ini
```

Commands:
```bash
alembic revision --autogenerate -m "description"
alembic upgrade head
alembic downgrade -1
```

---

## Entity Relationship Summary

```
users 1──1 user_profiles
users 1──N daily_logs
users 1──N meals
users 1──N workouts
users 1──N chat_sessions
users 1──N chat_messages
users 1──N daily_suggestions
users 1──N health_goals

daily_logs 1──N meals
daily_logs 1──N workouts

chat_sessions 1──N chat_messages
```
