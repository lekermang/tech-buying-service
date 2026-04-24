import Icon from "@/components/ui/icon";
import Reveal from "@/components/skupka/Reveal";

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
      {/* HOW IT WORKS */}
      <section id="how" className="py-14 md:py-20 bg-[#111] border-t border-[#FFD700]/10">
        <div className="max-w-7xl mx-auto px-4">
          <Reveal className="mb-8 md:mb-12">
            <p className="font-roboto text-[#FFD700] text-sm uppercase tracking-widest mb-2">Процесс</p>
            <h2 className="font-oswald text-3xl md:text-5xl font-bold">КАК ЭТО<br />РАБОТАЕТ</h2>
          </Reveal>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-8">
            {HOW_STEPS.map((step, i) => (
              <Reveal key={step.num} delay={(i) as 0|1|2|3|4|5}>
                <div className="relative">
                  <div className="text-[4rem] md:text-[5rem] font-oswald font-bold text-[#FFD700]/5 leading-none absolute -top-3 -left-2 select-none pointer-events-none">
                    {step.num}
                  </div>
                  <div className="relative">
                    <div className="w-12 h-12 md:w-14 md:h-14 border-2 border-[#FFD700] flex items-center justify-center mb-4">
                      <Icon name={step.icon} size={22} className="text-[#FFD700]" />
                    </div>
                    {i < HOW_STEPS.length - 1 && (
                      <div className="hidden md:block absolute top-7 left-14 right-0 h-px bg-[#FFD700]/20" />
                    )}
                    <h3 className="font-oswald text-base md:text-xl font-bold uppercase mb-2">{step.title}</h3>
                    <p className="font-roboto text-white/50 text-xs md:text-sm leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* GUARANTEES */}
      <section id="guarantees" className="py-14 md:py-20 border-t border-[#FFD700]/10">
        <div className="max-w-7xl mx-auto px-4">
          <Reveal className="mb-8 md:mb-12">
            <p className="font-roboto text-[#FFD700] text-sm uppercase tracking-widest mb-2">Надёжность</p>
            <h2 className="font-oswald text-3xl md:text-5xl font-bold">НАШИ<br />ГАРАНТИИ</h2>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[#FFD700]/10">
            {GUARANTEES.map((g, i) => (
              <Reveal key={g.title} delay={(i) as 0|1|2|3|4|5}>
                <div className="bg-[#0D0D0D] p-5 md:p-8 hover:bg-[#1A1A1A] transition-colors group h-full flex gap-4 sm:block">
                  <div className="w-12 h-12 shrink-0 bg-[#FFD700]/10 border border-[#FFD700]/20 flex items-center justify-center sm:mb-4 group-hover:bg-[#FFD700]/20 transition-colors">
                    <Icon name={g.icon} size={24} className="text-[#FFD700]" />
                  </div>
                  <div>
                    <h3 className="font-oswald text-lg md:text-xl font-bold uppercase mb-1 md:mb-2">{g.title}</h3>
                    <p className="font-roboto text-white/50 text-xs md:text-sm leading-relaxed">{g.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default InfoHowGuarantees;
