import { useState, useEffect, useCallback, useRef } from "react";
import Icon from "@/components/ui/icon";
import { Product, CartItem, CatMeta } from "@/components/tools/types";
import ToolsProductCard from "@/components/tools/ToolsProductCard";
import ToolsCartModal from "@/components/tools/ToolsCartModal";
import ToolsSidebar from "@/components/tools/ToolsSidebar";
import GrassBackground from "@/components/tools/GrassBackground";

const TOOLS_API = "https://functions.poehali.dev/434ea4ea-de14-4074-a738-e5db6e4f9697";
const PAGE_SIZE = 48;

export default function ToolsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CatMeta[]>([]);
  const [subcategories, setSubcategories] = useState<Record<string, CatMeta[]>>({});
  const [brands, setBrands] = useState<CatMeta[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [activeSubcategory, setActiveSubcategory] = useState("");
  const [activeBrand, setActiveBrand] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sort, setSort] = useState("popular");
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedCat, setExpandedCat] = useState<string>("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [brandsExpanded, setBrandsExpanded] = useState(false);
  const searchRef = useRef<ReturnType<typeof setTimeout>>();
  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`${TOOLS_API}?action=meta`).then(r => r.json()).then(d => {
      setCategories(d.categories || []);
      setSubcategories(d.subcategories || {});
      setBrands(d.brands || []);
    });
  }, []);

  const load = useCallback(async (
    q: string, off: number, cat: string, subcat: string,
    brand: string, stock: boolean, sortBy: string, append = false
  ) => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ action: "products", limit: String(PAGE_SIZE), offset: String(off), sort: sortBy });
      if (q) p.set("search", q);
      if (cat) p.set("category", cat);
      if (subcat) p.set("subcategory", subcat);
      if (brand) p.set("brand", brand);
      if (stock) p.set("in_stock", "1");
      const res = await fetch(`${TOOLS_API}?${p}`);
      const data = await res.json();
      setProducts(prev => append ? [...prev, ...(data.items || [])] : (data.items || []));
      setTotal(data.total || 0);
      setHasMore(data.has_more);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load("", 0, "", "", "", false, "popular"); }, []);

  useEffect(() => {
    const el = loaderRef.current; if (!el) return;
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        const next = offset + PAGE_SIZE;
        setOffset(next);
        load(search, next, activeCategory, activeSubcategory, activeBrand, inStockOnly, sort, true);
      }
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, loading, offset, search, activeCategory, activeSubcategory, activeBrand, inStockOnly, sort, load]);

  const apply = (q: string, cat: string, subcat: string, brand: string, stock: boolean, sortBy: string) => {
    setOffset(0);
    load(q, 0, cat, subcat, brand, stock, sortBy);
  };

  const handleSearch = (val: string) => {
    setSearch(val);
    clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => apply(val, activeCategory, activeSubcategory, activeBrand, inStockOnly, sort), 350);
  };

  const handleCat = (c: string) => {
    const isActive = activeCategory === c && !activeSubcategory;
    const newCat = isActive ? "" : c;
    setActiveCategory(newCat); setActiveSubcategory("");
    setExpandedCat(newCat);
    apply(search, newCat, "", activeBrand, inStockOnly, sort);
    setSidebarOpen(false);
  };

  const handleSubcat = (cat: string, sub: string) => {
    const isActive = activeSubcategory === sub;
    const newSub = isActive ? "" : sub;
    setActiveCategory(cat); setActiveSubcategory(newSub);
    apply(search, cat, newSub, activeBrand, inStockOnly, sort);
    setSidebarOpen(false);
  };

  const handleBrand = (b: string) => {
    const n = activeBrand === b ? "" : b;
    setActiveBrand(n);
    apply(search, activeCategory, activeSubcategory, n, inStockOnly, sort);
  };

  const handleStock = (v: boolean) => { setInStockOnly(v); apply(search, activeCategory, activeSubcategory, activeBrand, v, sort); };
  const handleSort = (s: string) => { setSort(s); apply(search, activeCategory, activeSubcategory, activeBrand, inStockOnly, s); };

  const clearAll = () => {
    setSearch(""); setActiveCategory(""); setActiveSubcategory("");
    setActiveBrand(""); setInStockOnly(false); setSort("popular");
    setOffset(0); load("", 0, "", "", "", false, "popular");
  };

  const addToCart = (p: Product) => setCart(prev => {
    const ex = prev.find(i => i.article === p.article);
    return ex ? prev.map(i => i.article === p.article ? { ...i, qty: i.qty + 1 } : i) : [...prev, { ...p, qty: 1 }];
  });
  const removeFromCart = (a: string) => setCart(prev => prev.filter(i => i.article !== a));
  const changeQty = (a: string, d: number) => setCart(prev =>
    prev.map(i => i.article === a ? { ...i, qty: Math.max(1, i.qty + d) } : i)
  );

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const activeFilters = [activeCategory, activeBrand, inStockOnly ? "1" : ""].filter(Boolean).length;

  const breadcrumbs = [
    { label: "Главная", href: "/" },
    { label: "Инструменты", href: "/tools" },
    ...(activeCategory ? [{ label: activeCategory, href: "#" }] : []),
    ...(activeSubcategory ? [{ label: activeSubcategory, href: "#" }] : []),
  ];

  return (
    <div className="min-h-screen bg-gray-950">

      {/* ── Шапка ── */}
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-30 shadow-lg">
        <div className="max-w-screen-xl mx-auto px-4 h-14 flex items-center gap-4">
          <a href="/" className="flex items-center gap-2 shrink-0 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center">
              <Icon name="Wrench" size={16} className="text-white" />
            </div>
            <span className="font-bold text-white text-lg hidden sm:block">Инструменты</span>
          </a>

          <div className="relative flex-1 max-w-2xl">
            <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            <input value={search} onChange={e => handleSearch(e.target.value)}
              placeholder="Поиск по названию, артикулу, бренду..."
              className="w-full bg-gray-800 border border-gray-700 text-white pl-10 pr-8 py-2.5 rounded-lg text-sm focus:outline-none focus:border-orange-400 transition-all placeholder-gray-500" />
            {search && (
              <button onClick={() => handleSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                <Icon name="X" size={14} />
              </button>
            )}
          </div>

          <button onClick={() => setSidebarOpen(v => !v)}
            className={`lg:hidden flex items-center gap-1.5 border rounded-lg px-3 py-2 text-sm transition-colors ${activeFilters ? "border-orange-400 text-orange-400 bg-orange-500/10" : "border-gray-700 text-gray-400"}`}>
            <Icon name="SlidersHorizontal" size={15} />
            <span className="hidden sm:inline">Фильтры</span>
            {activeFilters > 0 && <span className="w-5 h-5 bg-orange-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">{activeFilters}</span>}
          </button>

          <button onClick={() => setCartOpen(true)}
            className="relative flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg shrink-0 transition-colors font-semibold text-sm">
            <Icon name="ShoppingCart" size={16} />
            <span className="hidden sm:inline">Корзина</span>
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ── Баннер с живой травой ── */}
      <div className="relative overflow-hidden bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950" style={{ height: "140px" }}>
        {/* Мягкое свечение */}
        <div className="absolute inset-0 bg-gradient-to-b from-green-900/20 to-transparent" />
        <div className="absolute top-4 right-12 w-32 h-32 bg-green-500/5 rounded-full blur-3xl" />
        <div className="absolute top-2 left-1/3 w-20 h-20 bg-orange-500/5 rounded-full blur-2xl" />
        {/* Текст */}
        <div className="relative z-10 max-w-screen-xl mx-auto px-4 h-full flex items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">Каталог инструментов</h2>
            {total > 0 && (
              <p className="text-gray-400 text-sm mt-0.5">{total.toLocaleString("ru-RU")} товаров</p>
            )}
          </div>
        </div>
        {/* Живая трава */}
        <GrassBackground />
      </div>

      <div className="max-w-screen-xl mx-auto px-4 py-4">

        {/* Хлебные крошки */}
        <nav className="flex items-center gap-1.5 text-sm text-gray-600 mb-4">
          {breadcrumbs.map((bc, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <Icon name="ChevronRight" size={12} className="text-gray-700" />}
              {i < breadcrumbs.length - 1
                ? <a href={bc.href} className="hover:text-orange-400 transition-colors">{bc.label}</a>
                : <span className="text-gray-300 font-medium">{bc.label}</span>
              }
            </span>
          ))}
        </nav>

        <div className="flex gap-6">

          {/* ── Сайдбар ── */}
          <ToolsSidebar
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            activeFilters={activeFilters}
            clearAll={clearAll}
            inStockOnly={inStockOnly}
            handleStock={handleStock}
            categories={categories}
            subcategories={subcategories}
            activeCategory={activeCategory}
            activeSubcategory={activeSubcategory}
            expandedCat={expandedCat}
            setExpandedCat={setExpandedCat}
            total={total}
            handleCat={handleCat}
            handleSubcat={handleSubcat}
            brands={brands}
            activeBrand={activeBrand}
            handleBrand={handleBrand}
            brandsExpanded={brandsExpanded}
            setBrandsExpanded={setBrandsExpanded}
            search={search}
            sort={sort}
            apply={apply}
          />

          {/* ── Контент ── */}
          <div className="flex-1 min-w-0">

            {/* Заголовок раздела + сортировка */}
            <div className="bg-gray-900 rounded-lg border border-gray-800 px-4 py-3 mb-4 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h1 className="font-bold text-white text-lg">
                  {activeSubcategory || activeCategory || "Все инструменты"}
                </h1>
                {total > 0 && (
                  <p className="text-sm text-gray-500">{total.toLocaleString("ru-RU")} товаров</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 hidden sm:inline">Сортировка:</span>
                <select value={sort} onChange={e => handleSort(e.target.value)}
                  className="border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-orange-400 bg-gray-800">
                  <option value="popular">По популярности</option>
                  <option value="price_asc">Цена: по возрастанию</option>
                  <option value="price_desc">Цена: по убыванию</option>
                  <option value="name_asc">По названию</option>
                </select>
              </div>
            </div>

            {/* Активные фильтры */}
            {(activeCategory || activeBrand || inStockOnly) && (
              <div className="flex flex-wrap gap-2 mb-4">
                {activeCategory && (
                  <span className="flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/30 text-orange-400 text-sm px-3 py-1 rounded-full">
                    {activeSubcategory ? `${activeCategory} / ${activeSubcategory}` : activeCategory}
                    <button onClick={() => { setActiveCategory(""); setActiveSubcategory(""); apply(search, "", "", activeBrand, inStockOnly, sort); }}
                      className="hover:text-orange-200"><Icon name="X" size={12} /></button>
                  </span>
                )}
                {activeBrand && (
                  <span className="flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/30 text-orange-400 text-sm px-3 py-1 rounded-full">
                    {activeBrand}
                    <button onClick={() => handleBrand(activeBrand)}><Icon name="X" size={12} /></button>
                  </span>
                )}
                {inStockOnly && (
                  <span className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/30 text-green-400 text-sm px-3 py-1 rounded-full">
                    В наличии
                    <button onClick={() => handleStock(false)}><Icon name="X" size={12} /></button>
                  </span>
                )}
              </div>
            )}

            {/* Сетка товаров */}
            {products.length === 0 && !loading ? (
              <div className="bg-gray-900 rounded-lg border border-gray-800 py-20 text-center">
                <Icon name="Search" size={40} className="text-gray-700 mx-auto mb-4" />
                <p className="text-gray-400 text-lg font-medium">Ничего не найдено</p>
                <p className="text-gray-600 text-sm mt-1">Попробуйте изменить фильтры или поисковый запрос</p>
                <button onClick={clearAll} className="mt-4 text-orange-400 hover:text-orange-300 font-medium text-sm">
                  Сбросить все фильтры
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {products.map(p => (
                  <ToolsProductCard key={p.article} p={p} onAdd={addToCart} />
                ))}
              </div>
            )}

            {/* Лоадер / загрузка ещё */}
            <div ref={loaderRef} className="py-8 text-center">
              {loading && (
                <div className="flex items-center justify-center gap-2 text-gray-400">
                  <Icon name="Loader" size={18} className="animate-spin" />
                  <span className="text-sm">Загружаю...</span>
                </div>
              )}
              {!loading && hasMore && (
                <p className="text-sm text-gray-400">Прокрутите вниз для загрузки ещё</p>
              )}
              {!loading && !hasMore && products.length > 0 && (
                <p className="text-sm text-gray-400">Показано все {total.toLocaleString("ru-RU")} товаров</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {cartOpen && <ToolsCartModal cart={cart} onClose={() => setCartOpen(false)} onRemove={removeFromCart} onQty={changeQty} />}
    </div>
  );
}