import { CATEGORY_PHOTOS } from "@/pages/catalog.types";

const CATS = [
  { title: "iPhone 17",         sub: "Pro Max · Pro · Air",   cat: "iPhone 17/AIR/PRO/MAX",      accent: "#f97316", badge: "NEW" },
  { title: "iPhone 16",         sub: "Pro · Plus · 16e",      cat: "iPhone 16/e/+/PRO/MAX",      accent: "#f59e0b" },
  { title: "iPhone 15",         sub: "Pro Max · Pro · Plus",  cat: "iPhone 15/+/PRO/MAX",        accent: "#3b82f6" },
  { title: "iPhone 11–14",      sub: "11 · 12 · 13 · 14",    cat: "iPhone 11/12/13/14",         accent: "#6b7280" },
  { title: "MacBook",           sub: "Air M4 · Pro M5",       cat: "MacBook",                    accent: "#8b5cf6" },
  { title: "Apple Watch",       sub: "Ultra 3 · S11 · SE3",   cat: "Apple Watch",                accent: "#ef4444" },
  { title: "AirPods",           sub: "Pro 3 · Max 2",         cat: "AirPods",                    accent: "#06b6d4" },
  { title: "Apple iPad",        sub: "Air M4 · Mini 7",       cat: "Apple iPad",                 accent: "#3b82f6" },
  { title: "Samsung S",         sub: "S26 Ultra · S25+",      cat: "Samsung S-Z",                accent: "#1d4ed8", badge: "AI" },
  { title: "Samsung A",         sub: "A56 · A36 · A26",       cat: "Samsung A-M",                accent: "#0ea5e9" },
  { title: "Dyson",             sub: "Фен · Стайлер · Пылесос", cat: "Dyson / Garmin",           accent: "#f97316", badge: "💎" },
  { title: "Pixel · Honor",     sub: "Pixel 10 · Honor 400",  cat: "Honor / PIXEL",              accent: "#16a34a" },
  { title: "POCO · Xiaomi",     sub: "F8 · X7 · 15T Pro",    cat: "POCO M-X-F",                 accent: "#f43f5e" },
  { title: "Sony · GoPro",      sub: "PS5 · Xbox · GoPro",   cat: "Sony / XBOX / GoPro",        accent: "#7c3aed" },
  { title: "OnePlus · Nothing", sub: "15 · Phone 4A",         cat: "Realme / OnePlus / Nothing", accent: "#dc2626" },
  { title: "JBL · Яндекс",     sub: "Charge 6 · Станция",    cat: "Яндекс / JBL / Marshall",    accent: "#ca8a04" },
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

      {/* Hero баннер */}
      <div className="px-3 sm:px-4 pt-4 pb-3">
        <button
          onClick={() => onCategory(hero.cat)}
          className="relative w-full rounded-2xl overflow-hidden cursor-pointer"
          style={{ height: 150 }}
        >
          <div className="absolute inset-0" style={{
            background: "linear-gradient(120deg, #431407 0%, #9a3412 40%, #ea580c 75%, #fdba74 100%)"
          }} />
          {heroPhoto && (
            <img src={heroPhoto} alt="iPhone 17"
              className="absolute right-0 top-0 h-full w-2/5 object-cover opacity-60"
              style={{ maskImage: "linear-gradient(to left, rgba(0,0,0,0.8), transparent)" }} />
          )}
          <div className="absolute inset-0 px-5 flex flex-col justify-center">
            {hero.badge && (
              <span className="text-[11px] font-black text-orange-200 tracking-widest uppercase mb-1">{hero.badge} 2025</span>
            )}
            <div className="text-white font-black text-3xl leading-none">iPhone 17</div>
            <div className="text-white/70 text-sm mt-1">Pro Max · Pro · Air · 17e</div>
            <div className="text-white/40 text-xs mt-2">Orange · Silver · Blue</div>
          </div>
          {activeCategory === hero.cat && (
            <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-white text-[10px]">✓</div>
          )}
        </button>
      </div>

      {/* Сетка категорий */}
      <div className="grid grid-cols-4 sm:grid-cols-8 lg:grid-cols-16">
        {CATS.map(c => {
          const photo = CATEGORY_PHOTOS[c.cat];
          const isActive = activeCategory === c.cat;
          return (
            <button
              key={c.cat}
              onClick={() => onCategory(c.cat)}
              className="relative overflow-hidden aspect-square group"
              style={{
                outline: isActive ? `2px solid ${c.accent}` : "1px solid rgba(255,255,255,0.05)",
                outlineOffset: "-1px",
              }}
            >
              {photo ? (
                <img src={photo} alt={c.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              ) : (
                <div className="absolute inset-0"
                  style={{ background: `linear-gradient(135deg, ${c.accent}55, ${c.accent}15)` }} />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 px-1.5 pb-1.5">
                {c.badge && (
                  <div className="text-[7px] font-bold mb-0.5 hidden sm:block" style={{ color: c.accent }}>{c.badge}</div>
                )}
                <div className="text-white font-bold text-[8px] sm:text-[9px] leading-tight line-clamp-2">{c.title}</div>
              </div>
              {isActive && (
                <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center text-white text-[8px] font-bold"
                  style={{ background: c.accent }}>✓</div>
              )}
            </button>
          );
        })}
      </div>

    </div>
  );
}
