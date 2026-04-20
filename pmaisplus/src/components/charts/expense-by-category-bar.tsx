"use client";

import { useRouter } from "next/navigation";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { brlCompact, brl } from "@/lib/format";

type Row = {
  id: string;
  name: string;
  planejado: number;
  contratado: number;
  pago: number;
};

export function ExpenseByCategoryBar({ data }: { data: Row[] }) {
  const router = useRouter();
  const short = data.map((d) => ({ ...d, label: shorten(d.name) }));

  function jumpTo(id: string | null | undefined) {
    if (!id) return;
    router.push(`/despesas#cat-${id}`);
  }

  return (
    <div className="h-96 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={short}
          layout="vertical"
          margin={{ top: 8, right: 24, bottom: 8, left: 24 }}
          barCategoryGap={8}
          onClick={(state) => {
            type ClickPayload = { activePayload?: { payload: Row }[] };
            const p = (state as ClickPayload)?.activePayload?.[0]?.payload;
            jumpTo(p?.id);
          }}
          style={{ cursor: "pointer" }}
        >
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" horizontal={false} />
          <XAxis
            type="number"
            stroke="var(--muted-foreground)"
            fontSize={11}
            tickFormatter={brlCompact}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="label"
            stroke="var(--muted-foreground)"
            fontSize={11}
            width={170}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)" }}
            contentStyle={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ fontWeight: 600, color: "var(--foreground)" }}
            formatter={(value, key) => [brl(Number(value)), tooltipLabel(String(key))]}
          />
          <Bar dataKey="planejado" fill="var(--chart-2)" radius={[0, 4, 4, 0]}>
            {short.map((_, i) => (
              <Cell key={i} fillOpacity={0.18} />
            ))}
          </Bar>
          <Bar dataKey="contratado" fill="var(--chart-1)" radius={[0, 4, 4, 0]}>
            {short.map((_, i) => (
              <Cell key={i} fillOpacity={0.5} />
            ))}
          </Bar>
          <Bar dataKey="pago" fill="var(--chart-1)" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <p className="text-[10px] text-muted-foreground text-center mt-1">
        Clique numa categoria para abrir em Despesas
      </p>
    </div>
  );
}

function shorten(s: string): string {
  return s.replace(/\(.*\)/, "").trim();
}

function tooltipLabel(key: string): string {
  switch (key) {
    case "planejado":
      return "Planejado";
    case "contratado":
      return "Contratado";
    case "pago":
      return "Pago";
    default:
      return key;
  }
}
