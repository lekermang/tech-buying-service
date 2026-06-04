import Icon from "@/components/ui/icon";
import { ymGoal, Goals } from "@/lib/ym";
import { REPAIR_PHONE_DISPLAY, REPAIR_PHONE_TEL } from "./repairContacts";

const ADVANTAGES = [
  { icon: "MapPin", text: "Сервис в центре Калуги — ул. Кирова, 7" },
  { icon: "Zap", text: "Ремонт за 20–60 минут (срочные случаи)" },
  { icon: "BadgeCheck", text: "Детали класса «Оригинал» и «Премиум»" },
  { icon: "Gift", text: "Бесплатная диагностика" },
  { icon: "Clock", text: "Работаем с 9:00 до 21:00 без выходных" },
];

export default function RepairHero({ onOrder }: { onOrder: () => void }) {
  return (
    <section className="relative overflow-hidden px-4 sm:px-8 pt-14 pb-12 sm:pt-20 sm:pb-16 bg-gradient-to-b from-[#1a1a1a] to-[#0d0d0d]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(255,215,0,0.08) 0%, transparent 70%)" }}
      />
      <div className="relative max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-[#FFD700]/10 border border-[#FFD700]/30 text-[#FFD700] px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium mb-5">
          <Icon name="MapPin" size={14} />
          Сервисный центр Apple в Калуге
        </div>
        <h1 className="font-oswald font-bold uppercase leading-[1.05] text-3xl sm:text-5xl mb-4">
          Ремонт Apple в Калуге —
          <br />
          <span className="text-[#FFD700]">быстро, качественно, с гарантией</span>
        </h1>
        <p className="text-white/50 text-sm sm:text-lg max-w-xl leading-relaxed mb-6">
          iPhone, iPad, MacBook и другие телефоны. Замена экранов, аккумуляторов, ремонт после воды.
          Срочный ремонт при вас.
        </p>

        {/* Преимущества-галочки */}
        <ul className="grid sm:grid-cols-2 gap-y-2.5 gap-x-6 mb-8 text-left">
          {ADVANTAGES.map((a) => (
            <li key={a.text} className="flex items-center gap-2.5 text-white/80 text-sm sm:text-[15px]">
              <span className="shrink-0 w-6 h-6 rounded-full bg-[#FFD700]/15 flex items-center justify-center">
                <Icon name={a.icon} size={14} className="text-[#FFD700]" />
              </span>
              {a.text}
            </li>
          ))}
        </ul>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onOrder}
            className="bg-[#FFD700] hover:bg-[#ffed4a] text-black font-oswald font-bold tracking-wide px-8 py-3.5 rounded-lg text-base transition-colors inline-flex items-center justify-center gap-2"
          >
            Рассчитать стоимость
            <Icon name="ArrowRight" size={18} />
          </button>
          <a
            href={REPAIR_PHONE_TEL}
            onClick={() => ymGoal(Goals.CALL_CLICK, { place: "repair_hero" })}
            className="border border-[#FFD700]/40 hover:border-[#FFD700] text-[#FFD700] px-8 py-3.5 rounded-lg text-base font-oswald font-bold tracking-wide transition-colors inline-flex items-center justify-center gap-2"
          >
            <Icon name="Phone" size={18} />
            {REPAIR_PHONE_DISPLAY}
          </a>
        </div>
      </div>
    </section>
  );
}
