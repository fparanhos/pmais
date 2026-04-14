"""Endpoint admin para popular um evento com dados mockados realistas."""
from datetime import date, datetime, timedelta
from decimal import Decimal
from random import Random

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import (
    EmailLog, Event, FinanceStatus, ProducerStatus, Revenue, Role,
    ServiceCategory, ServiceItem, User,
)
from app.security import require_roles
from app.seed_template import seed_event_template

router = APIRouter(prefix="/api/mock", tags=["mock"])


# (categoria, item, qtd, dias, unit_planejado, unit_orcado, unit_contratado,
#   producer_status, supplier, finance_status, paid, notes)
ITEMS = [
    ("PRÉ EVENTO", "Visita Técnica", 1, 1, 1200, 1100, 1100, "Aprovado", "TechProd Eventos", "Pago", 1100, ""),
    ("PRÉ EVENTO", "Reuniões Pré-Evento", 4, 1, 250, 250, 250, "Aprovado", "Interno", "Pago", 1000, "4 reuniões"),

    ("HOSPEDAGEM E ALIMENTAÇÃO", "Hospedagem Organização", 15, 3, 280, 260, 240, "Aprovado", "Hotel Atlântico", "Pago", 10800, "2 parcelas"),
    ("HOSPEDAGEM E ALIMENTAÇÃO", "Hospedagem Palestrantes", 8, 2, 380, 360, 360, "Aprovado", "Hotel Atlântico", "Aguardando Aprovação", 0, ""),
    ("HOSPEDAGEM E ALIMENTAÇÃO", "Alimentação Equipe", 20, 3, 65, 65, 65, "Aprovado", "Restaurante Sabor", "Enviado/Lançado", 0, ""),

    ("PASSAGENS AÉREAS", "Passagem Aérea Organização", 6, 1, 1450, 1380, 1380, "Aprovado", "CVC Corp", "Pago", 8280, ""),
    ("PASSAGENS AÉREAS", "Passagem Aérea Palestrantes", 8, 1, 1800, 1650, 1620, "Aprovado", "CVC Corp", "Pago", 12960, ""),
    ("PASSAGENS AÉREAS", "Passagem Aérea Outros", 3, 1, 1300, 1250, 0, "Negociação", "CVC Corp", None, 0, "aguardando cotação"),

    ("A&B (ALIMENTOS E BEBIDAS)", "Coffee Break", 450, 3, 28, 26, 26, "Aprovado", "Gourmet Catering", "Solicitado", 0, "3 dias"),
    ("A&B (ALIMENTOS E BEBIDAS)", "Água Participantes", 450, 3, 3, 3, 3, "Aprovado", "Gourmet Catering", "Solicitado", 0, ""),
    ("A&B (ALIMENTOS E BEBIDAS)", "Garrafa de Café", 20, 3, 45, 42, 42, "Aprovado", "Gourmet Catering", "Pago", 2520, ""),
    ("A&B (ALIMENTOS E BEBIDAS)", "Serviço de Sala", 4, 3, 180, 180, 180, "Aprovado", "Gourmet Catering", "Recebido", 0, ""),
    ("A&B (ALIMENTOS E BEBIDAS)", "Coquetel/Happy Hour", 300, 1, 85, 82, 0, "Em Cotação", "", None, 0, ""),

    ("LOCAÇÃO DE ESPAÇOS", "Locação Auditório Principal", 1, 3, 8500, 8200, 8000, "Aprovado", "Centro de Convenções Recife", "Pago", 24000, "50% adiantado"),
    ("LOCAÇÃO DE ESPAÇOS", "Locação Salas Paralelas", 4, 3, 1800, 1750, 1700, "Aprovado", "Centro de Convenções Recife", "Pago", 20400, ""),
    ("LOCAÇÃO DE ESPAÇOS", "Locação Área de Exposição", 1, 3, 6500, 6200, 6200, "Aprovado", "Centro de Convenções Recife", "Enviado/Lançado", 0, ""),

    ("RECURSOS HUMANOS", "Recepcionistas e Apoio", 12, 3, 220, 200, 200, "Aprovado", "Agência Eventos RH", "Aguardando Aprovação", 0, ""),
    ("RECURSOS HUMANOS", "Mestre de Cerimônia", 1, 2, 3500, 3200, 3200, "Aprovado", "Carlos Silva Apresentador", "Pago", 3200, ""),
    ("RECURSOS HUMANOS", "Equipe de Segurança", 8, 3, 180, 180, 180, "Aprovado", "SecurityMax", "Pago", 4320, ""),
    ("RECURSOS HUMANOS", "Equipe Bombeiro", 2, 3, 450, 420, 420, "Aprovado", "SecurityMax", "Pago", 2520, ""),
    ("RECURSOS HUMANOS", "Equipe Limpeza", 6, 3, 150, 150, 150, "Aprovado", "LimpaTudo", "Solicitado", 0, ""),

    ("T.I.", "Site e Sistema de Inscrição", 1, 1, 4500, 4200, 4200, "Aprovado", "WebFast Dev", "Pago", 4200, "pagamento único"),
    ("T.I.", "APP do Evento", 1, 1, 3800, 0, 0, "Negociação", "AppStudio", None, 0, "negociando escopo"),
    ("T.I.", "Suporte Local T.I.", 2, 3, 380, 350, 350, "Aprovado", "WebFast Dev", "Enviado/Lançado", 0, ""),

    ("EQUIPAMENTOS AUDIOVISUAIS", "Equipamentos Sala Principal", 1, 3, 6800, 6500, 6500, "Aprovado", "AV Pro", "Pago", 19500, ""),
    ("EQUIPAMENTOS AUDIOVISUAIS", "Equipamentos Salas Paralelas", 4, 3, 2200, 2100, 2100, "Aprovado", "AV Pro", "Pago", 25200, ""),
    ("EQUIPAMENTOS AUDIOVISUAIS", "Equipamentos Credenciamento", 1, 3, 1200, 1150, 1150, "Aprovado", "AV Pro", "Enviado/Lançado", 0, ""),

    ("MATERIAL DO PARTICIPANTE", "Kit Participante", 450, 1, 48, 42, 40, "Aprovado", "BrindeFácil", "Aguardando Aprovação", 0, ""),
    ("MATERIAL DO PARTICIPANTE", "Crachá", 450, 1, 4.5, 4, 4, "Aprovado", "BrindeFácil", "Aguardando Aprovação", 0, ""),
    ("MATERIAL DO PARTICIPANTE", "Fita de Crachá", 450, 1, 2.5, 2, 2, "Aprovado", "BrindeFácil", "Aguardando Aprovação", 0, ""),
    ("MATERIAL DO PARTICIPANTE", "Premiação", 5, 1, 380, 360, 360, "Aprovado", "Troféus Norte", "Pago", 1800, ""),
    ("MATERIAL DO PARTICIPANTE", "Frete Material", 1, 1, 1200, 1100, 1100, "Aprovado", "TransLog", "Solicitado", 0, ""),

    ("INFRAESTRUTURA", "Montadora de Stands", 1, 3, 18000, 17200, 17200, "Aprovado", "Stand Brasil", "Pago", 8600, "50% adiantado"),
    ("INFRAESTRUTURA", "TVs para Stands", 8, 3, 220, 200, 200, "Aprovado", "AV Pro", "Enviado/Lançado", 0, ""),
    ("INFRAESTRUTURA", "Operacional", 1, 3, 3500, 3200, 3200, "Aprovado", "Stand Brasil", "Solicitado", 0, ""),
    ("INFRAESTRUTURA", "Credenciamento", 1, 3, 2800, 2500, 2500, "Aprovado", "Stand Brasil", "Solicitado", 0, ""),
    ("INFRAESTRUTURA", "Mobiliário", 1, 3, 4200, 3800, 3800, "Aprovado", "Stand Brasil", "Solicitado", 0, ""),
    ("INFRAESTRUTURA", "Cadeiras", 450, 3, 12, 10, 10, "Aprovado", "Stand Brasil", "Solicitado", 0, ""),
    ("INFRAESTRUTURA", "Sinalização", 1, 1, 2400, 2200, 2200, "Aprovado", "Plotagem Express", "Pago", 2200, ""),
    ("INFRAESTRUTURA", "Extras Operacional", 1, 1, 1800, 1500, 0, "Aguardando Aprovação", "", None, 0, ""),

    ("DIVERSOS", "Agência de Criação", 1, 1, 8500, 8000, 8000, "Aprovado", "Criativa Studio", "Pago", 8000, ""),
    ("DIVERSOS", "Seguro Responsabilidade Civil", 1, 1, 2200, 2000, 2000, "Aprovado", "Seguradora Norte", "Pago", 2000, ""),
    ("DIVERSOS", "Material de Escritório", 1, 1, 800, 700, 700, "Aprovado", "Papelaria Central", "Pago", 700, ""),
    ("DIVERSOS", "Cobertura Fotográfica", 1, 3, 1800, 1650, 1650, "Aprovado", "FotoPro", "Enviado/Lançado", 0, ""),
    ("DIVERSOS", "Internet WiFi", 1, 3, 2200, 2000, 2000, "Aprovado", "NetFast", "Pago", 6000, ""),
    ("DIVERSOS", "Material de Divulgação", 1, 1, 3500, 3200, 3200, "Aprovado", "Criativa Studio", "Pago", 3200, ""),

    ("TAXA DE ADMINISTRAÇÃO", "Taxa Administrativa", 1, 1, 15000, 15000, 15000, "Aprovado", "Pmais Eventos", "Enviado/Lançado", 0, "12% sobre contratado"),
]


REVENUES = [
    ("Inscrição", "Cortesias", 25, 0, 18, 0),
    ("Inscrição", "Estudante Sócio", 60, 250, 42, 250),
    ("Inscrição", "Estudante Não Sócio", 40, 380, 28, 380),
    ("Inscrição", "Sócio", 200, 850, 143, 850),
    ("Inscrição", "Não Sócio", 120, 1050, 87, 1050),

    ("Patrocínio", "Platina (1 cota)", 1, 60000, 1, 60000),
    ("Patrocínio", "Ouro (5 cotas)", 5, 30000, 3, 30000),
    ("Patrocínio", "Prata (6 cotas)", 6, 18000, 4, 18000),
    ("Patrocínio", "Bronze (12 cotas)", 12, 9000, 7, 9000),
    ("Patrocínio", "Bronze SEM STAND", 4, 6500, 2, 6500),
    ("Patrocínio", "Jantar de Confraternização", 1, 18000, 1, 18000),
    ("Patrocínio", "Coffee Break (8 cotas)", 8, 4500, 5, 4500),
    ("Patrocínio", "Cadeiras Plenária (4 cotas)", 4, 3500, 2, 3500),
    ("Patrocínio", "Totens Carregadores de Celular", 3, 2800, 1, 2800),

    ("Outras", "Credencial de Expositor", 35, 180, 22, 180),
    ("Outras", "Jantar de Confraternização", 180, 220, 124, 220),
]


def _d(x):
    return Decimal(str(x)) if x not in (None, 0) else None


@router.post("/populate", dependencies=[Depends(require_roles(Role.ADMIN))])
def populate(db: Session = Depends(get_db)):
    """Cria/substitui o evento mock 'Radar 2026' com dados realistas."""
    existing = db.query(Event).filter(Event.name == "Radar 2026").first()
    if existing:
        db.delete(existing); db.commit()

    ev = Event(
        name="Radar 2026",
        event_date=date.today() + timedelta(days=45),
        location="Centro de Convenções de Recife",
        audience="450 participantes",
        client="SBCBM - Sociedade Brasileira de Cirurgia Bariátrica",
        producer_email="joao.henrique@pmaiseventos.com",
        finance_email="paulo.cavalcanti@pmaiseventos.com",
    )
    db.add(ev); db.flush()

    seed_event_template(db, ev.id)
    cats = {c.name: c for c in db.query(ServiceCategory).filter_by(event_id=ev.id).all()}

    for row in ITEMS:
        cat_name, name, qty, days, up, uo, uc, ps, sup, fs, paid, notes = row
        cat = cats.get(cat_name)
        if not cat:
            continue
        item = db.query(ServiceItem).filter_by(category_id=cat.id, name=name).first()
        if not item:
            item = ServiceItem(category_id=cat.id, name=name)
            db.add(item)
        item.planned_qty = _d(qty); item.planned_days = _d(days); item.planned_unit = _d(up)
        item.budgeted_qty = _d(qty); item.budgeted_days = _d(days); item.budgeted_unit = _d(uo)
        item.contracted_qty = _d(qty) if uc else None
        item.contracted_days = _d(days) if uc else None
        item.contracted_unit = _d(uc)
        item.producer_status = ProducerStatus(ps) if ps else None
        item.supplier_company = sup or None
        item.finance_status = FinanceStatus(fs) if fs else None
        item.paid_value = _d(paid)
        item.notes = notes or None

    for g, n, pq, pu, rq, ru in REVENUES:
        db.add(Revenue(
            event_id=ev.id, group_name=g, name=n,
            planned_qty=_d(pq), planned_unit=_d(pu),
            realized_qty=_d(rq), realized_unit=_d(ru),
        ))

    # logs de e-mail mockados
    rnd = Random(42)
    subs = ["Orçamento Aprovado", "Pagamento Confirmado", "Lembrete: Radar 2026 em 7 dias"]
    for i in range(18):
        db.add(EmailLog(
            sent_at=datetime.utcnow() - timedelta(days=rnd.randint(1, 30), hours=rnd.randint(0, 23)),
            to_email=rnd.choice([ev.producer_email, ev.finance_email, "cliente@sbcbm.org.br"]),
            subject=f"{rnd.choice(subs)} - Radar 2026",
            template_key=rnd.choice(["producer_approved", "payment_confirmed", "event_reminder_7d"]),
            event_id=ev.id,
            status="sent",
        ))

    db.commit()
    return {"ok": True, "event_id": ev.id, "items": len(ITEMS), "revenues": len(REVENUES)}
