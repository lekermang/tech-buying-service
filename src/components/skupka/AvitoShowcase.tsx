import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";

const AVITO_URL = "https://functions.poehali.dev/d46cee41-3a2e-4973-a236-29fa6b90b7ce";

type AvitoItem = {
  id: number;
  avito_id: number;
  title: string;
  price: number | null;
  url: string;
  address: string | null;
  category: string | null;
  main_photo: string | null;
  photos: string[];
  description?: string;
  avito_status?: string;
};

type Category = { name: string; count: number };

const formatPrice = (p: number | null | undefined) =>
  p ? p.toLocaleString("ru-RU") + " ₽" : "Цена по запросу";

export default function AvitoShowcase() {
  const [items, setItems] = useState<AvitoItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<string>("");
  const [offset, setOffset] = useState(0);
  const [openItem, setOpenItem] = useState<AvitoItem | null>(null);
  const [photoIdx, setPhotoIdx] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const limit = 12;

  const load = useCallback((q: string, cat: string, off: number) => {
    setLoading(true);
    const params = new URLSearchParams({ limit: String(limit), offset: String(off) });
    if (q) params.set("q", q);
    if (cat) params.set("category", cat);
    fetch(`${AVITO_URL}?${params.toString()}`)
      .then(r => r.json())
      .then(d => {
        setItems(d.items || []);
        setCategories(d.categories || []);
        setTotal(d.total || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    load("", "", 0);
  }, [load]);

  const onSearch = (val: string) => {
    setQuery(val);
    setOffset(0);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => load(val, activeCat, 0), 350);
  };

  const onCat = (c: string) => {
    const next = activeCat === c ? "" : c;
    setActiveCat(next);
    setOffset(0);
    load(query, next, 0);
  };

  const goPage = (off: number) => {
    setOffset(off);
    load(query, activeCat, off);
    document.getElementById("avito-grid-top")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const openCard = (it: AvitoItem) => {
    setOpenItem(it);
    setPhotoIdx(0);
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const currentPage = Math.floor(offset / limit) + 1;

  return (
    <div className="relative">
      <div id="avito-grid-top" className="absolute -top-4" />

      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1">
          <Icon name="Search" size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#FFD700]/60" />
          <input
            value={query}
            onChange={e => onSearch(e.target.value)}
            placeholder="iPhone, MacBook, AirPods..."
            className="w-full bg-[#0D0D0D] border border-[#FFD700]/20 text-white pl-8 pr-3 py-2 font-roboto text-xs rounded focus:outline-none focus:border-[#FFD700] transition-colors"
          />
        </div>
        <div className="flex items-center gap-1 px-2 py-2 bg-[#FFD700]/10 border border-[#FFD700]/30 rounded">
          <Icon name="Package" size={12} className="text-[#FFD700]" />
          <span className="font-oswald font-bold text-[11px] text-[#FFD700]">{total}</span>
        </div>
      </div>

      {categories.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-premium">
          {categories.map(c => (
            <button
              key={c.name}
              onClick={() => onCat(c.name)}
              className={`shrink-0 text-[10px] font-roboto px-2.5 py-1 rounded transition-all uppercase tracking-wide ${
                activeCat === c.name
                  ? "bg-[#FFD700] text-black font-semibold"
                  : "text-white/50 hover:text-white border border-white/10 hover:border-[#FFD700]/40"
              }`}
            >
              {c.name} <span className="opacity-60">·{c.count}</span>
            </button>
          ))}
        </div>
      )}

      {loading && items.length === 0 && (
        <div className="grid grid-cols-2 gap-2.5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-square bg-white/5 rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="text-center py-8">
          <Icon name="PackageOpen" size={32} className="text-[#FFD700]/40 mx-auto mb-2" />
          <div className="text-white/50 font-roboto text-xs">Товары не найдены</div>
          <div className="text-white/30 font-roboto text-[10px] mt-1">
            Попробуйте изменить запрос или сбросить фильтр
          </div>
        </div>
      )}

      {items.length > 0 && (
        <div className="grid grid-cols-2 gap-2.5">
          {items.map(it => (
            <button
              key={it.id}
              onClick={() => openCard(it)}
              className="group relative bg-gradient-to-br from-white/[0.04] to-transparent border border-[#FFD700]/20 hover:border-[#FFD700]/70 rounded-lg overflow-hidden text-left transition-all hover:shadow-[0_0_20px_rgba(255,215,0,0.25)]"
            >
              <div className="relative aspect-square bg-[#0D0D0D] overflow-hidden">
                {it.main_photo ? (
                  <img
                    src={it.main_photo}
                    alt={it.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Icon name="ImageOff" size={28} className="text-white/20" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                <div className="absolute top-1.5 left-1.5 right-1.5 flex items-start justify-between gap-1">
                  <span className="bg-[#FFD700] text-black font-oswald font-bold text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wide">
                    В наличии
                  </span>
                  {it.photos && it.photos.length > 1 && (
                    <span className="bg-black/70 backdrop-blur text-white/90 font-roboto text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1">
                      <Icon name="Images" size={9} />
                      {it.photos.length}
                    </span>
                  )}
                </div>
                <div className="absolute bottom-1.5 left-1.5 right-1.5">
                  <div className="font-oswald font-bold text-white text-base leading-tight drop-shadow-lg">
                    {formatPrice(it.price)}
                  </div>
                </div>
              </div>
              <div className="p-2">
                <div className="font-roboto text-[11px] text-white/90 line-clamp-2 leading-tight min-h-[28px]">
                  {it.title}
                </div>
                {it.category && (
                  <div className="font-roboto text-[9px] text-[#FFD700]/70 mt-1 uppercase tracking-wide truncate">
                    {it.category}
                  </div>
                )}
              </div>
              <span aria-hidden className="absolute top-0 left-0 w-2 h-2 border-l border-t border-[#FFD700]/60 group-hover:border-[#FFD700] transition-colors" />
              <span aria-hidden className="absolute top-0 right-0 w-2 h-2 border-r border-t border-[#FFD700]/60 group-hover:border-[#FFD700] transition-colors" />
              <span aria-hidden className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-[#FFD700]/60 group-hover:border-[#FFD700] transition-colors" />
              <span aria-hidden className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-[#FFD700]/60 group-hover:border-[#FFD700] transition-colors" />
            </button>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-4">
          <button
            disabled={currentPage === 1}
            onClick={() => goPage((currentPage - 2) * limit)}
            className="w-8 h-8 flex items-center justify-center border border-[#FFD700]/30 rounded text-[#FFD700] disabled:opacity-30 hover:bg-[#FFD700]/10 transition-colors"
          >
            <Icon name="ChevronLeft" size={14} />
          </button>
          <span className="font-roboto text-[11px] text-white/70 px-2">
            {currentPage} / {totalPages}
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => goPage(currentPage * limit)}
            className="w-8 h-8 flex items-center justify-center border border-[#FFD700]/30 rounded text-[#FFD700] disabled:opacity-30 hover:bg-[#FFD700]/10 transition-colors"
          >
            <Icon name="ChevronRight" size={14} />
          </button>
        </div>
      )}

      {openItem && (
        <ProductModal
          item={openItem}
          photoIdx={photoIdx}
          setPhotoIdx={setPhotoIdx}
          onClose={() => setOpenItem(null)}
        />
      )}
    </div>
  );
}

function ProductModal({
  item,
  photoIdx,
  setPhotoIdx,
  onClose,
}: {
  item: AvitoItem;
  photoIdx: number;
  setPhotoIdx: (n: number) => void;
  onClose: () => void;
}) {
  const photos = item.photos && item.photos.length > 0 ? item.photos : item.main_photo ? [item.main_photo] : [];
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setPhotoIdx(Math.max(0, photoIdx - 1));
      if (e.key === "ArrowRight") setPhotoIdx(Math.min(photos.length - 1, photoIdx + 1));
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [photoIdx, photos.length, onClose, setPhotoIdx]);

  const submit = async () => {
    if (!phone.trim()) return;
    setSending(true);
    try {
      await fetch("https://functions.poehali.dev/52666ff7-db52-4b6a-a90e-d60aeed699de", {
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

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-lg max-h-[95vh] bg-gradient-to-br from-[#1a1a1a] to-[#0D0D0D] border-2 border-[#FFD700]/40 rounded-t-2xl sm:rounded-xl overflow-hidden flex flex-col shadow-[0_0_60px_rgba(255,215,0,0.3)]"
        onClick={e => e.stopPropagation()}
      >
        <span aria-hidden className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(255,215,0,0.9), transparent)" }} />

        <button
          onClick={onClose}
          className="absolute top-2 right-2 z-10 w-9 h-9 rounded-full bg-black/60 backdrop-blur border border-[#FFD700]/30 flex items-center justify-center text-white hover:bg-[#FFD700] hover:text-black transition-all"
        >
          <Icon name="X" size={18} />
        </button>

        <div className="relative bg-black aspect-square sm:aspect-[4/3] shrink-0">
          {photos.length > 0 ? (
            <>
              <img
                src={photos[photoIdx]}
                alt={item.title}
                className="w-full h-full object-contain"
              />
              {photos.length > 1 && (
                <>
                  <button
                    onClick={() => setPhotoIdx(Math.max(0, photoIdx - 1))}
                    disabled={photoIdx === 0}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 backdrop-blur border border-[#FFD700]/30 flex items-center justify-center text-white disabled:opacity-30 hover:bg-[#FFD700] hover:text-black transition-all"
                  >
                    <Icon name="ChevronLeft" size={18} />
                  </button>
                  <button
                    onClick={() => setPhotoIdx(Math.min(photos.length - 1, photoIdx + 1))}
                    disabled={photoIdx === photos.length - 1}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 backdrop-blur border border-[#FFD700]/30 flex items-center justify-center text-white disabled:opacity-30 hover:bg-[#FFD700] hover:text-black transition-all"
                  >
                    <Icon name="ChevronRight" size={18} />
                  </button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
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
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Icon name="ImageOff" size={48} className="text-white/20" />
            </div>
          )}
          <div className="absolute top-2 left-2">
            <span className="bg-[#FFD700] text-black font-oswald font-bold text-[11px] px-2 py-1 rounded uppercase tracking-wide">
              В наличии
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 scrollbar-premium">
          <div className="font-oswald font-bold text-2xl text-[#FFD700] leading-none drop-shadow-[0_0_10px_rgba(255,215,0,0.4)]">
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

          <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2 text-white/50 font-roboto text-[10px]">
            <Icon name="ShieldCheck" size={12} className="text-[#FFD700]" />
            Гарантия 1 год · проверено в магазине
          </div>
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
                onChange={e => setPhone(e.target.value)}
                type="tel"
                placeholder="+7 999 123-45-67"
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
                  disabled={sending || !phone.trim()}
                  className="flex-1 bg-[#FFD700] text-black font-oswald font-bold text-sm py-2 rounded uppercase tracking-wide hover:bg-[#FFE55C] disabled:opacity-50 transition-colors"
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
                className="flex items-center justify-center gap-1.5 bg-[#FFD700] text-black font-oswald font-bold text-sm py-2.5 rounded uppercase tracking-wide hover:bg-[#FFE55C] transition-colors"
              >
                <Icon name="ShoppingBag" size={14} />
                Купить
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
