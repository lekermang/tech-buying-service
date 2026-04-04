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
  const sub = [item.ram, item.storage].filter(Boolean).join(" · ");
  const photo = item.photo_url || MODEL_PHOTOS[item.model] || CATEGORY_PHOTOS[item.category] || null;
  const colorHex = getColorHex(item.color);

  return (
    <div className="bg-[#111] border border-[#222] hover:border-[#FFD700]/30 transition-colors group relative flex flex-col">
      <div className="h-36 sm:h-44 md:h-48 bg-[#151515] relative overflow-hidden flex items-center justify-center">
        {photo ? (
          <img src={photo} alt={title}
            className="w-full h-full object-cover opacity-70 group-hover:opacity-90 group-hover:scale-105 transition-all duration-500" />
        ) : (
          <Icon name="Package" size={40} className="text-white/10" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-transparent" />

        <div className={`absolute top-2 left-2 font-roboto text-[10px] px-2 py-1 backdrop-blur-sm ${inStock ? "bg-green-900/70 text-green-400" : "bg-black/70 text-white/60"}`}>
          {inStock ? "✅ В наличии" : "🚗 Завтра"}
        </div>

        {flag && <div className="absolute top-2 right-2 text-base drop-shadow">{flag}</div>}

        {colorHex && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-sm">
            <div className="w-3 h-3 rounded-full border border-white/20 shrink-0" style={{ backgroundColor: colorHex }} />
            <span className="font-roboto text-white/70 text-[10px] capitalize">{item.color}</span>
          </div>
        )}
      </div>

      <div className="p-2.5 sm:p-4 flex flex-col flex-1">
        <div className="font-oswald font-bold text-sm sm:text-base uppercase leading-tight mb-0.5">{title}</div>
        {sub && <div className="font-roboto text-white/40 text-[10px] sm:text-xs mb-1">{sub}</div>}
        {!inStock && (
          <div className="font-roboto text-white/25 text-[9px] sm:text-[10px] mb-1 hidden sm:block">Доставка на следующий день (заказ до 17:00)</div>
        )}

        <div className="mt-auto">
          <div className="mb-2">
            {item.price ? (
              <span className="font-oswald font-bold text-base sm:text-xl text-[#FFD700]">
                {(item.price + PRICE_MARKUP).toLocaleString("ru-RU")} ₽
              </span>
            ) : (
              <span className="font-roboto text-white/30 text-xs sm:text-sm italic">Цену уточняйте</span>
            )}
          </div>
          <button onClick={() => onBuy(item)}
            className="w-full bg-[#FFD700] text-black font-oswald font-bold text-sm sm:text-base py-2.5 sm:py-3 uppercase tracking-wide hover:bg-yellow-400 active:scale-95 transition-all flex items-center justify-center gap-1.5">
            <Icon name="ShoppingCart" size={15} />
            Купить
          </button>
        </div>
      </div>
    </div>
  );
};

export default CatalogProductCard;