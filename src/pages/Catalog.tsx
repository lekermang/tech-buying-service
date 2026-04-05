import { useState, useEffect, useRef } from "react";
import CatalogOrderModal from "@/components/catalog/CatalogOrderModal";
import CatalogNav from "@/components/catalog/CatalogNav";
import CatalogSidebar from "@/components/catalog/CatalogSidebar";
import CatalogGrid from "@/components/catalog/CatalogGrid";
import CatalogBanners from "@/components/catalog/CatalogBanners";
import { CatalogItem, CATALOG_URL } from "@/pages/catalog.types";
import { BRAND_PRIORITY, sortItems, sortCategories } from "@/components/catalog/catalog.utils";

const Catalog = () => {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState("iPhone 17/AIR/PRO/MAX");
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
  };

  const handleStorageChange = (storage: string) => {
    setActiveStorage(prev => prev === storage ? "" : storage);
  };

  const handleColorChange = (color: string) => {
    setActiveColor(prev => prev === color ? "" : color);
  };

  const resetFilters = () => {
    setActiveBrand("");
    setActiveStorage("");
    setActiveColor("");
    setFilterAvail("");
    load(activeCategory, search, "");
  };

  // Производные данные
  const brandsInCategory = Array.from(new Set(items.map(i => i.brand))).sort((a, b) => {
    const ai = BRAND_PRIORITY.indexOf(a), bi = BRAND_PRIORITY.indexOf(b);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  const itemsForFilters = activeBrand ? items.filter(i => i.brand === activeBrand) : items;

  const storagesInCategory = Array.from(new Set(
    itemsForFilters.map(i => i.storage).filter(Boolean)
  )).sort((a, b) => parseInt(a || "0") - parseInt(b || "0")) as string[];

  const colorsInCategory = Array.from(new Set(
    itemsForFilters.map(i => i.color).filter(Boolean)
  )).sort() as string[];

  const filteredItems = items.filter(i => {
    if (activeBrand && i.brand !== activeBrand) return false;
    if (activeStorage && i.storage !== activeStorage) return false;
    if (activeColor && i.color !== activeColor) return false;
    return true;
  });

  const activeFiltersCount = [activeBrand, activeStorage, activeColor, filterAvail].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">

      {/* Баннеры категорий — над навигацией */}
      <CatalogBanners onCategory={handleCategory} activeCategory={activeCategory} />

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
      />

      <div className="max-w-[1400px] mx-auto flex">

        <CatalogSidebar
          categories={categories}
          activeCategory={activeCategory}
          activeBrand={activeBrand}
          activeStorage={activeStorage}
          activeColor={activeColor}
          activeFiltersCount={activeFiltersCount}
          search={search}
          items={items}
          brandsInCategory={brandsInCategory}
          storagesInCategory={storagesInCategory}
          colorsInCategory={colorsInCategory}
          sidebarOpen={sidebarOpen}
          onCategory={handleCategory}
          onBrandChange={handleBrandChange}
          onStorageChange={handleStorageChange}
          onColorChange={handleColorChange}
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

      {orderItem && <CatalogOrderModal item={orderItem} onClose={() => setOrderItem(null)} />}
    </div>
  );
};

export default Catalog;