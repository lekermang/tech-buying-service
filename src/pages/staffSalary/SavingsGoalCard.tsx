import { useState } from "react";
import Icon from "@/components/ui/icon";
import { fmt, LEVEL_STYLES, LEVEL_LABELS, type Goal, type Tip } from "./savings.types";

// ─── GoalCard ─────────────────────────────────────────────────────────────────
export function GoalCard({
  goal, onDeposit, onWithdraw, onEdit,
}: {
  goal: Goal;
  onDeposit: (g: Goal) => void;
  onWithdraw: (g: Goal) => void;
  onEdit: (g: Goal) => void;
}) {
  const pct = goal.target_amount > 0
    ? Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100))
    : 0;
  const left = goal.target_amount - goal.current_amount;
  const isDone = goal.status === "done";
  const isPaused = goal.status === "paused";

  let daysLeft: number | null = null;
  if (goal.deadline) {
    const d = Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / 86400000);
    daysLeft = d;
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{
      background: isDone
        ? "linear-gradient(145deg,rgba(52,211,153,0.12),rgba(52,211,153,0.04))"
        : isPaused
        ? "rgba(255,255,255,0.02)"
        : "rgba(255,255,255,0.04)",
      border: isDone
        ? "1.5px solid rgba(52,211,153,0.35)"
        : isPaused
        ? "1px solid rgba(255,255,255,0.06)"
        : `1.5px solid ${goal.color}30`,
      opacity: isPaused ? 0.7 : 1,
    }}>
      {/* Заголовок */}
      <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 font-bold" style={{
            background: `${goal.color}18`, border: `1.5px solid ${goal.color}40`,
          }}>
            {goal.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="font-oswald font-bold text-base text-white leading-tight truncate">{goal.title}</div>
              {isDone && (
                <span className="text-[10px] font-roboto font-bold px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(52,211,153,0.2)", color: "#34d399" }}>✓ Выполнено</span>
              )}
              {isPaused && (
                <span className="text-[10px] font-roboto font-bold px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}>⏸ Пауза</span>
              )}
            </div>
            {goal.description && (
              <div className="font-roboto text-[11px] mt-0.5 leading-tight" style={{ color: "rgba(255,255,255,0.35)" }}>
                {goal.description}
              </div>
            )}
          </div>
        </div>
        <button onClick={() => onEdit(goal)} className="p-1.5 rounded-lg shrink-0 transition-opacity hover:opacity-80"
          style={{ color: "rgba(255,255,255,0.3)" }}>
          <Icon name="Pencil" size={13} />
        </button>
      </div>

      {/* Прогресс */}
      <div className="px-4 pb-3">
        <div className="flex items-end justify-between mb-2">
          <div>
            <div className="font-oswald font-black text-2xl tabular-nums" style={{ color: isDone ? "#34d399" : goal.color }}>
              {fmt(goal.current_amount)} ₽
            </div>
            <div className="font-roboto text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
              из {fmt(goal.target_amount)} ₽
            </div>
          </div>
          <div className="text-right">
            <div className="font-oswald font-bold text-xl tabular-nums" style={{ color: isDone ? "#34d399" : "rgba(255,255,255,0.5)" }}>
              {pct}%
            </div>
            {!isDone && left > 0 && (
              <div className="font-roboto text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>
                ещё {fmt(left)} ₽
              </div>
            )}
          </div>
        </div>

        {/* Прогресс-бар */}
        <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
          <div className="h-full rounded-full transition-all duration-500" style={{
            width: `${pct}%`,
            background: isDone
              ? "linear-gradient(90deg,#34d399,#6ee7b7)"
              : `linear-gradient(90deg,${goal.color},${goal.color}bb)`,
            boxShadow: isDone ? `0 0 8px rgba(52,211,153,0.5)` : `0 0 8px ${goal.color}60`,
          }} />
        </div>

        {/* Дедлайн */}
        {goal.deadline && daysLeft !== null && (
          <div className="mt-2 flex items-center gap-1 font-roboto text-[10px]" style={{
            color: daysLeft < 7 ? "#f87171" : daysLeft < 30 ? "#fb923c" : "rgba(255,255,255,0.25)",
          }}>
            <Icon name="Calendar" size={10} />
            {daysLeft > 0
              ? `${daysLeft} ${daysLeft === 1 ? "день" : daysLeft < 5 ? "дня" : "дней"} до срока`
              : daysLeft === 0 ? "Срок сегодня!"
              : "Срок истёк"}
          </div>
        )}
      </div>

      {/* Кнопки */}
      {!isDone && (
        <div className="px-4 pb-4 flex gap-2">
          <button onClick={() => onDeposit(goal)}
            className="flex-1 py-2 rounded-xl font-roboto text-sm font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95"
            style={{
              background: `linear-gradient(135deg,${goal.color}25,${goal.color}15)`,
              border: `1px solid ${goal.color}40`,
              color: goal.color,
            }}>
            <Icon name="Plus" size={14} /> Пополнить
          </button>
          {goal.current_amount > 0 && (
            <button onClick={() => onWithdraw(goal)}
              className="px-3 py-2 rounded-xl font-roboto text-sm transition-all active:scale-95"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.4)",
              }}>
              <Icon name="Minus" size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── TipCard ──────────────────────────────────────────────────────────────────
export function TipCard({ tip }: { tip: Tip }) {
  const [open, setOpen] = useState(false);
  const s = LEVEL_STYLES[tip.level] || LEVEL_STYLES.info;
  return (
    <div className="rounded-xl overflow-hidden cursor-pointer transition-all"
      style={{ background: s.bg, border: `1px solid ${s.border}` }}
      onClick={() => setOpen(v => !v)}>
      <div className="px-3 py-3 flex items-center gap-3">
        <span className="text-xl shrink-0">{tip.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="font-roboto text-sm font-semibold text-white">{tip.title}</div>
            <span className="text-[9px] font-roboto font-bold px-1.5 py-0.5 rounded-full uppercase tracking-widest"
              style={{ background: `${s.badge}20`, color: s.badge }}>
              {LEVEL_LABELS[tip.level]}
            </span>
          </div>
          {!open && (
            <div className="font-roboto text-[11px] mt-0.5 truncate" style={{ color: "rgba(255,255,255,0.35)" }}>
              {tip.text}
            </div>
          )}
        </div>
        <Icon name={open ? "ChevronUp" : "ChevronDown"} size={14} style={{ color: "rgba(255,255,255,0.3)", flexShrink: 0 }} />
      </div>
      {open && (
        <div className="px-3 pb-3 font-roboto text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>
          {tip.text}
        </div>
      )}
    </div>
  );
}
