import "server-only";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";

// ─────────────────────────────────────────────────────────────
// Importer da planilha padrão Pmais (.xlsx / .xlsm)
//
// Lê a aba "Controle de Evento" e espelha no banco:
//   - Categorias de despesa (PRÉ EVENTO, HOSPEDAGEM, etc.)
//   - Itens de cada categoria com Planejado/Orçado/Contratado,
//     status produtor/financeiro, fornecedor e pagamento
//   - Receitas por tipo (Inscrição, Patrocínio, Outras)
//
// Idempotente — upsert por nome do evento; categorias/itens/fornecedores/
// receitas são recriados do zero a cada import. Tarefas (Trello) sobrevivem.
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

type RevenueType = "INSCRICAO" | "PATROCINIO" | "OUTRAS";

const CATEGORIES = [
  "PRÉ EVENTO",
  "HOSPEDAGEM E ALIMENTAÇÃO",
  "PASSAGENS AÉREAS",
  "A&B (ALIMENTOS E BEBIDAS)",
  "LOCAÇÃO DE ESPAÇOS",
  "RECURSOS HUMANOS",
  "T.I.",
  "EQUIPAMENTOS AUDIOVISUAIS",
  "MATERIAL DO PARTICIPANTE",
  "INFRAESTRUTURA",
  "DIVERSOS",
  "TAXA DE ADMINISTRAÇÃO",
] as const;

const STATUS_PRODUTOR_MAP: Record<string, StatusProdutor> = {
  aprovado: "APROVADO",
  "aguardando aprovação": "AGUARDANDO_APROVACAO",
  "aguardando aprovacao": "AGUARDANDO_APROVACAO",
  negociação: "NEGOCIACAO",
  negociacao: "NEGOCIACAO",
  "em cotação": "EM_COTACAO",
  "em cotacao": "EM_COTACAO",
};

const STATUS_FINANCEIRO_MAP: Record<string, StatusFinanceiro> = {
  solicitado: "SOLICITADO",
  recebido: "RECEBIDO",
  "enviado/lançado": "ENVIADO_LANCADO",
  "enviado/lancado": "ENVIADO_LANCADO",
  enviado: "ENVIADO_LANCADO",
  lançado: "ENVIADO_LANCADO",
  lancado: "ENVIADO_LANCADO",
  pago: "PAGO",
  "aguardando aprovação": "AGUARDANDO_APROVACAO",
  "aguardando aprovacao": "AGUARDANDO_APROVACAO",
};

function norm(v: unknown): string {
  if (v == null) return "";
  return String(v).trim();
}

function normLower(v: unknown): string {
  return norm(v).toLowerCase();
}

function toNum(v: unknown): number | null {
  if (v == null || v === "") return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const s = String(v).replace(/\s|R\$/g, "").replace(/\./g, "").replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function toInt(v: unknown): number | null {
  const n = toNum(v);
  return n == null ? null : Math.round(n);
}

function toDate(v: unknown): Date | null {
  if (v == null || v === "") return null;
  if (v instanceof Date) return v;
  if (typeof v === "number") {
    // Excel serial date: days since 1899-12-30
    const epoch = new Date(Date.UTC(1899, 11, 30));
    const d = new Date(epoch.getTime() + v * 86400000);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d;
}

function parseStatusProdutor(v: unknown): StatusProdutor {
  const key = normLower(v);
  return STATUS_PRODUTOR_MAP[key] ?? "EM_COTACAO";
}

function parseStatusFinanceiro(v: unknown): StatusFinanceiro {
  const key = normLower(v);
  return STATUS_FINANCEIRO_MAP[key] ?? "AGUARDANDO_APROVACAO";
}

function isCategoryRow(row: unknown[]): string | null {
  const a = norm(row[0]);
  if (!a) return null;
  const match = CATEGORIES.find((c) => a.toUpperCase() === c);
  return match ?? null;
}

function isTotalRow(row: unknown[]): boolean {
  return norm(row[0]).toUpperCase().startsWith("TOTAL ");
}

type ItemRow = {
  servico: string;
  planejadoQtdItens: number | null;
  planejadoQtdDias: number | null;
  planejadoValorUnit: number | null;
  planejadoValorTotal: number | null;
  orcadoQtdItens: number | null;
  orcadoQtdDias: number | null;
  orcadoValorUnit: number | null;
  orcadoValorTotal: number | null;
  contratadoQtdItens: number | null;
  contratadoQtdDias: number | null;
  contratadoValorUnit: number | null;
  contratadoValorTotal: number | null;
  statusProdutor: StatusProdutor;
  empresa: string | null;
  contato: string | null;
  telefone: string | null;
  email: string | null;
  statusFinanceiro: StatusFinanceiro;
  dataPagamento: Date | null;
  valorPago: number | null;
  obsParcelas: string | null;
  bvAcordado: number | null;
  bvRecebido: boolean;
};

function parseItemRow(row: unknown[]): ItemRow | null {
  const servico = norm(row[0]);
  if (!servico) return null;

  // Descarta se todos os valores numéricos estão nulos e sem status/fornecedor
  const qtyCells = [
    row[2], row[3], row[4], row[5],
    row[6], row[7], row[8], row[9],
    row[10], row[11], row[12], row[13],
    row[21],
  ];
  const hasAnyValue =
    qtyCells.some((c) => toNum(c) !== null && toNum(c) !== 0) ||
    norm(row[14]) !== "" ||
    norm(row[15]) !== "" ||
    norm(row[19]) !== "";
  if (!hasAnyValue) {
    // Ainda considera se tem pelo menos um valor explícito (inclusive zero)
    if (!qtyCells.some((c) => c != null && c !== "")) return null;
  }

  return {
    servico,
    planejadoQtdItens: toInt(row[2]),
    planejadoQtdDias: toInt(row[3]),
    planejadoValorUnit: toNum(row[4]),
    planejadoValorTotal: toNum(row[5]),
    orcadoQtdItens: toInt(row[6]),
    orcadoQtdDias: toInt(row[7]),
    orcadoValorUnit: toNum(row[8]),
    orcadoValorTotal: toNum(row[9]),
    contratadoQtdItens: toInt(row[10]),
    contratadoQtdDias: toInt(row[11]),
    contratadoValorUnit: toNum(row[12]),
    contratadoValorTotal: toNum(row[13]),
    statusProdutor: parseStatusProdutor(row[14]),
    empresa: norm(row[15]) || null,
    contato: norm(row[16]) || null,
    telefone: norm(row[17]) || null,
    email: norm(row[18]) || null,
    statusFinanceiro: parseStatusFinanceiro(row[19]),
    dataPagamento: toDate(row[20]),
    valorPago: toNum(row[21]),
    obsParcelas: norm(row[22]) || null,
    bvAcordado: toNum(row[23]),
    bvRecebido: normLower(row[24]) === "sim" || row[24] === true,
  };
}

type RevenueRow = {
  type: RevenueType;
  descritivo: string;
  planejadoQtd: number | null;
  planejadoValorTotal: number | null;
  realizadoQtd: number | null;
  realizadoValorTotal: number | null;
};

function revenueTypeFromText(text: string): RevenueType | null {
  const s = text.toLowerCase();
  if (s.startsWith("inscrição") || s.startsWith("inscricao")) return "INSCRICAO";
  if (s.startsWith("patrocínio") || s.startsWith("patrocinio")) return "PATROCINIO";
  if (s.includes("outras receitas")) return "OUTRAS";
  return null;
}

// ─────────────────────────────────────────────
// Parser principal
// ─────────────────────────────────────────────

export type ParseResult = {
  eventName: string | null;
  cliente: string | null;
  local: string | null;
  publicoAlvo: string | null;
  produtorNome: string | null;
  categories: { name: string; order: number; items: ItemRow[] }[];
  revenues: RevenueRow[];
};

export function parsePlanilha(buffer: ArrayBuffer): ParseResult {
  const wb = XLSX.read(buffer, { type: "array", cellDates: true });
  const sheet = wb.Sheets["Controle de Evento"];
  if (!sheet) {
    throw new Error(
      'Aba "Controle de Evento" não encontrada — confirme que é uma planilha padrão Pmais.',
    );
  }

  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: null,
    raw: false,
    dateNF: "yyyy-mm-dd",
  });

  // Metadata de cabeçalho (linhas 4-6 no template)
  let eventName: string | null = null;
  let cliente: string | null = null;
  let local: string | null = null;
  let publicoAlvo: string | null = null;
  let produtorNome: string | null = null;

  for (let i = 0; i < Math.min(10, rows.length); i++) {
    const r = rows[i];
    for (let j = 0; j < r.length; j++) {
      const cell = norm(r[j]);
      const next = norm(r[j + 1]);
      if (!cell || !next) continue;
      const key = cell.replace(":", "").toLowerCase();
      if (key === "evento") eventName = next;
      else if (key === "cliente") cliente = next;
      else if (key === "local") local = next;
      else if (key === "público" || key === "publico") publicoAlvo = next;
      else if (key === "produtor") produtorNome = next;
    }
  }

  // Também tenta ler da aba Configurações, se existir
  const cfg = wb.Sheets["Configurações"] ?? wb.Sheets["Configuracoes"];
  if (cfg) {
    const cfgRows: unknown[][] = XLSX.utils.sheet_to_json(cfg, {
      header: 1,
      defval: null,
      raw: false,
    });
    for (const r of cfgRows) {
      const a = normLower(r[0]);
      const b = norm(r[1]);
      if (!a || !b) continue;
      if (a.includes("nome do evento") && !eventName) eventName = b;
      else if (a.includes("nome do produtor") && !produtorNome) produtorNome = b;
    }
  }

  // Varre expense blocks + receitas
  const categories: ParseResult["categories"] = [];
  const revenues: RevenueRow[] = [];
  let currentCategory: ParseResult["categories"][number] | null = null;
  let inRevenueBlock = false;
  let currentRevenueType: RevenueType | null = null;
  let order = 10;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const a = norm(row[0]);

    // Detecta início da seção de receitas (linha com "RECEITAS" ou emoji)
    if (!inRevenueBlock && a.toUpperCase().includes("RECEITAS") && a.length < 40) {
      inRevenueBlock = true;
      currentCategory = null;
      continue;
    }

    // Fim do bloco de receitas
    if (
      inRevenueBlock &&
      a.toUpperCase().includes("RESUMO FINANCEIRO")
    ) {
      break;
    }

    if (!inRevenueBlock) {
      // EXPENSE BLOCK
      const cat = isCategoryRow(row);
      if (cat) {
        currentCategory = { name: cat, order, items: [] };
        categories.push(currentCategory);
        order += 10;
        continue;
      }
      if (isTotalRow(row)) continue;
      if (!currentCategory) continue;

      const item = parseItemRow(row);
      if (item) currentCategory.items.push(item);
    } else {
      // REVENUE BLOCK
      // Col A pode ter o tipo ("Inscrição", "Patrocínio", "OUTRAS RECEITAS")
      const maybeType = a ? revenueTypeFromText(a) : null;
      if (maybeType) {
        currentRevenueType = maybeType;
        // A própria linha de tipo pode conter o primeiro item no col B
        const desc = norm(row[1]);
        if (desc) {
          revenues.push({
            type: maybeType,
            descritivo: desc,
            planejadoQtd: toInt(row[2]),
            planejadoValorTotal: toNum(row[5]),
            realizadoQtd: toInt(row[6]),
            realizadoValorTotal: toNum(row[9]),
          });
        }
        continue;
      }

      if (!currentRevenueType) continue;
      if (a.toUpperCase().startsWith("TOTAL")) continue;

      const desc = norm(row[1]);
      if (!desc) continue;

      revenues.push({
        type: currentRevenueType,
        descritivo: desc,
        planejadoQtd: toInt(row[2]),
        planejadoValorTotal: toNum(row[5]),
        realizadoQtd: toInt(row[6]),
        realizadoValorTotal: toNum(row[9]),
      });
    }
  }

  return {
    eventName,
    cliente,
    local,
    publicoAlvo,
    produtorNome,
    categories,
    revenues,
  };
}

// ─────────────────────────────────────────────
// Persistência
// ─────────────────────────────────────────────

export type ImportXlsxResult = {
  eventId: string;
  eventName: string;
  created: boolean;
  counts: {
    categories: number;
    items: number;
    suppliers: number;
    revenues: number;
  };
};

export async function importPlanilhaToEvent(
  parsed: ParseResult,
  overrides: { eventName?: string } = {},
): Promise<ImportXlsxResult> {
  const eventName =
    overrides.eventName?.trim() ||
    parsed.eventName?.trim() ||
    "Evento (sem nome)";

  // Upsert por nome
  const existing = await prisma.event.findFirst({
    where: { name: eventName },
  });

  const event = existing
    ? await prisma.event.update({
        where: { id: existing.id },
        data: {
          cliente: parsed.cliente,
          local: parsed.local,
          publicoAlvo: parsed.publicoAlvo,
          produtorNome: parsed.produtorNome,
        },
      })
    : await prisma.event.create({
        data: {
          name: eventName,
          cliente: parsed.cliente,
          local: parsed.local,
          publicoAlvo: parsed.publicoAlvo,
          produtorNome: parsed.produtorNome,
        },
      });

  // Zera estrutura financeira (tasks/checklists sobrevivem)
  await prisma.expenseCategory.deleteMany({ where: { eventId: event.id } });
  await prisma.revenueItem.deleteMany({ where: { eventId: event.id } });
  await prisma.supplier.deleteMany({ where: { eventId: event.id } });

  // Colhe todos os fornecedores únicos dos itens
  const supplierKey = (e: {
    empresa: string | null;
    email?: string | null;
    telefone?: string | null;
  }) => `${(e.empresa ?? "").toLowerCase()}|${(e.email ?? "").toLowerCase()}`;

  const supplierMap = new Map<string, string>(); // key → id
  for (const cat of parsed.categories) {
    for (const it of cat.items) {
      if (!it.empresa) continue;
      const k = supplierKey(it);
      if (supplierMap.has(k)) continue;
      const s = await prisma.supplier.create({
        data: {
          eventId: event.id,
          empresa: it.empresa,
          contato: it.contato,
          telefone: it.telefone,
          email: it.email,
        },
      });
      supplierMap.set(k, s.id);
    }
  }

  // Categorias + itens
  let itemCount = 0;
  for (const cat of parsed.categories) {
    const created = await prisma.expenseCategory.create({
      data: {
        eventId: event.id,
        name: cat.name,
        order: cat.order,
      },
    });
    for (const it of cat.items) {
      const sid = it.empresa ? supplierMap.get(supplierKey(it)) ?? null : null;
      await prisma.expenseItem.create({
        data: {
          categoryId: created.id,
          servico: it.servico,
          planejadoQtdItens: it.planejadoQtdItens,
          planejadoQtdDias: it.planejadoQtdDias,
          planejadoValorUnit: it.planejadoValorUnit,
          planejadoValorTotal: it.planejadoValorTotal,
          orcadoQtdItens: it.orcadoQtdItens,
          orcadoQtdDias: it.orcadoQtdDias,
          orcadoValorUnit: it.orcadoValorUnit,
          orcadoValorTotal: it.orcadoValorTotal,
          contratadoQtdItens: it.contratadoQtdItens,
          contratadoQtdDias: it.contratadoQtdDias,
          contratadoValorUnit: it.contratadoValorUnit,
          contratadoValorTotal: it.contratadoValorTotal,
          statusProdutor: it.statusProdutor,
          statusFinanceiro: it.statusFinanceiro,
          supplierId: sid,
          dataPagamento: it.dataPagamento,
          valorPago: it.valorPago,
          obsParcelas: it.obsParcelas,
          bvAcordado: it.bvAcordado,
          bvRecebido: it.bvRecebido,
        },
      });
      itemCount++;
    }
  }

  // Receitas
  for (const r of parsed.revenues) {
    await prisma.revenueItem.create({
      data: {
        eventId: event.id,
        type: r.type,
        descritivo: r.descritivo,
        planejadoQtd: r.planejadoQtd,
        planejadoValorTotal: r.planejadoValorTotal,
        realizadoQtd: r.realizadoQtd,
        realizadoValorTotal: r.realizadoValorTotal,
      },
    });
  }

  return {
    eventId: event.id,
    eventName: event.name,
    created: !existing,
    counts: {
      categories: parsed.categories.length,
      items: itemCount,
      suppliers: supplierMap.size,
      revenues: parsed.revenues.length,
    },
  };
}
