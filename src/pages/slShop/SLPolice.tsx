import { useCallback, useEffect, useMemo, useState } from "react";
import Icon from "@/components/ui/icon";
import { slApi, type SLOperation } from "./types";
import {
  localDateKey, localTimeKey, printPoliceActs, printPoliceChecks, printPoliceAll,
  type DocKind,
} from "./actPrinter";

const todayKey = () => localDateKey(new Date().toISOString());
const shiftDay = (d: string, n: number) => {
  const x = new Date(d + "T12:00:00");
  x.setDate(x.getDate() + n);
  return localDateKey(x.toISOString());
};
const money = (n: unknown) => (Number(n) || 0).toLocaleString("ru-RU");

function OpList({
  title, color, list, picked, onToggle, onAll,
}: {
  title: string; color: string; list: SLOperation[]; picked: Set<number>;
  onToggle: (id: number) => void; onAll: (on: boolean) => void;
}) {
  const allOn = list.length > 0 && list.every(o => picked.has(o.id));
  return (
    <div className="bg-[#0F0F0F] border border-[#1F1F1F] rounded-xl p-3">
      <div className="flex items-center justify-between mb-2">
        <div className={`font-bold text-sm ${color}`}>{title} · {list.length}</div>
        {list.length > 0 && (
          <button className="text-[11px] text-white/60 underline" onClick={() => onAll(!allOn)}>
            {allOn ? "Снять все" : "Выбрать все"}
          </button>
        )}
      </div>
      {list.length === 0 && <div className="text-[12px] text-white/40 py-2">Нет операций за это число</div>}
      <div className="space-y-1 max-h-72 overflow-y-auto">
        {list.map(o => (
          <label key={o.id} className="flex items-start gap-2 p-2 rounded-lg bg-black/30 cursor-pointer">
            <input type="checkbox" className="mt-1 w-4 h-4 accent-[#2fc24b]" checked={picked.has(o.id)} onChange={() => onToggle(o.id)} />
            <div className="flex-1 min-w-0">
              <div className="text-[13px] text-white truncate">{o.item_title || "—"}</div>
              <div className="text-[11px] text-white/50 truncate">
                {localTimeKey(o.created_at)} · {o.client_name || "без клиента"} · {o.item_imei || "без IMEI"}
              </div>
            </div>
            <div className="text-[13px] font-bold text-white whitespace-nowrap">{money(o.amount)} ₽</div>
          </label>
        ))}
      </div>
    </div>
  );
}

export default function SLPolice({ token }: { token: string }) {
  const [date, setDate] = useState(todayKey());
  const [buyAll, setBuyAll] = useState<SLOperation[]>([]);
  const [sellAll, setSellAll] = useState<SLOperation[]>([]);
  const [pickedBuy, setPickedBuy] = useState<Set<number>>(new Set());
  const [pickedSell, setPickedSell] = useState<Set<number>>(new Set());
  const [onlyBoth, setOnlyBoth] = useState(false);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<DocKind | "all" | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const [docDate, setDocDate] = useState("");
  const [docTime, setDocTime] = useState("");
  const [showRowTime, setShowRowTime] = useState(true);

  const load = useCallback(async () => {
    if (!date) return;
    setLoading(true); setMsg(null);
    const params = { date_from: shiftDay(date, -1), date_to: shiftDay(date, 1) };
    const [rb, rs] = await Promise.all([
      slApi<SLOperation[]>(token, "operations", { params: { ...params, op_type: "buy" } }),
      slApi<SLOperation[]>(token, "operations", { params: { ...params, op_type: "sell" } }),
    ]);
    setLoading(false);
    if (!rb.ok || !rs.ok || !rb.data || !rs.data) {
      setMsg(rb.error || rs.error || "Не удалось загрузить операции");
      return;
    }
    const byDay = (l: SLOperation[], t: "buy" | "sell") =>
      l.filter(o => o.op_type === t && localDateKey(o.created_at) === date)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    const b = byDay(rb.data, "buy");
    const s = byDay(rs.data, "sell");
    setBuyAll(b); setSellAll(s);
    setPickedBuy(new Set(b.map(o => o.id)));
    setPickedSell(new Set(s.map(o => o.id)));
  }, [date, token]);

  useEffect(() => { load(); }, [load]);

  const both = useMemo(() => {
    const sellItems = new Set(sellAll.map(o => o.item_id).filter(Boolean));
    const buyItems = new Set(buyAll.map(o => o.item_id).filter(Boolean));
    return { sellItems, buyItems };
  }, [buyAll, sellAll]);

  const buyList = onlyBoth ? buyAll.filter(o => o.item_id && both.sellItems.has(o.item_id)) : buyAll;
  const sellList = onlyBoth ? sellAll.filter(o => o.item_id && both.buyItems.has(o.item_id)) : sellAll;

  const toggle = (set: Set<number>, setter: (s: Set<number>) => void) => (id: number) => {
    const n = new Set(set);
    if (n.has(id)) n.delete(id); else n.add(id);
    setter(n);
  };
  const setAll = (list: SLOperation[], set: Set<number>, setter: (s: Set<number>) => void) => (on: boolean) => {
    const n = new Set(set);
    list.forEach(o => (on ? n.add(o.id) : n.delete(o.id)));
    setter(n);
  };

  const chosenBuy = buyList.filter(o => pickedBuy.has(o.id));
  const chosenSell = sellList.filter(o => pickedSell.has(o.id));

  const printDate = docDate || date;
  const opts = {
    date: printDate,
    timeFrom: "00:00",
    timeTo: "23:59",
    showTime: false,
    rowTime: showRowTime,
    customTime: docTime || undefined,
  };

  const print = (kind: DocKind | "all") => {
    setMsg(null);
    setBusy(kind);
    let opened = true;
    if (kind === "all") opened = printPoliceAll(chosenBuy, chosenSell, opts);
    else if (kind === "act_buy") opened = printPoliceActs(chosenBuy, { ...opts, kind });
    else if (kind === "act_sell") opened = printPoliceActs(chosenSell, { ...opts, kind });
    else opened = printPoliceChecks(chosenSell, { ...opts, kind });
    setBusy(null);
    if (!opened) setMsg("Разрешите всплывающие окна для печати");
  };

  const btn = "text-left rounded-xl p-4 disabled:opacity-40 active:scale-[0.98] transition-transform";

  return (
    <div className="space-y-3">
      <div className="bg-[#0F0F0F] border border-[#1F1F1F] rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Icon name="ShieldCheck" size={18} className="text-[#2fc24b]" />
          <div className="font-bold text-white">Документы для полиции</div>
        </div>

        <label className="block">
          <span className="text-[11px] text-white/50">Операции за число</span>
          <div className="flex gap-2 mt-1">
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg bg-black/40 border border-white/15 text-white" />
            <button onClick={() => setDate(todayKey())} className="px-3 rounded-lg bg-white/10 text-white text-sm">Сегодня</button>
            <button onClick={load} className="px-3 rounded-lg bg-white/10 text-white text-sm" title="Обновить">
              <Icon name={loading ? "Loader" : "RefreshCw"} size={14} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={onlyBoth} onChange={e => setOnlyBoth(e.target.checked)} className="w-4 h-4 accent-[#2fc24b]" />
          <span className="text-sm text-white/80">Только товары, купленные и проданные в этот день</span>
        </label>
      </div>

      <div className="bg-[#0F0F0F] border border-[#1F1F1F] rounded-xl p-4 space-y-3">
        <div className="text-sm font-bold text-white">Что указать в документе</div>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-[11px] text-white/50">Дата в документе</span>
            <input type="date" value={docDate || date} onChange={e => setDocDate(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg bg-black/40 border border-white/15 text-white" />
          </label>
          <label className="block">
            <span className="text-[11px] text-white/50">Время (пусто — как было)</span>
            <input type="time" value={docTime} onChange={e => setDocTime(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg bg-black/40 border border-white/15 text-white" />
          </label>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={showRowTime} onChange={e => setShowRowTime(e.target.checked)} className="w-4 h-4 accent-[#2fc24b]" />
          <span className="text-sm text-white/80">Показывать время у каждой строки</span>
        </label>
        {(docDate && docDate !== date) && (
          <button className="text-[11px] text-white/60 underline" onClick={() => setDocDate("")}>Вернуть дату операций</button>
        )}
      </div>

      {msg && <div className="bg-[#141414] border border-red-500/30 text-red-300 text-sm p-2.5 rounded-lg">{msg}</div>}

      <OpList title="Закупки" color="text-emerald-300" list={buyList} picked={pickedBuy}
        onToggle={toggle(pickedBuy, setPickedBuy)} onAll={setAll(buyList, pickedBuy, setPickedBuy)} />
      <OpList title="Продажи" color="text-blue-300" list={sellList} picked={pickedSell}
        onToggle={toggle(pickedSell, setPickedSell)} onAll={setAll(sellList, pickedSell, setPickedSell)} />

      <button onClick={() => print("all")} disabled={busy !== null || (!chosenBuy.length && !chosenSell.length)}
        className={`${btn} w-full bg-[#21a038] text-white`}>
        <div className="flex items-center gap-2 font-bold">
          <Icon name="Printer" size={16} />
          Печать всего: закупка + продажа + чеки
        </div>
        <div className="text-[11px] opacity-80 mt-1">Закупок {chosenBuy.length}, продаж {chosenSell.length}</div>
      </button>

      <div className="grid gap-2 sm:grid-cols-3">
        <button onClick={() => print("act_buy")} disabled={busy !== null || !chosenBuy.length}
          className={`${btn} bg-emerald-500/15 text-emerald-200`}>
          <div className="flex items-center gap-2 font-bold"><Icon name="FileText" size={16} /> Акт закупки</div>
          <div className="text-[11px] opacity-70 mt-1">Выбрано: {chosenBuy.length}</div>
        </button>
        <button onClick={() => print("act_sell")} disabled={busy !== null || !chosenSell.length}
          className={`${btn} bg-blue-500/15 text-blue-200`}>
          <div className="flex items-center gap-2 font-bold"><Icon name="FileText" size={16} /> Акт продажи</div>
          <div className="text-[11px] opacity-70 mt-1">Выбрано: {chosenSell.length}</div>
        </button>
        <button onClick={() => print("check_sell")} disabled={busy !== null || !chosenSell.length}
          className={`${btn} bg-amber-500/15 text-amber-200`}>
          <div className="flex items-center gap-2 font-bold"><Icon name="Receipt" size={16} /> Чеки продажи</div>
          <div className="text-[11px] opacity-70 mt-1">Выбрано: {chosenSell.length}</div>
        </button>
      </div>
    </div>
  );
}
