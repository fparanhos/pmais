"use client";
import useSWR from "swr";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api, fetcher } from "@/lib/api";
import Shell from "@/components/Shell";
import { useState } from "react";

const COLS: [string, string][] = [
  ["todo", "A fazer"],
  ["doing", "Em andamento"],
  ["waiting_approval", "Aguardando aprovação"],
  ["done", "Concluída"],
];

export default function Tasks() {
  const { id } = useParams<{ id: string }>();
  const { data: ev } = useSWR<any>(`/api/events/${id}`, fetcher);
  const { data, mutate } = useSWR<any[]>(`/api/events/${id}/tasks`, fetcher);
  const [adding, setAdding] = useState<string | null>(null);
  const [title, setTitle] = useState("");

  async function create(status: string) {
    if (!title.trim()) return;
    await api(`/api/events/${id}/tasks`, { method: "POST", body: JSON.stringify({ title, status }) });
    setTitle(""); setAdding(null); mutate();
  }
  async function move(t: any, status: string) {
    await api(`/api/tasks/${t.id}`, { method: "PUT", body: JSON.stringify({ ...t, status }) });
    mutate();
  }
  async function del(tid: number) {
    await api(`/api/tasks/${tid}`, { method: "DELETE" });
    mutate();
  }

  return (
    <Shell title="Atividades operacionais" breadcrumb={<><Link href="/events">Eventos</Link> / {ev?.name} / Atividades</>}>
      <div className="card">
        <p style={{ color: "var(--muted)", margin: 0 }}>
          Tarefas operacionais não-financeiras (herda do Trello: a coluna "Atividades à Fazer"). Itens financeiros estão em <Link href={`/events/${id}`}>Controle de Evento</Link>.
        </p>
      </div>
      <div className="kanban" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
        {COLS.map(([k, lbl]) => (
          <div key={k} className="col">
            <h3>{lbl} · {data?.filter(t => t.status === k).length || 0}</h3>
            {data?.filter(t => t.status === k).map(t => (
              <div key={t.id} className="cardlet">
                <div className="top">{t.title}</div>
                {t.description && <div className="sub" style={{ whiteSpace: "pre-wrap" }}>{t.description.slice(0, 100)}{t.description.length > 100 ? "…" : ""}</div>}
                <div style={{ marginTop: 8, display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {COLS.filter(([kk]) => kk !== k).map(([kk, ll]) => (
                    <button key={kk} className="ghost" style={{ fontSize: 10, padding: "2px 6px" }} onClick={() => move(t, kk)}>→ {ll}</button>
                  ))}
                  <button className="ghost" style={{ fontSize: 10, padding: "2px 6px", color: "var(--err)" }} onClick={() => del(t.id)}>×</button>
                </div>
              </div>
            ))}
            {adding === k ? (
              <div style={{ marginTop: 8 }}>
                <input autoFocus placeholder="Título" value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => e.key === "Enter" && create(k)} />
                <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                  <button onClick={() => create(k)} style={{ flex: 1 }}>Adicionar</button>
                  <button className="secondary" onClick={() => { setAdding(null); setTitle(""); }}>×</button>
                </div>
              </div>
            ) : (
              <button className="ghost" style={{ width: "100%", marginTop: 4 }} onClick={() => setAdding(k)}>+ Nova</button>
            )}
          </div>
        ))}
      </div>
    </Shell>
  );
}
