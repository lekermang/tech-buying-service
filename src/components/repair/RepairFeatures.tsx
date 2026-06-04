import Icon from "@/components/ui/icon";

const FEATURES = [
  { icon: "Zap", title: "Быстро", text: "Большинство ремонтов делаем при вас за 20–40 минут без очередей" },
  { icon: "ShieldCheck", title: "Гарантия", text: "До 90 дней гарантии на все работы и установленные запчасти" },
  { icon: "BadgeCheck", title: "Качество", text: "Оригинальные и проверенные комплектующие, опытные мастера" },
  { icon: "Wallet", title: "Честная цена", text: "Точная стоимость до начала работ — без скрытых доплат" },
];

export default function RepairFeatures() {
  return (
    <section className="px-4 sm:px-8 py-14 max-w-5xl mx-auto">
      <div className="text-center mb-9">
        <h2 className="font-oswald text-3xl sm:text-4xl font-bold uppercase">
          Почему <span className="text-[#FFD700]">мы</span>
        </h2>
        <p className="text-white/50 text-sm mt-2">Сервис, которому доверяют</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="group bg-[#111] border border-white/[0.07] hover:border-[#FFD700]/60 rounded-xl p-6 transition-colors"
          >
            <div className="w-12 h-12 rounded-xl bg-[#FFD700]/10 flex items-center justify-center mb-4 group-hover:bg-[#FFD700]/20 transition-colors">
              <Icon name={f.icon} size={24} className="text-[#FFD700]" />
            </div>
            <div className="font-oswald text-lg font-semibold uppercase mb-2">{f.title}</div>
            <div className="text-white/50 text-[13px] leading-relaxed">{f.text}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
