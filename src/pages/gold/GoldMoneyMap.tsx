import { useCallback, useEffect, useMemo, useState } from "react";
import Icon from "@/components/ui/icon";
import { GOLD_URL, GoldMoneySnapshot, GoldReport, money } from "./types";
import { toNum, fmtG } from "./goldCalc";

type Props = { token: string; report: GoldReport | null };

type Draft = {
  cash_register: string; safe_cash: string; bank_account: string; other_money: string;
  debts_owed_to_me: string; investor_money: string; start_capital: string;
  withdrawn: string; expenses: string; gold_market_price_585: string; note: string;
};

const EMPTY: Draft = {
  cash_register: "", safe_cash: "", bank_account: "", other_money: "",
  debts_owed_to_me: "", investor_money: "", start_capital: "",
  withdrawn: "", expenses: "", gold_market_price_585: "6300", note: "",
};

const fromSnap = (s: GoldMoneySnapshot): Draft => {
  const v = (n: number) => (n ? String(n) : "");
  return {
    cash_register: v(s.cash_register), safe_cash: v(s.safe_cash), bank_account: v(s.bank_account),
    other_money: v(s.other_money), debts_owed_to_me: v(s.debts_owed_to_me), investor_money: v(s.investor_money),
    start_capital: v(s.start_capital), withdrawn: v(s.withdrawn), expenses: v(s.expenses),
    gold_market_price_585: v(s.gold_market_price_585) || "6300", note: "",
  };
};

const INP = "w-full bg-[#0D0D0D] border border-[#2A2A2A] text-white pl-2.5 pr-7 py-2.5 rounded-md font-oswald font-bold text-base tabular-nums focus:outline-none focus:border-[#FFD700]/60";

function Field({ label, hint, value, onChange, accent }: { label: string; hint?: string; value: string; onChange: (v: string) => void; accent?: string }) {
  return (
    <div>
      <div className="font-roboto text-[10px] uppercase tracking-wide text-white/45 mb-1 leading-tight">{label}</div>
      <div className="relative">
        <input type="number" inputMode="decimal" value={value} placeholder="0" onChange={e => onChange(e.target.value)}
          className={INP + (accent ? " " + accent : "")} />
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 text-xs">₽</span>
      </div>
      {hint && <div className="font-roboto text-[9px] text-white/25 mt-0.5 leading-tight">{hint}</div>}
    </div>
  );
}

function Row({ label, value, sub, color = "text-white", bold }: { label: string; value: string; sub?: string; color?: string; bold?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5 border-b border-white/5 last:border-0">
      <div className="min-w-0">
        <div className={`font-roboto text-xs ${bold ? "text-white font-bold" : "text-white/60"}`}>{label}</div>
        {sub && <div className="font-roboto text-[10px] text-white/30">{sub}</div>}
      </div>
      <div className={`font-oswald font-bold tabular-nums shrink-0 ${bold ? "text-lg" : "text-sm"} ${color}`}>{value}</div>
    </div>
  );
}

export default function GoldMoneyMap({ token, report }: Props) {
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [history, setHistory] = useState<GoldMoneySnapshot[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [showHist, setShowHist] = useState(false);
  const [open, setOpen] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch(`${GOLD_URL}?action=money`, { headers: { "X-Employee-Token": token } });
    const d = await res.json();
    setHistory(d.history || []);
    if (d.latest) setDraft(fromSnap(d.latest));
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const set = (k: keyof Draft) => (v: string) => setDraft(d => ({ ...d, [k]: v }));

  const calc = useMemo(() => {
    const cash = toNum(draft.cash_register), safe = toNum(draft.safe_cash), bank = toNum(draft.bank_account);
    const other = toNum(draft.other_money), debts = toNum(draft.debts_owed_to_me);
    const inv = toNum(draft.investor_money), start = toNum(draft.start_capital);
    const withdrawn = toNum(draft.withdrawn), expenses = toNum(draft.expenses);
    const price = toNum(draft.gold_market_price_585);
    const stock = report?.stock;
    const goldCost = stock?.buy_sum || 0;
    const goldMarket = Math.round((stock?.weight585 || 0) * price);
    const liquid = cash + safe + bank + other;
    const assets = liquid + debts + goldMarket;
    const net = assets - inv;
    const earned = net + withdrawn - start;
    const dealsProfit = report?.all_time.profit || 0;
    const expected = dealsProfit - expenses;
    const diff = earned - expected;
    return { cash, safe, bank, other, debts, inv, start, withdrawn, expenses, price, goldCost, goldMarket, liquid, assets, net, earned, dealsProfit, expected, diff, goldGrow: goldMarket - goldCost };
  }, [draft, report]);

  const save = async () => {
    setSaving(true); setMsg("");
    const res = await fetch(GOLD_URL, {
      method: "POST", headers: { "Content-Type": "application/json", "X-Employee-Token": token },
      body: JSON.stringify({ action: "money_save", ...draft }),
    });
    const d = await res.json().catch(() => ({}));
    setSaving(false);
    if (d.ok) { setMsg("Срез сохранён"); setDraft(x => ({ ...x, note: "" })); load(); }
    else setMsg(d.error || "Не удалось сохранить");
    setTimeout(() => setMsg(""), 3000);
  };

  const pct = (n: number) => (calc.assets > 0 ? Math.max(0, Math.min(100, (n / calc.assets) * 100)) : 0);
  const parts = [
    { k: "Касса", v: calc.cash, c: "bg-emerald-400" },
    { k: "Сейф", v: calc.safe, c: "bg-green-500" },
    { k: "Счёт", v: calc.bank, c: "bg-sky-400" },
    { k: "Прочее", v: calc.other + calc.debts, c: "bg-violet-400" },
    { k: "Золото", v: calc.goldMarket, c: "bg-[#FFD700]" },
  ];

  return (
    <div className="mb-3 rounded-xl border border-[#FFD700]/30 bg-gradient-to-b from-[#161208] to-[#0E0E0E] overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-3 text-left">
        <div className="flex items-center gap-2">
          <Icon name="Wallet" size={16} className="text-[#FFD700]" />
          <span className="font-oswald font-bold text-[#FFD700] uppercase tracking-wide text-sm">Где мои деньги</span>
        </div>
        <Icon name={open ? "ChevronUp" : "ChevronDown"} size={16} className="text-white/40" />
      </button>

      {open && (
        <div className="px-4 pb-4">
          <div className="text-center rounded-lg bg-black/40 border border-white/5 py-3 mb-3">
            <div className="font-roboto text-[10px] uppercase tracking-widest text-white/40">Всего у меня (минус чужие деньги)</div>
            <div className="font-oswald font-black text-4xl text-[#FFD700] tabular-nums leading-tight">{money(Math.round(calc.net))}</div>
            <div className="font-roboto text-[10px] text-white/35">
              всё имущество {money(Math.round(calc.assets))}{calc.inv > 0 ? ` − чужие ${money(calc.inv)}` : ""}
            </div>
          </div>

          {calc.assets > 0 && (
            <div className="mb-3">
              <div className="flex h-3 rounded-full overflow-hidden bg-white/5">
                {parts.map(p => p.v > 0 && <div key={p.k} className={p.c} style={{ width: pct(p.v) + "%" }} />)}
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
                {parts.map(p => p.v > 0 && (
                  <span key={p.k} className="font-roboto text-[10px] text-white/50 flex items-center gap-1">
                    <span className={`inline-block w-2 h-2 rounded-full ${p.c}`} />{p.k} {Math.round(pct(p.v))}%
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="font-roboto text-[10px] uppercase tracking-wide text-[#FFD700]/70 mb-2 flex items-center gap-1.5">
            <Icon name="PenLine" size={11} />Впишите, сколько сейчас где лежит
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <Field label="Деньги в кассе" value={draft.cash_register} onChange={set("cash_register")} accent="border-emerald-500/30" />
            <Field label="Деньги в сейфе" value={draft.safe_cash} onChange={set("safe_cash")} accent="border-green-500/30" />
            <Field label="На счёте / карте" value={draft.bank_account} onChange={set("bank_account")} accent="border-sky-500/30" />
            <Field label="Прочее (в товаре, у людей)" value={draft.other_money} onChange={set("other_money")} />
            <Field label="Мне должны" value={draft.debts_owed_to_me} onChange={set("debts_owed_to_me")} />
            <Field label="Чужие деньги (инвестор)" hint="вычтется из итога" value={draft.investor_money} onChange={set("investor_money")} accent="border-red-500/30" />
          </div>

          <div className="font-roboto text-[10px] uppercase tracking-wide text-white/40 mb-2">Для расчёта заработка</div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <Field label="Мои вложенные (стартовый капитал)" value={draft.start_capital} onChange={set("start_capital")} />
            <Field label="Забрал себе (всего)" value={draft.withdrawn} onChange={set("withdrawn")} />
            <Field label="Расходы (аренда, зарплата)" value={draft.expenses} onChange={set("expenses")} />
            <Field label="Цена золота 585, ₽/г" hint="для оценки склада" value={draft.gold_market_price_585} onChange={set("gold_market_price_585")} accent="border-blue-500/30 text-blue-300" />
          </div>

          <div className="rounded-lg bg-black/30 border border-white/5 px-3 py-1 mb-3">
            <Row label="Живые деньги" sub="касса + сейф + счёт + прочее" value={money(Math.round(calc.liquid))} color="text-green-400" bold />
            <Row label="Золото на складе по закупке"
              sub={`${report ? fmtG(report.stock.weight585) : 0} г в 585 · ${report?.stock.count ?? 0} шт`}
              value={money(calc.goldCost)} color="text-[#FFD700]" />
            <Row label="Золото на складе по рынку" sub={`× ${fmtG(calc.price)} ₽/г`} value={money(calc.goldMarket)} color="text-[#FFD700]" />
            <Row label="Прирост золота (рынок − закупка)" value={(calc.goldGrow >= 0 ? "+" : "−") + money(Math.abs(calc.goldGrow))} color={calc.goldGrow >= 0 ? "text-green-400" : "text-red-400"} />
            {calc.debts > 0 && <Row label="Мне должны" value={money(calc.debts)} color="text-violet-300" />}
            {calc.inv > 0 && <Row label="Чужие деньги" value={"−" + money(calc.inv)} color="text-red-400" />}
          </div>

          <div className="rounded-lg border border-[#FFD700]/25 bg-[#FFD700]/5 px-3 py-1 mb-3">
            <div className="font-roboto text-[10px] uppercase tracking-wide text-[#FFD700]/70 pt-2">Сколько я заработал</div>
            <Row label="Заработано по факту" sub="всего у меня + забрал − вложил"
              value={(calc.earned >= 0 ? "+" : "−") + money(Math.round(Math.abs(calc.earned)))}
              color={calc.earned >= 0 ? "text-green-400" : "text-red-400"} bold />
            <Row label="Прибыль по сделкам за всё время" sub="сумма прибыли проданных заявок" value={money(calc.dealsProfit)} color="text-blue-300" />
            <Row label="Минус расходы" value={"−" + money(calc.expenses)} color="text-white/60" />
            <Row label="Ожидаемо по учёту" value={money(calc.expected)} color="text-white" />
            <div className={`mt-1 mb-2 rounded px-2.5 py-2 font-roboto text-[11px] leading-snug ${Math.abs(calc.diff) < 1000 ? "bg-green-500/10 text-green-300" : "bg-red-500/10 text-red-300"}`}>
              {calc.start === 0 && calc.withdrawn === 0
                ? "Впишите стартовый капитал и сколько забрали себе — тогда увидите, сходятся ли деньги."
                : Math.abs(calc.diff) < 1000
                  ? "Деньги сходятся с учётом сделок."
                  : calc.diff < 0
                    ? `Не хватает ${money(Math.round(Math.abs(calc.diff)))}: по сделкам должно быть больше. Проверьте расходы, выдачи и ошибки в закупках.`
                    : `Лишних ${money(Math.round(calc.diff))}: денег больше, чем по сделкам. Возможно, не внесены сделки или неверно указан капитал.`}
            </div>
          </div>

          <input value={draft.note} onChange={e => setDraft(d => ({ ...d, note: e.target.value }))} placeholder="Заметка к срезу (необязательно)"
            className="w-full bg-[#0D0D0D] border border-[#2A2A2A] text-white px-3 py-2 rounded-md font-roboto text-xs mb-2 focus:outline-none focus:border-[#FFD700]/50" />
          <div className="flex gap-2">
            <button onClick={save} disabled={saving}
              className="flex-1 bg-gradient-to-b from-[#FFD700] to-yellow-500 text-black font-oswald font-bold py-3 rounded-md text-sm uppercase flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] transition">
              <Icon name={saving ? "Loader" : "Save"} size={15} className={saving ? "animate-spin" : ""} />
              Сохранить срез
            </button>
            <button onClick={() => setShowHist(!showHist)}
              className="px-3 rounded-md border border-white/15 text-white/60 font-roboto text-xs flex items-center gap-1.5">
              <Icon name="History" size={14} />История
            </button>
          </div>
          {msg && <div className="font-roboto text-xs text-green-400 mt-2 text-center">{msg}</div>}

          {showHist && (
            <div className="mt-3 space-y-1">
              {history.length === 0 && <div className="font-roboto text-xs text-white/30 text-center py-2">Срезов пока нет</div>}
              {history.map((h, i) => {
                const total = h.cash_register + h.safe_cash + h.bank_account + h.other_money + h.debts_owed_to_me - h.investor_money;
                const prev = history[i + 1];
                const prevTotal = prev ? prev.cash_register + prev.safe_cash + prev.bank_account + prev.other_money + prev.debts_owed_to_me - prev.investor_money : null;
                const delta = prevTotal !== null ? total - prevTotal : null;
                return (
                  <div key={h.id} className="flex items-center justify-between bg-black/30 border border-white/5 rounded px-2.5 py-1.5">
                    <div>
                      <div className="font-roboto text-[11px] text-white/60">
                        {h.created_at ? new Date(h.created_at).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : ""}
                        {h.author ? ` · ${h.author}` : ""}
                      </div>
                      <div className="font-roboto text-[10px] text-white/30">касса {money(h.cash_register)} · сейф {money(h.safe_cash)}{h.note ? ` · ${h.note}` : ""}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-oswald font-bold text-sm text-white tabular-nums">{money(total)}</div>
                      {delta !== null && delta !== 0 && (
                        <div className={`font-roboto text-[10px] ${delta > 0 ? "text-green-400" : "text-red-400"}`}>{delta > 0 ? "+" : "−"}{money(Math.abs(delta))}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
