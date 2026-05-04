import { useEffect, useState, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { slApi, fmt, type SLCashSummary, type SLCashMovement } from "./types";
import { SLSection, SLField, SLInput, SLTextarea, SLButton, SLPill, SLModal } from "./slUI";

const CATEGORIES_OUT = [
  "Зарплата", "Аренда", "Хозтовары", "Коммуналка", "Налоги", "Реклама",
  "Закупка комплектующих", "Личный расход владельца", "Возврат клиенту", "Прочее",
];
const CATEGORIES_IN = ["Внесение", "Возврат сдачи", "Перевод на счёт", "Прочее"];

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
    <div className="space-y-2">
      {msg && <div className="rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-2.5 py-1.5 text-[12px]">{msg}</div>}

      {/* Касса с премиум-градиентом */}
      <div className="rounded-xl bg-gradient-to-br from-[#FFD700]/12 via-[#FFD700]/4 to-transparent border border-[#FFD700]/30 p-2.5 shadow-[0_0_24px_rgba(255,215,0,0.06)]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Icon name="Wallet" size={13} className="text-[#FFD700]" />
            <div className="font-oswald uppercase font-bold text-[12px] tracking-wide text-[#FFD700]">Касса наличных</div>
          </div>
          <div className="text-right">
            <div className="text-[9px] uppercase tracking-wider text-white/45 font-bold">Всего</div>
            <div className="font-oswald text-[20px] font-bold text-[#FFD700] leading-tight">{fmt(totalBalance)} ₽</div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {accounts.map(a => {
            const active = activeAccount === a.id;
            return (
              <button key={a.id} onClick={() => setActiveAccount(active ? "" : a.id)}
                className={`text-left px-2.5 py-1.5 rounded-md border transition-all active:scale-[0.98] ${
                  active ? "bg-[#FFD700]/15 border-[#FFD700] shadow-[0_2px_10px_rgba(255,215,0,0.2)]" : "bg-[#0A0A0A] border-[#1A1A1A] hover:border-[#2A2A2A]"
                }`}>
                <div className="flex items-center gap-1 mb-0.5">
                  <Icon name="Wallet" size={11} className="text-[#FFD700]" />
                  <div className="font-bold text-[12px]">{a.name}</div>
                </div>
                <div className="font-oswald text-[16px] font-bold leading-tight">{fmt(a.balance)} ₽</div>
                <div className="text-[10px] text-white/45 flex gap-2 mt-0.5">
                  <span className="text-emerald-300">+{fmt(a.today_in)}</span>
                  <span className="text-red-300">−{fmt(a.today_out)}</span>
                  <span className="text-white/35">сегодня</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Кнопки */}
      <div className="grid grid-cols-2 gap-1.5">
        <SLButton variant="success" size="md" icon="ArrowDownToLine" onClick={() => { setDirection("in"); setCreating(true); }}>
          Приход в кассу
        </SLButton>
        <SLButton variant="danger" size="md" icon="ArrowUpFromLine" onClick={() => { setDirection("out"); setCreating(true); }}>
          Расход / выдача
        </SLButton>
      </div>

      {/* История */}
      <SLSection
        icon="History"
        title="История движений"
        right={activeAccount && (
          <button onClick={() => setActiveAccount("")} className="text-[10px] text-[#FFD700] uppercase tracking-wide font-semibold">все кассы</button>
        )}
      >
        {loading && <div className="text-white/30 text-[12px] py-2 text-center"><Icon name="Loader2" size={14} className="animate-spin inline" /></div>}
        {!loading && movements.length === 0 && (
          <div className="text-white/30 text-[12px] py-4 text-center">
            <Icon name="History" size={22} className="mx-auto mb-1 opacity-40" />
            Пока нет движений
          </div>
        )}
        <div className="space-y-1">
          {movements.map(m => {
            const isIn = m.direction === "in";
            return (
              <div key={m.id} className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-md px-2 py-1.5 flex items-start gap-1.5">
                <div className={`w-6 h-6 rounded-md bg-black/50 flex items-center justify-center shrink-0 ${isIn ? "text-emerald-300" : "text-red-300"}`}>
                  <Icon name={isIn ? "ArrowDownToLine" : "ArrowUpFromLine"} size={11} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[12px] font-bold leading-tight">{m.category || (isIn ? "Поступление" : "Расход")}</span>
                    {m.is_auto && <SLPill color="blue">auto</SLPill>}
                    {m.account_name && <span className="text-[9px] text-white/40">{m.account_name}</span>}
                  </div>
                  {m.reason && <div className="text-[10px] text-white/55 leading-tight mt-0.5">{m.reason}</div>}
                  <div className="text-[9px] text-white/35 mt-0.5">
                    {new Date(m.created_at).toLocaleString("ru-RU")}
                    {m.taken_by && <> · взял: {m.taken_by}</>}
                    {m.employee_name && <> · {m.employee_name}</>}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className={`font-bold text-[13px] leading-tight ${isIn ? "text-emerald-300" : "text-red-300"}`}>
                    {isIn ? "+" : "−"}{fmt(m.amount)} ₽
                  </div>
                  {m.balance_after !== null && m.balance_after !== undefined && (
                    <div className="text-[9px] text-white/30">ост. {fmt(m.balance_after)}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </SLSection>

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
  const isOut = direction === "out";

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

  return (
    <SLModal
      open={true}
      onClose={onClose}
      title={isOut ? "Расход / выдача" : "Приход в кассу"}
      icon={isOut ? "ArrowUpFromLine" : "ArrowDownToLine"}
      footer={
        <SLButton variant={isOut ? "danger" : "success"} size="md" icon={saving ? "Loader2" : "Check"} onClick={submit} disabled={saving} className="w-full">
          {saving ? "Сохраняю…" : (isOut ? "Выдать из кассы" : "Внести в кассу")}
        </SLButton>
      }
    >
      <div className="space-y-2">
        <SLField label="Касса">
          <div className="space-y-1">
            {accounts.map(a => (
              <button key={a.id} onClick={() => setAccountId(a.id)}
                className={`w-full text-left px-2 py-1.5 rounded-md border transition-all active:scale-[0.98] ${
                  accountId === a.id ? "bg-[#FFD700]/12 border-[#FFD700]" : "bg-[#0A0A0A] border-[#1A1A1A] hover:border-[#2A2A2A]"
                }`}>
                <div className="text-[12px] font-bold">{a.name}</div>
                <div className="text-[10px] text-white/40">остаток {fmt(a.balance)} ₽</div>
              </button>
            ))}
          </div>
        </SLField>

        <SLField label="Сумма ₽" required>
          <SLInput type="number" inputMode="numeric" value={amount} onChange={e => setAmount(e.target.value)} autoFocus className="font-bold text-[14px]" />
        </SLField>

        <SLField label="Категория">
          <div className="flex gap-1 flex-wrap">
            {cats.map(c => (
              <button key={c} type="button" onClick={() => setCategory(c)}
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border transition ${category === c ? "bg-[#FFD700] text-black border-[#FFD700]" : "bg-[#0A0A0A] text-white/55 border-[#1A1A1A] hover:border-[#FFD700]/40"}`}>
                {c}
              </button>
            ))}
          </div>
        </SLField>

        {isOut && (
          <SLField label="Кто взял (ФИО)">
            <SLInput value={takenBy} onChange={e => setTakenBy(e.target.value)} placeholder="Иванов И." />
          </SLField>
        )}

        <SLField label="На что / комментарий">
          <SLTextarea rows={2} value={reason} onChange={e => setReason(e.target.value)} placeholder="Например: купить кабели для ремонта" />
        </SLField>

        {err && <div className="rounded-md bg-red-500/10 border border-red-500/30 text-red-300 px-2 py-1.5 text-[12px] flex items-center gap-1.5"><Icon name="AlertTriangle" size={11} />{err}</div>}
      </div>
    </SLModal>
  );
}
