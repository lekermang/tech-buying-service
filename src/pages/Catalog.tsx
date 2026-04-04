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
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      {/* Apple-style nav */}
      <nav className="bg-[rgba(245,245,247,0.85)] backdrop-blur-xl border-b border-black/5 sticky top-0 z-40">
        <div className="max-w-[1200px] mx-auto px-6 h-14 flex items-center gap-6">
          <a href="/" className="flex items-center gap-2 shrink-0 text-[#1d1d1f] hover:text-black transition-colors">
            <Icon name="ArrowLeft" size={16} className="text-[#1d1d1f]/50" />
            <span className="text-sm font-medium">Скупка24</span>
          </a>

          <div className="flex-1 relative max-w-lg mx-auto">
            <Icon name="Search" size={15} className="text-[#1d1d1f]/30 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Поиск в каталоге"
              className="w-full bg-[#e8e8ed] text-[#1d1d1f] pl-9 pr-4 py-1.5 rounded-lg text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-black/10 transition-all placeholder:text-[#1d1d1f]/30"
            />
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {[
              { val: "", label: "Все" },
              { val: "in_stock", label: "В наличии" },
              { val: "on_order", label: "Под заказ" },
            ].map(f => (
              <button key={f.val} onClick={() => handleAvail(f.val)}
                className={`text-xs px-3 py-1.5 rounded-full transition-all font-medium ${filterAvail === f.val ? "bg-[#1d1d1f] text-white" : "text-[#1d1d1f]/60 hover:text-[#1d1d1f]"}`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Categories pill bar */}
      <div className="bg-[rgba(245,245,247,0.85)] backdrop-blur-xl border-b border-black/5 sticky top-14 z-30">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="flex gap-0 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => handleCategory("")}
              className={`shrink-0 text-sm px-4 py-3 border-b-2 transition-all font-medium whitespace-nowrap ${activeCategory === "" ? "border-[#1d1d1f] text-[#1d1d1f]" : "border-transparent text-[#1d1d1f]/50 hover:text-[#1d1d1f]"}`}>
              Все
            </button>
            {categories.map(cat => (
              <button key={cat}
                onClick={() => handleCategory(cat)}
                className={`shrink-0 text-sm px-4 py-3 border-b-2 transition-all font-medium whitespace-nowrap ${activeCategory === cat ? "border-[#1d1d1f] text-[#1d1d1f]" : "border-transparent text-[#1d1d1f]/50 hover:text-[#1d1d1f]"}`}>
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main */}
      <main className="max-w-[1200px] mx-auto px-6 py-10">
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="w-8 h-8 border-2 border-[#1d1d1f]/20 border-t-[#1d1d1f] rounded-full animate-spin" />
          </div>
        ) : (
          Object.entries(grouped).map(([cat, catItems]) => catItems.length > 0 && (
            <section key={cat} className="mb-14">
              {!activeCategory && (
                <div className="mb-6">
                  <h2 className="text-2xl font-semibold text-[#1d1d1f] tracking-tight">{cat}</h2>
                  <p className="text-sm text-[#1d1d1f]/40 mt-0.5">{catItems.length} товаров</p>
                </div>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                {catItems.map(item => (
                  <CatalogProductCard key={item.id} item={item} onBuy={setOrderItem} />
                ))}
              </div>
            </section>
          ))
        )}

        {!loading && items.length === 0 && (
          <div className="text-center py-32">
            <Icon name="Search" size={48} className="text-[#1d1d1f]/10 mx-auto mb-4" />
            <p className="text-[#1d1d1f]/30 text-lg font-medium">Ничего не найдено</p>
          </div>
        )}
      </main>

      <footer className="border-t border-black/8 py-8 mt-6">
        <div className="max-w-[1200px] mx-auto px-6">
          <p className="text-[#1d1d1f]/30 text-xs text-center">
            Цены актуальны на сегодня · Гарантия 2 года на новую технику · +7 (992) 999-03-33
          </p>
        </div>
      </footer>

      {orderItem && <CatalogOrderModal item={orderItem} onClose={() => setOrderItem(null)} />}
    </div>
  );
};

export default Catalog;
