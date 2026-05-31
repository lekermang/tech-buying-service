import Icon from "@/components/ui/icon";
import AppleWidget from "@/components/skupka/AppleWidget";
import RepairWidget from "@/components/skupka/RepairWidget";
import UsedGoodsSearch from "@/components/skupka/UsedGoodsSearch";

export default function HeroRight() {
  return (
    <div id="evaluate" className="space-y-2.5 relative">
      {/* Декоративное свечение за стаком */}
      <div className="absolute -inset-4 bg-gradient-to-br from-[#FFD700]/8 via-transparent to-[#FFD700]/5 blur-2xl pointer-events-none" />

      <a href="/catalog"
        className="hero-premium-btn group relative flex items-center justify-between bg-gradient-to-br from-white/[0.06] via-white/[0.02] to-transparent backdrop-blur-sm border-2 border-[#FFD700]/30 hover:border-[#FFD700]/80 hover:-translate-y-0.5 hover:shadow-[0_15px_40px_-10px_rgba(255,215,0,0.45)] px-4 py-4 transition-all duration-300 w-full rounded-xl overflow-hidden">
        {/* Hover-сияние */}
        <span aria-hidden className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ background: "radial-gradient(circle at center, rgba(255,215,0,0.22) 0%, transparent 50%)" }} />
        {/* Верхняя золотая полоска */}
        <span aria-hidden className="absolute top-0 left-0 right-0 h-px opacity-70" style={{ background: "linear-gradient(90deg, transparent, rgba(255,215,0,0.9), transparent)" }} />
        {/* Угловые засечки */}
        <span aria-hidden className="absolute top-1.5 left-1.5 w-3 h-3 border-l-2 border-t-2 border-[#FFD700]/70 group-hover:border-[#FFD700] transition-colors" />
        <span aria-hidden className="absolute top-1.5 right-1.5 w-3 h-3 border-r-2 border-t-2 border-[#FFD700]/70 group-hover:border-[#FFD700] transition-colors" />
        <span aria-hidden className="absolute bottom-1.5 left-1.5 w-3 h-3 border-l-2 border-b-2 border-[#FFD700]/70 group-hover:border-[#FFD700] transition-colors" />
        <span aria-hidden className="absolute bottom-1.5 right-1.5 w-3 h-3 border-r-2 border-b-2 border-[#FFD700]/70 group-hover:border-[#FFD700] transition-colors" />

        <div className="relative flex items-center gap-3">
          {/* Медальон с conic-градиентом */}
          <div className="relative w-12 h-12 rounded-full p-[2px] bg-[conic-gradient(from_0deg,#b8860b,#ffd700,#fff3a0,#ffd700,#b8860b)] shadow-[0_0_18px_rgba(255,215,0,0.45)] group-hover:shadow-[0_0_28px_rgba(255,215,0,0.7)] transition-all">
            <div className="w-full h-full rounded-full bg-gradient-to-br from-[#1a1a1a] to-[#0D0D0D] flex items-center justify-center group-hover:scale-105 transition-transform">
              <Icon name="ShoppingBag" size={22} className="text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.5)]" />
            </div>
          </div>
          <div>
            <span className="font-oswald font-bold text-base uppercase text-white tracking-wide block leading-tight drop-shadow-[0_0_8px_rgba(255,215,0,0.15)]">Каталог новой техники</span>
            <span className="inline-flex items-center gap-1 bg-[#FFD700]/15 text-[#FFD700] font-oswald font-bold text-[10px] px-2 py-0.5 rounded-sm border border-[#FFD700]/40 mt-1 uppercase tracking-wider">
              <Icon name="ShieldCheck" size={9} />
              Гарантия 2 года
            </span>
          </div>
        </div>
        <Icon name="ChevronRight" size={22} className="relative text-[#FFD700]/60 group-hover:text-[#FFD700] group-hover:translate-x-1 transition-all shrink-0 drop-shadow-[0_0_6px_rgba(255,215,0,0.4)]" />
      </a>

      <div className="relative">
        <UsedGoodsSearch />
      </div>

      <div className="relative">
        <RepairWidget />
      </div>

      <a href="/tools"
        className="hero-premium-btn group relative flex items-center justify-between bg-gradient-to-br from-white/[0.06] via-white/[0.02] to-transparent backdrop-blur-sm border-2 border-[#FFD700]/30 hover:border-[#FFD700]/80 hover:-translate-y-0.5 hover:shadow-[0_15px_40px_-10px_rgba(255,215,0,0.45)] px-4 py-4 transition-all duration-300 w-full rounded-xl overflow-hidden">
        <span aria-hidden className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ background: "radial-gradient(circle at center, rgba(120,255,180,0.18) 0%, transparent 50%)" }} />
        <span aria-hidden className="absolute top-0 left-0 right-0 h-px opacity-70" style={{ background: "linear-gradient(90deg, transparent, rgba(255,215,0,0.9), transparent)" }} />
        <span aria-hidden className="absolute top-1.5 left-1.5 w-3 h-3 border-l-2 border-t-2 border-[#FFD700]/70 group-hover:border-[#FFD700] transition-colors" />
        <span aria-hidden className="absolute top-1.5 right-1.5 w-3 h-3 border-r-2 border-t-2 border-[#FFD700]/70 group-hover:border-[#FFD700] transition-colors" />
        <span aria-hidden className="absolute bottom-1.5 left-1.5 w-3 h-3 border-l-2 border-b-2 border-[#FFD700]/70 group-hover:border-[#FFD700] transition-colors" />
        <span aria-hidden className="absolute bottom-1.5 right-1.5 w-3 h-3 border-r-2 border-b-2 border-[#FFD700]/70 group-hover:border-[#FFD700] transition-colors" />

        <div className="relative flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-full p-[2px] bg-[conic-gradient(from_0deg,#b8860b,#ffd700,#fff3a0,#ffd700,#b8860b)] shadow-[0_0_18px_rgba(255,215,0,0.45)] group-hover:shadow-[0_0_28px_rgba(255,215,0,0.7)] transition-all">
            <div className="w-full h-full rounded-full bg-gradient-to-br from-[#1a1a1a] to-[#0D0D0D] flex items-center justify-center group-hover:scale-105 transition-transform">
              <Icon name="Hammer" size={22} className="text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.5)]" />
            </div>
          </div>
          <div>
            <span className="font-oswald font-bold text-base uppercase text-white tracking-wide leading-tight block drop-shadow-[0_0_8px_rgba(255,215,0,0.15)]">Каталог инструментов и расходных материалов</span>
            <span className="inline-flex items-center gap-1 bg-[#FFD700]/15 text-[#FFD700] font-oswald font-bold text-[10px] px-2 py-0.5 rounded-sm border border-[#FFD700]/40 mt-1 uppercase tracking-wider">
              <Icon name="ShieldCheck" size={9} />
              Гарантия 3 года
            </span>
          </div>
        </div>
        <Icon name="ChevronRight" size={22} className="relative text-[#FFD700]/60 group-hover:text-[#FFD700] group-hover:translate-x-1 transition-all shrink-0 drop-shadow-[0_0_6px_rgba(255,215,0,0.4)]" />
      </a>

      <div className="relative">
        <AppleWidget compact />
      </div>

      {/* Мобильный Apple-слоган — показывается ниже lg */}
      <div className="lg:hidden flex items-center justify-center gap-2 bg-black/40 border border-[#FFD700]/25 px-4 py-2.5 rounded-full mt-3">
        <span className="text-lg">🍎</span>
        <span className="font-oswald font-bold text-[#FFD700] text-sm uppercase tracking-wide">Купим дороже всех Apple технику!</span>
      </div>
    </div>
  );
}
