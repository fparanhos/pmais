"use client";
import useSWR from "swr";
import { api, fetcher } from "@/lib/api";
import Shell from "@/components/Shell";
import { useState } from "react";

export default function Templates() {
  const { data, mutate } = useSWR<any[]>("/api/templates", fetcher);
  const [editing, setEditing] = useState<any>(null);

  async function save() {
    await api("/api/templates", { method: "POST", body: JSON.stringify({
      key: editing.key, subject: editing.subject, body_html: editing.body_html,
    }) });
    setEditing(null); mutate();
  }

  return (
    <Shell title="Templates de e-mail" breadcrumb="Administração">
      <div className="card">
        <table className="simple">
          <thead><tr><th>Chave</th><th>Assunto</th><th style={{ width: 100 }}></th></tr></thead>
          <tbody>
            {data?.map(t => (
              <tr key={t.id}>
                <td><code style={{ background: "#F3F4F6", padding: "2px 6px", borderRadius: 4 }}>{t.key}</code></td>
                <td>{t.subject}</td>
                <td><button className="secondary" onClick={() => setEditing(t)}>Editar</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editing && (
        <div className="card">
          <h3>Editar: {editing.key}</h3>
          <label>Assunto<input value={editing.subject} onChange={e => setEditing({ ...editing, subject: e.target.value })} /></label>
          <label style={{ display: "block", marginTop: 12 }}>Corpo HTML<textarea rows={12} value={editing.body_html} onChange={e => setEditing({ ...editing, body_html: e.target.value })} /></label>
          <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>
            Variáveis disponíveis: <code>{"{{evento}}"}</code> <code>{"{{servico}}"}</code> <code>{"{{fornecedor}}"}</code> <code>{"{{valor}}"}</code> <code>{"{{data}}"}</code>
          </p>
          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
            <button onClick={save}>Salvar</button>
            <button className="secondary" onClick={() => setEditing(null)}>Cancelar</button>
          </div>
        </div>
      )}
    </Shell>
  );
}
