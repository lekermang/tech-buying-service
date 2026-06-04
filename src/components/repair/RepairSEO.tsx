/**
 * SEO-блок страницы /repair (Ремонт Apple в Калуге).
 * Меняет title, meta, OG, canonical и внедряет Schema.org LocalBusiness + FAQPage.
 */
import { useEffect } from "react";

const TITLE = "Ремонт Apple в Калуге — Сервисный центр (iPhone, iPad, MacBook)";
const DESC =
  "Срочный ремонт Apple в Калуге от 490 ₽. ✅Бесплатная диагностика ✅Гарантия до 1 года ✅Оригинальные запчасти. Починим iPhone, iPad или MacBook за 1 час! Калуга, ул. Кирова, 7.";
const KEYWORDS =
  "ремонт айфона калуга, ремонт iphone калуга, замена экрана айфон калуга, замена стекла айфон калуга, сервисный центр apple калуга, ремонт ipad калуга, ремонт macbook калуга, замена аккумулятора iphone калуга, срочный ремонт айфона калуга";
const URL = "https://skypka24.com/repair";
const IMAGE = "https://skypka24.com/og-repair.jpg";

const PHONE = "+79929990333";
const ADDRESS = "ул. Кирова, 7";

const FAQS = [
  {
    q: "Сколько стоит ремонт iPhone в Калуге?",
    a: "Замена аккумулятора — от 490 ₽, замена экрана — от 890 ₽, замена стекла — от 690 ₽. Диагностика бесплатная. Точную цену назовём после осмотра устройства.",
  },
  {
    q: "Как быстро делают ремонт айфона?",
    a: "Большинство ремонтов — замена экрана, стекла или аккумулятора — выполняем при вас за 20–60 минут. Сложные случаи занимают до 1–2 дней.",
  },
  {
    q: "Даёте ли гарантию на ремонт?",
    a: "Да, мы даём гарантию до 12 месяцев на все выполненные работы и установленные запчасти.",
  },
  {
    q: "Делаете ли бесплатную диагностику?",
    a: "Да. Мы бесплатно осмотрим устройство и назовём причину поломки и точную стоимость до начала ремонта.",
  },
  {
    q: "Где находится сервисный центр в Калуге?",
    a: "Мы находимся в центре Калуги по адресу ул. Кирова, 7, 1 этаж. Работаем ежедневно с 9:00 до 21:00 без выходных.",
  },
  {
    q: "Какие запчасти вы используете?",
    a: "Используем оригинальные и премиальные компоненты высокого качества. На все запчасти распространяется гарантия.",
  },
];

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

    push(setMeta(`meta[name="description"]`, "name", "description", DESC));
    push(setMeta(`meta[name="keywords"]`, "name", "keywords", KEYWORDS));
    push(setMeta(`meta[property="og:title"]`, "property", "og:title", TITLE));
    push(setMeta(`meta[property="og:description"]`, "property", "og:description", DESC));
    push(setMeta(`meta[property="og:url"]`, "property", "og:url", URL));
    push(setMeta(`meta[property="og:type"]`, "property", "og:type", "website"));
    push(setMeta(`meta[property="og:image"]`, "property", "og:image", IMAGE));
    push(setMeta(`meta[name="twitter:card"]`, "name", "twitter:card", "summary_large_image"));
    push(setMeta(`meta[name="twitter:title"]`, "name", "twitter:title", TITLE));
    push(setMeta(`meta[name="twitter:description"]`, "name", "twitter:description", DESC));

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", URL);

    // JSON-LD LocalBusiness
    const biz = document.createElement("script");
    biz.type = "application/ld+json";
    biz.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: "Скупка24 — Ремонт Apple в Калуге",
      image: IMAGE,
      "@id": URL,
      url: URL,
      telephone: PHONE,
      priceRange: "от 490 ₽",
      address: {
        "@type": "PostalAddress",
        streetAddress: ADDRESS,
        addressLocality: "Калуга",
        addressCountry: "RU",
      },
      openingHoursSpecification: {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        opens: "09:00",
        closes: "21:00",
      },
    });
    document.head.appendChild(biz);

    // JSON-LD FAQPage
    const faq = document.createElement("script");
    faq.type = "application/ld+json";
    faq.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQS.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    });
    document.head.appendChild(faq);

    return () => {
      document.title = prevTitle;
      created.forEach((el) => el.remove());
      biz.remove();
      faq.remove();
    };
  }, []);

  return null;
}

export { FAQS };
