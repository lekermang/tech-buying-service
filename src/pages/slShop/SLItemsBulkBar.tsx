import { useState } from "react";
import Icon from "@/components/ui/icon";
import type { SLItem } from "./types";
import { LABEL_SIZES, getLastLabelSize, printLabelsQuick } from "./labelPrinter";

type Props = {
  items: SLItem[];
  selectedItems: SLItem[];
  empName?: string;
  onSelectAll: () => void;
  onClear: () => void;
};

export default function SLItemsBulkBar({ items, selectedItems, empName, onSelectAll, onClear }: Props) {
  const [size, setSize] = useState(getLastLabelSize());
  const [byQty, setByQty] = useState(false);
  const n = selectedItems.length;
  const total = byQty
    ? selectedItems.reduce((s, i) => s + Math.max(1, Number(i.quantity ?? 1) || 1), 0)
    : n;

  const print = () => {
    if (!n) return;
    printLabelsQuick(selectedItems, { empName, size, copiesByQty: byQty });
  };

  return (
    <div className="sticky top-1 z-30 mb-2 rounded-xl border border-[#FFD700]/40 bg-[#0F0F0F]/95 backdrop-blur p-2 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
      <div className="flex items-center gap-2 flex-wrap">
        <Icon name="Printer" size={15} className="text-[#FFD700]" />
        <span className="text-[11px] uppercase font-bold tracking-wide text-white/70">Ценники</span>
        <span className={`text-[11px] font-bold ${n ? "text-[#FFD700]" : "text-white/40"}`}>
          {n ? `выбрано ${n}` : "отметьте товары галочками"}
        </span>
        <div className="flex items-center gap-1.5 ml-auto flex-wrap">
          <select value={size} onChange={e => setSize(e.target.value)}
            className="bg-[#141414] border border-[#1F1F1F] rounded px-2 py-1 text-[11px]">
            {LABEL_SIZES.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
          </select>
          <label className="flex items-center gap-1 text-[10px] text-white/60 cursor-pointer select-none">
            <input type="checkbox" checked={byQty} onChange={e => setByQty(e.target.checked)} className="accent-[#FFD700]" />
            по кол-ву шт
          </label>
          {n === 0 ? (
            <button onClick={onSelectAll}
              className="bg-[#141414] border border-[#1F1F1F] px-2.5 py-1.5 rounded text-[11px] text-white/70">
              Выбрать все ({items.length})
            </button>
          ) : (
            <>
              <button onClick={onSelectAll} className="text-[10px] text-white/50 underline">все ({items.length})</button>
              <button onClick={onClear} className="text-[10px] text-white/50 underline">сброс</button>
            </>
          )}
          <button onClick={print} disabled={!n}
            className="flex items-center gap-1.5 bg-gradient-to-r from-[#FFD700] to-[#b8860b] text-black font-bold uppercase tracking-wide text-[11px] px-3.5 py-1.5 rounded-lg disabled:opacity-40 active:scale-[0.97] transition">
            <Icon name="Printer" size={13} /> Печать {n ? `(${total})` : ""}
          </button>
        </div>
      </div>
    </div>
  );
}
