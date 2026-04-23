import Icon from "@/components/ui/icon";
import { GoldAnalytics, GoldDayStat, money, fmtDay } from "./types";

type Period = "day" | "yesterday" | "week" | "month";

type Props = {
  analytics: GoldAnalytics | null;
  loading: boolean;
  period: Period;
  stats: GoldDayStat[];
  onPeriodChange: (p: Period) => void;
  onRefresh: () => void;
};

export default function GoldAnalyticsView({ analytics, loading, period, stats, onPeriodChange, onRefresh }: Props) {
  return (
    <div className="p-4 overflow-y-auto">
      <div className="flex gap-2 mb-4 items-center flex-wrap">
        {(["day", "yesterday", "week", "month"] as Period[]).map(p => (
          <button key={p} onClick={() => onPeriodChange(p)}
            className={`px-3 py-1.5 font-roboto text-xs border transition-colors ${period === p ? "border-[#FFD700] text-[#FFD700] bg-[#FFD700]/10" : "border-[#333] text-white/40 hover:text-white"}`}>
            {p === "day" ? "Сегодня" : p === "yesterday" ? "Вчера" : p === "week" ? "7 дней" : "30 дней"}
          </button>
        ))}
        <button onClick={onRefresh} disabled={loading} className="ml-auto text-white/30 hover:text-white p-1.5 transition-colors">
          <Icon name={loading ? "Loader" : "RefreshCw"} size={13} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {loading && <div className="text-center py-12 text-white/30 font-roboto text-sm">Загружаю...</div>}

      {analytics && !loading && (
        <>
          {/* KPI */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] p-3">
              <div className="font-roboto text-white/30 text-[10px] mb-0.5">Закуплено</div>
              <div className="font-oswald font-bold text-[#FFD700] text-xl">{money(analytics.total_buy)}</div>
              <div className="font-roboto text-white/20 text-[10px]">{analytics.total_weight.toFixed(2)} г</div>
            </div>
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] p-3">
              <div className="font-roboto text-white/30 text-[10px] mb-0.5">Выручка продажи</div>
              <div className="font-oswald font-bold text-blue-400 text-xl">{money(analytics.total_sell)}</div>
              <div className="font-roboto text-white/20 text-[10px]">{analytics.done} выкуплено</div>
            </div>
          </div>

          {analytics.total_profit > 0 && (
            <div className="bg-green-500/10 border border-green-500/20 p-3 mb-3 flex items-center justify-between">
              <div>
                <div className="font-roboto text-green-400/60 text-[10px] uppercase tracking-wide mb-0.5">Прибыль (продажа − закупка)</div>
                <div className="font-oswald font-bold text-green-400 text-2xl">{money(analytics.total_profit)}</div>
              </div>
              <span className="text-3xl opacity-40">🥇</span>
            </div>
          )}

          {/* Счётчики статусов */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[
              { key: "new", label: "Закуплено", val: analytics.new, color: "text-white/60" },
              { key: "done", label: "Продано", val: analytics.done, color: "text-green-400" },
              { key: "cancelled", label: "Отменено", val: analytics.cancelled, color: "text-red-400" },
            ].map(s => (
              <div key={s.key} className="bg-[#1A1A1A] border border-[#2A2A2A] p-2 text-center">
                <div className={`font-oswald font-bold text-lg ${s.color}`}>{s.val}</div>
                <div className="font-roboto text-white/30 text-[9px]">{s.label}</div>
              </div>
            ))}
          </div>

          {/* График по дням */}
          {analytics.daily.length > 1 && (
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] p-3 mb-3">
              <div className="font-roboto text-white/30 text-[10px] uppercase tracking-wide mb-2">Динамика по дням</div>
              <div className="space-y-1.5">
                {analytics.daily.slice().reverse().map(d => {
                  const maxBuy = Math.max(...analytics.daily.map(x => x.buy), 1);
                  const barW = Math.round((d.buy / maxBuy) * 100);
                  const profW = Math.round((Math.max(0, d.profit) / maxBuy) * 100);
                  return (
                    <div key={d.day} className="flex items-center gap-2">
                      <span className="font-roboto text-[9px] text-white/30 w-10 shrink-0">
                        {new Date(d.day + "T12:00:00").toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" })}
                      </span>
                      <div className="flex-1 h-4 bg-[#111] relative overflow-hidden">
                        <div className="h-full bg-[#FFD700]/25 absolute left-0 top-0 transition-all" style={{ width: barW + "%" }} />
                        <div className="h-full bg-green-500/35 absolute left-0 top-0 transition-all" style={{ width: profW + "%" }} />
                      </div>
                      <span className="font-roboto text-[9px] text-white/40 w-16 text-right shrink-0">
                        {d.buy > 0 ? d.buy.toLocaleString("ru-RU") + "₽" : "—"}
                      </span>
                      <span className={`font-roboto text-[9px] w-12 text-right shrink-0 ${d.profit > 0 ? "text-green-400" : d.profit < 0 ? "text-red-400" : "text-white/20"}`}>
                        {d.profit !== 0 ? (d.profit > 0 ? "+" : "") + d.profit.toLocaleString("ru-RU") : "—"}
                      </span>
                      <span className="font-roboto text-white/20 text-[9px] w-5 text-right shrink-0">{d.done}✓</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Таблица за 30 дней */}
          {stats.length > 0 && (
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] overflow-x-auto">
              <div className="font-roboto text-white/30 text-[10px] uppercase tracking-wide px-3 py-2 border-b border-[#333]">
                Таблица за 30 дней
              </div>
              <div className="grid px-3 py-1.5 border-b border-[#333]" style={{ gridTemplateColumns: "repeat(6,1fr)" }}>
                {["День", "Всего", "Выкуп.", "Закупка", "Выручка", "Прибыль"].map(h => (
                  <div key={h} className="font-roboto text-[9px] text-white/25 text-center uppercase">{h}</div>
                ))}
              </div>
              {stats.map(s => (
                <div key={s.day} className="grid px-3 py-1.5 border-b border-[#222] last:border-0"
                  style={{ gridTemplateColumns: "repeat(6,1fr)" }}>
                  <div className="font-roboto text-[10px] text-white/50">{fmtDay(s.day)}</div>
                  <div className="font-roboto text-[10px] text-white text-center">{s.total}</div>
                  <div className="font-roboto text-[10px] text-green-400 text-center">{s.done}</div>
                  <div className="font-roboto text-[10px] text-[#FFD700] text-center">{s.buy > 0 ? s.buy.toLocaleString("ru-RU") : "—"}</div>
                  <div className="font-roboto text-[10px] text-blue-400 text-center">{s.sell > 0 ? s.sell.toLocaleString("ru-RU") : "—"}</div>
                  <div className={`font-oswald font-bold text-[10px] text-center ${s.profit > 0 ? "text-green-400" : s.profit < 0 ? "text-red-400" : "text-white/20"}`}>
                    {s.profit !== 0 ? s.profit.toLocaleString("ru-RU") : "—"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}