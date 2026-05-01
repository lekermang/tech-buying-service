import { useEffect, useState, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { slApi, fmt, type SLItem, type SLCategory, STATUS_LABEL, PAYMENT_METHODS } from "./types";
import CategoryTreeSelect from "./CategoryTreeSelect";
import PrintDocsButton from "./PrintDocsButton";

const STATUS_FILTERS = [
  { v: "", l: "Все" },
  { v: "stock", l: "Склад" },
  { v: "showcase", l: "Витрина" },
  { v: "consignment", l: "Реализация" },
  { v: "sold", l: "Проданные" },
  { v: "returned", l: "Возвраты" },
];

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
      {/* Поиск */}
      <div className="relative mb-2">
        <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
        <input value={q} onChange={e => setQ(e.target.value)}
          placeholder="Поиск по названию / IMEI / SKU"
          className="w-full bg-[#0F0F0F] border border-[#1F1F1F] rounded-lg pl-9 pr-3 py-2 text-sm focus:border-[#FFD700]/40 outline-none" />
      </div>

      {/* Фильтры по статусу */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-2 mb-2">
        {STATUS_FILTERS.map(f => (
          <button key={f.v} onClick={() => setFilter(f.v)}
            className={`shrink-0 text-[11px] px-2.5 py-1.5 rounded-full ${
              filter === f.v ? "bg-[#FFD700] text-black font-bold" : "bg-[#141414] border border-[#1F1F1F] text-white/60"
            }`}>{f.l}</button>
        ))}
      </div>

      {/* Фильтр по филиалу */}
      {branches.length > 1 && (
        <div className="flex gap-1.5 mb-2">
          <button onClick={() => setBranchFilter("")}
            className={`text-[10px] px-2.5 py-1 rounded-full ${
              branchFilter === "" ? "bg-white/15 text-white" : "bg-[#141414] text-white/40"
            }`}>Все филиалы</button>
          {branches.map(b => (
            <button key={b.id} onClick={() => setBranchFilter(b.id)}
              className={`text-[10px] px-2.5 py-1 rounded-full inline-flex items-center gap-1 ${
                branchFilter === b.id ? "bg-white/15 text-white" : "bg-[#141414] text-white/40"
              }`}>
              <Icon name="MapPin" size={9} />{b.name}
            </button>
          ))}
        </div>
      )}

      {/* Категории — корневые быстрым доступом + дерево */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-2 mb-2">
        <button onClick={() => setCatFilter("")}
          className={`shrink-0 text-[10px] px-2 py-1 rounded-full ${
            catFilter === "" ? "bg-white/15 text-white" : "bg-[#141414] text-white/40"
          }`}>Все категории</button>
        {cats.filter(c => !c.parent_id).map(c => (
          <button key={c.id} onClick={() => setCatFilter(c.id)}
            className={`shrink-0 inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full ${
              catFilter === c.id ? "bg-white/15 text-white" : "bg-[#141414] text-white/40"
            }`}>
            <Icon name={c.icon} size={10} />{c.name}
          </button>
        ))}
      </div>
      <div className="mb-2">
        <CategoryTreeSelect categories={cats} value={catFilter} onChange={(id) => setCatFilter(id)} placeholder="Выбрать подкатегорию из дерева..." emptyLabel="Все категории" />
      </div>

      {/* Расширенные фильтры — бренд и цена */}
      <div className="mb-2">
        <button onClick={() => setMoreFilters(!moreFilters)}
          className="w-full text-[11px] text-white/50 hover:text-[#FFD700] flex items-center gap-1 mb-1.5">
          <Icon name={moreFilters ? "ChevronDown" : "ChevronRight"} size={11} />
          Фильтры: бренд, цена
          {(brandFilter || priceMin || priceMax) && (
            <span className="ml-auto text-[10px] bg-[#FFD700]/15 text-[#FFD700] px-1.5 py-0.5 rounded">
              активны
            </span>
          )}
        </button>
        {moreFilters && (
          <div className="bg-[#0F0F0F] border border-[#1F1F1F] rounded-lg p-2.5 space-y-2">
            {/* Бренды */}
            <div>
              <div className="text-[10px] uppercase tracking-wide text-white/40 mb-1">Бренд</div>
              {availableBrands.length === 0 ? (
                <div className="text-[10px] text-white/30">Нет данных</div>
              ) : (
                <div className="flex gap-1 flex-wrap">
                  <button onClick={() => setBrandFilter("")}
                    className={`text-[10px] px-2 py-1 rounded-full ${
                      brandFilter === "" ? "bg-[#FFD700] text-black font-bold" : "bg-[#141414] border border-[#1F1F1F] text-white/60"
                    }`}>Все ({allItems.length})</button>
                  {availableBrands.map(b => {
                    const cnt = allItems.filter(i => (i.brand || "").toLowerCase() === b.toLowerCase()).length;
                    return (
                      <button key={b} onClick={() => setBrandFilter(b)}
                        className={`text-[10px] px-2 py-1 rounded-full ${
                          brandFilter === b ? "bg-[#FFD700] text-black font-bold" : "bg-[#141414] border border-[#1F1F1F] text-white/60"
                        }`}>
                        {b} <span className="opacity-50">({cnt})</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            {/* Цена */}
            <div>
              <div className="text-[10px] uppercase tracking-wide text-white/40 mb-1">Цена, ₽</div>
              <div className="grid grid-cols-2 gap-2">
                <input type="number" inputMode="numeric" value={priceMin} onChange={e => setPriceMin(e.target.value)}
                  placeholder="от"
                  className="bg-[#141414] border border-[#1F1F1F] rounded px-2 py-1.5 text-sm" />
                <input type="number" inputMode="numeric" value={priceMax} onChange={e => setPriceMax(e.target.value)}
                  placeholder="до"
                  className="bg-[#141414] border border-[#1F1F1F] rounded px-2 py-1.5 text-sm" />
              </div>
              <div className="flex gap-1 mt-1.5 flex-wrap">
                {[
                  { l: "до 5к", min: "", max: "5000" },
                  { l: "5–15к", min: "5000", max: "15000" },
                  { l: "15–30к", min: "15000", max: "30000" },
                  { l: "30–60к", min: "30000", max: "60000" },
                  { l: "60к+", min: "60000", max: "" },
                ].map(p => (
                  <button key={p.l} onClick={() => { setPriceMin(p.min); setPriceMax(p.max); }}
                    className="text-[10px] px-2 py-0.5 rounded bg-[#141414] border border-[#1F1F1F] text-white/60 hover:border-[#FFD700]/30">
                    {p.l}
                  </button>
                ))}
              </div>
            </div>
            {(brandFilter || priceMin || priceMax) && (
              <button onClick={() => { setBrandFilter(""); setPriceMin(""); setPriceMax(""); }}
                className="w-full bg-red-500/10 border border-red-500/30 text-red-300 text-[11px] py-1.5 rounded">
                Сбросить фильтры
              </button>
            )}
          </div>
        )}
      </div>

      {/* Панель переноса между филиалами */}
      <div className="bg-[#0F0F0F] border border-[#1F1F1F] rounded-xl p-2.5 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Icon name="Truck" size={14} className="text-[#FFD700]" />
          <span className="text-[11px] uppercase font-bold tracking-wide text-white/60">Перенос</span>
          <select value={movingTo} onChange={e => setMovingTo(e.target.value ? Number(e.target.value) : "")}
            className="bg-[#141414] border border-[#1F1F1F] rounded px-2 py-1 text-[12px]">
            <option value="">Выбрать филиал →</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          {selected.size > 0 ? (
            <>
              <span className="text-[10px] text-[#FFD700]">{selected.size} выбрано</span>
              <button onClick={() => moveSelected(false)} disabled={moveBusy || !movingTo}
                className="bg-[#FFD700] text-black font-bold px-3 py-1 rounded text-[11px] disabled:opacity-50">
                Перенести {selected.size}
              </button>
              <button onClick={clearSelection} className="text-[10px] text-white/40 underline">сброс</button>
            </>
          ) : (
            <>
              <button onClick={selectAll} className="bg-[#141414] border border-[#1F1F1F] px-2 py-1 rounded text-[10px] text-white/60">
                Выбрать всё
              </button>
              <button onClick={() => moveSelected(true)} disabled={moveBusy || !movingTo}
                className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold px-3 py-1 rounded text-[11px] disabled:opacity-50">
                Перенести ВСЁ ({items.length})
              </button>
            </>
          )}
        </div>
        {moveMsg && <div className="text-[11px] text-emerald-300 mt-1.5">{moveMsg}</div>}
      </div>

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

      {open && <ItemDetail token={token} item={open} isOwner={isOwner} onClose={() => setOpen(null)} onUpdated={() => { setOpen(null); load(); }} onSell={() => { setSellOpen(open); setOpen(null); }} />}
      {sellOpen && <SellModal token={token} item={sellOpen} onClose={() => setSellOpen(null)} onDone={() => { setSellOpen(null); load(); }} />}
    </div>
  );
}

function ItemDetail({ token, item, isOwner, onClose, onUpdated, onSell }: { token: string; item: SLItem; isOwner?: boolean; onClose: () => void; onUpdated: () => void; onSell: () => void }) {
  const [editing, setEditing] = useState(false);
  const [data, setData] = useState({ ...item });
  const [cats, setCats] = useState<SLCategory[]>([]);
  const [saving, setSaving] = useState(false);
  const [branches, setBranches] = useState<{ id: number; name: string; address?: string | null }[]>([]);

  useEffect(() => {
    slApi<SLCategory[]>(token, "categories").then(r => { if (r.ok && r.data) setCats(r.data); });
    slApi<{ id: number; name: string; address?: string | null }[]>(token, "branches").then(r => {
      if (r.ok && r.data) setBranches(r.data);
    });
  }, [token]);

  const save = async () => {
    setSaving(true);
    const r = await slApi(token, "item_update", { method: "POST", body: {
      id: item.id,
      title: data.title,
      category_id: data.category_id || null,
      brand: data.brand,
      model: data.model,
      specs_short: data.specs_short,
      specs: data.specs,
      storage: data.storage,
      color: data.color,
      condition: data.condition,
      imei: data.imei,
      serial_number: data.serial_number,
      buy_price: data.buy_price,
      sell_price: data.sell_price,
      min_price: data.min_price,
      description: data.description,
      branch_id: data.branch_id || null,
    }});
    setSaving(false);
    if (r.ok) onUpdated();
  };
  const changeStatus = async (status: string) => {
    const r = await slApi(token, "item_status", { method: "POST", body: { item_id: item.id, status } });
    if (r.ok) onUpdated();
  };
  const stCfg = STATUS_LABEL[item.status] || STATUS_LABEL.stock;
  const currentCat = cats.find(c => c.id === item.category_id);
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center p-2" onClick={onClose}>
      <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-[#0A0A0A] border-b border-[#1F1F1F] p-3 flex items-center justify-between z-10">
          <div className="font-bold text-sm truncate">{item.title}</div>
          <button onClick={onClose} className="text-white/40 p-1"><Icon name="X" size={16} /></button>
        </div>
        <div className="p-3 space-y-2 text-sm">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] px-2 py-0.5 rounded border ${stCfg.color}`}>{stCfg.l}</span>
            {item.sku && <span className="text-[11px] text-white/40">{item.sku}</span>}
          </div>
          {!editing ? (
            <>
              <Row k="Категория" v={currentCat?.path || currentCat?.name || item.category_name || "— не указана —"} />
              <Row k="Филиал" v={item.branch_name || "—"} />
              <Row k="Бренд / Модель" v={`${item.brand || "-"} ${item.model || ""}`} />
              <Row k="Характеристики" v={item.specs_short || "-"} />
              <Row k="Память / Цвет" v={`${item.storage || "-"} / ${item.color || "-"}`} />
              <Row k="Состояние" v={item.condition || "-"} />
              <Row k="IMEI" v={item.imei || "-"} />
              <Row k="Закупка" v={`${fmt(item.buy_price)} ₽`} />
              <Row k="Продажа" v={`${fmt(item.sell_price)} ₽`} />
              <Row k="Мин. цена" v={`${fmt(item.min_price)} ₽`} />
              <Row k="Клиент" v={item.buy_client_name || "-"} />
              <div className="grid grid-cols-3 gap-1 mt-3">
                {["stock", "showcase", "consignment", "hidden"].map(s => (
                  <button key={s} onClick={() => changeStatus(s)}
                    className="text-[10px] py-1.5 bg-[#141414] border border-[#1F1F1F] rounded hover:border-[#FFD700]/40">
                    {STATUS_LABEL[s]?.l}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => setEditing(true)} className="flex-1 bg-[#141414] border border-[#1F1F1F] py-2 rounded-lg text-sm">Редактировать</button>
                {item.status !== "sold" && item.status !== "returned" && (
                  <button onClick={onSell} className="flex-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 py-2 rounded-lg text-sm font-bold">Продать</button>
                )}
              </div>
              <div className="mt-2">
                <PrintDocsButton token={token} itemId={item.id}
                  opType={item.status === "sold" ? "sell" : (item.source === "consignment" ? "consignment_in" : "buyout_individual")}
                  label="Документы по товару" />
              </div>
              {(isOwner || item.status !== "sold") && (
                <button
                  onClick={async () => {
                    const isSold = item.status === "sold";
                    const txt = isSold
                      ? "Удалить ПРОДАННЫЙ товар? Это действие необратимо."
                      : "Удалить товар? Это действие необратимо.";
                    if (!confirm(txt)) return;
                    const r = await slApi(token, "item_remove", { method: "POST", body: { id: item.id } });
                    if (r.ok) onUpdated();
                    else alert(r.error || "Ошибка удаления");
                  }}
                  className="w-full mt-2 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 py-2 rounded-lg text-sm font-bold">
                  <Icon name="Trash2" size={13} className="inline mr-1" />
                  Удалить товар{item.status === "sold" ? " (проданный)" : ""}
                </button>
              )}
            </>
          ) : (
            <>
              <Inp2 l="Наименование" v={data.title} s={v => setData({ ...data, title: v })} />
              <div>
                <div className="text-[11px] text-white/50 mb-0.5">Филиал / склад</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {branches.map(b => (
                    <button key={b.id} onClick={() => setData({ ...data, branch_id: b.id })}
                      className={`text-[11px] px-2 py-1.5 rounded border transition-all ${
                        data.branch_id === b.id ? "bg-[#FFD700]/10 border-[#FFD700] text-[#FFD700]" : "bg-[#141414] border-[#1F1F1F] text-white/60"
                      }`}>
                      {b.name}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-white/50 mb-0.5">Категория</div>
                <CategoryTreeSelect categories={cats} value={data.category_id ?? ""} onChange={(id) => setData({ ...data, category_id: id || null })} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Inp2 l="Бренд" v={data.brand || ""} s={v => setData({ ...data, brand: v })} />
                <Inp2 l="Модель" v={data.model || ""} s={v => setData({ ...data, model: v })} />
              </div>
              <Inp2 l="Краткие характеристики" v={data.specs_short || ""} s={v => setData({ ...data, specs_short: v })} />
              <div className="grid grid-cols-3 gap-2">
                <Inp2 l="Память" v={data.storage || ""} s={v => setData({ ...data, storage: v })} />
                <Inp2 l="Цвет" v={data.color || ""} s={v => setData({ ...data, color: v })} />
                <Inp2 l="Состояние" v={data.condition || ""} s={v => setData({ ...data, condition: v })} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Inp2 l="IMEI" v={data.imei || ""} s={v => setData({ ...data, imei: v })} />
                <Inp2 l="Серийный №" v={data.serial_number || ""} s={v => setData({ ...data, serial_number: v })} />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Inp2 l="Закупка ₽" v={String(data.buy_price || "")} s={v => setData({ ...data, buy_price: v })} />
                <Inp2
                  l={`Продажа ₽${item.status === "sold" && !isOwner ? " (только владелец)" : ""}`}
                  v={String(data.sell_price || "")}
                  s={v => setData({ ...data, sell_price: v })}
                  disabled={item.status === "sold" && !isOwner}
                />
                <Inp2 l="Мин. ₽" v={String(data.min_price || "")} s={v => setData({ ...data, min_price: v })} />
              </div>
              <div className="flex gap-2 sticky bottom-0 bg-[#0A0A0A] py-2 -mx-3 px-3">
                <button onClick={() => { setEditing(false); setData({ ...item }); }} className="flex-1 bg-[#141414] py-2 rounded-lg text-sm">Отмена</button>
                <button onClick={save} disabled={saving} className="flex-1 bg-[#FFD700] text-black font-bold py-2 rounded-lg text-sm disabled:opacity-50">
                  {saving ? "..." : "Сохранить"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SellModal({ token, item, onClose, onDone }: { token: string; item: SLItem; onClose: () => void; onDone: () => void }) {
  const [amount, setAmount] = useState(String(item.sell_price || ""));
  const [payment, setPayment] = useState("cash");
  const [contract, setContract] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [autoPrint, setAutoPrint] = useState(true);
  const submit = async () => {
    if (!amount || Number(amount) <= 0) { setErr("Укажите сумму"); return; }
    setSaving(true); setErr(null);
    const r = await slApi(token, "item_sell", { method: "POST", body: {
      item_id: item.id, amount: Number(amount), payment_method: payment, contract_number: contract, note,
    }});
    setSaving(false);
    if (r.ok) {
      // Автопечать товарного чека сразу после продажи
      if (autoPrint) {
        try {
          const ctxRes = await slApi(token, "doc_context", { params: { item_id: item.id } });
          const tplRes = await slApi<{ id: number; code: string; name: string }[]>(
            token, "doc_templates", { params: { only_active: "1", op_type: "sell" } }
          );
          if (ctxRes.ok && tplRes.ok && tplRes.data && tplRes.data.length > 0) {
            const { printDoc } = await import("./docPrinter");
            const tpl = tplRes.data.find(t => t.code === "sales_receipt") || tplRes.data[0];
            printDoc(tpl as never, ctxRes.data as never);
          }
        } catch (e) {
          console.error("auto-print sale", e);
        }
      }
      onDone();
    } else setErr(r.error || "Ошибка");
  };
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center p-2" onClick={onClose}>
      <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="p-3 border-b border-[#1F1F1F] flex items-center justify-between">
          <div className="font-bold">Продажа</div>
          <button onClick={onClose}><Icon name="X" size={16} /></button>
        </div>
        <div className="p-3 space-y-2">
          <div className="bg-[#141414] rounded-lg p-2.5 text-sm">
            <div className="font-bold">{item.title}</div>
            <div className="text-white/40 text-xs">{item.specs_short}</div>
          </div>
          <Inp2 l="Сумма ₽" v={amount} s={setAmount} />
          <div>
            <div className="text-[11px] text-white/50 mb-1">Способ оплаты</div>
            <div className="flex gap-1">
              {PAYMENT_METHODS.map(p => (
                <button key={p.v} onClick={() => setPayment(p.v)}
                  className={`flex-1 text-[11px] py-1.5 rounded ${payment === p.v ? "bg-[#FFD700] text-black font-bold" : "bg-[#141414] border border-[#1F1F1F] text-white/60"}`}>
                  {p.l}
                </button>
              ))}
            </div>
          </div>
          <Inp2 l="Договор №" v={contract} s={setContract} />
          <Inp2 l="Примечание" v={note} s={setNote} />
          <label className="flex items-center justify-between bg-[#141414] border border-[#1F1F1F] rounded-lg p-2 cursor-pointer">
            <div className="flex items-center gap-1.5 text-[12px]">
              <Icon name="Printer" size={12} className="text-[#FFD700]" />
              Печатать чек сразу после продажи
            </div>
            <button type="button" onClick={() => setAutoPrint(!autoPrint)}
              className={`w-9 h-5 rounded-full relative transition-colors ${autoPrint ? "bg-[#FFD700]" : "bg-[#1F1F1F]"}`}>
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${autoPrint ? "left-4" : "left-0.5"}`} />
            </button>
          </label>
          {err && <div className="text-red-400 text-sm">{err}</div>}
          <button onClick={submit} disabled={saving}
            className="w-full bg-emerald-500 text-black font-bold py-2.5 rounded-lg disabled:opacity-50">
            {saving ? "..." : "Продать"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-2 py-1 border-b border-[#1F1F1F]/60 last:border-0">
      <div className="text-white/50 text-[12px]">{k}</div>
      <div className="text-right text-[13px] truncate max-w-[60%]">{v}</div>
    </div>
  );
}

function Inp2({ l, v, s, disabled }: { l: string; v: string; s: (x: string) => void; disabled?: boolean }) {
  return (
    <div>
      <div className="text-[11px] text-white/50 mb-0.5">{l}</div>
      <input value={v} onChange={e => s(e.target.value)} disabled={disabled}
        className="w-full bg-[#141414] border border-[#1F1F1F] rounded px-2 py-1.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed" />
    </div>
  );
}