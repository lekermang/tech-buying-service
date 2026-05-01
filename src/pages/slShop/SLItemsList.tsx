import { useEffect, useState, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { slApi, fmt, type SLItem, type SLCategory, STATUS_LABEL } from "./types";
import SLItemsFilters from "./SLItemsFilters";
import SLItemsMovePanel from "./SLItemsMovePanel";
import SLItemDetail from "./SLItemDetail";
import SLItemSellModal from "./SLItemSellModal";

export default function SLItemsList({ token, empName: _empName, isOwner = false }: { token: string; empName?: string; isOwner?: boolean }) {
  const [items, setItems] = useState<SLItem[]>([]);
  const [cats, setCats] = useState<SLCategory[]>([]);
  const [branches, setBranches] = useState<{ id: number; name: string }[]>([]);
  const [filter, setFilter] = useState("");
  const [q, setQ] = useState("");
  const [catFilter, setCatFilter] = useState<number | "">("");
  const [branchFilter, setBranchFilter] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState<SLItem | null>(null);
  const [sellOpen, setSellOpen] = useState<SLItem | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [movingTo, setMovingTo] = useState<number | "">("");
  const [moveBusy, setMoveBusy] = useState(false);
  const [moveMsg, setMoveMsg] = useState<string | null>(null);
  const [brandFilter, setBrandFilter] = useState<string>("");
  const [priceMin, setPriceMin] = useState<string>("");
  const [priceMax, setPriceMax] = useState<string>("");
  const [allItems, setAllItems] = useState<SLItem[]>([]);
  const [moreFilters, setMoreFilters] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await slApi<SLItem[]>(token, "items", {
      params: { status: filter, q, category_id: catFilter || undefined },
    });
    if (r.ok && r.data) {
      let result = r.data;
      if (branchFilter) result = result.filter(i => i.branch_id === branchFilter);
      setAllItems(result);
      // фильтры на клиенте
      const min = priceMin ? Number(priceMin) : null;
      const max = priceMax ? Number(priceMax) : null;
      if (brandFilter) {
        const b = brandFilter.toLowerCase();
        result = result.filter(i => (i.brand || "").toLowerCase() === b);
      }
      if (min !== null) result = result.filter(i => Number(i.sell_price || 0) >= min);
      if (max !== null) result = result.filter(i => Number(i.sell_price || 0) <= max);
      setItems(result);
    }
    setLoading(false);
  }, [token, filter, q, catFilter, branchFilter, brandFilter, priceMin, priceMax]);

  // Список доступных брендов (из текущей выборки до фильтра по бренду/цене)
  const availableBrands = Array.from(new Set(
    allItems.map(i => (i.brand || "").trim()).filter(Boolean)
  )).sort((a, b) => a.localeCompare(b, "ru"));

  useEffect(() => {
    slApi<SLCategory[]>(token, "categories").then(r => { if (r.ok && r.data) setCats(r.data); });
    slApi<{ id: number; name: string }[]>(token, "branches").then(r => { if (r.ok && r.data) setBranches(r.data); });
  }, [token]);
  useEffect(() => { load(); }, [load]);

  const toggleSelect = (id: number) => {
    setSelected(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };
  const selectAll = () => setSelected(new Set(items.map(i => i.id)));
  const clearSelection = () => setSelected(new Set());

  const moveSelected = async (moveAll: boolean) => {
    if (!movingTo) { setMoveMsg("Выберите филиал"); return; }
    if (!moveAll && selected.size === 0) { setMoveMsg("Выберите товары галочками или используйте «Перенести всё»"); return; }
    setMoveBusy(true); setMoveMsg(null);
    const r = await slApi<{ moved: number; branch_name: string }>(token, "items_move_branch", {
      method: "POST",
      body: moveAll ? { move_all: true, branch_id: movingTo } : { item_ids: Array.from(selected), branch_id: movingTo },
    });
    setMoveBusy(false);
    if (r.ok && r.data) {
      setMoveMsg(`Перенесено ${r.data.moved} → ${r.data.branch_name}`);
      clearSelection();
      load();
    } else {
      setMoveMsg(r.error || "Ошибка переноса");
    }
  };

  return (
    <div>
      <SLItemsFilters
        q={q} setQ={setQ}
        filter={filter} setFilter={setFilter}
        branches={branches}
        branchFilter={branchFilter} setBranchFilter={setBranchFilter}
        cats={cats}
        catFilter={catFilter} setCatFilter={setCatFilter}
        moreFilters={moreFilters} setMoreFilters={setMoreFilters}
        brandFilter={brandFilter} setBrandFilter={setBrandFilter}
        priceMin={priceMin} setPriceMin={setPriceMin}
        priceMax={priceMax} setPriceMax={setPriceMax}
        availableBrands={availableBrands}
        allItems={allItems}
      />

      <SLItemsMovePanel
        branches={branches}
        movingTo={movingTo} setMovingTo={setMovingTo}
        selectedSize={selected.size}
        itemsCount={items.length}
        moveBusy={moveBusy}
        moveMsg={moveMsg}
        onMove={moveSelected}
        onSelectAll={selectAll}
        onClearSelection={clearSelection}
      />

      {loading && <div className="text-white/30 text-sm py-4 text-center"><Icon name="Loader" size={14} className="animate-spin inline mr-1" />Загрузка...</div>}

      {!loading && items.length === 0 && (
        <div className="text-white/30 text-sm py-8 text-center">Нет товаров</div>
      )}

      <div className="space-y-1.5">
        {items.map(it => {
          const stCfg = STATUS_LABEL[it.status] || STATUS_LABEL.stock;
          const isSel = selected.has(it.id);
          return (
            <div key={it.id}
              className={`bg-[#0F0F0F] border rounded-lg p-2.5 hover:border-[#FFD700]/30 transition-colors ${isSel ? "border-[#FFD700]" : "border-[#1F1F1F]"}`}>
              <div className="flex items-start gap-2">
                <button onClick={(e) => { e.stopPropagation(); toggleSelect(it.id); }}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 ${isSel ? "bg-[#FFD700] border-[#FFD700]" : "border-white/20"}`}>
                  {isSel && <Icon name="Check" size={11} className="text-black" />}
                </button>
                <div className="flex-1 min-w-0" onClick={() => setOpen(it)} role="button">
                  <div className="font-bold text-sm truncate">{it.title}</div>
                  {it.specs_short && <div className="text-[11px] text-white/50 truncate">{it.specs_short}</div>}
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded border ${stCfg.color}`}>{stCfg.l}</span>
                    {it.branch_name && <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#141414] border border-[#1F1F1F] text-white/50"><Icon name="MapPin" size={8} className="inline mr-0.5" />{it.branch_name}</span>}
                    {it.sku && <span className="text-[10px] text-white/30">{it.sku}</span>}
                    {it.imei && <span className="text-[10px] text-white/30">IMEI: {it.imei}</span>}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[#FFD700] font-bold text-sm">{fmt(it.sell_price)} ₽</div>
                  {it.status !== "sold" && it.status !== "returned" && (
                    <button onClick={() => setSellOpen(it)}
                      className="mt-1 text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded">
                      Продать
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {open && <SLItemDetail token={token} item={open} isOwner={isOwner} onClose={() => setOpen(null)} onUpdated={() => { setOpen(null); load(); }} onSell={() => { setSellOpen(open); setOpen(null); }} />}
      {sellOpen && <SLItemSellModal token={token} item={sellOpen} onClose={() => setSellOpen(null)} onDone={() => { setSellOpen(null); load(); }} />}
    </div>
  );
}
