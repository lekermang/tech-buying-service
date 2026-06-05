import { useEffect } from "react";

interface PageSEOProps {
  title: string;
  description: string;
  keywords?: string;
  url: string;
  ogType?: "website" | "article";
  ogImage?: string;
  schema?: object | object[];
}

const DEFAULT_IMAGE = "https://skypka24.com/og-main.jpg";

export default function PageSEO({
  title,
  description,
  keywords,
  url,
  ogType = "website",
  ogImage = DEFAULT_IMAGE,
  schema,
}: PageSEOProps) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title;

    const setMeta = (sel: string, attr: "name" | "property", key: string, val: string) => {
      let el = document.head.querySelector<HTMLMetaElement>(sel);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", val);
      return el;
    };

    const created: HTMLElement[] = [];
    const push = (el: HTMLElement | null) => { if (el) created.push(el); };

    push(setMeta('meta[name="description"]', "name", "description", description));
    if (keywords) push(setMeta('meta[name="keywords"]', "name", "keywords", keywords));
    push(setMeta('meta[name="robots"]', "name", "robots", "index, follow"));
    push(setMeta('meta[property="og:title"]', "property", "og:title", title));
    push(setMeta('meta[property="og:description"]', "property", "og:description", description));
    push(setMeta('meta[property="og:url"]', "property", "og:url", url));
    push(setMeta('meta[property="og:type"]', "property", "og:type", ogType));
    push(setMeta('meta[property="og:image"]', "property", "og:image", ogImage));
    push(setMeta('meta[name="twitter:card"]', "name", "twitter:card", "summary_large_image"));
    push(setMeta('meta[name="twitter:title"]', "name", "twitter:title", title));
    push(setMeta('meta[name="twitter:description"]', "name", "twitter:description", description));

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", url);

    const scripts: HTMLScriptElement[] = [];
    const schemas = schema ? (Array.isArray(schema) ? schema : [schema]) : [];
    schemas.forEach(s => {
      const el = document.createElement("script");
      el.type = "application/ld+json";
      el.text = JSON.stringify(s);
      document.head.appendChild(el);
      scripts.push(el);
    });

    return () => {
      document.title = prevTitle;
      created.forEach(el => el.remove());
      scripts.forEach(el => el.remove());
    };
  }, [title, description, keywords, url, ogType, ogImage, schema]);

  return null;
}

export const LOCAL_BUSINESS_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "Скупка24",
  url: "https://skypka24.com",
  telephone: "+79929990333",
  openingHours: "Mo-Su 09:00-21:00",
  priceRange: "₽₽",
  image: "https://skypka24.com/og-main.jpg",
  address: {
    "@type": "PostalAddress",
    streetAddress: "ул. Кирова, 7",
    addressLocality: "Калуга",
    addressRegion: "Калужская область",
    postalCode: "248000",
    addressCountry: "RU",
  },
  geo: { "@type": "GeoCoordinates", latitude: 54.5293, longitude: 36.2754 },
  sameAs: ["https://yandex.ru/maps/-/CHtqKn1w"],
  aggregateRating: { "@type": "AggregateRating", ratingValue: "5.0", reviewCount: "3460" },
};
