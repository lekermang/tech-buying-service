import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import type { DateRange } from "react-day-picker";

const PRESETS = [
  { v: "today", l: "Сегодня" },
  { v: "yesterday", l: "Вчера" },
  { v: "week", l: "7 дней" },
  { v: "month", l: "30 дней" },
];

const fmt = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
};

const iso = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

type Props = {
  period: string;
  setPeriod: (v: string) => void;
  customRange: { from: string; to: string } | null;
  setCustomRange: (v: { from: string; to: string } | null) => void;
  onRefresh: () => void;
  loading: boolean;
};

export default function PeriodPicker({ period, setPeriod, customRange, setCustomRange, onRefresh, loading }: Props) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"single" | "range">(customRange && customRange.from === customRange.to ? "single" : "range");
  const [single, setSingle] = useState<Date | undefined>(
    customRange && customRange.from === customRange.to ? new Date(customRange.from) : undefined,
  );
  const [range, setRange] = useState<DateRange | undefined>(
    customRange && customRange.from !== customRange.to
      ? { from: new Date(customRange.from), to: new Date(customRange.to) }
      : undefined,
  );

  const isCustom = period === "custom";

  const customLabel = customRange
    ? customRange.from === customRange.to
      ? fmt(new Date(customRange.from))
      : `${fmt(new Date(customRange.from))} — ${fmt(new Date(customRange.to))}`
    : "Выбрать дату";

  const apply = () => {
    if (mode === "single" && single) {
      const s = iso(single);
      setCustomRange({ from: s, to: s });
      setPeriod("custom");
      setOpen(false);
    } else if (mode === "range" && range?.from) {
      const from = iso(range.from);
      const to = iso(range.to || range.from);
      setCustomRange({ from, to });
      setPeriod("custom");
      setOpen(false);
    }
  };

  const reset = () => {
    setCustomRange(null);
    setSingle(undefined);
    setRange(undefined);
    setPeriod("week");
    setOpen(false);
  };

  return (
    <div className="flex gap-1.5 mb-3 flex-wrap items-center">
      {PRESETS.map(p => {
        const active = period === p.v;
        return (
          <button
            key={p.v}
            onClick={() => { setPeriod(p.v); setCustomRange(null); }}
            title={`Период: ${p.l}`}
            className={`relative font-roboto text-[11px] px-3 py-1.5 rounded-full transition-all active:scale-95 inline-flex items-center overflow-hidden group ${
              active
                ? "bg-gradient-to-b from-[#FFE34D] via-[#FFD700] to-[#d4a017] text-black font-bold shadow-[0_3px_12px_rgba(255,215,0,0.45),inset_0_1px_0_rgba(255,255,255,0.55)]"
                : "bg-gradient-to-br from-[#141414] to-[#0E0E0E] border border-[#1F1F1F] text-white/55 hover:text-[#FFD700] hover:border-[#FFD700]/40 hover:shadow-[0_0_10px_rgba(255,215,0,0.18)]"
            }`}
          >
            {active && <span aria-hidden className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/35 to-transparent rounded-t-full pointer-events-none" />}
            <span className="relative">{p.l}</span>
          </button>
        );
      })}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            title="Выбрать конкретную дату или период"
            className={`relative font-roboto text-[11px] px-3 py-1.5 rounded-full transition-all active:scale-95 inline-flex items-center gap-1.5 overflow-hidden ${
              isCustom
                ? "bg-gradient-to-b from-[#FFE34D] via-[#FFD700] to-[#d4a017] text-black font-bold shadow-[0_3px_12px_rgba(255,215,0,0.45),inset_0_1px_0_rgba(255,255,255,0.55)]"
                : "bg-gradient-to-br from-[#141414] to-[#0E0E0E] border border-[#1F1F1F] text-white/55 hover:text-[#FFD700] hover:border-[#FFD700]/40 hover:shadow-[0_0_10px_rgba(255,215,0,0.18)]"
            }`}
          >
            {isCustom && <span aria-hidden className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/35 to-transparent rounded-t-full pointer-events-none" />}
            <Icon name="Calendar" size={12} className="relative" />
            <span className="relative">{customLabel}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-auto p-0 bg-[#0F0F0F] border-[#1F1F1F] text-white"
        >
          <div className="p-2 border-b border-[#1F1F1F] flex gap-1">
            <button
              onClick={() => setMode("single")}
              className={`flex-1 px-2 py-1 rounded text-[11px] font-bold uppercase tracking-wide transition ${
                mode === "single" ? "bg-[#FFD700] text-black" : "bg-[#0A0A0A] text-white/55 hover:text-white"
              }`}
            >
              Конкретная дата
            </button>
            <button
              onClick={() => setMode("range")}
              className={`flex-1 px-2 py-1 rounded text-[11px] font-bold uppercase tracking-wide transition ${
                mode === "range" ? "bg-[#FFD700] text-black" : "bg-[#0A0A0A] text-white/55 hover:text-white"
              }`}
            >
              Период
            </button>
          </div>

          {mode === "single" ? (
            <Calendar
              mode="single"
              selected={single}
              onSelect={setSingle}
              initialFocus
            />
          ) : (
            <Calendar
              mode="range"
              selected={range}
              onSelect={setRange}
              numberOfMonths={1}
              initialFocus
            />
          )}

          <div className="p-2 border-t border-[#1F1F1F] flex gap-1.5">
            {customRange && (
              <button
                onClick={reset}
                className="flex-1 px-2 py-1.5 rounded bg-[#0A0A0A] hover:bg-red-500/15 border border-[#1F1F1F] hover:border-red-500/40 text-white/65 hover:text-red-300 text-[11px] font-bold uppercase tracking-wide transition"
              >
                Сбросить
              </button>
            )}
            <button
              onClick={apply}
              disabled={(mode === "single" && !single) || (mode === "range" && !range?.from)}
              className="flex-1 px-2 py-1.5 rounded bg-[#FFD700] hover:bg-[#FFE34D] text-black text-[11px] font-bold uppercase tracking-wide transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Применить
            </button>
          </div>
        </PopoverContent>
      </Popover>

      <button
        onClick={onRefresh}
        disabled={loading}
        title="Обновить данные"
        className="ml-auto text-white/45 hover:text-[#FFD700] active:scale-90 p-2 rounded-md transition-all bg-gradient-to-br from-[#141414] to-[#0E0E0E] border border-[#1F1F1F] hover:border-[#FFD700]/40 hover:shadow-[0_0_12px_rgba(255,215,0,0.18)] group"
      >
        <Icon
          name={loading ? "Loader" : "RefreshCw"}
          size={14}
          className={`${loading ? "animate-spin text-[#FFD700]" : "group-hover:rotate-180 transition-transform duration-500"}`}
        />
      </button>
    </div>
  );
}
