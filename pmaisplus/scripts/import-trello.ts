import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "../src/generated/prisma/client";

// ─────────────────────────────────────────────────────────────
// Trello JSON importer
// Lê `data/sources/ffNz4TwO - radar-2025.json` e espelha no banco:
// lists → coluna (Task.listName), cards → Task, checklists → Checklist.
// Idempotente (upsert por trelloCardId / trelloId).
// ─────────────────────────────────────────────────────────────

type TrelloList = {
  id: string;
  name: string;
  closed: boolean;
  pos: number;
  idBoard: string;
};

type TrelloLabel = { id: string; name: string; color: string | null };

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

type TrelloBoard = {
  id: string;
  name: string;
  url: string;
  lists: TrelloList[];
  cards: TrelloCard[];
  checklists: TrelloChecklist[];
};

const SOURCE = path.resolve(
  process.cwd(),
  "data/sources/ffNz4TwO - radar-2025.json",
);

async function main() {
  if (!fs.existsSync(SOURCE)) {
    console.error(`✗ Trello JSON não encontrado em ${SOURCE}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(SOURCE, "utf8");
  const board = JSON.parse(raw) as TrelloBoard;

  const prisma = new PrismaClient();

  // Active event (more recent first). Bind board info to it.
  const event = await prisma.event.findFirst({
    orderBy: { createdAt: "desc" },
  });
  if (!event) {
    console.error("✗ Nenhum evento no banco. Rode `npm run db:seed:demo` antes.");
    await prisma.$disconnect();
    process.exit(1);
  }

  await prisma.event.update({
    where: { id: event.id },
    data: {
      trelloBoardId: board.id,
      trelloBoardUrl: board.url,
      trelloBoardName: board.name,
    },
  });
  console.log(`✓ Evento vinculado ao board Trello: ${board.name}`);

  // Lists: mapa de listId → { name, order }
  const activeLists = board.lists
    .filter((l) => !l.closed)
    .sort((a, b) => a.pos - b.pos);
  const listById = new Map<string, { name: string; order: number }>();
  activeLists.forEach((l, idx) => {
    listById.set(l.id, { name: l.name, order: idx });
  });
  console.log(`✓ Listas ativas: ${activeLists.length}`);

  // Cards → Task (upsert por trelloCardId)
  const activeCards = board.cards.filter((c) => !c.closed);
  let upsertedTasks = 0;
  const checklistMap = new Map<string, TrelloChecklist>();
  for (const cl of board.checklists) checklistMap.set(cl.id, cl);

  for (const card of activeCards) {
    const list = listById.get(card.idList);
    if (!list) continue; // card pertence a lista arquivada

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
    upsertedTasks++;

    // Checklists + itens
    for (const clId of card.idChecklists) {
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

      for (const ci of cl.checkItems) {
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

  const totalChecklists = await prisma.checklist.count({
    where: { task: { eventId: event.id } },
  });
  const totalItems = await prisma.checklistItem.count({
    where: { checklist: { task: { eventId: event.id } } },
  });

  console.log(
    `✓ Tasks: ${upsertedTasks} · Checklists: ${totalChecklists} · Itens: ${totalItems}`,
  );
  console.log("");
  console.log("── Colunas (listas Trello) ──");
  const countByList = await prisma.task.groupBy({
    by: ["listName", "listOrder"],
    where: { eventId: event.id },
    _count: { _all: true },
    orderBy: { listOrder: "asc" },
  });
  for (const c of countByList) {
    console.log(`  [${c.listOrder}] ${c.listName}: ${c._count._all} cards`);
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
