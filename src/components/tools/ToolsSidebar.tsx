import Icon from "@/components/ui/icon";
import { CatMeta } from "./types";

interface Props {
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  activeFilters: number;
  clearAll: () => void;
  inStockOnly: boolean;
  handleStock: (v: boolean) => void;
  categories: CatMeta[];
  subcategories: Record<string, CatMeta[]>;
  activeCategory: string;
  activeSubcategory: string;
  expandedCat: string;
  setExpandedCat: (v: string) => void;
  total: number;
  handleCat: (c: string) => void;
  handleSubcat: (cat: string, sub: string) => void;
  brands: CatMeta[];
  activeBrand: string;
  handleBrand: (b: string) => void;
  brandsExpanded: boolean;
  setBrandsExpanded: (fn: (v: boolean) => boolean) => void;
  search: string;
  sort: string;
  apply: (q: string, cat: string, subcat: string, brand: string, stock: boolean, sortBy: string) => void;
}

export default function ToolsSidebar({
  sidebarOpen, setSidebarOpen, activeFilters, clearAll,
  inStockOnly, handleStock,
  categories, subcategories, activeCategory, activeSubcategory,
  expandedCat, setExpandedCat, total, handleCat, handleSubcat,
  brands, activeBrand, handleBrand,
  brandsExpanded, setBrandsExpanded,
  search, sort, apply,
}: Props) {
  const visibleBrands = brandsExpanded ? brands : brands.slice(0, 10);

  return (
    <>
      {sidebarOpen && <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <aside className={`
        fixed top-0 left-0 h-full z-30 w-72 bg-white shadow-2xl overflow-y-auto
        lg:relative lg:top-auto lg:left-auto lg:h-auto lg:w-64 lg:shrink-0 lg:shadow-none lg:bg-transparent
        transition-transform duration-200
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        <div className="lg:bg-white lg:rounded-lg lg:border lg:border-gray-200 p-4">

          {/* Мобильный заголовок */}
          <div className="flex items-center justify-between mb-4 lg:hidden">
            <span className="font-bold text-gray-900 text-lg">Фильтры</span>
            <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-gray-600"><Icon name="X" size={20} /></button>
          </div>

          {activeFilters > 0 && (
            <button onClick={clearAll} className="flex items-center gap-1.5 text-sm text-orange-500 hover:text-orange-600 mb-4 transition-colors font-medium">
              <Icon name="X" size={13} />Сбросить все фильтры
            </button>
          )}

          {/* В наличии */}
          <label className="flex items-center gap-3 cursor-pointer mb-5 pb-5 border-b border-gray-100"
            onClick={() => handleStock(!inStockOnly)}>
            <div className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${inStockOnly ? "bg-orange-500" : "bg-gray-200"}`}>
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${inStockOnly ? "translate-x-5" : "translate-x-0.5"}`} />
            </div>
            <span className="text-sm text-gray-700 font-medium">Только в наличии</span>
          </label>

          {/* Категории */}
          <div className="mb-5">
            <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Категории</div>
            <div className="space-y-0.5">
              <button
                onClick={() => { apply(search, "", "", activeBrand, inStockOnly, sort); setExpandedCat(""); }}
                className={`w-full text-left px-2 py-2 text-sm rounded-lg transition-colors flex items-center justify-between
                  ${!activeCategory ? "bg-orange-50 text-orange-600 font-semibold" : "text-gray-600 hover:bg-gray-50"}`}>
                <span>Все категории</span>
                {!activeCategory && <span className="text-xs text-orange-400">{total.toLocaleString("ru-RU")}</span>}
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
                        ${isActive && !activeSubcategory ? "bg-orange-50 text-orange-600 font-semibold" : "text-gray-600 hover:bg-gray-50"}`}
                    >
                      <span className="truncate">{cat.name}</span>
                      <div className="flex items-center gap-1 shrink-0 ml-1">
                        <span className="text-xs text-gray-400">{cat.count.toLocaleString("ru-RU")}</span>
                        {subs.length > 0 && (
                          <Icon name={isExpanded ? "ChevronDown" : "ChevronRight"} size={12} className="text-gray-400" />
                        )}
                      </div>
                    </button>

                    {isExpanded && subs.length > 0 && (
                      <div className="ml-3 mt-0.5 space-y-0.5 border-l-2 border-orange-100 pl-2">
                        {subs.map(sub => (
                          <button key={sub.name}
                            onClick={() => handleSubcat(cat.name, sub.name)}
                            className={`w-full text-left px-2 py-1.5 text-sm rounded transition-colors flex items-center justify-between
                              ${activeSubcategory === sub.name ? "text-orange-600 font-semibold bg-orange-50" : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"}`}
                          >
                            <span className="truncate">{sub.name}</span>
                            <span className="text-xs text-gray-400 shrink-0 ml-1">{sub.count.toLocaleString("ru-RU")}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Бренды */}
          {brands.length > 0 && (
            <div className="border-t border-gray-100 pt-4">
              <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Бренды</div>
              <div className="space-y-1">
                {visibleBrands.map(b => (
                  <label key={b.name} className="flex items-center gap-2.5 cursor-pointer group" onClick={() => handleBrand(b.name)}>
                    <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors
                      ${activeBrand === b.name ? "bg-orange-500 border-orange-500" : "border-gray-300 group-hover:border-orange-400"}`}>
                      {activeBrand === b.name && <Icon name="Check" size={10} className="text-white" />}
                    </div>
                    <span className={`text-sm flex-1 ${activeBrand === b.name ? "text-orange-600 font-medium" : "text-gray-600"}`}>{b.name}</span>
                    <span className="text-xs text-gray-400">{b.count.toLocaleString("ru-RU")}</span>
                  </label>
                ))}
              </div>
              {brands.length > 10 && (
                <button onClick={() => setBrandsExpanded(v => !v)}
                  className="mt-2 text-sm text-orange-500 hover:text-orange-600 flex items-center gap-1 font-medium">
                  <Icon name={brandsExpanded ? "ChevronUp" : "ChevronDown"} size={14} />
                  {brandsExpanded ? "Свернуть" : `Ещё ${brands.length - 10} брендов`}
                </button>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
