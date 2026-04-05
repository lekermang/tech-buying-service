import Icon from "@/components/ui/icon";

interface CatalogNavProps {
  search: string;
  filterAvail: string;
  filterPanelOpen: boolean;
  activeFiltersCount: number;
  activeCategory: string;
  activeBrand: string;
  activeStorage: string;
  activeColor: string;
  brandsInCategory: string[];
  storagesInCategory: string[];
  colorsInCategory: string[];
  onSearch: (val: string) => void;
  onAvail: (val: string) => void;
  onFilterPanelToggle: () => void;
  onSidebarOpen: () => void;
  onBrandChange: (brand: string) => void;
  onStorageChange: (storage: string) => void;
  onColorChange: (color: string) => void;
  onResetFilters: () => void;
  cartCount?: number;
  onCartOpen?: () => void;
  modelFilters?: string[];
  modelFilter?: string;
  onModelFilter?: (f: string) => void;
}

export default function CatalogNav({
  search, filterAvail, filterPanelOpen, activeFiltersCount, activeCategory,
  activeBrand, activeStorage, activeColor,
  brandsInCategory, storagesInCategory, colorsInCategory,
  onSearch, onAvail, onFilterPanelToggle, onSidebarOpen,
  onBrandChange, onStorageChange, onColorChange, onResetFilters,
  cartCount = 0, onCartOpen,
  modelFilters, modelFilter = "Все", onModelFilter,
}: CatalogNavProps) {
  return (
    <nav className="bg-[#0D0D0D]/97 backdrop-blur-xl border-b border-white/6 sticky top-0 z-40">
      <div className="max-w-[1400px] mx-auto px-3 sm:px-4 h-12 flex items-center gap-2">

        {/* Назад */}
        <a href="/" className="flex items-center gap-1 shrink-0 text-white/40 hover:text-white transition-colors">
          <Icon name="ArrowLeft" size={15} />
        </a>

        {/* Поиск — растянут на всю ширину */}
        <div className="flex-1 relative min-w-0">
          <Icon name="Search" size={14} className="text-white/30 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => onSearch(e.target.value)}
            placeholder="Поиск по модели, бренду..."
            className="w-full bg-white/6 border border-white/8 text-white pl-9 pr-8 py-2 rounded-xl text-sm focus:outline-none focus:bg-white/10 focus:border-white/20 transition-all placeholder:text-white/25"
          />
          {search && (
            <button onClick={() => onSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
              <Icon name="X" size={13} />
            </button>
          )}
        </div>

        {/* Наличие */}
        <div className="flex items-center gap-0.5 shrink-0">
          {[{ val: "", label: "Все" }, { val: "in_stock", label: "Есть" }, { val: "on_order", label: "Заказ" }].map(f => (
            <button key={f.val} onClick={() => onAvail(f.val)}
              className={`text-xs px-2.5 py-1.5 rounded-lg transition-all font-medium ${filterAvail === f.val ? "bg-[#FFD700] text-black" : "text-white/40 hover:text-white hover:bg-white/8"}`}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Корзина */}
        {onCartOpen && (
          <button onClick={onCartOpen}
            className="relative shrink-0 flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-[#FFD700] hover:bg-yellow-400 transition-colors text-black font-semibold">
            <Icon name="ShoppingCart" size={15} />
            {cartCount > 0 && (
              <span className="text-xs font-bold">{cartCount}</span>
            )}
          </button>
        )}

        {/* Фильтры — мобилка */}
        <button
          onClick={onFilterPanelToggle}
          className={`lg:hidden relative shrink-0 flex items-center px-2.5 py-2 rounded-lg border transition-all ${filterPanelOpen || activeFiltersCount > 0 ? "bg-[#FFD700]/15 border-[#FFD700]/40 text-[#FFD700]" : "bg-white/6 border-white/8 text-white/60 hover:text-white"}`}
        >
          <Icon name="SlidersHorizontal" size={14} />
          {activeFiltersCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#FFD700] text-black text-[9px] font-bold rounded-full flex items-center justify-center">{activeFiltersCount}</span>
          )}
        </button>
      </div>

      {/* Фильтры модели (Pro / Pro Max / Air / ...) */}
      {modelFilters && modelFilters.length > 1 && onModelFilter && (
        <div className="overflow-x-auto scrollbar-hide border-t border-white/5">
          <div className="flex gap-1.5 px-3 sm:px-4 py-2" style={{ width: "max-content" }}>
            {modelFilters.map(f => (
              <button key={f} onClick={() => onModelFilter(f)}
                className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                  modelFilter === f
                    ? "bg-white text-black border-white"
                    : "border-white/15 text-white/50 hover:border-white/30 hover:text-white"
                }`}>
                {f}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Мобильная панель фильтров */}
      {filterPanelOpen && (
        <div className="lg:hidden border-t border-white/6 bg-[#0D0D0D] px-3 py-3 space-y-3">

          <div>
            <div className="text-[10px] uppercase tracking-widest text-white/25 mb-1.5">Наличие</div>
            <div className="flex gap-1.5 flex-wrap">
              {[{ val: "", label: "Все" }, { val: "in_stock", label: "Есть" }, { val: "on_order", label: "Под заказ" }].map(f => (
                <button key={f.val} onClick={() => onAvail(f.val)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${filterAvail === f.val ? "bg-[#FFD700] text-black border-[#FFD700] font-semibold" : "border-white/10 text-white/50 hover:text-white"}`}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {brandsInCategory.length > 1 && (
            <div>
              <div className="text-[10px] uppercase tracking-widest text-white/25 mb-1.5">Бренд</div>
              <div className="flex gap-1.5 flex-wrap">
                {brandsInCategory.map(b => (
                  <button key={b} onClick={() => onBrandChange(b)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all ${activeBrand === b ? "bg-white text-black border-white font-semibold" : "border-white/10 text-white/50 hover:text-white"}`}>
                    {b}
                  </button>
                ))}
              </div>
            </div>
          )}

          {storagesInCategory.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-widest text-white/25 mb-1.5">Объём памяти</div>
              <div className="flex gap-1.5 flex-wrap">
                {storagesInCategory.map(s => (
                  <button key={s} onClick={() => onStorageChange(s)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all ${activeStorage === s ? "bg-[#FFD700] text-black border-[#FFD700] font-semibold" : "border-white/10 text-white/50 hover:text-white"}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {colorsInCategory.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-widest text-white/25 mb-1.5">Цвет</div>
              <div className="flex gap-1.5 flex-wrap">
                {colorsInCategory.map(c => (
                  <button key={c} onClick={() => onColorChange(c)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all capitalize ${activeColor === c ? "bg-[#FFD700] text-black border-[#FFD700] font-semibold" : "border-white/10 text-white/50 hover:text-white"}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeFiltersCount > 0 && (
            <button onClick={onResetFilters} className="text-xs text-white/40 hover:text-white flex items-center gap-1 transition-colors">
              <Icon name="X" size={12} /> Сбросить все фильтры
            </button>
          )}
        </div>
      )}
    </nav>
  );
}