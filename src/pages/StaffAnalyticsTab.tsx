import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { SALES_URL, type Analytics } from "./staff.types";
import { REPAIR_URL } from "./repair/types";
import { GOLD_URL, type GoldAnalytics } from "./gold/types";

const SMARTLOMBARD_URL = "https://functions.poehali.dev/e628ca7a-012b-4d92-bf0a-2853b05a7f4e";

type SmartlombardStats = {
  date_from: string;
  date_to: string;
  income: number;
  expense: number;
  period_income: number;
  period_costs: number;
  period_profit: number;
};

type RepairAnalytics = {
  total: number; done: number; revenue: number; costs: number;
  profit: number; master_total: number;
  daily: { day: string; revenue: number; costs: number; profit: number; done: number }[];
};

export function AnalyticsTab({ token }: { token: string }) {
  const [period, setPeriod] = useState("week");
  const [data, setData] = useState<Analytics | null>(null);
  const [repairData, setRepairData] = useState<RepairAnalytics | null>(null);
  const [goldData, setGoldData] = useState<GoldAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [slData, setSlData] = useState<SmartlombardStats | null>(null);
  const [slLoading, setSlLoading] = useState(false);
  const [slError, setSlError] = useState<string | null>(null);

  const repairPeriod = period === "today" ? "day" : period === "yesterday" ? "yesterday" : period === "week" ? "week" : "month";

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [salesRes, repairRes, goldRes] = await Promise.all([
        fetch(`${SALES_URL}?action=analytics&period=${period}`, { headers: { "X-Employee-Token": token } }),
        fetch(`${REPAIR_URL}?action=analytics&period=${repairPeriod}`, { headers: { "X-Employee-Token": token } }),
        fetch(`${GOLD_URL}?action=analytics&period=${repairPeriod}`, { headers: { "X-Employee-Token": token } }),
      ]);
      const [salesD, repairD, goldD] = await Promise.all([salesRes.json(), repairRes.json(), goldRes.json()]);
      if (salesD && typeof salesD === "object" && !salesD.error) setData(salesD);
      if (repairD && typeof repairD === "object" && !repairD.error) {
        setRepairData({ total: 0, done: 0, revenue: 0, costs: 0, profit: 0, master_total: 0, daily: [], ...repairD });
      }
      if (goldD && typeof goldD === "object" && !goldD.error) {
        setGoldData(goldD);
      }
    } catch (e) {
      setError("Ошибка загрузки данных. Попробуйте обновить.");
      console.error("[AnalyticsTab]", e);
    } finally {
      setLoading(false);
    }
  }, [period, repairPeriod, token]);

  useEffect(() => { load(); }, [load]);

  // smartlombard: подгружаем при сегодня/вчера (force=true — мимо кэша)
  const loadSmartlombard = useCallback(async (force = false) => {
    if (period !== "today" && period !== "yesterday") {
      setSlData(null);
      setSlError(null);
      return;
    }
    setSlLoading(true);
    setSlError(null);
    try {
      const now = new Date();
      const msk = new Date(now.getTime() + (now.getTimezoneOffset() + 180) * 60000);
      if (period === "yesterday") msk.setDate(msk.getDate() - 1);
      const date = msk.toISOString().slice(0, 10);
      const url = `${SMARTLOMBARD_URL}?date=${date}${force ? "&nocache=1" : ""}`;
      const res = await fetch(url, { headers: { "X-Employee-Token": token } });
      const d = await res.json();
      if (d && !d.error) setSlData(d);
      else setSlError(d?.error || "Ошибка загрузки smartlombard");
    } catch (e) {
      setSlError("Не удалось получить данные smartlombard");
      console.error("[smartlombard]", e);
    } finally {
      setSlLoading(false);
    }
  }, [period, token]);

  useEffect(() => { loadSmartlombard(false); }, [loadSmartlombard]);

  const PERIODS = [
    { v: "today", l: "Сегодня" },
    { v: "yesterday", l: "Вчера" },
    { v: "week", l: "7 дней" },
    { v: "month", l: "30 дней" },
  ];
  const TYPE_LABELS: Record<string, string> = { goods: "📦 Продажи", repair: "🔧 Ремонт", purchase: "💰 Закупка" };

  const repairRevenue = repairData?.revenue || 0;
  const repairCosts = repairData?.costs || 0;
  const repairProfit = repairData?.profit || 0;
  const masterIncome = repairData?.master_total || 0;
  const repairNetProfit = repairProfit - masterIncome;

  const goldRevenue = goldData?.total_sell || 0;
  const goldCosts = goldData?.total_buy || 0;
  const goldProfit = goldData?.total_profit || 0;

  // Прогноз с золота по дате закупки за период (вручную задаваемая цена)
  const [goldForecastPrice, setGoldForecastPrice] = useState<string>("6300");
  const goldForecastPriceNum = parseFloat(goldForecastPrice) || 0;
  const periodBuySum = goldData?.period_buy_sum || 0;
  const periodWeight585 = goldData?.period_weight585 || 0;
  const periodBuyCount = goldData?.period_buy_count || 0;
  const goldForecastRevenue = Math.round(periodWeight585 * goldForecastPriceNum);
  const goldForecastProfit = goldForecastRevenue - periodBuySum;

  const totalRevenue = (data?.total_revenue || 0) + repairRevenue + goldRevenue;
  const totalProfit = repairNetProfit + goldProfit;

  const dailyRepair = repairData?.daily || [];
  const maxRevRepair = dailyRepair.length > 0 ? Math.max(...dailyRepair.map(d => d.revenue), 1) : 1;

  return (
    <div className="p-3">
      {/* Premium переключатель периода */}
      <div className="flex gap-1.5 mb-3 flex-wrap items-center">
        {PERIODS.map(p => {
          const active = period === p.v;
          return (
            <button key={p.v} onClick={() => setPeriod(p.v)}
              className={`font-roboto text-[11px] px-3 py-1.5 rounded-full transition-all active:scale-95 ${
                active
                  ? "bg-[#FFD700] text-black font-bold shadow-md shadow-[#FFD700]/20"
                  : "bg-[#141414] border border-[#1F1F1F] text-white/50 hover:text-white hover:border-[#333]"
              }`}>
              {p.l}
            </button>
          );
        })}
        <button onClick={load} disabled={loading}
          className="ml-auto text-white/40 hover:text-[#FFD700] active:scale-90 p-2 rounded-md transition-all hover:bg-white/5">
          <Icon name={loading ? "Loader" : "RefreshCw"} size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 font-roboto text-sm p-3 mb-4 rounded-lg flex items-center gap-2">
          <Icon name="AlertCircle" size={14} />
          {error}
          <button onClick={load} className="ml-auto underline text-red-400/70 hover:text-red-400">Повторить</button>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-14 gap-2 text-white/40">
          <Icon name="Loader" size={18} className="animate-spin text-[#FFD700]" />
          <span className="font-roboto text-sm">Загружаю аналитику...</span>
        </div>
      )}

      {!loading && (
        <>
          {/* ИТОГО ЗА ДЕНЬ — ремонт + золото (прогноз) + б/у техника */}
          {(() => {
            const repairPart = repairNetProfit;
            const goldPart = goldForecastProfit;
            const slPart = slData?.period_profit || 0;
            const totalDay = repairPart + goldPart + slPart;
            const periodLabel =
              period === "today" ? "сегодня" :
              period === "yesterday" ? "вчера" :
              period === "week" ? "за 7 дней" : "за 30 дней";
            return (
              <div className="relative bg-gradient-to-br from-emerald-500/15 via-[#FFD700]/8 to-purple-500/10 border border-emerald-400/30 rounded-xl p-4 mb-3 overflow-hidden">
                <div className="absolute -top-8 -right-8 text-[120px] opacity-[0.05] select-none">💎</div>
                <div className="relative">
                  <div className="font-roboto text-emerald-300/80 text-[10px] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Icon name="Sparkles" size={12} />
                    Итого прибыль · {periodLabel}
                  </div>
                  <div className={`font-oswald font-bold text-5xl tabular-nums mb-3 ${totalDay >= 0 ? "text-emerald-300" : "text-red-300"}`}>
                    {totalDay >= 0 ? "+" : ""}{totalDay.toLocaleString("ru-RU")} ₽
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-black/40 border border-[#1F1F1F] rounded-lg p-2.5">
                      <div className="font-roboto text-white/40 text-[9px] uppercase tracking-wide mb-0.5 flex items-center gap-1">🔧 Ремонт</div>
                      <div className={`font-oswald font-bold text-base tabular-nums ${repairPart >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {repairPart >= 0 ? "+" : ""}{repairPart.toLocaleString("ru-RU")}
                      </div>
                    </div>
                    <div className="bg-black/40 border border-[#1F1F1F] rounded-lg p-2.5">
                      <div className="font-roboto text-white/40 text-[9px] uppercase tracking-wide mb-0.5 flex items-center gap-1">🥇 Золото</div>
                      <div className={`font-oswald font-bold text-base tabular-nums ${goldPart >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {goldPart >= 0 ? "+" : ""}{goldPart.toLocaleString("ru-RU")}
                      </div>
                      <div className="font-roboto text-white/30 text-[9px] tabular-nums mt-0.5">по {goldForecastPriceNum.toLocaleString("ru-RU")} ₽/г</div>
                    </div>
                    <div className="bg-black/40 border border-[#1F1F1F] rounded-lg p-2.5">
                      <div className="font-roboto text-white/40 text-[9px] uppercase tracking-wide mb-0.5 flex items-center gap-1">📦 Б/У</div>
                      <div className={`font-oswald font-bold text-base tabular-nums ${slPart >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {(period === "today" || period === "yesterday")
                          ? `${slPart >= 0 ? "+" : ""}${slPart.toLocaleString("ru-RU")}`
                          : <span className="text-white/30 text-xs font-normal">—</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Premium ОБЩИЙ ДОХОД */}
          <div className="relative bg-gradient-to-br from-[#FFD700]/15 via-green-500/8 to-transparent border border-[#FFD700]/30 rounded-xl p-4 mb-3 overflow-hidden">
            <div className="absolute -top-10 -right-10 text-[140px] opacity-[0.04] select-none">💰</div>
            <div className="relative">
              <div className="font-roboto text-[#FFD700]/80 text-[10px] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Icon name="TrendingUp" size={12} />
                Общий доход · Ремонт + Золото
              </div>
              <div className="flex items-end justify-between gap-2 mb-3">
                <div>
                  <div className={`font-oswald font-bold text-4xl tabular-nums ${totalProfit >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {totalProfit.toLocaleString("ru-RU")} ₽
                  </div>
                  <div className="font-roboto text-white/40 text-[10px] mt-0.5">чистая прибыль</div>
                </div>
                <div className="text-right">
                  <div className="font-oswald font-bold text-xl text-[#FFD700] tabular-nums">{totalRevenue.toLocaleString("ru-RU")} ₽</div>
                  <div className="font-roboto text-white/30 text-[9px]">выручка</div>
                </div>
              </div>

              {/* Разбивка */}
              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[#FFD700]/20">
                {/* Ремонт */}
                <div className="bg-black/40 backdrop-blur border border-[#1F1F1F] rounded-lg p-2.5 hover:border-[#FFD700]/30 transition-colors">
                  <div className="font-roboto text-white/50 text-[9px] uppercase tracking-wide mb-1 flex items-center gap-1">
                    <span>🔧</span> Ремонт
                  </div>
                  <div className={`font-oswald font-bold text-lg tabular-nums ${repairNetProfit >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {repairNetProfit.toLocaleString("ru-RU")} ₽
                  </div>
                  <div className="font-roboto text-[9px] leading-tight mt-1 space-y-0.5">
                    <div className="text-white/40">выручка: <span className="text-[#FFD700]/80 font-bold tabular-nums">{repairRevenue.toLocaleString("ru-RU")}</span></div>
                    <div className="text-white/40">закупка: <span className="text-orange-400/80 font-bold tabular-nums">{repairCosts.toLocaleString("ru-RU")}</span></div>
                    {masterIncome > 0 && <div className="text-white/40">мастер: <span className="text-blue-400/80 font-bold tabular-nums">{masterIncome.toLocaleString("ru-RU")}</span></div>}
                  </div>
                </div>

                {/* Золото */}
                <div className="bg-black/40 backdrop-blur border border-[#1F1F1F] rounded-lg p-2.5 hover:border-[#FFD700]/30 transition-colors">
                  <div className="font-roboto text-white/50 text-[9px] uppercase tracking-wide mb-1 flex items-center gap-1">
                    <span>🥇</span> Золото
                  </div>
                  <div className={`font-oswald font-bold text-lg tabular-nums ${goldProfit >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {goldProfit.toLocaleString("ru-RU")} ₽
                  </div>
                  <div className="font-roboto text-[9px] leading-tight mt-1 space-y-0.5">
                    <div className="text-white/40">продажа: <span className="text-[#FFD700]/80 font-bold tabular-nums">{goldRevenue.toLocaleString("ru-RU")}</span></div>
                    <div className="text-white/40">закупка: <span className="text-orange-400/80 font-bold tabular-nums">{goldCosts.toLocaleString("ru-RU")}</span></div>
                    {goldData && goldData.total_weight > 0 && <div className="text-white/40">вес: <span className="text-white/60 font-bold tabular-nums">{goldData.total_weight.toFixed(2)} г</span></div>}
                  </div>
                </div>
              </div>

              {/* Количество сделок */}
              <div className="flex gap-3 mt-2.5 pt-2.5 border-t border-[#FFD700]/15 text-[10px] font-roboto flex-wrap">
                <span className="text-white/40 flex items-center gap-1">
                  <Icon name="CheckCircle2" size={10} />
                  Всего: <span className="text-white font-bold tabular-nums">{(data?.total_deals || 0) + (repairData?.done || 0) + (goldData?.done || 0)}</span>
                </span>
                <span className="text-white/40">🔧 <span className="text-green-400 font-bold tabular-nums">{repairData?.done || 0}</span></span>
                <span className="text-white/40">🥇 <span className="text-green-400 font-bold tabular-nums">{goldData?.done || 0}</span></span>
              </div>
            </div>
          </div>

          {/* Доход мастера — premium */}
          {masterIncome > 0 && (
            <div className="relative bg-gradient-to-br from-green-500/15 to-green-500/5 border border-green-500/30 rounded-xl p-4 mb-3 overflow-hidden">
              <div className="absolute -top-6 -right-4 text-7xl opacity-10 select-none">🏆</div>
              <div className="relative flex items-center justify-between">
                <div>
                  <div className="font-roboto text-green-400/70 text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Icon name="Award" size={12} />
                    Доход мастера · 50% прибыли
                  </div>
                  <div className="font-oswald font-bold text-green-400 text-3xl tabular-nums">{masterIncome.toLocaleString("ru-RU")} ₽</div>
                </div>
              </div>
            </div>
          )}

          {/* Прогноз прибыли с золота по дате закупки */}
          {goldData && (periodBuyCount > 0 || (goldData.stock_count || 0) > 0) && (
            <div className="relative bg-gradient-to-br from-[#FFD700]/10 via-yellow-500/5 to-transparent border border-[#FFD700]/25 rounded-xl p-4 mb-3 overflow-hidden">
              <div className="absolute -top-6 -right-6 text-7xl opacity-[0.06] select-none">🥇</div>
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-roboto text-[#FFD700]/80 text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                    <Icon name="Calculator" size={12} />
                    Прогноз с золота · по дате закупки
                  </div>
                  <span className="font-roboto text-white/30 text-[10px]">{periodBuyCount} поз.</span>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-black/40 border border-[#1F1F1F] rounded-lg p-3">
                    <div className="font-roboto text-white/40 text-[10px] uppercase tracking-wide mb-1">Вес за период (в 585)</div>
                    <div className="font-oswald font-bold text-green-400 text-2xl tabular-nums">{periodWeight585.toFixed(2)} <span className="text-sm text-green-400/60">г</span></div>
                    <div className="font-roboto text-white/30 text-[10px] mt-0.5">закупка: <span className="text-[#FFD700]/80 tabular-nums">{periodBuySum.toLocaleString("ru-RU")} ₽</span></div>
                  </div>
                  <div className="bg-black/40 border border-[#1F1F1F] rounded-lg p-3">
                    <div className="font-roboto text-white/40 text-[10px] uppercase tracking-wide mb-1">Цена продажи ₽/г</div>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={goldForecastPrice}
                      onChange={(e) => setGoldForecastPrice(e.target.value)}
                      placeholder="6300"
                      className="w-full bg-[#0D0D0D] border border-[#1F1F1F] focus:border-[#FFD700]/50 outline-none rounded-md px-2 py-1.5 font-oswald font-bold text-[#FFD700] text-xl tabular-nums"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-blue-500/10 border border-blue-400/20 rounded-lg p-3">
                    <div className="font-roboto text-blue-300/70 text-[10px] uppercase tracking-wide mb-1">Прогноз продажи</div>
                    <div className="font-oswald font-bold text-blue-300 text-xl tabular-nums">{goldForecastRevenue.toLocaleString("ru-RU")} ₽</div>
                  </div>
                  <div className={`border rounded-lg p-3 ${goldForecastProfit >= 0 ? "bg-green-500/10 border-green-400/20" : "bg-red-500/10 border-red-400/20"}`}>
                    <div className={`font-roboto text-[10px] uppercase tracking-wide mb-1 ${goldForecastProfit >= 0 ? "text-green-300/70" : "text-red-300/70"}`}>Прибыль (прогноз)</div>
                    <div className={`font-oswald font-bold text-xl tabular-nums ${goldForecastProfit >= 0 ? "text-green-300" : "text-red-300"}`}>
                      {goldForecastProfit >= 0 ? "+" : ""}{goldForecastProfit.toLocaleString("ru-RU")} ₽
                    </div>
                  </div>
                </div>

                <div className="font-roboto text-white/30 text-[9px] mt-2">
                  Учитывается дата закупки. Вес пересчитан в 585 пробу. Без отменённых.
                </div>
              </div>
            </div>
          )}

          {/* Smartlombard — Продажи б/у техники за день */}
          {(period === "today" || period === "yesterday") && (
            <div className="relative bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-transparent border border-purple-400/25 rounded-xl p-4 mb-3 overflow-hidden">
              <div className="absolute -top-6 -right-6 text-7xl opacity-[0.06] select-none">📦</div>
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-roboto text-purple-300/80 text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                    <Icon name="ShoppingCart" size={12} />
                    Продажи б/у техники · smartlombard
                  </div>
                  <div className="flex items-center gap-2">
                    {slData && <span className="font-roboto text-white/30 text-[10px] tabular-nums">{slData.date_from}{(slData as SmartlombardStats & { cached?: boolean }).cached ? " · кэш" : ""}</span>}
                    <button onClick={() => loadSmartlombard(true)} disabled={slLoading}
                      className="text-white/40 hover:text-purple-300 active:scale-90 p-1 rounded transition-all">
                      <Icon name={slLoading ? "Loader" : "RefreshCw"} size={11} className={slLoading ? "animate-spin" : ""} />
                    </button>
                  </div>
                </div>

                {slError && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-400 font-roboto text-[11px] p-2 mb-2 rounded-md flex items-center gap-1.5">
                    <Icon name="AlertCircle" size={11} />
                    {slError}
                  </div>
                )}

                {!slError && slData && (
                  <>
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      <div className="bg-black/40 border border-[#1F1F1F] rounded-lg p-2.5">
                        <div className="font-roboto text-white/40 text-[9px] uppercase tracking-wide mb-0.5">Приход</div>
                        <div className="font-oswald font-bold text-green-400 text-lg tabular-nums">{slData.income.toLocaleString("ru-RU")} ₽</div>
                      </div>
                      <div className="bg-black/40 border border-[#1F1F1F] rounded-lg p-2.5">
                        <div className="font-roboto text-white/40 text-[9px] uppercase tracking-wide mb-0.5">Расход</div>
                        <div className="font-oswald font-bold text-orange-400 text-lg tabular-nums">{slData.expense.toLocaleString("ru-RU")} ₽</div>
                      </div>
                      <div className={`border rounded-lg p-2.5 ${slData.period_profit >= 0 ? "bg-green-500/10 border-green-400/20" : "bg-red-500/10 border-red-400/20"}`}>
                        <div className={`font-roboto text-[9px] uppercase tracking-wide mb-0.5 ${slData.period_profit >= 0 ? "text-green-300/70" : "text-red-300/70"}`}>Прибыль</div>
                        <div className={`font-oswald font-bold text-lg tabular-nums ${slData.period_profit >= 0 ? "text-green-300" : "text-red-300"}`}>
                          {slData.period_profit >= 0 ? "+" : ""}{slData.period_profit.toLocaleString("ru-RU")} ₽
                        </div>
                      </div>
                    </div>
                    <div className="font-roboto text-white/30 text-[9px] flex flex-wrap gap-x-3 gap-y-0.5">
                      <span>Доход за период: <span className="text-white/60 tabular-nums">{slData.period_income.toLocaleString("ru-RU")} ₽</span></span>
                      <span>Затраты: <span className="text-white/60 tabular-nums">{slData.period_costs.toLocaleString("ru-RU")} ₽</span></span>
                    </div>
                  </>
                )}

                {!slError && !slData && slLoading && (
                  <div className="font-roboto text-white/40 text-[11px] flex items-center gap-1.5 py-2">
                    <Icon name="Loader" size={11} className="animate-spin text-purple-300" />
                    Загружаю данные smartlombard…
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Ремонт: статусы — premium */}
          {repairData && (
            <div className="bg-gradient-to-br from-[#141414] to-[#0A0A0A] border border-[#1F1F1F] rounded-lg p-3 mb-3">
              <div className="font-roboto text-white/50 text-[10px] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Icon name="Wrench" size={11} className="text-[#FFD700]/60" />
                Ремонт за период
              </div>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {[
                  { label: "Всего", value: repairData.total, color: "text-white", bg: "bg-white/5" },
                  { label: "Выдано", value: repairData.done, color: "text-green-400", bg: "bg-green-500/5" },
                  { label: "Выручка", value: (repairData.revenue || 0).toLocaleString("ru-RU"), color: "text-[#FFD700]", bg: "bg-[#FFD700]/5" },
                  { label: "Закупка", value: (repairData.costs || 0).toLocaleString("ru-RU"), color: "text-orange-400", bg: "bg-orange-500/5" },
                ].map(c => (
                  <div key={c.label} className={`${c.bg} border border-[#1F1F1F] rounded-md p-2 text-center`}>
                    <div className={`font-oswald font-bold text-sm ${c.color} tabular-nums`}>{c.value}</div>
                    <div className="font-roboto text-white/40 text-[9px] mt-0.5">{c.label}</div>
                  </div>
                ))}
              </div>

              {/* Мини-график ремонта по дням */}
              {dailyRepair.length > 1 && (
                <div className="space-y-1 mt-3 pt-3 border-t border-[#1F1F1F]">
                  <div className="font-roboto text-white/30 text-[9px] uppercase tracking-wide mb-1">Динамика (7 дней)</div>
                  {dailyRepair.slice().reverse().slice(0, 7).map(d => {
                    const barW = Math.round((d.revenue / maxRevRepair) * 100);
                    const profitBarW = Math.round((Math.max(0, d.profit) / maxRevRepair) * 100);
                    return (
                      <div key={d.day} className="flex items-center gap-2">
                        <span className="font-roboto text-[9px] text-white/40 w-10 shrink-0 tabular-nums">
                          {new Date(d.day).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" })}
                        </span>
                        <div className="flex-1 h-4 bg-[#0A0A0A] rounded-sm relative overflow-hidden border border-[#1A1A1A]">
                          <div className="h-full bg-gradient-to-r from-[#FFD700]/30 to-[#FFD700]/10 absolute left-0 top-0 transition-all" style={{ width: barW + "%" }} />
                          <div className="h-full bg-gradient-to-r from-green-500/40 to-green-500/20 absolute left-0 top-0 transition-all" style={{ width: profitBarW + "%" }} />
                        </div>
                        <span className="font-roboto text-[9px] text-white/40 w-16 text-right shrink-0 tabular-nums">
                          {d.revenue > 0 ? d.revenue.toLocaleString("ru-RU") + "₽" : "—"}
                        </span>
                        <span className={`font-roboto text-[9px] w-14 text-right shrink-0 tabular-nums font-bold ${d.profit > 0 ? "text-green-400" : d.profit < 0 ? "text-red-400" : "text-white/20"}`}>
                          {d.profit !== 0 ? (d.profit > 0 ? "+" : "") + d.profit.toLocaleString("ru-RU") : "—"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* По направлениям (продажи) */}
          {Object.entries(data?.by_type || {}).length > 0 && (
            <div className="bg-gradient-to-br from-[#141414] to-[#0A0A0A] border border-[#1F1F1F] rounded-lg p-3 mb-3">
              <div className="font-roboto text-white/50 text-[10px] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Icon name="PieChart" size={11} className="text-[#FFD700]/60" />
                По направлениям
              </div>
              {Object.entries(data!.by_type).map(([type, stat]) => (
                <div key={type} className="flex justify-between items-center py-2 border-b border-[#1A1A1A] last:border-0">
                  <span className="font-roboto text-sm text-white/80">{TYPE_LABELS[type] || type}</span>
                  <div className="text-right">
                    <span className="font-oswald font-bold text-[#FFD700] text-sm tabular-nums">{(stat.sum || 0).toLocaleString("ru-RU")} ₽</span>
                    <span className="font-roboto text-white/40 text-[10px] ml-2 tabular-nums">· {stat.count} сд.</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Рейтинг сотрудников — premium */}
          {(data?.staff_stats?.length || 0) > 0 && (
            <div className="bg-gradient-to-br from-[#141414] to-[#0A0A0A] border border-[#1F1F1F] rounded-lg p-3">
              <div className="font-roboto text-white/50 text-[10px] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Icon name="Trophy" size={11} className="text-[#FFD700]/60" />
                Рейтинг сотрудников
              </div>
              {data!.staff_stats.map((s, i) => {
                const medals = ["🥇", "🥈", "🥉"];
                return (
                  <div key={i} className={`flex items-center justify-between py-2.5 px-2 rounded-md border-b border-[#1A1A1A] last:border-0 ${
                    i === 0 ? "bg-gradient-to-r from-[#FFD700]/10 to-transparent" : ""
                  }`}>
                    <div className="flex items-center gap-2.5">
                      {i < 3 ? (
                        <span className="text-lg">{medals[i]}</span>
                      ) : (
                        <span className="font-oswald font-bold text-white/30 text-sm w-6 text-center tabular-nums">{i + 1}</span>
                      )}
                      <span className={`font-roboto text-sm ${i === 0 ? "text-white font-bold" : "text-white/80"}`}>{s.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-oswald font-bold text-[#FFD700] text-sm tabular-nums">{(s.revenue || 0).toLocaleString("ru-RU")} ₽</div>
                      <div className="font-roboto text-white/40 text-[10px] tabular-nums">{s.deals} сделок</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}