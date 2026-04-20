import { PageHeader, EmptyState } from "@/components/page-header";

export default function DespesasPage() {
  return (
    <>
      <PageHeader
        title="Despesas"
        subtitle="Planejado · Orçado · Contratado · Pago, por categoria"
      />
      <EmptyState
        title="Despesas em construção"
        description="Substitui a aba 'Controle de Evento' do xlsm: serviços agrupados por categoria, com status do produtor e do financeiro."
        hint="Ativo após a Etapa 3 (modelagem) e Etapa 4 (importador)."
      />
    </>
  );
}
