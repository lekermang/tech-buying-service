import { useState } from "react";
import Icon from "@/components/ui/icon";
import { GoldAnalytics, GoldDayStat } from "./types";
import GoldPeriodSelector, { GoldPeriod } from "./GoldPeriodSelector";
import GoldProfitHeader from "./GoldProfitHeader";
import GoldStockBlock from "./GoldStockBlock";
import GoldDailyStats from "./GoldDailyStats";

type Period = GoldPeriod;

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

export default function GoldAnalyticsView({
  analytics, loading, period, stats, onPeriodChange,
  periodFrom = "", periodTo = "",
  onPeriodFromChange, onPeriodToChange, onRefresh, token, onSold,
}: Props) {
  const [sellPricePerGram, setSellPricePerGram] = useState<string>("6300");

  return (
    <div className="p-3 overflow-y-auto">
      <GoldPeriodSelector
        period={period}
        loading={loading}
        onPeriodChange={onPeriodChange}
        onRefresh={onRefresh}
        periodFrom={periodFrom}
        periodTo={periodTo}
        onPeriodFromChange={onPeriodFromChange}
        onPeriodToChange={onPeriodToChange}
      />

      {loading && (
        <div className="flex items-center justify-center py-14 gap-2 text-white/40">
          <Icon name="Loader" size={18} className="animate-spin text-[#FFD700]" />
          <span className="font-roboto text-sm">Загружаю аналитику...</span>
        </div>
      )}

      {analytics && !loading && (
        <>
          <GoldProfitHeader
            analytics={analytics}
            period={period}
            periodFrom={periodFrom}
            periodTo={periodTo}
          />

          <GoldStockBlock
            analytics={analytics}
            sellPricePerGram={sellPricePerGram}
            setSellPricePerGram={setSellPricePerGram}
            token={token}
            onSold={onSold}
          />

          <GoldDailyStats analytics={analytics} stats={stats} />
        </>
      )}
    </div>
  );
}
