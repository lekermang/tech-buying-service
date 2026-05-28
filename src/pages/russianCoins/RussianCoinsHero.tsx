import Icon from "@/components/ui/icon";
import { HERO_IMG, STATS } from "./RussianCoinsData";

interface Props {
  onOpenForm: () => void;
}

export default function RussianCoinsHero({ onOpenForm }: Props) {
  return (
    <>
      {/* ══ HERO ══ */}
      <section className="relative min-h-[60vh] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={HERO_IMG}
            alt="Царские монеты России"
            className="w-full h-full object-cover object-center opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-[#080808]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#080808]/80 via-transparent to-transparent" />
        </div>

        {/* Золотые частицы */}
        <div
          className="absolute top-10 right-[20%] w-1 h-1 rounded-full bg-[#FFD700] opacity-60 animate-pulse"
        />
        <div
          className="absolute top-24 right-[35%] w-0.5 h-0.5 rounded-full bg-[#FFD700] opacity-40 animate-pulse"
          style={{ animationDelay: "0.7s" }}
        />
        <div
          className="absolute top-16 right-[10%] w-1.5 h-1.5 rounded-full bg-[#FFD700]/30 animate-pulse"
          style={{ animationDelay: "1.4s" }}
        />
        <div
          className="absolute top-40 right-[50%] w-1 h-1 rounded-full bg-[#FFD700]/50 animate-pulse"
          style={{ animationDelay: "2.1s" }}
        />

        <div className="relative max-w-6xl mx-auto px-4 pb-14 pt-28">
          <div className="inline-flex items-center gap-2 bg-[#FFD700]/15 border border-[#FFD700]/40 text-[#FFD700] font-roboto text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full mb-4">
            <Icon name="Coins" size={11} />
            Скупка антиквариата · Скупка24
          </div>

          <h1 className="font-oswald font-black text-4xl md:text-6xl lg:text-7xl uppercase leading-none mb-2">
            ЦАРСКИЕ МОНЕТЫ
          </h1>
          <h1 className="font-oswald font-black text-4xl md:text-6xl lg:text-7xl uppercase leading-none mb-4">
            <span
              style={{
                background:
                  "linear-gradient(90deg,#7a5800,#c89b00,#FFD700,#fff7b0,#FFD700,#c89b00,#7a5800)",
                backgroundSize: "200% auto",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                animation: "goldShimmer 3s linear infinite",
              }}
            >
              РОССИЙСКОЙ ИМПЕРИИ
            </span>
          </h1>

          <p className="font-roboto text-white/60 text-base md:text-lg max-w-xl mb-6 leading-relaxed">
            Покупаем монеты Киевской Руси, Московского государства и
            Российской Империи. Оценка за 2 часа — честная цена по
            нумизматическим каталогам.
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={onOpenForm}
              className="inline-flex items-center gap-2 bg-[#FFD700] text-black font-oswald font-bold text-sm uppercase tracking-wide px-6 py-3 hover:bg-yellow-400 transition-colors"
            >
              <Icon name="Phone" size={16} />
              Оценить монету
            </button>
            <a
              href="#coins"
              className="inline-flex items-center gap-2 border border-white/20 text-white/70 font-roboto text-sm px-6 py-3 hover:border-[#FFD700]/50 hover:text-[#FFD700] transition-colors"
            >
              <Icon name="ChevronDown" size={16} />
              Таблица цен
            </a>
          </div>
        </div>
      </section>

      {/* ══ STATS ══ */}
      <section className="border-y border-[#FFD700]/10 bg-[#0A0A0A]">
        <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map((s) => (
            <div key={s.lbl} className="text-center">
              <div className="font-oswald font-black text-xl md:text-2xl text-[#FFD700]">
                {s.val}
              </div>
              <div className="font-roboto text-white/45 text-xs mt-0.5">
                {s.lbl}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
