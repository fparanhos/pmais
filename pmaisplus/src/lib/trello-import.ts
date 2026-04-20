import "server-only";
import { prisma } from "@/lib/prisma";

// ─────────────────────────────────────────────────────────────
// Shared Trello importer — usado pelo script `scripts/import-trello.ts`
// e pela rota de upload em `/admin/importar`.
// Idempotente por trelloBoardId (evento) e trelloCardId (task).
// ─────────────────────────────────────────────────────────────

type TrelloLabel = { id: string; name: string; color: string | null };

type TrelloList = {
  id: string;
  name: string;
  closed: boolean;
  pos: number;
};

type TrelloCard = {
  id: string;
  name: string;
  desc: string | null;
  idList: string;
  closed: boolean;
  pos: number;
  due: string | null;
  labels: TrelloLabel[];
  idChecklists: string[];
};

type TrelloCheckItem = {
  id: string;
  name: string;
  state: "complete" | "incomplete";
  pos: number;
};

type TrelloChecklist = {
  id: string;
  name: string;
  idCard: string;
  pos: number;
  checkItems: TrelloCheckItem[];
};

export type TrelloBoard = {
  id: string;
  name: string;
  url: string;
  lists: TrelloList[];
  cards: TrelloCard[];
  checklists: TrelloChecklist[];
};

export type ImportResult = {
  eventId: string;
  eventName: string;
  created: boolean;
  counts: {
    columns: number;
    tasks: number;
    checklists: number;
    items: number;
  };
};

/**
 * Importa um board do Trello para um Event. Se já existe um Event com o
 * mesmo trelloBoardId, atualiza em vez de criar novo.
 *
 * @param board Objeto parseado do export JSON do Trello
 * @param overrides Opcional — { eventName } para sobrescrever o nome
 */
export async function importTrelloBoard(
  board: TrelloBoard,
  overrides: { eventName?: string } = {},
): Promise<ImportResult> {
  if (!board?.id || !Array.isArray(board.lists) || !Array.isArray(board.cards)) {
    throw new Error("JSON inválido — esperado um export completo de board do Trello.");
  }

  const eventName = overrides.eventName?.trim() || board.name || "Evento Trello";

  // Upsert do Event por trelloBoardId
  const existing = await prisma.event.findFirst({
    where: { trelloBoardId: board.id },
  });

  const event = existing
    ? await prisma.event.update({
        where: { id: existing.id },
        data: {
          name: eventName,
          trelloBoardId: board.id,
          trelloBoardUrl: board.url,
          trelloBoardName: board.name,
        },
      })
    : await prisma.event.create({
        data: {
          name: eventName,
          trelloBoardId: board.id,
          trelloBoardUrl: board.url,
          trelloBoardName: board.name,
        },
      });

  // Listas ativas (colunas) ordenadas
  const activeLists = board.lists
    .filter((l) => !l.closed)
    .sort((a, b) => a.pos - b.pos);
  const listById = new Map<string, { name: string; order: number }>();
  activeLists.forEach((l, idx) => {
    listById.set(l.id, { name: l.name, order: idx });
  });

  // Mapa checklist id → checklist (pra cruzar com cards)
  const checklistMap = new Map<string, TrelloChecklist>();
  for (const cl of board.checklists ?? []) checklistMap.set(cl.id, cl);

  // Cards → Task (upsert por trelloCardId)
  const activeCards = board.cards.filter((c) => !c.closed);
  let taskCount = 0;
  for (const card of activeCards) {
    const list = listById.get(card.idList);
    if (!list) continue;

    const labelsJson =
      card.labels.length > 0
        ? JSON.stringify(
            card.labels.map((l) => ({ name: l.name, color: l.color })),
          )
        : null;

    const task = await prisma.task.upsert({
      where: { trelloCardId: card.id },
      update: {
        eventId: event.id,
        title: card.name,
        description: card.desc,
        listName: list.name,
        listOrder: list.order,
        position: card.pos,
        labels: labelsJson,
        dueDate: card.due ? new Date(card.due) : null,
        closed: card.closed,
      },
      create: {
        eventId: event.id,
        trelloCardId: card.id,
        title: card.name,
        description: card.desc,
        listName: list.name,
        listOrder: list.order,
        position: card.pos,
        labels: labelsJson,
        dueDate: card.due ? new Date(card.due) : null,
        closed: card.closed,
      },
    });
    taskCount++;

    // Checklists + itens
    for (const clId of card.idChecklists ?? []) {
      const cl = checklistMap.get(clId);
      if (!cl) continue;

      const checklist = await prisma.checklist.upsert({
        where: { trelloId: cl.id },
        update: {
          taskId: task.id,
          name: cl.name,
          position: cl.pos,
        },
        create: {
          taskId: task.id,
          trelloId: cl.id,
          name: cl.name,
          position: cl.pos,
        },
      });

      for (const ci of cl.checkItems ?? []) {
        await prisma.checklistItem.upsert({
          where: { trelloId: ci.id },
          update: {
            checklistId: checklist.id,
            text: ci.name,
            done: ci.state === "complete",
            position: ci.pos,
          },
          create: {
            checklistId: checklist.id,
            trelloId: ci.id,
            text: ci.name,
            done: ci.state === "complete",
            position: ci.pos,
          },
        });
      }
    }
  }

  const [checklistCount, itemCount] = await Promise.all([
    prisma.checklist.count({ where: { task: { eventId: event.id } } }),
    prisma.checklistItem.count({
      where: { checklist: { task: { eventId: event.id } } },
    }),
  ]);

  return {
    eventId: event.id,
    eventName: event.name,
    created: !existing,
    counts: {
      columns: activeLists.length,
      tasks: taskCount,
      checklists: checklistCount,
      items: itemCount,
    },
  };
}
