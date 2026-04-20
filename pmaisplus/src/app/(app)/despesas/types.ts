import type { StatusProdutor, StatusFinanceiro } from "@/lib/queries";

export type SupplierDTO = {
  id: string;
  empresa: string;
  contato: string | null;
  telefone: string | null;
  email: string | null;
};

export type ExpenseItemDTO = {
  id: string;
  categoryId: string;
  servico: string;
  descritivo: string | null;

  planejadoQtdItens: number | null;
  planejadoQtdDias: number | null;
  planejadoValorUnit: number | null;
  planejadoValorTotal: number | null;

  orcadoQtdItens: number | null;
  orcadoQtdDias: number | null;
  orcadoValorUnit: number | null;
  orcadoValorTotal: number | null;

  contratadoQtdItens: number | null;
  contratadoQtdDias: number | null;
  contratadoValorUnit: number | null;
  contratadoValorTotal: number | null;

  statusProdutor: StatusProdutor;
  statusFinanceiro: StatusFinanceiro;

  supplierId: string | null;
  supplier: SupplierDTO | null;

  valorPago: number | null;
  dataPagamento: Date | null;
  obsParcelas: string | null;

  bvAcordado: number | null;
  bvRecebido: boolean;
};

export type CategoryDTO = {
  id: string;
  name: string;
  order: number;
  items: ExpenseItemDTO[];
};
