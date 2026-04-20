"use client";

import { useMemo, useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
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
import { Bar } from "@/components/bar";
import { RevenueBar } from "@/components/financial-bar";
import { brl, pctNumber } from "@/lib/format";
import type { RevenueType } from "@/lib/queries";
import { sectionColor } from "@/lib/palette";
import { saveRevenueItem, deleteRevenueItem } from "./actions";
import type { RevenueItemDTO } from "./types";

const TYPE_COLOR_INDEX: Record<RevenueType, number> = {
  INSCRICAO: 0, // teal
  PATROCINIO: 1, // roxo
  OUTRAS: 3, // âmbar
};

const TYPE_LABEL: Record<RevenueType, string> = {
  INSCRICAO: "Inscrições",
  PATROCINIO: "Patrocínio",
  OUTRAS: "Outras receitas",
};

const TYPE_DESC: Record<RevenueType, string> = {
  INSCRICAO: "Cortesias, estudantes e sócios/não sócios",
  PATROCINIO: "Cotas de patrocínio e ativações",
  OUTRAS: "Credencial de expositor, jantar e outros",
};

const TYPE_ORDER: RevenueType[] = ["INSCRICAO", "PATROCINIO", "OUTRAS"];

type DrawerState =
  | { mode: "closed" }
  | { mode: "edit"; item: RevenueItemDTO }
  | { mode: "new"; type: RevenueType };

export function ReceitasList({
  eventId,
  items,
}: {
  eventId: string;
  items: RevenueItemDTO[];
}) {
  const [state, setState] = useState<DrawerState>({ mode: "closed" });

  const grouped = useMemo(() => {
    const byType = new Map<RevenueType, RevenueItemDTO[]>();
    for (const it of items) {
      const arr = byType.get(it.type) ?? [];
      arr.push(it);
      byType.set(it.type, arr);
    }
    return byType;
  }, [items]);

  const typeTotals = useMemo(() => {
    const totals = new Map<
      RevenueType,
      { planejado: number; realizado: number; count: number }
    >();
    for (const t of TYPE_ORDER) {
      totals.set(t, { planejado: 0, realizado: 0, count: 0 });
    }
    for (const it of items) {
      const t = totals.get(it.type)!;
      t.planejado += it.planejadoValorTotal ?? 0;
      t.realizado += it.realizadoValorTotal ?? 0;
      t.count += 1;
    }
    return totals;
  }, [items]);

  const totalPlanejado = items.reduce(
    (s, r) => s + (r.planejadoValorTotal ?? 0),
    0,
  );
  const totalRealizado = items.reduce(
    (s, r) => s + (r.realizadoValorTotal ?? 0),
    0,
  );

  return (
    <>
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
        <section className="rounded-xl border border-border bg-card chart-surface px-6 py-4">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
            Consolidado · Receitas
          </div>
          <RevenueBar
            planejado={totalPlanejado}
            realizado={totalRealizado}
            size="lg"
            legendPosition="bottom"
          />
        </section>

        {TYPE_ORDER.map((type) => {
          const rows = grouped.get(type) ?? [];
          const totals = typeTotals.get(type)!;

          const color = sectionColor(TYPE_COLOR_INDEX[type]);

          return (
            <section
              key={type}
              id={`type-${type}`}
              className="relative rounded-xl border border-border bg-card overflow-hidden scroll-mt-24 target:ring-2 target:ring-primary/60 target:ring-offset-2 target:ring-offset-background"
            >
              <span
                className="absolute left-0 top-0 bottom-0 w-1"
                style={{ background: color.solid }}
              />
              <header className="pl-6 pr-5 py-4 border-b border-border space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span
                      className="h-8 w-8 rounded-lg flex items-center justify-center"
                      style={{ background: color.soft }}
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ background: color.solid }}
                      />
                    </span>
                    <div>
                      <h2 className="text-sm font-semibold tracking-tight">
                        {TYPE_LABEL[type]}
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        {TYPE_DESC[type]}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setState({ mode: "new", type })}
                  >
                    <Plus className="h-3.5 w-3.5" /> Item
                  </Button>
                </div>
                <RevenueBar
                  planejado={totals.planejado}
                  realizado={totals.realizado}
                  size="md"
                  legendPosition="bottom"
                />
              </header>

              <ul className="divide-y divide-border">
                {rows.length === 0 && (
                  <li className="pl-6 pr-5 py-6 text-center text-xs text-muted-foreground">
                    Nenhuma linha. Use{" "}
                    <span className="font-medium">+ Item</span> para adicionar.
                  </li>
                )}
                {rows.map((r) => {
                  const planejado = r.planejadoValorTotal ?? 0;
                  const realizado = r.realizadoValorTotal ?? 0;
                  const pctRow = pctNumber(realizado, planejado);
                  return (
                    <li
                      key={r.id}
                      onClick={() => setState({ mode: "edit", item: r })}
                      className="grid grid-cols-1 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] gap-3 pl-6 pr-5 py-3 hover:bg-muted/40 cursor-pointer transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">
                          {r.descritivo}
                        </div>
                        <div className="text-[11px] text-muted-foreground tabular-nums">
                          Qtd planejada: {r.planejadoQtd ?? "—"} · realizada:{" "}
                          {r.realizadoQtd ?? "—"}
                        </div>
                      </div>
                      <div className="text-xs tabular-nums text-muted-foreground space-y-0.5">
                        <div>
                          Planejado:{" "}
                          <span className="text-foreground">
                            {brl(planejado)}
                          </span>
                        </div>
                        <div>
                          Realizado:{" "}
                          <span className="text-[#166534] font-medium">
                            {brl(realizado)}
                          </span>
                        </div>
                      </div>
                      <div className="min-w-[140px] flex flex-col items-end gap-1">
                        <span className="text-[11px] font-medium tabular-nums text-muted-foreground">
                          {pctRow}% realizado
                        </span>
                        <Bar value={pctRow} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>

      <Sheet
        open={state.mode !== "closed"}
        onOpenChange={(open) => {
          if (!open) setState({ mode: "closed" });
        }}
      >
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {state.mode !== "closed" && (
            <RevenueForm
              key={state.mode === "edit" ? state.item.id : `new:${state.type}`}
              eventId={eventId}
              state={state}
              onClose={() => setState({ mode: "closed" })}
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

function RevenueForm({
  eventId,
  state,
  onClose,
}: {
  eventId: string;
  state: Exclude<DrawerState, { mode: "closed" }>;
  onClose: () => void;
}) {
  const editing = state.mode === "edit" ? state.item : null;
  const defaultType = state.mode === "edit" ? state.item.type : state.type;
  const [pending, startTransition] = useTransition();
  const [deleting, startDelete] = useTransition();

  async function handleSubmit(formData: FormData) {
    if (editing) formData.set("id", editing.id);
    formData.set("eventId", eventId);
    startTransition(async () => {
      const r = await saveRevenueItem(formData);
      if (r.ok) {
        toast.success(editing ? "Receita atualizada." : "Receita criada.");
        onClose();
      } else {
        toast.error(r.error);
      }
    });
  }

  async function handleDelete() {
    if (!editing) return;
    if (!confirm(`Excluir "${editing.descritivo}"?`)) return;
    startDelete(async () => {
      const r = await deleteRevenueItem(editing.id);
      if (r.ok) {
        toast.success("Receita excluída.");
        onClose();
      } else {
        toast.error(r.error);
      }
    });
  }

  return (
    <>
      <SheetHeader>
        <SheetTitle>{editing ? editing.descritivo : "Nova receita"}</SheetTitle>
        <SheetDescription>
          Tipo:{" "}
          <span className="font-medium">{TYPE_LABEL[defaultType]}</span>
        </SheetDescription>
      </SheetHeader>

      <form action={handleSubmit} className="px-4 pb-4 space-y-5">
        <Section title="Identificação">
          <Field label="Descritivo" required>
            <input
              name="descritivo"
              defaultValue={editing?.descritivo ?? ""}
              required
              autoFocus
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
              placeholder="Ex: Patrocínio Platina, Inscrição Sócio, etc."
            />
          </Field>
          <Field label="Tipo">
            <select
              name="type"
              defaultValue={defaultType}
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
            >
              {TYPE_ORDER.map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABEL[t]}
                </option>
              ))}
            </select>
          </Field>
        </Section>

        <Section title="Planejado">
          <div className="grid grid-cols-2 gap-2">
            <Field label="Quantidade">
              <input
                type="number"
                step="1"
                name="planejadoQtd"
                defaultValue={editing?.planejadoQtd ?? ""}
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm tabular-nums"
              />
            </Field>
            <Field label="Valor total (R$)">
              <input
                name="planejadoValorTotal"
                inputMode="decimal"
                defaultValue={editing?.planejadoValorTotal ?? ""}
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm tabular-nums"
                placeholder="0,00"
              />
            </Field>
          </div>
        </Section>

        <Section title="Realizado">
          <div className="grid grid-cols-2 gap-2">
            <Field label="Quantidade">
              <input
                type="number"
                step="1"
                name="realizadoQtd"
                defaultValue={editing?.realizadoQtd ?? ""}
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm tabular-nums"
              />
            </Field>
            <Field label="Valor total (R$)">
              <input
                name="realizadoValorTotal"
                inputMode="decimal"
                defaultValue={editing?.realizadoValorTotal ?? ""}
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm tabular-nums"
                placeholder="0,00"
              />
            </Field>
          </div>
        </Section>

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
            {pending ? "Salvando…" : editing ? "Salvar" : "Criar receita"}
          </Button>
        </SheetFooter>
      </form>
    </>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
        {title}
      </div>
      {children}
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

