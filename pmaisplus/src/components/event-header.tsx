import { MapPin, Users, Calendar } from "lucide-react";
import { eventPeriod } from "@/lib/format";

export function EventHeader({
  name,
  cliente,
  local,
  publicoAlvo,
  startDate,
  endDate,
}: {
  name: string;
  cliente: string | null;
  local: string | null;
  publicoAlvo: string | null;
  startDate: Date | null;
  endDate: Date | null;
}) {
  return (
    <div className="relative overflow-hidden border-b border-border">
      <div className="absolute inset-0 bg-brand-soft" />
      <div className="relative px-8 pt-8 pb-6">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-[0.18em] uppercase text-primary-deep mb-2 px-2 py-1 rounded-full bg-primary-soft border border-primary/20">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Evento ativo
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              {name}
            </h1>
            {cliente && (
              <div className="text-sm text-muted-foreground mt-1">
                {cliente}
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 min-w-[520px]">
            {(startDate || endDate) && (
              <InfoChip
                icon={Calendar}
                label="Período"
                value={eventPeriod(startDate, endDate)}
              />
            )}
            {local && <InfoChip icon={MapPin} label="Local" value={local} />}
            {publicoAlvo && (
              <InfoChip icon={Users} label="Público" value={publicoAlvo} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoChip({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg bg-card/80 backdrop-blur-sm border border-border/70 px-3 py-2">
      <div className="h-7 w-7 rounded-md bg-primary-soft flex items-center justify-center shrink-0">
        <Icon className="h-3.5 w-3.5 text-primary-deep" />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
        <div className="text-xs text-foreground font-medium truncate">
          {value}
        </div>
      </div>
    </div>
  );
}
