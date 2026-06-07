import { useState } from "react";
import Icon from "@/components/ui/icon";
import PageSEO from "@/components/seo/PageSEO";
import Header from "@/components/skupka/Header";
import ContactsFooter from "@/components/skupka/ContactsFooter";

const SEND_LEAD_URL = "https://functions.poehali.dev/52666ff7-db52-4b6a-a90e-d60aeed699de";

const HERO_IMG = "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/13c9f8e4-9437-436b-9adc-52f0be22cfae.jpg";

const CATEGORIES = [
  {
    era: "Античная Греция",
    icon: "🏺",
    color: "#a78bfa",
    items: [
      { name: "Воин в доспехах (статуэтка)", period: "VI–IV в. до н.э.", price: "от 500 000 ₽", note: "Вотивные фигурки из святилищ, часто с посвятительными надписями" },
      { name: "Голова атлета / бога", period: "V–III в. до н.э.", price: "от 2 000 000 ₽", note: "Высокохудожественные работы эпохи классики и эллинизма" },
      { name: "Конная фигурка", period: "VII–IV в. до н.э.", price: "от 300 000 ₽", note: "Всадники из Лаконии и Беотии — характерные архаические формы" },
      { name: "Зеркало с рукоятью", period: "V–III в. до н.э.", price: "от 150 000 ₽", note: "Ручки в виде богинь, атлетов или животных — предметы туалета" },
    ]
  },
  {
    era: "Древний Рим",
    icon: "🏛️",
    color: "#60a5fa",
    items: [
      { name: "Портретный бюст", period: "I в. до н.э. – IV в. н.э.", price: "от 800 000 ₽", note: "Реалистичные портреты — характернейшая черта римского искусства" },
      { name: "Лар (домашний бог)", period: "I–III в. н.э.", price: "от 100 000 ₽", note: "Фигурки домашних богов-защитников — массовый, но ценный жанр" },
      { name: "Статуэтка Меркурия / Геркулеса", period: "I–III в. н.э.", price: "от 200 000 ₽", note: "Культовые фигурки торговцев и атлетов, хорошо сохраняются" },
      { name: "Конный полководец", period: "I–III в. н.э.", price: "от 3 000 000 ₽", note: "Крупная скульптура — редкость музейного уровня" },
    ]
  },
  {
    era: "Средневековье и Ренессанс",
    icon: "✝️",
    color: "#fbbf24",
    items: [
      { name: "Работы школы Донателло", period: "XV в.", price: "от 5 000 000 ₽", note: "Флорентийский ренессанс — основа мирового рынка скульптуры" },
      { name: "Готический реликварий", period: "XII–XV в.", price: "от 500 000 ₽", note: "Церковные предметы с позолотой и эмалью" },
      { name: "Бронзовая дверная ручка", period: "XIII–XVI в.", price: "от 50 000 ₽", note: "Декоративные изделия с растительным и животным орнаментом" },
      { name: "Плакетка с рельефом", period: "XV–XVI в.", price: "от 80 000 ₽", note: "Ренессансные бронзовые таблички — портреты, мифология" },
    ]
  },
  {
    era: "Восток и Буддизм",
    icon: "☸️",
    color: "#34d399",
    items: [
      { name: "Будда (тибетский / непальский)", period: "XII–XIX в.", price: "от 50 000 ₽", note: "Позолоченные бронзы тибетского буддизма — активный мировой рынок" },
      { name: "Бодхисаттва Гуаньинь", period: "XI–XVII в.", price: "от 200 000 ₽", note: "Китайская бронзовая скульптура с позолотой и изысканными деталями" },
      { name: "Японская нэцкэ (бронза)", period: "XVIII–XIX в.", price: "от 30 000 ₽", note: "Миниатюрная скульптура — отдельный коллекционный жанр" },
      { name: "Индийская apsara / nataraja", period: "X–XVI в.", price: "от 400 000 ₽", note: "Южноиндийские бронзы Чола — эталон коллекционного качества" },
    ]
  },
  {
    era: "XIX–XX век",
    icon: "🎨",
    color: "#fb923c",
    items: [
      { name: "Огюст Роден (отливки)", period: "1890–1920-е", price: "от 10 000 000 ₽", note: "Авторизованные отливки — исключительно высокий спрос на аукционах" },
      { name: "Антуан-Луи Бари (животные)", period: "1830–1870-е", price: "от 500 000 ₽", note: "Французский анималист, мастер динамичной бронзы" },
      { name: "Русская бронза XIX в.", period: "1850–1900-е", price: "от 80 000 ₽", note: "Каслинское литьё, Евгений Лансере — российская школа" },
      { name: "Ар-нуво / Ар-деко", period: "1890–1940-е", price: "от 150 000 ₽", note: "Европейская декоративная скульптура — хорошая ликвидность" },
    ]
  },
];

const FAKES = [
  { icon: "Magnet", title: "Магнит не прилипает", text: "Настоящая бронза — сплав меди и олова. Никакой реакции на магнит. Подделки из железа с бронзовым покрытием — реагируют." },
  { icon: "Leaf", title: "Патина не счищается", text: "Подлинная патина — результат окисления за десятилетия. Она уходит глубоко в металл. Химическая — поверхностная, легко царапается." },
  { icon: "Layers", title: "Толщина стенок", text: "Античные отливки — методом потерянного воска (cire perdue). Стенки тонкие и неравномерные. Современные копии обычно толще и тяжелее." },
  { icon: "Microscope", title: "Микроструктура металла", text: "Металлографический анализ показывает состав сплава и возраст металла. Нельзя подделать кристаллическую структуру古代бронзы." },
  { icon: "FileText", title: "Провенанс и документы", text: "Старые аукционные каталоги, письма, фотографии в интерьере — всё это подтверждает подлинность и многократно повышает цену." },
  { icon: "Eye", title: "Качество проработки", text: "Великие мастера — несравнимая детализация. Смотрите на волосы, складки ткани, выражение лица — фальшивки упрощают." },
];

const PROCESS = [
  { step: "01", title: "Фото или видео", text: "Сделайте фото под разными углами, покажите дно, клейма, повреждения — отправьте в мессенджер" },
  { step: "02", title: "Предварительная оценка", text: "Наш эксперт даст ориентир по стоимости в течение нескольких часов" },
  { step: "03", title: "Осмотр и экспертиза", text: "При визите проводим детальную атрибуцию: эпоха, мастерская, сохранность" },
  { step: "04", title: "Оплата сразу", text: "Наличными или переводом в день осмотра — без ожидания и торгов" },
];

export default function BronzeSculptures() {
  const [activeCat, setActiveCat] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (phone.replace(/\D/g, "").length < 10) return;
    fetch(SEND_LEAD_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone, name: "Клиент", category: "Бронзовые статуэтки", desc: "Заявка с формы оценки статуэтки" }) }).catch(() => {});
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <PageSEO
        title="Скупка бронзовой скульптуры в Калуге — антиквариат | Скупка24"
        description="Купим бронзовую скульптуру и статуэтки: Античность, Рим, Средневековье, Восток, XIX–XX вв. Бесплатная оценка эксперта. Скупка24 Калуга."
        keywords="скупка бронзы Калуга, бронзовые статуэтки Калуга, антиквариат бронза Калуга, оценка скульптуры"
        url="https://skypka24.com/bronze-sculptures"
        schema={{
          "@context": "https://schema.org",
          "@type": ["LocalBusiness", "PawnShop"],
          name: "Скупка24 — Скупка бронзы",
          description: "Скупка бронзовых скульптур и антиквариата в Калуге.",
          url: "https://skypka24.com/bronze-sculptures",
          telephone: "+79929990333",
          address: { "@type": "PostalAddress", streetAddress: "ул. Кирова, 7", addressLocality: "Калуга", addressCountry: "RU" },
        }}
      />
      <Header />

      {/* ══ HERO ══ */}
      <section className="relative min-h-[60vh] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <img src={HERO_IMG} alt="Бронзовые статуэтки" className="w-full h-full object-cover object-center opacity-45" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-[#080808]/55 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#080808]/85 via-transparent to-transparent" />
        </div>
        {/* Декоративные блики */}
        <div className="absolute top-12 right-[25%] w-1 h-1 rounded-full bg-[#a78bfa] opacity-70 animate-pulse" />
        <div className="absolute top-28 right-[40%] w-0.5 h-0.5 rounded-full bg-[#a78bfa] opacity-40 animate-pulse" style={{ animationDelay: "0.9s" }} />
        <div className="absolute top-20 right-[12%] w-1.5 h-1.5 rounded-full bg-[#a78bfa]/30 animate-pulse" style={{ animationDelay: "1.6s" }} />

        <div className="relative max-w-6xl mx-auto px-4 pb-14 pt-28">
          <div className="inline-flex items-center gap-2 bg-[#a78bfa]/15 border border-[#a78bfa]/40 text-[#a78bfa] font-roboto text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full mb-4">
            <Icon name="Gem" size={11} />
            Скупка антиквариата · Скупка24
          </div>
          <h1 className="font-oswald font-black text-4xl md:text-6xl lg:text-7xl uppercase leading-none mb-4">
            БРОНЗОВЫЕ<br />
            <span style={{
              background: "linear-gradient(90deg,#4c1d95,#7c3aed,#a78bfa,#ddd6fe,#a78bfa,#7c3aed,#4c1d95)",
              backgroundSize: "200% auto",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              animation: "purpleShimmer 3s linear infinite",
            }}>СТАТУЭТКИ</span>
          </h1>
          <p className="font-roboto text-white/60 text-base md:text-lg max-w-xl mb-6 leading-relaxed">
            Покупаем греческую и римскую бронзу, буддийскую скульптуру, работы Родена и Бари.
            Оценка за день — выплата сразу при визите.
          </p>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => setFormOpen(true)}
              className="inline-flex items-center gap-2 font-oswald font-bold text-sm uppercase tracking-wide px-6 py-3 transition-colors text-black"
              style={{ background: "#a78bfa" }}>
              <Icon name="Phone" size={16} />
              Оценить скульптуру
            </button>
            <a href="#sculptures" className="inline-flex items-center gap-2 border border-white/20 text-white/70 font-roboto text-sm px-6 py-3 hover:border-[#a78bfa]/50 hover:text-[#a78bfa] transition-colors">
              <Icon name="ChevronDown" size={16} />
              Таблица цен
            </a>
          </div>
        </div>
      </section>

      {/* ══ STATS ══ */}
      <section className="border-y border-[#a78bfa]/10 bg-[#0A0A0A]">
        <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { val: "3 000+", lbl: "лет истории скульптуры" },
            { val: "от 30 000 ₽", lbl: "минимальная выкупная цена" },
            { val: "$50 000 000+", lbl: "рекорд за греческую бронзу" },
            { val: "бесплатно", lbl: "осмотр и атрибуция" },
          ].map(s => (
            <div key={s.lbl} className="text-center">
              <div className="font-oswald font-black text-xl md:text-2xl" style={{ color: "#a78bfa" }}>{s.val}</div>
              <div className="font-roboto text-white/45 text-xs mt-0.5">{s.lbl}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ ТАБЛИЦА ЦЕН ══ */}
      <section id="sculptures" className="max-w-6xl mx-auto px-4 py-14 md:py-20">
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 border text-[10px] font-roboto uppercase tracking-widest px-2.5 py-1 rounded-full mb-3"
            style={{ background: "rgba(167,139,250,0.1)", borderColor: "rgba(167,139,250,0.3)", color: "#a78bfa" }}>
            <Icon name="Table" size={10} />
            Таблица цен
          </div>
          <h2 className="font-oswald font-bold text-3xl md:text-4xl uppercase">Что мы покупаем</h2>
          <p className="font-roboto text-white/45 text-sm mt-1">Цены ориентировочные — итоговая стоимость зависит от мастера, эпохи и сохранности</p>
        </div>

        <div className="flex gap-2 flex-wrap mb-6">
          {CATEGORIES.map((c, i) => (
            <button key={i} onClick={() => setActiveCat(i)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full font-roboto text-sm transition-all ${
                activeCat === i
                  ? "text-white font-bold"
                  : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white border border-white/10"
              }`}
              style={activeCat === i ? { background: CATEGORIES[i].color, color: "#000" } : {}}>
              <span>{c.icon}</span>
              {c.era}
            </button>
          ))}
        </div>

        <div className="rounded-xl overflow-hidden border" style={{ borderColor: `${CATEGORIES[activeCat].color}25` }}>
          <div className="bg-[#0D0D0D] border-b px-4 py-3 flex items-center gap-2" style={{ borderColor: `${CATEGORIES[activeCat].color}15` }}>
            <span className="text-xl">{CATEGORIES[activeCat].icon}</span>
            <span className="font-oswald font-bold text-base uppercase" style={{ color: CATEGORIES[activeCat].color }}>
              {CATEGORIES[activeCat].era}
            </span>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {CATEGORIES[activeCat].items.map((item, i) => (
              <div key={i} className="bg-[#0A0A0A] hover:bg-[#0D0D0D] transition-colors px-4 py-4 grid md:grid-cols-[1fr_auto] gap-3">
                <div>
                  <div className="font-oswald font-bold text-base text-white">{item.name}</div>
                  <div className="font-roboto text-white/40 text-xs mt-0.5">{item.period}</div>
                  <div className="font-roboto text-white/55 text-sm mt-1">{item.note}</div>
                </div>
                <div className="flex flex-col items-start md:items-end justify-center">
                  <div className="font-oswald font-black text-lg md:text-xl" style={{ color: CATEGORIES[activeCat].color }}>
                    {item.price}
                  </div>
                  <button onClick={() => setFormOpen(true)}
                    className="mt-1.5 text-[10px] font-roboto uppercase tracking-wide text-white/30 hover:text-[#a78bfa] transition-colors flex items-center gap-1">
                    оценить <Icon name="ArrowRight" size={10} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ КАК ОТЛИЧИТЬ ПОДДЕЛКУ ══ */}
      <section className="bg-[#0A0A0A] border-y border-white/5 py-14 md:py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-10">
            <div className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 text-white/50 text-[10px] font-roboto uppercase tracking-widest px-2.5 py-1 rounded-full mb-3">
              <Icon name="ShieldCheck" size={10} />
              Подлинность
            </div>
            <h2 className="font-oswald font-bold text-3xl md:text-4xl uppercase">Как отличить<br /><span style={{ color: "#a78bfa" }}>подделку от оригинала</span></h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FAKES.map((f, i) => (
              <div key={i} className="bg-[#0D0D0D] border border-white/[0.06] p-5 rounded-xl group hover:border-[#a78bfa]/20 transition-colors">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3 transition-colors"
                  style={{ background: "rgba(167,139,250,0.1)" }}>
                  <Icon name={f.icon} size={18} style={{ color: "#a78bfa" }} />
                </div>
                <div className="font-oswald font-bold text-base mb-1.5">{f.title}</div>
                <div className="font-roboto text-white/50 text-sm leading-relaxed">{f.text}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ КАК МЫ РАБОТАЕМ ══ */}
      <section className="max-w-6xl mx-auto px-4 py-14 md:py-20">
        <div className="mb-10">
          <div className="inline-flex items-center gap-1.5 text-[10px] font-roboto uppercase tracking-widest px-2.5 py-1 rounded-full mb-3 border"
            style={{ background: "rgba(167,139,250,0.1)", borderColor: "rgba(167,139,250,0.3)", color: "#a78bfa" }}>
            <Icon name="Zap" size={10} />
            Процесс скупки
          </div>
          <h2 className="font-oswald font-bold text-3xl md:text-4xl uppercase">Как мы <span style={{ color: "#a78bfa" }}>покупаем</span></h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PROCESS.map((p, i) => (
            <div key={i} className="relative bg-[#0D0D0D] border border-white/[0.06] p-5 rounded-xl">
              {i < PROCESS.length - 1 && (
                <div className="hidden lg:block absolute top-8 -right-2 z-10">
                  <Icon name="ArrowRight" size={14} className="text-white/15" />
                </div>
              )}
              <div className="font-oswald font-black text-4xl leading-none mb-3" style={{ color: "rgba(167,139,250,0.15)" }}>{p.step}</div>
              <div className="font-oswald font-bold text-base mb-1.5">{p.title}</div>
              <div className="font-roboto text-white/50 text-sm leading-relaxed">{p.text}</div>
            </div>
          ))}
        </div>

        <div className="mt-8 grid sm:grid-cols-3 gap-4">
          {[
            { icon: "BadgeCheck", title: "Мировые стандарты оценки", text: "Ориентируемся на Christie's, Sotheby's, Bonhams — актуальные результаты аукционов" },
            { icon: "Banknote", title: "Деньги в день визита", text: "Не откладываем на потом. Договорились — платим сразу, наличными или переводом" },
            { icon: "Lock", title: "Полная конфиденциальность", text: "Не спрашиваем историю владения. Анонимность продавца гарантирована" },
          ].map((w, i) => (
            <div key={i} className="border p-5 rounded-xl flex gap-3"
              style={{ background: "rgba(167,139,250,0.06)", borderColor: "rgba(167,139,250,0.18)" }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "rgba(167,139,250,0.15)" }}>
                <Icon name={w.icon} size={18} style={{ color: "#a78bfa" }} />
              </div>
              <div>
                <div className="font-oswald font-bold text-sm mb-1">{w.title}</div>
                <div className="font-roboto text-white/50 text-xs leading-relaxed">{w.text}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ CTA ══ */}
      <section className="relative overflow-hidden border-t py-14 md:py-20" style={{ borderColor: "rgba(167,139,250,0.1)", background: "#0A0A0A" }}>
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl pointer-events-none"
          style={{ background: "rgba(167,139,250,0.07)" }} />
        <div className="relative max-w-2xl mx-auto px-4 text-center">
          <div className="font-oswald font-black text-3xl md:text-5xl uppercase mb-3">
            Есть скульптура?<br />
            <span style={{ color: "#a78bfa" }}>Оценим бесплатно</span>
          </div>
          <p className="font-roboto text-white/50 text-sm md:text-base mb-8 leading-relaxed">
            Пришлите фото — ответим в течение дня. Или приходите в офис, осмотр бесплатный.
          </p>
          {!sent ? (
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+7 (999) 000-00-00"
                className="flex-1 bg-[#111] border border-[#333] text-white px-4 py-3 font-roboto text-sm focus:outline-none transition-colors placeholder:text-white/20"
                style={{ outline: "none" }}
                onFocus={e => e.currentTarget.style.borderColor = "rgba(167,139,250,0.6)"}
                onBlur={e => e.currentTarget.style.borderColor = "#333"}
              />
              <button onClick={handleSend}
                className="text-white font-oswald font-bold text-sm uppercase px-6 py-3 transition-opacity hover:opacity-80 whitespace-nowrap flex items-center gap-2"
                style={{ background: "#a78bfa", color: "#fff" }}>
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
            <a href="tel:+79929990333" className="font-roboto text-white/40 text-sm hover:text-[#a78bfa] transition-colors flex items-center gap-1.5">
              <Icon name="Phone" size={13} /> +7 (992) 999-03-33
            </a>
            <span className="text-white/15">·</span>
            <a href="https://t.me/skupka24" target="_blank" rel="noreferrer"
              className="font-roboto text-white/40 text-sm hover:text-[#a78bfa] transition-colors flex items-center gap-1.5">
              <Icon name="Send" size={13} /> Telegram
            </a>
          </div>
        </div>
      </section>

      {/* Форма-модал */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setFormOpen(false)}>
          <div className="bg-[#111] border rounded-2xl p-6 max-w-sm w-full" style={{ borderColor: "rgba(167,139,250,0.25)" }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div className="font-oswald font-bold text-lg uppercase">Оценить скульптуру</div>
              <button onClick={() => setFormOpen(false)} className="text-white/30 hover:text-white transition-colors">
                <Icon name="X" size={18} />
              </button>
            </div>
            {!sent ? (
              <>
                <p className="font-roboto text-white/50 text-sm mb-4">Оставьте номер — перезвоним и проконсультируем бесплатно.</p>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="+7 (999) 000-00-00"
                  className="w-full bg-[#0A0A0A] border border-[#333] text-white px-4 py-3 rounded-lg font-roboto text-sm focus:outline-none mb-3 placeholder:text-white/20" />
                <button onClick={handleSend}
                  className="w-full text-white font-oswald font-bold text-sm uppercase py-3 rounded-lg hover:opacity-80 transition-opacity"
                  style={{ background: "#a78bfa" }}>
                  Перезвоните мне
                </button>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="w-12 h-12 bg-emerald-500/15 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Icon name="CheckCircle" size={24} className="text-emerald-400" />
                </div>
                <div className="font-oswald font-bold text-base mb-1">Заявка принята!</div>
                <div className="font-roboto text-white/45 text-sm">Перезвоним в течение 30 минут</div>
              </div>
            )}
          </div>
        </div>
      )}

      <ContactsFooter />
      <style>{`
        @keyframes purpleShimmer {
          0% { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
      `}</style>
    </div>
  );
}