"use client";
import useSWR from "swr";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api, fetcher } from "@/lib/api";
import Shell from "@/components/Shell";
import { useState, useEffect } from "react";

export default function EventConfig() {
  const { id } = useParams<{ id: string }>();
  const { data: ev, mutate } = useSWR<any>(`/api/events/${id}`, fetcher);
  const [form, setForm] = useState<any>({});

  useEffect(() => { if (ev) setForm(ev); }, [ev]);

  async function save() {
    await api(`/api/events/${id}`, { method: "PUT", body: JSON.stringify({
      name: form.name, event_date: form.event_date || null, location: form.location || null,
      audience: form.audience || null, client: form.client || null,
      finance_email: form.finance_email || null, producer_email: form.producer_email || null,
    }) });
    mutate();
    alert("salvo");
  }

  if (!ev) return <Shell title="…"><div /></Shell>;

  return (
    <Shell title="Configurações do evento" breadcrumb={<><Link href="/events">Eventos</Link> / {ev.name}</>}>
      <div className="card">
        <h3>Dados gerais</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <label>Nome do evento<input value={form.name || ""} onChange={e => setForm({ ...form, name: e.target.value })} /></label>
          <label>Data<input type="date" value={form.event_date || ""} onChange={e => setForm({ ...form, event_date: e.target.value })} /></label>
          <label>Local<input value={form.location || ""} onChange={e => setForm({ ...form, location: e.target.value })} /></label>
          <label>Público<input value={form.audience || ""} onChange={e => setForm({ ...form, audience: e.target.value })} /></label>
          <label>Cliente<input value={form.client || ""} onChange={e => setForm({ ...form, client: e.target.value })} /></label>
          <div />
          <label>E-mail Produtor<input value={form.producer_email || ""} onChange={e => setForm({ ...form, producer_email: e.target.value })} /></label>
          <label>E-mail Financeiro<input value={form.finance_email || ""} onChange={e => setForm({ ...form, finance_email: e.target.value })} /></label>
        </div>
        <p style={{ marginTop: 18 }}><button onClick={save}>Salvar alterações</button></p>
      </div>
    </Shell>
  );
}
