import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";

const CATALOG_URL = "https://functions.poehali.dev/e0e6576c-f000-4288-86ef-1de08ad7bcc4";
const LABEL_IMG = "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/3067a572-e39d-4cc5-b8c8-0330ae2d1a5b.jpg";

interface CatalogItem {
  id: number;
  category: string;
  brand: string;
  model: string;
  color: string | null;
  storage: string | null;
  ram: string | null;
  region: string | null;
  availability: "in_stock" | "on_order";
  price: number | null;
  has_photo: boolean;
  photo_url: string | null;
}

const REGION_FLAG: Record<string, string> = {
  US: "🇺🇸", EU: "🇪🇺", CN: "🇨🇳", RU: "🇷🇺", HK: "🇭🇰", JP: "🇯🇵", KR: "🇰🇷", AE: "🇦🇪",
};

const Catalog = () => {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState("");
  const [search, setSearch] = useState("");
  const [filterAvail, setFilterAvail] = useState("");
  const [loading, setLoading] = useState(true);
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

  // Группируем по категории если нет фильтра
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
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <a href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-[#FFD700] flex items-center justify-center">
              <Icon name="ShoppingBag" size={16} className="text-black" />
            </div>
            <span className="font-oswald font-bold text-white uppercase tracking-wide hidden sm:block">КАТАЛОГ</span>
          </a>
          {/* Search */}
          <div className="flex-1 max-w-md relative">
            <Icon name="Search" size={16} className="text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={e => handleSearch(e.target.value)}
              placeholder="iPhone 17, Samsung S25, MacBook..."
              className="w-full bg-[#1A1A1A] border border-[#333] text-white pl-9 pr-4 py-2.5 font-roboto text-sm focus:outline-none focus:border-[#FFD700] transition-colors"
            />
          </div>
          <a href="/" className="text-white/40 hover:text-white font-roboto text-xs transition-colors flex items-center gap-1">
            <Icon name="ArrowLeft" size={14} />На сайт
          </a>
        </div>

        {/* Filters row */}
        <div className="max-w-7xl mx-auto px-4 pb-3 flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleAvail("")}
            className={`font-roboto text-xs px-3 py-1.5 border transition-colors ${filterAvail === "" ? "bg-[#FFD700] text-black border-[#FFD700]" : "border-[#333] text-white/50 hover:border-white/30"}`}
          >
            Все
          </button>
          <button
            onClick={() => handleAvail("in_stock")}
            className={`font-roboto text-xs px-3 py-1.5 border transition-colors flex items-center gap-1 ${filterAvail === "in_stock" ? "bg-[#FFD700] text-black border-[#FFD700]" : "border-[#333] text-white/50 hover:border-white/30"}`}
          >
            ✅ В наличии
          </button>
          <button
            onClick={() => handleAvail("on_order")}
            className={`font-roboto text-xs px-3 py-1.5 border transition-colors flex items-center gap-1 ${filterAvail === "on_order" ? "bg-[#FFD700] text-black border-[#FFD700]" : "border-[#333] text-white/50 hover:border-white/30"}`}
          >
            🚗 Под заказ
          </button>
          <div className="text-white/20 text-xs font-roboto ml-2">Заказ до 17:00 — доставка завтра</div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        {/* Sidebar categories */}
        <aside className="hidden lg:block w-52 shrink-0">
          <div className="sticky top-36 space-y-1">
            <button
              onClick={() => handleCategory("")}
              className={`w-full text-left font-roboto text-sm px-3 py-2 transition-colors ${activeCategory === "" ? "text-[#FFD700] border-l-2 border-[#FFD700] bg-[#1A1A1A]" : "text-white/50 hover:text-white border-l-2 border-transparent"}`}
            >
              Все категории
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => handleCategory(cat)}
                className={`w-full text-left font-roboto text-xs px-3 py-2 transition-colors ${activeCategory === cat ? "text-[#FFD700] border-l-2 border-[#FFD700] bg-[#1A1A1A]" : "text-white/40 hover:text-white border-l-2 border-transparent"}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </aside>

        {/* Mobile categories scroll */}
        <div className="lg:hidden w-full -mx-4 px-4 mb-4 overflow-x-auto">
          <div className="flex gap-2 pb-2 min-w-max">
            <button
              onClick={() => handleCategory("")}
              className={`font-roboto text-xs px-3 py-1.5 border whitespace-nowrap transition-colors ${activeCategory === "" ? "bg-[#FFD700] text-black border-[#FFD700]" : "border-[#333] text-white/50"}`}
            >
              Все
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => handleCategory(cat)}
                className={`font-roboto text-xs px-3 py-1.5 border whitespace-nowrap transition-colors ${activeCategory === cat ? "bg-[#FFD700] text-black border-[#FFD700]" : "border-[#333] text-white/50"}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-[#FFD700] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            Object.entries(grouped).map(([cat, catItems]) => catItems.length > 0 && (
              <div key={cat} className="mb-10">
                {!activeCategory && (
                  <div className="flex items-center gap-3 mb-4 pb-3 border-b border-[#FFD700]/10">
                    <h2 className="font-oswald font-bold text-xl text-white uppercase">{cat}</h2>
                    <span className="font-roboto text-white/30 text-xs">{catItems.length} позиций</span>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {catItems.map(item => (
                    <ProductCard key={item.id} item={item} />
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
            Цены актуальны на сегодня · Гарантия 14 дней · +3 500 ₽ к ценам поставщика уже включены
          </p>
          <p className="font-roboto text-white/20 text-xs mt-1">
            +7 (992) 999-03-33 · ул. Кирова, 11 и ул. Кирова, 7/47
          </p>
        </div>
      </div>
    </div>
  );
};

const ProductCard = ({ item }: { item: CatalogItem }) => {
  const flag = item.region ? (REGION_FLAG[item.region] || "") : "";
  const inStock = item.availability === "in_stock";

  const title = [item.brand, item.model].filter(Boolean).join(" ");
  const sub = [item.ram, item.storage, item.color].filter(Boolean).join(" · ");

  return (
    <div className="bg-[#111] border border-[#222] hover:border-[#FFD700]/30 transition-colors group relative flex flex-col">
      {/* Image area */}
      <div className="h-40 bg-[#1A1A1A] relative overflow-hidden flex items-center justify-center">
        <img
          src={LABEL_IMG}
          alt={title}
          className="w-24 h-24 object-cover opacity-30 group-hover:opacity-50 transition-opacity"
        />
        {/* Availability badge */}
        <div className={`absolute top-2 left-2 font-roboto text-[10px] px-2 py-1 ${inStock ? "bg-green-900/60 text-green-400" : "bg-[#1A1A1A] text-white/40"}`}>
          {inStock ? "✅ В наличии" : "🚗 Под заказ"}
        </div>
        {/* Region flag */}
        {flag && (
          <div className="absolute top-2 right-2 text-base">{flag}</div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <div className="font-oswald font-bold text-base uppercase leading-tight mb-1">{title}</div>
        {sub && <div className="font-roboto text-white/40 text-xs mb-3">{sub}</div>}

        <div className="mt-auto flex items-end justify-between">
          <div>
            {item.price ? (
              <span className="font-oswald font-bold text-xl text-[#FFD700]">
                {item.price.toLocaleString("ru-RU")} ₽
              </span>
            ) : (
              <span className="font-roboto text-white/30 text-sm italic">Цену уточняйте</span>
            )}
          </div>
          <a
            href="tel:+79929990333"
            className="font-roboto text-xs text-white/40 hover:text-[#FFD700] transition-colors flex items-center gap-1"
          >
            <Icon name="Phone" size={12} />
            Купить
          </a>
        </div>
      </div>
    </div>
  );
};

export default Catalog;
