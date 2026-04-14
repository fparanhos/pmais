from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import EmailLog, EmailTemplate, User, Role
from app.schemas import EmailLogOut, EmailTemplateIn, EmailTemplateOut
from app.security import current_user, require_roles

router = APIRouter(prefix="/api", tags=["templates"])


@router.get("/templates", response_model=list[EmailTemplateOut])
def list_templates(db: Session = Depends(get_db), _: User = Depends(current_user)):
    return db.query(EmailTemplate).all()


@router.post("/templates", response_model=EmailTemplateOut, dependencies=[Depends(require_roles(Role.ADMIN))])
def upsert(data: EmailTemplateIn, db: Session = Depends(get_db)):
    tpl = db.query(EmailTemplate).filter(EmailTemplate.key == data.key).first()
    if tpl:
        tpl.subject = data.subject; tpl.body_html = data.body_html
    else:
        tpl = EmailTemplate(**data.model_dump()); db.add(tpl)
    db.commit(); db.refresh(tpl)
    return tpl


@router.get("/email-logs", response_model=list[EmailLogOut])
def logs(event_id: int | None = None, db: Session = Depends(get_db), _: User = Depends(current_user)):
    q = db.query(EmailLog).order_by(EmailLog.sent_at.desc())
    if event_id:
        q = q.filter(EmailLog.event_id == event_id)
    return q.limit(500).all()
