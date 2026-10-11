import { useState } from "react";
import Icon from "@/components/ui/icon";
import { fmt, slApi } from "../types";
import { SLInput, SLButton, SLSection } from "../slUI";
import { METHOD_LABEL, type CashDayData } from "./types";

export default function CashDayCashless({ token, data, onSaved }: { token: string; data: CashDayData; onSaved: () => void }) {
  const [counted, setCounted] = useState("");
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const cl = data.cashless;
  const last = data.last_cashless_count;
  const has = counted.trim() !== "";
  const diff = has ? Number(counted) - cl.total_in : 0;

  const save = async () => {
    if (!has) { setErr("Введите сумму безнала за день по терминалу/банку"); return; }
    setBusy(true); setErr(null);
    const r = await slApi(token, "cash_day_count_save", { method: "POST", body: { cashless_counted: Number(counted), comment } });
    setBusy(false);
    if (!r.ok) { setErr(r.error || "Ошибка"); return; }
    setCounted(""); setComment(""); onSaved();
  };

  return (
    <SLSection icon="CreditCard" title="Безнал: карта и переводы"
      right={<span className="text-[11px] text-white/50">за день</span>}>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-2 text-center">
          <div className="text-[9px] uppercase text-emerald-300/70 font-bold">Получено безналом</div>
          <div className="font-oswald font-bold text-[20px] text-emerald-300">{fmt(cl.total_in)} ₽</div>
        </div>
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-2 text-center">
          <div className="text-[9px] uppercase text-red-300/70 font-bold">Выдано переводом</div>
          <div className="font-oswald font-bold text-[20px] text-red-300">{fmt(cl.total_out)} ₽</div>
        </div>
      </div>

      {cl.in.length === 0 && cl.out.length === 0 && <div className="text-[12px] text-white/40 text-center py-1">Безналичных операций за этот день нет</div>}
      <div className="space-y-0.5 mb-2">
        {cl.in.map((r, i) => (
          <div key={`i${i}`} className="flex justify-between text-[11px]"><span className="text-white/60">{r.label} · {METHOD_LABEL[r.method] || r.method} <span className="text-white/30">× {r.count}</span></span><b className="text-emerald-300">+{fmt(r.sum)}</b></div>
        ))}
        {cl.out.map((r, i) => (
          <div key={`o${i}`} className="flex justify-between text-[11px]"><span className="text-white/60">{r.label} · {METHOD_LABEL[r.method] || r.method} <span className="text-white/30">× {r.count}</span></span><b className="text-red-300">−{fmt(r.sum)}</b></div>
        ))}
      </div>

      {data.is_today && (
        <div className="rounded-lg border border-white/10 bg-black/30 p-2.5 space-y-2">
          <label className="text-[10px] text-white/50 block">Сколько безнала реально поступило за день (по терминалу / банку), ₽</label>
          <SLInput type="number" inputMode="numeric" value={counted} onChange={e => setCounted(e.target.value)} className="font-bold text-[15px]" placeholder="0" />
          <SLInput value={comment} onChange={e => setComment(e.target.value)} placeholder="Комментарий (необязательно)" />
          {has && (
            <div className={`rounded-md border px-2.5 py-1.5 text-[12px] ${Math.abs(diff) < 1 ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" : "bg-amber-500/10 border-amber-500/30 text-amber-300"}`}>
              {Math.abs(diff) < 1 ? "Сходится с записями в системе" : `Разница с записями в системе: ${diff > 0 ? "+" : ""}${fmt(diff)} ₽`}
            </div>
          )}
          {err && <div className="text-[12px] text-red-300">{err}</div>}
          <SLButton variant="gold" size="md" icon={busy ? "Loader2" : "ClipboardCheck"} onClick={save} disabled={busy} className="w-full">Сохранить безнал</SLButton>
        </div>
      )}
      {last && (
        <div className="text-[11px] text-white/50 mt-1.5 flex items-center gap-1">
          <Icon name="Check" size={11} className="text-emerald-300" />
          Последняя сверка безнала: {fmt(last.cashless_counted)} ₽ · {last.employee_name}, {new Date(last.created_at).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
        </div>
      )}
    </SLSection>
  );
}
