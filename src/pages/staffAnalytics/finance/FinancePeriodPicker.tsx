import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import type { DateRange } from "react-day-picker";

export type FinancePeriod =
  | "today" | "yesterday" | "d7" | "d14" | "d30" | "d90"
  | "mtd" | "prev_month" | "qtd" | "ytd" | "year" | "custom";

const PRESETS: { v: FinancePeriod; l: string; hint?: string }[] = [
  { v: "today", l: "Сегодня" },
  { v: "yesterday", l: "Вчера" },
  { v: "d7", l: "7д" },
  { v: "d14", l: "14д" },
  { v: "d30", l: "30д" },
  { v: "d90", l: "90д" },
  { v: "mtd", l: "Этот месяц", hint: "С начала текущего месяца" },
  { v: "prev_month", l: "Прошлый месяц" },
  { v: "qtd", l: "Квартал", hint: "С начала текущего квартала" },
  { v: "ytd", l: "YTD", hint: "С 1 января текущего года" },
  { v: "year", l: "Год", hint: "Скользящие 365 дней" },
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
  period: FinancePeriod;
  setPeriod: (v: FinancePeriod) => void;
  customRange: { from: string; to: string } | null;
  setCustomRange: (v: { from: string; to: string } | null) => void;
  compare: boolean;
  setCompare: (v: boolean) => void;
  onRefresh: () => void;
  loading: boolean;
};

export default function FinancePeriodPicker({
  period, setPeriod, customRange, setCustomRange,
  compare, setCompare, onRefresh, loading,
}: Props) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"single" | "range">("range");
  const [single, setSingle] = useState<Date | undefined>(undefined);
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
    : "Период вручную";

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
    setPeriod("d30");
    setOpen(false);
  };

  const btn = (active: boolean) =>
    `relative font-roboto text-[11px] px-2.5 py-1.5 rounded-full transition-all active:scale-95 inline-flex items-center overflow-hidden ${
      active
        ? "bg-gradient-to-b from-[#FFE34D] via-[#FFD700] to-[#d4a017] text-black font-bold shadow-[0_3px_12px_rgba(255,215,0,0.45),inset_0_1px_0_rgba(255,255,255,0.55)]"
        : "bg-gradient-to-br from-[#141414] to-[#0E0E0E] border border-[#1F1F1F] text-white/55 hover:text-[#FFD700] hover:border-[#FFD700]/40 hover:shadow-[0_0_10px_rgba(255,215,0,0.18)]"
    }`;

  return (
    <div className="flex flex-wrap gap-1.5 mb-3 items-center">
      {PRESETS.map((p) => {
        const active = period === p.v;
        return (
          <button
            key={p.v}
            onClick={() => { setPeriod(p.v); setCustomRange(null); }}
            title={p.hint || p.l}
            className={btn(active)}
          >
            <span className="relative">{p.l}</span>
          </button>
        );
      })}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button title="Выбрать произвольный период" className={btn(isCustom) + " gap-1.5"}>
            <Icon name="Calendar" size={12} className="relative" />
            <span className="relative">{customLabel}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0 bg-[#0F0F0F] border-[#1F1F1F] text-white">
          <div className="p-2 border-b border-[#1F1F1F] flex gap-1">
            <button
              onClick={() => setMode("single")}
              className={`flex-1 px-2 py-1 rounded text-[11px] font-bold uppercase transition ${
                mode === "single" ? "bg-[#FFD700] text-black" : "bg-[#0A0A0A] text-white/55 hover:text-white"
              }`}
            >Один день</button>
            <button
              onClick={() => setMode("range")}
              className={`flex-1 px-2 py-1 rounded text-[11px] font-bold uppercase transition ${
                mode === "range" ? "bg-[#FFD700] text-black" : "bg-[#0A0A0A] text-white/55 hover:text-white"
              }`}
            >Диапазон</button>
          </div>
          {mode === "single" ? (
            <Calendar mode="single" selected={single} onSelect={setSingle} initialFocus />
          ) : (
            <Calendar mode="range" selected={range} onSelect={setRange} numberOfMonths={1} initialFocus />
          )}
          <div className="p-2 border-t border-[#1F1F1F] flex gap-1.5">
            {customRange && (
              <button onClick={reset} className="flex-1 px-2 py-1.5 rounded bg-[#0A0A0A] hover:bg-red-500/15 border border-[#1F1F1F] hover:border-red-500/40 text-white/65 hover:text-red-300 text-[11px] font-bold uppercase transition">
                Сбросить
              </button>
            )}
            <button
              onClick={apply}
              disabled={(mode === "single" && !single) || (mode === "range" && !range?.from)}
              className="flex-1 px-2 py-1.5 rounded bg-[#FFD700] hover:bg-[#FFE34D] text-black text-[11px] font-bold uppercase transition disabled:opacity-40 disabled:cursor-not-allowed"
            >Применить</button>
          </div>
        </PopoverContent>
      </Popover>

      <button
        onClick={() => setCompare(!compare)}
        title={compare ? "Скрыть сравнение с прошлым периодом" : "Показать сравнение с прошлым периодом"}
        className={`relative font-roboto text-[11px] px-2.5 py-1.5 rounded-full transition-all active:scale-95 inline-flex items-center gap-1 ${
          compare
            ? "bg-emerald-500/20 border border-emerald-500/50 text-emerald-300"
            : "bg-gradient-to-br from-[#141414] to-[#0E0E0E] border border-[#1F1F1F] text-white/55 hover:text-emerald-300 hover:border-emerald-500/40"
        }`}
      >
        <Icon name="GitCompareArrows" size={12} />
        Δ vs прошлый
      </button>

      <button
        onClick={onRefresh}
        disabled={loading}
        title="Обновить"
        className="ml-auto text-white/45 hover:text-[#FFD700] active:scale-90 p-2 rounded-md transition-all bg-gradient-to-br from-[#141414] to-[#0E0E0E] border border-[#1F1F1F] hover:border-[#FFD700]/40 hover:shadow-[0_0_12px_rgba(255,215,0,0.18)] group"
      >
        <Icon name={loading ? "Loader" : "RefreshCw"} size={14} className={loading ? "animate-spin text-[#FFD700]" : "group-hover:rotate-180 transition-transform duration-500"} />
      </button>
    </div>
  );
}
