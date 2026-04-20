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
import {
  StatusProdutorBadge,
  StatusFinanceiroBadge,
  PRODUTOR_LABELS,
  FINANCEIRO_LABELS,
} from "@/components/status-badge";
import { FinancialBar } from "@/components/financial-bar";
import { brl, dateBR } from "@/lib/format";
import type { StatusFinanceiro, StatusProdutor } from "@/lib/queries";
import { sectionColor } from "@/lib/palette";
import { saveExpenseItem, deleteExpenseItem } from "./actions";
import { NewSupplierDialog } from "./new-supplier-dialog";
import type { CategoryDTO, ExpenseItemDTO, SupplierDTO } from "./types";

type DrawerState =
  | { mode: "closed" }
  | {
      mode: "edit";
      item: ExpenseItemDTO;
      categoryId: string;
      categoryName: string;
    }
  | { mode: "new"; categoryId: string; categoryName: string };

export function DespesasList({
  eventId,
  categories,
  suppliers: initialSuppliers,
}: {
  eventId: string;
  categories: CategoryDTO[];
  suppliers: SupplierDTO[];
}) {
  const [state, setState] = useState<DrawerState>({ mode: "closed" });
  const [suppliers, setSuppliers] = useState<SupplierDTO[]>(initialSuppliers);

  const globalTotals = useMemo(
    () =>
      categories.reduce(
        (acc, cat) => {
          for (const it of cat.items) {
            acc.planejado += it.planejadoValorTotal ?? 0;
            acc.contratado += it.contratadoValorTotal ?? 0;
            acc.pago += it.valorPago ?? 0;
          }
          return acc;
        },
        { planejado: 0, contratado: 0, pago: 0 },
      ),
    [categories],
  );

  return (
    <>
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
        <section className="rounded-xl border border-border bg-card chart-surface px-6 py-4">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
            Consolidado · Despesas
          </div>
          <FinancialBar
            planejado={globalTotals.planejado}
            contratado={globalTotals.contratado}
            pago={globalTotals.pago}
            size="lg"
            legendPosition="bottom"
          />
        </section>

        {categories.map((cat, idx) => {
          const planejado = cat.items.reduce(
            (s, i) => s + (i.planejadoValorTotal ?? 0),
            0,
          );
          const contratado = cat.items.reduce(
            (s, i) => s + (i.contratadoValorTotal ?? 0),
            0,
          );
          const pago = cat.items.reduce((s, i) => s + (i.valorPago ?? 0), 0);
          const color = sectionColor(idx);

          return (
            <section
              key={cat.id}
              className="relative rounded-xl border border-border bg-card overflow-hidden"
            >
              <span
                className="absolute left-0 top-0 bottom-0 w-1"
                style={{ background: color.solid }}
              />
              <header className="pl-6 pr-5 py-4 border-b border-border space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span
                      className="h-7 w-7 rounded-lg flex items-center justify-center text-[11px] font-bold tabular-nums"
                      style={{
                        background: color.soft,
                        color: color.solid,
                      }}
                    >
                      {idx + 1}
                    </span>
                    <div>
                      <h2 className="text-sm font-semibold tracking-tight">
                        {cat.name}
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        {cat.items.length}{" "}
                        {cat.items.length === 1 ? "item" : "itens"}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setState({
                        mode: "new",
                        categoryId: cat.id,
                        categoryName: cat.name,
                      })
                    }
                  >
                    <Plus className="h-3.5 w-3.5" /> Item
                  </Button>
                </div>
                <FinancialBar
                  planejado={planejado}
                  contratado={contratado}
                  pago={pago}
                  size="md"
                  legendPosition="bottom"
                />
              </header>

              <ul className="divide-y divide-border">
                {cat.items.length === 0 && (
                  <li className="pl-6 pr-5 py-6 text-center text-xs text-muted-foreground">
                    Nenhum item. Use{" "}
                    <span className="font-medium">+ Item</span> para adicionar.
                  </li>
                )}
                {cat.items.map((it) => (
                  <li
                    key={it.id}
                    onClick={() =>
                      setState({
                        mode: "edit",
                        item: it,
                        categoryId: cat.id,
                        categoryName: cat.name,
                      })
                    }
                    className="grid grid-cols-1 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] gap-3 pl-6 pr-5 py-3 hover:bg-muted/40 cursor-pointer transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">
                        {it.servico}
                      </div>
                      {it.descritivo && (
                        <div className="text-[11px] text-muted-foreground truncate">
                          {it.descritivo}
                        </div>
                      )}
                      {it.supplier && (
                        <div className="mt-1 text-[11px] text-muted-foreground truncate">
                          <span className="text-foreground/60">
                            Fornecedor:
                          </span>{" "}
                          {it.supplier.empresa}
                        </div>
                      )}
                    </div>
                    <div className="text-xs tabular-nums text-muted-foreground space-y-0.5">
                      <div>
                        Planejado:{" "}
                        <span className="text-foreground">
                          {it.planejadoValorTotal != null
                            ? brl(it.planejadoValorTotal)
                            : "—"}
                        </span>
                      </div>
                      <div>
                        Contratado:{" "}
                        <span className="text-foreground font-medium">
                          {it.contratadoValorTotal != null
                            ? brl(it.contratadoValorTotal)
                            : "—"}
                        </span>
                      </div>
                      {it.valorPago != null && (
                        <div>
                          Pago:{" "}
                          <span className="text-[#166534] font-medium">
                            {brl(it.valorPago)}
                          </span>
                          {it.dataPagamento && (
                            <span className="text-[11px] text-muted-foreground">
                              {" "}
                              · {dateBR(it.dataPagamento)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex md:flex-col md:items-end gap-1.5">
                      <StatusProdutorBadge status={it.statusProdutor} />
                      <StatusFinanceiroBadge status={it.statusFinanceiro} />
                    </div>
                  </li>
                ))}
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
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {state.mode !== "closed" && (
            <ExpenseForm
              key={state.mode === "edit" ? state.item.id : `new:${state.categoryId}`}
              eventId={eventId}
              state={state}
              suppliers={suppliers}
              onClose={() => setState({ mode: "closed" })}
              onSupplierCreated={(s) => setSuppliers((prev) => [...prev, s])}
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

function ExpenseForm({
  eventId,
  state,
  suppliers,
  onClose,
  onSupplierCreated,
}: {
  eventId: string;
  state: Exclude<DrawerState, { mode: "closed" }>;
  suppliers: SupplierDTO[];
  onClose: () => void;
  onSupplierCreated: (s: SupplierDTO) => void;
}) {
  const editing = state.mode === "edit" ? state.item : null;
  const [pending, startTransition] = useTransition();
  const [deleting, startDelete] = useTransition();
  const [selectedSupplier, setSelectedSupplier] = useState<string>(
    editing?.supplierId ?? "__none__",
  );
  const [newSupplierOpen, setNewSupplierOpen] = useState(false);

  async function handleSubmit(formData: FormData) {
    if (editing) formData.set("id", editing.id);
    formData.set("categoryId", state.categoryId);
    formData.set("supplierId", selectedSupplier);
    startTransition(async () => {
      const r = await saveExpenseItem(formData);
      if (r.ok) {
        toast.success(editing ? "Item atualizado." : "Item criado.");
        onClose();
      } else {
        toast.error(r.error);
      }
    });
  }

  async function handleDelete() {
    if (!editing) return;
    if (!confirm(`Excluir "${editing.servico}"?`)) return;
    startDelete(async () => {
      const r = await deleteExpenseItem(editing.id);
      if (r.ok) {
        toast.success("Item excluído.");
        onClose();
      } else {
        toast.error(r.error);
      }
    });
  }

  return (
    <>
      <SheetHeader>
        <SheetTitle>{editing ? editing.servico : "Novo item"}</SheetTitle>
        <SheetDescription>
          Categoria: <span className="font-medium">{state.categoryName}</span>
        </SheetDescription>
      </SheetHeader>

      <form action={handleSubmit} className="px-4 pb-4 space-y-5">
        <Section title="Identificação">
          <Field label="Serviço" required>
            <input
              name="servico"
              defaultValue={editing?.servico ?? ""}
              required
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Descritivo">
            <input
              name="descritivo"
              defaultValue={editing?.descritivo ?? ""}
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
              placeholder="Opcional — observação interna"
            />
          </Field>
        </Section>

        <ValorBlock
          title="Planejado"
          prefix="planejado"
          item={editing}
        />
        <ValorBlock title="Orçado" prefix="orcado" item={editing} />
        <ValorBlock title="Contratado" prefix="contratado" item={editing} />

        <Section title="Status">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Produtor">
              <SelectEnum
                name="statusProdutor"
                defaultValue={editing?.statusProdutor ?? "EM_COTACAO"}
                options={Object.entries(PRODUTOR_LABELS) as [StatusProdutor, string][]}
              />
            </Field>
            <Field label="Financeiro">
              <SelectEnum
                name="statusFinanceiro"
                defaultValue={editing?.statusFinanceiro ?? "AGUARDANDO_APROVACAO"}
                options={Object.entries(FINANCEIRO_LABELS) as [StatusFinanceiro, string][]}
              />
            </Field>
          </div>
        </Section>

        <Section title="Fornecedor">
          <div className="flex items-end gap-2">
            <Field label="Empresa" className="flex-1">
              <select
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
              >
                <option value="__none__">— Sem fornecedor —</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.empresa}
                  </option>
                ))}
              </select>
            </Field>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setNewSupplierOpen(true)}
            >
              <Plus className="h-3.5 w-3.5" /> Novo
            </Button>
          </div>
        </Section>

        <Section title="Pagamento">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Data pagamento">
              <input
                type="date"
                name="dataPagamento"
                defaultValue={
                  editing?.dataPagamento
                    ? toDateInput(editing.dataPagamento)
                    : ""
                }
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
              />
            </Field>
            <Field label="Valor pago (R$)">
              <input
                name="valorPago"
                inputMode="decimal"
                defaultValue={editing?.valorPago ?? ""}
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
                placeholder="Ex: 12500,00"
              />
            </Field>
          </div>
          <Field label="Obs. parcelas / notas">
            <textarea
              name="obsParcelas"
              rows={2}
              defaultValue={editing?.obsParcelas ?? ""}
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
              placeholder="Ex: 50% na assinatura, 50% no go-live"
            />
          </Field>
        </Section>

        <Section title="BV (comissão)">
          <div className="grid grid-cols-2 gap-3 items-end">
            <Field label="BV acordado (R$)">
              <input
                name="bvAcordado"
                inputMode="decimal"
                defaultValue={editing?.bvAcordado ?? ""}
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
              />
            </Field>
            <label className="flex items-center gap-2 text-sm h-10 px-3 rounded-md border border-border bg-card">
              <input
                type="checkbox"
                name="bvRecebido"
                defaultChecked={editing?.bvRecebido ?? false}
                className="accent-primary"
              />
              BV recebido
            </label>
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
            {pending ? "Salvando…" : editing ? "Salvar" : "Criar item"}
          </Button>
        </SheetFooter>
      </form>

      <NewSupplierDialog
        eventId={eventId}
        open={newSupplierOpen}
        onOpenChange={setNewSupplierOpen}
        onCreated={(s) => {
          onSupplierCreated(s);
          setSelectedSupplier(s.id);
        }}
      />
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
  className = "",
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block text-sm ${className}`}>
      <div className="text-xs text-muted-foreground mb-1">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </div>
      {children}
    </label>
  );
}

function SelectEnum<T extends string>({
  name,
  defaultValue,
  options,
}: {
  name: string;
  defaultValue: T;
  options: [T, string][];
}) {
  return (
    <select
      name={name}
      defaultValue={defaultValue}
      className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
    >
      {options.map(([v, label]) => (
        <option key={v} value={v}>
          {label}
        </option>
      ))}
    </select>
  );
}

function ValorBlock({
  title,
  prefix,
  item,
}: {
  title: string;
  prefix: "planejado" | "orcado" | "contratado";
  item: ExpenseItemDTO | null;
}) {
  const qtd = prefix === "planejado" ? item?.planejadoQtdItens : prefix === "orcado" ? item?.orcadoQtdItens : item?.contratadoQtdItens;
  const dias = prefix === "planejado" ? item?.planejadoQtdDias : prefix === "orcado" ? item?.orcadoQtdDias : item?.contratadoQtdDias;
  const unit = prefix === "planejado" ? item?.planejadoValorUnit : prefix === "orcado" ? item?.orcadoValorUnit : item?.contratadoValorUnit;

  return (
    <Section title={title}>
      <div className="grid grid-cols-3 gap-2">
        <Field label="Qtd itens">
          <input
            type="number"
            step="1"
            name={`${prefix}QtdItens`}
            defaultValue={qtd ?? ""}
            className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm tabular-nums"
          />
        </Field>
        <Field label="Qtd dias">
          <input
            type="number"
            step="1"
            name={`${prefix}QtdDias`}
            defaultValue={dias ?? ""}
            className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm tabular-nums"
          />
        </Field>
        <Field label="Valor unitário (R$)">
          <input
            name={`${prefix}ValorUnit`}
            inputMode="decimal"
            defaultValue={unit ?? ""}
            className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm tabular-nums"
            placeholder="0,00"
          />
        </Field>
      </div>
    </Section>
  );
}

function toDateInput(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

