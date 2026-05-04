 
import { useRef, useState } from "react";
import Icon from "@/components/ui/icon";
import { YM_ID, YmGeo, HBar, TipCard } from "./analytics.shared";

const SCHEDULER_URL = "https://functions.poehali.dev/b09271ea-c662-4225-973f-4dd4c6a0e32c";

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

// ── Кнопка пинга sitemap ──────────────────────────────────────────
const PingSitemapButton = () => {
  const [status, setStatus] = useState<"idle"|"loading"|"ok"|"error">("idle");
  const [info, setInfo] = useState("");
  const [tokenExpired, setTokenExpired] = useState(false);

  const ping = async () => {
    setStatus("loading");
    setInfo("");
    setTokenExpired(false);
    try {
      const res = await fetch(`${SCHEDULER_URL}?action=ping_sitemap`);
      const data = await res.json();
      if (data.ok) {
        setStatus("ok");
        setInfo(`task_id: ${data.response?.task_id ?? "—"} · quota: ${data.response?.quota_remainder ?? "—"}`);
      } else {
        setStatus("error");
        const errStr = typeof data.error === "string" ? data.error : JSON.stringify(data);
        setInfo(errStr);
        // Распознаём протухший OAuth-токен — показываем понятную инструкцию
        const isExpired = /INVALID_OAUTH_TOKEN|invalid or expired|YANDEX_WEBMASTER_TOKEN not set/i.test(errStr)
          || data.http_status === 401 || data.http_status === 403;
        setTokenExpired(isExpired);
      }
    } catch (e) {
      setStatus("error");
      setInfo(e instanceof Error ? e.message : "Ошибка сети");
    }
  };

  return (
    <div className="bg-[#111] border border-[#222] p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-white text-sm font-bold">Отправить sitemap в Яндекс</p>
          <p className="text-white/30 text-xs mt-0.5">Робот Яндекса сразу пойдёт переиндексировать сайт</p>
        </div>
        <button
          onClick={ping}
          disabled={status === "loading"}
          className="flex items-center gap-2 px-4 py-2 bg-[#FFD700] text-black text-xs font-bold uppercase tracking-wide hover:bg-yellow-400 active:scale-95 transition-all disabled:opacity-50 rounded"
        >
          {status === "loading"
            ? <><Icon name="Loader" size={13} className="animate-spin" /> Отправляем...</>
            : status === "ok"
            ? <><Icon name="Check" size={13} /> Отправлено</>
            : <><Icon name="Send" size={13} /> Ping sitemap</>
          }
        </button>
      </div>
      {info && !tokenExpired && (
        <p className={`text-xs font-mono px-2 py-1.5 rounded ${status === "ok" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
          {status === "ok" ? "✓ " : "✗ "}{info}
        </p>
      )}

      {/* Премиум-предупреждение о протухшем OAuth-токене */}
      {tokenExpired && (
        <div className="mt-1 relative bg-gradient-to-br from-red-500/15 via-orange-500/10 to-amber-500/10 border border-red-500/40 rounded-lg p-4 shadow-[0_0_24px_rgba(239,68,68,0.18)] overflow-hidden">
          <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-400/60 to-transparent" />
          <div className="flex items-start gap-3 mb-3">
            <div className="relative shrink-0 mt-0.5">
              <span className="absolute inset-0 rounded-full bg-red-400/40 blur-md animate-pulse" />
              <Icon name="ShieldAlert" size={20} className="relative text-red-300 drop-shadow-[0_0_4px_rgba(239,68,68,0.7)]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-oswald font-bold text-red-200 text-sm uppercase tracking-wide">Токен Яндекс.Вебмастера протух</p>
              <p className="text-red-100/80 text-xs leading-snug mt-0.5">
                OAuth-токен истёк или отозван. Sitemap не отправляется в Яндекс.
                Уведомление о проблеме уже ушло в Telegram (раз в сутки).
              </p>
            </div>
          </div>

          <div className="space-y-1.5 text-xs text-white/80 font-roboto">
            <p className="font-bold text-amber-200 mb-1 uppercase text-[10px] tracking-wider">Как починить (5 минут):</p>
            <ol className="space-y-1 pl-1 list-none">
              <li className="flex gap-2"><span className="text-amber-300 font-bold shrink-0">1.</span><span>Открой <a href="https://oauth.yandex.ru" target="_blank" rel="noopener noreferrer" className="text-amber-300 underline hover:text-amber-200">oauth.yandex.ru</a> и создай приложение</span></li>
              <li className="flex gap-2"><span className="text-amber-300 font-bold shrink-0">2.</span><span>Дай права (scope): <code className="bg-black/40 px-1.5 py-0.5 rounded text-amber-200">webmaster:hostinfo</code> + <code className="bg-black/40 px-1.5 py-0.5 rounded text-amber-200">webmaster:verify</code></span></li>
              <li className="flex gap-2"><span className="text-amber-300 font-bold shrink-0">3.</span><span>Получи токен: <code className="bg-black/40 px-1.5 py-0.5 rounded text-amber-200 break-all">oauth.yandex.ru/authorize?response_type=token&amp;client_id=...</code></span></li>
              <li className="flex gap-2"><span className="text-amber-300 font-bold shrink-0">4.</span><span>В кабинете проекта → <b className="text-white">Секреты</b> → обнови <code className="bg-black/40 px-1.5 py-0.5 rounded text-amber-200">YANDEX_WEBMASTER_TOKEN</code></span></li>
              <li className="flex gap-2"><span className="text-amber-300 font-bold shrink-0">5.</span><span>Вернись и нажми <b className="text-white">Ping sitemap</b> ещё раз</span></li>
            </ol>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href="https://oauth.yandex.ru/client/new"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 rounded-md text-amber-200 text-[11px] font-bold uppercase tracking-wide transition"
            >
              <Icon name="ExternalLink" size={11} />
              Создать приложение
            </a>
            <a
              href="https://webmaster.yandex.ru/sites/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/15 rounded-md text-white/70 text-[11px] font-bold uppercase tracking-wide transition"
            >
              <Icon name="ExternalLink" size={11} />
              Кабинет Вебмастера
            </a>
          </div>

          {info && (
            <details className="mt-3">
              <summary className="text-white/35 text-[10px] cursor-pointer hover:text-white/50">Технический ответ Яндекса</summary>
              <pre className="mt-1 text-[10px] font-mono bg-black/40 p-2 rounded text-red-300/70 overflow-x-auto">{info}</pre>
            </details>
          )}
        </div>
      )}

      <p className="text-white/20 text-[10px] mt-2">Автоматически — каждый день в 10:00 МСК</p>
    </div>
  );
};

// ── SEO ────────────────────────────────────────────────────────────
export const SeoSection = () => (
  <div className="p-5 space-y-5">
    <h3 className="text-white font-bold text-sm">SEO — продвижение в топ поиска</h3>

    {/* Ping sitemap */}
    <PingSitemapButton />

    <div className="bg-[#111] border border-[#222] p-4">
      <p className="text-white/50 text-xs uppercase tracking-widest font-bold mb-4">Чеклист готовности</p>
      <div className="space-y-2.5">
        {[
          { done: true,  label: "Title и Description заполнены",   detail: "Оптимизированы под ключевые запросы" },
          { done: true,  label: "Schema.org LocalBusiness",        detail: "Структурированные данные настроены" },
          { done: true,  label: "OpenGraph для соцсетей",          detail: "Превью при репосте настроено" },
          { done: true,  label: "robots.txt",                      detail: "Закрыты служебные страницы" },
          { done: true,  label: "sitemap.xml",                     detail: "Карта сайта доступна по /sitemap.xml" },
          { done: true,  label: "Яндекс.Метрика",                 detail: "ID 108421419 установлен" },
          { done: true,  label: "Яндекс.Вебмастер",               detail: "https://skypka24.com подтверждён" },
          { done: true,  label: "Автопинг sitemap",                detail: "Каждый день в 10:00 МСК" },
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
        { label: "Яндекс.Вебмастер",      url: "https://webmaster.yandex.ru",                 desc: "✓ Подключён",             color: "#34d399" },
        { label: "Google Search Console", url: "https://search.google.com/search-console",    desc: "Шаг 1 — добавить сайт",  color: "#60a5fa" },
        { label: "Яндекс.Бизнес",         url: "https://business.yandex.ru",                  desc: "Отображение на картах",  color: "#f97316" },
        { label: "2ГИС для бизнеса",      url: "https://business.2gis.ru",                    desc: "Бесплатный профиль",     color: "#a78bfa" },
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
      title="Следующий шаг — Google Search Console"
      text="Зарегистрируйте сайт в Google Search Console и загрузите sitemap.xml — это выведет сайт в топ Google. Яндекс уже подключён и работает автоматически." />
  </div>
);