/**
 * /vykup-avto — Страница срочного выкупа автомобилей.
 * SEO: PageSEO (document.title + meta + Schema.org), H1/H2/H3, alt-теги.
 * Дизайн в стиле Скупка24: тёмный, оранжево-красный акцент.
 */
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import PageSEO from "@/components/seo/PageSEO";
import funcUrls from "../../backend/func2url.json";

const LEAD_URL = (funcUrls as Record<string, string>)["send-lead"];
const PHONE_DISPLAY = "8 992 999-03-33";
const PHONE_TEL     = "tel:+79929990333";
const A  = "#FF6B1A";
const A2 = "#E63946";
const OG_IMG = "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/79c67669-1c7d-47c2-83ec-92fdf612be90.jpg";

/* ── Schema.org ── */
const SCHEMA_ORG = [
  {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "Скупка24 — Срочный выкуп автомобилей",
    description: "Срочный выкуп автомобилей за 1 час в Калуге. Любые марки и состояния.",
    url: "https://skypka24.com/vykup-avto",
    telephone: "+79929990333",
    openingHours: "Mo-Su 09:00-22:00",
    image: OG_IMG,
    address: { "@type": "PostalAddress", addressLocality: "Калуга", streetAddress: "ул. Кирова, 7", addressCountry: "RU" },
    geo: { "@type": "GeoCoordinates", latitude: 54.5293, longitude: 36.2754 },
    aggregateRating: { "@type": "AggregateRating", ratingValue: "5.0", reviewCount: "3460" },
  },
  {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Срочный выкуп автомобилей за 1 час",
    provider: { "@type": "LocalBusiness", name: "Скупка24" },
    description: "Выкуп любых автомобилей: новых, с пробегом, битых, аварийных, кредитных, без документов. Наличные или на карту в день сделки.",
    areaServed: "Калуга",
    offers: { "@type": "Offer", price: "100000", priceCurrency: "RUB", description: "Минимальная цена выкупа" },
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      { "@type": "Question", name: "Сколько времени занимает выкуп?", acceptedAnswer: { "@type": "Answer", text: "От звонка до денег в среднем 1–3 часа. Оценщик выезжает за 30 минут, осмотр занимает 15–30 минут, оформление договора — ещё 30 минут." } },
      { "@type": "Question", name: "Выкупаете ли авто после ДТП?", acceptedAnswer: { "@type": "Answer", text: "Да, выкупаем любые аварийные автомобили: с кузовным ремонтом, с раскрытыми подушками, тотальные." } },
      { "@type": "Question", name: "Какие документы нужны для выкупа?", acceptedAnswer: { "@type": "Answer", text: "Паспорт, ПТС, СТС. Если нет ПТС — выкупаем, помогаем с документами." } },
    ],
  },
];

/* ── Данные ── */
const CAR_PHOTOS = [
  { label: "BMW",         img: "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/a2d657c2-53d1-4303-8569-64d8f92092c6.jpg", alt: "Выкуп BMW в Калуге" },
  { label: "Mercedes",    img: "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/7c07539e-4e58-4838-8e62-7cf893f4c240.jpg", alt: "Выкуп Mercedes в Калуге" },
  { label: "Toyota",      img: "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/954130c4-6e1e-40ef-a977-530bc89cbedb.jpg", alt: "Выкуп Toyota в Калуге" },
  { label: "Kia / Hyundai", img: OG_IMG, alt: "Выкуп Kia Hyundai" },
  { label: "Битое авто",  img: "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/fcc59a52-6fe9-47fa-ba58-494698b75ef2.jpg", alt: "Выкуп битого автомобиля после ДТП" },
  { label: "Любое авто",  img: OG_IMG, alt: "Срочный выкуп любого автомобиля" },
];

const ADVANTAGES = [
  { icon: "Clock",        title: "Выезд за 30 минут",    desc: "Оценщик приедет к вам в любой район города" },
  { icon: "Banknote",     title: "Наличные или на карту", desc: "Деньги в день сделки, без задержек" },
  { icon: "FileCheck",    title: "Помощь с документами",  desc: "Сопроводим всю сделку от оценки до ДКП" },
  { icon: "ShieldCheck",  title: "Без ПТС — выкупаем",   desc: "Поможем с любой ситуацией по документам" },
  { icon: "CalendarDays", title: "9:00–22:00 ежедневно",  desc: "Работаем без выходных и праздников" },
  { icon: "BadgeCheck",   title: "Без скрытых комиссий",  desc: "Цена из оценки — цена в договоре" },
];

const CAR_TYPES = [
  { icon: "Wrench",       label: "Битые и аварийные" },
  { icon: "CreditCard",   label: "Кредитные и залоговые" },
  { icon: "Gauge",        label: "С большим пробегом" },
  { icon: "FileX",        label: "Без документов" },
  { icon: "AlertTriangle",label: "Не на ходу" },
  { icon: "Car",          label: "После ДТП" },
];

const STEPS = [
  { n: "01", icon: "PhoneCall",      title: "Заявка",   desc: "Позвоните или заполните форму — ответим за 5 минут" },
  { n: "02", icon: "ClipboardCheck", title: "Оценка",   desc: "Выедем к вам или встретимся в офисе. 15–30 минут" },
  { n: "03", icon: "FileSignature",  title: "Договор",  desc: "Подписываем ДКП, всё официально и прозрачно" },
  { n: "04", icon: "Banknote",       title: "Деньги",   desc: "Наличные или перевод на карту — прямо на месте" },
];

const REVIEWS = [
  { name: "Алексей К.", stars: 5, text: "Продал битый Ford за 3 часа. Оценщик приехал быстро, цена устроила, деньги получил на карту сразу.", date: "3 мая 2025" },
  { name: "Марина В.",  stars: 5, text: "Думала, что с кредитным авто будут проблемы — всё оказалось просто! Помогли погасить кредит и выдали разницу.", date: "15 апр 2025" },
  { name: "Дмитрий Н.", stars: 5, text: "Выкупили мою Toyota без ПТС. Объяснили весь процесс, никаких подводных камней. Рекомендую!", date: "28 мар 2025" },
];

const FAQ = [
  { q: "Сколько времени занимает выкуп?", a: "От звонка до денег в среднем 1–3 часа. Оценщик выезжает за 30 минут, осмотр 15–30 минут, оформление договора ещё 30 минут." },
  { q: "Какие документы нужны?", a: "В идеале: паспорт, ПТС, СТС. Если нет ПТС — всё равно выкупаем, помогаем с восстановлением документов." },
  { q: "Выкупаете ли авто после ДТП?", a: "Да, выкупаем любые аварийные авто: с кузовным ремонтом, раскрытыми подушками, тотальные. Оценим честно." },
  { q: "Можно продать авто без моего присутствия?", a: "Да, по доверенности. Уточните при звонке — расскажем, как оформить дистанционно." },
  { q: "Почему вам можно доверять?", a: "Работаем с 2015 года, 50 000+ сделок, рейтинг 5.0 на Яндекс.Картах. Официальный договор, открытые реквизиты." },
];

const CONDITIONS = [
  { id: "excellent", label: "Отличное",   mult: 1.0  },
  { id: "good",      label: "Хорошее",    mult: 0.88 },
  { id: "average",   label: "Среднее",    mult: 0.72 },
  { id: "damaged",   label: "Битое",      mult: 0.50 },
  { id: "dead",      label: "Не на ходу", mult: 0.38 },
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

function calcPrice(year: number, condition: string): string {
  if (!year || year < 1990 || year > 2025) return "";
  const age = 2025 - year;
  const base = Math.max(150_000, 2_500_000 - age * 80_000);
  const mult = CONDITIONS.find(c => c.id === condition)?.mult ?? 0.8;
  const lo = Math.round((base * mult * 0.88) / 1000) * 1000;
  const hi = Math.round((base * mult * 1.05) / 1000) * 1000;
  return `${lo.toLocaleString("ru-RU")} – ${hi.toLocaleString("ru-RU")} ₽`;
}

/* ── Компонент формы заявки ── */
function LeadForm({ place }: { place: string }) {
  const [name,    setName]    = useState("");
  const [phone,   setPhone]   = useState("+7");
  const [vin,     setVin]     = useState("");
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
          category: "Выкуп авто",
          desc: `Заявка со страницы /vykup-avto (${place})${vin ? ` | VIN/номер: ${vin}` : ""}`,
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
        <div className="font-roboto text-white/50 text-sm">Перезвоним в течение 5 минут</div>
      </div>
    </div>
  );

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <div className="font-roboto text-[11px] text-white/40 mb-1">Ваше имя <span className="text-red-400">*</span></div>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Иван"
            className={inp} style={{ ...inpStyle, borderColor: name.trim().length >= 2 ? `${A}55` : "rgba(255,255,255,0.1)" }} />
        </div>
        <div>
          <div className="font-roboto text-[11px] text-white/40 mb-1">Телефон <span className="text-red-400">*</span></div>
          <input type="tel" value={phone} onChange={e => handlePhone(e.target.value)} placeholder="+7 (999) 999-99-99"
            className={inp} style={{ ...inpStyle, borderColor: phoneOk ? `${A}55` : "rgba(255,255,255,0.1)" }} />
        </div>
      </div>
      <div>
        <div className="font-roboto text-[11px] text-white/40 mb-1">VIN или госномер <span className="text-white/20">(необязательно)</span></div>
        <input type="text" value={vin} onChange={e => setVin(e.target.value)}
          placeholder="А000АА 777 или WBAUF210..." className={inp} style={inpStyle} />
      </div>
      <label className="flex items-start gap-2 cursor-pointer" onClick={() => setAgree(!agree)}>
        <div className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center shrink-0 transition-all ${agree ? "bg-[#FF6B1A]" : "bg-white/10 border border-white/20"}`}>
          {agree && <Icon name="Check" size={10} className="text-white" />}
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
        className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-oswald font-bold text-base uppercase tracking-wide text-white active:scale-[0.98] transition-all disabled:opacity-40"
        style={{ background: `linear-gradient(135deg,${A},${A2})`, boxShadow: `0 6px 24px ${A}35` }}>
        <Icon name={sending ? "Loader2" : "Banknote"} size={20} className={sending ? "animate-spin" : ""} />
        {sending ? "Отправляю…" : "Получить деньги за авто"}
      </button>
    </form>
  );
}

/* ═══════════════════════════════════════════════════════════ */
export default function VykupAvto() {
  const [activePhoto, setActivePhoto] = useState(0);
  const [openFaq,     setOpenFaq]     = useState<number | null>(null);
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
    const r = calcPrice(y, calcCond);
    setCalcResult(r || "Укажите корректный год (1990–2025)");
  };

  const cardStyle = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" };
  const inp = "w-full px-4 py-3 rounded-xl font-roboto text-sm text-white/90 outline-none";
  const inpStyle = { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white overflow-x-hidden">

      <PageSEO
        title="Срочный выкуп авто за 1 час — дорого, любые автомобили | skypka24.com"
        description="Срочный выкуп автомобилей за 1 час. Оценка за 15 минут. Любые авто: битые, аварийные, кредитные, без документов. Деньги наличными или на карту. Звоните!"
        keywords="выкуп авто Калуга, срочный выкуп автомобилей, продать авто дорого, выкуп битых авто, выкуп кредитных авто"
        url="https://skypka24.com/vykup-avto"
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
          <a href={PHONE_TEL} className="sm:hidden flex items-center justify-center w-9 h-9 rounded-xl active:scale-95 transition-all"
            style={{ background: `${A}18`, border: `1px solid ${A}35`, color: A }}>
            <Icon name="Phone" size={16} />
          </a>
        </div>
      </header>

      {/* ═══ БЛОК 1: HERO ═══ */}
      <section className="relative overflow-hidden px-4 py-12 sm:py-16">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full"
            style={{ background: `radial-gradient(ellipse,${A}14 0%,transparent 70%)`, filter: "blur(80px)" }} />
          <div className="absolute inset-0 opacity-20"
            style={{ backgroundImage: `linear-gradient(${A}06 1px,transparent 1px),linear-gradient(90deg,${A}06 1px,transparent 1px)`, backgroundSize: "48px 48px" }} />
        </div>

        <div className="relative max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5 font-roboto text-[11px] font-semibold uppercase tracking-wider"
            style={{ background: `${A}15`, border: `1px solid ${A}30`, color: A }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: A }} />
            Срочный выкуп · Калуга · 9:00–22:00
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="font-oswald font-black uppercase leading-[0.9] mb-4"
                style={{ fontSize: "clamp(2.2rem,8vw,4rem)" }}>
                <span className="block text-white">Срочный выкуп</span>
                <span className="block" style={{ color: A, textShadow: `0 0 30px ${A}40` }}>автомобилей</span>
                <span className="block text-white">за 1 час</span>
              </h1>
              <h2 className="font-oswald text-white/45 font-normal uppercase tracking-wide text-base sm:text-lg mb-4">
                Выкупаем любые авто в день обращения
              </h2>
              <p className="font-roboto text-white/55 leading-relaxed text-sm sm:text-base mb-6">
                Продайте автомобиль <strong className="text-white/80">срочно и дорого</strong> без ожидания
                покупателей. Наличные или перевод на карту сразу после оформления.
              </p>

              <a href={PHONE_TEL} className="inline-flex items-center gap-3 mb-6 group">
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
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-oswald font-bold text-sm uppercase tracking-wide text-white active:scale-95 transition-all"
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
              <img src={OG_IMG} alt="Срочный выкуп автомобилей в Калуге — Скупка24"
                className="w-full h-full object-cover" />
              <div className="absolute inset-0"
                style={{ background: "linear-gradient(135deg,transparent 50%,rgba(13,13,13,0.6))" }} />
              <div className="absolute bottom-4 left-4">
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl backdrop-blur-sm"
                  style={{ background: "rgba(0,0,0,0.7)", border: `1px solid ${A}30` }}>
                  <Icon name="Zap" size={13} style={{ color: A }} />
                  <span className="font-roboto text-white text-xs">Оценка 15 минут · Деньги в день сделки</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ БЛОК 2: ГАЛЕРЕЯ ═══ */}
      <section className="px-4 py-10 max-w-5xl mx-auto">
        <h3 className="font-oswald font-bold text-xl uppercase text-white/75 mb-4 text-center">
          Выкупаем любые автомобили — выберите свой
        </h3>
        <div className="flex flex-wrap justify-center gap-2 mb-5">
          {CAR_PHOTOS.map((c, i) => (
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
          <img src={CAR_PHOTOS[activePhoto].img} alt={CAR_PHOTOS[activePhoto].alt}
            className="w-full h-full object-cover" key={activePhoto} />
          <div className="absolute inset-0"
            style={{ background: "linear-gradient(to top,rgba(0,0,0,0.55) 0%,transparent 55%)" }} />
          <div className="absolute bottom-3 left-0 right-0 text-center">
            <span className="font-oswald font-bold text-white/80 text-sm uppercase tracking-wider">
              {CAR_PHOTOS[activePhoto].alt}
            </span>
          </div>
        </div>
      </section>

      {/* ═══ БЛОК 3: КАЛЬКУЛЯТОР ═══ */}
      <section className="px-4 py-10">
        <div className="max-w-2xl mx-auto rounded-2xl p-6 sm:p-8"
          style={{ background: "linear-gradient(135deg,#161616,#111)", border: `1px solid ${A}20` }}>
          <div className="text-center mb-6">
            <h3 className="font-oswald font-bold text-2xl uppercase text-white mb-1">
              Оценка автомобиля онлайн
            </h3>
            <p className="font-roboto text-white/35 text-sm">Приблизительная стоимость — точную назовёт оценщик</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <div className="font-roboto text-[11px] text-white/40 mb-1.5">Год выпуска</div>
              <input type="number" value={calcYear} onChange={e => setCalcYear(e.target.value)}
                placeholder="2018" min={1990} max={2025} className={inp} style={inpStyle} />
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
            className="w-full py-3.5 rounded-xl font-oswald font-bold text-base uppercase tracking-wide text-white mb-4 transition-all active:scale-[0.98]"
            style={{ background: `linear-gradient(135deg,${A},${A2})`, boxShadow: `0 4px 20px ${A}30` }}>
            Рассчитать примерную цену
          </button>
          {calcResult && (
            <div className="flex items-center justify-between px-4 py-3 rounded-xl"
              style={{ background: `${A}12`, border: `1px solid ${A}30` }}>
              <div>
                <div className="font-roboto text-[10px] text-white/35 uppercase tracking-wider mb-0.5">Примерная оценка</div>
                <div className="font-oswald font-black text-2xl" style={{ color: A }}>{calcResult}</div>
              </div>
              <a href="#form"
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-oswald font-bold text-sm uppercase text-white active:scale-95"
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

      {/* ═══ БЛОК 5: КАКИЕ АВТО ═══ */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <h3 className="font-oswald font-bold text-2xl uppercase text-center text-white mb-2">
          Выкуп битых автомобилей и любых других
        </h3>
        <p className="font-roboto text-white/35 text-sm text-center mb-6">
          Продать авто срочно и дорого — без исключений
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {CAR_TYPES.map(t => (
            <div key={t.label} className="flex items-center gap-3 rounded-xl p-3.5" style={cardStyle}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${A}15`, border: `1px solid ${A}25` }}>
                <Icon name={t.icon} size={15} style={{ color: A }} />
              </div>
              <span className="font-roboto text-sm text-white/70">{t.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ БЛОК 6: КАК РАБОТАЕМ ═══ */}
      <section className="px-4 py-10 max-w-5xl mx-auto">
        <h3 className="font-oswald font-bold text-2xl uppercase text-center text-white mb-8">
          Как мы работаем — 4 простых шага
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
          style={{ background: "linear-gradient(135deg,#1a0800,#111)", border: `1px solid ${A}25`, boxShadow: `0 0 40px ${A}08` }}>
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{ background: `linear-gradient(90deg,transparent,${A}70,transparent)` }} />
          <div className="text-center mb-6">
            <h3 className="font-oswald font-bold text-2xl uppercase text-white mb-1">
              Получить деньги за авто
            </h3>
            <p className="font-roboto text-white/40 text-sm">Перезвоним за 5 минут и назначим удобное время</p>
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
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: r.stars }).map((_, i) => (
                  <Icon key={i} name="Star" size={13} style={{ color: "#FFD700", fill: "#FFD700" }} />
                ))}
              </div>
              <p className="font-roboto text-sm text-white/55 leading-relaxed mb-3">"{r.text}"</p>
              <div className="flex items-center justify-between">
                <span className="font-roboto text-xs font-semibold text-white/65">{r.name}</span>
                <span className="font-roboto text-[10px] text-white/25">{r.date}</span>
              </div>
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
                <div className="px-4 pb-4 pt-0 border-t border-white/[0.05]">
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
          Контакты и адрес
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-2xl p-6 space-y-4" style={cardStyle}>
            {[
              { icon: "MapPin",       text: "Калуга, ул. Кирова, 7" },
              { icon: "Phone",        text: PHONE_DISPLAY },
              { icon: "Clock",        text: "Ежедневно 9:00–22:00" },
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
              className="flex items-center justify-center gap-2 py-3 rounded-xl font-oswald font-bold text-base uppercase text-white w-full mt-2 active:scale-95 transition-all"
              style={{ background: `linear-gradient(135deg,${A},${A2})`, boxShadow: `0 4px 20px ${A}30` }}>
              <Icon name="Phone" size={18} />
              Позвонить
            </a>
          </div>
          <div className="rounded-2xl overflow-hidden" style={{ ...cardStyle, minHeight: "220px" }}>
            <iframe
              title="Скупка24 на карте — выкуп авто Калуга"
              src="https://yandex.ru/map-widget/v1/?pt=36.2754,54.5293&z=16&l=map"
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
          Скупка24 · Срочный выкуп авто · Калуга
        </div>
        <a href={PHONE_TEL}
          className="font-oswald font-black text-3xl sm:text-4xl block mb-2"
          style={{ color: A, textShadow: `0 0 20px ${A}40` }}>
          {PHONE_DISPLAY}
        </a>
        <p className="font-roboto text-white/30 text-sm mb-5">Калуга, ул. Кирова, 7 · ежедневно 9:00–22:00</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a href={PHONE_TEL}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-oswald font-bold text-sm uppercase text-white active:scale-95"
            style={{ background: `linear-gradient(135deg,${A},${A2})` }}>
            <Icon name="Phone" size={16} />
            Обратный звонок
          </a>
          <Link to="/" className="inline-flex items-center gap-1.5 text-white/30 hover:text-[#FFD700] font-roboto text-sm transition-colors">
            <Icon name="ChevronLeft" size={14} />
            Скупка24 — главная
          </Link>
        </div>
      </footer>

      {/* ═══ ПЛАВАЮЩАЯ КНОПКА (мобильные) ═══ */}
      <a href={PHONE_TEL}
        className="sm:hidden fixed bottom-5 right-4 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-xl active:scale-95 transition-transform"
        style={{ background: `linear-gradient(135deg,${A},${A2})`, boxShadow: `0 6px 24px ${A}55` }}
        aria-label="Позвонить для выкупа авто">
        <Icon name="Phone" size={24} className="text-white" />
      </a>
    </div>
  );
}
