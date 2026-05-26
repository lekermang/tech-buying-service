import { useState } from "react";
import Icon from "@/components/ui/icon";
import Header from "@/components/skupka/Header";
import ContactsFooter from "@/components/skupka/ContactsFooter";

const HERO_IMG =
  "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/cb78bd34-b88a-42fd-9a35-072ba558015a.jpg";

interface CoinItem {
  name: string;
  period: string;
  price: string;
  note: string;
}

interface CoinCategory {
  era: string;
  icon: string;
  color: string;
  items: CoinItem[];
}

const COINS: CoinCategory[] = [
  {
    era: "Киевская Русь",
    icon: "🏰",
    color: "#e2c96e",
    items: [
      {
        name: "Злотник Владимира I",
        period: "X–XI в.",
        price: "от 5 000 000 ₽",
        note: "Первые русские золотые монеты — крайняя редкость",
      },
      {
        name: "Сребреник Ярослава Мудрого",
        period: "XI в.",
        price: "от 1 000 000 ₽",
        note: "Серебряные монеты золотого века Киева",
      },
      {
        name: "Монеты Святополка II",
        period: "XI в.",
        price: "от 500 000 ₽",
        note: "Около 50–100 известных экземпляров",
      },
    ],
  },
  {
    era: "Золотая Орда",
    icon: "🌙",
    color: "#c084fc",
    items: [
      {
        name: "Динар Берке-хана",
        period: "1256–1266",
        price: "от 5 000 ₽",
        note: "Арабские надписи, мест находок — по всей России",
      },
      {
        name: "Монеты Дмитрия Донского",
        period: "1359–1389",
        price: "от 10 000 ₽",
        note: "Период освобождения от ига",
      },
      {
        name: "Чешуйки Московского царства",
        period: "XIV–XVII в.",
        price: "от 1 000 ₽",
        note: "Массовые монеты средневековой Руси",
      },
    ],
  },
  {
    era: "Московское государство",
    icon: "⚔️",
    color: "#60a5fa",
    items: [
      {
        name: "Монеты Ивана III",
        period: "1462–1505",
        price: "от 8 000 ₽",
        note: "Символ освобождения от Орды",
      },
      {
        name: "Монеты Ивана IV Грозного",
        period: "1547–1584",
        price: "от 5 000 ₽",
        note: "Первый двуглавый орёл на монетах",
      },
      {
        name: "Копейки Смутного времени",
        period: "1598–1613",
        price: "от 3 000 ₽",
        note: "Редкая эпоха, монеты нескольких «царей»",
      },
      {
        name: "Монеты Петра I",
        period: "1682–1725",
        price: "от 2 000 ₽",
        note: "Первая механизированная чеканка, европейский стиль",
      },
    ],
  },
  {
    era: "Российская Империя",
    icon: "👑",
    color: "#FFD700",
    items: [
      {
        name: "Золотые империалы Екатерины II",
        period: "1762–1796",
        price: "от 15 000 ₽",
        note: "Золото 917 пробы, портрет императрицы",
      },
      {
        name: "Монеты Павла I",
        period: "1796–1801",
        price: "от 5 000 ₽",
        note: "Только 4 года правления — крайне редкие",
      },
      {
        name: "Платиновые монеты Александра III",
        period: "1881–1894",
        price: "от 50 000 ₽",
        note: "Платина — всего ~3 000 экземпляров",
      },
      {
        name: "Золото Николая II",
        period: "1894–1917",
        price: "от 10 000 ₽",
        note: "Последний император — огромный коллекционный спрос",
      },
      {
        name: "Платиновые монеты Николая II",
        period: "1894–1917",
        price: "от 80 000 ₽",
        note: "Редчайшие: 10 рублей платиной до 250 000 ₽",
      },
    ],
  },
];

const AUTHENTICITY = [
  {
    icon: "Scale",
    title: "Вес и размер",
    text: "Каждая монета имеет строгий стандарт. Отклонение более 3% — серьёзный сигнал для проверки подлинности.",
  },
  {
    icon: "Search",
    title: "Клейма и надписи",
    text: "Изучаем шрифт легенды, портрет, герб — у каждой эпохи свои особенности. Подделки часто не выдерживают детального осмотра.",
  },
  {
    icon: "Microscope",
    title: "Металлографический анализ",
    text: "Определяем состав сплава. Золото Империи — 917 проба, серебро — 875. Любое отклонение — повод насторожиться.",
  },
  {
    icon: "BookOpen",
    title: "Сравнение с каталогами",
    text: "Биткин, Узденников, Корос — базовые российские нумизматические каталоги. Сверяем каждый экземпляр досконально.",
  },
  {
    icon: "Award",
    title: "Патина и гурт",
    text: "Подлинная патина не удаляется без следа. Гурт — уникальный паспорт монеты, несущий информацию о месте чеканки.",
  },
  {
    icon: "History",
    title: "Провенанс",
    text: "Коллекции с историей стоят на 30–50% дороже аналогов без документов. Старые аукционные лоты — дополнительная гарантия.",
  },
];

const PROCESS = [
  {
    step: "01",
    title: "Фото или визит",
    text: "Пришлите фото монеты (аверс, реверс, гурт) в мессенджер или привезите лично в офис",
  },
  {
    step: "02",
    title: "Предварительная оценка",
    text: "В течение 2 часов дадим ориентировочную стоимость по фото без обязательств",
  },
  {
    step: "03",
    title: "Экспертиза на месте",
    text: "При визите проводим полную проверку подлинности и финальную оценку по каталогам",
  },
  {
    step: "04",
    title: "Оплата в день обращения",
    text: "Платим наличными или переводом сразу — без задержек, торгов и бюрократии",
  },
];

const WHY_US = [
  {
    icon: "BadgeCheck",
    title: "Честная цена",
    text: "Оцениваем по аукционам Wolmar, ЦФА и международным базам — никакого занижения",
  },
  {
    icon: "Banknote",
    title: "Наличные сразу",
    text: "Деньги в день визита, без ожидания и согласований",
  },
  {
    icon: "Lock",
    title: "Анонимность",
    text: "Не спрашиваем историю коллекции. Полная конфиденциальность сделки",
  },
];

const COIN_PRICES = [
  {
    era: "Киевская Русь",
    color: "#e2c96e",
    items: [
      { name: "Злотник Владимира I", price: "от 5 000 000 ₽", hot: true },
      { name: "Сребреник Ярослава Мудрого", price: "от 1 000 000 ₽", hot: true },
      { name: "Монеты Святополка II", price: "от 500 000 ₽", hot: false },
    ],
  },
  {
    era: "Золотая Орда и Московское царство",
    color: "#c084fc",
    items: [
      { name: "Динар Берке-хана (1256–1266)", price: "от 5 000 ₽", hot: false },
      { name: "Монеты Дмитрия Донского", price: "от 10 000 ₽", hot: false },
      { name: "Монеты Ивана IV Грозного", price: "от 5 000 ₽", hot: false },
      { name: "Копейки Смутного времени", price: "от 3 000 ₽", hot: false },
    ],
  },
  {
    era: "Петровская эпоха",
    color: "#60a5fa",
    items: [
      { name: "Монеты Петра I (обычные)", price: "от 2 000 ₽", hot: false },
      { name: "Ефимки Петра I", price: "от 10 000 ₽", hot: false },
      { name: "Монеты 1700 года (редкие)", price: "от 50 000 ₽", hot: true },
      { name: "Пробные монеты Петра I", price: "от 30 000 ₽", hot: true },
    ],
  },
  {
    era: "Российская Империя",
    color: "#FFD700",
    items: [
      { name: "Золотые империалы Екатерины II", price: "от 15 000 ₽", hot: false },
      { name: "Монеты Павла I (редкие!)", price: "от 5 000 ₽", hot: true },
      { name: "Платиновые монеты Александра III", price: "от 50 000 ₽", hot: true },
      { name: "Платина Николая II (10 рублей)", price: "от 80 000 ₽", hot: true },
      { name: "Золото Николая II (обычные)", price: "от 10 000 ₽", hot: false },
    ],
  },
];

const COIN_STORIES = [
  {
    title: "Платина Николая II в кошельке деда",
    tag: "Николай II",
    tagColor: "#FFD700",
    quote:
      "Дед хранил «старую монету» в кошельке на удачу. После его смерти мы решили узнать, что это такое.",
    result: "220 000 ₽",
    detail:
      "Платиновый 6 рублей Николая II (1898), отличная сохранность. Настоящая удача!",
  },
  {
    title: "Монеты Павла I в наследстве",
    tag: "Павел I",
    tagColor: "#c084fc",
    quote:
      "Разбирая бабушкин комод, нашли жестяную банку с монетами. Некоторые выглядели очень старыми.",
    result: "380 000 ₽",
    detail:
      "12 монет эпохи Павла I (1796–1801), серебро. Редкий набор — монеты чеканились только 4 года.",
  },
  {
    title: "Сребреник на огороде",
    tag: "Киевская Русь",
    tagColor: "#e2c96e",
    quote:
      "Копали огород в Смоленской области — лопата наткнулась на что-то твёрдое. Оказалась монета.",
    result: "650 000 ₽",
    detail:
      "Сребреник XI века. Требовал осторожной чистки. Был передан в музей — выплата от частного коллекционера.",
  },
];

const COIN_FAQ = [
  {
    q: "Как понять, что монета ценная, а не просто старая?",
    a: "Возраст — один из факторов, но не единственный. Ценность определяется: редкостью тиража, состоянием (без чистки!), наличием редких разновидностей и исторической значимостью. Например, монеты Павла I (1796–1801) редки из-за короткого правления, а платиновые монеты ценны из-за материала. Лучший способ — принести на оценку.",
  },
  {
    q: "Нашёл монету металлодетектором — это законно?",
    a: "Поиск монет без разрешения на исторических землях запрещён (ст. 243.2 УК РФ). Монеты, найденные на своём участке или до принятия закона, продавать можно. Мы не задаём лишних вопросов о происхождении монет из частных коллекций и наследства.",
  },
  {
    q: "Монету почистили — это снизило цену?",
    a: "Да, чистка — главная ошибка! Неправильная чистка необратимо разрушает патину и царапает металл. Профессиональная чистка у нумизмата (2 000–10 000 ₽) может сохранить или повысить цену. Никогда не чистите монеты зубной пастой, уксусом или содой.",
  },
  {
    q: "Есть ли у вас минимальная сумма выкупа?",
    a: "Нет. Мы выкупаем от одной монеты стоимостью 500 ₽ до коллекций на миллионы. Но оценку проводим только при визите — удалённо по фото даём только ориентировочную стоимость.",
  },
  {
    q: "Что значит «разновидность» монеты и почему она дороже?",
    a: "Разновидность — это монета того же года и номинала, но с мелкими отличиями: другая форма орла, число перьев, положение букв. Некоторые разновидности чеканились тысячами, другие — единицами. Редкая разновидность рубля Николая II может стоить в 10 раз дороже обычной той же даты.",
  },
];

const STATS = [
  { val: "1 000+", lbl: "лет истории" },
  { val: "от 1 000 ₽", lbl: "минимальная выкупная цена" },
  { val: "до 5 000 000 ₽", lbl: "за одну монету" },
  { val: "оплата", lbl: "в день визита" },
];

export default function RussianCoins() {
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

  const activeCategory = COINS[activeTab];

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <Header scrollTo={() => {}} />

      {/* ══ HERO ══ */}
      <section className="relative min-h-[60vh] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={HERO_IMG}
            alt="Царские монеты России"
            className="w-full h-full object-cover object-center opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-[#080808]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#080808]/80 via-transparent to-transparent" />
        </div>

        {/* Золотые частицы */}
        <div
          className="absolute top-10 right-[20%] w-1 h-1 rounded-full bg-[#FFD700] opacity-60 animate-pulse"
        />
        <div
          className="absolute top-24 right-[35%] w-0.5 h-0.5 rounded-full bg-[#FFD700] opacity-40 animate-pulse"
          style={{ animationDelay: "0.7s" }}
        />
        <div
          className="absolute top-16 right-[10%] w-1.5 h-1.5 rounded-full bg-[#FFD700]/30 animate-pulse"
          style={{ animationDelay: "1.4s" }}
        />
        <div
          className="absolute top-40 right-[50%] w-1 h-1 rounded-full bg-[#FFD700]/50 animate-pulse"
          style={{ animationDelay: "2.1s" }}
        />

        <div className="relative max-w-6xl mx-auto px-4 pb-14 pt-28">
          <div className="inline-flex items-center gap-2 bg-[#FFD700]/15 border border-[#FFD700]/40 text-[#FFD700] font-roboto text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full mb-4">
            <Icon name="Coins" size={11} />
            Скупка антиквариата · Скупка24
          </div>

          <h1 className="font-oswald font-black text-4xl md:text-6xl lg:text-7xl uppercase leading-none mb-2">
            ЦАРСКИЕ МОНЕТЫ
          </h1>
          <h1 className="font-oswald font-black text-4xl md:text-6xl lg:text-7xl uppercase leading-none mb-4">
            <span
              style={{
                background:
                  "linear-gradient(90deg,#7a5800,#c89b00,#FFD700,#fff7b0,#FFD700,#c89b00,#7a5800)",
                backgroundSize: "200% auto",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                animation: "goldShimmer 3s linear infinite",
              }}
            >
              РОССИЙСКОЙ ИМПЕРИИ
            </span>
          </h1>

          <p className="font-roboto text-white/60 text-base md:text-lg max-w-xl mb-6 leading-relaxed">
            Покупаем монеты Киевской Руси, Московского государства и
            Российской Империи. Оценка за 2 часа — честная цена по
            нумизматическим каталогам.
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setFormOpen(true)}
              className="inline-flex items-center gap-2 bg-[#FFD700] text-black font-oswald font-bold text-sm uppercase tracking-wide px-6 py-3 hover:bg-yellow-400 transition-colors"
            >
              <Icon name="Phone" size={16} />
              Оценить монету
            </button>
            <a
              href="#coins"
              className="inline-flex items-center gap-2 border border-white/20 text-white/70 font-roboto text-sm px-6 py-3 hover:border-[#FFD700]/50 hover:text-[#FFD700] transition-colors"
            >
              <Icon name="ChevronDown" size={16} />
              Таблица цен
            </a>
          </div>
        </div>
      </section>

      {/* ══ STATS ══ */}
      <section className="border-y border-[#FFD700]/10 bg-[#0A0A0A]">
        <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map((s) => (
            <div key={s.lbl} className="text-center">
              <div className="font-oswald font-black text-xl md:text-2xl text-[#FFD700]">
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
      <section id="coins" className="max-w-6xl mx-auto px-4 py-14 md:py-20">
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 bg-[#FFD700]/10 border border-[#FFD700]/30 text-[#FFD700] text-[10px] font-roboto uppercase tracking-widest px-2.5 py-1 rounded-full mb-3">
            <Icon name="Table" size={10} />
            Таблица цен
          </div>
          <h2 className="font-oswald font-bold text-3xl md:text-4xl uppercase">
            Что мы покупаем
          </h2>
          <p className="font-roboto text-white/45 text-sm mt-1">
            Цены ориентировочные — итоговая стоимость зависит от сохранности и
            редкости
          </p>
        </div>

        {/* Табы */}
        <div className="flex flex-wrap gap-2 mb-6">
          {COINS.map((cat, i) => (
            <button
              key={cat.era}
              onClick={() => setActiveTab(i)}
              className={`inline-flex items-center gap-2 px-4 py-2 font-roboto text-sm transition-all border ${
                activeTab === i
                  ? "border-[#FFD700]/60 bg-[#FFD700]/10 text-[#FFD700]"
                  : "border-white/10 bg-transparent text-white/50 hover:border-white/25 hover:text-white/75"
              }`}
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
                  Монета
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
                  className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors group"
                >
                  <td className="px-5 py-4">
                    <div className="font-oswald font-bold text-sm text-white group-hover:text-[#FFD700] transition-colors">
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
                        background: `${activeCategory.color}10`,
                      }}
                    >
                      {item.period}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className="font-oswald font-bold text-[#FFD700] text-sm whitespace-nowrap">
                      {item.price}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="font-roboto text-white/25 text-xs mt-3 text-right">
          * Итоговая цена определяется после осмотра монеты экспертом
        </p>
      </section>

      {/* ══ КАК ОПРЕДЕЛИТЬ ПОДЛИННОСТЬ ══ */}
      <section className="bg-[#0A0A0A] border-y border-white/5 py-14 md:py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-10">
            <div className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 text-white/50 text-[10px] font-roboto uppercase tracking-widest px-2.5 py-1 rounded-full mb-3">
              <Icon name="ShieldCheck" size={10} />
              Экспертиза
            </div>
            <h2 className="font-oswald font-bold text-3xl md:text-4xl uppercase">
              Как определить
              <br />
              <span className="text-[#FFD700]">подлинность</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {AUTHENTICITY.map((a, i) => (
              <div
                key={i}
                className="bg-[#0D0D0D] border border-white/[0.06] hover:border-[#FFD700]/20 transition-colors p-5 rounded-xl group"
              >
                <div className="w-9 h-9 rounded-lg bg-[#FFD700]/10 flex items-center justify-center mb-3 group-hover:bg-[#FFD700]/15 transition-colors">
                  <Icon name={a.icon} size={18} className="text-[#FFD700]" />
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
          <div className="inline-flex items-center gap-1.5 bg-[#FFD700]/10 border border-[#FFD700]/30 text-[#FFD700] text-[10px] font-roboto uppercase tracking-widest px-2.5 py-1 rounded-full mb-3">
            <Icon name="Zap" size={10} />
            Процесс скупки
          </div>
          <h2 className="font-oswald font-bold text-3xl md:text-4xl uppercase">
            Как мы <span className="text-[#FFD700]">покупаем</span>
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
                    className="text-[#FFD700]/30"
                  />
                </div>
              )}
              <div className="font-oswald font-black text-4xl text-[#FFD700]/15 leading-none mb-3">
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
              className="bg-gradient-to-br from-[#FFD700]/10 to-transparent border border-[#FFD700]/20 p-5 rounded-xl flex gap-3"
            >
              <div className="w-9 h-9 rounded-lg bg-[#FFD700]/15 flex items-center justify-center shrink-0">
                <Icon name={w.icon} size={18} className="text-[#FFD700]" />
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

      {/* ══ АКТУАЛЬНЫЕ ЦЕНЫ ══ */}
      <section className="bg-[#0A0A0A] border-y border-white/5 py-14 md:py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-10">
            <div className="inline-flex items-center gap-1.5 bg-[#FFD700]/10 border border-[#FFD700]/30 text-[#FFD700] text-[10px] font-roboto uppercase tracking-widest px-2.5 py-1 rounded-full mb-3">
              <Icon name="TrendingUp" size={10} />
              Актуальные цены
            </div>
            <h2 className="font-oswald font-bold text-3xl md:text-4xl uppercase">
              Сколько стоят{" "}
              <span className="text-[#FFD700]">ваши монеты</span>
            </h2>
            <p className="font-roboto text-white/45 text-sm mt-1">
              Ориентировочные цены выкупа — итоговая стоимость зависит от
              состояния и редкости
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {COIN_PRICES.map((group) => (
              <div
                key={group.era}
                className="bg-[#0D0D0D] border border-white/[0.07] rounded-xl overflow-hidden"
                style={{ borderTopColor: group.color, borderTopWidth: 2 }}
              >
                <div className="px-5 py-4 border-b border-white/[0.06]">
                  <span
                    className="font-oswald font-bold text-base"
                    style={{ color: group.color }}
                  >
                    {group.era}
                  </span>
                </div>
                <div className="divide-y divide-white/[0.04]">
                  {group.items.map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between px-5 py-3 hover:bg-white/[0.02] transition-colors"
                    >
                      <span className="font-roboto text-sm text-white/75">
                        {item.name}
                      </span>
                      <div className="flex items-center gap-2 shrink-0 ml-4">
                        <span className="font-oswald font-bold text-sm text-[#FFD700] whitespace-nowrap">
                          {item.price}
                        </span>
                        {item.hot && (
                          <span
                            className="text-xs leading-none"
                            title="Горячий спрос"
                          >
                            🔥
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ РЕАЛЬНЫЕ ИСТОРИИ ══ */}
      <section className="max-w-6xl mx-auto px-4 py-14 md:py-20">
        <div className="mb-10">
          <div className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 text-white/50 text-[10px] font-roboto uppercase tracking-widest px-2.5 py-1 rounded-full mb-3">
            <Icon name="BookOpen" size={10} />
            Реальные истории
          </div>
          <h2 className="font-oswald font-bold text-3xl md:text-4xl uppercase">
            Находки наших <span className="text-[#FFD700]">клиентов</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {COIN_STORIES.map((story) => (
            <div
              key={story.title}
              className="bg-[#0D0D0D] border border-white/[0.07] hover:border-[#FFD700]/20 transition-colors p-5 rounded-xl flex flex-col gap-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="font-oswald font-bold text-base leading-snug">
                  {story.title}
                </div>
                <span
                  className="shrink-0 font-roboto text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border whitespace-nowrap"
                  style={{
                    color: story.tagColor,
                    borderColor: `${story.tagColor}40`,
                    background: `${story.tagColor}12`,
                  }}
                >
                  {story.tag}
                </span>
              </div>

              <p className="font-roboto text-white/50 text-sm leading-relaxed italic flex-1">
                &laquo;{story.quote}&raquo;
              </p>

              <div className="border-t border-white/[0.07] pt-4">
                <div
                  className="font-oswald font-black text-2xl mb-1"
                  style={{ color: "#FFD700" }}
                >
                  {story.result}
                </div>
                <div className="font-roboto text-white/40 text-xs leading-relaxed">
                  {story.detail}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ ЧАСТЫЕ ВОПРОСЫ ══ */}
      <section className="bg-[#0A0A0A] border-y border-white/5 py-14 md:py-20">
        <div className="max-w-3xl mx-auto px-4">
          <div className="mb-10">
            <div className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 text-white/50 text-[10px] font-roboto uppercase tracking-widest px-2.5 py-1 rounded-full mb-3">
              <Icon name="HelpCircle" size={10} />
              FAQ
            </div>
            <h2 className="font-oswald font-bold text-3xl md:text-4xl uppercase">
              Частые <span className="text-[#FFD700]">вопросы</span>
            </h2>
          </div>

          <div className="flex flex-col gap-2">
            {COIN_FAQ.map((item, i) => {
              const isOpen = activeFaq === i;
              return (
                <div
                  key={i}
                  className="bg-[#0D0D0D] rounded-xl overflow-hidden transition-colors"
                  style={{
                    border: isOpen
                      ? "1px solid #FFD700"
                      : "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  <button
                    className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left group"
                    onClick={() => setActiveFaq(isOpen ? null : i)}
                  >
                    <span
                      className={`font-oswald font-bold text-sm transition-colors ${
                        isOpen ? "text-[#FFD700]" : "text-white group-hover:text-[#FFD700]"
                      }`}
                    >
                      {item.q}
                    </span>
                    <Icon
                      name={isOpen ? "ChevronUp" : "ChevronDown"}
                      size={16}
                      className={`shrink-0 transition-colors ${
                        isOpen ? "text-[#FFD700]" : "text-white/30"
                      }`}
                    />
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
        </div>
      </section>

      {/* ══ CTA БЛОК ══ */}
      <section className="relative overflow-hidden border-t border-[#FFD700]/10 bg-[#0A0A0A] py-14 md:py-20">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#FFD700]/8 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-2xl mx-auto px-4 text-center">
          <div className="font-oswald font-black text-3xl md:text-5xl uppercase mb-3">
            Есть монеты?
            <br />
            <span className="text-[#FFD700]">Оценим за 2 часа</span>
          </div>
          <p className="font-roboto text-white/50 text-sm md:text-base mb-8 leading-relaxed">
            Пришлите фото — ответим быстро. Или приходите в офис — оценка
            бесплатная.
          </p>

          {!ctaSent ? (
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="tel"
                value={ctaPhone}
                onChange={(e) => setCtaPhone(e.target.value)}
                placeholder="+7 (999) 000-00-00"
                className="flex-1 bg-[#111] border border-[#333] focus:border-[#FFD700]/60 text-white px-4 py-3 font-roboto text-sm focus:outline-none transition-colors placeholder:text-white/20"
              />
              <button
                onClick={handleCtaSend}
                className="bg-[#FFD700] text-black font-oswald font-bold text-sm uppercase px-6 py-3 hover:bg-yellow-400 transition-colors whitespace-nowrap flex items-center gap-2"
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
              className="font-roboto text-white/40 text-sm hover:text-[#FFD700] transition-colors flex items-center gap-1.5"
            >
              <Icon name="Phone" size={13} /> +7 (992) 999-03-33
            </a>
            <span className="text-white/15">·</span>
            <a
              href="https://t.me/skupka24"
              target="_blank"
              rel="noreferrer"
              className="font-roboto text-white/40 text-sm hover:text-[#FFD700] transition-colors flex items-center gap-1.5"
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
            className="bg-[#111] border border-[#FFD700]/25 rounded-2xl p-6 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="font-oswald font-bold text-lg uppercase">
                Оценить монету
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
                  className="w-full bg-[#0A0A0A] border border-[#333] focus:border-[#FFD700]/60 text-white px-4 py-3 rounded-lg font-roboto text-sm focus:outline-none mb-3 placeholder:text-white/20"
                />
                <button
                  onClick={handleModalSend}
                  className="w-full bg-[#FFD700] text-black font-oswald font-bold text-sm uppercase py-3 rounded-lg hover:bg-yellow-400 transition-colors"
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
        @keyframes goldShimmer {
          0% { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
      `}</style>
    </div>
  );
}