import { useState } from "react";
import Icon from "@/components/ui/icon";
import { fmt, type SLItem, STATUS_LABEL } from "./types";
import { printLabelQuick } from "./labelPrinter";

interface Props {
  items: SLItem[];
  selected: Set<number>;
  toggleSelect: (id: number) => void;
  onOpen: (it: SLItem) => void;
  onSell: (it: SLItem) => void;
}

type SortField = "title" | "sku" | "buy_price" | "sell_price" | "profit" | "category" | "status" | "created_at";
type SortDir = "asc" | "desc";

const fmtDate = (d?: string | null) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("ru-RU");
  } catch {
    return "—";
  }
};

const titleWithRam = (it: SLItem): string => {
  const hasRam = !!String(it.title || "").match(/\d+\s*\/\s*\d+/);
  if (hasRam) return it.title;
  if (it.ram_gb && it.storage_gb) return `${it.title} ${it.ram_gb}/${it.storage_gb}`;
  if (it.storage_gb) return `${it.title} ${it.storage_gb}`;
  return it.title;
};

export default function SLItemsTable({ items, selected, toggleSelect, onOpen, onSell }: Props) {
  const [sortBy, setSortBy] = useState<SortField>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const sortedItems = [...items].sort((a, b) => {
    let av: string | number = "";
    let bv: string | number = "";
    switch (sortBy) {
      case "title": av = a.title || ""; bv = b.title || ""; break;
      case "sku": av = a.sku || ""; bv = b.sku || ""; break;
      case "buy_price": av = Number(a.buy_price || 0); bv = Number(b.buy_price || 0); break;
      case "sell_price": av = Number(a.sell_price || 0); bv = Number(b.sell_price || 0); break;
      case "profit":
        av = Number(a.sell_price || 0) - Number(a.buy_price || 0);
        bv = Number(b.sell_price || 0) - Number(b.buy_price || 0);
        break;
      case "category": av = a.category_name || ""; bv = b.category_name || ""; break;
      case "status": av = a.status || ""; bv = b.status || ""; break;
      case "created_at": av = a.created_at || ""; bv = b.created_at || ""; break;
    }
    if (av < bv) return sortDir === "asc" ? -1 : 1;
    if (av > bv) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const setSort = (field: SortField) => {
    if (sortBy === field) setSortDir(d => (d === "asc" ? "desc" : "asc"));
    else { setSortBy(field); setSortDir("asc"); }
  };

  const Th = ({ f, l, w }: { f: SortField; l: string; w?: string }) => (
    <th onClick={() => setSort(f)}
      className={`text-left px-2 py-1.5 font-bold text-[10px] uppercase tracking-wide text-white/50 cursor-pointer hover:text-[#FFD700] select-none ${w || ""}`}>
      <div className="flex items-center gap-1">
        {l}
        {sortBy === f && <Icon name={sortDir === "asc" ? "ArrowUp" : "ArrowDown"} size={9} />}
      </div>
    </th>
  );

  return (
    <div className="rounded-xl overflow-x-auto" style={{
      background: "linear-gradient(145deg, rgba(14,11,7,0.98) 0%, rgba(8,6,4,0.99) 100%)",
      border: "1px solid rgba(255,215,0,0.1)",
      boxShadow: "0 2px 0 rgba(255,255,255,0.03) inset, 0 8px 32px rgba(0,0,0,0.6)",
    }}>
      <table className="w-full text-[12px] border-collapse">
        <thead className="sticky top-0 z-10" style={{
          background: "linear-gradient(180deg, rgba(20,15,8,0.99) 0%, rgba(14,11,7,0.98) 100%)",
          borderBottom: "1px solid rgba(255,215,0,0.1)",
        }}>
          <tr>
            <th className="px-2 py-1.5 w-8"></th>
            <Th f="title" l="Наименование" w="min-w-[180px]" />
            <Th f="sku" l="ID" w="w-[110px]" />
            <th className="text-left px-2 py-1.5 font-bold text-[10px] uppercase tracking-wide text-white/50 w-[120px]">S/N · IMEI</th>
            <Th f="buy_price" l="Закупка" w="w-[90px]" />
            <Th f="sell_price" l="Продажа" w="w-[90px]" />
            <Th f="profit" l="Доход" w="w-[80px]" />
            <Th f="category" l="Категория" w="w-[120px]" />
            <Th f="status" l="Статус" w="w-[100px]" />
            <Th f="created_at" l="Дата" w="w-[80px]" />
            <th className="px-2 py-1.5 w-[80px]"></th>
          </tr>
        </thead>
        <tbody>
          {sortedItems.map(it => {
            const isSel = selected.has(it.id);
            const stCfg = STATUS_LABEL[it.status] || STATUS_LABEL.stock;
            const profit = Number(it.sell_price || 0) - Number(it.buy_price || 0);
            const sn = it.serial_number || it.imei || "";
            return (
              <tr key={it.id}
                className="transition-colors duration-150"
                style={{
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                  background: isSel
                    ? "linear-gradient(90deg, rgba(255,215,0,0.08), rgba(255,215,0,0.04))"
                    : "transparent",
                }}
                onMouseEnter={e => { if (!isSel) (e.currentTarget as HTMLElement).style.background = "rgba(255,215,0,0.04)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = isSel ? "linear-gradient(90deg, rgba(255,215,0,0.08), rgba(255,215,0,0.04))" : "transparent"; }}
              >
                <td className="px-2 py-1.5">
                  <button onClick={(e) => { e.stopPropagation(); toggleSelect(it.id); }}
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center ${isSel ? "bg-[#FFD700] border-[#FFD700]" : "border-white/20"}`}>
                    {isSel && <Icon name="Check" size={9} className="text-black" />}
                  </button>
                </td>
                <td className="px-2 py-1.5 cursor-pointer" onClick={() => onOpen(it)}>
                  <div className="font-bold text-white truncate max-w-[260px] flex items-center gap-1.5">
                    <span className="truncate">{titleWithRam(it)}</span>
                    {(it.quantity ?? 1) > 1 && (
                      <span className="shrink-0 text-[9px] px-1.5 py-0.5 rounded bg-[#FFD700]/15 border border-[#FFD700]/40 text-[#FFD700] font-bold">
                        × {it.quantity} шт
                      </span>
                    )}
                  </div>
                  {it.specs_short && <div className="text-[10px] text-white/40 truncate max-w-[260px]">{it.specs_short}</div>}
                </td>
                <td className="px-2 py-1.5 font-mono text-[10px] text-[#FFD700]/80">
                  {it.sku || `#${it.id}`}
                </td>
                <td className="px-2 py-1.5 font-mono text-[10px] text-white/60 truncate max-w-[120px]">
                  {sn || "—"}
                </td>
                <td className="px-2 py-1.5 text-white/70">{fmt(it.buy_price)}</td>
                <td className="px-2 py-1.5 text-[#FFD700] font-bold">{fmt(it.sell_price)}</td>
                <td className={`px-2 py-1.5 font-bold ${profit > 0 ? "text-emerald-400" : "text-white/30"}`}>
                  {profit > 0 ? `+${fmt(profit)}` : "0"}
                </td>
                <td className="px-2 py-1.5 text-white/60 text-[11px] truncate">{it.category_name || "—"}</td>
                <td className="px-2 py-1.5">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded border ${stCfg.color}`}>{stCfg.l}</span>
                </td>
                <td className="px-2 py-1.5 text-white/40 text-[10px]">{fmtDate(it.created_at)}</td>
                <td className="px-2 py-1.5">
                  <div className="flex items-center gap-1 justify-end">
                    <button
                      onClick={(e) => { e.stopPropagation(); printLabelQuick(it); }}
                      title="Печать ценника"
                      className="text-white/50 hover:text-[#FFD700] p-1 rounded hover:bg-[#FFD700]/10">
                      <Icon name="Printer" size={13} />
                    </button>
                    {it.status !== "sold" && it.status !== "returned" && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onSell(it); }}
                        title="Продать"
                        className="text-emerald-400 hover:text-emerald-300 p-1 rounded hover:bg-emerald-500/10">
                        <Icon name="ShoppingBag" size={13} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
          {sortedItems.length === 0 && (
            <tr>
              <td colSpan={11} className="text-center text-white/30 py-8">Нет товаров</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}