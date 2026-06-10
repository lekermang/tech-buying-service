import { useState, useEffect, useCallback } from "react";
import { SALARY_URL } from "@/pages/staff.types";
import Icon from "@/components/ui/icon";

interface Debt {
  id: number;
  amount: number;
  reason: string;
  comment: string | null;
  is_repaid: boolean;
  repaid_at: string | null;
  created_at: string;
}

interface Props {
  employeeId: number;
  employeeName: string;
  token: string;
}

export default function OwnerDebtsPanel({ employeeId, employeeName, token }: Props) {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [totalActive, setTotalActive] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ amount: "", reason: "", comment: "" });
  const [busy, setBusy] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const headers = { "X-Employee-Token": token, "Content-Type": "application/json" };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${SALARY_URL}?action=owner_list_debts&employee_id=${employeeId}`, {
        headers: { "X-Employee-Token": token },
      });
      const d = await r.json();
      setDebts(d.debts || []);
      setTotalActive(d.total_active || 0);
    } finally {
      setLoading(false);
    }
  }, [employeeId, token]);

  useEffect(() => { load(); }, [load]);

  const addDebt = async () => {
    const amt = parseInt(form.amount);
    if (!amt || amt <= 0 || !form.reason.trim()) return;
    setBusy(true);
    try {
      await fetch(`${SALARY_URL}?action=owner_add_debt`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          employee_id: employeeId,
          amount: amt,
          reason: form.reason.trim(),
          comment: form.comment.trim() || null,
        }),
      });
      setForm({ amount: "", reason: "", comment: "" });
      setShowAdd(false);
      await load();
    } finally {
      setBusy(false);
    }
  };

  const repayDebt = async (debtId: number) => {
    if (!confirm("Отметить долг как погашённый?")) return;
    setBusy(true);
    try {
      await fetch(`${SALARY_URL}?action=owner_repay_debt`, {
        method: "POST",
        headers,
        body: JSON.stringify({ debt_id: debtId }),
      });
      await load();
    } finally {
      setBusy(false);
    }
  };

  const activeDebts = debts.filter(d => !d.is_repaid);
  const repaidDebts = debts.filter(d => d.is_repaid);
  const visibleDebts = showAll ? debts : activeDebts;

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(220,38,38,0.2)", background: "rgba(220,38,38,0.04)" }}>
      {/* Шапка */}
      <div className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "1px solid rgba(220,38,38,0.15)", background: "rgba(220,38,38,0.08)" }}>
        <div className="flex items-center gap-2">
          <Icon name="AlertTriangle" size={15} className="text-red-400" />
          <span className="font-oswald font-bold text-sm text-red-300 uppercase tracking-wide">Долги сотрудника</span>
          {totalActive > 0 && (
            <span className="px-2 py-0.5 rounded-full font-oswald font-bold text-xs text-red-900"
              style={{ background: "#ef4444" }}>
              {totalActive.toLocaleString("ru-RU")} ₽
            </span>
          )}
        </div>
        <button
          onClick={() => setShowAdd(v => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-oswald font-bold uppercase tracking-wide transition-all"
          style={{
            background: showAdd ? "rgba(220,38,38,0.2)" : "rgba(255,255,255,0.06)",
            border: `1px solid ${showAdd ? "rgba(220,38,38,0.4)" : "rgba(255,255,255,0.12)"}`,
            color: showAdd ? "#fca5a5" : "rgba(255,255,255,0.6)",
          }}>
          <Icon name={showAdd ? "X" : "Plus"} size={13} />
          {showAdd ? "Отмена" : "Добавить"}
        </button>
      </div>

      {/* Форма добавления */}
      {showAdd && (
        <div className="px-4 py-3 space-y-2.5" style={{ borderBottom: "1px solid rgba(220,38,38,0.12)", background: "rgba(0,0,0,0.25)" }}>
          <div className="font-roboto text-[10px] text-white/40 uppercase tracking-wider mb-1">
            Назначить долг · {employeeName}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-roboto text-[10px] text-white/40 uppercase mb-1">Сумма ₽ *</label>
              <input
                type="number"
                value={form.amount}
                onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                placeholder="5000"
                className="w-full px-3 py-2 rounded-lg font-roboto text-sm text-white placeholder-white/20"
                style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(220,38,38,0.25)" }}
              />
            </div>
            <div>
              <label className="block font-roboto text-[10px] text-white/40 uppercase mb-1">Причина *</label>
              <input
                type="text"
                value={form.reason}
                onChange={e => setForm(p => ({ ...p, reason: e.target.value }))}
                placeholder="Аванс, штраф..."
                className="w-full px-3 py-2 rounded-lg font-roboto text-sm text-white placeholder-white/20"
                style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(220,38,38,0.25)" }}
              />
            </div>
          </div>
          <div>
            <label className="block font-roboto text-[10px] text-white/40 uppercase mb-1">Комментарий (необязательно)</label>
            <textarea
              value={form.comment}
              onChange={e => setForm(p => ({ ...p, comment: e.target.value }))}
              placeholder="Детали, условия возврата..."
              rows={2}
              className="w-full px-3 py-2 rounded-lg font-roboto text-sm text-white placeholder-white/20 resize-none"
              style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(220,38,38,0.25)" }}
            />
          </div>
          <button
            onClick={addDebt}
            disabled={busy || !form.amount || !form.reason.trim()}
            className="w-full py-2.5 rounded-lg font-oswald font-bold text-sm uppercase tracking-wide transition-all disabled:opacity-40"
            style={{ background: "linear-gradient(135deg, #dc2626, #991b1b)", color: "#fff" }}>
            {busy ? "Сохраняю..." : "Назначить долг"}
          </button>
        </div>
      )}

      {/* Список */}
      <div className="px-4 py-3">
        {loading ? (
          <div className="text-center py-4 text-white/30 font-roboto text-sm">Загрузка...</div>
        ) : visibleDebts.length === 0 && !showAll ? (
          <div className="text-center py-4 text-white/25 font-roboto text-xs">
            <Icon name="CheckCircle" size={20} className="mx-auto mb-1 text-green-500/40" />
            Нет активных долгов
          </div>
        ) : (
          <div className="space-y-2">
            {visibleDebts.map(d => (
              <div key={d.id} className="rounded-lg p-3 flex items-start gap-3"
                style={{
                  background: d.is_repaid ? "rgba(255,255,255,0.03)" : "rgba(220,38,38,0.08)",
                  border: `1px solid ${d.is_repaid ? "rgba(255,255,255,0.07)" : "rgba(220,38,38,0.2)"}`,
                }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-oswald font-bold text-sm"
                      style={{ color: d.is_repaid ? "rgba(255,255,255,0.3)" : "#fca5a5" }}>
                      {Number(d.amount).toLocaleString("ru-RU")} ₽
                    </span>
                    {d.is_repaid && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-roboto"
                        style={{ background: "rgba(74,222,128,0.1)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.2)" }}>
                        погашен
                      </span>
                    )}
                  </div>
                  <div className="font-roboto text-xs mt-0.5" style={{ color: d.is_repaid ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.7)" }}>
                    {d.reason}
                  </div>
                  {d.comment && (
                    <div className="mt-1.5 px-2 py-1 rounded-md font-roboto text-[10px] text-white/40"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                      💬 {d.comment}
                    </div>
                  )}
                  <div className="font-roboto text-[9px] text-white/20 mt-1">
                    {d.is_repaid && d.repaid_at
                      ? `Погашен ${new Date(d.repaid_at).toLocaleDateString("ru-RU")}`
                      : `Назначен ${new Date(d.created_at).toLocaleDateString("ru-RU")}`}
                  </div>
                </div>
                {!d.is_repaid && (
                  <button
                    onClick={() => repayDebt(d.id)}
                    disabled={busy}
                    title="Отметить как погашённый"
                    className="shrink-0 px-2.5 py-1.5 rounded-lg font-roboto text-[10px] font-semibold transition-all disabled:opacity-40"
                    style={{ background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.25)", color: "#4ade80" }}>
                    Погашен
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Кнопка "Показать погашённые" */}
        {!loading && repaidDebts.length > 0 && (
          <button
            onClick={() => setShowAll(v => !v)}
            className="mt-3 w-full text-center font-roboto text-[10px] text-white/25 hover:text-white/50 transition-colors">
            {showAll ? "Скрыть погашённые" : `Показать погашённые (${repaidDebts.length})`}
          </button>
        )}
      </div>
    </div>
  );
}
