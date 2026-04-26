import Icon from "@/components/ui/icon";
import { type GoldAnalytics } from "../gold/types";

type Props = {
  goldData: GoldAnalytics | null;
  goldForecastPrice: string;
  setGoldForecastPrice: (v: string) => void;
  periodBuySum: number;
  periodWeight585: number;
  periodBuyCount: number;
  goldForecastRevenue: number;
  goldForecastProfit: number;
};

export default function AnalyticsGoldForecast({
  goldData, goldForecastPrice, setGoldForecastPrice,
  periodBuySum, periodWeight585, periodBuyCount,
  goldForecastRevenue, goldForecastProfit,
}: Props) {
  if (!goldData || (periodBuyCount <= 0 && (goldData.stock_count || 0) <= 0)) return null;

  return (
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
  );
}
