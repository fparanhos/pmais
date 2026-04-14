from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import ProducerStatus, ServiceItem, User
from app.schemas import KanbanMove, ServiceItemOut
from app.security import current_user
from app.email_service import send_template

router = APIRouter(prefix="/api/kanban", tags=["kanban"])


@router.get("/{event_id}")
def board(event_id: int, db: Session = Depends(get_db), _: User = Depends(current_user)):
    items = (
        db.query(ServiceItem)
        .join(ServiceItem.category)
        .filter_by(event_id=event_id) if False else
        db.query(ServiceItem).filter(ServiceItem.category.has(event_id=event_id))
    ).order_by(ServiceItem.kanban_order).all()

    columns = {s.value: [] for s in ProducerStatus}
    columns["SEM_STATUS"] = []
    for it in items:
        col = it.producer_status.value if it.producer_status else "SEM_STATUS"
        columns[col].append(ServiceItemOut.model_validate(it).model_dump(mode="json"))
    return columns


@router.post("/item/{item_id}/move", response_model=ServiceItemOut)
def move(item_id: int, move: KanbanMove, db: Session = Depends(get_db), _: User = Depends(current_user)):
    item = db.get(ServiceItem, item_id)
    if not item:
        raise HTTPException(404)
    prev = item.producer_status
    item.producer_status = move.producer_status
    item.kanban_order = move.order
    db.commit(); db.refresh(item)

    ev = item.category.event
    if prev != move.producer_status and move.producer_status == ProducerStatus.APROVADO and ev.finance_email:
        send_template(db, "producer_approved", ev.finance_email, {
            "servico": item.name, "evento": ev.name,
        }, event_id=ev.id, service_item_id=item.id)
    return item
