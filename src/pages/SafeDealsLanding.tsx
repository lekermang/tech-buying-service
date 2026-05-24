/** Универсальный SEO-лендинг для гео+интент запросов:
 * - /safe-deals/kupit-iphone-kaluga (для покупателя)
 * - /safe-deals/srochno-prodat-telefon (для продавца)
 * - /safe-deals/vykup-noutbukov (для продавца ноутбуков)
 * Контент управляется через config по slug, Schema.org LocalBusiness + Product. */
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { listShop, subscribeLead, fmtRub, type ShopItem } from "./safeDeals/api";

const SLUGS = {
  "kupit-iphone-kaluga": {
    title: "Купить iPhone в Калуге с гарантией — Скупка24",
    description: "Купить iPhone бывший в употреблении в Калуге с проверкой и гарантией. Витрина проверенных Б/У iPhone от 5 000 ₽. Самовывоз ул. Кирова, 11.",
    keywords: "купить iphone калуга, бу iphone калуга, айфон бу с гарантией калуга, iphone скупка24",
    h1: "Купить iPhone в Калуге",
    h2: "С гарантией · проверка перед покупкой · самовывоз",
    intent: "buyer" as const,
    filter: (i: ShopItem) =>
      /iphone|apple/i.test(i.productTitle) || /iphone|apple/i.test(i.productBrand || "") ||
      i.productCategory === "Смартфоны" || i.productCategory === "Смартфон",
    ctaTitle: "Не нашли нужную модель?",
    ctaText: "Оставьте email — пришлём, когда появится подходящий iPhone в Калуге",
  },
  "srochno-prodat-telefon": {
    title: "Срочно продать телефон в Калуге — деньги сегодня | Скупка24",
    description: "Срочный выкуп телефонов в Калуге через гаранта. Деньги сегодня, без рисков и торга. Комиссия 10%, оформление 2 минуты. Кирова, 11.",
    keywords: "срочно продать телефон калуга, выкуп телефонов калуга, скупка iphone калуга срочно, деньги за телефон сегодня",
    h1: "Срочно продать телефон в Калуге",
    h2: "Деньги сегодня · без торга · без обмана",
    intent: "seller" as const,
    filter: () => false,
    ctaTitle: "Подайте заявку прямо сейчас",
    ctaText: "ИИ за 2 минуты заполнит описание · оценит цену по рынку · подберёт покупателя",
  },
  "vykup-noutbukov": {
    title: "Выкуп ноутбуков в Калуге — оценка за 2 минуты | Скупка24",
    description: "Выкуп ноутбуков в Калуге через безопасную сделку. MacBook, Lenovo, ASUS, HP. Деньги сразу. Гарант — Скупка24, Кирова, 11.",
    keywords: "выкуп ноутбуков калуга, продать ноутбук калуга, скупка macbook калуга, оценка ноутбука",
    h1: "Выкуп ноутбуков в Калуге",
    h2: "MacBook · игровые · офисные · оценка за 2 минуты",
    intent: "seller" as const,
    filter: (i: ShopItem) =>
      /ноут|laptop|macbook|notebook/i.test(i.productTitle) ||
      i.productCategory === "Ноутбуки",
    ctaTitle: "Продайте ноутбук безопасно",
    ctaText: "Привезите в офис — ИИ оценит за 2 минуты, мы найдём покупателя",
  },
} as const;

type SlugKey = keyof typeof SLUGS;

export default function SafeDealsLanding() {
  const { slug = "" } = useParams<{ slug: string }>();
  const cfg = (SLUGS as Record<string, typeof SLUGS["kupit-iphone-kaluga"]>)[slug as SlugKey];
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!cfg) { setLoading(false); return; }
    document.title = cfg.title;
    const url = `https://skupka24.com/safe-deals/${slug}`;

    const setMeta = (n: string, c: string, p = false) => {
      const sel = p ? `meta[property="${n}"]` : `meta[name="${n}"]`;
      let el = document.head.querySelector<HTMLMetaElement>(sel);
      if (!el) { el = document.createElement("meta"); if (p) el.setAttribute("property", n); else el.setAttribute("name", n); document.head.appendChild(el); }
      el.setAttribute("content", c); return el;
    };
    const created: HTMLElement[] = [];
    created.push(setMeta("description", cfg.description));
    created.push(setMeta("keywords", cfg.keywords));
    created.push(setMeta("og:title", cfg.title, true));
    created.push(setMeta("og:description", cfg.description, true));
    created.push(setMeta("og:url", url, true));

    let canon = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canon) { canon = document.createElement("link"); canon.rel = "canonical"; document.head.appendChild(canon); }
    canon.href = url;

    // Schema LocalBusiness + AggregateRating
    const ld = document.createElement("script");
    ld.type = "application/ld+json";
    ld.text = JSON.stringify({
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "LocalBusiness",
          "@id": "https://skupka24.com/#org",
          name: "Скупка24",
          description: cfg.description,
          url: "https://skupka24.com",
          telephone: "+7 (929) 999-03-33",
          address: {
            "@type": "PostalAddress",
            streetAddress: "ул. Кирова, 11",
            addressLocality: "Калуга",
            addressCountry: "RU",
          },
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: "4.9",
            reviewCount: "284",
          },
          openingHours: "Mo-Su 10:00-20:00",
        },
        {
          "@type": "WebPage",
          name: cfg.title,
          description: cfg.description,
          url,
        },
      ],
    });
    document.head.appendChild(ld);

    listShop().then(r => {
      if (r.ok && r.data) {
        setItems(r.data.items.filter(cfg.filter));
      }
      setLoading(false);
    });

    return () => {
      created.forEach(e => e.remove());
      ld.remove();
    };
  }, [slug, cfg]);

  if (!cfg) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-[#F0F0F0] flex items-center justify-center">
        <div className="text-center px-5">
          <Icon name="AlertCircle" size={36} className="text-[#FF453A] mx-auto mb-2" />
          <h2 className="text-base font-bold">Страница не найдена</h2>
          <a href="/safe-deals" className="inline-block mt-4 text-sm text-[#FFD700] hover:underline">На главную сделки →</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-[#F0F0F0]" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" }}>
      <TopBar />
      <div className="max-w-4xl mx-auto px-4 sm:px-5 py-8 sm:py-12">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FFD700]/[0.1] border border-[#FFD700]/30 text-[10px] font-bold tracking-wider uppercase text-[#FFD700] mb-3">
            <Icon name="MapPin" size={11} /> Калуга · Кирова, 11
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight">
            <span className="bg-gradient-to-r from-[#FFD700] via-[#fff3a0] to-[#FFD700] bg-clip-text text-transparent">{cfg.h1}</span>
          </h1>
          <p className="text-sm sm:text-base text-[#999] mt-3">{cfg.h2}</p>

          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            {cfg.intent === "seller" ? (
              <a href="/safe-deals" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-[#FFD700] text-black font-bold text-sm hover:shadow-[0_15px_40px_-10px_rgba(255,215,0,0.5)] transition">
                <Icon name="Shield" size={16} /> Подать заявку
              </a>
            ) : (
              <a href="/safe-deals/shop" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-[#FFD700] text-black font-bold text-sm hover:shadow-[0_15px_40px_-10px_rgba(255,215,0,0.5)] transition">
                <Icon name="Store" size={16} /> Витрина товаров
              </a>
            )}
            <a href="https://yandex.ru/maps/?text=Калуга,+Кирова+11" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl border-2 border-[#2A2A2A] text-[#F0F0F0] font-bold text-sm hover:border-[#FFD700] transition">
              <Icon name="MapPin" size={16} /> На карте
            </a>
          </div>
        </div>

        {/* Преимущества */}
        <div className="grid sm:grid-cols-3 gap-3 mb-10">
          <Adv icon="ShieldCheck" title="Проверка в офисе" desc="Сотрудник лично проверяет каждое устройство перед сделкой" />
          <Adv icon="Wallet" title="Деньги сразу" desc="Наличными или переводом сразу при подтверждении" />
          <Adv icon="Lock" title="QR-сделка" desc="Безопасное подтверждение в офисе по уникальному коду" />
        </div>

        {/* Витрина (если есть items) */}
        {!loading && items.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-extrabold text-center mb-4">Доступно сейчас в Калуге</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {items.slice(0, 9).map(it => (
                <a key={it.dealNumber} href={`/safe-deals/item/${it.dealNumber}`}
                  className="bg-[#141414] border border-[#2A2A2A] rounded-2xl overflow-hidden hover:border-[#FFD700]/40 transition">
                  <div className="aspect-square bg-[#1C1C1C] relative overflow-hidden">
                    {it.photos[0] ? (
                      <img src={it.photos[0].url} alt={it.productTitle} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-[#444]"><Icon name="Package" size={28} /></div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-bold text-white truncate">{it.productTitle}</h3>
                    <div className="flex items-baseline justify-between mt-1">
                      <div className="text-base font-extrabold text-[#FFD700]">{fmtRub(it.price)}</div>
                      <div className="text-[10px] text-[#666]">{it.dealNumber}</div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Лид-форма */}
        <LeadForm title={cfg.ctaTitle} text={cfg.ctaText} source={`landing:${slug}`} />

        {/* Доверие */}
        <div className="mt-10 bg-[#141414] border border-[#2A2A2A] rounded-2xl p-5 sm:p-6 grid sm:grid-cols-3 gap-4 text-center">
          <Trust icon="Award" title="9 лет на рынке" />
          <Trust icon="Star" title="4.9 на картах · 284 отзыва" />
          <Trust icon="Users" title="50 000+ клиентов" />
        </div>
      </div>
    </div>
  );
}

function TopBar() {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-[#2A2A2A] bg-[#141414]">
      <a href="/" className="flex items-center gap-2.5 no-underline">
        <div className="w-8 h-8 rounded-lg bg-[#FFD700] flex items-center justify-center text-black font-extrabold text-base">С</div>
        <span className="text-[#FFD700] font-bold text-base">Скупка24</span>
      </a>
      <a href="/safe-deals" className="text-sm text-[#FFD700] hover:underline">Безопасная сделка</a>
    </div>
  );
}

function Adv({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-4 text-center">
      <Icon name={icon} size={22} className="text-[#FFD700] mx-auto mb-2" />
      <div className="text-sm font-bold">{title}</div>
      <div className="text-xs text-[#999] mt-1">{desc}</div>
    </div>
  );
}

function Trust({ icon, title }: { icon: string; title: string }) {
  return (
    <div>
      <Icon name={icon} size={20} className="text-[#FFD700] mx-auto mb-1" />
      <div className="text-xs uppercase tracking-wider text-[#999]">{title}</div>
    </div>
  );
}

function LeadForm({ title, text, source }: { title: string; text: string; source: string }) {
  const [contact, setContact] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!contact.trim()) return;
    setLoading(true);
    const r = await subscribeLead(contact.trim(), source);
    setLoading(false);
    if (r.ok) setDone(true);
  };

  if (done) {
    return (
      <div className="bg-emerald-500/[0.06] border border-emerald-500/30 rounded-2xl p-5 text-center">
        <Icon name="CheckCircle2" size={28} className="text-emerald-400 mx-auto mb-2" />
        <div className="text-base font-bold text-emerald-300">Спасибо! Мы свяжемся с вами</div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-[#FFD700]/[0.08] to-transparent border border-[#FFD700]/25 rounded-2xl p-5 sm:p-6">
      <h3 className="text-base font-extrabold mb-1">{title}</h3>
      <p className="text-sm text-[#999] mb-4">{text}</p>
      <div className="flex gap-2 flex-wrap">
        <input value={contact} onChange={(e) => setContact(e.target.value)}
          placeholder="Email или телефон"
          className="flex-1 min-w-[180px] bg-[#1C1C1C] border border-[#2A2A2A] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#FFD700]" />
        <button onClick={submit} disabled={loading || !contact.trim()}
          className="px-5 py-3 rounded-xl bg-[#FFD700] text-black font-bold text-sm disabled:opacity-50">
          {loading ? "..." : "Получить"}
        </button>
      </div>
      <div className="text-[10px] text-[#666] mt-2">Не передаём третьим лицам. Можно отписаться в любой момент.</div>
    </div>
  );
}