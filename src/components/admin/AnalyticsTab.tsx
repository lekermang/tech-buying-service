/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import Icon from "@/components/ui/icon";

const YM_ID = 101026698;

// Ссылки на разделы Яндекс.Метрики
const YM_REPORTS = [
  {
    key: "summary",
    label: "Сводка",
    icon: "LayoutDashboard",
    url: `https://metrika.yandex.ru/dashboard?id=${YM_ID}`,
    desc: "Общая статистика посещений, отказы, глубина просмотра",
  },
  {
    key: "sources",
    label: "Источники трафика",
    icon: "Globe",
    url: `https://metrika.yandex.ru/stat/traffic/summary?id=${YM_ID}`,
    desc: "Откуда пришли посетители: поиск, соцсети, прямые заходы",
  },
  {
    key: "audience",
    label: "Аудитория",
    icon: "Users",
    url: `https://metrika.yandex.ru/stat/demography/age_gender?id=${YM_ID}`,
    desc: "Возраст, пол, география посетителей",
  },
  {
    key: "geo",
    label: "География",
    icon: "MapPin",
    url: `https://metrika.yandex.ru/stat/geography/cities?id=${YM_ID}`,
    desc: "Города и регионы откуда заходят на сайт",
  },
  {
    key: "devices",
    label: "Устройства",
    icon: "Smartphone",
    url: `https://metrika.yandex.ru/stat/tech/browser_engine?id=${YM_ID}`,
    desc: "Телефоны, планшеты, компьютеры — чем пользуются",
  },
  {
    key: "content",
    label: "Страницы",
    icon: "FileText",
    url: `https://metrika.yandex.ru/stat/content/popular?id=${YM_ID}`,
    desc: "Какие страницы смотрят чаще всего",
  },
  {
    key: "clicks",
    label: "Карта кликов",
    icon: "MousePointerClick",
    url: `https://metrika.yandex.ru/heatmaps/clickmap?id=${YM_ID}`,
    desc: "Куда нажимают посетители на главной странице",
  },
  {
    key: "webvisor",
    label: "Вебвизор",
    icon: "Play",
    url: `https://metrika.yandex.ru/webvisor?id=${YM_ID}`,
    desc: "Видеозаписи сессий — как ведут себя посетители",
  },
  {
    key: "search",
    label: "Поисковые фразы",
    icon: "Search",
    url: `https://metrika.yandex.ru/stat/sources/search-phrases?id=${YM_ID}`,
    desc: "По каким запросам находят сайт в Яндексе и Google",
  },
  {
    key: "goals",
    label: "Цели",
    icon: "Target",
    url: `https://metrika.yandex.ru/stat/goals?id=${YM_ID}`,
    desc: "Конверсии: звонки, заявки, переходы на WhatsApp",
  },
];

// Быстрые метрики через ym() из window
const LiveStats = () => {
  const [copied, setCopied] = useState(false);

  const sendGoal = (goalName: string) => {
    if ((window as any).ym) {
      (window as any).ym(YM_ID, "reachGoal", goalName);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-[#111] border border-[#222] p-4 rounded">
      <div className="flex items-center gap-2 mb-3">
        <Icon name="Zap" size={14} className="text-[#FFD700]" />
        <span className="text-xs uppercase tracking-widest text-white/40 font-bold">Быстрые действия</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => sendGoal("admin_test")}
          className="text-xs px-3 py-1.5 border border-[#333] text-white/60 hover:text-white hover:border-[#FFD700]/50 transition-colors rounded">
          {copied ? "✓ Цель отправлена" : "Тест — отправить цель"}
        </button>
        <a
          href={`https://metrika.yandex.ru/dashboard?id=${YM_ID}`}
          target="_blank" rel="noopener noreferrer"
          className="text-xs px-3 py-1.5 border border-[#FFD700]/30 text-[#FFD700] hover:bg-[#FFD700]/10 transition-colors rounded flex items-center gap-1.5">
          <Icon name="ExternalLink" size={11} />
          Открыть Метрику
        </a>
      </div>
    </div>
  );
};

const AnalyticsTab = () => {
  const [activeReport, setActiveReport] = useState<string | null>(null);
  const current = YM_REPORTS.find(r => r.key === activeReport);

  return (
    <div className="flex h-full">
      {/* Левый список отчётов */}
      <div className="w-56 shrink-0 border-r border-[#222] bg-[#0D0D0D] flex flex-col">
        <div className="px-3 py-3 border-b border-[#222]">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: "#FF0000" }}>
              <span className="text-white font-bold text-[9px]">Я</span>
            </div>
            <span className="text-white/50 text-xs font-bold uppercase tracking-wider">Яндекс.Метрика</span>
          </div>
          <p className="text-white/20 text-[10px] mt-1">ID: {YM_ID}</p>
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          {YM_REPORTS.map(r => (
            <button
              key={r.key}
              onClick={() => setActiveReport(r.key === activeReport ? null : r.key)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors
                ${activeReport === r.key
                  ? "bg-[#FFD700]/10 text-[#FFD700]"
                  : "text-white/40 hover:text-white hover:bg-white/5"
                }`}>
              <Icon name={r.icon as any} size={14} className="shrink-0" />
              <span className="text-xs font-medium truncate">{r.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Правая часть */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {activeReport && current ? (
          <>
            {/* Шапка отчёта */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#222] bg-[#111] shrink-0">
              <div className="flex items-center gap-2">
                <Icon name={current.icon as any} size={14} className="text-[#FFD700]" />
                <span className="text-sm font-bold text-white">{current.label}</span>
                <span className="text-xs text-white/30">— {current.desc}</span>
              </div>
              <a
                href={current.url}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-[#FFD700]/70 hover:text-[#FFD700] transition-colors">
                <Icon name="ExternalLink" size={12} />
                Открыть отдельно
              </a>
            </div>
            {/* iframe с отчётом */}
            <div className="flex-1 relative">
              <iframe
                key={activeReport}
                src={current.url}
                className="w-full h-full border-0"
                title={current.label}
                allow="clipboard-read; clipboard-write"
              />
              {/* Оверлей с подсказкой если iframe заблокирован */}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0D0D0D] pointer-events-none opacity-0 hover:opacity-100 transition-opacity"
                style={{ background: "transparent" }}>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Заголовок */}
            <div>
              <h2 className="text-white font-bold text-base">Аналитика и статистика</h2>
              <p className="text-white/30 text-xs mt-0.5">Яндекс.Метрика подключена. Выберите отчёт слева.</p>
            </div>

            <LiveStats />

            {/* Карточки отчётов */}
            <div className="grid grid-cols-2 gap-3">
              {YM_REPORTS.map(r => (
                <button
                  key={r.key}
                  onClick={() => setActiveReport(r.key)}
                  className="bg-[#111] border border-[#222] hover:border-[#FFD700]/30 p-4 text-left transition-all group rounded">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon name={r.icon as any} size={16} className="text-[#FFD700]/60 group-hover:text-[#FFD700] transition-colors" />
                    <span className="text-sm font-semibold text-white">{r.label}</span>
                  </div>
                  <p className="text-xs text-white/30 leading-relaxed">{r.desc}</p>
                </button>
              ))}
            </div>

            {/* Подсказка SEO */}
            <div className="bg-[#111] border border-[#333] p-4 rounded">
              <div className="flex items-start gap-3">
                <Icon name="TrendingUp" size={18} className="text-[#FFD700] shrink-0 mt-0.5" />
                <div>
                  <p className="text-white text-sm font-bold">SEO — продвижение в топ</p>
                  <p className="text-white/40 text-xs mt-1 leading-relaxed">
                    Сайт уже настроен для поиска: есть Schema.org, OpenGraph, robots.txt, sitemap.xml.
                    Для топ-1 зарегистрируйте сайт в Яндекс.Вебмастер и Google Search Console,
                    добавляйте новые отзывы и обновляйте цены — это поднимает позиции.
                  </p>
                  <div className="flex gap-2 mt-3">
                    <a href="https://webmaster.yandex.ru" target="_blank" rel="noopener noreferrer"
                      className="text-[10px] px-3 py-1.5 border border-[#FFD700]/30 text-[#FFD700] hover:bg-[#FFD700]/10 rounded transition-colors flex items-center gap-1">
                      <Icon name="ExternalLink" size={10} />Яндекс.Вебмастер
                    </a>
                    <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer"
                      className="text-[10px] px-3 py-1.5 border border-white/20 text-white/50 hover:text-white hover:border-white/40 rounded transition-colors flex items-center gap-1">
                      <Icon name="ExternalLink" size={10} />Google Search Console
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsTab;