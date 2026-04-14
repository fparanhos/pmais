"""Estrutura de categorias e itens-padrão replicando a planilha Pmais."""
from sqlalchemy.orm import Session

from app.models import EmailTemplate, ServiceCategory, ServiceItem

CATEGORIES: list[tuple[str, list[str]]] = [
    ("PRÉ EVENTO", ["Visita Técnica", "Reuniões Pré-Evento"]),
    ("HOSPEDAGEM E ALIMENTAÇÃO", ["Hospedagem Organização", "Hospedagem Palestrantes", "Alimentação Equipe"]),
    ("PASSAGENS AÉREAS", ["Passagem Aérea Organização", "Passagem Aérea Palestrantes", "Passagem Aérea Outros"]),
    ("A&B (ALIMENTOS E BEBIDAS)", ["Coffee Break", "Água Participantes", "Garrafa de Café", "Serviço de Sala", "Coquetel/Happy Hour"]),
    ("LOCAÇÃO DE ESPAÇOS", ["Locação Auditório Principal", "Locação Salas Paralelas", "Locação Área de Exposição"]),
    ("RECURSOS HUMANOS", ["Recepcionistas e Apoio", "Mestre de Cerimônia", "Equipe de Segurança", "Equipe Bombeiro", "Equipe Limpeza"]),
    ("T.I.", ["Site e Sistema de Inscrição", "APP do Evento", "Suporte Local T.I."]),
    ("EQUIPAMENTOS AUDIOVISUAIS", ["Equipamentos Sala Principal", "Equipamentos Salas Paralelas", "Equipamentos Credenciamento"]),
    ("MATERIAL DO PARTICIPANTE", ["Kit Participante", "Crachá", "Fita de Crachá", "Premiação", "Frete Material"]),
    ("INFRAESTRUTURA", ["Montadora de Stands", "TVs para Stands", "Operacional", "Credenciamento", "Mobiliário", "Cadeiras", "Sinalização", "Extras Operacional"]),
    ("DIVERSOS", ["Agência de Criação", "Seguro Responsabilidade Civil", "Material de Escritório", "Cobertura Fotográfica", "Internet WiFi", "Material de Divulgação"]),
    ("TAXA DE ADMINISTRAÇÃO", ["Taxa Administrativa"]),
]


def seed_event_template(db: Session, event_id: int) -> None:
    for order, (cat_name, items) in enumerate(CATEGORIES):
        cat = ServiceCategory(event_id=event_id, name=cat_name, sort_order=order)
        db.add(cat); db.flush()
        for item in items:
            db.add(ServiceItem(category_id=cat.id, name=item))


DEFAULT_TEMPLATES = [
    ("producer_approved",
     "Orçamento Aprovado - {{evento}}",
     "<p>Olá,</p><p>O serviço <b>{{servico}}</b> do evento <b>{{evento}}</b> foi <b>APROVADO</b> pelo produtor.</p><p>Fornecedor: {{fornecedor}}<br>Valor: R$ {{valor}}</p><p>Atenciosamente,<br>Sistema Pmais Eventos</p>"),
    ("payment_confirmed",
     "Pagamento Confirmado - {{evento}}",
     "<p>Olá,</p><p>O pagamento do serviço <b>{{servico}}</b> do evento <b>{{evento}}</b> foi <b>CONFIRMADO</b> pelo financeiro.</p><p>Atenciosamente,<br>Sistema Pmais Eventos</p>"),
    ("event_reminder_7d",
     "Lembrete: {{evento}} em 7 dias",
     "<p>O evento <b>{{evento}}</b> acontece em 7 dias ({{data}}).</p>"),
    ("event_reminder_1d",
     "Lembrete: {{evento}} amanhã",
     "<p>O evento <b>{{evento}}</b> acontece amanhã ({{data}}). Confira o checklist final.</p>"),
]


def seed_default_templates(db: Session) -> None:
    for key, subj, body in DEFAULT_TEMPLATES:
        if not db.query(EmailTemplate).filter(EmailTemplate.key == key).first():
            db.add(EmailTemplate(key=key, subject=subj, body_html=body))
    db.commit()
