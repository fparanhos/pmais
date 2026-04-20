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
    <div className="px-8 pt-8 pb-4">
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div>
          <div className="text-[11px] font-bold tracking-widest uppercase text-primary mb-1">
            Evento ativo
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{name}</h1>
          {cliente && (
            <div className="text-sm text-muted-foreground mt-0.5">
              {cliente}
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
          {(startDate || endDate) && (
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {eventPeriod(startDate, endDate)}
            </div>
          )}
          {local && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              {local}
            </div>
          )}
          {publicoAlvo && (
            <div className="flex items-center gap-1.5 max-w-xs truncate">
              <Users className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{publicoAlvo}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
