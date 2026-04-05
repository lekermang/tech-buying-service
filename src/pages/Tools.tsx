import { useState, useEffect, useCallback, useRef } from "react";
import Icon from "@/components/ui/icon";

const TOOLS_API = "https://functions.poehali.dev/434ea4ea-de14-4074-a738-e5db6e4f9697";
const SYNC_API = "https://functions.poehali.dev/8e9219e9-9dcf-4726-a272-69c6ce976b80";
const ADMIN_TOKEN = "Mark2015N";
const PAGE_SIZE = 100;

interface Product {
  id: string;
  article: string;
  name: string;
  brand: string;
  category: string;
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
  const [syncing, setSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);
  const searchRef = useRef<ReturnType<typeof setTimeout>>();
  const pollRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    fetch(`${TOOLS_API}?action=meta`)
      .then(r => r.json())
      .then(d => { setBrands(d.brands || []); setCategories(d.categories || []); });
  }, []);

  const load = useCallback(async (q: string, off: number, brand: string, cat: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ action: "products", limit: String(PAGE_SIZE), offset: String(off) });
      if (q) params.set("search", q);
      if (brand) params.set("brand", brand);
      if (cat) params.set("category", cat);
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

  useEffect(() => { load("", 0, "", ""); }, []);

  const pollSync = async (jobId: number) => {
    try {
      const res = await fetch(`${SYNC_API}?token=${ADMIN_TOKEN}&job_id=${jobId}`);
      const data = await res.json();
      if (data.status === "running") {
        pollRef.current = setTimeout(() => pollSync(jobId), 5000);
      } else {
        setSyncing(false);
        if (data.status === "done") {
          setSyncDone(true);
          load("", 0, "", "");
          setTimeout(() => setSyncDone(false), 4000);
        }
      }
    } catch {
      pollRef.current = setTimeout(() => pollSync(jobId), 5000);
    }
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    setSyncDone(false);
    try {
      const res = await fetch(`${SYNC_API}?token=${ADMIN_TOKEN}&action=start`);
      const data = await res.json();
      if (data.ok && data.job_id) {
        pollRef.current = setTimeout(() => pollSync(data.job_id), 5000);
      } else {
        setSyncing(false);
      }
    } catch {
      setSyncing(false);
    }
  };

  const handleSearch = (val: string) => {
    setSearch(val);
    clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => { setOffset(0); load(val, 0, activeBrand, activeCategory); }, 400);
  };

  const handleBrand = (b: string) => {
    const next = activeBrand === b ? "" : b;
    setActiveBrand(next);
    setOffset(0);
    load(search, 0, next, activeCategory);
    setSidebarOpen(false);
  };

  const handleCategory = (c: string) => {
    const next = activeCategory === c ? "" : c;
    setActiveCategory(next);
    setOffset(0);
    load(search, 0, activeBrand, next);
    setSidebarOpen(false);
  };

  const loadMore = () => {
    const next = offset + PAGE_SIZE;
    setOffset(next);
    load(search, next, activeBrand, activeCategory);
  };

  const inStock = products.filter(p => p.amount === "В наличии");
  const outOfStock = products.filter(p => p.amount !== "В наличии");
  const sorted = [...inStock, ...outOfStock];

  const discount = (p: Product) => p.base_price > 0
    ? Math.round((1 - p.discount_price / p.base_price) * 100)
    : 0;

  const activeFilters = [activeBrand, activeCategory].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">

      {/* Шапка */}
      <div className="sticky top-0 z-30 bg-[#0D0D0D]/95 backdrop-blur-sm border-b border-[#FFD700]/20">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-3">
          <a href="/" className="text-white/50 hover:text-[#FFD700] transition-colors shrink-0">
            <Icon name="ArrowLeft" size={20} />
          </a>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-1 h-5 bg-[#FFD700] shrink-0" />
            <span className="font-oswald font-bold text-sm sm:text-base uppercase tracking-wider truncate">Инструменты и расходники</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative hidden sm:block">
              <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                value={search}
                onChange={e => handleSearch(e.target.value)}
                placeholder="Поиск..."
                className="bg-[#111] border border-[#333] text-white pl-8 pr-3 py-1.5 font-roboto text-sm focus:outline-none focus:border-[#FFD700] transition-colors w-44"
              />
            </div>
            <button onClick={handleSyncNow} disabled={syncing}
              title="Обновить каталог с instrument.ru"
              className={`flex items-center gap-1.5 border px-3 py-1.5 font-roboto text-xs transition-colors disabled:opacity-50 ${syncDone ? "border-green-500/50 text-green-400" : "border-white/10 text-white/50 hover:text-white hover:border-[#FFD700]/40"}`}>
              <Icon name={syncDone ? "Check" : "RefreshCw"} size={13} className={syncing ? "animate-spin" : ""} />
              <span className="hidden sm:inline">{syncing ? "Загружаю..." : syncDone ? "Готово" : "Обновить"}</span>
            </button>
            <button onClick={() => setSidebarOpen(v => !v)}
              className="flex items-center gap-1.5 border border-white/10 text-white/50 hover:text-white px-3 py-1.5 font-roboto text-xs transition-colors">
              <Icon name="SlidersHorizontal" size={13} />
              Фильтры
              {activeFilters > 0 && (
                <span className="w-4 h-4 bg-[#FFD700] text-black text-[10px] font-bold flex items-center justify-center rounded-full">{activeFilters}</span>
              )}
            </button>
          </div>
        </div>
        <div className="sm:hidden px-4 pb-3">
          <div className="relative">
            <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input value={search} onChange={e => handleSearch(e.target.value)} placeholder="Поиск по артикулу или названию..."
              className="w-full bg-[#111] border border-[#333] text-white pl-8 pr-3 py-2 font-roboto text-sm focus:outline-none focus:border-[#FFD700] transition-colors" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex">

        {/* Сайдбар */}
        {sidebarOpen && <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}
        <aside className={`
          fixed inset-y-0 left-0 z-40 w-64 bg-[#0D0D0D] border-r border-[#FFD700]/10 overflow-y-auto transition-transform duration-200 pt-16
          lg:relative lg:translate-x-0 lg:w-52 lg:shrink-0 lg:pt-0 lg:block
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}>
          <div className="p-4 space-y-5">
            {activeBrand || activeCategory ? (
              <button onClick={() => { setActiveBrand(""); setActiveCategory(""); setOffset(0); load(search, 0, "", ""); }}
                className="w-full flex items-center gap-1.5 text-white/40 hover:text-white font-roboto text-xs transition-colors py-1">
                <Icon name="X" size={12} /> Сбросить фильтры
              </button>
            ) : null}

            <div>
              <p className="font-oswald font-bold text-xs uppercase tracking-widest text-[#FFD700] mb-2">Бренды</p>
              <div className="space-y-0.5">
                {brands.map(b => (
                  <button key={b} onClick={() => handleBrand(b)}
                    className={`w-full text-left px-2 py-1.5 font-roboto text-sm transition-colors rounded-sm ${activeBrand === b ? "text-[#FFD700] bg-[#FFD700]/10" : "text-white/60 hover:text-white"}`}>
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {categories.length > 0 && (
              <div>
                <p className="font-oswald font-bold text-xs uppercase tracking-widest text-[#FFD700] mb-2">Категории</p>
                <div className="space-y-0.5">
                  {categories.map(c => (
                    <button key={c} onClick={() => handleCategory(c)}
                      className={`w-full text-left px-2 py-1.5 font-roboto text-xs transition-colors leading-snug rounded-sm ${activeCategory === c ? "text-[#FFD700] bg-[#FFD700]/10" : "text-white/60 hover:text-white"}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Основной контент */}
        <main className="flex-1 min-w-0 p-4">

          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-roboto text-white/40 text-sm">{sorted.length} товаров{hasMore ? "+" : ""}</span>
              {inStock.length > 0 && <span className="font-roboto text-green-400 text-xs border border-green-500/30 px-2 py-0.5">{inStock.length} в наличии</span>}
              {activeBrand && <span className="font-roboto text-[#FFD700] text-xs border border-[#FFD700]/30 px-2 py-0.5 flex items-center gap-1">{activeBrand} <button onClick={() => handleBrand(activeBrand)}><Icon name="X" size={10} /></button></span>}
              {activeCategory && <span className="font-roboto text-[#FFD700] text-xs border border-[#FFD700]/30 px-2 py-0.5 flex items-center gap-1 max-w-[200px] truncate">{activeCategory} <button onClick={() => handleCategory(activeCategory)}><Icon name="X" size={10} /></button></span>}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 font-roboto text-sm py-6">
              <Icon name="AlertCircle" size={15} /> {error}
            </div>
          )}

          {loading && sorted.length === 0 && (
            <div className="flex items-center gap-2 text-white/40 font-roboto text-sm py-16 justify-center">
              <Icon name="Loader" size={18} className="animate-spin" /> Загружаю каталог...
            </div>
          )}

          {sorted.length > 0 && (
            <div className="border border-[#FFD700]/20 overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#FFD700]/10 border-b border-[#FFD700]/20">
                    <th className="text-left py-2.5 px-3 font-oswald font-bold text-xs uppercase tracking-wide text-[#FFD700]">Артикул</th>
                    <th className="text-left py-2.5 px-3 font-oswald font-bold text-xs uppercase tracking-wide text-[#FFD700]">Наименование</th>
                    <th className="text-right py-2.5 px-3 font-oswald font-bold text-xs uppercase tracking-wide text-[#FFD700]">Цена</th>
                    <th className="text-left py-2.5 px-3 font-oswald font-bold text-xs uppercase tracking-wide text-[#FFD700] hidden sm:table-cell">Наличие</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map(p => {
                    const disc = discount(p);
                    const isInStock = p.amount === "В наличии";
                    return (
                      <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="py-2.5 px-3 font-roboto text-xs text-white/50 whitespace-nowrap">{p.article}</td>
                        <td className="py-2.5 px-3">
                          {p.name ? (
                            <div>
                              <span className="font-roboto text-sm text-white/90">{p.name}</span>
                              {p.brand && <span className="ml-2 font-roboto text-[10px] text-white/30">{p.brand}</span>}
                            </div>
                          ) : (
                            <span className="font-roboto text-xs text-white/20 italic">нет данных</span>
                          )}
                          {p.category && <div className="font-roboto text-[10px] text-white/25 mt-0.5">{p.category}</div>}
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {disc > 0 && <span className="font-roboto text-[10px] bg-[#FFD700] text-black px-1.5 py-0.5 font-bold">-{disc}%</span>}
                            <div>
                              <div className="font-roboto font-bold text-sm text-[#FFD700]">{p.discount_price.toLocaleString("ru-RU")} ₽</div>
                              {disc > 0 && <div className="font-roboto text-[10px] text-white/25 line-through text-right">{p.base_price.toLocaleString("ru-RU")} ₽</div>}
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 hidden sm:table-cell">
                          <span className={`font-roboto text-xs px-2 py-0.5 border ${isInStock ? "border-green-500/40 text-green-400" : "border-white/10 text-white/25"}`}>
                            {p.amount || "—"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {hasMore && (
            <div className="mt-6 text-center">
              <button onClick={loadMore} disabled={loading}
                className="font-oswald font-bold uppercase tracking-wide text-sm border border-[#FFD700]/40 text-[#FFD700] hover:bg-[#FFD700] hover:text-black px-8 py-3 transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto">
                {loading ? <><Icon name="Loader" size={14} className="animate-spin" /> Загружаю...</> : "Загрузить ещё"}
              </button>
            </div>
          )}

          {!loading && sorted.length === 0 && !error && (
            <div className="text-center py-16">
              <Icon name="PackageSearch" size={40} className="text-white/10 mx-auto mb-3" />
              <p className="font-roboto text-white/30 text-sm">Ничего не найдено</p>
              {(activeBrand || activeCategory || search) && (
                <button onClick={() => { setActiveBrand(""); setActiveCategory(""); setSearch(""); load("", 0, "", ""); }}
                  className="mt-3 font-roboto text-xs text-[#FFD700] hover:underline">
                  Сбросить фильтры
                </button>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ToolsPage;