import { useState } from "react";
import Icon from "@/components/ui/icon";
import { slApi, type SLOperation } from "./types";
import {
  filterByDayAndTime, localDateKey, printPoliceActs, printPoliceChecks, printPoliceAll,
  type DocKind,
} from "./actPrinter";

const DOCS: { k: DocKind; l: string; hint: string; icon: string; color: string }[] = [
  { k: "act_buy", l: "Акт закупки", hint: "Все скупки за выбранное число", icon: "FileText", color: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200" },
  { k: "act_sell", l: "Акт продажи", hint: "Все продажи за выбранное число", icon: "FileText", color: "border-blue-400/30 bg-blue-500/10 text-blue-200" },
  { k: "check_sell", l: "Чеки продажи", hint: "Товарные чеки за выбранное число", icon: "Receipt", color: "border-amber-400/30 bg-amber-500/10 text-amber-200" },
];

const todayKey = () => localDateKey(new Date().toISOString());

export default function SLPolice({ token }: { token: string }) {
  const [date, setDate] = useState(todayKey());
  const [showTime, setShowTime] = useState(false);
  const [timeFrom, setTimeFrom] = useState("00:00");
  const [timeTo, setTimeTo] = useState("23:59");
  const [busy, setBusy] = useState<DocKind | "all" | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const print = async (kind: DocKind) => {
    if (!date) { setMsg("Выберите дату"); return; }
    if (showTime && timeFrom > timeTo) { setMsg("Время «с» не может быть позже времени «до»"); return; }
    setBusy(kind); setMsg(null);
    const opType = kind === "act_buy" ? "buy" : "sell";
    const prev = new Date(date + "T12:00:00");
    prev.setDate(prev.getDate() - 1);
    const r = await slApi<SLOperation[]>(token, "operations", {
      params: { op_type: opType, date_from: localDateKey(prev.toISOString()), date_to: date },
    });
    setBusy(null);
    if (!r.ok || !r.data) { setMsg(r.error || "Не удалось загрузить операции"); return; }

    const from = showTime ? timeFrom : "00:00";
    const to = showTime ? timeTo : "23:59";
    const list = filterByDayAndTime(r.data, opType, date, from, to);
    const opts = { kind, date, timeFrom: from, timeTo: to, showTime };
    const opened = kind === "check_sell" ? printPoliceChecks(list, opts) : printPoliceActs(list, opts);
    if (!opened) setMsg("Разрешите всплывающие окна для печати");
    else if (list.length === 0) setMsg("За выбранный период операций не найдено — документ откроется пустым");
  };

  const printAll = async () => {
    if (!date) { setMsg("Выберите дату"); return; }
    if (showTime && timeFrom > timeTo) { setMsg("Время «с» не может быть позже времени «до»"); return; }
    setBusy("all"); setMsg(null);
    const prev = new Date(date + "T12:00:00");
    prev.setDate(prev.getDate() - 1);
    const params = { date_from: localDateKey(prev.toISOString()), date_to: date };
    const [rb, rs] = await Promise.all([
      slApi<SLOperation[]>(token, "operations", { params: { ...params, op_type: "buy" } }),
      slApi<SLOperation[]>(token, "operations", { params: { ...params, op_type: "sell" } }),
    ]);
    setBusy(null);
    if (!rb.ok || !rs.ok || !rb.data || !rs.data) { setMsg(rb.error || rs.error || "Не удалось загрузить операции"); return; }
    const from = showTime ? timeFrom : "00:00";
    const to = showTime ? timeTo : "23:59";
    const buy = filterByDayAndTime(rb.data, "buy", date, from, to);
    const sell = filterByDayAndTime(rs.data, "sell", date, from, to);
    const opened = printPoliceAll(buy, sell, { date, timeFrom: from, timeTo: to, showTime });
    if (!opened) setMsg("Разрешите всплывающие окна для печати");
    else if (!buy.length && !sell.length) setMsg("За выбранный период операций не найдено — документы откроются пустыми");
  };

  return (
    <div className="space-y-4">
      <div className="bg-[#0F0F0F] border border-[#1F1F1F] rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Icon name="ShieldCheck" size={18} className="text-[#FFD700]" />
          <div className="font-bold text-white">Документы для полиции</div>
        </div>

        <label className="block mb-3">
          <span className="text-[11px] text-white/50 uppercase">Дата</span>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="w-full mt-1 px-3 py-2 rounded-lg bg-black/40 border border-white/15 text-white" />
        </label>

        <label className="flex items-center gap-2 cursor-pointer mb-2">
          <input type="checkbox" checked={showTime} onChange={e => setShowTime(e.target.checked)} className="w-4 h-4 accent-[#FFD700]" />
          <span className="text-sm text-white/80">Указывать время и отобрать по времени</span>
        </label>

        {showTime && (
          <div className="grid grid-cols-2 gap-3 mb-3">
            <label className="block">
              <span className="text-[11px] text-white/50 uppercase">Время с</span>
              <input type="time" value={timeFrom} onChange={e => setTimeFrom(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg bg-black/40 border border-white/15 text-white" />
            </label>
            <label className="block">
              <span className="text-[11px] text-white/50 uppercase">Время до</span>
              <input type="time" value={timeTo} onChange={e => setTimeTo(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg bg-black/40 border border-white/15 text-white" />
            </label>
          </div>
        )}
      </div>

      {msg && <div className="bg-[#141414] border border-[#1F1F1F] text-white/70 text-sm p-2.5 rounded-lg">{msg}</div>}

      <button onClick={printAll} disabled={busy !== null}
        className="w-full text-left rounded-xl border p-4 disabled:opacity-50 border-[#FFD700]/50 bg-[#FFD700]/10 text-[#FFD700]">
        <div className="flex items-center gap-2 font-bold">
          <Icon name={busy === "all" ? "Loader" : "Printer"} size={16} className={busy === "all" ? "animate-spin" : ""} />
          Всё за число: закупка + продажа + чеки
        </div>
        <div className="text-[11px] opacity-70 mt-1">Один документ: акт закупки, акт продажи и чеки продажи за выбранное число</div>
      </button>

      <div className="grid gap-2 sm:grid-cols-3">
        {DOCS.map(d => (
          <button key={d.k} onClick={() => print(d.k)} disabled={busy !== null}
            className={`text-left rounded-xl border p-4 disabled:opacity-50 ${d.color}`}>
            <div className="flex items-center gap-2 font-bold">
              <Icon name={busy === d.k ? "Loader" : d.icon} size={16} className={busy === d.k ? "animate-spin" : ""} />
              {d.l}
            </div>
            <div className="text-[11px] opacity-70 mt-1">{d.hint}</div>
            <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold">
              <Icon name="Printer" size={12} /> Печать
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
