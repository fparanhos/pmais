"use client";
import useSWR from "swr";
import { useParams } from "next/navigation";
import { api, fetcher } from "@/lib/api";
import Nav from "@/components/Nav";
import { useState } from "react";

const PRODUCER_STATUS = ["Em Cotação", "Negociação", "Aguardando Aprovação", "Aprovado"];
const FINANCE_STATUS = ["Solicitado", "Recebido", "Enviado/Lançado", "Aguardando Aprovação", "Pago"];

function money(v: any) {
  const n = Number(v || 0);
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function FinancePage() {
  const { id } = useParams<{ id: string }>();
  const { data, mutate } = useSWR<any[]>(`/api/events/${id}/categories`, fetcher);

  async function updateItem(item: any, patch: any) {
    const payload = { ...item, ...patch };
    delete payload.id; delete payload.category_id;
    await api(`/api/items/${item.id}`, { method: "PUT", body: JSON.stringify(payload) });
    mutate();
  }

  let totalPlanned = 0, totalContracted = 0;
  data?.forEach(c => c.items.forEach((it: any) => {
    totalPlanned += Number(it.planned_qty || 0) * Number(it.planned_days || 1) * Number(it.planned_unit || 0);
    totalContracted += Number(it.contracted_qty || 0) * Number(it.contracted_days || 1) * Number(it.contracted_unit || 0);
  }));

  return (
    <>
      <Nav />
      <div className="container">
        <div className="card">
          <h2>Financeiro</h2>
          <p>Planejado: <b>{money(totalPlanned)}</b> · Contratado: <b>{money(totalContracted)}</b> · Saldo: <b>{money(totalPlanned - totalContracted)}</b></p>
        </div>
        {data?.map(cat => (
          <div key={cat.id} className="card">
            <h3>{cat.name}</h3>
            <table>
              <thead>
                <tr>
                  <th>Serviço</th>
                  <th>Qtd</th><th>Dias</th><th>Unit</th><th>Total Plan.</th>
                  <th>Contratado</th>
                  <th>Status Prod.</th>
                  <th>Fornecedor</th>
                  <th>Status Fin.</th>
                  <th>Valor Pago</th>
                </tr>
              </thead>
              <tbody>
                {cat.items.map((it: any) => (
                  <tr key={it.id}>
                    <td>{it.name}</td>
                    <td><input defaultValue={it.planned_qty || ""} onBlur={e => updateItem(it, { planned_qty: e.target.value || null })} /></td>
                    <td><input defaultValue={it.planned_days || ""} onBlur={e => updateItem(it, { planned_days: e.target.value || null })} /></td>
                    <td><input defaultValue={it.planned_unit || ""} onBlur={e => updateItem(it, { planned_unit: e.target.value || null })} /></td>
                    <td>{money(Number(it.planned_qty || 0) * Number(it.planned_days || 1) * Number(it.planned_unit || 0))}</td>
                    <td><input defaultValue={it.contracted_unit || ""} onBlur={e => updateItem(it, { contracted_unit: e.target.value || null })} /></td>
                    <td>
                      <select defaultValue={it.producer_status || ""} onChange={e => updateItem(it, { producer_status: e.target.value || null })}>
                        <option value="">-</option>
                        {PRODUCER_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td><input defaultValue={it.supplier_company || ""} onBlur={e => updateItem(it, { supplier_company: e.target.value || null })} /></td>
                    <td>
                      <select defaultValue={it.finance_status || ""} onChange={e => updateItem(it, { finance_status: e.target.value || null })}>
                        <option value="">-</option>
                        {FINANCE_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td><input defaultValue={it.paid_value || ""} onBlur={e => updateItem(it, { paid_value: e.target.value || null })} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </>
  );
}
