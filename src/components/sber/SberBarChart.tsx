import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis } from "recharts";

export type SberBarPoint = { label: string; value: number };

interface Props {
  data: SberBarPoint[];
  height?: number;
  unit?: string;
}

const fmt = (n: number) => Math.round(n).toLocaleString("ru-RU");

export default function SberBarChart({ data, height = 140, unit = "₽" }: Props) {
  if (data.length === 0) return null;
  const last = data.length - 1;
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
          <XAxis dataKey="label" axisLine={false} tickLine={false} interval="preserveStartEnd"
            tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }} />
          <Tooltip cursor={false}
            contentStyle={{ background: "#2a2a2a", border: "none", borderRadius: 12, color: "#fff", fontSize: 12 }}
            labelStyle={{ color: "rgba(255,255,255,0.6)" }}
            formatter={(v: number) => [`${fmt(v)} ${unit}`, ""]} separator="" />
          <Bar dataKey="value" radius={8} maxBarSize={28}>
            {data.map((_, i) => (
              <Cell key={i} fill={i === last ? "#7ed321" : "rgba(255,255,255,0.22)"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
