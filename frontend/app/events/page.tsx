"use client";
import useSWR from "swr";
import Link from "next/link";
import { useState } from "react";
import { api, fetcher } from "@/lib/api";
import Nav from "@/components/Nav";

export default function Events() {
  const { data, mutate } = useSWR<any[]>("/api/events", fetcher);
  const [name, setName] = useState("");

  async function create() {
    if (!name) return;
    await api("/api/events", { method: "POST", body: JSON.stringify({ name }) });
    setName("");
    mutate();
  }

  return (
    <>
      <Nav />
      <div className="container">
        <div className="card">
          <h2>Eventos</h2>
          <div style={{ display: "flex", gap: 8 }}>
            <input placeholder="novo evento" value={name} onChange={e => setName(e.target.value)} />
            <button onClick={create}>Criar</button>
          </div>
        </div>
        <div className="card">
          <table>
            <thead><tr><th>Nome</th><th>Data</th><th>Local</th><th>Cliente</th><th></th></tr></thead>
            <tbody>
              {data?.map(e => (
                <tr key={e.id}>
                  <td><Link href={`/events/${e.id}`}>{e.name}</Link></td>
                  <td>{e.event_date || "-"}</td>
                  <td>{e.location || "-"}</td>
                  <td>{e.client || "-"}</td>
                  <td>
                    <Link href={`/events/${e.id}/kanban`}>Kanban</Link>
                    {" · "}
                    <Link href={`/events/${e.id}/finance`}>Financeiro</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
