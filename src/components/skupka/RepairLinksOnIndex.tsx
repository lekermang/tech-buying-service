/**
 * Компактная полоска прямых ссылок на подстраницы ремонта — для главной страницы.
 * Располагается после PremiumServicesGrid.
 */
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";

const LINKS = [
  { href: "/remont-iphone-kaluga",        icon: "Smartphone",      label: "Ремонт iPhone",      accent: "#fff3a0" },
  { href: "/remont-samsung-kaluga",       icon: "Smartphone",      label: "Ремонт Samsung",     accent: "#93c5fd" },
  { href: "/remont-xiaomi-kaluga",        icon: "Smartphone",      label: "Ремонт Xiaomi",      accent: "#86efac" },
  { href: "/zamena-stekla-kaluga",        icon: "Layers",          label: "Замена стекла",      accent: "#c4b5fd" },
  { href: "/zamena-akkumulyatora-kaluga", icon: "BatteryCharging", label: "Замена аккумулятора", accent: "#6ee7b7" },
  { href: "/remont-posle-vody-kaluga",    icon: "Droplets",        label: "После воды",         accent: "#7dd3fc" },
  { href: "/bga-pajka-kaluga",            icon: "Cpu",             label: "BGA-пайка",          accent: "#fca5a5" },
  { href: "/snyatie-frp-kaluga",          icon: "Unlock",          label: "Снятие FRP",         accent: "#fdba74" },
];

export default function RepairLinksOnIndex() {
  return (
    <section className="relative px-4 pb-6 -mt-2 max-w-6xl mx-auto">
      {/* Заголовок-разделитель */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md flex items-center justify-center"
            style={{ background: "rgba(255,140,0,0.15)", border: "1px solid rgba(255,140,0,0.25)" }}>
            <Icon name="Wrench" size={12} style={{ color: "#ff8c00" }} />
          </div>
          <span className="font-oswald font-bold text-sm uppercase tracking-wide text-white/70">
            Ремонт телефонов
          </span>
        </div>
        <span className="h-px flex-1" style={{ background: "rgba(255,255,255,0.06)" }} />
        <Link to="/repair"
          className="flex items-center gap-1 font-roboto text-[11px] uppercase tracking-widest transition-colors"
          style={{ color: "rgba(255,215,0,0.45)" }}
          onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,215,0,0.85)")}
          onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,215,0,0.45)")}>
          Все услуги
          <Icon name="ChevronRight" size={11} />
        </Link>
      </div>

      {/* Горизонтальная прокрутка на мобиле, сетка на десктопе */}
      <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 sm:grid sm:grid-cols-4 lg:grid-cols-8 snap-x snap-mandatory scrollbar-none">
        {LINKS.map(l => (
          <Link
            key={l.href}
            to={l.href}
            className="group flex-none snap-start sm:flex-auto flex items-center gap-2 rounded-xl px-3 py-2.5 transition-all duration-200"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              minWidth: "130px",
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = `${l.accent}0d`;
              el.style.borderColor = `${l.accent}30`;
              el.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = "rgba(255,255,255,0.03)";
              el.style.borderColor = "rgba(255,255,255,0.07)";
              el.style.transform = "translateY(0)";
            }}
          >
            <Icon name={l.icon} size={13} style={{ color: l.accent, filter: `drop-shadow(0 0 4px ${l.accent}60)`, flexShrink: 0 }} />
            <span className="font-roboto text-[12px] leading-tight whitespace-nowrap" style={{ color: "rgba(255,255,255,0.7)" }}>
              {l.label}
            </span>
            <Icon name="ChevronRight" size={10}
              className="ml-auto opacity-0 group-hover:opacity-60 transition-opacity shrink-0"
              style={{ color: l.accent }} />
          </Link>
        ))}
      </div>
    </section>
  );
}
