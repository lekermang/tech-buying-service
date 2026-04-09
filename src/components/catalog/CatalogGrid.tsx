import { useState } from "react";
import Icon from "@/components/ui/icon";
import CatalogProductCard from "@/components/catalog/CatalogProductCard";
import { CatalogItem, REGION_FLAG, MODEL_PHOTOS, CATEGORY_PHOTOS, PRICE_MARKUP, getColorHex } from "@/pages/catalog.types";

// ─── Карточка-строка (список) ──────────────────────────────────────
const ListCard = ({ item, onBuy }: { item: CatalogItem; onBuy: (i: CatalogItem) => void }) => {
  const flag = item.region ? (REGION_FLAG[item.region] || "") : "";
  const inStock = item.availability === "in_stock";
  const photo = item.photo_url || MODEL_PHOTOS[item.model] || CATEGORY_PHOTOS[item.category] || null;
  const price = item.price ? (item.price + PRICE_MARKUP).toLocaleString("ru-RU") + " ₽" : "По запросу";
  const colorHex = getColorHex(item.color);

  return (
    <div
      onClick={() => onBuy(item)}
      className="flex items-center gap-3 px-4 py-3 border-b border-white/5 last:border-0 cursor-pointer hover:bg-white/3 active:bg-white/5 transition-colors group"
    >
      {/* Фото */}
      <div className="w-14 h-14 shrink-0 bg-[#111] rounded-xl flex items-center justify-center overflow-hidden">
        {photo
          ? <img src={photo} alt={item.model} className="w-11 h-11 object-contain" loading="lazy" />
          : <Icon name="Smartphone" size={22} className="text-white/10" />
        }
      </div>

      {/* Инфо */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          {flag && <span className="text-xs">{flag}</span>}
          {item.sim_type && (
            <span className="text-[9px] font-medium px-1.5 py-px rounded bg-white/8 text-white/40">{item.sim_type}</span>
          )}
        </div>
        <div className="text-white font-medium text-sm leading-tight line-clamp-1">
          {item.brand} {item.model}
        </div>
        <div className="flex items-center gap-2 mt-1">
          {item.storage && (
            <span className="text-[11px] text-white/40 font-medium">{item.storage}</span>
          )}
          {item.color && (
            <span className="flex items-center gap-1 text-[11px] text-white/40 capitalize">
              {colorHex && <span className="w-2.5 h-2.5 rounded-full inline-block border border-white/10" style={{ background: colorHex }} />}
              {item.color}
            </span>
          )}
        </div>
      </div>

      {/* Цена + кнопка */}
      <div className="shrink-0 flex flex-col items-end gap-2">
        <div className={`text-sm font-bold ${inStock ? "text-[#FFD700]" : "text-white/50"}`}>{price}</div>
        <div className="flex items-center gap-1.5">
          <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${inStock ? "bg-green-500/15 text-green-400" : "bg-white/8 text-white/35"}`}>
            {inStock ? "В наличии" : "Заказ"}
          </span>
          <button
            onClick={e => { e.stopPropagation(); onBuy(item); }}
            className="text-[11px] font-bold bg-[#FFD700] text-black px-3 py-1 rounded-lg hover:bg-yellow-400 transition-colors active:scale-95"
          >
            Купить
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Skeleton ─────────────────────────────────────────────────────
const Skeleton = ({ mode }: { mode: "grid" | "list" }) => (
  <>
    {mode === "list" ? (
      <div className="flex flex-col">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-white/5 animate-pulse">
            <div className="w-14 h-14 bg-white/5 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-white/5 rounded w-2/3" />
              <div className="h-3 bg-white/5 rounded w-1/2" />
            </div>
            <div className="w-20 h-8 bg-white/5 rounded-lg shrink-0" />
          </div>
        ))}
      </div>
    ) : (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 p-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="bg-white/3 rounded-2xl overflow-hidden animate-pulse">
            <div className="m-2 aspect-square bg-white/5 rounded-xl" />
            <div className="px-3 pb-4 space-y-2">
              <div className="h-3 bg-white/5 rounded w-full" />
              <div className="h-3 bg-white/5 rounded w-2/3" />
              <div className="h-5 bg-white/5 rounded w-1/2 mt-3" />
              <div className="h-9 bg-white/5 rounded mt-2" />
            </div>
          </div>
        ))}
      </div>
    )}
  </>
);

// ─── Props ────────────────────────────────────────────────────────
interface Props {
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

// ─── Main ─────────────────────────────────────────────────────────
export default function CatalogGrid({
  filteredItems, brandsInCategory, loading, search,
  activeBrand, activeCategory, activeStorage, activeColor,
  activeFiltersCount, onBuy, onAddToCart, onBrandChange,
  onStorageReset, onColorReset, onResetFilters,
}: Props) {
  const [mode, setMode] = useState<"grid" | "list">("grid");

  return (
    <div className="flex-1 min-w-0 min-h-screen bg-black">

      {/* ── Шапка ── */}
      <div className="sticky top-[48px] z-30 bg-black/95 backdrop-blur-xl border-b border-white/5 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {!loading && (
            <span className="text-white/35 text-xs">
              {filteredItems.length > 0 ? `${filteredItems.length} товаров` : ""}
            </span>
          )}
          {/* Быстрые бренды */}
          {brandsInCategory.length > 1 && !search && (
            <div className="flex gap-1 overflow-x-auto scrollbar-hide ml-2">
              {["", ...brandsInCategory].map(b => (
                <button key={b || "all"} onClick={() => onBrandChange(b)}
                  className={`shrink-0 text-[11px] font-medium px-2.5 py-1 rounded-full transition-all ${
                    activeBrand === b
                      ? "bg-white text-black"
                      : "text-white/40 hover:text-white"
                  }`}>
                  {b || "Все"}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Переключатель вид */}
        <div className="flex items-center gap-1 bg-white/5 rounded-lg p-0.5 shrink-0">
          <button
            onClick={() => setMode("grid")}
            className={`p-1.5 rounded-md transition-all ${mode === "grid" ? "bg-white/15 text-white" : "text-white/30 hover:text-white/60"}`}
          >
            <Icon name="LayoutGrid" size={14} />
          </button>
          <button
            onClick={() => setMode("list")}
            className={`p-1.5 rounded-md transition-all ${mode === "list" ? "bg-white/15 text-white" : "text-white/30 hover:text-white/60"}`}
          >
            <Icon name="List" size={14} />
          </button>
        </div>
      </div>

      {/* ── Контент ── */}
      {loading && filteredItems.length === 0 ? (
        <Skeleton mode={mode} />
      ) : filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 px-6 text-center">
          <Icon name="SearchX" size={48} className="text-white/10 mb-4" />
          <p className="text-white/30 text-lg font-medium mb-2">Ничего не найдено</p>
          <p className="text-white/20 text-sm mb-6">Попробуйте изменить фильтры или поисковый запрос</p>
          {activeFiltersCount > 0 && (
            <button onClick={onResetFilters}
              className="text-sm font-semibold text-black bg-[#FFD700] hover:bg-yellow-400 px-5 py-2.5 rounded-full transition-colors">
              Сбросить фильтры
            </button>
          )}
        </div>
      ) : mode === "list" ? (
        /* ── СПИСОК ── */
        <div className="divide-y divide-white/0">
          {filteredItems.map(item => (
            <ListCard key={item.id} item={item} onBuy={onBuy} />
          ))}
        </div>
      ) : (
        /* ── СЕТКА ── */
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 p-4">
          {filteredItems.map(item => (
            <CatalogProductCard key={item.id} item={item} onBuy={onBuy} onAddToCart={onAddToCart} />
          ))}
        </div>
      )}
    </div>
  );
}
