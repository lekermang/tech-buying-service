import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";

const GOODS_URL = "https://functions.poehali.dev/de4c1e8e-0c7b-4f25-a3fd-155c46fa3399";

type Good = { id: number; title: string; category: string; condition: string; sell_price: number; brand: string; model: string; storage: string };

const CONDITION_COLOR: Record<string, string> = {
  отличное: "text-green-400",
  хорошее: "text-[#FFD700]",
  удовлетворительное: "text-orange-400",
};

export default function UsedGoodsSearch() {
  const [open, setOpen] = useState(false);
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
    <div className="border border-white/10 bg-black/30 p-3 mb-3 w-full">
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
        </div>
      )}
    </div>
  );
}