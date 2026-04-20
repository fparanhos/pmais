import { brl } from "@/lib/format";

type LegendDotProps = {
  color: string;
  label: string;
  value: string;
  tone?: "default" | "muted";
};

function LegendDot({ color, label, value, tone = "default" }: LegendDotProps) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <span
        className="h-2 w-2 rounded-full shrink-0"
        style={{ background: color }}
      />
      <div className="min-w-0">
        <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground leading-none">
          {label}
        </div>
        <div
          className={
            "text-sm font-semibold tabular-nums leading-tight mt-0.5 " +
            (tone === "muted" ? "text-muted-foreground" : "text-foreground")
          }
        >
          {value}
        </div>
      </div>
    </div>
  );
}

/**
 * Barra tripla empilhada: Pago | Contratado (ainda não pago) | Planejado restante.
 * Todas as larguras proporcionais ao total de Planejado. Se Contratado/Pago excedem
 * o Planejado, o excesso é acumulado ao final em tom de alerta.
 */
export function FinancialBar({
  planejado,
  contratado,
  pago,
  size = "md",
  legendPosition = "bottom",
}: {
  planejado: number;
  contratado: number;
  pago: number;
  size?: "sm" | "md" | "lg";
  legendPosition?: "top" | "bottom";
}) {
  const safePaid = Math.max(0, pago);
  const safeContrOnly = Math.max(0, contratado - safePaid);
  const base = Math.max(planejado, safePaid + safeContrOnly, 1);

  const pctPaid = (safePaid / base) * 100;
  const pctContr = (safeContrOnly / base) * 100;
  const pctRest = Math.max(0, 100 - pctPaid - pctContr);

  const barHeight =
    size === "sm" ? "h-1.5" : size === "lg" ? "h-3" : "h-2";

  const overBudget = safePaid + safeContrOnly > planejado && planejado > 0;

  const bar = (
    <div
      className={`${barHeight} w-full rounded-full overflow-hidden flex bg-muted`}
    >
      {pctPaid > 0 && (
        <div
          className="h-full"
          style={{ width: `${pctPaid}%`, background: "var(--success)" }}
          title={`Pago: ${brl(safePaid)}`}
        />
      )}
      {pctContr > 0 && (
        <div
          className="h-full"
          style={{ width: `${pctContr}%`, background: "var(--primary)" }}
          title={`Contratado não pago: ${brl(safeContrOnly)}`}
        />
      )}
      {pctRest > 0 && (
        <div
          className="h-full"
          style={{
            width: `${pctRest}%`,
            background: overBudget
              ? "var(--destructive-soft)"
              : "transparent",
          }}
        />
      )}
    </div>
  );

  const legend = (
    <div className="flex items-center gap-6 flex-wrap">
      <LegendDot
        color="var(--success)"
        label="Pago"
        value={brl(pago)}
      />
      <LegendDot
        color="var(--primary)"
        label="Contratado"
        value={brl(contratado)}
      />
      <LegendDot
        color="var(--muted-foreground)"
        label="Planejado"
        value={brl(planejado)}
        tone="muted"
      />
    </div>
  );

  return (
    <div className="space-y-2">
      {legendPosition === "top" && legend}
      {bar}
      {legendPosition === "bottom" && legend}
    </div>
  );
}

/**
 * Barra dupla Planejado vs Realizado (para receitas).
 */
export function RevenueBar({
  planejado,
  realizado,
  size = "md",
  legendPosition = "bottom",
}: {
  planejado: number;
  realizado: number;
  size?: "sm" | "md" | "lg";
  legendPosition?: "top" | "bottom";
}) {
  const base = Math.max(planejado, realizado, 1);
  const pct = (realizado / base) * 100;
  const barHeight =
    size === "sm" ? "h-1.5" : size === "lg" ? "h-3" : "h-2";

  const bar = (
    <div className={`${barHeight} w-full rounded-full overflow-hidden bg-muted`}>
      <div
        className="h-full rounded-full"
        style={{
          width: `${Math.min(pct, 100)}%`,
          background:
            "linear-gradient(90deg, var(--primary) 0%, var(--success) 100%)",
        }}
      />
    </div>
  );

  const legend = (
    <div className="flex items-center gap-6 flex-wrap">
      <LegendDot
        color="var(--success)"
        label="Realizado"
        value={brl(realizado)}
      />
      <LegendDot
        color="var(--muted-foreground)"
        label="Planejado"
        value={brl(planejado)}
        tone="muted"
      />
    </div>
  );

  return (
    <div className="space-y-2">
      {legendPosition === "top" && legend}
      {bar}
      {legendPosition === "bottom" && legend}
    </div>
  );
}
