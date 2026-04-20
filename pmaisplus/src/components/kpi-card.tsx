import type { LucideIcon } from "lucide-react";

type Tone = "primary" | "accent" | "success" | "warning" | "destructive";

const TONE_STYLES: Record<
  Tone,
  {
    bar: string;
    iconBg: string;
    iconColor: string;
    value: string;
    subtle: string;
  }
> = {
  primary: {
    bar: "from-[#2FB5AD] to-[#176B66]",
    iconBg: "bg-[#E6F7F5]",
    iconColor: "text-[#176B66]",
    value: "text-[#176B66]",
    subtle: "bg-[#E6F7F5]/40",
  },
  accent: {
    bar: "from-[#7C3AED] to-[#4C0DB3]",
    iconBg: "bg-[#EFE7FB]",
    iconColor: "text-[#4C0DB3]",
    value: "text-[#4C0DB3]",
    subtle: "bg-[#EFE7FB]/40",
  },
  success: {
    bar: "from-[#34D399] to-[#047857]",
    iconBg: "bg-[#DCFCE7]",
    iconColor: "text-[#047857]",
    value: "text-[#047857]",
    subtle: "bg-[#DCFCE7]/40",
  },
  warning: {
    bar: "from-[#FBBF24] to-[#B45309]",
    iconBg: "bg-[#FEF3C7]",
    iconColor: "text-[#B45309]",
    value: "text-[#92400E]",
    subtle: "bg-[#FEF3C7]/40",
  },
  destructive: {
    bar: "from-[#F87171] to-[#B91C1C]",
    iconBg: "bg-[#FEE2E2]",
    iconColor: "text-[#B91C1C]",
    value: "text-[#991B1B]",
    subtle: "bg-[#FEE2E2]/40",
  },
};

export function KpiCard({
  label,
  value,
  delta,
  icon: Icon,
  tone = "primary",
  hint,
}: {
  label: string;
  value: string;
  delta?: string;
  icon?: LucideIcon;
  tone?: Tone;
  hint?: string;
}) {
  const t = TONE_STYLES[tone];

  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-card shadow-xs hover:shadow-md transition-shadow">
      <div
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${t.bar}`}
      />
      <div className={`absolute inset-0 ${t.subtle} pointer-events-none`} />
      <div className="relative p-5">
        <div className="flex items-start justify-between">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            {label}
          </div>
          {Icon && (
            <div
              className={`h-9 w-9 rounded-lg flex items-center justify-center ${t.iconBg}`}
            >
              <Icon className={`h-4 w-4 ${t.iconColor}`} />
            </div>
          )}
        </div>
        <div
          className={`mt-3 text-3xl font-bold tracking-tight tabular-nums ${t.value}`}
        >
          {value}
        </div>
        {delta && (
          <div className="mt-1 text-[11px] text-muted-foreground leading-snug">
            {delta}
          </div>
        )}
        {hint && (
          <div className="mt-3 text-[11px] text-muted-foreground/70">
            {hint}
          </div>
        )}
      </div>
    </div>
  );
}
