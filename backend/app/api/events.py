from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.models import Event, ServiceCategory, ServiceItem, User
from app.schemas import CategoryOut, EventIn, EventOut
from app.security import current_user
from app.seed_template import seed_event_template

router = APIRouter(prefix="/api/events", tags=["events"])


@router.get("", response_model=list[EventOut])
def list_events(db: Session = Depends(get_db), _: User = Depends(current_user)):
    return db.query(Event).order_by(Event.event_date.desc().nullslast()).all()


@router.post("", response_model=EventOut)
def create_event(data: EventIn, db: Session = Depends(get_db), _: User = Depends(current_user)):
    ev = Event(**data.model_dump())
    db.add(ev); db.flush()
    seed_event_template(db, ev.id)
    db.commit(); db.refresh(ev)
    return ev


@router.get("/{event_id}", response_model=EventOut)
def get_event(event_id: int, db: Session = Depends(get_db), _: User = Depends(current_user)):
    ev = db.get(Event, event_id)
    if not ev:
        raise HTTPException(404, "evento não encontrado")
    return ev


@router.put("/{event_id}", response_model=EventOut)
def update_event(event_id: int, data: EventIn, db: Session = Depends(get_db), _: User = Depends(current_user)):
    ev = db.get(Event, event_id)
    if not ev:
        raise HTTPException(404)
    for k, v in data.model_dump().items():
        setattr(ev, k, v)
    db.commit(); db.refresh(ev)
    return ev


@router.delete("/{event_id}")
def delete_event(event_id: int, db: Session = Depends(get_db), _: User = Depends(current_user)):
    ev = db.get(Event, event_id)
    if not ev:
        raise HTTPException(404)
    db.delete(ev); db.commit()
    return {"ok": True}


@router.get("/{event_id}/categories", response_model=list[CategoryOut])
def list_categories(event_id: int, db: Session = Depends(get_db), _: User = Depends(current_user)):
    return (
        db.query(ServiceCategory)
        .options(selectinload(ServiceCategory.items))
        .filter(ServiceCategory.event_id == event_id)
        .order_by(ServiceCategory.sort_order)
        .all()
    )
