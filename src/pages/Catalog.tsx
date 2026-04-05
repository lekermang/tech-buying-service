import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import CatalogProductCard from "@/components/catalog/CatalogProductCard";
import CatalogOrderModal from "@/components/catalog/CatalogOrderModal";
import { CatalogItem, CATALOG_URL, REGION_FLAG, MODEL_PHOTOS, CATEGORY_PHOTOS, PRICE_MARKUP } from "@/pages/catalog.types";

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

const MODEL_SUFFIX_PRIORITY = ["Pro Max", "Pro", "Air", "Plus", "Ultra"];

function modelSortKey(model: string) {
  const m = model.match(/\b(\d{1,2})\b/);
  return m ? parseInt(m[1]) : 0;
}
function modelSuffixKey(model: string) {
  const lower = model.toLowerCase();
  for (let i = 0; i < MODEL_SUFFIX_PRIORITY.length; i++) {
    if (lower.includes(MODEL_SUFFIX_PRIORITY[i].toLowerCase())) return i;
  }
  return MODEL_SUFFIX_PRIORITY.length;
}
function sortItems(raw: CatalogItem[]) {
  return [...raw].sort((a, b) => {
    const ai = BRAND_PRIORITY.indexOf(a.brand), bi = BRAND_PRIORITY.indexOf(b.brand);
    const av = ai === -1 ? 999 : ai, bv = bi === -1 ? 999 : bi;
    if (av !== bv) return av - bv;
    const numDiff = modelSortKey(b.model) - modelSortKey(a.model);
    if (numDiff !== 0) return numDiff;
    const suffixDiff = modelSuffixKey(a.model) - modelSuffixKey(b.model);
    if (suffixDiff !== 0) return suffixDiff;
    return a.model.localeCompare(b.model);
  });
}
function sortCategories(cats: string[]) {
  return [...CAT_PRIORITY.filter(p => cats.includes(p)), ...cats.filter(c => !CAT_PRIORITY.includes(c))];
}

// Мобильная карточка-строка
const CatalogRowCard = ({ item, onBuy }: { item: CatalogItem; onBuy: (item: CatalogItem) => void }) => {
  const flag = item.region ? (REGION_FLAG[item.region] || "") : "";
  const inStock = item.availability === "in_stock";
  const title = [item.brand, item.model].filter(Boolean).join(" ");
  const sub = [item.storage, item.color].filter(Boolean).join(" · ");
  const photo = item.photo_url || MODEL_PHOTOS[item.model] || CATEGORY_PHOTOS[item.category] || null;
  return (
    <div className="bg-[#111] rounded-xl flex items-center gap-3 px-3 py-2.5 active:bg-[#181818] transition-all cursor-pointer" onClick={() => onBuy(item)}>
      <div className="w-14 h-14 shrink-0 bg-[#1A1A1A] rounded-lg flex items-center justify-center overflow-hidden">
        {photo ? <img src={photo} alt={title} className="w-11 h-11 object-contain" /> : <Icon name="Package" size={24} className="text-white/10" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-white text-sm leading-snug truncate">{title}</div>
        {sub && <div className="text-white/40 text-xs mt-0.5 truncate">{sub}</div>}
        <div className="flex items-center gap-1.5 mt-1">
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${inStock ? "bg-green-900/60 text-green-400" : "bg-white/8 text-white/35"}`}>
            {inStock ? "Есть" : "Заказ"}
          </span>
          {flag && <span className="text-xs">{flag}</span>}
        </div>
      </div>
      <div className="shrink-0 flex flex-col items-end gap-2">
        <div className="font-bold text-[#FFD700] text-sm whitespace-nowrap">
          {item.price ? `${(item.price + PRICE_MARKUP).toLocaleString("ru-RU")} ₽` : "По запросу"}
        </div>
        <button onClick={e => { e.stopPropagation(); onBuy(item); }} className="bg-[#FFD700] text-black text-xs font-semibold px-3 py-1.5 rounded-lg active:bg-yellow-400">
          Купить
        </button>
      </div>
    </div>
  );
};

const Catalog = () => {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState("Смартфоны");
  const [activeBrand, setActiveBrand] = useState("");
  const [activeStorage, setActiveStorage] = useState("");
  const [activeColor, setActiveColor] = useState("");
  const [search, setSearch] = useState("");
  const [filterAvail, setFilterAvail] = useState("");
  const [loading, setLoading] = useState(true);
  const [orderItem, setOrderItem] = useState<CatalogItem | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
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
    fetch(`${CATALOG_URL}?limit=1`).then(r => r.json()).then(d => {
      if (d.categories?.length) setCategories(sortCategories(d.categories));
    });
  }, []);

  const handleSearch = (val: string) => {
    setSearch(val);
    setActiveBrand("");
    setActiveStorage("");
    setActiveColor("");
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => load(activeCategory, val, filterAvail), 400);
  };

  const handleCategory = (cat: string) => {
    setActiveCategory(cat);
    setActiveBrand("");
    setActiveStorage("");
    setActiveColor("");
    setSearch("");
    load(cat, "", filterAvail);
    setSidebarOpen(false);
  };

  const handleAvail = (avail: string) => {
    setFilterAvail(avail);
    load(activeCategory, search, avail);
  };

  // Уникальные бренды, памяти, цвета из текущей выборки
  const brandsInCategory = Array.from(new Set(items.map(i => i.brand))).sort((a, b) => {
    const ai = BRAND_PRIORITY.indexOf(a), bi = BRAND_PRIORITY.indexOf(b);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  const itemsForFilters = activeBrand ? items.filter(i => i.brand === activeBrand) : items;

  const storagesInCategory = Array.from(new Set(
    itemsForFilters.map(i => i.storage).filter(Boolean)
  )).sort((a, b) => {
    const na = parseInt(a || "0"), nb = parseInt(b || "0");
    return na - nb;
  }) as string[];

  const colorsInCategory = Array.from(new Set(
    itemsForFilters.map(i => i.color).filter(Boolean)
  )).sort() as string[];

  // Применяем фронтовые фильтры (бренд, память, цвет)
  const filteredItems = items.filter(i => {
    if (activeBrand && i.brand !== activeBrand) return false;
    if (activeStorage && i.storage !== activeStorage) return false;
    if (activeColor && i.color !== activeColor) return false;
    return true;
  });

  const activeFiltersCount = [activeBrand, activeStorage, activeColor, filterAvail].filter(Boolean).length;

  const resetFilters = () => {
    setActiveBrand("");
    setActiveStorage("");
    setActiveColor("");
    setFilterAvail("");
    load(activeCategory, search, "");
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">

      {/* ── Топ-навигация ── */}
      <nav className="bg-[#0D0D0D]/97 backdrop-blur-xl border-b border-white/6 sticky top-0 z-40">
        <div className="max-w-[1400px] mx-auto px-3 sm:px-4 h-14 flex items-center gap-2 sm:gap-3">

          {/* Назад */}
          <a href="/" className="flex items-center gap-1.5 shrink-0 text-white/50 hover:text-white transition-colors">
            <Icon name="ArrowLeft" size={16} />
            <span className="text-sm hidden sm:block font-medium">Скупка24</span>
          </a>

          {/* Кнопка категорий (мобилка + планшет) */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden flex items-center gap-1.5 px-2.5 py-1.5 bg-white/8 hover:bg-white/12 rounded-lg text-white/70 hover:text-white transition-all shrink-0 border border-white/6"
          >
            <Icon name="LayoutGrid" size={14} />
            <span className="text-xs max-w-[90px] truncate hidden xs:block">{activeCategory || "Категории"}</span>
            <Icon name="ChevronDown" size={11} className="text-white/30" />
          </button>

          {/* Поиск */}
          <div className="flex-1 relative min-w-0">
            <Icon name="Search" size={15} className="text-white/30 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Поиск..."
              className="w-full bg-white/6 border border-white/8 text-white pl-9 pr-8 py-2 rounded-lg text-sm focus:outline-none focus:bg-white/10 focus:border-white/20 transition-all placeholder:text-white/25"
            />
            {search && (
              <button onClick={() => handleSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
                <Icon name="X" size={13} />
              </button>
            )}
          </div>

          {/* Кнопка фильтров — мобилка */}
          <button
            onClick={() => setFilterPanelOpen(v => !v)}
            className={`lg:hidden relative shrink-0 flex items-center gap-1.5 px-2.5 py-2 rounded-lg border transition-all ${filterPanelOpen || activeFiltersCount > 0 ? "bg-[#FFD700]/15 border-[#FFD700]/40 text-[#FFD700]" : "bg-white/6 border-white/8 text-white/60 hover:text-white"}`}
          >
            <Icon name="SlidersHorizontal" size={15} />
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#FFD700] text-black text-[9px] font-bold rounded-full flex items-center justify-center">{activeFiltersCount}</span>
            )}
          </button>

          {/* Наличие — только на больших экранах */}
          <div className="hidden sm:flex items-center gap-0.5 shrink-0">
            {[{ val: "", label: "Все" }, { val: "in_stock", label: "Есть" }, { val: "on_order", label: "Заказ" }].map(f => (
              <button key={f.val} onClick={() => handleAvail(f.val)}
                className={`text-xs px-2.5 py-1.5 rounded-lg transition-all font-medium ${filterAvail === f.val ? "bg-[#FFD700] text-black" : "text-white/40 hover:text-white hover:bg-white/8"}`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Мобильная панель фильтров (раскрывается под топ-навом) */}
        {filterPanelOpen && (
          <div className="lg:hidden border-t border-white/6 bg-[#0D0D0D] px-3 py-3 space-y-3">

            {/* Наличие */}
            <div>
              <div className="text-[10px] uppercase tracking-widest text-white/25 mb-1.5">Наличие</div>
              <div className="flex gap-1.5 flex-wrap">
                {[{ val: "", label: "Все" }, { val: "in_stock", label: "Есть" }, { val: "on_order", label: "Под заказ" }].map(f => (
                  <button key={f.val} onClick={() => handleAvail(f.val)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all ${filterAvail === f.val ? "bg-[#FFD700] text-black border-[#FFD700] font-semibold" : "border-white/10 text-white/50 hover:text-white"}`}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Бренд */}
            {brandsInCategory.length > 1 && (
              <div>
                <div className="text-[10px] uppercase tracking-widest text-white/25 mb-1.5">Бренд</div>
                <div className="flex gap-1.5 flex-wrap">
                  {brandsInCategory.map(b => (
                    <button key={b} onClick={() => { setActiveBrand(prev => prev === b ? "" : b); setActiveStorage(""); setActiveColor(""); }}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all ${activeBrand === b ? "bg-white text-black border-white font-semibold" : "border-white/10 text-white/50 hover:text-white"}`}>
                      {b}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Память */}
            {storagesInCategory.length > 0 && (
              <div>
                <div className="text-[10px] uppercase tracking-widest text-white/25 mb-1.5">Объём памяти</div>
                <div className="flex gap-1.5 flex-wrap">
                  {storagesInCategory.map(s => (
                    <button key={s} onClick={() => setActiveStorage(prev => prev === s ? "" : s)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all ${activeStorage === s ? "bg-[#FFD700] text-black border-[#FFD700] font-semibold" : "border-white/10 text-white/50 hover:text-white"}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Цвет */}
            {colorsInCategory.length > 0 && (
              <div>
                <div className="text-[10px] uppercase tracking-widest text-white/25 mb-1.5">Цвет</div>
                <div className="flex gap-1.5 flex-wrap">
                  {colorsInCategory.map(c => (
                    <button key={c} onClick={() => setActiveColor(prev => prev === c ? "" : c)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all capitalize ${activeColor === c ? "bg-[#FFD700] text-black border-[#FFD700] font-semibold" : "border-white/10 text-white/50 hover:text-white"}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeFiltersCount > 0 && (
              <button onClick={resetFilters} className="text-xs text-white/40 hover:text-white flex items-center gap-1 transition-colors">
                <Icon name="X" size={12} /> Сбросить все фильтры
              </button>
            )}
          </div>
        )}
      </nav>

      <div className="max-w-[1400px] mx-auto flex">

        {/* ── Левый сайдбар (desktop lg+) ── */}
        <aside className="hidden lg:flex flex-col w-60 shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto border-r border-white/5 py-4">

          <div className="px-4 mb-2">
            <span className="text-[10px] uppercase tracking-widest text-white/20 font-medium">Категории</span>
          </div>
          {categories.map(cat => (
            <button key={cat} onClick={() => handleCategory(cat)}
              className={`flex items-center gap-2.5 px-3 py-2 mx-2 rounded-lg text-sm transition-all text-left ${activeCategory === cat ? "bg-[#FFD700]/10 text-[#FFD700] font-medium" : "text-white/40 hover:text-white hover:bg-white/5"}`}>
              <Icon name={CATEGORY_ICONS[cat] || "Package"} size={15} className={activeCategory === cat ? "text-[#FFD700]" : "text-white/30"} />
              <span className="flex-1 truncate">{cat}</span>
            </button>
          ))}

          {/* Бренды */}
          {brandsInCategory.length > 1 && !search && (
            <>
              <div className="px-4 mt-5 mb-2">
                <span className="text-[10px] uppercase tracking-widest text-white/20 font-medium">Бренд</span>
              </div>
              {brandsInCategory.map(brand => (
                <button key={brand} onClick={() => { setActiveBrand(prev => prev === brand ? "" : brand); setActiveStorage(""); setActiveColor(""); }}
                  className={`flex items-center justify-between px-3 py-1.5 mx-2 rounded-lg text-sm transition-all ${activeBrand === brand ? "bg-white/10 text-white font-medium" : "text-white/40 hover:text-white hover:bg-white/5"}`}>
                  <span>{brand}</span>
                  <span className="text-xs text-white/20">{items.filter(i => i.brand === brand).length}</span>
                </button>
              ))}
            </>
          )}

          {/* Память */}
          {storagesInCategory.length > 0 && !search && (
            <>
              <div className="px-4 mt-5 mb-2">
                <span className="text-[10px] uppercase tracking-widest text-white/20 font-medium">Объём памяти</span>
              </div>
              <div className="px-3 flex flex-wrap gap-1.5">
                {storagesInCategory.map(s => (
                  <button key={s} onClick={() => setActiveStorage(prev => prev === s ? "" : s)}
                    className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${activeStorage === s ? "bg-[#FFD700] text-black border-[#FFD700] font-semibold" : "border-white/10 text-white/40 hover:text-white hover:border-white/30"}`}>
                    {s}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Цвет */}
          {colorsInCategory.length > 0 && !search && (
            <>
              <div className="px-4 mt-5 mb-2">
                <span className="text-[10px] uppercase tracking-widest text-white/20 font-medium">Цвет</span>
              </div>
              <div className="px-3 flex flex-wrap gap-1.5">
                {colorsInCategory.map(c => (
                  <button key={c} onClick={() => setActiveColor(prev => prev === c ? "" : c)}
                    className={`text-xs px-2.5 py-1 rounded-lg border transition-all capitalize ${activeColor === c ? "bg-[#FFD700] text-black border-[#FFD700] font-semibold" : "border-white/10 text-white/40 hover:text-white hover:border-white/30"}`}>
                    {c}
                  </button>
                ))}
              </div>
            </>
          )}

          {activeFiltersCount > 0 && (
            <button onClick={resetFilters} className="mx-3 mt-4 text-xs text-white/30 hover:text-white flex items-center gap-1 transition-colors">
              <Icon name="X" size={11} /> Сбросить фильтры
            </button>
          )}
        </aside>

        {/* ── Мобильный drawer ── */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
            <div className="relative bg-[#111] w-72 max-w-[82vw] h-full overflow-y-auto flex flex-col shadow-2xl">
              <div className="flex items-center justify-between px-4 py-4 border-b border-white/8">
                <span className="font-semibold text-white">Категории</span>
                <button onClick={() => setSidebarOpen(false)} className="text-white/40 hover:text-white p-1">
                  <Icon name="X" size={18} />
                </button>
              </div>
              <div className="py-2 flex-1">
                {categories.map(cat => (
                  <button key={cat} onClick={() => handleCategory(cat)}
                    className={`flex items-center gap-3 w-full px-4 py-3 text-sm transition-all text-left ${activeCategory === cat ? "bg-[#FFD700]/10 text-[#FFD700] font-medium border-r-2 border-[#FFD700]" : "text-white/50 hover:text-white hover:bg-white/5"}`}>
                    <Icon name={CATEGORY_ICONS[cat] || "Package"} size={16} className={activeCategory === cat ? "text-[#FFD700]" : "text-white/30"} />
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Контент ── */}
        <main className="flex-1 min-w-0 px-3 sm:px-4 lg:px-6 py-4 sm:py-5">

          {/* Заголовок */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-semibold text-white">
                {search ? `«${search}»` : activeBrand || activeCategory || "Все товары"}
              </h1>
              {!loading && (
                <span className="text-sm text-white/25">{filteredItems.length} шт.</span>
              )}
            </div>
            {activeFiltersCount > 0 && (
              <button onClick={resetFilters} className="text-xs text-white/30 hover:text-white flex items-center gap-1 transition-colors shrink-0">
                <Icon name="X" size={11} /> Сбросить
              </button>
            )}
          </div>

          {/* Быстрые бренды (планшет/мобилка) */}
          {brandsInCategory.length > 1 && !search && (
            <div className="lg:hidden flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
              <button onClick={() => { setActiveBrand(""); setActiveStorage(""); setActiveColor(""); }}
                className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition-all font-medium ${!activeBrand ? "bg-[#FFD700] text-black border-[#FFD700]" : "border-white/10 text-white/40 hover:text-white"}`}>
                Все
              </button>
              {brandsInCategory.map(brand => (
                <button key={brand} onClick={() => { setActiveBrand(prev => prev === brand ? "" : brand); setActiveStorage(""); setActiveColor(""); }}
                  className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition-all font-medium whitespace-nowrap ${activeBrand === brand ? "bg-white text-black border-white" : "border-white/10 text-white/40 hover:text-white"}`}>
                  {brand}
                </button>
              ))}
            </div>
          )}

          {/* Активные фильтры-теги */}
          {(activeStorage || activeColor) && (
            <div className="flex gap-2 mb-3 flex-wrap">
              {activeStorage && (
                <span className="flex items-center gap-1 text-xs bg-[#FFD700]/15 text-[#FFD700] border border-[#FFD700]/30 px-2.5 py-1 rounded-full">
                  {activeStorage}
                  <button onClick={() => setActiveStorage("")}><Icon name="X" size={10} /></button>
                </span>
              )}
              {activeColor && (
                <span className="flex items-center gap-1 text-xs bg-[#FFD700]/15 text-[#FFD700] border border-[#FFD700]/30 px-2.5 py-1 rounded-full capitalize">
                  {activeColor}
                  <button onClick={() => setActiveColor("")}><Icon name="X" size={10} /></button>
                </span>
              )}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-32">
              <div className="w-8 h-8 border-2 border-white/10 border-t-[#FFD700] rounded-full animate-spin" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-28">
              <Icon name="Search" size={44} className="text-white/10 mx-auto mb-4" />
              <p className="text-white/30 text-lg font-medium">Ничего не найдено</p>
              <button onClick={resetFilters} className="mt-4 text-sm text-[#FFD700] hover:underline">
                Сбросить фильтры
              </button>
            </div>
          ) : (
            <>
              {/* Мобилка — строки */}
              <div className="flex flex-col gap-2 sm:hidden">
                {filteredItems.map(item => <CatalogRowCard key={item.id} item={item} onBuy={setOrderItem} />)}
              </div>
              {/* Планшет и десктоп — сетка */}
              <div className="hidden sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
                {filteredItems.map(item => <CatalogProductCard key={item.id} item={item} onBuy={setOrderItem} />)}
              </div>
            </>
          )}
        </main>
      </div>

      <footer className="border-t border-white/5 py-5 mt-4">
        <div className="max-w-[1400px] mx-auto px-4 text-center">
          <p className="text-white/15 text-xs">Цены актуальны на сегодня · Гарантия 2 года · +7 (992) 999-03-33</p>
        </div>
      </footer>

      {orderItem && <CatalogOrderModal item={orderItem} onClose={() => setOrderItem(null)} />}
    </div>
  );
};

export default Catalog;