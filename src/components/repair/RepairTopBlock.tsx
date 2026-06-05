/**
 * Топ-блок страницы /repair:
 * 1. Баннер «Диагностика бесплатно»
 * 2. Форма заявки «Рассчитать стоимость» прямо наверху
 * 3. SEO-ссылки на подстраницы услуг
 */
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import RepairWidget from "@/components/skupka/RepairWidget";

const SEO_LINKS = [
  { href: "/remont-iphone-kaluga",          icon: "Smartphone",     label: "Ремонт iPhone в Калуге",   keywords: "ремонт айфона калуга · замена экрана · аккумулятор", accent: "#fff3a0" },
  { href: "/remont-samsung-kaluga",         icon: "Smartphone",     label: "Ремонт Samsung в Калуге",  keywords: "ремонт samsung galaxy калуга · снятие frp",           accent: "#93c5fd" },
  { href: "/remont-xiaomi-kaluga",          icon: "Smartphone",     label: "Ремонт Xiaomi в Калуге",   keywords: "ремонт xiaomi redmi poco калуга",                     accent: "#86efac" },
  { href: "/zamena-stekla-kaluga",          icon: "Layers",         label: "Замена стекла в Калуге",   keywords: "переклейка тачскрина калуга · oca-клей",              accent: "#c4b5fd" },
  { href: "/zamena-akkumulyatora-kaluga",   icon: "BatteryCharging",label: "Замена аккумулятора",      keywords: "замена аккумулятора телефона калуга",                 accent: "#6ee7b7" },
  { href: "/remont-posle-vody-kaluga",      icon: "Droplets",       label: "Ремонт после воды",        keywords: "ремонт утопленника калуга · уз-промывка",             accent: "#7dd3fc" },
  { href: "/bga-pajka-kaluga",              icon: "Cpu",            label: "BGA-пайка в Калуге",       keywords: "bga пайка компонентный ремонт калуга",                accent: "#fca5a5" },
  { href: "/snyatie-frp-kaluga",            icon: "Unlock",         label: "Снятие FRP и iCloud",      keywords: "снятие frp samsung xiaomi · разблокировка icloud",    accent: "#fdba74" },
];

export default function RepairTopBlock() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 pt-6 pb-2 flex flex-col gap-6">

      {/* ── 1. Баннер: Диагностика бесплатно ── */}
      <div className="relative overflow-hidden rounded-2xl border border-[#FFD700]/30 bg-gradient-to-br from-[#1a1400]/90 to-[#0a0a0a]/90 backdrop-blur-sm p-5 sm:p-6">
        {/* Световая полоска */}
        <div className="absolute top-0 left-8 right-8 h-px pointer-events-none"
          style={{ background: "linear-gradient(90deg,transparent,rgba(255,215,0,0.7),rgba(255,248,232,0.9),rgba(255,215,0,0.7),transparent)", boxShadow: "0 0 16px rgba(255,215,0,0.3)" }} />
        {/* Угловые засечки */}
        <span className="absolute top-2 left-2 w-3 h-3 border-l-2 border-t-2 border-[#FFD700]/40" />
        <span className="absolute top-2 right-2 w-3 h-3 border-r-2 border-t-2 border-[#FFD700]/40" />
        <span className="absolute bottom-2 left-2 w-3 h-3 border-l-2 border-b-2 border-[#FFD700]/40" />
        <span className="absolute bottom-2 right-2 w-3 h-3 border-r-2 border-b-2 border-[#FFD700]/40" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Иконка */}
          <div className="shrink-0 w-14 h-14 rounded-xl bg-[#FFD700]/15 border border-[#FFD700]/30 flex items-center justify-center"
            style={{ boxShadow: "0 0 24px rgba(255,215,0,0.2)" }}>
            <Icon name="Microscope" size={26} className="text-[#FFD700]" />
          </div>

          {/* Текст */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h2 className="font-oswald font-bold text-xl sm:text-2xl uppercase text-white">
                Диагностика{" "}
                <span className="text-[#FFD700]" style={{ filter: "drop-shadow(0 0 12px rgba(255,215,0,0.5))" }}>
                  бесплатно
                </span>
              </h2>
              <span className="inline-flex items-center gap-1 bg-[#FFD700]/10 border border-[#FFD700]/30 text-[#FFD700] text-[10px] font-roboto uppercase tracking-widest px-2.5 py-0.5 rounded-full">
                <Icon name="CheckCircle" size={10} />
                если ремонт у нас
              </span>
            </div>
            <p className="text-white/55 text-sm leading-relaxed">
              Мастер вскроет устройство при вас, покажет проблему под микроскопом и назовёт <strong className="text-white/80">точную стоимость</strong> до начала работ.
              Диагностика бесплатна при условии ремонта в нашем сервисе.
            </p>
          </div>

          {/* Пункты */}
          <div className="hidden lg:flex flex-col gap-2 shrink-0 text-right">
            {[
              { icon: "Zap", t: "При вас · 20 минут" },
              { icon: "BadgeCheck", t: "Гарантия до 12 мес" },
              { icon: "Wallet", t: "От 300 ₽" },
            ].map(p => (
              <div key={p.t} className="flex items-center gap-1.5 text-white/60 text-xs font-roboto justify-end">
                <Icon name={p.icon} size={11} className="text-[#FFD700]" />
                {p.t}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 2. Форма «Рассчитать стоимость» ── */}
      <div id="repair-form" className="scroll-mt-20">
        <div className="text-center mb-5">
          <h2 className="font-oswald text-2xl sm:text-3xl font-bold uppercase">
            Рассчитать <span className="text-[#FFD700]">стоимость</span>
          </h2>
          <p className="text-white/50 text-sm mt-1.5">
            Опишите проблему — мастер свяжется с вами и назовёт точную цену
          </p>
        </div>
        <RepairWidget />
      </div>

      {/* ── 3. SEO-ссылки: Ремонт телефонов ── */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-5">
          <div>
            <h2 className="font-oswald text-xl sm:text-2xl font-bold uppercase">
              Ремонт телефонов
            </h2>
            <p className="text-white/40 text-xs mt-0.5 font-roboto">
              При вас · 20 минут · от 300 ₽
            </p>
          </div>
          <p className="text-white/35 text-xs font-roboto">Подробные страницы по каждому направлению</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {SEO_LINKS.map((l) => (
            <Link
              key={l.href}
              to={l.href}
              className="group relative bg-[#111]/80 border border-white/[0.07] hover:border-[#FFD700]/40 rounded-xl p-3.5 flex flex-col gap-1.5 transition-all hover:-translate-y-0.5 backdrop-blur-sm overflow-hidden"
            >
              {/* Верхняя линия-акцент при hover */}
              <div className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: `linear-gradient(90deg,transparent,${l.accent}70,transparent)` }} />

              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors"
                  style={{ background: `${l.accent}18`, border: `1px solid ${l.accent}28` }}>
                  <Icon name={l.icon} size={14} style={{ color: l.accent }} />
                </div>
                <span className="font-oswald text-[13px] font-bold uppercase text-white/90 group-hover:text-white leading-tight transition-colors flex-1">
                  {l.label}
                </span>
                <Icon name="ArrowRight" size={12}
                  className="text-white/20 group-hover:text-[#FFD700] shrink-0 transition-all group-hover:translate-x-0.5" />
              </div>

              <p className="font-roboto text-[10px] uppercase tracking-wide leading-snug pl-9"
                style={{ color: `${l.accent}75` }}>
                {l.keywords}
              </p>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}
