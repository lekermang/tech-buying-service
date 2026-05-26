import Icon from "@/components/ui/icon";
import { ACCENT, HERO_IMG, STATS } from "./data";

interface IconsHeroProps {
  onOpenForm: () => void;
}

const IconsHero = ({ onOpenForm }: IconsHeroProps) => {
  return (
    <>
      {/* ══ HERO ══ */}
      <section className="relative min-h-[60vh] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <img src={HERO_IMG} alt="Православные иконы" className="w-full h-full object-cover object-center opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-[#080808]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#080808]/80 via-transparent to-transparent" />
        </div>

        {/* Тёплые янтарные частицы */}
        <div className="absolute top-10 right-[20%] w-1 h-1 rounded-full opacity-60 animate-pulse" style={{ background: ACCENT }} />
        <div className="absolute top-24 right-[35%] w-0.5 h-0.5 rounded-full opacity-40 animate-pulse" style={{ background: ACCENT, animationDelay: "0.7s" }} />
        <div className="absolute top-16 right-[10%] w-1.5 h-1.5 rounded-full opacity-30 animate-pulse" style={{ background: ACCENT, animationDelay: "1.4s" }} />
        <div className="absolute top-40 right-[50%] w-1 h-1 rounded-full opacity-50 animate-pulse" style={{ background: ACCENT, animationDelay: "2.1s" }} />

        <div className="relative max-w-6xl mx-auto px-4 pb-14 pt-28">
          <div className="inline-flex items-center gap-2 font-roboto text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full mb-4 border" style={{ background: `${ACCENT}20`, borderColor: `${ACCENT}60`, color: ACCENT }}>
            <Icon name="Church" size={11} />
            Скупка антиквариата · Скупка24
          </div>

          <h1 className="font-oswald font-black text-4xl md:text-6xl lg:text-7xl uppercase leading-none mb-2">ПРАВОСЛАВНЫЕ</h1>
          <h1 className="font-oswald font-black text-4xl md:text-6xl lg:text-7xl uppercase leading-none mb-4">
            <span style={{
              background: "linear-gradient(90deg,#8a5000,#c47a00,#e2a84b,#fde68a,#e2a84b,#c47a00,#8a5000)",
              backgroundSize: "200% auto",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              animation: "amberShimmer 3s linear infinite",
            }}>
              ИКОНЫ
            </span>
          </h1>

          <p className="font-roboto text-white/60 text-base md:text-lg max-w-xl mb-6 leading-relaxed">
            Покупаем иконы XVI–XIX века, оклады серебро и золото. Оценка бесплатно — честная цена по реставрационным каталогам и аукционным результатам.
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={onOpenForm}
              className="inline-flex items-center gap-2 font-oswald font-bold text-sm uppercase tracking-wide px-6 py-3 transition-colors"
              style={{ background: ACCENT, color: "#000" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#f0b85a")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = ACCENT)}
            >
              <Icon name="Phone" size={16} />
              Оценить икону
            </button>
            <a
              href="#icons"
              className="inline-flex items-center gap-2 border border-white/20 text-white/70 font-roboto text-sm px-6 py-3 transition-colors hover:text-white/90"
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = `${ACCENT}80`; (e.currentTarget as HTMLAnchorElement).style.color = ACCENT; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(255,255,255,0.2)"; (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.7)"; }}
            >
              <Icon name="ChevronDown" size={16} />
              Таблица цен
            </a>
          </div>
        </div>
      </section>

      {/* ══ STATS ══ */}
      <section className="border-y bg-[#0A0A0A]" style={{ borderColor: `${ACCENT}18` }}>
        <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map((s) => (
            <div key={s.lbl} className="text-center">
              <div className="font-oswald font-black text-xl md:text-2xl" style={{ color: ACCENT }}>{s.val}</div>
              <div className="font-roboto text-white/45 text-xs mt-0.5">{s.lbl}</div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
};

export default IconsHero;
