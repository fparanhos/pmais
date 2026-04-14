"use client";
import useSWR from "swr";
import { api, fetcher } from "@/lib/api";
import Nav from "@/components/Nav";
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
    <>
      <Nav />
      <div className="container">
        <div className="card"><h2>Templates de e-mail</h2></div>
        <div className="card">
          <table>
            <thead><tr><th>Chave</th><th>Assunto</th><th></th></tr></thead>
            <tbody>
              {data?.map(t => (
                <tr key={t.id}>
                  <td><code>{t.key}</code></td>
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
            <p><input value={editing.subject} onChange={e => setEditing({ ...editing, subject: e.target.value })} /></p>
            <p><textarea rows={10} value={editing.body_html} onChange={e => setEditing({ ...editing, body_html: e.target.value })} /></p>
            <button onClick={save}>Salvar</button>{" "}
            <button className="secondary" onClick={() => setEditing(null)}>Cancelar</button>
          </div>
        )}
      </div>
    </>
  );
}
