import type { StatusProdutor, StatusFinanceiro } from "@/lib/queries";

const PRODUTOR_LABEL: Record<StatusProdutor, string> = {
  APROVADO: "Aprovado",
  AGUARDANDO_APROVACAO: "Aguardando aprovação",
  NEGOCIACAO: "Negociação",
  EM_COTACAO: "Em cotação",
};

const FINANCEIRO_LABEL: Record<StatusFinanceiro, string> = {
  SOLICITADO: "Solicitado",
  RECEBIDO: "Recebido",
  ENVIADO_LANCADO: "Enviado/Lançado",
  PAGO: "Pago",
  AGUARDANDO_APROVACAO: "Aguardando aprovação",
};

const PRODUTOR_STYLE: Record<StatusProdutor, string> = {
  APROVADO: "bg-success-soft text-[#166534] border-[#166534]/10",
  AGUARDANDO_APROVACAO: "bg-warning-soft text-[#92400E] border-[#92400E]/10",
  NEGOCIACAO: "bg-info-soft text-[#1E40AF] border-[#1E40AF]/10",
  EM_COTACAO: "bg-muted text-foreground/70 border-border",
};

const FINANCEIRO_STYLE: Record<StatusFinanceiro, string> = {
  PAGO: "bg-success-soft text-[#166534] border-[#166534]/10",
  AGUARDANDO_APROVACAO: "bg-warning-soft text-[#92400E] border-[#92400E]/10",
  SOLICITADO: "bg-muted text-foreground/70 border-border",
  RECEBIDO: "bg-accent-soft text-accent-foreground border-accent-foreground/10",
  ENVIADO_LANCADO: "bg-info-soft text-[#1E40AF] border-[#1E40AF]/10",
};

function Pill({
  children,
  className,
}: {
  children: React.ReactNode;
  className: string;
}) {
  return (
    <span
      className={
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium leading-tight whitespace-nowrap " +
        className
      }
    >
      {children}
    </span>
  );
}

export function StatusProdutorBadge({ status }: { status: StatusProdutor }) {
  return <Pill className={PRODUTOR_STYLE[status]}>{PRODUTOR_LABEL[status]}</Pill>;
}

export function StatusFinanceiroBadge({ status }: { status: StatusFinanceiro }) {
  return (
    <Pill className={FINANCEIRO_STYLE[status]}>{FINANCEIRO_LABEL[status]}</Pill>
  );
}

export const PRODUTOR_LABELS = PRODUTOR_LABEL;
export const FINANCEIRO_LABELS = FINANCEIRO_LABEL;
