import Icon from "@/components/ui/icon";
import Reveal from "@/components/skupka/Reveal";
import PremiumSection from "@/components/skupka/PremiumSection";

const HOW_STEPS = [
  { num: "01", icon: "MessageSquare", title: "Оставьте заявку", desc: "Опишите товар и загрузите фото через форму или позвоните нам" },
  { num: "02", icon: "Calculator", title: "Получите оценку", desc: "Наш специалист оценит товар за 15 минут и назовёт честную цену" },
  { num: "03", icon: "MapPin", title: "Приезжайте к нам", desc: "Выберите удобный филиал. Осмотр займёт не более 10 минут" },
  { num: "04", icon: "Banknote", title: "Получите деньги", desc: "Выплата наличными или переводом на карту в день обращения" },
];

const GUARANTEES = [
  { icon: "ShieldCheck", title: "Честная оценка", desc: "Работаем по рыночным ценам. Никаких скрытых комиссий и занижений." },
  { icon: "Clock", title: "Быстро — 15 минут", desc: "Оценка и выкуп за одно посещение. Ваше время ценим." },
  { icon: "FileText", title: "Официальный договор", desc: "Каждая сделка оформляется официально. Вы защищены законом." },
  { icon: "BadgeCheck", title: "Работаем с 2015 года", desc: "9 лет на рынке. Более 50 000 довольных клиентов." },
  { icon: "Repeat", title: "Выкуп или обмен", desc: "Можем выкупить или предложить товар в зачёт новой покупки." },
  { icon: "Star", title: "4.9 на картах", desc: "Рейтинг 4.9 на Яндекс Картах и Google. Проверьте отзывы сами." },
];

const InfoHowGuarantees = () => {
  return (
    <>
      {/* HOW IT WORKS — премиум в стиле Trade In */}
      <PremiumSection
        id="how"
        badge={{ icon: "Workflow", label: "Процесс", color: "blue" }}
        eyebrow="Как это работает"
        title={<>ПРОСТО И БЫСТРО<br /><span className="text-[#FFD700]">4 шага</span>{" "}<span className="text-sky-400">до денег.</span></>}
        accentA="rgba(255,215,0,0.08)"
        accentB="rgba(56,189,248,0.08)"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {HOW_STEPS.map((step, i) => (
            <Reveal key={step.num} delay={(i) as 0|1|2|3|4|5}>
              <div className="relative h-full">
                <div className="absolute -inset-1 bg-gradient-to-br from-[#FFD700]/10 to-sky-500/10 blur-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative bg-[#0D0D0D] border border-[#FFD700]/15 hover:border-[#FFD700]/40 p-5 md:p-6 h-full transition-colors group">
                  <div className="text-[3.5rem] md:text-[4.5rem] font-oswald font-bold text-[#FFD700]/[0.07] leading-none absolute top-1 right-3 select-none pointer-events-none">
                    {step.num}
                  </div>
                  <div className="relative">
                    <div className="w-11 h-11 md:w-12 md:h-12 bg-[#FFD700]/10 border border-[#FFD700]/30 rounded-md flex items-center justify-center mb-3 group-hover:bg-[#FFD700]/20 transition-colors">
                      <Icon name={step.icon} size={20} className="text-[#FFD700]" />
                    </div>
                    <div className="font-oswald font-bold text-[10px] text-[#FFD700]/60 uppercase tracking-widest mb-1">Шаг {step.num}</div>
                    <h3 className="font-oswald text-base md:text-lg font-bold uppercase mb-2 leading-tight">{step.title}</h3>
                    <p className="font-roboto text-white/50 text-xs md:text-sm leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </PremiumSection>

      {/* GUARANTEES — премиум в стиле Trade In */}
      <PremiumSection
        id="guarantees"
        badge={{ icon: "ShieldCheck", label: "Надёжность", color: "gold" }}
        eyebrow="Гарантии"
        title={<><span className="text-[#FFD700]">Честно</span>, официально,<br />уже 9 лет.</>}
        accentA="rgba(255,215,0,0.10)"
        accentB="rgba(255,184,0,0.06)"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {GUARANTEES.map((g, i) => (
            <Reveal key={g.title} delay={(i) as 0|1|2|3|4|5}>
              <div className="relative group h-full">
                <div className="absolute -inset-1 bg-gradient-to-br from-[#FFD700]/10 to-transparent blur-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <div className="relative bg-[#0D0D0D] border border-[#FFD700]/15 hover:border-[#FFD700]/40 p-5 md:p-6 h-full flex gap-4 sm:block transition-colors">
                  <div className="w-11 h-11 md:w-12 md:h-12 shrink-0 bg-[#FFD700]/10 border border-[#FFD700]/30 rounded-md flex items-center justify-center sm:mb-4 group-hover:bg-[#FFD700]/20 transition-colors">
                    <Icon name={g.icon} size={22} className="text-[#FFD700]" />
                  </div>
                  <div>
                    <h3 className="font-oswald text-base md:text-lg font-bold uppercase mb-1 md:mb-2 leading-tight">{g.title}</h3>
                    <p className="font-roboto text-white/50 text-xs md:text-sm leading-relaxed">{g.desc}</p>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </PremiumSection>
    </>
  );
};

export default InfoHowGuarantees;