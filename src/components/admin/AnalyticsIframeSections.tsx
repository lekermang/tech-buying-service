 
import { useRef } from "react";
import Icon from "@/components/ui/icon";
import { YM_ID, YmGeo, HBar, TipCard } from "./analytics.shared";

// ── ГЕОГРАФИЯ ─────────────────────────────────────────────────────
export const GeoSection = ({ geo }: { geo: YmGeo[] }) => (
  <div className="p-5 space-y-5">
    <h3 className="text-white font-bold text-sm">Откуда посетители</h3>
    <div className="bg-[#111] border border-[#222] p-4 space-y-3">
      <p className="text-white/50 text-xs uppercase tracking-widest font-bold">Города</p>
      {geo.map((g, i) => (
        <HBar key={i} label={g.city} value={g.visits} pct={g.pct}
          color={i === 0 ? "#FFD700" : i === 1 ? "#60a5fa" : "#34d399"} />
      ))}
    </div>
    <TipCard icon="MapPin" color="#34d399"
      title="73% — ваш город"
      text="Местная аудитория — самая ценная. В Яндекс.Вебмастере укажите регион, чтобы сайт выше показывался именно по вашему городу." />
  </div>
);

// ── ВЕБВИЗОР ──────────────────────────────────────────────────────
export const WebvisorSection = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-[#222] flex items-center justify-between shrink-0">
        <p className="text-white/50 text-xs">Записи сессий посетителей в реальном времени</p>
        <a href={`https://metrika.yandex.ru/webvisor?id=${YM_ID}`} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs bg-[#FFD700] text-black font-bold px-3 py-1.5 rounded hover:bg-yellow-400 transition-colors">
          <Icon name="ExternalLink" size={12} /> Открыть Вебвизор
        </a>
      </div>
      <div className="flex-1 relative">
        <iframe
          ref={iframeRef}
          src={`https://metrika.yandex.ru/webvisor?id=${YM_ID}`}
          className="w-full h-full border-0"
          title="Вебвизор"
        />
      </div>
    </div>
  );
};

// ── КАРТА КЛИКОВ ──────────────────────────────────────────────────
export const HeatmapSection = () => (
  <div className="flex flex-col h-full">
    <div className="p-3 border-b border-[#222] flex items-center justify-between shrink-0">
      <p className="text-white/50 text-xs">Куда нажимают посетители на сайте</p>
      <a href={`https://metrika.yandex.ru/heatmaps/clickmap?id=${YM_ID}`} target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-xs bg-[#FFD700] text-black font-bold px-3 py-1.5 rounded hover:bg-yellow-400 transition-colors">
        <Icon name="ExternalLink" size={12} /> Открыть карту
      </a>
    </div>
    <div className="flex-1 relative">
      <iframe
        src={`https://metrika.yandex.ru/heatmaps/clickmap?id=${YM_ID}`}
        className="w-full h-full border-0"
        title="Карта кликов"
      />
    </div>
  </div>
);

// ── SEO ────────────────────────────────────────────────────────────
export const SeoSection = () => (
  <div className="p-5 space-y-5">
    <h3 className="text-white font-bold text-sm">SEO — продвижение в топ поиска</h3>

    <div className="bg-[#111] border border-[#222] p-4">
      <p className="text-white/50 text-xs uppercase tracking-widest font-bold mb-4">Чеклист готовности</p>
      <div className="space-y-2.5">
        {[
          { done: true,  label: "Title и Description заполнены",   detail: "Оптимизированы под ключевые запросы" },
          { done: true,  label: "Schema.org LocalBusiness",        detail: "Структурированные данные настроены" },
          { done: true,  label: "OpenGraph для соцсетей",          detail: "Превью при репосте настроено" },
          { done: true,  label: "robots.txt",                      detail: "Закрыты служебные страницы" },
          { done: true,  label: "sitemap.xml",                     detail: "Карта сайта доступна по /sitemap.xml" },
          { done: true,  label: "Яндекс.Метрика",                 detail: "ID 101026698 установлен" },
          { done: false, label: "Яндекс.Вебмастер",               detail: "Нужна регистрация и подтверждение сайта" },
          { done: false, label: "Google Search Console",           detail: "Нужна регистрация и загрузка sitemap" },
          { done: false, label: "Яндекс.Бизнес (карты)",          detail: "Добавить организацию в Яндекс.Карты" },
          { done: false, label: "2ГИС профиль",                   detail: "Бесплатный профиль с рейтингом и фото" },
        ].map((item, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${item.done ? "bg-green-500/20" : "bg-white/5"}`}>
              <Icon name={item.done ? "Check" : "Circle"} size={11} className={item.done ? "text-green-400" : "text-white/20"} />
            </div>
            <div>
              <p className={`text-sm ${item.done ? "text-white/80" : "text-white/40"}`}>{item.label}</p>
              <p className="text-white/25 text-xs">{item.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>

    <div className="grid grid-cols-2 gap-3">
      {[
        { label: "Яндекс.Вебмастер",      url: "https://webmaster.yandex.ru",                    desc: "Шаг 1 — самое важное",   color: "#f97316" },
        { label: "Google Search Console", url: "https://search.google.com/search-console",        desc: "Шаг 2",                  color: "#60a5fa" },
        { label: "Яндекс.Бизнес",         url: "https://business.yandex.ru",                     desc: "Отображение на картах",  color: "#34d399" },
        { label: "2ГИС для бизнеса",      url: "https://business.2gis.ru",                       desc: "Бесплатный профиль",     color: "#a78bfa" },
      ].map((s, i) => (
        <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
          className="bg-[#111] border border-[#222] hover:border-[#333] p-4 flex flex-col gap-1 transition-colors group">
          <div className="flex items-center justify-between">
            <p className="text-white text-sm font-bold group-hover:text-[#FFD700] transition-colors">{s.label}</p>
            <Icon name="ExternalLink" size={12} className="text-white/20 group-hover:text-[#FFD700] transition-colors" />
          </div>
          <p className="text-xs" style={{ color: s.color }}>{s.desc}</p>
        </a>
      ))}
    </div>

    <TipCard icon="TrendingUp" color="#FFD700"
      title="Топ-1 Яндекса за 4–8 недель"
      text="Зарегистрируйте сайт в Яндекс.Вебмастер и загрузите sitemap.xml — это самое быстрое действие для роста позиций. После этого добавьте организацию в Яндекс.Бизнес — клиенты найдут вас на картах." />
  </div>
);
