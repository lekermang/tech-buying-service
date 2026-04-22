import Icon from "@/components/ui/icon";
import { Analytics, STATUSES, money } from "./repairTypes";

type Period = "day" | "yesterday" | "week" | "month";

type Props = {
  analytics: Analytics | null;
  analyticsLoading: boolean;
  period: Period;
  onPeriodChange: (p: Period) => void;
  onRefresh: () => void;
};

export default function RepairAnalytics({ analytics, analyticsLoading, period, onPeriodChange, onRefresh }: Props) {
  return (
    <div className="flex-1 overflow-y-auto p-4">
      {/* Переключатель периода */}
      <div className="flex gap-2 mb-5">
        {(["day", "yesterday", "week", "month"] as Period[]).map(p => (
          <button key={p} onClick={() => onPeriodChange(p)}
            className={`px-3 py-2 font-roboto text-xs border transition-colors ${period === p ? "border-[#FFD700] text-[#FFD700] bg-[#FFD700]/10" : "border-[#333] text-white/40 hover:text-white"}`}>
            {p === "day" ? "Сегодня" : p === "yesterday" ? "Вчера" : p === "week" ? "7 дней" : "30 дней"}
          </button>
        ))}
        <button onClick={onRefresh} disabled={analyticsLoading} className="ml-auto text-white/30 hover:text-white transition-colors p-1.5">
          <Icon name={analyticsLoading ? "Loader" : "RefreshCw"} size={14} className={analyticsLoading ? "animate-spin" : ""} />
        </button>
      </div>

      {analyticsLoading && <div className="text-center py-12 text-white/30 font-roboto text-sm">Загружаю аналитику...</div>}

      {analytics && !analyticsLoading && (
        <>
          {/* Финансовые KPI */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] p-4">
              <div className="font-roboto text-white/40 text-[10px] uppercase tracking-wider mb-1">Выручка</div>
              <div className="font-oswald font-bold text-[#FFD700] text-xl">{money(analytics.revenue)}</div>
            </div>
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] p-4">
              <div className="font-roboto text-white/40 text-[10px] uppercase tracking-wider mb-1">Закупка</div>
              <div className="font-oswald font-bold text-orange-400 text-xl">{money(analytics.costs)}</div>
            </div>
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] p-4">
              <div className="font-roboto text-white/40 text-[10px] uppercase tracking-wider mb-1">Прибыль</div>
              <div className={`font-oswald font-bold text-xl ${analytics.profit >= 0 ? "text-green-400" : "text-red-400"}`}>{money(analytics.profit)}</div>
            </div>
            <div className="bg-[#1A1A1A] border border-green-500/20 p-4">
              <div className="font-roboto text-white/40 text-[10px] uppercase tracking-wider mb-1">Доход мастера (50%)</div>
              <div className="font-oswald font-bold text-green-400 text-xl">{money(analytics.master_total)}</div>
            </div>
          </div>

          {/* Статусы */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-5">
            {STATUSES.map(s => (
              <div key={s.key} className="bg-[#1A1A1A] border border-[#2A2A2A] p-3 text-center">
                <div className={`font-oswald font-bold text-lg ${s.color.split(" ")[1]}`}>
                  {(analytics as Record<string, unknown>)[s.key === "new" ? "new" : s.key] as number ?? 0}
                </div>
                <div className="font-roboto text-white/30 text-[10px] mt-0.5">{s.label.replace(" ✓","")}</div>
              </div>
            ))}
          </div>

          {/* График по дням */}
          {analytics.daily.length > 1 && (
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] p-4">
              <div className="font-roboto text-white/40 text-[10px] uppercase tracking-wider mb-3">Динамика по дням</div>
              <div className="space-y-1.5">
                {analytics.daily.slice().reverse().map(d => {
                  const maxRev = Math.max(...analytics.daily.map(x => x.revenue), 1);
                  const barW = Math.round((d.revenue / maxRev) * 100);
                  return (
                    <div key={d.day} className="flex items-center gap-3">
                      <span className="font-roboto text-white/30 text-[10px] w-16 shrink-0">
                        {new Date(d.day).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" })}
                      </span>
                      <div className="flex-1 h-5 bg-[#111] relative">
                        <div className="h-full bg-[#FFD700]/30 transition-all" style={{ width: barW + "%" }} />
                        <div className="h-full bg-green-500/40 absolute top-0 left-0 transition-all"
                          style={{ width: Math.round((d.profit / maxRev) * 100) + "%" }} />
                      </div>
                      <span className="font-roboto text-[10px] text-white/60 w-20 text-right shrink-0">
                        {money(d.revenue)}
                      </span>
                      <span className={`font-roboto text-[10px] w-16 text-right shrink-0 ${d.profit >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {d.profit >= 0 ? "+" : ""}{money(d.profit)}
                      </span>
                      <span className="font-roboto text-white/30 text-[10px] w-8 text-right shrink-0">{d.done}✓</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}