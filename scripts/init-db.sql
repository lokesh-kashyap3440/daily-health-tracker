-- ─────────────────────────────────────────────────────────────────────────────
-- Daily Health Tracker -- Database Initialization Script
-- Runs automatically on first PostgreSQL container startup via the
-- docker-entrypoint-initdb.d mechanism.
-- ─────────────────────────────────────────────────────────────────────────────

-- The database and user are created by Docker Compose environment variables
-- (POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD), so this script focuses on
-- type definitions and index creation as a safety net.

-- ── Enums ──────────────────────────────────────────────────────────────────

CREATE TYPE IF NOT EXISTS mood_enum AS ENUM ('great', 'good', 'okay', 'bad', 'awful');

CREATE TYPE IF NOT EXISTS suggestion_category AS ENUM (
    'fitness',
    'nutrition',
    'sleep',
    'mental_health',
    'general'
);

CREATE TYPE IF NOT EXISTS message_role AS ENUM ('user', 'assistant');

-- ── Index Hints (idempotent) ───────────────────────────────────────────────
-- These ensure critical query performance indexes exist even if Alembic
-- migrations haven't run yet or were partially applied.

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_health_logs_user_date ON health_logs (user_id, log_date DESC);
CREATE INDEX IF NOT EXISTS idx_suggestions_user_read ON suggestions (user_id, is_read, priority DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_created ON chat_messages (user_id, created_at);
