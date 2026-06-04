import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";

const LINKS = [
  { href: "/remont-iphone-kaluga", icon: "Smartphone", label: "Ремонт iPhone в Калуге" },
  { href: "/remont-samsung-kaluga", icon: "Smartphone", label: "Ремонт Samsung в Калуге" },
  { href: "/remont-xiaomi-kaluga", icon: "Smartphone", label: "Ремонт Xiaomi в Калуге" },
  { href: "/zamena-stekla-kaluga", icon: "Layers", label: "Замена стекла в Калуге" },
  { href: "/zamena-akkumulyatora-kaluga", icon: "BatteryCharging", label: "Замена аккумулятора в Калуге" },
  { href: "/remont-posle-vody-kaluga", icon: "Droplets", label: "Ремонт после воды в Калуге" },
  { href: "/bga-pajka-kaluga", icon: "Cpu", label: "BGA-пайка в Калуге" },
  { href: "/snyatie-frp-kaluga", icon: "Unlock", label: "Снятие FRP и iCloud в Калуге" },
];

export default function RepairSEOLinks() {
  return (
    <section className="px-4 sm:px-8 py-12 max-w-5xl mx-auto">
      <div className="text-center mb-7">
        <h2 className="font-oswald text-2xl sm:text-3xl font-bold uppercase">
          Выберите <span className="text-[#FFD700]">вашу услугу</span>
        </h2>
        <p className="text-white/50 text-sm mt-1">Подробные страницы по каждому направлению ремонта</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            to={l.href}
            className="group bg-[#111]/80 border border-white/[0.07] hover:border-[#FFD700]/50 rounded-xl p-4 flex items-center gap-2.5 transition-all hover:-translate-y-0.5 backdrop-blur-sm"
          >
            <Icon name={l.icon} size={16} className="text-[#FFD700] shrink-0" />
            <span className="font-roboto text-[13px] text-white/80 group-hover:text-white leading-tight">{l.label}</span>
            <Icon name="ArrowRight" size={13} className="text-white/25 group-hover:text-[#FFD700] ml-auto shrink-0 transition-colors" />
          </Link>
        ))}
      </div>
    </section>
  );
}
