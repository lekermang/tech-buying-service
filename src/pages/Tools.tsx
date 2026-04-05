import { useState, useEffect, useCallback, useRef } from "react";
import Icon from "@/components/ui/icon";

const TOOLS_API = "https://functions.poehali.dev/434ea4ea-de14-4074-a738-e5db6e4f9697";
const PAGE_SIZE = 48;

interface Product {
  article: string;
  name: string;
  brand: string;
  category: string;
  base_price: number;
  discount_price: number;
  amount: string;
  image_url: string;
  is_hit: boolean;
  is_new: boolean;
}

const fmt = (n: number) =>
  n > 0 ? n.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " ₽" : "";

const getDiscount = (p: Product) =>
  p.base_price > 0 && p.discount_price > 0 && p.base_price > p.discount_price
    ? Math.round((1 - p.discount_price / p.base_price) * 100)
    : 0;

const ProductCard = ({ p }: { p: Product }) => {
  const disc = getDiscount(p);
  const inStock = p.amount === "В наличии";
  const myPrice = p.discount_price || p.base_price;
  const [imgError, setImgError] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col hover:shadow-md transition-shadow group">
      <div className="relative aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
        {p.is_hit && (
          <span className="absolute top-2 left-2 z-10 bg-[#d32f2f] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">Хит</span>
        )}
        {disc > 0 && (
          <span className="absolute top-2 right-2 z-10 bg-[#e53935] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">-{disc}%</span>
        )}
        {p.image_url && !imgError ? (
          <img
            src={p.image_url}
            alt={p.name}
            className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex items-center justify-center text-gray-200">
            <Icon name="Package" size={48} />
          </div>
        )}
      </div>

      <div className="p-3 flex flex-col flex-1">
        <div className="text-[11px] text-gray-400 font-mono mb-1">{p.article}</div>

        <div className="flex items-center gap-1 mb-2">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${inStock ? "bg-green-500" : "bg-gray-300"}`} />
          <span className={`text-[11px] ${inStock ? "text-green-600" : "text-gray-400"}`}>
            {inStock ? "В наличии" : p.amount || "Уточняйте"}
          </span>
        </div>

        <p className="text-sm text-gray-800 leading-snug flex-1 mb-3 line-clamp-3">{p.name}</p>

        <div className="mt-auto">
          {myPrice > 0 ? (
            <>
              {p.base_price > 0 && disc > 0 && (
                <div className="text-[11px] text-gray-400">
                  Базовая цена: <span className="line-through">{fmt(p.base_price)}</span>
                </div>
              )}
              <div className="flex items-baseline gap-1 flex-wrap">
                <span className="text-xs text-gray-500">Ваша цена:</span>
                <span className="text-base font-bold text-gray-900">{fmt(myPrice)}</span>
              </div>
            </>
          ) : (
            <span className="text-xs text-gray-400">Цена уточняется</span>
          )}
        </div>

        <button className="mt-3 w-full bg-[#d32f2f] hover:bg-[#b71c1c] text-white text-sm font-medium py-2 rounded transition-colors">
          В корзину
        </button>
      </div>
    </div>
  );
};

const ToolsPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [activeBrand, setActiveBrand] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const searchRef = useRef<ReturnType<typeof setTimeout>>();
  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`${TOOLS_API}?action=meta`)
      .then(r => r.json())
      .then(d => { setCategories(d.categories || []); setBrands(d.brands || []); });
  }, []);

  const load = useCallback(async (q: string, off: number, cat: string, brand: string, stock: boolean, append = false) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ action: "products", limit: String(PAGE_SIZE), offset: String(off) });
      if (q) params.set("search", q);
      if (cat) params.set("category", cat);
      if (brand) params.set("brand", brand);
      if (stock) params.set("in_stock", "1");
      const res = await fetch(`${TOOLS_API}?${params}`);
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      const items: Product[] = data.items || [];
      setProducts(prev => append ? [...prev, ...items] : items);
      setTotal(data.total || 0);
      setHasMore(data.has_more);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load("", 0, "", "", false); }, []);

  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        const next = offset + PAGE_SIZE;
        setOffset(next);
        load(search, next, activeCategory, activeBrand, inStockOnly, true);
      }
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, loading, offset, search, activeCategory, activeBrand, inStockOnly, load]);

  const apply = (q: string, cat: string, brand: string, stock: boolean) => {
    setOffset(0);
    load(q, 0, cat, brand, stock);
  };

  const handleSearch = (val: string) => {
    setSearch(val);
    clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => apply(val, activeCategory, activeBrand, inStockOnly), 350);
  };

  const handleCategory = (c: string) => {
    const next = activeCategory === c ? "" : c;
    setActiveCategory(next);
    apply(search, next, activeBrand, inStockOnly);
    setSidebarOpen(false);
  };

  const handleBrand = (b: string) => {
    const next = activeBrand === b ? "" : b;
    setActiveBrand(next);
    apply(search, activeCategory, next, inStockOnly);
  };

  const handleStock = (v: boolean) => {
    setInStockOnly(v);
    apply(search, activeCategory, activeBrand, v);
  };

  const clearAll = () => {
    setSearch(""); setActiveCategory(""); setActiveBrand(""); setInStockOnly(false); setOffset(0);
    load("", 0, "", "", false);
  };

  const activeFiltersCount = [activeCategory, activeBrand, inStockOnly ? "1" : ""].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Шапка */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 flex items-center gap-3">
          <a href="/" className="text-gray-400 hover:text-gray-700 transition-colors shrink-0">
            <Icon name="ArrowLeft" size={20} />
          </a>
          <span className="font-bold text-gray-800 text-base sm:text-lg shrink-0">
            <span className="hidden sm:inline">Инструменты и расходники</span>
            <span className="sm:hidden">Инструменты</span>
          </span>

          <div className="relative flex-1 max-w-lg">
            <Icon name="Search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              value={search}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Поиск по названию или артикулу..."
              className="w-full border border-gray-300 rounded-lg pl-9 pr-8 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#d32f2f] bg-white"
            />
            {search && (
              <button onClick={() => handleSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
                <Icon name="X" size={14} />
              </button>
            )}
          </div>

          <button
            onClick={() => setSidebarOpen(v => !v)}
            className={`lg:hidden flex items-center gap-1.5 border rounded-lg px-3 py-2 text-sm transition-colors shrink-0 ${activeFiltersCount ? "border-[#d32f2f] text-[#d32f2f]" : "border-gray-300 text-gray-600"}`}
          >
            <Icon name="SlidersHorizontal" size={15} />
            {activeFiltersCount > 0 && (
              <span className="w-4 h-4 bg-[#d32f2f] text-white text-[10px] rounded-full flex items-center justify-center font-bold">{activeFiltersCount}</span>
            )}
          </button>

          {total > 0 && (
            <span className="text-gray-400 text-sm shrink-0 hidden md:block">{total.toLocaleString("ru-RU")} товаров</span>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex">
        {/* Sidebar */}
        {sidebarOpen && <div className="fixed inset-0 z-20 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />}
        <aside className={`fixed top-0 left-0 h-full z-30 w-72 bg-white shadow-xl overflow-y-auto lg:relative lg:top-auto lg:left-auto lg:h-auto lg:w-56 xl:w-64 lg:shadow-none lg:bg-transparent lg:block transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
          <div className="p-4 lg:pt-6">
            <div className="flex items-center justify-between mb-4 lg:hidden">
              <span className="font-semibold text-gray-800">Фильтры</span>
              <button onClick={() => setSidebarOpen(false)} className="text-gray-400"><Icon name="X" size={20} /></button>
            </div>

            {activeFiltersCount > 0 && (
              <button onClick={clearAll} className="flex items-center gap-1 text-sm text-[#d32f2f] hover:underline mb-4">
                <Icon name="X" size={13} />Очистить фильтры
              </button>
            )}

            {/* Наличие */}
            <div className="mb-5 pb-5 border-b border-gray-100">
              <label className="flex items-center gap-2 cursor-pointer" onClick={() => handleStock(!inStockOnly)}>
                <div className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${inStockOnly ? "bg-[#d32f2f]" : "bg-gray-200"}`}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${inStockOnly ? "translate-x-5" : "translate-x-0.5"}`} />
                </div>
                <span className="text-sm text-gray-700">Товар в наличии</span>
              </label>
            </div>

            {/* Категории */}
            <div className="mb-5 pb-5 border-b border-gray-100">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Категория</div>
              <div className="space-y-0.5">
                <button onClick={() => handleCategory("")} className={`w-full text-left px-2 py-1.5 text-sm rounded transition-colors ${!activeCategory ? "bg-[#d32f2f]/8 text-[#d32f2f] font-medium" : "text-gray-600 hover:bg-gray-100"}`}>
                  Все категории
                </button>
                {categories.map(cat => (
                  <button key={cat} onClick={() => handleCategory(cat)} className={`w-full text-left px-2 py-1.5 text-sm rounded transition-colors ${activeCategory === cat ? "bg-[#d32f2f]/8 text-[#d32f2f] font-medium" : "text-gray-600 hover:bg-gray-100"}`}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Бренды */}
            {brands.length > 0 && (
              <div className="mb-5">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Бренд</div>
                <div className="space-y-1.5">
                  {brands.map(b => (
                    <label key={b} className="flex items-center gap-2 cursor-pointer group" onClick={() => handleBrand(b)}>
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors shrink-0 ${activeBrand === b ? "bg-[#d32f2f] border-[#d32f2f]" : "border-gray-300 group-hover:border-gray-400"}`}>
                        {activeBrand === b && <Icon name="Check" size={10} className="text-white" />}
                      </div>
                      <span className="text-sm text-gray-700">{b}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Основной контент */}
        <main className="flex-1 min-w-0 p-3 sm:p-6">
          {(activeCategory || search) && (
            <div className="flex items-center gap-1.5 mb-4 text-sm text-gray-500 flex-wrap">
              <button onClick={clearAll} className="hover:text-gray-800">Все товары</button>
              {activeCategory && (
                <>
                  <Icon name="ChevronRight" size={14} />
                  <span className="text-gray-800 font-medium">{activeCategory}</span>
                  <button onClick={() => handleCategory("")} className="text-gray-300 hover:text-gray-500"><Icon name="X" size={13} /></button>
                </>
              )}
              {search && (
                <>
                  <Icon name="ChevronRight" size={14} />
                  <span className="text-gray-800">«{search}»</span>
                </>
              )}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 text-sm rounded-lg mb-4">{error}</div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {products.map((p, i) => <ProductCard key={`${p.article}-${i}`} p={p} />)}
          </div>

          {loading && (
            <div className="flex justify-center py-10 gap-3 text-gray-400">
              <Icon name="Loader" size={20} className="animate-spin" />
              <span className="text-sm">Загрузка...</span>
            </div>
          )}

          {!loading && products.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-gray-300">
              <Icon name="PackageSearch" size={48} className="mb-3" />
              <span className="text-base text-gray-400">Ничего не найдено</span>
              <button onClick={clearAll} className="mt-3 text-[#d32f2f] text-sm hover:underline">Сбросить фильтры</button>
            </div>
          )}

          <div ref={loaderRef} className="h-8" />
        </main>
      </div>
    </div>
  );
};

export default ToolsPage;
