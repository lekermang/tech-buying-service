import Icon from "@/components/ui/icon";
import { PRESETS, dmyToIso, isoToDmy } from "./SLDashboardTypes";

type Props = {
  preset: string;
  setPreset: (k: string) => void;
  customFrom: string;
  setCustomFrom: (s: string) => void;
  customTo: string;
  setCustomTo: (s: string) => void;
  showCustom: boolean;
  setShowCustom: (v: boolean | ((s: boolean) => boolean)) => void;
  loading: boolean;
  onLoad: (force?: boolean) => void;
};

export function SLDateRangePicker({
  preset, setPreset,
  customFrom, setCustomFrom,
  customTo, setCustomTo,
  showCustom, setShowCustom,
  loading, onLoad,
}: Props) {
  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {PRESETS.map(p => {
            const a = preset === p.k;
            return (
              <button key={p.k} onClick={() => { setPreset(p.k); setShowCustom(false); }}
                className={`shrink-0 font-roboto text-[11px] px-3 py-1.5 rounded-full transition-all active:scale-95 ${
                  a ? "bg-[#FFD700] text-black font-bold" : "bg-[#141414] border border-[#1F1F1F] text-white/60 hover:text-white"
                }`}>{p.l}</button>
            );
          })}
          <button
            onClick={() => { setPreset("custom"); setShowCustom(s => !s); }}
            className={`shrink-0 font-roboto text-[11px] px-3 py-1.5 rounded-full transition-all active:scale-95 flex items-center gap-1 ${
              preset === "custom" ? "bg-[#FFD700] text-black font-bold" : "bg-[#141414] border border-[#1F1F1F] text-white/60 hover:text-white"
            }`}
            title="Выбрать произвольные даты"
          >
            <Icon name="Calendar" size={11} />
            {preset === "custom" ? `${customFrom} → ${customTo}` : "Свои даты"}
          </button>
        </div>
        <button onClick={() => onLoad(true)} disabled={loading}
          title="Обновить"
          className="shrink-0 p-2 rounded-md bg-[#141414] border border-[#1F1F1F] text-white/60 hover:text-[#FFD700] active:scale-95 transition-all disabled:opacity-50">
          <Icon name={loading ? "Loader" : "RefreshCw"} size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Панель выбора произвольных дат */}
      {(showCustom || preset === "custom") && (
        <div className="bg-[#0A0A0A] border border-[#FFD700]/30 rounded-lg p-3 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="font-oswald font-bold text-[#FFD700] text-[10px] uppercase flex items-center gap-1.5">
            <Icon name="CalendarRange" size={12} />
            Произвольный период
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <div className="text-white/40 text-[9px] uppercase mb-1">С</div>
              <input
                type="date"
                value={dmyToIso(customFrom)}
                onChange={(e) => { setCustomFrom(isoToDmy(e.target.value)); setPreset("custom"); }}
                className="w-full bg-[#141414] border border-[#1F1F1F] rounded-md px-2 py-2 text-white text-[12px] font-mono focus:outline-none focus:border-[#FFD700]/50"
              />
            </label>
            <label className="block">
              <div className="text-white/40 text-[9px] uppercase mb-1">По</div>
              <input
                type="date"
                value={dmyToIso(customTo)}
                onChange={(e) => { setCustomTo(isoToDmy(e.target.value)); setPreset("custom"); }}
                className="w-full bg-[#141414] border border-[#1F1F1F] rounded-md px-2 py-2 text-white text-[12px] font-mono focus:outline-none focus:border-[#FFD700]/50"
              />
            </label>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {[
              { l: "Окт 2024", from: "01.10.2024", to: "31.10.2024" },
              { l: "Ноя 2024", from: "01.11.2024", to: "30.11.2024" },
              { l: "Дек 2024", from: "01.12.2024", to: "31.12.2024" },
              { l: "Q4 2024",  from: "01.10.2024", to: "31.12.2024" },
              { l: "2025",     from: "01.01.2025", to: "31.12.2025" },
            ].map(q => (
              <button
                key={q.l}
                onClick={() => { setCustomFrom(q.from); setCustomTo(q.to); setPreset("custom"); }}
                className="text-[10px] px-2 py-1 rounded bg-[#141414] border border-[#1F1F1F] text-white/60 hover:text-[#FFD700] hover:border-[#FFD700]/40 transition-all"
              >
                {q.l}
              </button>
            ))}
          </div>
          <button
            onClick={() => onLoad(true)}
            disabled={loading}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-[#FFD700] text-black hover:brightness-110 active:scale-[0.98] transition-all font-oswald font-bold text-[11px] uppercase disabled:opacity-50"
          >
            <Icon name={loading ? "Loader" : "Search"} size={12} className={loading ? "animate-spin" : ""} />
            Запросить за этот период
          </button>
        </div>
      )}
    </>
  );
}

export default SLDateRangePicker;
