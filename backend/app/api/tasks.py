from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import ChecklistItem, Event, ServiceItem, Task, User
from app.security import current_user

router = APIRouter(prefix="/api", tags=["tasks"])


class TaskIn(BaseModel):
    title: str
    description: Optional[str] = None
    status: str = "todo"
    due_date: Optional[date] = None


class TaskOut(TaskIn):
    model_config = ConfigDict(from_attributes=True)
    id: int
    event_id: int


class ChecklistIn(BaseModel):
    text: str
    done: bool = False


class ChecklistOut(ChecklistIn):
    model_config = ConfigDict(from_attributes=True)
    id: int
    service_item_id: int


@router.get("/events/{event_id}/tasks", response_model=list[TaskOut])
def list_tasks(event_id: int, db: Session = Depends(get_db), _: User = Depends(current_user)):
    return db.query(Task).filter_by(event_id=event_id).order_by(Task.sort_order).all()


@router.post("/events/{event_id}/tasks", response_model=TaskOut)
def create_task(event_id: int, data: TaskIn, db: Session = Depends(get_db), _: User = Depends(current_user)):
    if not db.get(Event, event_id):
        raise HTTPException(404)
    t = Task(event_id=event_id, **data.model_dump())
    db.add(t); db.commit(); db.refresh(t)
    return t


@router.put("/tasks/{task_id}", response_model=TaskOut)
def update_task(task_id: int, data: TaskIn, db: Session = Depends(get_db), _: User = Depends(current_user)):
    t = db.get(Task, task_id)
    if not t:
        raise HTTPException(404)
    for k, v in data.model_dump().items():
        setattr(t, k, v)
    db.commit(); db.refresh(t)
    return t


@router.delete("/tasks/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db), _: User = Depends(current_user)):
    t = db.get(Task, task_id)
    if not t:
        raise HTTPException(404)
    db.delete(t); db.commit()
    return {"ok": True}


@router.get("/items/{item_id}/checklist", response_model=list[ChecklistOut])
def list_checklist(item_id: int, db: Session = Depends(get_db), _: User = Depends(current_user)):
    return db.query(ChecklistItem).filter_by(service_item_id=item_id).order_by(ChecklistItem.sort_order).all()


@router.post("/items/{item_id}/checklist", response_model=ChecklistOut)
def add_check(item_id: int, data: ChecklistIn, db: Session = Depends(get_db), _: User = Depends(current_user)):
    if not db.get(ServiceItem, item_id):
        raise HTTPException(404)
    c = ChecklistItem(service_item_id=item_id, text=data.text, done=data.done)
    db.add(c); db.commit(); db.refresh(c)
    return c


@router.put("/checklist/{cid}", response_model=ChecklistOut)
def update_check(cid: int, data: ChecklistIn, db: Session = Depends(get_db), _: User = Depends(current_user)):
    c = db.get(ChecklistItem, cid)
    if not c:
        raise HTTPException(404)
    c.text = data.text; c.done = data.done
    db.commit(); db.refresh(c)
    return c


@router.delete("/checklist/{cid}")
def del_check(cid: int, db: Session = Depends(get_db), _: User = Depends(current_user)):
    c = db.get(ChecklistItem, cid)
    if not c:
        raise HTTPException(404)
    db.delete(c); db.commit()
    return {"ok": True}
