const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

const BRL_CENTS = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 2,
});

const PCT = new Intl.NumberFormat("pt-BR", {
  style: "percent",
  maximumFractionDigits: 0,
});

const DATE_BR = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export function brl(n: number | null | undefined, cents = false): string {
  return (cents ? BRL_CENTS : BRL).format(n ?? 0);
}

export function brlCompact(n: number | null | undefined): string {
  const value = n ?? 0;
  if (Math.abs(value) >= 1_000_000) {
    return `R$ ${(value / 1_000_000).toFixed(2).replace(".", ",")}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `R$ ${(value / 1_000).toFixed(0)}k`;
  }
  return BRL.format(value);
}

export function pct(
  value: number | null | undefined,
  total: number | null | undefined,
): string {
  if (!total) return "—";
  return PCT.format((value ?? 0) / total);
}

export function pctNumber(
  value: number | null | undefined,
  total: number | null | undefined,
): number {
  if (!total) return 0;
  return Math.round(((value ?? 0) / total) * 100);
}

export function dateBR(d: Date | null | undefined): string {
  if (!d) return "—";
  return DATE_BR.format(d instanceof Date ? d : new Date(d));
}

export function eventPeriod(start?: Date | null, end?: Date | null): string {
  if (!start || !end) return "—";
  const s = start instanceof Date ? start : new Date(start);
  const e = end instanceof Date ? end : new Date(end);
  const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear();
  if (sameMonth) {
    const dayFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit" });
    const tail = new Intl.DateTimeFormat("pt-BR", { month: "short", year: "numeric" });
    return `${dayFmt.format(s)}–${dayFmt.format(e)} ${tail.format(e)}`;
  }
  return `${DATE_BR.format(s)} – ${DATE_BR.format(e)}`;
}
