/**
 * SEO-страница: Скупка антиквариата в Калуге
 * Schema.org: LocalBusiness + ItemList + FAQPage
 */
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import DigitalParticles from "@/components/fx/DigitalParticles";
import { ymGoal, Goals } from "@/lib/ym";

const PHONE_TEL = "tel:+79929990333";
const PHONE_DISPLAY = "8 992 999-03-33";
const BASE_URL = "https://skypka24.com";

/* ── Schema.org LD+JSON ─────────────────────────────────────────────────── */
const LD_JSON_BUSINESS = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": `${BASE_URL}/skupka-antikvariata`,
  name: "Скупка24 — Антиквариат",
  description: "Скупка антиквариата в Калуге: монеты, иконы, фарфор, бронза, советские ордена. Бесплатная оценка, выплата в день обращения.",
  url: `${BASE_URL}/skupka-antikvariata`,
  telephone: "+79929990333",
  priceRange: "от 500 ₽",
  openingHours: "Mo-Su 09:00-21:00",
  address: {
    "@type": "PostalAddress",
    streetAddress: "ул. Кирова, 7",
    addressLocality: "Калуга",
    addressRegion: "Калужская область",
    postalCode: "248000",
    addressCountry: "RU",
  },
  geo: { "@type": "GeoCoordinates", latitude: 54.5135, longitude: 36.2615 },
  image: "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/0d17247e-bac8-456f-9aa9-00bfe13e451d.jpg",
  sameAs: ["https://t.me/skypka24"],
};

const LD_JSON_FAQ = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Где продать антиквариат в Калуге?",
      acceptedAnswer: { "@type": "Answer", text: "Скупка24 на ул. Кирова, 7 — принимаем монеты, иконы, фарфор, бронзу, советские ордена. Бесплатная оценка, выплата в день обращения. Ежедневно 9:00–21:00." },
    },
    {
      "@type": "Question",
      name: "Как оценивается антиквариат?",
      acceptedAnswer: { "@type": "Answer", text: "Оцениваем по международным аукционным каталогам: Coins.ru, Heritage, Stack's Bowers. Показываем справочные цены до начала переговоров — открыто и честно." },
    },
    {
      "@type": "Question",
      name: "Принимаете ли монеты без документов?",
      acceptedAnswer: { "@type": "Answer", text: "Да. Оцениваем монеты по состоянию и редкости вне зависимости от наличия документов. Сохранность и патина учитываются при оценке." },
    },
    {
      "@type": "Question",
      name: "Сколько стоит икона с окладом?",
      acceptedAnswer: { "@type": "Answer", text: "Иконы в окладах серебро/золото от 30 000 ₽ до 5 000 000 ₽ в зависимости от школы, века и состояния. Иконы Московской школы XVII в. — от 150 000 ₽." },
    },
    {
      "@type": "Question",
      name: "Выезжаете ли на оценку на дом?",
      acceptedAnswer: { "@type": "Answer", text: "Да, при крупных коллекциях или когда предметы сложно транспортировать — выезжаем на дом. Свяжитесь по телефону или Telegram для записи." },
    },
    {
      "@type": "Question",
      name: "Берёте ли предметы на реализацию?",
      acceptedAnswer: { "@type": "Answer", text: "Да, принимаем антиквариат на консигнацию (реализацию) — вы получаете деньги после продажи по согласованной цене. Альтернатива прямому выкупу." },
    },
  ],
};

const LD_JSON_ITEMS = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Что покупает Скупка24 — антиквариат",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Царские и советские монеты", url: `${BASE_URL}/russian-coins` },
    { "@type": "ListItem", position: 2, name: "Православные иконы", url: `${BASE_URL}/icons` },
    { "@type": "ListItem", position: 3, name: "Фарфор и хрусталь", url: `${BASE_URL}/porcelain` },
    { "@type": "ListItem", position: 4, name: "Советский антиквариат и ордена", url: `${BASE_URL}/soviet-antiques` },
    { "@type": "ListItem", position: 5, name: "Древние монеты", url: `${BASE_URL}/ancient-coins` },
    { "@type": "ListItem", position: 6, name: "Бронзовые статуэтки", url: `${BASE_URL}/bronze-sculptures` },
  ],
};

/* ── Изображения из существующих ассетов ─────────────────────────────────── */
const COINS_IMG    = "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/0d17247e-bac8-456f-9aa9-00bfe13e451d.jpg";
const BRONZE_IMG   = "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/13c9f8e4-9437-436b-9adc-52f0be22cfae.jpg";
const RU_COINS_IMG = "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/cb78bd34-b88a-42fd-9a35-072ba558015a.jpg";
const ICONS_IMG    = "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/0da20686-81b0-482f-b091-6913209c1edb.jpg";
const PORCELAIN_IMG= "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/3b284dfd-609c-4d3f-8e73-49501a0ae6c3.jpg";
const SOVIET_IMG   = "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/2d93ca66-c5fe-42a7-8b1c-221370af02ff.jpg";

const CATEGORIES = [
  {
    href: "/russian-coins",
    img: RU_COINS_IMG,
    accent: "#FFD700",
    tag: "Нумизматика",
    title: "Царские монеты",
    keywords: "монеты николая ii · рубли · ефимки · злотник",
    desc: "Покупаем монеты от Владимира Великого до Николая II. Платиновые монеты — особый приоритет.",
    price: "до 5 000 000 ₽",
  },
  {
    href: "/icons",
    img: ICONS_IMG,
    accent: "#e2a84b",
    tag: "Иконопись",
    title: "Православные иконы",
    keywords: "иконы · оклады серебро · финифть · новгород",
    desc: "Покупаем иконы Новгородской, Московской, Строгановской школ. Оклады серебро, золото, эмаль.",
    price: "до 5 000 000 ₽",
  },
  {
    href: "/porcelain",
    img: PORCELAIN_IMG,
    accent: "#60a5fa",
    tag: "Фарфор",
    title: "Фарфор и хрусталь",
    keywords: "ифз · гарднер · кузнецов · агитфарфор",
    desc: "Покупаем ИФЗ, Гарднер, Кузнецов. Отдельные предметы и полные сервизы.",
    price: "до 3 000 000 ₽",
  },
  {
    href: "/soviet-antiques",
    img: SOVIET_IMG,
    accent: "#ef4444",
    tag: "СССР",
    title: "Советский антиквариат",
    keywords: "ордена · медали · плакаты · авангард",
    desc: "Покупаем ордена и медали, плакаты 1920-х, агитфарфор, мебель конструктивизма.",
    price: "до 1 000 000 ₽",
  },
  {
    href: "/ancient-coins",
    img: COINS_IMG,
    accent: "#a3e635",
    tag: "Античность",
    title: "Древние монеты",
    keywords: "ауреус · тетрадрахма · драхма · рим · греция",
    desc: "Покупаем ауреусы, драхмы, сребреники. Оценка по международным каталогам.",
    price: "до 5 000 000 ₽",
  },
  {
    href: "/bronze-sculptures",
    img: BRONZE_IMG,
    accent: "#a78bfa",
    tag: "Скульптура",
    title: "Бронзовые статуэтки",
    keywords: "роден · античная бронза · буддизм · xix–xx вв",
    desc: "Покупаем античную бронзу, буддийские статуи, работы Родена и Бари.",
    price: "до 10 000 000 ₽",
  },
];

const FAQ = LD_JSON_FAQ.mainEntity.map(e => ({ q: e.name, a: e.acceptedAnswer.text }));

const TRUST = [
  { icon: "Award", v: "10+ лет", t: "скупаем антиквариат" },
  { icon: "Banknote", v: "День в день", t: "выплата деньгами" },
  { icon: "FileCheck", v: "Договор", t: "официальный документ" },
  { icon: "Search", v: "Аукционные", t: "справочные цены" },
];

/* ── Утилиты ─────────────────────────────────────────────────────────────── */
function useParallax(ref: React.RefObject<HTMLDivElement | null>, speed: number) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fn = () => { el.style.transform = `translateY(${window.scrollY * speed}px)`; };
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, [ref, speed]);
}

function injectLD(obj: object): HTMLScriptElement {
  const s = document.createElement("script");
  s.type = "application/ld+json";
  s.text = JSON.stringify(obj);
  document.head.appendChild(s);
  return s;
}

/* ── Компонент ───────────────────────────────────────────────────────────── */
export default function SkupkaAntikvariata() {
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const bgRef = useRef<HTMLDivElement>(null);
  useParallax(bgRef, 0.35);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Скупка антиквариата в Калуге — монеты, иконы, фарфор, бронза | Скупка24";

    const setMeta = (sel: string, attr: "name" | "property", key: string, val: string) => {
      let el = document.head.querySelector<HTMLMetaElement>(sel);
      if (!el) { el = document.createElement("meta"); el.setAttribute(attr, key); document.head.appendChild(el); }
      el.setAttribute("content", val);
      return el;
    };
    const desc = "Скупка антиквариата в Калуге: царские монеты, православные иконы, советские ордена, фарфор ИФЗ и Гарднер, бронзовые статуэтки. Бесплатная оценка по аукционным каталогам. Выплата в день обращения. Скупка24, ул. Кирова, 7.";
    const metas: HTMLMetaElement[] = [];
    metas.push(setMeta('meta[name="description"]', "name", "description", desc));
    metas.push(setMeta('meta[property="og:title"]', "property", "og:title", "Скупка антиквариата в Калуге | Скупка24"));
    metas.push(setMeta('meta[property="og:description"]', "property", "og:description", desc));
    metas.push(setMeta('meta[property="og:url"]', "property", "og:url", `${BASE_URL}/skupka-antikvariata`));
    metas.push(setMeta('meta[property="og:type"]', "property", "og:type", "website"));

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) { canonical = document.createElement("link"); canonical.setAttribute("rel", "canonical"); document.head.appendChild(canonical); }
    canonical.href = `${BASE_URL}/skupka-antikvariata`;

    const s1 = injectLD(LD_JSON_BUSINESS);
    const s2 = injectLD(LD_JSON_FAQ);
    const s3 = injectLD(LD_JSON_ITEMS);

    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);

    return () => {
      metas.forEach(m => m.remove());
      canonical?.remove();
      s1.remove(); s2.remove(); s3.remove();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const scrollToForm = () => {
    document.getElementById("antique-contact")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="relative min-h-screen bg-[#0d0d0d] text-white overflow-x-hidden">
      {/* Фон */}
      <div aria-hidden className="fixed inset-0 z-0 pointer-events-none">
        <DigitalParticles />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full blur-[130px]"
          style={{ background: "rgba(255,215,0,0.08)" }} />
        <div className="absolute bottom-0 -right-40 w-[500px] h-[500px] rounded-full blur-[140px]"
          style={{ background: "rgba(167,139,250,0.05)" }} />
        <div className="absolute inset-0 opacity-[0.3]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,215,0,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,215,0,0.025) 1px,transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(ellipse at 50% 0%,black,transparent 70%)",
          }} />
      </div>

      <div className="relative z-10">
        {/* ── Навбар ── */}
        <nav className={`sticky top-0 z-50 flex items-center justify-between px-4 sm:px-8 py-3 border-b transition-colors ${
          scrolled ? "bg-[#0d0d0d]/90 border-[#FFD700]/15 backdrop-blur-md" : "bg-transparent border-transparent"
        }`}>
          <Link to="/" className="group flex items-center gap-2.5">
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#FFD700]/10 border border-[#FFD700]/30 group-hover:bg-[#FFD700]/20 transition-colors">
              <Icon name="ChevronLeft" size={18} className="text-[#FFD700]" />
            </span>
            <span className="font-oswald text-xl font-bold">
              <span className="bg-gradient-to-r from-[#fff3a0] via-[#FFD700] to-[#b8860b] bg-clip-text text-transparent">Скупка 24</span>
              <span className="block text-[9px] text-white/35 font-roboto font-normal uppercase tracking-[0.25em] mt-0.5">Антиквариат · Калуга</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <a href={PHONE_TEL}
              onClick={() => ymGoal(Goals.CALL_CLICK, { place: "antique_nav" })}
              className="hidden sm:inline-flex items-center gap-1.5 text-[#FFD700] font-oswald font-bold text-sm hover:text-[#ffed4a] transition-colors">
              <Icon name="Phone" size={14} />
              {PHONE_DISPLAY}
            </a>
            <button onClick={scrollToForm}
              className="group relative overflow-hidden text-black font-oswald font-bold uppercase tracking-wide px-4 sm:px-5 py-2.5 rounded-lg text-sm active:scale-95 transition-all
                         bg-[linear-gradient(180deg,#fff3a0_0%,#ffd700_45%,#d4a017_100%)]
                         shadow-[0_0_0_1px_rgba(255,215,0,0.5),0_6px_20px_rgba(255,215,0,0.3),inset_0_1px_0_rgba(255,255,255,0.5)]
                         hover:shadow-[0_0_0_1px_rgba(255,215,0,0.8),0_8px_28px_rgba(255,215,0,0.5),inset_0_1px_0_rgba(255,255,255,0.6)]">
              <span className="absolute inset-0 bg-[linear-gradient(115deg,transparent_35%,rgba(255,255,255,0.7)_50%,transparent_65%)] bg-[length:200%_100%] -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
              <span className="relative">Оценить</span>
            </button>
          </div>
        </nav>

        {/* ── HERO ── */}
        <section className="relative overflow-hidden px-4 sm:px-8 pt-12 pb-14 sm:pt-20 sm:pb-20">
          <div ref={bgRef} aria-hidden className="pointer-events-none absolute inset-0 will-change-transform">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[450px] rounded-full blur-[120px]"
              style={{ background: "radial-gradient(ellipse at 50% 0%,rgba(255,215,0,0.11) 0%,transparent 70%)" }} />
          </div>

          <div className="relative max-w-5xl mx-auto">
            {/* Бейдж */}
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#FFD700]/15 to-[#FFD700]/5 border border-[#FFD700]/40 text-[#FFD700] px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FFD700] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FFD700]" />
              </span>
              Оценка за 15 минут · Калуга
            </div>

            <div className="grid lg:grid-cols-[1fr_auto] gap-8 items-start">
              <div>
                <h1 className="font-oswald font-bold uppercase leading-[1.0] text-4xl sm:text-6xl lg:text-7xl mb-4 tracking-tight">
                  <span className="text-white/90">Скупка</span><br />
                  <span className="bg-gradient-to-r from-[#fff3a0] via-[#FFD700] to-[#b8860b] bg-clip-text text-transparent"
                    style={{ filter: "drop-shadow(0 0 40px rgba(255,215,0,0.3))" }}>
                    антиквариата
                  </span><br />
                  <span className="text-white/90">в Калуге</span>
                </h1>

                <p className="text-white/55 text-base sm:text-xl leading-relaxed mb-7 max-w-2xl">
                  Монеты, иконы, фарфор, бронза, советские ордена — покупаем всё.
                  Оценка по международным аукционным каталогам, выплата в&nbsp;день обращения.
                </p>

                {/* USP-чипы */}
                <div className="flex flex-wrap gap-2 mb-8">
                  {["Бесплатная оценка", "Выезд на дом", "Официальный договор", "Деньги сразу", "Аукционные цены", "Работаем с 2014 г."].map(t => (
                    <div key={t} className="flex items-center gap-1.5 bg-black/40 border border-[#FFD700]/20 hover:border-[#FFD700]/50 px-2.5 py-1.5 rounded-md transition-colors">
                      <Icon name="Check" size={11} className="text-[#FFD700]" />
                      <span className="font-roboto text-white/75 text-[11px] sm:text-xs">{t}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button onClick={scrollToForm}
                    className="group relative overflow-hidden text-black font-oswald font-bold uppercase tracking-wide px-8 py-4 rounded-xl text-base active:scale-95 transition-all inline-flex items-center justify-center gap-2
                               bg-[linear-gradient(180deg,#fff3a0_0%,#ffd700_45%,#d4a017_100%)]
                               shadow-[0_0_0_1px_rgba(255,215,0,0.6),0_10px_30px_rgba(255,215,0,0.35),inset_0_1px_0_rgba(255,255,255,0.5)]
                               hover:shadow-[0_0_0_1px_rgba(255,215,0,0.9),0_14px_40px_rgba(255,215,0,0.55),inset_0_1px_0_rgba(255,255,255,0.6)]">
                    <span className="absolute inset-0 bg-[linear-gradient(115deg,transparent_35%,rgba(255,255,255,0.7)_50%,transparent_65%)] bg-[length:200%_100%] -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
                    <Icon name="Zap" size={18} className="relative" />
                    <span className="relative">Оценить бесплатно</span>
                    <Icon name="ArrowRight" size={16} className="relative opacity-70 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <a href={PHONE_TEL}
                    onClick={() => ymGoal(Goals.CALL_CLICK, { place: "antique_hero" })}
                    className="group bg-black/40 backdrop-blur-sm border border-[#FFD700]/40 hover:border-[#FFD700] text-[#FFD700] px-8 py-4 rounded-xl text-base font-oswald font-bold uppercase tracking-wide active:scale-95 transition-all inline-flex items-center justify-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#FFD700]/15 border border-[#FFD700]/40 flex items-center justify-center group-hover:bg-[#FFD700]/25 transition-colors">
                      <Icon name="Phone" size={14} />
                    </div>
                    {PHONE_DISPLAY}
                  </a>
                </div>
              </div>

              {/* Плашки доверия */}
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 shrink-0 lg:w-52">
                {TRUST.map(p => (
                  <div key={p.t} className="bg-[#111]/70 border border-white/[0.07] rounded-xl p-3.5 flex items-center gap-3 backdrop-blur-sm lg:flex-row">
                    <div className="w-9 h-9 rounded-lg bg-[#FFD700]/10 flex items-center justify-center shrink-0">
                      <Icon name={p.icon} size={18} className="text-[#FFD700]" />
                    </div>
                    <div>
                      <div className="font-oswald font-bold text-sm text-white">{p.v}</div>
                      <div className="text-white/40 text-[11px] leading-tight">{p.t}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Категории ── */}
        <section className="px-4 sm:px-8 py-12 max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="font-oswald text-3xl sm:text-4xl font-bold uppercase">
              Что мы <span className="text-[#FFD700]">покупаем</span>
            </h2>
            <p className="text-white/50 text-sm mt-2">Честная оценка по аукционным каталогам — без занижения</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CATEGORIES.map(c => (
              <Link key={c.href} to={c.href}
                className="group relative rounded-2xl overflow-hidden flex flex-col transition-all hover:-translate-y-1 duration-300"
                style={{ border: `1px solid ${c.accent}30` }}>
                {/* Фото */}
                <div className="relative h-44 overflow-hidden">
                  <img src={c.img} alt={c.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-[#0D0D0D]/20 to-transparent" />
                  <span className="absolute top-2.5 left-2.5 font-roboto text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full backdrop-blur-sm"
                    style={{ background: `${c.accent}18`, border: `1px solid ${c.accent}30`, color: c.accent }}>
                    {c.tag}
                  </span>
                  <span className="absolute top-2.5 right-2.5 font-oswald font-bold text-base leading-none"
                    style={{ color: c.accent, filter: "drop-shadow(0 0 8px currentColor)" }}>
                    {c.price}
                  </span>
                </div>
                {/* Контент */}
                <div className="bg-[#0D0D0D] p-4 flex flex-col gap-2 flex-1">
                  <div className="font-oswald font-bold text-lg uppercase text-white">{c.title}</div>
                  <div className="font-roboto text-[10px] uppercase tracking-widest" style={{ color: c.accent }}>{c.keywords}</div>
                  <p className="font-roboto text-white/60 text-[13px] leading-snug flex-1">{c.desc}</p>
                  <div className="flex items-center gap-1 mt-1" style={{ color: c.accent }}>
                    <span className="font-roboto text-xs font-semibold">Подробнее</span>
                    <Icon name="ArrowRight" size={13} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Как проходит скупка ── */}
        <section className="border-y border-[#FFD700]/10 bg-[#111]/70 backdrop-blur-sm px-4 sm:px-8 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="font-oswald text-3xl sm:text-4xl font-bold uppercase">
                Как мы <span className="text-[#FFD700]">работаем</span>
              </h2>
            </div>
            <div className="grid sm:grid-cols-4 gap-6">
              {[
                { n: "1", icon: "Phone", t: "Свяжитесь с нами", d: "Позвоните или напишите — опишите предметы, приложите фото" },
                { n: "2", icon: "Search", t: "Предварительная оценка", d: "Скажем ориентировочную цену по каталогам — онлайн или при встрече" },
                { n: "3", icon: "Landmark", t: "Осмотр предмета", d: "Эксперт осмотрит, проверит подлинность и сохранность" },
                { n: "4", icon: "Banknote", t: "Деньги в день сделки", d: "Оформим договор и выплатим наличными или переводом сразу" },
              ].map(s => (
                <div key={s.n} className="text-center">
                  <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-[#FFD700] flex items-center justify-center shadow-[0_0_30px_rgba(255,215,0,0.4)]">
                    <Icon name={s.icon} size={22} className="text-black" />
                  </div>
                  <div className="text-white/30 text-xs mb-1">Шаг {s.n}</div>
                  <div className="font-oswald text-base font-bold uppercase mb-2">{s.t}</div>
                  <div className="text-white/50 text-[13px] leading-relaxed">{s.d}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="px-4 sm:px-8 py-14 max-w-3xl mx-auto">
          <div className="text-center mb-9">
            <h2 className="font-oswald text-3xl sm:text-4xl font-bold uppercase">
              Частые <span className="text-[#FFD700]">вопросы</span>
            </h2>
          </div>
          <div className="flex flex-col gap-2.5">
            {FAQ.map((f, i) => (
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

        {/* ── CTA + контакты ── */}
        <section id="antique-contact" className="px-4 sm:px-8 py-14 max-w-3xl mx-auto scroll-mt-20">
          <div className="bg-[#111]/80 border border-[#FFD700]/20 rounded-2xl p-6 sm:p-10 backdrop-blur-sm text-center">
            <div className="w-14 h-14 rounded-xl bg-[#FFD700]/10 flex items-center justify-center mx-auto mb-5">
              <Icon name="Landmark" size={26} className="text-[#FFD700]" />
            </div>
            <h2 className="font-oswald text-2xl sm:text-3xl font-bold uppercase mb-2">
              Есть предмет для оценки?
            </h2>
            <p className="text-white/55 text-sm leading-relaxed mb-7 max-w-md mx-auto">
              Позвоните, напишите в Telegram или приходите лично — ул. Кирова, 7.
              Ежедневно 9:00–21:00. Выезд эксперта на дом при крупных коллекциях.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a href={PHONE_TEL}
                onClick={() => ymGoal(Goals.CALL_CLICK, { place: "antique_cta" })}
                className="group relative overflow-hidden text-black font-oswald font-bold uppercase tracking-wide px-8 py-4 rounded-xl text-base active:scale-95 transition-all inline-flex items-center gap-2
                           bg-[linear-gradient(180deg,#fff3a0_0%,#ffd700_45%,#d4a017_100%)]
                           shadow-[0_0_0_1px_rgba(255,215,0,0.6),0_10px_30px_rgba(255,215,0,0.35),inset_0_1px_0_rgba(255,255,255,0.5)]
                           hover:shadow-[0_0_0_1px_rgba(255,215,0,0.9),0_14px_40px_rgba(255,215,0,0.55),inset_0_1px_0_rgba(255,255,255,0.6)]">
                <span className="absolute inset-0 bg-[linear-gradient(115deg,transparent_35%,rgba(255,255,255,0.7)_50%,transparent_65%)] bg-[length:200%_100%] -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
                <Icon name="Phone" size={18} className="relative" />
                <span className="relative">{PHONE_DISPLAY}</span>
              </a>
              <a href="https://t.me/skypka24"
                target="_blank" rel="noopener noreferrer"
                className="group bg-black/40 backdrop-blur-sm border border-[#FFD700]/40 hover:border-[#FFD700] text-[#FFD700] px-8 py-4 rounded-xl text-base font-oswald font-bold uppercase tracking-wide active:scale-95 transition-all inline-flex items-center gap-2">
                <Icon name="Send" size={18} />
                Telegram
              </a>
            </div>
            <p className="mt-5 text-white/30 text-xs font-roboto">
              Калуга, ул. Кирова, 7 · Ежедневно 9:00–21:00
            </p>
          </div>
        </section>

        {/* ── SEO-текст ── */}
        <section className="px-4 sm:px-8 pb-12 max-w-3xl mx-auto border-t border-white/[0.05]">
          <div className="pt-8 text-white/35 text-sm leading-relaxed font-roboto space-y-3">
            <p>
              <strong className="text-white/50">Скупка антиквариата в Калуге</strong> — Скупка24 работает с предметами старины с 2014 года.
              Принимаем <strong className="text-white/50">царские монеты</strong>, монеты Николая II, Александра III, платиновые монеты Российской Империи.
              Покупаем <strong className="text-white/50">православные иконы</strong> всех школ — Новгородской, Московской, Строгановской — с окладами серебро, золото, финифть.
            </p>
            <p>
              Принимаем <strong className="text-white/50">фарфор ИФЗ, Гарднер, Кузнецов</strong>, агитфарфор ГФЗ.
              Покупаем <strong className="text-white/50">советские ордена и медали</strong>, плакаты 1920-х, конструктивизм, мебель советского авангарда.
              Оцениваем <strong className="text-white/50">древние монеты</strong> — ауреусы, тетрадрахмы, греческие драхмы, сребреники Киевской Руси.
              Покупаем <strong className="text-white/50">бронзовые статуэтки</strong> — античную бронзу, буддийские статуи, работы Родена, Бари, Ланте.
            </p>
            <p>
              <strong className="text-white/50">Где продать антиквариат в Калуге?</strong> Приходите к нам на ул. Кирова, 7 или позвоните — приедем сами при крупных коллекциях.
              Оценку проводим по международным аукционным каталогам: Heritage Auctions, Stack's Bowers, Coins.ru, Сотбис.
              <strong className="text-white/50"> Выкуп антиквариата</strong> с официальным договором и выплатой в день обращения.
            </p>
          </div>
        </section>

        {/* Подвал */}
        <footer className="border-t border-[#FFD700]/10 bg-[#0a0a0a]/80 px-4 py-8 text-center text-white/40 text-sm">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Icon name="Landmark" size={16} className="text-[#FFD700]" />
            <span className="font-oswald text-white/60 uppercase tracking-wide">Скупка 24 · Антиквариат · Калуга</span>
          </div>
          <a href={PHONE_TEL}
            onClick={() => ymGoal(Goals.CALL_CLICK, { place: "antique_footer" })}
            className="text-[#FFD700] font-oswald font-bold text-2xl hover:underline">
            {PHONE_DISPLAY}
          </a>
          <p className="mt-2">Калуга, ул. Кирова, 7 · ежедневно 9:00–21:00</p>
          <Link to="/" className="inline-flex items-center gap-1.5 text-[#FFD700] hover:text-[#ffed4a] text-sm transition-colors mt-4">
            <Icon name="ArrowLeft" size={14} />
            На главную Скупка24
          </Link>
        </footer>
      </div>
    </div>
  );
}
