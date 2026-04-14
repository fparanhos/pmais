import resend
from sqlalchemy.orm import Session

from app.config import settings
from app.models import EmailLog, EmailTemplate

if settings.RESEND_API_KEY:
    resend.api_key = settings.RESEND_API_KEY


def render(body: str, ctx: dict) -> str:
    for k, v in ctx.items():
        body = body.replace("{{" + k + "}}", str(v or ""))
    return body


def send_email(
    db: Session,
    to: str,
    subject: str,
    body_html: str,
    *,
    template_key: str | None = None,
    event_id: int | None = None,
    service_item_id: int | None = None,
) -> EmailLog:
    log = EmailLog(
        to_email=to,
        subject=subject,
        template_key=template_key,
        event_id=event_id,
        service_item_id=service_item_id,
        status="pending",
    )
    db.add(log)
    db.flush()
    try:
        if not settings.RESEND_API_KEY:
            raise RuntimeError("RESEND_API_KEY não configurada")
        resp = resend.Emails.send({
            "from": settings.RESEND_FROM,
            "to": [to],
            "subject": subject,
            "html": body_html,
        })
        log.status = "sent"
        log.provider_id = resp.get("id") if isinstance(resp, dict) else None
    except Exception as e:  # noqa: BLE001
        log.status = "error"
        log.error = str(e)
    db.commit()
    return log


def send_template(
    db: Session,
    template_key: str,
    to: str,
    ctx: dict,
    *,
    event_id: int | None = None,
    service_item_id: int | None = None,
) -> EmailLog | None:
    tpl = db.query(EmailTemplate).filter(EmailTemplate.key == template_key).first()
    if not tpl:
        return None
    subject = render(tpl.subject, ctx)
    body = render(tpl.body_html, ctx)
    return send_email(
        db, to, subject, body,
        template_key=template_key, event_id=event_id, service_item_id=service_item_id,
    )
