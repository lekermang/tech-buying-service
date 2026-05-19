import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { FINANCE_URL, type FinanceParam } from "./types";

type Props = {
  token: string;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
};

const GROUPS: { title: string; keys: string[] }[] = [
  { title: "Баланс", keys: ["total_assets", "non_interest_liab", "equity", "debt"] },
  { title: "Стоимость капитала", keys: ["cost_of_debt", "cost_of_equity", "tax_rate"] },
  { title: "Акционерам", keys: ["shares_outstanding", "dividends_paid"] },
  { title: "Проценты", keys: ["interest_paid", "interest_received"] },
  { title: "Постоянные расходы", keys: ["fixed_costs_monthly"] },
  { title: "Циклы", keys: ["avg_inventory", "avg_receivables", "avg_payables"] },
];

export default function FinanceParamsModal({ token, open, onClose, onSaved }: Props) {
  const [params, setParams] = useState<FinanceParam[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    fetch(`${FINANCE_URL}?action=params`, { headers: { "X-Employee-Token": token } })
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error);
        else setParams(d.params || []);
      })
      .catch(() => setError("Не удалось загрузить параметры"))
      .finally(() => setLoading(false));
  }, [open, token]);

  if (!open) return null;

  const update = (key: string, val: string) => {
    const num = parseFloat(val.replace(",", ".")) || 0;
    setParams(prev => prev.map(p => p.key === key ? { ...p, value: num } : p));
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const values: Record<string, number> = {};
      params.forEach(p => { values[p.key] = p.value; });
      const r = await fetch(`${FINANCE_URL}?action=params`, {
        method: "PUT",
        headers: { "X-Employee-Token": token, "Content-Type": "application/json" },
        body: JSON.stringify({ values }),
      });
      const d = await r.json();
      if (d.error) setError(d.error);
      else { onSaved(); onClose(); }
    } catch {
      setError("Ошибка сохранения");
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-3 bg-black/70 backdrop-blur-sm overflow-y-auto" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="w-full max-w-2xl my-6 bg-gradient-to-br from-[#111] to-[#080808] border border-[#1F1F1F] rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1F1F1F]">
          <Icon name="Settings2" size={16} className="text-[#FFD700]" />
          <div className="text-sm font-bold text-white">Параметры для расчёта показателей</div>
          <button onClick={onClose} className="ml-auto p-1.5 rounded hover:bg-white/10 text-white/55 hover:text-white transition">
            <Icon name="X" size={16} />
          </button>
        </div>

        {loading ? (
          <div className="p-10 text-center text-white/40 text-sm">Загрузка…</div>
        ) : (
          <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
            {error && (
              <div className="px-3 py-2 rounded border border-red-500/30 bg-red-500/10 text-red-300 text-xs">{error}</div>
            )}
            <div className="text-xs text-white/50 leading-relaxed">
              Эти значения нельзя посчитать из транзакций. Заполни, чтобы видеть ROA, ROE, ROIC, WACC, EPS и длительность циклов.
            </div>
            {GROUPS.map(g => (
              <div key={g.title}>
                <div className="text-[10px] uppercase tracking-wider text-[#FFD700] font-bold mb-2">{g.title}</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {g.keys.map(k => {
                    const p = params.find(x => x.key === k);
                    if (!p) return null;
                    return (
                      <label key={k} className="block">
                        <div className="text-[10px] text-white/55 mb-1">{p.description}</div>
                        <input
                          type="number"
                          value={p.value}
                          onChange={(e) => update(k, e.target.value)}
                          step="any"
                          className="w-full bg-[#0A0A0A] border border-[#1F1F1F] hover:border-[#FFD700]/40 focus:border-[#FFD700] focus:outline-none rounded-lg px-3 py-2 text-sm text-white tabular-nums transition"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="px-4 py-3 border-t border-[#1F1F1F] flex gap-2">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg bg-[#0A0A0A] border border-[#1F1F1F] text-white/65 hover:text-white text-sm transition">Отмена</button>
          <button onClick={save} disabled={saving || loading} className="flex-1 px-4 py-2 rounded-lg bg-[#FFD700] hover:bg-[#FFE34D] text-black font-bold text-sm disabled:opacity-40 transition">
            {saving ? "Сохраняю…" : "Сохранить"}
          </button>
        </div>
      </div>
    </div>
  );
}
