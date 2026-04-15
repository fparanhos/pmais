"use client";
import useSWR from "swr";
import Link from "next/link";
import { api, fetcher } from "@/lib/api";
import Shell from "@/components/Shell";

function money(v: number | string | null | undefined) {
  return Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

export default function Dashboard() {
  const { data: events, mutate } = useSWR<any[]>("/api/events", fetcher);
  const ev = events?.[0];
  const { data: cats } = useSWR<any[]>(ev ? `/api/events/${ev.id}/categories` : null, fetcher);
  const { data: revs } = useSWR<any[]>(ev ? `/api/events/${ev.id}/revenues` : null, fetcher);

  async function populateMock() {
    await api("/api/mock/populate", { method: "POST" });
    mutate();
    location.reload();
  }

  let tPlan = 0, tOrc = 0, tContr = 0, tPago = 0;
  cats?.forEach(c => c.items.forEach((i: any) => {
    tPlan += Number(i.planned_qty || 0) * Number(i.planned_days || 1) * Number(i.planned_unit || 0);
    tOrc += Number(i.budgeted_qty || 0) * Number(i.budgeted_days || 1) * Number(i.budgeted_unit || 0);
    tContr += Number(i.contracted_qty || 0) * Number(i.contracted_days || 1) * Number(i.contracted_unit || 0);
    tPago += Number(i.paid_value || 0);
  }));
  let tRecPlan = 0, tRecReal = 0;
  revs?.forEach((r: any) => {
    tRecPlan += Number(r.planned_qty || 0) * Number(r.planned_unit || 0);
    tRecReal += Number(r.realized_qty || 0) * Number(r.realized_unit || 0);
  });
  const saldo = tRecPlan - tPlan;
  const saldoReal = tRecReal - tPago;

  return (
    <Shell
      title="Dashboard"
      breadcrumb="Visão geral"
      actions={<button className="primary-purple" onClick={populateMock}>▸ Popular com dados de demonstração</button>}
    >
      {!events?.length ? (
        <div className="card">
          <h2>Nenhum evento cadastrado</h2>
          <p style={{ color: "var(--muted)" }}>
            Clique em "Popular com dados de demonstração" no topo para ver a aplicação preenchida com o evento <b>Radar 2026</b>, ou crie um evento em <Link href="/events">Eventos</Link>.
          </p>
        </div>
      ) : (
        <>
          <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em", fontWeight: 600 }}>EVENTO EM DESTAQUE</div>
              <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>{ev.name}</div>
              <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 2 }}>
                {ev.event_date} · {ev.location} · {ev.audience}
              </div>
            </div>
            <Link href={`/events/${ev.id}`}><button>Abrir controle →</button></Link>
          </div>

          <div className="kpi-grid">
            <div className="kpi accent-teal">
              <div className="label">Planejado</div>
              <div className="value">{money(tPlan)}</div>
              <div className="delta">custos estimados</div>
            </div>
            <div className="kpi accent-purple">
              <div className="label">Orçado</div>
              <div className="value">{money(tOrc)}</div>
              <div className="delta">cotação com fornecedores</div>
            </div>
            <div className="kpi accent-ok">
              <div className="label">Contratado</div>
              <div className="value">{money(tContr)}</div>
              <div className="delta">fechado com fornecedores</div>
            </div>
            <div className="kpi accent-warn">
              <div className="label">Pago</div>
              <div className="value">{money(tPago)}</div>
              <div className="delta">{tContr > 0 ? `${Math.round((tPago / tContr) * 100)}% do contratado` : "-"}</div>
            </div>
            <div className="kpi accent-err">
              <div className="label">A pagar</div>
              <div className="value">{money(tContr - tPago)}</div>
              <div className="delta">saldo em aberto</div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
            <div className="card">
              <h3>Resumo por categoria</h3>
              <table className="simple">
                <thead>
                  <tr>
                    <th>Categoria</th>
                    <th style={{ textAlign: "right" }}>Planejado</th>
                    <th style={{ textAlign: "right" }}>Orçado</th>
                    <th style={{ textAlign: "right" }}>Contratado</th>
                    <th style={{ textAlign: "right" }}>Pago</th>
                    <th style={{ textAlign: "right" }}>Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {cats?.map(c => {
                    const pl = c.items.reduce((s: number, i: any) => s + Number(i.planned_qty || 0) * Number(i.planned_days || 1) * Number(i.planned_unit || 0), 0);
                    const or = c.items.reduce((s: number, i: any) => s + Number(i.budgeted_qty || 0) * Number(i.budgeted_days || 1) * Number(i.budgeted_unit || 0), 0);
                    const co = c.items.reduce((s: number, i: any) => s + Number(i.contracted_qty || 0) * Number(i.contracted_days || 1) * Number(i.contracted_unit || 0), 0);
                    const pg = c.items.reduce((s: number, i: any) => s + Number(i.paid_value || 0), 0);
                    return (
                      <tr key={c.id}>
                        <td style={{ fontWeight: 600 }}>{c.name}</td>
                        <td style={{ textAlign: "right" }}>{money(pl)}</td>
                        <td style={{ textAlign: "right" }}>{money(or)}</td>
                        <td style={{ textAlign: "right", color: "var(--teal-dark)", fontWeight: 600 }}>{money(co)}</td>
                        <td style={{ textAlign: "right" }}>{money(pg)}</td>
                        <td style={{ textAlign: "right", color: co - pg > 0 ? "var(--err)" : "var(--muted)" }}>{money(co - pg)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background: "#F9FAFB", fontWeight: 700 }}>
                    <td style={{ padding: "10px" }}>TOTAL</td>
                    <td style={{ textAlign: "right", padding: "10px" }}>{money(tPlan)}</td>
                    <td style={{ textAlign: "right", padding: "10px" }}>{money(tOrc)}</td>
                    <td style={{ textAlign: "right", padding: "10px", color: "var(--teal-dark)" }}>{money(tContr)}</td>
                    <td style={{ textAlign: "right", padding: "10px" }}>{money(tPago)}</td>
                    <td style={{ textAlign: "right", padding: "10px", color: "var(--err)" }}>{money(tContr - tPago)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div className="card">
              <h3>Receitas</h3>
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 8 }}>PLANEJADO</div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{money(tRecPlan)}</div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 14 }}>REALIZADO</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "var(--teal-dark)" }}>{money(tRecReal)}</div>
              <hr style={{ margin: "16px 0", border: 0, borderTop: "1px solid var(--line)" }} />
              <div style={{ fontSize: 11, color: "var(--muted)" }}>SALDO PROJETADO (receita − despesa planejada)</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: saldo >= 0 ? "var(--ok)" : "var(--err)" }}>{money(saldo)}</div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 10 }}>SALDO REAL (recebido − pago)</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: saldoReal >= 0 ? "var(--ok)" : "var(--err)" }}>{money(saldoReal)}</div>
            </div>
          </div>
        </>
      )}
    </Shell>
  );
}
