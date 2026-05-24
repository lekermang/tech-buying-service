/** Публичная карточка товара /safe-deals/item/:dealNumber.
 * SEO-страница каждого товара с Schema.org Product + Offer. */
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import Icon from "@/components/ui/icon";
import { getItemByNumber, fmtRub, OFFICE_ADDRESS, type ShopItemFull } from "./safeDeals/api";

const STATUS_BADGE: Record<string, { label: string; cls: string; icon: string }> = {
  submitted:  { label: "Новинка",        cls: "bg-blue-500/15 text-blue-300 border-blue-500/30", icon: "Sparkles" },
  review:     { label: "На проверке",    cls: "bg-orange-500/15 text-orange-300 border-orange-500/30", icon: "Eye" },
  on_shelf:   { label: "Проверено",      cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30", icon: "ShieldCheck" },
  reserved:   { label: "Забронировано",  cls: "bg-purple-500/15 text-purple-300 border-purple-500/30", icon: "Bookmark" },
};

export default function SafeDealsItem() {
  const { dealNumber = "" } = useParams<{ dealNumber: string }>();
  const [item, setItem] = useState<ShopItemFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [activePhoto, setActivePhoto] = useState(0);

  useEffect(() => {
    (async () => {
      const r = await getItemByNumber(dealNumber);
      setLoading(false);
      if (!r.ok || !r.data) { setErr(r.error || "Не найдено"); return; }
      setItem(r.data);

      // SEO + Schema.org Product
      const title = `${r.data.productTitle} за ${fmtRub(r.data.price)} — Скупка24 Калуга`;
      const desc = `${r.data.productTitle}. ${r.data.productCondition ? "Состояние: " + r.data.productCondition + ". " : ""}Проверено Скупка24. Самовывоз ул. Кирова, 11.`;
      document.title = title;
      const setMeta = (n: string, c: string, p = false) => {
        const sel = p ? `meta[property="${n}"]` : `meta[name="${n}"]`;
        let el = document.head.querySelector<HTMLMetaElement>(sel);
        if (!el) { el = document.createElement("meta"); if (p) el.setAttribute("property", n); else el.setAttribute("name", n); document.head.appendChild(el); }
        el.setAttribute("content", c); return el;
      };
      const tags = [
        setMeta("description", desc),
        setMeta("og:title", title, true),
        setMeta("og:description", desc, true),
        setMeta("og:image", r.data.photos[0]?.url || "", true),
        setMeta("og:type", "product", true),
      ];

      const ld = document.createElement("script");
      ld.type = "application/ld+json";
      ld.text = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Product",
        name: r.data.productTitle,
        image: r.data.photos.map(p => p.url),
        description: r.data.productDescription || desc,
        brand: r.data.productBrand ? { "@type": "Brand", name: r.data.productBrand } : undefined,
        category: r.data.productCategory,
        offers: {
          "@type": "Offer",
          price: r.data.price,
          priceCurrency: "RUB",
          availability: r.data.status === "on_shelf" ? "https://schema.org/InStock" : "https://schema.org/PreOrder",
          itemCondition: "https://schema.org/UsedCondition",
          seller: { "@type": "Organization", name: "Скупка24" },
          areaServed: "Калуга",
        },
      });
      document.head.appendChild(ld);
      return () => { tags.forEach(t => t.remove()); ld.remove(); };
    })();
  }, [dealNumber]);

  const share = async () => {
    if (!item) return;
    const url = window.location.href;
    const text = `${item.productTitle} за ${fmtRub(item.price)} · Скупка24 Калуга`;
    const nav = navigator as Navigator & { share?: (d: { title?: string; text?: string; url?: string }) => Promise<void> };
    if (typeof nav.share === "function") {
      try { await nav.share({ title: item.productTitle, text, url }); return; } catch {/* отменили */}
    }
    try { await navigator.clipboard.writeText(url); toast.success("Ссылка скопирована"); } catch {/* ignore */}
  };

  if (loading) return (
    <Page>
      <div className="text-center py-12"><Icon name="Loader2" size={28} className="animate-spin text-[#FFD700] inline" /></div>
    </Page>
  );
  if (err || !item) return (
    <Page>
      <div className="max-w-md mx-auto px-5 py-12 text-center">
        <Icon name="AlertCircle" size={36} className="text-[#FF453A] mx-auto mb-2" />
        <h2 className="text-base font-bold">{err || "Товар не найден"}</h2>
        <a href="/safe-deals/shop" className="inline-block mt-4 text-sm text-[#FFD700] hover:underline">← К витрине</a>
      </div>
    </Page>
  );

  const badge = STATUS_BADGE[item.status] || STATUS_BADGE.on_shelf;
  const isAvailable = item.status === "on_shelf" || item.status === "submitted" || item.status === "review";

  return (
    <Page>
      <div className="max-w-4xl mx-auto px-4 sm:px-5 py-6">
        <a href="/safe-deals/shop" className="text-sm text-[#FFD700] inline-flex items-center gap-1 mb-4 hover:underline">
          <Icon name="ChevronLeft" size={14} /> К витрине
        </a>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Фото */}
          <div>
            <div className="aspect-square rounded-2xl overflow-hidden bg-[#141414] border border-[#2A2A2A] mb-2">
              {item.photos[activePhoto]?.url ? (
                <img src={item.photos[activePhoto].url} alt={item.productTitle} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#333]"><Icon name="Package" size={56} /></div>
              )}
            </div>
            {item.photos.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {item.photos.map((p, i) => (
                  <button key={i} onClick={() => setActivePhoto(i)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition ${activePhoto === i ? "border-[#FFD700]" : "border-[#2A2A2A]"}`}>
                    <img src={p.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Инфо */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-wider font-bold ${badge.cls} flex items-center gap-1`}>
                  <Icon name={badge.icon} size={10} /> {badge.label}
                </span>
                {item.isFeatured && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FFD700]/15 text-[#FFD700] border border-[#FFD700]/30 uppercase tracking-wider font-bold flex items-center gap-1">
                    <Icon name="Crown" size={10} /> Топ
                  </span>
                )}
                <span className="text-[10px] text-[#666]">{item.dealNumber}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight">{item.productTitle}</h1>
              <div className="text-4xl font-extrabold text-[#FFD700] mt-3">{fmtRub(item.price)}</div>
            </div>

            <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-4 space-y-2 text-sm">
              {item.productBrand && <Row l="Бренд" v={item.productBrand} />}
              {item.productModel && <Row l="Модель" v={item.productModel} />}
              {item.productCategory && <Row l="Категория" v={item.productCategory} />}
              {item.productCondition && <Row l="Состояние" v={item.productCondition} />}
              <Row l="Продавец" v={item.sellerNameMasked} />
            </div>

            {item.productDescription && (
              <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-4">
                <div className="text-xs uppercase tracking-wider text-[#FFD700] font-bold mb-2">Описание</div>
                <p className="text-sm text-[#ddd] leading-relaxed whitespace-pre-wrap">{item.productDescription}</p>
              </div>
            )}

            {item.officeCheckNotes && (
              <div className="bg-emerald-500/[0.06] border border-emerald-500/30 rounded-2xl p-4">
                <div className="text-xs uppercase tracking-wider text-emerald-300 font-bold mb-2 flex items-center gap-1">
                  <Icon name="ShieldCheck" size={11} /> Отчёт о проверке в офисе
                </div>
                <p className="text-sm text-[#ddd] leading-relaxed">{item.officeCheckNotes}</p>
              </div>
            )}

            {!isAvailable && (
              <div className="bg-red-500/[0.06] border border-red-500/30 rounded-2xl px-3 py-2 text-sm text-red-300">
                <Icon name="X" size={12} className="inline mr-1" /> Товар уже недоступен
              </div>
            )}

            <div className="bg-gradient-to-br from-[#FFD700]/[0.08] to-transparent border border-[#FFD700]/25 rounded-2xl p-4">
              <div className="text-xs uppercase tracking-wider text-[#FFD700] font-bold mb-2 flex items-center gap-1">
                <Icon name="MapPin" size={11} /> Как купить
              </div>
              <p className="text-sm text-[#ddd] mb-2">
                Приезжайте в офис <b>{OFFICE_ADDRESS}</b>, осмотрите товар, оплатите. Сделка по QR-коду в офисе.
              </p>
              <div className="flex flex-wrap gap-2">
                <a href="https://yandex.ru/maps/?text=Калуга,+Кирова+11" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#FFD700] text-black font-bold text-sm">
                  <Icon name="MapPin" size={14} /> На карте
                </a>
                <a href="tel:+79299990333" className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border-2 border-[#2A2A2A] text-[#F0F0F0] font-bold text-sm hover:border-[#FFD700]">
                  <Icon name="Phone" size={14} /> Позвонить
                </a>
                <button onClick={share}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border-2 border-[#2A2A2A] text-[#F0F0F0] font-bold text-sm hover:border-[#FFD700]">
                  <Icon name="Share2" size={14} /> Поделиться
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
}

function Row({ l, v }: { l: string; v: string | number | null | undefined }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[#777]">{l}</span>
      <span className="text-white font-bold text-right">{v || "—"}</span>
    </div>
  );
}

function Page({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0D0D0D] text-[#F0F0F0]" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" }}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#2A2A2A] bg-[#141414]">
        <a href="/" className="flex items-center gap-2.5 no-underline">
          <div className="w-8 h-8 rounded-lg bg-[#FFD700] flex items-center justify-center text-black font-extrabold text-base">С</div>
          <span className="text-[#FFD700] font-bold text-base">Скупка24</span>
        </a>
        <a href="/safe-deals/shop" className="text-sm text-[#FFD700] hover:underline">Витрина</a>
      </div>
      {children}
    </div>
  );
}
