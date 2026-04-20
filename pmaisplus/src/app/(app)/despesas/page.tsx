import { PageHeader, EmptyState } from "@/components/page-header";
import {
  getActiveEvent,
  getExpenseItemsByCategory,
  getSuppliers,
  type StatusProdutor,
  type StatusFinanceiro,
} from "@/lib/queries";
import { DespesasList } from "./despesas-list";
import type { CategoryDTO, SupplierDTO } from "./types";

export default async function DespesasPage() {
  const event = await getActiveEvent();
  if (!event) {
    return (
      <>
        <PageHeader title="Despesas" />
        <EmptyState
          title="Nenhum evento cadastrado"
          description="Rode o seed demo para carregar o Radar 2026."
        />
      </>
    );
  }

  const [rawCategories, rawSuppliers] = await Promise.all([
    getExpenseItemsByCategory(event.id),
    getSuppliers(event.id),
  ]);

  const suppliers: SupplierDTO[] = rawSuppliers.map((s) => ({
    id: s.id,
    empresa: s.empresa,
    contato: s.contato,
    telefone: s.telefone,
    email: s.email,
  }));

  const categories: CategoryDTO[] = rawCategories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    order: cat.order,
    items: cat.items.map((it) => ({
      id: it.id,
      categoryId: it.categoryId,
      servico: it.servico,
      descritivo: it.descritivo,
      planejadoQtdItens: it.planejadoQtdItens,
      planejadoQtdDias: it.planejadoQtdDias,
      planejadoValorUnit: it.planejadoValorUnit,
      planejadoValorTotal: it.planejadoValorTotal,
      orcadoQtdItens: it.orcadoQtdItens,
      orcadoQtdDias: it.orcadoQtdDias,
      orcadoValorUnit: it.orcadoValorUnit,
      orcadoValorTotal: it.orcadoValorTotal,
      contratadoQtdItens: it.contratadoQtdItens,
      contratadoQtdDias: it.contratadoQtdDias,
      contratadoValorUnit: it.contratadoValorUnit,
      contratadoValorTotal: it.contratadoValorTotal,
      statusProdutor: it.statusProdutor as StatusProdutor,
      statusFinanceiro: it.statusFinanceiro as StatusFinanceiro,
      supplierId: it.supplierId,
      supplier: it.supplier
        ? {
            id: it.supplier.id,
            empresa: it.supplier.empresa,
            contato: it.supplier.contato,
            telefone: it.supplier.telefone,
            email: it.supplier.email,
          }
        : null,
      valorPago: it.valorPago,
      dataPagamento: it.dataPagamento,
      obsParcelas: it.obsParcelas,
      bvAcordado: it.bvAcordado,
      bvRecebido: it.bvRecebido,
    })),
  }));

  const itemCount = categories.reduce((s, c) => s + c.items.length, 0);

  return (
    <>
      <PageHeader
        title="Despesas"
        subtitle={`${event.name} · ${categories.length} categorias · ${itemCount} itens`}
      />
      <DespesasList
        eventId={event.id}
        categories={categories}
        suppliers={suppliers}
      />
    </>
  );
}
