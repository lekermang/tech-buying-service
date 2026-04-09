import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import CatalogOrderModal from "@/components/catalog/CatalogOrderModal";
import CatalogNav from "@/components/catalog/CatalogNav";
import CatalogSidebar from "@/components/catalog/CatalogSidebar";
import CatalogGrid from "@/components/catalog/CatalogGrid";
import CatalogBanners from "@/components/catalog/CatalogBanners";
import Icon from "@/components/ui/icon";
import { CatalogItem, CATALOG_URL, PRICE_MARKUP } from "@/pages/catalog.types";

const MODEL_FILTERS: Record<string, string[]> = {
  "iPhone 17/AIR/PRO/MAX":   ["Все", "Pro Max", "Pro", "Air", "iPhone 17"],
  "iPhone 16/e/+/PRO/MAX":   ["Все", "Pro Max", "Pro", "Plus", "iPhone 16", "16e"],
  "iPhone 15/+/PRO/MAX":     ["Все", "Pro Max", "Pro", "Plus", "iPhone 15"],
  "iPhone 11/12/13/14":      ["Все", "iPhone 14", "iPhone 13", "iPhone 12", "iPhone 11"],
  "MacBook":                 ["Все", "Air M4", "Pro 14", "Pro 16", "Air M3"],
  "Apple Watch":             ["Все", "Ultra 3", "Ultra 2", "S11", "SE3"],
  "AirPods":                 ["Все", "Pro 3", "Pro 2", "Max 2", "4 ANC", "AirPods 4"],
  "Apple iPad":              ["Все", "Air M4", "Mini 7", "iPad 11"],
  "Samsung S-Z":             ["Все", "Ultra", "S25+", "S25"],
  "Samsung A-M":             ["Все", "A55", "A35"],
};
import { BRAND_PRIORITY, sortItems, sortCategories } from "@/components/catalog/catalog.utils";

interface CartEntry { item: CatalogItem; qty: number; }

const Catalog = () => {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState("iPhone 17/AIR/PRO/MAX");
  const [activeBrand, setActiveBrand] = useState("");
  const [activeStorage, setActiveStorage] = useState("");
  const [activeColor, setActiveColor] = useState("");
  const [activeSimType, setActiveSimType] = useState("");
  const [modelFilter, setModelFilter] = useState("Все");
  const [search, setSearch] = useState("");
  const [filterAvail, setFilterAvail] = useState("");
  const [loading, setLoading] = useState(true);
  const [orderItem, setOrderItem] = useState<CatalogItem | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
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
    load("iPhone 17/AIR/PRO/MAX", "", "");
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
    setModelFilter("Все");
    setSearch("");
    load(cat, "", filterAvail);
    setSidebarOpen(false);
  };

  const handleAvail = (avail: string) => {
    setFilterAvail(avail);
    load(activeCategory, search, avail);
  };

  const handleBrandChange = (brand: string) => {
    setActiveBrand(prev => prev === brand ? "" : brand);
    setActiveStorage("");
    setActiveColor("");
    setActiveSimType("");
  };

  const handleStorageChange = (storage: string) => {
    setActiveStorage(prev => prev === storage ? "" : storage);
  };

  const handleColorChange = (color: string) => {
    setActiveColor(prev => prev === color ? "" : color);
  };

  const handleSimTypeChange = (sim: string) => {
    setActiveSimType(prev => prev === sim ? "" : sim);
  };

  const resetFilters = () => {
    setActiveBrand("");
    setActiveStorage("");
    setActiveColor("");
    setActiveSimType("");
    setFilterAvail("");
    setModelFilter("Все");
    load(activeCategory, search, "");
  };

  const addToCart = useCallback((item: CatalogItem) => {
    setCart(prev => {
      const ex = prev.find(e => e.item.id === item.id);
      if (ex) return prev.map(e => e.item.id === item.id ? { ...e, qty: e.qty + 1 } : e);
      return [...prev, { item, qty: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((id: number) => setCart(prev => prev.filter(e => e.item.id !== id)), []);

  const cartTotal = useMemo(() => cart.reduce((s, e) => s + ((e.item.price || 0) + PRICE_MARKUP) * e.qty, 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((s, e) => s + e.qty, 0), [cart]);

  const brandsInCategory = useMemo(() => Array.from(new Set(items.map(i => i.brand))).sort((a, b) => {
    const ai = BRAND_PRIORITY.indexOf(a), bi = BRAND_PRIORITY.indexOf(b);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  }), [items]);

  const itemsForFilters = useMemo(() => activeBrand ? items.filter(i => i.brand === activeBrand) : items, [items, activeBrand]);

  const storagesInCategory = useMemo(() => Array.from(new Set(
    itemsForFilters.map(i => i.storage).filter(Boolean)
  )).sort((a, b) => parseInt(a || "0") - parseInt(b || "0")) as string[], [itemsForFilters]);

  const colorsInCategory = useMemo(() => Array.from(new Set(
    itemsForFilters.map(i => i.color).filter(Boolean)
  )).sort() as string[], [itemsForFilters]);

  const simTypesInCategory = useMemo(() => Array.from(new Set(
    itemsForFilters.map(i => i.sim_type).filter(Boolean)
  )).sort() as string[], [itemsForFilters]);

  const filteredItems = useMemo(() => items.filter(i => {
    if (activeBrand && i.brand !== activeBrand) return false;
    if (activeStorage && i.storage !== activeStorage) return false;
    if (activeColor && i.color !== activeColor) return false;
    if (activeSimType && i.sim_type !== activeSimType) return false;
    if (modelFilter && modelFilter !== "Все") {
      const name = `${i.model}`.toLowerCase();
      const f = modelFilter.toLowerCase();
      if (f === "pro" || f === "pro max" || f === "air" || f === "plus" || f === "ultra") {
        const words = name.split(/[\s/]+/);
        if (f === "pro max") {
          if (!name.includes("pro max")) return false;
        } else if (f === "pro") {
          if (!words.includes("pro") || name.includes("pro max")) return false;
        } else if (f === "air") {
          if (!words.includes("air")) return false;
        } else if (f === "ultra") {
          if (!words.includes("ultra")) return false;
        } else if (f === "plus") {
          if (!name.includes("plus") && !name.includes("+")) return false;
        }
      } else {
        if (!name.includes(f)) return false;
      }
    }
    return true;
  }), [items, activeBrand, activeStorage, activeColor, modelFilter]);

  const activeFiltersCount = useMemo(() => [activeBrand, activeStorage, activeColor, activeSimType, filterAvail, modelFilter !== "Все" ? modelFilter : ""].filter(Boolean).length, [activeBrand, activeStorage, activeColor, activeSimType, filterAvail, modelFilter]);

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">

      {/* Баннеры + фильтры сверху */}
      <CatalogBanners
        onCategory={handleCategory}
        activeCategory={activeCategory}
      />

      {/* Поиск — липкий */}
      <CatalogNav
        search={search}
        filterAvail={filterAvail}
        filterPanelOpen={filterPanelOpen}
        activeFiltersCount={activeFiltersCount}
        activeCategory={activeCategory}
        activeBrand={activeBrand}
        activeStorage={activeStorage}
        activeColor={activeColor}
        brandsInCategory={brandsInCategory}
        storagesInCategory={storagesInCategory}
        colorsInCategory={colorsInCategory}
        onSearch={handleSearch}
        onAvail={handleAvail}
        onFilterPanelToggle={() => setFilterPanelOpen(v => !v)}
        onSidebarOpen={() => setSidebarOpen(true)}
        onBrandChange={handleBrandChange}
        onStorageChange={handleStorageChange}
        onColorChange={handleColorChange}
        onResetFilters={resetFilters}
        cartCount={cartCount}
        onCartOpen={() => setCartOpen(true)}
        modelFilters={MODEL_FILTERS[activeCategory]}
        modelFilter={modelFilter}
        onModelFilter={setModelFilter}
      />

      <div className="max-w-[1400px] mx-auto flex">

        <CatalogSidebar
          categories={categories}
          activeCategory={activeCategory}
          activeBrand={activeBrand}
          activeStorage={activeStorage}
          activeColor={activeColor}
          activeSimType={activeSimType}
          activeFiltersCount={activeFiltersCount}
          search={search}
          items={items}
          brandsInCategory={brandsInCategory}
          storagesInCategory={storagesInCategory}
          colorsInCategory={colorsInCategory}
          simTypesInCategory={simTypesInCategory}
          sidebarOpen={sidebarOpen}
          onCategory={handleCategory}
          onBrandChange={handleBrandChange}
          onStorageChange={handleStorageChange}
          onColorChange={handleColorChange}
          onSimTypeChange={handleSimTypeChange}
          onResetFilters={resetFilters}
          onSidebarClose={() => setSidebarOpen(false)}
        />

        <CatalogGrid
          filteredItems={filteredItems}
          brandsInCategory={brandsInCategory}
          loading={loading}
          search={search}
          activeBrand={activeBrand}
          activeCategory={activeCategory}
          activeStorage={activeStorage}
          activeColor={activeColor}
          activeFiltersCount={activeFiltersCount}
          onBuy={setOrderItem}
          onAddToCart={addToCart}
          onBrandChange={handleBrandChange}
          onStorageReset={() => setActiveStorage("")}
          onColorReset={() => setActiveColor("")}
          onResetFilters={resetFilters}
          onCategory={handleCategory}
        />
      </div>

      <footer className="border-t border-white/5 py-5 mt-4">
        <div className="max-w-[1400px] mx-auto px-4 text-center">
          <p className="text-white/15 text-xs">Цены актуальны на сегодня · Гарантия 2 года · +7 (992) 999-03-33</p>
        </div>
      </footer>

      {/* Модалка заказа */}
      {orderItem && <CatalogOrderModal item={orderItem} onClose={() => setOrderItem(null)} />}

      {/* Корзина */}
      {cartOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
          onClick={() => setCartOpen(false)}>
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-black/10" />
            </div>
            <div className="flex items-center justify-between px-6 pt-4 pb-3 border-b border-black/5">
              <h3 className="text-lg font-semibold text-[#1d1d1f]">Корзина {cartCount > 0 && `(${cartCount})`}</h3>
              <button onClick={() => setCartOpen(false)}
                className="w-8 h-8 rounded-full bg-[#f5f5f7] flex items-center justify-center">
                <Icon name="X" size={16} className="text-[#1d1d1f]/60" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-4 space-y-3">
              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <Icon name="ShoppingCart" size={40} className="text-black/15 mx-auto mb-3" />
                  <p className="text-[#1d1d1f]/40 text-sm">Корзина пуста</p>
                </div>
              ) : cart.map(e => (
                <div key={e.item.id} className="flex items-center gap-3 bg-[#f5f5f7] rounded-2xl p-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[#1d1d1f] leading-snug truncate">
                      {[e.item.brand, e.item.model, e.item.storage, e.item.color].filter(Boolean).join(" ")}
                    </div>
                    <div className="text-sm font-semibold text-[#1d1d1f] mt-0.5">
                      {e.item.price ? ((e.item.price + PRICE_MARKUP) * e.qty).toLocaleString("ru-RU") + " ₽" : "—"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => e.qty > 1
                      ? setCart(c => c.map(x => x.item.id === e.item.id ? { ...x, qty: x.qty - 1 } : x))
                      : removeFromCart(e.item.id)}
                      className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-[#1d1d1f]/60 hover:text-[#1d1d1f] border border-black/8">
                      <Icon name="Minus" size={12} />
                    </button>
                    <span className="text-sm font-semibold text-[#1d1d1f] w-4 text-center">{e.qty}</span>
                    <button onClick={() => setCart(c => c.map(x => x.item.id === e.item.id ? { ...x, qty: x.qty + 1 } : x))}
                      className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-[#1d1d1f]/60 hover:text-[#1d1d1f] border border-black/8">
                      <Icon name="Plus" size={12} />
                    </button>
                    <button onClick={() => removeFromCart(e.item.id)}
                      className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-red-400 border border-black/8 ml-1">
                      <Icon name="Trash2" size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {cart.length > 0 && (
              <div className="px-6 pb-6 pt-3 border-t border-black/5">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-[#1d1d1f]/50">Итого</span>
                  <span className="text-xl font-bold text-[#1d1d1f]">{cartTotal.toLocaleString("ru-RU")} ₽</span>
                </div>
                <button
                  onClick={() => { setCartOpen(false); if (cart.length === 1) setOrderItem(cart[0].item); }}
                  className="w-full bg-[#0071e3] hover:bg-[#0077ed] text-white font-medium py-3.5 rounded-xl transition-colors text-sm">
                  Оформить заказ
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Catalog;