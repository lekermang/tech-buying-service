/**
 * SEO-блок страницы /repair — Ремонт телефонов в Калуге.
 * title, meta, OG, canonical + Schema.org LocalBusiness (два адреса, hasOfferCatalog) + FAQPage.
 */
import { useEffect } from "react";
import { FAQS } from "./repairFaqData";

const TITLE = "Ремонт24 Калуга | Скупка24 — ремонт телефонов, BGA-пайка, стекло, FRP";
const DESC =
  "Сервисный центр Скупка24 в Калуге. Ремонт iPhone и Android любой сложности: компонентная BGA-пайка, замена процессоров и контроллеров, переклейка стёкол. Снятие FRP и разблокировка iCloud. Продажа запчастей. Работаем 24/7. Адреса: Кирова 11, Кирова 7/47.";
const KEYWORDS =
  "ремонт телефонов калуга, ремонт сотовых калуга, ремонт android калуга, ремонт samsung калуга, ремонт xiaomi калуга, ремонт huawei калуга, bga пайка калуга, компонентный ремонт плат, замена процессора телефона, снятие frp калуга, разблокировка icloud калуга, замена стекла телефон калуга, переклейка тачскрина, продажа запчастей телефон, ремонт iphone калуга";
const URL = "https://skypka24.com/repair";
const IMAGE = "https://skypka24.com/og-repair.jpg";
const PHONE = "+7-992-999-03-33";

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

    // ── Schema.org LocalBusiness — два адреса, hasOfferCatalog ──────────────
    const biz = document.createElement("script");
    biz.type = "application/ld+json";
    biz.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: "Ремонт телефонов Скупка24",
      description:
        "Профессиональный ремонт телефонов в Калуге: BGA-пайка и компонентный ремонт плат, замена стекла (переклейка), снятие FRP, разблокировка iCloud, продажа запчастей для мобильных телефонов. Бесплатная диагностика, гарантия.",
      image: IMAGE,
      "@id": URL,
      url: URL,
      telephone: PHONE,
      priceRange: "от 490 ₽",
      address: [
        {
          "@type": "PostalAddress",
          streetAddress: "ул. Кирова, 7",
          addressLocality: "Калуга",
          addressRegion: "Калужская область",
          addressCountry: "RU",
        },
        {
          "@type": "PostalAddress",
          streetAddress: "ул. Кирова, 11",
          addressLocality: "Калуга",
          addressRegion: "Калужская область",
          addressCountry: "RU",
        },
      ],
      openingHours: "Mo-Su 00:00-24:00",
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Услуги ремонта телефонов",
        itemListElement: [
          { "@type": "Offer", itemOffered: { "@type": "Service", name: "Ремонт iPhone" } },
          { "@type": "Offer", itemOffered: { "@type": "Service", name: "Ремонт Android-смартфонов" } },
          { "@type": "Offer", itemOffered: { "@type": "Service", name: "BGA-пайка и компонентный ремонт плат" } },
          { "@type": "Offer", itemOffered: { "@type": "Service", name: "Замена стекла (переклейка тачскрина)" } },
          { "@type": "Offer", itemOffered: { "@type": "Service", name: "Снятие FRP (Google-аккаунт)" } },
          { "@type": "Offer", itemOffered: { "@type": "Service", name: "Разблокировка iCloud" } },
          { "@type": "Offer", itemOffered: { "@type": "Service", name: "Продажа запчастей для телефонов" } },
          { "@type": "Offer", itemOffered: { "@type": "Service", name: "Восстановление после воды" } },
        ],
      },
      sameAs: ["https://yandex.ru/profile/230394526478"],
    });
    document.head.appendChild(biz);

    // ── Schema.org FAQPage из ТЗ ────────────────────────────────────────────
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