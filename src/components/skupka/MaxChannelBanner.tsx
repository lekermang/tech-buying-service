import Icon from "@/components/ui/icon";
import { ymGoal, Goals } from "@/lib/ym";

const MAX_CHANNEL = "https://max.ru/id402810962699_biz";
const MAX_BOT = "https://max.ru/id402810962699_bot";

const MaxChannelBanner = () => {
  return (
    <section className="relative bg-[#0D0D0D] py-12 md:py-16 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0077FF]/8 via-transparent to-[#0077FF]/4 pointer-events-none" />
      <div
        className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#0077FF]/15 blur-[120px] pointer-events-none"
        aria-hidden
      />

      <div className="container mx-auto px-4 max-w-5xl relative">
        <div className="rounded-lg border border-[#0077FF]/30 bg-gradient-to-br from-[#0077FF]/10 via-[#0D0D0D] to-[#0077FF]/5 p-6 md:p-10 shadow-[0_8px_40px_rgba(0,119,255,0.15)]">
          <div className="grid grid-cols-1 md:grid-cols-[auto,1fr,auto] gap-6 md:gap-8 items-center">
            <div className="relative w-20 h-20 md:w-24 md:h-24 mx-auto md:mx-0 shrink-0">
              <div className="absolute inset-0 rounded-2xl bg-[#0077FF] flex items-center justify-center shadow-[0_8px_24px_rgba(0,119,255,0.5)]">
                <span className="font-oswald font-extrabold text-white text-2xl md:text-3xl tracking-tight">
                  MAX
                </span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-green-400 ring-4 ring-[#0D0D0D] flex items-center justify-center">
                <Icon name="Check" size={14} className="text-black" />
              </div>
            </div>

            <div className="text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-[#0077FF]/15 border border-[#0077FF]/30 px-3 py-1 rounded-full mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="font-roboto text-[#0077FF] text-[11px] uppercase tracking-[0.2em] font-semibold">
                  Российский мессенджер
                </span>
              </div>
              <h2 className="font-oswald font-bold text-white text-2xl md:text-3xl uppercase tracking-wide mb-2">
                Скупка24 теперь в MAX
              </h2>
              <p className="font-roboto text-white/70 text-sm md:text-base leading-relaxed">
                Подпишитесь на канал — узнавайте о новых поступлениях, акциях
                и скидках первым. А наш бот примет вашу заявку, подскажет статус
                ремонта и соединит с менеджером — всё в одном приложении.
              </p>
            </div>

            <div className="flex flex-col gap-2.5 w-full md:w-auto md:min-w-[220px]">
              <a
                href={MAX_CHANNEL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => ymGoal(Goals.MAX_CLICK, { place: "banner_channel" })}
                className="group flex items-center justify-center gap-2 bg-[#0077FF] hover:bg-[#0066DD] text-white font-oswald font-bold uppercase tracking-wide text-sm py-3.5 px-5 rounded-md shadow-[0_4px_14px_rgba(0,119,255,0.4)] active:scale-95 transition-all"
              >
                <Icon name="Megaphone" size={18} />
                Канал компании
                <Icon
                  name="ArrowUpRight"
                  size={16}
                  className="opacity-70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                />
              </a>
              <a
                href={MAX_BOT}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => ymGoal(Goals.MAX_CLICK, { place: "banner_bot" })}
                className="group flex items-center justify-center gap-2 border-2 border-[#0077FF]/60 hover:border-[#0077FF] text-[#0077FF] hover:bg-[#0077FF]/10 font-oswald font-bold uppercase tracking-wide text-sm py-3 px-5 rounded-md active:scale-95 transition-all"
              >
                <Icon name="Bot" size={18} />
                Написать боту
                <Icon
                  name="ArrowUpRight"
                  size={16}
                  className="opacity-70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                />
              </a>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-[#0077FF]/20 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {[
              { icon: "Zap", label: "Заявка за минуту" },
              { icon: "ClipboardCheck", label: "Статус ремонта" },
              { icon: "BellRing", label: "Уведомления" },
              { icon: "MessageSquare", label: "Чат с менеджером" },
            ].map((f) => (
              <div
                key={f.label}
                className="flex items-center gap-2 text-white/60"
              >
                <Icon
                  name={f.icon as Parameters<typeof Icon>[0]["name"]}
                  size={16}
                  className="text-[#0077FF] shrink-0"
                />
                <span className="font-roboto text-xs md:text-sm">{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default MaxChannelBanner;
