import { useState, useEffect, useCallback, useRef } from "react";
import Icon from "@/components/ui/icon";

const TOOLS_API = "https://functions.poehali.dev/434ea4ea-de14-4074-a738-e5db6e4f9697";
const SEND_API = "https://functions.poehali.dev/52666ff7-db52-4b6a-a90e-d60aeed699de";
const PAGE_SIZE = 48;

interface Product {
  article: string; name: string; brand: string; category: string;
  base_price: number; discount_price: number; amount: string;
  image_url: string; is_hit: boolean; is_new: boolean;
}
interface CartItem extends Product { qty: number; }
interface CatMeta { name: string; count: number; }

const fmt = (n: number) =>
  n > 0 ? n.toLocaleString("ru-RU", { maximumFractionDigits: 0 }) + " ₽" : "—";

const disc = (p: Product) =>
  p.base_price > 0 && p.discount_price > 0 && p.base_price > p.discount_price
    ? Math.round((1 - p.discount_price / p.base_price) * 100) : 0;

/* ───────── Карточка товара ───────── */
const ProductCard = ({ p, onAdd }: { p: Product; onAdd: (p: Product) => void }) => {
  const d = disc(p);
  const inStock = p.amount === "В наличии";
  const myPrice = p.discount_price || p.base_price;
  const [imgErr, setImgErr] = useState(false);
  const [added, setAdded] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col hover:shadow-md hover:border-orange-400 transition-all group cursor-pointer">
      <div className="relative bg-gray-50 flex items-center justify-center overflow-hidden" style={{ aspectRatio: "1" }}>
        {d > 0 && (
          <span className="absolute top-2 left-2 z-10 bg-red-500 text-white text-[11px] font-bold px-2 py-0.5 rounded">
            -{d}%
          </span>
        )}
        {p.is_hit && (
          <span className="absolute top-2 right-2 z-10 bg-orange-400 text-white text-[10px] font-bold px-2 py-0.5 rounded">
            Хит
          </span>
        )}
        {p.image_url && !imgErr ? (
          <img src={p.image_url} alt={p.name}
            className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgErr(true)} />
        ) : (
          <Icon name="Package" size={48} className="text-gray-300" />
        )}
      </div>

      <div className="p-3 flex flex-col flex-1">
        <div className="text-[11px] text-gray-400 font-mono mb-1">Арт. {p.article}</div>

        <p className="text-sm text-gray-800 leading-snug flex-1 mb-2 line-clamp-3 group-hover:text-orange-600 transition-colors">
          {p.name}
        </p>

        {p.brand && (
          <div className="text-[11px] text-gray-400 mb-2">{p.brand}</div>
        )}

        <div className="flex items-center gap-1.5 mb-3">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${inStock ? "bg-green-500" : "bg-gray-300"}`} />
          <span className={`text-[11px] ${inStock ? "text-green-600" : "text-gray-400"}`}>
            {inStock ? "В наличии" : "Уточняйте"}
          </span>
        </div>

        <div className="mb-3">
          {myPrice > 0 ? (
            <>
              {d > 0 && (
                <div className="text-xs text-gray-400 line-through">{fmt(p.base_price)}</div>
              )}
              <div className="text-xl font-bold text-gray-900">{fmt(myPrice)}</div>
            </>
          ) : (
            <div className="text-sm text-gray-400">Цена по запросу</div>
          )}
        </div>

        <button
          onClick={() => { onAdd(p); setAdded(true); setTimeout(() => setAdded(false), 1500); }}
          className={`w-full py-2 text-sm font-semibold rounded transition-all ${
            added
              ? "bg-green-500 text-white"
              : "bg-orange-500 hover:bg-orange-600 text-white"
          }`}
        >
          {added ? "✓ Добавлено" : "В корзину"}
        </button>
      </div>
    </div>
  );
};

/* ───────── Корзина ───────── */
const CartModal = ({ cart, onClose, onRemove, onQty }: {
  cart: CartItem[]; onClose: () => void;
  onRemove: (a: string) => void; onQty: (a: string, d: number) => void;
}) => {
  const [name, setName] = useState(""); const [phone, setPhone] = useState("");
  const [sending, setSending] = useState(false); const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");
  const total = cart.reduce((s, i) => s + (i.discount_price || i.base_price) * i.qty, 0);

  const handleOrder = async () => {
    if (!name.trim() || !phone.trim()) { setErr("Заполните имя и телефон"); return; }
    setSending(true); setErr("");
    try {
      const lines = cart.map(i =>
        `• Арт. ${i.article} — ${i.name} × ${i.qty} шт. = ${fmt((i.discount_price || i.base_price) * i.qty)}`
      ).join("\n");
      await fetch(SEND_API, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, category: "Инструменты", desc: `${lines}\n\nИтого: ${fmt(total)}` }),
      });
      setSent(true);
    } catch { setErr("Ошибка отправки"); } finally { setSending(false); }
  };

  if (sent) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-sm w-full text-center">
        <div className="text-5xl mb-4">✅</div>
        <div className="text-xl font-bold text-gray-900 mb-2">Заказ принят!</div>
        <p className="text-gray-500 text-sm mb-6">Мы свяжемся с вами в ближайшее время</p>
        <button onClick={onClose} className="bg-orange-500 text-white font-bold px-8 py-2.5 rounded">Закрыть</button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl w-full sm:max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <span className="font-bold text-gray-900 text-lg">
            Корзина {cart.length > 0 && `(${cart.reduce((s, i) => s + i.qty, 0)} шт.)`}
          </span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><Icon name="X" size={20} /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-4 space-y-3">
          {cart.length === 0 && <p className="text-gray-400 text-center py-10">Корзина пуста</p>}
          {cart.map(item => (
            <div key={item.article} className="flex gap-3 items-start border border-gray-100 rounded-lg p-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 font-mono">Арт. {item.article}</p>
                <p className="text-sm text-gray-800 leading-snug mt-0.5 line-clamp-2">{item.name}</p>
                <p className="text-sm font-bold text-gray-900 mt-1">{fmt((item.discount_price || item.base_price) * item.qty)}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => onQty(item.article, -1)} className="w-7 h-7 border border-gray-200 rounded flex items-center justify-center hover:bg-gray-50 text-gray-600 font-bold">−</button>
                <span className="text-gray-900 text-sm w-6 text-center font-bold">{item.qty}</span>
                <button onClick={() => onQty(item.article, 1)} className="w-7 h-7 border border-gray-200 rounded flex items-center justify-center hover:bg-gray-50 text-gray-600 font-bold">+</button>
                <button onClick={() => onRemove(item.article)} className="w-7 h-7 text-gray-300 hover:text-red-400 flex items-center justify-center ml-1"><Icon name="X" size={14} /></button>
              </div>
            </div>
          ))}
        </div>
        {cart.length > 0 && (
          <div className="p-4 border-t space-y-3">
            <div className="flex justify-between font-bold text-gray-900 text-lg">
              <span>Итого:</span>
              <span className="text-orange-500">{fmt(total)}</span>
            </div>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Ваше имя"
              className="w-full border border-gray-200 text-gray-900 px-3 py-2.5 rounded text-sm focus:outline-none focus:border-orange-400 placeholder-gray-400" />
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+7 (___) ___-__-__"
              className="w-full border border-gray-200 text-gray-900 px-3 py-2.5 rounded text-sm focus:outline-none focus:border-orange-400 placeholder-gray-400" />
            {err && <p className="text-red-500 text-xs">{err}</p>}
            <button onClick={handleOrder} disabled={sending}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-3 rounded transition-colors text-base">
              {sending ? "Отправляю..." : "Оформить заказ"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/* ───────── Главная страница ───────── */
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
  const visibleBrands = brandsExpanded ? brands : brands.slice(0, 10);

  // Хлебные крошки
  const breadcrumbs = [
    { label: "Главная", href: "/" },
    { label: "Инструменты", href: "/tools" },
    ...(activeCategory ? [{ label: activeCategory, href: "#" }] : []),
    ...(activeSubcategory ? [{ label: activeSubcategory, href: "#" }] : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Шапка ── */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-screen-xl mx-auto px-4 h-14 flex items-center gap-4">
          <a href="/" className="flex items-center gap-2 shrink-0 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center">
              <Icon name="Wrench" size={16} className="text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg hidden sm:block">Инструменты</span>
          </a>

          <div className="relative flex-1 max-w-2xl">
            <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input value={search} onChange={e => handleSearch(e.target.value)}
              placeholder="Поиск по названию, артикулу, бренду..."
              className="w-full bg-gray-100 border border-gray-200 text-gray-900 pl-10 pr-8 py-2.5 rounded-lg text-sm focus:outline-none focus:border-orange-400 focus:bg-white transition-all placeholder-gray-400" />
            {search && (
              <button onClick={() => handleSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <Icon name="X" size={14} />
              </button>
            )}
          </div>

          <button onClick={() => setSidebarOpen(v => !v)}
            className={`lg:hidden flex items-center gap-1.5 border rounded-lg px-3 py-2 text-sm transition-colors ${activeFilters ? "border-orange-400 text-orange-500 bg-orange-50" : "border-gray-200 text-gray-500"}`}>
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

      <div className="max-w-screen-xl mx-auto px-4 py-4">

        {/* Хлебные крошки */}
        <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-4">
          {breadcrumbs.map((bc, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <Icon name="ChevronRight" size={12} className="text-gray-300" />}
              {i < breadcrumbs.length - 1
                ? <a href={bc.href} className="hover:text-orange-500 transition-colors">{bc.label}</a>
                : <span className="text-gray-900 font-medium">{bc.label}</span>
              }
            </span>
          ))}
        </nav>

        <div className="flex gap-6">

          {/* ── Сайдбар ── */}
          {sidebarOpen && <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}
          <aside className={`
            fixed top-0 left-0 h-full z-30 w-72 bg-white shadow-2xl overflow-y-auto
            lg:relative lg:top-auto lg:left-auto lg:h-auto lg:w-64 lg:shrink-0 lg:shadow-none lg:bg-transparent
            transition-transform duration-200
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          `}>
            <div className="lg:bg-white lg:rounded-lg lg:border lg:border-gray-200 p-4">

              {/* Мобильный заголовок */}
              <div className="flex items-center justify-between mb-4 lg:hidden">
                <span className="font-bold text-gray-900 text-lg">Фильтры</span>
                <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-gray-600"><Icon name="X" size={20} /></button>
              </div>

              {activeFilters > 0 && (
                <button onClick={clearAll} className="flex items-center gap-1.5 text-sm text-orange-500 hover:text-orange-600 mb-4 transition-colors font-medium">
                  <Icon name="X" size={13} />Сбросить все фильтры
                </button>
              )}

              {/* В наличии */}
              <label className="flex items-center gap-3 cursor-pointer mb-5 pb-5 border-b border-gray-100"
                onClick={() => handleStock(!inStockOnly)}>
                <div className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${inStockOnly ? "bg-orange-500" : "bg-gray-200"}`}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${inStockOnly ? "translate-x-5" : "translate-x-0.5"}`} />
                </div>
                <span className="text-sm text-gray-700 font-medium">Только в наличии</span>
              </label>

              {/* Категории */}
              <div className="mb-5">
                <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Категории</div>
                <div className="space-y-0.5">
                  <button onClick={() => { setActiveCategory(""); setActiveSubcategory(""); setExpandedCat(""); apply(search, "", "", activeBrand, inStockOnly, sort); }}
                    className={`w-full text-left px-2 py-2 text-sm rounded-lg transition-colors flex items-center justify-between
                      ${!activeCategory ? "bg-orange-50 text-orange-600 font-semibold" : "text-gray-600 hover:bg-gray-50"}`}>
                    <span>Все категории</span>
                    {!activeCategory && <span className="text-xs text-orange-400">{total.toLocaleString("ru-RU")}</span>}
                  </button>

                  {categories.map(cat => {
                    const subs = subcategories[cat.name] || [];
                    const isActive = activeCategory === cat.name;
                    const isExpanded = expandedCat === cat.name;

                    return (
                      <div key={cat.name}>
                        <button
                          onClick={() => {
                            if (subs.length > 0) {
                              setExpandedCat(isExpanded ? "" : cat.name);
                              if (!isActive) handleCat(cat.name);
                            } else {
                              handleCat(cat.name);
                            }
                          }}
                          className={`w-full text-left px-2 py-2 text-sm rounded-lg transition-colors flex items-center justify-between
                            ${isActive && !activeSubcategory ? "bg-orange-50 text-orange-600 font-semibold" : "text-gray-600 hover:bg-gray-50"}`}
                        >
                          <span className="truncate">{cat.name}</span>
                          <div className="flex items-center gap-1 shrink-0 ml-1">
                            <span className="text-xs text-gray-400">{cat.count.toLocaleString("ru-RU")}</span>
                            {subs.length > 0 && (
                              <Icon name={isExpanded ? "ChevronDown" : "ChevronRight"} size={12} className="text-gray-400" />
                            )}
                          </div>
                        </button>

                        {isExpanded && subs.length > 0 && (
                          <div className="ml-3 mt-0.5 space-y-0.5 border-l-2 border-orange-100 pl-2">
                            {subs.map(sub => (
                              <button key={sub.name}
                                onClick={() => handleSubcat(cat.name, sub.name)}
                                className={`w-full text-left px-2 py-1.5 text-sm rounded transition-colors flex items-center justify-between
                                  ${activeSubcategory === sub.name ? "text-orange-600 font-semibold bg-orange-50" : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"}`}
                              >
                                <span className="truncate">{sub.name}</span>
                                <span className="text-xs text-gray-400 shrink-0 ml-1">{sub.count.toLocaleString("ru-RU")}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Бренды */}
              {brands.length > 0 && (
                <div className="border-t border-gray-100 pt-4">
                  <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Бренды</div>
                  <div className="space-y-1">
                    {visibleBrands.map(b => (
                      <label key={b.name} className="flex items-center gap-2.5 cursor-pointer group" onClick={() => handleBrand(b.name)}>
                        <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors
                          ${activeBrand === b.name ? "bg-orange-500 border-orange-500" : "border-gray-300 group-hover:border-orange-400"}`}>
                          {activeBrand === b.name && <Icon name="Check" size={10} className="text-white" />}
                        </div>
                        <span className={`text-sm flex-1 ${activeBrand === b.name ? "text-orange-600 font-medium" : "text-gray-600"}`}>{b.name}</span>
                        <span className="text-xs text-gray-400">{b.count.toLocaleString("ru-RU")}</span>
                      </label>
                    ))}
                  </div>
                  {brands.length > 10 && (
                    <button onClick={() => setBrandsExpanded(v => !v)}
                      className="mt-2 text-sm text-orange-500 hover:text-orange-600 flex items-center gap-1 font-medium">
                      <Icon name={brandsExpanded ? "ChevronUp" : "ChevronDown"} size={14} />
                      {brandsExpanded ? "Свернуть" : `Ещё ${brands.length - 10} брендов`}
                    </button>
                  )}
                </div>
              )}
            </div>
          </aside>

          {/* ── Контент ── */}
          <div className="flex-1 min-w-0">

            {/* Заголовок раздела + сортировка */}
            <div className="bg-white rounded-lg border border-gray-200 px-4 py-3 mb-4 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h1 className="font-bold text-gray-900 text-lg">
                  {activeSubcategory || activeCategory || "Все инструменты"}
                </h1>
                {total > 0 && (
                  <p className="text-sm text-gray-500">{total.toLocaleString("ru-RU")} товаров</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 hidden sm:inline">Сортировка:</span>
                <select value={sort} onChange={e => handleSort(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:border-orange-400 bg-white">
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
                  <span className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 text-orange-700 text-sm px-3 py-1 rounded-full">
                    {activeSubcategory ? `${activeCategory} / ${activeSubcategory}` : activeCategory}
                    <button onClick={() => { setActiveCategory(""); setActiveSubcategory(""); apply(search, "", "", activeBrand, inStockOnly, sort); }}
                      className="hover:text-orange-900"><Icon name="X" size={12} /></button>
                  </span>
                )}
                {activeBrand && (
                  <span className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 text-orange-700 text-sm px-3 py-1 rounded-full">
                    {activeBrand}
                    <button onClick={() => handleBrand(activeBrand)}><Icon name="X" size={12} /></button>
                  </span>
                )}
                {inStockOnly && (
                  <span className="flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 text-sm px-3 py-1 rounded-full">
                    В наличии
                    <button onClick={() => handleStock(false)}><Icon name="X" size={12} /></button>
                  </span>
                )}
              </div>
            )}

            {/* Сетка товаров */}
            {products.length === 0 && !loading ? (
              <div className="bg-white rounded-lg border border-gray-200 py-20 text-center">
                <Icon name="Search" size={40} className="text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-medium">Ничего не найдено</p>
                <p className="text-gray-400 text-sm mt-1">Попробуйте изменить фильтры или поисковый запрос</p>
                <button onClick={clearAll} className="mt-4 text-orange-500 hover:text-orange-600 font-medium text-sm">
                  Сбросить все фильтры
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {products.map(p => (
                  <ProductCard key={p.article} p={p} onAdd={addToCart} />
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

      {cartOpen && <CartModal cart={cart} onClose={() => setCartOpen(false)} onRemove={removeFromCart} onQty={changeQty} />}
    </div>
  );
}
