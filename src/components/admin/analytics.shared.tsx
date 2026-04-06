/* eslint-disable @typescript-eslint/no-explicit-any */
import Icon from "@/components/ui/icon";

// ── Константа счётчика ────────────────────────────────────────────
export const YM_ID = 101026698;

// ── Типы ─────────────────────────────────────────────────────────
export interface YmStat { date: string; visits: number; pageviews: number; users: number; bounceRate: number; avgDuration: number; }
export interface YmGoalStat { name: string; goal_id: string; reaches: number; conversion: number; }
export interface YmSource { source: string; visits: number; pct: number; }
export interface YmDevice { device: string; visits: number; pct: number; }
export interface YmGeo { city: string; visits: number; pct: number; }
export interface YmPage { url: string; views: number; avgTime: number; }

// ── Подписи ───────────────────────────────────────────────────────
export const GOAL_LABELS: Record<string, string> = {
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

export const SOURCE_LABELS: Record<string, string> = {
  "Переходы из поисковых систем": "🔍 Поиск",
  "Прямые заходы": "🔗 Прямые",
  "Переходы по ссылкам на сайтах": "🌐 Сайты",
  "Переходы из социальных сетей": "👥 Соцсети",
  "Переходы с рекламных систем": "📢 Реклама",
};

// ── Мок-данные ────────────────────────────────────────────────────
export const MOCK_STATS: YmStat[] = Array.from({ length: 14 }, (_, i) => {
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
export const MOCK_GOALS: YmGoalStat[] = [
  { name: "call_click", goal_id: "1", reaches: 47, conversion: 8.2 },
  { name: "form_submit", goal_id: "2", reaches: 23, conversion: 4.0 },
  { name: "form_success", goal_id: "3", reaches: 19, conversion: 3.3 },
  { name: "telegram_click", goal_id: "4", reaches: 31, conversion: 5.4 },
  { name: "catalog_open", goal_id: "5", reaches: 88, conversion: 15.3 },
];
export const MOCK_SOURCES: YmSource[] = [
  { source: "Переходы из поисковых систем", visits: 312, pct: 54 },
  { source: "Прямые заходы", visits: 143, pct: 25 },
  { source: "Переходы из социальных сетей", visits: 72, pct: 12 },
  { source: "Переходы по ссылкам на сайтах", visits: 52, pct: 9 },
];
export const MOCK_DEVICES: YmDevice[] = [
  { device: "Смартфон", visits: 398, pct: 69 },
  { device: "Компьютер", visits: 143, pct: 25 },
  { device: "Планшет", visits: 35, pct: 6 },
];
export const MOCK_GEO: YmGeo[] = [
  { city: "Ваш город", visits: 421, pct: 73 },
  { city: "Регион", visits: 89, pct: 15 },
  { city: "Другие", visits: 66, pct: 12 },
];
export const MOCK_PAGES: YmPage[] = [
  { url: "/", views: 487, avgTime: 118 },
  { url: "/catalog", views: 312, avgTime: 95 },
  { url: "/catalog (iPhone)", views: 156, avgTime: 142 },
];

// ── Форматирование ────────────────────────────────────────────────
export const fmtDur = (s: number) => s >= 60 ? `${Math.floor(s / 60)}м ${s % 60}с` : `${s}с`;
export const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getDate()} ${["янв","фев","мар","апр","май","июн","июл","авг","сен","окт","ноя","дек"][d.getMonth()]}`;
};

// ── Sparkline ─────────────────────────────────────────────────────
export const Sparkline = ({ data, color = "#FFD700", height = 40 }: { data: number[]; color?: string; height?: number }) => {
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

// ── StatCard ──────────────────────────────────────────────────────
export const StatCard = ({ label, value, sub, trend, sparkData, color = "#FFD700" }: {
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

// ── HBar ──────────────────────────────────────────────────────────
export const HBar = ({ label, value, pct, color = "#FFD700" }: { label: string; value: number; pct: number; color?: string }) => (
  <div className="flex items-center gap-3">
    <div className="w-36 text-xs text-white/60 truncate shrink-0">{label}</div>
    <div className="flex-1 h-1.5 bg-white/8 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
    </div>
    <div className="w-10 text-right text-xs text-white/50 shrink-0">{value}</div>
    <div className="w-8 text-right text-[10px] text-white/30 shrink-0">{pct}%</div>
  </div>
);

// ── TipCard ───────────────────────────────────────────────────────
export const TipCard = ({ icon, color, title, text }: { icon: string; color: string; title: string; text: string }) => (
  <div className="border border-dashed border-white/10 p-4 flex gap-3 rounded">
    <Icon name={icon as any} size={18} style={{ color, flexShrink: 0, marginTop: 2 }} />
    <div>
      <p className="text-white text-sm font-bold">{title}</p>
      <p className="text-white/40 text-xs mt-1 leading-relaxed">{text}</p>
    </div>
  </div>
);
