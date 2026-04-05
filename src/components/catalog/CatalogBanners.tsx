import { CATEGORY_PHOTOS } from "@/pages/catalog.types";
import Icon from "@/components/ui/icon";

interface CategoryGroup {
  title: string;
  subtitle: string;
  categories: string[];
  accent: string;
  badge?: string;
  hero?: boolean;
}

const GROUPS: CategoryGroup[] = [
  {
    title: "iPhone 17",
    subtitle: "Pro Max · Pro · Air",
    categories: ["iPhone 17/AIR/PRO/MAX"],
    accent: "#6366f1",
    badge: "Новинка 2025",
    hero: true,
  },
  {
    title: "iPhone 16",
    subtitle: "Pro Max · Pro · Plus · e",
    categories: ["iPhone 16/e/+/PRO/MAX"],
    accent: "#f59e0b",
    badge: "Хит продаж",
    hero: true,
  },
  {
    title: "MacBook",
    subtitle: "Air M4 · Pro 14 · Pro 16",
    categories: ["MacBook"],
    accent: "#8b5cf6",
  },
  {
    title: "iPhone 15",
    subtitle: "Pro Max · Pro · Plus",
    categories: ["iPhone 15/+/PRO/MAX"],
    accent: "#10b981",
  },
  {
    title: "Apple Watch",
    subtitle: "Ultra 3 · S11 · SE3",
    categories: ["Apple Watch"],
    accent: "#ef4444",
  },
  {
    title: "AirPods",
    subtitle: "Pro 3 · 4 ANC · Max 2",
    categories: ["AirPods"],
    accent: "#06b6d4",
  },
  {
    title: "Apple iPad",
    subtitle: "Air M4 · iPad 11 · Mini 7",
    categories: ["Apple iPad"],
    accent: "#3b82f6",
  },
  {
    title: "Samsung S",
    subtitle: "S25 Ultra · S25+ · S25",
    categories: ["Samsung S-Z"],
    accent: "#1d4ed8",
    badge: "Galaxy AI",
  },
  {
    title: "Samsung A",
    subtitle: "A55 · A35 · M-серия",
    categories: ["Samsung A-M"],
    accent: "#0ea5e9",
  },
  {
    title: "iPhone 11–14",
    subtitle: "iPhone 11 · 12 · 13 · 14",
    categories: ["iPhone 11/12/13/14"],
    accent: "#64748b",
    badge: "Доступно",
  },
  {
    title: "Dyson",
    subtitle: "Supersonic · Airwrap · V15",
    categories: ["Dyson / Garmin"],
    accent: "#f97316",
    badge: "Премиум",
  },
  {
    title: "Google Pixel",
    subtitle: "Pixel 10 Pro · Honor 400",
    categories: ["Honor / PIXEL"],
    accent: "#16a34a",
  },
  {
    title: "POCO / Xiaomi",
    subtitle: "F6 Pro · X6 Pro · 15",
    categories: ["POCO M-X-F", "Xiaomi/Redmi/Pad"],
    accent: "#f43f5e",
    badge: "Топ цена",
  },
  {
    title: "Sony · GoPro",
    subtitle: "PS5 Slim · GoPro Hero 13",
    categories: ["Sony / XBOX / GoPro"],
    accent: "#7c3aed",
  },
  {
    title: "OnePlus · Nothing",
    subtitle: "OnePlus 13 · Nothing 3",
    categories: ["Realme / OnePlus / Nothing"],
    accent: "#dc2626",
  },
  {
    title: "JBL · Marshall",
    subtitle: "Колонки и устройства",
    categories: ["Яндекс / JBL / Marshall"],
    accent: "#ca8a04",
  },
];

interface Props {
  onCategory: (cat: string) => void;
  activeCategory: string;
}

export default function CatalogBanners({ onCategory, activeCategory }: Props) {
  const heroGroups = GROUPS.filter(g => g.hero);
  const restGroups = GROUPS.filter(g => !g.hero);

  return (
    <div className="bg-[#0D0D0D] pt-3 pb-2">
      {/* Hero баннеры — два крупных */}
      <div className="px-3 sm:px-4 grid grid-cols-2 gap-2.5 mb-2.5">
        {heroGroups.map(g => {
          const photo = CATEGORY_PHOTOS[g.categories[0]];
          const isActive = g.categories.includes(activeCategory);
          return (
            <button
              key={g.title}
              onClick={() => onCategory(g.categories[0])}
              className={`relative rounded-2xl overflow-hidden text-left group transition-all duration-200 ${isActive ? "ring-2" : ""}`}
              style={{
                height: "150px",
                ...(isActive ? { "--tw-ring-color": g.accent, outlineColor: g.accent } as React.CSSProperties : {}),
                boxShadow: isActive ? `0 0 0 2px ${g.accent}` : undefined,
              }}
            >
              {photo && (
                <img src={photo} alt={g.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
              <div className="absolute inset-0 p-3.5 flex flex-col justify-end">
                {g.badge && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full w-fit mb-1.5 backdrop-blur-sm"
                    style={{ background: `${g.accent}40`, color: g.accent }}>
                    {g.badge}
                  </span>
                )}
                <div className="font-bold text-white text-base leading-tight">{g.title}</div>
                <div className="text-white/50 text-[11px] mt-0.5">{g.subtitle}</div>
              </div>
              {isActive && (
                <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: g.accent }}>
                  <Icon name="Check" size={10} className="text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Горизонтальный скролл остальных категорий */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 px-3 sm:px-4 pb-1" style={{ width: "max-content" }}>
          {restGroups.map(g => {
            const photo = CATEGORY_PHOTOS[g.categories[0]];
            const isActive = g.categories.includes(activeCategory);
            return (
              <button
                key={g.title}
                onClick={() => onCategory(g.categories[0])}
                className="relative rounded-xl overflow-hidden text-left shrink-0 group transition-all duration-200"
                style={{
                  width: "120px",
                  height: "90px",
                  boxShadow: isActive ? `0 0 0 2px ${g.accent}` : undefined,
                }}
              >
                {photo ? (
                  <img src={photo} alt={g.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${g.accent}44, ${g.accent}11)` }} />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                <div className="absolute inset-0 p-2.5 flex flex-col justify-end">
                  {g.badge && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full w-fit mb-1"
                      style={{ background: `${g.accent}40`, color: g.accent }}>
                      {g.badge}
                    </span>
                  )}
                  <div className="font-bold text-white text-xs leading-tight">{g.title}</div>
                  <div className="text-white/45 text-[10px] mt-0.5 leading-tight line-clamp-1">{g.subtitle}</div>
                </div>
                {isActive && (
                  <div className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center"
                    style={{ background: g.accent }}>
                    <Icon name="Check" size={8} className="text-white" />
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
