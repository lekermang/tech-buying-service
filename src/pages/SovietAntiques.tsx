import { useState } from "react";
import Icon from "@/components/ui/icon";
import Header from "@/components/skupka/Header";
import ContactsFooter from "@/components/skupka/ContactsFooter";

const HERO_IMG =
  "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/2d93ca66-c5fe-42a7-8b1c-221370af02ff.jpg";

const ACCENT = "#ef4444";

interface AntiqueItem {
  name: string;
  period: string;
  price: string;
  note: string;
}

interface AntiqueCategory {
  era: string;
  icon: string;
  color: string;
  items: AntiqueItem[];
}

const ANTIQUES: AntiqueCategory[] = [
  {
    era: "Ордена и медали",
    icon: "🎖️",
    color: "#ef4444",
    items: [
      {
        name: "Орден Красного Знамени (I тип, 1918–1924)",
        period: "1918–1924",
        price: "от 40 000 ₽",
        note: "Первый советский орден, серебро с горячей эмалью",
      },
      {
        name: "Орден Ленина",
        period: "1930-е — 1991",
        price: "от 30 000 ₽",
        note: "Высшая советская награда, золото и платина",
      },
      {
        name: "Орден Отечественной войны I ст.",
        period: "1942–1945",
        price: "от 8 000 ₽",
        note: "Военная награда, золото — ранние выпуски дороже",
      },
      {
        name: "Орден Трудового Красного Знамени",
        period: "1928–1991",
        price: "от 3 000 ₽",
        note: "Массовая награда, но ранние тиражи ценные",
      },
      {
        name: "Звезда Героя Социалистического Труда",
        period: "1938–1991",
        price: "от 50 000 ₽",
        note: "Платина — одна из редчайших советских наград",
      },
      {
        name: "Медаль «За отвагу» ранних выпусков",
        period: "1938–1943",
        price: "от 5 000 ₽",
        note: "Квадратная подвеска — признак раннего выпуска",
      },
    ],
  },
  {
    era: "Авангард и плакаты",
    icon: "🎨",
    color: "#f97316",
    items: [
      {
        name: "Конструктивистский плакат (оригинал)",
        period: "1920–1930",
        price: "от 20 000 ₽",
        note: "Родченко, Лисицкий, Клуцис — вершина коллекционного рынка",
      },
      {
        name: "Плакат РОСТА-Окна",
        period: "1919–1921",
        price: "от 50 000 ₽",
        note: "Маяковский, агитационные трафаретные плакаты",
      },
      {
        name: "Советский агитплакат (1930-е)",
        period: "1930–1940",
        price: "от 5 000 ₽",
        note: "Сталинская эпоха, соцреализм",
      },
      {
        name: "Авангардная книга-малотиражка",
        period: "1920–1930",
        price: "от 10 000 ₽",
        note: "Маяковский, Хлебников — футуристические издания",
      },
      {
        name: "Авангардная фотография (оригинальный отпечаток)",
        period: "1920–1930",
        price: "от 30 000 ₽",
        note: "Родченко, Игнатович — диагональные ракурсы",
      },
    ],
  },
  {
    era: "Фарфор и стекло",
    icon: "🏺",
    color: "#fb923c",
    items: [
      {
        name: "Агитационный фарфор ГФЗ",
        period: "1918–1925",
        price: "от 50 000 ₽",
        note: "Роспись с советскими лозунгами — мировая редкость",
      },
      {
        name: "Фарфоровые фигурки ЛФЗ",
        period: "1950–1960",
        price: "от 3 000 ₽",
        note: "Спортсмены, рабочие, балерины — массовые, но ценятся",
      },
      {
        name: "Советское цветное стекло (авангард)",
        period: "1920–1930",
        price: "от 10 000 ₽",
        note: "Конструктивистские формы Мухиной и Татлина",
      },
      {
        name: "Хрусталь советского периода",
        period: "1960–1980",
        price: "от 1 000 ₽",
        note: "Гусевский, Боровичский заводы",
      },
    ],
  },
  {
    era: "Мебель авангарда",
    icon: "🪑",
    color: "#f59e0b",
    items: [
      {
        name: "Мебель конструктивизма Родченко",
        period: "1920-е",
        price: "от 200 000 ₽",
        note: "Геометрические формы, минимализм — мировые аукционы",
      },
      {
        name: "Мебель советского ар-деко",
        period: "1930–1940",
        price: "от 50 000 ₽",
        note: "Сталинский ампир, монументальные формы",
      },
      {
        name: "Советская мебель 1950-х (стиляги)",
        period: "1950–1960",
        price: "от 20 000 ₽",
        note: "Послевоенный дизайн, характерные тонкие ножки",
      },
      {
        name: "Советская «стенка» и буфет",
        period: "1960–1970",
        price: "от 5 000 ₽",
        note: "Брежневская эпоха — встречается в наследстве",
      },
    ],
  },
];

const AUTHENTICITY = [
  {
    icon: "Calendar",
    title: "Дата производства",
    text: "До 1950 года — значительно ценнее. Ищите дату на клейме, составе металла или типе подвески. Ранние выпуски в разы дороже поздних.",
  },
  {
    icon: "Stamp",
    title: "Клейма на орденах",
    text: "Номер на оборотной стороне, клеймо монетного двора, тип подвески — всё влияет на цену. Номер позволяет установить личность кавалера.",
  },
  {
    icon: "FileText",
    title: "Документы к награде",
    text: "Орденская книжка на имя — плюс 50% к цене. С боевой историей, фотографиями и архивными справками — ещё дороже.",
  },
  {
    icon: "User",
    title: "Автор плаката",
    text: "Оригинальный печатный плакат с именем художника стоит на порядок дороже репродукции. Родченко, Лисицкий — особый спрос.",
  },
  {
    icon: "Shield",
    title: "Состояние",
    text: "Ордена без сколов эмали, медали без царапин, плакаты без разрывов и пятен — максимальная цена. Любые дефекты снижают стоимость.",
  },
  {
    icon: "History",
    title: "Провенанс",
    text: "Семейный архив с фотографиями, где виден предмет, — подтверждение подлинности. Документы на имя удваивают ценность.",
  },
];

const PROCESS = [
  {
    step: "01",
    title: "Фото или визит",
    text: "Пришлите фото предмета (лицо, оборот, клейма, документы) или привезите лично в офис",
  },
  {
    step: "02",
    title: "Предварительная оценка",
    text: "В течение 2 часов дадим ориентировочную стоимость по фото без каких-либо обязательств",
  },
  {
    step: "03",
    title: "Экспертиза на месте",
    text: "Проверяем клеймо, состав металла, эмаль, документы — определяем тип и период выпуска",
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
    title: "Знаем рынок",
    text: "Следим за аукционами Литфонд, Sotheby's по советскому искусству — платим реальную рыночную цену",
  },
  {
    icon: "Package",
    title: "Покупаем всё",
    text: "Один орден или целая коллекция — не важно. Берём любые объёмы без минимального порога",
  },
  {
    icon: "Banknote",
    title: "Оплата в день",
    text: "Наличными или переводом сразу после осмотра. Без «перезвоним завтра»",
  },
];

const STATS = [
  { val: "70+", lbl: "лет советской эпохи" },
  { val: "от 200 ₽", lbl: "минимальная выкупная цена" },
  { val: "до 1 000 000 ₽", lbl: "за предмет" },
  { val: "за день", lbl: "оценка и оплата" },
];

const SOVIET_PRICES = [
  {
    category: "Ордена и медали",
    icon: "🎖️",
    color: "#ef4444",
    items: [
      { name: "Орден Ленина (ранний, 1930–45)", price: "80 000–150 000 ₽", hot: true },
      { name: "Орден Красного Знамени (1918–24, I тип)", price: "40 000–100 000 ₽", hot: true },
      { name: "Звезда Героя Соц. Труда", price: "50 000–120 000 ₽", hot: false },
      { name: "Орден Октябрьской Революции", price: "20 000–60 000 ₽", hot: false },
      { name: "Орден Красной Звезды", price: "15 000–50 000 ₽", hot: false },
      { name: "Медаль «За отвагу» (ранний выпуск)", price: "5 000–20 000 ₽", hot: false },
    ],
  },
  {
    category: "Плакаты и графика",
    icon: "🎨",
    color: "#f97316",
    items: [
      { name: "Плакат Родченко (оригинал)", price: "100 000–500 000 ₽", hot: true },
      { name: "Плакат РОСТА-Окна Маяковского", price: "50 000–200 000 ₽", hot: true },
      { name: "Авангардный плакат 1920-х (оригинал)", price: "20 000–100 000 ₽", hot: false },
      { name: "Агитплакат 1930–40-х (оригинал)", price: "5 000–30 000 ₽", hot: false },
      { name: "Советский киноплакат 1950–60-х", price: "3 000–20 000 ₽", hot: false },
    ],
  },
  {
    category: "Агитационный фарфор",
    icon: "🏺",
    color: "#fb923c",
    items: [
      { name: "Тарелка с портретом Ленина (1924)", price: "100 000–300 000 ₽", hot: true },
      { name: "Агитфарфор ГФЗ 1920–22 гг.", price: "200 000–500 000 ₽", hot: true },
      { name: "Чашка с лозунгом (1920-е)", price: "80 000–200 000 ₽", hot: false },
      { name: "Советский фарфор ЛФЗ (1950–60-е)", price: "3 000–50 000 ₽", hot: false },
    ],
  },
  {
    category: "Мебель и предметы",
    icon: "🪑",
    color: "#f59e0b",
    items: [
      { name: "Мебель конструктивизма (1920-е)", price: "100 000–500 000 ₽", hot: true },
      { name: "Мебель сталинского ампира (1930–40-е)", price: "50 000–200 000 ₽", hot: false },
      { name: "Советский сервант / буфет 1950–60-х", price: "20 000–80 000 ₽", hot: false },
      { name: "Советские значки (коллекция 200+)", price: "30 000–100 000 ₽", hot: false },
    ],
  },
];

const SOVIET_STORIES = [
  {
    title: "Плакат с чердака",
    tag: "Авангард 1920-х",
    tagColor: "#f97316",
    quote:
      "Дед был художником в 1920-е. После смерти нашли папку с оригинальными плакатами. Думали, это просто старые бумаги.",
    result: "320 000 ₽",
    detail:
      "Три плаката Лисицкого 1923–1925 годов. Оригинальные отпечатки на старой бумаге. Редчайшая находка.",
  },
  {
    title: "Ордена прадеда",
    tag: "ВОВ",
    tagColor: "#ef4444",
    quote:
      "Прадед прошёл всю войну. Ордена лежали в шкатулке 70 лет. Решили узнать, сколько они стоят.",
    result: "185 000 ₽",
    detail:
      "Орден Ленина (1943), два ордена Красной Звезды + боевые медали с документами к наградам.",
  },
  {
    title: "Стул с чёрно-белой фото",
    tag: "Конструктивизм",
    tagColor: "#f59e0b",
    quote:
      "На семейной фото 1928 года дед сидит на необычном стуле. Стул сохранился. Решили проверить у антикваров.",
    result: "240 000 ₽",
    detail:
      "Стул конструктивизма, предположительно работы мастерских ВХУТЕМАСа. Фото подтвердило провенанс.",
  },
];

const SOVIET_FAQ = [
  {
    q: "Значки СССР — это реально деньги?",
    a: "Отдельные значки стоят 200–5 000 ₽. Но тематическая коллекция 200+ штук — это уже 30 000–100 000 ₽. Особенно ценятся значки 1930–50-х годов, значки ОСОАВИАХИМ, ГТО, авиационные и военные серии.",
  },
  {
    q: "Плакат 1930-х стоит 100 000 ₽?",
    a: "Оригинальный авангардный плакат — да! Переиздания 1980–90-х годов стоят только 3 000–15 000 ₽. Отличие: оригинал на старой плотной бумаге, печать высокого давления, возраст краски. Нужна экспертиза.",
  },
  {
    q: "Как понять, настоящий ли орден?",
    a: "На оборотной стороне — номер и клеймо монетного двора. Ранние ордена (1930–40-е) тяжелее, серебро с эмалью. Подделки обычно легче, клейма нечёткие. Документы к ордену (орденская книжка) увеличивают цену на 50–100%.",
  },
  {
    q: "Мебель авангарда — много подделок?",
    a: "Да, около 70–80% продаваемой «мебели авангарда» — современные копии или реплики. Подлинник имеет естественный износ дерева, старые крепёжные элементы (шурупы, гвозди), характерные следы времени. Лучшее подтверждение — старые фото с предметом.",
  },
  {
    q: "Берёте ли советские деньги и монеты?",
    a: "Да! Монеты СССР 1921–1957 годов — активный рынок. Серебро 1920-х стоит 500–10 000 ₽ за монету. Редкие разновидности 1930-х доходят до 50 000 ₽. Боны (бумажные деньги) первых лет советской власти — 500–30 000 ₽.",
  },
];

export default function SovietAntiques() {
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

  const activeCategory = ANTIQUES[activeTab];

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <Header scrollTo={() => {}} />

      {/* ══ HERO ══ */}
      <section className="relative min-h-[60vh] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={HERO_IMG}
            alt="Советский антиквариат"
            className="w-full h-full object-cover object-center opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-[#080808]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#080808]/80 via-transparent to-transparent" />
        </div>

        {/* Красные искры */}
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
            <Icon name="Star" size={11} />
            Скупка антиквариата · Скупка24
          </div>

          <h1 className="font-oswald font-black text-4xl md:text-6xl lg:text-7xl uppercase leading-none mb-2">
            СОВЕТСКИЙ
          </h1>
          <h1 className="font-oswald font-black text-4xl md:text-6xl lg:text-7xl uppercase leading-none mb-4">
            <span
              style={{
                background:
                  "linear-gradient(90deg,#7f1d1d,#dc2626,#ef4444,#fca5a5,#ef4444,#dc2626,#7f1d1d)",
                backgroundSize: "200% auto",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                animation: "redShimmer 3s linear infinite",
              }}
            >
              АНТИКВАРИАТ
            </span>
          </h1>

          <p className="font-roboto text-white/60 text-base md:text-lg max-w-xl mb-6 leading-relaxed">
            Покупаем ордена, плакаты, фарфор и мебель эпохи 1917–1991. Оценка
            за 24 часа — честная цена по аукционным результатам.
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setFormOpen(true)}
              className="inline-flex items-center gap-2 font-oswald font-bold text-sm uppercase tracking-wide px-6 py-3 transition-colors"
              style={{ background: ACCENT, color: "#fff" }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background =
                  "#dc2626")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background =
                  ACCENT)
              }
            >
              <Icon name="Phone" size={16} />
              Оценить вещи
            </button>
            <a
              href="#soviet"
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
      <section id="soviet" className="max-w-6xl mx-auto px-4 py-14 md:py-20">
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
            Цены ориентировочные — итоговая стоимость зависит от редкости,
            периода и сохранности
          </p>
        </div>

        {/* Табы */}
        <div className="flex flex-wrap gap-2 mb-6">
          {ANTIQUES.map((cat, i) => (
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
                    <div className="font-oswald font-bold text-sm text-white">
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

      {/* ══ КАК ОПРЕДЕЛИТЬ ЦЕННОСТЬ ══ */}
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
              <span style={{ color: ACCENT }}>ценность предмета</span>
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
                  className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
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

      {/* ══ ЧТО И СКОЛЬКО СТОИТ ══ */}
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
            <Icon name="Coins" size={10} />
            Актуальные цены
          </div>
          <h2 className="font-oswald font-bold text-3xl md:text-4xl uppercase">
            Что и сколько{" "}
            <span style={{ color: ACCENT }}>стоит</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {SOVIET_PRICES.map((cat, i) => (
            <div
              key={i}
              className="bg-[#0D0D0D] border border-white/[0.06] rounded-xl overflow-hidden"
              style={{ borderTopColor: cat.color, borderTopWidth: 2 }}
            >
              <div className="px-5 pt-5 pb-4 flex items-center gap-2 border-b border-white/[0.05]">
                <span className="text-xl leading-none">{cat.icon}</span>
                <span
                  className="font-oswald font-bold text-base"
                  style={{ color: cat.color }}
                >
                  {cat.category}
                </span>
              </div>
              <div className="p-5 flex flex-col gap-2.5">
                {cat.items.map((item, j) => (
                  <div
                    key={j}
                    className="flex items-start justify-between gap-3"
                  >
                    <span className="font-roboto text-white/60 text-sm leading-relaxed">
                      {item.name}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      {item.hot && (
                        <span
                          className="font-roboto text-[10px] px-1.5 py-0.5 rounded-full whitespace-nowrap"
                          style={{
                            background: `${ACCENT}20`,
                            color: ACCENT,
                            border: `1px solid ${ACCENT}40`,
                          }}
                        >
                          🔥 Горячий спрос
                        </span>
                      )}
                      <span
                        className="font-oswald font-bold text-sm whitespace-nowrap"
                        style={{ color: cat.color }}
                      >
                        {item.price}
                      </span>
                    </div>
                  </div>
                ))}
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
            {SOVIET_STORIES.map((s, i) => (
              <div
                key={i}
                className="bg-[#0D0D0D] border border-white/[0.06] p-6 rounded-xl flex flex-col gap-4"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="font-roboto text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full font-bold"
                    style={{
                      background: `${s.tagColor}20`,
                      color: s.tagColor,
                      border: `1px solid ${s.tagColor}40`,
                    }}
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
                    style={{ color: ACCENT }}
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
          {SOVIET_FAQ.map((item, i) => {
            const isOpen = activeFaq === i;
            return (
              <div
                key={i}
                className="bg-[#0D0D0D] border rounded-xl overflow-hidden transition-colors"
                style={{
                  borderColor: isOpen
                    ? `${ACCENT}40`
                    : "rgba(255,255,255,0.06)",
                }}
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
            Есть советские вещи?
            <br />
            <span style={{ color: ACCENT }}>Оценим за 24 часа</span>
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
                style={{ background: ACCENT, color: "#fff" }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.background =
                    "#dc2626")
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
                Оценить вещи
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
                  style={{ background: ACCENT, color: "#fff" }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLButtonElement).style.background =
                      "#dc2626")
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
        @keyframes redShimmer {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
      `}</style>
    </div>
  );
}