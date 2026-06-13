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
    repair: number; sales: number; gold: number; purchase: number;
    total: number; target: number; pct: number;
    expected_pace: number; days_passed: number;
  };
  norms: {
    purchase_today: number; purchase_min: number; purchase_ok: boolean;
    sales_today: number; sales_min: number; sales_ok: boolean;
  };
  hot_points: HotPoint[];
};

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return `${n}`;
}

function fmtRub(n: number) {
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(n);
}

function ProgressBar({ pct, status }: { pct: number; status: "ok" | "warning" | "danger" }) {
  const color =
    status === "ok"      ? "from-[#4ade80] to-[#22c55e]" :
    status === "warning" ? "from-[#facc15] to-[#eab308]" :
                           "from-[#f87171] to-[#ef4444]";
  const capped = Math.min(pct, 100);
  return (
    <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
      <div
        className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-700`}
        style={{ width: `${capped}%` }}
      />
    </div>
  );
}

function Norm({ label, fact, min, ok }: { label: string; fact: number; min: number; ok: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2 py-1.5 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-1.5">
        <Icon name={ok ? "CheckCircle2" : "AlertCircle"} size={13}
          className={ok ? "text-green-400" : "text-yellow-400"} />
        <span className="text-[11px] text-white/60">{label}</span>
      </div>
      <div className="flex items-center gap-1.5 text-[11px]">
        <span className={`font-bold tabular-nums ${ok ? "text-green-400" : "text-yellow-300"}`}>{fmtRub(fact)}</span>
        <span className="text-white/30">/ мин {fmtRub(min)}</span>
      </div>
    </div>
  );
}

export default function SalesPlanCard({ token }: { token: string }) {
  const [data, setData]       = useState<PlanData | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen]       = useState(true);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch(SALES_PLAN_URL, { headers: { "X-Employee-Token": token } })
      .then(r => r.json())
      .then(d => { if (!d.error) setData(d); })
      .finally(() => setLoading(false));
  }, [token]);

  if (loading && !data) return (
    <div className="rounded-xl border border-[#1F1F1F] bg-gradient-to-br from-[#111] to-[#0C0C0C] p-4 flex items-center gap-2 text-white/40 text-xs">
      <Icon name="Loader" size={14} className="animate-spin text-[#FFD700]" />
      Загружаю план продаж…
    </div>
  );
  if (!data) return null;

  const { day, month, norms, hot_points } = data;

  const statusColor =
    day.status === "ok"      ? "text-green-400" :
    day.status === "warning" ? "text-yellow-400" :
                               "text-red-400";

  const statusLabel =
    day.status === "ok"      ? "В плане" :
    day.status === "warning" ? "Ниже минимума" :
                               "Убыток";

  const urgentHot = hot_points.filter(h => h.days_left <= 5);

  return (
    <div className="rounded-xl border border-[#1F1F1F] bg-gradient-to-br from-[#111111] to-[#0C0C0C] overflow-hidden">

      {/* Заголовок */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-4 py-3 hover:bg-white/[0.02] transition"
      >
        <Icon name="TrendingUp" size={15} className="text-[#FFD700]" />
        <span className="text-sm font-bold text-white flex-1 text-left">План продаж</span>

        {/* Статус-бейдж */}
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
          day.status === "ok"      ? "border-green-500/40 bg-green-500/10 text-green-400" :
          day.status === "warning" ? "border-yellow-500/40 bg-yellow-500/10 text-yellow-400" :
                                     "border-red-500/40 bg-red-500/10 text-red-400"
        }`}>
          {statusLabel}
        </span>

        {urgentHot.length > 0 && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-500/40 bg-red-500/10 text-red-400 flex items-center gap-1">
            <Icon name="Flame" size={10} />
            {urgentHot.length}
          </span>
        )}

        <Icon name={open ? "ChevronUp" : "ChevronDown"} size={14} className="text-white/30" />
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4">

          {/* ── ДЕНЬ ─────────────────────────────────────────── */}
          <div className="space-y-2">
            <div className="flex items-end justify-between">
              <div>
                <div className={`text-2xl font-black tabular-nums ${statusColor}`}>
                  {fmtRub(day.total)}
                </div>
                <div className="text-[11px] text-white/40 mt-0.5">
                  сегодня · цель {fmtRub(day.target)}
                </div>
              </div>
              <div className={`text-xl font-black tabular-nums ${statusColor}`}>
                {day.pct}%
              </div>
            </div>
            <ProgressBar pct={day.pct} status={day.status} />

            {/* Разбивка по направлениям */}
            <div className="grid grid-cols-3 gap-2 mt-2">
              {[
                { label: "Ремонт",  value: day.repair, icon: "Wrench",      color: "text-blue-400"   },
                { label: "Б/У",     value: day.sales,  icon: "Smartphone",  color: "text-purple-400" },
                { label: "Золото",  value: day.gold,   icon: "Gem",         color: "text-yellow-400" },
              ].map(({ label, value, icon, color }) => (
                <div key={label} className="rounded-lg border border-white/5 bg-white/[0.03] p-2 text-center">
                  <Icon name={icon} size={12} className={`${color} mx-auto mb-1`} />
                  <div className={`text-xs font-bold tabular-nums ${color}`}>{fmt(value)}</div>
                  <div className="text-[10px] text-white/35">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── НОРМЫ ЗАКУПКИ И ПРОДАЖ ───────────────────────── */}
          <div className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-1">
            <div className="text-[10px] text-white/30 uppercase tracking-wider mb-1 pt-1">Нормы дня</div>
            <Norm label="Закупка б/у" fact={norms.purchase_today} min={norms.purchase_min} ok={norms.purchase_ok} />
            <Norm label="Продажи б/у" fact={norms.sales_today}    min={norms.sales_min}    ok={norms.sales_ok}    />
          </div>

          {/* ── МЕСЯЦ ────────────────────────────────────────── */}
          <div className="space-y-2">
            <div className="flex items-end justify-between">
              <div>
                <div className="text-base font-bold text-white tabular-nums">{fmtRub(month.total)}</div>
                <div className="text-[11px] text-white/40">
                  месяц · {month.days_passed} из 30 дн. · цель {fmt(month.target)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-white/70 tabular-nums">{month.pct}%</div>
                <div className="text-[10px] text-white/35">
                  темп → {fmtRub(month.expected_pace)}
                </div>
              </div>
            </div>
            <ProgressBar
              pct={month.pct}
              status={month.pct >= 100 ? "ok" : month.pct >= 60 ? "warning" : "danger"}
            />
          </div>

          {/* ── ГОРЯЧИЕ ТОЧКИ ────────────────────────────────── */}
          {hot_points.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[10px] text-white/30 uppercase tracking-wider flex items-center gap-1">
                <Icon name="Flame" size={10} className="text-orange-400" />
                Горячие точки
              </div>
              {hot_points.slice(0, 4).map((hp, i) => (
                <div
                  key={i}
                  className={`rounded-lg border px-3 py-2 flex items-center gap-3 ${
                    hp.is_today
                      ? "border-red-500/50 bg-red-500/10"
                      : hp.days_left <= 3
                      ? "border-orange-500/30 bg-orange-500/5"
                      : "border-white/5 bg-white/[0.02]"
                  }`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-black
                    ${hp.color === "red" ? "bg-red-500/20 text-red-400" : "bg-orange-500/20 text-orange-400"}`}>
                    {hp.day}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-bold text-white flex items-center gap-1">
                      {hp.label}
                      {hp.is_today && (
                        <span className="text-[9px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 rounded-full uppercase tracking-wider">сегодня</span>
                      )}
                    </div>
                    <div className="text-[10px] text-white/45 truncate">{hp.desc}</div>
                  </div>
                  <div className={`text-xs font-bold tabular-nums flex-shrink-0 ${
                    hp.color === "red" ? "text-red-400" : "text-orange-400"
                  }`}>
                    {fmtRub(hp.amount)}
                  </div>
                  {!hp.is_today && (
                    <div className="text-[10px] text-white/30 flex-shrink-0">
                      через {hp.days_left}д
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── Подсказка для команды ────────────────────────── */}
          {day.status !== "ok" && (
            <div className={`rounded-lg border px-3 py-2 flex gap-2 items-start text-[11px]
              ${day.status === "danger"
                ? "border-red-500/30 bg-red-500/5 text-red-300"
                : "border-yellow-500/30 bg-yellow-500/5 text-yellow-300"}`}>
              <Icon name="AlertTriangle" size={13} className="mt-0.5 flex-shrink-0" />
              <span>
                {day.status === "danger"
                  ? `Внимание: сегодня магазин работает в убыток. Нужно ещё ${fmtRub(day.target - day.total)} чтобы выйти в 0.`
                  : `До минимума дня (${fmtRub(day.target)}) не хватает ${fmtRub(day.target - day.total)}.`}
              </span>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
