from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Role
from app.schemas import Token, UserCreate, UserOut
from app.security import create_token, current_user, hash_password, verify_password, require_roles

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=Token)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form.username).first()
    if not user or not verify_password(form.password, user.hashed_password):
        raise HTTPException(401, "e-mail ou senha inválidos")
    if not user.is_active:
        raise HTTPException(403, "usuário inativo")
    return Token(access_token=create_token(user.email), user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(current_user)):
    return user


@router.post("/users", response_model=UserOut, dependencies=[Depends(require_roles(Role.ADMIN))])
def create_user(data: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(400, "e-mail já cadastrado")
    u = User(
        email=data.email, name=data.name, role=data.role,
        hashed_password=hash_password(data.password),
    )
    db.add(u); db.commit(); db.refresh(u)
    return u
