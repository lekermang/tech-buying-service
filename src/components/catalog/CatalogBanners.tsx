import { CATEGORY_PHOTOS } from "@/pages/catalog.types";

const CATS = [
  { title: "iPhone 17",         cat: "iPhone 17/AIR/PRO/MAX",      accent: "#f97316", badge: "NEW", icon: "📱" },
  { title: "iPhone 16",         cat: "iPhone 16/e/+/PRO/MAX",      accent: "#f59e0b",               icon: "📱" },
  { title: "iPhone 15",         cat: "iPhone 15/+/PRO/MAX",        accent: "#3b82f6",               icon: "📱" },
  { title: "iPhone 11–14",      cat: "iPhone 11/12/13/14",         accent: "#6b7280",               icon: "📱" },
  { title: "MacBook",           cat: "MacBook",                    accent: "#8b5cf6",               icon: "💻" },
  { title: "Apple Watch",       cat: "Apple Watch",                accent: "#ef4444",               icon: "⌚" },
  { title: "AirPods",           cat: "AirPods",                    accent: "#06b6d4",               icon: "🎧" },
  { title: "Apple iPad",        cat: "Apple iPad",                 accent: "#3b82f6",               icon: "📲" },
  { title: "Samsung S",         cat: "Samsung S-Z",                accent: "#1d4ed8", badge: "AI",  icon: "📱" },
  { title: "Samsung A",         cat: "Samsung A-M",                accent: "#0ea5e9",               icon: "📱" },
  { title: "Dyson",             cat: "Dyson / Garmin",             accent: "#f97316",               icon: "💨" },
  { title: "Pixel · Honor",     cat: "Honor / PIXEL",              accent: "#16a34a",               icon: "📱" },
  { title: "POCO · Xiaomi",     cat: "POCO M-X-F",                 accent: "#f43f5e",               icon: "📱" },
  { title: "Sony · GoPro",      cat: "Sony / XBOX / GoPro",        accent: "#7c3aed",               icon: "🎮" },
  { title: "OnePlus · Nothing", cat: "Realme / OnePlus / Nothing", accent: "#dc2626",               icon: "📱" },
  { title: "JBL · Яндекс",     cat: "Яндекс / JBL / Marshall",    accent: "#ca8a04",               icon: "🔊" },
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
            <div className="text-white font-black text-4xl leading-none tracking-tight">iPhone 17</div>
            <div className="text-white/60 text-sm font-medium mt-1.5">Pro Max · Pro · Air · 17e</div>
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
                <>
                  <div className="absolute inset-0"
                    style={{ background: `linear-gradient(135deg, ${c.accent}40, ${c.accent}10)` }} />
                  <div className="absolute inset-0 flex items-center justify-center pb-4">
                    <span className="text-2xl sm:text-3xl opacity-60">{c.icon}</span>
                  </div>
                </>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
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