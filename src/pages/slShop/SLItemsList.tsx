import { useEffect, useState, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { slApi, fmt, type SLItem, type SLCategory, STATUS_LABEL } from "./types";
import SLItemsFilters from "./SLItemsFilters";
import SLItemsMovePanel from "./SLItemsMovePanel";
import SLItemDetail from "./SLItemDetail";
import SLItemSellModal from "./SLItemSellModal";
import SLItemsTable from "./SLItemsTable";
import SLInvoiceModal from "./SLInvoiceModal";
import { printLabelQuick } from "./labelPrinter";
import PrintDocsButton from "./PrintDocsButton";

const PHONE_SPECS_AI_URL = "https://functions.poehali.dev/983744a8-1cfc-42d8-a566-bf31dfa328b2";

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
  const [aiStatus, setAiStatus] = useState<{ total: number; empty: number; short: number } | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiMsg, setAiMsg] = useState<string | null>(null);
  const [recogBusy, setRecogBusy] = useState(false);
  const [recogMsg, setRecogMsg] = useState<string | null>(null);
  const needRecogCount = allItems.filter(i =>
    i.storage && (!i.ram_gb || !i.storage_gb)
  ).length;
  const [viewMode, setViewMode] = useState<"cards" | "table">(() => {
    if (typeof window === "undefined") return "cards";
    return (window.localStorage.getItem("sl_items_view") as "cards" | "table") || "cards";
  });
  const setView = (m: "cards" | "table") => {
    setViewMode(m);
    try { window.localStorage.setItem("sl_items_view", m); } catch { /* noop */ }
  };
  // Модалка «Накладная»: скачать XLSX / загрузить по фото
  const [invoiceOpen, setInvoiceOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await slApi<SLItem[]>(token, "items", {
      params: { status: filter, q, category_id: catFilter || undefined, branch_id: branchFilter || undefined },
    });
    if (r.ok && r.data) {
      let result = r.data;
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

  const loadAiStatus = useCallback(async () => {
    try {
      const r = await fetch(`${PHONE_SPECS_AI_URL}?action=status&t=${Date.now()}`);
      const j = await r.json();
      if (j.ok) setAiStatus({ total: j.total, empty: j.empty, short: j.short ?? 0 });
    } catch {
      // тихо
    }
  }, []);
  useEffect(() => { loadAiStatus(); }, [loadAiStatus]);

  const fillSpecsAi = async () => {
    if (aiBusy) return;
    const total = (aiStatus?.empty ?? 0) + (aiStatus?.short ?? 0);
    if (!total) {
      setAiMsg("Все телефоны уже заполнены");
      setTimeout(() => setAiMsg(null), 2500);
      return;
    }
    if (!confirm(`Сгенерировать характеристики ИИ для ${total} телефонов? Это займёт ~${Math.ceil(total * 4)} сек.`)) return;
    setAiBusy(true);
    let done = 0;
    let attempts = 0;
    const CHUNK = 5;
    const MAX_ATTEMPTS = Math.ceil(total / CHUNK) + 5;
    try {
      // обрабатываем порциями по 5 (укладываемся в таймаут функции)
      while (attempts < MAX_ATTEMPTS) {
        attempts++;
        setAiMsg(`Обрабатываю... (${done} из ${total})`);
        let processed = 0;
        try {
          const r = await fetch(`${PHONE_SPECS_AI_URL}?action=generate_batch&t=${Date.now()}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ limit: CHUNK, only_empty: false, only_short: true }),
          });
          const j = await r.json();
          if (j.ok) processed = j.processed || 0;
        } catch {
          // таймаут одной порции — продолжим
        }
        done += processed;
        if (processed === 0) break; // нечего обрабатывать
      }
      setAiMsg(`Готово: обработано ${done} товаров`);
      await loadAiStatus();
      await load();
    } finally {
      setAiBusy(false);
      setTimeout(() => setAiMsg(null), 6000);
    }
  };

  const recognizeStorage = async () => {
    if (recogBusy) return;
    if (!confirm("Распознать ОЗУ и Память для всех старых товаров из текстового поля? Будут заполнены только пустые значения, существующие не меняются.")) return;
    setRecogBusy(true);
    setRecogMsg("Распознаю...");
    const r = await slApi<{ updated: number; scanned: number; samples: { title: string; storage: string; ram_gb: number | null; storage_gb: number | null }[] }>(
      token, "items_recognize_storage", { method: "POST", body: { only_phones: true } }
    );
    setRecogBusy(false);
    if (r.ok && r.data) {
      setRecogMsg(`Готово: распознано ${r.data.updated} из ${r.data.scanned} проверенных`);
      load();
    } else {
      setRecogMsg(r.error || "Ошибка");
    }
    setTimeout(() => setRecogMsg(null), 6000);
  };

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

      {needRecogCount > 0 && (
        <div className="mb-2 bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/30 rounded-lg p-2.5 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-blue-300 text-sm font-bold flex items-center gap-1">
              <Icon name="ScanLine" size={13} />
              Распознать ОЗУ / Память
            </div>
            <div className="text-[10px] text-white/50 mt-0.5 truncate">
              У {needRecogCount} товаров не заполнены ОЗУ или Память — распознать из текста
            </div>
            {recogMsg && <div className="text-[10px] text-emerald-300 mt-0.5">{recogMsg}</div>}
          </div>
          <button onClick={recognizeStorage} disabled={recogBusy}
            className="shrink-0 bg-blue-500 text-white font-bold text-xs px-3 py-2 rounded-lg disabled:opacity-50 flex items-center gap-1">
            {recogBusy
              ? <><Icon name="Loader" size={12} className="animate-spin" />Обработка...</>
              : <><Icon name="Wand2" size={12} />Распознать ({needRecogCount})</>}
          </button>
        </div>
      )}

      {aiStatus && (aiStatus.empty > 0 || aiStatus.short > 0) && (
        <div className="mb-2 bg-gradient-to-br from-[#FFD700]/10 to-transparent border border-[#FFD700]/30 rounded-lg p-2.5 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[#FFD700] text-sm font-bold flex items-center gap-1">
              <Icon name="Sparkles" size={13} />
              Заполнить характеристики ИИ
            </div>
            <div className="text-[10px] text-white/50 mt-0.5 truncate">
              Без описания: {aiStatus.empty} · Кратко: {aiStatus.short} из {aiStatus.total}
            </div>
            {aiMsg && <div className="text-[10px] text-emerald-300 mt-0.5">{aiMsg}</div>}
          </div>
          <button onClick={fillSpecsAi} disabled={aiBusy}
            className="shrink-0 bg-[#FFD700] text-black font-bold text-xs px-3 py-2 rounded-lg disabled:opacity-50 flex items-center gap-1">
            {aiBusy
              ? <><Icon name="Loader" size={12} className="animate-spin" />Обработка...</>
              : <><Icon name="Wand2" size={12} />Заполнить ({aiStatus.empty + aiStatus.short})</>}
          </button>
        </div>
      )}

      <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
        <div className="text-[11px] text-white/40">
          Найдено: <span className="text-white font-bold">{items.length}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setInvoiceOpen(true)}
            title="Скачать накладную в Excel или загрузить товары по фото бумажной накладной"
            className="text-[11px] px-2.5 py-1 rounded font-bold flex items-center gap-1 bg-gradient-to-br from-[#FFD700]/15 to-transparent border border-[#FFD700]/40 text-[#FFD700] hover:bg-[#FFD700]/20 active:scale-95"
          >
            <Icon name="FileSpreadsheet" size={11} /> Накладная
          </button>
          <div className="flex items-center gap-1 bg-[#0F0F0F] border border-[#1F1F1F] rounded-lg p-0.5">
            <button onClick={() => setView("cards")}
              className={`text-[11px] px-2.5 py-1 rounded font-bold flex items-center gap-1 ${viewMode === "cards" ? "bg-[#FFD700] text-black" : "text-white/50 hover:text-white"}`}>
              <Icon name="LayoutGrid" size={11} /> Карточки
            </button>
            <button onClick={() => setView("table")}
              className={`text-[11px] px-2.5 py-1 rounded font-bold flex items-center gap-1 ${viewMode === "table" ? "bg-[#FFD700] text-black" : "text-white/50 hover:text-white"}`}>
              <Icon name="Table" size={11} /> Таблица
            </button>
          </div>
        </div>
      </div>

      {loading && <div className="text-white/30 text-sm py-4 text-center"><Icon name="Loader" size={14} className="animate-spin inline mr-1" />Загрузка...</div>}

      {!loading && items.length > 0 && (() => {
        // Итоги по списку: позиций / штук всего / сумма закупки / сумма розницы.
        // Помогает сверяться с бумажной накладной.
        const totals = items.reduce(
          (acc, it) => {
            const q = Number(it.quantity ?? 1) || 1;
            acc.qty += q;
            acc.buy += (Number(it.buy_price) || 0) * q;
            acc.sell += (Number(it.sell_price) || 0) * q;
            return acc;
          },
          { qty: 0, buy: 0, sell: 0 },
        );
        return (
          <div className="mb-2 grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px]">
            <div className="bg-[#0F0F0F] border border-[#1F1F1F] rounded-md px-2 py-1">
              <div className="text-[9px] text-white/45 uppercase tracking-wide">Позиций</div>
              <div className="font-bold text-white tabular-nums">{items.length}</div>
            </div>
            <div className="bg-[#0F0F0F] border border-[#FFD700]/30 rounded-md px-2 py-1">
              <div className="text-[9px] text-[#FFD700]/70 uppercase tracking-wide">Штук всего</div>
              <div className="font-bold text-[#FFD700] tabular-nums">{totals.qty}</div>
            </div>
            <div className="bg-[#0F0F0F] border border-[#1F1F1F] rounded-md px-2 py-1">
              <div className="text-[9px] text-white/45 uppercase tracking-wide">Закупка ∑</div>
              <div className="font-bold text-white tabular-nums">{Math.round(totals.buy).toLocaleString("ru-RU")} ₽</div>
            </div>
            <div className="bg-[#0F0F0F] border border-emerald-500/30 rounded-md px-2 py-1">
              <div className="text-[9px] text-emerald-300/80 uppercase tracking-wide">Розница ∑</div>
              <div className="font-bold text-emerald-300 tabular-nums">{Math.round(totals.sell).toLocaleString("ru-RU")} ₽</div>
            </div>
          </div>
        );
      })()}

      {!loading && items.length === 0 && viewMode === "cards" && (
        <div className="text-white/30 text-sm py-8 text-center">Нет товаров</div>
      )}

      {viewMode === "table" ? (
        <SLItemsTable
          token={token}
          items={items}
          selected={selected}
          toggleSelect={toggleSelect}
          onOpen={setOpen}
          onSell={setSellOpen}
        />
      ) : (
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
                    <div className="font-bold text-sm truncate">
                      {it.title}
                      {(it.ram_gb || it.storage_gb) && !String(it.title || "").match(/\d+\s*\/\s*\d+/) && (
                        <span className="ml-1.5 text-[#FFD700] font-bold text-[11px]">
                          {it.ram_gb && it.storage_gb ? `${it.ram_gb}/${it.storage_gb}` : (it.storage_gb || it.ram_gb)}
                        </span>
                      )}
                    </div>
                    {it.specs_short && <div className="text-[11px] text-white/50 truncate">{it.specs_short}</div>}
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded border ${stCfg.color}`}>{stCfg.l}</span>
                      {(it.quantity ?? 1) > 1 && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#FFD700]/15 border border-[#FFD700]/40 text-[#FFD700] font-bold">
                          × {it.quantity} шт
                        </span>
                      )}
                      {it.branch_name && <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#141414] border border-[#1F1F1F] text-white/50"><Icon name="MapPin" size={8} className="inline mr-0.5" />{it.branch_name}</span>}
                      {it.imei && <span className="text-[10px] text-white/30">IMEI: {it.imei}</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {it.sku && <div className="text-[9px] font-mono text-[#FFD700]/70 mb-0.5">{it.sku}</div>}
                    {(it.quantity ?? 1) > 1 && (
                      <div className="text-[10px] text-[#FFD700] font-bold mb-0.5 tabular-nums">× {it.quantity} шт</div>
                    )}
                    <div className="text-[#FFD700] font-bold text-sm tabular-nums">{fmt(it.sell_price)} ₽</div>
                    {Number(it.buy_price) > 0 && (
                      <div className="text-[9px] text-white/40 mt-0.5 tabular-nums">
                        закуп {fmt(it.buy_price)} ₽
                        {(it.quantity ?? 1) > 1 && (
                          <span className="text-white/55"> · итог {fmt(Number(it.buy_price) * Number(it.quantity || 1))} ₽</span>
                        )}
                      </div>
                    )}
                    <div className="flex items-center gap-1 mt-1 justify-end">
                      <button onClick={(e) => { e.stopPropagation(); printLabelQuick(it); }}
                        title="Печать ценника"
                        className="text-white/40 hover:text-[#FFD700] p-1 rounded hover:bg-[#FFD700]/10">
                        <Icon name="Printer" size={11} />
                      </button>
                      <div onClick={(e) => e.stopPropagation()}>
                        <PrintDocsButton
                          token={token}
                          itemId={it.id}
                          opType={it.status === "sold" ? "sell" : (it.source === "consignment" ? "consignment_in" : "buyout_individual")}
                          variant="small"
                        />
                      </div>
                      {it.status !== "sold" && it.status !== "returned" && (
                        <button onClick={(e) => { e.stopPropagation(); setSellOpen(it); }}
                          className="text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded">
                          Продать
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {open && <SLItemDetail token={token} item={open} isOwner={isOwner} onClose={() => setOpen(null)} onUpdated={() => { setOpen(null); load(); }} onSell={() => { setSellOpen(open); setOpen(null); }} />}
      {sellOpen && <SLItemSellModal token={token} item={sellOpen} onClose={() => setSellOpen(null)} onDone={() => { setSellOpen(null); load(); }} />}
      {invoiceOpen && (
        <SLInvoiceModal
          token={token}
          branches={branches}
          cats={cats}
          defaultBrand={brandFilter}
          defaultBranchId={typeof branchFilter === "number" ? branchFilter : null}
          onClose={() => setInvoiceOpen(false)}
          onCreated={() => load()}
        />
      )}
    </div>
  );
}