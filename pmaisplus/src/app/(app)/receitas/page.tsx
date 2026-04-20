import { PageHeader, EmptyState } from "@/components/page-header";
import { Bar } from "@/components/bar";
import { brl, pctNumber } from "@/lib/format";
import {
  getActiveEvent,
  getRevenueItems,
  getRevenuesByType,
  type RevenueType,
} from "@/lib/queries";

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

export default async function ReceitasPage() {
  const event = await getActiveEvent();
  if (!event) {
    return (
      <>
        <PageHeader title="Receitas" />
        <EmptyState
          title="Nenhum evento cadastrado"
          description="Rode o seed demo para carregar o Radar 2026."
        />
      </>
    );
  }

  const [byType, items] = await Promise.all([
    getRevenuesByType(event.id),
    getRevenueItems(event.id),
  ]);

  const groupedItems = new Map<RevenueType, typeof items>();
  for (const it of items) {
    const t = it.type as RevenueType;
    const arr = groupedItems.get(t) ?? [];
    arr.push(it);
    groupedItems.set(t, arr);
  }

  const totalPlanejado = byType.reduce((s, r) => s + r.planejado, 0);
  const totalRealizado = byType.reduce((s, r) => s + r.realizado, 0);

  return (
    <>
      <PageHeader
        title="Receitas"
        subtitle={`${event.name} · ${items.length} linhas de receita`}
      >
        <div className="hidden md:flex items-center gap-6 text-xs">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Planejado
            </span>
            <span className="text-sm font-semibold tabular-nums">
              {brl(totalPlanejado)}
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Realizado
            </span>
            <span className="text-sm font-semibold tabular-nums text-[#166534]">
              {brl(totalRealizado)}
            </span>
          </div>
        </div>
      </PageHeader>

      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
        {(Object.keys(TYPE_LABEL) as RevenueType[]).map((type) => {
          const typeTotals = byType.find((r) => r.type === type);
          const rows = groupedItems.get(type) ?? [];
          if (rows.length === 0) return null;

          const pct = pctNumber(
            typeTotals?.realizado ?? 0,
            typeTotals?.planejado ?? 0,
          );

          return (
            <section
              key={type}
              className="rounded-xl border border-border bg-card"
            >
              <header className="flex items-start justify-between gap-4 px-5 py-4 border-b border-border">
                <div>
                  <h2 className="text-sm font-semibold tracking-tight">
                    {TYPE_LABEL[type]}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {TYPE_DESC[type]}
                  </p>
                </div>
                <div className="flex items-center gap-5 text-xs">
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Planejado
                    </span>
                    <span className="text-sm font-semibold tabular-nums">
                      {brl(typeTotals?.planejado ?? 0)}
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Realizado
                    </span>
                    <span className="text-sm font-semibold tabular-nums text-[#166534]">
                      {brl(typeTotals?.realizado ?? 0)}
                    </span>
                  </div>
                  <div className="w-28">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground uppercase tracking-wide">
                      <span>Realizado</span>
                      <span className="tabular-nums">{pct}%</span>
                    </div>
                    <div className="mt-0.5">
                      <Bar value={pct} />
                    </div>
                  </div>
                </div>
              </header>

              <ul className="divide-y divide-border">
                {rows.map((r) => {
                  const planejado = r.planejadoValorTotal ?? 0;
                  const realizado = r.realizadoValorTotal ?? 0;
                  const pctRow = pctNumber(realizado, planejado);
                  return (
                    <li
                      key={r.id}
                      className="grid grid-cols-1 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] gap-3 px-5 py-3 hover:bg-muted/40"
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
                          <span className="text-foreground">{brl(planejado)}</span>
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
    </>
  );
}
