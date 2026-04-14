"use client";
import useSWR from "swr";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { api, fetcher } from "@/lib/api";
import Shell from "@/components/Shell";
import { useState, useEffect } from "react";

const PRODUCER_STATUS = ["Em Cotação", "Negociação", "Aguardando Aprovação", "Aprovado"];
const FINANCE_STATUS = ["Solicitado", "Recebido", "Enviado/Lançado", "Aguardando Aprovação", "Pago"];

function money(v: any, digits = 2) {
  return Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: digits, maximumFractionDigits: digits });
}
function num(v: any) {
  return v == null || v === "" ? "" : Number(v);
}
function total(qty: any, days: any, unit: any) {
  return Number(qty || 0) * Number(days || 1) * Number(unit || 0);
}
function pillClass(s: string | null) {
  if (!s) return "";
  const k = s.toLowerCase();
  if (k.includes("aprovado") || k.includes("pago")) return "aprovado";
  if (k.includes("aguardando")) return "aguardando";
  if (k.includes("negocia")) return "negociacao";
  if (k.includes("enviado") || k.includes("lançado")) return "enviado";
  if (k.includes("cotaç") || k.includes("solicit")) return "cotacao";
  if (k.includes("recebido")) return "recebido";
  return "";
}

export default function EventControle() {
  const { id } = useParams<{ id: string }>();
  const pathname = usePathname();
  const { data: ev } = useSWR<any>(`/api/events/${id}`, fetcher);
  const { data: cats, mutate } = useSWR<any[]>(`/api/events/${id}/categories`, fetcher);
  const { data: revs, mutate: mutateRev } = useSWR<any[]>(`/api/events/${id}/revenues`, fetcher);

  async function updateItem(item: any, patch: any) {
    const payload = { ...item, ...patch };
    delete payload.id; delete payload.category_id;
    await api(`/api/items/${item.id}`, { method: "PUT", body: JSON.stringify(payload) });
    mutate();
  }
  async function updateRev(r: any, patch: any) {
    await api(`/api/revenues/${r.id}`, { method: "PUT", body: JSON.stringify({ ...r, ...patch }) });
    mutateRev();
  }

  let tPlan = 0, tContr = 0, tPago = 0;
  cats?.forEach(c => c.items.forEach((i: any) => {
    tPlan += total(i.planned_qty, i.planned_days, i.planned_unit);
    tContr += total(i.contracted_qty, i.contracted_days, i.contracted_unit);
    tPago += Number(i.paid_value || 0);
  }));

  return (
    <Shell
      title={ev?.name || "Evento"}
      breadcrumb={<Link href="/events">Eventos</Link>}
      actions={
        <>
          <a href={`/api/events/${id}/report.xlsx`} target="_blank"><button className="secondary">📄 Relatório cliente</button></a>
          <Link href={`/events/${id}/tasks`}><button className="secondary">✓ Atividades</button></Link>
          <Link href={`/events/${id}/kanban`}><button className="secondary">📋 Kanban</button></Link>
          <Link href={`/events/${id}/config`}><button className="secondary">⚙ Configurações</button></Link>
        </>
      }
    >
      {ev && (
        <div className="card" style={{ background: "linear-gradient(135deg, #fff 0%, var(--teal-light) 100%)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 14 }}>
            <div><div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em" }}>Evento</div><div style={{ fontWeight: 600, marginTop: 2 }}>{ev.name}</div></div>
            <div><div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em" }}>Data</div><div style={{ fontWeight: 600, marginTop: 2 }}>{ev.event_date || "-"}</div></div>
            <div><div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em" }}>Local</div><div style={{ fontWeight: 600, marginTop: 2 }}>{ev.location || "-"}</div></div>
            <div><div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em" }}>Público</div><div style={{ fontWeight: 600, marginTop: 2 }}>{ev.audience || "-"}</div></div>
            <div><div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em" }}>Cliente</div><div style={{ fontWeight: 600, marginTop: 2 }}>{ev.client || "-"}</div></div>
            <div><div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em" }}>Produtor</div><div style={{ fontWeight: 600, marginTop: 2 }}>{ev.producer_email || "-"}</div></div>
          </div>
        </div>
      )}

      <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
        <div className="kpi accent-teal"><div className="label">Planejado</div><div className="value">{money(tPlan, 0)}</div></div>
        <div className="kpi accent-purple"><div className="label">Contratado</div><div className="value">{money(tContr, 0)}</div></div>
        <div className="kpi accent-ok"><div className="label">Pago</div><div className="value">{money(tPago, 0)}</div></div>
        <div className="kpi accent-err"><div className="label">A pagar</div><div className="value">{money(tContr - tPago, 0)}</div></div>
      </div>

      <div className="toolbar">
        <div className="tabs">
          <a className="active">Despesas</a>
          <a href="#receitas">Receitas</a>
        </div>
        <div style={{ fontSize: 12, color: "var(--muted)" }}>Clique numa célula pra editar. Salva ao sair do campo.</div>
      </div>

      <div className="grid-wrap">
        <table className="grid">
          <thead>
            <tr className="group-row">
              <th rowSpan={2} style={{ textAlign: "left" }}>Serviço</th>
              <th colSpan={4}>Planejado</th>
              <th colSpan={4}>Orçado</th>
              <th colSpan={4}>Contratado</th>
              <th colSpan={3}>Área do Produtor</th>
              <th colSpan={3}>Área do Financeiro</th>
              <th colSpan={2}>BV</th>
              <th rowSpan={2}>Saldo</th>
            </tr>
            <tr className="sub-row">
              <th>Qtd</th><th>Dias</th><th>Unit</th><th>Total</th>
              <th>Qtd</th><th>Dias</th><th>Unit</th><th>Total</th>
              <th>Qtd</th><th>Dias</th><th>Unit</th><th>Total</th>
              <th>Status</th><th>Fornecedor</th><th>Contato</th>
              <th>Status NF</th><th>Pgto</th><th>Valor Pago</th>
              <th>Acord.</th><th>Receb.</th>
            </tr>
          </thead>
          <tbody>
            {cats?.map(cat => {
              const catTotal = cat.items.reduce((s: number, i: any) => s + total(i.contracted_qty, i.contracted_days, i.contracted_unit), 0);
              return (
                <>
                  <tr key={`cat-${cat.id}`} className="cat-row">
                    <td colSpan={22}>{cat.name}<span className="cat-sum">{money(catTotal)}</span></td>
                  </tr>
                  {cat.items.map((it: any) => {
                    const tP = total(it.planned_qty, it.planned_days, it.planned_unit);
                    const tO = total(it.budgeted_qty, it.budgeted_days, it.budgeted_unit);
                    const tC = total(it.contracted_qty, it.contracted_days, it.contracted_unit);
                    return (
                      <tr key={it.id}>
                        <td className="service-name">{it.name}</td>
                        <td className="num"><input className="num" defaultValue={num(it.planned_qty)} onBlur={e => updateItem(it, { planned_qty: e.target.value || null })} /></td>
                        <td className="num"><input className="num" defaultValue={num(it.planned_days)} onBlur={e => updateItem(it, { planned_days: e.target.value || null })} /></td>
                        <td className="num"><input className="num" defaultValue={num(it.planned_unit)} onBlur={e => updateItem(it, { planned_unit: e.target.value || null })} /></td>
                        <td className="num total">{money(tP)}</td>
                        <td className="num"><input className="num" defaultValue={num(it.budgeted_qty)} onBlur={e => updateItem(it, { budgeted_qty: e.target.value || null })} /></td>
                        <td className="num"><input className="num" defaultValue={num(it.budgeted_days)} onBlur={e => updateItem(it, { budgeted_days: e.target.value || null })} /></td>
                        <td className="num"><input className="num" defaultValue={num(it.budgeted_unit)} onBlur={e => updateItem(it, { budgeted_unit: e.target.value || null })} /></td>
                        <td className="num total">{money(tO)}</td>
                        <td className="num"><input className="num" defaultValue={num(it.contracted_qty)} onBlur={e => updateItem(it, { contracted_qty: e.target.value || null })} /></td>
                        <td className="num"><input className="num" defaultValue={num(it.contracted_days)} onBlur={e => updateItem(it, { contracted_days: e.target.value || null })} /></td>
                        <td className="num"><input className="num" defaultValue={num(it.contracted_unit)} onBlur={e => updateItem(it, { contracted_unit: e.target.value || null })} /></td>
                        <td className="num total-contracted">{money(tC)}</td>
                        <td>
                          <select defaultValue={it.producer_status || ""} onChange={e => updateItem(it, { producer_status: e.target.value || null })}>
                            <option value="">—</option>
                            {PRODUCER_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                          {it.producer_status && <span className={"pill " + pillClass(it.producer_status)} style={{ marginLeft: 4 }}>{it.producer_status}</span>}
                        </td>
                        <td><input defaultValue={it.supplier_company || ""} onBlur={e => updateItem(it, { supplier_company: e.target.value || null })} /></td>
                        <td><input defaultValue={it.supplier_contact || ""} onBlur={e => updateItem(it, { supplier_contact: e.target.value || null })} /></td>
                        <td>
                          <select defaultValue={it.finance_status || ""} onChange={e => updateItem(it, { finance_status: e.target.value || null })}>
                            <option value="">—</option>
                            {FINANCE_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                        <td><input type="date" defaultValue={it.payment_date || ""} onBlur={e => updateItem(it, { payment_date: e.target.value || null })} /></td>
                        <td className="num"><input className="num" defaultValue={num(it.paid_value)} onBlur={e => updateItem(it, { paid_value: e.target.value || null })} /></td>
                        <td className="num"><input className="num" defaultValue={num(it.bv_agreed)} onBlur={e => updateItem(it, { bv_agreed: e.target.value || null })} /></td>
                        <td style={{ textAlign: "center" }}>
                          <input type="checkbox" defaultChecked={it.bv_received} onChange={e => updateItem(it, { bv_received: e.target.checked })} />
                        </td>
                        <td className="num" style={{ color: tC - Number(it.paid_value || 0) > 0 ? "var(--err)" : "var(--muted)" }}>{money(tC - Number(it.paid_value || 0))}</td>
                      </tr>
                    );
                  })}
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      <div id="receitas" className="card" style={{ marginTop: 20 }}>
        <h3>Receitas</h3>
        <table className="simple">
          <thead>
            <tr>
              <th>Grupo</th>
              <th>Descrição</th>
              <th style={{ textAlign: "right" }}>Qtd Plan.</th>
              <th style={{ textAlign: "right" }}>Unit</th>
              <th style={{ textAlign: "right" }}>Total Plan.</th>
              <th style={{ textAlign: "right" }}>Qtd Real.</th>
              <th style={{ textAlign: "right" }}>Total Real.</th>
            </tr>
          </thead>
          <tbody>
            {["Inscrição", "Patrocínio", "Outras"].map(g => (
              <>
                <tr key={`g-${g}`} style={{ background: "var(--purple-light)" }}>
                  <td colSpan={7} style={{ fontWeight: 700, color: "var(--purple)", padding: "6px 10px", fontSize: 11, textTransform: "uppercase", letterSpacing: ".06em" }}>{g}</td>
                </tr>
                {revs?.filter(r => r.group_name === g).map(r => {
                  const tp = Number(r.planned_qty || 0) * Number(r.planned_unit || 0);
                  const tr = Number(r.realized_qty || 0) * Number(r.realized_unit || 0);
                  return (
                    <tr key={r.id}>
                      <td style={{ color: "var(--muted)" }}>{r.group_name}</td>
                      <td>{r.name}</td>
                      <td style={{ textAlign: "right" }}><input className="num" defaultValue={num(r.planned_qty)} onBlur={e => updateRev(r, { planned_qty: e.target.value || null })} /></td>
                      <td style={{ textAlign: "right" }}><input className="num" defaultValue={num(r.planned_unit)} onBlur={e => updateRev(r, { planned_unit: e.target.value || null })} /></td>
                      <td style={{ textAlign: "right", fontWeight: 600 }}>{money(tp)}</td>
                      <td style={{ textAlign: "right" }}><input className="num" defaultValue={num(r.realized_qty)} onBlur={e => updateRev(r, { realized_qty: e.target.value || null })} /></td>
                      <td style={{ textAlign: "right", fontWeight: 600, color: "var(--purple)" }}>{money(tr)}</td>
                    </tr>
                  );
                })}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}
