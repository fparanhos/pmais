import "server-only";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const ACTIVE_EVENT_COOKIE = "pmais_active_event_id";

export type StatusProdutor =
  | "APROVADO"
  | "AGUARDANDO_APROVACAO"
  | "NEGOCIACAO"
  | "EM_COTACAO";

export type StatusFinanceiro =
  | "SOLICITADO"
  | "RECEBIDO"
  | "ENVIADO_LANCADO"
  | "PAGO"
  | "AGUARDANDO_APROVACAO";

export type RevenueType = "INSCRICAO" | "PATROCINIO" | "OUTRAS";

/**
 * Retorna o evento ativo. Prioridade:
 *   1. Cookie `pmais_active_event_id` (definido pelo EventPicker)
 *   2. Fallback: evento mais recente do banco
 *   3. null se não existe nenhum
 */
export async function getActiveEvent() {
  const store = await cookies();
  const selected = store.get(ACTIVE_EVENT_COOKIE)?.value;
  if (selected) {
    const ev = await prisma.event.findUnique({ where: { id: selected } });
    if (ev) return ev;
  }
  return prisma.event.findFirst({ orderBy: { createdAt: "desc" } });
}

/**
 * Lista resumida de eventos para o seletor.
 */
export async function listEvents() {
  return prisma.event.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      cliente: true,
      startDate: true,
      endDate: true,
    },
  });
}

export async function getEventSummary(eventId: string) {
  const [expenses, revenues] = await Promise.all([
    prisma.expenseItem.aggregate({
      where: { category: { eventId } },
      _sum: {
        planejadoValorTotal: true,
        orcadoValorTotal: true,
        contratadoValorTotal: true,
        valorPago: true,
      },
      _count: { _all: true },
    }),
    prisma.revenueItem.aggregate({
      where: { eventId },
      _sum: {
        planejadoValorTotal: true,
        realizadoValorTotal: true,
      },
      _count: { _all: true },
    }),
  ]);

  const despesaPlanejada = expenses._sum.planejadoValorTotal ?? 0;
  const despesaOrcada = expenses._sum.orcadoValorTotal ?? 0;
  const despesaContratada = expenses._sum.contratadoValorTotal ?? 0;
  const despesaPaga = expenses._sum.valorPago ?? 0;
  const receitaPlanejada = revenues._sum.planejadoValorTotal ?? 0;
  const receitaRealizada = revenues._sum.realizadoValorTotal ?? 0;

  return {
    totalItens: expenses._count._all,
    totalReceitas: revenues._count._all,
    despesaPlanejada,
    despesaOrcada,
    despesaContratada,
    despesaPaga,
    receitaPlanejada,
    receitaRealizada,
    saldoPlanejado: receitaPlanejada - despesaPlanejada,
    saldoRealizado: receitaRealizada - despesaContratada,
  };
}

export async function getExpensesByCategory(eventId: string) {
  const categories = await prisma.expenseCategory.findMany({
    where: { eventId },
    orderBy: { order: "asc" },
    include: {
      items: {
        select: {
          planejadoValorTotal: true,
          orcadoValorTotal: true,
          contratadoValorTotal: true,
          valorPago: true,
        },
      },
    },
  });

  return categories.map((cat) => {
    const planejado = cat.items.reduce(
      (s, i) => s + (i.planejadoValorTotal ?? 0),
      0,
    );
    const orcado = cat.items.reduce(
      (s, i) => s + (i.orcadoValorTotal ?? 0),
      0,
    );
    const contratado = cat.items.reduce(
      (s, i) => s + (i.contratadoValorTotal ?? 0),
      0,
    );
    const pago = cat.items.reduce((s, i) => s + (i.valorPago ?? 0), 0);
    return {
      id: cat.id,
      name: cat.name,
      order: cat.order,
      itens: cat.items.length,
      planejado,
      orcado,
      contratado,
      pago,
    };
  });
}

export async function getRevenuesByType(eventId: string) {
  const rows = await prisma.revenueItem.groupBy({
    by: ["type"],
    where: { eventId },
    _sum: {
      planejadoValorTotal: true,
      realizadoValorTotal: true,
    },
    _count: { _all: true },
  });

  return rows.map((r) => ({
    type: r.type as RevenueType,
    count: r._count._all,
    planejado: r._sum.planejadoValorTotal ?? 0,
    realizado: r._sum.realizadoValorTotal ?? 0,
  }));
}

export async function getProducerPipeline(eventId: string) {
  const rows = await prisma.expenseItem.groupBy({
    by: ["statusProdutor"],
    where: { category: { eventId } },
    _count: { _all: true },
    _sum: {
      contratadoValorTotal: true,
      planejadoValorTotal: true,
    },
  });

  return rows.map((r) => ({
    status: r.statusProdutor as StatusProdutor,
    count: r._count._all,
    contratado: r._sum.contratadoValorTotal ?? 0,
    planejado: r._sum.planejadoValorTotal ?? 0,
  }));
}

export async function getFinancialPipeline(eventId: string) {
  const rows = await prisma.expenseItem.groupBy({
    by: ["statusFinanceiro"],
    where: { category: { eventId } },
    _count: { _all: true },
    _sum: {
      contratadoValorTotal: true,
      valorPago: true,
    },
  });

  return rows.map((r) => ({
    status: r.statusFinanceiro as StatusFinanceiro,
    count: r._count._all,
    contratado: r._sum.contratadoValorTotal ?? 0,
    pago: r._sum.valorPago ?? 0,
  }));
}

export async function getRevenueItems(eventId: string) {
  return prisma.revenueItem.findMany({
    where: { eventId },
    orderBy: [{ type: "asc" }, { id: "asc" }],
  });
}

export async function getAllExpenseItems(eventId: string) {
  return prisma.expenseItem.findMany({
    where: { category: { eventId } },
    orderBy: [{ category: { order: "asc" } }, { servico: "asc" }],
    select: {
      id: true,
      servico: true,
      category: { select: { name: true } },
    },
  });
}

export async function getSuppliers(eventId: string) {
  return prisma.supplier.findMany({
    where: { eventId },
    orderBy: { empresa: "asc" },
  });
}

export type TaskLabel = { name: string; color: string | null };

export async function getTasksGrouped(eventId: string) {
  const tasks = await prisma.task.findMany({
    where: { eventId, closed: false },
    orderBy: [{ listOrder: "asc" }, { position: "asc" }],
    include: {
      checklists: {
        orderBy: { position: "asc" },
        include: {
          items: { orderBy: { position: "asc" } },
        },
      },
    },
  });

  // Group by listName in order of first occurrence (listOrder is already sorted)
  type Col = {
    listOrder: number;
    listName: string;
    tasks: typeof tasks;
  };
  const columns = new Map<string, Col>();
  for (const t of tasks) {
    const key = `${t.listOrder}::${t.listName}`;
    const col = columns.get(key);
    if (col) {
      col.tasks.push(t);
    } else {
      columns.set(key, {
        listOrder: t.listOrder,
        listName: t.listName,
        tasks: [t],
      });
    }
  }
  return Array.from(columns.values()).sort((a, b) => a.listOrder - b.listOrder);
}

export async function getExpenseItemsByCategory(eventId: string) {
  const categories = await prisma.expenseCategory.findMany({
    where: { eventId },
    orderBy: { order: "asc" },
    include: {
      items: {
        include: { supplier: true },
        orderBy: { id: "asc" },
      },
    },
  });
  return categories;
}
