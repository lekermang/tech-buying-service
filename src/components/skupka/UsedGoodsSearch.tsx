import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";

const GOODS_URL = "https://functions.poehali.dev/de4c1e8e-0c7b-4f25-a3fd-155c46fa3399";
const RESOLD_URL = "https://functions.poehali.dev/a10aef75-50fc-411c-85bb-692d44fb31e7";

type Good = { id: number; title: string; category: string; condition: string; sell_price: number; brand: string; model: string; storage: string };
type ResoldItem = { name: string; price: number | null; photo: string | null; link: string };

const CONDITION_COLOR: Record<string, string> = {
  отличное: "text-green-400",
  хорошее: "text-[#FFD700]",
  удовлетворительное: "text-orange-400",
};

export default function UsedGoodsSearch() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"own" | "resold">("own");

  // Собственные товары
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<Good[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const abortRef = useRef<AbortController | null>(null);

  // Resold товары
  const [resoldItems, setResoldItems] = useState<ResoldItem[]>([]);
  const [resoldLoading, setResoldLoading] = useState(false);
  const [resoldPage, setResoldPage] = useState(1);
  const [resoldTotal, setResoldTotal] = useState(1);
  const [resoldQuery, setResoldQuery] = useState("");

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

  const fetchResold = useCallback((page: number) => {
    setResoldLoading(true);
    fetch(`${RESOLD_URL}?page=${page}`)
      .then(r => r.json())
      .then(d => {
        setResoldItems(d.items || []);
        setResoldTotal(d.total_pages || 1);
        setResoldLoading(false);
      })
      .catch(() => setResoldLoading(false));
  }, []);

  useEffect(() => {
    if (!open) return;
    fetchGoods("");
    return () => {
      abortRef.current?.abort();
      clearTimeout(debounceRef.current);
    };
  }, [open, fetchGoods]);

  useEffect(() => {
    if (!open || tab !== "resold") return;
    if (resoldItems.length === 0) fetchResold(1);
  }, [open, tab]);

  const handleSearch = useCallback((val: string) => {
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchGoods(val), 400);
  }, [fetchGoods]);

  const handleResoldPage = (p: number) => {
    setResoldPage(p);
    fetchResold(p);
  };

  const filteredResold = resoldQuery
    ? resoldItems.filter(i => i.name.toLowerCase().includes(resoldQuery.toLowerCase()))
    : resoldItems;

  return (
    <div className="border border-white/10 bg-black/30 px-3 py-3 w-full">
      <button className="flex items-center justify-between w-full" onClick={() => setOpen(v => !v)}>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-[#FFD700] flex items-center justify-center shrink-0">
            <Icon name="ShoppingBag" size={11} className="text-black" />
          </div>
          <span className="font-oswald font-bold text-xs uppercase text-white tracking-wide">Б/У техника</span>
          <span className="bg-[#FFD700]/20 text-[#FFD700] font-roboto text-[10px] px-1.5 py-0.5 border border-[#FFD700]/30">Гарантия 1 год</span>
        </div>
        <Icon name={open ? "ChevronUp" : "ChevronDown"} size={14} className="text-white/40" />
      </button>

      {open && (
        <div className="mt-3 border-t border-white/10 pt-3">

          {/* Вкладки */}
          <div className="flex gap-1 mb-3">
            <button
              onClick={() => setTab("own")}
              className={`text-[10px] font-roboto px-2.5 py-1 transition-all ${tab === "own" ? "bg-[#FFD700] text-black font-semibold" : "text-white/40 hover:text-white border border-white/10"}`}
            >
              Наш магазин
            </button>
            <button
              onClick={() => { setTab("resold"); if (resoldItems.length === 0) fetchResold(1); }}
              className={`text-[10px] font-roboto px-2.5 py-1 transition-all ${tab === "resold" ? "bg-[#FFD700] text-black font-semibold" : "text-white/40 hover:text-white border border-white/10"}`}
            >
              Витрина Resold
            </button>
          </div>

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

          {/* Resold витрина */}
          {tab === "resold" && (
            <>
              <input
                value={resoldQuery}
                onChange={e => setResoldQuery(e.target.value)}
                placeholder="Поиск по витрине..."
                className="w-full bg-[#0D0D0D] border border-[#333] text-white px-3 py-2 font-roboto text-xs focus:outline-none focus:border-[#FFD700] transition-colors mb-2"
              />

              {resoldLoading && <div className="text-white/30 font-roboto text-[10px] py-2">Загружаю...</div>}

              {!resoldLoading && filteredResold.length === 0 && (
                <div className="text-white/30 font-roboto text-[10px] py-2">Ничего не найдено</div>
              )}

              {!resoldLoading && filteredResold.map((item, i) => (
                <a
                  key={i}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between py-2 border-b border-white/5 last:border-0 hover:bg-white/3 -mx-1 px-1 transition-colors group"
                >
                  <div className="min-w-0 flex-1 flex items-center gap-2">
                    {item.photo
                      ? <img src={item.photo} alt="" className="w-7 h-7 object-cover shrink-0 rounded" />
                      : <div className="w-7 h-7 bg-white/5 shrink-0 rounded flex items-center justify-center"><Icon name="Package" size={12} className="text-white/20" /></div>
                    }
                    <span className="font-roboto text-xs text-white truncate group-hover:text-[#FFD700] transition-colors">{item.name}</span>
                  </div>
                  <div className="font-oswald font-bold text-[#FFD700] text-sm shrink-0 ml-2">
                    {item.price ? `${item.price.toLocaleString("ru-RU")} ₽` : "По запросу"}
                  </div>
                </a>
              ))}

              {/* Пагинация */}
              {!resoldLoading && resoldTotal > 1 && (
                <div className="flex items-center gap-1 mt-3 pt-2 border-t border-white/5">
                  {Array.from({ length: resoldTotal }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      onClick={() => handleResoldPage(p)}
                      className={`w-6 h-6 text-[10px] font-roboto transition-all ${resoldPage === p ? "bg-[#FFD700] text-black font-bold" : "text-white/40 hover:text-white border border-white/10"}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
