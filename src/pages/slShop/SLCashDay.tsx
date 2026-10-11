import { useCallback, useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { slApi, fmt } from "./types";
import { SLSection, SLInput, SLPill } from "./slUI";
import CashDayOwner from "./cashDay/CashDayOwner";
import CashDayAccountCard from "./cashDay/CashDayAccountCard";
import CashDayCashless from "./cashDay/CashDayCashless";
import { catLabel, type CashDayData } from "./cashDay/types";

const todayISO = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

export default function SLCashDay({ token }: { token: string }) {
  const [date, setDate] = useState(todayISO());
  const [data, setData] = useState<CashDayData | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [accFilter, setAccFilter] = useState<number | "">("");

  const load = useCallback(async () => {
    setLoading(true); setErr(null);
    const r = await slApi<CashDayData>(token, "cash_day", { params: { date } });
    setLoading(false);
    if (r.ok && r.data) setData(r.data);
    else setErr(r.error || "Не удалось загрузить кассу");
  }, [token, date]);

  useEffect(() => { load(); }, [load]);

  if (!data) {
    return (
      <div className="py-10 text-center text-white/50 text-sm">
        {err ? <div className="text-red-300">{err}</div> : <Icon name="Loader2" size={20} className="animate-spin inline" />}
      </div>
    );
  }

  const moves = data.movements.filter(m => !accFilter || m.account_id === accFilter);

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <Icon name="ClipboardCheck" size={16} className="text-[#FFD700]" />
          <h3 className="font-oswald uppercase font-bold text-[15px] tracking-wide text-[#FFD700]">Касса и сверка</h3>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          {!data.is_today && <button onClick={() => setDate(todayISO())} className="text-[10px] text-[#FFD700] underline">сегодня</button>}
          <SLInput type="date" value={date} max={todayISO()} onChange={e => e.target.value && setDate(e.target.value)} className="!py-1 text-[12px]" />
          {loading && <Icon name="Loader2" size={13} className="animate-spin text-white/40" />}
        </div>
      </div>

      {!data.is_today && (
        <div className="rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] px-2 py-1.5">
          Вы смотрите прошедший день. Сверку можно вносить только за сегодня.
        </div>
      )}

      <CashDayOwner token={token} data={data} onChanged={load} />

      <div className="rounded-xl bg-[#0F0F0F] border border-[#1F1F1F] px-3 py-2 text-[11px] text-white/55 leading-snug">
        Как это работает: все продажи за наличные автоматически попадают в кассу, а скупка и выдача денег по договорам списываются из кассы.
        Пересчитайте деньги, введите реальные цифры и сохраните сверку. Если не сходится, система сразу покажет разницу.
      </div>

      <div className="grid md:grid-cols-2 gap-2.5">
        {data.accounts.map(a => (
          <CashDayAccountCard key={a.id} token={token} acc={a} isToday={data.is_today} canCorrect={data.can_correct} onSaved={load} />
        ))}
      </div>

      <CashDayCashless token={token} data={data} onSaved={load} />

      <SLSection icon="ListChecks" title="Все операции за день"
        right={
          <select value={accFilter} onChange={e => setAccFilter(e.target.value ? Number(e.target.value) : "")}
            className="bg-[#141414] border border-[#1F1F1F] rounded px-1.5 py-0.5 text-[11px]">
            <option value="">Все кассы</option>
            {data.accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        }>
        {moves.length === 0 && <div className="text-center text-white/35 text-[12px] py-3">Операций нет</div>}
        <div className="space-y-1">
          {moves.map(m => {
            const isIn = m.direction === "in";
            return (
              <div key={m.id} className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-md px-2 py-1.5 flex items-start gap-1.5">
                <div className={`w-6 h-6 rounded-md bg-black/50 flex items-center justify-center shrink-0 ${isIn ? "text-emerald-300" : "text-red-300"}`}>
                  <Icon name={isIn ? "ArrowDownToLine" : "ArrowUpFromLine"} size={11} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[12px] font-bold">{catLabel(m.category, m.direction)}</span>
                    {m.account_name && <span className="text-[9px] text-white/40">{m.account_name}</span>}
                    {m.is_auto && <SLPill color="blue">авто</SLPill>}
                  </div>
                  {m.reason && <div className="text-[10px] text-white/55 leading-tight">{m.reason}</div>}
                  <div className="text-[9px] text-white/35">
                    {new Date(m.created_at).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                    {m.employee_name && <> · {m.employee_name}</>}
                    {m.taken_by && <> · взял: {m.taken_by}</>}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className={`font-bold text-[13px] ${isIn ? "text-emerald-300" : "text-red-300"}`}>{isIn ? "+" : "−"}{fmt(m.amount)} ₽</div>
                  {m.balance_after != null && <div className="text-[9px] text-white/30">ост. {fmt(m.balance_after)}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </SLSection>

      <SLSection icon="History" title="История сверок">
        {data.counts_history.length === 0 && <div className="text-center text-white/35 text-[12px] py-3">Сверок пока не было</div>}
        <div className="space-y-1">
          {data.counts_history.map(h => {
            const isCl = h.account_id === null;
            const diff = Number(isCl ? h.diff_cashless : h.diff_cash) || 0;
            return (
              <div key={h.id} className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-md px-2 py-1.5 text-[11px]">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold">{h.account_name} · {new Date(h.created_at).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                  <span className={Math.abs(diff) < 1 ? "text-emerald-300 font-bold" : "text-red-300 font-bold"}>
                    {Math.abs(diff) < 1 ? "сошлось" : `${diff > 0 ? "излишек" : "недостача"} ${fmt(Math.abs(diff))} ₽`}
                  </span>
                </div>
                <div className="text-white/50">
                  {isCl
                    ? <>безнал по факту {fmt(h.cashless_counted)} ₽, в системе {fmt(h.expected_cashless)} ₽</>
                    : <>касса по факту {fmt(h.cash_counted)} ₽, в системе {fmt(h.expected_cash)} ₽, сейф {fmt(h.safe_amount)} ₽{h.corrected && " · касса исправлена"}</>}
                  {h.employee_name && <> · {h.employee_name}</>}
                </div>
                {h.comment && <div className="text-white/40 italic">«{h.comment}»</div>}
              </div>
            );
          })}
        </div>
      </SLSection>
    </div>
  );
}
