import {
  ResponsiveContainer, LineChart, Line, AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, CartesianGrid,
} from "recharts";
import type { FinanceDay, FinanceMetrics } from "./types";
import { fmtMoney } from "./types";

const COLORS = ["#FFD700", "#34d399", "#60a5fa", "#a78bfa", "#fb7185", "#f59e0b"];

const tooltipStyle = {
  contentStyle: {
    background: "#0A0A0A",
    border: "1px solid #1F1F1F",
    borderRadius: 8,
    color: "#fff",
    fontSize: 12,
  },
  labelStyle: { color: "#FFD700", fontWeight: 600 },
  itemStyle: { color: "#fff" },
};

export function RevenueProfitChart({ daily }: { daily: FinanceDay[] }) {
  return (
    <div className="bg-gradient-to-br from-[#0E0E0E] to-[#080808] border border-[#1F1F1F] rounded-xl p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[11px] uppercase tracking-wider text-white/60 font-bold">Выручка и прибыль по дням</div>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={daily} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFD700" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#FFD700" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gProf" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34d399" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1F1F1F" />
          <XAxis dataKey="day" tick={{ fill: "#888", fontSize: 10 }} tickFormatter={(v: string) => v.slice(5)} />
          <YAxis tick={{ fill: "#888", fontSize: 10 }} tickFormatter={fmtMoney} />
          <Tooltip {...tooltipStyle} formatter={(v: number) => fmtMoney(v) + " ₽"} />
          <Legend wrapperStyle={{ fontSize: 11, color: "#aaa" }} />
          <Area name="Выручка" type="monotone" dataKey="revenue" stroke="#FFD700" fill="url(#gRev)" strokeWidth={2} />
          <Area name="Прибыль" type="monotone" dataKey="profit" stroke="#34d399" fill="url(#gProf)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StructureChart({ metrics }: { metrics: FinanceMetrics }) {
  const data = [
    { name: "Ремонт", value: metrics.breakdown.repair.revenue },
    { name: "Золото", value: metrics.breakdown.gold.revenue },
    { name: "Б/У техника", value: metrics.breakdown.slshop.revenue },
    { name: "Ломбард %", value: metrics.breakdown.pawn.revenue },
  ].filter(x => x.value > 0);

  return (
    <div className="bg-gradient-to-br from-[#0E0E0E] to-[#080808] border border-[#1F1F1F] rounded-xl p-3">
      <div className="text-[11px] uppercase tracking-wider text-white/60 font-bold mb-2">Структура выручки</div>
      {data.length === 0 ? (
        <div className="h-[200px] flex items-center justify-center text-white/30 text-xs">Нет данных за период</div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="#0A0A0A" />)}
            </Pie>
            <Tooltip {...tooltipStyle} formatter={(v: number) => fmtMoney(v) + " ₽"} />
            <Legend wrapperStyle={{ fontSize: 10, color: "#aaa" }} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export function CostsBreakdownChart({ metrics }: { metrics: FinanceMetrics }) {
  const data = [
    { name: "Перем.", val: metrics.variable_costs },
    { name: "Пост.", val: metrics.fixed_costs },
    { name: "Налог", val: metrics.tax },
    { name: "Чист.", val: Math.max(0, metrics.net_profit) },
  ];
  return (
    <div className="bg-gradient-to-br from-[#0E0E0E] to-[#080808] border border-[#1F1F1F] rounded-xl p-3">
      <div className="text-[11px] uppercase tracking-wider text-white/60 font-bold mb-2">Куда уходит выручка</div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1F1F1F" />
          <XAxis dataKey="name" tick={{ fill: "#888", fontSize: 10 }} />
          <YAxis tick={{ fill: "#888", fontSize: 10 }} tickFormatter={fmtMoney} />
          <Tooltip {...tooltipStyle} formatter={(v: number) => fmtMoney(v) + " ₽"} />
          <Bar dataKey="val" radius={[6, 6, 0, 0]}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ByDirectionChart({ daily }: { daily: FinanceDay[] }) {
  return (
    <div className="bg-gradient-to-br from-[#0E0E0E] to-[#080808] border border-[#1F1F1F] rounded-xl p-3">
      <div className="text-[11px] uppercase tracking-wider text-white/60 font-bold mb-2">Выручка по направлениям</div>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={daily} stackOffset="sign">
          <CartesianGrid strokeDasharray="3 3" stroke="#1F1F1F" />
          <XAxis dataKey="day" tick={{ fill: "#888", fontSize: 10 }} tickFormatter={(v: string) => v.slice(5)} />
          <YAxis tick={{ fill: "#888", fontSize: 10 }} tickFormatter={fmtMoney} />
          <Tooltip {...tooltipStyle} formatter={(v: number) => fmtMoney(v) + " ₽"} />
          <Legend wrapperStyle={{ fontSize: 11, color: "#aaa" }} />
          <Bar name="Ремонт" dataKey="repair_rev" stackId="a" fill="#FFD700" />
          <Bar name="Золото" dataKey="gold_rev" stackId="a" fill="#34d399" />
          <Bar name="Б/У" dataKey="sl_rev" stackId="a" fill="#60a5fa" />
          <Bar name="Ломбард %" dataKey="pawn_int" stackId="a" fill="#a78bfa" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MarginsChart({ metrics }: { metrics: FinanceMetrics }) {
  const data = [
    { name: "Валовая", v: metrics.gross_margin_pct },
    { name: "Опер.", v: metrics.operating_margin_pct },
    { name: "Чистая", v: metrics.net_margin_pct },
    { name: "Контр.", v: metrics.contribution_margin_pct },
  ];
  return (
    <div className="bg-gradient-to-br from-[#0E0E0E] to-[#080808] border border-[#1F1F1F] rounded-xl p-3">
      <div className="text-[11px] uppercase tracking-wider text-white/60 font-bold mb-2">Маржинальность, %</div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1F1F1F" />
          <XAxis dataKey="name" tick={{ fill: "#888", fontSize: 10 }} />
          <YAxis tick={{ fill: "#888", fontSize: 10 }} tickFormatter={(v) => v + "%"} />
          <Tooltip {...tooltipStyle} formatter={(v: number) => v.toFixed(1) + "%"} />
          <Line type="monotone" dataKey="v" stroke="#FFD700" strokeWidth={2} dot={{ fill: "#FFD700", r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
