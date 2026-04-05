import Icon from "@/components/ui/icon";
import { WebGLShader } from "@/components/ui/web-gl-shader";

interface Cat {
  title: string;
  subtitle: string;
  cat: string;
  accent: string;
  photo: string;
  badge?: string;
  hero?: boolean;
}

interface Brand {
  name: string;
  subtitle: string;
  accent: string;
  photo: string;
  count: number;
}

const CATS: Cat[] = [
  { title: "Слесарный",     subtitle: "Ключи · Плоскогубцы · Тиски",    cat: "Слесарный инструмент",    accent: "#f97316", photo: "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/00bbe905-09a8-46e9-ba0a-407f94a80258.jpg", badge: "4 569 шт", hero: true },
  { title: "Режущий",       subtitle: "Пилы · УШМ · Лобзики · Фрезы",   cat: "Режущий инструмент",      accent: "#ef4444", photo: "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/a636f768-65ef-45a2-b0b5-4cc5fb94f2a7.jpg", badge: "3 610 шт", hero: true },
  { title: "Садовый",       subtitle: "Лопаты · Грабли · Культиваторы", cat: "Садовый инвентарь",        accent: "#22c55e", photo: "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/9ab352df-e961-42bc-a0f1-d2080cd18a0a.jpg" },
  { title: "Отделочный",    subtitle: "Шпатели · Кисти · Валики",        cat: "Отделочный инструмент",   accent: "#8b5cf6", photo: "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/efca7bcd-f834-4f35-b458-a23b4bc2c685.jpg" },
  { title: "Крепёж",        subtitle: "Шурупы · Болты · Анкера",         cat: "Крепежный инструмент",    accent: "#64748b", photo: "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/23a2e710-8912-4c72-b983-3e6e9d2f0a49.jpg", badge: "Расходники" },
  { title: "Авто",          subtitle: "Домкраты · Съёмники · Ключи",     cat: "Автомобильный инструмент",accent: "#06b6d4", photo: "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/5cb42b6e-c7f7-4b24-a049-10b3f0b45a37.jpg" },
  { title: "Силовое",       subtitle: "Генераторы · Компрессоры",        cat: "Силовое оборудование",    accent: "#f59e0b", photo: "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/46ad337e-c9b7-470d-8f94-ccf6a0c6ecb7.jpg" },
  { title: "Столярный",     subtitle: "Стамески · Рубанки · Фрезы",      cat: "Столярный инструмент",    accent: "#a16207", photo: "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/efca7bcd-f834-4f35-b458-a23b4bc2c685.jpg" },
  { title: "Измерительный", subtitle: "Рулетки · Уровни · Лазер",        cat: "Измерительный инструмент",accent: "#3b82f6", photo: "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/2b7657f0-165b-4e08-bef3-fb160c0e4036.jpg", badge: "Точность" },
  { title: "Прочее",        subtitle: "Разные категории",                 cat: "Прочий инструмент",       accent: "#475569", photo: "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/00bbe905-09a8-46e9-ba0a-407f94a80258.jpg" },
];

const BRANDS: Brand[] = [
  { name: "СИБРТЕХ",  subtitle: "3 786 товаров",  accent: "#f97316", photo: "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/4cbea92a-2f28-48e1-8d04-2a9c17c78106.jpg", count: 3786 },
  { name: "MATRIX",   subtitle: "3 395 товаров",  accent: "#ef4444", photo: "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/2a2b45e2-0b9f-4e73-9789-21f31622deaf.jpg", count: 3395 },
  { name: "DENZEL",   subtitle: "2 321 товар",    accent: "#3b82f6", photo: "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/20ca6a83-dc64-44a7-8b78-983501457673.jpg", count: 2321 },
  { name: "PALISAD",  subtitle: "1 167 товаров",  accent: "#22c55e", photo: "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/af2f6f06-992b-4114-a1d2-69151dc8b2d9.jpg", count: 1167 },
  { name: "GROSS",    subtitle: "897 товаров",    accent: "#f59e0b", photo: "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/0ab4e245-b2c9-42df-9f77-fdf17d87e80b.jpg", count: 897  },
  { name: "SPARTA",   subtitle: "812 товаров",    accent: "#8b5cf6", photo: "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/836a6473-46aa-4fcd-9d51-61078df2ab32.jpg", count: 812  },
  { name: "STELS",    subtitle: "635 товаров",    accent: "#06b6d4", photo: "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/52ecef16-ee55-4529-aaba-4df7010e8bb4.jpg", count: 635  },
  { name: "MTX",      subtitle: "482 товара",     accent: "#eab308", photo: "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/6e98a41e-aa42-4d2b-8d4b-add8470e8ae5.jpg", count: 482  },
  { name: "БАРС",     subtitle: "312 товаров",    accent: "#dc2626", photo: "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/2266b393-010f-4ea5-823f-237b2151e2fa.jpg", count: 312  },
];

interface Props {
  activeCategory: string;
  activeBrand: string;
  onCategory: (cat: string) => void;
  onBrand: (brand: string) => void;
  total: number;
}

export default function ToolsBanners({ activeCategory, activeBrand, onCategory, onBrand, total }: Props) {
  const heroes = CATS.filter(c => c.hero);
  const rest = CATS.filter(c => !c.hero);

  return (
    <div className="bg-gray-950">

      {/* WebGL шейдер-заголовок */}
      <div className="relative overflow-hidden" style={{ height: 110 }}>
        <WebGLShader className="opacity-75" xScale={1.2} yScale={0.4} distortion={0.08} />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-950/90 via-gray-950/50 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-gray-950 to-transparent" />
        <div className="relative z-10 px-4 sm:px-5 h-full flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 bg-orange-500/20 border border-orange-500/40 text-orange-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
              <Icon name="Wrench" size={9} />
              {total > 0 ? `${total.toLocaleString("ru-RU")} товаров` : "18 473 товара"}
            </span>
            <span className="text-white/20 text-[10px] hidden sm:inline">·</span>
            <span className="text-white/40 text-[10px] hidden sm:inline">СИБРТЕХ · MATRIX · DENZEL · PALISAD</span>
          </div>
          <h1 className="text-white font-extrabold text-2xl sm:text-3xl tracking-tight leading-tight">
            Каталог инструментов
          </h1>
          <p className="text-white/35 text-xs mt-0.5">опт и розница · быстрая доставка</p>
        </div>
      </div>

      {/* Два hero-баннера категорий */}
      <div className="px-3 sm:px-4 grid grid-cols-2 gap-2 mb-2">
        {heroes.map(c => {
          const isActive = activeCategory === c.cat;
          return (
            <button key={c.cat} onClick={() => onCategory(c.cat)}
              className="relative rounded-xl overflow-hidden text-left group"
              style={{ height: 130, boxShadow: isActive ? `0 0 0 2px ${c.accent}` : undefined }}>
              <img src={c.photo} alt={c.title} loading="lazy"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
              <div className="absolute inset-0 p-3 flex flex-col justify-end">
                {c.badge && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full w-fit mb-1"
                    style={{ background: `${c.accent}40`, color: c.accent }}>{c.badge}</span>
                )}
                <div className="font-bold text-white text-sm sm:text-base leading-tight">{c.title}</div>
                <div className="text-white/50 text-[10px] sm:text-[11px] mt-0.5">{c.subtitle}</div>
              </div>
              {isActive && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: c.accent }}>
                  <Icon name="Check" size={10} className="text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Горизонтальный скролл категорий */}
      <div className="overflow-x-auto scrollbar-hide pb-2">
        <div className="flex gap-2 px-3 sm:px-4" style={{ width: "max-content" }}>
          <button onClick={() => onCategory("")}
            className="relative rounded-xl shrink-0 flex flex-col items-center justify-center gap-1 transition-all"
            style={{ width: 80, height: 72, background: !activeCategory && !activeBrand ? "#f97316" : "#1f2937", boxShadow: !activeCategory && !activeBrand ? "0 0 0 2px #f97316" : undefined }}>
            <Icon name="LayoutGrid" size={18} className={!activeCategory && !activeBrand ? "text-white" : "text-gray-400"} />
            <span className={`text-[11px] font-bold ${!activeCategory && !activeBrand ? "text-white" : "text-gray-400"}`}>Все</span>
          </button>
          {rest.map(c => {
            const isActive = activeCategory === c.cat;
            return (
              <button key={c.cat} onClick={() => onCategory(c.cat)}
                className="relative rounded-xl overflow-hidden shrink-0 text-left group transition-all"
                style={{ width: 100, height: 72, boxShadow: isActive ? `0 0 0 2px ${c.accent}` : undefined }}>
                <img src={c.photo} alt={c.title} loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />
                <div className="absolute inset-0 p-1.5 flex flex-col justify-end">
                  {c.badge && (
                    <span className="text-[8px] font-bold px-1 py-0.5 rounded-full w-fit mb-0.5"
                      style={{ background: `${c.accent}40`, color: c.accent }}>{c.badge}</span>
                  )}
                  <div className="text-white font-bold text-[10px] leading-tight">{c.title}</div>
                  <div className="text-white/40 text-[9px] leading-tight mt-0.5 line-clamp-1">{c.subtitle}</div>
                </div>
                {isActive && (
                  <div className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center"
                    style={{ background: c.accent }}>
                    <Icon name="Check" size={8} className="text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Бренды ── */}
      <div className="px-3 sm:px-4 pt-1 pb-1">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-widest text-gray-600">Бренды</span>
          {activeBrand && (
            <button onClick={() => onBrand("")} className="text-[11px] text-orange-400 hover:text-orange-300 flex items-center gap-1">
              <Icon name="X" size={10} /> Сбросить
            </button>
          )}
        </div>
      </div>

      {/* Горизонтальный скролл брендов */}
      <div className="overflow-x-auto scrollbar-hide pb-3">
        <div className="flex gap-2 px-3 sm:px-4" style={{ width: "max-content" }}>
          {BRANDS.map(b => {
            const isActive = activeBrand === b.name;
            return (
              <button key={b.name} onClick={() => onBrand(isActive ? "" : b.name)}
                className="relative rounded-xl overflow-hidden shrink-0 text-left group transition-all"
                style={{ width: 120, height: 90, boxShadow: isActive ? `0 0 0 2.5px ${b.accent}` : undefined }}>
                <img src={b.photo} alt={b.name} loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                {/* Тёмный оверлей + цветная полоска снизу */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/10" />
                <div className="absolute inset-x-0 bottom-0 h-0.5" style={{ background: b.accent }} />
                <div className="absolute inset-0 p-2 flex flex-col justify-end">
                  <div className="text-white font-extrabold text-sm leading-none tracking-tight">{b.name}</div>
                  <div className="text-white/45 text-[9px] mt-0.5">{b.subtitle}</div>
                </div>
                {isActive && (
                  <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: b.accent }}>
                    <Icon name="Check" size={10} className="text-white" />
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
