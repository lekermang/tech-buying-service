import { useState } from "react";
import Icon from "@/components/ui/icon";
import { CatMeta, PriceRange } from "./types";

interface Props {
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;

  // категории
  categories: CatMeta[];
  subcategories: Record<string, CatMeta[]>;
  activeCategory: string;
  activeSubcategory: string;
  expandedCat: string;
  setExpandedCat: (v: string) => void;
  total: number;
  handleCat: (c: string) => void;
  handleSubcat: (cat: string, sub: string) => void;

  // бренды
  brands: CatMeta[];
  activeBrand: string;
  handleBrand: (b: string) => void;
  brandsExpanded: boolean;
  setBrandsExpanded: (fn: (v: boolean) => boolean) => void;

  // наличие
  amounts: CatMeta[];
  activeAmount: string;
  handleAmount: (v: string) => void;

  // цена
  priceRanges: PriceRange[];
  activePriceRange: string;   // "min-max" или ""
  handlePriceRange: (min: number, max: number | null) => void;
  priceMin: string;
  priceMax: string;
  globalPriceMin: number;
  globalPriceMax: number;
  handlePriceInput: (min: string, max: string) => void;

  // фото
  hasImage: boolean;
  handleHasImage: (v: boolean) => void;
  withImageCount: number;

  // сброс
  activeFilters: number;
  clearAll: () => void;

  // для "Все категории" кнопки
  search: string;
  sort: string;
  activeBrandForApply: string;
  apply: (q: string, cat: string, subcat: string, brand: string, stock: boolean, sortBy: string, amount: string, prMin: string, prMax: string, hasImg: boolean) => void;
  inStockOnly: boolean;
}

const AMOUNT_ICONS: Record<string, string> = {
  "В наличии": "CheckCircle",
  "Под заказ": "Clock",
};
const AMOUNT_COLORS: Record<string, string> = {
  "В наличии": "text-green-400",
  "Под заказ": "text-yellow-400",
};

export default function ToolsSidebar({
  sidebarOpen, setSidebarOpen,
  categories, subcategories, activeCategory, activeSubcategory,
  expandedCat, setExpandedCat, total, handleCat, handleSubcat,
  brands, activeBrand, handleBrand, brandsExpanded, setBrandsExpanded,
  amounts, activeAmount, handleAmount,
  priceRanges, activePriceRange, handlePriceRange,
  priceMin, priceMax, globalPriceMin, globalPriceMax, handlePriceInput,
  hasImage, handleHasImage, withImageCount,
  activeFilters, clearAll,
  search, sort, activeBrandForApply, apply, inStockOnly,
}: Props) {
  const visibleBrands = brandsExpanded ? brands : brands.slice(0, 8);
  const [localMin, setLocalMin] = useState(priceMin);
  const [localMax, setLocalMax] = useState(priceMax);

  const applyPriceInput = () => {
    handlePriceInput(localMin, localMax);
  };

  return (
    <>
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/70 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <aside className={`
        fixed top-0 left-0 h-full z-30 w-72 bg-gray-900 shadow-2xl overflow-y-auto
        lg:relative lg:top-auto lg:left-auto lg:h-auto lg:w-64 lg:shrink-0 lg:shadow-none lg:bg-transparent
        transition-transform duration-200
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        <div className="lg:bg-gray-900 lg:rounded-lg lg:border lg:border-gray-800 p-4 space-y-5">

          {/* Мобильный заголовок */}
          <div className="flex items-center justify-between lg:hidden">
            <span className="font-bold text-white text-lg">Фильтры</span>
            <button onClick={() => setSidebarOpen(false)} className="text-gray-500 hover:text-gray-300">
              <Icon name="X" size={20} />
            </button>
          </div>

          {/* Сброс */}
          {activeFilters > 0 && (
            <button onClick={clearAll} className="flex items-center gap-1.5 text-sm text-orange-400 hover:text-orange-300 transition-colors font-medium w-full">
              <Icon name="RotateCcw" size={13} />
              Сбросить все фильтры ({activeFilters})
            </button>
          )}

          {/* ── Наличие ── */}
          <div className="border-b border-gray-800 pb-5">
            <div className="text-xs font-bold uppercase tracking-widest text-gray-600 mb-3">Наличие</div>
            <div className="space-y-1.5">
              <button
                onClick={() => handleAmount("")}
                className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm transition-colors
                  ${!activeAmount ? "bg-orange-500/10 text-orange-400 font-medium" : "text-gray-500 hover:bg-gray-800 hover:text-gray-200"}`}
              >
                <Icon name="Layers" size={14} className="shrink-0" />
                <span className="flex-1 text-left">Все товары</span>
                <span className="text-xs text-gray-600">{total.toLocaleString("ru-RU")}</span>
              </button>
              {amounts.map(a => (
                <button key={a.name}
                  onClick={() => handleAmount(a.name)}
                  className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm transition-colors
                    ${activeAmount === a.name ? "bg-orange-500/10 text-orange-400 font-medium" : "text-gray-500 hover:bg-gray-800 hover:text-gray-200"}`}
                >
                  <Icon name={AMOUNT_ICONS[a.name] || "Circle"} size={14}
                    className={`shrink-0 ${activeAmount === a.name ? "text-orange-400" : (AMOUNT_COLORS[a.name] || "text-gray-600")}`} />
                  <span className="flex-1 text-left">{a.name}</span>
                  <span className="text-xs text-gray-600">{a.count.toLocaleString("ru-RU")}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Цена: диапазоны ── */}
          <div className="border-b border-gray-800 pb-5">
            <div className="text-xs font-bold uppercase tracking-widest text-gray-600 mb-3">Цена</div>
            <div className="space-y-1">
              {priceRanges.map(r => {
                const key = `${r.min}-${r.max ?? ""}`;
                const isActive = activePriceRange === key;
                return (
                  <button key={key}
                    onClick={() => handlePriceRange(r.min, r.max)}
                    className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-sm transition-colors
                      ${isActive ? "bg-orange-500/10 text-orange-400 font-medium" : "text-gray-500 hover:bg-gray-800 hover:text-gray-200"}`}
                  >
                    <span>{r.label}</span>
                    <span className="text-xs text-gray-600">{r.count.toLocaleString("ru-RU")}</span>
                  </button>
                );
              })}
            </div>

            {/* Ввод своего диапазона */}
            <div className="mt-3">
              <div className="text-xs text-gray-600 mb-2">Свой диапазон</div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={localMin}
                  onChange={e => setLocalMin(e.target.value)}
                  onBlur={applyPriceInput}
                  onKeyDown={e => e.key === "Enter" && applyPriceInput()}
                  placeholder={globalPriceMin > 0 ? String(Math.round(globalPriceMin)) : "от"}
                  className="w-full bg-gray-800 border border-gray-700 text-white text-xs px-2 py-1.5 rounded focus:outline-none focus:border-orange-400 placeholder-gray-600"
                />
                <span className="text-gray-600 text-xs shrink-0">—</span>
                <input
                  type="number"
                  value={localMax}
                  onChange={e => setLocalMax(e.target.value)}
                  onBlur={applyPriceInput}
                  onKeyDown={e => e.key === "Enter" && applyPriceInput()}
                  placeholder={globalPriceMax > 0 ? String(Math.round(globalPriceMax)) : "до"}
                  className="w-full bg-gray-800 border border-gray-700 text-white text-xs px-2 py-1.5 rounded focus:outline-none focus:border-orange-400 placeholder-gray-600"
                />
              </div>
            </div>
          </div>

          {/* ── Категории ── */}
          <div className="border-b border-gray-800 pb-5">
            <div className="text-xs font-bold uppercase tracking-widest text-gray-600 mb-3">Категории</div>
            <div className="space-y-0.5">
              <button
                onClick={() => { apply(search, "", "", activeBrandForApply, inStockOnly, sort, activeAmount, priceMin, priceMax, hasImage); setExpandedCat(""); }}
                className={`w-full text-left px-2 py-2 text-sm rounded-lg transition-colors flex items-center justify-between
                  ${!activeCategory ? "bg-orange-500/10 text-orange-400 font-semibold" : "text-gray-500 hover:bg-gray-800 hover:text-gray-200"}`}
              >
                <span>Все категории</span>
                {!activeCategory && <span className="text-xs text-orange-500">{total.toLocaleString("ru-RU")}</span>}
              </button>

              {categories.map(cat => {
                const subs = subcategories[cat.name] || [];
                const isActive = activeCategory === cat.name;
                const isExpanded = expandedCat === cat.name;
                return (
                  <div key={cat.name}>
                    <button
                      onClick={() => {
                        if (subs.length > 0) {
                          setExpandedCat(isExpanded ? "" : cat.name);
                          if (!isActive) handleCat(cat.name);
                        } else {
                          handleCat(cat.name);
                        }
                      }}
                      className={`w-full text-left px-2 py-2 text-sm rounded-lg transition-colors flex items-center justify-between
                        ${isActive && !activeSubcategory ? "bg-orange-500/10 text-orange-400 font-semibold" : "text-gray-500 hover:bg-gray-800 hover:text-gray-200"}`}
                    >
                      <span className="truncate">{cat.name}</span>
                      <div className="flex items-center gap-1 shrink-0 ml-1">
                        <span className="text-xs text-gray-600">{cat.count.toLocaleString("ru-RU")}</span>
                        {subs.length > 0 && (
                          <Icon name={isExpanded ? "ChevronDown" : "ChevronRight"} size={12} className="text-gray-600" />
                        )}
                      </div>
                    </button>
                    {isExpanded && subs.length > 0 && (
                      <div className="ml-3 mt-0.5 space-y-0.5 border-l-2 border-orange-500/20 pl-2">
                        {subs.map(sub => (
                          <button key={sub.name}
                            onClick={() => handleSubcat(cat.name, sub.name)}
                            className={`w-full text-left px-2 py-1.5 text-sm rounded transition-colors flex items-center justify-between
                              ${activeSubcategory === sub.name ? "text-orange-400 font-semibold bg-orange-500/10" : "text-gray-600 hover:text-gray-200 hover:bg-gray-800"}`}
                          >
                            <span className="truncate">{sub.name}</span>
                            <span className="text-xs text-gray-700 shrink-0 ml-1">{sub.count.toLocaleString("ru-RU")}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Бренды ── */}
          {brands.length > 0 && (
            <div className="border-b border-gray-800 pb-5">
              <div className="text-xs font-bold uppercase tracking-widest text-gray-600 mb-3">Бренды</div>
              <div className="space-y-1">
                {visibleBrands.map(b => (
                  <label key={b.name} className="flex items-center gap-2.5 cursor-pointer group" onClick={() => handleBrand(b.name)}>
                    <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors
                      ${activeBrand === b.name ? "bg-orange-500 border-orange-500" : "border-gray-700 group-hover:border-orange-500"}`}>
                      {activeBrand === b.name && <Icon name="Check" size={10} className="text-white" />}
                    </div>
                    <span className={`text-sm flex-1 ${activeBrand === b.name ? "text-orange-400 font-medium" : "text-gray-500 group-hover:text-gray-300"}`}>{b.name}</span>
                    <span className="text-xs text-gray-700">{b.count.toLocaleString("ru-RU")}</span>
                  </label>
                ))}
              </div>
              {brands.length > 8 && (
                <button onClick={() => setBrandsExpanded(v => !v)}
                  className="mt-2 text-sm text-orange-400 hover:text-orange-300 flex items-center gap-1 font-medium">
                  <Icon name={brandsExpanded ? "ChevronUp" : "ChevronDown"} size={14} />
                  {brandsExpanded ? "Свернуть" : `Ещё ${brands.length - 8} брендов`}
                </button>
              )}
            </div>
          )}

          {/* ── Только с фото ── */}
          <div>
            <label className="flex items-center gap-3 cursor-pointer" onClick={() => handleHasImage(!hasImage)}>
              <div className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${hasImage ? "bg-orange-500" : "bg-gray-700"}`}>
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${hasImage ? "translate-x-5" : "translate-x-0.5"}`} />
              </div>
              <div>
                <div className="text-sm text-gray-300 font-medium">Только с фото</div>
                <div className="text-xs text-gray-600">{withImageCount.toLocaleString("ru-RU")} товаров</div>
              </div>
            </label>
          </div>

        </div>
      </aside>
    </>
  );
}
