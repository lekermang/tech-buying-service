import { memo, useState, useRef, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { CatalogItem, REGION_FLAG, MODEL_PHOTOS, MODEL_PHOTOS_EXTRA, MODEL_COLOR_PHOTOS, CATEGORY_PHOTOS, PRICE_MARKUP, getColorHex } from "@/pages/catalog.types";

interface Props {
  item: CatalogItem;
  onBuy: (item: CatalogItem) => void;
  onAddToCart?: (item: CatalogItem) => void;
}

const CatalogProductCard = memo(function CatalogProductCard({ item, onBuy, onAddToCart }: Props) {
  const flag = item.region ? (REGION_FLAG[item.region] || "") : "";
  const inStock = item.availability === "in_stock";

  // Фото: приоритет photo_url > цвет > модель > категория
  const colorKey = item.color ? `${item.model}::${item.color.toLowerCase()}` : null;
  const colorPhoto = colorKey ? (MODEL_COLOR_PHOTOS[colorKey] || null) : null;
  const mainPhoto = item.photo_url || colorPhoto || MODEL_PHOTOS[item.model] || CATEGORY_PHOTOS[item.category] || null;
  const extraPhotos = MODEL_PHOTOS_EXTRA[item.model] || [];
  const allPhotos = mainPhoto ? [mainPhoto, ...extraPhotos] : extraPhotos;

  const colorHex = getColorHex(item.color);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [imgLoaded, setImgLoaded] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopAuto = useCallback(() => {
    if (autoRef.current) { clearInterval(autoRef.current); autoRef.current = null; }
  }, []);

  useEffect(() => {
    if (allPhotos.length < 2) return;
    autoRef.current = setInterval(() => {
      setPhotoIdx(i => (i + 1) % allPhotos.length);
      setImgLoaded(false);
    }, 3500);
    return stopAuto;
  }, [allPhotos.length, stopAuto]);

  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || allPhotos.length < 2) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) {
      stopAuto();
      setPhotoIdx(i => dx < 0 ? (i + 1) % allPhotos.length : (i - 1 + allPhotos.length) % allPhotos.length);
      setImgLoaded(false);
    }
    touchStartX.current = null;
  };

  const currentPhoto = allPhotos[photoIdx] || null;
  const price = item.price ? (item.price + PRICE_MARKUP).toLocaleString("ru-RU") + " ₽" : "По запросу";

  return (
    <div
      className="group bg-[#0f0f0f] rounded-2xl overflow-hidden cursor-pointer flex flex-col hover:bg-[#141414] transition-colors duration-200 border border-white/5 hover:border-white/10"
      onClick={() => onBuy(item)}
      onMouseEnter={stopAuto}
      onMouseLeave={() => {
        if (allPhotos.length < 2) return;
        autoRef.current = setInterval(() => {
          setPhotoIdx(i => (i + 1) % allPhotos.length);
          setImgLoaded(false);
        }, 3500);
      }}
    >
      {/* ── Фото ── */}
      <div
        className="relative bg-[#0a0a0a] aspect-square flex items-center justify-center overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {currentPhoto ? (
          <>
            {!imgLoaded && <div className="absolute inset-0 bg-[#0a0a0a]" />}
            <img
              key={currentPhoto}
              src={currentPhoto}
              alt={item.model}
              loading="lazy"
              decoding="async"
              className={`w-3/4 h-3/4 object-contain transition-opacity duration-300 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
              onLoad={() => setImgLoaded(true)}
            />
          </>
        ) : (
          <Icon name="Smartphone" size={40} className="text-white/8" />
        )}

        {/* Бейдж наличия */}
        <div className={`absolute top-2.5 left-2.5 text-[9px] font-semibold px-2 py-0.5 rounded-full ${
          inStock ? "bg-green-500/20 text-green-400" : "bg-white/8 text-white/30"
        }`}>
          {inStock ? "В наличии" : "Под заказ"}
        </div>

        {/* Флаг региона */}
        {flag && <div className="absolute top-2.5 right-2.5 text-base leading-none">{flag}</div>}

        {/* SIM тип */}
        {item.sim_type && (
          <div className="absolute bottom-2.5 right-2.5 text-[8px] font-medium px-1.5 py-0.5 rounded bg-black/60 text-white/50 backdrop-blur-sm">
            {item.sim_type}
          </div>
        )}

        {/* Точки слайдера */}
        {allPhotos.length > 1 && (
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1">
            {allPhotos.map((_, i) => (
              <button
                key={i}
                onClick={e => { e.stopPropagation(); stopAuto(); setPhotoIdx(i); setImgLoaded(false); }}
                className="rounded-full transition-all"
                style={{
                  width: i === photoIdx ? 12 : 4,
                  height: 4,
                  background: i === photoIdx ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.3)",
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Инфо ── */}
      <div className="px-3.5 pt-3 pb-3.5 flex flex-col flex-1">

        {/* Модель */}
        <div className="text-white font-semibold text-sm leading-snug line-clamp-2 mb-1">
          {item.brand} {item.model}
        </div>

        {/* Память + цвет */}
        <div className="flex items-center gap-2 mb-auto">
          {item.storage && (
            <span className="text-[11px] text-white/40 font-medium">{item.storage}</span>
          )}
          {item.color && (
            <span className="flex items-center gap-1 text-[11px] text-white/35 capitalize">
              {colorHex && (
                <span className="w-2.5 h-2.5 rounded-full border border-white/15 shrink-0"
                  style={{ background: colorHex }} />
              )}
              {item.color}
            </span>
          )}
        </div>

        {/* Цена */}
        <div className="mt-2.5 flex items-center justify-between gap-2">
          <div className={`font-bold text-base ${inStock ? "text-[#FFD700]" : "text-white/40"}`}>
            {price}
          </div>
          {item.region && (
            <span className="text-[10px] text-white/20">{item.region}</span>
          )}
        </div>

        {/* Кнопки */}
        <div className="mt-2.5 flex gap-2">
          <button
            onClick={e => { e.stopPropagation(); onBuy(item); }}
            className="flex-1 bg-[#FFD700] hover:bg-yellow-400 active:bg-yellow-300 text-black text-[13px] font-bold py-2.5 rounded-xl transition-colors"
          >
            Купить
          </button>
          {onAddToCart && (
            <button
              onClick={e => { e.stopPropagation(); onAddToCart(item); }}
              className="w-10 h-10 flex items-center justify-center bg-white/6 hover:bg-white/12 active:bg-white/18 rounded-xl transition-colors"
            >
              <Icon name="ShoppingCart" size={15} className="text-white/50" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

export default CatalogProductCard;
