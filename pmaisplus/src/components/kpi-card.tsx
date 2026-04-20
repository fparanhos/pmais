import type { LucideIcon } from "lucide-react";

export function KpiCard({
  label,
  value,
  delta,
  icon: Icon,
  tone = "default",
  hint,
}: {
  label: string;
  value: string;
  delta?: string;
  icon?: LucideIcon;
  tone?: "default" | "success" | "warning" | "destructive" | "accent";
  hint?: string;
}) {
  const toneClasses: Record<typeof tone, string> = {
    default: "bg-primary-soft text-primary",
    success: "bg-success-soft text-[#166534]",
    warning: "bg-warning-soft text-[#92400E]",
    destructive: "bg-destructive-soft text-[#991B1B]",
    accent: "bg-accent-soft text-accent-foreground",
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </div>
        {Icon && (
          <div
            className={
              "h-8 w-8 rounded-lg flex items-center justify-center " +
              toneClasses[tone]
            }
          >
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
      <div className="mt-3 text-2xl font-semibold tracking-tight">{value}</div>
      {delta && (
        <div className="mt-1 text-xs text-muted-foreground">{delta}</div>
      )}
      {hint && (
        <div className="mt-3 text-[11px] text-muted-foreground/70">{hint}</div>
      )}
    </div>
  );
}
