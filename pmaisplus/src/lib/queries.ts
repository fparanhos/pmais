import "server-only";
import { prisma } from "@/lib/prisma";

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

// The MVP works against a single demo event. When we add multi-event support
// we'll thread an eventId through these queries.
export async function getActiveEvent() {
  const event = await prisma.event.findFirst({
    orderBy: { createdAt: "desc" },
  });
  return event;
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
