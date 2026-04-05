import { useState, useEffect, useCallback, useRef } from "react";
import Icon from "@/components/ui/icon";

const TOOLS_API = "https://functions.poehali.dev/434ea4ea-de14-4074-a738-e5db6e4f9697";
const PAGE_SIZE = 100;

interface Product {
  id: string;
  article: string;
  base_price: number;
  discount_price: number;
  amount: string;
}

const ToolsPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeBrand, setActiveBrand] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const searchRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    fetch(`${TOOLS_API}?action=meta`)
      .then(r => r.json())
      .then(d => { setBrands(d.brands || []); setCategories(d.categories || []); });
  }, []);

  const load = useCallback(async (q: string, off: number) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ action: "products", limit: String(PAGE_SIZE), offset: String(off) });
      if (q) params.set("search", q);
      const res = await fetch(`${TOOLS_API}?${params}`);
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      if (off === 0) {
        setProducts(data.items || []);
      } else {
        setProducts(prev => [...prev, ...(data.items || [])]);
      }
      setHasMore(data.has_more);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setOffset(0);
    load(search, 0);
  }, []);

  const handleSearch = (val: string) => {
    setSearch(val);
    clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => { setOffset(0); load(val, 0); }, 400);
  };

  const loadMore = () => {
    const next = offset + PAGE_SIZE;
    setOffset(next);
    load(search, next);
  };

  const filtered = products.filter(p => {
    if (activeBrand && !p.article.toUpperCase().startsWith(activeBrand.slice(0, 3).toUpperCase())) return false;
    return true;
  });

  const inStock = filtered.filter(p => p.amount === "В наличии");
  const outOfStock = filtered.filter(p => p.amount !== "В наличии");
  const sorted = [...inStock, ...outOfStock];

  const discount = (p: Product) => p.base_price > 0
    ? Math.round((1 - p.discount_price / p.base_price) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">

      {/* Шапка */}
      <div className="sticky top-0 z-30 bg-[#0D0D0D]/95 backdrop-blur-sm border-b border-[#FFD700]/20">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-3">
          <a href="/" className="text-white/50 hover:text-[#FFD700] transition-colors shrink-0">
            <Icon name="ArrowLeft" size={20} />
          </a>
          <div className="flex items-center gap-2 flex-1">
            <div className="w-1 h-5 bg-[#FFD700]" />
            <span className="font-oswald font-bold text-base uppercase tracking-wider">Инструменты и расходники</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative hidden sm:block">
              <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                value={search}
                onChange={e => handleSearch(e.target.value)}
                placeholder="Поиск по артикулу..."
                className="bg-[#111] border border-[#333] text-white pl-8 pr-3 py-1.5 font-roboto text-sm focus:outline-none focus:border-[#FFD700] transition-colors w-52"
              />
            </div>
            <button onClick={() => setSidebarOpen(v => !v)}
              className="flex items-center gap-1.5 border border-white/10 text-white/50 hover:text-white px-3 py-1.5 font-roboto text-xs transition-colors">
              <Icon name="SlidersHorizontal" size={13} />
              Фильтры {(activeBrand || activeCategory) ? <span className="w-1.5 h-1.5 bg-[#FFD700] rounded-full" /> : null}
            </button>
          </div>
        </div>
        {/* Мобильный поиск */}
        <div className="sm:hidden px-4 pb-3">
          <div className="relative">
            <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              value={search}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Поиск по артикулу..."
              className="w-full bg-[#111] border border-[#333] text-white pl-8 pr-3 py-2 font-roboto text-sm focus:outline-none focus:border-[#FFD700] transition-colors"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex">

        {/* Сайдбар — бренды и категории */}
        <aside className={`
          fixed inset-y-0 left-0 z-40 w-72 bg-[#0D0D0D] border-r border-[#FFD700]/10 overflow-y-auto transition-transform duration-200 pt-14
          lg:relative lg:translate-x-0 lg:w-56 lg:shrink-0 lg:block lg:pt-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}>
          {sidebarOpen && (
            <div className="fixed inset-0 bg-black/60 z-[-1] lg:hidden" onClick={() => setSidebarOpen(false)} />
          )}
          <div className="p-4 space-y-6">
            {/* Бренды */}
            <div>
              <p className="font-oswald font-bold text-xs uppercase tracking-widest text-[#FFD700] mb-3">Бренды</p>
              <div className="space-y-0.5">
                <button onClick={() => setActiveBrand("")}
                  className={`w-full text-left px-3 py-1.5 font-roboto text-sm transition-colors ${!activeBrand ? "text-[#FFD700] bg-[#FFD700]/10" : "text-white/60 hover:text-white"}`}>
                  Все бренды
                </button>
                {brands.map(b => (
                  <button key={b} onClick={() => setActiveBrand(prev => prev === b ? "" : b)}
                    className={`w-full text-left px-3 py-1.5 font-roboto text-sm transition-colors ${activeBrand === b ? "text-[#FFD700] bg-[#FFD700]/10" : "text-white/60 hover:text-white"}`}>
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {/* Категории */}
            <div>
              <p className="font-oswald font-bold text-xs uppercase tracking-widest text-[#FFD700] mb-3">Категории</p>
              <div className="space-y-0.5">
                <button onClick={() => setActiveCategory("")}
                  className={`w-full text-left px-3 py-1.5 font-roboto text-xs transition-colors ${!activeCategory ? "text-[#FFD700] bg-[#FFD700]/10" : "text-white/60 hover:text-white"}`}>
                  Все категории
                </button>
                {categories.map(c => (
                  <button key={c} onClick={() => setActiveCategory(prev => prev === c ? "" : c)}
                    className={`w-full text-left px-3 py-1.5 font-roboto text-xs transition-colors leading-snug ${activeCategory === c ? "text-[#FFD700] bg-[#FFD700]/10" : "text-white/60 hover:text-white"}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Основной контент */}
        <main className="flex-1 min-w-0 p-4">

          {/* Статистика */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="font-roboto text-white/40 text-sm">{sorted.length} товаров</span>
              {inStock.length > 0 && (
                <span className="font-roboto text-green-400 text-xs border border-green-500/30 px-2 py-0.5">
                  {inStock.length} в наличии
                </span>
              )}
            </div>
            {(activeBrand || activeCategory) && (
              <button onClick={() => { setActiveBrand(""); setActiveCategory(""); }}
                className="flex items-center gap-1 text-white/40 hover:text-white font-roboto text-xs transition-colors">
                <Icon name="X" size={12} /> Сбросить
              </button>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 font-roboto text-sm py-6">
              <Icon name="AlertCircle" size={15} /> {error}
            </div>
          )}

          {loading && products.length === 0 && (
            <div className="flex items-center gap-2 text-white/40 font-roboto text-sm py-16 justify-center">
              <Icon name="Loader" size={18} className="animate-spin" /> Загружаю каталог...
            </div>
          )}

          {/* Таблица товаров */}
          {sorted.length > 0 && (
            <div className="border border-[#FFD700]/20 overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#FFD700]/10 border-b border-[#FFD700]/20">
                    <th className="text-left py-2.5 px-4 font-oswald font-bold text-xs uppercase tracking-wide text-[#FFD700]">Артикул</th>
                    <th className="text-right py-2.5 px-4 font-oswald font-bold text-xs uppercase tracking-wide text-[#FFD700]">Цена</th>
                    <th className="text-right py-2.5 px-4 font-oswald font-bold text-xs uppercase tracking-wide text-[#FFD700] hidden sm:table-cell">Базовая</th>
                    <th className="text-left py-2.5 px-4 font-oswald font-bold text-xs uppercase tracking-wide text-[#FFD700]">Наличие</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map(p => {
                    const disc = discount(p);
                    const inStock = p.amount === "В наличии";
                    return (
                      <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="py-2.5 px-4">
                          <span className="font-roboto text-sm text-white/90">{p.article}</span>
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {disc > 0 && (
                              <span className="font-roboto text-[10px] bg-[#FFD700] text-black px-1.5 py-0.5 font-bold">-{disc}%</span>
                            )}
                            <span className="font-roboto font-bold text-sm text-[#FFD700]">
                              {p.discount_price.toLocaleString("ru-RU")} ₽
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-right hidden sm:table-cell">
                          {disc > 0 && (
                            <span className="font-roboto text-xs text-white/30 line-through">
                              {p.base_price.toLocaleString("ru-RU")} ₽
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-4">
                          <span className={`font-roboto text-xs px-2 py-0.5 border ${inStock ? "border-green-500/40 text-green-400" : "border-white/10 text-white/30"}`}>
                            {p.amount || "Нет данных"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Загрузить ещё */}
          {hasMore && (
            <div className="mt-6 text-center">
              <button onClick={loadMore} disabled={loading}
                className="font-oswald font-bold uppercase tracking-wide text-sm border border-[#FFD700]/40 text-[#FFD700] hover:bg-[#FFD700] hover:text-black px-8 py-3 transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto">
                {loading ? <><Icon name="Loader" size={14} className="animate-spin" /> Загружаю...</> : <>Загрузить ещё</>}
              </button>
            </div>
          )}

          {!loading && sorted.length === 0 && !error && (
            <div className="text-center py-16">
              <Icon name="PackageSearch" size={40} className="text-white/10 mx-auto mb-3" />
              <p className="font-roboto text-white/30 text-sm">Ничего не найдено</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ToolsPage;
