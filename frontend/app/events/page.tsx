"use client";
import useSWR from "swr";
import Link from "next/link";
import { useState } from "react";
import { api, fetcher } from "@/lib/api";
import Shell from "@/components/Shell";

export default function Events() {
  const { data, mutate } = useSWR<any[]>("/api/events", fetcher);
  const [name, setName] = useState("");
  const [open, setOpen] = useState(false);

  async function create() {
    if (!name.trim()) return;
    await api("/api/events", { method: "POST", body: JSON.stringify({ name }) });
    setName(""); setOpen(false); mutate();
  }
  async function populateMock() {
    await api("/api/mock/populate", { method: "POST" });
    mutate();
  }

  return (
    <Shell
      title="Eventos"
      actions={
        <>
          <button className="secondary" onClick={populateMock}>▸ Popular mock</button>
          <button onClick={() => setOpen(true)}>+ Novo evento</button>
        </>
      }
    >
      {open && (
        <div className="card">
          <h3>Novo evento</h3>
          <div style={{ display: "flex", gap: 10 }}>
            <input autoFocus placeholder="Nome do evento" value={name} onChange={e => setName(e.target.value)} />
            <button onClick={create}>Criar</button>
            <button className="secondary" onClick={() => setOpen(false)}>Cancelar</button>
          </div>
        </div>
      )}
      <div className="card">
        <table className="simple">
          <thead><tr><th>Nome</th><th>Data</th><th>Local</th><th>Cliente</th><th style={{ width: 200 }}></th></tr></thead>
          <tbody>
            {data?.length === 0 && <tr><td colSpan={5} style={{ textAlign: "center", color: "var(--muted)", padding: "40px 0" }}>Nenhum evento ainda. Clique em "Popular mock" pra ver a demo.</td></tr>}
            {data?.map(e => (
              <tr key={e.id}>
                <td><Link href={`/events/${e.id}`} style={{ fontWeight: 600 }}>{e.name}</Link></td>
                <td>{e.event_date || "-"}</td>
                <td>{e.location || "-"}</td>
                <td>{e.client || "-"}</td>
                <td>
                  <Link href={`/events/${e.id}`}>Controle</Link>{" · "}
                  <Link href={`/events/${e.id}/kanban`}>Kanban</Link>{" · "}
                  <Link href={`/events/${e.id}/config`}>Config.</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}
