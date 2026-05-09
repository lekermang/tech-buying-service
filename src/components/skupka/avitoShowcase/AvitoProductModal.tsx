import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import AvitoImg from "../AvitoImg";
import { AvitoItem, formatPrice, LEAD_URL } from "./types";
import { formatPhone, isPhoneValid } from "@/lib/phoneFormat";

type Props = {
  item: AvitoItem;
  photoIdx: number;
  setPhotoIdx: (n: number) => void;
  onClose: () => void;
};

export default function AvitoProductModal({ item, photoIdx, setPhotoIdx, onClose }: Props) {
  const photos = item.photos && item.photos.length > 0 ? item.photos : item.main_photo ? [item.main_photo] : [];
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (zoomed) setZoomed(false);
        else onClose();
      }
      if (e.key === "ArrowLeft") setPhotoIdx(Math.max(0, photoIdx - 1));
      if (e.key === "ArrowRight") setPhotoIdx(Math.min(photos.length - 1, photoIdx + 1));
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [photoIdx, photos.length, onClose, setPhotoIdx, zoomed]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) {
      if (dx < 0 && photoIdx < photos.length - 1) setPhotoIdx(photoIdx + 1);
      if (dx > 0 && photoIdx > 0) setPhotoIdx(photoIdx - 1);
    }
    touchStartX.current = null;
  };

  const submit = async () => {
    if (!isPhoneValid(phone)) {
      alert("Введите номер целиком в формате +7 (___) ___-__-__");
      return;
    }
    setSending(true);
    try {
      await fetch(LEAD_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "avito-showcase",
          name: name.trim() || "Без имени",
          phone: phone.trim(),
          comment: `Заявка на товар: ${item.title} — ${item.price ? item.price.toLocaleString("ru-RU") + " ₽" : ""}\nID: ${item.avito_id}\nСсылка: ${item.url}`,
        }),
      });
      setDone(true);
    } catch {
      setDone(true);
    } finally {
      setSending(false);
    }
  };

  const share = async () => {
    const text = `${item.title} — ${formatPrice(item.price)}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: item.title, text, url: item.url });
      } catch {
        // ignore
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${text}\n${item.url}`);
      } catch {
        // ignore
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-lg max-h-[95vh] bg-gradient-to-br from-[#1a1a1a] to-[#0D0D0D] border-2 border-[#FFD700]/40 rounded-t-2xl sm:rounded-xl overflow-hidden flex flex-col shadow-[0_0_60px_rgba(255,215,0,0.3)] animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-4 duration-300"
        onClick={e => e.stopPropagation()}
      >
        <span aria-hidden className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(255,215,0,0.9), transparent)" }} />

        <button
          onClick={onClose}
          className="absolute top-2 right-2 z-20 w-9 h-9 rounded-full bg-black/70 backdrop-blur border border-[#FFD700]/30 flex items-center justify-center text-white hover:bg-[#FFD700] hover:text-black transition-all"
        >
          <Icon name="X" size={18} />
        </button>

        <button
          onClick={share}
          className="absolute top-2 right-12 z-20 w-9 h-9 rounded-full bg-black/70 backdrop-blur border border-[#FFD700]/30 flex items-center justify-center text-white hover:bg-[#FFD700] hover:text-black transition-all"
          title="Поделиться"
        >
          <Icon name="Share2" size={16} />
        </button>

        <div
          className="relative bg-black aspect-square sm:aspect-[4/3] shrink-0 select-none"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {photos.length > 0 ? (
            <>
              <button
                onClick={() => setZoomed(true)}
                className="block w-full h-full"
                title="Увеличить"
              >
                <AvitoImg
                  src={photos[photoIdx]}
                  alt={item.title}
                  width={800}
                  priority
                  fit="contain"
                  className="w-full h-full"
                  sizes="(max-width: 640px) 100vw, 512px"
                />
              </button>
              {photos.length > 1 && (
                <>
                  <button
                    onClick={() => setPhotoIdx(Math.max(0, photoIdx - 1))}
                    disabled={photoIdx === 0}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/70 backdrop-blur border border-[#FFD700]/30 flex items-center justify-center text-white disabled:opacity-30 hover:bg-[#FFD700] hover:text-black transition-all"
                  >
                    <Icon name="ChevronLeft" size={18} />
                  </button>
                  <button
                    onClick={() => setPhotoIdx(Math.min(photos.length - 1, photoIdx + 1))}
                    disabled={photoIdx === photos.length - 1}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/70 backdrop-blur border border-[#FFD700]/30 flex items-center justify-center text-white disabled:opacity-30 hover:bg-[#FFD700] hover:text-black transition-all"
                  >
                    <Icon name="ChevronRight" size={18} />
                  </button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 bg-black/40 backdrop-blur px-2 py-1 rounded-full border border-white/10">
                    {photos.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setPhotoIdx(i)}
                        className={`h-1.5 rounded-full transition-all ${
                          i === photoIdx ? "w-6 bg-[#FFD700]" : "w-1.5 bg-white/40"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
              <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur text-white/80 font-roboto text-[10px] px-2 py-0.5 rounded-full border border-white/10 flex items-center gap-1 pointer-events-none">
                <Icon name="ZoomIn" size={10} />
                Увеличить
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Icon name="ImageOff" size={48} className="text-white/20" />
            </div>
          )}
          <div className="absolute top-2 left-2">
            <span className="bg-gradient-to-r from-[#FFD700] to-[#FFE55C] text-black font-oswald font-bold text-[11px] px-2 py-1 rounded uppercase tracking-wide shadow-[0_2px_8px_rgba(255,215,0,0.4)]">
              В наличии
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 scrollbar-premium">
          <div className="font-oswald font-bold text-3xl text-[#FFD700] leading-none drop-shadow-[0_0_12px_rgba(255,215,0,0.45)]">
            {formatPrice(item.price)}
          </div>
          <h3 className="font-oswald font-bold text-white text-lg mt-2 leading-tight">
            {item.title}
          </h3>
          {item.category && (
            <div className="font-roboto text-[10px] text-[#FFD700]/70 mt-1 uppercase tracking-wider">
              {item.category}
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 mt-3">
            <div className="bg-white/5 border border-white/10 rounded-lg p-2 text-center">
              <Icon name="ShieldCheck" size={14} className="text-[#FFD700] mx-auto mb-0.5" />
              <div className="font-roboto text-[9px] text-white/80 leading-tight">Гарантия 1 год</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-2 text-center">
              <Icon name="BadgeCheck" size={14} className="text-[#FFD700] mx-auto mb-0.5" />
              <div className="font-roboto text-[9px] text-white/80 leading-tight">Проверено в магазине</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-2 text-center">
              <Icon name="RefreshCw" size={14} className="text-[#FFD700] mx-auto mb-0.5" />
              <div className="font-roboto text-[9px] text-white/80 leading-tight">Возврат 14 дней</div>
            </div>
          </div>

          {item.address && (
            <div className="flex items-center gap-1.5 mt-3 text-white/60 font-roboto text-xs">
              <Icon name="MapPin" size={12} className="text-[#FFD700]/70" />
              {item.address}
            </div>
          )}
          {item.description && (
            <div className="mt-3 pt-3 border-t border-white/10 text-white/80 font-roboto text-xs leading-relaxed whitespace-pre-line">
              {item.description}
            </div>
          )}

          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1 text-[10px] text-white/40 hover:text-[#FFD700] transition-colors"
          >
            <Icon name="ExternalLink" size={10} />
            Объявление на Авито
          </a>
        </div>

        <div className="shrink-0 border-t border-[#FFD700]/20 bg-black/40 p-3">
          {done ? (
            <div className="flex items-center justify-center gap-2 py-3 text-green-400 font-roboto text-sm">
              <Icon name="CheckCircle2" size={18} />
              Заявка принята! Перезвоним в течение 5 минут.
            </div>
          ) : showForm ? (
            <div className="space-y-2">
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Имя (по желанию)"
                className="w-full bg-[#0D0D0D] border border-[#FFD700]/20 text-white px-3 py-2 font-roboto text-sm rounded focus:outline-none focus:border-[#FFD700]"
              />
              <input
                value={phone}
                onChange={e => setPhone(formatPhone(e.target.value))}
                onFocus={() => { if (!phone) setPhone("+7"); }}
                type="tel"
                inputMode="tel"
                placeholder="+7 (___) ___-__-__"
                className="w-full bg-[#0D0D0D] border border-[#FFD700]/20 text-white px-3 py-2 font-roboto text-sm rounded focus:outline-none focus:border-[#FFD700]"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowForm(false)}
                  className="px-3 py-2 border border-white/20 rounded text-white/60 font-roboto text-xs hover:border-white/40"
                >
                  Отмена
                </button>
                <button
                  onClick={submit}
                  disabled={sending || !isPhoneValid(phone)}
                  className="flex-1 bg-gradient-to-r from-[#FFD700] to-[#FFE55C] text-black font-oswald font-bold text-sm py-2 rounded uppercase tracking-wide hover:shadow-[0_0_16px_rgba(255,215,0,0.5)] disabled:opacity-50 transition-all"
                >
                  {sending ? "Отправляю..." : "Отправить заявку"}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <a
                href="tel:88005553535"
                className="flex items-center justify-center gap-1.5 border border-[#FFD700]/40 text-[#FFD700] font-oswald font-bold text-sm py-2.5 rounded uppercase tracking-wide hover:bg-[#FFD700]/10 transition-colors"
              >
                <Icon name="Phone" size={14} />
                Позвонить
              </a>
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-[#FFD700] to-[#FFE55C] text-black font-oswald font-bold text-sm py-2.5 rounded uppercase tracking-wide hover:shadow-[0_0_16px_rgba(255,215,0,0.5)] transition-all"
              >
                <Icon name="ShoppingBag" size={14} />
                Купить
              </button>
            </div>
          )}
        </div>
      </div>

      {zoomed && photos.length > 0 && (
        <div
          className="fixed inset-0 z-[300] bg-black/95 backdrop-blur flex items-center justify-center animate-in fade-in"
          onClick={() => setZoomed(false)}
        >
          <button
            onClick={() => setZoomed(false)}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/70 border border-white/20 flex items-center justify-center text-white hover:bg-white/10"
          >
            <Icon name="X" size={20} />
          </button>
          <img
            src={photos[photoIdx]}
            alt={item.title}
            className="max-w-[95vw] max-h-[95vh] object-contain animate-in zoom-in-90"
            onClick={e => e.stopPropagation()}
          />
          {photos.length > 1 && (
            <>
              <button
                onClick={e => {
                  e.stopPropagation();
                  setPhotoIdx(Math.max(0, photoIdx - 1));
                }}
                disabled={photoIdx === 0}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/70 border border-white/20 flex items-center justify-center text-white disabled:opacity-30 hover:bg-white/10"
              >
                <Icon name="ChevronLeft" size={22} />
              </button>
              <button
                onClick={e => {
                  e.stopPropagation();
                  setPhotoIdx(Math.min(photos.length - 1, photoIdx + 1));
                }}
                disabled={photoIdx === photos.length - 1}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/70 border border-white/20 flex items-center justify-center text-white disabled:opacity-30 hover:bg-white/10"
              >
                <Icon name="ChevronRight" size={22} />
              </button>
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/70 px-3 py-1 rounded-full text-white/80 font-roboto text-xs border border-white/10">
                {photoIdx + 1} / {photos.length}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}