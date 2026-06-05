import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";

const LINKS = [
  {
    href: "/remont-iphone-kaluga",
    icon: "Smartphone",
    label: "Ремонт iPhone в Калуге",
    keywords: "ремонт айфона калуга · замена экрана · аккумулятор",
    accent: "#fff3a0",
  },
  {
    href: "/remont-samsung-kaluga",
    icon: "Smartphone",
    label: "Ремонт Samsung в Калуге",
    keywords: "ремонт samsung galaxy калуга · снятие frp",
    accent: "#93c5fd",
  },
  {
    href: "/remont-xiaomi-kaluga",
    icon: "Smartphone",
    label: "Ремонт Xiaomi в Калуге",
    keywords: "ремонт xiaomi redmi poco калуга",
    accent: "#86efac",
  },
  {
    href: "/zamena-stekla-kaluga",
    icon: "Layers",
    label: "Замена стекла в Калуге",
    keywords: "переклейка тачскрина калуга · oca-клей",
    accent: "#c4b5fd",
  },
  {
    href: "/zamena-akkumulyatora-kaluga",
    icon: "BatteryCharging",
    label: "Замена аккумулятора",
    keywords: "замена аккумулятора телефона калуга",
    accent: "#6ee7b7",
  },
  {
    href: "/remont-posle-vody-kaluga",
    icon: "Droplets",
    label: "Ремонт после воды",
    keywords: "ремонт утопленника калуга · уз-промывка",
    accent: "#7dd3fc",
  },
  {
    href: "/bga-pajka-kaluga",
    icon: "Cpu",
    label: "BGA-пайка в Калуге",
    keywords: "bga пайка компонентный ремонт калуга",
    accent: "#fca5a5",
  },
  {
    href: "/snyatie-frp-kaluga",
    icon: "Unlock",
    label: "Снятие FRP и iCloud",
    keywords: "снятие frp samsung xiaomi · разблокировка icloud",
    accent: "#fdba74",
  },
];

export default function RepairSEOLinks() {
  return (
    <section className="px-4 sm:px-8 py-12 max-w-5xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="font-oswald text-2xl sm:text-3xl font-bold uppercase">
          Выберите <span className="text-[#FFD700]">вашу услугу</span>
        </h2>
        <p className="text-white/50 text-sm mt-1">Подробные страницы по каждому направлению ремонта</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            to={l.href}
            className="group relative bg-[#111]/80 border border-white/[0.07] hover:border-[#FFD700]/40 rounded-xl p-4 flex flex-col gap-2 transition-all hover:-translate-y-0.5 backdrop-blur-sm overflow-hidden"
          >
            {/* Угловой блик при hover */}
            <div className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: `linear-gradient(90deg,transparent,${l.accent}60,transparent)` }} />

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors"
                style={{ background: `${l.accent}18`, border: `1px solid ${l.accent}30` }}>
                <Icon name={l.icon} size={16} style={{ color: l.accent }} />
              </div>
              <span className="font-oswald text-sm font-bold uppercase text-white/90 group-hover:text-white leading-tight transition-colors">
                {l.label}
              </span>
              <Icon name="ArrowRight" size={13}
                className="text-white/20 group-hover:text-[#FFD700] ml-auto shrink-0 transition-all group-hover:translate-x-0.5" />
            </div>

            <p className="font-roboto text-[10px] uppercase tracking-wide leading-snug"
              style={{ color: `${l.accent}80` }}>
              {l.keywords}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
