"use client";
import useSWR from "swr";
import Link from "next/link";
import { useParams } from "next/navigation";
import { DndContext, DragEndEvent, useDraggable, useDroppable } from "@dnd-kit/core";
import { api, fetcher } from "@/lib/api";
import Shell from "@/components/Shell";

const COLUMNS = ["Em Cotação", "Negociação", "Aguardando Aprovação", "Aprovado", "SEM_STATUS"];
const LABELS: Record<string, string> = { SEM_STATUS: "Sem status" };

function Card({ item }: { item: any }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: String(item.id) });
  const style = transform ? { transform: `translate(${transform.x}px,${transform.y}px)` } : undefined;
  const valor = Number(item.contracted_qty || 0) * Number(item.contracted_days || 1) * Number(item.contracted_unit || 0);
  return (
    <div ref={setNodeRef} {...listeners} {...attributes} style={style} className="cardlet">
      <div className="top">{item.name}</div>
      {item.supplier_company && <div className="sub">{item.supplier_company}</div>}
      {valor > 0 && <div className="chip">R$ {valor.toLocaleString("pt-BR")}</div>}
    </div>
  );
}

function Column({ id, items }: { id: string; items: any[] }) {
  const { setNodeRef } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className="col">
      <h3>{LABELS[id] || id} · {items.length}</h3>
      {items.map(it => <Card key={it.id} item={it} />)}
    </div>
  );
}

export default function Kanban() {
  const { id } = useParams<{ id: string }>();
  const { data: ev } = useSWR<any>(`/api/events/${id}`, fetcher);
  const { data, mutate } = useSWR<Record<string, any[]>>(`/api/kanban/${id}`, fetcher);

  async function onDragEnd(e: DragEndEvent) {
    if (!e.over) return;
    const itemId = e.active.id;
    const dest = String(e.over.id);
    if (dest === "SEM_STATUS") return;
    await api(`/api/kanban/item/${itemId}/move`, {
      method: "POST",
      body: JSON.stringify({ producer_status: dest, order: 0 }),
    });
    mutate();
  }

  return (
    <Shell title="Kanban de contratações" breadcrumb={<><Link href="/events">Eventos</Link> / {ev?.name}</>}>
      <DndContext onDragEnd={onDragEnd}>
        <div className="kanban">
          {COLUMNS.map(c => <Column key={c} id={c} items={data?.[c] || []} />)}
        </div>
      </DndContext>
    </Shell>
  );
}
