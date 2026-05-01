export const STATUS_FILTERS = [
  { v: "", l: "Все" },
  { v: "stock", l: "Склад" },
  { v: "showcase", l: "Витрина" },
  { v: "consignment", l: "Реализация" },
  { v: "sold", l: "Проданные" },
  { v: "returned", l: "Возвраты" },
];

export function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-2 py-1 border-b border-[#1F1F1F]/60 last:border-0">
      <div className="text-white/50 text-[12px]">{k}</div>
      <div className="text-right text-[13px] truncate max-w-[60%]">{v}</div>
    </div>
  );
}

export function Inp2({ l, v, s, disabled }: { l: string; v: string; s: (x: string) => void; disabled?: boolean }) {
  return (
    <div>
      <div className="text-[11px] text-white/50 mb-0.5">{l}</div>
      <input value={v} onChange={e => s(e.target.value)} disabled={disabled}
        className="w-full bg-[#141414] border border-[#1F1F1F] rounded px-2 py-1.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed" />
    </div>
  );
}
