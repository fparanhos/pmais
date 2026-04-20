import { Banknote, CheckCircle2, Scale, TrendingUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { KpiCard } from "@/components/kpi-card";
import { EventHeader } from "@/components/event-header";
import { ExpenseByCategoryBar } from "@/components/charts/expense-by-category-bar";
import { RevenueByTypeDonut } from "@/components/charts/revenue-by-type-donut";
import {
  FINANCEIRO_LABELS,
  PRODUTOR_LABELS,
} from "@/components/status-badge";
import { brl, brlCompact, pct, pctNumber } from "@/lib/format";
import {
  getActiveEvent,
  getEventSummary,
  getExpensesByCategory,
  getFinancialPipeline,
  getProducerPipeline,
  getRevenuesByType,
  type StatusFinanceiro,
  type StatusProdutor,
} from "@/lib/queries";

export default async function DashboardPage() {
  const event = await getActiveEvent();

  if (!event) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-md text-center">
          <h2 className="text-lg font-semibold">Nenhum evento cadastrado</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Rode <code className="px-1.5 py-0.5 rounded bg-muted">npm run db:seed:demo</code>{" "}
            para popular o Radar 2026 de demonstração.
          </p>
        </div>
      </div>
    );
  }

  const [summary, byCategory, byType, producerPipeline, financialPipeline] =
    await Promise.all([
      getEventSummary(event.id),
      getExpensesByCategory(event.id),
      getRevenuesByType(event.id),
      getProducerPipeline(event.id),
      getFinancialPipeline(event.id),
    ]);

  const pctContratado = pctNumber(summary.despesaContratada, summary.despesaPlanejada);
  const pctPago = pctNumber(summary.despesaPaga, summary.despesaContratada);
  const pctReceita = pctNumber(summary.receitaRealizada, summary.receitaPlanejada);

  return (
    <>
      <EventHeader
        name={event.name}
        cliente={event.cliente}
        local={event.local}
        publicoAlvo={event.publicoAlvo}
        startDate={event.startDate}
        endDate={event.endDate}
      />

      <div className="px-8 pb-10 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Saldo planejado"
            value={brl(summary.saldoPlanejado)}
            delta={`Receita ${brlCompact(summary.receitaPlanejada)} − Despesa ${brlCompact(summary.despesaPlanejada)}`}
            icon={Scale}
            tone="accent"
          />
          <KpiCard
            label="Saldo realizado"
            value={brl(summary.saldoRealizado)}
            delta={`Receita ${brlCompact(summary.receitaRealizada)} − Despesa contratada ${brlCompact(summary.despesaContratada)}`}
            icon={TrendingUp}
            tone={summary.saldoRealizado >= 0 ? "success" : "destructive"}
          />
          <KpiCard
            label="% Contratado"
            value={`${pctContratado}%`}
            delta={`${brl(summary.despesaContratada)} de ${brl(summary.despesaPlanejada)}`}
            icon={CheckCircle2}
            tone="default"
          />
          <KpiCard
            label="Despesas pagas"
            value={brl(summary.despesaPaga)}
            delta={`${pctPago}% do contratado`}
            icon={Banknote}
            tone="warning"
          />
        </div>

        {/* Main chart + donut */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Despesas por categoria</CardTitle>
              <CardDescription>
                Planejado (claro) · Contratado (semi) · Pago (sólido)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ExpenseByCategoryBar
                data={byCategory.map((c) => ({
                  name: c.name,
                  planejado: c.planejado,
                  contratado: c.contratado,
                  pago: c.pago,
                }))}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Receita por tipo</CardTitle>
              <CardDescription>
                Realizado · {pctReceita}% do planejado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RevenueByTypeDonut data={byType} />
              <div className="mt-4 space-y-2">
                {byType.map((r) => (
                  <div
                    key={r.type}
                    className="flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: donutColor(r.type) }}
                      />
                      <span className="font-medium">{typeLabel(r.type)}</span>
                    </div>
                    <div className="text-muted-foreground">
                      {brl(r.realizado)} / {brl(r.planejado)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pipelines */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PipelineCard
            title="Pipeline do produtor"
            description="Itens por status de aprovação da contratação"
            rows={producerPipeline.map((r) => ({
              key: r.status,
              label: PRODUTOR_LABELS[r.status as StatusProdutor],
              count: r.count,
              valor: r.contratado || r.planejado,
              tone: r.status === "APROVADO" ? "success" : r.status === "AGUARDANDO_APROVACAO" ? "warning" : r.status === "NEGOCIACAO" ? "info" : "muted",
            }))}
          />
          <PipelineCard
            title="Pipeline financeiro"
            description="Itens por status de pagamento"
            rows={financialPipeline.map((r) => ({
              key: r.status,
              label: FINANCEIRO_LABELS[r.status as StatusFinanceiro],
              count: r.count,
              valor: r.pago || r.contratado,
              tone: r.status === "PAGO" ? "success" : r.status === "AGUARDANDO_APROVACAO" ? "warning" : r.status === "ENVIADO_LANCADO" ? "info" : r.status === "RECEBIDO" ? "accent" : "muted",
            }))}
          />
        </div>
      </div>
    </>
  );
}

type PipelineTone = "success" | "warning" | "info" | "accent" | "muted";

function PipelineCard({
  title,
  description,
  rows,
}: {
  title: string;
  description: string;
  rows: { key: string; label: string; count: number; valor: number; tone: PipelineTone }[];
}) {
  const total = rows.reduce((s, r) => s + r.count, 0) || 1;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {rows.map((r) => (
            <div key={r.key}>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: toneColor(r.tone) }}
                  />
                  <span className="font-medium">{r.label}</span>
                </div>
                <div className="text-xs text-muted-foreground tabular-nums">
                  {r.count} {r.count === 1 ? "item" : "itens"} · {brlCompact(r.valor)}
                </div>
              </div>
              <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.round((r.count / total) * 100)}%`,
                    background: toneColor(r.tone),
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function donutColor(t: "INSCRICAO" | "PATROCINIO" | "OUTRAS") {
  switch (t) {
    case "PATROCINIO":
      return "var(--chart-2)";
    case "INSCRICAO":
      return "var(--chart-1)";
    default:
      return "var(--chart-5)";
  }
}

function typeLabel(t: "INSCRICAO" | "PATROCINIO" | "OUTRAS") {
  switch (t) {
    case "INSCRICAO":
      return "Inscrições";
    case "PATROCINIO":
      return "Patrocínio";
    default:
      return "Outras receitas";
  }
}

function toneColor(tone: PipelineTone): string {
  switch (tone) {
    case "success":
      return "var(--success)";
    case "warning":
      return "var(--warning)";
    case "info":
      return "var(--info)";
    case "accent":
      return "var(--accent-solid)";
    default:
      return "var(--muted-foreground)";
  }
}

