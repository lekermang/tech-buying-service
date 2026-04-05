import { CATEGORY_PHOTOS } from "@/pages/catalog.types";
import Icon from "@/components/ui/icon";

interface CategoryGroup {
  title: string;
  subtitle: string;
  categories: string[];
  accent: string;
  icon: string;
  badge?: string;
}

const GROUPS: CategoryGroup[] = [
  {
    title: "iPhone 17 серия",
    subtitle: "Pro Max · Pro · Air · базовый",
    categories: ["iPhone 17/AIR/PRO/MAX"],
    accent: "#6366f1",
    icon: "Smartphone",
    badge: "Новинка 2025",
  },
  {
    title: "iPhone 16",
    subtitle: "Pro Max · Pro · Plus · базовый · e",
    categories: ["iPhone 16/e/+/PRO/MAX"],
    accent: "#f59e0b",
    icon: "Smartphone",
    badge: "Хит продаж",
  },
  {
    title: "iPhone 15",
    subtitle: "Pro Max · Pro · Plus · базовый",
    categories: ["iPhone 15/+/PRO/MAX"],
    accent: "#10b981",
    icon: "Smartphone",
  },
  {
    title: "iPhone 11–14",
    subtitle: "iPhone 11 · 12 · 13 · 14",
    categories: ["iPhone 11/12/13/14"],
    accent: "#64748b",
    icon: "Smartphone",
    badge: "Доступные цены",
  },
  {
    title: "MacBook",
    subtitle: "Air M4 · Pro 14 · Pro 16",
    categories: ["MacBook"],
    accent: "#8b5cf6",
    icon: "Laptop",
  },
  {
    title: "Apple Watch",
    subtitle: "Ultra 3 · S11 · SE3",
    categories: ["Apple Watch"],
    accent: "#ef4444",
    icon: "Watch",
  },
  {
    title: "AirPods",
    subtitle: "Pro 3 · 4 ANC · Max 2",
    categories: ["AirPods"],
    accent: "#06b6d4",
    icon: "Headphones",
  },
  {
    title: "Apple iPad",
    subtitle: "Air M4 · iPad 11 · Mini 7",
    categories: ["Apple iPad"],
    accent: "#3b82f6",
    icon: "Tablet",
  },
  {
    title: "Samsung Galaxy S",
    subtitle: "S25 Ultra · S25+ · S25",
    categories: ["Samsung S-Z"],
    accent: "#1d4ed8",
    icon: "Smartphone",
    badge: "Galaxy AI",
  },
  {
    title: "Samsung A / M",
    subtitle: "A55 · A35 · M-серия",
    categories: ["Samsung A-M"],
    accent: "#0ea5e9",
    icon: "Smartphone",
  },
  {
    title: "Dyson",
    subtitle: "Supersonic · Airwrap · V15",
    categories: ["Dyson / Garmin"],
    accent: "#f97316",
    icon: "Wind",
    badge: "Премиум",
  },
  {
    title: "Google Pixel / Honor",
    subtitle: "Pixel 10 Pro · Honor 400",
    categories: ["Honor / PIXEL"],
    accent: "#16a34a",
    icon: "Smartphone",
  },
  {
    title: "POCO / Xiaomi / Redmi",
    subtitle: "F6 Pro · X6 Pro · Xiaomi 15",
    categories: ["POCO M-X-F", "Xiaomi/Redmi/Pad"],
    accent: "#f43f5e",
    icon: "Zap",
    badge: "Лучшая цена",
  },
  {
    title: "Sony · XBOX · GoPro",
    subtitle: "PS5 Slim · GoPro Hero 13",
    categories: ["Sony / XBOX / GoPro"],
    accent: "#7c3aed",
    icon: "Gamepad2",
  },
  {
    title: "Realme · OnePlus · Nothing",
    subtitle: "OnePlus 13 · Nothing Phone 3",
    categories: ["Realme / OnePlus / Nothing"],
    accent: "#dc2626",
    icon: "Smartphone",
  },
  {
    title: "Яндекс · JBL · Marshall",
    subtitle: "Колонки и умные устройства",
    categories: ["Яндекс / JBL / Marshall"],
    accent: "#ca8a04",
    icon: "Speaker",
  },
];

interface Props {
  onCategory: (cat: string) => void;
  activeCategory: string;
}

export default function CatalogBanners({ onCategory, activeCategory }: Props) {
  return (
    <div className="px-4 pb-6">
      {/* Большой hero баннер */}
      <div
        className="relative w-full rounded-2xl overflow-hidden mb-5 cursor-pointer group"
        style={{ height: "200px" }}
        onClick={() => onCategory("iPhone 17/AIR/PRO/MAX")}
      >
        <img
          src={CATEGORY_PHOTOS["iPhone 17/AIR/PRO/MAX"]}
          alt="iPhone 17"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
        <div className="absolute inset-0 p-5 flex flex-col justify-end">
          <div className="inline-flex items-center gap-1.5 bg-indigo-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-full w-fit mb-2">
            <Icon name="Sparkles" size={11} />
            Новинка 2025
          </div>
          <h2 className="text-white font-bold text-2xl leading-tight">iPhone 17</h2>
          <p className="text-white/60 text-sm mt-0.5">Pro Max · Pro · Air · базовый</p>
        </div>
      </div>

      {/* Сетка карточек категорий */}
      <div className="grid grid-cols-2 gap-3">
        {GROUPS.slice(1).map((g) => {
          const photo = CATEGORY_PHOTOS[g.categories[0]];
          const isActive = g.categories.includes(activeCategory);
          return (
            <button
              key={g.title}
              onClick={() => onCategory(g.categories[0])}
              className={`relative rounded-xl overflow-hidden text-left transition-all duration-200 group ${
                isActive ? "ring-2 ring-offset-2 ring-offset-[#0D0D0D]" : ""
              }`}
              style={{
                height: "130px",
                ...(isActive ? { "--tw-ring-color": g.accent } as React.CSSProperties : {}),
              }}
            >
              {photo ? (
                <img
                  src={photo}
                  alt={g.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${g.accent}33, ${g.accent}11)` }} />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
              <div className="absolute inset-0 p-3 flex flex-col justify-end">
                {g.badge && (
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full w-fit mb-1.5"
                    style={{ background: `${g.accent}33`, color: g.accent }}
                  >
                    {g.badge}
                  </span>
                )}
                <div className="font-bold text-white text-sm leading-tight">{g.title}</div>
                <div className="text-white/50 text-[11px] mt-0.5 leading-tight">{g.subtitle}</div>
              </div>
              {isActive && (
                <div
                  className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: g.accent }}
                >
                  <Icon name="Check" size={10} className="text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
