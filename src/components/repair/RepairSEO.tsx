/**
 * SEO-блок страницы /repair — Ремонт телефонов в Калуге.
 * title, meta, OG, canonical + Schema.org (LocalBusiness, RepairBusiness,
 * FAQPage, BreadcrumbList, AggregateRating, reviews).
 */
import { useEffect } from "react";
import { FAQS } from "./repairFaqData";

const TITLE = "Ремонт телефонов в Калуге — сервис 24/7, от 490 ₽ | Скупка24";
const DESC =
  "Ремонт iPhone и Android в Калуге: замена экрана, аккумулятора, стекла, BGA-пайка плат, снятие FRP, разблокировка iCloud. Бесплатная диагностика. Гарантия 12 мес. Кирова 11 — работаем 24/7. ☎ +7 (992) 999-03-33";
const KEYWORDS =
  "ремонт телефонов калуга, ремонт iphone калуга, ремонт samsung калуга, ремонт xiaomi калуга, ремонт android калуга, замена экрана телефона калуга, замена аккумулятора телефон калуга, замена стекла телефон калуга, bga пайка калуга, снятие frp калуга, разблокировка icloud калуга, ремонт после воды калуга, сервисный центр калуга, ремонт смартфонов калуга 24/7";
const URL = "https://skypka24.com/repair";
const IMAGE = "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/bucket/9c9b4fca-bfd7-4841-a827-eb0354dad8da.JPG";
const PHONE = "+7-992-999-03-33";

const SCHEMA_BIZ = {
  "@context": "https://schema.org",
  "@type": ["LocalBusiness", "ElectronicsRepair"],
  "@id": "https://skypka24.com/repair#repair-service",
  name: "Ремонт24 — Сервисный центр Скупка24",
  alternateName: ["Ремонт телефонов Калуга", "Сервис Скупка24"],
  description:
    "Профессиональный ремонт телефонов в Калуге: BGA-пайка и компонентный ремонт плат, замена экрана/стекла/аккумулятора, снятие FRP, разблокировка iCloud, продажа запчастей. Бесплатная диагностика, гарантия 12 месяцев. Работаем 24/7.",
  image: IMAGE,
  url: URL,
  telephone: PHONE,
  priceRange: "от 490 ₽",
  currenciesAccepted: "RUB",
  paymentAccepted: "Cash, Credit Card, Bank Transfer",
  openingHours: "Mo-Su 00:00-24:00",
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
      opens: "00:00",
      closes: "23:59",
    },
  ],
  address: {
    "@type": "PostalAddress",
    streetAddress: "ул. Кирова, 11",
    addressLocality: "Калуга",
    addressRegion: "Калужская область",
    postalCode: "248000",
    addressCountry: "RU",
  },
  location: [
    {
      "@type": "Place",
      name: "Скупка24 Ремонт — Кирова 11",
      address: {
        "@type": "PostalAddress",
        streetAddress: "ул. Кирова, 11",
        addressLocality: "Калуга",
        postalCode: "248000",
        addressCountry: "RU",
      },
      geo: { "@type": "GeoCoordinates", latitude: 54.5132, longitude: 36.2599 },
      hasMap: "https://yandex.ru/maps/?text=Калуга+Кирова+11",
    },
    {
      "@type": "Place",
      name: "Скупка24 Ремонт — Кирова 7/47",
      address: {
        "@type": "PostalAddress",
        streetAddress: "ул. Кирова, 7/47",
        addressLocality: "Калуга",
        postalCode: "248000",
        addressCountry: "RU",
      },
      geo: { "@type": "GeoCoordinates", latitude: 54.5125, longitude: 36.2640 },
      hasMap: "https://yandex.ru/maps/?text=Калуга+Кирова+7/47",
    },
  ],
  geo: { "@type": "GeoCoordinates", latitude: 54.5132, longitude: 36.2599 },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "5.0",
    reviewCount: "3460",
    bestRating: "5",
    worstRating: "1",
  },
  review: [
    {
      "@type": "Review",
      author: { "@type": "Person", name: "Анастасия К." },
      datePublished: "2026-05-20",
      reviewRating: { "@type": "Rating", ratingValue: "5", bestRating: "5" },
      reviewBody: "Сдала iPhone 13 на замену стекла. Сделали за 40 минут прямо при мне. Цена оказалась ниже, чем в других сервисах. Стекло — как новое, без пузырей.",
    },
    {
      "@type": "Review",
      author: { "@type": "Person", name: "Дмитрий В." },
      datePublished: "2026-04-15",
      reviewRating: { "@type": "Rating", ratingValue: "5", bestRating: "5" },
      reviewBody: "Samsung Galaxy попал под дождь. Думал всё — но в Скупка24 сделали ультразвуковую промывку платы и восстановили. Уже полгода работает без проблем!",
    },
    {
      "@type": "Review",
      author: { "@type": "Person", name: "Виктор П." },
      datePublished: "2026-03-10",
      reviewRating: { "@type": "Rating", ratingValue: "5", bestRating: "5" },
      reviewBody: "MacBook не включался — контроллер питания на плате. В авторизованном сервисе хотели 25 000 за замену платы целиком. Здесь отремонтировали компонентно за 4 800 ₽. Гарантия 6 месяцев.",
    },
  ],
  contactPoint: {
    "@type": "ContactPoint",
    telephone: PHONE,
    contactType: "customer service",
    areaServed: "RU",
    availableLanguage: "Russian",
    hoursAvailable: {
      "@type": "OpeningHoursSpecification",
      opens: "00:00",
      closes: "23:59",
      dayOfWeek: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
    },
  },
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Услуги ремонта телефонов в Калуге",
    itemListElement: [
      {
        "@type": "Offer",
        name: "Замена экрана iPhone в Калуге",
        description: "Замена дисплея iPhone всех моделей. Оригинальные и высококачественные аналоги.",
        price: "1990",
        priceCurrency: "RUB",
        itemOffered: { "@type": "Service", name: "Замена экрана iPhone" },
        areaServed: { "@type": "City", name: "Калуга" },
      },
      {
        "@type": "Offer",
        name: "Замена аккумулятора телефона",
        description: "Замена батареи для iPhone и Android. Гарантия 12 месяцев.",
        price: "990",
        priceCurrency: "RUB",
        itemOffered: { "@type": "Service", name: "Замена аккумулятора" },
        areaServed: { "@type": "City", name: "Калуга" },
      },
      {
        "@type": "Offer",
        name: "Замена стекла телефона (переклейка)",
        description: "Замена только стекла без замены матрицы — дешевле полного модуля.",
        price: "590",
        priceCurrency: "RUB",
        itemOffered: { "@type": "Service", name: "Замена стекла (переклейка тачскрина)" },
        areaServed: { "@type": "City", name: "Калуга" },
      },
      {
        "@type": "Offer",
        name: "BGA-пайка и компонентный ремонт плат",
        description: "Замена процессоров, PMIC, NAND Flash, реболлинг. Ремонт уровня платы.",
        price: "1990",
        priceCurrency: "RUB",
        itemOffered: { "@type": "Service", name: "BGA-пайка" },
        areaServed: { "@type": "City", name: "Калуга" },
      },
      {
        "@type": "Offer",
        name: "Снятие FRP (Google-аккаунт)",
        description: "Удаление привязки к Google-аккаунту на Android после сброса.",
        price: "490",
        priceCurrency: "RUB",
        itemOffered: { "@type": "Service", name: "Снятие FRP" },
        areaServed: { "@type": "City", name: "Калуга" },
      },
      {
        "@type": "Offer",
        name: "Разблокировка iCloud (Activation Lock)",
        description: "Официальное снятие блокировки активации iCloud на iPhone и iPad.",
        itemOffered: { "@type": "Service", name: "Разблокировка iCloud" },
        areaServed: { "@type": "City", name: "Калуга" },
      },
      {
        "@type": "Offer",
        name: "Ремонт после воды",
        description: "Разборка, ультразвуковая ванна, промывка платы, восстановление контактов.",
        price: "990",
        priceCurrency: "RUB",
        itemOffered: { "@type": "Service", name: "Восстановление после воды" },
        areaServed: { "@type": "City", name: "Калуга" },
      },
    ],
  },
  sameAs: [
    "https://yandex.ru/profile/230394526478",
    "https://yandex.ru/maps/org/remont24/230394526478",
    "https://t.me/skypka24",
  ],
  foundingDate: "2015",
};

const SCHEMA_BREADCRUMB = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Главная",             item: "https://skypka24.com/" },
    { "@type": "ListItem", position: 2, name: "Ремонт телефонов",    item: "https://skypka24.com/repair" },
  ],
};

const SCHEMA_SERVICE = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Ремонт смартфонов и телефонов в Калуге",
  description: "Полный цикл ремонта: диагностика, замена экрана/аккумулятора/стекла, BGA-пайка, FRP, iCloud, ремонт после воды. Центр Калуги, работаем 24/7.",
  provider: {
    "@type": "LocalBusiness",
    name: "Скупка24",
    url: "https://skypka24.com",
    telephone: PHONE,
    address: {
      "@type": "PostalAddress",
      streetAddress: "ул. Кирова, 11",
      addressLocality: "Калуга",
      addressCountry: "RU",
    },
  },
  areaServed: [
    { "@type": "City",  name: "Калуга" },
    { "@type": "State", name: "Калужская область" },
  ],
  serviceType: "Ремонт телефонов и смартфонов",
  offers: {
    "@type": "AggregateOffer",
    lowPrice: "490",
    highPrice: "9900",
    priceCurrency: "RUB",
    offerCount: "7",
  },
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Виды ремонта",
    itemListElement: [
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Ремонт iPhone Калуга" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Ремонт Samsung Калуга" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Ремонт Xiaomi Калуга" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Замена экрана телефона Калуга" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Замена аккумулятора Калуга" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "BGA-пайка Калуга" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Снятие FRP Калуга" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Разблокировка iCloud Калуга" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Ремонт после воды Калуга" } },
    ],
  },
};

export default function RepairSEO() {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = TITLE;

    const setMeta = (selector: string, attr: "name" | "property", key: string, content: string) => {
      let el = document.head.querySelector<HTMLMetaElement>(selector);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
      return el;
    };

    const created: HTMLElement[] = [];
    const push = (el: HTMLElement | null) => { if (el) created.push(el); };

    push(setMeta(`meta[name="description"]`,         "name",     "description",        DESC));
    push(setMeta(`meta[name="keywords"]`,            "name",     "keywords",           KEYWORDS));
    push(setMeta(`meta[name="robots"]`,              "name",     "robots",             "index, follow, max-snippet:-1, max-image-preview:large"));
    push(setMeta(`meta[property="og:title"]`,        "property", "og:title",           TITLE));
    push(setMeta(`meta[property="og:description"]`,  "property", "og:description",     DESC));
    push(setMeta(`meta[property="og:url"]`,          "property", "og:url",             URL));
    push(setMeta(`meta[property="og:type"]`,         "property", "og:type",            "website"));
    push(setMeta(`meta[property="og:image"]`,        "property", "og:image",           IMAGE));
    push(setMeta(`meta[property="og:image:width"]`,  "property", "og:image:width",     "1200"));
    push(setMeta(`meta[property="og:image:height"]`, "property", "og:image:height",    "630"));
    push(setMeta(`meta[property="og:locale"]`,       "property", "og:locale",          "ru_RU"));
    push(setMeta(`meta[name="twitter:card"]`,        "name",     "twitter:card",       "summary_large_image"));
    push(setMeta(`meta[name="twitter:title"]`,       "name",     "twitter:title",      TITLE));
    push(setMeta(`meta[name="twitter:description"]`, "name",     "twitter:description",DESC));
    push(setMeta(`meta[name="twitter:image"]`,       "name",     "twitter:image",      IMAGE));

    // Canonical
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", URL);

    // Schema.org — LocalBusiness + ElectronicsRepair
    const addSchema = (data: object) => {
      const s = document.createElement("script");
      s.type = "application/ld+json";
      s.text = JSON.stringify(data, null, 0);
      document.head.appendChild(s);
      return s;
    };

    const sBiz        = addSchema(SCHEMA_BIZ);
    const sBread      = addSchema(SCHEMA_BREADCRUMB);
    const sService    = addSchema(SCHEMA_SERVICE);
    const sFaq        = addSchema({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQS.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    });

    return () => {
      document.title = prevTitle;
      created.forEach((el) => el.remove());
      sBiz.remove();
      sBread.remove();
      sService.remove();
      sFaq.remove();
    };
  }, []);

  return null;
}
