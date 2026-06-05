/**
 * Блок прямых ссылок на подстраницы ремонта — для главной страницы.
 * Располагается после PremiumServicesGrid.
 */
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";

const LINKS = [
  { href: "/remont-iphone-kaluga",        icon: "Smartphone",      label: "Ремонт iPhone в Калуге",  keywords: "ремонт айфона калуга · замена экрана · аккумулятор", accent: "#fff3a0" },
  { href: "/remont-samsung-kaluga",       icon: "Smartphone",      label: "Ремонт Samsung в Калуге", keywords: "ремонт samsung galaxy калуга · снятие frp",           accent: "#93c5fd" },
  { href: "/remont-xiaomi-kaluga",        icon: "Smartphone",      label: "Ремонт Xiaomi в Калуге",  keywords: "ремонт xiaomi redmi poco калуга",                     accent: "#86efac" },
  { href: "/zamena-stekla-kaluga",        icon: "Layers",          label: "Замена стекла в Калуге",  keywords: "переклейка тачскрина калуга · oca-клей",              accent: "#c4b5fd" },
  { href: "/zamena-akkumulyatora-kaluga", icon: "BatteryCharging", label: "Замена аккумулятора",     keywords: "замена аккумулятора телефона калуга",                 accent: "#6ee7b7" },
  { href: "/remont-posle-vody-kaluga",    icon: "Droplets",        label: "Ремонт после воды",       keywords: "ремонт утопленника калуга · уз-промывка",             accent: "#7dd3fc" },
  { href: "/bga-pajka-kaluga",            icon: "Cpu",             label: "BGA-пайка в Калуге",      keywords: "bga пайка компонентный ремонт калуга",                accent: "#fca5a5" },
  { href: "/snyatie-frp-kaluga",          icon: "Unlock",          label: "Снятие FRP и iCloud",     keywords: "снятие frp samsung xiaomi · разблокировка icloud",    accent: "#fdba74" },
];

export default function RepairLinksOnIndex() {
  return (
    <section className="relative px-4 pb-8 -mt-2 max-w-6xl mx-auto">
      {/* Заголовок-разделитель */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(255,140,0,0.15)", border: "1px solid rgba(255,140,0,0.25)" }}>
            <Icon name="Wrench" size={14} style={{ color: "#ff8c00" }} />
          </div>
          <span className="font-oswald font-bold text-base uppercase tracking-wide text-white/70">
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

      {/* Сетка: 2 колонки на мобиле, 4 на планшете, 4 на десктопе */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {LINKS.map(l => (
          <Link
            key={l.href}
            to={l.href}
            className="group relative flex flex-col gap-2 rounded-xl p-3.5 overflow-hidden transition-all duration-200"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = `${l.accent}0d`;
              el.style.borderColor = `${l.accent}35`;
              el.style.transform = "translateY(-2px)";
              el.style.boxShadow = `0 8px 20px rgba(0,0,0,0.35), 0 0 14px ${l.accent}18`;
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = "rgba(255,255,255,0.03)";
              el.style.borderColor = "rgba(255,255,255,0.07)";
              el.style.transform = "translateY(0)";
              el.style.boxShadow = "none";
            }}
          >
            {/* Верхняя линия-акцент при hover */}
            <div className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
              style={{ background: `linear-gradient(90deg,transparent,${l.accent}70,transparent)` }} />

            {/* Иконка + стрелка */}
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${l.accent}18`, border: `1px solid ${l.accent}28` }}>
                <Icon name={l.icon} size={15} style={{ color: l.accent, filter: `drop-shadow(0 0 5px ${l.accent}70)` }} />
              </div>
              <Icon name="ChevronRight" size={12}
                className="opacity-0 group-hover:opacity-70 transition-all group-hover:translate-x-0.5 shrink-0"
                style={{ color: l.accent }} />
            </div>

            {/* Название */}
            <div>
              <div className="font-oswald font-bold text-[13px] sm:text-sm uppercase leading-tight text-white/90 group-hover:text-white transition-colors">
                {l.label}
              </div>
              <div className="font-roboto text-[10px] leading-snug mt-1"
                style={{ color: `${l.accent}70` }}>
                {l.keywords}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
