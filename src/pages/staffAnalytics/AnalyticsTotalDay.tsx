import Icon from "@/components/ui/icon";
import { type Analytics } from "../staff.types";
import { type GoldAnalytics } from "../gold/types";

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
};

export default function AnalyticsTotalDay({
  period, data, repairData, goldData,
  repairNetProfit, goldForecastProfit, goldForecastPriceNum, slPeriodProfit,
  totalRevenue, totalProfit, repairRevenue, repairCosts, goldRevenue, goldCosts, goldProfit, masterIncome,
}: Props) {
  const repairPart = repairNetProfit;
  const goldPart = goldForecastProfit;
  const slPart = slPeriodProfit;
  const totalDay = repairPart + goldPart + slPart;
  const periodLabel =
    period === "today" ? "сегодня" :
    period === "yesterday" ? "вчера" :
    period === "week" ? "за 7 дней" : "за 30 дней";

  return (
    <>
      {/* ИТОГО ЗА ДЕНЬ — ремонт + золото (прогноз) + б/у техника */}
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
    </>
  );
}
