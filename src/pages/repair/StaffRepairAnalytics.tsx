import Icon from "@/components/ui/icon";
import { STATUSES, DayStat, fmtDay } from "./types";
import type { Period } from "./staffTab/staffTabTypes";

type RepairAnalytics = {
  total: number; done: number; cancelled: number; ready: number;
  in_progress: number; waiting_parts: number; new: number;
  pending_approval?: number;
  revenue: number; costs: number; profit: number; master_total: number;
  avg_check?: number;
  avg_repair_hours?: number;
  conversion?: number;
  paid_count?: number;
  daily: { day: string; total: number; done: number; revenue: number; costs: number; profit: number }[];
};

const money = (v: number | null | undefined) =>
  v != null ? v.toLocaleString("ru-RU") + " ₽" : "—";

// Форматирование длительности в часах: 36ч → "1д 12ч", 4.5 → "4ч 30м"
const fmtHours = (h: number | null | undefined): string => {
  if (h == null || !Number.isFinite(h) || h <= 0) return "—";
  if (h < 1) return `${Math.round(h * 60)} мин`;
  if (h < 24) {
    const hours = Math.floor(h);
    const mins = Math.round((h - hours) * 60);
    return mins > 0 ? `${hours}ч ${mins}м` : `${hours}ч`;
  }
  const days = Math.floor(h / 24);
  const hh = Math.round(h - days * 24);
  return hh > 0 ? `${days}д ${hh}ч` : `${days}д`;
};

type Props = {
  analytics: RepairAnalytics | null;
  analyticsLoading: boolean;
  period: Period;
  stats: DayStat[];
  dateFrom?: string;
  dateTo?: string;
  onPeriodChange: (p: Period) => void;
  onDateFromChange?: (v: string) => void;
  onDateToChange?: (v: string) => void;
  onRefresh: () => void;
  onShowHistory: () => void;
  onShowOrders?: (params: { statuses: string[]; title: string; accent: "revenue" | "costs" | "master" | "profit" | "status" }) => void;
};

export default function StaffRepairAnalytics({
  analytics, analyticsLoading, period, stats,
  dateFrom = "", dateTo = "",
  onPeriodChange, onDateFromChange, onDateToChange,
  onRefresh, onShowHistory, onShowOrders,
}: Props) {
  const DONE_STATUSES = ["done", "warranty", "ready"];
  const openFinance = (accent: "revenue" | "costs" | "master" | "profit", title: string) =>
    onShowOrders?.({ statuses: DONE_STATUSES, title, accent });
  const openStatus = (key: string, label: string) =>
    onShowOrders?.({ statuses: key === "new" ? ["new", "accepted"] : [key], title: label, accent: "status" });
  // Быстрые пресеты для произвольных периодов: месяц этого года, прошлый месяц, конкретный год
  const today = new Date();
  const fmtISO = (d: Date) => d.toISOString().slice(0, 10);
  const setMonthRange = (year: number, month: number) => {
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    onDateFromChange?.(fmtISO(start));
    onDateToChange?.(fmtISO(end));
    onPeriodChange("custom");
  };
  const setYearRange = (year: number) => {
    onDateFromChange?.(`${year}-01-01`);
    onDateToChange?.(`${year}-12-31`);
    onPeriodChange("custom");
  };
  const PERIOD_LBL: Record<Period, string> = {
    day: "Сегодня", yesterday: "Вчера", week: "7 дней", month: "30 дней",
    quarter: "Квартал", year: "Год", custom: "Свой период",
  };

  return (
    <div className="p-3 sm:p-4 overflow-y-auto">
      {/* ── Переключатель периода — основные кнопки + произвольный диапазон ── */}
      <div className="flex gap-1.5 mb-2 items-center flex-wrap">
        {(["day", "yesterday", "week", "month", "quarter", "year"] as Period[]).map(p => {
          const lbl = PERIOD_LBL[p];
          const active = period === p;
          return (
            <button key={p} onClick={() => onPeriodChange(p)}
              title={`Период: ${lbl}`}
              className={`relative px-3 py-1.5 font-roboto text-[11px] rounded-md transition-all active:scale-95 inline-flex items-center gap-1 overflow-hidden group ${
                active
                  ? "bg-gradient-to-b from-[#FFE34D] via-[#FFD700] to-[#d4a017] text-black font-bold shadow-[0_3px_12px_rgba(255,215,0,0.4),inset_0_1px_0_rgba(255,255,255,0.55)]"
                  : "bg-gradient-to-br from-[#141414] to-[#0E0E0E] border border-[#1F1F1F] text-white/55 hover:text-[#FFD700] hover:border-[#FFD700]/40 hover:shadow-[0_0_10px_rgba(255,215,0,0.18)]"
              }`}>
              {active && <span aria-hidden className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/35 to-transparent rounded-t-md pointer-events-none" />}
              <span className="relative">{lbl}</span>
            </button>
          );
        })}
        <button onClick={() => onPeriodChange("custom")}
          title="Произвольный диапазон дат"
          className={`relative px-3 py-1.5 font-roboto text-[11px] rounded-md transition-all active:scale-95 inline-flex items-center gap-1 overflow-hidden ${
            period === "custom"
              ? "bg-gradient-to-b from-[#FFE34D] via-[#FFD700] to-[#d4a017] text-black font-bold shadow-[0_3px_12px_rgba(255,215,0,0.4),inset_0_1px_0_rgba(255,255,255,0.55)]"
              : "bg-gradient-to-br from-[#141414] to-[#0E0E0E] border border-[#1F1F1F] text-white/55 hover:text-[#FFD700] hover:border-[#FFD700]/40"
          }`}>
          <Icon name="CalendarRange" size={11} />
          <span>Свой период</span>
        </button>
        <button onClick={onShowHistory}
          title="Журнал действий по заявкам"
          className="inline-flex items-center gap-1 bg-gradient-to-br from-[#141414] to-[#0E0E0E] border border-[#1F1F1F] hover:border-[#FFD700]/40 hover:text-[#FFD700] hover:shadow-[0_0_10px_rgba(255,215,0,0.15)] text-white/55 px-3 py-1.5 font-roboto text-[11px] rounded-md transition-all active:scale-95">
          <Icon name="History" size={12} />Действия
        </button>
        <button onClick={onRefresh} disabled={analyticsLoading}
          title="Обновить данные"
          className="ml-auto text-white/40 hover:text-[#FFD700] p-2 rounded-md bg-gradient-to-br from-[#141414] to-[#0E0E0E] border border-[#1F1F1F] hover:border-[#FFD700]/40 hover:shadow-[0_0_12px_rgba(255,215,0,0.18)] transition-all active:scale-95">
          <Icon name={analyticsLoading ? "Loader" : "RefreshCw"} size={13} className={analyticsLoading ? "animate-spin text-[#FFD700]" : ""} />
        </button>
      </div>

      {/* ── Произвольный диапазон + быстрые пресеты по месяцам/годам ── */}
      {period === "custom" && (
        <div className="mb-3 rounded-lg border border-[#FFD700]/20 bg-gradient-to-br from-[#1A1A1A] via-[#141414] to-[#0E0E0E] p-2.5 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex items-center gap-1.5 text-[10px] font-roboto text-white/45 uppercase tracking-wider">
              <Icon name="CalendarRange" size={11} className="text-[#FFD700]" />
              Диапазон
            </div>
            <input type="date" value={dateFrom}
              onChange={e => onDateFromChange?.(e.target.value)}
              className="bg-[#0A0A0A] border border-[#1F1F1F] focus:border-[#FFD700]/60 text-white px-2 py-1 font-roboto text-[11px] rounded outline-none tabular-nums" />
            <span className="text-white/40 text-xs">—</span>
            <input type="date" value={dateTo}
              onChange={e => onDateToChange?.(e.target.value)}
              className="bg-[#0A0A0A] border border-[#1F1F1F] focus:border-[#FFD700]/60 text-white px-2 py-1 font-roboto text-[11px] rounded outline-none tabular-nums" />
            {(dateFrom || dateTo) && (
              <button onClick={() => { onDateFromChange?.(""); onDateToChange?.(""); }}
                title="Сбросить даты"
                className="text-white/40 hover:text-red-300 text-[11px] font-roboto px-1.5 py-0.5 rounded hover:bg-red-500/10">
                ✕ сброс
              </button>
            )}
          </div>
          {/* Быстрые пресеты — последние 12 месяцев */}
          <div className="flex flex-wrap gap-1">
            <span className="text-[9px] font-roboto text-white/35 uppercase tracking-wider self-center mr-1">Месяц:</span>
            {Array.from({ length: 12 }).map((_, i) => {
              const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
              const lbl = d.toLocaleDateString("ru-RU", { month: "short", year: "2-digit" });
              return (
                <button key={i} onClick={() => setMonthRange(d.getFullYear(), d.getMonth())}
                  className="text-[10px] font-roboto px-2 py-0.5 rounded border border-[#1F1F1F] bg-[#0E0E0E] text-white/55 hover:text-[#FFD700] hover:border-[#FFD700]/40 transition-all">
                  {lbl}
                </button>
              );
            })}
          </div>
          {/* Быстрые пресеты — годы */}
          <div className="flex flex-wrap gap-1">
            <span className="text-[9px] font-roboto text-white/35 uppercase tracking-wider self-center mr-1">Год:</span>
            {[today.getFullYear(), today.getFullYear() - 1, today.getFullYear() - 2].map(y => (
              <button key={y} onClick={() => setYearRange(y)}
                className="text-[10px] font-roboto px-2 py-0.5 rounded border border-[#1F1F1F] bg-[#0E0E0E] text-white/55 hover:text-[#FFD700] hover:border-[#FFD700]/40 transition-all">
                {y}
              </button>
            ))}
          </div>
          {!dateFrom && !dateTo && (
            <div className="text-[10px] font-roboto text-orange-300/80 flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/25 rounded px-2 py-1">
              <Icon name="Info" size={10} />
              Выбери даты или нажми один из пресетов выше
            </div>
          )}
        </div>
      )}

      {analyticsLoading && (
        <div className="text-center py-12">
          <div className="relative inline-block">
            <span className="absolute inset-0 rounded-full bg-[#FFD700]/30 blur-md animate-pulse" />
            <Icon name="Loader" size={24} className="relative animate-spin text-[#FFD700] drop-shadow-[0_0_10px_rgba(255,215,0,0.7)]" />
          </div>
          <div className="font-roboto text-white/40 text-sm mt-2">Загружаю аналитику…</div>
        </div>
      )}

      {analytics && !analyticsLoading && (
        <>
          {/* Формула прибыли — премиум */}
          <div className="relative rounded-xl overflow-hidden mb-3">
            {/* HALO */}
            <div className="absolute -inset-1 rounded-xl pointer-events-none opacity-60" style={{ background: "radial-gradient(closest-side,rgba(255,215,0,0.15),transparent 70%)", filter: "blur(12px)" }} />
            <div className="relative bg-gradient-to-br from-[#1A1A1A] via-[#141414] to-[#0E0E0E] border border-[#FFD700]/25 p-3 rounded-xl shadow-[0_4px_18px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,215,0,0.08)]">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FFD700]/55 to-transparent pointer-events-none" />
              <div className="absolute -top-10 -left-10 w-32 h-32 rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(255,215,0,0.10)" }} />
              <div className="relative flex items-center gap-1.5 mb-2">
                <Icon name="Calculator" size={11} className="text-[#FFD700] drop-shadow-[0_0_4px_rgba(255,215,0,0.5)]" />
                <div className="font-roboto text-[#FFD700]/80 text-[10px] uppercase tracking-[0.08em] font-bold">Расчёт прибыли</div>
                {analytics.ready > 0 && (
                  <span title="Заявки в статусе «Готов» уже учитываются — прибыль не ждёт момента выдачи"
                    className="ml-auto inline-flex items-center gap-1 text-[9px] font-roboto text-[#FFD700]/85 bg-[#FFD700]/10 border border-[#FFD700]/30 rounded px-1.5 py-0.5">
                    <Icon name="CheckCircle2" size={9} />
                    + {analytics.ready} «Готов»
                  </span>
                )}
              </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={() => openFinance("revenue", "Выручка — детализация")} className="text-center hover:bg-white/5 px-1.5 py-0.5 -mx-1.5 transition-colors">
                <div className="font-oswald font-bold text-[#FFD700] text-lg">{money(analytics.revenue)}</div>
                <div className="font-roboto text-white/30 text-[9px]">выручка</div>
              </button>
              <div className="font-roboto text-white/20 text-base">−</div>
              <button onClick={() => openFinance("costs", "Закупка запчастей")} className="text-center hover:bg-white/5 px-1.5 py-0.5 -mx-1.5 transition-colors">
                <div className="font-oswald font-bold text-orange-400 text-lg">{money(analytics.costs)}</div>
                <div className="font-roboto text-white/30 text-[9px]">закупка запчастей</div>
              </button>
              {analytics.master_total > 0 && <>
                <div className="font-roboto text-white/20 text-base">−</div>
                <button onClick={() => openFinance("master", "Доход мастера")} className="text-center hover:bg-white/5 px-1.5 py-0.5 -mx-1.5 transition-colors">
                  <div className="font-oswald font-bold text-blue-400 text-lg">{money(analytics.master_total)}</div>
                  <div className="font-roboto text-white/30 text-[9px]">доход мастера</div>
                </button>
              </>}
              <div className="font-roboto text-white/20 text-base">=</div>
              <button onClick={() => openFinance("profit", "Чистая прибыль")} className="text-center hover:bg-white/5 px-1.5 py-0.5 -mx-1.5 transition-colors">
                <div className={`font-oswald font-bold text-xl ${analytics.profit - analytics.master_total >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {money(analytics.profit - analytics.master_total)}
                </div>
                <div className="font-roboto text-white/30 text-[9px]">чистая прибыль</div>
              </button>
              <div className="ml-auto">
                <div className="font-roboto text-white/20 text-[9px] text-right">маржа</div>
                <div className={`font-oswald font-bold text-base ${analytics.revenue > 0 && (analytics.profit - analytics.master_total) / analytics.revenue > 0.2 ? "text-green-400" : "text-white/50"}`}>
                  {analytics.revenue > 0 ? Math.round(((analytics.profit - analytics.master_total) / analytics.revenue) * 100) : 0}%
                </div>
              </div>
            </div>
            {/* Итого прибыль до вычета мастера */}
            {analytics.master_total > 0 && (
              <div className="mt-2 pt-2 border-t border-[#FFD700]/15 flex justify-between items-center">
                <span className="font-roboto text-white/30 text-[9px]">До вычета мастера (выручка − закупка)</span>
                <span className="font-roboto text-[#FFD700]/70 text-[10px] font-bold">{money(analytics.profit)}</span>
              </div>
            )}
            </div>
          </div>

          {/* ── Расширенные KPI: средний чек / время ремонта / конверсия / оплачено ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
            {/* Средний чек */}
            <div className="bg-gradient-to-br from-[#1A1A1A] via-[#141414] to-[#0E0E0E] border border-[#1F1F1F] p-2.5 rounded-lg">
              <div className="flex items-center gap-1 mb-0.5">
                <Icon name="Receipt" size={10} className="text-[#FFD700]/80" />
                <div className="font-roboto text-white/35 text-[9px] uppercase tracking-wider">Средний чек</div>
              </div>
              <div className="font-oswald font-bold text-lg text-[#FFD700] tabular-nums">
                {analytics.avg_check ? money(analytics.avg_check) : "—"}
              </div>
              <div className="text-[9px] text-white/30 mt-0.5">
                {analytics.done > 0 ? `${analytics.done} ремонт${analytics.done === 1 ? "" : analytics.done < 5 ? "а" : "ов"}` : "нет данных"}
              </div>
            </div>
            {/* Среднее время ремонта */}
            <div className="bg-gradient-to-br from-[#1A1A1A] via-[#141414] to-[#0E0E0E] border border-[#1F1F1F] p-2.5 rounded-lg">
              <div className="flex items-center gap-1 mb-0.5">
                <Icon name="Clock" size={10} className="text-sky-400/80" />
                <div className="font-roboto text-white/35 text-[9px] uppercase tracking-wider">Скорость</div>
              </div>
              <div className="font-oswald font-bold text-lg text-sky-300 tabular-nums">
                {fmtHours(analytics.avg_repair_hours)}
              </div>
              <div className="text-[9px] text-white/30 mt-0.5">от приёма до готовности</div>
            </div>
            {/* Конверсия */}
            <div className="bg-gradient-to-br from-[#1A1A1A] via-[#141414] to-[#0E0E0E] border border-[#1F1F1F] p-2.5 rounded-lg">
              <div className="flex items-center gap-1 mb-0.5">
                <Icon name="TrendingUp" size={10} className="text-emerald-400/80" />
                <div className="font-roboto text-white/35 text-[9px] uppercase tracking-wider">Конверсия</div>
              </div>
              <div className="font-oswald font-bold text-lg text-emerald-300 tabular-nums">
                {analytics.conversion != null ? `${analytics.conversion}%` : "—"}
              </div>
              <div className="text-[9px] text-white/30 mt-0.5">выдано из принятых</div>
            </div>
            {/* Оплачено / в работе */}
            <div className="bg-gradient-to-br from-[#1A1A1A] via-[#141414] to-[#0E0E0E] border border-[#1F1F1F] p-2.5 rounded-lg">
              <div className="flex items-center gap-1 mb-0.5">
                <Icon name="Wallet" size={10} className="text-blue-400/80" />
                <div className="font-roboto text-white/35 text-[9px] uppercase tracking-wider">Оплачено</div>
              </div>
              <div className="font-oswald font-bold text-lg text-blue-300 tabular-nums">
                {analytics.paid_count ?? 0}
                <span className="text-white/30 text-[10px] font-normal"> / {analytics.done}</span>
              </div>
              <div className="text-[9px] text-white/30 mt-0.5">
                {analytics.done ? `${Math.round(((analytics.paid_count ?? 0) / analytics.done) * 100)}% покрыто` : "нет данных"}
              </div>
            </div>
          </div>

          {/* Счётчики статусов — премиум */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            {STATUSES.map(s => {
              const val = (analytics as Record<string, unknown>)[s.key === "new" ? "new" : s.key] as number ?? 0;
              const clickable = val > 0 && !!onShowOrders;
              const colorCls = s.color.split(" ")[1];
              return (
                <button
                  key={s.key}
                  disabled={!clickable}
                  onClick={() => clickable && openStatus(s.key, s.label.replace(" ✓", ""))}
                  title={`${s.label.replace(" ✓", "")}${val > 0 ? ` — ${val} шт.` : ""}`}
                  className={`relative bg-gradient-to-br from-[#1A1A1A] via-[#141414] to-[#0E0E0E] border border-[#1F1F1F] p-2.5 rounded-lg text-center transition-all overflow-hidden group ${clickable ? "hover:border-[#FFD700]/40 hover:shadow-[0_0_14px_rgba(255,215,0,0.18)] cursor-pointer active:scale-95" : "cursor-default opacity-80"}`}
                >
                  {clickable && (
                    <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FFD700]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                  <div className="relative flex items-center justify-center gap-1 mb-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${s.dot} ${val > 0 ? "shadow-[0_0_6px_currentColor]" : ""}`} />
                    <div className={`font-oswald font-bold text-lg ${colorCls} ${val > 0 ? "drop-shadow-[0_0_4px_currentColor]" : ""}`}>{val}</div>
                  </div>
                  <div className="font-roboto text-white/45 text-[9px] uppercase tracking-wider">{s.label.replace(" ✓", "")}</div>
                </button>
              );
            })}
          </div>

          {/* График по дням — премиум */}
          {analytics.daily.length > 1 && (
            <div className="relative bg-gradient-to-br from-[#1A1A1A] via-[#141414] to-[#0E0E0E] border border-[#1F1F1F] p-3 rounded-xl shadow-[0_4px_18px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,215,0,0.04)]">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FFD700]/30 to-transparent pointer-events-none" />
              <div className="flex items-center gap-1.5 mb-2">
                <Icon name="LineChart" size={11} className="text-[#FFD700] drop-shadow-[0_0_4px_rgba(255,215,0,0.5)]" />
                <div className="font-roboto text-[#FFD700]/80 text-[10px] uppercase tracking-[0.08em] font-bold">Динамика по дням</div>
              </div>
              <div className="space-y-1.5">
                {analytics.daily.slice().reverse().map(d => {
                  const maxRev = Math.max(...analytics.daily.map(x => x.revenue), 1);
                  const barW = Math.round((d.revenue / maxRev) * 100);
                  const profitW = Math.round((Math.max(0, d.profit) / maxRev) * 100);
                  return (
                    <div key={d.day} className="flex items-center gap-2">
                      <span className="font-roboto text-[9px] text-white/30 w-10 shrink-0">
                        {new Date(d.day + "T12:00:00").toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" })}
                      </span>
                      <div className="flex-1 h-4 bg-[#0A0A0A] relative overflow-hidden rounded-sm border border-[#1F1F1F]">
                        <div className="h-full bg-gradient-to-r from-[#FFD700]/15 via-[#FFD700]/30 to-[#FFD700]/45 absolute left-0 top-0 transition-all shadow-[inset_0_1px_0_rgba(255,215,0,0.2)]" style={{ width: barW + "%" }} />
                        <div className="h-full bg-gradient-to-r from-emerald-500/30 via-emerald-500/45 to-emerald-400/55 absolute left-0 top-0 transition-all shadow-[inset_0_1px_0_rgba(16,185,129,0.3)]" style={{ width: profitW + "%" }} />
                      </div>
                      <span className="font-roboto text-[9px] text-white/40 w-16 text-right shrink-0">
                        {d.revenue > 0 ? d.revenue.toLocaleString("ru-RU") + "₽" : "—"}
                      </span>
                      <span className={`font-roboto text-[9px] w-12 text-right shrink-0 ${d.profit > 0 ? "text-green-400" : d.profit < 0 ? "text-red-400" : "text-white/20"}`}>
                        {d.profit !== 0 ? (d.profit > 0 ? "+" : "") + d.profit.toLocaleString("ru-RU") : "—"}
                      </span>
                      <span className="font-roboto text-white/20 text-[9px] w-5 text-right shrink-0">{d.done}✓</span>
                    </div>
                  );
                })}
              </div>

              {/* Итого */}
              <div className="flex gap-4 mt-3 pt-2 border-t border-[#333] text-xs font-roboto">
                <span className="text-white/30">Итого: <span className="text-white font-bold">{analytics.total}</span> заявок</span>
                <span className="text-white/30">Выдано: <span className="text-green-400 font-bold">{analytics.done}</span></span>
              </div>
            </div>
          )}

          {/* Таблица по дням (30 дней) — премиум */}
          {stats.length > 0 && (
            <div className="relative mt-3 bg-gradient-to-br from-[#1A1A1A] via-[#141414] to-[#0E0E0E] border border-[#1F1F1F] rounded-xl overflow-hidden shadow-[0_4px_18px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,215,0,0.04)]">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FFD700]/30 to-transparent pointer-events-none" />
              <div className="font-roboto text-[#FFD700]/80 text-[10px] uppercase tracking-[0.08em] font-bold px-3 py-2 border-b border-[#FFD700]/10 flex items-center gap-1.5 bg-black/20">
                <Icon name="Table" size={11} className="text-[#FFD700] drop-shadow-[0_0_4px_rgba(255,215,0,0.5)]" />
                Таблица за 30 дней
              </div>
              <div className="grid px-3 py-1.5 border-b border-[#333]" style={{ gridTemplateColumns: "repeat(7,1fr)" }}>
                {["День","Всего","Выдано","Закупка","Выручка","Прибыль","Мастеру"].map(h => (
                  <div key={h} className="font-roboto text-[9px] text-white/25 text-center uppercase">{h}</div>
                ))}
              </div>
              {stats.map(s => (
                <div key={s.day} className="grid px-3 py-1.5 border-b border-[#222] last:border-0 hover:bg-white/2"
                  style={{ gridTemplateColumns: "repeat(7,1fr)" }}>
                  <div className="font-roboto text-[10px] text-white/50">{fmtDay(s.day)}</div>
                  <div className="font-roboto text-[10px] text-white text-center">{s.total}</div>
                  <div className="font-roboto text-[10px] text-green-400 text-center">{s.done}</div>
                  <div className="font-roboto text-[10px] text-orange-400 text-center">{s.costs > 0 ? s.costs.toLocaleString("ru-RU") : "—"}</div>
                  <div className="font-roboto text-[10px] text-green-400 text-center">{s.revenue > 0 ? s.revenue.toLocaleString("ru-RU") : "—"}</div>
                  <div className={`font-oswald font-bold text-[10px] text-center ${s.profit > 0 ? "text-[#FFD700]" : s.profit < 0 ? "text-red-400" : "text-white/20"}`}>
                    {s.profit !== 0 ? s.profit.toLocaleString("ru-RU") : "—"}
                  </div>
                  <div className="font-roboto text-[10px] text-green-300 text-center font-bold">
                    {(s.master_income || 0) > 0 ? s.master_income!.toLocaleString("ru-RU") : "—"}
                  </div>
                </div>
              ))}
              {/* Итого строка */}
              <div className="grid px-3 py-2 bg-white/3 border-t border-[#333]" style={{ gridTemplateColumns: "repeat(7,1fr)" }}>
                <div className="font-roboto text-[10px] text-white/40 font-bold">Итого</div>
                <div className="font-roboto text-[10px] text-white text-center font-bold">{stats.reduce((a,s)=>a+s.total,0)}</div>
                <div className="font-roboto text-[10px] text-green-400 text-center font-bold">{stats.reduce((a,s)=>a+s.done,0)}</div>
                <div className="font-roboto text-[10px] text-orange-400 text-center font-bold">{stats.reduce((a,s)=>a+s.costs,0).toLocaleString("ru-RU")}</div>
                <div className="font-roboto text-[10px] text-green-400 text-center font-bold">{stats.reduce((a,s)=>a+s.revenue,0).toLocaleString("ru-RU")}</div>
                <div className="font-oswald font-bold text-[10px] text-center text-[#FFD700]">{stats.reduce((a,s)=>a+s.profit,0).toLocaleString("ru-RU")}</div>
                <div className="font-roboto text-[10px] text-green-300 text-center font-bold">{stats.reduce((a,s)=>a+(s.master_income||0),0).toLocaleString("ru-RU")}</div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}