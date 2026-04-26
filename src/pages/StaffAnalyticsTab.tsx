import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { SALES_URL, type Analytics } from "./staff.types";
import { REPAIR_URL } from "./repair/types";
import { GOLD_URL, type GoldAnalytics } from "./gold/types";
import AnalyticsTotalDay from "./staffAnalytics/AnalyticsTotalDay";
import AnalyticsGoldForecast from "./staffAnalytics/AnalyticsGoldForecast";
import AnalyticsSmartlombard, { type SmartlombardStats } from "./staffAnalytics/AnalyticsSmartlombard";
import AnalyticsRepairAndStaff from "./staffAnalytics/AnalyticsRepairAndStaff";

const SMARTLOMBARD_URL = "https://functions.poehali.dev/e628ca7a-012b-4d92-bf0a-2853b05a7f4e";

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
          <AnalyticsTotalDay
            period={period}
            data={data}
            repairData={repairData}
            goldData={goldData}
            repairNetProfit={repairNetProfit}
            goldForecastProfit={goldForecastProfit}
            goldForecastPriceNum={goldForecastPriceNum}
            slPeriodProfit={slData?.period_profit || 0}
            totalRevenue={totalRevenue}
            totalProfit={totalProfit}
            repairRevenue={repairRevenue}
            repairCosts={repairCosts}
            goldRevenue={goldRevenue}
            goldCosts={goldCosts}
            goldProfit={goldProfit}
            masterIncome={masterIncome}
          />

          <AnalyticsGoldForecast
            goldData={goldData}
            goldForecastPrice={goldForecastPrice}
            setGoldForecastPrice={setGoldForecastPrice}
            periodBuySum={periodBuySum}
            periodWeight585={periodWeight585}
            periodBuyCount={periodBuyCount}
            goldForecastRevenue={goldForecastRevenue}
            goldForecastProfit={goldForecastProfit}
          />

          <AnalyticsSmartlombard
            period={period}
            slData={slData}
            slLoading={slLoading}
            slError={slError}
            loadSmartlombard={loadSmartlombard}
          />

          <AnalyticsRepairAndStaff
            data={data}
            repairData={repairData}
            TYPE_LABELS={TYPE_LABELS}
          />
        </>
      )}
    </div>
  );
}
