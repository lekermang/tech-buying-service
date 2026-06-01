import { useState } from "react";
import Icon from "@/components/ui/icon";
import { triggerReaction } from "@/components/FunReaction";
import { SAVINGS_URL, fmt, EMOJIS, COLORS, type Goal } from "./savings.types";

// ─── Modal: создать/редактировать цель ───────────────────────────────────────
export function GoalModal({
  goal, onClose, onSave, token,
}: {
  goal: Goal | null;
  onClose: () => void;
  onSave: () => void;
  token: string;
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
export function TransactionModal({
  goal, mode, onClose, onDone, token,
}: {
  goal: Goal;
  mode: "deposit" | "withdraw";
  onClose: () => void;
  onDone: () => void;
  token: string;
}) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

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
    if (r.ok) { const d = await r.json(); if (d.goal_reached) triggerReaction("goal_reached", goal.target_amount); onDone(); onClose(); }
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
