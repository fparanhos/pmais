from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, events, services, kanban, templates, revenues, reports, users, mock
from app.config import settings
from app.database import SessionLocal
from app.models import Role, User
from app.security import hash_password
from app.seed_template import seed_default_templates

app = FastAPI(title="Pmais Eventos", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for r in (auth.router, events.router, services.router, kanban.router,
          templates.router, revenues.router, reports.router, users.router, mock.router):
    app.include_router(r)


@app.on_event("startup")
def bootstrap():
    """Seed mínimo pós-migrations: admin + templates default."""
    db = SessionLocal()
    try:
        if not db.query(User).first():
            db.add(User(
                email="admin@pmaiseventos.com",
                name="Admin",
                hashed_password=hash_password("changeme"),
                role=Role.ADMIN,
            ))
            db.commit()
        seed_default_templates(db)
    finally:
        db.close()


@app.get("/api/health")
def health():
    return {"ok": True}
