import Icon from "@/components/ui/icon";
import { ymGoal, Goals } from "@/lib/ym";
import {
  REPAIR_PHONE_DISPLAY,
  REPAIR_PHONE_TEL,
  REPAIR_ADDRESS_FULL,
  REPAIR_HOURS,
  REPAIR_MAP_SRC,
} from "./repairContacts";

const INFO = [
  { icon: "MapPin", title: "Адрес", value: REPAIR_ADDRESS_FULL },
  { icon: "Clock", title: "Режим работы", value: REPAIR_HOURS },
  { icon: "Navigation", title: "Как добраться", value: "Центр города, рядом с остановками на ул. Кирова" },
];

export default function RepairLocation() {
  return (
    <section id="contacts" className="px-4 sm:px-8 py-14 max-w-6xl mx-auto scroll-mt-20">
      <div className="text-center mb-9">
        <h2 className="font-oswald text-3xl sm:text-4xl font-bold uppercase">
          Где мы <span className="text-[#FFD700]">находимся</span>
        </h2>
        <p className="text-white/50 text-sm mt-2">Сервис в центре Калуги — приезжайте, ремонтируем при вас</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Инфо + телефон */}
        <div className="flex flex-col gap-3">
          {INFO.map((i) => (
            <div key={i.title} className="flex items-start gap-3 bg-[#111] border border-white/[0.07] rounded-xl p-4">
              <span className="shrink-0 w-10 h-10 rounded-xl bg-[#FFD700]/10 flex items-center justify-center">
                <Icon name={i.icon} size={20} className="text-[#FFD700]" />
              </span>
              <div>
                <div className="font-oswald text-sm uppercase text-white/50">{i.title}</div>
                <div className="text-white/90 text-[15px] mt-0.5">{i.value}</div>
              </div>
            </div>
          ))}

          <a
            href={REPAIR_PHONE_TEL}
            onClick={() => ymGoal(Goals.CALL_CLICK, { place: "repair_location" })}
            className="mt-1 bg-gradient-to-br from-[#1a1a1a] to-black border border-[#FFD700]/40 hover:border-[#FFD700] rounded-xl p-5 flex items-center gap-4 transition-colors group"
          >
            <span className="shrink-0 w-14 h-14 rounded-full bg-[radial-gradient(circle_at_30%_30%,#fff3a0,#ffd700_45%,#b8860b_100%)] flex items-center justify-center">
              <Icon name="Phone" size={24} className="text-black" />
            </span>
            <div>
              <div className="font-oswald text-[10px] uppercase tracking-[0.2em] text-[#FFD700]/70">Звоните — ответим сразу</div>
              <div className="font-oswald font-bold text-[#FFD700] text-2xl sm:text-3xl leading-none mt-0.5">
                {REPAIR_PHONE_DISPLAY}
              </div>
            </div>
          </a>
        </div>

        {/* Карта */}
        <div className="rounded-xl overflow-hidden border border-white/[0.08] min-h-[300px] lg:min-h-full">
          <iframe
            title="Карта проезда — Калуга, ул. Кирова, 7"
            src={REPAIR_MAP_SRC}
            className="w-full h-full min-h-[300px]"
            loading="lazy"
            allowFullScreen
          />
        </div>
      </div>
    </section>
  );
}
