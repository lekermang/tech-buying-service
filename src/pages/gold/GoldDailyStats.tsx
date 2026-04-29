import Icon from "@/components/ui/icon";
import { GoldAnalytics, GoldDayStat, money, fmtDay } from "./types";

type Props = {
  analytics: GoldAnalytics;
  stats: GoldDayStat[];
};

export default function GoldDailyStats({ analytics, stats }: Props) {
  return (
    <>
      {/* KPI карточки */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-gradient-to-br from-[#1A1A1A] to-[#141414] border border-[#1F1F1F] rounded-lg p-3 hover:border-[#FFD700]/30 transition-colors">
          <div className="flex items-center justify-between mb-1">
            <span className="font-roboto text-white/40 text-[10px] uppercase tracking-wide">Куплено за период</span>
            <Icon name="ShoppingBag" size={12} className="text-[#FFD700]/60" />
          </div>
          <div className="font-oswald font-bold text-[#FFD700] text-xl tabular-nums">{money(analytics.period_buy_sum ?? 0)}</div>
          <div className="font-roboto text-white/30 text-[10px] mt-0.5">
            {(analytics.period_weight585 ?? 0).toFixed(2)} <span className="text-green-400/60">г в 585</span> · {analytics.period_buy_count ?? 0} шт
          </div>
        </div>
        <div className="bg-gradient-to-br from-[#1A1A1A] to-[#141414] border border-[#1F1F1F] rounded-lg p-3 hover:border-blue-400/30 transition-colors">
          <div className="flex items-center justify-between mb-1">
            <span className="font-roboto text-white/40 text-[10px] uppercase tracking-wide">Продано за период</span>
            <Icon name="TrendingUp" size={12} className="text-blue-400/60" />
          </div>
          <div className="font-oswald font-bold text-blue-400 text-xl tabular-nums">{money(analytics.total_sell)}</div>
          <div className="font-roboto text-white/30 text-[10px] mt-0.5">
            {analytics.total_weight.toFixed(2)} г · {analytics.done} шт
          </div>
        </div>
      </div>

      {/* Счётчики статусов — premium chips */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {[
          { key: "new", label: "Закуплено", val: analytics.new, color: "text-white/80", bg: "bg-white/5", dot: "bg-white/40" },
          { key: "done", label: "Продано", val: analytics.done, color: "text-green-400", bg: "bg-green-500/10", dot: "bg-green-400" },
          { key: "cancelled", label: "Отменено", val: analytics.cancelled, color: "text-red-400", bg: "bg-red-500/10", dot: "bg-red-400" },
        ].map(s => (
          <div key={s.key} className={`${s.bg} border border-[#1F1F1F] rounded-lg p-2.5 text-center`}>
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
              <span className="font-roboto text-white/40 text-[9px] uppercase tracking-wide">{s.label}</span>
            </div>
            <div className={`font-oswald font-bold text-xl ${s.color} tabular-nums`}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* График по дням */}
      {analytics.daily.length > 1 && (
        <div className="bg-gradient-to-br from-[#141414] to-[#0A0A0A] border border-[#1F1F1F] rounded-lg p-3 mb-3">
          <div className="font-roboto text-white/40 text-[10px] uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Icon name="Activity" size={11} />
            Динамика по дням
          </div>
          <div className="space-y-1.5">
            {analytics.daily.slice().reverse().map(d => {
              const maxBuy = Math.max(...analytics.daily.map(x => x.buy), 1);
              const barW = Math.round((d.buy / maxBuy) * 100);
              const profW = Math.round((Math.max(0, d.profit) / maxBuy) * 100);
              return (
                <div key={d.day} className="flex items-center gap-2">
                  <span className="font-roboto text-[9px] text-white/40 w-10 shrink-0 tabular-nums">
                    {new Date(d.day + "T12:00:00").toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" })}
                  </span>
                  <div className="flex-1 h-4 bg-[#0A0A0A] rounded-sm relative overflow-hidden border border-[#1A1A1A]">
                    <div className="h-full bg-gradient-to-r from-[#FFD700]/30 to-[#FFD700]/10 absolute left-0 top-0 transition-all" style={{ width: barW + "%" }} />
                    <div className="h-full bg-gradient-to-r from-green-500/40 to-green-500/20 absolute left-0 top-0 transition-all" style={{ width: profW + "%" }} />
                  </div>
                  <span className="font-roboto text-[9px] text-white/40 w-16 text-right shrink-0 tabular-nums">
                    {d.buy > 0 ? d.buy.toLocaleString("ru-RU") + "₽" : "—"}
                  </span>
                  <span className={`font-roboto text-[9px] w-14 text-right shrink-0 tabular-nums font-bold ${d.profit > 0 ? "text-green-400" : d.profit < 0 ? "text-red-400" : "text-white/20"}`}>
                    {d.profit !== 0 ? (d.profit > 0 ? "+" : "") + d.profit.toLocaleString("ru-RU") : "—"}
                  </span>
                  <span className="font-roboto text-green-400/60 text-[9px] w-5 text-right shrink-0">{d.done}✓</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Таблица за 30 дней */}
      {stats.length > 0 && (
        <div className="bg-gradient-to-br from-[#141414] to-[#0A0A0A] border border-[#1F1F1F] rounded-lg overflow-hidden">
          <div className="font-roboto text-white/40 text-[10px] uppercase tracking-wider px-3 py-2.5 border-b border-[#1F1F1F] flex items-center gap-1.5">
            <Icon name="Table" size={11} />
            Таблица за 30 дней
          </div>
          <div className="grid px-3 py-2 border-b border-[#1F1F1F] bg-[#0A0A0A]" style={{ gridTemplateColumns: "repeat(6,1fr)" }}>
            {["День", "Всего", "Продано", "Закупка", "Выручка", "Прибыль"].map(h => (
              <div key={h} className="font-roboto text-[9px] text-white/30 text-center uppercase tracking-wide">{h}</div>
            ))}
          </div>
          {stats.map(s => (
            <div key={s.day} className="grid px-3 py-2 border-b border-[#1A1A1A] last:border-0 hover:bg-white/[0.02] transition-colors"
              style={{ gridTemplateColumns: "repeat(6,1fr)" }}>
              <div className="font-roboto text-[10px] text-white/60">{fmtDay(s.day)}</div>
              <div className="font-roboto text-[10px] text-white text-center tabular-nums">{s.total}</div>
              <div className="font-roboto text-[10px] text-green-400 text-center tabular-nums">{s.done}</div>
              <div className="font-roboto text-[10px] text-[#FFD700] text-center tabular-nums">{s.buy > 0 ? s.buy.toLocaleString("ru-RU") : "—"}</div>
              <div className="font-roboto text-[10px] text-blue-400 text-center tabular-nums">{s.sell > 0 ? s.sell.toLocaleString("ru-RU") : "—"}</div>
              <div className={`font-oswald font-bold text-[11px] text-center tabular-nums ${s.profit > 0 ? "text-green-400" : s.profit < 0 ? "text-red-400" : "text-white/20"}`}>
                {s.profit !== 0 ? s.profit.toLocaleString("ru-RU") : "—"}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
