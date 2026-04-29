import Icon from "@/components/ui/icon";
import { GoldAnalytics, money } from "./types";
import { GoldPeriod, GOLD_PERIOD_LABELS } from "./GoldPeriodSelector";

type Props = {
  analytics: GoldAnalytics;
  period: GoldPeriod;
  periodFrom: string;
  periodTo: string;
};

export default function GoldProfitHeader({ analytics, period, periodFrom, periodTo }: Props) {
  return (
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
              : GOLD_PERIOD_LABELS[period]}
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
  );
}
