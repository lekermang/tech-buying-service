import { CATEGORY_PHOTOS } from "@/pages/catalog.types";
import Icon from "@/components/ui/icon";

interface Cat {
  title: string;
  subtitle: string;
  cat: string;
  accent: string;
  badge?: string;
}

const CATS: Cat[] = [
  { title: "iPhone 17",         subtitle: "Pro · Air · Max",       cat: "iPhone 17/AIR/PRO/MAX",      accent: "#6366f1", badge: "Новинки" },
  { title: "iPhone 16",         subtitle: "Pro · Plus · e",        cat: "iPhone 16/e/+/PRO/MAX",      accent: "#f59e0b", badge: "Хит" },
  { title: "iPhone 15",         subtitle: "Pro · Plus",            cat: "iPhone 15/+/PRO/MAX",        accent: "#10b981" },
  { title: "iPhone 11–14",      subtitle: "11 · 12 · 13 · 14",     cat: "iPhone 11/12/13/14",         accent: "#64748b", badge: "Доступно" },
  { title: "MacBook",           subtitle: "Air M4 · Pro M4",       cat: "MacBook",                    accent: "#8b5cf6" },
  { title: "Apple Watch",       subtitle: "Ultra 3 · S11",         cat: "Apple Watch",                accent: "#ef4444" },
  { title: "AirPods",           subtitle: "Pro 3 · Max 2",         cat: "AirPods",                    accent: "#06b6d4" },
  { title: "Apple iPad",        subtitle: "Air M4 · Mini 7",       cat: "Apple iPad",                 accent: "#3b82f6" },
  { title: "Samsung S",         subtitle: "S25 Ultra · S25+",      cat: "Samsung S-Z",                accent: "#1d4ed8", badge: "Galaxy AI" },
  { title: "Samsung A",         subtitle: "A55 · A35",             cat: "Samsung A-M",                accent: "#0ea5e9" },
  { title: "Dyson",             subtitle: "Фен · Стайлер",         cat: "Dyson / Garmin",             accent: "#f97316", badge: "Премиум" },
  { title: "Pixel · Honor",     subtitle: "Pixel 10 · Honor 400",  cat: "Honor / PIXEL",              accent: "#16a34a" },
  { title: "POCO · Xiaomi",     subtitle: "F6 Pro · 15 Ultra",     cat: "POCO M-X-F",                 accent: "#f43f5e", badge: "Топ цена" },
  { title: "Sony · GoPro",      subtitle: "PS5 · GoPro 13",        cat: "Sony / XBOX / GoPro",        accent: "#7c3aed" },
  { title: "OnePlus · Nothing", subtitle: "13 · Phone 3",          cat: "Realme / OnePlus / Nothing", accent: "#dc2626" },
  { title: "JBL · Marshall",    subtitle: "Колонки · Яндекс",      cat: "Яндекс / JBL / Marshall",    accent: "#ca8a04" },
];

interface Props {
  onCategory: (cat: string) => void;
  activeCategory: string;
}

export default function CatalogBanners({ onCategory, activeCategory }: Props) {
  const hero = CATS[0];
  const heroPhoto = CATEGORY_PHOTOS[hero.cat];

  return (
    <div className="bg-[#0D0D0D]">

      {/* ── Шапка ── */}
      <div className="px-3 sm:px-5 py-5 sm:py-6">
        {/* Hero баннер iPhone 17 */}
        <div className="relative w-full rounded-2xl overflow-hidden mb-0" style={{ height: 160 }}>
          {heroPhoto && (
            <img src={heroPhoto} alt={hero.title}
              className="absolute inset-0 w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-transparent" />
          <div className="absolute inset-0 p-4 sm:p-5 flex flex-col justify-center">
            <span className="inline-flex items-center gap-1.5 bg-indigo-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-full w-fit mb-2">
              <Icon name="Sparkles" size={11} />
              {hero.badge}
            </span>
            <div className="text-white font-bold text-2xl sm:text-3xl leading-tight">{hero.title}</div>
            <div className="text-white/55 text-sm mt-1">{hero.subtitle}</div>
          </div>
          {activeCategory === hero.cat && (
            <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center">
              <Icon name="Check" size={12} className="text-white" />
            </div>
          )}
        </div>

        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
            <Icon name="Sparkles" size={9} />
            Официальная гарантия
          </span>
          <span className="text-white/20 text-[10px]">·</span>
          <span className="text-white/40 text-[10px]">Рассрочка 0%</span>
        </div>
        <h1 className="text-white font-extrabold text-2xl sm:text-3xl tracking-tight leading-tight mt-1">
          Каталог новой техники
        </h1>
        <p className="text-white/40 text-xs mt-0.5">iPhone · MacBook · Samsung · Dyson</p>
      </div>

      {/* ── Категории: плотная сетка без пробелов ── */}
      {/* мобилка: 4 cols | sm: 5 | md: 8 | lg: 16 (все в 1 ряд) */}
      <div>
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-16 gap-0">
          {CATS.map(c => {
            const photo = CATEGORY_PHOTOS[c.cat];
            const isActive = activeCategory === c.cat;
            return (
              <button
                key={c.cat}
                onClick={() => onCategory(c.cat)}
                className="relative overflow-hidden text-left group transition-all"
                style={{
                  aspectRatio: "1 / 1",
                  outline: isActive ? `2px solid ${c.accent}` : "1px solid rgba(255,255,255,0.05)",
                  outlineOffset: "-1px",
                }}
              >
                {photo ? (
                  <img src={photo} alt={c.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="absolute inset-0"
                    style={{ background: `linear-gradient(135deg, ${c.accent}50, ${c.accent}18)` }} />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-1 sm:p-1.5 md:p-2">
                  {c.badge && (
                    <span className="text-[7px] font-bold px-1 py-px rounded-full w-fit mb-0.5 hidden sm:block"
                      style={{ background: `${c.accent}40`, color: c.accent }}>
                      {c.badge}
                    </span>
                  )}
                  <div className="text-white font-bold text-[8px] sm:text-[9px] md:text-[10px] leading-tight line-clamp-2">{c.title}</div>
                </div>
                {isActive && (
                  <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center"
                    style={{ background: c.accent }}>
                    <Icon name="Check" size={7} className="text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}