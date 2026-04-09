import { memo, useState, useRef, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { CatalogItem, REGION_FLAG, MODEL_PHOTOS, MODEL_PHOTOS_EXTRA, CATEGORY_PHOTOS, PRICE_MARKUP, getColorHex } from "@/pages/catalog.types";

interface Props {
  item: CatalogItem;
  onBuy: (item: CatalogItem) => void;
  onAddToCart?: (item: CatalogItem) => void;
}

const CatalogProductCard = memo(function CatalogProductCard({ item, onBuy, onAddToCart }: Props) {
  const flag = item.region ? (REGION_FLAG[item.region] || "") : "";
  const inStock = item.availability === "in_stock";
  const title = [item.brand, item.model].filter(Boolean).join(" ");
  const sub = [item.storage, item.ram].filter(Boolean).join(" · ");
  const mainPhoto = item.photo_url || MODEL_PHOTOS[item.model] || CATEGORY_PHOTOS[item.category] || null;
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
    }, 3000);
    return stopAuto;
  }, [allPhotos.length, stopAuto]);

  const goNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    stopAuto();
    setPhotoIdx(i => (i + 1) % allPhotos.length);
    setImgLoaded(false);
  };
  const goPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    stopAuto();
    setPhotoIdx(i => (i - 1 + allPhotos.length) % allPhotos.length);
    setImgLoaded(false);
  };
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || allPhotos.length < 2) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) {
      setPhotoIdx(i => dx < 0 ? (i + 1) % allPhotos.length : (i - 1 + allPhotos.length) % allPhotos.length);
      setImgLoaded(false);
    }
    touchStartX.current = null;
  };

  const currentPhoto = allPhotos[photoIdx] || null;

  return (
    <div
      className="bg-[#111] rounded-2xl overflow-hidden group cursor-pointer flex flex-col hover:bg-[#161616] transition-all duration-200"
      onClick={() => onBuy(item)}
      onMouseEnter={stopAuto}
      onMouseLeave={() => {
        if (allPhotos.length < 2) return;
        autoRef.current = setInterval(() => {
          setPhotoIdx(i => (i + 1) % allPhotos.length);
          setImgLoaded(false);
        }, 3000);
      }}
    >
      {/* Image */}
      <div
        className="relative bg-[#1A1A1A] m-2 rounded-xl aspect-square flex items-center justify-center overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {currentPhoto ? (
          <>
            {!imgLoaded && <div className="absolute inset-0 bg-[#1A1A1A] animate-pulse" />}
            <img
              key={currentPhoto}
              src={currentPhoto}
              alt={title}
              loading="lazy"
              decoding="async"
              className={`w-4/5 h-4/5 object-contain transition-all duration-300 ${imgLoaded ? "opacity-100" : "opacity-0"} ${allPhotos.length < 2 ? "group-hover:scale-105 duration-400" : ""}`}
              onLoad={() => setImgLoaded(true)}
            />
          </>
        ) : (
          <Icon name="Package" size={48} className="text-white/10" />
        )}

        {/* Стрелки навигации — только если >1 фото */}
        {allPhotos.length > 1 && (
          <>
            <button
              onClick={goPrev}
              className="absolute left-1 top-1/2 -translate-y-1/2 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <Icon name="ChevronLeft" size={12} className="text-white" />
            </button>
            <button
              onClick={goNext}
              className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <Icon name="ChevronRight" size={12} className="text-white" />
            </button>
            {/* Точки */}
            <div className="absolute bottom-1.5 left-0 right-0 flex justify-center gap-1">
              {allPhotos.map((_, i) => (
                <button
                  key={i}
                  onClick={e => { e.stopPropagation(); setPhotoIdx(i); setImgLoaded(false); }}
                  className={`rounded-full transition-all ${i === photoIdx ? "w-3 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/30"}`}
                />
              ))}
            </div>
          </>
        )}

        <div className={`absolute top-2 left-2 text-[10px] font-medium px-2 py-0.5 rounded-full ${inStock ? "bg-green-900/70 text-green-400" : "bg-white/10 text-white/40"}`}>
          {inStock ? "Есть" : "Заказ"}
        </div>
        {flag && <div className="absolute top-2 right-2 text-sm">{flag}</div>}
      </div>

      {/* Info */}
      <div className="px-3 pb-3 flex flex-col flex-1">
        <div className="font-semibold text-white text-sm leading-snug mb-0.5 line-clamp-2">{title}</div>

        {sub && <div className="text-white/35 text-xs mb-1">{sub}</div>}

        {item.sim_type && (
          <div className="inline-flex items-center gap-1 mb-1">
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/8 text-white/40">{item.sim_type}</span>
          </div>
        )}

        {colorHex && (
          <div className="flex items-center gap-1.5 mt-1 mb-1.5">
            <div className="w-3 h-3 rounded-full border border-white/10 shrink-0" style={{ backgroundColor: colorHex }} />
            <span className="text-white/35 text-[11px] capitalize truncate">{item.color}</span>
          </div>
        )}

        <div className="mt-auto pt-1.5 flex items-center justify-between">
          <div className="font-semibold text-[#FFD700] text-base">
            {item.price
              ? `${(item.price + PRICE_MARKUP).toLocaleString("ru-RU")} ₽`
              : <span className="text-white/25 text-sm font-normal">По запросу</span>
            }
          </div>
          {flag && <span className="text-[10px] text-white/20">{item.region}</span>}
        </div>

        <div className="mt-2 flex gap-2">
          <button
            onClick={e => { e.stopPropagation(); onBuy(item); }}
            className="flex-1 bg-[#FFD700] hover:bg-yellow-400 text-black text-sm font-semibold py-2 rounded-xl transition-colors">
            Купить
          </button>
          {onAddToCart && (
            <button
              onClick={e => { e.stopPropagation(); onAddToCart(item); }}
              className="w-9 h-9 flex items-center justify-center bg-white/8 hover:bg-white/15 rounded-xl transition-colors shrink-0">
              <Icon name="ShoppingCart" size={14} className="text-white/60" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

export default CatalogProductCard;