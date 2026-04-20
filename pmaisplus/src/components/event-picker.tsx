"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Calendar, Check, ChevronsUpDown } from "lucide-react";
import { setActiveEvent } from "@/app/(app)/event-actions";

export type EventOption = {
  id: string;
  name: string;
  cliente: string | null;
  startDate: Date | null;
  endDate: Date | null;
};

export function EventPicker({
  events,
  activeId,
}: {
  events: EventOption[];
  activeId: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const rootRef = useRef<HTMLDivElement>(null);

  const active = events.find((e) => e.id === activeId) ?? events[0];

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  function choose(id: string) {
    if (id === activeId) {
      setOpen(false);
      return;
    }
    startTransition(async () => {
      await setActiveEvent(id);
      setOpen(false);
    });
  }

  if (!active) {
    return (
      <div className="px-3 pt-3">
        <div className="rounded-lg border border-dashed border-sidebar-border bg-sidebar-accent/20 px-3 py-3 text-[11px] text-sidebar-muted">
          Nenhum evento.
          <br />
          Importe via <span className="text-primary">/admin/importar</span>.
        </div>
      </div>
    );
  }

  return (
    <div ref={rootRef} className="px-3 pt-3 relative">
      <div className="text-[9px] font-bold uppercase tracking-widest text-sidebar-muted mb-1 px-1">
        Evento ativo
      </div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={pending}
        className={
          "w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-sidebar-border bg-sidebar-accent/25 text-left text-sm text-sidebar-foreground hover:bg-sidebar-accent/40 transition-colors " +
          (open ? "ring-2 ring-primary/40" : "")
        }
      >
        <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
        <span className="flex-1 min-w-0 truncate font-medium">
          {pending ? "Trocando…" : active.name}
        </span>
        <ChevronsUpDown className="h-3.5 w-3.5 text-sidebar-muted shrink-0" />
      </button>

      {open && (
        <div className="absolute left-3 right-3 top-full mt-1 z-20 rounded-lg border border-sidebar-border bg-sidebar shadow-xl overflow-hidden">
          <ul className="max-h-72 overflow-y-auto py-1">
            {events.map((e) => {
              const selected = e.id === active.id;
              return (
                <li key={e.id}>
                  <button
                    type="button"
                    onClick={() => choose(e.id)}
                    className={
                      "w-full flex items-start gap-2 px-3 py-2 text-left text-sm transition-colors " +
                      (selected
                        ? "bg-sidebar-accent/40 text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/85 hover:bg-white/5 hover:text-sidebar-foreground")
                    }
                  >
                    <Check
                      className={
                        "h-3.5 w-3.5 mt-[3px] shrink-0 " +
                        (selected ? "text-primary" : "text-transparent")
                      }
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{e.name}</div>
                      {e.cliente && (
                        <div className="text-[11px] text-sidebar-muted truncate">
                          {e.cliente}
                        </div>
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
