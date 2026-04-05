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

// Категории точно соответствуют split_part(category,'/',1) в БД
const CATS: Cat[] = [
  {
    title: "Слесарный",
    subtitle: "Ключи · Плоскогубцы · Тиски",
    cat: "Слесарный инструмент",
    accent: "#f97316",
    photo: "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/00bbe905-09a8-46e9-ba0a-407f94a80258.jpg",
    badge: "4 569 шт",
    hero: true,
  },
  {
    title: "Режущий",
    subtitle: "Пилы · УШМ · Лобзики · Фрезы",
    cat: "Режущий инструмент",
    accent: "#ef4444",
    photo: "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/a636f768-65ef-45a2-b0b5-4cc5fb94f2a7.jpg",
    badge: "3 610 шт",
    hero: true,
  },
  {
    title: "Садовый",
    subtitle: "Лопаты · Грабли · Культиваторы",
    cat: "Садовый инвентарь",
    accent: "#22c55e",
    photo: "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/9ab352df-e961-42bc-a0f1-d2080cd18a0a.jpg",
  },
  {
    title: "Отделочный",
    subtitle: "Шпатели · Кисти · Валики",
    cat: "Отделочный инструмент",
    accent: "#8b5cf6",
    photo: "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/efca7bcd-f834-4f35-b458-a23b4bc2c685.jpg",
  },
  {
    title: "Крепёж",
    subtitle: "Шурупы · Болты · Анкера",
    cat: "Крепежный инструмент",
    accent: "#64748b",
    photo: "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/23a2e710-8912-4c72-b983-3e6e9d2f0a49.jpg",
    badge: "Расходники",
  },
  {
    title: "Авто",
    subtitle: "Домкраты · Съёмники · Ключи",
    cat: "Автомобильный инструмент",
    accent: "#06b6d4",
    photo: "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/5cb42b6e-c7f7-4b24-a049-10b3f0b45a37.jpg",
  },
  {
    title: "Силовое",
    subtitle: "Генераторы · Компрессоры",
    cat: "Силовое оборудование",
    accent: "#f59e0b",
    photo: "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/46ad337e-c9b7-470d-8f94-ccf6a0c6ecb7.jpg",
  },
  {
    title: "Столярный",
    subtitle: "Стамески · Рубанки · Фрезы",
    cat: "Столярный инструмент",
    accent: "#a16207",
    photo: "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/efca7bcd-f834-4f35-b458-a23b4bc2c685.jpg",
  },
  {
    title: "Измерительный",
    subtitle: "Рулетки · Уровни · Лазер",
    cat: "Измерительный инструмент",
    accent: "#3b82f6",
    photo: "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/2b7657f0-165b-4e08-bef3-fb160c0e4036.jpg",
    badge: "Точность",
  },
  {
    title: "Прочее",
    subtitle: "Разные категории",
    cat: "Прочий инструмент",
    accent: "#475569",
    photo: "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/00bbe905-09a8-46e9-ba0a-407f94a80258.jpg",
  },
];

interface Props {
  activeCategory: string;
  onCategory: (cat: string) => void;
  total: number;
}

export default function ToolsBanners({ activeCategory, onCategory, total }: Props) {
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
            <span className="text-white/40 text-[10px] hidden sm:inline">Bosch · DeWalt · Makita · Hilti</span>
          </div>
          <h1 className="text-white font-extrabold text-2xl sm:text-3xl tracking-tight leading-tight">
            Каталог инструментов
          </h1>
          <p className="text-white/35 text-xs mt-0.5">опт и розница · быстрая доставка</p>
        </div>
      </div>

      {/* Два hero-баннера */}
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
          {/* Все */}
          <button onClick={() => onCategory("")}
            className="relative rounded-xl shrink-0 flex flex-col items-center justify-center gap-1 transition-all"
            style={{
              width: 80, height: 72,
              background: !activeCategory ? "#f97316" : "#1f2937",
              boxShadow: !activeCategory ? "0 0 0 2px #f97316" : undefined,
            }}>
            <Icon name="LayoutGrid" size={18} className={!activeCategory ? "text-white" : "text-gray-400"} />
            <span className={`text-[11px] font-bold ${!activeCategory ? "text-white" : "text-gray-400"}`}>Все</span>
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
    </div>
  );
}
