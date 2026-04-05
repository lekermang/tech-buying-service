import { useState, useEffect, useCallback, useRef } from "react";
import Icon from "@/components/ui/icon";

const TOOLS_API = "https://functions.poehali.dev/434ea4ea-de14-4074-a738-e5db6e4f9697";
const PAGE_SIZE = 50;

interface Product {
  article: string;
  name: string;
  brand: string;
  category: string;
  base_price: number;
  discount_price: number;
  amount: string;
}

const fmt = (n: number) =>
  n > 0 ? n.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " ₽" : "—";

const discount = (p: Product) =>
  p.base_price > 0 && p.discount_price > 0 && p.base_price > p.discount_price
    ? Math.round((1 - p.discount_price / p.base_price) * 100)
    : 0;

const ToolsPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const searchRef = useRef<ReturnType<typeof setTimeout>>();
  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`${TOOLS_API}?action=meta`)
      .then(r => r.json())
      .then(d => setCategories(d.categories || []));
  }, []);

  const load = useCallback(async (q: string, off: number, cat: string, append = false) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ action: "products", limit: String(PAGE_SIZE), offset: String(off) });
      if (q) params.set("search", q);
      if (cat) params.set("category", cat);
      const res = await fetch(`${TOOLS_API}?${params}`);
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      const items = data.items || [];
      setProducts(prev => append ? [...prev, ...items] : items);
      setTotal(data.total || items.length);
      setHasMore(data.has_more);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load("", 0, ""); }, []);

  // Бесконечный скролл
  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        const next = offset + PAGE_SIZE;
        setOffset(next);
        load(search, next, activeCategory, true);
      }
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, loading, offset, search, activeCategory, load]);

  const handleSearch = (val: string) => {
    setSearch(val);
    clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => {
      setOffset(0);
      load(val, 0, activeCategory);
    }, 350);
  };

  const handleCategory = (c: string) => {
    const next = activeCategory === c ? "" : c;
    setActiveCategory(next);
    setOffset(0);
    load(search, 0, next);
    setSidebarOpen(false);
  };

  const clearFilters = () => {
    setActiveCategory("");
    setSearch("");
    setOffset(0);
    load("", 0, "");
  };

  const hasFilters = !!(activeCategory || search);

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">

      {/* Шапка */}
      <div className="sticky top-0 z-30 bg-[#0D0D0D]/95 backdrop-blur-sm border-b border-[#FFD700]/20">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 flex items-center gap-2 sm:gap-4">
          <a href="/" className="text-white/50 hover:text-[#FFD700] transition-colors shrink-0">
            <Icon name="ArrowLeft" size={20} />
          </a>
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-1 h-5 bg-[#FFD700]" />
            <span className="font-oswald font-bold text-sm sm:text-lg uppercase tracking-wider whitespace-nowrap">
              Инструменты
            </span>
            {total > 0 && (
              <span className="text-white/30 font-roboto text-xs hidden sm:inline">
                {total.toLocaleString("ru-RU")} позиций
              </span>
            )}
          </div>

          {/* Поиск */}
          <div className="relative flex-1 max-w-md">
            <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
            <input
              value={search}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Поиск по названию или артикулу..."
              className="w-full bg-[#111] border border-[#333] text-white pl-9 pr-3 py-2 font-roboto text-sm focus:outline-none focus:border-[#FFD700]/60 transition-colors rounded-sm"
            />
            {search && (
              <button onClick={() => handleSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
                <Icon name="X" size={14} />
              </button>
            )}
          </div>

          {/* Кнопка фильтров */}
          <button
            onClick={() => setSidebarOpen(v => !v)}
            className={`flex items-center gap-1.5 border px-3 py-2 font-roboto text-xs transition-colors shrink-0 ${sidebarOpen || activeCategory ? "border-[#FFD700]/60 text-[#FFD700]" : "border-white/10 text-white/50 hover:text-white hover:border-white/30"}`}
          >
            <Icon name="SlidersHorizontal" size={13} />
            <span className="hidden sm:inline">Категории</span>
            {activeCategory && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#FFD700]" />
            )}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex">

        {/* Боковая панель категорий */}
        <aside className={`
          fixed inset-0 z-20 lg:relative lg:inset-auto
          transition-all duration-200
          ${sidebarOpen ? "block" : "hidden lg:block"}
          lg:w-56 xl:w-64 shrink-0
        `}>
          {/* Оверлей на мобилке */}
          <div
            className="absolute inset-0 bg-black/60 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative lg:sticky lg:top-14 h-screen lg:h-[calc(100vh-56px)] overflow-y-auto bg-[#0D0D0D] lg:bg-transparent border-r border-[#222] w-64 lg:w-full">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-oswald text-xs uppercase tracking-widest text-white/40">Категории</span>
                <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white/30 hover:text-white">
                  <Icon name="X" size={16} />
                </button>
              </div>

              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="w-full text-left text-xs text-[#FFD700]/70 hover:text-[#FFD700] font-roboto mb-3 flex items-center gap-1"
                >
                  <Icon name="X" size={11} />
                  Сбросить фильтры
                </button>
              )}

              <button
                onClick={() => handleCategory("")}
                className={`w-full text-left px-3 py-2 font-roboto text-sm transition-colors mb-0.5 rounded-sm ${!activeCategory ? "bg-[#FFD700] text-black font-medium" : "text-white/60 hover:text-white hover:bg-white/5"}`}
              >
                Все товары
              </button>

              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => handleCategory(cat)}
                  className={`w-full text-left px-3 py-2 font-roboto text-sm transition-colors mb-0.5 rounded-sm ${activeCategory === cat ? "bg-[#FFD700] text-black font-medium" : "text-white/60 hover:text-white hover:bg-white/5"}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Основной контент */}
        <main className="flex-1 min-w-0 p-3 sm:p-6">

          {/* Активный фильтр */}
          {activeCategory && (
            <div className="flex items-center gap-2 mb-4">
              <span className="text-white/40 font-roboto text-sm">{activeCategory}</span>
              <button onClick={() => handleCategory("")} className="text-white/30 hover:text-white">
                <Icon name="X" size={14} />
              </button>
            </div>
          )}

          {error && (
            <div className="bg-red-900/20 border border-red-500/30 text-red-400 px-4 py-3 font-roboto text-sm mb-4 rounded-sm">
              {error}
            </div>
          )}

          {/* Таблица */}
          {!error && (
            <>
              {/* Desktop таблица */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-[#FFD700]/20">
                      <th className="text-left py-2.5 px-3 font-oswald text-xs uppercase tracking-wider text-[#FFD700] w-24">Артикул</th>
                      <th className="text-left py-2.5 px-3 font-oswald text-xs uppercase tracking-wider text-[#FFD700]">Наименование</th>
                      <th className="text-left py-2.5 px-3 font-oswald text-xs uppercase tracking-wider text-[#FFD700] w-40 hidden lg:table-cell">Категория</th>
                      <th className="text-right py-2.5 px-3 font-oswald text-xs uppercase tracking-wider text-[#FFD700] w-32">Цена</th>
                      <th className="text-center py-2.5 px-3 font-oswald text-xs uppercase tracking-wider text-[#FFD700] w-24">Наличие</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p, i) => {
                      const disc = discount(p);
                      const inStock = p.amount === "В наличии";
                      return (
                        <tr
                          key={`${p.article}-${i}`}
                          className="border-b border-white/5 hover:bg-white/3 transition-colors group"
                        >
                          <td className="py-3 px-3 font-roboto text-xs text-white/40 font-mono">{p.article}</td>
                          <td className="py-3 px-3">
                            <span className="font-roboto text-sm text-white/90 group-hover:text-white transition-colors leading-snug">
                              {p.name || <span className="text-white/20 italic">нет данных</span>}
                            </span>
                          </td>
                          <td className="py-3 px-3 hidden lg:table-cell">
                            <span className="font-roboto text-xs text-white/30">
                              {p.category ? p.category.split("/").pop() : ""}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            {p.discount_price > 0 ? (
                              <div>
                                <div className="font-oswald text-base text-[#FFD700] font-bold leading-tight">
                                  {fmt(p.discount_price)}
                                </div>
                                {disc > 0 && (
                                  <div className="font-roboto text-xs text-white/30 line-through">
                                    {fmt(p.base_price)}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-white/20 font-roboto text-sm">—</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className={`inline-block w-2 h-2 rounded-full ${inStock ? "bg-green-500" : p.amount ? "bg-yellow-500" : "bg-white/10"}`} title={p.amount || "Нет данных"} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile карточки */}
              <div className="md:hidden space-y-2">
                {products.map((p, i) => {
                  const disc = discount(p);
                  const inStock = p.amount === "В наличии";
                  return (
                    <div key={`${p.article}-${i}`} className="bg-[#111] border border-white/8 p-3 rounded-sm">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="font-roboto text-xs text-white/30 font-mono shrink-0">{p.article}</span>
                        <span className={`w-2 h-2 rounded-full shrink-0 mt-1 ${inStock ? "bg-green-500" : p.amount ? "bg-yellow-500" : "bg-white/10"}`} title={p.amount || ""} />
                      </div>
                      <p className="font-roboto text-sm text-white/85 leading-snug mb-2">
                        {p.name || <span className="text-white/20 italic">нет данных</span>}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="font-roboto text-xs text-white/25">
                          {p.category ? p.category.split("/").slice(0, 2).join(" / ") : ""}
                        </span>
                        <div className="text-right">
                          {p.discount_price > 0 ? (
                            <>
                              <div className="font-oswald text-base text-[#FFD700] font-bold leading-tight">{fmt(p.discount_price)}</div>
                              {disc > 0 && <div className="font-roboto text-xs text-white/25 line-through">{fmt(p.base_price)}</div>}
                            </>
                          ) : (
                            <span className="text-white/20 text-sm">—</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Загрузка / пусто */}
              {loading && (
                <div className="flex items-center justify-center py-12 gap-3 text-white/30">
                  <Icon name="Loader" size={18} className="animate-spin" />
                  <span className="font-roboto text-sm">Загрузка...</span>
                </div>
              )}

              {!loading && products.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-white/20">
                  <Icon name="PackageSearch" size={40} className="mb-3" />
                  <span className="font-roboto text-sm">Ничего не найдено</span>
                  {hasFilters && (
                    <button onClick={clearFilters} className="mt-3 text-[#FFD700]/60 hover:text-[#FFD700] font-roboto text-xs">
                      Сбросить фильтры
                    </button>
                  )}
                </div>
              )}

              {/* Триггер бесконечного скролла */}
              <div ref={loaderRef} className="h-8" />
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default ToolsPage;
