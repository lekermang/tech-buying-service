import { useState } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";

const COINS_IMG    = "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/0d17247e-bac8-456f-9aa9-00bfe13e451d.jpg";
const BRONZE_IMG   = "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/13c9f8e4-9437-436b-9adc-52f0be22cfae.jpg";
const RU_COINS_IMG = "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/cb78bd34-b88a-42fd-9a35-072ba558015a.jpg";
const ICONS_IMG    = "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/0da20686-81b0-482f-b091-6913209c1edb.jpg";
const PORCELAIN_IMG= "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/3b284dfd-609c-4d3f-8e73-49501a0ae6c3.jpg";
const SOVIET_IMG   = "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/2d93ca66-c5fe-42a7-8b1c-221370af02ff.jpg";

const CATEGORIES = [
  {
    href: "/russian-coins",
    img: RU_COINS_IMG,
    accent: "#FFD700",
    tag: "Нумизматика",
    title: "Царские монеты",
    keywords: "монеты николая ii · рубли · ефимки · злотник",
    desc: "Покупаем монеты от Владимира Великого до Николая II. Платиновые монеты — особый приоритет.",
    price: "до 5 000 000 ₽",
  },
  {
    href: "/icons",
    img: ICONS_IMG,
    accent: "#e2a84b",
    tag: "Иконопись",
    title: "Православные иконы",
    keywords: "иконы · оклады серебро · финифть · новгород",
    desc: "Покупаем иконы Новгородской, Московской, Строгановской школ. Оклады серебро, золото, эмаль.",
    price: "до 5 000 000 ₽",
  },
  {
    href: "/porcelain",
    img: PORCELAIN_IMG,
    accent: "#60a5fa",
    tag: "Фарфор",
    title: "Фарфор и хрусталь",
    keywords: "ифз · гарднер · кузнецов · агитфарфор",
    desc: "Покупаем ИФЗ, Гарднер, Кузнецов. Отдельные предметы и полные сервизы.",
    price: "до 3 000 000 ₽",
  },
  {
    href: "/soviet-antiques",
    img: SOVIET_IMG,
    accent: "#ef4444",
    tag: "СССР",
    title: "Советский антиквариат",
    keywords: "ордена · медали · плакаты · авангард",
    desc: "Покупаем ордена и медали, плакаты 1920-х, агитфарфор, мебель конструктивизма.",
    price: "до 1 000 000 ₽",
  },
  {
    href: "/ancient-coins",
    img: COINS_IMG,
    accent: "#a3e635",
    tag: "Античность",
    title: "Древние монеты",
    keywords: "ауреус · тетрадрахма · драхма · рим · греция",
    desc: "Покупаем ауреусы, драхмы, сребреники. Оценка по международным каталогам.",
    price: "до 5 000 000 ₽",
  },
  {
    href: "/bronze-sculptures",
    img: BRONZE_IMG,
    accent: "#a78bfa",
    tag: "Скульптура",
    title: "Бронзовые статуэтки",
    keywords: "роден · античная бронза · буддизм · xix–xx вв",
    desc: "Покупаем античную бронзу, буддийские статуи, работы Родена и Бари.",
    price: "до 10 000 000 ₽",
  },
];

const STEPS = [
  { n: "1", icon: "Phone", t: "Свяжитесь с нами", d: "Позвоните или напишите — опишите предметы, приложите фото" },
  { n: "2", icon: "Search", t: "Предварительная оценка", d: "Скажем ориентировочную цену по каталогам — онлайн или при встрече" },
  { n: "3", icon: "Landmark", t: "Осмотр предмета", d: "Эксперт осмотрит, проверит подлинность и сохранность" },
  { n: "4", icon: "Banknote", t: "Деньги в день сделки", d: "Оформим договор и выплатим наличными или переводом сразу" },
];

const FAQ_ITEMS = [
  { q: "Где продать антиквариат в Калуге?", a: "Скупка24 на ул. Кирова, 7 — принимаем монеты, иконы, фарфор, бронзу, советские ордена. Бесплатная оценка, выплата в день обращения. Ежедневно 9:00–21:00." },
  { q: "Как оценивается антиквариат?", a: "Оцениваем по международным аукционным каталогам: Coins.ru, Heritage, Stack's Bowers. Показываем справочные цены до начала переговоров — открыто и честно." },
  { q: "Принимаете ли монеты без документов?", a: "Да. Оцениваем монеты по состоянию и редкости вне зависимости от наличия документов. Сохранность и патина учитываются при оценке." },
  { q: "Сколько стоит икона с окладом?", a: "Иконы в окладах серебро/золото от 30 000 ₽ до 5 000 000 ₽ в зависимости от школы, века и состояния. Иконы Московской школы XVII в. — от 150 000 ₽." },
  { q: "Выезжаете ли на оценку на дом?", a: "Да, при крупных коллекциях или когда предметы сложно транспортировать — выезжаем на дом. Свяжитесь по телефону или Telegram для записи." },
  { q: "Берёте ли предметы на реализацию?", a: "Да, принимаем антиквариат на консигнацию (реализацию) — вы получаете деньги после продажи по согласованной цене. Альтернатива прямому выкупу." },
];

export default function AntiqueCategories() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <>
      {/* ── Категории ── */}
      <section className="px-4 sm:px-8 py-12 max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="font-oswald text-3xl sm:text-4xl font-bold uppercase">
            Что мы <span className="text-[#FFD700]">покупаем</span>
          </h2>
          <p className="text-white/50 text-sm mt-2">Честная оценка по аукционным каталогам — без занижения</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CATEGORIES.map(c => (
            <Link key={c.href} to={c.href}
              className="group relative rounded-2xl overflow-hidden flex flex-col transition-all hover:-translate-y-1 duration-300"
              style={{ border: `1px solid ${c.accent}30` }}>
              {/* Фото */}
              <div className="relative h-44 overflow-hidden">
                <img src={c.img} alt={c.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-[#0D0D0D]/20 to-transparent" />
                <span className="absolute top-2.5 left-2.5 font-roboto text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full backdrop-blur-sm"
                  style={{ background: `${c.accent}18`, border: `1px solid ${c.accent}30`, color: c.accent }}>
                  {c.tag}
                </span>
                <span className="absolute top-2.5 right-2.5 font-oswald font-bold text-base leading-none"
                  style={{ color: c.accent, filter: "drop-shadow(0 0 8px currentColor)" }}>
                  {c.price}
                </span>
              </div>
              {/* Контент */}
              <div className="bg-[#0D0D0D] p-4 flex flex-col gap-2 flex-1">
                <div className="font-oswald font-bold text-lg uppercase text-white">{c.title}</div>
                <div className="font-roboto text-[10px] uppercase tracking-widest" style={{ color: c.accent }}>{c.keywords}</div>
                <p className="font-roboto text-white/60 text-[13px] leading-snug flex-1">{c.desc}</p>
                <div className="flex items-center gap-1 mt-1" style={{ color: c.accent }}>
                  <span className="font-roboto text-xs font-semibold">Подробнее</span>
                  <Icon name="ArrowRight" size={13} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Как проходит скупка ── */}
      <section className="border-y border-[#FFD700]/10 bg-[#111]/70 backdrop-blur-sm px-4 sm:px-8 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="font-oswald text-3xl sm:text-4xl font-bold uppercase">
              Как мы <span className="text-[#FFD700]">работаем</span>
            </h2>
          </div>
          <div className="grid sm:grid-cols-4 gap-6">
            {STEPS.map(s => (
              <div key={s.n} className="text-center">
                <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-[#FFD700] flex items-center justify-center shadow-[0_0_30px_rgba(255,215,0,0.4)]">
                  <Icon name={s.icon} size={22} className="text-black" />
                </div>
                <div className="text-white/30 text-xs mb-1">Шаг {s.n}</div>
                <div className="font-oswald text-base font-bold uppercase mb-2">{s.t}</div>
                <div className="text-white/50 text-[13px] leading-relaxed">{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="px-4 sm:px-8 py-14 max-w-3xl mx-auto">
        <div className="text-center mb-9">
          <h2 className="font-oswald text-3xl sm:text-4xl font-bold uppercase">
            Частые <span className="text-[#FFD700]">вопросы</span>
          </h2>
        </div>
        <div className="flex flex-col gap-2.5">
          {FAQ_ITEMS.map((f, i) => (
            <div key={f.q} className="bg-[#111]/80 border border-white/[0.07] rounded-xl overflow-hidden backdrop-blur-sm">
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left">
                <span className="font-roboto font-medium text-[15px] text-white/90">{f.q}</span>
                <Icon name="ChevronDown" size={18}
                  className={`shrink-0 text-[#FFD700] transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
              </button>
              {openFaq === i && (
                <div className="px-5 pb-4 text-white/55 text-sm leading-relaxed">{f.a}</div>
              )}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
