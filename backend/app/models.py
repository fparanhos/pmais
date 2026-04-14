from datetime import datetime, date
from enum import Enum as PyEnum

from sqlalchemy import (
    String, Integer, Numeric, DateTime, Date, ForeignKey, Boolean, Text, Enum, JSON,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def _enum(py_enum, name):
    return Enum(py_enum, name=name, values_callable=lambda e: [m.value for m in e])


class Role(str, PyEnum):
    ADMIN = "admin"
    PRODUTOR = "produtor"
    FINANCEIRO = "financeiro"
    CLIENTE = "cliente"


class ProducerStatus(str, PyEnum):
    EM_COTACAO = "Em Cotação"
    NEGOCIACAO = "Negociação"
    AGUARDANDO = "Aguardando Aprovação"
    APROVADO = "Aprovado"


class FinanceStatus(str, PyEnum):
    SOLICITADO = "Solicitado"
    RECEBIDO = "Recebido"
    LANCADO = "Enviado/Lançado"
    AGUARDANDO = "Aguardando Aprovação"
    PAGO = "Pago"


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255))
    hashed_password: Mapped[str] = mapped_column(String(255))
    role: Mapped[Role] = mapped_column(_enum(Role, "role"), default=Role.PRODUTOR)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Event(Base):
    __tablename__ = "events"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    event_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    audience: Mapped[str | None] = mapped_column(String(255), nullable=True)
    client: Mapped[str | None] = mapped_column(String(255), nullable=True)
    producer_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    finance_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    producer_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    categories: Mapped[list["ServiceCategory"]] = relationship(back_populates="event", cascade="all, delete-orphan")
    revenues: Mapped[list["Revenue"]] = relationship(back_populates="event", cascade="all, delete-orphan")


class ServiceCategory(Base):
    __tablename__ = "service_categories"
    id: Mapped[int] = mapped_column(primary_key=True)
    event_id: Mapped[int] = mapped_column(ForeignKey("events.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String(255))
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    event: Mapped[Event] = relationship(back_populates="categories")
    items: Mapped[list["ServiceItem"]] = relationship(back_populates="category", cascade="all, delete-orphan")


class ServiceItem(Base):
    __tablename__ = "service_items"
    id: Mapped[int] = mapped_column(primary_key=True)
    category_id: Mapped[int] = mapped_column(ForeignKey("service_categories.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String(255))
    descriptive: Mapped[str | None] = mapped_column(String(500), nullable=True)

    planned_qty: Mapped[float | None] = mapped_column(Numeric(14, 2), nullable=True)
    planned_days: Mapped[float | None] = mapped_column(Numeric(14, 2), nullable=True)
    planned_unit: Mapped[float | None] = mapped_column(Numeric(14, 2), nullable=True)

    budgeted_qty: Mapped[float | None] = mapped_column(Numeric(14, 2), nullable=True)
    budgeted_days: Mapped[float | None] = mapped_column(Numeric(14, 2), nullable=True)
    budgeted_unit: Mapped[float | None] = mapped_column(Numeric(14, 2), nullable=True)

    contracted_qty: Mapped[float | None] = mapped_column(Numeric(14, 2), nullable=True)
    contracted_days: Mapped[float | None] = mapped_column(Numeric(14, 2), nullable=True)
    contracted_unit: Mapped[float | None] = mapped_column(Numeric(14, 2), nullable=True)

    producer_status: Mapped[ProducerStatus | None] = mapped_column(_enum(ProducerStatus, "producerstatus"), nullable=True)
    supplier_company: Mapped[str | None] = mapped_column(String(255), nullable=True)
    supplier_contact: Mapped[str | None] = mapped_column(String(255), nullable=True)
    supplier_phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    supplier_email: Mapped[str | None] = mapped_column(String(255), nullable=True)

    finance_status: Mapped[FinanceStatus | None] = mapped_column(_enum(FinanceStatus, "financestatus"), nullable=True)
    payment_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    paid_value: Mapped[float | None] = mapped_column(Numeric(14, 2), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    bv_agreed: Mapped[float | None] = mapped_column(Numeric(14, 2), nullable=True)
    bv_received: Mapped[bool] = mapped_column(Boolean, default=False)

    kanban_order: Mapped[int] = mapped_column(Integer, default=0)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    category: Mapped[ServiceCategory] = relationship(back_populates="items")
    checklist: Mapped[list["ChecklistItem"]] = relationship(back_populates="item", cascade="all, delete-orphan", order_by="ChecklistItem.sort_order")


class ChecklistItem(Base):
    __tablename__ = "checklist_items"
    id: Mapped[int] = mapped_column(primary_key=True)
    service_item_id: Mapped[int] = mapped_column(ForeignKey("service_items.id", ondelete="CASCADE"))
    text: Mapped[str] = mapped_column(String(500))
    done: Mapped[bool] = mapped_column(Boolean, default=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    item: Mapped[ServiceItem] = relationship(back_populates="checklist")


class Task(Base):
    __tablename__ = "tasks"
    id: Mapped[int] = mapped_column(primary_key=True)
    event_id: Mapped[int] = mapped_column(ForeignKey("events.id", ondelete="CASCADE"))
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="todo")  # todo | doing | waiting_approval | done
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)


class Revenue(Base):
    __tablename__ = "revenues"
    id: Mapped[int] = mapped_column(primary_key=True)
    event_id: Mapped[int] = mapped_column(ForeignKey("events.id", ondelete="CASCADE"))
    group_name: Mapped[str] = mapped_column(String(100))  # Inscrição, Patrocínio, Outras
    name: Mapped[str] = mapped_column(String(255))
    planned_qty: Mapped[float | None] = mapped_column(Numeric(14, 2), nullable=True)
    planned_unit: Mapped[float | None] = mapped_column(Numeric(14, 2), nullable=True)
    realized_qty: Mapped[float | None] = mapped_column(Numeric(14, 2), nullable=True)
    realized_unit: Mapped[float | None] = mapped_column(Numeric(14, 2), nullable=True)

    event: Mapped[Event] = relationship(back_populates="revenues")


class EmailTemplate(Base):
    __tablename__ = "email_templates"
    id: Mapped[int] = mapped_column(primary_key=True)
    key: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    subject: Mapped[str] = mapped_column(String(500))
    body_html: Mapped[str] = mapped_column(Text)


class Automation(Base):
    __tablename__ = "automations"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    trigger: Mapped[str] = mapped_column(String(100))  # producer_status, finance_status, event_days_before
    trigger_value: Mapped[str] = mapped_column(String(255))
    template_key: Mapped[str] = mapped_column(String(100))
    recipient_role: Mapped[str] = mapped_column(String(50))  # produtor | financeiro | email literal
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)


class EmailLog(Base):
    __tablename__ = "email_logs"
    id: Mapped[int] = mapped_column(primary_key=True)
    sent_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    to_email: Mapped[str] = mapped_column(String(255))
    subject: Mapped[str] = mapped_column(String(500))
    template_key: Mapped[str | None] = mapped_column(String(100), nullable=True)
    service_item_id: Mapped[int | None] = mapped_column(ForeignKey("service_items.id"), nullable=True)
    event_id: Mapped[int | None] = mapped_column(ForeignKey("events.id"), nullable=True)
    status: Mapped[str] = mapped_column(String(50))  # sent | error
    provider_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
