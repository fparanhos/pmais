"use client";
import useSWR from "swr";
import { useParams } from "next/navigation";
import { api, fetcher } from "@/lib/api";
import Nav from "@/components/Nav";
import { useState } from "react";

const GROUPS = ["Inscrição", "Patrocínio", "Outras"];

function money(v: any) {
  return Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function Revenues() {
  const { id } = useParams<{ id: string }>();
  const { data, mutate } = useSWR<any[]>(`/api/events/${id}/revenues`, fetcher);
  const [form, setForm] = useState<any>({ group_name: "Inscrição", name: "" });

  async function create() {
    if (!form.name) return;
    await api(`/api/events/${id}/revenues`, { method: "POST", body: JSON.stringify(form) });
    setForm({ group_name: form.group_name, name: "" }); mutate();
  }

  async function update(r: any, patch: any) {
    await api(`/api/revenues/${r.id}`, { method: "PUT", body: JSON.stringify({ ...r, ...patch }) });
    mutate();
  }

  async function remove(rid: number) {
    await api(`/api/revenues/${rid}`, { method: "DELETE" });
    mutate();
  }

  let totalPlan = 0, totalReal = 0;
  data?.forEach(r => {
    totalPlan += Number(r.planned_qty || 0) * Number(r.planned_unit || 0);
    totalReal += Number(r.realized_qty || 0) * Number(r.realized_unit || 0);
  });

  return (
    <>
      <Nav />
      <div className="container">
        <div className="card">
          <h2>Receitas</h2>
          <p>Planejado: <b>{money(totalPlan)}</b> · Realizado: <b>{money(totalReal)}</b></p>
        </div>
        <div className="card">
          <h3>Nova receita</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr auto", gap: 8 }}>
            <select value={form.group_name} onChange={e => setForm({ ...form, group_name: e.target.value })}>
              {GROUPS.map(g => <option key={g}>{g}</option>)}
            </select>
            <input placeholder="nome" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <button onClick={create}>Adicionar</button>
          </div>
        </div>
        {GROUPS.map(g => (
          <div key={g} className="card">
            <h3>{g}</h3>
            <table>
              <thead><tr><th>Nome</th><th>Qtd Plan.</th><th>Unit Plan.</th><th>Qtd Real.</th><th>Unit Real.</th><th>Total Plan.</th><th>Total Real.</th><th></th></tr></thead>
              <tbody>
                {data?.filter(r => r.group_name === g).map(r => (
                  <tr key={r.id}>
                    <td>{r.name}</td>
                    <td><input defaultValue={r.planned_qty || ""} onBlur={e => update(r, { planned_qty: e.target.value || null })} /></td>
                    <td><input defaultValue={r.planned_unit || ""} onBlur={e => update(r, { planned_unit: e.target.value || null })} /></td>
                    <td><input defaultValue={r.realized_qty || ""} onBlur={e => update(r, { realized_qty: e.target.value || null })} /></td>
                    <td><input defaultValue={r.realized_unit || ""} onBlur={e => update(r, { realized_unit: e.target.value || null })} /></td>
                    <td>{money(Number(r.planned_qty || 0) * Number(r.planned_unit || 0))}</td>
                    <td>{money(Number(r.realized_qty || 0) * Number(r.realized_unit || 0))}</td>
                    <td><button className="secondary" onClick={() => remove(r.id)}>×</button></td>
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
