"""Importa um board Trello (JSON export) e cria Event + ServiceItems + Tasks + Checklists.

Uso:
    python -m app.importer_trello /files/radar-2025.json
"""
from __future__ import annotations

import argparse
import json
import re
from datetime import date
from decimal import Decimal

from app.database import SessionLocal
from app.models import ChecklistItem, Event, ServiceCategory, ServiceItem, Task
from app.seed_template import seed_event_template


CATEGORY_MAP = {
    # Trello card title → Pmais category
    "Caneta do Participante": "MATERIAL DO PARTICIPANTE",
    "Bloco do Participante": "MATERIAL DO PARTICIPANTE",
    "Crachá": "MATERIAL DO PARTICIPANTE",
    "Brindes": "MATERIAL DO PARTICIPANTE",
    "Alimentos e Bebidas": "A&B (ALIMENTOS E BEBIDAS)",
    "Coffee Break": "A&B (ALIMENTOS E BEBIDAS)",
    "Mobiliário": "INFRAESTRUTURA",
    "Equipamentos de Audio Visual": "EQUIPAMENTOS AUDIOVISUAIS",
    "Painel de led": "EQUIPAMENTOS AUDIOVISUAIS",
    "Parqueador": "RECURSOS HUMANOS",
    "Decoração": "DIVERSOS",
    "Locação do Espaço": "LOCAÇÃO DE ESPAÇOS",
    "Promotoras": "RECURSOS HUMANOS",
    "Cobertura Fotografica": "DIVERSOS",
    "Mestre de Cerimonias": "RECURSOS HUMANOS",
    "Hotel - Parceria": "HOSPEDAGEM E ALIMENTAÇÃO",
    "Hospedagem": "HOSPEDAGEM E ALIMENTAÇÃO",
    "Passagens": "PASSAGENS AÉREAS",
    "Segurança": "RECURSOS HUMANOS",
    "Brigadista": "RECURSOS HUMANOS",
    "Limpeza": "RECURSOS HUMANOS",
    "Gerador": "INFRAESTRUTURA",
    "Internet": "T.I.",
    "Site": "T.I.",
    "Sistema de Credenciamento": "T.I.",
    "ECAD": "DIVERSOS",
    "Totens Carregadores": "INFRAESTRUTURA",
    "Recursos Humanos - Recepcionistas": "RECURSOS HUMANOS",
}

STATUS_TO_PRODUCER = {
    "Check List": None,
    "Atividades à Fazer": "Em Cotação",
    "Atividades Concluidas / Aguardando Aprovação": "Aguardando Aprovação",
    "Serviços Contratados": "Aprovado",
}


def _extract_event_info(desc: str) -> dict:
    info = {}
    for pat, key in [
        (r"Nome do Evento:\s*(.+)", "name"),
        (r"Per[íi]odo:\s*(\d{2}/\d{2}/\d{4})", "date"),
        (r"P[úu]blico:\s*([\w\s]+)", "audience"),
    ]:
        m = re.search(pat, desc, re.I)
        if m:
            info[key] = m.group(1).strip()
    return info


def _guess_category(card_name: str) -> str:
    if card_name in CATEGORY_MAP:
        return CATEGORY_MAP[card_name]
    lower = card_name.lower()
    for k, v in CATEGORY_MAP.items():
        if k.lower() in lower or lower in k.lower():
            return v
    return "DIVERSOS"


def import_trello(path: str) -> int:
    data = json.load(open(path, encoding="utf-8"))
    lists = {l["id"]: l["name"] for l in data["lists"]}
    checklists_by_card = {}
    for cl in data.get("checklists", []):
        checklists_by_card.setdefault(cl["idCard"], []).append(cl)

    db = SessionLocal()
    try:
        ev_name = data["name"]
        ev_info = {}
        for c in data["cards"]:
            if lists.get(c["idList"]) == "Informações" and c["name"].lower().startswith("nome"):
                ev_info = _extract_event_info(c.get("desc") or "")
                break

        event_date = None
        if ev_info.get("date"):
            try:
                dd, mm, yy = ev_info["date"].split("/")
                event_date = date(int(yy), int(mm), int(dd))
            except Exception:
                pass

        existing = db.query(Event).filter(Event.name == ev_name).first()
        if existing:
            db.delete(existing); db.commit()

        ev = Event(
            name=ev_name,
            event_date=event_date,
            audience=ev_info.get("audience"),
        )
        db.add(ev); db.flush()
        seed_event_template(db, ev.id)
        cats = {c.name: c for c in db.query(ServiceCategory).filter_by(event_id=ev.id).all()}

        # Cards de "Serviços Contratados" e "Check List" → ServiceItems
        service_cards = [c for c in data["cards"]
                         if not c.get("closed")
                         and lists.get(c["idList"]) in ("Check List", "Serviços Contratados", "Atividades Concluidas / Aguardando Aprovação")]
        task_cards = [c for c in data["cards"]
                      if not c.get("closed")
                      and lists.get(c["idList"]) == "Atividades à Fazer"]

        for c in service_cards:
            cat_name = _guess_category(c["name"])
            cat = cats.get(cat_name) or cats["DIVERSOS"]
            item = ServiceItem(
                category_id=cat.id,
                name=c["name"],
                description=c.get("desc") or None,
                producer_status=None,
            )
            status = STATUS_TO_PRODUCER.get(lists.get(c["idList"]))
            if status:
                from app.models import ProducerStatus
                item.producer_status = ProducerStatus(status)
            db.add(item); db.flush()

            for cl in checklists_by_card.get(c["id"], []):
                for i, ci in enumerate(cl.get("checkItems", [])):
                    db.add(ChecklistItem(
                        service_item_id=item.id,
                        text=ci["name"],
                        done=ci.get("state") == "complete",
                        sort_order=i,
                    ))

        for c in task_cards:
            db.add(Task(
                event_id=ev.id,
                title=c["name"],
                description=c.get("desc") or None,
                status="todo",
            ))

        db.commit()
        return ev.id
    finally:
        db.close()


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("path")
    args = ap.parse_args()
    eid = import_trello(args.path)
    print(f"evento importado id={eid}")
