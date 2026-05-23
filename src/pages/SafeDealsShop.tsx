/** Витрина проверенных товаров — /safe-deals/shop. Публичная страница.
 * Показывает товары в статусе on_shelf и reserved (с пометкой «Проверено Скупка24»). */
import { useEffect, useMemo, useState } from "react";
import Icon from "@/components/ui/icon";
import { listShop, fmtRub, type ShopItem } from "./safeDeals/api";

export default function SafeDealsShop() {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string>("");

  useEffect(() => {
    document.title = "Витрина — Безопасная сделка | Скупка24";
    listShop().then(r => {
      if (r.ok && r.data) setItems(r.data.items);
      setLoading(false);
    });
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach(i => { if (i.productCategory) set.add(i.productCategory); });
    return Array.from(set).sort();
  }, [items]);

  const filtered = useMemo(() => {
    const qLow = q.toLowerCase();
    return items.filter(i =>
      (!category || i.productCategory === category) &&
      (!q || i.productTitle.toLowerCase().includes(qLow) || (i.productDescription || "").toLowerCase().includes(qLow))
    );
  }, [items, q, category]);

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-[#F0F0F0]" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" }}>
      {/* TopBar */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#2A2A2A] bg-[#141414]">
        <a href="/" className="flex items-center gap-2.5 no-underline">
          <div className="w-8 h-8 rounded-lg bg-[#FFD700] flex items-center justify-center text-black font-extrabold text-base">С</div>
          <span className="text-[#FFD700] font-bold text-base">Скупка24</span>
        </a>
        <a href="/safe-deals" className="text-sm text-[#FFD700] hover:underline flex items-center gap-1">
          <Icon name="Shield" size={14} /> Подать товар
        </a>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-5 py-6 sm:py-8">
        {/* Hero */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FFD700]/[0.1] border border-[#FFD700]/30 text-[10px] font-bold tracking-wider uppercase text-[#FFD700] mb-3">
            <Icon name="ShieldCheck" size={11} /> Проверено в офисе
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight">
            Витрина <span className="bg-gradient-to-r from-[#FFD700] to-[#fff3a0] bg-clip-text text-transparent">проверенных товаров</span>
          </h1>
          <p className="text-sm text-[#999] mt-2 max-w-xl mx-auto">
            Каждое устройство осмотрено сотрудником Скупка24. Покупка только в офисе на ул. Кирова, 11 — никаких рисков.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-3 sm:p-4 mb-5 grid sm:grid-cols-[1fr_auto] gap-2">
          <div className="relative">
            <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#777]" />
            <input value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Поиск по названию или описанию"
              className="w-full bg-[#1C1C1C] border border-[#2A2A2A] rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none focus:border-[#FFD700]" />
          </div>
          <select value={category} onChange={(e) => setCategory(e.target.value)}
            className="bg-[#1C1C1C] border border-[#2A2A2A] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#FFD700]">
            <option value="">Все категории</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {loading && (
          <div className="text-center py-10 text-[#777]">
            <Icon name="Loader2" size={24} className="animate-spin inline" />
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-12">
            <Icon name="Store" size={32} className="text-[#444] mx-auto mb-2" />
            <div className="text-sm text-[#777]">Пока нет товаров</div>
            <a href="/safe-deals" className="inline-block mt-4 text-sm text-[#FFD700] hover:underline">Стать первым продавцом →</a>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {filtered.map(it => (
              <article key={it.dealNumber}
                className="bg-[#141414] border border-[#2A2A2A] rounded-2xl overflow-hidden hover:border-[#FFD700]/40 hover:shadow-[0_10px_30px_-15px_rgba(255,215,0,0.4)] transition-all duration-300">
                <div className="aspect-square bg-[#1C1C1C] relative overflow-hidden">
                  {it.photos[0] ? (
                    <img src={it.photos[0].url} alt={it.productTitle} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-[#444]">
                      <Icon name="Package" size={36} />
                    </div>
                  )}
                  {it.status === "reserved" && (
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-purple-500/90 text-white text-[10px] font-bold uppercase tracking-wider">
                      Забронировано
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/90 text-white text-[10px] font-bold uppercase tracking-wider w-fit">
                    <Icon name="ShieldCheck" size={10} /> Проверено
                  </div>
                </div>
                <div className="p-3">
                  <div className="text-[10px] text-[#777] uppercase tracking-wider mb-0.5">{it.productCategory || "Товар"}</div>
                  <h3 className="text-sm font-bold text-white leading-tight mb-1.5 line-clamp-2">{it.productTitle}</h3>
                  {it.productCondition && (
                    <div className="text-[10px] text-[#999] mb-2">Состояние: {it.productCondition}</div>
                  )}
                  <div className="flex items-end justify-between gap-2">
                    <div className="text-lg font-extrabold text-[#FFD700] leading-none">{fmtRub(it.price)}</div>
                    <div className="text-[10px] text-[#666] uppercase tracking-wider">{it.dealNumber}</div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="mt-10 bg-gradient-to-br from-[#FFD700]/[0.08] to-transparent border border-[#FFD700]/20 rounded-2xl p-6 text-center">
          <h3 className="text-lg font-extrabold mb-2">Заинтересовал товар?</h3>
          <p className="text-sm text-[#999] mb-4">Приезжайте в офис на ул. Кирова, 11 — осмотрите, проверьте, заберите.</p>
          <a href="https://yandex.ru/maps/?text=Калуга,+Кирова+11" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#FFD700] text-black font-bold text-sm hover:shadow-[0_15px_40px_-10px_rgba(255,215,0,0.5)] transition">
            <Icon name="MapPin" size={16} /> Открыть на карте
          </a>
        </div>
      </div>
    </div>
  );
}
