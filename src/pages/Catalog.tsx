import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import CatalogProductCard from "@/components/catalog/CatalogProductCard";
import CatalogOrderModal from "@/components/catalog/CatalogOrderModal";
import { CatalogItem, CATALOG_URL } from "@/pages/catalog.types";

const Catalog = () => {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState("");
  const [search, setSearch] = useState("");
  const [filterAvail, setFilterAvail] = useState("");
  const [loading, setLoading] = useState(true);
  const [orderItem, setOrderItem] = useState<CatalogItem | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const load = (cat: string, q: string, avail: string) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (cat) params.set("category", cat);
    if (q) params.set("search", q);
    if (avail) params.set("availability", avail);
    params.set("limit", "500");
    fetch(`${CATALOG_URL}?${params}`)
      .then(r => r.json())
      .then(d => {
        setItems(d.items || []);
        if (d.categories?.length) setCategories(d.categories);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load("", "", ""); }, []);

  const handleSearch = (val: string) => {
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => load(activeCategory, val, filterAvail), 400);
  };

  const handleCategory = (cat: string) => {
    setActiveCategory(cat);
    load(cat, search, filterAvail);
  };

  const handleAvail = (avail: string) => {
    setFilterAvail(avail);
    load(activeCategory, search, avail);
  };

  const grouped = activeCategory
    ? { [activeCategory]: items }
    : categories.reduce<Record<string, CatalogItem[]>>((acc, cat) => {
        acc[cat] = items.filter(i => i.category === cat);
        return acc;
      }, {});

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      {/* Header */}
      <div className="bg-[#0D0D0D] border-b border-[#FFD700]/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between gap-3">
          <a href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-[#FFD700] flex items-center justify-center">
              <Icon name="ShoppingBag" size={16} className="text-black" />
            </div>
            <span className="font-oswald font-bold text-white uppercase tracking-wide hidden sm:block">КАТАЛОГ</span>
          </a>
          <div className="flex-1 relative">
            <Icon name="Search" size={16} className="text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={e => handleSearch(e.target.value)}
              placeholder="iPhone, Samsung, MacBook..."
              className="w-full bg-[#1A1A1A] border border-[#333] text-white pl-9 pr-4 py-2.5 sm:py-3 font-roboto text-sm focus:outline-none focus:border-[#FFD700] transition-colors"
            />
          </div>
          <a href="/" className="text-white/40 hover:text-white font-roboto text-xs transition-colors flex items-center gap-1 shrink-0">
            <Icon name="ArrowLeft" size={14} />
            <span className="hidden sm:inline">На сайт</span>
          </a>
        </div>

        {/* Filters row */}
        <div className="max-w-7xl mx-auto px-3 sm:px-4 pb-2.5 flex items-center gap-2">
          {[
            { val: "", label: "Все" },
            { val: "in_stock", label: "✅ В наличии" },
            { val: "on_order", label: "🚗 Под заказ" },
          ].map(f => (
            <button key={f.val} onClick={() => handleAvail(f.val)}
              className={`font-roboto text-xs px-3 py-2 border transition-colors active:scale-95 ${filterAvail === f.val ? "bg-[#FFD700] text-black border-[#FFD700]" : "border-[#333] text-white/50 hover:border-white/30"}`}>
              {f.label}
            </button>
          ))}
          <div className="hidden sm:block text-white/20 text-xs font-roboto ml-1">Заказ до 17:00 — доставка завтра</div>
        </div>
      </div>

      {/* Категории — горизонтальный скролл на мобильном и планшете */}
      <div className="lg:hidden overflow-x-auto border-b border-[#111] scrollbar-hide">
        <div className="flex gap-2 px-3 sm:px-4 py-2.5 min-w-max">
          <button onClick={() => handleCategory("")}
            className={`font-roboto text-xs px-3 py-2 border whitespace-nowrap transition-colors active:scale-95 ${activeCategory === "" ? "bg-[#FFD700] text-black border-[#FFD700]" : "border-[#333] text-white/50"}`}>
            Все
          </button>
          {categories.map(cat => (
            <button key={cat} onClick={() => handleCategory(cat)}
              className={`font-roboto text-xs px-3 py-2 border whitespace-nowrap transition-colors active:scale-95 ${activeCategory === cat ? "bg-[#FFD700] text-black border-[#FFD700]" : "border-[#333] text-white/50"}`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 flex gap-6">
        {/* Sidebar — только десктоп */}
        <aside className="hidden lg:block w-52 shrink-0">
          <div className="sticky top-36 space-y-0.5">
            <button onClick={() => handleCategory("")}
              className={`w-full text-left font-roboto text-sm px-3 py-2.5 transition-colors ${activeCategory === "" ? "text-[#FFD700] border-l-2 border-[#FFD700] bg-[#1A1A1A]" : "text-white/50 hover:text-white border-l-2 border-transparent"}`}>
              Все категории
            </button>
            {categories.map(cat => (
              <button key={cat} onClick={() => handleCategory(cat)}
                className={`w-full text-left font-roboto text-xs px-3 py-2.5 transition-colors ${activeCategory === cat ? "text-[#FFD700] border-l-2 border-[#FFD700] bg-[#1A1A1A]" : "text-white/40 hover:text-white border-l-2 border-transparent"}`}>
                {cat}
              </button>
            ))}
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 w-full">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-[#FFD700] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            Object.entries(grouped).map(([cat, catItems]) => catItems.length > 0 && (
              <div key={cat} className="mb-8 md:mb-10">
                {!activeCategory && (
                  <div className="flex items-center gap-3 mb-3 pb-3 border-b border-[#FFD700]/10">
                    <h2 className="font-oswald font-bold text-base md:text-xl text-white uppercase">{cat}</h2>
                    <span className="font-roboto text-white/30 text-xs">{catItems.length} позиций</span>
                  </div>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
                  {catItems.map(item => (
                    <CatalogProductCard key={item.id} item={item} onBuy={setOrderItem} />
                  ))}
                </div>
              </div>
            ))
          )}

          {!loading && items.length === 0 && (
            <div className="text-center py-20">
              <Icon name="Search" size={40} className="text-white/10 mx-auto mb-4" />
              <p className="font-roboto text-white/30 text-sm">Ничего не найдено</p>
            </div>
          )}
        </main>
      </div>

      {/* Footer note */}
      <div className="border-t border-[#1A1A1A] py-6">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="font-roboto text-white/20 text-xs">
            Цены актуальны на сегодня · Гарантия 14 дней · Включает наценку за сервис
          </p>
          <p className="font-roboto text-white/20 text-xs mt-1">
            +7 (992) 999-03-33 · ул. Кирова, 11 и ул. Кирова, 7/47
          </p>
        </div>
      </div>

      {orderItem && <CatalogOrderModal item={orderItem} onClose={() => setOrderItem(null)} />}
    </div>
  );
};

export default Catalog;