import React, { useState } from "react";
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
  // Начальный депозит — только при создании
  const [initDeposit, setInitDeposit] = useState("");
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
    if (!r.ok) {
      setSaving(false);
      const d = await r.json(); setErr(d.error || "Ошибка"); return;
    }
    // Если создание и есть начальный депозит — сразу кладём деньги
    if (!isEdit && initDeposit && parseInt(initDeposit) > 0) {
      const created = await r.json();
      const goalId = created?.goal?.id || created?.id;
      if (goalId) {
        await fetch(`${SAVINGS_URL}?action=deposit`, {
          method: "POST",
          headers: { "X-Employee-Token": token, "Content-Type": "application/json" },
          body: JSON.stringify({ goal_id: goalId, amount: parseInt(initDeposit), note: "Начальный взнос" }),
        });
      }
    }
    setSaving(false);
    onSave(); onClose();
  };

  const INP = "w-full px-3 py-3 rounded-xl font-roboto text-sm text-white outline-none appearance-none";
  const INP_STYLE = { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" };
  const LBL = "font-roboto text-[10px] uppercase tracking-widest mb-1.5 block";
  const LBL_STYLE = { color: "rgba(255,255,255,0.35)" };

  return (
    <div
      className="fixed inset-0 z-[80]"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="absolute bottom-0 left-0 right-0 sm:relative sm:top-1/2 sm:left-1/2 sm:bottom-auto sm:max-w-md sm:mx-auto sm:my-0"
        style={{
          background: "linear-gradient(160deg,#1c1c1c,#111)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "20px 20px 0 0",
          maxHeight: "92dvh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* drag handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.18)" }} />
        </div>

        {/* Шапка */}
        <div className="px-5 py-3.5 flex items-center justify-between shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="font-oswald font-bold text-white text-lg uppercase tracking-wide">
            {isEdit ? "Редактировать цель" : "Новая цель"}
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full" style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.5)" }}>
            <Icon name="X" size={16} />
          </button>
        </div>

        {/* Скролл-область */}
        <div
          className="flex-1 px-5 py-4 space-y-5 pb-8"
          style={{ overflowY: "auto", WebkitOverflowScrolling: "touch" } as React.CSSProperties}
        >
          {/* Иконки */}
          <div>
            <label style={LBL_STYLE} className={LBL}>Иконка</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {EMOJIS.map(e => (
                <button key={e} onClick={() => setEmoji(e)}
                  className="w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all active:scale-90"
                  style={{
                    background: emoji === e ? `${color}22` : "rgba(255,255,255,0.05)",
                    border: emoji === e ? `2px solid ${color}` : "1px solid rgba(255,255,255,0.1)",
                    boxShadow: emoji === e ? `0 0 12px ${color}55` : "none",
                  }}>{e}</button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2.5">
              {COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)}
                  className="w-8 h-8 rounded-full transition-all active:scale-90"
                  style={{
                    background: c,
                    border: color === c ? `3px solid white` : "2px solid transparent",
                    boxShadow: color === c ? `0 0 10px ${c}` : "none",
                  }} />
              ))}
            </div>
          </div>

          {/* Название */}
          <div>
            <label style={LBL_STYLE} className={LBL}>Название *</label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              placeholder="Например: Новый телефон"
              className={INP} style={INP_STYLE} />
          </div>

          {/* Описание */}
          <div>
            <label style={LBL_STYLE} className={LBL}>Описание (необязательно)</label>
            <input value={desc} onChange={e => setDesc(e.target.value)}
              placeholder="Зачем тебе это нужно?"
              className={INP} style={INP_STYLE} />
          </div>

          {/* Сумма цели */}
          <div>
            <label style={LBL_STYLE} className={LBL}>Сумма цели *</label>
            <div className="relative">
              <input value={target} onChange={e => setTarget(e.target.value.replace(/\D/g, ""))}
                placeholder="50 000" inputMode="numeric"
                className={INP + " pr-8"} style={INP_STYLE} />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 font-roboto text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>₽</span>
            </div>
          </div>

          {/* Сразу положить — только при создании */}
          {!isEdit && (
            <div>
              <label style={LBL_STYLE} className={LBL}>
                Сразу положить (необязательно)
              </label>
              <div className="relative">
                <input value={initDeposit} onChange={e => setInitDeposit(e.target.value.replace(/\D/g, ""))}
                  placeholder="Начальная сумма" inputMode="numeric"
                  className={INP + " pr-8"} style={{ ...INP_STYLE, borderColor: initDeposit ? `${color}60` : undefined }} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 font-roboto text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>₽</span>
              </div>
              {initDeposit && parseInt(initDeposit) > 0 && (
                <div className="mt-1.5 font-roboto text-[11px] px-1" style={{ color: color }}>
                  🚀 Старт с {fmt(parseInt(initDeposit))} ₽ — отличное начало!
                </div>
              )}
            </div>
          )}

          {/* Срок */}
          <div>
            <label style={LBL_STYLE} className={LBL}>Срок (необязательно)</label>
            <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)}
              className={INP} style={{ ...INP_STYLE, colorScheme: "dark" } as React.CSSProperties} />
          </div>

          {/* Статус (только редактирование) */}
          {isEdit && (
            <div>
              <label style={LBL_STYLE} className={LBL}>Статус</label>
              <div className="flex gap-2">
                {(["active", "paused", "cancelled"] as const).map(s => (
                  <button key={s} onClick={() => setStatus(s)}
                    className="flex-1 py-2.5 rounded-xl font-roboto text-xs font-semibold transition-all active:scale-95"
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

          {err && (
            <div className="flex items-center gap-2 font-roboto text-sm text-red-400 px-3 py-2 rounded-xl"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <Icon name="AlertCircle" size={14} />{err}
            </div>
          )}

          <button onClick={save} disabled={saving}
            className="w-full py-3.5 rounded-xl font-oswald font-bold text-sm uppercase tracking-widest transition-all active:scale-95"
            style={{
              background: saving ? "rgba(255,215,0,0.4)" : "linear-gradient(135deg,#FFE34D,#FFD700)",
              color: "#000",
            }}>
            {saving ? "Сохраняю..." : isEdit ? "Сохранить изменения" : "Создать цель"}
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
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
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
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full" style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.5)" }}>
            <Icon name="X" size={16} />
          </button>
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
            <input value={amount} onChange={e => setAmount(e.target.value.replace(/\D/, ""))}
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

// ─── Modal: подтверждение удаления ────────────────────────────────────────────
export function DeleteGoalModal({
  goal, onClose, onDeleted, token,
}: {
  goal: Goal;
  onClose: () => void;
  onDeleted: () => void;
  token: string;
}) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const del = async () => {
    setLoading(true);
    const r = await fetch(`${SAVINGS_URL}?action=delete_goal`, {
      method: "POST",
      headers: { "X-Employee-Token": token, "Content-Type": "application/json" },
      body: JSON.stringify({ goal_id: goal.id }),
    });
    setLoading(false);
    if (r.ok) { onDeleted(); onClose(); }
    else { const d = await r.json(); setErr(d.error || "Ошибка удаления"); }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-sm rounded-2xl p-6 text-center"
        style={{ background: "linear-gradient(145deg,#1c1c1c,#111)", border: "1px solid rgba(255,255,255,0.1)" }}>
        <div className="text-4xl mb-3">{goal.emoji}</div>
        <div className="font-oswald font-bold text-white text-lg mb-1">Удалить цель?</div>
        <div className="font-roboto text-sm mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>
          «{goal.title}»
        </div>
        {goal.current_amount > 0 && (
          <div className="font-roboto text-sm mb-4" style={{ color: "#f87171" }}>
            В копилке {fmt(goal.current_amount)} ₽ — они вернутся на общий баланс
          </div>
        )}
        {!goal.current_amount && (
          <div className="font-roboto text-sm mb-4" style={{ color: "rgba(255,255,255,0.35)" }}>
            Это действие нельзя отменить
          </div>
        )}
        {err && <div className="font-roboto text-sm text-red-400 mb-3">{err}</div>}
        <div className="flex gap-2">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl font-roboto text-sm font-semibold"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>
            Отмена
          </button>
          <button onClick={del} disabled={loading}
            className="flex-1 py-2.5 rounded-xl font-roboto text-sm font-bold transition-all active:scale-95"
            style={{ background: "rgba(248,113,113,0.2)", border: "1px solid rgba(248,113,113,0.4)", color: "#f87171" }}>
            {loading ? "..." : "Удалить"}
          </button>
        </div>
      </div>
    </div>
  );
}