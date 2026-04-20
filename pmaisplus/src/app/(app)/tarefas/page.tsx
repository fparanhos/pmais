import { ExternalLink } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/page-header";
import {
  getActiveEvent,
  getAllExpenseItems,
  getTasksGrouped,
} from "@/lib/queries";
import { KanbanBoard } from "./kanban-board";
import type { ColumnDTO, ExpenseRef, TaskDTO } from "./types";

export default async function TarefasPage() {
  const event = await getActiveEvent();
  if (!event) {
    return (
      <>
        <PageHeader title="Tarefas" />
        <EmptyState
          title="Nenhum evento cadastrado"
          description="Rode o seed demo para carregar o Radar 2026."
        />
      </>
    );
  }

  const [rawColumns, expenseItems] = await Promise.all([
    getTasksGrouped(event.id),
    getAllExpenseItems(event.id),
  ]);

  const expenseRefs: ExpenseRef[] = expenseItems.map((e) => ({
    id: e.id,
    servico: e.servico,
    categoryName: e.category.name,
  }));
  const expenseById = new Map(
    expenseRefs.map((e) => [e.id, `${e.categoryName} · ${e.servico}`]),
  );

  const columns: ColumnDTO[] = rawColumns.map((col) => ({
    listName: col.listName,
    listOrder: col.listOrder,
    tasks: col.tasks.map(
      (t): TaskDTO => ({
        id: t.id,
        title: t.title,
        description: t.description,
        listName: t.listName,
        listOrder: t.listOrder,
        position: t.position,
        labels: parseLabels(t.labels),
        dueDate: t.dueDate,
        expenseItemId: t.expenseItemId,
        expenseItemLabel: t.expenseItemId
          ? (expenseById.get(t.expenseItemId) ?? null)
          : null,
        checklists: t.checklists.map((cl) => ({
          id: cl.id,
          name: cl.name,
          items: cl.items.map((i) => ({
            id: i.id,
            text: i.text,
            done: i.done,
            position: i.position,
          })),
        })),
      }),
    ),
  }));

  const totalCards = columns.reduce((s, c) => s + c.tasks.length, 0);

  return (
    <>
      <PageHeader
        title="Tarefas"
        subtitle={`${event.name} · ${columns.length} colunas · ${totalCards} cards`}
      >
        {event.trelloBoardUrl && (
          <a
            href={event.trelloBoardUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Ver no Trello
          </a>
        )}
      </PageHeader>

      {columns.length === 0 ? (
        <EmptyState
          title="Nenhuma tarefa"
          description="Rode `npm run db:import:trello` para puxar o board Radar 2025."
        />
      ) : (
        <KanbanBoard
          eventId={event.id}
          initialColumns={columns}
          expenseRefs={expenseRefs}
        />
      )}
    </>
  );
}

function parseLabels(raw: string | null): { name: string; color: string | null }[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch {
    return [];
  }
}
