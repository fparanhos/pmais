import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";

// ─────────────────────────────────────────────────────────────
// Seed demo — estrutura da planilha padrão Pmais + valores mock
// realistas para um congresso médio (Radar 2025 · SBD).
// Idempotente: sempre zera e recria o evento de demo (tasks/Trello são
// preservadas — só categorias/itens/fornecedores/receitas são recriadas).
// ─────────────────────────────────────────────────────────────

type StatusProdutor =
  | "APROVADO"
  | "AGUARDANDO_APROVACAO"
  | "NEGOCIACAO"
  | "EM_COTACAO";

type StatusFinanceiro =
  | "SOLICITADO"
  | "RECEBIDO"
  | "ENVIADO_LANCADO"
  | "PAGO"
  | "AGUARDANDO_APROVACAO";

type Money = { qtd?: number; dias?: number; unit?: number };

type DemoItem = {
  servico: string;
  descritivo?: string;
  planejado?: Money;
  orcado?: Money;
  contratado?: Money;
  statusProdutor?: StatusProdutor;
  statusFinanceiro?: StatusFinanceiro;
  supplier?: string;
  valorPago?: number;
  dataPagamento?: Date;
  obsParcelas?: string;
  bvAcordado?: number;
  bvRecebido?: boolean;
};

type DemoCategory = {
  name: string;
  order: number;
  items: DemoItem[];
};

// ─────────────────────────────────────────────
// Evento
// ─────────────────────────────────────────────

const EVENT = {
  name: "Radar 2025",
  cliente: "SBD — Sociedade Brasileira de Diabetes",
  produtorNome: "João Henrique",
  local: "Centro de Convenções Rebouças · São Paulo",
  publicoAlvo: "Endocrinologistas, nutricionistas e profissionais de saúde",
  startDate: new Date("2025-09-17"),
  endDate: new Date("2025-09-19"),
};

// ─────────────────────────────────────────────
// Fornecedores fictícios
// ─────────────────────────────────────────────

const SUPPLIERS = [
  { key: "avmaster", empresa: "AV Master Eventos", contato: "Carla Siqueira", telefone: "(11) 99812-4433", email: "comercial@avmaster.com.br" },
  { key: "villagio", empresa: "Hotel Villagio", contato: "Reservas Corporativo", telefone: "(11) 3456-2200", email: "corp@villagio.com.br" },
  { key: "chefmesa", empresa: "Chef & Mesa Gastronomia", contato: "Renata Toledo", telefone: "(11) 97655-1122", email: "eventos@chefmesa.com.br" },
  { key: "stecnica", empresa: "S-Técnica Stands", contato: "Paulo Mendes", telefone: "(11) 91234-5678", email: "comercial@stecnica.com.br" },
  { key: "sgrecep", empresa: "SG Recepção", contato: "Ana Lima", telefone: "(11) 98877-4455", email: "ana@sgrecepcao.com.br" },
  { key: "nevent", empresa: "N-Event Tech", contato: "Felipe Andrade", telefone: "(11) 91144-2277", email: "felipe@nevent.tech" },
  { key: "miam", empresa: "MIAM Agência", contato: "Lívia Rocha", telefone: "(11) 93311-8800", email: "projetos@miam.ag" },
  { key: "voeja", empresa: "VoeJá Corporate", contato: "Central Reservas", telefone: "0800-555-2222", email: "corp@voeja.com.br" },
  { key: "seguralta", empresa: "Segur Alta Seguradora", contato: "Roberto Pinheiro", telefone: "(11) 3344-1212", email: "rc@seguralta.com.br" },
  { key: "convencoes", empresa: "Centro de Convenções Rebouças", contato: "Comercial", telefone: "(11) 3382-0100", email: "comercial@rebouças.com.br" },
];

// ─────────────────────────────────────────────
// Despesas — estrutura da planilha + mock
// ─────────────────────────────────────────────

const CATEGORIES: DemoCategory[] = [
  {
    name: "PRÉ EVENTO",
    order: 10,
    items: [
      {
        servico: "Visita Técnica",
        planejado: { qtd: 1, dias: 1, unit: 3000 },
        orcado: { qtd: 1, dias: 1, unit: 2800 },
        contratado: { qtd: 1, dias: 1, unit: 2800 },
        statusProdutor: "APROVADO",
        statusFinanceiro: "PAGO",
        supplier: "convencoes",
        valorPago: 2800,
        dataPagamento: new Date("2025-03-18"),
      },
      {
        servico: "Reuniões Pré-Evento",
        planejado: { qtd: 4, dias: 1, unit: 1500 },
        orcado: { qtd: 4, dias: 1, unit: 1500 },
        contratado: { qtd: 3, dias: 1, unit: 1500 },
        statusProdutor: "APROVADO",
        statusFinanceiro: "ENVIADO_LANCADO",
        valorPago: 4500,
      },
    ],
  },
  {
    name: "HOSPEDAGEM E ALIMENTAÇÃO",
    order: 20,
    items: [
      {
        servico: "Hospedagem Organização",
        planejado: { qtd: 10, dias: 3, unit: 450 },
        orcado: { qtd: 10, dias: 3, unit: 430 },
        contratado: { qtd: 10, dias: 3, unit: 430 },
        statusProdutor: "APROVADO",
        statusFinanceiro: "PAGO",
        supplier: "villagio",
        valorPago: 12900,
        dataPagamento: new Date("2025-04-05"),
      },
      {
        servico: "Hospedagem Palestrantes",
        planejado: { qtd: 15, dias: 3, unit: 650 },
        orcado: { qtd: 15, dias: 3, unit: 650 },
        contratado: { qtd: 12, dias: 3, unit: 650 },
        statusProdutor: "APROVADO",
        statusFinanceiro: "SOLICITADO",
        supplier: "villagio",
      },
      {
        servico: "Alimentação Equipe",
        planejado: { qtd: 25, dias: 4, unit: 80 },
        orcado: { qtd: 25, dias: 4, unit: 75 },
        statusProdutor: "NEGOCIACAO",
        supplier: "chefmesa",
      },
    ],
  },
  {
    name: "PASSAGENS AÉREAS",
    order: 30,
    items: [
      {
        servico: "Passagem Aérea Organização",
        planejado: { qtd: 8, dias: 1, unit: 1800 },
        orcado: { qtd: 8, dias: 1, unit: 1750 },
        contratado: { qtd: 8, dias: 1, unit: 1750 },
        statusProdutor: "APROVADO",
        statusFinanceiro: "PAGO",
        supplier: "voeja",
        valorPago: 14000,
        dataPagamento: new Date("2025-03-30"),
      },
      {
        servico: "Passagem Aérea Palestrantes",
        planejado: { qtd: 12, dias: 1, unit: 2400 },
        orcado: { qtd: 12, dias: 1, unit: 2200 },
        contratado: { qtd: 9, dias: 1, unit: 2200 },
        statusProdutor: "APROVADO",
        statusFinanceiro: "ENVIADO_LANCADO",
        supplier: "voeja",
        valorPago: 9900,
        obsParcelas: "3 bilhetes pendentes de emissão",
      },
      {
        servico: "Passagem Aérea Outros",
        planejado: { qtd: 3, dias: 1, unit: 1500 },
        statusProdutor: "EM_COTACAO",
      },
    ],
  },
  {
    name: "A&B (ALIMENTOS E BEBIDAS)",
    order: 40,
    items: [
      {
        servico: "Coffee Break",
        planejado: { qtd: 6, dias: 3, unit: 3500 },
        orcado: { qtd: 6, dias: 3, unit: 3200 },
        contratado: { qtd: 6, dias: 3, unit: 3200 },
        statusProdutor: "APROVADO",
        statusFinanceiro: "AGUARDANDO_APROVACAO",
        supplier: "chefmesa",
      },
      { servico: "Água Participantes", planejado: { qtd: 500, dias: 3, unit: 4 }, orcado: { qtd: 500, dias: 3, unit: 4 }, contratado: { qtd: 500, dias: 3, unit: 4 }, statusProdutor: "APROVADO", statusFinanceiro: "PAGO", supplier: "chefmesa", valorPago: 6000, dataPagamento: new Date("2025-04-10") },
      { servico: "Garrafa de Café", planejado: { qtd: 20, dias: 3, unit: 120 }, orcado: { qtd: 20, dias: 3, unit: 120 }, statusProdutor: "AGUARDANDO_APROVACAO", supplier: "chefmesa" },
      { servico: "Serviço de Sala", planejado: { qtd: 6, dias: 3, unit: 180 }, statusProdutor: "EM_COTACAO" },
      { servico: "Coquetel/Happy Hour", planejado: { qtd: 1, dias: 1, unit: 25000 }, orcado: { qtd: 1, dias: 1, unit: 23500 }, statusProdutor: "NEGOCIACAO", supplier: "chefmesa" },
    ],
  },
  {
    name: "LOCAÇÃO DE ESPAÇOS",
    order: 50,
    items: [
      { servico: "Locação Auditório Principal", planejado: { qtd: 1, dias: 3, unit: 15000 }, orcado: { qtd: 1, dias: 3, unit: 14500 }, contratado: { qtd: 1, dias: 3, unit: 14500 }, statusProdutor: "APROVADO", statusFinanceiro: "PAGO", supplier: "convencoes", valorPago: 43500, dataPagamento: new Date("2025-03-25") },
      { servico: "Locação Salas Paralelas", planejado: { qtd: 4, dias: 3, unit: 4500 }, orcado: { qtd: 4, dias: 3, unit: 4200 }, contratado: { qtd: 4, dias: 3, unit: 4200 }, statusProdutor: "APROVADO", statusFinanceiro: "PAGO", supplier: "convencoes", valorPago: 50400, dataPagamento: new Date("2025-03-25") },
      { servico: "Locação Área de Exposição", planejado: { qtd: 1, dias: 3, unit: 22000 }, orcado: { qtd: 1, dias: 3, unit: 21000 }, contratado: { qtd: 1, dias: 3, unit: 21000 }, statusProdutor: "APROVADO", statusFinanceiro: "ENVIADO_LANCADO", supplier: "convencoes" },
    ],
  },
  {
    name: "RECURSOS HUMANOS",
    order: 60,
    items: [
      { servico: "Recepcionistas e Apoio", planejado: { qtd: 12, dias: 3, unit: 350 }, orcado: { qtd: 12, dias: 3, unit: 330 }, contratado: { qtd: 12, dias: 3, unit: 330 }, statusProdutor: "APROVADO", statusFinanceiro: "SOLICITADO", supplier: "sgrecep" },
      { servico: "Mestre de Cerimônia", planejado: { qtd: 1, dias: 3, unit: 1800 }, orcado: { qtd: 1, dias: 3, unit: 1800 }, contratado: { qtd: 1, dias: 3, unit: 1800 }, statusProdutor: "APROVADO", statusFinanceiro: "PAGO", valorPago: 5400, dataPagamento: new Date("2025-04-15") },
      { servico: "Equipe de Segurança", planejado: { qtd: 6, dias: 3, unit: 280 }, orcado: { qtd: 6, dias: 3, unit: 280 }, statusProdutor: "AGUARDANDO_APROVACAO" },
      { servico: "Equipe Bombeiro", planejado: { qtd: 2, dias: 3, unit: 450 }, orcado: { qtd: 2, dias: 3, unit: 450 }, contratado: { qtd: 2, dias: 3, unit: 450 }, statusProdutor: "APROVADO", statusFinanceiro: "AGUARDANDO_APROVACAO" },
      { servico: "Equipe Limpeza", planejado: { qtd: 8, dias: 3, unit: 220 }, orcado: { qtd: 8, dias: 3, unit: 220 }, statusProdutor: "EM_COTACAO" },
    ],
  },
  {
    name: "T.I.",
    order: 70,
    items: [
      { servico: "Site e Sistema de Inscrição", planejado: { qtd: 1, dias: 1, unit: 18000 }, orcado: { qtd: 1, dias: 1, unit: 16500 }, contratado: { qtd: 1, dias: 1, unit: 16500 }, statusProdutor: "APROVADO", statusFinanceiro: "PAGO", supplier: "nevent", valorPago: 16500, dataPagamento: new Date("2025-02-20") },
      { servico: "APP do Evento", planejado: { qtd: 1, dias: 1, unit: 12000 }, orcado: { qtd: 1, dias: 1, unit: 12000 }, contratado: { qtd: 1, dias: 1, unit: 12000 }, statusProdutor: "APROVADO", statusFinanceiro: "ENVIADO_LANCADO", supplier: "nevent", obsParcelas: "50% na assinatura, 50% após go-live" },
      { servico: "Suporte Local T.I.", planejado: { qtd: 2, dias: 3, unit: 800 }, statusProdutor: "EM_COTACAO", supplier: "nevent" },
    ],
  },
  {
    name: "EQUIPAMENTOS AUDIOVISUAIS",
    order: 80,
    items: [
      { servico: "Equipamentos Sala Principal", planejado: { qtd: 1, dias: 3, unit: 28000 }, orcado: { qtd: 1, dias: 3, unit: 26500 }, contratado: { qtd: 1, dias: 3, unit: 26500 }, statusProdutor: "APROVADO", statusFinanceiro: "ENVIADO_LANCADO", supplier: "avmaster", bvAcordado: 2650, bvRecebido: false },
      { servico: "Equipamentos Salas Paralelas", planejado: { qtd: 4, dias: 3, unit: 6500 }, orcado: { qtd: 4, dias: 3, unit: 6200 }, contratado: { qtd: 4, dias: 3, unit: 6200 }, statusProdutor: "APROVADO", statusFinanceiro: "AGUARDANDO_APROVACAO", supplier: "avmaster", bvAcordado: 3000, bvRecebido: false },
      { servico: "Equipamentos Credenciamento", planejado: { qtd: 1, dias: 3, unit: 4200 }, orcado: { qtd: 1, dias: 3, unit: 4200 }, statusProdutor: "AGUARDANDO_APROVACAO", supplier: "avmaster" },
    ],
  },
  {
    name: "MATERIAL DO PARTICIPANTE",
    order: 90,
    items: [
      { servico: "Kit Participante", planejado: { qtd: 600, dias: 1, unit: 45 }, orcado: { qtd: 600, dias: 1, unit: 42 }, contratado: { qtd: 600, dias: 1, unit: 42 }, statusProdutor: "APROVADO", statusFinanceiro: "PAGO", supplier: "miam", valorPago: 25200, dataPagamento: new Date("2025-04-12") },
      { servico: "Crachá", planejado: { qtd: 600, dias: 1, unit: 4 }, orcado: { qtd: 600, dias: 1, unit: 4 }, contratado: { qtd: 600, dias: 1, unit: 4 }, statusProdutor: "APROVADO", statusFinanceiro: "PAGO", supplier: "miam", valorPago: 2400, dataPagamento: new Date("2025-04-12") },
      { servico: "Fita de Crachá", planejado: { qtd: 600, dias: 1, unit: 3 }, orcado: { qtd: 600, dias: 1, unit: 2.8 }, contratado: { qtd: 600, dias: 1, unit: 2.8 }, statusProdutor: "APROVADO", statusFinanceiro: "PAGO", supplier: "miam", valorPago: 1680, dataPagamento: new Date("2025-04-12") },
      { servico: "Premiação", planejado: { qtd: 5, dias: 1, unit: 800 }, orcado: { qtd: 5, dias: 1, unit: 760 }, statusProdutor: "AGUARDANDO_APROVACAO" },
      { servico: "Frete Material", planejado: { qtd: 1, dias: 1, unit: 3500 }, orcado: { qtd: 1, dias: 1, unit: 3500 }, statusProdutor: "EM_COTACAO" },
    ],
  },
  {
    name: "INFRAESTRUTURA",
    order: 100,
    items: [
      { servico: "Montadora de Stands", planejado: { qtd: 1, dias: 3, unit: 85000 }, orcado: { qtd: 1, dias: 3, unit: 82000 }, contratado: { qtd: 1, dias: 3, unit: 82000 }, statusProdutor: "APROVADO", statusFinanceiro: "ENVIADO_LANCADO", supplier: "stecnica", obsParcelas: "40/30/30 em 3 parcelas" },
      { servico: "TVs para Stands", planejado: { qtd: 18, dias: 3, unit: 180 }, orcado: { qtd: 18, dias: 3, unit: 170 }, statusProdutor: "NEGOCIACAO", supplier: "avmaster" },
      { servico: "Operacional", planejado: { qtd: 1, dias: 3, unit: 5000 }, orcado: { qtd: 1, dias: 3, unit: 4800 }, statusProdutor: "AGUARDANDO_APROVACAO", supplier: "stecnica" },
      { servico: "Credenciamento", planejado: { qtd: 1, dias: 3, unit: 2700 }, statusProdutor: "EM_COTACAO" },
      { servico: "Mobiliário", planejado: { qtd: 1, dias: 3, unit: 4000 }, orcado: { qtd: 1, dias: 3, unit: 4000 }, statusProdutor: "AGUARDANDO_APROVACAO", supplier: "stecnica" },
      { servico: "Cadeiras", planejado: { qtd: 500, dias: 3, unit: 8 }, orcado: { qtd: 500, dias: 3, unit: 7.5 }, contratado: { qtd: 500, dias: 3, unit: 7.5 }, statusProdutor: "APROVADO", statusFinanceiro: "AGUARDANDO_APROVACAO", supplier: "stecnica" },
      { servico: "Sinalização", planejado: { qtd: 1, dias: 1, unit: 9500 }, orcado: { qtd: 1, dias: 1, unit: 9000 }, statusProdutor: "NEGOCIACAO", supplier: "miam" },
      { servico: "Extras Operacional", planejado: { qtd: 1, dias: 1, unit: 6000 }, statusProdutor: "EM_COTACAO" },
    ],
  },
  {
    name: "DIVERSOS",
    order: 110,
    items: [
      { servico: "Agência de Criação", planejado: { qtd: 1, dias: 1, unit: 25000 }, orcado: { qtd: 1, dias: 1, unit: 23000 }, contratado: { qtd: 1, dias: 1, unit: 23000 }, statusProdutor: "APROVADO", statusFinanceiro: "PAGO", supplier: "miam", valorPago: 23000, dataPagamento: new Date("2025-02-10") },
      { servico: "Seguro Responsabilidade Civil", planejado: { qtd: 1, dias: 1, unit: 4800 }, orcado: { qtd: 1, dias: 1, unit: 4800 }, contratado: { qtd: 1, dias: 1, unit: 4800 }, statusProdutor: "APROVADO", statusFinanceiro: "PAGO", supplier: "seguralta", valorPago: 4800, dataPagamento: new Date("2025-04-01") },
      { servico: "Material de Escritório", planejado: { qtd: 1, dias: 1, unit: 2500 }, orcado: { qtd: 1, dias: 1, unit: 2200 }, statusProdutor: "APROVADO", statusFinanceiro: "SOLICITADO" },
      { servico: "Cobertura Fotográfica", planejado: { qtd: 1, dias: 3, unit: 3500 }, orcado: { qtd: 1, dias: 3, unit: 3500 }, contratado: { qtd: 1, dias: 3, unit: 3500 }, statusProdutor: "APROVADO", statusFinanceiro: "AGUARDANDO_APROVACAO" },
      { servico: "Internet WiFi", planejado: { qtd: 1, dias: 3, unit: 4200 }, orcado: { qtd: 1, dias: 3, unit: 4200 }, contratado: { qtd: 1, dias: 3, unit: 4200 }, statusProdutor: "APROVADO", statusFinanceiro: "ENVIADO_LANCADO", supplier: "convencoes" },
      { servico: "Material de Divulgação", planejado: { qtd: 1, dias: 1, unit: 18000 }, orcado: { qtd: 1, dias: 1, unit: 16500 }, statusProdutor: "AGUARDANDO_APROVACAO", supplier: "miam" },
    ],
  },
  {
    name: "TAXA DE ADMINISTRAÇÃO",
    order: 120,
    items: [
      { servico: "Taxa Administrativa", descritivo: "12% sobre total de despesas contratadas", planejado: { qtd: 1, dias: 1, unit: 85000 }, orcado: { qtd: 1, dias: 1, unit: 85000 }, contratado: { qtd: 1, dias: 1, unit: 85000 }, statusProdutor: "APROVADO", statusFinanceiro: "ENVIADO_LANCADO" },
    ],
  },
];

// ─────────────────────────────────────────────
// Receitas
// ─────────────────────────────────────────────

type DemoRevenue = {
  type: "INSCRICAO" | "PATROCINIO" | "OUTRAS";
  descritivo: string;
  planejadoQtd?: number;
  planejadoValorTotal?: number;
  realizadoQtd?: number;
  realizadoValorTotal?: number;
};

const RECEITAS: DemoRevenue[] = [
  { type: "INSCRICAO", descritivo: "Cortesias", planejadoQtd: 50, planejadoValorTotal: 0, realizadoQtd: 42, realizadoValorTotal: 0 },
  { type: "INSCRICAO", descritivo: "Estudante Sócio", planejadoQtd: 80, planejadoValorTotal: 9600, realizadoQtd: 64, realizadoValorTotal: 7680 },
  { type: "INSCRICAO", descritivo: "Estudante Não Sócio", planejadoQtd: 120, planejadoValorTotal: 21600, realizadoQtd: 88, realizadoValorTotal: 15840 },
  { type: "INSCRICAO", descritivo: "Sócio", planejadoQtd: 200, planejadoValorTotal: 76000, realizadoQtd: 162, realizadoValorTotal: 61560 },
  { type: "INSCRICAO", descritivo: "Não Sócio", planejadoQtd: 150, planejadoValorTotal: 78000, realizadoQtd: 104, realizadoValorTotal: 54080 },

  { type: "PATROCINIO", descritivo: "Platina (1 cota disponível)", planejadoQtd: 1, planejadoValorTotal: 180000, realizadoQtd: 1, realizadoValorTotal: 180000 },
  { type: "PATROCINIO", descritivo: "Ouro (5 cotas disponíveis)", planejadoQtd: 5, planejadoValorTotal: 425000, realizadoQtd: 3, realizadoValorTotal: 255000 },
  { type: "PATROCINIO", descritivo: "Prata (6 cotas disponíveis)", planejadoQtd: 6, planejadoValorTotal: 270000, realizadoQtd: 5, realizadoValorTotal: 225000 },
  { type: "PATROCINIO", descritivo: "Bronze (12 cotas disponíveis)", planejadoQtd: 12, planejadoValorTotal: 264000, realizadoQtd: 10, realizadoValorTotal: 220000 },
  { type: "PATROCINIO", descritivo: "Bronze SEM STAND", planejadoQtd: 10, planejadoValorTotal: 150000, realizadoQtd: 8, realizadoValorTotal: 120000 },
  { type: "PATROCINIO", descritivo: "Jantar de Confraternização", planejadoQtd: 1, planejadoValorTotal: 35000, realizadoQtd: 1, realizadoValorTotal: 35000 },
  { type: "PATROCINIO", descritivo: "Coffee Break (8 cotas)", planejadoQtd: 8, planejadoValorTotal: 96000, realizadoQtd: 6, realizadoValorTotal: 72000 },
  { type: "PATROCINIO", descritivo: "Cadeiras Plenária (4 cotas)", planejadoQtd: 4, planejadoValorTotal: 32000, realizadoQtd: 3, realizadoValorTotal: 24000 },
  { type: "PATROCINIO", descritivo: "Totens Carregadores de Celular", planejadoQtd: 2, planejadoValorTotal: 50000, realizadoQtd: 1, realizadoValorTotal: 25000 },

  { type: "OUTRAS", descritivo: "Credencial de Expositor", planejadoQtd: 40, planejadoValorTotal: 15200, realizadoQtd: 32, realizadoValorTotal: 12160 },
  { type: "OUTRAS", descritivo: "Jantar de Confraternização", planejadoQtd: 80, planejadoValorTotal: 14400, realizadoQtd: 58, realizadoValorTotal: 10440 },
];

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function total(m?: Money): number | null {
  if (!m) return null;
  const q = m.qtd ?? 1;
  const d = m.dias ?? 1;
  const u = m.unit ?? 0;
  if (!u) return null;
  return Number((q * d * u).toFixed(2));
}

function moneyFields(prefix: "planejado" | "orcado" | "contratado", m?: Money) {
  if (!m) {
    return {
      [`${prefix}QtdItens`]: null,
      [`${prefix}QtdDias`]: null,
      [`${prefix}ValorUnit`]: null,
      [`${prefix}ValorTotal`]: null,
    };
  }
  return {
    [`${prefix}QtdItens`]: m.qtd ?? null,
    [`${prefix}QtdDias`]: m.dias ?? null,
    [`${prefix}ValorUnit`]: m.unit ?? null,
    [`${prefix}ValorTotal`]: total(m),
  };
}

// ─────────────────────────────────────────────
// Seed
// ─────────────────────────────────────────────

async function main() {
  const prisma = new PrismaClient();

  // Find or create event (idempotent)
  const event = await prisma.event.upsert({
    where: { id: (await prisma.event.findFirst({ where: { name: EVENT.name } }))?.id ?? "__no_match__" },
    update: { ...EVENT },
    create: { ...EVENT },
  });
  console.log(`✓ Event: ${event.name} (${event.id})`);

  // Wipe children for idempotency
  await prisma.expenseCategory.deleteMany({ where: { eventId: event.id } });
  await prisma.revenueItem.deleteMany({ where: { eventId: event.id } });
  await prisma.supplier.deleteMany({ where: { eventId: event.id } });

  // Suppliers
  const supplierByKey = new Map<string, string>();
  for (const s of SUPPLIERS) {
    const created = await prisma.supplier.create({
      data: {
        eventId: event.id,
        empresa: s.empresa,
        contato: s.contato,
        telefone: s.telefone,
        email: s.email,
      },
    });
    supplierByKey.set(s.key, created.id);
  }
  console.log(`✓ Suppliers: ${supplierByKey.size}`);

  // Expense categories + items
  let itemCount = 0;
  for (const cat of CATEGORIES) {
    const created = await prisma.expenseCategory.create({
      data: {
        eventId: event.id,
        name: cat.name,
        order: cat.order,
      },
    });
    for (const item of cat.items) {
      await prisma.expenseItem.create({
        data: {
          categoryId: created.id,
          servico: item.servico,
          descritivo: item.descritivo ?? null,
          ...moneyFields("planejado", item.planejado),
          ...moneyFields("orcado", item.orcado),
          ...moneyFields("contratado", item.contratado),
          statusProdutor: item.statusProdutor ?? "EM_COTACAO",
          statusFinanceiro: item.statusFinanceiro ?? "AGUARDANDO_APROVACAO",
          supplierId: item.supplier ? supplierByKey.get(item.supplier) ?? null : null,
          valorPago: item.valorPago ?? null,
          dataPagamento: item.dataPagamento ?? null,
          obsParcelas: item.obsParcelas ?? null,
          bvAcordado: item.bvAcordado ?? null,
          bvRecebido: item.bvRecebido ?? false,
        },
      });
      itemCount++;
    }
  }
  console.log(`✓ Expense categories: ${CATEGORIES.length} · items: ${itemCount}`);

  // Revenues
  for (const r of RECEITAS) {
    await prisma.revenueItem.create({
      data: {
        eventId: event.id,
        type: r.type,
        descritivo: r.descritivo,
        planejadoQtd: r.planejadoQtd ?? null,
        planejadoValorTotal: r.planejadoValorTotal ?? null,
        realizadoQtd: r.realizadoQtd ?? null,
        realizadoValorTotal: r.realizadoValorTotal ?? null,
      },
    });
  }
  console.log(`✓ Revenue items: ${RECEITAS.length}`);

  // Summary
  const expensesPlanejado = await prisma.expenseItem.aggregate({
    where: { category: { eventId: event.id } },
    _sum: { planejadoValorTotal: true, contratadoValorTotal: true, valorPago: true },
  });
  const revenuesPlanejado = await prisma.revenueItem.aggregate({
    where: { eventId: event.id },
    _sum: { planejadoValorTotal: true, realizadoValorTotal: true },
  });

  const fmt = (n: number | null | undefined) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n ?? 0);

  console.log("");
  console.log("── Resumo Radar 2026 ──");
  console.log(`Despesa Planejada:  ${fmt(expensesPlanejado._sum.planejadoValorTotal)}`);
  console.log(`Despesa Contratada: ${fmt(expensesPlanejado._sum.contratadoValorTotal)}`);
  console.log(`Despesa Paga:       ${fmt(expensesPlanejado._sum.valorPago)}`);
  console.log(`Receita Planejada:  ${fmt(revenuesPlanejado._sum.planejadoValorTotal)}`);
  console.log(`Receita Realizada:  ${fmt(revenuesPlanejado._sum.realizadoValorTotal)}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
