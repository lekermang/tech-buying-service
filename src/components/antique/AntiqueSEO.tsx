import { useEffect } from "react";

const BASE_URL = "https://skypka24.com";

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

function injectLD(obj: object): HTMLScriptElement {
  const s = document.createElement("script");
  s.type = "application/ld+json";
  s.text = JSON.stringify(obj);
  document.head.appendChild(s);
  return s;
}

export default function AntiqueSEO() {
  useEffect(() => {
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

    return () => {
      metas.forEach(m => m.remove());
      canonical?.remove();
      s1.remove(); s2.remove(); s3.remove();
    };
  }, []);

  return null;
}
