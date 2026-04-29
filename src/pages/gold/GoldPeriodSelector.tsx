import Icon from "@/components/ui/icon";

export type GoldPeriod = "day" | "yesterday" | "week" | "month" | "year" | "all" | "custom";

export const GOLD_PERIOD_LABELS: Record<GoldPeriod, string> = {
  day: "Сегодня",
  yesterday: "Вчера",
  week: "7 дней",
  month: "30 дней",
  year: "Год",
  all: "Всё время",
  custom: "Период",
};

type Props = {
  period: GoldPeriod;
  loading: boolean;
  onPeriodChange: (p: GoldPeriod) => void;
  onRefresh: () => void;
  periodFrom: string;
  periodTo: string;
  onPeriodFromChange?: (v: string) => void;
  onPeriodToChange?: (v: string) => void;
};

export default function GoldPeriodSelector({
  period, loading, onPeriodChange, onRefresh,
  periodFrom, periodTo, onPeriodFromChange, onPeriodToChange,
}: Props) {
  return (
    <>
      {/* Период + refresh */}
      <div className="flex gap-1.5 mb-2 items-center flex-wrap">
        {(["day", "yesterday", "week", "month", "year", "all", "custom"] as GoldPeriod[]).map(p => {
          const active = period === p;
          return (
            <button key={p} onClick={() => onPeriodChange(p)}
              className={`px-3 py-1.5 font-roboto text-[11px] rounded-full transition-all active:scale-95 ${
                active
                  ? "bg-[#FFD700] text-black font-bold shadow-md shadow-[#FFD700]/20"
                  : "bg-[#141414] border border-[#1F1F1F] text-white/50 hover:text-white hover:border-[#333]"
              }`}>
              {GOLD_PERIOD_LABELS[p]}
            </button>
          );
        })}
        <button onClick={onRefresh} disabled={loading}
          className="ml-auto text-white/40 hover:text-[#FFD700] active:scale-90 p-2 rounded-md transition-all hover:bg-white/5">
          <Icon name={loading ? "Loader" : "RefreshCw"} size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Выбор произвольных дат */}
      {period === "custom" && (
        <div className="flex gap-2 mb-3 items-center flex-wrap bg-[#0F0F0F] border border-[#1F1F1F] rounded-lg p-2">
          <Icon name="Calendar" size={13} className="text-[#FFD700]/60 ml-1" />
          <input
            type="date"
            value={periodFrom}
            onChange={(e) => onPeriodFromChange?.(e.target.value)}
            className="bg-[#0A0A0A] border border-[#222] text-white px-2 py-1 rounded font-roboto text-xs focus:outline-none focus:border-[#FFD700]/50"
          />
          <span className="text-white/30 text-xs">—</span>
          <input
            type="date"
            value={periodTo}
            onChange={(e) => onPeriodToChange?.(e.target.value)}
            className="bg-[#0A0A0A] border border-[#222] text-white px-2 py-1 rounded font-roboto text-xs focus:outline-none focus:border-[#FFD700]/50"
          />
          {(periodFrom || periodTo) && (
            <button
              onClick={() => { onPeriodFromChange?.(""); onPeriodToChange?.(""); }}
              className="text-white/30 hover:text-red-400 text-[10px] font-roboto px-2 py-1"
            >
              сброс
            </button>
          )}
        </div>
      )}
    </>
  );
}
