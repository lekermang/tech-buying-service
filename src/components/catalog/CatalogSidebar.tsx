import Icon from "@/components/ui/icon";
import { CatalogItem } from "@/pages/catalog.types";
import { CATEGORY_ICONS, BRAND_PRIORITY } from "@/components/catalog/catalog.utils";

interface CatalogSidebarProps {
  categories: string[];
  activeCategory: string;
  activeBrand: string;
  activeStorage: string;
  activeColor: string;
  activeFiltersCount: number;
  search: string;
  items: CatalogItem[];
  brandsInCategory: string[];
  storagesInCategory: string[];
  colorsInCategory: string[];
  sidebarOpen: boolean;
  onCategory: (cat: string) => void;
  onBrandChange: (brand: string) => void;
  onStorageChange: (storage: string) => void;
  onColorChange: (color: string) => void;
  onResetFilters: () => void;
  onSidebarClose: () => void;
}

export default function CatalogSidebar({
  categories, activeCategory, activeBrand, activeStorage, activeColor,
  activeFiltersCount, search, items,
  brandsInCategory, storagesInCategory, colorsInCategory,
  sidebarOpen, onCategory, onBrandChange, onStorageChange, onColorChange,
  onResetFilters, onSidebarClose,
}: CatalogSidebarProps) {
  return (
    <>
      {/* Левый сайдбар (desktop lg+) */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto border-r border-white/5 py-4">

        <div className="px-4 mb-2">
          <span className="text-[10px] uppercase tracking-widest text-white/20 font-medium">Категории</span>
        </div>
        {categories.map(cat => (
          <button key={cat} onClick={() => onCategory(cat)}
            className={`flex items-center gap-2.5 px-3 py-2 mx-2 rounded-lg text-sm transition-all text-left ${activeCategory === cat ? "bg-[#FFD700]/10 text-[#FFD700] font-medium" : "text-white/40 hover:text-white hover:bg-white/5"}`}>
            <Icon name={CATEGORY_ICONS[cat] || "Package"} size={15} className={activeCategory === cat ? "text-[#FFD700]" : "text-white/30"} />
            <span className="flex-1 truncate">{cat}</span>
          </button>
        ))}

        {brandsInCategory.length > 1 && !search && (
          <>
            <div className="px-4 mt-5 mb-2">
              <span className="text-[10px] uppercase tracking-widest text-white/20 font-medium">Бренд</span>
            </div>
            {brandsInCategory.map(brand => (
              <button key={brand} onClick={() => onBrandChange(brand)}
                className={`flex items-center justify-between px-3 py-1.5 mx-2 rounded-lg text-sm transition-all ${activeBrand === brand ? "bg-white/10 text-white font-medium" : "text-white/40 hover:text-white hover:bg-white/5"}`}>
                <span>{brand}</span>
                <span className="text-xs text-white/20">{items.filter(i => i.brand === brand).length}</span>
              </button>
            ))}
          </>
        )}

        {storagesInCategory.length > 0 && !search && (
          <>
            <div className="px-4 mt-5 mb-2">
              <span className="text-[10px] uppercase tracking-widest text-white/20 font-medium">Объём памяти</span>
            </div>
            <div className="px-3 flex flex-wrap gap-1.5">
              {storagesInCategory.map(s => (
                <button key={s} onClick={() => onStorageChange(s)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${activeStorage === s ? "bg-[#FFD700] text-black border-[#FFD700] font-semibold" : "border-white/10 text-white/40 hover:text-white hover:border-white/30"}`}>
                  {s}
                </button>
              ))}
            </div>
          </>
        )}

        {colorsInCategory.length > 0 && !search && (
          <>
            <div className="px-4 mt-5 mb-2">
              <span className="text-[10px] uppercase tracking-widest text-white/20 font-medium">Цвет</span>
            </div>
            <div className="px-3 flex flex-wrap gap-1.5">
              {colorsInCategory.map(c => (
                <button key={c} onClick={() => onColorChange(c)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-all capitalize ${activeColor === c ? "bg-[#FFD700] text-black border-[#FFD700] font-semibold" : "border-white/10 text-white/40 hover:text-white hover:border-white/30"}`}>
                  {c}
                </button>
              ))}
            </div>
          </>
        )}

        {activeFiltersCount > 0 && (
          <button onClick={onResetFilters} className="mx-3 mt-4 text-xs text-white/30 hover:text-white flex items-center gap-1 transition-colors">
            <Icon name="X" size={11} /> Сбросить фильтры
          </button>
        )}
      </aside>

      {/* Мобильный drawer */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onSidebarClose} />
          <div className="relative bg-[#111] w-72 max-w-[82vw] h-full overflow-y-auto flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-4 py-4 border-b border-white/8">
              <span className="font-semibold text-white">Категории</span>
              <button onClick={onSidebarClose} className="text-white/40 hover:text-white p-1">
                <Icon name="X" size={18} />
              </button>
            </div>
            <div className="py-2 flex-1">
              {categories.map(cat => (
                <button key={cat} onClick={() => onCategory(cat)}
                  className={`flex items-center gap-3 w-full px-4 py-3 text-sm transition-all text-left ${activeCategory === cat ? "bg-[#FFD700]/10 text-[#FFD700] font-medium border-r-2 border-[#FFD700]" : "text-white/50 hover:text-white hover:bg-white/5"}`}>
                  <Icon name={CATEGORY_ICONS[cat] || "Package"} size={16} className={activeCategory === cat ? "text-[#FFD700]" : "text-white/30"} />
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
