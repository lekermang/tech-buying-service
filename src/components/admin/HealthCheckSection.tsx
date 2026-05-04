import { useEffect, useState, useCallback } from "react";
import Icon from "@/components/ui/icon";

const SCHEDULER_URL = "https://functions.poehali.dev/b09271ea-c662-4225-973f-4dd4c6a0e32c";

type CheckResult = {
  ok: boolean;
  error?: string;
  severity?: "critical" | "error" | "warning" | "info";
  username?: string;
  user_id?: number;
  masked?: string;
};

type LastEvent = {
  ok: boolean;
  never?: boolean;
  last_at?: string;
  ago_seconds?: number;
  error?: string;
};

type HealthData = {
  overall: "healthy" | "warnings" | "degraded" | "critical";
  now_msk: string;
  summary: { critical: number; error: number; warning: number; ok: number };
  checks: Record<string, CheckResult>;
  last_events: Record<string, LastEvent>;
};

const fmtAgo = (sec?: number) => {
  if (sec == null) return "—";
  if (sec < 60) return `${sec} сек назад`;
  if (sec < 3600) return `${Math.floor(sec / 60)} мин назад`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} ч назад`;
  return `${Math.floor(sec / 86400)} дн назад`;
};

const CHECK_LABELS: Record<string, { label: string; icon: string; description: string }> = {
  database:         { label: "База данных",        icon: "Database",      description: "PostgreSQL — клиенты, заявки, ремонты" },
  telegram_main:    { label: "Telegram-бот заявок",icon: "Send",          description: "Бот, который шлёт заявки с сайта" },
  telegram_catalog: { label: "Telegram-бот каталога",icon: "ShoppingBag", description: "Бот для прайса и новостей" },
  yandex_webmaster: { label: "Яндекс.Вебмастер",   icon: "Search",        description: "OAuth-токен для отправки sitemap" },
  s3_storage:       { label: "Файловое хранилище", icon: "HardDrive",     description: "S3 — фото, документы, логотипы" },
  sms_ru:           { label: "SMS.ru",             icon: "MessageSquare", description: "Отправка СМС клиентам" },
  polza_ai:         { label: "Polza.ai (GPT)",     icon: "Sparkles",      description: "Автогенерация текстов и описаний" },
  instrument_ru:    { label: "Instrument.ru API",  icon: "Wrench",        description: "Каталог инструментов" },
  moba_ru:          { label: "Moba.ru (запчасти)", icon: "Cog",           description: "Парсер каталога запчастей" },
  smartlombard:     { label: "SmartLombard",       icon: "Coins",         description: "Касса, операции, выгрузка б/у" },
  yandex_smtp:      { label: "Яндекс.Почта SMTP",  icon: "Mail",          description: "Email-уведомления о заявках" },
};

const EVENT_LABELS: Record<string, { label: string; icon: string; threshold_h: number; description: string }> = {
  price_sent:    { label: "Прайс в Telegram",     icon: "DollarSign",    threshold_h: 26, description: "Должен уходить каждый день в 10:00 МСК" },
  news_post:     { label: "Автопостинг новостей", icon: "Newspaper",     threshold_h: 4,  description: "Каждый час с 9:00 до 22:00" },
  master_report: { label: "Отчёт мастера",        icon: "ClipboardList", threshold_h: 26, description: "Ежедневно в 20:00 МСК" },
};

const HealthCheckSection = () => {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${SCHEDULER_URL}?action=health_check`);
      const json = await res.json();
      setData(json as HealthData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка сети");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const overall = data?.overall;
  const overallStyle = {
    healthy:  { bg: "from-emerald-500/15 via-emerald-500/8 to-transparent", border: "border-emerald-500/40", text: "text-emerald-300", icon: "ShieldCheck", title: "Всё работает", glow: "shadow-[0_0_24px_rgba(16,185,129,0.20)]" },
    warnings: { bg: "from-amber-500/15 via-amber-500/8 to-transparent",     border: "border-amber-500/40",   text: "text-amber-300",   icon: "ShieldAlert", title: "Есть предупреждения", glow: "shadow-[0_0_24px_rgba(245,158,11,0.20)]" },
    degraded: { bg: "from-orange-500/15 via-orange-500/8 to-transparent",   border: "border-orange-500/40", text: "text-orange-300",  icon: "AlertTriangle", title: "Часть сервисов не работает", glow: "shadow-[0_0_24px_rgba(249,115,22,0.20)]" },
    critical: { bg: "from-red-500/15 via-red-500/8 to-transparent",         border: "border-red-500/40",     text: "text-red-300",     icon: "ShieldX",     title: "Критическая ошибка", glow: "shadow-[0_0_24px_rgba(239,68,68,0.30)]" },
  }[overall ?? "healthy"];

  return (
    <div className="p-5 space-y-4">
      {/* Заголовок + обновить */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white font-bold text-sm flex items-center gap-2">
            <Icon name="Activity" size={14} className="text-[#FFD700]" />
            Здоровье сайта — проверка интеграций
          </h3>
          <p className="text-white/30 text-[11px] mt-0.5">Все API-ключи, боты, автозадачи — на одном экране</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#FFD700]/15 hover:bg-[#FFD700]/25 border border-[#FFD700]/40 text-[#FFD700] text-xs font-bold uppercase tracking-wide rounded transition disabled:opacity-50"
        >
          <Icon name={loading ? "Loader" : "RefreshCw"} size={11} className={loading ? "animate-spin" : ""} />
          {loading ? "Проверяю" : "Проверить"}
        </button>
      </div>

      {/* Общий статус */}
      {data && (
        <div className={`relative bg-gradient-to-br ${overallStyle.bg} border ${overallStyle.border} ${overallStyle.glow} rounded-xl p-4 overflow-hidden`}>
          <span aria-hidden className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-current ${overallStyle.text} to-transparent opacity-60`} />
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <span className={`absolute inset-0 rounded-full blur-md ${overallStyle.text} opacity-30 animate-pulse`} />
              <Icon name={overallStyle.icon} size={28} className={`relative ${overallStyle.text} drop-shadow-[0_0_6px_currentColor]`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-oswald font-bold uppercase text-base tracking-wide ${overallStyle.text}`}>{overallStyle.title}</p>
              <div className="flex items-center gap-3 mt-1 text-[11px] font-roboto text-white/70 flex-wrap">
                <span className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_4px_rgba(16,185,129,0.7)]" /><b className="text-emerald-300">{data.summary.ok}</b> работают</span>
                {data.summary.warning > 0 && <span className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" /><b className="text-amber-300">{data.summary.warning}</b> предупреждений</span>}
                {data.summary.error > 0 && <span className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-400" /><b className="text-red-300">{data.summary.error}</b> ошибок</span>}
                {data.summary.critical > 0 && <span className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /><b className="text-red-400">{data.summary.critical}</b> критичных</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-md px-3 py-2 text-red-300 text-xs">
          ✗ {error}
        </div>
      )}

      {loading && !data && (
        <div className="flex items-center justify-center py-14 gap-2 text-white/40">
          <Icon name="Loader" size={16} className="animate-spin text-[#FFD700]" />
          <span className="text-sm">Проверяю все интеграции...</span>
        </div>
      )}

      {/* Сетка интеграций */}
      {data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {Object.entries(data.checks).map(([key, check]) => {
              const meta = CHECK_LABELS[key] || { label: key, icon: "Circle", description: "" };
              const isOk = check.ok;
              const sev = check.severity ?? "warning";
              const tone = isOk
                ? { border: "border-emerald-500/30", bg: "from-emerald-500/8 to-transparent", icon: "text-emerald-400", dot: "bg-emerald-400", label: "OK", labelBg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" }
                : sev === "critical"
                ? { border: "border-red-500/40", bg: "from-red-500/12 to-transparent", icon: "text-red-400", dot: "bg-red-500 animate-pulse", label: "КРИТИЧНО", labelBg: "bg-red-500/20 text-red-300 border-red-500/40" }
                : sev === "error"
                ? { border: "border-red-500/30", bg: "from-red-500/8 to-transparent", icon: "text-red-400", dot: "bg-red-400", label: "ОШИБКА", labelBg: "bg-red-500/15 text-red-300 border-red-500/30" }
                : sev === "warning"
                ? { border: "border-amber-500/30", bg: "from-amber-500/8 to-transparent", icon: "text-amber-400", dot: "bg-amber-400", label: "ВНИМАНИЕ", labelBg: "bg-amber-500/15 text-amber-300 border-amber-500/30" }
                : { border: "border-white/10", bg: "from-white/5 to-transparent", icon: "text-white/30", dot: "bg-white/30", label: "НЕТ", labelBg: "bg-white/5 text-white/40 border-white/10" };

              return (
                <div key={key} className={`relative bg-gradient-to-br ${tone.bg} border ${tone.border} rounded-lg p-3 transition-all hover:brightness-110`}>
                  <div className="flex items-start gap-2.5">
                    <div className="shrink-0 w-8 h-8 rounded-md bg-black/40 border border-white/10 flex items-center justify-center">
                      <Icon name={meta.icon} size={14} className={tone.icon} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-roboto text-white text-xs font-bold">{meta.label}</span>
                        <span className={`relative w-1.5 h-1.5 rounded-full ${tone.dot} shrink-0`} />
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm border ${tone.labelBg}`}>{tone.label}</span>
                      </div>
                      <p className="text-white/40 text-[10px] mt-0.5 leading-snug">{meta.description}</p>
                      {/* Детали */}
                      {isOk && check.username && (
                        <p className="text-emerald-300/80 text-[10px] mt-1 font-mono">@{check.username}</p>
                      )}
                      {isOk && check.user_id && (
                        <p className="text-emerald-300/80 text-[10px] mt-1 font-mono">user_id: {check.user_id}</p>
                      )}
                      {isOk && check.masked && (
                        <p className="text-emerald-300/60 text-[10px] mt-1 font-mono">{check.masked}</p>
                      )}
                      {!isOk && check.error && (
                        <p className="text-red-300/80 text-[10px] mt-1 font-mono break-all">{check.error}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Автозадачи: когда последний раз срабатывало */}
          <div className="pt-2">
            <h4 className="text-white/60 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Icon name="Clock" size={11} className="text-[#FFD700]" />
              Автоматические задачи
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {Object.entries(data.last_events).map(([key, evt]) => {
                const meta = EVENT_LABELS[key] || { label: key, icon: "Circle", threshold_h: 24, description: "" };
                const isStale = evt.ok && evt.ago_seconds != null && evt.ago_seconds > meta.threshold_h * 3600;
                const isMissing = !evt.ok || evt.never;
                const tone = isMissing
                  ? { border: "border-red-500/30", bg: "from-red-500/10 to-transparent", text: "text-red-300", iconCol: "text-red-400" }
                  : isStale
                  ? { border: "border-amber-500/30", bg: "from-amber-500/10 to-transparent", text: "text-amber-300", iconCol: "text-amber-400" }
                  : { border: "border-emerald-500/25", bg: "from-emerald-500/8 to-transparent", text: "text-emerald-300", iconCol: "text-emerald-400" };
                return (
                  <div key={key} className={`relative bg-gradient-to-br ${tone.bg} border ${tone.border} rounded-lg p-3`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Icon name={meta.icon} size={12} className={tone.iconCol} />
                      <span className="font-roboto text-white text-xs font-bold flex-1">{meta.label}</span>
                    </div>
                    <p className="text-white/35 text-[10px] leading-snug mb-1.5">{meta.description}</p>
                    <p className={`font-oswald font-bold text-sm ${tone.text}`}>
                      {evt.never ? "Никогда" : evt.ok ? fmtAgo(evt.ago_seconds) : evt.error || "—"}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <p className="text-white/25 text-[10px] text-center">
            Обновлено: {new Date(data.now_msk).toLocaleString("ru-RU", { timeZone: "Europe/Moscow" })} (МСК)
          </p>
        </>
      )}
    </div>
  );
};

export default HealthCheckSection;
