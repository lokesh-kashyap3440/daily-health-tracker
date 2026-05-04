"""Fix sleep_quality constraint to allow 0 (not rated).

Revision ID: 002
Revises: 001
Create Date: 2026-05-04
"""

from alembic import op

revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_constraint("ck_sleep_quality", "daily_logs")
    op.create_check_constraint(
        "ck_sleep_quality", "daily_logs",
        "sleep_quality >= 0 AND sleep_quality <= 5"
    )


def downgrade() -> None:
    op.drop_constraint("ck_sleep_quality", "daily_logs")
    op.create_check_constraint(
        "ck_sleep_quality", "daily_logs",
        "sleep_quality >= 1 AND sleep_quality <= 5"
    )
