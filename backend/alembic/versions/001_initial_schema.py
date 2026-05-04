"""Initial database schema with all tables

Revision ID: 001
Revises:
Create Date: 2026-05-03 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create ENUM types
    type_names = [
        "dietary_preference", "fitness_goal", "activity_level", "meal_type",
        "workout_intensity", "chat_role", "suggestion_category", "goal_type",
    ]
    for name in type_names:
        op.execute(f"DROP TYPE IF EXISTS {name} CASCADE")

    # ── Users table ────────────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("email", sa.String(255), unique=True, nullable=False, index=True),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("first_name", sa.String(100), nullable=False),
        sa.Column("last_name", sa.String(100), nullable=True),
        sa.Column("role", sa.String(20), server_default="user"),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("TRUE")),
        sa.Column("suggestions_enabled", sa.Boolean(), server_default=sa.text("TRUE")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()"), nullable=False),
    )

    # ── User Profiles table ────────────────────────────────────────
    op.create_table(
        "user_profiles",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False),
        sa.Column("age", sa.Integer(), nullable=True),
        sa.Column("height_cm", sa.Float(), nullable=True),
        sa.Column("weight_kg", sa.Float(), nullable=True),
        sa.Column("dietary_preference", postgresql.ENUM("vegetarian", "non_vegetarian", "vegan", "keto", "paleo", "mediterranean", name="dietary_preference"), nullable=True),
        sa.Column("fitness_goal", postgresql.ENUM("weight_loss", "muscle_gain", "maintenance", "endurance", "flexibility", name="fitness_goal"), nullable=True),
        sa.Column("activity_level", postgresql.ENUM("sedentary", "lightly_active", "moderately_active", "very_active", "extremely_active", name="activity_level"), nullable=True),
        sa.Column("allergies", postgresql.ARRAY(sa.String()), server_default="{}"),
        sa.Column("cuisine_preference", sa.String(100), nullable=True),
        sa.Column("target_weight_kg", sa.Float(), nullable=True),
        sa.Column("target_date", sa.Date(), nullable=True),
        sa.Column("workout_days_per_week", sa.Integer(), server_default="3"),
        sa.Column("daily_calorie_target", sa.Integer(), server_default="2000"),
        sa.Column("daily_protein_target_g", sa.Integer(), server_default="50"),
        sa.Column("daily_water_glasses", sa.Integer(), server_default="8"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()"), nullable=False),
    )

    op.create_check_constraint("ck_profile_age", "user_profiles", "age > 0 AND age < 150")
    op.create_check_constraint("ck_profile_height", "user_profiles", "height_cm > 0")
    op.create_check_constraint("ck_profile_weight", "user_profiles", "weight_kg > 0")

    # ── Refresh Tokens table ───────────────────────────────────────
    op.create_table(
        "refresh_tokens",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("jti", sa.String(255), unique=True, nullable=False, index=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("is_revoked", sa.Boolean(), server_default=sa.text("FALSE")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()"), nullable=False),
    )

    # ── Daily Logs table ───────────────────────────────────────────
    op.create_table(
        "daily_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("log_date", sa.Date(), nullable=False),
        sa.Column("water_glasses", sa.Integer(), server_default="0"),
        sa.Column("sleep_hours", sa.Float(), server_default="0"),
        sa.Column("sleep_quality", sa.Integer(), server_default="0"),
        sa.Column("mood_rating", sa.Integer(), server_default="3"),
        sa.Column("weight_kg", sa.Float(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()"), nullable=False),
    )

    op.create_unique_constraint("uq_user_log_date", "daily_logs", ["user_id", "log_date"])
    op.create_check_constraint("ck_mood_rating", "daily_logs", "mood_rating >= 1 AND mood_rating <= 5")
    op.create_check_constraint("ck_water_glasses", "daily_logs", "water_glasses >= 0")
    op.create_check_constraint("ck_sleep_hours", "daily_logs", "sleep_hours >= 0 AND sleep_hours <= 24")
    op.create_check_constraint("ck_sleep_quality", "daily_logs", "sleep_quality >= 1 AND sleep_quality <= 5")
    op.create_index("ix_daily_logs_user_date", "daily_logs", ["user_id", sa.text("log_date DESC")])

    # ── Meals table ────────────────────────────────────────────────
    op.create_table(
        "meals",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("daily_log_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("daily_logs.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("meal_type", postgresql.ENUM("breakfast", "lunch", "dinner", "snack", name="meal_type"), nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("calories", sa.Integer(), nullable=True),
        sa.Column("protein_g", sa.Float(), nullable=True),
        sa.Column("carbs_g", sa.Float(), nullable=True),
        sa.Column("fat_g", sa.Float(), nullable=True),
        sa.Column("serving_size", sa.String(100), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()"), nullable=False),
    )

    op.create_index("ix_meals_user_date", "meals", ["user_id", sa.text("created_at DESC")])

    # ── Workouts table ─────────────────────────────────────────────
    op.create_table(
        "workouts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("daily_log_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("daily_logs.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("exercise_type", sa.String(100), nullable=False),
        sa.Column("duration_min", sa.Integer(), nullable=False),
        sa.Column("intensity", sa.String(20), server_default="moderate"),
        sa.Column("calories_burned", sa.Integer(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()"), nullable=False),
    )

    op.create_check_constraint("ck_duration_min", "workouts", "duration_min > 0")
    op.create_check_constraint("ck_calories_burned", "workouts", "calories_burned >= 0")
    op.create_index("ix_workouts_user_date", "workouts", ["user_id", sa.text("created_at DESC")])

    # ── Chat Sessions table ────────────────────────────────────────
    op.create_table(
        "chat_sessions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("title", sa.String(255), server_default="New Chat"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()"), nullable=False),
    )

    op.create_index("ix_chat_sessions_user", "chat_sessions", [sa.text("user_id"), sa.text("updated_at DESC")])

    # ── Chat Messages table ────────────────────────────────────────
    op.create_table(
        "chat_messages",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("session_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("role", postgresql.ENUM("user", "assistant", "system", name="chat_role"), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("metadata", postgresql.JSONB(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()"), nullable=False),
    )

    op.create_index("ix_chat_messages_session_created", "chat_messages", ["session_id", "created_at"])

    # ── Daily Suggestions table ────────────────────────────────────
    op.create_table(
        "daily_suggestions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("suggestion_date", sa.Date(), nullable=False),
        sa.Column("category", postgresql.ENUM("diet", "workout", "sleep", "hydration", "general_wellness", name="suggestion_category"), nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("is_dismissed", sa.Boolean(), server_default=sa.text("FALSE")),
        sa.Column("metadata", postgresql.JSONB(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()"), nullable=False),
    )

    op.create_unique_constraint("uq_user_suggestion_date_cat", "daily_suggestions", ["user_id", "suggestion_date", "category"])
    op.create_index("ix_suggestions_user_date", "daily_suggestions", [sa.text("user_id"), sa.text("suggestion_date DESC")])

    # ── Health Goals table ─────────────────────────────────────────
    op.create_table(
        "health_goals",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("goal_type", postgresql.ENUM("weight", "calories", "protein", "water", "sleep", "workout_frequency", name="goal_type"), nullable=False),
        sa.Column("target_value", sa.Float(), nullable=False),
        sa.Column("current_value", sa.Float(), server_default="0"),
        sa.Column("unit", sa.String(50), nullable=False),
        sa.Column("start_date", sa.Date(), server_default=sa.text("CURRENT_DATE"), nullable=False),
        sa.Column("target_date", sa.Date(), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("TRUE")),
        sa.Column("achieved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()"), nullable=False),
    )

    op.create_index("ix_goals_user_active", "health_goals", ["user_id", "is_active"])


def downgrade() -> None:
    """Drop all tables and ENUM types."""
    op.drop_table("health_goals")
    op.drop_table("daily_suggestions")
    op.drop_table("chat_messages")
    op.drop_table("chat_sessions")
    op.drop_table("workouts")
    op.drop_table("meals")
    op.drop_table("daily_logs")
    op.drop_table("refresh_tokens")
    op.drop_table("user_profiles")
    op.drop_table("users")

    op.execute("DROP TYPE IF EXISTS goal_type")
    op.execute("DROP TYPE IF EXISTS suggestion_category")
    op.execute("DROP TYPE IF EXISTS chat_role")
    op.execute("DROP TYPE IF EXISTS meal_type")
    op.execute("DROP TYPE IF EXISTS workout_intensity")
    op.execute("DROP TYPE IF EXISTS activity_level")
    op.execute("DROP TYPE IF EXISTS fitness_goal")
    op.execute("DROP TYPE IF EXISTS dietary_preference")
