"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { brl } from "@/lib/format";

type Row = {
  type: "INSCRICAO" | "PATROCINIO" | "OUTRAS";
  planejado: number;
  realizado: number;
};

const LABEL: Record<Row["type"], string> = {
  INSCRICAO: "Inscrições",
  PATROCINIO: "Patrocínio",
  OUTRAS: "Outras receitas",
};

const COLOR: Record<Row["type"], string> = {
  PATROCINIO: "var(--chart-2)",
  INSCRICAO: "var(--chart-1)",
  OUTRAS: "var(--chart-5)",
};

export function RevenueByTypeDonut({ data }: { data: Row[] }) {
  const pieData = data.map((d) => ({
    name: LABEL[d.type],
    value: d.realizado,
    planejado: d.planejado,
    type: d.type,
  }));

  const total = pieData.reduce((s, d) => s + d.value, 0);

  return (
    <div className="h-64 w-full relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={95}
            paddingAngle={2}
            dataKey="value"
            stroke="var(--card)"
            strokeWidth={2}
          >
            {pieData.map((entry) => (
              <Cell key={entry.type} fill={COLOR[entry.type]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(value) => [brl(Number(value)), "Realizado"]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
          Realizado
        </div>
        <div className="text-xl font-semibold">{brl(total)}</div>
      </div>
    </div>
  );
}
