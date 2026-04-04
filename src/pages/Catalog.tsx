import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";

const SEND_LEAD_URL = "https://functions.poehali.dev/52666ff7-db52-4b6a-a90e-d60aeed699de";
const PRICE_MARKUP = 3500;

const CATALOG_URL = "https://functions.poehali.dev/e0e6576c-f000-4288-86ef-1de08ad7bcc4";

const CATEGORY_PHOTOS: Record<string, string> = {
  "iPhone 17/AIR/PRO/MAX": "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/1f1769fc-9b20-48ed-8861-8c1b04d23927.jpg",
  "iPhone 16/e/+/PRO/MAX": "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/1f1769fc-9b20-48ed-8861-8c1b04d23927.jpg",
  "iPhone 15/+/PRO/MAX":   "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/1f1769fc-9b20-48ed-8861-8c1b04d23927.jpg",
  "iPhone 11/12/13/14":    "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/1f1769fc-9b20-48ed-8861-8c1b04d23927.jpg",
  "MacBook":               "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/2770bb8e-b288-4a74-90dd-c34273d319b2.jpg",
  "AirPods":               "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/3f012a5d-ae26-4bd6-8a5b-5c5d3a1e7a18.jpg",
  "Apple Watch":           "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/d2560222-885a-4515-8776-83021252cc4b.jpg",
  "Apple iPad":            "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/266e961c-0843-4fe9-a40c-57b985d8871c.jpg",
  "Samsung S-Z":           "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/01aba5f4-13b9-45b2-9d70-19ae983f4b83.jpg",
  "Samsung A-M":           "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/01aba5f4-13b9-45b2-9d70-19ae983f4b83.jpg",
  "POCO M-X-F":            "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/0cf59ebb-65d4-49c5-a497-9981a237895a.jpg",
  "Xiaomi/Redmi/Pad":      "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/0cf59ebb-65d4-49c5-a497-9981a237895a.jpg",
  "Honor / PIXEL":         "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/0cf59ebb-65d4-49c5-a497-9981a237895a.jpg",
  "Realme / OnePlus / Nothing": "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/0cf59ebb-65d4-49c5-a497-9981a237895a.jpg",
  "Sony / XBOX / GoPro":   "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/e81be9d8-bf0f-4c6f-ad01-3d8479375a9d.jpg",
  "Яндекс / JBL / Marshall": "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/cf6f931d-3e9c-418b-a329-1bb362ec1c07.jpg",
  "Dyson / Garmin":        "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/b0d97190-0c73-4187-abec-eb1c45311653.jpg",
};

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
                    <ProductCard key={item.id} item={item} onBuy={setOrderItem} />
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

      {/* Order modal */}
      {orderItem && <OrderModal item={orderItem} onClose={() => setOrderItem(null)} />}
    </div>
  );
};

const ProductCard = ({ item, onBuy }: { item: CatalogItem; onBuy: (item: CatalogItem) => void }) => {
  const flag = item.region ? (REGION_FLAG[item.region] || "") : "";
  const inStock = item.availability === "in_stock";

  const title = [item.brand, item.model].filter(Boolean).join(" ");
  const sub = [item.ram, item.storage, item.color].filter(Boolean).join(" · ");
  const photo = item.photo_url || CATEGORY_PHOTOS[item.category] || null;

  return (
    <div className="bg-[#111] border border-[#222] hover:border-[#FFD700]/30 transition-colors group relative flex flex-col">
      {/* Image area */}
      <div className="h-44 bg-[#151515] relative overflow-hidden flex items-center justify-center">
        {photo ? (
          <img
            src={photo}
            alt={title}
            className="w-full h-full object-cover opacity-70 group-hover:opacity-90 group-hover:scale-105 transition-all duration-500"
          />
        ) : (
          <Icon name="Package" size={40} className="text-white/10" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-transparent" />
        {/* Availability badge */}
        <div className={`absolute top-2 left-2 font-roboto text-[10px] px-2 py-1 backdrop-blur-sm ${inStock ? "bg-green-900/70 text-green-400" : "bg-black/60 text-white/50"}`}>
          {inStock ? "✅ В наличии" : "🚗 Под заказ"}
        </div>
        {/* Region flag */}
        {flag && (
          <div className="absolute top-2 right-2 text-base drop-shadow">{flag}</div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <div className="font-oswald font-bold text-base uppercase leading-tight mb-1">{title}</div>
        {sub && <div className="font-roboto text-white/40 text-xs mb-3">{sub}</div>}

        <div className="mt-auto">
          <div className="mb-3">
            {item.price ? (
              <span className="font-oswald font-bold text-xl text-[#FFD700]">
                {(item.price + PRICE_MARKUP).toLocaleString("ru-RU")} ₽
              </span>
            ) : (
              <span className="font-roboto text-white/30 text-sm italic">Цену уточняйте</span>
            )}
          </div>
          <button
            onClick={() => onBuy(item)}
            className="w-full bg-[#FFD700] text-black font-oswald font-bold text-sm py-2.5 uppercase tracking-wide hover:bg-yellow-400 transition-colors flex items-center justify-center gap-2"
          >
            <Icon name="ShoppingCart" size={14} />
            Купить
          </button>
        </div>
      </div>
    </div>
  );
};

const OrderModal = ({ item, onClose }: { item: CatalogItem; onClose: () => void }) => {
  const [form, setForm] = useState({ name: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const title = [item.brand, item.model, item.storage, item.color].filter(Boolean).join(" ");
  const displayPrice = item.price ? (item.price + PRICE_MARKUP).toLocaleString("ru-RU") + " ₽" : "Цену уточняйте";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) return;
    setLoading(true);
    try {
      await fetch(SEND_LEAD_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          category: item.category,
          desc: `Заявка на покупку: ${title}, цена: ${displayPrice}`,
        }),
      });
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#1A1A1A] border border-[#FFD700]/30 w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-[#FFD700]/20">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-[#FFD700]" />
            <h3 className="font-oswald font-bold text-lg uppercase">Оформить заявку</h3>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
            <Icon name="X" size={20} />
          </button>
        </div>

        <div className="p-5">
          {/* Товар */}
          <div className="bg-[#111] border border-[#333] p-3 mb-5">
            <div className="font-oswald font-bold text-sm uppercase">{title}</div>
            <div className="font-oswald text-[#FFD700] font-bold text-lg mt-1">{displayPrice}</div>
            {item.availability === "on_order" && (
              <div className="font-roboto text-white/30 text-xs mt-1">🚗 Под заказ — доставка на следующий день (заказ до 17:00)</div>
            )}
          </div>

          {sent ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 bg-[#FFD700] flex items-center justify-center mx-auto mb-3">
                <Icon name="Check" size={28} className="text-black" />
              </div>
              <h4 className="font-oswald font-bold text-xl text-[#FFD700] mb-1">ЗАЯВКА ОТПРАВЛЕНА</h4>
              <p className="font-roboto text-white/50 text-sm">Перезвоним в течение 15 минут</p>
              <a href="tel:+79929990333" className="flex items-center justify-center gap-2 mt-4 text-[#FFD700] font-oswald font-bold">
                <Icon name="Phone" size={16} />
                +7 (992) 999-03-33
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="font-roboto text-white/40 text-xs uppercase tracking-wider block mb-1">Ваше имя</label>
                <input type="text" required value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Иван"
                  className="w-full bg-[#0D0D0D] border border-[#333] text-white px-3 py-2.5 font-roboto text-sm focus:outline-none focus:border-[#FFD700] transition-colors" />
              </div>
              <div>
                <label className="font-roboto text-white/40 text-xs uppercase tracking-wider block mb-1">Телефон</label>
                <input type="tel" required value={form.phone}
                  onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                  placeholder="+7 (___) ___-__-__"
                  className="w-full bg-[#0D0D0D] border border-[#333] text-white px-3 py-2.5 font-roboto text-sm focus:outline-none focus:border-[#FFD700] transition-colors" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-[#FFD700] text-black font-oswald font-bold py-3 uppercase tracking-wide hover:bg-yellow-400 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                <Icon name="Phone" size={16} />
                {loading ? "Отправляем..." : "Отправить заявку"}
              </button>
              <p className="font-roboto text-white/20 text-[10px] text-center">
                Перезвоним в течение 15 минут
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Catalog;