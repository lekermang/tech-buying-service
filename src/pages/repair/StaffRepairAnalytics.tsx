import Icon from "@/components/ui/icon";
import { STATUSES, DayStat, fmtDay } from "./types";

type Period = "day" | "yesterday" | "week" | "month";

type RepairAnalytics = {
  total: number; done: number; cancelled: number; ready: number;
  in_progress: number; waiting_parts: number; new: number;
  revenue: number; costs: number; profit: number; master_total: number;
  daily: { day: string; total: number; done: number; revenue: number; costs: number; profit: number }[];
};

const money = (v: number | null | undefined) =>
  v != null ? v.toLocaleString("ru-RU") + " ₽" : "—";

type Props = {
  analytics: RepairAnalytics | null;
  analyticsLoading: boolean;
  period: Period;
  stats: DayStat[];
  onPeriodChange: (p: Period) => void;
  onRefresh: () => void;
  onShowHistory: () => void;
  onShowOrders?: (params: { statuses: string[]; title: string; accent: "revenue" | "costs" | "master" | "profit" | "status" }) => void;
};

export default function StaffRepairAnalytics({ analytics, analyticsLoading, period, stats, onPeriodChange, onRefresh, onShowHistory, onShowOrders }: Props) {
  const DONE_STATUSES = ["done", "warranty", "ready"];
  const openFinance = (accent: "revenue" | "costs" | "master" | "profit", title: string) =>
    onShowOrders?.({ statuses: DONE_STATUSES, title, accent });
  const openStatus = (key: string, label: string) =>
    onShowOrders?.({ statuses: key === "new" ? ["new", "accepted"] : [key], title: label, accent: "status" });
  return (
    <div className="p-3 sm:p-4 overflow-y-auto">
      <div className="flex gap-1.5 mb-4 items-center flex-wrap">
        {(["day", "yesterday", "week", "month"] as Period[]).map(p => {
          const lbl = p === "day" ? "Сегодня" : p === "yesterday" ? "Вчера" : p === "week" ? "7 дней" : "30 дней";
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