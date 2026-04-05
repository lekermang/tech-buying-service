import * as React from "react";
import Icon from "@/components/ui/icon";
import { WebGLShader } from "@/components/ui/web-gl-shader";
import { CardStack, CardStackItem } from "@/components/ui/card-stack";

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
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [cardW, setCardW] = React.useState(300);

  React.useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        const w = containerRef.current.offsetWidth;
        setCardW(Math.min(400, Math.max(220, w * 0.55)));
      }
    };
    update();
    const ro = new ResizeObserver(update);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const brandItems: CardStackItem[] = BRANDS.map(b => ({
    id: b.name,
    title: b.name,
    description: b.subtitle,
    imageSrc: b.photo,
    tag: b.accent,
  }));

  return (
    <div className="bg-gray-950" ref={containerRef}>

      {/* ── Шапка WebGL ── */}
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

      {/* ── Категории: плотная сетка без пробелов ── */}
      {/* мобилка: 5 cols | планшет sm: 5 md: 6 | ПК lg: 11 (все в 1 ряд) */}
      <div className="mb-0">
        {/* Кнопка «Все» + все категории в grid без gap */}
        <div className="grid grid-cols-5 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-11 gap-0">
          {/* «Все» */}
          <button
            onClick={() => onCategory("")}
            className="relative flex flex-col items-center justify-center gap-1 transition-all"
            style={{
              aspectRatio: "1 / 1",
              background: !activeCategory && !activeBrand ? "#f97316" : "#111827",
              outline: !activeCategory && !activeBrand ? "2px solid #f97316" : "1px solid rgba(255,255,255,0.06)",
              outlineOffset: "-1px",
            }}
          >
            <Icon name="LayoutGrid" size={18} className={!activeCategory && !activeBrand ? "text-white" : "text-gray-500"} />
            <span className={`text-[10px] sm:text-[11px] font-bold leading-none mt-0.5 ${!activeCategory && !activeBrand ? "text-white" : "text-gray-500"}`}>Все</span>
          </button>

          {/* Категории */}
          {CATS.map(c => {
            const isActive = activeCategory === c.cat;
            return (
              <button
                key={c.cat}
                onClick={() => onCategory(c.cat)}
                className="relative overflow-hidden text-left group transition-all"
                style={{
                  aspectRatio: "1 / 1",
                  outline: isActive ? `2px solid ${c.accent}` : "1px solid rgba(255,255,255,0.06)",
                  outlineOffset: "-1px",
                }}
              >
                <img src={c.photo} alt={c.title} loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                {isActive && (
                  <div className="absolute inset-0 ring-2 ring-inset pointer-events-none" style={{ borderColor: c.accent }} />
                )}
                <div className="absolute inset-x-0 bottom-0 p-1 sm:p-1.5 md:p-2">
                  {c.badge && (
                    <div className="text-[6px] sm:text-[7px] font-bold px-1 py-px rounded-full w-fit mb-0.5 hidden md:block"
                      style={{ background: `${c.accent}40`, color: c.accent }}>{c.badge}</div>
                  )}
                  <div className="text-white font-bold text-[8px] sm:text-[9px] md:text-[10px] leading-tight line-clamp-2">{c.title}</div>
                </div>
                {isActive && (
                  <div className="absolute top-1 right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center"
                    style={{ background: c.accent }}>
                    <Icon name="Check" size={7} className="text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Бренды: CardStack ── */}
      <div className="pt-3 pb-5 px-3 sm:px-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500">Бренды</span>
          {activeBrand && (
            <button onClick={() => onBrand("")} className="text-[11px] text-orange-400 hover:text-orange-300 flex items-center gap-1">
              <Icon name="X" size={10} /> Сбросить
            </button>
          )}
        </div>

        <CardStack
          items={brandItems}
          cardWidth={cardW}
          cardHeight={Math.round(cardW * 0.58)}
          maxVisible={5}
          overlap={0.5}
          spreadDeg={32}
          autoAdvance
          intervalMs={2600}
          pauseOnHover
          showDots
          loop
          renderCard={(item, { active }) => {
            const brand = BRANDS.find(b => b.name === item.id);
            const accent = brand?.accent ?? "#f97316";
            return (
              <button
                className="relative h-full w-full text-left focus:outline-none"
                onClick={() => onBrand(activeBrand === item.id ? "" : String(item.id))}
              >
                <img src={item.imageSrc} alt={item.title} className="h-full w-full object-cover" draggable={false} loading="eager" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                {/* Цветная полоска снизу */}
                <div className="absolute inset-x-0 bottom-0 h-0.5" style={{ background: accent }} />
                <div className="relative z-10 flex h-full flex-col justify-end p-4">
                  <div className="flex items-end gap-2">
                    <span
                      className={`font-extrabold tracking-tight leading-none transition-all ${active ? "text-2xl sm:text-3xl" : "text-lg"} text-white`}
                    >
                      {item.title}
                    </span>
                    {active && activeBrand === item.id && (
                      <span className="mb-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${accent}40`, color: accent }}>
                        выбран
                      </span>
                    )}
                  </div>
                  {active && (
                    <div className="mt-1 text-xs text-white/60">{item.description}</div>
                  )}
                </div>
                {activeBrand === item.id && (
                  <div className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center shadow-lg" style={{ background: accent }}>
                    <Icon name="Check" size={12} className="text-white" />
                  </div>
                )}
              </button>
            );
          }}
        />
      </div>

    </div>
  );
}
