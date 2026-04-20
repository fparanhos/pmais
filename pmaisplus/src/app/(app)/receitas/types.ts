import type { RevenueType } from "@/lib/queries";

export type RevenueItemDTO = {
  id: string;
  type: RevenueType;
  descritivo: string;
  planejadoQtd: number | null;
  planejadoValorTotal: number | null;
  realizadoQtd: number | null;
  realizadoValorTotal: number | null;
};

export type RevenueTypeTotals = {
  type: RevenueType;
  count: number;
  planejado: number;
  realizado: number;
};
