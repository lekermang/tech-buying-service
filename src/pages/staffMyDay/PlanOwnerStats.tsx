import type { PlanData } from "./SalesPlanCard";
import Icon from "@/components/ui/icon";

function fmtRub(n: number) {
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(n);
}
function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return `${n}`;
}

export default function PlanOwnerStats({ data }: { data: PlanData }) {
  const { day, month, hot_points, daily_chart } = data;

  // ── График: максимум для шкалы ────────────────────────────────
  const maxVal = Math.max(...daily_chart.map(d => d.total), month.target / 30 * 2, 1);

  // ── Разбивка по направлениям (месяц) ─────────────────────────
  const dirs = [
    { label: "Ремонт",  month: month.repair, today: day.repair, color: "bg-blue-500",   text: "text-blue-400",   target: Math.round(month.target / 3) },
    { label: "Б/У",     month: month.sales,  today: day.sales,  color: "bg-purple-500", text: "text-purple-400", target: Math.round(month.target / 3) },
    { label: "Золото",  month: month.gold,   today: day.gold,   color: "bg-yellow-500", text: "text-yellow-400", target: Math.round(month.target / 3) },
  ];

  return (
    <div className="space-y-3 mt-3">

      {/* ── ПРОГНОЗ И KPI ─────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-[#1F1F1F] bg-gradient-to-br from-[#111] to-[#0C0C0C] p-3">
          <div className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Прогноз на конец месяца</div>
          <div className={`text-xl font-black tabular-nums ${
            month.forecast >= month.target ? "text-green-400" : month.forecast >= month.target * 0.7 ? "text-yellow-400" : "text-red-400"
          }`}>{fmt(month.forecast)}</div>
          <div className="text-[10px] text-white/30 mt-0.5">план {fmt(month.target)}</div>
        </div>
        <div className="rounded-xl border border-[#1F1F1F] bg-gradient-to-br from-[#111] to-[#0C0C0C] p-3">
          <div className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Средний день</div>
          <div className="text-xl font-black tabular-nums text-white">
            {fmt(month.days_passed ? Math.round(month.total / month.days_passed) : 0)}
          </div>
          <div className="text-[10px] text-white/30 mt-0.5">норма {fmt(30_000)}</div>
        </div>
      </div>

      {/* ── ГРАФИК ФАКТ VS ПЛАН ───────────────────────────── */}
      {daily_chart.length > 0 && (
        <div className="rounded-xl border border-[#1F1F1F] bg-gradient-to-br from-[#111] to-[#0C0C0C] p-4">
          <div className="flex items-center gap-2 mb-3">
            <Icon name="BarChart2" size={13} className="text-[#FFD700]" />
            <span className="text-[11px] font-bold text-white/60 uppercase tracking-wider">Факт по дням</span>
            <div className="ml-auto flex items-center gap-3 text-[10px] text-white/40">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#FFD700]/60 inline-block" />факт</span>
              <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-white/20 inline-block" />план</span>
            </div>
          </div>
          <div className="flex items-end gap-[3px] h-24">
            {daily_chart.map((d) => {
              const barH  = Math.round((d.total / maxVal) * 96);
              const planH = Math.round((d.plan  / maxVal) * 96);
              const ok    = d.total >= d.plan;
              const isToday = d.day === data.day_num;
              return (
                <div key={d.day} className="flex-1 flex flex-col items-center justify-end gap-[1px] group relative" title={`${d.day}: ${fmtRub(d.total)}`}>
                  {/* план — горизонтальная черта */}
                  <div className="absolute w-full" style={{ bottom: `${planH}px` }}>
                    <div className="w-full border-t border-dashed border-white/15" />
                  </div>
                  {/* бар */}
                  <div
                    className={`w-full rounded-t-[2px] transition-all ${
                      isToday ? "bg-[#FFD700]/80" : ok ? "bg-green-500/60" : "bg-red-500/50"
                    }`}
                    style={{ height: `${Math.max(barH, 2)}px` }}
                  />
                </div>
              );
            })}
          </div>
          {/* Ось X — числа месяца */}
          <div className="flex gap-[3px] mt-1">
            {daily_chart.map((d) => (
              <div key={d.day} className={`flex-1 text-center text-[8px] tabular-nums ${d.day === data.day_num ? "text-[#FFD700]" : "text-white/20"}`}>
                {d.day % 5 === 0 || d.day === 1 ? d.day : ""}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── РАЗБИВКА ПО НАПРАВЛЕНИЯМ ─────────────────────── */}
      <div className="rounded-xl border border-[#1F1F1F] bg-gradient-to-br from-[#111] to-[#0C0C0C] p-4">
        <div className="flex items-center gap-2 mb-3">
          <Icon name="PieChart" size={13} className="text-[#FFD700]" />
          <span className="text-[11px] font-bold text-white/60 uppercase tracking-wider">По направлениям</span>
        </div>
        <div className="space-y-3">
          {dirs.map(({ label, month: m, today: t, color, text }) => {
            const pct = Math.min(Math.round(m / month.target * 100 * 3), 100);
            return (
              <div key={label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-white/60">{label}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-bold tabular-nums ${text}`}>{fmtRub(t)}</span>
                    <span className="text-[10px] text-white/30">сегодня</span>
                    <span className={`text-xs font-bold tabular-nums ${text}`}>{fmtRub(m)}</span>
                    <span className="text-[10px] text-white/30">месяц</span>
                  </div>
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div className={`h-full rounded-full ${color} opacity-70 transition-all duration-700`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── ГОРЯЧИЕ ТОЧКИ — СТАТУС ───────────────────────── */}
      <div className="rounded-xl border border-[#1F1F1F] bg-gradient-to-br from-[#111] to-[#0C0C0C] p-4">
        <div className="flex items-center gap-2 mb-3">
          <Icon name="Flame" size={13} className="text-orange-400" />
          <span className="text-[11px] font-bold text-white/60 uppercase tracking-wider">Горячие точки — статус</span>
        </div>
        <div className="space-y-2">
          {hot_points.map((hp, i) => {
            const coverPct = Math.min(Math.round(month.total / hp.amount * 100), 100);
            return (
              <div key={i} className={`rounded-lg border p-3 ${
                hp.covered ? "border-green-500/20 bg-green-500/5"
                : hp.show_alert ? hp.color === "red" ? "border-red-500/30 bg-red-500/5" : "border-orange-500/20 bg-orange-500/5"
                : "border-white/5"
              }`}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${
                      hp.color === "red" ? "bg-red-500/20 text-red-400" : "bg-orange-500/20 text-orange-400"
                    }`}>{hp.day}</div>
                    <span className="text-[12px] font-semibold text-white">{hp.label}</span>
                    {hp.days_left === 0 && (
                      <span className="text-[9px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded-full uppercase tracking-wider">сегодня</span>
                    )}
                    {hp.days_left > 0 && (
                      <span className="text-[10px] text-white/30">через {hp.days_left}д</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {hp.covered
                      ? <Icon name="CheckCircle2" size={14} className="text-green-400" />
                      : <Icon name="AlertCircle" size={14} className={hp.color === "red" ? "text-red-400" : "text-orange-400"} />
                    }
                    <span className={`text-xs font-bold tabular-nums ${hp.covered ? "text-green-400" : "text-white/70"}`}>
                      {fmtRub(hp.amount)}
                    </span>
                  </div>
                </div>
                {/* прогресс покрытия */}
                <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-700 ${
                    hp.covered ? "bg-green-500" : hp.color === "red" ? "bg-red-500/70" : "bg-orange-500/70"
                  }`} style={{ width: `${coverPct}%` }} />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-white/30">накоплено {fmtRub(Math.min(month.total, hp.amount))}</span>
                  <span className={`text-[10px] font-bold ${hp.covered ? "text-green-400" : "text-white/40"}`}>{coverPct}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
