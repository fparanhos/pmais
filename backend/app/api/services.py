from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Event, ProducerStatus, FinanceStatus, ServiceCategory, ServiceItem, User
from app.schemas import ServiceItemIn, ServiceItemOut
from app.security import current_user
from app.email_service import send_template

router = APIRouter(prefix="/api", tags=["services"])


@router.post("/categories/{category_id}/items", response_model=ServiceItemOut)
def create_item(category_id: int, data: ServiceItemIn, db: Session = Depends(get_db), _: User = Depends(current_user)):
    cat = db.get(ServiceCategory, category_id)
    if not cat:
        raise HTTPException(404)
    item = ServiceItem(category_id=category_id, **data.model_dump())
    db.add(item); db.commit(); db.refresh(item)
    return item


@router.put("/items/{item_id}", response_model=ServiceItemOut)
def update_item(item_id: int, data: ServiceItemIn, db: Session = Depends(get_db), _: User = Depends(current_user)):
    item = db.get(ServiceItem, item_id)
    if not item:
        raise HTTPException(404)
    prev_prod = item.producer_status
    prev_fin = item.finance_status
    for k, v in data.model_dump().items():
        setattr(item, k, v)
    db.commit(); db.refresh(item)

    ev = item.category.event
    ctx = {
        "servico": item.name,
        "evento": ev.name,
        "fornecedor": item.supplier_company or "",
        "valor": item.contracted_unit or 0,
    }
    # disparo automático (substitui VBA da planilha)
    if prev_prod != item.producer_status and item.producer_status == ProducerStatus.APROVADO and ev.finance_email:
        send_template(db, "producer_approved", ev.finance_email, ctx,
                      event_id=ev.id, service_item_id=item.id)
    if prev_fin != item.finance_status and item.finance_status == FinanceStatus.PAGO and ev.producer_email:
        send_template(db, "payment_confirmed", ev.producer_email, ctx,
                      event_id=ev.id, service_item_id=item.id)
    return item


@router.delete("/items/{item_id}")
def delete_item(item_id: int, db: Session = Depends(get_db), _: User = Depends(current_user)):
    item = db.get(ServiceItem, item_id)
    if not item:
        raise HTTPException(404)
    db.delete(item); db.commit()
    return {"ok": True}
