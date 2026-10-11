import { useState } from "react";
import Icon from "@/components/ui/icon";
import { fmt, slApi } from "../types";
import { SLInput, SLButton, SLCheckbox } from "../slUI";
import { catLabel, type CashDayAccount } from "./types";

type Props = { token: string; acc: CashDayAccount; isToday: boolean; canCorrect: boolean; onSaved: () => void };

export default function CashDayAccountCard({ token, acc, isToday, canCorrect, onSaved }: Props) {
  const [counted, setCounted] = useState("");
  const [safe, setSafe] = useState("");
  const [comment, setComment] = useState("");
  const [fix, setFix] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const has = counted.trim() !== "";
  const diff = has ? Number(counted) - acc.expected_cash : 0;
  const last = acc.last_count;

  const save = async () => {
    if (!has) { setErr("Введите, сколько денег реально в кассе"); return; }
    setBusy(true); setErr(null);
    const r = await slApi(token, "cash_day_count_save", { method: "POST", body: {
      account_id: acc.id, cash_counted: Number(counted), safe_amount: Number(safe) || 0,
      comment, apply_correction: fix,
    }});
    setBusy(false);
    if (!r.ok) { setErr(r.error || "Ошибка"); return; }
    setCounted(""); setSafe(""); setComment(""); setFix(false);
    onSaved();
  };

  return (
    <div className="rounded-xl bg-[#0F0F0F] border border-[#1F1F1F] overflow-hidden">
      <div className="px-3 py-2 bg-gradient-to-r from-[#FFD700]/10 to-transparent border-b border-[#1F1F1F] flex items-center gap-1.5">
        <Icon name="Wallet" size={14} className="text-[#FFD700]" />
        <span className="font-bold text-[13px]">{acc.name}</span>
      </div>

      <div className="p-3 space-y-2.5">
        <div className="rounded-lg bg-black/40 border border-[#FFD700]/25 p-2.5 text-center">
          <div className="text-[10px] uppercase tracking-wider text-white/50 font-bold">По системе в кассе должно быть</div>
          <div className="font-oswald font-bold text-[30px] leading-tight text-[#FFD700]">{fmt(acc.expected_cash)} ₽</div>
        </div>

        <div className="grid grid-cols-3 gap-1.5 text-center">
          <div className="rounded-md bg-white/5 py-1.5"><div className="text-[9px] text-white/45 uppercase">Утром было</div><div className="text-[12px] font-bold">{fmt(acc.opening_cash)}</div></div>
          <div className="rounded-md bg-emerald-500/10 py-1.5"><div className="text-[9px] text-emerald-300/70 uppercase">Пришло</div><div className="text-[12px] font-bold text-emerald-300">+{fmt(acc.day_in)}</div></div>
          <div className="rounded-md bg-red-500/10 py-1.5"><div className="text-[9px] text-red-300/70 uppercase">Ушло</div><div className="text-[12px] font-bold text-red-300">−{fmt(acc.day_out)}</div></div>
        </div>

        {acc.categories.length > 0 && (
          <div className="space-y-0.5">
            {acc.categories.map((c, i) => (
              <div key={i} className="flex justify-between text-[11px]">
                <span className="text-white/55">{catLabel(c.category, c.direction)} <span className="text-white/30">· {c.count}</span></span>
                <span className={c.direction === "in" ? "text-emerald-300" : "text-red-300"}>{c.direction === "in" ? "+" : "−"}{fmt(c.sum)}</span>
              </div>
            ))}
          </div>
        )}

        {isToday ? (
          <div className="rounded-lg border border-white/10 bg-black/30 p-2.5 space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wide text-white/70 flex items-center gap-1"><Icon name="Calculator" size={12} /> Пересчитайте и введите реальные цифры</div>
            <div>
              <label className="text-[10px] text-white/50 block mb-0.5">Наличных в кассе сейчас, ₽ <span className="text-amber-300">(мелочь не считать)</span></label>
              <SLInput type="number" inputMode="numeric" value={counted} onChange={e => setCounted(e.target.value)} className="font-bold text-[15px]" placeholder="0" />
            </div>
            <div>
              <label className="text-[10px] text-white/50 block mb-0.5">Сумма в сейфе, ₽</label>
              <SLInput type="number" inputMode="numeric" value={safe} onChange={e => setSafe(e.target.value)} className="font-bold text-[15px]" placeholder="0" />
            </div>
            <SLInput value={comment} onChange={e => setComment(e.target.value)} placeholder="Комментарий (необязательно)" />

            {has && (
              <div className={`rounded-md border px-2.5 py-2 text-[12px] ${Math.abs(diff) < 1 ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" : diff > 0 ? "bg-amber-500/10 border-amber-500/30 text-amber-300" : "bg-red-500/10 border-red-500/30 text-red-300"}`}>
                {Math.abs(diff) < 1
                  ? "Сходится: в кассе ровно столько, сколько должно быть"
                  : diff > 0 ? `Лишние деньги: на ${fmt(diff)} ₽ больше, чем по системе` : `Недостача: не хватает ${fmt(-diff)} ₽`}
              </div>
            )}
            {has && Math.abs(diff) >= 1 && canCorrect && (
              <SLCheckbox checked={fix} onChange={setFix} label="Привести кассу в системе к фактической сумме" />
            )}
            {err && <div className="text-[12px] text-red-300">{err}</div>}
            <SLButton variant="gold" size="lg" icon={busy ? "Loader2" : "ClipboardCheck"} onClick={save} disabled={busy} className="w-full">
              Сохранить сверку
            </SLButton>
          </div>
        ) : (
          <div className="text-[11px] text-white/40 text-center">Сверку можно вносить только за сегодня</div>
        )}

        {last && (
          <div className="text-[11px] rounded-md bg-white/5 px-2 py-1.5 flex flex-wrap gap-x-3 gap-y-0.5">
            <span className="text-white/50">Последняя сверка {new Date(last.created_at).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })} · {last.employee_name}</span>
            <span>касса <b>{fmt(last.cash_counted)}</b></span>
            <span>сейф <b>{fmt(last.safe_amount)}</b></span>
            <span className={Number(last.diff_cash) === 0 ? "text-emerald-300" : "text-red-300"}>{Number(last.diff_cash) === 0 ? "сошлось" : `разница ${Number(last.diff_cash) > 0 ? "+" : ""}${fmt(last.diff_cash)}`}</span>
          </div>
        )}
      </div>
    </div>
  );
}
