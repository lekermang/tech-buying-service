import Icon from "@/components/ui/icon";
import { useState } from "react";
import type { Checklist as ChecklistT } from "./types";
import ChecklistTaskCard from "./ChecklistTaskCard";

type Props = {
  checklist: ChecklistT;
  token: string;
  onToggle: (key: string, isDone: boolean) => Promise<void>;
  onRefresh?: () => void;
  accent?: "gold" | "blue" | "violet";
};

const ACCENT: Record<string, string> = {
  gold: "border-l-[#FFD700]",
  blue: "border-l-sky-400",
  violet: "border-l-violet-400",
};

export default function Checklist({ checklist, token, onToggle, onRefresh, accent = "gold" }: Props) {
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
          <ChecklistTaskCard
            key={t.key}
            task={t}
            token={token}
            accent={ACCENT[accent]}
            busy={busy === t.key}
            onToggle={handle}
            onRefresh={onRefresh}
          />
        ))}
      </ul>
      <div className="mt-3 pt-3 border-t border-white/5 text-[10px] text-white/40 text-center">
        Нажми на задачу, чтобы увидеть детали и совершить действие
      </div>
    </div>
  );
}
