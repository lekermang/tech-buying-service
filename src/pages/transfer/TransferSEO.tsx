/**
 * SEO-блок страницы /transfer.
 * - Меняет document.title, meta description/keywords, OG, canonical.
 * - Внедряет Schema.org HowTo + FAQPage JSON-LD.
 * Возвращает null (никакого видимого DOM).
 */
import { useEffect } from "react";

const TITLE = "Перенос данных между телефонами онлайн — Скупка24";
const DESC =
  "Бесплатный перенос контактов, фото, видео, документов, Wi-Fi и заметок со старого телефона на новый. iPhone → Android, Android → iPhone, с ПК. Без приложений, в браузере.";
const KEYWORDS =
  "перенос данных с телефона на телефон, перенос с iphone на android, перенос с android на iphone, перенос фото между телефонами, перенос контактов, как перенести данные на новый телефон, копирование данных со старого телефона";
const URL = "https://skupka24.com/transfer";
const IMAGE = "https://skupka24.com/og-transfer.jpg";

const FAQS = [
  {
    q: "Как перенести данные с iPhone на Android?",
    a: "Откройте этот сайт на старом iPhone, выберите «Старый телефон» и нужные категории: контакты, фото, заметки, Wi-Fi. На новом Android-телефоне зайдите на /transfer, отсканируйте QR или введите код. Перенос идёт через защищённое хранилище.",
  },
  {
    q: "Как перенести фото с Android на iPhone?",
    a: "На старом Android-телефоне выберите «Старый телефон → Фото и видео», загрузите снимки. На iPhone откройте /transfer и введите код. Получите ZIP с фото или каждое отдельно.",
  },
  {
    q: "Как перенести контакты на новый телефон?",
    a: "Браузер запросит доступ к контактам (Chrome Android, Safari iOS 14.5+). Все номера сохранятся в .vcf, новый телефон сам предложит «Импортировать в адресную книгу».",
  },
  {
    q: "Можно ли передавать большие видео (несколько гигабайт)?",
    a: "Да. Выберите режим «С компьютера» — файлы любого размера загружаются напрямую в защищённое хранилище, минуя сервер.",
  },
  {
    q: "Безопасно ли это?",
    a: "Соединение по HTTPS, файлы хранятся не более 30 минут и удаляются автоматически. Доступ только по 6-значному коду.",
  },
  {
    q: "Нужно ли устанавливать приложение?",
    a: "Нет. Полностью работает в браузере (Safari/Chrome). Никаких приложений ставить не нужно.",
  },
];

const HOWTO_STEPS = [
  { name: "Откройте сайт на старом телефоне", text: "Перейдите на skupka24.com/transfer и нажмите «Старый телефон»." },
  { name: "Выберите данные", text: "Отметьте контакты, фото, видео, документы, Wi-Fi, заметки или другое." },
  { name: "Загрузите данные", text: "Дождитесь окончания загрузки в защищённое хранилище." },
  { name: "Откройте новый телефон", text: "На новом устройстве отсканируйте QR-код или введите 6-значный код." },
  { name: "Получите файлы", text: "Скачайте ZIP-архив. Контакты импортируются автоматически." },
];

export default function TransferSEO() {
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
    const push = (el: HTMLElement | null) => {
      if (el) created.push(el);
    };

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

    // canonical
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", URL);

    // JSON-LD HowTo
    const howto = document.createElement("script");
    howto.type = "application/ld+json";
    howto.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: "Как перенести данные со старого телефона на новый",
      description: DESC,
      totalTime: "PT2M",
      supply: [{ "@type": "HowToSupply", name: "Старый телефон" }, { "@type": "HowToSupply", name: "Новый телефон" }],
      step: HOWTO_STEPS.map((s, i) => ({
        "@type": "HowToStep",
        position: i + 1,
        name: s.name,
        text: s.text,
        url: `${URL}#step-${i + 1}`,
      })),
    });
    document.head.appendChild(howto);

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
      howto.remove();
      faq.remove();
      // canonical оставляем для других страниц — она перепишется при следующей навигации
    };
  }, []);

  return null;
}
