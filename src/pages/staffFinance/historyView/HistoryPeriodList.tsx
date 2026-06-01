import Icon from "@/components/ui/icon";
import type { HistoryEntry } from "../useFinanceHistory";
import { PERIOD_COLORS, SAFE_COLOR } from "./HistoryPrimitives";

interface Props {
  history: HistoryEntry[];
  selected: string[];
  active: HistoryEntry[];
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}

export default function HistoryPeriodList({ history, selected, active, onToggle, onRemove, onClear }: Props) {
  return (
    <div className="space-y-2">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div className="font-roboto text-[10px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>
          История · {history.length} период{history.length > 4 ? "ов" : history.length > 1 ? "а" : ""}
        </div>
        <button onClick={onClear}
          className="font-roboto text-[10px] transition-colors"
          style={{ color: "rgba(248,113,113,0.5)" }}
          onMouseEnter={e => (e.currentTarget.style.color = "#f87171")}
          onMouseLeave={e => (e.currentTarget.style.color = "rgba(248,113,113,0.5)")}
        >Очистить всё</button>
      </div>

      {/* Список периодов */}
      {history.map((entry) => {
        const colorIdx = active.findIndex(e => e.id === entry.id);
        const c = colorIdx >= 0 ? PERIOD_COLORS[colorIdx] : null;
        const isActive = selected.includes(entry.id);
        return (
          <div key={entry.id} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all cursor-pointer"
            style={{
              background: isActive && c ? c.bg : "rgba(255,255,255,0.03)",
              border: `1px solid ${isActive && c ? c.border : "rgba(255,255,255,0.07)"}`,
            }}
            onClick={() => onToggle(entry.id)}
          >
            <div className="w-3 h-3 rounded-full shrink-0" style={{
              background: c ? c.line : "rgba(255,255,255,0.15)",
              boxShadow: c ? `0 0 8px ${c.line}` : "none",
            }} />
            <div className="flex-1 min-w-0">
              <div className="font-roboto text-sm font-semibold" style={{ color: c ? c.text : "rgba(255,255,255,0.4)" }}>
                {entry.period}
              </div>
              <div className="font-roboto text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                {new Date(entry.saved_at).toLocaleDateString("ru-RU", { day: "2-digit", month: "short" })}
                {entry.result.parsed.total_money ? ` · ${entry.result.parsed.total_money}` : ""}
                {entry.result.parsed.safety_level ? (
                  <span className="ml-1.5" style={{ color: SAFE_COLOR[entry.result.parsed.safety_level] }}>●</span>
                ) : null}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {isActive && colorIdx >= 0 && (
                <span className="font-roboto text-[9px] uppercase px-1.5 py-0.5 rounded-md" style={{
                  background: c!.bg, color: c!.text, border: `1px solid ${c!.border}`,
                }}>#{colorIdx + 1}</span>
              )}
              <button onClick={e => { e.stopPropagation(); onRemove(entry.id); }}
                className="w-5 h-5 flex items-center justify-center rounded-md transition-all"
                style={{ color: "rgba(255,255,255,0.2)" }}
                onMouseEnter={e2 => (e2.currentTarget.style.color = "#f87171")}
                onMouseLeave={e2 => (e2.currentTarget.style.color = "rgba(255,255,255,0.2)")}
              >
                <Icon name="X" size={11} />
              </button>
            </div>
          </div>
        );
      })}

      {selected.length < 4 && history.length > selected.length && (
        <div className="font-roboto text-[11px] text-center" style={{ color: "rgba(255,255,255,0.2)" }}>
          Нажмите на период чтобы добавить в сравнение (макс. 4)
        </div>
      )}
    </div>
  );
}
