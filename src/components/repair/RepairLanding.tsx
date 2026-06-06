/**
 * Универсальный шаблон для SEO-подстраниц ремонта.
 * Используется для /remont-iphone-kaluga, /remont-samsung-kaluga и др.
 */
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { ymGoal, Goals } from "@/lib/ym";
import DigitalParticles from "@/components/fx/DigitalParticles";
import RepairWidget from "@/components/skupka/RepairWidget";
import RepairStats from "@/components/repair/RepairStats";
import RepairHowItWorks from "@/components/repair/RepairHowItWorks";
import { REPAIR_PHONE_DISPLAY, REPAIR_PHONE_TEL } from "@/components/repair/repairContacts";

/* ── SEO-вставка в <head> ────────────────────────────────────────────────── */
function LandingSEO({ title, desc, url, keywords, serviceName, serviceDesc, minPrice, faqItems }: {
  title: string;
  desc: string;
  url: string;
  keywords?: string;
  serviceName?: string;
  serviceDesc?: string;
  minPrice?: string;
  faqItems?: { q: string; a: string }[];
}) {
  useEffect(() => {
    const prev = document.title;
    document.title = title;

    const setMeta = (sel: string, attr: "name" | "property", key: string, val: string) => {
      let el = document.head.querySelector<HTMLMetaElement>(sel);
      if (!el) { el = document.createElement("meta"); el.setAttribute(attr, key); document.head.appendChild(el); }
      el.setAttribute("content", val);
      return el;
    };
    const created: HTMLElement[] = [];
    const push = (el: HTMLElement | null) => { if (el) created.push(el); };
    push(setMeta(`meta[name="description"]`, "name", "description", desc));
    push(setMeta(`meta[property="og:title"]`, "property", "og:title", title));
    push(setMeta(`meta[property="og:description"]`, "property", "og:description", desc));
    push(setMeta(`meta[property="og:url"]`, "property", "og:url", url));
    push(setMeta(`meta[property="og:type"]`, "property", "og:type", "website"));
    if (keywords) push(setMeta(`meta[name="keywords"]`, "name", "keywords", keywords));

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) { canonical = document.createElement("link"); canonical.setAttribute("rel", "canonical"); document.head.appendChild(canonical); }
    canonical.setAttribute("href", url);

    const scripts: HTMLScriptElement[] = [];

    const localBusiness = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: "Скупка24 — Сервисный центр",
      url: "https://skypka24.com",
      telephone: "+79929990333",
      address: {
        "@type": "PostalAddress",
        streetAddress: "ул. Кирова, 7",
        addressLocality: "Калуга",
        addressCountry: "RU",
        postalCode: "248000",
      },
      geo: { "@type": "GeoCoordinates", latitude: 54.5293, longitude: 36.2754 },
      openingHours: "Mo-Su 09:00-21:00",
      priceRange: "₽₽",
      image: "https://skypka24.com/og-repair.jpg",
      sameAs: ["https://yandex.ru/maps/-/CHtqKn1w"],
    };
    const lbScript = document.createElement("script");
    lbScript.type = "application/ld+json";
    lbScript.text = JSON.stringify(localBusiness);
    document.head.appendChild(lbScript);
    scripts.push(lbScript);

    if (serviceName) {
      const service = {
        "@context": "https://schema.org",
        "@type": "Service",
        name: serviceName,
        description: serviceDesc ?? desc,
        provider: {
          "@type": "LocalBusiness",
          name: "Скупка24",
          telephone: "+79929990333",
          address: { "@type": "PostalAddress", streetAddress: "ул. Кирова, 7", addressLocality: "Калуга", addressCountry: "RU" },
        },
        areaServed: { "@type": "City", name: "Калуга" },
        ...(minPrice ? {
          offers: {
            "@type": "Offer",
            priceCurrency: "RUB",
            price: minPrice,
            priceSpecification: { "@type": "PriceSpecification", minPrice, priceCurrency: "RUB" },
          },
        } : {}),
      };
      const svcScript = document.createElement("script");
      svcScript.type = "application/ld+json";
      svcScript.text = JSON.stringify(service);
      document.head.appendChild(svcScript);
      scripts.push(svcScript);
    }

    if (faqItems?.length) {
      const s = document.createElement("script");
      s.type = "application/ld+json";
      s.text = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqItems.map(f => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      });
      document.head.appendChild(s);
      scripts.push(s);
    }

    return () => {
      document.title = prev;
      created.forEach(el => el.remove());
      scripts.forEach(s => s.remove());
    };
  }, [title, desc, url, keywords, serviceName, serviceDesc, minPrice, faqItems]);
  return null;
}

/* ── Параллакс (как на главной /repair) ─────────────────────────────────── */
function useParallax(ref: React.RefObject<HTMLElement | null>, speed: number) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => { el.style.transform = `translateY(${window.scrollY * speed}px)`; };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [ref, speed]);
}

/* ── Тип конфигурации подстраницы ────────────────────────────────────────── */
export type RepairLandingConfig = {
  /** SEO */
  title: string;
  desc: string;
  url: string;
  keywords?: string;
  serviceName?: string;
  serviceDesc?: string;
  minPrice?: string;
  /** Hero */
  badge: string;
  h1line1: string;
  h1accent: string;
  h1line2?: string;
  heroText: string;
  /** Преимущества под H1 */
  advantages: { icon: string; text: string }[];
  /** Основные услуги с ценами */
  services: { name: string; price: string; time?: string }[];
  /** Итоговый CTA-текст */
  ctaTitle?: string;
  /** FAQ */
  faq?: { q: string; a: string }[];
  /** SEO-текст внизу */
  seoText?: string;
};

/* ── Главный компонент ───────────────────────────────────────────────────── */
export default function RepairLanding({ config }: { config: RepairLandingConfig }) {
  const [scrolled, setScrolled] = useState(false);
  const bgRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  useParallax(bgRef, 0.4);
  useParallax(textRef, 0.15);

  useEffect(() => {
    window.scrollTo(0, 0);
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToForm = () => {
    document.getElementById("repair-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="relative min-h-screen bg-[#0d0d0d] text-white overflow-x-hidden">
      <LandingSEO
        title={config.title}
        desc={config.desc}
        url={config.url}
        keywords={config.keywords}
        serviceName={config.serviceName}
        serviceDesc={config.serviceDesc}
        minPrice={config.minPrice}
        faqItems={config.faq}
      />

      {/* Фон — частицы + свечения */}
      <div aria-hidden className="fixed inset-0 z-0 pointer-events-none">
        <DigitalParticles />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full blur-[120px]"
          style={{ background: "rgba(255,215,0,0.09)" }} />
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] rounded-full blur-[140px]"
          style={{ background: "rgba(255,215,0,0.05)" }} />
        <div className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,215,0,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,215,0,0.025) 1px,transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(ellipse at 50% 0%,black,transparent 75%)",
          }} />
      </div>

      <div className="relative z-10">
        {/* Навбар */}
        <nav className={`sticky top-0 z-50 flex items-center justify-between px-4 sm:px-8 py-3 border-b transition-all duration-300 ${scrolled ? "bg-[#0d0d0d]/95 border-[#FFD700]/15 backdrop-blur-lg shadow-[0_4px_24px_rgba(0,0,0,0.4)]" : "bg-transparent border-transparent"}`}>
          {/* Левая часть: ← назад + бренд */}
          <div className="flex items-center gap-2 min-w-0">
            <Link to="/repair" aria-label="Назад к ремонту"
              className="flex items-center justify-center w-9 h-9 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-[#FFD700]/30 transition-all shrink-0 active:scale-95">
              <Icon name="ChevronLeft" size={18} className="text-white/60" />
            </Link>
            <div className="hidden xs:flex items-center gap-1.5 text-white/30 text-xs font-roboto">
              <Link to="/" className="hover:text-[#FFD700] transition-colors">Скупка24</Link>
              <Icon name="ChevronRight" size={10} className="text-white/20" />
              <Link to="/repair" className="hover:text-white/60 transition-colors">Ремонт</Link>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <a href={REPAIR_PHONE_TEL}
              onClick={() => ymGoal(Goals.CALL_CLICK, { place: "landing_nav" })}
              className="hidden md:inline-flex items-center gap-1.5 text-[#FFD700] font-oswald font-bold text-sm hover:text-[#ffed4a] transition-colors">
              <Icon name="Phone" size={14} />
              {REPAIR_PHONE_DISPLAY}
            </a>
            <a href={REPAIR_PHONE_TEL}
              onClick={() => ymGoal(Goals.CALL_CLICK, { place: "landing_nav_mobile" })}
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl border border-[#FFD700]/25 bg-[#FFD700]/10 text-[#FFD700] active:bg-[#FFD700]/20 transition-all">
              <Icon name="Phone" size={16} />
            </a>
            <button onClick={scrollToForm}
              className="group relative overflow-hidden text-black font-oswald font-bold uppercase tracking-wide px-4 sm:px-5 py-2.5 rounded-lg text-sm active:scale-95 transition-all
                         bg-[linear-gradient(180deg,#fff3a0_0%,#ffd700_45%,#d4a017_100%)]
                         shadow-[0_0_0_1px_rgba(255,215,0,0.5),0_6px_20px_rgba(255,215,0,0.3),inset_0_1px_0_rgba(255,255,255,0.5)]
                         hover:shadow-[0_0_0_1px_rgba(255,215,0,0.8),0_8px_28px_rgba(255,215,0,0.5)]">
              <span className="absolute inset-0 bg-[linear-gradient(115deg,transparent_35%,rgba(255,255,255,0.7)_50%,transparent_65%)] bg-[length:200%_100%] -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
              <span className="relative">Заявка</span>
            </button>
          </div>
        </nav>

        {/* ── HERO ── */}
        <section className="relative overflow-hidden px-4 sm:px-8 pt-14 pb-16 sm:pt-24 sm:pb-24 min-h-[65vh] flex items-center">
          <div ref={bgRef} aria-hidden className="pointer-events-none absolute inset-0 will-change-transform">
            <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full blur-[130px]"
              style={{ background: "radial-gradient(ellipse at 50% 30%,rgba(255,215,0,0.12) 0%,transparent 70%)" }} />
            <div className="absolute bottom-0 left-0 right-0 h-px"
              style={{ background: "linear-gradient(90deg,transparent,rgba(255,215,0,0.2),transparent)" }} />
          </div>

          <div ref={textRef} className="relative will-change-transform max-w-3xl mx-auto w-full z-10">
            <div className="inline-flex items-center gap-2 bg-[#FFD700]/10 border border-[#FFD700]/30 text-[#FFD700] px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium mb-5 backdrop-blur-sm">
              <Icon name="MapPin" size={14} />
              {config.badge}
            </div>

            <h1 className="font-oswald font-bold uppercase leading-[1.0] text-4xl sm:text-6xl lg:text-7xl mb-4 tracking-tight">
              {config.h1line1 && <span className="text-white/90">{config.h1line1}<br /></span>}
              <span className="bg-gradient-to-r from-[#fff3a0] via-[#FFD700] to-[#b8860b] bg-clip-text text-transparent"
                style={{ filter: "drop-shadow(0 0 40px rgba(255,215,0,0.3))" }}>
                {config.h1accent}
              </span>
              {config.h1line2 && <><br /><span className="text-white/90">{config.h1line2}</span></>}
            </h1>

            <p className="text-white/55 text-sm sm:text-xl max-w-2xl leading-relaxed mb-7">{config.heroText}</p>

            <ul className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-5 mb-9 text-left">
              {config.advantages.map((a) => (
                <li key={a.text} className="flex items-center gap-2 text-white/75 text-[13px] sm:text-[14px]">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-[#FFD700]/15 border border-[#FFD700]/20 flex items-center justify-center">
                    <Icon name={a.icon} size={13} className="text-[#FFD700]" />
                  </span>
                  {a.text}
                </li>
              ))}
            </ul>

            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={scrollToForm}
                className="group relative overflow-hidden text-black font-oswald font-bold uppercase tracking-wide px-8 py-4 rounded-xl text-base active:scale-95 transition-all inline-flex items-center justify-center gap-2
                           bg-[linear-gradient(180deg,#fff3a0_0%,#ffd700_45%,#d4a017_100%)]
                           shadow-[0_0_0_1px_rgba(255,215,0,0.6),0_10px_30px_rgba(255,215,0,0.35),inset_0_1px_0_rgba(255,255,255,0.5)]
                           hover:shadow-[0_0_0_1px_rgba(255,215,0,0.9),0_14px_40px_rgba(255,215,0,0.55),inset_0_1px_0_rgba(255,255,255,0.6)]">
                <span className="absolute inset-0 bg-[linear-gradient(115deg,transparent_35%,rgba(255,255,255,0.7)_50%,transparent_65%)] bg-[length:200%_100%] -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
                <Icon name="Zap" size={18} className="relative" />
                <span className="relative">Рассчитать стоимость</span>
                <Icon name="ArrowRight" size={16} className="relative opacity-70 group-hover:translate-x-1 transition-transform" />
              </button>
              <a href={REPAIR_PHONE_TEL}
                onClick={() => ymGoal(Goals.CALL_CLICK, { place: "landing_hero" })}
                className="group bg-black/40 backdrop-blur-sm border border-[#FFD700]/40 hover:border-[#FFD700] text-[#FFD700] px-8 py-4 rounded-xl text-base font-oswald font-bold uppercase tracking-wide active:scale-95 transition-all inline-flex items-center justify-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#FFD700]/15 border border-[#FFD700]/40 flex items-center justify-center group-hover:bg-[#FFD700]/25 transition-colors">
                  <Icon name="Phone" size={14} />
                </div>
                {REPAIR_PHONE_DISPLAY}
              </a>
            </div>
          </div>
        </section>

        <RepairStats />

        {/* ── ПРАЙС ── */}
        {config.services.length > 0 && (
          <section id="prices" className="px-4 sm:px-8 py-14 max-w-3xl mx-auto scroll-mt-20">
            <div className="text-center mb-7">
              <h2 className="font-oswald text-3xl sm:text-4xl font-bold uppercase">
                Цены на <span className="text-[#FFD700]">ремонт</span>
              </h2>
              <p className="text-white/50 text-sm mt-2">Цена за работу — без стоимости детали. Диагностика бесплатно.</p>
            </div>
            <div className="rounded-2xl border border-white/[0.08] overflow-hidden bg-[#111]/80 backdrop-blur-sm">
              <div className="hidden sm:grid grid-cols-[1fr_120px_120px] bg-white/[0.04] px-5 py-3 text-[11px] uppercase tracking-wide text-white/40">
                <div>Услуга</div>
                <div className="text-right">Цена от</div>
                <div className="text-right">Срок</div>
              </div>
              {config.services.map((s) => (
                <div key={s.name}
                  className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_120px_120px] items-center px-5 py-3.5 border-t border-white/[0.06] hover:bg-white/[0.02] transition-colors">
                  <span className="text-sm text-white/90">{s.name}</span>
                  <span className="font-oswald font-bold text-[#FFD700] text-base text-right pl-3">{s.price}</span>
                  <span className="hidden sm:block text-right text-white/40 text-xs">{s.time ?? "при вас"}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 text-center text-white/40 text-xs">
              Точная стоимость — после бесплатной диагностики.{" "}
              <button onClick={scrollToForm} className="text-[#FFD700] hover:underline">Оставить заявку →</button>
            </div>
          </section>
        )}

        <RepairHowItWorks />

        {/* ── FAQ ── */}
        {config.faq && config.faq.length > 0 && (
          <section className="px-4 sm:px-8 py-14 max-w-3xl mx-auto">
            <div className="text-center mb-9">
              <h2 className="font-oswald text-3xl sm:text-4xl font-bold uppercase">
                Частые <span className="text-[#FFD700]">вопросы</span>
              </h2>
            </div>
            <div className="flex flex-col gap-2.5">
              {config.faq.map((f, i) => (
                <div key={f.q} className="bg-[#111]/80 border border-white/[0.07] rounded-xl overflow-hidden backdrop-blur-sm">
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left">
                    <span className="font-roboto font-medium text-[15px] text-white/90">{f.q}</span>
                    <Icon name="ChevronDown" size={18}
                      className={`shrink-0 text-[#FFD700] transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                  </button>
                  {openFaq === i && (
                    <div className="px-5 pb-4 text-white/55 text-sm leading-relaxed">{f.a}</div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── ФОРМА ── */}
        <section id="repair-form" className="px-4 sm:px-8 py-14 max-w-3xl mx-auto scroll-mt-20">
          <div className="text-center mb-7">
            <h2 className="font-oswald text-3xl sm:text-4xl font-bold uppercase">
              {config.ctaTitle ?? "Оставить заявку"}
            </h2>
            <p className="text-white/50 text-sm mt-2">Опишите проблему — мастер свяжется и назовёт точную цену</p>
          </div>
          <RepairWidget />
        </section>

        {/* ── SEO-текст ── */}
        {config.seoText && (
          <section className="px-4 sm:px-8 py-10 max-w-3xl mx-auto border-t border-white/[0.06]">
            <div className="text-white/40 text-sm leading-relaxed font-roboto"
              dangerouslySetInnerHTML={{ __html: config.seoText }} />
          </section>
        )}

        {/* ── Скрытый SEO-блок с H2 и ключевыми словами ── */}
        {config.keywords && (
          <div aria-hidden style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap" }}>
            <h2>{config.serviceName ?? config.title}</h2>
            <p>{config.keywords}</p>
            <p>Сервисный центр Скупка24, Калуга, ул. Кирова 7, ежедневно 9:00–21:00, телефон +7 992 999-03-33</p>
          </div>
        )}

        {/* Подвал */}
        <footer className="border-t border-[#FFD700]/10 bg-[#0a0a0a]/80 px-4 py-10 text-center text-white/40 text-sm">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Icon name="Wrench" size={16} className="text-[#FFD700]" />
            <span className="font-oswald text-white/70 uppercase tracking-wide">Скупка 24 · Сервис ремонта · Калуга</span>
          </div>
          <a href={REPAIR_PHONE_TEL}
            onClick={() => ymGoal(Goals.CALL_CLICK, { place: "landing_footer" })}
            className="text-[#FFD700] font-oswald font-bold text-2xl hover:underline">
            {REPAIR_PHONE_DISPLAY}
          </a>
          <p className="mt-2">Калуга, ул. Кирова, 7 · ежедневно 9:00–21:00</p>
          <div className="flex items-center justify-center gap-4 mt-4">
            <Link to="/repair" className="inline-flex items-center gap-1.5 text-[#FFD700] hover:text-[#ffed4a] text-sm transition-colors">
              <Icon name="ArrowLeft" size={14} />
              Все услуги ремонта
            </Link>
            <span className="text-white/20">·</span>
            <Link to="/" className="text-white/40 hover:text-[#FFD700] text-sm transition-colors">
              Скупка24
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}