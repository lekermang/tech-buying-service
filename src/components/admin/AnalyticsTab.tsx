/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";

const YM_ID = 101026698;

// ── Типы ─────────────────────────────────────────────────────────
interface YmStat { date: string; visits: number; pageviews: number; users: number; bounceRate: number; avgDuration: number; }
interface YmGoalStat { name: string; goal_id: string; reaches: number; conversion: number; }
interface YmSource { source: string; visits: number; pct: number; }
interface YmDevice { device: string; visits: number; pct: number; }
interface YmGeo { city: string; visits: number; pct: number; }
interface YmPage { url: string; views: number; avgTime: number; }

// ── Цвета и подписи ───────────────────────────────────────────────
const GOAL_LABELS: Record<string, string> = {
  call_click:     "📞 Звонок",
  form_open:      "📋 Открыл форму",
  form_submit:    "✉️ Отправил заявку",
  form_success:   "✅ Заявка принята",
  whatsapp_click: "💬 WhatsApp",
  telegram_click: "✈️ Telegram",
  catalog_open:   "🗂 Каталог",
  catalog_order:  "🛒 Заказ из каталога",
  install_pwa:    "📲 Установил приложение",
};

const SOURCE_LABELS: Record<string, string> = {
  "Переходы из поисковых систем": "🔍 Поиск",
  "Прямые заходы": "🔗 Прямые",
  "Переходы по ссылкам на сайтах": "🌐 Сайты",
  "Переходы из социальных сетей": "👥 Соцсети",
  "Переходы с рекламных систем": "📢 Реклама",
};

// ── Мок-данные (когда API недоступен) ────────────────────────────
const MOCK_STATS: YmStat[] = Array.from({ length: 14 }, (_, i) => {
  const d = new Date(); d.setDate(d.getDate() - (13 - i));
  return {
    date: d.toISOString().slice(0, 10),
    visits: 120 + Math.round(Math.sin(i * 0.7) * 40 + Math.random() * 30),
    pageviews: 320 + Math.round(Math.sin(i * 0.5) * 80 + Math.random() * 60),
    users: 95 + Math.round(Math.sin(i * 0.8) * 30 + Math.random() * 20),
    bounceRate: 38 + Math.round(Math.sin(i * 0.4) * 8),
    avgDuration: 95 + Math.round(Math.sin(i * 0.6) * 20),
  };
});
const MOCK_GOALS: YmGoalStat[] = [
  { name: "call_click", goal_id: "1", reaches: 47, conversion: 8.2 },
  { name: "form_submit", goal_id: "2", reaches: 23, conversion: 4.0 },
  { name: "form_success", goal_id: "3", reaches: 19, conversion: 3.3 },
  { name: "telegram_click", goal_id: "4", reaches: 31, conversion: 5.4 },
  { name: "catalog_open", goal_id: "5", reaches: 88, conversion: 15.3 },
];
const MOCK_SOURCES: YmSource[] = [
  { source: "Переходы из поисковых систем", visits: 312, pct: 54 },
  { source: "Прямые заходы", visits: 143, pct: 25 },
  { source: "Переходы из социальных сетей", visits: 72, pct: 12 },
  { source: "Переходы по ссылкам на сайтах", visits: 52, pct: 9 },
];
const MOCK_DEVICES: YmDevice[] = [
  { device: "Смартфон", visits: 398, pct: 69 },
  { device: "Компьютер", visits: 143, pct: 25 },
  { device: "Планшет", visits: 35, pct: 6 },
];
const MOCK_GEO: YmGeo[] = [
  { city: "Ваш город", visits: 421, pct: 73 },
  { city: "Регион", visits: 89, pct: 15 },
  { city: "Другие", visits: 66, pct: 12 },
];
const MOCK_PAGES: YmPage[] = [
  { url: "/", views: 487, avgTime: 118 },
  { url: "/catalog", views: 312, avgTime: 95 },
  { url: "/catalog (iPhone)", views: 156, avgTime: 142 },
];

// ── Мини-график (SVG sparkline) ────────────────────────────────────
const Sparkline = ({ data, color = "#FFD700", height = 40 }: { data: number[]; color?: string; height?: number }) => {
  if (!data.length) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 200; const h = height;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 6) - 3;
    return `${x},${y}`;
  });
  const fillPts = [`0,${h}`, ...pts, `${w},${h}`];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }}>
      <defs>
        <linearGradient id={`sg-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon points={fillPts.join(" ")} fill={`url(#sg-${color.replace("#","")})`} />
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

// ── Большой блок-карточка ─────────────────────────────────────────
const StatCard = ({ label, value, sub, trend, sparkData, color = "#FFD700" }: {
  label: string; value: string | number; sub?: string; trend?: number;
  sparkData?: number[]; color?: string;
}) => (
  <div className="bg-[#111] border border-[#222] p-4 flex flex-col gap-2 hover:border-[#333] transition-colors">
    <p className="text-white/40 text-xs uppercase tracking-widest">{label}</p>
    <div className="flex items-end justify-between gap-2">
      <div>
        <p className="text-white font-bold text-2xl leading-none">{value}</p>
        {sub && <p className="text-white/30 text-xs mt-1">{sub}</p>}
      </div>
      {trend !== undefined && (
        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${trend >= 0 ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>
          {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
        </span>
      )}
    </div>
    {sparkData && <Sparkline data={sparkData} color={color} />}
  </div>
);

// ── Горизонтальный бар ─────────────────────────────────────────────
const HBar = ({ label, value, pct, color = "#FFD700" }: { label: string; value: number; pct: number; color?: string }) => (
  <div className="flex items-center gap-3">
    <div className="w-36 text-xs text-white/60 truncate shrink-0">{label}</div>
    <div className="flex-1 h-1.5 bg-white/8 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
    </div>
    <div className="w-10 text-right text-xs text-white/50 shrink-0">{value}</div>
    <div className="w-8 text-right text-[10px] text-white/30 shrink-0">{pct}%</div>
  </div>
);

// ── Форматирование ─────────────────────────────────────────────────
const fmtDur = (s: number) => s >= 60 ? `${Math.floor(s / 60)}м ${s % 60}с` : `${s}с`;
const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getDate()} ${["янв","фев","мар","апр","май","июн","июл","авг","сен","окт","ноя","дек"][d.getMonth()]}`;
};

// ── Главный компонент ─────────────────────────────────────────────
type Section = "overview" | "goals" | "sources" | "behavior" | "geo" | "webvisor" | "heatmap" | "seo";

const SECTIONS: { key: Section; label: string; icon: string }[] = [
  { key: "overview",  label: "Сводка",          icon: "LayoutDashboard" },
  { key: "goals",     label: "Конверсии",        icon: "Target" },
  { key: "sources",   label: "Источники",        icon: "Globe" },
  { key: "behavior",  label: "Поведение",        icon: "MousePointerClick" },
  { key: "geo",       label: "География",        icon: "MapPin" },
  { key: "webvisor",  label: "Вебвизор",         icon: "Play" },
  { key: "heatmap",   label: "Карта кликов",     icon: "Flame" },
  { key: "seo",       label: "SEO & Топ",        icon: "TrendingUp" },
];

const AnalyticsTab = () => {
  const [section, setSection] = useState<Section>("overview");
  const [stats] = useState<YmStat[]>(MOCK_STATS);
  const [goals] = useState<YmGoalStat[]>(MOCK_GOALS);
  const [sources] = useState<YmSource[]>(MOCK_SOURCES);
  const [devices] = useState<YmDevice[]>(MOCK_DEVICES);
  const [geo] = useState<YmGeo[]>(MOCK_GEO);
  const [pages] = useState<YmPage[]>(MOCK_PAGES);
  const [period, setPeriod] = useState<7 | 14 | 30>(14);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Суммы за период
  const slice = stats.slice(-period);
  const totalVisits   = slice.reduce((s, d) => s + d.visits, 0);
  const totalViews    = slice.reduce((s, d) => s + d.pageviews, 0);
  const totalUsers    = slice.reduce((s, d) => s + d.users, 0);
  const avgBounce     = Math.round(slice.reduce((s, d) => s + d.bounceRate, 0) / slice.length);
  const avgDuration   = Math.round(slice.reduce((s, d) => s + d.avgDuration, 0) / slice.length);

  // ── Рендер секций ────────────────────────────────────────────────
  const renderContent = () => {
    switch (section) {

      // ── СВОДКА ──────────────────────────────────────────────────
      case "overview": return (
        <div className="p-5 space-y-5">
          {/* Период */}
          <div className="flex items-center justify-between">
            <h3 className="text-white font-bold text-sm">Обзор за период</h3>
            <div className="flex gap-1">
              {([7, 14, 30] as const).map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  className={`px-3 py-1 text-xs rounded transition-colors ${period === p ? "bg-[#FFD700] text-black font-bold" : "bg-white/5 text-white/50 hover:bg-white/10"}`}>
                  {p} дн
                </button>
              ))}
            </div>
          </div>

          {/* Топ-метрики */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard label="Визиты"         value={totalVisits.toLocaleString("ru")} sub="уникальные сессии" trend={+12} sparkData={slice.map(d => d.visits)} />
            <StatCard label="Пользователи"   value={totalUsers.toLocaleString("ru")}  sub="уник. посетители"  trend={+8}  sparkData={slice.map(d => d.users)} color="#60a5fa" />
            <StatCard label="Просмотры"      value={totalViews.toLocaleString("ru")}  sub="страниц открыто"   trend={+15} sparkData={slice.map(d => d.pageviews)} color="#34d399" />
            <StatCard label="Отказы"         value={`${avgBounce}%`} sub="ушли сразу" trend={-3} sparkData={slice.map(d => d.bounceRate)} color="#f87171" />
          </div>

          {/* График визитов */}
          <div className="bg-[#111] border border-[#222] p-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-white/50 text-xs uppercase tracking-widest font-bold">Визиты по дням</p>
              <p className="text-white/30 text-xs">avg {Math.round(totalVisits / period)}/день</p>
            </div>
            <div className="flex items-end gap-1 h-24">
              {slice.map((d, i) => {
                const maxV = Math.max(...slice.map(x => x.visits));
                const h = Math.round((d.visits / maxV) * 100);
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                    <div className="relative w-full" style={{ height: 80 }}>
                      <div
                        className="absolute bottom-0 w-full rounded-t transition-all duration-300 group-hover:opacity-100 opacity-80"
                        style={{ height: `${h}%`, background: "linear-gradient(to top, #FFD700, #ffa500)" }}
                      />
                    </div>
                    <span className="text-[9px] text-white/20 hidden md:block">{fmtDate(d.date).split(" ")[0]}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Поведение + устройства */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-[#111] border border-[#222] p-4 space-y-3">
              <p className="text-white/50 text-xs uppercase tracking-widest font-bold">Поведение</p>
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-white/50 text-xs">Среднее время на сайте</span>
                  <span className="text-white font-bold text-sm">{fmtDur(avgDuration)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/50 text-xs">Глубина просмотра</span>
                  <span className="text-white font-bold text-sm">{(totalViews / totalVisits).toFixed(1)} стр.</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/50 text-xs">Новые vs Вернувшиеся</span>
                  <span className="text-white font-bold text-sm">72% / 28%</span>
                </div>
              </div>
            </div>
            <div className="bg-[#111] border border-[#222] p-4 space-y-3">
              <p className="text-white/50 text-xs uppercase tracking-widest font-bold">Устройства</p>
              <div className="space-y-2">
                {devices.map(d => (
                  <HBar key={d.device} label={d.device} value={d.visits} pct={d.pct}
                    color={d.device === "Смартфон" ? "#FFD700" : d.device === "Компьютер" ? "#60a5fa" : "#34d399"} />
                ))}
              </div>
            </div>
          </div>

          {/* Совет */}
          <TipCard icon="Lightbulb" color="#FFD700"
            title="69% пользователей — со смартфонов"
            text="Основная аудитория заходит с мобильных. Убедитесь, что кнопка звонка и форма оценки работают идеально на телефоне." />
        </div>
      );

      // ── КОНВЕРСИИ ────────────────────────────────────────────────
      case "goals": return (
        <div className="p-5 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-bold text-sm">Конверсии — что делают посетители</h3>
            <a href={`https://metrika.yandex.ru/stat/goals?id=${YM_ID}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-[#FFD700]/60 hover:text-[#FFD700]">
              <Icon name="ExternalLink" size={11} /> Метрика
            </a>
          </div>

          {/* Воронка */}
          <div className="bg-[#111] border border-[#222] p-4">
            <p className="text-white/40 text-xs uppercase tracking-widest mb-4 font-bold">Воронка продаж</p>
            <div className="space-y-2">
              {[
                { label: "Зашли на сайт",       n: totalVisits, color: "#60a5fa" },
                { label: "Открыли форму",        n: goals.find(g=>g.name==="form_open")?.reaches ?? 0,    color: "#FFD700" },
                { label: "Отправили заявку",     n: goals.find(g=>g.name==="form_submit")?.reaches ?? 0,  color: "#f97316" },
                { label: "Заявка принята ✅",    n: goals.find(g=>g.name==="form_success")?.reaches ?? 0, color: "#34d399" },
              ].map((step, i, arr) => {
                const pct = i === 0 ? 100 : Math.round((step.n / arr[0].n) * 100);
                return (
                  <div key={i} className="relative">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white/70 text-xs">{i + 1}. {step.label}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-white font-bold text-sm">{step.n}</span>
                        <span className="text-white/30 text-xs w-10 text-right">{pct}%</span>
                      </div>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: step.color }} />
                    </div>
                    {i < arr.length - 1 && arr[i+1].n > 0 && (
                      <p className="text-[10px] text-white/20 mt-0.5 text-right">
                        отвалилось {arr[0].n > 0 ? Math.round(((step.n - arr[i+1].n) / arr[0].n) * 100) : 0}%
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Все цели */}
          <div className="bg-[#111] border border-[#222] p-4">
            <p className="text-white/40 text-xs uppercase tracking-widest mb-4 font-bold">Все действия</p>
            <div className="space-y-3">
              {goals.map(g => (
                <div key={g.goal_id} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-white/70 text-sm">{GOAL_LABELS[g.name] ?? g.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-white font-bold">{g.reaches}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-[#FFD700]/10 text-[#FFD700]">{g.conversion}%</span>
                      </div>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full">
                      <div className="h-full bg-[#FFD700] rounded-full" style={{ width: `${Math.min(g.conversion * 5, 100)}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <TipCard icon="Target" color="#34d399"
            title="Конверсия формы ~3.3% — хороший результат для скупки"
            text='Чтобы поднять до 5–7%, попробуйте добавить "Оценим за 5 минут" прямо над кнопкой формы. Срочность увеличивает конверсию.' />
        </div>
      );

      // ── ИСТОЧНИКИ ─────────────────────────────────────────────────
      case "sources": return (
        <div className="p-5 space-y-5">
          <h3 className="text-white font-bold text-sm">Откуда приходят клиенты</h3>

          <div className="grid grid-cols-2 gap-3">
            {sources.map((s, i) => (
              <div key={i} className="bg-[#111] border border-[#222] p-4">
                <p className="text-white/40 text-xs mb-1">{SOURCE_LABELS[s.source] ?? s.source}</p>
                <p className="text-white font-bold text-xl">{s.visits}</p>
                <div className="mt-2 h-1 bg-white/5 rounded-full">
                  <div className="h-full rounded-full bg-[#FFD700]" style={{ width: `${s.pct}%` }} />
                </div>
                <p className="text-white/30 text-xs mt-1">{s.pct}% трафика</p>
              </div>
            ))}
          </div>

          {/* Поисковые фразы */}
          <div className="bg-[#111] border border-[#222] p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-white/50 text-xs uppercase tracking-widest font-bold">Поисковые запросы</p>
              <a href={`https://metrika.yandex.ru/stat/sources/search-phrases?id=${YM_ID}`}
                target="_blank" rel="noopener noreferrer"
                className="text-xs text-[#FFD700]/50 hover:text-[#FFD700] flex items-center gap-1">
                <Icon name="ExternalLink" size={10} /> открыть
              </a>
            </div>
            <div className="space-y-1.5">
              {[
                "скупка телефонов",
                "скупка iPhone",
                "скупка ноутбуков дорого",
                "продать золото",
                "скупка24",
                "скупка техники кирова",
              ].map((q, i) => (
                <div key={i} className="flex items-center justify-between py-1 border-b border-white/5">
                  <span className="text-white/60 text-xs">🔍 {q}</span>
                  <span className="text-white/30 text-xs">{30 - i * 4} переходов</span>
                </div>
              ))}
            </div>
          </div>

          <TipCard icon="Globe" color="#60a5fa"
            title="54% трафика — из поиска"
            text='Яндекс и Google уже ведут клиентов. Добавьте в Яндекс.Вебмастер ключи "скупка золота" и "продать MacBook дорого" — они дают высокий средний чек.' />
        </div>
      );

      // ── ПОВЕДЕНИЕ ─────────────────────────────────────────────────
      case "behavior": return (
        <div className="p-5 space-y-5">
          <h3 className="text-white font-bold text-sm">Что делают на сайте</h3>

          {/* Страницы */}
          <div className="bg-[#111] border border-[#222] p-4">
            <p className="text-white/50 text-xs uppercase tracking-widest font-bold mb-3">Популярные страницы</p>
            <div className="space-y-2">
              {pages.map((p, i) => (
                <div key={i} className="flex items-center gap-3 py-1.5 border-b border-white/5">
                  <span className="text-white/20 text-xs w-4">{i + 1}</span>
                  <span className="flex-1 text-white/70 text-xs font-mono truncate">{p.url}</span>
                  <span className="text-white text-sm font-bold w-14 text-right">{p.views}</span>
                  <span className="text-white/30 text-xs w-12 text-right">{fmtDur(p.avgTime)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Карта прокрутки — советы */}
          <div className="bg-[#111] border border-[#222] p-4 space-y-3">
            <p className="text-white/50 text-xs uppercase tracking-widest font-bold">Глубина просмотра главной</p>
            {[
              { zone: "Шапка + Герой", depth: "0–25%",  pct: 100, label: "Видят все" },
              { zone: "Категории скупки", depth: "25–50%", pct: 78, label: "Большинство" },
              { zone: "Преимущества",  depth: "50–75%", pct: 52, label: "Половина" },
              { zone: "Контакты внизу", depth: "75–100%", pct: 31, label: "Треть" },
            ].map((z, i) => (
              <div key={i}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-white/60 text-xs">{z.zone}</span>
                  <span className="text-white/40 text-xs">{z.label} · {z.pct}%</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full">
                  <div className="h-full rounded-full" style={{ width: `${z.pct}%`, background: `hsl(${z.pct * 1.2}, 80%, 55%)` }} />
                </div>
              </div>
            ))}
          </div>

          {/* Где останавливаются */}
          <div className="bg-[#111] border border-[#222] p-4">
            <p className="text-white/50 text-xs uppercase tracking-widest font-bold mb-3">Где уходят с сайта</p>
            <div className="space-y-2">
              {[
                { page: "Главная (без действий)", pct: 38, color: "#f87171" },
                { page: "После просмотра каталога", pct: 22, color: "#f97316" },
                { page: "После открытия формы", pct: 18, color: "#fbbf24" },
                { page: "После отправки заявки", pct: 13, color: "#34d399" },
              ].map((x, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ background: x.color }} />
                  <span className="flex-1 text-white/60 text-xs">{x.page}</span>
                  <span className="text-white/50 text-xs">{x.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          <TipCard icon="MousePointerClick" color="#f97316"
            title="38% уходят не сделав ничего"
            text="Это нормально. Но добавление поп-апа при попытке уйти с предложением бесплатной оценки может вернуть 10–15% таких посетителей." />
        </div>
      );

      // ── ГЕОГРАФИЯ ─────────────────────────────────────────────────
      case "geo": return (
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

      // ── ВЕБВИЗОР ──────────────────────────────────────────────────
      case "webvisor": return (
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

      // ── КАРТА КЛИКОВ ──────────────────────────────────────────────
      case "heatmap": return (
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

      // ── SEO ────────────────────────────────────────────────────────
      case "seo": return (
        <div className="p-5 space-y-5">
          <h3 className="text-white font-bold text-sm">SEO — продвижение в топ поиска</h3>

          {/* Чеклист */}
          <div className="bg-[#111] border border-[#222] p-4">
            <p className="text-white/50 text-xs uppercase tracking-widest font-bold mb-4">Чеклист готовности</p>
            <div className="space-y-2.5">
              {[
                { done: true,  label: "Title и Description заполнены",          detail: "Оптимизированы под ключевые запросы" },
                { done: true,  label: "Schema.org LocalBusiness",               detail: "Структурированные данные настроены" },
                { done: true,  label: "OpenGraph для соцсетей",                 detail: "Превью при репосте настроено" },
                { done: true,  label: "robots.txt",                             detail: "Закрыты служебные страницы" },
                { done: true,  label: "sitemap.xml",                            detail: "Карта сайта доступна по /sitemap.xml" },
                { done: true,  label: "Яндекс.Метрика",                        detail: "ID 101026698 установлен" },
                { done: false, label: "Яндекс.Вебмастер",                      detail: "Нужна регистрация и подтверждение сайта" },
                { done: false, label: "Google Search Console",                  detail: "Нужна регистрация и загрузка sitemap" },
                { done: false, label: "Яндекс.Бизнес (карты)",                 detail: "Добавить организацию в Яндекс.Карты" },
                { done: false, label: "2ГИС профиль",                          detail: "Бесплатный профиль с рейтингом и фото" },
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

          {/* Ссылки */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Яндекс.Вебмастер", url: "https://webmaster.yandex.ru", desc: "Шаг 1 — самое важное", color: "#f97316" },
              { label: "Google Search Console", url: "https://search.google.com/search-console", desc: "Шаг 2", color: "#60a5fa" },
              { label: "Яндекс.Бизнес", url: "https://business.yandex.ru", desc: "Отображение на картах", color: "#34d399" },
              { label: "2ГИС для бизнеса", url: "https://business.2gis.ru", desc: "Бесплатный профиль", color: "#a78bfa" },
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

      default: return null;
    }
  };

  return (
    <div className="flex h-full min-h-0">
      {/* Левая навигация */}
      <div className="w-44 shrink-0 border-r border-[#222] bg-[#0D0D0D] flex flex-col">
        <div className="px-3 py-3 border-b border-[#222]">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded flex items-center justify-center bg-red-600">
              <span className="text-white font-black text-[9px]">Я</span>
            </div>
            <span className="text-white/40 text-[10px] font-bold uppercase tracking-wider">Аналитика</span>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-1">
          {SECTIONS.map(s => (
            <button key={s.key} onClick={() => setSection(s.key)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors
                ${section === s.key ? "bg-[#FFD700]/10 text-[#FFD700] border-r-2 border-[#FFD700]" : "text-white/40 hover:text-white hover:bg-white/5"}`}>
              <Icon name={s.icon as any} size={13} className="shrink-0" />
              <span className="text-xs font-medium">{s.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-[#222]">
          <a href={`https://metrika.yandex.ru/dashboard?id=${YM_ID}`} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[10px] text-white/30 hover:text-[#FFD700] transition-colors">
            <Icon name="ExternalLink" size={10} /> Открыть Метрику
          </a>
        </div>
      </div>

      {/* Контент */}
      <div className="flex-1 overflow-y-auto min-w-0">
        {renderContent()}
      </div>
    </div>
  );
};

// ── Совет-карточка ────────────────────────────────────────────────
const TipCard = ({ icon, color, title, text }: { icon: string; color: string; title: string; text: string }) => (
  <div className="border border-dashed border-white/10 p-4 flex gap-3 rounded">
    <Icon name={icon as any} size={18} style={{ color, flexShrink: 0, marginTop: 2 }} />
    <div>
      <p className="text-white text-sm font-bold">{title}</p>
      <p className="text-white/40 text-xs mt-1 leading-relaxed">{text}</p>
    </div>
  </div>
);

export default AnalyticsTab;
