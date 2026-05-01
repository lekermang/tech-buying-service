import Icon from "@/components/ui/icon";
import type { SLItem, SLCategory } from "./types";
import CategoryTreeSelect from "./CategoryTreeSelect";
import { STATUS_FILTERS } from "./SLItemsCommon";

type Props = {
  q: string;
  setQ: (v: string) => void;
  filter: string;
  setFilter: (v: string) => void;
  branches: { id: number; name: string }[];
  branchFilter: number | "";
  setBranchFilter: (v: number | "") => void;
  cats: SLCategory[];
  catFilter: number | "";
  setCatFilter: (v: number | "") => void;
  moreFilters: boolean;
  setMoreFilters: (v: boolean) => void;
  brandFilter: string;
  setBrandFilter: (v: string) => void;
  priceMin: string;
  setPriceMin: (v: string) => void;
  priceMax: string;
  setPriceMax: (v: string) => void;
  availableBrands: string[];
  allItems: SLItem[];
};

export default function SLItemsFilters({
  q, setQ, filter, setFilter,
  branches, branchFilter, setBranchFilter,
  cats, catFilter, setCatFilter,
  moreFilters, setMoreFilters,
  brandFilter, setBrandFilter,
  priceMin, setPriceMin,
  priceMax, setPriceMax,
  availableBrands, allItems,
}: Props) {
  return (
    <>
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
    </>
  );
}
