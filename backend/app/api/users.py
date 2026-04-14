from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Role, User
from app.schemas import UserOut
from app.security import hash_password, require_roles

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("", response_model=list[UserOut], dependencies=[Depends(require_roles(Role.ADMIN))])
def list_users(db: Session = Depends(get_db)):
    return db.query(User).order_by(User.name).all()


@router.put("/{user_id}/deactivate", dependencies=[Depends(require_roles(Role.ADMIN))])
def deactivate(user_id: int, db: Session = Depends(get_db)):
    u = db.get(User, user_id)
    if not u:
        raise HTTPException(404)
    u.is_active = False; db.commit()
    return {"ok": True}


@router.put("/{user_id}/activate", dependencies=[Depends(require_roles(Role.ADMIN))])
def activate(user_id: int, db: Session = Depends(get_db)):
    u = db.get(User, user_id)
    if not u:
        raise HTTPException(404)
    u.is_active = True; db.commit()
    return {"ok": True}


@router.put("/{user_id}/reset-password", dependencies=[Depends(require_roles(Role.ADMIN))])
def reset_password(user_id: int, new_password: str, db: Session = Depends(get_db)):
    u = db.get(User, user_id)
    if not u:
        raise HTTPException(404)
    u.hashed_password = hash_password(new_password); db.commit()
    return {"ok": True}
