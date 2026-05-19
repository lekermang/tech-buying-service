import { useState } from "react";
import Icon from "@/components/ui/icon";
import type { Checklist as ChecklistT } from "./types";

type Props = {
  checklist: ChecklistT;
  onToggle: (key: string, isDone: boolean) => Promise<void>;
  accent?: "gold" | "blue" | "violet";
};

const ACCENT: Record<string, string> = {
  gold: "border-l-[#FFD700]",
  blue: "border-l-sky-400",
  violet: "border-l-violet-400",
};

export default function Checklist({ checklist, onToggle, accent = "gold" }: Props) {
  const [busy, setBusy] = useState<string | null>(null);

  const handle = async (key: string, isDone: boolean) => {
    setBusy(key);
    try { await onToggle(key, isDone); } finally { setBusy(null); }
  };

  const pct = checklist.total ? (checklist.done / checklist.total) * 100 : 0;

  return (
    <div className="bg-gradient-to-br from-[#0E0E0E] to-[#080808] border border-[#1F1F1F] rounded-xl p-3">
      <div className="flex items-center gap-2 mb-3">
        <Icon name="ListChecks" size={14} className="text-[#FFD700]" />
        <div className="text-[11px] uppercase tracking-wider text-white/60 font-bold">Чек-лист дня</div>
        <span className="ml-auto text-[11px] tabular-nums text-white/55">
          {checklist.done}/{checklist.total}
        </span>
      </div>
      <div className="h-1 bg-[#1F1F1F] rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-gradient-to-r from-[#FFD700] to-emerald-400 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <ul className="space-y-1.5">
        {checklist.tasks.map((t) => (
          <li
            key={t.key}
            className={`flex items-start gap-2 p-2 rounded-lg bg-[#0A0A0A] border-l-2 ${ACCENT[accent]} hover:bg-[#0F0F0F] transition`}
          >
            <button
              onClick={() => handle(t.key, !t.is_done)}
              disabled={busy === t.key}
              className={`w-5 h-5 rounded border flex items-center justify-center transition shrink-0 mt-0.5 ${
                t.is_done
                  ? "bg-emerald-500/30 border-emerald-400 text-emerald-200"
                  : "border-white/20 hover:border-[#FFD700]/60"
              }`}
            >
              {busy === t.key ? (
                <Icon name="Loader" size={12} className="animate-spin" />
              ) : t.is_done ? (
                <Icon name="Check" size={12} />
              ) : null}
            </button>
            <div className="flex-1 min-w-0">
              <div className={`text-[13px] leading-snug ${t.is_done ? "text-white/40 line-through" : "text-white/85"}`}>
                {t.label}
              </div>
              {t.completed_at && (
                <div className="text-[10px] text-emerald-300/70 mt-0.5">
                  ✓ {new Date(t.completed_at).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
