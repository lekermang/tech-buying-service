import { useEffect, useState, useCallback } from "react";
import Icon from "@/components/ui/icon";

const SAVINGS_URL = "https://functions.poehali.dev/4b6d2cd3-a8ca-4aac-aec2-ba9664b21b07";
const fmt = (n: number) => Math.round(n).toLocaleString("ru-RU");

// ─── Types ────────────────────────────────────────────────────────────────────
type Goal = {
  id: number;
  title: string;
  description: string | null;
  target_amount: number;
  current_amount: number;
  emoji: string;
  color: string;
  deadline: string | null;
  status: "active" | "done" | "paused" | "cancelled";
  auto_save_percent: number;
  created_at: string;
  deposited: number;
  withdrawn: number;
  tx_count: number;
};
type Tx = {
  id: number;
  amount: number;
  note: string | null;
  source: string;
  created_at: string;
  goal_title: string | null;
  goal_emoji: string | null;
};
type Tip = {
  icon: string;
  title: string;
  text: string;
  level: "beginner" | "advanced" | "important" | "info";
};
type Overview = {
  goals: Goal[];
  total_saved: number;
  earned_30d: number;
  days_worked: number;
  recent_tx: Tx[];
};

const EMOJIS = ["🎯","📱","💻","🏠","✈️","🚗","👟","📚","🎸","🎮","💍","🌴","🎓","🛡️","💰","🏋️","🐶","🎁"];
const COLORS = ["#FFD700","#34d399","#60a5fa","#f472b6","#a78bfa","#fb923c","#f87171","#38bdf8"];

const LEVEL_STYLES: Record<string, { bg: string; border: string; badge: string }> = {
  beginner:  { bg: "rgba(52,211,153,0.06)",  border: "rgba(52,211,153,0.2)",  badge: "#34d399" },
  advanced:  { bg: "rgba(96,165,250,0.06)",  border: "rgba(96,165,250,0.2)",  badge: "#60a5fa" },
  important: { bg: "rgba(255,215,0,0.06)",   border: "rgba(255,215,0,0.2)",   badge: "#FFD700" },
  info:      { bg: "rgba(167,139,250,0.06)", border: "rgba(167,139,250,0.2)", badge: "#a78bfa" },
};
const LEVEL_LABELS: Record<string, string> = {
  beginner: "Начало", advanced: "Продвинутый", important: "Важно", info: "Факт",
};

// ─── GoalCard ─────────────────────────────────────────────────────────────────
function GoalCard({
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
function TipCard({ tip }: { tip: Tip }) {
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

// ─── Modal: создать/редактировать цель ───────────────────────────────────────
function GoalModal({
  goal, onClose, onSave,
}: {
  goal: Goal | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const isEdit = !!goal;
  const [title, setTitle] = useState(goal?.title ?? "");
  const [desc, setDesc] = useState(goal?.description ?? "");
  const [target, setTarget] = useState(goal?.target_amount ? String(goal.target_amount) : "");
  const [emoji, setEmoji] = useState(goal?.emoji ?? "🎯");
  const [color, setColor] = useState(goal?.color ?? "#FFD700");
  const [deadline, setDeadline] = useState(goal?.deadline?.slice(0, 10) ?? "");
  const [autoSave, setAutoSave] = useState(goal?.auto_save_percent ? String(goal.auto_save_percent) : "0");
  const [status, setStatus] = useState(goal?.status ?? "active");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("employee_token") || "" : "";

  const save = async () => {
    if (!title.trim()) { setErr("Введи название"); return; }
    if (!target || parseInt(target) <= 0) { setErr("Введи сумму цели"); return; }
    setSaving(true); setErr("");
    const body = {
      title: title.trim(), description: desc.trim() || null,
      target_amount: parseInt(target), emoji, color,
      deadline: deadline || null, auto_save_percent: parseInt(autoSave) || 0,
      ...(isEdit ? { goal_id: goal!.id, status } : {}),
    };
    const r = await fetch(
      `${SAVINGS_URL}?action=${isEdit ? "update_goal" : "create_goal"}`,
      { method: "POST", headers: { "X-Employee-Token": token, "Content-Type": "application/json" }, body: JSON.stringify(body) },
    );
    setSaving(false);
    if (r.ok) { onSave(); onClose(); }
    else { const d = await r.json(); setErr(d.error || "Ошибка"); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden" style={{
        background: "linear-gradient(145deg,#1a1a1a,#111)", border: "1px solid rgba(255,255,255,0.1)",
        maxHeight: "90vh", overflowY: "auto",
      }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="font-oswald font-bold text-white text-lg uppercase">
            {isEdit ? "Редактировать цель" : "Новая цель"}
          </div>
          <button onClick={onClose} style={{ color: "rgba(255,255,255,0.4)" }}><Icon name="X" size={18} /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Emoji + цвет */}
          <div>
            <div className="font-roboto text-[10px] uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>Иконка</div>
            <div className="flex flex-wrap gap-2 mb-3">
              {EMOJIS.map(e => (
                <button key={e} onClick={() => setEmoji(e)}
                  className="w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all"
                  style={{
                    background: emoji === e ? `${color}25` : "rgba(255,255,255,0.05)",
                    border: emoji === e ? `2px solid ${color}` : "1px solid rgba(255,255,255,0.1)",
                  }}>{e}</button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-full transition-all"
                  style={{
                    background: c,
                    border: color === c ? `3px solid white` : "2px solid transparent",
                    boxShadow: color === c ? `0 0 8px ${c}` : "none",
                  }} />
              ))}
            </div>
          </div>

          {/* Название */}
          <div>
            <div className="font-roboto text-[10px] uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>Название *</div>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Например: Новый телефон"
              className="w-full px-3 py-2.5 rounded-xl font-roboto text-sm text-white outline-none"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }} />
          </div>

          {/* Описание */}
          <div>
            <div className="font-roboto text-[10px] uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>Описание (необязательно)</div>
            <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Зачем тебе это нужно?"
              className="w-full px-3 py-2.5 rounded-xl font-roboto text-sm text-white outline-none"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }} />
          </div>

          {/* Сумма */}
          <div>
            <div className="font-roboto text-[10px] uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>Сумма цели *</div>
            <div className="relative">
              <input value={target} onChange={e => setTarget(e.target.value.replace(/\D/g,""))}
                placeholder="50 000" inputMode="numeric"
                className="w-full px-3 py-2.5 pr-8 rounded-xl font-roboto text-sm text-white outline-none"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }} />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 font-roboto text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>₽</span>
            </div>
          </div>

          {/* Дедлайн */}
          <div>
            <div className="font-roboto text-[10px] uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>Срок (необязательно)</div>
            <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl font-roboto text-sm text-white outline-none"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }} />
          </div>

          {/* Статус (только при редактировании) */}
          {isEdit && (
            <div>
              <div className="font-roboto text-[10px] uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>Статус</div>
              <div className="flex gap-2">
                {(["active","paused","cancelled"] as const).map(s => (
                  <button key={s} onClick={() => setStatus(s)}
                    className="flex-1 py-2 rounded-xl font-roboto text-xs font-semibold transition-all"
                    style={{
                      background: status === s ? "rgba(255,215,0,0.15)" : "rgba(255,255,255,0.04)",
                      border: status === s ? "1px solid rgba(255,215,0,0.4)" : "1px solid rgba(255,255,255,0.08)",
                      color: status === s ? "#FFD700" : "rgba(255,255,255,0.4)",
                    }}>
                    {s === "active" ? "Активна" : s === "paused" ? "Пауза" : "Отменить"}
                  </button>
                ))}
              </div>
            </div>
          )}

          {err && <div className="font-roboto text-sm text-red-400">{err}</div>}

          <button onClick={save} disabled={saving}
            className="w-full py-3 rounded-xl font-oswald font-bold text-sm uppercase tracking-wide transition-all active:scale-95"
            style={{
              background: "linear-gradient(135deg,#FFE34D,#FFD700)",
              color: "#000", opacity: saving ? 0.6 : 1,
            }}>
            {saving ? "Сохраняю..." : isEdit ? "Сохранить" : "Создать цель"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal: пополнить / снять ─────────────────────────────────────────────────
function TransactionModal({
  goal, mode, onClose, onDone,
}: {
  goal: Goal;
  mode: "deposit" | "withdraw";
  onClose: () => void;
  onDone: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("employee_token") || "" : "";

  const QUICK = mode === "deposit"
    ? [500, 1000, 2000, 5000]
    : [500, 1000, Math.floor(goal.current_amount / 2), goal.current_amount].filter(v => v > 0 && v <= goal.current_amount);

  const submit = async () => {
    const val = parseInt(amount);
    if (!val || val <= 0) { setErr("Введи сумму"); return; }
    if (mode === "withdraw" && val > goal.current_amount) { setErr(`Максимум ${fmt(goal.current_amount)} ₽`); return; }
    setSaving(true); setErr("");
    const r = await fetch(`${SAVINGS_URL}?action=${mode}`, {
      method: "POST",
      headers: { "X-Employee-Token": token, "Content-Type": "application/json" },
      body: JSON.stringify({ goal_id: goal.id, amount: val, note: note.trim() || null }),
    });
    setSaving(false);
    if (r.ok) { const d = await r.json(); if (d.goal_reached) alert("🎉 Цель достигнута!"); onDone(); onClose(); }
    else { const d = await r.json(); setErr(d.error || "Ошибка"); }
  };

  const isDeposit = mode === "deposit";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden" style={{
        background: "linear-gradient(145deg,#1a1a1a,#111)", border: "1px solid rgba(255,255,255,0.1)",
      }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-2">
            <span className="text-xl">{goal.emoji}</span>
            <div>
              <div className="font-oswald font-bold text-white">{isDeposit ? "Пополнить" : "Снять"}</div>
              <div className="font-roboto text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>{goal.title}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ color: "rgba(255,255,255,0.4)" }}><Icon name="X" size={18} /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Текущий баланс */}
          <div className="rounded-xl p-3 text-center" style={{
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
          }}>
            <div className="font-roboto text-[10px] uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>
              Сейчас в копилке
            </div>
            <div className="font-oswald font-black text-2xl" style={{ color: goal.color }}>
              {fmt(goal.current_amount)} ₽
            </div>
          </div>

          {/* Быстрые суммы */}
          <div>
            <div className="font-roboto text-[10px] uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>
              Быстрый выбор
            </div>
            <div className="flex flex-wrap gap-2">
              {QUICK.map(q => (
                <button key={q} onClick={() => setAmount(String(q))}
                  className="px-3 py-1.5 rounded-xl font-roboto text-sm font-semibold transition-all"
                  style={{
                    background: amount === String(q) ? `${goal.color}20` : "rgba(255,255,255,0.05)",
                    border: amount === String(q) ? `1px solid ${goal.color}60` : "1px solid rgba(255,255,255,0.1)",
                    color: amount === String(q) ? goal.color : "rgba(255,255,255,0.6)",
                  }}>
                  {fmt(q)} ₽
                </button>
              ))}
            </div>
          </div>

          {/* Сумма вручную */}
          <div className="relative">
            <input value={amount} onChange={e => setAmount(e.target.value.replace(/\D/,""))}
              placeholder="Своя сумма" inputMode="numeric"
              className="w-full px-3 py-2.5 pr-8 rounded-xl font-roboto text-sm text-white outline-none"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }} />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 font-roboto text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>₽</span>
          </div>

          {/* Комментарий */}
          <input value={note} onChange={e => setNote(e.target.value)}
            placeholder={isDeposit ? "Откуда деньги (необязательно)" : "Причина снятия (необязательно)"}
            className="w-full px-3 py-2.5 rounded-xl font-roboto text-sm text-white outline-none"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }} />

          {err && <div className="font-roboto text-sm text-red-400">{err}</div>}

          <button onClick={submit} disabled={saving}
            className="w-full py-3 rounded-xl font-oswald font-bold text-sm uppercase tracking-wide transition-all active:scale-95"
            style={{
              background: isDeposit
                ? `linear-gradient(135deg,${goal.color},${goal.color}bb)`
                : "rgba(248,113,113,0.2)",
              border: isDeposit ? "none" : "1px solid rgba(248,113,113,0.4)",
              color: isDeposit ? "#000" : "#f87171",
              opacity: saving ? 0.6 : 1,
            }}>
            {saving ? "..." : isDeposit ? `+ Положить в копилку` : `− Снять`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SavingsView({ token }: { token: string }) {
  const [data, setData] = useState<Overview | null>(null);
  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"goals" | "tips" | "history">("goals");

  const [createOpen, setCreateOpen] = useState(false);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [depositGoal, setDepositGoal] = useState<Goal | null>(null);
  const [withdrawGoal, setWithdrawGoal] = useState<Goal | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [r1, r2] = await Promise.all([
      fetch(`${SAVINGS_URL}?action=get_goals`, { headers: { "X-Employee-Token": token } }),
      fetch(`${SAVINGS_URL}?action=get_tips`, { headers: { "X-Employee-Token": token } }),
    ]);
    if (r1.ok) setData(await r1.json());
    if (r2.ok) { const d = await r2.json(); setTips(d.tips || []); }
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div className="py-10 flex items-center justify-center gap-2" style={{ color: "rgba(255,255,255,0.3)" }}>
      <Icon name="Loader2" size={18} className="animate-spin" />
      <span className="font-roboto text-sm">Загрузка...</span>
    </div>
  );

  const activeGoals = data?.goals.filter(g => g.status === "active") ?? [];
  const doneGoals   = data?.goals.filter(g => g.status === "done") ?? [];
  const otherGoals  = data?.goals.filter(g => g.status === "paused" || g.status === "cancelled") ?? [];

  return (
    <div className="space-y-4 pb-6">
      {/* Шапка */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{
            background: "linear-gradient(135deg,#a78bfa,#7c3aed)",
            boxShadow: "0 0 16px rgba(167,139,250,0.35)",
          }}>
            <Icon name="PiggyBank" size={17} className="text-white" />
          </div>
          <div>
            <div className="font-oswald font-black uppercase tracking-wide text-sm text-white">Копилка</div>
            <div className="font-roboto text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>Накопления и цели</div>
          </div>
        </div>
        <button onClick={() => setCreateOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-roboto text-sm font-bold transition-all active:scale-95"
          style={{ background: "rgba(167,139,250,0.15)", border: "1px solid rgba(167,139,250,0.35)", color: "#a78bfa" }}>
          <Icon name="Plus" size={14} /> Новая цель
        </button>
      </div>

      {/* Общий баланс */}
      {data && (
        <div className="rounded-2xl p-4" style={{
          background: "linear-gradient(145deg,rgba(167,139,250,0.1),rgba(167,139,250,0.03))",
          border: "1.5px solid rgba(167,139,250,0.3)",
          boxShadow: "0 0 32px rgba(167,139,250,0.06)",
        }}>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <div className="font-roboto text-[9px] uppercase tracking-widest mb-1" style={{ color: "rgba(167,139,250,0.6)" }}>
                Всего накоплено
              </div>
              <div className="font-oswald font-black text-xl tabular-nums" style={{ color: "#a78bfa" }}>
                {fmt(data.total_saved)} ₽
              </div>
            </div>
            <div className="text-center" style={{ borderLeft: "1px solid rgba(255,255,255,0.06)", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="font-roboto text-[9px] uppercase tracking-widest mb-1" style={{ color: "rgba(52,211,153,0.6)" }}>
                Заработано / 30 дн.
              </div>
              <div className="font-oswald font-black text-xl tabular-nums" style={{ color: "#34d399" }}>
                {fmt(data.earned_30d)} ₽
              </div>
            </div>
            <div className="text-center">
              <div className="font-roboto text-[9px] uppercase tracking-widest mb-1" style={{ color: "rgba(255,215,0,0.6)" }}>
                Активных целей
              </div>
              <div className="font-oswald font-black text-xl tabular-nums" style={{ color: "#FFD700" }}>
                {activeGoals.length}
              </div>
            </div>
          </div>

          {/* Подсказка если ничего нет */}
          {data.total_saved === 0 && (
            <div className="mt-3 pt-3 font-roboto text-xs text-center leading-relaxed" style={{
              color: "rgba(255,255,255,0.35)", borderTop: "1px solid rgba(255,255,255,0.06)",
            }}>
              💡 Создай первую цель и начни откладывать деньги — даже 500 ₽ в день дают 15 000 ₽ в месяц!
            </div>
          )}
        </div>
      )}

      {/* Вкладки */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
        {([
          { k: "goals",   label: "Цели",    icon: "Target" },
          { k: "tips",    label: "Советы",  icon: "Lightbulb" },
          { k: "history", label: "История", icon: "History" },
        ] as const).map(({ k, label, icon }) => (
          <button key={k} onClick={() => setActiveTab(k)}
            className="flex-1 py-1.5 rounded-lg font-roboto text-xs font-semibold transition-all flex items-center justify-center gap-1"
            style={{
              background: activeTab === k ? "rgba(167,139,250,0.18)" : "transparent",
              color: activeTab === k ? "#a78bfa" : "rgba(255,255,255,0.4)",
              border: activeTab === k ? "1px solid rgba(167,139,250,0.35)" : "1px solid transparent",
            }}>
            <Icon name={icon} size={12} />{label}
          </button>
        ))}
      </div>

      {/* ── ЦЕЛИ ── */}
      {activeTab === "goals" && (
        <div className="space-y-3">
          {activeGoals.length === 0 && doneGoals.length === 0 ? (
            <div className="py-10 text-center space-y-3">
              <div className="text-5xl">🎯</div>
              <div className="font-oswald font-bold text-white text-lg">Нет активных целей</div>
              <div className="font-roboto text-sm leading-relaxed max-w-xs mx-auto" style={{ color: "rgba(255,255,255,0.35)" }}>
                Создай первую цель — телефон, ноутбук, отпуск или подушка безопасности. Конкретная цель мотивирует копить!
              </div>
              <button onClick={() => setCreateOpen(true)}
                className="mx-auto flex items-center gap-2 px-5 py-2.5 rounded-xl font-roboto font-bold text-sm transition-all active:scale-95"
                style={{ background: "rgba(167,139,250,0.15)", border: "1px solid rgba(167,139,250,0.35)", color: "#a78bfa" }}>
                <Icon name="Plus" size={14} /> Создать первую цель
              </button>
            </div>
          ) : (
            <>
              {activeGoals.map(g => (
                <GoalCard key={g.id} goal={g}
                  onDeposit={setDepositGoal}
                  onWithdraw={setWithdrawGoal}
                  onEdit={setEditGoal}
                />
              ))}
              {doneGoals.length > 0 && (
                <>
                  <div className="font-roboto text-[10px] uppercase tracking-widest pt-2" style={{ color: "rgba(52,211,153,0.5)" }}>
                    ✓ Выполненные цели
                  </div>
                  {doneGoals.map(g => (
                    <GoalCard key={g.id} goal={g}
                      onDeposit={setDepositGoal}
                      onWithdraw={setWithdrawGoal}
                      onEdit={setEditGoal}
                    />
                  ))}
                </>
              )}
              {otherGoals.length > 0 && (
                <>
                  <div className="font-roboto text-[10px] uppercase tracking-widest pt-2" style={{ color: "rgba(255,255,255,0.2)" }}>
                    На паузе / отменены
                  </div>
                  {otherGoals.map(g => (
                    <GoalCard key={g.id} goal={g}
                      onDeposit={setDepositGoal}
                      onWithdraw={setWithdrawGoal}
                      onEdit={setEditGoal}
                    />
                  ))}
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* ── СОВЕТЫ ── */}
      {activeTab === "tips" && (
        <div className="space-y-2">
          {tips.length === 0 ? (
            <div className="py-8 text-center font-roboto text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
              Советы загружаются...
            </div>
          ) : (
            <>
              <div className="font-roboto text-[10px] uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.25)" }}>
                Нажми на совет чтобы раскрыть
              </div>
              {tips.map((t, i) => <TipCard key={i} tip={t} />)}

              <div className="rounded-xl p-4 mt-2" style={{
                background: "rgba(255,215,0,0.05)", border: "1px solid rgba(255,215,0,0.15)",
              }}>
                <div className="font-roboto text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
                  <span className="font-bold text-yellow-400">Помни:</span> Накопления — это не про ограничения. Это про свободу. Когда у тебя есть финансовая подушка, ты можешь говорить "нет" неудобным ситуациям и "да" — хорошим возможностям.
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── ИСТОРИЯ ── */}
      {activeTab === "history" && (
        <div className="space-y-1.5">
          {!data?.recent_tx.length ? (
            <div className="py-8 text-center font-roboto text-sm" style={{ color: "rgba(255,255,255,0.25)" }}>
              Транзакций ещё нет
            </div>
          ) : (
            data.recent_tx.map(tx => {
              const isPos = tx.amount > 0;
              const d = new Date(tx.created_at);
              const label = d.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
              const time = d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
              return (
                <div key={tx.id} className="flex items-center justify-between rounded-xl px-3 py-3" style={{
                  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
                      style={{ background: isPos ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)" }}>
                      {tx.goal_emoji || (isPos ? "+" : "−")}
                    </div>
                    <div>
                      <div className="font-roboto text-sm text-white">
                        {tx.goal_title || "Общая копилка"}
                      </div>
                      <div className="flex items-center gap-1.5 font-roboto text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                        <span>{label}</span>
                        <span>·</span>
                        <span>{time}</span>
                        {tx.note && <><span>·</span><span className="italic">{tx.note}</span></>}
                      </div>
                    </div>
                  </div>
                  <div className="font-oswald font-bold tabular-nums shrink-0"
                    style={{ color: isPos ? "#34d399" : "#f87171" }}>
                    {isPos ? "+" : "−"}{fmt(Math.abs(tx.amount))} ₽
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Модалки */}
      {createOpen && (
        <GoalModal goal={null} onClose={() => setCreateOpen(false)} onSave={load} />
      )}
      {editGoal && (
        <GoalModal goal={editGoal} onClose={() => setEditGoal(null)} onSave={load} />
      )}
      {depositGoal && (
        <TransactionModal goal={depositGoal} mode="deposit"
          onClose={() => setDepositGoal(null)} onDone={load} />
      )}
      {withdrawGoal && (
        <TransactionModal goal={withdrawGoal} mode="withdraw"
          onClose={() => setWithdrawGoal(null)} onDone={load} />
      )}
    </div>
  );
}
