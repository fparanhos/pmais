"""Add description/checklist/tasks (Trello fidelity)

Revision ID: 0002_trello
Revises: 0001_initial
Create Date: 2026-04-14
"""
from alembic import op
import sqlalchemy as sa

revision = "0002_trello"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("service_items", sa.Column("description", sa.Text))

    op.create_table(
        "checklist_items",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("service_item_id", sa.Integer, sa.ForeignKey("service_items.id", ondelete="CASCADE"), nullable=False),
        sa.Column("text", sa.String(500), nullable=False),
        sa.Column("done", sa.Boolean, nullable=False, server_default=sa.false()),
        sa.Column("sort_order", sa.Integer, nullable=False, server_default="0"),
    )

    op.create_table(
        "tasks",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("event_id", sa.Integer, sa.ForeignKey("events.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text),
        sa.Column("status", sa.String(50), nullable=False, server_default="todo"),
        sa.Column("due_date", sa.Date),
        sa.Column("sort_order", sa.Integer, nullable=False, server_default="0"),
    )


def downgrade() -> None:
    op.drop_table("tasks")
    op.drop_table("checklist_items")
    op.drop_column("service_items", "description")
