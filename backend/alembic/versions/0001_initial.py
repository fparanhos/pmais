"""initial schema

Revision ID: 0001_initial
Revises:
Create Date: 2026-04-14
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


role_enum = sa.Enum("admin", "produtor", "financeiro", "cliente", name="role")
prod_enum = sa.Enum("Em Cotação", "Negociação", "Aguardando Aprovação", "Aprovado", name="producerstatus")
fin_enum = sa.Enum("Solicitado", "Recebido", "Enviado/Lançado", "Aguardando Aprovação", "Pago", name="financestatus")


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("role", role_enum, nullable=False),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime, nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_users_email", "users", ["email"])

    op.create_table(
        "events",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("event_date", sa.Date),
        sa.Column("location", sa.String(255)),
        sa.Column("audience", sa.String(255)),
        sa.Column("client", sa.String(255)),
        sa.Column("producer_user_id", sa.Integer, sa.ForeignKey("users.id")),
        sa.Column("finance_email", sa.String(255)),
        sa.Column("producer_email", sa.String(255)),
        sa.Column("created_at", sa.DateTime, nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        "service_categories",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("event_id", sa.Integer, sa.ForeignKey("events.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("sort_order", sa.Integer, nullable=False, server_default="0"),
    )

    op.create_table(
        "service_items",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("category_id", sa.Integer, sa.ForeignKey("service_categories.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("descriptive", sa.String(500)),
        sa.Column("planned_qty", sa.Numeric(14, 2)),
        sa.Column("planned_days", sa.Numeric(14, 2)),
        sa.Column("planned_unit", sa.Numeric(14, 2)),
        sa.Column("budgeted_qty", sa.Numeric(14, 2)),
        sa.Column("budgeted_days", sa.Numeric(14, 2)),
        sa.Column("budgeted_unit", sa.Numeric(14, 2)),
        sa.Column("contracted_qty", sa.Numeric(14, 2)),
        sa.Column("contracted_days", sa.Numeric(14, 2)),
        sa.Column("contracted_unit", sa.Numeric(14, 2)),
        sa.Column("producer_status", prod_enum),
        sa.Column("supplier_company", sa.String(255)),
        sa.Column("supplier_contact", sa.String(255)),
        sa.Column("supplier_phone", sa.String(50)),
        sa.Column("supplier_email", sa.String(255)),
        sa.Column("finance_status", fin_enum),
        sa.Column("payment_date", sa.Date),
        sa.Column("paid_value", sa.Numeric(14, 2)),
        sa.Column("notes", sa.Text),
        sa.Column("bv_agreed", sa.Numeric(14, 2)),
        sa.Column("bv_received", sa.Boolean, nullable=False, server_default=sa.false()),
        sa.Column("kanban_order", sa.Integer, nullable=False, server_default="0"),
        sa.Column("updated_at", sa.DateTime, nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        "revenues",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("event_id", sa.Integer, sa.ForeignKey("events.id", ondelete="CASCADE"), nullable=False),
        sa.Column("group_name", sa.String(100), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("planned_qty", sa.Numeric(14, 2)),
        sa.Column("planned_unit", sa.Numeric(14, 2)),
        sa.Column("realized_qty", sa.Numeric(14, 2)),
        sa.Column("realized_unit", sa.Numeric(14, 2)),
    )

    op.create_table(
        "email_templates",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("key", sa.String(100), nullable=False, unique=True),
        sa.Column("subject", sa.String(500), nullable=False),
        sa.Column("body_html", sa.Text, nullable=False),
    )
    op.create_index("ix_email_templates_key", "email_templates", ["key"])

    op.create_table(
        "automations",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("trigger", sa.String(100), nullable=False),
        sa.Column("trigger_value", sa.String(255), nullable=False),
        sa.Column("template_key", sa.String(100), nullable=False),
        sa.Column("recipient_role", sa.String(50), nullable=False),
        sa.Column("enabled", sa.Boolean, nullable=False, server_default=sa.true()),
    )

    op.create_table(
        "email_logs",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("sent_at", sa.DateTime, nullable=False, server_default=sa.func.now()),
        sa.Column("to_email", sa.String(255), nullable=False),
        sa.Column("subject", sa.String(500), nullable=False),
        sa.Column("template_key", sa.String(100)),
        sa.Column("service_item_id", sa.Integer, sa.ForeignKey("service_items.id")),
        sa.Column("event_id", sa.Integer, sa.ForeignKey("events.id")),
        sa.Column("status", sa.String(50), nullable=False),
        sa.Column("provider_id", sa.String(255)),
        sa.Column("error", sa.Text),
    )


def downgrade() -> None:
    for t in ["email_logs", "automations", "email_templates", "revenues",
              "service_items", "service_categories", "events", "users"]:
        op.drop_table(t)
    for e in [fin_enum, prod_enum, role_enum]:
        e.drop(op.get_bind(), checkfirst=True)
