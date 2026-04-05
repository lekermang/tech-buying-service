import Icon from "@/components/ui/icon";
import { CatalogItem, REGION_FLAG, MODEL_PHOTOS, CATEGORY_PHOTOS, PRICE_MARKUP, getColorHex } from "@/pages/catalog.types";

interface Props {
  item: CatalogItem;
  onBuy: (item: CatalogItem) => void;
  onAddToCart?: (item: CatalogItem) => void;
}

const CatalogProductCard = ({ item, onBuy, onAddToCart }: Props) => {
  const flag = item.region ? (REGION_FLAG[item.region] || "") : "";
  const inStock = item.availability === "in_stock";
  const title = [item.brand, item.model].filter(Boolean).join(" ");
  const sub = [item.storage, item.ram].filter(Boolean).join(" · ");
  const photo = item.photo_url || MODEL_PHOTOS[item.model] || CATEGORY_PHOTOS[item.category] || null;
  const colorHex = getColorHex(item.color);

  return (
    <div
      className="bg-[#111] rounded-2xl overflow-hidden group cursor-pointer flex flex-col hover:bg-[#161616] transition-all duration-300"
      onClick={() => onBuy(item)}
    >
      {/* Image area — закруглённые края */}
      <div className="relative bg-[#1A1A1A] m-2 rounded-xl aspect-square flex items-center justify-center overflow-hidden">
        {photo ? (
          <img
            src={photo}
            alt={title}
            className="w-4/5 h-4/5 object-contain group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <Icon name="Package" size={48} className="text-white/10" />
        )}

        {/* Stock badge */}
        <div className={`absolute top-2 left-2 text-[10px] font-medium px-2 py-0.5 rounded-full ${inStock ? "bg-green-900/70 text-green-400" : "bg-white/10 text-white/40"}`}>
          {inStock ? "В наличии" : "Под заказ"}
        </div>

        {flag && (
          <div className="absolute top-2 right-2 text-sm">{flag}</div>
        )}
      </div>

      {/* Info */}
      <div className="px-3 pb-3 flex flex-col flex-1">
        <div className="font-semibold text-white text-sm leading-snug mb-0.5 line-clamp-2">{title}</div>

        {sub && (
          <div className="text-white/35 text-xs mb-1">{sub}</div>
        )}

        {colorHex && (
          <div className="flex items-center gap-1.5 mt-1 mb-2">
            <div className="w-3 h-3 rounded-full border border-white/10" style={{ backgroundColor: colorHex }} />
            <span className="text-white/35 text-[11px] capitalize">{item.color}</span>
          </div>
        )}

        <div className="mt-auto pt-2 flex items-center justify-between">
          <div className="font-semibold text-[#FFD700] text-base">
            {item.price
              ? `${(item.price + PRICE_MARKUP).toLocaleString("ru-RU")} ₽`
              : <span className="text-white/25 text-sm font-normal">По запросу</span>
            }
          </div>
          {flag && <span className="text-[10px] text-white/20">{item.region}</span>}
        </div>

        <div className="mt-2.5 flex gap-2">
          <button
            onClick={e => { e.stopPropagation(); onBuy(item); }}
            className="flex-1 bg-[#FFD700] hover:bg-yellow-400 text-black text-sm font-semibold py-2 rounded-xl transition-colors">
            Купить
          </button>
          {onAddToCart && (
            <button
              onClick={e => { e.stopPropagation(); onAddToCart(item); }}
              className="w-10 h-9 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-xl transition-colors shrink-0"
              title="В корзину">
              <Icon name="ShoppingCart" size={15} className="text-white/70" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CatalogProductCard;