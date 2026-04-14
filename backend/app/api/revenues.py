from decimal import Decimal
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Event, Revenue, User
from app.security import current_user

router = APIRouter(prefix="/api", tags=["revenues"])


class RevenueIn(BaseModel):
    group_name: str
    name: str
    planned_qty: Optional[Decimal] = None
    planned_unit: Optional[Decimal] = None
    realized_qty: Optional[Decimal] = None
    realized_unit: Optional[Decimal] = None


class RevenueOut(RevenueIn):
    model_config = ConfigDict(from_attributes=True)
    id: int
    event_id: int


@router.get("/events/{event_id}/revenues", response_model=list[RevenueOut])
def list_revenues(event_id: int, db: Session = Depends(get_db), _: User = Depends(current_user)):
    return db.query(Revenue).filter_by(event_id=event_id).all()


@router.post("/events/{event_id}/revenues", response_model=RevenueOut)
def create_revenue(event_id: int, data: RevenueIn, db: Session = Depends(get_db), _: User = Depends(current_user)):
    if not db.get(Event, event_id):
        raise HTTPException(404)
    r = Revenue(event_id=event_id, **data.model_dump())
    db.add(r); db.commit(); db.refresh(r)
    return r


@router.put("/revenues/{rev_id}", response_model=RevenueOut)
def update_revenue(rev_id: int, data: RevenueIn, db: Session = Depends(get_db), _: User = Depends(current_user)):
    r = db.get(Revenue, rev_id)
    if not r:
        raise HTTPException(404)
    for k, v in data.model_dump().items():
        setattr(r, k, v)
    db.commit(); db.refresh(r)
    return r


@router.delete("/revenues/{rev_id}")
def delete_revenue(rev_id: int, db: Session = Depends(get_db), _: User = Depends(current_user)):
    r = db.get(Revenue, rev_id)
    if not r:
        raise HTTPException(404)
    db.delete(r); db.commit()
    return {"ok": True}
