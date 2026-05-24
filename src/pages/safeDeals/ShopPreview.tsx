/** Превью витрины товаров — встраивается прямо на /safe-deals.
 * Показывает 8 свежих карточек + кнопку «Вся витрина». */
import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { listShop, fmtRub, type ShopItem } from "./api";

export default function ShopPreview() {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listShop().then(r => {
      if (r.ok && r.data) setItems(r.data.items.slice(0, 8));
      setLoading(false);
    });
  }, []);

  if (!loading && items.length === 0) {
    // Если товаров нет — даём CTA первому стать продавцом
    return (
      <section className="max-w-3xl mx-auto px-4 sm:px-5 py-8 border-t border-[#1A1A1A]">
        <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-6 text-center">
          <Icon name="Store" size={28} className="text-[#FFD700] mx-auto mb-2" />
          <h3 className="text-base font-extrabold mb-1">Витрина только запускается</h3>
          <p className="text-sm text-[#999]">Стань первым продавцом — твой товар увидят все покупатели в Калуге.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-5 py-10 border-t border-[#1A1A1A]">
      <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/[0.1] border border-emerald-500/30 text-[10px] font-bold tracking-wider uppercase text-emerald-300 mb-2">
            <Icon name="ShieldCheck" size={11} /> Проверено в офисе
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold">
            Сейчас на витрине · <span className="text-[#FFD700]">Калуга</span>
          </h2>
          <p className="text-sm text-[#777] mt-1">Товары других пользователей, прошедшие проверку Скупка24</p>
        </div>
        <a href="/safe-deals/shop"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#FFD700] text-black font-bold text-sm hover:shadow-[0_10px_30px_-10px_rgba(255,215,0,0.5)] transition shrink-0">
          Вся витрина <Icon name="ArrowRight" size={14} />
        </a>
      </div>

      {loading && (
        <div className="text-center py-10 text-[#777]">
          <Icon name="Loader2" size={24} className="animate-spin inline" />
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {items.map(it => {
            const badge =
              it.status === "on_shelf" ? { text: "Проверено", cls: "bg-emerald-500/90", icon: "ShieldCheck" } :
              it.status === "reserved" ? { text: "Забронировано", cls: "bg-purple-500/90", icon: "Bookmark" } :
              it.status === "review" ? { text: "На проверке", cls: "bg-orange-500/90", icon: "Eye" } :
              { text: "Новинка", cls: "bg-blue-500/90", icon: "Sparkles" };
            return (
              <a key={it.dealNumber} href={`/safe-deals/item/${it.dealNumber}`}
                className="bg-[#141414] border border-[#2A2A2A] rounded-2xl overflow-hidden hover:border-[#FFD700]/40 hover:shadow-[0_10px_30px_-15px_rgba(255,215,0,0.4)] transition-all duration-300 active:scale-[0.98] block no-underline">
                <div className="aspect-square bg-[#1C1C1C] relative overflow-hidden">
                  {it.photos[0] ? (
                    <img src={it.photos[0].url} alt={it.productTitle} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-[#444]"><Icon name="Package" size={32} /></div>
                  )}
                  {it.isFeatured && (
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-[#FFD700] text-black text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1">
                      <Icon name="Crown" size={10} /> Топ
                    </div>
                  )}
                  <div className={`absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full ${badge.cls} text-white text-[10px] font-bold uppercase tracking-wider`}>
                    <Icon name={badge.icon} size={10} /> {badge.text}
                  </div>
                </div>
                <div className="p-3">
                  <div className="text-[10px] text-[#777] uppercase tracking-wider mb-0.5">{it.productCategory || "Товар"}</div>
                  <h3 className="text-sm font-bold text-white leading-tight mb-1.5 line-clamp-2">{it.productTitle}</h3>
                  {it.productCondition && (
                    <div className="text-[10px] text-[#999] mb-2">Состояние: {it.productCondition}</div>
                  )}
                  <div className="text-lg font-extrabold text-[#FFD700]">{fmtRub(it.price)}</div>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </section>
  );
}
