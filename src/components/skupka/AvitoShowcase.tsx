import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import AvitoFilters from "./avitoShowcase/AvitoFilters";
import AvitoGrid from "./avitoShowcase/AvitoGrid";
import AvitoProductModal from "./avitoShowcase/AvitoProductModal";
import { AvitoItem, Category, Sort, AVITO_URL, SYNC_URL } from "./avitoShowcase/types";

export default function AvitoShowcase() {
  const [items, setItems] = useState<AvitoItem[]>([]);
  const [listItems, setListItems] = useState<AvitoItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [counts, setCounts] = useState<{ premium: number; basic: number; total: number }>({ premium: 0, basic: 0, total: 0 });
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<string>("");
  const [sort, setSort] = useState<Sort>("fresh");
  const [offset, setOffset] = useState(0);
  const [openItem, setOpenItem] = useState<AvitoItem | null>(null);
  const [photoIdx, setPhotoIdx] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const limit = 12;

  const load = useCallback((q: string, cat: string, off: number) => {
    setLoading(true);
    const params = new URLSearchParams({ mode: "premium", limit: String(limit), offset: String(off) });
    if (q) params.set("q", q);
    if (cat) params.set("category", cat);
    fetch(`${AVITO_URL}?${params.toString()}`)
      .then(r => r.json())
      .then(d => {
        setItems(d.items || []);
        setCategories(d.categories || []);
        setCounts(d.counts || { premium: 0, basic: 0, total: 0 });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const loadList = useCallback((q: string) => {
    const params = new URLSearchParams({ mode: "list", limit: "300" });
    if (q) params.set("q", q);
    fetch(`${AVITO_URL}?${params.toString()}`)
      .then(r => r.json())
      .then(d => setListItems(d.items || []))
      .catch(() => {});
  }, []);

  // Первая загрузка + тихий триггер автосинхронизации, если данные старше 30 минут
  useEffect(() => {
    load("", "", 0);
    loadList("");
    const t = setTimeout(() => {
      fetch(`${SYNC_URL}?action=auto&min=30`)
        .then(r => r.json())
        .then(d => {
          if (d?.ok && !d.skipped) {
            load("", "", 0);
            loadList("");
          }
        })
        .catch(() => {});
    }, 1500);
    return () => clearTimeout(t);
  }, [load, loadList]);

  const onSearch = (val: string) => {
    setQuery(val);
    setOffset(0);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      load(val, activeCat, 0);
      loadList(val);
    }, 350);
  };

  const onCat = (c: string) => {
    const next = activeCat === c ? "" : c;
    setActiveCat(next);
    setOffset(0);
    load(query, next, 0);
  };

  const goPage = (off: number) => {
    setOffset(off);
    load(query, activeCat, off);
    document.getElementById("avito-grid-top")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const openCard = (it: AvitoItem) => {
    setOpenItem(it);
    setPhotoIdx(0);
  };

  const sortedItems = useMemo(() => {
    const arr = [...items];
    if (sort === "price_asc") arr.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    if (sort === "price_desc") arr.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    return arr;
  }, [items, sort]);

  const sortedList = useMemo(() => {
    const arr = [...listItems];
    if (sort === "price_asc") arr.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    if (sort === "price_desc") arr.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    return arr;
  }, [listItems, sort]);

  const totalPages = Math.max(1, Math.ceil(counts.premium / limit));
  const currentPage = Math.floor(offset / limit) + 1;
  const hasFilter = !!query || !!activeCat;

  return (
    <div className="relative">
      <div id="avito-grid-top" className="absolute -top-4" />

      <AvitoFilters
        query={query}
        onSearch={onSearch}
        totalCount={counts.total}
        sort={sort}
        setSort={setSort}
        categories={categories}
        activeCat={activeCat}
        onCat={onCat}
        hasFilter={hasFilter}
        onReset={() => {
          setQuery("");
          setActiveCat("");
          load("", "", 0);
          loadList("");
        }}
      />

      <AvitoGrid
        loading={loading}
        items={items}
        sortedItems={sortedItems}
        sortedList={sortedList}
        hasFilter={hasFilter}
        totalPages={totalPages}
        currentPage={currentPage}
        limit={limit}
        onOpen={openCard}
        onPage={goPage}
      />

      {openItem && (
        <AvitoProductModal
          item={openItem}
          photoIdx={photoIdx}
          setPhotoIdx={setPhotoIdx}
          onClose={() => setOpenItem(null)}
        />
      )}
    </div>
  );
}
