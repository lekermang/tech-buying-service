import { useState, useEffect, useCallback, useRef } from "react";
import Icon from "@/components/ui/icon";

const TOOLS_API = "https://functions.poehali.dev/434ea4ea-de14-4074-a738-e5db6e4f9697";
const SEND_API = "https://functions.poehali.dev/52666ff7-db52-4b6a-a90e-d60aeed699de";
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

interface CartItem extends Product { qty: number; }

const fmt = (n: number) =>
  n > 0 ? n.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " ₽" : "";

const disc = (p: Product) =>
  p.base_price > 0 && p.discount_price > 0 && p.base_price > p.discount_price
    ? Math.round((1 - p.discount_price / p.base_price) * 100) : 0;

const ProductCard = ({ p, onAdd }: { p: Product; onAdd: (p: Product) => void }) => {
  const d = disc(p);
  const inStock = p.amount === "В наличии";
  const myPrice = p.discount_price || p.base_price;
  const [imgErr, setImgErr] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    onAdd(p);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg overflow-hidden flex flex-col hover:border-[#FFD700]/30 transition-all group">
      <div className="relative aspect-square bg-[#111] flex items-center justify-center overflow-hidden">
        {p.is_hit && <span className="absolute top-2 left-2 z-10 bg-[#FFD700] text-black text-[10px] font-bold px-2 py-0.5 rounded-sm">Хит</span>}
        {d > 0 && <span className="absolute top-2 right-2 z-10 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm">-{d}%</span>}
        {p.image_url && !imgErr ? (
          <img src={p.image_url} alt={p.name}
            className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgErr(true)} />
        ) : (
          <Icon name="Package" size={40} className="text-[#333]" />
        )}
      </div>
      <div className="p-3 flex flex-col flex-1">
        <div className="font-mono text-[11px] text-[#FFD700]/50 mb-1">{p.article}</div>
        <div className="flex items-center gap-1.5 mb-2">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${inStock ? "bg-green-500" : "bg-[#444]"}`} />
          <span className={`text-[11px] ${inStock ? "text-green-400" : "text-white/30"}`}>
            {inStock ? "В наличии" : "Уточняйте"}
          </span>
        </div>
        <p className="text-sm text-white/85 leading-snug flex-1 mb-3 line-clamp-3">{p.name}</p>
        <div className="mt-auto mb-3">
          {myPrice > 0 ? (
            <>
              {d > 0 && <div className="text-[11px] text-white/25 line-through">Базовая: {fmt(p.base_price)}</div>}
              <div className="flex items-baseline gap-1">
                <span className="text-[11px] text-white/40">Ваша цена:</span>
                <span className="text-lg font-bold text-[#FFD700]">{fmt(myPrice)}</span>
              </div>
            </>
          ) : (
            <span className="text-xs text-white/25">Цена уточняется</span>
          )}
        </div>
        <button onClick={handleAdd}
          className={`w-full py-2 text-sm font-bold rounded-sm transition-all ${added ? "bg-green-600 text-white" : "bg-[#FFD700] hover:bg-[#FFE033] text-black"}`}>
          {added ? "✓ Добавлено" : "В корзину"}
        </button>
      </div>
    </div>
  );
};

const CartModal = ({ cart, onClose, onRemove, onQty }: {
  cart: CartItem[]; onClose: () => void;
  onRemove: (a: string) => void; onQty: (a: string, d: number) => void;
}) => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
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
        body: JSON.stringify({
          name,
          phone,
          category: "Инструменты",
          desc: `${lines}\n\nИтого: ${fmt(total)}`,
        }),
      });
      setSent(true);
    } catch { setErr("Ошибка отправки"); } finally { setSending(false); }
  };

  if (sent) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="bg-[#1A1A1A] border border-[#FFD700]/30 rounded-xl p-8 max-w-sm w-full text-center">
        <div className="text-5xl mb-4">✅</div>
        <div className="text-xl font-bold text-[#FFD700] mb-2">Заказ принят!</div>
        <p className="text-white/50 text-sm mb-6">Мы свяжемся с вами в ближайшее время</p>
        <button onClick={onClose} className="bg-[#FFD700] text-black font-bold px-8 py-2.5 rounded-sm">Закрыть</button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 p-0 sm:p-4">
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-t-2xl sm:rounded-xl w-full sm:max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-[#2A2A2A]">
          <span className="font-bold text-white text-lg">Корзина {cart.length > 0 && `(${cart.reduce((s,i)=>s+i.qty,0)})`}</span>
          <button onClick={onClose} className="text-white/30 hover:text-white"><Icon name="X" size={20} /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-4 space-y-3">
          {cart.length === 0 && <p className="text-white/20 text-center py-10">Корзина пуста</p>}
          {cart.map(item => (
            <div key={item.article} className="flex gap-3 items-start bg-[#111] rounded-lg p-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[#FFD700]/50 font-mono">{item.article}</p>
                <p className="text-sm text-white/80 leading-snug mt-0.5 line-clamp-2">{item.name}</p>
                <p className="text-sm font-bold text-[#FFD700] mt-1">{fmt((item.discount_price || item.base_price) * item.qty)}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => onQty(item.article, -1)} className="w-7 h-7 bg-[#2A2A2A] text-white rounded-sm flex items-center justify-center hover:bg-[#333] text-lg font-bold">−</button>
                <span className="text-white text-sm w-6 text-center font-bold">{item.qty}</span>
                <button onClick={() => onQty(item.article, 1)} className="w-7 h-7 bg-[#2A2A2A] text-white rounded-sm flex items-center justify-center hover:bg-[#333] text-lg font-bold">+</button>
                <button onClick={() => onRemove(item.article)} className="w-7 h-7 text-white/20 hover:text-red-400 flex items-center justify-center ml-1"><Icon name="X" size={14} /></button>
              </div>
            </div>
          ))}
        </div>
        {cart.length > 0 && (
          <div className="p-4 border-t border-[#2A2A2A] space-y-3">
            <div className="flex justify-between font-bold text-white">
              <span>Итого:</span>
              <span className="text-[#FFD700] text-lg">{fmt(total)}</span>
            </div>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Ваше имя"
              className="w-full bg-[#111] border border-[#333] text-white px-3 py-2.5 rounded-sm text-sm focus:outline-none focus:border-[#FFD700]" />
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+7 (___) ___-__-__"
              className="w-full bg-[#111] border border-[#333] text-white px-3 py-2.5 rounded-sm text-sm focus:outline-none focus:border-[#FFD700]" />
            {err && <p className="text-red-400 text-xs">{err}</p>}
            <button onClick={handleOrder} disabled={sending}
              className="w-full bg-[#FFD700] hover:bg-[#FFE033] disabled:opacity-50 text-black font-bold py-3 rounded-sm transition-colors text-base">
              {sending ? "Отправляю..." : "Оформить заказ"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default function ToolsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [activeBrand, setActiveBrand] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const searchRef = useRef<ReturnType<typeof setTimeout>>();
  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`${TOOLS_API}?action=meta`).then(r => r.json())
      .then(d => { setCategories(d.categories || []); setBrands(d.brands || []); });
  }, []);

  const load = useCallback(async (q: string, off: number, cat: string, brand: string, stock: boolean, append = false) => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ action: "products", limit: String(PAGE_SIZE), offset: String(off) });
      if (q) p.set("search", q);
      if (cat) p.set("category", cat);
      if (brand) p.set("brand", brand);
      if (stock) p.set("in_stock", "1");
      const res = await fetch(`${TOOLS_API}?${p}`);
      const data = await res.json();
      const items: Product[] = data.items || [];
      setProducts(prev => append ? [...prev, ...items] : items);
      setTotal(data.total || 0);
      setHasMore(data.has_more);
    } finally { setLoading(false); }
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

  const apply = (q: string, cat: string, brand: string, stock: boolean) => { setOffset(0); load(q, 0, cat, brand, stock); };
  const handleSearch = (val: string) => {
    setSearch(val);
    clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => apply(val, activeCategory, activeBrand, inStockOnly), 350);
  };
  const handleCat = (c: string) => { const n = activeCategory === c ? "" : c; setActiveCategory(n); apply(search, n, activeBrand, inStockOnly); setSidebarOpen(false); };
  const handleBrand = (b: string) => { const n = activeBrand === b ? "" : b; setActiveBrand(n); apply(search, activeCategory, n, inStockOnly); };
  const handleStock = (v: boolean) => { setInStockOnly(v); apply(search, activeCategory, activeBrand, v); };
  const clearAll = () => { setSearch(""); setActiveCategory(""); setActiveBrand(""); setInStockOnly(false); setOffset(0); load("", 0, "", "", false); };

  const addToCart = (p: Product) => setCart(prev => {
    const ex = prev.find(i => i.article === p.article);
    return ex ? prev.map(i => i.article === p.article ? { ...i, qty: i.qty + 1 } : i) : [...prev, { ...p, qty: 1 }];
  });
  const removeFromCart = (a: string) => setCart(prev => prev.filter(i => i.article !== a));
  const changeQty = (a: string, d: number) => setCart(prev => prev.map(i => i.article === a ? { ...i, qty: Math.max(1, i.qty + d) } : i));

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const activeFilters = [activeCategory, activeBrand, inStockOnly ? "1" : ""].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      {/* Шапка */}
      <div className="sticky top-0 z-30 bg-[#0D0D0D]/95 backdrop-blur-sm border-b border-[#1E1E1E]">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 flex items-center gap-3">
          <a href="/" className="text-white/40 hover:text-[#FFD700] transition-colors shrink-0">
            <Icon name="ArrowLeft" size={20} />
          </a>
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-1 h-5 bg-[#FFD700]" />
            <span className="font-oswald font-bold text-base sm:text-lg uppercase tracking-wider">Инструменты</span>
            {total > 0 && <span className="text-white/25 text-xs hidden md:inline">{total.toLocaleString("ru-RU")} товаров</span>}
          </div>

          <div className="relative flex-1 max-w-lg">
            <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
            <input value={search} onChange={e => handleSearch(e.target.value)}
              placeholder="Поиск по названию или артикулу..."
              className="w-full bg-[#111] border border-[#2A2A2A] text-white pl-9 pr-8 py-2 text-sm rounded-sm focus:outline-none focus:border-[#FFD700]/50 transition-colors" />
            {search && <button onClick={() => handleSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/20 hover:text-white"><Icon name="X" size={13} /></button>}
          </div>

          <button onClick={() => setSidebarOpen(v => !v)}
            className={`lg:hidden flex items-center gap-1.5 border rounded-sm px-3 py-2 text-xs shrink-0 transition-colors ${activeFilters ? "border-[#FFD700]/60 text-[#FFD700]" : "border-[#2A2A2A] text-white/40 hover:border-[#444]"}`}>
            <Icon name="SlidersHorizontal" size={13} />
            {activeFilters > 0 && <span className="w-4 h-4 bg-[#FFD700] text-black text-[10px] rounded-full flex items-center justify-center font-bold">{activeFilters}</span>}
          </button>

          <button onClick={() => setCartOpen(true)}
            className="relative flex items-center gap-2 bg-[#FFD700] hover:bg-[#FFE033] text-black px-3 py-2 rounded-sm shrink-0 transition-colors font-bold text-sm">
            <Icon name="ShoppingCart" size={16} />
            {cartCount > 0 && <span className="font-bold">{cartCount}</span>}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex">
        {/* Сайдбар */}
        {sidebarOpen && <div className="fixed inset-0 z-20 bg-black/70 lg:hidden" onClick={() => setSidebarOpen(false)} />}
        <aside className={`fixed top-0 left-0 h-full z-30 w-64 bg-[#111] border-r border-[#1E1E1E] overflow-y-auto lg:relative lg:top-auto lg:left-auto lg:h-auto lg:w-52 xl:w-60 lg:bg-transparent lg:border-r-0 lg:block transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
          <div className="p-4 lg:pt-6">
            <div className="flex items-center justify-between mb-5 lg:hidden">
              <span className="font-oswald font-bold uppercase tracking-wider text-white">Фильтры</span>
              <button onClick={() => setSidebarOpen(false)} className="text-white/30"><Icon name="X" size={18} /></button>
            </div>

            {activeFilters > 0 && (
              <button onClick={clearAll} className="flex items-center gap-1 text-xs text-[#FFD700]/60 hover:text-[#FFD700] mb-4 transition-colors">
                <Icon name="X" size={11} />Очистить фильтры
              </button>
            )}

            <div className="mb-5 pb-5 border-b border-[#1E1E1E]">
              <label className="flex items-center gap-3 cursor-pointer" onClick={() => handleStock(!inStockOnly)}>
                <div className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${inStockOnly ? "bg-[#FFD700]" : "bg-[#2A2A2A]"}`}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${inStockOnly ? "translate-x-5" : "translate-x-0.5"}`} />
                </div>
                <span className="text-sm text-white/60">Товар в наличии</span>
              </label>
            </div>

            <div className="mb-5 pb-5 border-b border-[#1E1E1E]">
              <div className="text-[10px] font-bold uppercase tracking-widest text-white/25 mb-3">Категория</div>
              <div className="space-y-0.5">
                <button onClick={() => handleCat("")} className={`w-full text-left px-2 py-1.5 text-sm rounded-sm transition-colors ${!activeCategory ? "text-[#FFD700] font-semibold" : "text-white/45 hover:text-white"}`}>
                  Все категории
                </button>
                {categories.map(cat => (
                  <button key={cat} onClick={() => handleCat(cat)} className={`w-full text-left px-2 py-1.5 text-sm rounded-sm transition-colors ${activeCategory === cat ? "text-[#FFD700] font-semibold" : "text-white/45 hover:text-white"}`}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {brands.length > 0 && (
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-white/25 mb-3">Бренд</div>
                <div className="space-y-2">
                  {brands.map(b => (
                    <label key={b} className="flex items-center gap-2 cursor-pointer group" onClick={() => handleBrand(b)}>
                      <div className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center shrink-0 transition-colors ${activeBrand === b ? "bg-[#FFD700] border-[#FFD700]" : "border-[#333] group-hover:border-[#555]"}`}>
                        {activeBrand === b && <Icon name="Check" size={10} className="text-black" />}
                      </div>
                      <span className="text-sm text-white/45 group-hover:text-white transition-colors">{b}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Контент */}
        <main className="flex-1 min-w-0 p-3 sm:p-6">
          {(activeCategory || search) && (
            <div className="flex items-center gap-1.5 mb-4 text-sm text-white/30 flex-wrap">
              <button onClick={clearAll} className="hover:text-white transition-colors">Все товары</button>
              {activeCategory && <>
                <Icon name="ChevronRight" size={13} />
                <span className="text-white/60">{activeCategory}</span>
                <button onClick={() => handleCat("")} className="text-white/20 hover:text-white"><Icon name="X" size={12} /></button>
              </>}
              {search && <>
                <Icon name="ChevronRight" size={13} />
                <span className="text-white/60">«{search}»</span>
              </>}
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {products.map((p, i) => <ProductCard key={`${p.article}-${i}`} p={p} onAdd={addToCart} />)}
          </div>

          {loading && (
            <div className="flex justify-center py-12 gap-2 text-white/30">
              <Icon name="Loader" size={18} className="animate-spin" />
              <span className="text-sm">Загрузка...</span>
            </div>
          )}

          {!loading && products.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-white/20">
              <Icon name="PackageSearch" size={48} className="mb-3" />
              <span className="text-white/30 text-base">Ничего не найдено</span>
              <button onClick={clearAll} className="mt-3 text-[#FFD700]/50 hover:text-[#FFD700] text-sm transition-colors">Сбросить фильтры</button>
            </div>
          )}

          <div ref={loaderRef} className="h-8" />
        </main>
      </div>

      {cartOpen && (
        <CartModal cart={cart} onClose={() => setCartOpen(false)} onRemove={removeFromCart} onQty={changeQty} />
      )}
    </div>
  );
}