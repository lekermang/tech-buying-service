import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { SALES_URL, type Analytics } from "./staff.types";
import { REPAIR_URL } from "./repair/types";
import { GOLD_URL, type GoldAnalytics } from "./gold/types";

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

  const totalRevenue = (data?.total_revenue || 0) + repairRevenue + goldRevenue;
  const totalProfit = repairNetProfit + goldProfit;

  const dailyRepair = repairData?.daily || [];
  const maxRevRepair = dailyRepair.length > 0 ? Math.max(...dailyRepair.map(d => d.revenue), 1) : 1;

  return (
    <div className="p-4">
      {/* Переключатель периода */}
      <div className="flex gap-1 mb-4 flex-wrap items-center">
        {PERIODS.map(p => (
          <button key={p.v} onClick={() => setPeriod(p.v)}
            className={`font-roboto text-xs px-3 py-1.5 border transition-colors ${period === p.v ? "border-[#FFD700] text-[#FFD700] bg-[#FFD700]/10" : "border-white/10 text-white/40 hover:text-white"}`}>
            {p.l}
          </button>
        ))}
        <button onClick={load} disabled={loading} className="ml-auto text-white/30 hover:text-white transition-colors p-1">
          <Icon name={loading ? "Loader" : "RefreshCw"} size={13} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 font-roboto text-sm p-3 mb-4 flex items-center gap-2">
          <Icon name="AlertCircle" size={14} />
          {error}
          <button onClick={load} className="ml-auto underline text-red-400/70 hover:text-red-400">Повторить</button>
        </div>
      )}

      {loading && <div className="text-center py-8 text-white/30 text-sm">Загружаю...</div>}

      {!loading && (
        <>
          {/* ОБЩИЙ ДОХОД: Ремонт + Золото */}
          <div className="bg-gradient-to-br from-[#FFD700]/10 to-green-500/10 border border-[#FFD700]/30 p-4 mb-3">
            <div className="font-roboto text-[#FFD700]/70 text-[10px] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Icon name="TrendingUp" size={12} />
              Общий доход (ремонт + золото)
            </div>
            <div className="flex items-end justify-between gap-2 mb-3">
              <div>
                <div className={`font-oswald font-bold text-3xl ${totalProfit >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {totalProfit.toLocaleString("ru-RU")} ₽
                </div>
                <div className="font-roboto text-white/30 text-[10px]">чистая прибыль</div>
              </div>
              <div className="text-right">
                <div className="font-oswald font-bold text-lg text-[#FFD700]">{totalRevenue.toLocaleString("ru-RU")} ₽</div>
                <div className="font-roboto text-white/30 text-[9px]">общая выручка</div>
              </div>
            </div>

            {/* Разбивка */}
            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[#FFD700]/15">
              {/* Ремонт */}
              <div className="bg-black/30 border border-[#2A2A2A] p-2">
                <div className="font-roboto text-white/40 text-[9px] uppercase tracking-wide mb-1 flex items-center gap-1">
                  <span>🔧</span> Ремонт
                </div>
                <div className={`font-oswald font-bold text-lg ${repairNetProfit >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {repairNetProfit.toLocaleString("ru-RU")} ₽
                </div>
                <div className="font-roboto text-white/30 text-[9px] leading-tight mt-1">
                  <div>выручка: <span className="text-[#FFD700]/70">{repairRevenue.toLocaleString("ru-RU")}</span></div>
                  <div>закупка: <span className="text-orange-400/70">{repairCosts.toLocaleString("ru-RU")}</span></div>
                  {masterIncome > 0 && <div>мастер: <span className="text-blue-400/70">{masterIncome.toLocaleString("ru-RU")}</span></div>}
                </div>
              </div>

              {/* Золото */}
              <div className="bg-black/30 border border-[#2A2A2A] p-2">
                <div className="font-roboto text-white/40 text-[9px] uppercase tracking-wide mb-1 flex items-center gap-1">
                  <span>🥇</span> Золото
                </div>
                <div className={`font-oswald font-bold text-lg ${goldProfit >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {goldProfit.toLocaleString("ru-RU")} ₽
                </div>
                <div className="font-roboto text-white/30 text-[9px] leading-tight mt-1">
                  <div>продажа: <span className="text-[#FFD700]/70">{goldRevenue.toLocaleString("ru-RU")}</span></div>
                  <div>закупка: <span className="text-orange-400/70">{goldCosts.toLocaleString("ru-RU")}</span></div>
                  {goldData && goldData.total_weight > 0 && <div>вес: <span className="text-white/50">{goldData.total_weight.toFixed(2)} г</span></div>}
                </div>
              </div>
            </div>

            {/* Количество сделок */}
            <div className="flex gap-3 mt-2 pt-2 border-t border-[#FFD700]/15 text-[10px] font-roboto">
              <span className="text-white/40">Сделок: <span className="text-white font-bold">{(data?.total_deals || 0) + (repairData?.done || 0) + (goldData?.done || 0)}</span></span>
              <span className="text-white/40">Ремонт: <span className="text-green-400 font-bold">{repairData?.done || 0}</span></span>
              <span className="text-white/40">Золото: <span className="text-green-400 font-bold">{goldData?.done || 0}</span></span>
            </div>
          </div>

          {/* Доход мастера */}
          {masterIncome > 0 && (
            <div className="bg-green-500/10 border border-green-500/20 p-3 mb-3 flex items-center justify-between">
              <div>
                <div className="font-roboto text-green-400/60 text-[10px] uppercase tracking-wide mb-0.5">Доход мастера (50% прибыли)</div>
                <div className="font-oswald font-bold text-green-400 text-2xl">{masterIncome.toLocaleString("ru-RU")} ₽</div>
              </div>
              <span className="text-3xl opacity-40">🏆</span>
            </div>
          )}

          {/* Ремонт: статусы */}
          {repairData && (
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] p-3 mb-3">
              <div className="font-roboto text-white/40 text-[10px] uppercase tracking-wide mb-2">🔧 Ремонт за период</div>
              <div className="grid grid-cols-4 gap-2 mb-2">
                {[
                  { label: "Всего", value: repairData.total, color: "text-white" },
                  { label: "Выдано", value: repairData.done, color: "text-green-400" },
                  { label: "Выручка", value: (repairData.revenue || 0).toLocaleString("ru-RU") + " ₽", color: "text-[#FFD700]" },
                  { label: "Закупка", value: (repairData.costs || 0).toLocaleString("ru-RU") + " ₽", color: "text-orange-400" },
                ].map(c => (
                  <div key={c.label} className="text-center">
                    <div className={`font-oswald font-bold text-base ${c.color}`}>{c.value}</div>
                    <div className="font-roboto text-white/30 text-[9px]">{c.label}</div>
                  </div>
                ))}
              </div>

              {/* Мини-график ремонта по дням */}
              {dailyRepair.length > 1 && (
                <div className="space-y-1 mt-2">
                  {dailyRepair.slice().reverse().slice(0, 7).map(d => {
                    const barW = Math.round((d.revenue / maxRevRepair) * 100);
                    const profitBarW = Math.round((Math.max(0, d.profit) / maxRevRepair) * 100);
                    return (
                      <div key={d.day} className="flex items-center gap-2">
                        <span className="font-roboto text-[9px] text-white/30 w-10 shrink-0">
                          {new Date(d.day).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" })}
                        </span>
                        <div className="flex-1 h-4 bg-[#111] relative overflow-hidden">
                          <div className="h-full bg-[#FFD700]/20 absolute left-0 top-0" style={{ width: barW + "%" }} />
                          <div className="h-full bg-green-500/30 absolute left-0 top-0" style={{ width: profitBarW + "%" }} />
                        </div>
                        <span className="font-roboto text-[9px] text-white/40 w-16 text-right shrink-0">
                          {d.revenue > 0 ? d.revenue.toLocaleString("ru-RU") + " ₽" : "—"}
                        </span>
                        <span className={`font-roboto text-[9px] w-14 text-right shrink-0 ${d.profit > 0 ? "text-green-400" : d.profit < 0 ? "text-red-400" : "text-white/20"}`}>
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
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] p-3 mb-3">
              <div className="font-roboto text-white/40 text-[10px] uppercase tracking-wide mb-2">По направлениям (продажи)</div>
              {Object.entries(data!.by_type).map(([type, stat]) => (
                <div key={type} className="flex justify-between py-1.5 border-b border-white/5 last:border-0">
                  <span className="font-roboto text-sm text-white/70">{TYPE_LABELS[type] || type}</span>
                  <div className="text-right">
                    <span className="font-oswald font-bold text-[#FFD700] text-sm">{(stat.sum || 0).toLocaleString("ru-RU")} ₽</span>
                    <span className="font-roboto text-white/30 text-[10px] ml-2">{stat.count} сд.</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Мотивация сотрудников */}
          {(data?.staff_stats?.length || 0) > 0 && (
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] p-3">
              <div className="font-roboto text-white/40 text-[10px] uppercase tracking-wide mb-2">Рейтинг сотрудников</div>
              {data!.staff_stats.map((s, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-2">
                    {i === 0 && <Icon name="Trophy" size={12} className="text-[#FFD700]" />}
                    {i > 0 && <span className="font-roboto text-white/20 text-xs w-4 text-center">{i + 1}</span>}
                    <span className="font-roboto text-sm text-white/80">{s.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-oswald font-bold text-[#FFD700] text-sm">{(s.revenue || 0).toLocaleString("ru-RU")} ₽</div>
                    <div className="font-roboto text-white/30 text-[10px]">{s.deals} сделок</div>
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