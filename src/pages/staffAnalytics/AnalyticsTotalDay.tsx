import { useState } from "react";
import Icon from "@/components/ui/icon";
import { type Analytics } from "../staff.types";
import { type GoldAnalytics } from "../gold/types";
import AnalyticsBreakdownModal, { type BreakdownContent } from "./AnalyticsBreakdownModal";

type RepairAnalytics = {
  total: number; done: number; revenue: number; costs: number;
  profit: number; master_total: number;
  daily: { day: string; revenue: number; costs: number; profit: number; done: number }[];
};

type Props = {
  period: string;
  data: Analytics | null;
  repairData: RepairAnalytics | null;
  goldData: GoldAnalytics | null;
  repairNetProfit: number;
  goldForecastProfit: number;
  goldForecastPriceNum: number;
  slPeriodProfit: number;
  totalRevenue: number;
  totalProfit: number;
  repairRevenue: number;
  repairCosts: number;
  goldRevenue: number;
  goldCosts: number;
  goldProfit: number;
  masterIncome: number;
  // Б/У комиссионка (kassa_period)
  slRevenue: number;
  slExpense: number;
  slSalesTotal: number;
  slSalesCount: number;
  slBuyoutTotal: number;
  slBuyoutCount: number;
};

export default function AnalyticsTotalDay({
  period, data, repairData, goldData,
  repairNetProfit, goldForecastProfit, goldForecastPriceNum, slPeriodProfit,
  totalRevenue, totalProfit, repairRevenue, repairCosts, goldRevenue, goldCosts, goldProfit, masterIncome,
  slRevenue, slExpense, slSalesTotal, slSalesCount, slBuyoutTotal, slBuyoutCount,
}: Props) {
  const repairPart = repairNetProfit;
  const goldPart = goldForecastProfit;
  const slPart = slPeriodProfit;
  const totalDay = repairPart + goldPart + slPart;
  const periodLabel =
    period === "today" ? "сегодня" :
    period === "yesterday" ? "вчера" :
    period === "week" ? "за 7 дней" : "за 30 дней";

  // Модалка детализации (за что эта сумма)
  const [breakdown, setBreakdown] = useState<BreakdownContent | null>(null);

  // Сборка детализации для каждого направления
  const showRepairBreakdown = () => setBreakdown({
    title: "🔧 Ремонт — детализация",
    emoji: "🔧",
    total: repairPart,
    totalLabel: "чистая прибыль (выручка − закупка − мастер)",
    accentColor: "emerald",
    periodLabel,
    rows: [
      { icon: "TrendingUp", label: "Выручка с выданных ремонтов", value: repairRevenue, color: "text-[#FFD700]", hint: `${repairData?.done ?? 0} выдано клиенту` },
      { icon: "ShoppingBag", label: "Закупка запчастей", value: -repairCosts, color: "text-orange-400", hint: "потрачено на запчасти" },
      ...(masterIncome > 0
        ? [{ icon: "Award", label: "Доход мастера (50% от прибыли)", value: -masterIncome, color: "text-blue-400" } as const]
        : []),
      { icon: "Equal", label: "Чистая прибыль владельца", value: repairPart, color: repairPart >= 0 ? "text-emerald-300" : "text-red-300", divider: true },
    ],
  });

  const showGoldBreakdown = () => setBreakdown({
    title: "🥇 Золото — детализация",
    emoji: "🥇",
    total: goldPart,
    totalLabel: `прогноз прибыли по цене ${goldForecastPriceNum.toLocaleString("ru-RU")} ₽/г`,
    accentColor: "gold",
    periodLabel,
    rows: [
      { icon: "Scale", label: "Принято золота 585 пробы", value: goldData?.period_weight585 ? `${goldData.period_weight585.toFixed(2)} г` : "—", color: "text-white/85", hint: `${goldData?.period_buy_count ?? 0} скупок за период` },
      { icon: "ArrowDownCircle", label: "Закупка (потрачено)", value: -(goldData?.period_buy_sum ?? 0), color: "text-orange-400" },
      { icon: "TrendingUp", label: `Прогноз продажи (по ${goldForecastPriceNum.toLocaleString("ru-RU")} ₽/г)`, value: goldData?.period_weight585 ? Math.round(goldData.period_weight585 * goldForecastPriceNum) : 0, color: "text-[#FFD700]" },
      { icon: "Equal", label: "Прогнозная прибыль", value: goldPart, color: goldPart >= 0 ? "text-emerald-300" : "text-red-300", divider: true },
      ...(goldData && goldData.total_weight > 0
        ? [{ icon: "Package", label: "Уже продано (фактически)", value: goldProfit, color: "text-emerald-300/80", hint: `вес: ${goldData.total_weight.toFixed(2)} г, выручка: ${goldRevenue.toLocaleString("ru-RU")} ₽` } as const]
        : []),
    ],
  });

  const showSlBreakdown = () => setBreakdown({
    title: "📦 Б/У техника — детализация",
    emoji: "📦",
    total: slPart,
    totalLabel: "прибыль кассы за период",
    accentColor: "purple",
    periodLabel,
    rows: [
      { icon: "TrendingUp", label: "Продажи (выручка)", value: slSalesTotal || slRevenue, color: "text-[#FFD700]", hint: `${slSalesCount} продаж` },
      { icon: "ShoppingBag", label: "Скупка / выкуп", value: -(slBuyoutTotal || slExpense), color: "text-orange-400", hint: `${slBuyoutCount} скупок` },
      { icon: "Equal", label: "Прибыль", value: slPart, color: slPart >= 0 ? "text-emerald-300" : "text-red-300", divider: true },
    ],
  });

  const showTotalBreakdown = () => setBreakdown({
    title: "💎 Итого прибыль",
    emoji: "💎",
    total: totalDay,
    totalLabel: "сумма по всем направлениям",
    accentColor: totalDay >= 0 ? "emerald" : "red",
    periodLabel,
    rows: [
      { icon: "Wrench", label: "🔧 Ремонт", value: repairPart, color: repairPart >= 0 ? "text-emerald-300" : "text-red-300", hint: "чистая прибыль с выданных" },
      { icon: "Coins", label: "🥇 Золото (прогноз)", value: goldPart, color: goldPart >= 0 ? "text-emerald-300" : "text-red-300", hint: `по ${goldForecastPriceNum.toLocaleString("ru-RU")} ₽/г` },
      { icon: "Package", label: "📦 Б/У техника", value: slPart, color: slPart >= 0 ? "text-emerald-300" : "text-red-300", hint: `${slSalesCount} продаж · ${slBuyoutCount} скупок` },
      { icon: "Equal", label: "Итого", value: totalDay, color: totalDay >= 0 ? "text-emerald-300" : "text-red-300", divider: true },
    ],
  });

  return (
    <>
      {/* ИТОГО ЗА ДЕНЬ — ремонт + золото (прогноз) + б/у техника */}
      <div className="relative bg-gradient-to-br from-emerald-500/15 via-[#FFD700]/8 to-purple-500/10 border border-emerald-400/30 rounded-xl p-4 mb-3 overflow-hidden">
        <div className="absolute -top-8 -right-8 text-[120px] opacity-[0.05] select-none">💎</div>
        <div className="relative">
          <button
            onClick={showTotalBreakdown}
            className="w-full text-left group"
            title="Нажми, чтобы увидеть разбивку по направлениям"
          >
            <div className="font-roboto text-emerald-300/80 text-[10px] uppercase tracking-wider mb-2 flex items-center gap-1.5 group-hover:text-emerald-300">
              <Icon name="Sparkles" size={12} />
              Итого прибыль · {periodLabel}
              <Icon name="ChevronRight" size={11} className="ml-auto text-white/30 group-hover:text-white/70 transition-transform group-hover:translate-x-0.5" />
            </div>
            <div className={`font-oswald font-bold text-5xl tabular-nums mb-3 ${totalDay >= 0 ? "text-emerald-300" : "text-red-300"} group-hover:drop-shadow-[0_0_12px_currentColor] transition-all`}>
              {totalDay >= 0 ? "+" : ""}{totalDay.toLocaleString("ru-RU")} ₽
            </div>
          </button>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={showRepairBreakdown}
              className="bg-black/40 border border-[#1F1F1F] hover:border-emerald-400/50 hover:bg-emerald-500/[0.05] rounded-lg p-2.5 text-left transition-all active:scale-[0.97] relative group"
              title="🔧 Ремонт — за что эта сумма?"
            >
              <div className="font-roboto text-white/40 text-[9px] uppercase tracking-wide mb-0.5 flex items-center gap-1">
                🔧 Ремонт
                <Icon name="Info" size={9} className="ml-auto text-white/25 group-hover:text-emerald-300/80" />
              </div>
              <div className={`font-oswald font-bold text-base tabular-nums ${repairPart >= 0 ? "text-green-400" : "text-red-400"}`}>
                {repairPart >= 0 ? "+" : ""}{repairPart.toLocaleString("ru-RU")}
              </div>
              <div className="font-roboto text-white/30 text-[9px] mt-0.5 group-hover:text-emerald-300/70 transition-colors">
                {repairData?.done ? `${repairData.done} выдано` : "нажми для деталей"}
              </div>
            </button>
            <button
              onClick={showGoldBreakdown}
              className="bg-black/40 border border-[#1F1F1F] hover:border-[#FFD700]/50 hover:bg-[#FFD700]/[0.05] rounded-lg p-2.5 text-left transition-all active:scale-[0.97] relative group"
              title="🥇 Золото — за что эта сумма?"
            >
              <div className="font-roboto text-white/40 text-[9px] uppercase tracking-wide mb-0.5 flex items-center gap-1">
                🥇 Золото
                <Icon name="Info" size={9} className="ml-auto text-white/25 group-hover:text-[#FFD700]/80" />
              </div>
              <div className={`font-oswald font-bold text-base tabular-nums ${goldPart >= 0 ? "text-green-400" : "text-red-400"}`}>
                {goldPart >= 0 ? "+" : ""}{goldPart.toLocaleString("ru-RU")}
              </div>
              <div className="font-roboto text-white/30 text-[9px] tabular-nums mt-0.5 group-hover:text-[#FFD700]/70 transition-colors">
                по {goldForecastPriceNum.toLocaleString("ru-RU")} ₽/г
              </div>
            </button>
            <button
              onClick={showSlBreakdown}
              className="bg-black/40 border border-[#1F1F1F] hover:border-purple-400/50 hover:bg-purple-500/[0.05] rounded-lg p-2.5 text-left transition-all active:scale-[0.97] relative group"
              title="📦 Б/У техника — за что эта сумма?"
            >
              <div className="font-roboto text-white/40 text-[9px] uppercase tracking-wide mb-0.5 flex items-center gap-1">
                📦 Б/У
                <Icon name="Info" size={9} className="ml-auto text-white/25 group-hover:text-purple-300/80" />
              </div>
              <div className={`font-oswald font-bold text-base tabular-nums ${slPart >= 0 ? "text-green-400" : "text-red-400"}`}>
                {slPart >= 0 ? "+" : ""}{slPart.toLocaleString("ru-RU")}
              </div>
              {(slSalesCount > 0 || slBuyoutCount > 0) ? (
                <div className="font-roboto text-white/30 text-[9px] tabular-nums mt-0.5 group-hover:text-purple-300/70 transition-colors">
                  {slSalesCount} продаж · {slBuyoutCount} скупок
                </div>
              ) : (
                <div className="font-roboto text-white/30 text-[9px] mt-0.5 group-hover:text-purple-300/70 transition-colors">
                  нажми для деталей
                </div>
              )}
            </button>
          </div>
        </div>
      </div>

      {breakdown && (
        <AnalyticsBreakdownModal
          content={breakdown}
          onClose={() => setBreakdown(null)}
        />
      )}

      {/* Premium ОБЩИЙ ДОХОД */}
      <div className="relative bg-gradient-to-br from-[#FFD700]/15 via-green-500/8 to-transparent border border-[#FFD700]/30 rounded-xl p-4 mb-3 overflow-hidden">
        <div className="absolute -top-10 -right-10 text-[140px] opacity-[0.04] select-none">💰</div>
        <div className="relative">
          <div className="font-roboto text-[#FFD700]/80 text-[10px] uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Icon name="TrendingUp" size={12} />
            Общий доход · Ремонт + Золото + Б/У
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-3 border-t border-[#FFD700]/20">
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

            {/* Б/У техника (комиссионка) */}
            <div className="bg-black/40 backdrop-blur border border-[#1F1F1F] rounded-lg p-2.5 hover:border-purple-400/40 transition-colors">
              <div className="font-roboto text-white/50 text-[9px] uppercase tracking-wide mb-1 flex items-center gap-1">
                <span>📦</span> Б/У техника
              </div>
              <div className={`font-oswald font-bold text-lg tabular-nums ${slPart >= 0 ? "text-green-400" : "text-red-400"}`}>
                {slPart.toLocaleString("ru-RU")} ₽
              </div>
              <div className="font-roboto text-[9px] leading-tight mt-1 space-y-0.5">
                <div className="text-white/40">приход: <span className="text-[#FFD700]/80 font-bold tabular-nums">{slRevenue.toLocaleString("ru-RU")}</span></div>
                <div className="text-white/40">расход: <span className="text-orange-400/80 font-bold tabular-nums">{slExpense.toLocaleString("ru-RU")}</span></div>
                {slSalesTotal > 0 && (
                  <div className="text-white/40">продажи: <span className="text-purple-300/80 font-bold tabular-nums">{slSalesTotal.toLocaleString("ru-RU")}</span></div>
                )}
              </div>
            </div>
          </div>

          {/* Количество сделок */}
          <div className="flex gap-3 mt-2.5 pt-2.5 border-t border-[#FFD700]/15 text-[10px] font-roboto flex-wrap">
            <span className="text-white/40 flex items-center gap-1">
              <Icon name="CheckCircle2" size={10} />
              Всего: <span className="text-white font-bold tabular-nums">{(data?.total_deals || 0) + (repairData?.done || 0) + (goldData?.done || 0) + slSalesCount + slBuyoutCount}</span>
            </span>
            <span className="text-white/40">🔧 <span className="text-green-400 font-bold tabular-nums">{repairData?.done || 0}</span></span>
            <span className="text-white/40">🥇 <span className="text-green-400 font-bold tabular-nums">{goldData?.done || 0}</span></span>
            <span className="text-white/40">📦 <span className="text-purple-300 font-bold tabular-nums">{slSalesCount + slBuyoutCount}</span></span>
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
    </>
  );
}