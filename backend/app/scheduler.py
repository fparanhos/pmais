"""Worker que envia lembretes pré-evento. Roda 1x por dia às 08:00 SP."""
from datetime import date, timedelta

from apscheduler.schedulers.blocking import BlockingScheduler
from sqlalchemy.orm import Session

from app.config import settings
from app.database import SessionLocal
from app.email_service import send_template
from app.models import Event


REMINDERS = [(7, "event_reminder_7d"), (1, "event_reminder_1d")]


def run_daily_reminders():
    db: Session = SessionLocal()
    try:
        today = date.today()
        for days, tpl_key in REMINDERS:
            target = today + timedelta(days=days)
            for ev in db.query(Event).filter(Event.event_date == target).all():
                for addr in filter(None, [ev.producer_email, ev.finance_email]):
                    send_template(db, tpl_key, addr, {
                        "evento": ev.name, "data": ev.event_date.isoformat(),
                    }, event_id=ev.id)
    finally:
        db.close()


def main():
    sched = BlockingScheduler(timezone=settings.TIMEZONE)
    sched.add_job(run_daily_reminders, "cron", hour=8, minute=0, id="daily_reminders")
    sched.start()


if __name__ == "__main__":
    main()
