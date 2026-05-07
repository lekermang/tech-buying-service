import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Icon from "@/components/ui/icon";
import AvitoImg from "./AvitoImg";

const AVITO_URL = "https://functions.poehali.dev/d46cee41-3a2e-4973-a236-29fa6b90b7ce";
const SYNC_URL = "https://functions.poehali.dev/49e23745-1449-4e4c-80c2-e7967f3c5584";
const LEAD_URL = "https://functions.poehali.dev/52666ff7-db52-4b6a-a90e-d60aeed699de";

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
type Sort = "fresh" | "price_asc" | "price_desc";

const formatPrice = (p: number | null | undefined) =>
  p ? p.toLocaleString("ru-RU") + " ₽" : "Цена по запросу";

export default function AvitoShowcase() {
  const [items, setItems] = useState<AvitoItem[]>([]);
  const [listItems, setListItems] = useState<AvitoItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [counts, setCounts] = useState<{ premium: number; basic: number; total: number }>({ premium: 0, basic: 0, total: 0 });
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<string>("");
  const [sort, setSort] = useState<Sort>("fresh");
  const [offset, setOffset] = useState(0);
  const [openItem, setOpenItem] = useState<AvitoItem | null>(null);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [showList, setShowList] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const limit = 12;

  const load = useCallback((q: string, cat: string, off: number) => {
    setLoading(true);
    const params = new URLSearchParams({ mode: "premium", limit: String(limit), offset: String(off) });
    if (q) params.set("q", q);
    if (cat) params.set("category", cat);
    fetch(`${AVITO_URL}?${params.toString()}`)
      .then(r => r.json())
      .then(d => {
        setItems(d.items || []);
        setCategories(d.categories || []);
        setCounts(d.counts || { premium: 0, basic: 0, total: 0 });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const loadList = useCallback((q: string) => {
    const params = new URLSearchParams({ mode: "list", limit: "300" });
    if (q) params.set("q", q);
    fetch(`${AVITO_URL}?${params.toString()}`)
      .then(r => r.json())
      .then(d => setListItems(d.items || []))
      .catch(() => {});
  }, []);

  // Первая загрузка + тихий триггер автосинхронизации, если данные старше 30 минут
  useEffect(() => {
    load("", "", 0);
    loadList("");
    const t = setTimeout(() => {
      fetch(`${SYNC_URL}?action=auto&min=30`)
        .then(r => r.json())
        .then(d => {
          if (d?.ok && !d.skipped) {
            load("", "", 0);
            loadList("");
          }
        })
        .catch(() => {});
    }, 1500);
    return () => clearTimeout(t);
  }, [load, loadList]);

  const onSearch = (val: string) => {
    setQuery(val);
    setOffset(0);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      load(val, activeCat, 0);
      loadList(val);
    }, 350);
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

  const sortedItems = useMemo(() => {
    const arr = [...items];
    if (sort === "price_asc") arr.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    if (sort === "price_desc") arr.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    return arr;
  }, [items, sort]);

  const sortedList = useMemo(() => {
    const arr = [...listItems];
    if (sort === "price_asc") arr.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    if (sort === "price_desc") arr.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    return arr;
  }, [listItems, sort]);

  const totalPages = Math.max(1, Math.ceil(counts.premium / limit));
  const currentPage = Math.floor(offset / limit) + 1;
  const hasFilter = !!query || !!activeCat;

  return (
    <div className="relative">
      <div id="avito-grid-top" className="absolute -top-4" />

      {/* Sticky панель поиска и фильтров */}
      <div className="sticky top-0 z-20 -mx-1 px-1 pt-1 pb-2 bg-gradient-to-b from-[#0D0D0D] via-[#0D0D0D]/95 to-transparent backdrop-blur-md">
        <div className="flex items-center gap-2 mb-2">
          <div className="relative flex-1">
            <Icon name="Search" size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#FFD700]/60" />
            <input
              value={query}
              onChange={e => onSearch(e.target.value)}
              placeholder="iPhone, MacBook, AirPods..."
              className="w-full bg-[#0D0D0D] border border-[#FFD700]/20 text-white pl-8 pr-8 py-2 font-roboto text-xs rounded-lg focus:outline-none focus:border-[#FFD700] focus:shadow-[0_0_12px_rgba(255,215,0,0.2)] transition-all"
            />
            {query && (
              <button
                onClick={() => onSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70"
              >
                <Icon name="X" size={11} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-1 px-2 py-2 bg-gradient-to-br from-[#FFD700]/15 to-[#FFD700]/5 border border-[#FFD700]/30 rounded-lg shadow-[inset_0_1px_0_rgba(255,215,0,0.15)]">
            <Icon name="Package" size={12} className="text-[#FFD700]" />
            <span className="font-oswald font-bold text-[11px] text-[#FFD700]">{counts.total}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto scrollbar-premium pb-1">
          <div className="flex gap-1 shrink-0">
            {([
              { v: "fresh", l: "Свежие", icon: "Sparkles" },
              { v: "price_asc", l: "Дешевле", icon: "ArrowDownNarrowWide" },
              { v: "price_desc", l: "Дороже", icon: "ArrowUpWideNarrow" },
            ] as const).map(s => (
              <button
                key={s.v}
                onClick={() => setSort(s.v)}
                className={`shrink-0 flex items-center gap-1 text-[10px] font-roboto px-2 py-1 rounded transition-all uppercase tracking-wide ${
                  sort === s.v
                    ? "bg-[#FFD700] text-black font-semibold shadow-[0_0_10px_rgba(255,215,0,0.35)]"
                    : "text-white/55 hover:text-white border border-white/10 hover:border-[#FFD700]/40"
                }`}
              >
                <Icon name={s.icon} size={10} />
                {s.l}
              </button>
            ))}
          </div>

          {categories.length > 0 && (
            <div className="w-px h-5 bg-white/10 shrink-0 mx-0.5" />
          )}

          {categories.map(c => (
            <button
              key={c.name}
              onClick={() => onCat(c.name)}
              className={`shrink-0 text-[10px] font-roboto px-2.5 py-1 rounded transition-all uppercase tracking-wide ${
                activeCat === c.name
                  ? "bg-[#FFD700] text-black font-semibold shadow-[0_0_10px_rgba(255,215,0,0.35)]"
                  : "text-white/50 hover:text-white border border-white/10 hover:border-[#FFD700]/40"
              }`}
            >
              {c.name} <span className="opacity-60">·{c.count}</span>
            </button>
          ))}
        </div>

        {hasFilter && (
          <button
            onClick={() => {
              setQuery("");
              setActiveCat("");
              load("", "", 0);
              loadList("");
            }}
            className="mt-1 inline-flex items-center gap-1 text-[10px] text-white/40 hover:text-[#FFD700] transition-colors"
          >
            <Icon name="X" size={10} />
            Сбросить фильтры
          </button>
        )}
      </div>

      {loading && items.length === 0 && (
        <div className="grid grid-cols-2 gap-2.5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="relative overflow-hidden rounded-lg bg-white/5">
              <div className="aspect-square bg-gradient-to-br from-white/5 via-white/[0.08] to-white/5 animate-pulse" />
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
            </div>
          ))}
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="relative text-center py-8 border border-dashed border-[#FFD700]/20 rounded-lg overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#FFD700]/5 via-transparent to-transparent" />
          <Icon name="Sparkles" size={28} className="text-[#FFD700]/50 mx-auto mb-2 relative" />
          <div className="text-white/70 font-oswald font-bold text-sm uppercase tracking-wide relative">
            Витрина пополняется
          </div>
          <div className="text-white/40 font-roboto text-[10px] mt-1 relative">
            {hasFilter
              ? "По вашему запросу пока ничего нет — посмотрите ниже список или сбросьте фильтры"
              : "Сотрудник магазина сейчас добавляет фото товаров"}
          </div>
        </div>
      )}

      {sortedItems.length > 0 && (
        <div className="grid grid-cols-2 gap-2.5">
          {sortedItems.map((it, idx) => (
            <button
              key={it.id}
              onClick={() => openCard(it)}
              style={{ animationDelay: `${Math.min(idx * 40, 400)}ms` }}
              className="group relative bg-gradient-to-br from-white/[0.06] via-white/[0.02] to-transparent border border-[#FFD700]/25 hover:border-[#FFD700]/80 rounded-lg overflow-hidden text-left transition-all duration-300 hover:shadow-[0_0_24px_rgba(255,215,0,0.3)] hover:-translate-y-0.5 animate-in fade-in slide-in-from-bottom-2 fill-mode-both"
            >
              <div className="relative aspect-square bg-[#0D0D0D] overflow-hidden">
                <AvitoImg
                  src={it.main_photo}
                  alt={it.title}
                  width={idx < 4 ? 480 : 360}
                  priority={idx < 2}
                  className="w-full h-full transition-transform duration-700 group-hover:scale-110"
                  sizes="(max-width: 640px) 50vw, 25vw"
                />
                {/* Премиум блик при наведении */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/0 to-white/0 group-hover:via-white/10 group-hover:to-white/20 transition-all duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                <div className="absolute top-1.5 left-1.5 right-1.5 flex items-start justify-between gap-1">
                  <span className="bg-gradient-to-r from-[#FFD700] to-[#FFE55C] text-black font-oswald font-bold text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wide shadow-[0_2px_8px_rgba(255,215,0,0.4)]">
                    В наличии
                  </span>
                  {it.photos && it.photos.length > 1 && (
                    <span className="bg-black/70 backdrop-blur text-white/95 font-roboto text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1 border border-white/10">
                      <Icon name="Images" size={9} />
                      {it.photos.length}
                    </span>
                  )}
                </div>

                <div className="absolute bottom-1.5 left-1.5 right-1.5">
                  <div className="font-oswald font-bold text-white text-base leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                    {formatPrice(it.price)}
                  </div>
                </div>

                {/* Hover-плашка "Подробнее" */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  <div className="bg-[#FFD700] text-black font-oswald font-bold text-[10px] px-2.5 py-1 rounded uppercase tracking-wider shadow-[0_4px_16px_rgba(255,215,0,0.5)]">
                    Подробнее
                  </div>
                </div>
              </div>

              <div className="p-2">
                <div className="font-roboto text-[11px] text-white/95 line-clamp-2 leading-tight min-h-[28px]">
                  {it.title}
                </div>
                {it.category && (
                  <div className="font-roboto text-[9px] text-[#FFD700]/70 mt-1 uppercase tracking-wide truncate">
                    {it.category}
                  </div>
                )}
              </div>

              {/* Уголки */}
              <span aria-hidden className="absolute top-0 left-0 w-2.5 h-2.5 border-l border-t border-[#FFD700]/60 group-hover:border-[#FFD700] transition-colors" />
              <span aria-hidden className="absolute top-0 right-0 w-2.5 h-2.5 border-r border-t border-[#FFD700]/60 group-hover:border-[#FFD700] transition-colors" />
              <span aria-hidden className="absolute bottom-0 left-0 w-2.5 h-2.5 border-l border-b border-[#FFD700]/60 group-hover:border-[#FFD700] transition-colors" />
              <span aria-hidden className="absolute bottom-0 right-0 w-2.5 h-2.5 border-r border-b border-[#FFD700]/60 group-hover:border-[#FFD700] transition-colors" />
            </button>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-4">
          <button
            disabled={currentPage === 1}
            onClick={() => goPage((currentPage - 2) * limit)}
            className="w-9 h-9 flex items-center justify-center border border-[#FFD700]/30 rounded-lg text-[#FFD700] disabled:opacity-30 hover:bg-[#FFD700]/10 hover:border-[#FFD700] transition-all"
          >
            <Icon name="ChevronLeft" size={16} />
          </button>
          <div className="px-3 py-1.5 bg-gradient-to-br from-[#FFD700]/10 to-transparent border border-[#FFD700]/20 rounded-lg">
            <span className="font-oswald font-bold text-xs text-[#FFD700]">
              {currentPage}
            </span>
            <span className="font-roboto text-[10px] text-white/50 mx-1">из</span>
            <span className="font-oswald text-xs text-white/80">{totalPages}</span>
          </div>
          <button
            disabled={currentPage === totalPages}
            onClick={() => goPage(currentPage * limit)}
            className="w-9 h-9 flex items-center justify-center border border-[#FFD700]/30 rounded-lg text-[#FFD700] disabled:opacity-30 hover:bg-[#FFD700]/10 hover:border-[#FFD700] transition-all"
          >
            <Icon name="ChevronRight" size={16} />
          </button>
        </div>
      )}

      {sortedList.length > 0 && (
        <div className="mt-5 pt-4 border-t border-white/10">
          <button
            onClick={() => setShowList(v => !v)}
            className="flex items-center justify-between w-full text-left group hover:bg-white/[0.02] -mx-2 px-2 py-1.5 rounded-lg transition-colors"
          >
            <div>
              <div className="font-oswald font-bold text-white/95 text-sm uppercase tracking-wide flex items-center gap-1.5">
                <Icon name="List" size={14} className="text-[#FFD700]/70" />
                Ещё в наличии
              </div>
              <div className="font-roboto text-[10px] text-white/40 mt-0.5">
                Товары без фото — нажмите, чтобы посмотреть на Авито
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-2">
              <span className="bg-white/10 text-white/85 font-oswald font-bold text-xs px-2 py-1 rounded">
                {sortedList.length}
              </span>
              <Icon
                name={showList ? "ChevronUp" : "ChevronDown"}
                size={18}
                className="text-[#FFD700]/60 group-hover:text-[#FFD700] transition-all group-hover:translate-y-0.5"
              />
            </div>
          </button>

          {showList && (
            <div className="mt-2 divide-y divide-white/5 max-h-[60vh] overflow-y-auto scrollbar-premium pr-1">
              {sortedList.map(it => (
                <a
                  key={it.id}
                  href={it.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-2 py-2.5 group hover:bg-white/[0.03] -mx-1 px-2 rounded transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-roboto text-xs text-white/90 truncate group-hover:text-[#FFD700] transition-colors">
                      {it.title}
                    </div>
                    {it.category && (
                      <div className="font-roboto text-[9px] text-white/40 mt-0.5 uppercase tracking-wide truncate">
                        {it.category}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="font-oswald font-bold text-[#FFD700] text-sm">
                      {formatPrice(it.price)}
                    </div>
                    <Icon name="ExternalLink" size={11} className="text-white/30 group-hover:text-[#FFD700] transition-colors" />
                  </div>
                </a>
              ))}
            </div>
          )}
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
    if (!phone.trim()) return;
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

        {/* Закрыть */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 z-20 w-9 h-9 rounded-full bg-black/70 backdrop-blur border border-[#FFD700]/30 flex items-center justify-center text-white hover:bg-[#FFD700] hover:text-black transition-all"
        >
          <Icon name="X" size={18} />
        </button>

        {/* Поделиться */}
        <button
          onClick={share}
          className="absolute top-2 right-12 z-20 w-9 h-9 rounded-full bg-black/70 backdrop-blur border border-[#FFD700]/30 flex items-center justify-center text-white hover:bg-[#FFD700] hover:text-black transition-all"
          title="Поделиться"
        >
          <Icon name="Share2" size={16} />
        </button>

        {/* Галерея */}
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

        {/* Контент */}
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

        {/* CTA */}
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

      {/* Lightbox с зумом */}
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