import { useState } from "react";
import Icon from "@/components/ui/icon";
import { fmt, LEVEL_STYLES, LEVEL_LABELS, type Goal, type Tip } from "./savings.types";

// ─── GoalCard ─────────────────────────────────────────────────────────────────
export function GoalCard({
  goal, onDeposit, onWithdraw, onEdit, onDelete,
}: {
  goal: Goal;
  onDeposit: (g: Goal) => void;
  onWithdraw: (g: Goal) => void;
  onEdit: (g: Goal) => void;
  onDelete: (g: Goal) => void;
}) {
  const pct = goal.target_amount > 0
    ? Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100))
    : 0;
  const left = goal.target_amount - goal.current_amount;
  const isDone = goal.status === "done";
  const isPaused = goal.status === "paused";
  const [menuOpen, setMenuOpen] = useState(false);

  let daysLeft: number | null = null;
  if (goal.deadline) {
    const d = Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / 86400000);
    daysLeft = d;
  }

  // ── Мотивация: сколько нужно откладывать, чтобы успеть к цели ──
  // Если есть дедлайн — делим остаток на оставшиеся дни.
  // Если дедлайна нет — берём горизонт 30 дней (план на месяц).
  const horizonDays = daysLeft !== null && daysLeft > 0 ? daysLeft : (goal.deadline ? 0 : 30);
  const perDay = !isDone && left > 0 && horizonDays > 0 ? Math.ceil(left / horizonDays) : 0;
  const perWeek = perDay > 0 ? perDay * 7 : 0;
  // Просрочка: дедлайн прошёл, но цель не достигнута
  const overdue = daysLeft !== null && daysLeft <= 0 && !isDone && left > 0;

  // Мотивационное сообщение
  const motivation = !isDone && pct < 100 ? (
    pct === 0 ? "Сделай первый шаг — положи хоть немного!" :
    pct < 25 ? "Хорошее начало! Продолжай откладывать." :
    pct < 50 ? "Четверть пути позади — ты на верном пути!" :
    pct < 75 ? "Больше половины! Ещё немного усилий." :
    pct < 100 ? "Финишная прямая! Почти у цели 🔥" : null
  ) : null;

  return (
    <div className="rounded-2xl overflow-hidden relative" style={{
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
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0" style={{
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

        {/* Меню редактирования/удаления */}
        <div className="relative shrink-0">
          <button onClick={() => setMenuOpen(v => !v)}
            className="p-1.5 rounded-lg transition-all"
            style={{ color: "rgba(255,255,255,0.3)", background: menuOpen ? "rgba(255,255,255,0.08)" : "transparent" }}>
            <Icon name="MoreVertical" size={15} />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-7 z-20 rounded-xl overflow-hidden shadow-2xl min-w-[140px]"
                style={{ background: "#1e1e1e", border: "1px solid rgba(255,255,255,0.12)" }}>
                <button onClick={() => { setMenuOpen(false); onEdit(goal); }}
                  className="w-full flex items-center gap-2 px-4 py-3 font-roboto text-sm text-white hover:bg-white/5 active:bg-white/10 transition-colors">
                  <Icon name="Pencil" size={14} style={{ color: "#FFD700" }} /> Редактировать
                </button>
                <div style={{ height: "1px", background: "rgba(255,255,255,0.07)" }} />
                <button onClick={() => { setMenuOpen(false); onDelete(goal); }}
                  className="w-full flex items-center gap-2 px-4 py-3 font-roboto text-sm hover:bg-white/5 active:bg-white/10 transition-colors"
                  style={{ color: "#f87171" }}>
                  <Icon name="Trash2" size={14} /> Удалить
                </button>
              </div>
            </>
          )}
        </div>
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
            <div className="font-oswald font-bold text-xl tabular-nums" style={{ color: isDone ? "#34d399" : pct >= 75 ? goal.color : "rgba(255,255,255,0.5)" }}>
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
        <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
          <div className="h-full rounded-full transition-all duration-500" style={{
            width: `${pct}%`,
            background: isDone
              ? "linear-gradient(90deg,#34d399,#6ee7b7)"
              : `linear-gradient(90deg,${goal.color},${goal.color}bb)`,
            boxShadow: isDone ? `0 0 8px rgba(52,211,153,0.5)` : `0 0 8px ${goal.color}60`,
          }} />
        </div>

        {/* Мотивация */}
        {motivation && (
          <div className="mt-1.5 font-roboto text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>
            {motivation}
          </div>
        )}

        {/* Дедлайн */}
        {goal.deadline && daysLeft !== null && (
          <div className="mt-1.5 flex items-center gap-1 font-roboto text-[10px]" style={{
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

      {/* ── Мотивация: сколько откладывать ── */}
      {!isDone && perDay > 0 && (
        <div className="px-4 pb-3">
          <div className="rounded-xl p-3 flex items-center gap-3" style={{
            background: `linear-gradient(135deg,${goal.color}14,${goal.color}06)`,
            border: `1px solid ${goal.color}30`,
          }}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{
              background: `${goal.color}20`, border: `1px solid ${goal.color}40`,
            }}>
              <Icon name="PiggyBank" size={16} style={{ color: goal.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-roboto text-[10px] uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.4)" }}>
                {daysLeft !== null && daysLeft > 0
                  ? `Чтобы успеть за ${daysLeft} ${daysLeft === 1 ? "день" : daysLeft < 5 ? "дня" : "дней"}, откладывай`
                  : "Чтобы достичь за месяц, откладывай"}
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-oswald font-black text-xl tabular-nums" style={{ color: goal.color }}>
                  {fmt(perDay)} ₽
                </span>
                <span className="font-roboto text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>в день</span>
                {perWeek > 0 && (
                  <span className="font-roboto text-[10px] ml-auto" style={{ color: "rgba(255,255,255,0.25)" }}>
                    ≈ {fmt(perWeek)} ₽ / неделю
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Просрочка без накоплений — мягкое предупреждение */}
      {overdue && (
        <div className="px-4 pb-3">
          <div className="rounded-xl p-3 font-roboto text-[11px] leading-relaxed" style={{
            background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)", color: "#fca5a5",
          }}>
            ⏰ Срок прошёл, а до цели ещё {fmt(left)} ₽. Продли срок в редактировании или откладывай чаще — ты справишься!
          </div>
        </div>
      )}

      {/* Кнопки действий */}
      {!isDone && (
        <div className="px-4 pb-4 flex gap-2">
          <button onClick={() => onDeposit(goal)}
            className="flex-1 py-2.5 rounded-xl font-roboto text-sm font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95"
            style={{
              background: `linear-gradient(135deg,${goal.color}30,${goal.color}18)`,
              border: `1px solid ${goal.color}50`,
              color: goal.color,
            }}>
            <Icon name="Plus" size={14} /> Отложить
          </button>
          {goal.current_amount > 0 && (
            <button onClick={() => onWithdraw(goal)}
              className="px-3 py-2.5 rounded-xl font-roboto text-sm transition-all active:scale-95"
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

      {isDone && (
        <div className="px-4 pb-4">
          <div className="py-2 text-center font-roboto text-sm font-bold rounded-xl"
            style={{ background: "rgba(52,211,153,0.1)", color: "#34d399" }}>
            🎉 Цель достигнута!
          </div>
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