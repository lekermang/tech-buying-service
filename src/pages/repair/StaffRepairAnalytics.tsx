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
    <div className="p-4 overflow-y-auto">
      <div className="flex gap-2 mb-4 items-center flex-wrap">
        {(["day", "yesterday", "week", "month"] as Period[]).map(p => (
          <button key={p} onClick={() => onPeriodChange(p)}
            className={`px-3 py-1.5 font-roboto text-xs border transition-colors ${period === p ? "border-[#FFD700] text-[#FFD700] bg-[#FFD700]/10" : "border-[#333] text-white/40 hover:text-white"}`}>
            {p === "day" ? "Сегодня" : p === "yesterday" ? "Вчера" : p === "week" ? "7 дней" : "30 дней"}
          </button>
        ))}
        <button onClick={onShowHistory} className="flex items-center gap-1 border border-[#333] text-white/40 hover:text-white px-3 py-1.5 font-roboto text-xs transition-colors">
          <Icon name="History" size={12} />Действия
        </button>
        <button onClick={onRefresh} disabled={analyticsLoading} className="ml-auto text-white/30 hover:text-white p-1.5 transition-colors">
          <Icon name={analyticsLoading ? "Loader" : "RefreshCw"} size={13} className={analyticsLoading ? "animate-spin" : ""} />
        </button>
      </div>

      {analyticsLoading && <div className="text-center py-12 text-white/30 font-roboto text-sm">Загружаю...</div>}

      {analytics && !analyticsLoading && (
        <>
          {/* Формула прибыли */}
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] p-3 mb-3">
            <div className="font-roboto text-white/30 text-[10px] uppercase tracking-wide mb-2">Расчёт прибыли</div>
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
              <div className="mt-2 pt-2 border-t border-[#2A2A2A] flex justify-between items-center">
                <span className="font-roboto text-white/20 text-[9px]">До вычета мастера (выручка − закупка)</span>
                <span className="font-roboto text-white/40 text-[10px] font-bold">{money(analytics.profit)}</span>
              </div>
            )}
          </div>

          {/* Счётчики статусов */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            {STATUSES.map(s => {
              const val = (analytics as Record<string, unknown>)[s.key === "new" ? "new" : s.key] as number ?? 0;
              const clickable = val > 0 && !!onShowOrders;
              return (
                <button
                  key={s.key}
                  disabled={!clickable}
                  onClick={() => clickable && openStatus(s.key, s.label.replace(" ✓", ""))}
                  className={`bg-[#1A1A1A] border border-[#2A2A2A] p-2 text-center transition-colors ${clickable ? "hover:border-[#FFD700]/40 hover:bg-[#1F1F1F] cursor-pointer" : "cursor-default"}`}
                >
                  <div className={`font-oswald font-bold text-lg ${s.color.split(" ")[1]}`}>{val}</div>
                  <div className="font-roboto text-white/30 text-[9px]">{s.label.replace(" ✓", "")}</div>
                </button>
              );
            })}
          </div>

          {/* График по дням */}
          {analytics.daily.length > 1 && (
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] p-3">
              <div className="font-roboto text-white/30 text-[10px] uppercase tracking-wide mb-2">Динамика по дням</div>
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
                      <div className="flex-1 h-4 bg-[#111] relative overflow-hidden">
                        <div className="h-full bg-[#FFD700]/25 absolute left-0 top-0 transition-all" style={{ width: barW + "%" }} />
                        <div className="h-full bg-green-500/35 absolute left-0 top-0 transition-all" style={{ width: profitW + "%" }} />
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

          {/* Таблица по дням (30 дней) */}
          {stats.length > 0 && (
            <div className="mt-3 bg-[#1A1A1A] border border-[#2A2A2A] overflow-x-auto">
              <div className="font-roboto text-white/30 text-[10px] uppercase tracking-wide px-3 py-2 border-b border-[#333]">
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