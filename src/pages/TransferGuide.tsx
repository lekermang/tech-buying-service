/**
 * SEO-лендинг /transfer/guide — пошаговые инструкции по операционным системам
 * (iOS, Android, Samsung, Xiaomi). Schema.org HowTo разметка.
 */
import { useEffect } from "react";
import Icon from "@/components/ui/icon";
import { TopBar } from "./transfer/shared";

const TITLE = "Как перенести данные на новый телефон — пошаговая инструкция";
const DESC =
  "Подробные инструкции: как перенести данные с iPhone на Android и обратно, между Samsung, Xiaomi, Huawei. Контакты, фото, заметки, Wi-Fi за 5 минут без приложений.";
const URL_PAGE = "https://skupka24.com/transfer/guide";

const GUIDES = [
  {
    id: "iphone-to-android",
    icon: "Smartphone",
    title: "С iPhone на Android",
    summary: "Перенос с любой модели iPhone (от 6S до 16 Pro Max) на Samsung, Xiaomi, Pixel, Huawei",
    steps: [
      "На iPhone откройте Safari и зайдите на skupka24.com/transfer",
      "Нажмите «Старый телефон» и отметьте контакты, фото, заметки",
      "Safari запросит доступ к контактам — разрешите",
      "Выберите фото из «Файлы» или «Фотопленка»",
      "Нажмите «Передать данные» — появится QR-код",
      "На Android-телефоне откройте Chrome → skupka24.com/transfer",
      "Нажмите «Новый телефон», отсканируйте QR (или введите код вручную)",
      "Получите ZIP-архив — контакты импортируются автоматически",
    ],
  },
  {
    id: "android-to-iphone",
    icon: "Smartphone",
    title: "С Android на iPhone",
    summary: "Samsung Galaxy, Xiaomi, Redmi, Poco, Huawei, Honor → любой iPhone",
    steps: [
      "На Android-телефоне откройте Chrome → skupka24.com/transfer",
      "«Старый телефон» → выберите данные для переноса",
      "Chrome предложит выбрать контакты — отметьте нужные",
      "Добавьте фото из галереи (или папок DCIM/Camera)",
      "Получите 6-значный код",
      "На iPhone в Safari откройте /transfer → «Новый телефон»",
      "Введите код или отсканируйте QR через Камеру",
      "Скачайте архив. Файл contacts.vcf откройте в Файлах — iOS предложит импорт",
    ],
  },
  {
    id: "samsung",
    icon: "Smartphone",
    title: "С Samsung на Samsung / iPhone",
    summary: "Galaxy S, A, Z Flip, Z Fold, Note — перенос на новую модель",
    steps: [
      "Откройте Samsung Internet или Chrome → skupka24.com/transfer",
      "«Старый телефон» → отметьте контакты, фото, Wi-Fi-сеть",
      "Для Wi-Fi: введите название и пароль, сгенерируется QR-код",
      "Загрузите всё — получите код",
      "На новом телефоне зайдите на тот же адрес, введите код",
      "Скачайте архив. Для Wi-Fi отсканируйте QR через камеру Samsung",
    ],
  },
  {
    id: "xiaomi",
    icon: "Smartphone",
    title: "С Xiaomi / Redmi / Poco",
    summary: "MIUI и HyperOS — перенос на iPhone, Samsung или новый Xiaomi",
    steps: [
      "В браузере Mi Browser или Chrome откройте skupka24.com/transfer",
      "Если просит разрешение на доступ к файлам — разрешите",
      "Отметьте «Контакты», «Фото и видео», «Документы»",
      "Для импорта закладок откройте Mi Browser → меню → Экспорт закладок",
      "Загрузите файл bookmarks.html в категорию «Закладки»",
      "На новом устройстве отсканируйте QR и получите архив",
    ],
  },
  {
    id: "pc-to-phone",
    icon: "Monitor",
    title: "С компьютера на телефон",
    summary: "Большие видео, бэкапы, ZIP-архивы — без ограничения 25 МБ",
    steps: [
      "На ПК (Windows/macOS/Linux) откройте skupka24.com/transfer",
      "Нажмите «С компьютера»",
      "Перетащите файлы любого размера — они идут напрямую в защищённое хранилище",
      "Получите 6-значный код",
      "На телефоне откройте /transfer, введите код",
      "Скачайте файлы — каждый отдельно или одним архивом",
    ],
  },
];

export default function TransferGuide() {
  useEffect(() => {
    const prev = document.title;
    document.title = TITLE;

    const meta = (name: string, content: string, prop = false) => {
      const sel = prop ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let el = document.head.querySelector<HTMLMetaElement>(sel);
      if (!el) {
        el = document.createElement("meta");
        if (prop) el.setAttribute("property", name);
        else el.setAttribute("name", name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
      return el;
    };

    const created: HTMLElement[] = [];
    created.push(meta("description", DESC));
    created.push(meta("keywords", "перенос данных с iphone на android, перенос с samsung на samsung, как перенести данные xiaomi, инструкция перенос данных, перенос фото с компьютера на телефон"));
    created.push(meta("og:title", TITLE, true));
    created.push(meta("og:description", DESC, true));
    created.push(meta("og:url", URL_PAGE, true));

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = URL_PAGE;

    const ld = document.createElement("script");
    ld.type = "application/ld+json";
    ld.text = JSON.stringify({
      "@context": "https://schema.org",
      "@graph": GUIDES.map((g) => ({
        "@type": "HowTo",
        name: g.title,
        description: g.summary,
        step: g.steps.map((s, i) => ({
          "@type": "HowToStep",
          position: i + 1,
          text: s,
        })),
      })),
    });
    document.head.appendChild(ld);

    return () => {
      document.title = prev;
      created.forEach((el) => el.remove());
      ld.remove();
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-[#F0F0F0]">
      <TopBar />
      <div className="max-w-3xl mx-auto px-4 sm:px-5 py-8">
        <a href="/transfer" className="text-sm text-[#FFD700] inline-flex items-center gap-1 mb-4">
          <Icon name="ChevronLeft" size={14} /> К переносу
        </a>

        <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight mb-3">
          Как перенести данные<br />
          <span className="bg-gradient-to-r from-[#FFD700] to-[#fff3a0] bg-clip-text text-transparent">с любого телефона</span>
        </h1>
        <p className="text-sm text-[#999] mb-8 leading-relaxed">
          Подробные инструкции по моделям. Без проводов, без приложений, всё через браузер. Перенос занимает 2–5 минут в зависимости от объёма данных.
        </p>

        <div className="space-y-4">
          {GUIDES.map((g) => (
            <article
              key={g.id}
              id={g.id}
              className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-5 hover:border-[#FFD700]/40 transition"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl bg-[#FFD700]/15 text-[#FFD700] flex items-center justify-center shrink-0">
                  <Icon name={g.icon} size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold leading-tight">{g.title}</h2>
                  <p className="text-xs text-[#777] mt-1">{g.summary}</p>
                </div>
              </div>
              <ol className="space-y-2.5">
                {g.steps.map((s, i) => (
                  <li key={i} className="flex gap-3 text-sm leading-relaxed">
                    <span className="w-6 h-6 rounded-full bg-[#FFD700]/15 text-[#FFD700] flex items-center justify-center shrink-0 text-xs font-bold">
                      {i + 1}
                    </span>
                    <span className="text-[#ddd]">{s}</span>
                  </li>
                ))}
              </ol>
            </article>
          ))}
        </div>

        <div className="mt-10 bg-gradient-to-br from-[#FFD700]/[0.08] to-transparent border border-[#FFD700]/20 rounded-2xl p-6 text-center">
          <h3 className="text-lg font-extrabold mb-2">Начните перенос прямо сейчас</h3>
          <p className="text-sm text-[#999] mb-4">Бесплатно, без регистрации, без приложений</p>
          <a href="/transfer" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-[#FFD700] text-black font-bold text-sm hover:shadow-[0_15px_40px_-10px_rgba(255,215,0,0.6)] transition">
            <Icon name="ArrowRightCircle" size={18} /> К переносу данных
          </a>
        </div>
      </div>
    </div>
  );
}
