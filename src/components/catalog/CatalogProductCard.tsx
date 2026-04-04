import Icon from "@/components/ui/icon";
import { CatalogItem, REGION_FLAG, MODEL_PHOTOS, CATEGORY_PHOTOS, PRICE_MARKUP, getColorHex } from "@/pages/catalog.types";

interface Props {
  item: CatalogItem;
  onBuy: (item: CatalogItem) => void;
}

const CatalogProductCard = ({ item, onBuy }: Props) => {
  const flag = item.region ? (REGION_FLAG[item.region] || "") : "";
  const inStock = item.availability === "in_stock";
  const title = [item.brand, item.model].filter(Boolean).join(" ");
  const sub = [item.storage, item.ram].filter(Boolean).join(" · ");
  const photo = item.photo_url || MODEL_PHOTOS[item.model] || CATEGORY_PHOTOS[item.category] || null;
  const colorHex = getColorHex(item.color);

  return (
    <div
      className="bg-white rounded-2xl overflow-hidden group cursor-pointer flex flex-col hover:shadow-xl transition-all duration-300"
      onClick={() => onBuy(item)}
    >
      {/* Image area */}
      <div className="relative bg-[#f5f5f7] aspect-square flex items-center justify-center overflow-hidden">
        {photo ? (
          <img
            src={photo}
            alt={title}
            className="w-4/5 h-4/5 object-contain group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <Icon name="Package" size={48} className="text-[#1d1d1f]/10" />
        )}

        {/* Stock badge */}
        <div className={`absolute top-3 left-3 text-[10px] font-medium px-2 py-0.5 rounded-full ${inStock ? "bg-green-100 text-green-700" : "bg-[#1d1d1f]/8 text-[#1d1d1f]/50"}`}>
          {inStock ? "В наличии" : "Под заказ"}
        </div>

        {flag && (
          <div className="absolute top-3 right-3 text-sm">{flag}</div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1">
        <div className="font-semibold text-[#1d1d1f] text-sm leading-snug mb-0.5 line-clamp-2">{title}</div>

        {sub && (
          <div className="text-[#1d1d1f]/40 text-xs mb-1">{sub}</div>
        )}

        {colorHex && (
          <div className="flex items-center gap-1.5 mt-1 mb-2">
            <div className="w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: colorHex }} />
            <span className="text-[#1d1d1f]/40 text-[11px] capitalize">{item.color}</span>
          </div>
        )}

        <div className="mt-auto pt-3 flex items-center justify-between">
          <div className="font-semibold text-[#1d1d1f] text-base">
            {item.price
              ? `${(item.price + PRICE_MARKUP).toLocaleString("ru-RU")} ₽`
              : <span className="text-[#1d1d1f]/30 text-sm font-normal">По запросу</span>
            }
          </div>
          {flag && <span className="text-[10px] text-[#1d1d1f]/25">{item.region}</span>}
        </div>

        <button
          onClick={e => { e.stopPropagation(); onBuy(item); }}
          className="mt-3 w-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-sm font-medium py-2 rounded-xl transition-colors">
          Купить
        </button>
      </div>
    </div>
  );
};

export default CatalogProductCard;
