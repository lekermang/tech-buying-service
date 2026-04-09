import { useRef, useEffect } from "react";
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
  activeSimType?: string;
  brandsInCategory: string[];
  storagesInCategory: string[];
  colorsInCategory: string[];
  simTypesInCategory?: string[];
  onSearch: (val: string) => void;
  onAvail: (val: string) => void;
  onFilterPanelToggle: () => void;
  onSidebarOpen: () => void;
  onBrandChange: (brand: string) => void;
  onStorageChange: (storage: string) => void;
  onColorChange: (color: string) => void;
  onSimTypeChange?: (sim: string) => void;
  onResetFilters: () => void;
  cartCount?: number;
  onCartOpen?: () => void;
  modelFilters?: string[];
  modelFilter?: string;
  onModelFilter?: (f: string) => void;
}

export default function CatalogNav({
  search, filterAvail, filterPanelOpen, activeFiltersCount, activeCategory,
  activeBrand, activeStorage, activeColor, activeSimType = "",
  brandsInCategory, storagesInCategory, colorsInCategory, simTypesInCategory = [],
  onSearch, onAvail, onFilterPanelToggle, onSidebarOpen,
  onBrandChange, onStorageChange, onColorChange, onSimTypeChange, onResetFilters,
  cartCount = 0, onCartOpen,
  modelFilters, modelFilter = "Все", onModelFilter,
}: CatalogNavProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const hasFilters = activeFiltersCount > 0;

  return (
    <nav className="bg-[#0D0D0D] border-b border-white/5 sticky top-0 z-40">

      {/* Строка поиска */}
      <div className="max-w-[1400px] mx-auto px-3 sm:px-4 h-13 flex items-center gap-2 py-2">
        <a href="/" className="shrink-0 text-white/30 hover:text-white transition-colors p-1">
          <Icon name="ArrowLeft" size={16} />
        </a>

        <div className="flex-1 relative min-w-0">
          <Icon name="Search" size={14} className="text-white/25 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={e => onSearch(e.target.value)}
            placeholder="Модель, бренд..."
            className="w-full bg-white/5 text-white pl-9 pr-8 py-2 rounded-xl text-sm focus:outline-none focus:bg-white/8 transition-all placeholder:text-white/20"
          />
          {search && (
            <button onClick={() => onSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white">
              <Icon name="X" size={13} />
            </button>
          )}
        </div>

        {/* Корзина */}
        {onCartOpen && (
          <button onClick={onCartOpen}
            className="relative shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
            <Icon name="ShoppingCart" size={16} className="text-white/60" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#FFD700] text-black text-[9px] font-bold rounded-full flex items-center justify-center">{cartCount}</span>
            )}
          </button>
        )}

        {/* Кнопка фильтров */}
        <button
          onClick={onFilterPanelToggle}
          className={`shrink-0 relative w-9 h-9 flex items-center justify-center rounded-xl border transition-all ${
            filterPanelOpen || hasFilters
              ? "bg-[#FFD700] border-[#FFD700] text-black"
              : "bg-white/5 border-white/8 text-white/50 hover:text-white hover:bg-white/10"
          }`}
        >
          <Icon name="SlidersHorizontal" size={15} />
          {hasFilters && !filterPanelOpen && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#FFD700] text-black text-[9px] font-bold rounded-full flex items-center justify-center">{activeFiltersCount}</span>
          )}
        </button>
      </div>

      {/* Подмодели + активные теги — единая строка */}
      {!filterPanelOpen && (modelFilters && modelFilters.length > 1 || hasFilters) && (
        <div className="overflow-x-auto scrollbar-hide border-t border-white/5">
          <div className="flex gap-1.5 px-3 py-2 items-center" style={{ width: "max-content" }}>

            {/* Подмодели */}
            {modelFilters && modelFilters.length > 1 && onModelFilter && modelFilters.map(f => (
              <button key={f} onClick={() => onModelFilter(f)}
                className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  modelFilter === f ? "bg-white text-black" : "text-white/40 hover:text-white"
                }`}>
                {f}
              </button>
            ))}

            {/* Разделитель если есть и то и другое */}
            {modelFilters && modelFilters.length > 1 && hasFilters && (
              <span className="text-white/15 shrink-0">|</span>
            )}

            {/* Активные теги фильтров */}
            {filterAvail === "in_stock" && <FilterTag label="В наличии" color="green" onRemove={() => onAvail("")} />}
            {filterAvail === "on_order" && <FilterTag label="Заказ" onRemove={() => onAvail("")} />}
            {activeSimType && onSimTypeChange && <FilterTag label={activeSimType} color="blue" onRemove={() => onSimTypeChange("")} />}
            {activeBrand && <FilterTag label={activeBrand} onRemove={() => onBrandChange("")} />}
            {activeStorage && <FilterTag label={activeStorage} color="yellow" onRemove={() => onStorageChange("")} />}
            {activeColor && <FilterTag label={activeColor} color="yellow" onRemove={() => onColorChange("")} />}
            {hasFilters && (
              <button onClick={onResetFilters} className="shrink-0 text-[10px] text-white/25 hover:text-white/60 transition-colors">
                ✕ Сброс
              </button>
            )}
          </div>
        </div>
      )}

      {/* Панель фильтров — выдвигается снизу строки поиска */}
      {filterPanelOpen && (
        <div className="border-t border-white/5 bg-[#0D0D0D] px-4 pb-4 pt-3 space-y-4 max-h-[70vh] overflow-y-auto">

          {/* Наличие */}
          <FilterSection label="Наличие">
            <div className="flex gap-2">
              {[
                { val: "", label: "Все" },
                { val: "in_stock", label: "Есть в наличии" },
                { val: "on_order", label: "Под заказ" },
              ].map(f => (
                <button key={f.val} onClick={() => onAvail(f.val)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                    filterAvail === f.val
                      ? "bg-[#FFD700] text-black border-[#FFD700] font-semibold"
                      : "border-white/10 text-white/50 hover:text-white hover:border-white/25"
                  }`}>
                  {f.label}
                </button>
              ))}
            </div>
          </FilterSection>

          {/* Тип SIM */}
          {simTypesInCategory.length > 0 && onSimTypeChange && (
            <FilterSection label="Тип SIM">
              <div className="flex gap-2 flex-wrap">
                {simTypesInCategory.map(s => (
                  <button key={s} onClick={() => onSimTypeChange(s)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                      activeSimType === s
                        ? "bg-[#FFD700] text-black border-[#FFD700] font-semibold"
                        : "border-white/10 text-white/50 hover:text-white hover:border-white/25"
                    }`}>
                    {s}
                  </button>
                ))}
                {activeSimType && (
                  <button onClick={() => onSimTypeChange("")}
                    className="text-xs px-2 py-1.5 text-white/25 hover:text-white">
                    <Icon name="X" size={11} />
                  </button>
                )}
              </div>
            </FilterSection>
          )}

          {/* Бренд */}
          {brandsInCategory.length > 1 && (
            <FilterSection label="Бренд">
              <div className="flex gap-2 flex-wrap">
                {brandsInCategory.map(b => (
                  <button key={b} onClick={() => onBrandChange(b)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                      activeBrand === b
                        ? "bg-white text-black border-white font-semibold"
                        : "border-white/10 text-white/50 hover:text-white hover:border-white/25"
                    }`}>
                    {b}
                  </button>
                ))}
              </div>
            </FilterSection>
          )}

          {/* Объём памяти */}
          {storagesInCategory.length > 0 && (
            <FilterSection label="Объём памяти">
              <div className="flex gap-2 flex-wrap">
                {storagesInCategory.map(s => (
                  <button key={s} onClick={() => onStorageChange(s)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-all font-medium ${
                      activeStorage === s
                        ? "bg-[#FFD700] text-black border-[#FFD700]"
                        : "border-white/10 text-white/50 hover:text-white hover:border-white/25"
                    }`}>
                    {s}
                  </button>
                ))}
              </div>
            </FilterSection>
          )}

          {/* Цвет */}
          {colorsInCategory.length > 0 && (
            <FilterSection label="Цвет">
              <div className="flex gap-2 flex-wrap">
                {colorsInCategory.map(c => (
                  <button key={c} onClick={() => onColorChange(c)}
                    className={`text-xs px-3 py-1.5 rounded-lg border capitalize transition-all ${
                      activeColor === c
                        ? "bg-[#FFD700] text-black border-[#FFD700] font-semibold"
                        : "border-white/10 text-white/50 hover:text-white hover:border-white/25"
                    }`}>
                    {c}
                  </button>
                ))}
              </div>
            </FilterSection>
          )}

          {/* Сброс */}
          {hasFilters && (
            <button onClick={() => { onResetFilters(); onFilterPanelToggle(); }}
              className="flex items-center gap-1.5 text-xs text-[#FFD700]/70 hover:text-[#FFD700] transition-colors">
              <Icon name="RotateCcw" size={12} />
              Сбросить все фильтры
            </button>
          )}
        </div>
      )}
    </nav>
  );
}

function FilterTag({ label, color, onRemove }: { label: string; color?: "yellow"|"green"|"blue"; onRemove: () => void }) {
  const colors = {
    yellow: "bg-[#FFD700]/15 text-[#FFD700] border-[#FFD700]/30",
    green:  "bg-green-500/10 text-green-400 border-green-500/20",
    blue:   "bg-blue-500/10 text-blue-400 border-blue-500/20",
  };
  const cls = colors[color || "yellow"] ?? colors.yellow;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-medium shrink-0 ${cls}`}>
      {label}
      <button onClick={onRemove} className="opacity-60 hover:opacity-100 transition-opacity ml-0.5">
        <Icon name="X" size={10} />
      </button>
    </span>
  );
}

function FilterSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-widest text-white/25 mb-2">{label}</div>
      {children}
    </div>
  );
}