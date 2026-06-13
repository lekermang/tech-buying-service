import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";

const SALES_PLAN_URL = "https://functions.poehali.dev/2503599d-a182-40db-ab15-788c4c653872";

type HotPoint = {
  day: number;
  label: string;
  amount: number;
  desc: string;
  color: "red" | "orange";
  days_left: number;
  is_today: boolean;
};

type PlanData = {
  today: string;
  day_num: number;
  day: {
    repair: number; sales: number; gold: number; total: number;
    target: number; pct: number; status: "ok" | "warning" | "danger";
  };
  month: {
    repair: number; sales: number; gold: number;
    total: number; target: number; pct: number; days_passed: number;
  };
  norms: {
    purchase_today: number; purchase_min: number; purchase_ok: boolean;
    sales_today: number; sales_min: number; sales_ok: boolean;
  };
  hot_points: HotPoint[];
};

function fmtRub(n: number) {
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(n);
}

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return `${n}`;
}

function Bar({ pct, status }: { pct: number; status: "ok" | "warning" | "danger" }) {
  const color =
    status === "ok"      ? "from-[#4ade80] to-[#22c55e]" :
    status === "warning" ? "from-[#facc15] to-[#eab308]" :
                           "from-[#f87171] to-[#ef4444]";
  return (
    <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
      <div className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-700`}
        style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  );
}

export default function SalesPlanCard({ token }: { token: string }) {
  const [data, setData] = useState<PlanData | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch(SALES_PLAN_URL, { headers: { "X-Employee-Token": token } })
      .then(r => r.json())
      .then(d => { if (!d.error) setData(d); });
  }, [token]);

  if (!data) return null;

  const { day, month, norms, hot_points } = data;

  const sc =
    day.status === "ok"      ? "text-green-400" :
    day.status === "warning" ? "text-yellow-400" :
                               "text-red-400";

  const nearest = hot_points.find(h => h.days_left <= 7);

  return (
    <div className="rounded-xl border border-[#1F1F1F] bg-gradient-to-br from-[#111111] to-[#0C0C0C] p-4 space-y-3">

      {/* Строка заголовка */}
      <div className="flex items-center gap-2">
        <Icon name="Target" size={14} className="text-[#FFD700]" />
        <span className="text-xs font-bold text-white/60 uppercase tracking-wider">План месяца</span>
        <span className="ml-auto text-[11px] text-white/30">{data.day_num} / 30 дн.</span>
      </div>

      {/* ── ДЕНЬ ─────────────────────────────────────── */}
      <div className="space-y-1.5">
        <div className="flex items-end justify-between">
          <div>
            <span className={`text-2xl font-black tabular-nums ${sc}`}>{fmtRub(day.total)}</span>
            <span className="text-[11px] text-white/30 ml-2">сегодня</span>
          </div>
          <span className="text-[11px] text-white/40 tabular-nums">план {fmtRub(day.target)}</span>
        </div>
        <Bar pct={day.pct} status={day.status} />

        {/* Разбивка */}
        <div className="flex gap-3 pt-0.5">
          {[
            { label: "Ремонт", value: day.repair, color: "text-blue-400"   },
            { label: "Б/У",    value: day.sales,  color: "text-purple-400" },
            { label: "Золото", value: day.gold,   color: "text-yellow-400" },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex items-center gap-1">
              <span className={`text-[11px] font-bold tabular-nums ${color}`}>{fmt(value)}</span>
              <span className="text-[10px] text-white/30">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── НОРМЫ ────────────────────────────────────── */}
      <div className="flex gap-2">
        {[
          { label: "Закупка", fact: norms.purchase_today, min: norms.purchase_min, ok: norms.purchase_ok },
          { label: "Продажи", fact: norms.sales_today,    min: norms.sales_min,    ok: norms.sales_ok    },
        ].map(({ label, fact, min, ok }) => (
          <div key={label} className={`flex-1 rounded-lg border px-3 py-2 ${
            ok ? "border-green-500/20 bg-green-500/5" : "border-white/5 bg-white/[0.02]"
          }`}>
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[10px] text-white/40">{label}</span>
              <Icon name={ok ? "CheckCircle2" : "Circle"} size={11}
                className={ok ? "text-green-400" : "text-white/20"} />
            </div>
            <div className={`text-xs font-bold tabular-nums ${ok ? "text-green-400" : "text-white/70"}`}>
              {fmtRub(fact)}
            </div>
            <div className="text-[10px] text-white/25">{fmtRub(min)}</div>
          </div>
        ))}
      </div>

      {/* ── МЕСЯЦ ────────────────────────────────────── */}
      <div className="space-y-1.5">
        <div className="flex items-end justify-between">
          <span className="text-sm font-bold text-white tabular-nums">{fmtRub(month.total)}</span>
          <span className="text-[11px] text-white/30 tabular-nums">{month.pct}% · план {fmt(month.target)}</span>
        </div>
        <Bar
          pct={month.pct}
          status={month.pct >= 100 ? "ok" : month.pct >= 60 ? "warning" : "danger"}
        />
      </div>

      {/* ── ГОРЯЧИЕ ТОЧКИ ────────────────────────────── */}
      {hot_points.length > 0 && (
        <div className="space-y-1">
          {hot_points.slice(0, 3).map((hp, i) => (
            <div key={i} className={`flex items-center gap-2.5 rounded-lg px-3 py-2 border ${
              hp.is_today
                ? "border-red-500/50 bg-red-500/10"
                : hp.days_left <= 3
                ? "border-orange-500/25 bg-orange-500/5"
                : "border-white/5 bg-transparent"
            }`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 ${
                hp.color === "red" ? "bg-red-500/20 text-red-400" : "bg-orange-500/20 text-orange-400"
              }`}>{hp.day}</div>
              <span className="text-[11px] font-semibold text-white flex-1">{hp.label}</span>
              <span className={`text-xs font-bold tabular-nums ${
                hp.color === "red" ? "text-red-400" : "text-orange-400"
              }`}>{fmtRub(hp.amount)}</span>
              {!hp.is_today && (
                <span className="text-[10px] text-white/25">через {hp.days_left}д</span>
              )}
              {hp.is_today && (
                <span className="text-[9px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded-full uppercase tracking-wider">сегодня</span>
              )}
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
