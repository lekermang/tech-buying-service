import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import Icon from "@/components/ui/icon";

interface Crumb {
  label: string;
  to?: string;
}

interface GlobalNavProps {
  crumbs?: Crumb[];
  ctaLabel?: string;
  ctaHref?: string;
  ctaOnClick?: () => void;
  phone?: boolean;
}

const REPAIR_PHONE_TEL = "tel:+79929990333";
const REPAIR_PHONE_DISPLAY = "+7 (992) 999-03-33";

export default function GlobalNav({
  crumbs = [],
  ctaLabel,
  ctaHref,
  ctaOnClick,
  phone = true,
}: GlobalNavProps) {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isHome = location.pathname === "/";

  return (
    <nav
      className={`sticky top-0 z-50 flex items-center justify-between px-4 sm:px-8 h-14 border-b transition-all duration-200 ${
        scrolled
          ? "bg-[#0d0d0d]/95 border-[#FFD700]/15 backdrop-blur-md"
          : "bg-[#0d0d0d]/80 border-transparent backdrop-blur-sm"
      }`}
    >
      {/* Левая часть — логотип + хлебные крошки */}
      <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
        {!isHome && (
          <Link
            to="/"
            className="flex items-center gap-1.5 shrink-0 group"
          >
            <div className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors"
              style={{ background: "rgba(255,215,0,0.10)", border: "1px solid rgba(255,215,0,0.25)" }}>
              <Icon name="ChevronLeft" size={13} className="text-[#FFD700]" />
            </div>
            <span className="font-oswald font-bold text-sm hidden xs:block"
              style={{ color: "rgba(255,215,0,0.85)" }}>
              Скупка<span className="text-[#FFD700]">24</span>
            </span>
          </Link>
        )}
        {isHome && (
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#FFD700,#d4a017)" }}>
              <Icon name="Zap" size={13} className="text-black" />
            </div>
            <span className="font-oswald font-bold text-sm text-[#FFD700] uppercase tracking-wider">Скупка24</span>
          </Link>
        )}

        {crumbs.map((crumb, i) => (
          <div key={i} className="flex items-center gap-1.5 min-w-0">
            <Icon name="ChevronRight" size={11} className="text-white/20 shrink-0" />
            {crumb.to ? (
              <Link to={crumb.to} className="font-roboto text-xs text-white/50 hover:text-white/80 transition-colors truncate max-w-[120px] sm:max-w-none">
                {crumb.label}
              </Link>
            ) : (
              <span className="font-roboto text-xs text-white/35 truncate max-w-[120px] sm:max-w-[200px]">
                {crumb.label}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Правая часть */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0 ml-3">
        {phone && (
          <a
            href={REPAIR_PHONE_TEL}
            className="hidden sm:inline-flex items-center gap-1.5 text-[#FFD700] font-oswald font-bold text-sm hover:text-[#ffed4a] transition-colors min-h-[44px]"
          >
            <Icon name="Phone" size={14} />
            {REPAIR_PHONE_DISPLAY}
          </a>
        )}
        {(ctaLabel && (ctaHref || ctaOnClick)) && (
          ctaHref ? (
            <Link
              to={ctaHref}
              className="inline-flex items-center gap-1.5 text-black font-oswald font-bold uppercase tracking-wide px-4 py-2.5 rounded-xl text-sm min-h-[44px] active:scale-95 transition-all"
              style={{ background: "linear-gradient(135deg,#fff3a0,#FFD700,#d4a017)" }}
            >
              {ctaLabel}
            </Link>
          ) : (
            <button
              onClick={ctaOnClick}
              className="inline-flex items-center gap-1.5 text-black font-oswald font-bold uppercase tracking-wide px-4 py-2.5 rounded-xl text-sm min-h-[44px] active:scale-95 transition-all"
              style={{ background: "linear-gradient(135deg,#fff3a0,#FFD700,#d4a017)" }}
            >
              {ctaLabel}
            </button>
          )
        )}
        {/* Мобильный телефон */}
        {phone && (
          <a href={REPAIR_PHONE_TEL} className="sm:hidden flex items-center justify-center w-10 h-10 rounded-xl text-[#FFD700]"
            style={{ background: "rgba(255,215,0,0.08)", border: "1px solid rgba(255,215,0,0.2)" }}>
            <Icon name="Phone" size={17} />
          </a>
        )}
      </div>
    </nav>
  );
}
