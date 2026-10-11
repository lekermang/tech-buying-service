import { useState } from "react";
import Icon from "@/components/ui/icon";
import { fmt, slApi } from "../types";
import { SLField, SLInput, SLButton, SLModal } from "../slUI";
import type { CashDayData, OwnerPeriod } from "./types";

function Row({ l, v, sign, cls }: { l: string; v: number; sign?: boolean; cls?: string }) {
  return (
    <div className="flex justify-between text-[12px] py-1 border-b border-white/5 last:border-0">
      <span className="text-white/55">{l}</span>
      <b className={cls || "text-white"}>{sign && v > 0 ? "+" : ""}{fmt(v)} ₽</b>
    </div>
  );
}

function Period({ title, p }: { title: string; p: OwnerPeriod }) {
  return (
    <div className="rounded-lg bg-black/30 border border-white/10 p-2.5">
      <div className="text-[10px] uppercase tracking-wider text-white/45 font-bold mb-1">{title}</div>
      <Row l={`Прибыль с продаж (${p.sales_count} шт)`} v={p.sales_profit} sign cls="text-emerald-300" />
      <Row l={`Проценты по договорам (${p.contracts_closed} закр.)`} v={p.contract_profit} sign cls="text-emerald-300" />
      <Row l="Расходы магазина" v={-p.expenses} cls="text-red-300" />
      <Row l="Чистый заработок" v={p.net} cls={p.net >= 0 ? "text-[#FFD700]" : "text-red-400"} />
      <Row l="Уже взято владельцем" v={-p.taken} cls="text-white/70" />
    </div>
  );
}

export default function CashDayOwner({ token, data, onChanged }: { token: string; data: CashDayData; onChanged: () => void }) {
  const o = data.owner;
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [accId, setAccId] = useState<number | "">(data.accounts[0]?.id ?? "");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  if (!o) return null;

  const limit = o.day.can_take_now;
  const amt = Number(amount) || 0;
  const over = amt > limit;

  const submit = async () => {
    if (!accId || amt <= 0) { setErr("Выберите кассу и введите сумму"); return; }
    setBusy(true); setErr(null);
    const r = await slApi(token, "cash_movement_create", { method: "POST", body: {
      account_id: accId, direction: "out", amount: amt, category: "Личный расход владельца",
      reason: reason || "Личные нужды владельца", taken_by: "Владелец",
    }});
    setBusy(false);
    if (!r.ok) { setErr(r.error || "Ошибка"); return; }
    setOpen(false); setAmount(""); setReason("");
    onChanged();
  };

  return (
    <div className="rounded-2xl border-2 border-[#FFD700]/40 bg-gradient-to-br from-[#FFD700]/12 via-[#FFD700]/4 to-transparent p-3 space-y-2.5 shadow-[0_0_30px_rgba(255,215,0,0.08)]">
      <div className="flex items-center gap-1.5">
        <Icon name="Crown" size={14} className="text-[#FFD700]" />
        <span className="font-oswald uppercase font-bold text-[12px] tracking-wide text-[#FFD700]">Только для вас: заработок и личные расходы</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-black/40 border border-emerald-500/30 p-2.5">
          <div className="text-[10px] uppercase tracking-wider text-emerald-300/80 font-bold">Заработано сегодня</div>
          <div className={`font-oswald font-bold text-[26px] leading-tight ${o.day.net >= 0 ? "text-emerald-300" : "text-red-400"}`}>
            {o.day.net > 0 ? "+" : ""}{fmt(o.day.net)} ₽
          </div>
          <div className="text-[10px] text-white/45">чистыми, после расходов</div>
        </div>
        <div className="rounded-xl bg-black/40 border border-[#FFD700]/40 p-2.5">
          <div className="text-[10px] uppercase tracking-wider text-[#FFD700]/80 font-bold">Можно взять сегодня</div>
          <div className="font-oswald font-bold text-[26px] leading-tight text-[#FFD700]">{fmt(limit)} ₽</div>
          <div className="text-[10px] text-white/45">не уводит магазин в минус</div>
        </div>
      </div>

      {o.day.net <= 0 && (
        <div className="rounded-md bg-red-500/10 border border-red-500/30 text-red-300 text-[11px] px-2 py-1.5 flex gap-1.5">
          <Icon name="AlertTriangle" size={12} className="mt-0.5 shrink-0" />
          Сегодня магазин пока не заработал. Деньги из кассы забирать не стоит.
        </div>
      )}

      <SLButton variant="gold" icon="HandCoins" size="lg" className="w-full" onClick={() => { setOpen(true); setAmount(limit > 0 ? String(Math.floor(limit)) : ""); }}>
        Взять из кассы на личные нужды
      </SLButton>

      <div className="grid sm:grid-cols-2 gap-2">
        <Period title="Сегодня" p={o.day} />
        <Period title="С начала месяца" p={o.month} />
      </div>
      <div className="text-[10px] text-white/40 leading-snug">
        Заработок = прибыль с продаж (цена продажи минус закупка) + проценты по закрытым договорам − расходы магазина.
        Выдачи по договорам и скупка в расходы не входят, это оборот. Деньги сейчас в кассах: <b className="text-white/70">{fmt(o.cash_total)} ₽</b>.
      </div>

      <SLModal open={open} onClose={() => !busy && setOpen(false)} title="Взять из кассы" icon="HandCoins"
        footer={<SLButton variant={over ? "danger" : "gold"} size="lg" icon={busy ? "Loader2" : "Check"} onClick={submit} disabled={busy} className="w-full">
          {over ? `Всё равно взять ${fmt(amt)} ₽` : `Взять ${fmt(amt)} ₽`}
        </SLButton>}>
        <div className="space-y-2">
          <div className="rounded-lg bg-[#FFD700]/10 border border-[#FFD700]/30 p-2 text-[12px]">
            Безопасная сумма на сегодня: <b className="text-[#FFD700]">{fmt(limit)} ₽</b>
          </div>
          <SLField label="Из какой кассы">
            <div className="space-y-1">
              {data.accounts.map(a => (
                <button key={a.id} type="button" onClick={() => setAccId(a.id)}
                  className={`w-full text-left px-2 py-1.5 rounded-md border ${accId === a.id ? "bg-[#FFD700]/12 border-[#FFD700]" : "bg-[#0A0A0A] border-[#1A1A1A]"}`}>
                  <div className="text-[12px] font-bold">{a.name}</div>
                  <div className="text-[10px] text-white/40">в кассе {fmt(a.expected_cash)} ₽</div>
                </button>
              ))}
            </div>
          </SLField>
          <SLField label="Сумма ₽">
            <SLInput type="number" inputMode="numeric" value={amount} onChange={e => setAmount(e.target.value)} className="font-bold text-[14px]" />
          </SLField>
          {over && (
            <div className="rounded-md bg-red-500/10 border border-red-500/30 text-red-300 text-[11px] px-2 py-1.5">
              Больше безопасной суммы на {fmt(amt - limit)} ₽. Магазин уйдёт в минус по сравнению с заработком дня.
            </div>
          )}
          <SLField label="На что">
            <SLInput value={reason} onChange={e => setReason(e.target.value)} placeholder="Например: личные расходы" />
          </SLField>
          {err && <div className="text-[12px] text-red-300">{err}</div>}
        </div>
      </SLModal>
    </div>
  );
}
