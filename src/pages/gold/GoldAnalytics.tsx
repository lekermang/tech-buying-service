import { useState } from "react";
import Icon from "@/components/ui/icon";
import { GoldAnalytics, GoldDayStat, GOLD_URL, money, fmtDay } from "./types";

type Period = "day" | "yesterday" | "week" | "month" | "year" | "all" | "custom";

type Props = {
  analytics: GoldAnalytics | null;
  loading: boolean;
  period: Period;
  stats: GoldDayStat[];
  onPeriodChange: (p: Period) => void;
  periodFrom?: string;
  periodTo?: string;
  onPeriodFromChange?: (v: string) => void;
  onPeriodToChange?: (v: string) => void;
  onRefresh: () => void;
  token?: string;
  onSold?: () => void;
};

const PERIOD_LABELS: Record<Period, string> = {
  day: "Сегодня",
  yesterday: "Вчера",
  week: "7 дней",
  month: "30 дней",
  year: "Год",
  all: "Всё время",
  custom: "Период",
};

export default function GoldAnalyticsView({ analytics, loading, period, stats, onPeriodChange, periodFrom = "", periodTo = "", onPeriodFromChange, onPeriodToChange, onRefresh, token, onSold }: Props) {
  const [sellPricePerGram, setSellPricePerGram] = useState<string>("6300");
  const [sellAllOpen, setSellAllOpen] = useState(false);
  const [sellAllPrice, setSellAllPrice] = useState<string>("6300");
  const [sellAllPayment, setSellAllPayment] = useState<string>("cash");
  const [sellAllLoading, setSellAllLoading] = useState(false);
  const [sellAllError, setSellAllError] = useState<string>("");
  const [sellAllResult, setSellAllResult] = useState<null | { sold_count: number; total_weight: number; total_weight_585: number; total_revenue: number; total_buy: number; total_profit: number }>(null);
  const stockWeight = analytics?.stock_weight ?? 0;
  const stockBuySum = analytics?.stock_buy_sum ?? 0;
  const stockCount = analytics?.stock_count ?? 0;
  const stockByPurity = analytics?.stock_by_purity ?? [];
  const pricePerGramNum = parseFloat(sellPricePerGram) || 0;

  // Перевод любой пробы в эквивалент 585: вес × (проба/585)
  const purityToCoef = (purity: string): number => {
    const n = parseInt(purity, 10);
    if (!n || isNaN(n)) return 0;
    return n / 585;
  };
  const stockByPurityCalc = stockByPurity.map(p => {
    const coef = purityToCoef(p.purity);
    const weight585 = +(p.weight * coef).toFixed(2);
    return { ...p, coef, weight585 };
  });
  const stockWeight585 = +stockByPurityCalc.reduce((s, p) => s + p.weight585, 0).toFixed(2);
  const expectedRevenue = Math.round(stockWeight585 * pricePerGramNum);
  const expectedProfit = expectedRevenue - stockBuySum;

  const sellAllNum = parseFloat(sellAllPrice.replace(",", ".")) || 0;
  const sellAllExpectedRevenue = Math.round(stockWeight585 * sellAllNum);
  const sellAllExpectedProfit = sellAllExpectedRevenue - stockBuySum;

  const doSellAll = async () => {
    if (!token) { setSellAllError("Нет токена сотрудника"); return; }
    if (sellAllNum <= 0) { setSellAllError("Укажите цену за грамм"); return; }
    if (stockCount === 0) { setSellAllError("Нет позиций в наличии"); return; }
    setSellAllLoading(true);
    setSellAllError("");
    try {
      const res = await fetch(GOLD_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Employee-Token": token },
        body: JSON.stringify({ action: "sell_all", price_per_gram_585: sellAllNum, payment_method: sellAllPayment }),
      });
      const data = await res.json();
      if (data.ok) {
        setSellAllResult({
          sold_count: data.sold_count,
          total_weight: data.total_weight,
          total_weight_585: data.total_weight_585,
          total_revenue: data.total_revenue,
          total_buy: data.total_buy,
          total_profit: data.total_profit,
        });
        if (onSold) onSold();
      } else {
        setSellAllError(data.error || "Ошибка продажи");
      }
    } catch (e) {
      setSellAllError(e instanceof Error ? e.message : "Сбой сети");
    } finally {
      setSellAllLoading(false);
    }
  };

  return (
    <div className="p-3 overflow-y-auto">
      {/* Период + refresh */}
      <div className="flex gap-1.5 mb-2 items-center flex-wrap">
        {(["day", "yesterday", "week", "month", "year", "all", "custom"] as Period[]).map(p => {
          const active = period === p;
          return (
            <button key={p} onClick={() => onPeriodChange(p)}
              className={`px-3 py-1.5 font-roboto text-[11px] rounded-full transition-all active:scale-95 ${
                active
                  ? "bg-[#FFD700] text-black font-bold shadow-md shadow-[#FFD700]/20"
                  : "bg-[#141414] border border-[#1F1F1F] text-white/50 hover:text-white hover:border-[#333]"
              }`}>
              {PERIOD_LABELS[p]}
            </button>
          );
        })}
        <button onClick={onRefresh} disabled={loading}
          className="ml-auto text-white/40 hover:text-[#FFD700] active:scale-90 p-2 rounded-md transition-all hover:bg-white/5">
          <Icon name={loading ? "Loader" : "RefreshCw"} size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Выбор произвольных дат */}
      {period === "custom" && (
        <div className="flex gap-2 mb-3 items-center flex-wrap bg-[#0F0F0F] border border-[#1F1F1F] rounded-lg p-2">
          <Icon name="Calendar" size={13} className="text-[#FFD700]/60 ml-1" />
          <input
            type="date"
            value={periodFrom}
            onChange={(e) => onPeriodFromChange?.(e.target.value)}
            className="bg-[#0A0A0A] border border-[#222] text-white px-2 py-1 rounded font-roboto text-xs focus:outline-none focus:border-[#FFD700]/50"
          />
          <span className="text-white/30 text-xs">—</span>
          <input
            type="date"
            value={periodTo}
            onChange={(e) => onPeriodToChange?.(e.target.value)}
            className="bg-[#0A0A0A] border border-[#222] text-white px-2 py-1 rounded font-roboto text-xs focus:outline-none focus:border-[#FFD700]/50"
          />
          {(periodFrom || periodTo) && (
            <button
              onClick={() => { onPeriodFromChange?.(""); onPeriodToChange?.(""); }}
              className="text-white/30 hover:text-red-400 text-[10px] font-roboto px-2 py-1"
            >
              сброс
            </button>
          )}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-14 gap-2 text-white/40">
          <Icon name="Loader" size={18} className="animate-spin text-[#FFD700]" />
          <span className="font-roboto text-sm">Загружаю аналитику...</span>
        </div>
      )}

      {analytics && !loading && (
        <>
          {/* Premium большой блок прибыли за период */}
          <div className="relative bg-gradient-to-br from-[#FFD700]/10 via-green-500/5 to-transparent border border-[#FFD700]/20 rounded-xl p-4 mb-3 overflow-hidden">
            <div className="absolute -top-8 -right-8 text-8xl opacity-5 select-none">🥇</div>
            <div className="relative">
              <div className="font-roboto text-[#FFD700]/70 text-[10px] uppercase tracking-wider mb-2 flex items-center gap-1.5 justify-between">
                <span className="flex items-center gap-1.5">
                  <Icon name="TrendingUp" size={12} />
                  Прибыль за период
                </span>
                <span className="text-white/40 normal-case tracking-normal">
                  {period === "custom"
                    ? (periodFrom || periodTo ? `${periodFrom || "…"} — ${periodTo || "…"}` : "выбери даты")
                    : PERIOD_LABELS[period]}
                </span>
              </div>
              <div className={`font-oswald font-bold text-4xl mb-2 tabular-nums ${analytics.total_profit > 0 ? "text-green-400" : analytics.total_profit < 0 ? "text-red-400" : "text-white/40"}`}>
                {money(analytics.total_profit)}
              </div>
              <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-white/10">
                <div>
                  <div className="font-roboto text-white/40 text-[9px] uppercase tracking-wide">Продано (шт)</div>
                  <div className="font-oswald font-bold text-white text-base tabular-nums">{analytics.done}</div>
                </div>
                <div>
                  <div className="font-roboto text-white/40 text-[9px] uppercase tracking-wide">Вес продан</div>
                  <div className="font-oswald font-bold text-white text-base tabular-nums">{(analytics.total_weight || 0).toFixed(2)} <span className="text-[10px] text-white/40">г</span></div>
                  {(analytics.total_weight_585 ?? 0) > 0 && (
                    <div className="font-oswald font-bold text-green-400 text-[11px] tabular-nums">≈ {(analytics.total_weight_585 || 0).toFixed(2)} <span className="text-[9px] text-green-400/50">г в 585</span></div>
                  )}
                </div>
                <div>
                  <div className="font-roboto text-white/40 text-[9px] uppercase tracking-wide">Выручка</div>
                  <div className="font-oswald font-bold text-blue-300 text-base tabular-nums">{money(analytics.total_sell)}</div>
                </div>
                <div>
                  <div className="font-roboto text-white/40 text-[9px] uppercase tracking-wide">Закупка</div>
                  <div className="font-oswald font-bold text-[#FFD700] text-base tabular-nums">{money(analytics.total_buy)}</div>
                </div>
              </div>
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
                <div className="font-roboto text-white/40 text-[10px] mt-1 tabular-nums">
                  ≈ <span className="text-green-400 font-bold">{stockWeight585.toFixed(2)} г</span> в 585 пробе
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
                {stockWeight585.toFixed(2)} г <span className="text-green-400/70">(в 585)</span> × {pricePerGramNum.toLocaleString("ru-RU")} ₽
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
                <div className="grid px-3 py-1.5 border-b border-[#1F1F1F] bg-[#0F0F0F] gap-1" style={{ gridTemplateColumns: "0.65fr 0.45fr 0.85fr 0.95fr 0.95fr 0.9fr 1.15fr" }}>
                  {["Проба", "Поз.", "Вес", "В 585", "Закупка", "Ср. ₽/г", "Продажа"].map(h => (
                    <div key={h} className="font-roboto text-[9px] text-white/30 uppercase tracking-wide">{h}</div>
                  ))}
                </div>
                {stockByPurityCalc.map(p => {
                  const revenue = Math.round(p.weight585 * pricePerGramNum);
                  const profit = revenue - p.buy_sum;
                  const avgBuyPerGram = p.weight > 0 ? p.buy_sum / p.weight : 0;
                  const breakEven585 = p.weight585 > 0 ? p.buy_sum / p.weight585 : 0;
                  const inProfit = pricePerGramNum > 0 && pricePerGramNum >= breakEven585;
                  return (
                    <div key={p.purity} className="grid px-3 py-2 border-b border-[#141414] last:border-0 items-center gap-1" style={{ gridTemplateColumns: "0.65fr 0.45fr 0.85fr 0.95fr 0.95fr 0.9fr 1.15fr" }}>
                      <div className="font-oswald font-bold text-[#FFD700] text-sm">{p.purity}</div>
                      <div className="font-roboto text-white/60 text-[11px] tabular-nums">{p.count}</div>
                      <div className="font-oswald font-bold text-white text-sm tabular-nums">{p.weight.toFixed(2)} <span className="text-[10px] text-white/40">г</span></div>
                      <div className="flex flex-col leading-tight">
                        <span className="font-oswald font-bold text-green-400 text-sm tabular-nums">{p.weight585.toFixed(2)} <span className="text-[10px] text-green-400/50">г</span></span>
                        <span className="font-roboto text-white/35 text-[9px] tabular-nums">×{p.coef.toFixed(3)}</span>
                      </div>
                      <div className="font-roboto text-white/70 text-[11px] tabular-nums">{p.buy_sum.toLocaleString("ru-RU")}</div>
                      <div className="flex items-center gap-1">
                        <span className={`font-oswald font-bold text-[12px] tabular-nums ${inProfit ? "text-green-400" : "text-orange-400"}`}>
                          {Math.round(avgBuyPerGram).toLocaleString("ru-RU")}
                        </span>
                        {pricePerGramNum > 0 && (
                          <Icon name={inProfit ? "TrendingUp" : "TrendingDown"} size={10} className={inProfit ? "text-green-400/70" : "text-orange-400/70"} />
                        )}
                      </div>
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

            {/* ─── ПРОДАТЬ ВСЁ одним актом ─── */}
            {token && stockCount > 0 && (
              <div className="mt-3 border-t border-[#FFD700]/20 pt-3">
                {!sellAllOpen && !sellAllResult && (
                  <button
                    onClick={() => { setSellAllOpen(true); setSellAllPrice(sellPricePerGram || "6300"); setSellAllError(""); }}
                    className="w-full bg-gradient-to-b from-[#fff3a0] via-[#FFD700] to-[#d4a017] hover:brightness-110 text-black font-oswald font-bold uppercase tracking-wide text-sm py-3 rounded-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-[#FFD700]/20"
                  >
                    <Icon name="Zap" size={16} />
                    Продать всё одним актом
                    <span className="text-black/60 text-xs font-normal">·</span>
                    <span className="text-black/70 text-xs">{stockCount} поз. · {stockWeight.toFixed(2)} г</span>
                  </button>
                )}

                {sellAllOpen && !sellAllResult && (
                  <div className="bg-gradient-to-br from-[#FFD700]/10 to-transparent border border-[#FFD700]/40 rounded-lg p-4 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="flex items-center justify-between">
                      <div className="font-oswald font-bold text-[#FFD700] text-sm uppercase flex items-center gap-1.5">
                        <Icon name="Zap" size={14} />
                        Продажа всего металла
                      </div>
                      <button onClick={() => setSellAllOpen(false)} className="text-white/40 hover:text-white p-1">
                        <Icon name="X" size={14} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-md py-2">
                        <div className="font-roboto text-white/40 text-[9px] uppercase">Будет продано</div>
                        <div className="font-oswald font-bold text-white text-base tabular-nums">{stockWeight.toFixed(2)} <span className="text-[10px] text-white/40">г факт</span></div>
                        <div className="font-oswald font-bold text-green-400 text-sm tabular-nums">{stockWeight585.toFixed(2)} <span className="text-[10px] text-green-400/50">г в 585</span></div>
                      </div>
                      <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-md py-2">
                        <div className="font-roboto text-white/40 text-[9px] uppercase">Позиций</div>
                        <div className="font-oswald font-bold text-white text-2xl tabular-nums">{stockCount}</div>
                      </div>
                    </div>

                    <div>
                      <label className="font-roboto text-white/60 text-[10px] uppercase tracking-wide block mb-1">
                        Цена за 1 грамм 585 пробы, ₽
                      </label>
                      <input
                        type="number"
                        inputMode="decimal"
                        value={sellAllPrice}
                        onChange={e => setSellAllPrice(e.target.value)}
                        className="w-full bg-[#0A0A0A] border border-[#FFD700]/40 focus:border-[#FFD700] outline-none rounded-md px-3 py-2.5 font-oswald font-bold text-[#FFD700] text-2xl tabular-nums text-center"
                      />
                      <div className="font-roboto text-white/40 text-[10px] mt-1.5 text-center">
                        Эквивалент 585. Для 999 пробы = {(sellAllNum * 999 / 585).toLocaleString("ru-RU", { maximumFractionDigits: 0 })} ₽/г
                      </div>
                    </div>

                    <div>
                      <label className="font-roboto text-white/60 text-[10px] uppercase tracking-wide block mb-1">
                        Способ оплаты
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[
                          { v: "cash", l: "Наличные", icon: "Banknote" },
                          { v: "card", l: "Карта", icon: "CreditCard" },
                          { v: "transfer", l: "Перевод", icon: "ArrowRightLeft" },
                        ].map(p => {
                          const a = sellAllPayment === p.v;
                          return (
                            <button key={p.v} onClick={() => setSellAllPayment(p.v)}
                              className={`flex items-center justify-center gap-1 font-roboto text-[10px] uppercase py-2 rounded-md border transition-all active:scale-95 ${
                                a ? "bg-[#FFD700]/15 text-[#FFD700] border-[#FFD700]/40" : "bg-[#0A0A0A] text-white/50 border-[#1F1F1F] hover:text-white"
                              }`}>
                              <Icon name={p.icon} size={11} />{p.l}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-blue-500/10 border border-blue-400/30 rounded-md p-2.5">
                        <div className="font-roboto text-blue-300/70 text-[9px] uppercase">Выручка</div>
                        <div className="font-oswald font-bold text-blue-300 text-lg tabular-nums">{money(sellAllExpectedRevenue)}</div>
                      </div>
                      <div className={`border rounded-md p-2.5 ${sellAllExpectedProfit >= 0 ? "bg-green-500/10 border-green-400/30" : "bg-red-500/10 border-red-400/30"}`}>
                        <div className={`font-roboto text-[9px] uppercase ${sellAllExpectedProfit >= 0 ? "text-green-300/70" : "text-red-300/70"}`}>Прибыль</div>
                        <div className={`font-oswald font-bold text-lg tabular-nums ${sellAllExpectedProfit >= 0 ? "text-green-300" : "text-red-300"}`}>
                          {sellAllExpectedProfit >= 0 ? "+" : ""}{money(sellAllExpectedProfit)}
                        </div>
                      </div>
                    </div>

                    {sellAllError && (
                      <div className="bg-red-500/10 border border-red-500/30 rounded-md px-2 py-1.5 text-red-300 font-roboto text-[11px] flex items-start gap-1.5">
                        <Icon name="AlertCircle" size={12} className="mt-0.5 shrink-0" />
                        {sellAllError}
                      </div>
                    )}

                    <button
                      onClick={doSellAll}
                      disabled={sellAllLoading || sellAllNum <= 0}
                      className="w-full bg-gradient-to-b from-[#fff3a0] via-[#FFD700] to-[#d4a017] hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed text-black font-oswald font-bold uppercase tracking-wide text-sm py-3 rounded-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      {sellAllLoading ? (
                        <><Icon name="Loader" size={14} className="animate-spin" />Продаю...</>
                      ) : (
                        <><Icon name="CheckCircle2" size={14} />Подтвердить продажу всех {stockCount} позиций</>
                      )}
                    </button>
                  </div>
                )}

                {sellAllResult && (
                  <div className="bg-gradient-to-br from-green-500/15 to-transparent border border-green-500/40 rounded-lg p-4 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon name="CheckCircle2" size={18} className="text-green-400" />
                      <div className="font-oswald font-bold text-green-300 text-base uppercase">Продано успешно!</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-md py-2">
                        <div className="font-roboto text-white/40 text-[9px] uppercase">Позиций</div>
                        <div className="font-oswald font-bold text-white text-xl tabular-nums">{sellAllResult.sold_count}</div>
                      </div>
                      <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-md py-2">
                        <div className="font-roboto text-white/40 text-[9px] uppercase">Вес фактический</div>
                        <div className="font-oswald font-bold text-[#FFD700] text-xl tabular-nums">{sellAllResult.total_weight.toFixed(2)} <span className="text-[10px] text-[#FFD700]/60">г</span></div>
                        <div className="font-oswald font-bold text-green-400 text-sm tabular-nums">{sellAllResult.total_weight_585.toFixed(2)} <span className="text-[9px]">г в 585</span></div>
                      </div>
                      <div className="bg-blue-500/10 border border-blue-400/30 rounded-md py-2">
                        <div className="font-roboto text-blue-300/70 text-[9px] uppercase">Выручка</div>
                        <div className="font-oswald font-bold text-blue-300 text-lg tabular-nums">{money(sellAllResult.total_revenue)}</div>
                      </div>
                      <div className={`border rounded-md py-2 ${sellAllResult.total_profit >= 0 ? "bg-green-500/15 border-green-400/40" : "bg-red-500/15 border-red-400/40"}`}>
                        <div className={`font-roboto text-[9px] uppercase ${sellAllResult.total_profit >= 0 ? "text-green-300/70" : "text-red-300/70"}`}>Прибыль</div>
                        <div className={`font-oswald font-bold text-lg tabular-nums ${sellAllResult.total_profit >= 0 ? "text-green-300" : "text-red-300"}`}>
                          {sellAllResult.total_profit >= 0 ? "+" : ""}{money(sellAllResult.total_profit)}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => { setSellAllResult(null); setSellAllOpen(false); }}
                      className="w-full mt-2 bg-[#0A0A0A] border border-[#1F1F1F] text-white/70 hover:text-white font-oswald font-bold uppercase text-xs py-2 rounded-md transition-all"
                    >
                      Закрыть
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

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
      )}
    </div>
  );
}