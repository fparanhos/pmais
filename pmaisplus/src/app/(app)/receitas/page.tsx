import { PageHeader, EmptyState } from "@/components/page-header";
import {
  getActiveEvent,
  getRevenueItems,
  type RevenueType,
} from "@/lib/queries";
import { ReceitasList } from "./receitas-list";
import type { RevenueItemDTO } from "./types";

export default async function ReceitasPage() {
  const event = await getActiveEvent();
  if (!event) {
    return (
      <>
        <PageHeader title="Receitas" />
        <EmptyState
          title="Nenhum evento cadastrado"
          description="Rode o seed demo para carregar o Radar 2026."
        />
      </>
    );
  }

  const rawItems = await getRevenueItems(event.id);

  const items: RevenueItemDTO[] = rawItems.map((r) => ({
    id: r.id,
    type: r.type as RevenueType,
    descritivo: r.descritivo,
    planejadoQtd: r.planejadoQtd,
    planejadoValorTotal: r.planejadoValorTotal,
    realizadoQtd: r.realizadoQtd,
    realizadoValorTotal: r.realizadoValorTotal,
  }));

  return (
    <>
      <PageHeader
        title="Receitas"
        subtitle={`${event.name} · ${items.length} linhas de receita`}
      />
      <ReceitasList eventId={event.id} items={items} />
    </>
  );
}
