import { useState } from "react";
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
  const [sellPricePerGram, setSellPricePerGram] = useState<string>("6300");
  const stockWeight = analytics?.stock_weight ?? 0;
  const stockBuySum = analytics?.stock_buy_sum ?? 0;
  const stockCount = analytics?.stock_count ?? 0;
  const stockByPurity = analytics?.stock_by_purity ?? [];
  const pricePerGramNum = parseFloat(sellPricePerGram) || 0;
  const expectedRevenue = Math.round(stockWeight * pricePerGramNum);
  const expectedProfit = expectedRevenue - stockBuySum;

  return (
    <div className="p-3 overflow-y-auto">
      {/* Период + refresh */}
      <div className="flex gap-1.5 mb-3 items-center flex-wrap">
        {(["day", "yesterday", "week", "month"] as Period[]).map(p => {
          const active = period === p;
          return (
            <button key={p} onClick={() => onPeriodChange(p)}
              className={`px-3 py-1.5 font-roboto text-[11px] rounded-full transition-all active:scale-95 ${
                active
                  ? "bg-[#FFD700] text-black font-bold shadow-md shadow-[#FFD700]/20"
                  : "bg-[#141414] border border-[#1F1F1F] text-white/50 hover:text-white hover:border-[#333]"
              }`}>
              {p === "day" ? "Сегодня" : p === "yesterday" ? "Вчера" : p === "week" ? "7 дней" : "30 дней"}
            </button>
          );
        })}
        <button onClick={onRefresh} disabled={loading}
          className="ml-auto text-white/40 hover:text-[#FFD700] active:scale-90 p-2 rounded-md transition-all hover:bg-white/5">
          <Icon name={loading ? "Loader" : "RefreshCw"} size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-14 gap-2 text-white/40">
          <Icon name="Loader" size={18} className="animate-spin text-[#FFD700]" />
          <span className="font-roboto text-sm">Загружаю аналитику...</span>
        </div>
      )}

      {analytics && !loading && (
        <>
          {/* Premium большой блок прибыли */}
          <div className="relative bg-gradient-to-br from-[#FFD700]/10 via-green-500/5 to-transparent border border-[#FFD700]/20 rounded-xl p-4 mb-3 overflow-hidden">
            <div className="absolute -top-8 -right-8 text-8xl opacity-5 select-none">🥇</div>
            <div className="relative">
              <div className="font-roboto text-[#FFD700]/70 text-[10px] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Icon name="TrendingUp" size={12} />
                Прибыль от золота
              </div>
              <div className={`font-oswald font-bold text-3xl mb-1 ${analytics.total_profit > 0 ? "text-green-400" : analytics.total_profit < 0 ? "text-red-400" : "text-white/40"}`}>
                {money(analytics.total_profit)}
              </div>
              <div className="font-roboto text-white/40 text-[11px]">продажа − закупка</div>
            </div>
          </div>

          {/* Остаток металла (только статус "Закуплено") + калькулятор продажи */}
          <div className="bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] border border-[#FFD700]/25 rounded-xl p-4 mb-3">
            <div className="flex items-center justify-between mb-3">
              <div className="font-roboto text-[#FFD700]/80 text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                <Icon name="Coins" size={12} />
                Остаток металла в наличии
              </div>
              <span className="font-roboto text-white/30 text-[10px]">{stockCount} поз.</span>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg p-3">
                <div className="font-roboto text-white/40 text-[10px] uppercase tracking-wide mb-1">
                  Общий вес (для сверки)
                </div>
                <div className="font-oswald font-bold text-[#FFD700] text-2xl tabular-nums">
                  {stockWeight.toFixed(2)} <span className="text-sm text-[#FFD700]/60">г</span>
                </div>
              </div>
              <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg p-3">
                <div className="font-roboto text-white/40 text-[10px] uppercase tracking-wide mb-1">
                  Потрачено на закупку
                </div>
                <div className="font-oswald font-bold text-white text-2xl tabular-nums">
                  {money(stockBuySum)}
                </div>
              </div>
            </div>

            <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg p-3 mb-2">
              <label className="font-roboto text-white/50 text-[10px] uppercase tracking-wide block mb-1.5">
                Цена продажи за грамм, ₽
              </label>
              <input
                type="number"
                inputMode="decimal"
                value={sellPricePerGram}
                onChange={(e) => setSellPricePerGram(e.target.value)}
                placeholder="6300"
                className="w-full bg-[#141414] border border-[#1F1F1F] focus:border-[#FFD700]/50 outline-none rounded-md px-3 py-2 font-oswald font-bold text-[#FFD700] text-xl tabular-nums"
              />
              <div className="font-roboto text-white/30 text-[10px] mt-1.5">
                {stockWeight.toFixed(2)} г × {pricePerGramNum.toLocaleString("ru-RU")} ₽
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-blue-500/10 border border-blue-400/20 rounded-lg p-3">
                <div className="font-roboto text-blue-300/70 text-[10px] uppercase tracking-wide mb-1">
                  Сумма продажи
                </div>
                <div className="font-oswald font-bold text-blue-300 text-xl tabular-nums">
                  {money(expectedRevenue)}
                </div>
              </div>
              <div className={`border rounded-lg p-3 ${expectedProfit >= 0 ? "bg-green-500/10 border-green-400/20" : "bg-red-500/10 border-red-400/20"}`}>
                <div className={`font-roboto text-[10px] uppercase tracking-wide mb-1 ${expectedProfit >= 0 ? "text-green-300/70" : "text-red-300/70"}`}>
                  Прибыль
                </div>
                <div className={`font-oswald font-bold text-xl tabular-nums ${expectedProfit >= 0 ? "text-green-300" : "text-red-300"}`}>
                  {expectedProfit >= 0 ? "+" : ""}{money(expectedProfit)}
                </div>
              </div>
            </div>

            {/* Разбивка по пробам */}
            {stockByPurity.length > 0 && (
              <div className="mt-3 bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg overflow-hidden">
                <div className="font-roboto text-white/40 text-[10px] uppercase tracking-wider px-3 py-2 border-b border-[#1F1F1F] flex items-center gap-1.5">
                  <Icon name="Layers" size={11} />
                  Разбивка по пробам
                </div>
                <div className="grid px-3 py-1.5 border-b border-[#1F1F1F] bg-[#0F0F0F]" style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr 1.2fr" }}>
                  {["Проба", "Поз.", "Вес", "Закупка", "Продажа"].map(h => (
                    <div key={h} className="font-roboto text-[9px] text-white/30 uppercase tracking-wide">{h}</div>
                  ))}
                </div>
                {stockByPurity.map(p => {
                  const revenue = Math.round(p.weight * pricePerGramNum);
                  const profit = revenue - p.buy_sum;
                  return (
                    <div key={p.purity} className="grid px-3 py-2 border-b border-[#141414] last:border-0 items-center" style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr 1.2fr" }}>
                      <div className="font-oswald font-bold text-[#FFD700] text-sm">{p.purity}</div>
                      <div className="font-roboto text-white/60 text-[11px] tabular-nums">{p.count}</div>
                      <div className="font-oswald font-bold text-white text-sm tabular-nums">{p.weight.toFixed(2)} <span className="text-[10px] text-white/40">г</span></div>
                      <div className="font-roboto text-white/70 text-[11px] tabular-nums">{p.buy_sum.toLocaleString("ru-RU")}</div>
                      <div className="flex flex-col leading-tight">
                        <span className="font-roboto text-blue-300 text-[11px] tabular-nums">{revenue.toLocaleString("ru-RU")}</span>
                        <span className={`font-roboto text-[10px] tabular-nums font-bold ${profit >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {profit >= 0 ? "+" : ""}{profit.toLocaleString("ru-RU")}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* KPI карточки */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-gradient-to-br from-[#1A1A1A] to-[#141414] border border-[#1F1F1F] rounded-lg p-3 hover:border-[#FFD700]/30 transition-colors">
              <div className="flex items-center justify-between mb-1">
                <span className="font-roboto text-white/40 text-[10px] uppercase tracking-wide">Закуплено</span>
                <Icon name="ShoppingBag" size={12} className="text-[#FFD700]/60" />
              </div>
              <div className="font-oswald font-bold text-[#FFD700] text-xl tabular-nums">{money(analytics.total_buy)}</div>
              <div className="font-roboto text-white/30 text-[10px] mt-0.5">{analytics.total_weight.toFixed(2)} г</div>
            </div>
            <div className="bg-gradient-to-br from-[#1A1A1A] to-[#141414] border border-[#1F1F1F] rounded-lg p-3 hover:border-blue-400/30 transition-colors">
              <div className="flex items-center justify-between mb-1">
                <span className="font-roboto text-white/40 text-[10px] uppercase tracking-wide">Продано</span>
                <Icon name="TrendingUp" size={12} className="text-blue-400/60" />
              </div>
              <div className="font-oswald font-bold text-blue-400 text-xl tabular-nums">{money(analytics.total_sell)}</div>
              <div className="font-roboto text-white/30 text-[10px] mt-0.5">{analytics.done} шт</div>
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
      )}
    </div>
  );
}