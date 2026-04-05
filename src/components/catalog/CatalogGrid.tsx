import Icon from "@/components/ui/icon";
import CatalogProductCard from "@/components/catalog/CatalogProductCard";
import { CatalogItem, REGION_FLAG, MODEL_PHOTOS, CATEGORY_PHOTOS, PRICE_MARKUP } from "@/pages/catalog.types";
import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation";

// Мобильная карточка-строка
const CatalogRowCard = ({ item, onBuy }: { item: CatalogItem; onBuy: (item: CatalogItem) => void }) => {
  const flag = item.region ? (REGION_FLAG[item.region] || "") : "";
  const inStock = item.availability === "in_stock";
  const title = [item.brand, item.model].filter(Boolean).join(" ");
  const sub = [item.storage, item.color].filter(Boolean).join(" · ");
  const photo = item.photo_url || MODEL_PHOTOS[item.model] || CATEGORY_PHOTOS[item.category] || null;
  return (
    <div className="bg-[#111] rounded-xl flex items-center gap-3 px-3 py-2.5 active:bg-[#181818] transition-all cursor-pointer" onClick={() => onBuy(item)}>
      <div className="w-14 h-14 shrink-0 bg-[#1A1A1A] rounded-lg flex items-center justify-center overflow-hidden">
        {photo ? <img src={photo} alt={title} className="w-11 h-11 object-contain" /> : <Icon name="Package" size={24} className="text-white/10" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-white text-sm leading-snug truncate">{title}</div>
        {sub && <div className="text-white/40 text-xs mt-0.5 truncate">{sub}</div>}
        <div className="flex items-center gap-1.5 mt-1">
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${inStock ? "bg-green-900/60 text-green-400" : "bg-white/8 text-white/35"}`}>
            {inStock ? "Есть" : "Заказ"}
          </span>
          {flag && <span className="text-xs">{flag}</span>}
        </div>
      </div>
      <div className="shrink-0 flex flex-col items-end gap-2">
        <div className="font-bold text-[#FFD700] text-sm whitespace-nowrap">
          {item.price ? `${(item.price + PRICE_MARKUP).toLocaleString("ru-RU")} ₽` : "По запросу"}
        </div>
        <button onClick={e => { e.stopPropagation(); onBuy(item); }} className="bg-[#FFD700] text-black text-xs font-semibold px-3 py-1.5 rounded-lg active:bg-yellow-400">
          Купить
        </button>
      </div>
    </div>
  );
};

interface CatalogGridProps {
  filteredItems: CatalogItem[];
  brandsInCategory: string[];
  loading: boolean;
  search: string;
  activeBrand: string;
  activeCategory: string;
  activeStorage: string;
  activeColor: string;
  activeFiltersCount: number;
  onBuy: (item: CatalogItem) => void;
  onAddToCart: (item: CatalogItem) => void;
  onBrandChange: (brand: string) => void;
  onStorageReset: () => void;
  onColorReset: () => void;
  onResetFilters: () => void;
  onCategory: (cat: string) => void;
}

export default function CatalogGrid({
  filteredItems, brandsInCategory, loading, search,
  activeBrand, activeCategory, activeStorage, activeColor,
  activeFiltersCount, onBuy, onAddToCart, onBrandChange, onStorageReset, onColorReset, onResetFilters, onCategory,
}: CatalogGridProps) {

  return (
    <BackgroundGradientAnimation
      containerClassName="flex-1 min-w-0"
      gradientBackgroundStart="rgb(10, 10, 20)"
      gradientBackgroundEnd="rgb(5, 5, 13)"
      firstColor="99, 102, 241"
      secondColor="139, 92, 246"
      thirdColor="6, 182, 212"
      fourthColor="255, 215, 0"
      fifthColor="16, 185, 129"
      pointerColor="255, 215, 0"
      size="50%"
      blendingValue="soft-light"
      interactive
    >
    <main className="relative z-10 px-3 sm:px-4 lg:px-6 py-4 sm:py-5">

      {/* Заголовок */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-lg sm:text-xl font-semibold text-white">
            {search ? `«${search}»` : activeBrand || activeCategory || "Все товары"}
          </h1>
          {!loading && (
            <span className="text-sm text-white/25">{filteredItems.length} шт.</span>
          )}
        </div>
        {activeFiltersCount > 0 && (
          <button onClick={onResetFilters} className="text-xs text-white/30 hover:text-white flex items-center gap-1 transition-colors shrink-0">
            <Icon name="X" size={11} /> Сбросить
          </button>
        )}
      </div>

      {/* Быстрые бренды (планшет/мобилка) */}
      {brandsInCategory.length > 1 && !search && (
        <div className="lg:hidden flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
          <button onClick={() => onBrandChange("")}
            className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition-all font-medium ${!activeBrand ? "bg-[#FFD700] text-black border-[#FFD700]" : "border-white/10 text-white/40 hover:text-white"}`}>
            Все
          </button>
          {brandsInCategory.map(brand => (
            <button key={brand} onClick={() => onBrandChange(brand)}
              className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition-all font-medium whitespace-nowrap ${activeBrand === brand ? "bg-white text-black border-white" : "border-white/10 text-white/40 hover:text-white"}`}>
              {brand}
            </button>
          ))}
        </div>
      )}

      {/* Активные фильтры-теги */}
      {(activeStorage || activeColor) && (
        <div className="flex gap-2 mb-3 flex-wrap">
          {activeStorage && (
            <span className="flex items-center gap-1 text-xs bg-[#FFD700]/15 text-[#FFD700] border border-[#FFD700]/30 px-2.5 py-1 rounded-full">
              {activeStorage}
              <button onClick={onStorageReset}><Icon name="X" size={10} /></button>
            </span>
          )}
          {activeColor && (
            <span className="flex items-center gap-1 text-xs bg-[#FFD700]/15 text-[#FFD700] border border-[#FFD700]/30 px-2.5 py-1 rounded-full capitalize">
              {activeColor}
              <button onClick={onColorReset}><Icon name="X" size={10} /></button>
            </span>
          )}
        </div>
      )}

      {/* Skeleton при первой загрузке */}
      {loading && filteredItems.length === 0 && (
        <>
          <div className="flex flex-col gap-2 sm:hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-[#111] rounded-xl flex gap-3 p-3 animate-pulse">
                <div className="w-14 h-14 bg-[#1A1A1A] rounded-lg shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-3 bg-[#1A1A1A] rounded w-3/4" />
                  <div className="h-3 bg-[#1A1A1A] rounded w-1/2" />
                  <div className="h-4 bg-[#1A1A1A] rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
          <div className="hidden sm:grid sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="bg-[#111] rounded-2xl overflow-hidden animate-pulse">
                <div className="m-2 aspect-square bg-[#1A1A1A] rounded-xl" />
                <div className="px-3 pb-3 space-y-2">
                  <div className="h-3 bg-[#1A1A1A] rounded w-full" />
                  <div className="h-3 bg-[#1A1A1A] rounded w-2/3" />
                  <div className="h-5 bg-[#1A1A1A] rounded w-1/2 mt-3" />
                  <div className="h-8 bg-[#1A1A1A] rounded mt-2" />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {!loading && filteredItems.length === 0 ? (
        <div className="text-center py-28">
          <Icon name="Search" size={44} className="text-white/10 mx-auto mb-4" />
          <p className="text-white/30 text-lg font-medium">Ничего не найдено</p>
          <button onClick={onResetFilters} className="mt-4 text-sm text-[#FFD700] hover:underline">
            Сбросить фильтры
          </button>
        </div>
      ) : !loading ? (
        <>
          {/* Мобилка — строки */}
          <div className="flex flex-col gap-2 sm:hidden">
            {filteredItems.map(item => <CatalogRowCard key={item.id} item={item} onBuy={onBuy} />)}
          </div>
          {/* Планшет и десктоп — сетка */}
          <div className="hidden sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
            {filteredItems.map(item => <CatalogProductCard key={item.id} item={item} onBuy={onBuy} onAddToCart={onAddToCart} />)}
          </div>
        </>
      ) : null}
    </main>
    </BackgroundGradientAnimation>
  );
}