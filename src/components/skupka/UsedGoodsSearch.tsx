import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";
import AvitoShowcase from "./AvitoShowcase";

const GOODS_URL = "https://functions.poehali.dev/de4c1e8e-0c7b-4f25-a3fd-155c46fa3399";

type Good = { id: number; title: string; category: string; condition: string; sell_price: number; brand: string; model: string; storage: string };

const CONDITION_COLOR: Record<string, string> = {
  отличное: "text-green-400",
  хорошее: "text-[#FFD700]",
  удовлетворительное: "text-orange-400",
};

export default function UsedGoodsSearch() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"own" | "avito">("avito");
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Открыть виджет извне (по событию или хэшу #used-tech) и проскроллить к нему
  useEffect(() => {
    const openAndScroll = () => {
      setOpen(true);
      setTimeout(() => {
        rootRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 50);
    };
    const onCustom = () => openAndScroll();
    const onHash = () => {
      if (window.location.hash === "#used-tech") openAndScroll();
    };
    window.addEventListener("open-used-tech", onCustom);
    window.addEventListener("hashchange", onHash);
    if (window.location.hash === "#used-tech") openAndScroll();
    return () => {
      window.removeEventListener("open-used-tech", onCustom);
      window.removeEventListener("hashchange", onHash);
    };
  }, []);

  // Собственные товары
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<Good[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const abortRef = useRef<AbortController | null>(null);

  const fetchGoods = useCallback((q: string) => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    const url = q
      ? `${GOODS_URL}?q=${encodeURIComponent(q)}&status=available`
      : `${GOODS_URL}?status=available&limit=6`;
    fetch(url, { signal: abortRef.current.signal })
      .then(r => r.json())
      .then(d => { setItems(d.items || []); setLoading(false); })
      .catch(e => { if (e.name !== "AbortError") setLoading(false); });
  }, []);

  useEffect(() => {
    if (!open) return;
    fetchGoods("");
    return () => {
      abortRef.current?.abort();
      clearTimeout(debounceRef.current);
    };
  }, [open, fetchGoods]);

  const handleSearch = useCallback((val: string) => {
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchGoods(val), 400);
  }, [fetchGoods]);

  return (
    <div ref={rootRef} id="used-tech" className="hero-premium-btn group relative bg-gradient-to-br from-white/[0.06] via-white/[0.02] to-transparent backdrop-blur-sm border-2 border-[#FFD700]/30 hover:border-[#FFD700]/70 px-4 py-4 w-full rounded-xl overflow-hidden scroll-mt-24 transition-all">
      <span aria-hidden className="absolute top-0 left-0 right-0 h-px opacity-70" style={{ background: "linear-gradient(90deg, transparent, rgba(255,215,0,0.9), transparent)" }} />
      <span aria-hidden className="absolute top-1.5 left-1.5 w-3 h-3 border-l-2 border-t-2 border-[#FFD700]/70 group-hover:border-[#FFD700] transition-colors" />
      <span aria-hidden className="absolute top-1.5 right-1.5 w-3 h-3 border-r-2 border-t-2 border-[#FFD700]/70 group-hover:border-[#FFD700] transition-colors" />
      <span aria-hidden className="absolute bottom-1.5 left-1.5 w-3 h-3 border-l-2 border-b-2 border-[#FFD700]/70 group-hover:border-[#FFD700] transition-colors" />
      <span aria-hidden className="absolute bottom-1.5 right-1.5 w-3 h-3 border-r-2 border-b-2 border-[#FFD700]/70 group-hover:border-[#FFD700] transition-colors" />

      <button className="relative flex items-center justify-between w-full" onClick={() => setOpen(v => !v)}>
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-full p-[2px] bg-[conic-gradient(from_0deg,#b8860b,#ffd700,#fff3a0,#ffd700,#b8860b)] shadow-[0_0_18px_rgba(255,215,0,0.45)] group-hover:shadow-[0_0_28px_rgba(255,215,0,0.7)] transition-all shrink-0">
            <div className="w-full h-full rounded-full bg-gradient-to-br from-[#1a1a1a] to-[#0D0D0D] flex items-center justify-center">
              <Icon name="RefreshCw" size={22} className="text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.5)]" />
            </div>
          </div>
          <div className="text-left">
            <span className="font-oswald font-bold text-base uppercase text-white tracking-wide block leading-tight drop-shadow-[0_0_8px_rgba(255,215,0,0.15)]">Б/У техника</span>
            <span className="inline-flex items-center gap-1 bg-[#FFD700]/15 text-[#FFD700] font-oswald font-bold text-[10px] px-2 py-0.5 rounded-sm border border-[#FFD700]/40 mt-1 uppercase tracking-wider">
              <Icon name="ShieldCheck" size={9} />
              Гарантия 1 год
            </span>
          </div>
        </div>
        <Icon name={open ? "ChevronUp" : "ChevronDown"} size={22} className="text-[#FFD700]/60 group-hover:text-[#FFD700] transition-colors shrink-0 drop-shadow-[0_0_6px_rgba(255,215,0,0.4)]" />
      </button>

      {open && (
        <div className="relative mt-3 border-t border-[#FFD700]/20 pt-3">

          {/* Вкладки */}
          <div className="flex gap-1 mb-3 overflow-x-auto scrollbar-premium pb-1">
            <button
              onClick={() => setTab("avito")}
              className={`shrink-0 text-[10px] font-roboto px-2.5 py-1 rounded transition-all flex items-center gap-1 ${tab === "avito" ? "bg-[#FFD700] text-black font-semibold" : "text-white/50 hover:text-white border border-white/10"}`}
            >
              <Icon name="Sparkles" size={10} />
              Витрина магазина
            </button>
            <button
              onClick={() => setTab("own")}
              className={`shrink-0 text-[10px] font-roboto px-2.5 py-1 rounded transition-all ${tab === "own" ? "bg-[#FFD700] text-black font-semibold" : "text-white/50 hover:text-white border border-white/10"}`}
            >
              Каталог
            </button>
          </div>

          {/* Авито витрина */}
          {tab === "avito" && <AvitoShowcase />}

          {/* Наши товары */}
          {tab === "own" && (
            <>
              <input value={query} onChange={e => handleSearch(e.target.value)}
                placeholder="Поиск: iPhone 13, Samsung A52..."
                className="w-full bg-[#0D0D0D] border border-[#333] text-white px-3 py-2 font-roboto text-xs focus:outline-none focus:border-[#FFD700] transition-colors mb-2" />

              {loading && <div className="text-white/30 font-roboto text-[10px] py-2">Загружаю...</div>}

              {!loading && items.length === 0 && (
                <div className="text-white/30 font-roboto text-[10px] py-2">Нет товаров в наличии</div>
              )}

              {!loading && items.map(item => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div className="min-w-0 flex-1">
                    <div className="font-roboto text-xs text-white truncate">{item.title}</div>
                    <div className={`font-roboto text-[10px] ${CONDITION_COLOR[item.condition] || "text-white/40"}`}>
                      {item.condition} {item.storage ? `· ${item.storage}` : ""}
                    </div>
                  </div>
                  <div className="font-oswald font-bold text-[#FFD700] text-sm shrink-0 ml-2">
                    {item.sell_price.toLocaleString("ru-RU")} ₽
                  </div>
                </div>
              ))}

              {!loading && (
                <a href="/cabinet" className="flex items-center gap-1 text-white/40 hover:text-[#FFD700] font-roboto text-[10px] transition-colors mt-2">
                  Зарегистрируйтесь для скидки до 10% →
                </a>
              )}
            </>
          )}

        </div>
      )}
    </div>
  );
}