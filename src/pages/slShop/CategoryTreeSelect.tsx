import { useMemo, useState } from "react";
import Icon from "@/components/ui/icon";
import type { SLCategory } from "./types";

type Props = {
  categories: SLCategory[];
  value: number | null | "";
  onChange: (id: number | "") => void;
  placeholder?: string;
  allowEmpty?: boolean;
  emptyLabel?: string;
};

export default function CategoryTreeSelect({ categories, value, onChange, placeholder, allowEmpty = true, emptyLabel = "— выбрать —" }: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const tree = useMemo(() => {
    const byParent: Record<string, SLCategory[]> = {};
    categories.forEach(c => {
      const k = String(c.parent_id ?? "root");
      (byParent[k] = byParent[k] || []).push(c);
    });
    return byParent;
  }, [categories]);

  const selected = categories.find(c => c.id === value) || null;

  const filtered = useMemo(() => {
    if (!q.trim()) return null;
    const ql = q.toLowerCase();
    return categories.filter(c =>
      c.name.toLowerCase().includes(ql) ||
      (c.path || "").toLowerCase().includes(ql)
    ).slice(0, 50);
  }, [q, categories]);

  const renderNode = (c: SLCategory, level: number) => {
    const children = tree[String(c.id)] || [];
    return (
      <div key={c.id}>
        <button
          onClick={() => { onChange(c.id); setOpen(false); setQ(""); }}
          className={`w-full text-left px-2 py-1.5 hover:bg-white/5 rounded text-[12.5px] flex items-center gap-1.5 ${
            value === c.id ? "bg-[#FFD700]/10 text-[#FFD700]" : ""
          }`}
          style={{ paddingLeft: 8 + level * 14 }}
        >
          <Icon name={c.icon || "Package"} size={11} className="opacity-60 shrink-0" />
          <span className="truncate">{c.name}</span>
        </button>
        {children.map(ch => renderNode(ch, level + 1))}
      </div>
    );
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg px-3 py-2 text-sm text-left flex items-center gap-2"
      >
        {selected ? (
          <>
            <Icon name={selected.icon || "Package"} size={13} className="text-[#FFD700]" />
            <span className="flex-1 truncate">{selected.path || selected.name}</span>
          </>
        ) : (
          <span className="text-white/40 flex-1">{placeholder || emptyLabel}</span>
        )}
        <Icon name={open ? "ChevronUp" : "ChevronDown"} size={13} className="text-white/40" />
      </button>

      {open && (
        <div className="absolute z-30 left-0 right-0 top-full mt-1 bg-[#0F0F0F] border border-[#1F1F1F] rounded-lg shadow-xl max-h-[60vh] overflow-hidden flex flex-col">
          <div className="p-2 border-b border-[#1F1F1F]">
            <div className="relative">
              <Icon name="Search" size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-white/30" />
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="Поиск категории"
                autoFocus
                className="w-full bg-[#141414] border border-[#1F1F1F] rounded pl-7 pr-2 py-1.5 text-[12px] outline-none focus:border-[#FFD700]/40" />
            </div>
          </div>
          <div className="overflow-y-auto flex-1 p-1">
            {allowEmpty && !q && (
              <button onClick={() => { onChange(""); setOpen(false); }}
                className="w-full text-left px-2 py-1.5 text-[12.5px] text-white/40 hover:bg-white/5 rounded">
                {emptyLabel}
              </button>
            )}
            {filtered ? (
              filtered.length === 0 ? (
                <div className="text-white/30 text-[12px] text-center py-3">Не найдено</div>
              ) : (
                filtered.map(c => (
                  <button key={c.id} onClick={() => { onChange(c.id); setOpen(false); setQ(""); }}
                    className={`w-full text-left px-2 py-1.5 hover:bg-white/5 rounded text-[12.5px] flex items-center gap-1.5 ${
                      value === c.id ? "bg-[#FFD700]/10 text-[#FFD700]" : ""
                    }`}>
                    <Icon name={c.icon || "Package"} size={11} className="opacity-60" />
                    <span className="flex-1 truncate">{c.path || c.name}</span>
                  </button>
                ))
              )
            ) : (
              (tree["root"] || []).map(c => renderNode(c, 0))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
