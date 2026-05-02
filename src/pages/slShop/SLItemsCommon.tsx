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

export function Inp2({ l, v, s, disabled, required, invalid }: { l: string; v: string; s: (x: string) => void; disabled?: boolean; required?: boolean; invalid?: boolean }) {
  return (
    <div>
      <div className="text-[11px] text-white/50 mb-0.5">
        {l}{required && <span className="text-red-400 ml-0.5">*</span>}
      </div>
      <input value={v} onChange={e => s(e.target.value)} disabled={disabled}
        className={`w-full bg-[#141414] border rounded px-2 py-1.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed ${invalid ? "border-red-500/60" : "border-[#1F1F1F]"}`} />
    </div>
  );
}

/** Красивый формат памяти: "4/128", "128", "—" */
export function fmtRamStorage(ram?: number | null, storage?: number | null, fallback?: string | null): string {
  if (ram && storage) return `${ram}/${storage}`;
  if (storage) return `${storage}`;
  if (fallback) return String(fallback);
  return "";
}

/** Парсит "4/128", "4 / 128 GB", "128GB" → {ram, storage} */
export function parseStorageStr(s: string | null | undefined): { ram?: number; storage?: number } {
  if (!s) return {};
  const m = String(s).match(/(\d{1,3})\s*\/\s*(\d{2,4})/);
  if (m) return { ram: Number(m[1]), storage: Number(m[2]) };
  const m2 = String(s).match(/(\d{2,4})/);
  if (m2) return { storage: Number(m2[1]) };
  return {};
}