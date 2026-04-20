"use client";

import { useMemo, useState, useTransition } from "react";
import {
  CheckSquare,
  Clock,
  Link2,
  Plus,
  Trash2,
  Receipt,
} from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { dateBR } from "@/lib/format";
import {
  deleteTask,
  moveTask,
  saveTask,
  toggleChecklistItem,
} from "./actions";
import type {
  ChecklistDTO,
  ColumnDTO,
  ExpenseRef,
  TaskDTO,
} from "./types";

const COLUMN_ACCENTS = [
  "#2FB5AD",
  "#4C0DB3",
  "#3B82F6",
  "#F59E0B",
  "#EC4899",
  "#10B981",
];

const TRELLO_COLOR: Record<string, string> = {
  green: "#61bd4f",
  yellow: "#f2d600",
  orange: "#ff9f1a",
  red: "#eb5a46",
  purple: "#c377e0",
  blue: "#0079bf",
  sky: "#00c2e0",
  lime: "#51e898",
  pink: "#ff78cb",
  black: "#344563",
  gray: "#9aa6b2",
};

function labelBg(color: string | null | undefined): string {
  if (!color) return "var(--muted)";
  return TRELLO_COLOR[color] ?? "var(--muted)";
}

type DrawerState =
  | { mode: "closed" }
  | { mode: "edit"; task: TaskDTO }
  | { mode: "new"; listName: string };

export function KanbanBoard({
  eventId,
  initialColumns,
  expenseRefs,
}: {
  eventId: string;
  initialColumns: ColumnDTO[];
  expenseRefs: ExpenseRef[];
}) {
  const [columns] = useState(initialColumns);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [state, setState] = useState<DrawerState>({ mode: "closed" });
  const [pendingMove, startMove] = useTransition();

  const listNames = useMemo(
    () => columns.map((c) => c.listName),
    [columns],
  );

  function onDropToColumn(listName: string) {
    if (!draggingId) return;
    const taskId = draggingId;
    setDraggingId(null);
    setDragOverColumn(null);
    startMove(async () => {
      const r = await moveTask(taskId, listName);
      if (r.ok) toast.success(`Movido para "${listName}"`);
      else toast.error(r.error);
    });
  }

  return (
    <>
      <div className="flex-1 overflow-x-auto overflow-y-hidden px-8 py-6">
        <div className="flex items-start gap-4 h-full min-w-max pb-4">
          {columns.map((col) => (
            <Column
              key={col.listOrder + "::" + col.listName}
              column={col}
              draggingId={draggingId}
              isOver={dragOverColumn === col.listName}
              pending={pendingMove}
              onDragStart={(id) => setDraggingId(id)}
              onDragEnd={() => {
                setDraggingId(null);
                setDragOverColumn(null);
              }}
              onDragEnter={() => setDragOverColumn(col.listName)}
              onDropHere={() => onDropToColumn(col.listName)}
              onOpenCard={(task) => setState({ mode: "edit", task })}
              onAddCard={() =>
                setState({ mode: "new", listName: col.listName })
              }
            />
          ))}
        </div>
      </div>

      <Sheet
        open={state.mode !== "closed"}
        onOpenChange={(open) => {
          if (!open) setState({ mode: "closed" });
        }}
      >
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {state.mode !== "closed" && (
            <TaskForm
              key={state.mode === "edit" ? state.task.id : `new:${state.listName}`}
              eventId={eventId}
              state={state}
              listNames={listNames}
              expenseRefs={expenseRefs}
              onClose={() => setState({ mode: "closed" })}
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

function Column({
  column,
  draggingId,
  isOver,
  pending,
  onDragStart,
  onDragEnd,
  onDragEnter,
  onDropHere,
  onOpenCard,
  onAddCard,
}: {
  column: ColumnDTO;
  draggingId: string | null;
  isOver: boolean;
  pending: boolean;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onDragEnter: () => void;
  onDropHere: () => void;
  onOpenCard: (task: TaskDTO) => void;
  onAddCard: () => void;
}) {
  const accent = COLUMN_ACCENTS[column.listOrder % COLUMN_ACCENTS.length];
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
      }}
      onDragEnter={(e) => {
        e.preventDefault();
        onDragEnter();
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDropHere();
      }}
      className={
        "w-72 shrink-0 flex flex-col h-full rounded-xl bg-card/60 border transition-colors " +
        (isOver
          ? "border-primary ring-2 ring-primary/30"
          : "border-border")
      }
    >
      <header
        className="flex items-center justify-between px-3 py-2.5 border-b border-border"
        style={{ background: `${accent}0F` }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="h-2 w-2 rounded-full shrink-0"
            style={{ background: accent }}
          />
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-foreground truncate">
            {column.listName}
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <span
            className="text-[10px] font-semibold tabular-nums px-1.5 py-0.5 rounded"
            style={{ background: `${accent}22`, color: accent }}
          >
            {column.tasks.length}
          </span>
          <button
            type="button"
            onClick={onAddCard}
            title="Nova tarefa"
            className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground hover:bg-white/30 hover:text-foreground transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>
      <div
        className={
          "flex-1 overflow-y-auto space-y-2 px-2 py-2 " +
          (pending ? "opacity-60 pointer-events-none" : "")
        }
      >
        {column.tasks.map((t) => (
          <Card
            key={t.id}
            task={t}
            dragging={draggingId === t.id}
            onDragStart={() => onDragStart(t.id)}
            onDragEnd={onDragEnd}
            onOpen={() => onOpenCard(t)}
          />
        ))}
        {column.tasks.length === 0 && (
          <button
            type="button"
            onClick={onAddCard}
            className="w-full text-center text-[11px] text-muted-foreground py-6 rounded-md border border-dashed border-border hover:border-primary hover:text-primary transition-colors"
          >
            + adicionar tarefa
          </button>
        )}
      </div>
    </div>
  );
}

function Card({
  task,
  dragging,
  onDragStart,
  onDragEnd,
  onOpen,
}: {
  task: TaskDTO;
  dragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onOpen: () => void;
}) {
  const allDone = task.checklists.reduce(
    (s, c) => s + c.items.filter((i) => i.done).length,
    0,
  );
  const allTotal = task.checklists.reduce((s, c) => s + c.items.length, 0);

  return (
    <article
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", task.id);
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      onClick={onOpen}
      className={
        "rounded-md border border-border bg-card px-3 py-2.5 shadow-xs hover:border-primary/40 hover:shadow-sm transition-colors cursor-pointer select-none " +
        (dragging ? "opacity-40 ring-2 ring-primary" : "")
      }
    >
      {task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-1.5">
          {task.labels.map((label, idx) => (
            <span
              key={`${label.name}-${idx}`}
              title={label.name || label.color || ""}
              className="h-1.5 w-8 rounded-sm"
              style={{ background: labelBg(label.color) }}
            />
          ))}
        </div>
      )}
      <div className="text-[13px] font-medium leading-snug text-foreground">
        {task.title}
      </div>
      {(task.dueDate || allTotal > 0 || task.expenseItemLabel) && (
        <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground flex-wrap">
          {task.dueDate && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {dateBR(task.dueDate)}
            </span>
          )}
          {allTotal > 0 && (
            <span
              className={
                "flex items-center gap-1 " +
                (allDone === allTotal ? "text-[#166534]" : "")
              }
            >
              <CheckSquare className="h-3 w-3" />
              {allDone}/{allTotal}
            </span>
          )}
          {task.expenseItemLabel && (
            <span className="flex items-center gap-1 text-primary-deep">
              <Receipt className="h-3 w-3" />
              {task.expenseItemLabel}
            </span>
          )}
        </div>
      )}
    </article>
  );
}

function TaskForm({
  eventId,
  state,
  listNames,
  expenseRefs,
  onClose,
}: {
  eventId: string;
  state: Exclude<DrawerState, { mode: "closed" }>;
  listNames: string[];
  expenseRefs: ExpenseRef[];
  onClose: () => void;
}) {
  const editing = state.mode === "edit" ? state.task : null;
  const [pending, startTransition] = useTransition();
  const [deleting, startDelete] = useTransition();

  async function handleSubmit(formData: FormData) {
    if (editing) formData.set("id", editing.id);
    formData.set("eventId", eventId);
    startTransition(async () => {
      const r = await saveTask(formData);
      if (r.ok) {
        toast.success(editing ? "Tarefa atualizada." : "Tarefa criada.");
        onClose();
      } else {
        toast.error(r.error);
      }
    });
  }

  async function handleDelete() {
    if (!editing) return;
    if (!confirm(`Excluir "${editing.title}"?`)) return;
    startDelete(async () => {
      const r = await deleteTask(editing.id);
      if (r.ok) {
        toast.success("Tarefa excluída.");
        onClose();
      } else {
        toast.error(r.error);
      }
    });
  }

  const defaultListName =
    state.mode === "edit" ? state.task.listName : state.listName;

  return (
    <>
      <SheetHeader>
        <SheetTitle>{editing ? editing.title : "Nova tarefa"}</SheetTitle>
        <SheetDescription>
          Coluna: <span className="font-medium">{defaultListName}</span>
        </SheetDescription>
      </SheetHeader>

      <form action={handleSubmit} className="px-4 pb-4 space-y-5">
        <Field label="Título" required>
          <input
            name="title"
            defaultValue={editing?.title ?? ""}
            required
            autoFocus
            className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
          />
        </Field>

        <Field label="Descrição">
          <textarea
            name="description"
            rows={4}
            defaultValue={editing?.description ?? ""}
            className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
            placeholder="Anotações da tarefa"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Coluna">
            <select
              name="listName"
              defaultValue={defaultListName}
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
            >
              {listNames.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Prazo">
            <input
              type="date"
              name="dueDate"
              defaultValue={
                editing?.dueDate ? toDateInput(editing.dueDate) : ""
              }
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
            />
          </Field>
        </div>

        <Field label="Ligar a despesa (opcional)">
          <select
            name="expenseItemId"
            defaultValue={editing?.expenseItemId ?? "__none__"}
            className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
          >
            <option value="__none__">— Nenhuma —</option>
            {expenseRefs.map((e) => (
              <option key={e.id} value={e.id}>
                {e.categoryName} · {e.servico}
              </option>
            ))}
          </select>
        </Field>

        {editing && editing.checklists.length > 0 && (
          <div className="space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Checklists
            </div>
            {editing.checklists.map((cl) => (
              <ChecklistView key={cl.id} checklist={cl} />
            ))}
          </div>
        )}

        {editing?.expenseItemLabel && (
          <div className="rounded-md border border-primary/20 bg-primary-soft/40 px-3 py-2 text-xs flex items-center gap-2">
            <Link2 className="h-3.5 w-3.5 text-primary-deep" />
            <span className="text-primary-deep font-medium">
              Atualmente ligada a:
            </span>
            <span className="text-foreground">{editing.expenseItemLabel}</span>
          </div>
        )}

        <SheetFooter className="flex-row gap-2">
          {editing && (
            <Button
              type="button"
              variant="outline"
              onClick={handleDelete}
              disabled={pending || deleting}
              className="mr-auto text-destructive hover:bg-destructive-soft"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Excluir
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={pending || deleting}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={pending || deleting}>
            {pending ? "Salvando…" : editing ? "Salvar" : "Criar tarefa"}
          </Button>
        </SheetFooter>
      </form>
    </>
  );
}

function ChecklistView({ checklist }: { checklist: ChecklistDTO }) {
  const [items, setItems] = useState(checklist.items);
  const [pending, start] = useTransition();

  const done = items.filter((i) => i.done).length;
  const total = items.length;

  async function toggle(id: string, next: boolean) {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, done: next } : i)),
    );
    start(async () => {
      const r = await toggleChecklistItem(id, next);
      if (!r.ok) {
        toast.error(r.error);
        // revert
        setItems((prev) =>
          prev.map((i) => (i.id === id ? { ...i, done: !next } : i)),
        );
      }
    });
  }

  return (
    <div className="rounded-md border border-border bg-muted/30 px-3 py-2.5">
      <div className="flex items-center justify-between text-xs font-medium mb-2">
        <span>{checklist.name}</span>
        <span className="text-muted-foreground tabular-nums">
          {done}/{total}
        </span>
      </div>
      <ul className="space-y-1.5">
        {items.map((it) => (
          <li key={it.id} className="flex items-start gap-2 text-[13px]">
            <input
              type="checkbox"
              checked={it.done}
              disabled={pending}
              onChange={(e) => toggle(it.id, e.target.checked)}
              className="mt-[3px] accent-primary"
            />
            <span className={it.done ? "line-through text-muted-foreground" : ""}>
              {it.text}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm">
      <div className="text-xs text-muted-foreground mb-1">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </div>
      {children}
    </label>
  );
}

function toDateInput(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
