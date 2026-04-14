from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, EmailStr, ConfigDict

from app.models import Role, ProducerStatus, FinanceStatus


class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str
    role: Role = Role.PRODUTOR


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: EmailStr
    name: str
    role: Role
    is_active: bool = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class EventIn(BaseModel):
    name: str
    event_date: Optional[date] = None
    location: Optional[str] = None
    audience: Optional[str] = None
    client: Optional[str] = None
    finance_email: Optional[EmailStr] = None
    producer_email: Optional[EmailStr] = None


class EventOut(EventIn):
    model_config = ConfigDict(from_attributes=True)
    id: int


class ServiceItemIn(BaseModel):
    name: str
    descriptive: Optional[str] = None
    planned_qty: Optional[Decimal] = None
    planned_days: Optional[Decimal] = None
    planned_unit: Optional[Decimal] = None
    budgeted_qty: Optional[Decimal] = None
    budgeted_days: Optional[Decimal] = None
    budgeted_unit: Optional[Decimal] = None
    contracted_qty: Optional[Decimal] = None
    contracted_days: Optional[Decimal] = None
    contracted_unit: Optional[Decimal] = None
    producer_status: Optional[ProducerStatus] = None
    supplier_company: Optional[str] = None
    supplier_contact: Optional[str] = None
    supplier_phone: Optional[str] = None
    supplier_email: Optional[EmailStr] = None
    finance_status: Optional[FinanceStatus] = None
    payment_date: Optional[date] = None
    paid_value: Optional[Decimal] = None
    notes: Optional[str] = None
    bv_agreed: Optional[Decimal] = None
    bv_received: Optional[bool] = None


class ServiceItemOut(ServiceItemIn):
    model_config = ConfigDict(from_attributes=True)
    id: int
    category_id: int


class CategoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    sort_order: int
    items: list[ServiceItemOut] = []


class KanbanMove(BaseModel):
    producer_status: ProducerStatus
    order: int = 0


class EmailTemplateIn(BaseModel):
    key: str
    subject: str
    body_html: str


class EmailTemplateOut(EmailTemplateIn):
    model_config = ConfigDict(from_attributes=True)
    id: int


class EmailLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    sent_at: datetime
    to_email: str
    subject: str
    status: str
    error: Optional[str] = None
