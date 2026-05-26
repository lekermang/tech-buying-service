import { useState } from "react";
import Icon from "@/components/ui/icon";
import Header from "@/components/skupka/Header";
import ContactsFooter from "@/components/skupka/ContactsFooter";

const HERO_IMG =
  "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/3b284dfd-609c-4d3f-8e73-49501a0ae6c3.jpg";

const ACCENT = "#60a5fa";

interface PorcelainItem {
  name: string;
  period: string;
  price: string;
  note: string;
}

interface PorcelainCategory {
  era: string;
  icon: string;
  color: string;
  items: PorcelainItem[];
}

const PORCELAIN: PorcelainCategory[] = [
  {
    era: "Императорский фарфоровый завод — ИФЗ",
    icon: "🏛️",
    color: "#60a5fa",
    items: [
      {
        name: "Сервиз Екатерины II (фрагмент)",
        period: "XVIII в.",
        price: "от 500 000 ₽",
        note: "Единственные сервизы — в музеях. Отдельные предметы крайне редки",
      },
      {
        name: "Чайный сервиз XIX в. (ИФЗ)",
        period: "XIX в.",
        price: "от 50 000 ₽",
        note: "Ручная роспись, клеймо «ИФЗ» под глазурью",
      },
      {
        name: "Тарелка с видами Петербурга",
        period: "XIX в.",
        price: "от 20 000 ₽",
        note: "Топографическая серия — очень востребована коллекционерами",
      },
      {
        name: "Чашка с блюдцем (ИФЗ)",
        period: "XIX в.",
        price: "от 5 000 ₽",
        note: "Отдельные предметы из разбитых сервизов",
      },
      {
        name: "Ваза с росписью (ИФЗ)",
        period: "XIX — нач. XX в.",
        price: "от 30 000 ₽",
        note: "Монументальные вазы с портретами и пейзажами",
      },
    ],
  },
  {
    era: "Завод Гарднера",
    icon: "🎨",
    color: "#3b82f6",
    items: [
      {
        name: "Фигурка «Русские типы»",
        period: "XIX в.",
        price: "от 100 000 ₽",
        note: "Крестьяне, торговцы, музыканты — вершина коллекционного спроса",
      },
      {
        name: "Орденский сервиз Гарднера",
        period: "XVIII–XIX в.",
        price: "от 200 000 ₽",
        note: "Сервизы с орденской символикой — редчайшие",
      },
      {
        name: "Блюдо с цветочной росписью",
        period: "XIX в.",
        price: "от 20 000 ₽",
        note: "Ручная роспись цветов и птиц",
      },
      {
        name: "Чашка с монограммой (Гарднер)",
        period: "XIX в.",
        price: "от 8 000 ₽",
        note: "Клеймо «G» под глазурью подтверждает подлинность",
      },
    ],
  },
  {
    era: "Кузнецовский фарфор",
    icon: "🍵",
    color: "#2563eb",
    items: [
      {
        name: "Чайный сервиз Кузнецова",
        period: "Нач. XX в.",
        price: "от 15 000 ₽",
        note: "Массовое производство, но высокое качество — часто встречается в наследстве",
      },
      {
        name: "Обеденный сервиз Кузнецова",
        period: "Нач. XX в.",
        price: "от 25 000 ₽",
        note: "Полные наборы с клеймом — большой спрос",
      },
      {
        name: "Посуда с кобальтовой росписью",
        period: "XIX–XX в.",
        price: "от 2 000 ₽",
        note: "Характерный синий цвет на белом фарфоре",
      },
      {
        name: "Фаянс Кузнецова",
        period: "Нач. XX в.",
        price: "от 500 ₽",
        note: "Более доступный материал, но ценится при хорошей сохранности",
      },
    ],
  },
  {
    era: "Хрусталь и стекло",
    icon: "💎",
    color: "#93c5fd",
    items: [
      {
        name: "Хрусталь Гусевского завода",
        period: "XIX–XX в.",
        price: "от 5 000 ₽",
        note: "Цветной хрусталь: рубиновый, синий, зелёный",
      },
      {
        name: "Ваза с ручной гравировкой",
        period: "XIX в.",
        price: "от 20 000 ₽",
        note: "Сложные флористические и геометрические узоры",
      },
      {
        name: "Советский хрусталь Боровичей",
        period: "1950–1980",
        price: "от 3 000 ₽",
        note: "Массовый, но встречаются редкие авторские образцы",
      },
      {
        name: "Стекло авангарда (1920-е)",
        period: "1920–1930",
        price: "от 10 000 ₽",
        note: "Конструктивистские формы — в тренде у коллекционеров",
      },
    ],
  },
];

const AUTHENTICITY = [
  {
    icon: "Stamp",
    title: "Клеймо производителя",
    text: "ИФЗ, Гарднер «G», Кузнецов — клейма наносились под глазурью, не стираются. Надглазурное клеймо — повод насторожиться.",
  },
  {
    icon: "Brush",
    title: "Качество росписи",
    text: "Заводская ручная роспись имеет характерные авторские мазки. Деколь (переводная картинка) выглядит механически и легко отличима.",
  },
  {
    icon: "Flashlight",
    title: "Просвет фарфора",
    text: "Настоящий твёрдый фарфор на просвет белый и однородный без пятен. Фаянс и кость не пропускают свет так же чисто.",
  },
  {
    icon: "Volume2",
    title: "Звук при постукивании",
    text: "Настоящий фарфор издаёт чистый долгий звон. Фаянс и новодел дают глухой, короткий звук — разница очевидна.",
  },
  {
    icon: "ZoomIn",
    title: "Возраст глазури",
    text: "Старая глазурь может иметь мелкую сетку кракелюра от перепадов температур. Искусственный кракелюр выглядит грубее.",
  },
  {
    icon: "Grid3x3",
    title: "Размер и серия",
    text: "Предметы из одного сервиза имеют одинаковый декор и клейма одного периода. Несоответствие — признак сборного комплекта.",
  },
];

const PROCESS = [
  {
    step: "01",
    title: "Фото или визит",
    text: "Пришлите фото предмета (лицо, дно с клеймом, детали росписи) или привезите лично",
  },
  {
    step: "02",
    title: "Предварительная оценка",
    text: "В течение 2 часов дадим ориентировочную стоимость по фото без обязательств",
  },
  {
    step: "03",
    title: "Экспертиза на месте",
    text: "Осматриваем клеймо, роспись, просвет, сохранность — определяем завод и период",
  },
  {
    step: "04",
    title: "Оплата в день обращения",
    text: "Платим наличными или переводом сразу — без задержек и многоступенчатых согласований",
  },
];

const WHY_US = [
  {
    icon: "BadgeCheck",
    title: "Знаем цены",
    text: "Следим за аукционами MacDougall's, Bonhams, Christie's по русскому фарфору — платим реальную рыночную цену",
  },
  {
    icon: "Package",
    title: "Покупаем частями",
    text: "Берём как полные сервизы, так и отдельные предметы — чашку, тарелку, вазу",
  },
  {
    icon: "Banknote",
    title: "Оплата сразу",
    text: "Наличными или переводом в день визита. Без ожидания и согласований",
  },
];

const STATS = [
  { val: "300+", lbl: "лет традиции фарфора" },
  { val: "от 500 ₽", lbl: "минимальная выкупная цена" },
  { val: "до 3 000 000 ₽", lbl: "за сервиз" },
  { val: "бесплатно", lbl: "оценка при визите" },
];

const CONDITION_GRADES = [
  { grade: "10/10", label: "Идеальное", color: "#4ade80", desc: "Нет сколов, царапин, трещин. Роспись яркая, неповреждённая. Клеймо чёткое.", modifier: "Максимальная цена" },
  { grade: "8/10", label: "Отличное", color: "#86efac", desc: "Очень мелкие царапины видны только под лупой. Роспись почти как новая.", modifier: "−5–10% от максимума" },
  { grade: "6/10", label: "Хорошее", color: "#fbbf24", desc: "Видны потёртости, небольшие сколы на краях. Роспись местами потемнела.", modifier: "−20–30% от максимума" },
  { grade: "4/10", label: "Среднее", color: "#fb923c", desc: "Несколько сколов, требуется деликатная чистка. Роспись повреждена.", modifier: "−40–50% от максимума" },
  { grade: "2/10", label: "Требует реставрации", color: "#ef4444", desc: "Серьёзные повреждения. Трещины, утраты росписи. Нужна профессиональная реставрация.", modifier: "−60–80% от максимума" },
];

const STORIES = [
  {
    title: "Крестьянка из Брянска",
    tag: "Гарднер",
    tagColor: "#3b82f6",
    quote: "Нашла в сундуке деда статуэтку Гарднера «Крестьянка в сарафане». Дед привёз её с войны, забыл про неё.",
    result: "180 000 ₽",
    detail: "Статуэтка Гарднера «Русские типы», 1890-е годы, идеальная сохранность",
  },
  {
    title: "Наследство от бабушки",
    tag: "ИФЗ",
    tagColor: "#60a5fa",
    quote: "После смерти бабушки нашли шкаф, полный фарфоровых вещей. Целая коллекция ИФЗ — чашки, блюдца, вазы.",
    result: "450 000 ₽",
    detail: "Чайный сервиз XIX в. (12 предметов) + 3 вазы с видами Петербурга",
  },
  {
    title: "Чердак старого дома",
    tag: "Гарднер",
    tagColor: "#3b82f6",
    quote: "При уборке чердака нашли деревянный ящик. Внутри — три статуэтки Гарднера в отличном состоянии!",
    result: "530 000 ₽",
    detail: "Три фигурки «Русских типов»: Музыкант (200 т.р.), Торговец (180 т.р.), Крестьянин (150 т.р.)",
  },
];

const FAQ_ITEMS = [
  {
    q: "Мой фарфор из советских времён, он ценный?",
    a: "Советский фарфор ЛФЗ 1950–1970-х стоит 3 000–50 000 ₽ за предмет. Особенно ценятся фигурки балерин, спортсменов и редкие авторские серии. Агитационный фарфор 1920-х — отдельная история, там цены от 50 000 ₽.",
  },
  {
    q: "Фарфор разбит, вы берёте?",
    a: "Берём при условии, что основные элементы целы. Трещины и склеенные сколы снижают цену на 30–60%, но музейного уровня предметы покупаем даже в повреждённом состоянии — они всё равно ценнее целого массового экземпляра.",
  },
  {
    q: "Как отличить ИФЗ от подделки?",
    a: "Клеймо ИФЗ наносится под глазурью — его нельзя нанести на готовый предмет. Подлинный фарфор на просвет чисто белый без желтизны. Ручная роспись имеет видимые мазки кисти, деколь (переводная картинка) — механически ровная.",
  },
  {
    q: "Стоит ли чистить старый фарфор перед продажей?",
    a: "Не чистите сами! Неправильная чистка необратимо повреждает роспись. Профессиональная чистка стоит 2 000–10 000 ₽ за предмет и может поднять цену в 1,5–2 раза. Лучше привезите как есть — мы оцениваем с учётом потенциала.",
  },
  {
    q: "Как перевезти фарфор без риска?",
    a: "Каждый предмет отдельно заверните в пузырчатую плёнку, затем в мягкую ткань. Никогда не кладите фарфор в одну коробку без разделителей. Мы можем организовать курьерскую доставку с профессиональной упаковкой.",
  },
];

export default function RussianPorcelain() {
  const [activeTab, setActiveTab] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [sent, setSent] = useState(false);
  const [ctaPhone, setCtaPhone] = useState("");
  const [ctaSent, setCtaSent] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const handleModalSend = () => {
    if (phone.replace(/\D/g, "").length < 10) return;
    setSent(true);
  };

  const handleCtaSend = () => {
    if (ctaPhone.replace(/\D/g, "").length < 10) return;
    setCtaSent(true);
  };

  const activeCategory = PORCELAIN[activeTab];

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <Header scrollTo={() => {}} />

      {/* ══ HERO ══ */}
      <section className="relative min-h-[60vh] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={HERO_IMG}
            alt="Русский фарфор и хрусталь"
            className="w-full h-full object-cover object-center opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-[#080808]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#080808]/80 via-transparent to-transparent" />
        </div>

        {/* Синие искры */}
        <div
          className="absolute top-10 right-[20%] w-1 h-1 rounded-full opacity-60 animate-pulse"
          style={{ background: ACCENT }}
        />
        <div
          className="absolute top-24 right-[35%] w-0.5 h-0.5 rounded-full opacity-40 animate-pulse"
          style={{ background: ACCENT, animationDelay: "0.7s" }}
        />
        <div
          className="absolute top-16 right-[10%] w-1.5 h-1.5 rounded-full opacity-30 animate-pulse"
          style={{ background: ACCENT, animationDelay: "1.4s" }}
        />
        <div
          className="absolute top-40 right-[50%] w-1 h-1 rounded-full opacity-50 animate-pulse"
          style={{ background: ACCENT, animationDelay: "2.1s" }}
        />

        <div className="relative max-w-6xl mx-auto px-4 pb-14 pt-28">
          <div
            className="inline-flex items-center gap-2 font-roboto text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full mb-4 border"
            style={{
              background: `${ACCENT}20`,
              borderColor: `${ACCENT}60`,
              color: ACCENT,
            }}
          >
            <Icon name="Layers" size={11} />
            Скупка антиквариата · Скупка24
          </div>

          <h1 className="font-oswald font-black text-4xl md:text-6xl lg:text-7xl uppercase leading-none mb-2">
            РУССКИЙ ФАРФОР
          </h1>
          <h1 className="font-oswald font-black text-4xl md:text-6xl lg:text-7xl uppercase leading-none mb-4">
            <span
              style={{
                background:
                  "linear-gradient(90deg,#1e3a5f,#2563eb,#60a5fa,#bfdbfe,#60a5fa,#2563eb,#1e3a5f)",
                backgroundSize: "200% auto",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                animation: "blueShimmer 3s linear infinite",
              }}
            >
              И ХРУСТАЛЬ
            </span>
          </h1>

          <p className="font-roboto text-white/60 text-base md:text-lg max-w-xl mb-6 leading-relaxed">
            Покупаем ИФЗ, Гарднер, Кузнецов, Гусевский хрусталь. Оценка
            бесплатно — честная цена по международным аукционным результатам.
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setFormOpen(true)}
              className="inline-flex items-center gap-2 font-oswald font-bold text-sm uppercase tracking-wide px-6 py-3 transition-colors"
              style={{ background: ACCENT, color: "#000" }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background =
                  "#93c5fd")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background =
                  ACCENT)
              }
            >
              <Icon name="Phone" size={16} />
              Оценить фарфор
            </button>
            <a
              href="#porcelain"
              className="inline-flex items-center gap-2 border border-white/20 text-white/70 font-roboto text-sm px-6 py-3 transition-colors"
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.borderColor =
                  `${ACCENT}80`;
                (e.currentTarget as HTMLAnchorElement).style.color = ACCENT;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.borderColor =
                  "rgba(255,255,255,0.2)";
                (e.currentTarget as HTMLAnchorElement).style.color =
                  "rgba(255,255,255,0.7)";
              }}
            >
              <Icon name="ChevronDown" size={16} />
              Таблица цен
            </a>
          </div>
        </div>
      </section>

      {/* ══ STATS ══ */}
      <section
        className="border-y bg-[#0A0A0A]"
        style={{ borderColor: `${ACCENT}18` }}
      >
        <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map((s) => (
            <div key={s.lbl} className="text-center">
              <div
                className="font-oswald font-black text-xl md:text-2xl"
                style={{ color: ACCENT }}
              >
                {s.val}
              </div>
              <div className="font-roboto text-white/45 text-xs mt-0.5">
                {s.lbl}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ ТАБЛИЦА ЦЕН ══ */}
      <section id="porcelain" className="max-w-6xl mx-auto px-4 py-14 md:py-20">
        <div className="mb-8">
          <div
            className="inline-flex items-center gap-1.5 text-[10px] font-roboto uppercase tracking-widest px-2.5 py-1 rounded-full mb-3 border"
            style={{
              background: `${ACCENT}15`,
              borderColor: `${ACCENT}40`,
              color: ACCENT,
            }}
          >
            <Icon name="Table" size={10} />
            Таблица цен
          </div>
          <h2 className="font-oswald font-bold text-3xl md:text-4xl uppercase">
            Что мы покупаем
          </h2>
          <p className="font-roboto text-white/45 text-sm mt-1">
            Цены ориентировочные — итоговая стоимость зависит от завода,
            периода и сохранности
          </p>
        </div>

        {/* Табы */}
        <div className="flex flex-wrap gap-2 mb-6">
          {PORCELAIN.map((cat, i) => (
            <button
              key={cat.era}
              onClick={() => setActiveTab(i)}
              className="inline-flex items-center gap-2 px-4 py-2 font-roboto text-sm transition-all border"
              style={
                activeTab === i
                  ? {
                      borderColor: `${ACCENT}80`,
                      background: `${ACCENT}18`,
                      color: ACCENT,
                    }
                  : {
                      borderColor: "rgba(255,255,255,0.10)",
                      background: "transparent",
                      color: "rgba(255,255,255,0.50)",
                    }
              }
            >
              <span>{cat.icon}</span>
              {cat.era}
            </button>
          ))}
        </div>

        {/* Таблица */}
        <div className="overflow-x-auto rounded-xl border border-white/[0.07]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.07] bg-[#0D0D0D]">
                <th className="text-left font-roboto text-[11px] uppercase tracking-widest text-white/30 px-5 py-3">
                  Предмет
                </th>
                <th className="text-left font-roboto text-[11px] uppercase tracking-widest text-white/30 px-5 py-3 hidden sm:table-cell">
                  Период
                </th>
                <th className="text-right font-roboto text-[11px] uppercase tracking-widest text-white/30 px-5 py-3">
                  Цена выкупа
                </th>
              </tr>
            </thead>
            <tbody>
              {activeCategory.items.map((item, idx) => (
                <tr
                  key={idx}
                  className="border-b border-white/[0.04] transition-colors"
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLTableRowElement).style.background =
                      "rgba(255,255,255,0.02)")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLTableRowElement).style.background =
                      "transparent")
                  }
                >
                  <td className="px-5 py-4">
                    <div className="font-oswald font-bold text-sm text-white transition-colors group-hover:text-[#60a5fa]">
                      {item.name}
                    </div>
                    <div className="font-roboto text-white/40 text-xs mt-0.5 sm:hidden">
                      {item.period}
                    </div>
                    <div className="font-roboto text-white/35 text-xs mt-0.5 leading-snug max-w-xs">
                      {item.note}
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden sm:table-cell">
                    <span
                      className="font-roboto text-xs px-2 py-0.5 rounded-full border"
                      style={{
                        color: activeCategory.color,
                        borderColor: `${activeCategory.color}40`,
                        background: `${activeCategory.color}15`,
                      }}
                    >
                      {item.period}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span
                      className="font-oswald font-bold text-sm whitespace-nowrap"
                      style={{ color: ACCENT }}
                    >
                      {item.price}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="font-roboto text-white/25 text-xs mt-3 text-right">
          * Итоговая цена определяется после осмотра предмета экспертом
        </p>
      </section>

      {/* ══ КАК ОПРЕДЕЛИТЬ ПОДЛИННОСТЬ ══ */}
      <section
        className="border-y border-white/5 py-14 md:py-20"
        style={{ background: "#0A0A0A" }}
      >
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-10">
            <div className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 text-white/50 text-[10px] font-roboto uppercase tracking-widest px-2.5 py-1 rounded-full mb-3">
              <Icon name="ShieldCheck" size={10} />
              Экспертиза
            </div>
            <h2 className="font-oswald font-bold text-3xl md:text-4xl uppercase">
              Как определить
              <br />
              <span style={{ color: ACCENT }}>подлинность</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {AUTHENTICITY.map((a, i) => (
              <div
                key={i}
                className="bg-[#0D0D0D] border border-white/[0.06] p-5 rounded-xl transition-colors"
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLDivElement).style.borderColor =
                    `${ACCENT}30`)
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLDivElement).style.borderColor =
                    "rgba(255,255,255,0.06)")
                }
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center mb-3 transition-colors"
                  style={{ background: `${ACCENT}18` }}
                >
                  <Icon name={a.icon} size={18} style={{ color: ACCENT }} />
                </div>
                <div className="font-oswald font-bold text-base mb-1.5">
                  {a.title}
                </div>
                <div className="font-roboto text-white/50 text-sm leading-relaxed">
                  {a.text}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ КАК МЫ ПОКУПАЕМ ══ */}
      <section className="max-w-6xl mx-auto px-4 py-14 md:py-20">
        <div className="mb-10">
          <div
            className="inline-flex items-center gap-1.5 text-[10px] font-roboto uppercase tracking-widest px-2.5 py-1 rounded-full mb-3 border"
            style={{
              background: `${ACCENT}15`,
              borderColor: `${ACCENT}40`,
              color: ACCENT,
            }}
          >
            <Icon name="Zap" size={10} />
            Процесс скупки
          </div>
          <h2 className="font-oswald font-bold text-3xl md:text-4xl uppercase">
            Как мы{" "}
            <span style={{ color: ACCENT }}>покупаем</span>
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PROCESS.map((p, i) => (
            <div
              key={i}
              className="relative bg-[#0D0D0D] border border-white/[0.06] p-5 rounded-xl"
            >
              {i < PROCESS.length - 1 && (
                <div className="hidden lg:block absolute top-8 -right-2 z-10">
                  <Icon
                    name="ArrowRight"
                    size={14}
                    style={{ color: `${ACCENT}50` }}
                  />
                </div>
              )}
              <div
                className="font-oswald font-black text-4xl leading-none mb-3"
                style={{ color: `${ACCENT}22` }}
              >
                {p.step}
              </div>
              <div className="font-oswald font-bold text-base mb-1.5">
                {p.title}
              </div>
              <div className="font-roboto text-white/50 text-sm leading-relaxed">
                {p.text}
              </div>
            </div>
          ))}
        </div>

        {/* Почему мы */}
        <div className="mt-8 grid sm:grid-cols-3 gap-4">
          {WHY_US.map((w, i) => (
            <div
              key={i}
              className="p-5 rounded-xl flex gap-3 border"
              style={{
                background: `linear-gradient(135deg, ${ACCENT}12 0%, transparent 100%)`,
                borderColor: `${ACCENT}25`,
              }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${ACCENT}20` }}
              >
                <Icon name={w.icon} size={18} style={{ color: ACCENT }} />
              </div>
              <div>
                <div className="font-oswald font-bold text-sm mb-1">
                  {w.title}
                </div>
                <div className="font-roboto text-white/50 text-xs leading-relaxed">
                  {w.text}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ СОСТОЯНИЕ И ЦЕНА ══ */}
      <section className="max-w-6xl mx-auto px-4 py-14 md:py-20">
        <div className="mb-10">
          <div
            className="inline-flex items-center gap-1.5 text-[10px] font-roboto uppercase tracking-widest px-2.5 py-1 rounded-full mb-3 border"
            style={{
              background: `${ACCENT}15`,
              borderColor: `${ACCENT}40`,
              color: ACCENT,
            }}
          >
            <Icon name="Star" size={10} />
            Оценка сохранности
          </div>
          <h2 className="font-oswald font-bold text-3xl md:text-4xl uppercase">
            Состояние{" "}
            <span style={{ color: ACCENT }}>определяет цену</span>
          </h2>
        </div>

        <div className="flex flex-col gap-3">
          {CONDITION_GRADES.map((g, i) => (
            <div
              key={i}
              className="flex items-center gap-4 bg-[#0D0D0D] border border-white/[0.06] px-5 py-4 rounded-xl"
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center shrink-0 font-oswald font-black text-sm"
                style={{ background: `${g.color}20`, color: g.color, border: `2px solid ${g.color}40` }}
              >
                {g.grade}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-oswald font-bold text-base mb-0.5" style={{ color: g.color }}>
                  {g.label}
                </div>
                <div className="font-roboto text-white/50 text-sm leading-relaxed">
                  {g.desc}
                </div>
              </div>
              <div
                className="font-oswald font-bold text-sm text-right shrink-0 ml-4 whitespace-nowrap"
                style={{ color: g.color }}
              >
                {g.modifier}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ РЕАЛЬНЫЕ ИСТОРИИ ══ */}
      <section
        className="py-14 md:py-20 border-t"
        style={{ borderColor: `${ACCENT}15`, background: "#0A0A0A" }}
      >
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-10">
            <div
              className="inline-flex items-center gap-1.5 text-[10px] font-roboto uppercase tracking-widest px-2.5 py-1 rounded-full mb-3 border"
              style={{
                background: `${ACCENT}15`,
                borderColor: `${ACCENT}40`,
                color: ACCENT,
              }}
            >
              <Icon name="Users" size={10} />
              Истории клиентов
            </div>
            <h2 className="font-oswald font-bold text-3xl md:text-4xl uppercase">
              Реальные истории{" "}
              <span style={{ color: ACCENT }}>наших клиентов</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {STORIES.map((s, i) => (
              <div
                key={i}
                className="bg-[#0D0D0D] border border-white/[0.06] p-6 rounded-xl flex flex-col gap-4"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="font-roboto text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full font-bold"
                    style={{ background: `${s.tagColor}20`, color: s.tagColor, border: `1px solid ${s.tagColor}40` }}
                  >
                    {s.tag}
                  </span>
                  <span className="font-oswald font-bold text-sm text-white/70">
                    {s.title}
                  </span>
                </div>
                <p className="font-roboto text-white/60 text-sm leading-relaxed italic flex-1">
                  «{s.quote}»
                </p>
                <div>
                  <div
                    className="font-oswald font-black text-3xl"
                    style={{ color: "#fbbf24" }}
                  >
                    {s.result}
                  </div>
                  <div className="font-roboto text-white/35 text-xs mt-1 leading-relaxed">
                    {s.detail}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ ЧАСТЫЕ ВОПРОСЫ ══ */}
      <section className="max-w-6xl mx-auto px-4 py-14 md:py-20">
        <div className="mb-10">
          <div
            className="inline-flex items-center gap-1.5 text-[10px] font-roboto uppercase tracking-widest px-2.5 py-1 rounded-full mb-3 border"
            style={{
              background: `${ACCENT}15`,
              borderColor: `${ACCENT}40`,
              color: ACCENT,
            }}
          >
            <Icon name="HelpCircle" size={10} />
            FAQ
          </div>
          <h2 className="font-oswald font-bold text-3xl md:text-4xl uppercase">
            Частые{" "}
            <span style={{ color: ACCENT }}>вопросы</span>
          </h2>
        </div>

        <div className="flex flex-col gap-2">
          {FAQ_ITEMS.map((item, i) => {
            const isOpen = activeFaq === i;
            return (
              <div
                key={i}
                className="bg-[#0D0D0D] border rounded-xl overflow-hidden transition-colors"
                style={{ borderColor: isOpen ? `${ACCENT}40` : "rgba(255,255,255,0.06)" }}
              >
                <button
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                  onClick={() => setActiveFaq(isOpen ? null : i)}
                >
                  <span className="font-oswald font-bold text-base leading-snug">
                    {item.q}
                  </span>
                  <span
                    className="shrink-0 transition-transform duration-300"
                    style={{
                      color: ACCENT,
                      transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                    }}
                  >
                    <Icon name="ChevronDown" size={18} />
                  </span>
                </button>
                {isOpen && (
                  <div className="px-5 pb-5">
                    <p className="font-roboto text-white/55 text-sm leading-relaxed">
                      {item.a}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ══ CTA БЛОК ══ */}
      <section
        className="relative overflow-hidden border-t py-14 md:py-20"
        style={{
          borderColor: `${ACCENT}15`,
          background: "#0A0A0A",
        }}
      >
        <div
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl pointer-events-none"
          style={{ background: `${ACCENT}10` }}
        />
        <div className="relative max-w-2xl mx-auto px-4 text-center">
          <div className="font-oswald font-black text-3xl md:text-5xl uppercase mb-3">
            Есть фарфор?
            <br />
            <span style={{ color: ACCENT }}>Оценим бесплатно</span>
          </div>
          <p className="font-roboto text-white/50 text-sm md:text-base mb-8 leading-relaxed">
            Пришлите фото — ответим быстро. Или приходите в офис —
            осмотр и оценка полностью бесплатны.
          </p>

          {!ctaSent ? (
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="tel"
                value={ctaPhone}
                onChange={(e) => setCtaPhone(e.target.value)}
                placeholder="+7 (999) 000-00-00"
                className="flex-1 bg-[#111] border border-[#333] text-white px-4 py-3 font-roboto text-sm focus:outline-none transition-colors placeholder:text-white/20"
                onFocus={(e) =>
                  ((e.currentTarget as HTMLInputElement).style.borderColor =
                    `${ACCENT}70`)
                }
                onBlur={(e) =>
                  ((e.currentTarget as HTMLInputElement).style.borderColor =
                    "#333")
                }
              />
              <button
                onClick={handleCtaSend}
                className="font-oswald font-bold text-sm uppercase px-6 py-3 transition-colors whitespace-nowrap flex items-center gap-2"
                style={{ background: ACCENT, color: "#000" }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.background =
                    "#93c5fd")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.background =
                    ACCENT)
                }
              >
                <Icon name="Send" size={15} />
                Перезвоните мне
              </button>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-6 py-3 rounded-full font-roboto text-sm">
              <Icon name="CheckCircle" size={16} />
              Перезвоним в течение 30 минут!
            </div>
          )}

          <div className="mt-4 flex items-center justify-center gap-4 flex-wrap">
            <a
              href="tel:+79929990333"
              className="font-roboto text-white/40 text-sm transition-colors flex items-center gap-1.5"
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLAnchorElement).style.color = ACCENT)
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLAnchorElement).style.color =
                  "rgba(255,255,255,0.4)")
              }
            >
              <Icon name="Phone" size={13} /> +7 (992) 999-03-33
            </a>
            <span className="text-white/15">·</span>
            <a
              href="https://t.me/skupka24"
              target="_blank"
              rel="noreferrer"
              className="font-roboto text-white/40 text-sm transition-colors flex items-center gap-1.5"
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLAnchorElement).style.color = ACCENT)
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLAnchorElement).style.color =
                  "rgba(255,255,255,0.4)")
              }
            >
              <Icon name="Send" size={13} /> Telegram
            </a>
          </div>
        </div>
      </section>

      {/* ══ ФОРМА-МОДАЛ ══ */}
      {formOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setFormOpen(false)}
        >
          <div
            className="bg-[#111] rounded-2xl p-6 max-w-sm w-full border"
            style={{ borderColor: `${ACCENT}30` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="font-oswald font-bold text-lg uppercase">
                Оценить фарфор
              </div>
              <button
                onClick={() => setFormOpen(false)}
                className="text-white/30 hover:text-white transition-colors"
              >
                <Icon name="X" size={18} />
              </button>
            </div>

            {!sent ? (
              <>
                <p className="font-roboto text-white/50 text-sm mb-4">
                  Оставьте номер — перезвоним в течение 30 минут и
                  проконсультируем бесплатно.
                </p>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+7 (999) 000-00-00"
                  className="w-full bg-[#0A0A0A] border border-[#333] text-white px-4 py-3 rounded-lg font-roboto text-sm focus:outline-none mb-3 placeholder:text-white/20 transition-colors"
                  onFocus={(e) =>
                    ((e.currentTarget as HTMLInputElement).style.borderColor =
                      `${ACCENT}70`)
                  }
                  onBlur={(e) =>
                    ((e.currentTarget as HTMLInputElement).style.borderColor =
                      "#333")
                  }
                />
                <button
                  onClick={handleModalSend}
                  className="w-full font-oswald font-bold text-sm uppercase py-3 rounded-lg transition-colors"
                  style={{ background: ACCENT, color: "#000" }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLButtonElement).style.background =
                      "#93c5fd")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLButtonElement).style.background =
                      ACCENT)
                  }
                >
                  Перезвоните мне
                </button>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="w-12 h-12 bg-emerald-500/15 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Icon
                    name="CheckCircle"
                    size={24}
                    className="text-emerald-400"
                  />
                </div>
                <div className="font-oswald font-bold text-base mb-1">
                  Заявка принята!
                </div>
                <div className="font-roboto text-white/45 text-sm">
                  Перезвоним в течение 30 минут
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <ContactsFooter scrollTo={() => {}} />

      <style>{`
        @keyframes blueShimmer {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
      `}</style>
    </div>
  );
}