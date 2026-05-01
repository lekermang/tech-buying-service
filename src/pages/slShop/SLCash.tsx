import { useEffect, useState, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { slApi, fmt, type SLCashSummary, type SLCashMovement } from "./types";

const CATEGORIES_OUT = [
  "Зарплата", "Аренда", "Хозтовары", "Коммуналка", "Налоги", "Реклама",
  "Закупка комплектующих", "Личный расход владельца", "Возврат клиенту", "Прочее",
];
const CATEGORIES_IN = [
  "Внесение", "Возврат сдачи", "Перевод на счёт", "Прочее",
];

export default function SLCash({ token, isOwner: _isOwner }: { token: string; isOwner: boolean }) {
  const [accounts, setAccounts] = useState<SLCashSummary[]>([]);
  const [movements, setMovements] = useState<SLCashMovement[]>([]);
  const [activeAccount, setActiveAccount] = useState<number | "">("");
  const [creating, setCreating] = useState(false);
  const [direction, setDirection] = useState<"in" | "out">("out");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [r1, r2] = await Promise.all([
      slApi<SLCashSummary[]>(token, "cash_summary"),
      slApi<SLCashMovement[]>(token, "cash_movements", { params: { account_id: activeAccount || undefined } }),
    ]);
    if (r1.ok && r1.data) setAccounts(r1.data);
    if (r2.ok && r2.data) setMovements(r2.data);
    setLoading(false);
  }, [token, activeAccount]);

  useEffect(() => { load(); }, [load]);

  const totalBalance = accounts.reduce((s, a) => s + Number(a.balance || 0), 0);

  return (
    <div className="space-y-3">
      {msg && <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-2.5 rounded-lg text-sm">{msg}</div>}

      {/* Касса по филиалам */}
      <div className="bg-gradient-to-br from-[#FFD700]/10 to-transparent border border-[#FFD700]/30 rounded-xl p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[11px] uppercase font-bold tracking-wide text-[#FFD700]">Касса наличных</div>
          <div className="text-right">
            <div className="text-[10px] text-white/40">Всего</div>
            <div className="text-2xl font-bold text-[#FFD700]">{fmt(totalBalance)} ₽</div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {accounts.map(a => {
            const active = activeAccount === a.id;
            return (
              <button key={a.id} onClick={() => setActiveAccount(active ? "" : a.id)}
                className={`text-left p-2.5 rounded-lg border transition-all ${
                  active ? "bg-[#FFD700]/10 border-[#FFD700]" : "bg-[#0A0A0A] border-[#1F1F1F]"
                }`}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon name="Wallet" size={13} className="text-[#FFD700]" />
                  <div className="font-bold text-sm">{a.name}</div>
                </div>
                <div className="text-xl font-bold">{fmt(a.balance)} ₽</div>
                <div className="text-[10px] text-white/40 flex gap-3 mt-1">
                  <span className="text-emerald-300">+{fmt(a.today_in)}</span>
                  <span className="text-red-300">−{fmt(a.today_out)}</span>
                  <span className="text-white/40">за сегодня</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Кнопки приход/расход */}
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => { setDirection("in"); setCreating(true); }}
          className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 py-2.5 rounded-lg font-bold flex items-center justify-center gap-2">
          <Icon name="ArrowDownToLine" size={14} />Приход в кассу
        </button>
        <button onClick={() => { setDirection("out"); setCreating(true); }}
          className="bg-red-500/15 border border-red-500/30 text-red-300 py-2.5 rounded-lg font-bold flex items-center justify-center gap-2">
          <Icon name="ArrowUpFromLine" size={14} />Расход / выдача
        </button>
      </div>

      {/* Список движений */}
      <div className="bg-[#0F0F0F] border border-[#1F1F1F] rounded-xl p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[11px] uppercase font-bold tracking-wide text-white/50">История движений</div>
          {activeAccount && (
            <button onClick={() => setActiveAccount("")} className="text-[10px] text-[#FFD700]">все кассы</button>
          )}
        </div>
        {loading && <div className="text-white/30 text-sm py-3 text-center">Загрузка...</div>}
        {!loading && movements.length === 0 && (
          <div className="text-white/30 text-sm py-6 text-center">
            <Icon name="History" size={28} className="mx-auto mb-2 opacity-30" />
            Пока нет движений. Нажми «Приход» или «Расход».
          </div>
        )}
        <div className="space-y-1.5">
          {movements.map(m => {
            const isIn = m.direction === "in";
            return (
              <div key={m.id} className="bg-[#141414] border border-[#1F1F1F] rounded-lg p-2.5 flex items-start gap-2">
                <div className={`w-7 h-7 rounded-full bg-[#0A0A0A] flex items-center justify-center shrink-0 ${isIn ? "text-emerald-300" : "text-red-300"}`}>
                  <Icon name={isIn ? "ArrowDownToLine" : "ArrowUpFromLine"} size={13} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold">{m.category || (isIn ? "Поступление" : "Расход")}</span>
                    {m.is_auto && <span className="text-[9px] bg-blue-500/15 text-blue-300 border border-blue-500/30 px-1.5 py-0.5 rounded">auto</span>}
                    {m.account_name && <span className="text-[10px] text-white/40">{m.account_name}</span>}
                  </div>
                  {m.reason && <div className="text-[11px] text-white/60 mt-0.5">{m.reason}</div>}
                  <div className="text-[10px] text-white/40 mt-0.5">
                    {new Date(m.created_at).toLocaleString("ru-RU")}
                    {m.taken_by && <> · взял: {m.taken_by}</>}
                    {m.employee_name && <> · {m.employee_name}</>}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className={`font-bold text-sm ${isIn ? "text-emerald-300" : "text-red-300"}`}>
                    {isIn ? "+" : "−"}{fmt(m.amount)} ₽
                  </div>
                  {m.balance_after !== null && m.balance_after !== undefined && (
                    <div className="text-[10px] text-white/30">остаток {fmt(m.balance_after)}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {creating && (
        <CashMovementForm
          token={token}
          accounts={accounts}
          direction={direction}
          defaultAccountId={typeof activeAccount === "number" ? activeAccount : (accounts[0]?.id ?? null)}
          onClose={() => setCreating(false)}
          onSaved={() => { setCreating(false); setMsg("Записано в кассу"); load(); }}
        />
      )}
    </div>
  );
}

function CashMovementForm({
  token, accounts, direction, defaultAccountId, onClose, onSaved,
}: {
  token: string;
  accounts: SLCashSummary[];
  direction: "in" | "out";
  defaultAccountId: number | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [accountId, setAccountId] = useState<number | "">(defaultAccountId || "");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(direction === "out" ? "Прочее" : "Внесение");
  const [reason, setReason] = useState("");
  const [takenBy, setTakenBy] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const cats = direction === "out" ? CATEGORIES_OUT : CATEGORIES_IN;

  const submit = async () => {
    if (!accountId || !amount || Number(amount) <= 0) {
      setErr("Выберите кассу и введите сумму");
      return;
    }
    setSaving(true); setErr(null);
    const r = await slApi(token, "cash_movement_create", { method: "POST", body: {
      account_id: accountId, direction, amount: Number(amount), category, reason, taken_by: takenBy,
    }});
    setSaving(false);
    if (r.ok) onSaved();
    else setErr(r.error || "Ошибка");
  };

  const isOut = direction === "out";

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center p-2" onClick={onClose}>
      <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-[#0A0A0A] border-b border-[#1F1F1F] p-3 flex items-center justify-between">
          <div className="font-bold flex items-center gap-1.5">
            <Icon name={isOut ? "ArrowUpFromLine" : "ArrowDownToLine"} size={14} className={isOut ? "text-red-300" : "text-emerald-300"} />
            {isOut ? "Расход / выдача из кассы" : "Приход в кассу"}
          </div>
          <button onClick={onClose}><Icon name="X" size={16} /></button>
        </div>
        <div className="p-3 space-y-3">
          <div>
            <div className="text-[11px] text-white/50 mb-1">Касса</div>
            <div className="grid grid-cols-1 gap-1.5">
              {accounts.map(a => (
                <button key={a.id} onClick={() => setAccountId(a.id)}
                  className={`text-left p-2 rounded-lg border transition-all ${
                    accountId === a.id ? "bg-[#FFD700]/10 border-[#FFD700]" : "bg-[#141414] border-[#1F1F1F]"
                  }`}>
                  <div className="text-sm font-bold">{a.name}</div>
                  <div className="text-[10px] text-white/40">остаток {fmt(a.balance)} ₽</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[11px] text-white/50 mb-1">Сумма ₽</div>
            <input type="number" inputMode="numeric" value={amount} onChange={e => setAmount(e.target.value)}
              autoFocus
              className="w-full bg-[#141414] border border-[#1F1F1F] rounded-lg px-3 py-2 text-lg font-bold focus:border-[#FFD700]/50 outline-none" />
          </div>

          <div>
            <div className="text-[11px] text-white/50 mb-1">Категория</div>
            <div className="flex gap-1 flex-wrap">
              {cats.map(c => (
                <button key={c} onClick={() => setCategory(c)}
                  className={`text-[11px] px-2.5 py-1 rounded-full ${
                    category === c ? "bg-[#FFD700] text-black font-bold" : "bg-[#141414] border border-[#1F1F1F] text-white/60"
                  }`}>{c}</button>
              ))}
            </div>
          </div>

          {isOut && (
            <div>
              <div className="text-[11px] text-white/50 mb-1">Кто взял (ФИО)</div>
              <input value={takenBy} onChange={e => setTakenBy(e.target.value)}
                placeholder="Например: Иванов И."
                className="w-full bg-[#141414] border border-[#1F1F1F] rounded px-3 py-2 text-sm" />
            </div>
          )}

          <div>
            <div className="text-[11px] text-white/50 mb-1">На что / комментарий</div>
            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2}
              placeholder="Например: купить кабели для ремонта"
              className="w-full bg-[#141414] border border-[#1F1F1F] rounded px-3 py-2 text-sm resize-none" />
          </div>

          {err && <div className="text-red-400 text-sm">{err}</div>}

          <button onClick={submit} disabled={saving}
            className={`w-full py-3 rounded-lg font-bold disabled:opacity-50 ${
              isOut ? "bg-red-500 text-white" : "bg-emerald-500 text-black"
            }`}>
            {saving ? "..." : (isOut ? "Выдать из кассы" : "Внести в кассу")}
          </button>
        </div>
      </div>
    </div>
  );
}
