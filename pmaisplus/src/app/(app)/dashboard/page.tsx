import { PageHeader, EmptyState } from "@/components/page-header";

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Saldo planejado vs realizado, pipeline de pagamentos, receita por cota"
      />
      <EmptyState
        title="Dashboard em construção"
        description="Aqui entrarão os KPIs financeiros do evento: saldo, % contratado, pipeline de aprovação e composição de receitas."
        hint="Ativo após a Etapa 4 (importador do Radar 2025)."
      />
    </>
  );
}
