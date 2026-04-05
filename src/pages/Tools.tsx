import { useState, useEffect, useCallback, useRef } from "react";
import Icon from "@/components/ui/icon";
import { Product, CartItem, CatMeta, PriceRange, Meta } from "@/components/tools/types";
import ToolsProductCard from "@/components/tools/ToolsProductCard";
import ToolsCartModal from "@/components/tools/ToolsCartModal";
import ToolsSidebar from "@/components/tools/ToolsSidebar";
import ToolsBanners from "@/components/tools/ToolsBanners";

const TOOLS_API = "https://functions.poehali.dev/434ea4ea-de14-4074-a738-e5db6e4f9697";
const PAGE_SIZE = 48;

export default function ToolsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [meta, setMeta] = useState<Meta>({
    categories: [], subcategories: {}, brands: [], amounts: [],
    price_ranges: [], price_min: 0, price_max: 0, with_image_count: 0,
  });
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // фильтры
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Слесарный инструмент");
  const [activeSubcategory, setActiveSubcategory] = useState("");
  const [activeBrand, setActiveBrand] = useState("");
  const [inStockOnly] = useState(false);
  const [activeAmount, setActiveAmount] = useState("");          // "В наличии" | "Под заказ" | ""
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [activePriceRange, setActivePriceRange] = useState(""); // "min-max"
  const [hasImage, setHasImage] = useState(false);

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
    // Параллельный запрос мета и первых товаров
    fetch(`${TOOLS_API}?action=meta`).then(r => r.json()).then((d: Meta) => setMeta(d));
  }, []);

  const load = useCallback(async (
    q: string, off: number, cat: string, subcat: string, brand: string,
    stock: boolean, sortBy: string, amount: string,
    pMin: string, pMax: string, imgOnly: boolean, append = false
  ) => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ action: "products", limit: String(PAGE_SIZE), offset: String(off), sort: sortBy });
      if (q) p.set("search", q);
      if (cat) p.set("category", cat);
      if (subcat) p.set("subcategory", subcat);
      if (brand) p.set("brand", brand);
      if (amount) p.set("amount", amount);
      else if (stock) p.set("in_stock", "1");
      if (pMin) p.set("price_min", pMin);
      if (pMax) p.set("price_max", pMax);
      if (imgOnly) p.set("has_image", "1");
      const res = await fetch(`${TOOLS_API}?${p}`);
      const data = await res.json();
      setProducts(prev => append ? [...prev, ...(data.items || [])] : (data.items || []));
      setTotal(data.total || 0);
      setHasMore(data.has_more);
    } finally { setLoading(false); }
  }, []);

  // Загружаем сразу самую популярную категорию (Слесарный инструмент)
  useEffect(() => { load("", 0, "Слесарный инструмент", "", "", false, "popular", "", "", "", false); }, []);

  useEffect(() => {
    const el = loaderRef.current; if (!el) return;
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        const next = offset + PAGE_SIZE;
        setOffset(next);
        load(search, next, activeCategory, activeSubcategory, activeBrand, inStockOnly, sort, activeAmount, priceMin, priceMax, hasImage, true);
      }
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, loading, offset, search, activeCategory, activeSubcategory, activeBrand, inStockOnly, sort, activeAmount, priceMin, priceMax, hasImage, load]);

  const apply = (
    q: string, cat: string, subcat: string, brand: string, stock: boolean,
    sortBy: string, amount: string, pMin: string, pMax: string, imgOnly: boolean
  ) => {
    setOffset(0);
    load(q, 0, cat, subcat, brand, stock, sortBy, amount, pMin, pMax, imgOnly);
  };

  const handleSearch = (val: string) => {
    setSearch(val);
    clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() =>
      apply(val, activeCategory, activeSubcategory, activeBrand, inStockOnly, sort, activeAmount, priceMin, priceMax, hasImage), 350);
  };

  const handleCat = (c: string) => {
    const newCat = activeCategory === c && !activeSubcategory ? "" : c;
    setActiveCategory(newCat); setActiveSubcategory(""); setExpandedCat(newCat);
    apply(search, newCat, "", activeBrand, inStockOnly, sort, activeAmount, priceMin, priceMax, hasImage);
    setSidebarOpen(false);
  };

  const handleSubcat = (cat: string, sub: string) => {
    const newSub = activeSubcategory === sub ? "" : sub;
    setActiveCategory(cat); setActiveSubcategory(newSub);
    apply(search, cat, newSub, activeBrand, inStockOnly, sort, activeAmount, priceMin, priceMax, hasImage);
    setSidebarOpen(false);
  };

  const handleBrand = (b: string) => {
    const n = activeBrand === b ? "" : b;
    setActiveBrand(n);
    apply(search, activeCategory, activeSubcategory, n, inStockOnly, sort, activeAmount, priceMin, priceMax, hasImage);
  };

  const handleAmount = (v: string) => {
    setActiveAmount(v);
    apply(search, activeCategory, activeSubcategory, activeBrand, inStockOnly, sort, v, priceMin, priceMax, hasImage);
  };

  const handlePriceRange = (min: number, max: number | null) => {
    const key = `${min}-${max ?? ""}`;
    const isActive = activePriceRange === key;
    const newMin = isActive ? "" : String(min);
    const newMax = isActive ? "" : (max !== null ? String(max) : "");
    setActivePriceRange(isActive ? "" : key);
    setPriceMin(newMin); setPriceMax(newMax);
    apply(search, activeCategory, activeSubcategory, activeBrand, inStockOnly, sort, activeAmount, newMin, newMax, hasImage);
  };

  const handlePriceInput = (min: string, max: string) => {
    setPriceMin(min); setPriceMax(max);
    setActivePriceRange("");
    apply(search, activeCategory, activeSubcategory, activeBrand, inStockOnly, sort, activeAmount, min, max, hasImage);
  };

  const handleHasImage = (v: boolean) => {
    setHasImage(v);
    apply(search, activeCategory, activeSubcategory, activeBrand, inStockOnly, sort, activeAmount, priceMin, priceMax, v);
  };

  const handleSort = (s: string) => {
    setSort(s);
    apply(search, activeCategory, activeSubcategory, activeBrand, inStockOnly, s, activeAmount, priceMin, priceMax, hasImage);
  };

  const clearAll = () => {
    setSearch(""); setActiveCategory(""); setActiveSubcategory("");
    setActiveBrand(""); setActiveAmount(""); setPriceMin(""); setPriceMax("");
    setActivePriceRange(""); setHasImage(false); setSort("popular"); setOffset(0);
    load("", 0, "", "", "", false, "popular", "", "", "", false);
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
  const activeFilters = [activeCategory, activeBrand, activeAmount, priceMin || priceMax ? "1" : "", hasImage ? "1" : ""].filter(Boolean).length;

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

      {/* ── Баннеры категорий ── */}
      <ToolsBanners
        activeCategory={activeCategory}
        onCategory={(cat) => {
          setActiveCategory(cat);
          setActiveSubcategory("");
          setExpandedCat(cat);
          apply(search, cat, "", activeBrand, inStockOnly, sort, activeAmount, priceMin, priceMax, hasImage);
          setSidebarOpen(false);
        }}
        total={total}
      />

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

        <div className="flex gap-4 lg:gap-6">

          {/* ── Сайдбар ── */}
          <ToolsSidebar
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            activeFilters={activeFilters}
            clearAll={clearAll}
            inStockOnly={inStockOnly}
            categories={meta.categories}
            subcategories={meta.subcategories}
            activeCategory={activeCategory}
            activeSubcategory={activeSubcategory}
            expandedCat={expandedCat}
            setExpandedCat={setExpandedCat}
            total={total}
            handleCat={handleCat}
            handleSubcat={handleSubcat}
            brands={meta.brands}
            activeBrand={activeBrand}
            handleBrand={handleBrand}
            brandsExpanded={brandsExpanded}
            setBrandsExpanded={setBrandsExpanded}
            amounts={meta.amounts}
            activeAmount={activeAmount}
            handleAmount={handleAmount}
            priceRanges={meta.price_ranges}
            activePriceRange={activePriceRange}
            handlePriceRange={handlePriceRange}
            priceMin={priceMin}
            priceMax={priceMax}
            globalPriceMin={meta.price_min}
            globalPriceMax={meta.price_max}
            handlePriceInput={handlePriceInput}
            hasImage={hasImage}
            handleHasImage={handleHasImage}
            withImageCount={meta.with_image_count}
            search={search}
            sort={sort}
            activeBrandForApply={activeBrand}
            apply={apply}
          />

          {/* ── Контент ── */}
          <div className="flex-1 min-w-0">

            {/* Заголовок + сортировка */}
            <div className="bg-gray-900 rounded-lg border border-gray-800 px-4 py-3 mb-4 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h1 className="font-bold text-white text-lg">
                  {activeSubcategory || activeCategory || "Все инструменты"}
                </h1>
                {total > 0 && <p className="text-sm text-gray-500">{total.toLocaleString("ru-RU")} товаров</p>}
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

            {/* Активные фильтры — теги */}
            {activeFilters > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {activeCategory && (
                  <span className="flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/30 text-orange-400 text-sm px-3 py-1 rounded-full">
                    {activeSubcategory ? `${activeCategory} / ${activeSubcategory}` : activeCategory}
                    <button onClick={() => { setActiveCategory(""); setActiveSubcategory(""); apply(search, "", "", activeBrand, inStockOnly, sort, activeAmount, priceMin, priceMax, hasImage); }}>
                      <Icon name="X" size={12} /></button>
                  </span>
                )}
                {activeBrand && (
                  <span className="flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/30 text-orange-400 text-sm px-3 py-1 rounded-full">
                    {activeBrand}
                    <button onClick={() => handleBrand(activeBrand)}><Icon name="X" size={12} /></button>
                  </span>
                )}
                {activeAmount && (
                  <span className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/30 text-green-400 text-sm px-3 py-1 rounded-full">
                    {activeAmount}
                    <button onClick={() => handleAmount("")}><Icon name="X" size={12} /></button>
                  </span>
                )}
                {(priceMin || priceMax) && (
                  <span className="flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-sm px-3 py-1 rounded-full">
                    {priceMin && priceMax ? `${priceMin} — ${priceMax} ₽` : priceMin ? `от ${priceMin} ₽` : `до ${priceMax} ₽`}
                    <button onClick={() => { setPriceMin(""); setPriceMax(""); setActivePriceRange(""); apply(search, activeCategory, activeSubcategory, activeBrand, inStockOnly, sort, activeAmount, "", "", hasImage); }}>
                      <Icon name="X" size={12} /></button>
                  </span>
                )}
                {hasImage && (
                  <span className="flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/30 text-purple-400 text-sm px-3 py-1 rounded-full">
                    С фото
                    <button onClick={() => handleHasImage(false)}><Icon name="X" size={12} /></button>
                  </span>
                )}
              </div>
            )}

            {/* Skeleton при первой загрузке */}
            {loading && products.length === 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden animate-pulse">
                    <div className="bg-gray-800 aspect-square" />
                    <div className="p-3 space-y-2">
                      <div className="h-2 bg-gray-800 rounded w-1/3" />
                      <div className="h-3 bg-gray-800 rounded w-full" />
                      <div className="h-3 bg-gray-800 rounded w-3/4" />
                      <div className="h-6 bg-gray-800 rounded w-1/2 mt-2" />
                      <div className="h-8 bg-gray-800 rounded" />
                    </div>
                  </div>
                ))}
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
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3">
                {products.map(p => (
                  <ToolsProductCard key={p.article} p={p} onAdd={addToCart} />
                ))}
              </div>
            )}

            {/* Лоадер */}
            <div ref={loaderRef} className="py-8 text-center">
              {loading && (
                <div className="flex items-center justify-center gap-2 text-gray-600">
                  <Icon name="Loader" size={18} className="animate-spin" />
                  <span className="text-sm">Загружаю...</span>
                </div>
              )}
              {!loading && hasMore && <p className="text-sm text-gray-600">Прокрутите вниз для загрузки ещё</p>}
              {!loading && !hasMore && products.length > 0 && (
                <p className="text-sm text-gray-700">Показано все {total.toLocaleString("ru-RU")} товаров</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {cartOpen && <ToolsCartModal cart={cart} onClose={() => setCartOpen(false)} onRemove={removeFromCart} onQty={changeQty} />}
    </div>
  );
}