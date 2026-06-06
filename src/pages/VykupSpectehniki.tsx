/**
 * /vykup-spectehniki — Срочный выкуп спецтехники за 1 день.
 * SEO: PageSEO, Schema.org, H1/H2/H3, alt-теги, OG.
 * Дизайн: тёмный #0D0D0D, акцент янтарно-жёлтый #E6A017 (цвет техники).
 */
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import PageSEO from "@/components/seo/PageSEO";
import funcUrls from "../../backend/func2url.json";

const LEAD_URL = (funcUrls as Record<string, string>)["send-lead"];
const PHONE_DISPLAY = "8 992 999-03-33";
const PHONE_TEL     = "tel:+79929990333";
const A  = "#E6A017";
const A2 = "#FF6B00";
const OG_IMG = "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/73730c07-7000-41a1-92e8-20df91a71de3.jpg";

/* ── Schema.org ── */
const SCHEMA_ORG = [
  {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "Скупка24 — Срочный выкуп спецтехники",
    description: "Срочный выкуп спецтехники за 1 день. Экскаваторы, бульдозеры, погрузчики, краны, самосвалы.",
    url: "https://skypka24.com/vykup-spectehniki",
    telephone: "+79929990333",
    openingHours: "Mo-Su 09:00-22:00",
    image: OG_IMG,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Калуга",
      streetAddress: "ул. Кирова, 7",
      addressCountry: "RU",
    },
    geo: { "@type": "GeoCoordinates", latitude: 54.5293, longitude: 36.2754 },
    aggregateRating: { "@type": "AggregateRating", ratingValue: "5.0", reviewCount: "3460" },
  },
  {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Срочный выкуп спецтехники за 1 день",
    provider: { "@type": "LocalBusiness", name: "Скупка24" },
    description: "Выкуп экскаваторов, бульдозеров, погрузчиков, автокранов, самосвалов. Любое состояние. Юрлица и ИП. Наличные или на счёт.",
    offers: {
      "@type": "AggregateOffer",
      lowPrice: "500000",
      highPrice: "20000000",
      priceCurrency: "RUB",
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Виды спецтехники",
      itemListElement: [
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "Выкуп экскаваторов" } },
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "Выкуп бульдозеров" } },
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "Выкуп погрузчиков" } },
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "Выкуп автокранов" } },
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "Выкуп самосвалов" } },
      ],
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      { "@type": "Question", name: "Сколько времени занимает выкуп спецтехники?", acceptedAnswer: { "@type": "Answer", text: "В среднем 1 рабочий день: оценщик выезжает на объект за 2 часа, осмотр 30–60 минут, оформление документов ещё 1–2 часа." } },
      { "@type": "Question", name: "Выкупаете ли битую или неисправную технику?", acceptedAnswer: { "@type": "Answer", text: "Да, выкупаем любую технику вне зависимости от состояния: аварийную, после пожара, без двигателя, на запчасти." } },
      { "@type": "Question", name: "Работаете ли с юридическими лицами?", acceptedAnswer: { "@type": "Answer", text: "Да, работаем с юрлицами, ИП и физическими лицами. Оплата наличными, на карту или безналичным переводом на расчётный счёт." } },
    ],
  },
];

/* ── Данные ── */
const SPEC_PHOTOS = [
  { label: "Экскаватор",   img: "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/73730c07-7000-41a1-92e8-20df91a71de3.jpg", alt: "Выкуп экскаватора — срочный выкуп спецтехники" },
  { label: "Бульдозер",    img: "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/d92cab65-2938-4a53-b2dc-c89f0938ec86.jpg", alt: "Выкуп бульдозера дорого" },
  { label: "Погрузчик",    img: "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/f59e3e46-55f9-4125-9186-24213aa7b765.jpg", alt: "Выкуп погрузчика фронтального" },
  { label: "Автокран",     img: "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/e6d10226-12b0-45d5-af44-40f725f17437.jpg", alt: "Выкуп автокрана и кранов-манипуляторов" },
  { label: "Самосвал",     img: "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/869cfc84-a28a-4b79-b681-1bf8caff7eb9.jpg", alt: "Выкуп самосвала КАМАЗ Howo срочно" },
  { label: "Битая техника",img: "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/d52e4541-2a0d-4e6f-af0f-8a7fdd32b9b4.jpg", alt: "Выкуп битой неисправной спецтехники" },
];

const ADVANTAGES = [
  { icon: "MapPin",       title: "Выезд на объект за 2 часа",       desc: "На стройплощадку, базу, карьер — куда угодно"       },
  { icon: "Banknote",     title: "Наличные, карта или на счёт",      desc: "Юрлица — безнал на расчётный счёт в день сделки"    },
  { icon: "FileCheck",    title: "Помогаем с документами",           desc: "Снятие с учёта, ПСМ, договор купли-продажи"         },
  { icon: "ShieldCheck",  title: "Без ПСМ — всё равно выкупим",     desc: "Работаем с любой документарной ситуацией"           },
  { icon: "Globe",        title: "Работаем по всей России",          desc: "Выезд в регионы — Москва, СПб и вся страна"        },
  { icon: "BadgeCheck",   title: "Без скрытых комиссий",             desc: "Сумма из оценки = сумма в договоре"                 },
];

const SPEC_TYPES = [
  { icon: "Shovel",       label: "Экскаваторы (гусеничные, колёсные)" },
  { icon: "Tractor",      label: "Бульдозеры"                          },
  { icon: "Forklift",     label: "Фронтальные погрузчики"              },
  { icon: "Construction", label: "Автокраны и краны-манипуляторы"      },
  { icon: "Truck",        label: "Самосвалы (КАМАЗ, Howo, Shacman)"    },
  { icon: "Tractor",      label: "Тракторы и грейдеры"                 },
  { icon: "Wrench",       label: "Битая и аварийная техника"           },
  { icon: "CreditCard",   label: "Кредитная и залоговая"               },
  { icon: "AlertTriangle",label: "Не на ходу"                          },
  { icon: "FileX",        label: "Без документов"                      },
];

const STEPS = [
  { n: "01", icon: "PhoneCall",       title: "Заявка",           desc: "Звоните или оставьте заявку — ответим за 15 минут" },
  { n: "02", icon: "MapPin",          title: "Выезд оценщика",   desc: "Приедем на ваш объект за 2 часа, в любой регион"   },
  { n: "03", icon: "ClipboardCheck",  title: "Осмотр + договор", desc: "30–60 минут. Договор купли-продажи, всё официально" },
  { n: "04", icon: "Banknote",        title: "Деньги",           desc: "Наличные, карта или перевод на счёт — в день сделки"},
];

const REVIEWS = [
  { name: "Сергей М.", role: "Владелец ООО",   stars: 5, text: "Продали три старых экскаватора за один день. Приехали на базу сами, оценили честно, деньги перевели на расчётный счёт сразу.", date: "12 апр 2025" },
  { name: "Иван Д.",   role: "ИП",             stars: 5, text: "Продал неисправный бульдозер — думал, что никто не возьмёт. Оценщик приехал в тот же день, всё оформили быстро.", date: "5 мар 2025" },
  { name: "Алексей П.",role: "Прораб",         stars: 5, text: "Выкупили самосвал КАМАЗ без ПСМ. Помогли со всеми документами, никаких проблем. Рекомендую всем!", date: "18 фев 2025" },
];

const FAQ = [
  { q: "Сколько времени занимает выкуп спецтехники?", a: "В среднем 1 рабочий день: выезд оценщика за 2 часа после звонка, осмотр на объекте 30–60 минут, оформление документов ещё 1–2 часа. Деньги — в день сделки." },
  { q: "Выкупаете ли битую или неисправную технику?", a: "Да, выкупаем любую технику вне зависимости от состояния: аварийную, сгоревшую, после затопления, без двигателя, на запчасти. Оценим честно." },
  { q: "Какие документы нужны для сделки?", a: "В идеале: ПСМ (паспорт самоходной машины), СТС, паспорт владельца или учредительные документы для юрлица. Если нет ПСМ — всё равно выкупаем, поможем с оформлением." },
  { q: "Работаете ли с юридическими лицами?", a: "Да, работаем с ООО, ИП и физическими лицами. Для юрлиц — безналичная оплата на расчётный счёт, полный пакет документов для бухгалтерии: договор, акт, счёт-фактура." },
  { q: "Можете выкупить технику без моего присутствия?", a: "Да, по доверенности. Уточните при звонке — объясним, как правильно оформить, чтобы всё прошло без вашего участия." },
];

/* Типы техники для калькулятора */
const TECH_TYPES = [
  { id: "excavator",  label: "Экскаватор",          base: 3_500_000 },
  { id: "bulldozer",  label: "Бульдозер",            base: 4_000_000 },
  { id: "loader",     label: "Погрузчик",            base: 2_500_000 },
  { id: "crane",      label: "Автокран",             base: 5_000_000 },
  { id: "dumper",     label: "Самосвал",             base: 3_000_000 },
  { id: "tractor",    label: "Трактор / Грейдер",    base: 2_000_000 },
];

const CONDITIONS = [
  { id: "excellent", label: "Отличное",   mult: 1.0  },
  { id: "good",      label: "Хорошее",    mult: 0.85 },
  { id: "average",   label: "Среднее",    mult: 0.68 },
  { id: "damaged",   label: "Битая",      mult: 0.45 },
  { id: "dead",      label: "Не на ходу", mult: 0.30 },
];

/* ── Утилиты ── */
function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 11);
  if (!d) return "";
  if (d.length <= 1) return "+7";
  if (d.length <= 4) return `+7 (${d.slice(1)}`;
  if (d.length <= 7) return `+7 (${d.slice(1,4)}) ${d.slice(4)}`;
  if (d.length <= 9) return `+7 (${d.slice(1,4)}) ${d.slice(4,7)}-${d.slice(7)}`;
  return `+7 (${d.slice(1,4)}) ${d.slice(4,7)}-${d.slice(7,9)}-${d.slice(9)}`;
}

function calcPrice(techId: string, year: number, condId: string): string {
  if (!year || year < 1980 || year > 2025) return "";
  const tech = TECH_TYPES.find(t => t.id === techId);
  const cond = CONDITIONS.find(c => c.id === condId);
  if (!tech || !cond) return "";
  const age = 2025 - year;
  const ageFactor = Math.max(0.25, 1 - age * 0.04);
  const val = tech.base * ageFactor * cond.mult;
  const lo = Math.round((val * 0.88) / 50_000) * 50_000;
  const hi = Math.round((val * 1.08) / 50_000) * 50_000;
  return `${lo.toLocaleString("ru-RU")} – ${hi.toLocaleString("ru-RU")} ₽`;
}

/* ── Форма заявки ── */
function LeadForm({ place }: { place: string }) {
  const [name,    setName]    = useState("");
  const [phone,   setPhone]   = useState("+7");
  const [tech,    setTech]    = useState("");
  const [agree,   setAgree]   = useState(true);
  const [sending, setSending] = useState(false);
  const [done,    setDone]    = useState(false);
  const [err,     setErr]     = useState<string | null>(null);

  const phoneOk = phone.replace(/\D/g, "").length === 11;
  const canSend = name.trim().length >= 2 && phoneOk && agree;

  const handlePhone = (v: string) => {
    const raw = v.replace(/\D/g, "");
    if (!raw) { setPhone("+7"); return; }
    setPhone(formatPhone(raw.startsWith("7") || raw.startsWith("8") ? raw : "7" + raw));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSend || sending) return;
    setSending(true); setErr(null);
    try {
      await fetch(LEAD_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.replace(/\D/g, ""),
          category: "Выкуп спецтехники",
          desc: `Заявка со страницы /vykup-spectehniki (${place})${tech ? ` | Техника: ${tech}` : ""}`,
        }),
      });
      setDone(true);
    } catch {
      setErr("Ошибка сети — позвоните нам: " + PHONE_DISPLAY);
    }
    setSending(false);
  };

  const inp = "w-full px-4 py-3 rounded-xl font-roboto text-sm text-white/90 outline-none";
  const inpStyle = { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" };

  if (done) return (
    <div className="flex flex-col items-center gap-4 py-6 text-center">
      <div className="w-16 h-16 rounded-full flex items-center justify-center"
        style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)" }}>
        <Icon name="CheckCircle2" size={32} className="text-green-400" />
      </div>
      <div>
        <div className="font-oswald font-bold text-white text-xl uppercase mb-1">Заявка принята!</div>
        <div className="font-roboto text-white/50 text-sm">Перезвоним в течение 30 минут</div>
      </div>
    </div>
  );

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <div className="font-roboto text-[11px] text-white/40 mb-1">Ваше имя <span className="text-red-400">*</span></div>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Иван / ООО Ромашка"
            className={inp} style={{ ...inpStyle, borderColor: name.trim().length >= 2 ? `${A}55` : "rgba(255,255,255,0.1)" }} />
        </div>
        <div>
          <div className="font-roboto text-[11px] text-white/40 mb-1">Телефон <span className="text-red-400">*</span></div>
          <input type="tel" value={phone} onChange={e => handlePhone(e.target.value)} placeholder="+7 (999) 999-99-99"
            className={inp} style={{ ...inpStyle, borderColor: phoneOk ? `${A}55` : "rgba(255,255,255,0.1)" }} />
        </div>
      </div>
      <div>
        <div className="font-roboto text-[11px] text-white/40 mb-1">Тип техники <span className="text-white/20">(необязательно)</span></div>
        <input type="text" value={tech} onChange={e => setTech(e.target.value)}
          placeholder="Экскаватор CAT 320D 2015 г., Самосвал КАМАЗ..."
          className={inp} style={inpStyle} />
      </div>
      <label className="flex items-start gap-2 cursor-pointer" onClick={() => setAgree(!agree)}>
        <div className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center shrink-0 transition-all ${agree ? "bg-[#E6A017]" : "bg-white/10 border border-white/20"}`}>
          {agree && <Icon name="Check" size={10} className="text-black" />}
        </div>
        <span className="font-roboto text-[11px] text-white/35 leading-relaxed select-none">
          Соглашаюсь на обработку персональных данных и обратный звонок
        </span>
      </label>
      {err && (
        <div className="flex items-center gap-2 text-red-400 text-sm font-roboto">
          <Icon name="AlertCircle" size={14} />{err}
        </div>
      )}
      <button type="submit" disabled={!canSend || sending}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-oswald font-bold text-base uppercase tracking-wide text-black active:scale-[0.98] transition-all disabled:opacity-40"
        style={{ background: `linear-gradient(135deg,${A},${A2})`, boxShadow: `0 6px 24px ${A}35` }}>
        <Icon name={sending ? "Loader2" : "Banknote"} size={20} className={sending ? "animate-spin" : ""} />
        {sending ? "Отправляю…" : "Получить деньги сейчас"}
      </button>
    </form>
  );
}

/* ═══════════════════════════════════════════════════════════ */
export default function VykupSpectehniki() {
  const [activePhoto, setActivePhoto] = useState(0);
  const [openFaq,     setOpenFaq]     = useState<number | null>(null);
  const [calcTech,    setCalcTech]    = useState("excavator");
  const [calcYear,    setCalcYear]    = useState("");
  const [calcCond,    setCalcCond]    = useState("good");
  const [calcResult,  setCalcResult]  = useState<string | null>(null);
  const [scrolled,    setScrolled]    = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const doCalc = () => {
    const y = parseInt(calcYear);
    const r = calcPrice(calcTech, y, calcCond);
    setCalcResult(r || "Укажите корректный год (1980–2025)");
  };

  const cardStyle = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" };
  const inp = "w-full px-4 py-3 rounded-xl font-roboto text-sm text-white/90 outline-none";
  const inpStyle = { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white overflow-x-hidden">

      <PageSEO
        title="Срочный выкуп спецтехники за 1 день — дорого, любые машины | skypka24.com"
        description="Срочный выкуп спецтехники в день обращения. Экскаваторы, бульдозеры, погрузчики, автокраны, самосвалы. Битая, старая, кредитная. Оценка за 30 минут. Деньги наличными или на счёт. Звоните!"
        keywords="выкуп спецтехники, выкуп экскаватора, продать бульдозер срочно, выкуп погрузчиков, выкуп автокранов, выкуп самосвалов, оценка спецтехники онлайн"
        url="https://skypka24.com/vykup-spectehniki"
        ogImage={OG_IMG}
        schema={SCHEMA_ORG}
      />

      {/* ── HEADER ── */}
      <header className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-[#0d0d0d]/95 border-b border-white/10 backdrop-blur-lg shadow-lg"
                 : "bg-[#0d0d0d]/70 backdrop-blur-sm border-b border-white/[0.05]"
      }`}>
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
            <Icon name="ChevronLeft" size={18} />
            <span className="font-oswald font-bold text-lg tracking-wide"
              style={{ background: "linear-gradient(90deg,#fff3a0,#FFD700)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Скупка24
            </span>
          </Link>
          <a href={PHONE_TEL} className="hidden sm:flex items-center gap-1.5 font-oswald font-bold text-sm" style={{ color: A }}>
            <Icon name="Phone" size={14} />
            {PHONE_DISPLAY}
          </a>
          <a href={PHONE_TEL} className="sm:hidden flex items-center justify-center w-9 h-9 rounded-xl active:scale-95"
            style={{ background: `${A}18`, border: `1px solid ${A}35`, color: A }}>
            <Icon name="Phone" size={16} />
          </a>
        </div>
      </header>

      {/* ═══ БЛОК 1: HERO ═══ */}
      <section className="relative overflow-hidden px-4 py-12 sm:py-16">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full"
            style={{ background: `radial-gradient(ellipse,${A}12 0%,transparent 70%)`, filter: "blur(90px)" }} />
          <div className="absolute inset-0 opacity-20"
            style={{ backgroundImage: `linear-gradient(${A}06 1px,transparent 1px),linear-gradient(90deg,${A}06 1px,transparent 1px)`, backgroundSize: "52px 52px" }} />
        </div>

        <div className="relative max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5 font-roboto text-[11px] font-semibold uppercase tracking-wider"
            style={{ background: `${A}15`, border: `1px solid ${A}30`, color: A }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: A }} />
            Выкуп за 1 день · По всей России · Юрлица и ИП
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="font-oswald font-black uppercase leading-[0.9] mb-4"
                style={{ fontSize: "clamp(2rem,7.5vw,3.8rem)" }}>
                <span className="block text-white">Срочный выкуп</span>
                <span className="block" style={{ color: A, textShadow: `0 0 30px ${A}45` }}>спецтехники</span>
                <span className="block text-white">за 1 день</span>
              </h1>
              <h2 className="font-oswald text-white/45 font-normal uppercase tracking-wide text-base sm:text-lg mb-4">
                Выкупаем любую спецтехнику в день обращения
              </h2>
              <p className="font-roboto text-white/55 leading-relaxed text-sm sm:text-base mb-6">
                Продайте спецтехнику <strong className="text-white/80">срочно и дорого</strong> без простоя.
                Экскаваторы, бульдозеры, краны, самосвалы — любое состояние.
                Юрлица и ИП: оплата на расчётный счёт.
              </p>

              <a href={PHONE_TEL} className="inline-flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: `${A}20`, border: `1px solid ${A}40` }}>
                  <Icon name="Phone" size={22} style={{ color: A }} />
                </div>
                <div>
                  <div className="font-roboto text-[10px] text-white/30 uppercase tracking-widest">Звоните прямо сейчас</div>
                  <div className="font-oswald font-bold text-2xl sm:text-3xl" style={{ color: A }}>{PHONE_DISPLAY}</div>
                </div>
              </a>

              <div className="flex gap-3 flex-wrap">
                <a href={PHONE_TEL}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-oswald font-bold text-sm uppercase tracking-wide text-black active:scale-95 transition-all"
                  style={{ background: `linear-gradient(135deg,${A},${A2})`, boxShadow: `0 6px 24px ${A}35` }}>
                  <Icon name="Phone" size={16} />
                  Позвонить сейчас
                </a>
                <a href="#form"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-oswald font-bold text-sm uppercase tracking-wide active:scale-95 transition-all"
                  style={{ border: `1px solid ${A}40`, color: A, background: `${A}08` }}>
                  <Icon name="FileText" size={16} />
                  Оставить заявку
                </a>
              </div>
            </div>

            <div className="relative rounded-2xl overflow-hidden h-64 sm:h-80 lg:h-96"
              style={{ border: `1px solid ${A}20` }}>
              <img src={OG_IMG} alt="Срочный выкуп спецтехники — экскаватор, бульдозер, погрузчик"
                className="w-full h-full object-cover" />
              <div className="absolute inset-0"
                style={{ background: "linear-gradient(135deg,transparent 45%,rgba(13,13,13,0.65))" }} />
              <div className="absolute bottom-4 left-4">
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl backdrop-blur-sm"
                  style={{ background: "rgba(0,0,0,0.72)", border: `1px solid ${A}30` }}>
                  <Icon name="Zap" size={13} style={{ color: A }} />
                  <span className="font-roboto text-white text-xs">Оценка за 30 минут · Деньги в день сделки</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ БЛОК 2: ГАЛЕРЕЯ ═══ */}
      <section className="px-4 py-10 max-w-5xl mx-auto">
        <h3 className="font-oswald font-bold text-xl uppercase text-white/75 mb-4 text-center">
          Выкупаем экскаваторы, бульдозеры, краны и любую другую технику
        </h3>
        <div className="flex flex-wrap justify-center gap-2 mb-5">
          {SPEC_PHOTOS.map((c, i) => (
            <button key={c.label} onClick={() => setActivePhoto(i)}
              className="px-3.5 py-2 rounded-xl font-roboto text-sm transition-all active:scale-95"
              style={{
                background: activePhoto === i ? `${A}20` : "rgba(255,255,255,0.05)",
                border: `1px solid ${activePhoto === i ? A + "55" : "rgba(255,255,255,0.08)"}`,
                color: activePhoto === i ? A : "rgba(255,255,255,0.55)",
              }}>
              {c.label}
            </button>
          ))}
        </div>
        <div className="relative rounded-2xl overflow-hidden h-52 sm:h-72 mx-auto max-w-2xl"
          style={{ border: `1px solid ${A}15` }}>
          <img src={SPEC_PHOTOS[activePhoto].img} alt={SPEC_PHOTOS[activePhoto].alt}
            className="w-full h-full object-cover transition-opacity duration-300" key={activePhoto} />
          <div className="absolute inset-0"
            style={{ background: "linear-gradient(to top,rgba(0,0,0,0.6) 0%,transparent 55%)" }} />
          <div className="absolute bottom-3 left-0 right-0 text-center">
            <span className="font-oswald font-bold text-white/80 text-sm uppercase tracking-wider">
              {SPEC_PHOTOS[activePhoto].alt}
            </span>
          </div>
        </div>
      </section>

      {/* ═══ БЛОК 3: КАЛЬКУЛЯТОР ═══ */}
      <section className="px-4 py-10">
        <div className="max-w-2xl mx-auto rounded-2xl p-6 sm:p-8"
          style={{ background: "linear-gradient(135deg,#161208,#111)", border: `1px solid ${A}22` }}>
          <div className="text-center mb-6">
            <h3 className="font-oswald font-bold text-2xl uppercase text-white mb-1">
              Оценка спецтехники онлайн
            </h3>
            <p className="font-roboto text-white/35 text-sm">Предварительная стоимость — точную назовёт оценщик при осмотре</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <div className="font-roboto text-[11px] text-white/40 mb-1.5">Тип техники</div>
              <select value={calcTech} onChange={e => setCalcTech(e.target.value)}
                className={inp + " cursor-pointer"} style={{ ...inpStyle, color: "rgba(255,255,255,0.85)" }}>
                {TECH_TYPES.map(t => (
                  <option key={t.id} value={t.id} style={{ background: "#1a1a1a" }}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <div className="font-roboto text-[11px] text-white/40 mb-1.5">Год выпуска</div>
              <input type="number" value={calcYear} onChange={e => setCalcYear(e.target.value)}
                placeholder="2015" min={1980} max={2025} className={inp} style={inpStyle} />
            </div>
            <div>
              <div className="font-roboto text-[11px] text-white/40 mb-1.5">Состояние</div>
              <select value={calcCond} onChange={e => setCalcCond(e.target.value)}
                className={inp + " cursor-pointer"} style={{ ...inpStyle, color: "rgba(255,255,255,0.85)" }}>
                {CONDITIONS.map(c => (
                  <option key={c.id} value={c.id} style={{ background: "#1a1a1a" }}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>
          <button onClick={doCalc}
            className="w-full py-3.5 rounded-xl font-oswald font-bold text-base uppercase tracking-wide text-black mb-4 transition-all active:scale-[0.98]"
            style={{ background: `linear-gradient(135deg,${A},${A2})`, boxShadow: `0 4px 20px ${A}30` }}>
            Рассчитать примерную цену
          </button>
          {calcResult && (
            <div className="flex items-center justify-between px-4 py-3 rounded-xl"
              style={{ background: `${A}12`, border: `1px solid ${A}30` }}>
              <div>
                <div className="font-roboto text-[10px] text-white/35 uppercase tracking-wider mb-0.5">Предварительная оценка</div>
                <div className="font-oswald font-black text-2xl" style={{ color: A }}>{calcResult}</div>
              </div>
              <a href="#form"
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-oswald font-bold text-sm uppercase text-black active:scale-95"
                style={{ background: `linear-gradient(135deg,${A},${A2})` }}>
                Продать
                <Icon name="ArrowRight" size={14} />
              </a>
            </div>
          )}
        </div>
      </section>

      {/* ═══ БЛОК 4: ПРЕИМУЩЕСТВА ═══ */}
      <section className="px-4 py-10 max-w-5xl mx-auto">
        <h3 className="font-oswald font-bold text-2xl uppercase text-center text-white mb-6">
          Почему выбирают нас
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {ADVANTAGES.map(a => (
            <div key={a.title} className="rounded-2xl p-4" style={cardStyle}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                style={{ background: `${A}15`, border: `1px solid ${A}25` }}>
                <Icon name={a.icon} size={18} style={{ color: A }} />
              </div>
              <div className="font-oswald font-bold text-sm uppercase text-white mb-1">{a.title}</div>
              <div className="font-roboto text-[11px] text-white/40 leading-relaxed">{a.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ БЛОК 5: КАКУЮ ТЕХНИКУ ═══ */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <h3 className="font-oswald font-bold text-2xl uppercase text-center text-white mb-2">
          Выкуп экскаваторов, бульдозеров и любой спецтехники
        </h3>
        <p className="font-roboto text-white/35 text-sm text-center mb-6">
          Продать бульдозер срочно, выкуп погрузчиков за день — без исключений
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {SPEC_TYPES.map(t => (
            <div key={t.label} className="flex flex-col items-center gap-2 rounded-xl p-3.5 text-center" style={cardStyle}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ background: `${A}15`, border: `1px solid ${A}25` }}>
                <Icon name={t.icon} size={16} style={{ color: A }} />
              </div>
              <span className="font-roboto text-[11px] text-white/65 leading-tight">{t.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ БЛОК 6: КАК РАБОТАЕМ ═══ */}
      <section className="px-4 py-10 max-w-5xl mx-auto">
        <h3 className="font-oswald font-bold text-2xl uppercase text-center text-white mb-8">
          Как мы работаем — 4 шага до денег
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {STEPS.map((s, i) => (
            <div key={s.n} className="relative flex flex-col items-center text-center">
              {i < STEPS.length - 1 && (
                <div className="hidden sm:block absolute top-6 left-[60%] right-0 h-px"
                  style={{ background: `linear-gradient(90deg,${A}40,transparent)` }} />
              )}
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 relative z-10"
                style={{ background: `linear-gradient(135deg,${A}25,${A2}15)`, border: `1px solid ${A}35` }}>
                <Icon name={s.icon} size={20} style={{ color: A }} />
              </div>
              <div className="font-roboto text-[10px] text-white/25 uppercase tracking-widest mb-0.5">{s.n}</div>
              <div className="font-oswald font-bold text-sm uppercase text-white mb-1">{s.title}</div>
              <div className="font-roboto text-[11px] text-white/40 leading-relaxed">{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ БЛОК 7: ФОРМА ЗАЯВКИ ═══ */}
      <section id="form" className="px-4 py-10 scroll-mt-16">
        <div className="max-w-2xl mx-auto rounded-2xl p-6 sm:p-8 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg,#1a1000,#0f0d00,#0d0d0d)", border: `1px solid ${A}25`, boxShadow: `0 0 50px ${A}08` }}>
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{ background: `linear-gradient(90deg,transparent,${A}75,transparent)` }} />
          <div className="text-center mb-6">
            <h3 className="font-oswald font-bold text-2xl uppercase text-white mb-1">
              Получить деньги за спецтехнику
            </h3>
            <p className="font-roboto text-white/40 text-sm">Перезвоним за 30 минут и согласуем время выезда оценщика</p>
          </div>
          <LeadForm place="main-form" />
        </div>
      </section>

      {/* ═══ БЛОК 8: ОТЗЫВЫ ═══ */}
      <section className="px-4 py-10 max-w-5xl mx-auto">
        <h3 className="font-oswald font-bold text-2xl uppercase text-center text-white mb-6">
          Отзывы клиентов
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {REVIEWS.map(r => (
            <div key={r.name} className="rounded-2xl p-5" style={cardStyle}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-oswald font-bold text-black text-sm shrink-0"
                  style={{ background: `linear-gradient(135deg,${A},${A2})` }}>
                  {r.name[0]}
                </div>
                <div>
                  <div className="font-roboto text-sm font-semibold text-white/80">{r.name}</div>
                  <div className="font-roboto text-[10px] text-white/35">{r.role}</div>
                </div>
                <div className="ml-auto flex gap-0.5">
                  {Array.from({ length: r.stars }).map((_, i) => (
                    <Icon key={i} name="Star" size={11} style={{ color: "#FFD700", fill: "#FFD700" }} />
                  ))}
                </div>
              </div>
              <p className="font-roboto text-sm text-white/55 leading-relaxed mb-2">"{r.text}"</p>
              <div className="font-roboto text-[10px] text-white/25">{r.date}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ БЛОК 9: FAQ ═══ */}
      <section className="px-4 py-10 max-w-3xl mx-auto">
        <h3 className="font-oswald font-bold text-2xl uppercase text-center text-white mb-6">
          Вопрос — Ответ
        </h3>
        <div className="space-y-2">
          {FAQ.map((f, i) => (
            <div key={i} className="rounded-xl overflow-hidden" style={cardStyle}>
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between gap-3 px-4 py-4 text-left">
                <span className="font-roboto text-sm font-semibold text-white/80">{f.q}</span>
                <Icon name={openFaq === i ? "ChevronUp" : "ChevronDown"} size={16} className="text-white/30 shrink-0" />
              </button>
              {openFaq === i && (
                <div className="px-4 pb-4 border-t border-white/[0.05]">
                  <p className="font-roboto text-sm text-white/50 leading-relaxed pt-3">{f.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ═══ БЛОК 10: КАРТА И КОНТАКТЫ ═══ */}
      <section id="contacts" className="px-4 py-10 max-w-5xl mx-auto scroll-mt-16">
        <h3 className="font-oswald font-bold text-2xl uppercase text-center text-white mb-6">
          Контакты
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-2xl p-6 space-y-4" style={cardStyle}>
            {[
              { icon: "MapPin",       text: "Калуга, ул. Кирова, 7 (офис)" },
              { icon: "Phone",        text: PHONE_DISPLAY },
              { icon: "Clock",        text: "Ежедневно 9:00–22:00" },
              { icon: "Globe",        text: "Выезд по всей России" },
            ].map(c => (
              <div key={c.text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${A}15` }}>
                  <Icon name={c.icon} size={14} style={{ color: A }} />
                </div>
                <span className="font-roboto text-sm text-white/65">{c.text}</span>
              </div>
            ))}
            <a href={PHONE_TEL}
              className="flex items-center justify-center gap-2 py-3 rounded-xl font-oswald font-bold text-base uppercase text-black w-full mt-2 active:scale-95 transition-all"
              style={{ background: `linear-gradient(135deg,${A},${A2})`, boxShadow: `0 4px 20px ${A}30` }}>
              <Icon name="Phone" size={18} />
              Позвонить
            </a>
          </div>
          <div className="rounded-2xl overflow-hidden" style={{ ...cardStyle, minHeight: "220px" }}>
            <iframe
              title="Скупка24 на карте — выкуп спецтехники Калуга"
              src="https://yandex.ru/map-widget/v1/?pt=36.2754,54.5293&z=15&l=map"
              width="100%" height="100%"
              style={{ border: 0, filter: "invert(0.85) hue-rotate(180deg)", minHeight: "220px", display: "block" }}
              loading="lazy"
              allowFullScreen
            />
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t border-white/[0.07] bg-[#0a0a0a] px-4 py-10 text-center">
        <div className="font-oswald text-white/40 uppercase tracking-wide text-sm mb-3">
          Скупка24 · Срочный выкуп спецтехники · По всей России
        </div>
        <a href={PHONE_TEL}
          className="font-oswald font-black text-3xl sm:text-4xl block mb-2"
          style={{ color: A, textShadow: `0 0 20px ${A}40` }}>
          {PHONE_DISPLAY}
        </a>
        <p className="font-roboto text-white/30 text-sm mb-5">
          Калуга, ул. Кирова, 7 · ежедневно 9:00–22:00 · Выезд по всей России
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a href={PHONE_TEL}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-oswald font-bold text-sm uppercase text-black active:scale-95"
            style={{ background: `linear-gradient(135deg,${A},${A2})` }}>
            <Icon name="Phone" size={16} />
            Заказать выезд оценщика
          </a>
          <Link to="/"
            className="inline-flex items-center gap-1.5 text-white/30 hover:text-[#FFD700] font-roboto text-sm transition-colors">
            <Icon name="ChevronLeft" size={14} />
            Скупка24 — главная
          </Link>
        </div>
      </footer>

      {/* ═══ ПЛАВАЮЩАЯ КНОПКА (мобильные) ═══ */}
      <a href={PHONE_TEL}
        className="sm:hidden fixed bottom-5 right-4 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-xl active:scale-95 transition-transform"
        style={{ background: `linear-gradient(135deg,${A},${A2})`, boxShadow: `0 6px 24px ${A}55` }}
        aria-label="Позвонить для выкупа спецтехники">
        <Icon name="Phone" size={24} className="text-black" />
      </a>
    </div>
  );
}
