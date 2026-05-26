import { useState } from "react";
import Icon from "@/components/ui/icon";
import Header from "@/components/skupka/Header";
import ContactsFooter from "@/components/skupka/ContactsFooter";

const HERO_IMG =
  "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/0da20686-81b0-482f-b091-6913209c1edb.jpg";

const ACCENT = "#e2a84b";

interface IconItem {
  name: string;
  period: string;
  price: string;
  note: string;
}

interface IconCategory {
  era: string;
  icon: string;
  color: string;
  items: IconItem[];
}

const ICONS: IconCategory[] = [
  {
    era: "Иконы XVI–XVII в.",
    icon: "🏛️",
    color: "#e2a84b",
    items: [
      {
        name: "Новгородская школа",
        period: "XVI в.",
        price: "от 100 000 ₽",
        note: "Яркие краски, характерные лики — узнаваемый стиль",
      },
      {
        name: "Московская школа (школа Рублёва)",
        period: "XV–XVII в.",
        price: "от 150 000 ₽",
        note: "Высочайшее мастерство, золотые фоны",
      },
      {
        name: "Строгановская школа",
        period: "XVI–XVII в.",
        price: "от 200 000 ₽",
        note: "Миниатюрное письмо, тонкая прописка деталей",
      },
      {
        name: "Псковская школа",
        period: "XV–XVI в.",
        price: "от 80 000 ₽",
        note: "Экспрессивный стиль, редкие сюжеты",
      },
    ],
  },
  {
    era: "Иконы XVIII–XIX в.",
    icon: "⛪",
    color: "#f59e0b",
    items: [
      {
        name: "Домашний иконостас",
        period: "XVIII–XIX в.",
        price: "от 10 000 ₽",
        note: "Семейные иконы — часто находят в наследстве",
      },
      {
        name: "Путная икона (дорожная)",
        period: "XIX в.",
        price: "от 15 000 ₽",
        note: "Складная, в деревянном или металлическом киоте",
      },
      {
        name: "Праздничный чин",
        period: "XIX в.",
        price: "от 30 000 ₽",
        note: "Серия икон двунадесятых праздников",
      },
      {
        name: "Икона Богородицы",
        period: "XVIII–XIX в.",
        price: "от 20 000 ₽",
        note: "Казанская, Владимирская, Тихвинская — самые популярные",
      },
    ],
  },
  {
    era: "Иконы с окладом",
    icon: "💎",
    color: "#fbbf24",
    items: [
      {
        name: "Икона в серебряном окладе 84 пробы",
        period: "XIX в.",
        price: "от 50 000 ₽",
        note: "Клеймо московского или петербургского мастера",
      },
      {
        name: "Икона в позолоченном окладе",
        period: "XIX в.",
        price: "от 80 000 ₽",
        note: "Сканное или чеканное серебро с позолотой",
      },
      {
        name: "Икона с эмалевым окладом",
        period: "Конец XIX в.",
        price: "от 150 000 ₽",
        note: "Перегородчатая или выемчатая эмаль",
      },
      {
        name: "Икона с жемчужным убрусом",
        period: "XVIII–XIX в.",
        price: "от 300 000 ₽",
        note: "Вышивка жемчугом по окладу — редчайшая техника",
      },
      {
        name: "Икона Фаберже",
        period: "Конец XIX — нач. XX в.",
        price: "от 500 000 ₽",
        note: "Клеймо К. Фаберже — вершина коллекционной ценности",
      },
    ],
  },
  {
    era: "Иконы на металле",
    icon: "🔰",
    color: "#d97706",
    items: [
      {
        name: "Литая бронзовая икона",
        period: "XVIII–XIX в.",
        price: "от 3 000 ₽",
        note: "Массовые паломнические иконки, но редкие варианты дороже",
      },
      {
        name: "Эмалевая икона (финифть)",
        period: "XIX в.",
        price: "от 20 000 ₽",
        note: "Ростовская финифть — живопись по эмали на меди",
      },
      {
        name: "Складень трёхстворчатый",
        period: "XIX в.",
        price: "от 30 000 ₽",
        note: "Три части с разными святыми, часто семейный",
      },
      {
        name: "Эмалевый складень с мощевиком",
        period: "XVIII в.",
        price: "от 100 000 ₽",
        note: "Редкость — встроенный ковчег для мощей",
      },
    ],
  },
];

const AUTHENTICITY = [
  {
    icon: "Square",
    title: "Возраст доски",
    text: "Старая доска рассыхается, трескается, имеет характерный ковчег (углубление). Новодел на старом дереве — частая подделка.",
  },
  {
    icon: "Layers",
    title: "Красочный слой",
    text: "Масляная краска растрескивается (кракелюр) с веками. Свежая реставрация видна под ультрафиолетовой лампой.",
  },
  {
    icon: "Stamp",
    title: "Оклад и клейма",
    text: "Клеймо мастера, пробирное клеймо, дата — всё повышает ценность. Серебро 84 пробы — стандарт для российских окладов XIX века.",
  },
  {
    icon: "BookOpen",
    title: "Иконография",
    text: "Редкий сюжет стоит на порядок дороже распространённого. Деисус, Страшный суд, редкие изводы Богородицы — особая ценность.",
  },
  {
    icon: "AlertTriangle",
    title: "Состояние",
    text: "Сохранность красочного слоя — главный фактор. Потёртости снижают цену на 50–80%. Грамотная реставрация сохраняет стоимость.",
  },
  {
    icon: "History",
    title: "Провенанс",
    text: "Икона из старой семьи, церкви или известной коллекции — плюс 100% к стоимости. Документы, фото, письма — храните всё.",
  },
];

const PROCESS = [
  {
    step: "01",
    title: "Фото или визит",
    text: "Пришлите фото иконы (лицо, оборот, оклад, клейма) в мессенджер или привезите лично",
  },
  {
    step: "02",
    title: "Предварительная оценка",
    text: "В течение 2 часов дадим ориентировочную стоимость по фото без обязательств",
  },
  {
    step: "03",
    title: "Экспертиза на месте",
    text: "При визите проводим полный осмотр: доска, красочный слой, оклад, клейма, ультрафиолет",
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
    title: "Честная экспертиза",
    text: "Работаем с сертифицированными реставраторами и иконописцами — оценка без занижения",
  },
  {
    icon: "Banknote",
    title: "Оплата сразу",
    text: "Деньги в день визита независимо от суммы. Без «перезвоним через неделю»",
  },
  {
    icon: "Lock",
    title: "Конфиденциально",
    text: "Не задаём лишних вопросов об истории иконы. Полная анонимность сделки",
  },
];

const STATS = [
  { val: "500+", lbl: "лет традиции иконописи" },
  { val: "от 3 000 ₽", lbl: "минимальная выкупная цена" },
  { val: "до 5 000 000 ₽", lbl: "за одну икону" },
  { val: "бесплатно", lbl: "оценка при визите" },
];

export default function RussianIcons() {
  const [activeTab, setActiveTab] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [sent, setSent] = useState(false);
  const [ctaPhone, setCtaPhone] = useState("");
  const [ctaSent, setCtaSent] = useState(false);

  const handleModalSend = () => {
    if (phone.replace(/\D/g, "").length < 10) return;
    setSent(true);
  };

  const handleCtaSend = () => {
    if (ctaPhone.replace(/\D/g, "").length < 10) return;
    setCtaSent(true);
  };

  const activeCategory = ICONS[activeTab];

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <Header scrollTo={() => {}} />

      {/* ══ HERO ══ */}
      <section className="relative min-h-[60vh] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={HERO_IMG}
            alt="Православные иконы"
            className="w-full h-full object-cover object-center opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-[#080808]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#080808]/80 via-transparent to-transparent" />
        </div>

        {/* Тёплые янтарные частицы */}
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
            <Icon name="Church" size={11} />
            Скупка антиквариата · Скупка24
          </div>

          <h1 className="font-oswald font-black text-4xl md:text-6xl lg:text-7xl uppercase leading-none mb-2">
            ПРАВОСЛАВНЫЕ
          </h1>
          <h1 className="font-oswald font-black text-4xl md:text-6xl lg:text-7xl uppercase leading-none mb-4">
            <span
              style={{
                background:
                  "linear-gradient(90deg,#8a5000,#c47a00,#e2a84b,#fde68a,#e2a84b,#c47a00,#8a5000)",
                backgroundSize: "200% auto",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                animation: "amberShimmer 3s linear infinite",
              }}
            >
              ИКОНЫ
            </span>
          </h1>

          <p className="font-roboto text-white/60 text-base md:text-lg max-w-xl mb-6 leading-relaxed">
            Покупаем иконы XVI–XIX века, оклады серебро и золото. Оценка
            бесплатно — честная цена по реставрационным каталогам и
            аукционным результатам.
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setFormOpen(true)}
              className="inline-flex items-center gap-2 font-oswald font-bold text-sm uppercase tracking-wide px-6 py-3 transition-colors"
              style={{ background: ACCENT, color: "#000" }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background =
                  "#f0b85a")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background =
                  ACCENT)
              }
            >
              <Icon name="Phone" size={16} />
              Оценить икону
            </button>
            <a
              href="#icons"
              className="inline-flex items-center gap-2 border border-white/20 text-white/70 font-roboto text-sm px-6 py-3 transition-colors hover:text-white/90"
              style={{}}
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
      <section id="icons" className="max-w-6xl mx-auto px-4 py-14 md:py-20">
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
            Цены ориентировочные — итоговая стоимость зависит от сохранности,
            школы и наличия оклада
          </p>
        </div>

        {/* Табы */}
        <div className="flex flex-wrap gap-2 mb-6">
          {ICONS.map((cat, i) => (
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
                  Икона / тип
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
                  style={{}}
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
                    <div
                      className="font-oswald font-bold text-sm transition-colors"
                      style={{ color: "white" }}
                      onMouseEnter={(e) =>
                        ((e.currentTarget as HTMLDivElement).style.color =
                          ACCENT)
                      }
                      onMouseLeave={(e) =>
                        ((e.currentTarget as HTMLDivElement).style.color =
                          "white")
                      }
                    >
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
          * Итоговая цена определяется после осмотра иконы экспертом-реставратором
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
              <span style={{ color: ACCENT }}>ценность иконы</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {AUTHENTICITY.map((a, i) => (
              <div
                key={i}
                className="bg-[#0D0D0D] border border-white/[0.06] p-5 rounded-xl transition-colors group"
                style={{}}
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
                style={{ color: `${ACCENT}20` }}
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
            Есть икона?
            <br />
            <span style={{ color: ACCENT }}>Оценим бесплатно</span>
          </div>
          <p className="font-roboto text-white/50 text-sm md:text-base mb-8 leading-relaxed">
            Пришлите фото — ответим быстро. Или приходите в офис — осмотр
            и оценка полностью бесплатны.
          </p>

          {!ctaSent ? (
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="tel"
                value={ctaPhone}
                onChange={(e) => setCtaPhone(e.target.value)}
                placeholder="+7 (999) 000-00-00"
                className="flex-1 bg-[#111] border border-[#333] text-white px-4 py-3 font-roboto text-sm focus:outline-none transition-colors placeholder:text-white/20"
                style={{}}
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
                    "#f0b85a")
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
                Оценить икону
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
                      "#f0b85a")
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
        @keyframes amberShimmer {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
      `}</style>
    </div>
  );
}
