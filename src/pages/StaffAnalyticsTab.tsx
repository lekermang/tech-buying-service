import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { SALES_URL, type Analytics } from "./staff.types";
import { REPAIR_URL } from "./repair/types";
import { GOLD_URL, type GoldAnalytics } from "./gold/types";
import AnalyticsTotalDay from "./staffAnalytics/AnalyticsTotalDay";
import AnalyticsGoldForecast from "./staffAnalytics/AnalyticsGoldForecast";
import AnalyticsSmartlombard, { type SmartlombardStats } from "./staffAnalytics/AnalyticsSmartlombard";
import AnalyticsRepairAndStaff from "./staffAnalytics/AnalyticsRepairAndStaff";
import PeriodPicker from "./staffAnalytics/PeriodPicker";
import { SLSHOP_URL } from "./staff.types";
import FinanceTab from "./staffAnalytics/finance/FinanceTab";

type RepairAnalytics = {
  total: number; done: number; revenue: number; costs: number;
  profit: number; master_total: number;
  daily: { day: string; revenue: number; costs: number; profit: number; done: number }[];
  done_items?: {
    id: number;
    model: string;
    repair_type: string;
    client_name: string;
    master_name: string;
    revenue: number;
    costs: number;
    master_income: number;
    profit: number;
    done_at: string | null;
    created_at: string | null;
    status: string;
  }[];
};

export function AnalyticsTab({ token }: { token: string }) {
  const [view, setView] = useState<"overview" | "finance">(() => {
    try { return (localStorage.getItem("staff_analytics_view") as "overview" | "finance") || "overview"; }
    catch { return "overview"; }
  });
  useEffect(() => { try { localStorage.setItem("staff_analytics_view", view); } catch {/* */} }, [view]);

  const [period, setPeriod] = useState("week");
  const [customRange, setCustomRange] = useState<{ from: string; to: string } | null>(null);
  const [data, setData] = useState<Analytics | null>(null);
  const [repairData, setRepairData] = useState<RepairAnalytics | null>(null);
  const [goldData, setGoldData] = useState<GoldAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [slData, setSlData] = useState<SmartlombardStats | null>(null);
  const [slLoading, setSlLoading] = useState(false);
  const [slError, setSlError] = useState<string | null>(null);

  const repairPeriod = period === "today" ? "day" : period === "yesterday" ? "yesterday" : period === "week" ? "week" : period === "custom" ? "custom" : "month";

  // Хвост query string для кастомного периода
  const customQS = period === "custom" && customRange
    ? `&date_from=${customRange.from}&date_to=${customRange.to}`
    : "";

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [salesRes, repairRes, goldRes] = await Promise.all([
        fetch(`${SALES_URL}?action=analytics&period=${period}${customQS}`, { headers: { "X-Employee-Token": token } }),
        fetch(`${REPAIR_URL}?action=analytics&period=${repairPeriod}${customQS}`, { headers: { "X-Employee-Token": token } }),
        fetch(`${GOLD_URL}?action=analytics&period=${repairPeriod}${customQS}`, { headers: { "X-Employee-Token": token } }),
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
  }, [period, repairPeriod, token, customQS]);

  useEffect(() => { load(); }, [load]);

  // smartlombard (комиссионка): берём из нашей БД через slshop?action=stats
  const loadSmartlombard = useCallback(async (_force = false) => {
    setSlLoading(true);
    setSlError(null);
    try {
      const periodMap: Record<string, string> = { today: "today", yesterday: "yesterday", week: "7d", month: "30d", custom: "custom" };
      const p = periodMap[period] || "30d";
      const url = `${SLSHOP_URL}?action=stats&period=${p}${customQS}`;
      const res = await fetch(url, { headers: { "X-Employee-Token": token } });
      const d = await res.json();
      if (d && !d.error) {
        const revenue = Number(d.revenue) || 0;
        const spent = Number(d.spent) || 0;
        const profit = Number(d.profit) || (revenue - spent);
        setSlData({
          date_from: d.date_from || "",
          date_to: d.date_to || "",
          income: revenue,
          expense: spent,
          period_income: revenue,
          period_costs: spent,
          period_profit: profit,
          kom_income: revenue,
          kom_costs: spent,
          kom_profit: profit,
          sales_total: revenue,
          sales_count: Number(d.sold_count) || 0,
          buyout_total: spent,
          buyout_count: Number(d.bought_count) || 0,
          sold_items: Array.isArray(d.sold_items) ? d.sold_items : [],
          bought_items: Array.isArray(d.bought_items) ? d.bought_items : [],
          cached: false,
        });
      } else {
        setSlError(d?.error || "Ошибка загрузки данных");
      }
    } catch (e) {
      setSlError("Не удалось получить данные комиссионки");
      console.error("[smartlombard]", e);
    } finally {
      setSlLoading(false);
    }
  }, [period, token, customQS]);

  useEffect(() => { loadSmartlombard(false); }, [loadSmartlombard]);

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

  // Продажа б/у: прибыль = выручка − себестоимость проданных товаров (buy_price каждого).
  // Скупки за период (непроданные) показываются отдельно как "вложено в товар".
  const hasKom = !!slData && (slData.kom_income !== undefined || slData.kom_profit !== undefined);
  const slRevenue = hasKom ? (slData?.kom_income || 0) : (slData?.income || 0);
  const slCosts = hasKom ? (slData?.kom_costs || 0) : (slData?.expense || 0);
  // Прибыль = выручка − себестоимость проданного (сумма profit по sold_items)
  const slSalesRevenue = slData?.sales_total || slRevenue;
  const slProfitFromItems = (slData?.sold_items || []).reduce((s, it) => s + (it.profit || 0), 0);
  const slProfit = slProfitFromItems || (hasKom ? (slData?.kom_profit || 0) : (slData?.period_profit || 0));

  const totalRevenue = (data?.total_revenue || 0) + repairRevenue + goldRevenue + slRevenue;
  const totalProfit = repairNetProfit + goldProfit + slProfit;

  return (
    <div className="p-3">
      {/* Переключатель Обзор / Финансы */}
      <div className="inline-flex mb-3 p-1 rounded-full bg-gradient-to-br from-[#0E0E0E] to-[#080808] border border-[#1F1F1F]">
        <button
          onClick={() => setView("overview")}
          className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition inline-flex items-center gap-1.5 ${
            view === "overview"
              ? "bg-gradient-to-b from-[#FFE34D] to-[#d4a017] text-black shadow-[0_3px_10px_rgba(255,215,0,0.4)]"
              : "text-white/55 hover:text-[#FFD700]"
          }`}
        >
          <Icon name="LayoutDashboard" size={12} />
          Обзор
        </button>
        <button
          onClick={() => setView("finance")}
          className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition inline-flex items-center gap-1.5 ${
            view === "finance"
              ? "bg-gradient-to-b from-[#FFE34D] to-[#d4a017] text-black shadow-[0_3px_10px_rgba(255,215,0,0.4)]"
              : "text-white/55 hover:text-[#FFD700]"
          }`}
        >
          <Icon name="LineChart" size={12} />
          Финансы
        </button>
      </div>

      {view === "finance" && <FinanceTab token={token} />}

      {view === "overview" && (
      <>
      <PeriodPicker
        period={period}
        setPeriod={setPeriod}
        customRange={customRange}
        setCustomRange={setCustomRange}
        onRefresh={load}
        loading={loading}
      />

      {error && (
        <div className="relative bg-gradient-to-r from-red-500/15 to-red-500/5 border border-red-500/40 text-red-300 font-roboto text-sm p-3 mb-4 rounded-lg flex items-center gap-2 shadow-[0_0_14px_rgba(239,68,68,0.20)]">
          <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-400/60 to-transparent" />
          <span className="relative">
            <span className="absolute inset-0 rounded-full bg-red-400/40 blur-sm animate-pulse" />
            <Icon name="AlertCircle" size={14} className="relative" />
          </span>
          <span className="relative">{error}</span>
          <button onClick={load} className="relative ml-auto underline text-red-300 hover:text-white transition-colors">Повторить</button>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-14 gap-2 text-white/40">
          <div className="relative">
            <span className="absolute inset-0 rounded-full bg-[#FFD700]/30 blur-md animate-pulse" />
            <Icon name="Loader" size={22} className="relative animate-spin text-[#FFD700] drop-shadow-[0_0_8px_rgba(255,215,0,0.7)]" />
          </div>
          <span className="font-roboto text-sm">Загружаю аналитику…</span>
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
            slPeriodProfit={slProfit}
            totalRevenue={totalRevenue}
            totalProfit={totalProfit}
            repairRevenue={repairRevenue}
            repairCosts={repairCosts}
            goldRevenue={goldRevenue}
            goldCosts={goldCosts}
            goldProfit={goldProfit}
            masterIncome={masterIncome}
            slRevenue={slRevenue}
            slExpense={slCosts}
            slSalesTotal={slData?.sales_total || 0}
            slSalesCount={slData?.sales_count || 0}
            slBuyoutTotal={slData?.buyout_total || 0}
            slBuyoutCount={slData?.buyout_count || 0}
            slData={slData}
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
            token={token}
            smartlombardUrl={SLSHOP_URL}
          />

          <AnalyticsRepairAndStaff
            data={data}
            repairData={repairData}
            TYPE_LABELS={TYPE_LABELS}
          />
        </>
      )}
      </>
      )}
    </div>
  );
}