import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import CatalogProductCard from "@/components/catalog/CatalogProductCard";
import CatalogOrderModal from "@/components/catalog/CatalogOrderModal";
import { CatalogItem, CATALOG_URL } from "@/pages/catalog.types";

const CATEGORY_ICONS: Record<string, string> = {
  "Смартфоны": "Smartphone",
  "Планшеты": "Tablet",
  "Ноутбуки": "Laptop",
  "Наушники": "Headphones",
  "Умные часы": "Watch",
  "Компьютеры": "Monitor",
  "Техника": "Zap",
  "Игровые консоли": "Gamepad2",
  "Камеры": "Camera",
  "Прочее": "Package",
};

const BRAND_PRIORITY = ["Apple", "Samsung", "Xiaomi", "POCO", "Realme", "OnePlus", "Honor", "Google", "Dyson", "Sony"];
const CAT_PRIORITY = ["Смартфоны", "Планшеты", "Ноутбуки", "Наушники", "Умные часы", "Компьютеры"];

function modelSortKey(model: string): number {
  // Извлекаем число из названия модели для сортировки по убыванию (17 > 16 > 15...)
  const m = model.match(/\b(\d{1,2})\b/);
  return m ? parseInt(m[1]) : 0;
}

function sortItems(raw: CatalogItem[]) {
  return [...raw].sort((a, b) => {
    const ai = BRAND_PRIORITY.indexOf(a.brand);
    const bi = BRAND_PRIORITY.indexOf(b.brand);
    const av = ai === -1 ? 999 : ai;
    const bv = bi === -1 ? 999 : bi;
    if (av !== bv) return av - bv;
    // Внутри бренда: свежие модели первыми (17 > 16 > 15)
    const numDiff = modelSortKey(b.model) - modelSortKey(a.model);
    if (numDiff !== 0) return numDiff;
    return a.model.localeCompare(b.model);
  });
}

function sortCategories(cats: string[]) {
  return [
    ...CAT_PRIORITY.filter(p => cats.includes(p)),
    ...cats.filter(c => !CAT_PRIORITY.includes(c)),
  ];
}

const Catalog = () => {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState("Смартфоны");
  const [activeBrand, setActiveBrand] = useState("Apple");
  const [search, setSearch] = useState("");
  const [filterAvail, setFilterAvail] = useState("");
  const [loading, setLoading] = useState(true);
  const [orderItem, setOrderItem] = useState<CatalogItem | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
        setItems(sortItems(d.items || []));
        if (d.categories?.length) setCategories(sortCategories(d.categories));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    load("Смартфоны", "", "");
    fetch(`${CATALOG_URL}?limit=1`)
      .then(r => r.json())
      .then(d => { if (d.categories?.length) setCategories(sortCategories(d.categories)); });
  }, []);

  const handleSearch = (val: string) => {
    setSearch(val);
    setActiveBrand("");
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => load(activeCategory, val, filterAvail), 400);
  };

  const handleCategory = (cat: string) => {
    setActiveCategory(cat);
    setActiveBrand("");
    setSearch("");
    load(cat, "", filterAvail);
    setSidebarOpen(false);
  };

  const handleBrand = (brand: string) => {
    setActiveBrand(prev => prev === brand ? "" : brand);
  };

  const handleAvail = (avail: string) => {
    setFilterAvail(avail);
    load(activeCategory, search, avail);
  };

  // Бренды внутри текущей категории
  const brandsInCategory = Array.from(new Set(items.map(i => i.brand)))
    .sort((a, b) => {
      const ai = BRAND_PRIORITY.indexOf(a), bi = BRAND_PRIORITY.indexOf(b);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });

  const filteredItems = activeBrand ? items.filter(i => i.brand === activeBrand) : items;

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      {/* Top nav */}
      <nav className="bg-[rgba(13,13,13,0.95)] backdrop-blur-xl border-b border-white/5 sticky top-0 z-40">
        <div className="max-w-[1400px] mx-auto px-4 h-14 flex items-center gap-3">
          <a href="/" className="flex items-center gap-1.5 shrink-0 text-white/50 hover:text-white transition-colors">
            <Icon name="ArrowLeft" size={16} />
            <span className="text-sm hidden sm:block">Скупка24</span>
          </a>

          {/* Мобильная кнопка каталога */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-lg text-sm text-white/70 hover:text-white transition-colors shrink-0"
          >
            <Icon name="LayoutGrid" size={14} />
            <span className="text-xs">{activeCategory || "Каталог"}</span>
            <Icon name="ChevronDown" size={12} className="text-white/30" />
          </button>

          <div className="flex-1 relative max-w-xl mx-auto">
            <Icon name="Search" size={15} className="text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Поиск по каталогу"
              className="w-full bg-white/8 border border-white/8 text-white pl-9 pr-4 py-1.5 rounded-lg text-sm focus:outline-none focus:bg-white/12 focus:border-white/15 transition-all placeholder:text-white/25"
            />
            {search && (
              <button onClick={() => handleSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors">
                <Icon name="X" size={13} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-0.5 shrink-0">
            {[
              { val: "", label: "Все" },
              { val: "in_stock", label: "Есть" },
              { val: "on_order", label: "Заказ" },
            ].map(f => (
              <button key={f.val} onClick={() => handleAvail(f.val)}
                className={`text-xs px-2.5 py-1.5 rounded-lg transition-all font-medium whitespace-nowrap ${filterAvail === f.val ? "bg-[#FFD700] text-black" : "text-white/40 hover:text-white hover:bg-white/8"}`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <div className="max-w-[1400px] mx-auto flex">

        {/* ── Левый сайдбар (desktop) ── */}
        <aside className="hidden lg:flex flex-col w-56 shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto border-r border-white/5 py-4">
          <div className="px-3 mb-2">
            <span className="text-[10px] uppercase tracking-widest text-white/20 font-medium">Категории</span>
          </div>

          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => handleCategory(cat)}
              className={`flex items-center gap-2.5 px-3 py-2 mx-1 rounded-lg text-sm transition-all text-left ${
                activeCategory === cat
                  ? "bg-[#FFD700]/10 text-[#FFD700] font-medium"
                  : "text-white/40 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon name={CATEGORY_ICONS[cat] || "Package"} size={15} className={activeCategory === cat ? "text-[#FFD700]" : "text-white/30"} />
              <span className="flex-1 truncate">{cat}</span>
            </button>
          ))}

          {/* Разделитель + фильтр по бренду */}
          {brandsInCategory.length > 1 && !search && (
            <>
              <div className="px-3 mt-5 mb-2">
                <span className="text-[10px] uppercase tracking-widest text-white/20 font-medium">Бренды</span>
              </div>
              {brandsInCategory.map(brand => (
                <button
                  key={brand}
                  onClick={() => handleBrand(brand)}
                  className={`flex items-center justify-between px-3 py-1.5 mx-1 rounded-lg text-sm transition-all ${
                    activeBrand === brand
                      ? "bg-white/10 text-white font-medium"
                      : "text-white/35 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <span>{brand}</span>
                  <span className="text-[10px] text-white/20">
                    {items.filter(i => i.brand === brand).length}
                  </span>
                </button>
              ))}
            </>
          )}
        </aside>

        {/* ── Мобильный drawer ── */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
            <div className="relative bg-[#111] w-72 max-w-[80vw] h-full overflow-y-auto flex flex-col shadow-2xl">
              <div className="flex items-center justify-between px-4 py-4 border-b border-white/8">
                <span className="font-semibold text-white text-sm">Каталог</span>
                <button onClick={() => setSidebarOpen(false)} className="text-white/40 hover:text-white transition-colors">
                  <Icon name="X" size={18} />
                </button>
              </div>
              <div className="py-3 flex-1">
                <div className="px-4 mb-2">
                  <span className="text-[10px] uppercase tracking-widest text-white/20">Категории</span>
                </div>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => handleCategory(cat)}
                    className={`flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-all text-left ${
                      activeCategory === cat
                        ? "bg-[#FFD700]/10 text-[#FFD700] font-medium border-r-2 border-[#FFD700]"
                        : "text-white/50 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Icon name={CATEGORY_ICONS[cat] || "Package"} size={16} className={activeCategory === cat ? "text-[#FFD700]" : "text-white/30"} />
                    {cat}
                  </button>
                ))}

                {brandsInCategory.length > 1 && (
                  <>
                    <div className="px-4 mt-5 mb-2">
                      <span className="text-[10px] uppercase tracking-widest text-white/20">Бренды</span>
                    </div>
                    {brandsInCategory.map(brand => (
                      <button
                        key={brand}
                        onClick={() => { handleBrand(brand); setSidebarOpen(false); }}
                        className={`flex items-center justify-between w-full px-4 py-2 text-sm transition-all ${
                          activeBrand === brand ? "text-white font-medium bg-white/8" : "text-white/40 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        <span>{brand}</span>
                        <span className="text-xs text-white/20">{items.filter(i => i.brand === brand).length}</span>
                      </button>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Контент ── */}
        <main className="flex-1 min-w-0 px-4 lg:px-8 py-6">

          {/* Хлебные крошки / заголовок */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-semibold text-white">
                  {search ? `Поиск: «${search}»` : activeBrand ? `${activeBrand}` : activeCategory || "Все товары"}
                </h1>
                {!loading && (
                  <span className="text-sm text-white/25">{filteredItems.length} товаров</span>
                )}
              </div>
              {activeBrand && (
                <button onClick={() => setActiveBrand("")} className="flex items-center gap-1 text-xs text-white/30 hover:text-white mt-0.5 transition-colors">
                  <Icon name="X" size={10} /> Сбросить фильтр
                </button>
              )}
            </div>
          </div>

          {/* Быстрые бренды (только мобайл/планшет) */}
          {brandsInCategory.length > 1 && !search && (
            <div className="lg:hidden flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
              <button
                onClick={() => setActiveBrand("")}
                className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition-all font-medium ${!activeBrand ? "bg-[#FFD700] text-black border-[#FFD700]" : "border-white/10 text-white/40 hover:text-white"}`}
              >
                Все
              </button>
              {brandsInCategory.map(brand => (
                <button
                  key={brand}
                  onClick={() => handleBrand(brand)}
                  className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition-all font-medium whitespace-nowrap ${activeBrand === brand ? "bg-white text-black border-white" : "border-white/10 text-white/40 hover:text-white"}`}
                >
                  {brand}
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-32">
              <div className="w-8 h-8 border-2 border-white/10 border-t-[#FFD700] rounded-full animate-spin" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-32">
              <Icon name="Search" size={48} className="text-white/10 mx-auto mb-4" />
              <p className="text-white/30 text-lg font-medium">Ничего не найдено</p>
              {(search || activeBrand) && (
                <button onClick={() => { setSearch(""); setActiveBrand(""); load(activeCategory, "", filterAvail); }}
                  className="mt-4 text-sm text-[#FFD700] hover:underline">
                  Сбросить фильтры
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {filteredItems.map(item => (
                <CatalogProductCard key={item.id} item={item} onBuy={setOrderItem} />
              ))}
            </div>
          )}
        </main>
      </div>

      <footer className="border-t border-white/5 py-6 mt-4">
        <div className="max-w-[1400px] mx-auto px-4">
          <p className="text-white/15 text-xs text-center">
            Цены актуальны на сегодня · Гарантия 2 года на новую технику · +7 (992) 999-03-33
          </p>
        </div>
      </footer>

      {orderItem && <CatalogOrderModal item={orderItem} onClose={() => setOrderItem(null)} />}
    </div>
  );
};

export default Catalog;