import { useState } from "react";
import Icon from "@/components/ui/icon";
import { GoldAnalytics, GOLD_URL, money } from "./types";

type Props = {
  analytics: GoldAnalytics;
  sellPricePerGram: string;
  setSellPricePerGram: (v: string) => void;
  token?: string;
  onSold?: () => void;
};

export default function GoldStockBlock({ analytics, sellPricePerGram, setSellPricePerGram, token, onSold }: Props) {
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
  );
}
