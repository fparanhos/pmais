import { PageHeader, EmptyState } from "@/components/page-header";
import { brl, brlCompact, dateBR, pctNumber } from "@/lib/format";
import {
  StatusProdutorBadge,
  StatusFinanceiroBadge,
} from "@/components/status-badge";
import { Bar } from "@/components/bar";
import {
  getActiveEvent,
  getExpenseItemsByCategory,
  type StatusProdutor,
  type StatusFinanceiro,
} from "@/lib/queries";

export default async function DespesasPage() {
  const event = await getActiveEvent();
  if (!event) {
    return (
      <>
        <PageHeader title="Despesas" />
        <EmptyState
          title="Nenhum evento cadastrado"
          description="Rode o seed demo para carregar o Radar 2026."
        />
      </>
    );
  }

  const categories = await getExpenseItemsByCategory(event.id);

  const globalTotals = categories.reduce(
    (acc, cat) => {
      for (const it of cat.items) {
        acc.planejado += it.planejadoValorTotal ?? 0;
        acc.contratado += it.contratadoValorTotal ?? 0;
        acc.pago += it.valorPago ?? 0;
      }
      return acc;
    },
    { planejado: 0, contratado: 0, pago: 0 },
  );

  return (
    <>
      <PageHeader
        title="Despesas"
        subtitle={`${event.name} · ${categories.length} categorias · ${categories.reduce((s, c) => s + c.items.length, 0)} itens`}
      >
        <div className="hidden md:flex items-center gap-6 text-xs">
          <Stat label="Planejado" value={brl(globalTotals.planejado)} />
          <Stat label="Contratado" value={brl(globalTotals.contratado)} tone="primary" />
          <Stat label="Pago" value={brl(globalTotals.pago)} tone="success" />
        </div>
      </PageHeader>

      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
        {categories.map((cat) => {
          const planejado = cat.items.reduce(
            (s, i) => s + (i.planejadoValorTotal ?? 0),
            0,
          );
          const contratado = cat.items.reduce(
            (s, i) => s + (i.contratadoValorTotal ?? 0),
            0,
          );
          const pago = cat.items.reduce((s, i) => s + (i.valorPago ?? 0), 0);
          const pctContrat = pctNumber(contratado, planejado);

          return (
            <section
              key={cat.id}
              className="rounded-xl border border-border bg-card"
            >
              <header className="flex items-start justify-between gap-4 px-5 py-4 border-b border-border">
                <div>
                  <h2 className="text-sm font-semibold tracking-tight">
                    {cat.name}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {cat.items.length} {cat.items.length === 1 ? "item" : "itens"}
                  </p>
                </div>
                <div className="flex items-center gap-5 text-xs">
                  <MiniStat label="Planejado" value={brlCompact(planejado)} />
                  <MiniStat label="Contratado" value={brlCompact(contratado)} />
                  <MiniStat label="Pago" value={brlCompact(pago)} tone="success" />
                  <div className="w-28">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground uppercase tracking-wide">
                      <span>Contratado</span>
                      <span className="tabular-nums">{pctContrat}%</span>
                    </div>
                    <div className="mt-0.5">
                      <Bar value={pctContrat} />
                    </div>
                  </div>
                </div>
              </header>
              <ul className="divide-y divide-border">
                {cat.items.map((it) => (
                  <li
                    key={it.id}
                    className="grid grid-cols-1 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] gap-3 px-5 py-3 hover:bg-muted/40"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{it.servico}</div>
                      {it.descritivo && (
                        <div className="text-[11px] text-muted-foreground truncate">
                          {it.descritivo}
                        </div>
                      )}
                      {it.supplier && (
                        <div className="mt-1 text-[11px] text-muted-foreground truncate">
                          <span className="text-foreground/60">Fornecedor:</span>{" "}
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
                      <StatusProdutorBadge status={it.statusProdutor as StatusProdutor} />
                      <StatusFinanceiroBadge status={it.statusFinanceiro as StatusFinanceiro} />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </>
  );
}

function Stat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "primary" | "success";
}) {
  const valColor =
    tone === "primary"
      ? "text-primary"
      : tone === "success"
        ? "text-[#166534]"
        : "text-foreground";
  return (
    <div className="flex flex-col items-end">
      <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className={`text-sm font-semibold tabular-nums ${valColor}`}>
        {value}
      </span>
    </div>
  );
}

function MiniStat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "success";
}) {
  const valColor = tone === "success" ? "text-[#166534]" : "text-foreground";
  return (
    <div className="flex flex-col items-end">
      <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
        {label}
      </span>
      <span className={`text-sm font-semibold tabular-nums ${valColor}`}>
        {value}
      </span>
    </div>
  );
}
