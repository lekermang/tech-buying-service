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

const CATS: Cat[] = [
  {
    title: "Дрели и шуруповёрты",
    subtitle: "Bosch · DeWalt · Makita · Hilti",
    cat: "Дрели",
    accent: "#f97316",
    photo: "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/5cb42b6e-c7f7-4b24-a049-10b3f0b45a37.jpg",
    badge: "Хит",
    hero: true,
  },
  {
    title: "Шлифовальные и пилы",
    subtitle: "УШМ · Пилы · Лобзики",
    cat: "Шлифовальные машины",
    accent: "#ef4444",
    photo: "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/a636f768-65ef-45a2-b0b5-4cc5fb94f2a7.jpg",
    badge: "Популярное",
    hero: true,
  },
  {
    title: "Ручной инструмент",
    subtitle: "Молотки · Ключи · Отвёртки",
    cat: "Ручной инструмент",
    accent: "#eab308",
    photo: "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/00bbe905-09a8-46e9-ba0a-407f94a80258.jpg",
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
    title: "Сварка",
    subtitle: "Аппараты · Маски · Электроды",
    cat: "Сварочное оборудование",
    accent: "#f59e0b",
    photo: "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/46ad337e-c9b7-470d-8f94-ccf6a0c6ecb7.jpg",
  },
  {
    title: "Садовый инструмент",
    subtitle: "Лопаты · Грабли · Культиваторы",
    cat: "Садовый инструмент",
    accent: "#22c55e",
    photo: "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/9ab352df-e961-42bc-a0f1-d2080cd18a0a.jpg",
  },
  {
    title: "Крепёж",
    subtitle: "Шурупы · Болты · Анкера",
    cat: "Крепёжные изделия",
    accent: "#64748b",
    photo: "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/23a2e710-8912-4c72-b983-3e6e9d2f0a49.jpg",
    badge: "Расходники",
  },
  {
    title: "Столярный",
    subtitle: "Стамески · Рубанки · Фрезы",
    cat: "Столярный инструмент",
    accent: "#a16207",
    photo: "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/efca7bcd-f834-4f35-b458-a23b4bc2c685.jpg",
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

      {/* ── WebGL шейдер-заголовок ── */}
      <div className="relative overflow-hidden" style={{ height: 120 }}>
        <WebGLShader
          className="opacity-80"
          xScale={1.2}
          yScale={0.4}
          distortion={0.08}
        />
        {/* Затемнение */}
        <div className="absolute inset-0 bg-gradient-to-r from-gray-950/90 via-gray-950/50 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-gray-950 to-transparent" />
        {/* Текст */}
        <div className="relative z-10 px-4 sm:px-5 h-full flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 bg-orange-500/20 border border-orange-500/40 text-orange-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
              <Icon name="Wrench" size={9} />
              18 473 товара
            </span>
            <span className="text-white/20 text-[10px]">·</span>
            <span className="text-white/40 text-[10px]">Bosch · DeWalt · Makita · Hilti</span>
          </div>
          <h1 className="text-white font-extrabold text-2xl sm:text-3xl tracking-tight leading-tight">
            Каталог инструментов
          </h1>
          {total > 0 && (
            <p className="text-white/40 text-xs mt-0.5">{total.toLocaleString("ru-RU")} позиций · опт и розница</p>
          )}
        </div>
      </div>

      {/* ── Два hero-баннера ── */}
      <div className="px-3 sm:px-4 grid grid-cols-2 gap-2.5 mb-2.5">
        {heroes.map(c => {
          const isActive = activeCategory === c.cat;
          return (
            <button
              key={c.cat}
              onClick={() => onCategory(c.cat)}
              className="relative rounded-2xl overflow-hidden text-left group transition-all duration-200"
              style={{ height: 150, boxShadow: isActive ? `0 0 0 2px ${c.accent}` : undefined }}
            >
              <img src={c.photo} alt={c.title}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
              <div className="absolute inset-0 p-3.5 flex flex-col justify-end">
                {c.badge && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full w-fit mb-1.5 backdrop-blur-sm"
                    style={{ background: `${c.accent}40`, color: c.accent }}>
                    {c.badge}
                  </span>
                )}
                <div className="font-bold text-white text-base leading-tight">{c.title}</div>
                <div className="text-white/50 text-[11px] mt-0.5">{c.subtitle}</div>
              </div>
              {isActive && (
                <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: c.accent }}>
                  <Icon name="Check" size={10} className="text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Горизонтальный скролл остальных категорий ── */}
      <div className="overflow-x-auto scrollbar-hide pb-3">
        <div className="flex gap-2 px-3 sm:px-4" style={{ width: "max-content" }}>
          {/* Кнопка «Все» */}
          <button
            onClick={() => onCategory("")}
            className="relative rounded-xl overflow-hidden shrink-0 text-left group transition-all duration-200 flex flex-col items-center justify-center"
            style={{
              width: 90, height: 80,
              background: !activeCategory ? "#f97316" : "#1f2937",
              boxShadow: !activeCategory ? "0 0 0 2px #f97316" : undefined,
            }}
          >
            <Icon name="LayoutGrid" size={20} className={!activeCategory ? "text-white" : "text-gray-400"} />
            <div className={`text-[11px] font-bold mt-1 ${!activeCategory ? "text-white" : "text-gray-400"}`}>Все</div>
          </button>

          {rest.map(c => {
            const isActive = activeCategory === c.cat;
            return (
              <button
                key={c.cat}
                onClick={() => onCategory(c.cat)}
                className="relative rounded-xl overflow-hidden shrink-0 text-left group transition-all duration-200"
                style={{ width: 110, height: 80, boxShadow: isActive ? `0 0 0 2px ${c.accent}` : undefined }}
              >
                <img src={c.photo} alt={c.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                <div className="absolute inset-0 p-2 flex flex-col justify-end">
                  {c.badge && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full w-fit mb-1"
                      style={{ background: `${c.accent}40`, color: c.accent }}>
                      {c.badge}
                    </span>
                  )}
                  <div className="text-white font-bold text-[11px] leading-tight">{c.title}</div>
                  <div className="text-white/45 text-[10px] leading-tight mt-0.5 line-clamp-1">{c.subtitle}</div>
                </div>
                {isActive && (
                  <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center"
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
