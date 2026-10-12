import { useEffect, useMemo, useState } from "react";
import Icon from "@/components/ui/icon";
import { PURITY_OPTIONS } from "./types";
import { toNum, to585, fmtG, fmtRub, printTags } from "./goldCalc";

type Row = { weight: string; purity: string };

type Props = {
  onClose: () => void;
  initial?: { weight: number | null; purity: string | null; price585?: number | null };
};

const LS_PRICE = "gold_tag_price585";
const LS_PURITY = "gold_tag_purity";

export default function GoldPriceTagModal({ onClose, initial }: Props) {
  const [price585, setPrice585] = useState(() =>
    initial?.price585 ? String(Math.round(initial.price585)) : (localStorage.getItem(LS_PRICE) || ""));
  const [rows, setRows] = useState<Row[]>(() => [{
    weight: initial?.weight ? String(initial.weight) : "",
    purity: initial?.purity || localStorage.getItem(LS_PURITY) || "375",
  }]);

  useEffect(() => { if (price585) localStorage.setItem(LS_PRICE, price585); }, [price585]);
  useEffect(() => { localStorage.setItem(LS_PURITY, rows[rows.length - 1].purity); }, [rows]);

  const p585 = toNum(price585);
  const calc = useMemo(() => rows.map(r => {
    const w = toNum(r.weight);
    const w585 = to585(w, r.purity);
    return { w, w585, total: w585 * p585 };
  }), [rows, p585]);

  const sumW585 = calc.reduce((s, c) => s + c.w585, 0);
  const sumTotal = calc.reduce((s, c) => s + c.total, 0);
  const valid = calc.filter(c => c.w > 0);

  const setRow = (i: number, patch: Partial<Row>) =>
    setRows(rs => rs.map((r, k) => (k === i ? { ...r, ...patch } : r)));

  const doPrint = () => {
    if (!p585 || !valid.length) return;
    printTags(rows
      .map(r => ({ weight: toNum(r.weight), purity: r.purity, price585: p585 }))
      .filter(t => t.weight > 0));
  };

  const INP = "w-full bg-[#0D0D0D] border border-[#333] text-white px-3 py-3 font-oswald font-bold text-lg focus:outline-none focus:border-[#FFD700] rounded-md";

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="w-full sm:max-w-lg max-h-[94vh] overflow-y-auto bg-[#0F0F0F] border border-[#FFD700]/30 rounded-t-2xl sm:rounded-2xl p-4"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Icon name="Calculator" size={18} className="text-[#FFD700]" />
            <span className="font-oswald font-bold text-white text-base uppercase tracking-wide">Ценник и калькулятор</span>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white p-1"><Icon name="X" size={20} /></button>
        </div>

        <div className="mb-3">
          <div className="font-roboto text-[10px] uppercase text-blue-300/70 mb-1">Цена продажи за 1 г (в пересчёте на 585), ₽</div>
          <input type="number" inputMode="decimal" className={INP + " border-blue-500/40 text-blue-300"} placeholder="6500"
            value={price585} onChange={e => setPrice585(e.target.value)} />
        </div>

        <div className="space-y-2 mb-3">
          {rows.map((r, i) => (
            <div key={i} className="rounded-lg border border-[#262626] bg-[#141414] p-2.5">
              <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
                <div>
                  <div className="font-roboto text-[10px] uppercase text-white/40 mb-1">Вес изделия, г</div>
                  <input type="number" inputMode="decimal" step="0.01" className={INP} placeholder="0.00"
                    value={r.weight} onChange={e => setRow(i, { weight: e.target.value })} />
                </div>
                <div>
                  <div className="font-roboto text-[10px] uppercase text-white/40 mb-1">Проба</div>
                  <select className={INP + " !px-2"} value={r.purity} onChange={e => setRow(i, { purity: e.target.value })}>
                    {PURITY_OPTIONS.map(p => <option key={p.v} value={p.v}>{p.v}</option>)}
                  </select>
                </div>
              </div>
              {calc[i].w > 0 && (
                <div className="mt-2 flex items-center justify-between gap-2">
                  <div className="font-roboto text-xs text-white/50">
                    {toNum(r.purity) !== 585
                      ? <>{fmtG(calc[i].w)} г ({r.purity}) → <span className="text-[#FFD700] font-bold">{fmtG(calc[i].w585)} г</span> в 585</>
                      : <>Проба 585 · <span className="text-[#FFD700] font-bold">{fmtG(calc[i].w585)} г</span></>}
                  </div>
                  <div className="font-oswald font-bold text-xl text-green-400 tabular-nums">
                    {p585 ? `${fmtRub(calc[i].total)} ₽` : "—"}
                  </div>
                </div>
              )}
              {rows.length > 1 && (
                <button onClick={() => setRows(rs => rs.filter((_, k) => k !== i))}
                  className="mt-1 text-red-400/70 hover:text-red-400 text-[11px] font-roboto flex items-center gap-1">
                  <Icon name="Trash2" size={11} />Убрать
                </button>
              )}
            </div>
          ))}
          <button onClick={() => setRows(rs => [...rs, { weight: "", purity: rs[rs.length - 1].purity }])}
            className="w-full py-2 border border-dashed border-[#FFD700]/30 text-[#FFD700]/80 hover:bg-[#FFD700]/5 rounded-md font-roboto text-xs flex items-center justify-center gap-1.5">
            <Icon name="Plus" size={13} />Ещё изделие
          </button>
        </div>

        <div className="rounded-xl p-4 mb-3 text-center border-2 border-[#FFD700]/60"
          style={{ background: "linear-gradient(180deg, rgba(255,215,0,0.10), rgba(255,215,0,0.02))" }}>
          <div className="font-roboto text-[10px] uppercase tracking-widest text-white/40">
            Итого · {fmtG(sumW585)} г в 585
          </div>
          <div className="font-oswald font-black text-[44px] leading-none text-[#FFD700] tabular-nums mt-1">
            {p585 && sumTotal > 0 ? `${fmtRub(sumTotal)} ₽` : "—"}
          </div>
        </div>

        <button onClick={doPrint} disabled={!p585 || !valid.length}
          className="w-full bg-gradient-to-b from-[#FFD700] to-yellow-500 text-black font-oswald font-bold py-3 text-sm uppercase rounded-md flex items-center justify-center gap-2 disabled:opacity-40 active:scale-[0.98] transition">
          <Icon name="Printer" size={16} />
          Печать ценника{valid.length > 1 ? ` (${valid.length} шт.)` : ""}
        </button>
      </div>
    </div>
  );
}
