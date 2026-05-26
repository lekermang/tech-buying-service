import { useState } from "react";
import Icon from "@/components/ui/icon";
import Header from "@/components/skupka/Header";
import ContactsFooter from "@/components/skupka/ContactsFooter";

const HERO_IMG = "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/0d17247e-bac8-456f-9aa9-00bfe13e451d.jpg";

const COINS = [
  {
    era: "Древний Рим",
    icon: "🏛️",
    color: "#FFD700",
    items: [
      { name: "Ауреус (золото)", period: "I–IV в. н.э.", price: "от 300 000 ₽", note: "Портреты императоров — Нерон, Август, Константин" },
      { name: "Денарий (серебро)", period: "III в. до н.э. – III в. н.э.", price: "от 5 000 ₽", note: "Самая массовая монета Рима, огромное разнообразие" },
      { name: "Сестерций (бронза)", period: "I–III в. н.э.", price: "от 15 000 ₽", note: "Крупные бронзовые монеты с детальными портретами" },
      { name: "Солид (поздний Рим)", period: "IV–VI в. н.э.", price: "от 50 000 ₽", note: "Золото позднеримской и ранневизантийской эпохи" },
    ]
  },
  {
    era: "Древняя Греция",
    icon: "⚱️",
    color: "#e2c96e",
    items: [
      { name: "Тетрадрахма Афин", period: "V–IV в. до н.э.", price: "от 150 000 ₽", note: "«Сова Афины» — самая узнаваемая монета античности" },
      { name: "Статер (золото)", period: "IV–III в. до н.э.", price: "от 500 000 ₽", note: "Александр Македонский, Лисимах, городские выпуски" },
      { name: "Драхма", period: "V–I в. до н.э.", price: "от 30 000 ₽", note: "Серебро полисов: Коринф, Сиракузы, Эгина" },
      { name: "Декадрахма", period: "V–IV в. до н.э.", price: "от 2 000 000 ₽", note: "Редчайшие монеты — музейного уровня" },
    ]
  },
  {
    era: "Парфия и Персия",
    icon: "🌙",
    color: "#c084fc",
    items: [
      { name: "Парфянская драхма", period: "III в. до н.э. – III в. н.э.", price: "от 8 000 ₽", note: "Портреты царей с тиарой и луком" },
      { name: "Сасанидский дирхем", period: "III–VII в. н.э.", price: "от 10 000 ₽", note: "Тонкое серебро, зороастрийская символика" },
      { name: "Ахеменидский дарик", period: "VI–IV в. до н.э.", price: "от 400 000 ₽", note: "Золото царей Кира и Дария — редчайшие экземпляры" },
    ]
  },
  {
    era: "Древняя Русь",
    icon: "⚔️",
    color: "#60a5fa",
    items: [
      { name: "Златник Владимира", period: "X–XI в.", price: "от 5 000 000 ₽", note: "Единственные золотые монеты Киевской Руси — мировая редкость" },
      { name: "Сребреник", period: "X–XI в.", price: "от 1 000 000 ₽", note: "Серебряные монеты первых князей-христиан" },
      { name: "Чешуйки (серебро)", period: "XIV–XVIII в.", price: "от 1 000 ₽", note: "Массовые монеты Московского царства" },
    ]
  },
];

const AUTHENTICITY = [
  { icon: "Search", title: "Визуальный осмотр", text: "Изучаем стиль чеканки, портрет, легенду — каждая эпоха имеет характерные черты. Подделки часто грубее оригиналов." },
  { icon: "Microscope", title: "Металлографический анализ", text: "Спектральный анализ состава металла. Римский ауреус — 99% золото. Любое отклонение — повод насторожиться." },
  { icon: "Scale", title: "Взвешивание", text: "Каждый тип монеты имеет стандарт веса. Отклонение более 5% — серьёзный сигнал." },
  { icon: "BookOpen", title: "Сверка с каталогами", text: "Используем RIC, SNG, BMCRE и другие международные каталоги для атрибуции и проверки." },
  { icon: "Award", title: "Патина и износ", text: "Подлинная патина формируется веками. Химически нанесённая выглядит равномерно и часто имеет неприятный запах." },
  { icon: "History", title: "Провенанс", text: "История владения монетой — важнейший фактор. Старые коллекции, аукционные лоты с историей ценятся выше." },
];

const PROCESS = [
  { step: "01", title: "Фото или визит", text: "Пришлите фото монеты (аверс, реверс, гурт) в мессенджер или привезите лично" },
  { step: "02", title: "Предварительная оценка", text: "В течение 2 часов дадим ориентировочную стоимость по фото" },
  { step: "03", title: "Экспертиза на месте", text: "При визите проводим полную проверку подлинности и финальную оценку" },
  { step: "04", title: "Оплата в день обращения", text: "Платим наличными или переводом сразу — без задержек и торгов" },
];

export default function AncientCoins() {
  const [activeEra, setActiveEra] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    if (phone.replace(/\D/g, "").length < 10) return;
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <Header />

      {/* ══ HERO ══ */}
      <section className="relative min-h-[60vh] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <img src={HERO_IMG} alt="Древние монеты" className="w-full h-full object-cover object-center opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-[#080808]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#080808]/80 via-transparent to-transparent" />
        </div>
        {/* Золотые частицы */}
        <div className="absolute top-10 right-[20%] w-1 h-1 rounded-full bg-[#FFD700] opacity-60 animate-pulse" />
        <div className="absolute top-24 right-[35%] w-0.5 h-0.5 rounded-full bg-[#FFD700] opacity-40 animate-pulse" style={{ animationDelay: "0.7s" }} />
        <div className="absolute top-16 right-[10%] w-1.5 h-1.5 rounded-full bg-[#FFD700]/30 animate-pulse" style={{ animationDelay: "1.4s" }} />

        <div className="relative max-w-6xl mx-auto px-4 pb-14 pt-28">
          <div className="inline-flex items-center gap-2 bg-[#FFD700]/15 border border-[#FFD700]/40 text-[#FFD700] font-roboto text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full mb-4">
            <Icon name="Coins" size={11} />
            Скупка антиквариата · Скупка24
          </div>
          <h1 className="font-oswald font-black text-4xl md:text-6xl lg:text-7xl uppercase leading-none mb-4">
            ДРЕВНИЕ<br />
            <span style={{
              background: "linear-gradient(90deg,#7a5800,#c89b00,#FFD700,#fff7b0,#FFD700,#c89b00,#7a5800)",
              backgroundSize: "200% auto",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              animation: "goldShimmer 3s linear infinite",
            }}>МОНЕТЫ</span>
          </h1>
          <p className="font-roboto text-white/60 text-base md:text-lg max-w-xl mb-6 leading-relaxed">
            Покупаем римские ауреусы, греческие драхмы, монеты Киевской Руси и Парфии.
            Оценка за 2 часа — честная цена по международным каталогам.
          </p>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => setFormOpen(true)}
              className="inline-flex items-center gap-2 bg-[#FFD700] text-black font-oswald font-bold text-sm uppercase tracking-wide px-6 py-3 hover:bg-yellow-400 transition-colors">
              <Icon name="Phone" size={16} />
              Оценить монету
            </button>
            <a href="#coins" className="inline-flex items-center gap-2 border border-white/20 text-white/70 font-roboto text-sm px-6 py-3 hover:border-[#FFD700]/50 hover:text-[#FFD700] transition-colors">
              <Icon name="ChevronDown" size={16} />
              Таблица цен
            </a>
          </div>
        </div>
      </section>

      {/* ══ STATS ══ */}
      <section className="border-y border-[#FFD700]/10 bg-[#0A0A0A]">
        <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { val: "2 000+", lbl: "лет истории монет" },
            { val: "от 1 000 ₽", lbl: "минимальная выкупная цена" },
            { val: "до 5 000 000 ₽", lbl: "выплачено за одну монету" },
            { val: "в день", lbl: "оплата при визите" },
          ].map(s => (
            <div key={s.lbl} className="text-center">
              <div className="font-oswald font-black text-xl md:text-2xl text-[#FFD700]">{s.val}</div>
              <div className="font-roboto text-white/45 text-xs mt-0.5">{s.lbl}</div>
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
          <h2 className="font-oswald font-bold text-3xl md:text-4xl uppercase">Что мы покупаем</h2>
          <p className="font-roboto text-white/45 text-sm mt-1">Цены ориентировочные — итоговая стоимость зависит от сохранности и редкости</p>
        </div>

        {/* Табы эпох */}
        <div className="flex gap-2 flex-wrap mb-6">
          {COINS.map((c, i) => (
            <button key={i} onClick={() => setActiveEra(i)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full font-roboto text-sm transition-all ${
                activeEra === i
                  ? "bg-[#FFD700] text-black font-bold"
                  : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white border border-white/10"
              }`}>
              <span>{c.icon}</span>
              {c.era}
            </button>
          ))}
        </div>

        {/* Таблица */}
        <div className="rounded-xl overflow-hidden border border-[#FFD700]/15">
          <div className="bg-[#0D0D0D] border-b border-[#FFD700]/10 px-4 py-3 flex items-center gap-2">
            <span className="text-xl">{COINS[activeEra].icon}</span>
            <span className="font-oswald font-bold text-base uppercase" style={{ color: COINS[activeEra].color }}>
              {COINS[activeEra].era}
            </span>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {COINS[activeEra].items.map((item, i) => (
              <div key={i} className="bg-[#0A0A0A] hover:bg-[#0D0D0D] transition-colors px-4 py-4 grid md:grid-cols-[1fr_auto] gap-3">
                <div>
                  <div className="font-oswald font-bold text-base text-white">{item.name}</div>
                  <div className="font-roboto text-white/40 text-xs mt-0.5">{item.period}</div>
                  <div className="font-roboto text-white/55 text-sm mt-1">{item.note}</div>
                </div>
                <div className="flex flex-col items-start md:items-end justify-center">
                  <div className="font-oswald font-black text-lg md:text-xl" style={{ color: COINS[activeEra].color }}>
                    {item.price}
                  </div>
                  <button onClick={() => setFormOpen(true)}
                    className="mt-1.5 text-[10px] font-roboto uppercase tracking-wide text-white/30 hover:text-[#FFD700] transition-colors flex items-center gap-1">
                    оценить <Icon name="ArrowRight" size={10} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ КАК ОПРЕДЕЛИТЬ ПОДЛИННОСТЬ ══ */}
      <section className="bg-[#0A0A0A] border-y border-white/5 py-14 md:py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-10">
            <div className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 text-white/50 text-[10px] font-roboto uppercase tracking-widest px-2.5 py-1 rounded-full mb-3">
              <Icon name="ShieldCheck" size={10} />
              Экспертиза
            </div>
            <h2 className="font-oswald font-bold text-3xl md:text-4xl uppercase">Как определить<br /><span className="text-[#FFD700]">подлинность</span></h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {AUTHENTICITY.map((a, i) => (
              <div key={i} className="bg-[#0D0D0D] border border-white/[0.06] hover:border-[#FFD700]/20 transition-colors p-5 rounded-xl group">
                <div className="w-9 h-9 rounded-lg bg-[#FFD700]/10 flex items-center justify-center mb-3 group-hover:bg-[#FFD700]/15 transition-colors">
                  <Icon name={a.icon} size={18} className="text-[#FFD700]" />
                </div>
                <div className="font-oswald font-bold text-base mb-1.5">{a.title}</div>
                <div className="font-roboto text-white/50 text-sm leading-relaxed">{a.text}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ КАК МЫ РАБОТАЕМ ══ */}
      <section className="max-w-6xl mx-auto px-4 py-14 md:py-20">
        <div className="mb-10">
          <div className="inline-flex items-center gap-1.5 bg-[#FFD700]/10 border border-[#FFD700]/30 text-[#FFD700] text-[10px] font-roboto uppercase tracking-widest px-2.5 py-1 rounded-full mb-3">
            <Icon name="Zap" size={10} />
            Процесс скупки
          </div>
          <h2 className="font-oswald font-bold text-3xl md:text-4xl uppercase">Как мы <span className="text-[#FFD700]">покупаем</span></h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PROCESS.map((p, i) => (
            <div key={i} className="relative bg-[#0D0D0D] border border-white/[0.06] p-5 rounded-xl">
              {i < PROCESS.length - 1 && (
                <div className="hidden lg:block absolute top-8 -right-2 z-10">
                  <Icon name="ArrowRight" size={14} className="text-[#FFD700]/30" />
                </div>
              )}
              <div className="font-oswald font-black text-4xl text-[#FFD700]/15 leading-none mb-3">{p.step}</div>
              <div className="font-oswald font-bold text-base mb-1.5">{p.title}</div>
              <div className="font-roboto text-white/50 text-sm leading-relaxed">{p.text}</div>
            </div>
          ))}
        </div>

        {/* Почему мы */}
        <div className="mt-8 grid sm:grid-cols-3 gap-4">
          {[
            { icon: "BadgeCheck", title: "Честная цена", text: "Оцениваем по мировым аукционным результатам — Roma Numismatics, CNG, Naville" },
            { icon: "Banknote", title: "Наличные сразу", text: "Оплата в день визита. Без «позвоню завтра» и многоступенчатых согласований" },
            { icon: "Lock", title: "Конфиденциально", text: "Не спрашиваем, откуда коллекция. Полная анонимность для продавца" },
          ].map((w, i) => (
            <div key={i} className="bg-gradient-to-br from-[#FFD700]/10 to-transparent border border-[#FFD700]/20 p-5 rounded-xl flex gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#FFD700]/15 flex items-center justify-center shrink-0">
                <Icon name={w.icon} size={18} className="text-[#FFD700]" />
              </div>
              <div>
                <div className="font-oswald font-bold text-sm mb-1">{w.title}</div>
                <div className="font-roboto text-white/50 text-xs leading-relaxed">{w.text}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ CTA БЛОК ══ */}
      <section className="relative overflow-hidden border-t border-[#FFD700]/10 bg-[#0A0A0A] py-14 md:py-20">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#FFD700]/8 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-2xl mx-auto px-4 text-center">
          <div className="font-oswald font-black text-3xl md:text-5xl uppercase mb-3">
            Есть монеты?<br /><span className="text-[#FFD700]">Оценим за 2 часа</span>
          </div>
          <p className="font-roboto text-white/50 text-sm md:text-base mb-8 leading-relaxed">
            Пришлите фото — ответим быстро. Или приходите в офис — оценка бесплатная.
          </p>
          {!sent ? (
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+7 (999) 000-00-00"
                className="flex-1 bg-[#111] border border-[#333] focus:border-[#FFD700]/60 text-white px-4 py-3 font-roboto text-sm focus:outline-none transition-colors placeholder:text-white/20"
              />
              <button onClick={handleSend}
                className="bg-[#FFD700] text-black font-oswald font-bold text-sm uppercase px-6 py-3 hover:bg-yellow-400 transition-colors whitespace-nowrap flex items-center gap-2">
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
            <a href="tel:+79929990333" className="font-roboto text-white/40 text-sm hover:text-[#FFD700] transition-colors flex items-center gap-1.5">
              <Icon name="Phone" size={13} /> +7 (992) 999-03-33
            </a>
            <span className="text-white/15">·</span>
            <a href="https://t.me/skupka24" target="_blank" rel="noreferrer"
              className="font-roboto text-white/40 text-sm hover:text-[#FFD700] transition-colors flex items-center gap-1.5">
              <Icon name="Send" size={13} /> Telegram
            </a>
          </div>
        </div>
      </section>

      {/* Форма-модал */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setFormOpen(false)}>
          <div className="bg-[#111] border border-[#FFD700]/25 rounded-2xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div className="font-oswald font-bold text-lg uppercase">Оценить монету</div>
              <button onClick={() => setFormOpen(false)} className="text-white/30 hover:text-white transition-colors">
                <Icon name="X" size={18} />
              </button>
            </div>
            {!sent ? (
              <>
                <p className="font-roboto text-white/50 text-sm mb-4">Оставьте номер — перезвоним в течение 30 минут и проконсультируем бесплатно.</p>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="+7 (999) 000-00-00"
                  className="w-full bg-[#0A0A0A] border border-[#333] focus:border-[#FFD700]/60 text-white px-4 py-3 rounded-lg font-roboto text-sm focus:outline-none mb-3 placeholder:text-white/20" />
                <button onClick={handleSend}
                  className="w-full bg-[#FFD700] text-black font-oswald font-bold text-sm uppercase py-3 rounded-lg hover:bg-yellow-400 transition-colors">
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
        @keyframes goldShimmer {
          0% { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
      `}</style>
    </div>
  );
}
