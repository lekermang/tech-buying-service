import Icon from "@/components/ui/icon";

const BRANDS = [
  "Samsung", "Xiaomi", "Huawei", "Honor", "Google Pixel",
  "OnePlus", "Nothing Phone", "Sony", "ASUS", "Tecno", "Infinix", "Realme",
];

const CARDS = [
  {
    icon: "Cpu",
    title: "Компонентный ремонт и BGA-пайка",
    text:
      "Не меняем платы целиком — восстанавливаем их. Замена процессоров, контроллеров питания, микросхем памяти (NAND Flash), реболлинг чипов. Устраняем последствия влаги, окисления и повреждения дорожек.",
    tags: ["Замена CPU", "Контроллеры питания", "NAND Flash", "Реболлинг", "После воды"],
  },
  {
    icon: "Unlock",
    title: "Снятие FRP (Google-аккаунт)",
    text:
      "Быстрое и безопасное снятие привязки к Google-аккаунту (Factory Reset Protection) для всех Android: Samsung, Xiaomi, Huawei, Motorola и др. Легальное удаление старого аккаунта после сброса настроек.",
    tags: ["Samsung", "Xiaomi", "Huawei", "Motorola"],
  },
  {
    icon: "ShieldOff",
    title: "Разблокировка iCloud",
    text:
      "Помогаем со снятием блокировки активации (Activation Lock) на iPhone и iPad. Работаем с разными статусами устройств — приносите, оценим возможность.",
    tags: ["iPhone", "iPad", "Activation Lock"],
  },
];

export default function RepairAllDevices({ onOrder }: { onOrder: () => void }) {
  return (
    <section id="all-devices" className="px-4 sm:px-8 py-14 max-w-6xl mx-auto scroll-mt-20">
      <div className="text-center mb-9 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-[#FFD700]/10 border border-[#FFD700]/30 text-[#FFD700] px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium mb-4">
          <Icon name="Wrench" size={14} />
          Не только Apple
        </div>
        <h2 className="font-oswald text-2xl sm:text-4xl font-bold uppercase leading-tight">
          Чиним <span className="text-[#FFD700]">все смартфоны мира</span> и решаем сложные аппаратные задачи
        </h2>
        <p className="text-white/50 text-sm sm:text-base mt-3 leading-relaxed">
          «Скупка 24» — это профессиональный ремонт всех Android-устройств и любых китайских брендов.
          Берём в работу даже самые редкие модели, которые отказываются чинить в других сервисах.
        </p>
      </div>

      {/* Бренды */}
      <div className="flex flex-wrap justify-center gap-2 mb-9">
        {BRANDS.map((b) => (
          <span
            key={b}
            className="bg-white/[0.05] border border-white/10 text-white/70 text-xs sm:text-sm px-3 py-1.5 rounded-full"
          >
            {b}
          </span>
        ))}
        <span className="bg-[#FFD700]/10 border border-[#FFD700]/30 text-[#FFD700] text-xs sm:text-sm px-3 py-1.5 rounded-full">
          и любые другие
        </span>
      </div>

      {/* Карточки спец-услуг */}
      <div className="grid md:grid-cols-3 gap-4">
        {CARDS.map((c) => (
          <div
            key={c.title}
            className="group bg-[#111] border border-white/[0.07] hover:border-[#FFD700]/50 rounded-2xl p-5 transition-colors flex flex-col"
          >
            <div className="w-12 h-12 rounded-xl bg-[#FFD700]/10 flex items-center justify-center mb-4 group-hover:bg-[#FFD700]/20 transition-colors">
              <Icon name={c.icon} size={24} className="text-[#FFD700]" />
            </div>
            <h3 className="font-oswald text-lg font-semibold uppercase leading-tight mb-2">{c.title}</h3>
            <p className="text-white/50 text-[13px] leading-relaxed mb-4 flex-1">{c.text}</p>
            <div className="flex flex-wrap gap-1.5">
              {c.tags.map((t) => (
                <span key={t} className="text-[11px] text-[#FFD700]/80 bg-[#FFD700]/[0.06] border border-[#FFD700]/15 px-2 py-0.5 rounded-full">
                  {t}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Призыв «редкий бренд» */}
      <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-[#FFD700]/20 bg-[#FFD700]/[0.04] p-5">
        <div className="text-center sm:text-left">
          <div className="font-oswald text-lg font-semibold uppercase">Не нашли свою поломку или редкий бренд?</div>
          <div className="text-white/50 text-sm mt-0.5">
            Мастера с 10-летним стажем берутся за безнадёжные случаи: восстановление «мёртвых» телефонов,
            разбитые дисплеи, сложный аппаратный ремонт любых гаджетов.
          </div>
        </div>
        <button
          onClick={onOrder}
          className="shrink-0 bg-[#FFD700] hover:bg-[#ffed4a] text-black font-oswald font-bold tracking-wide px-7 py-3 rounded-lg text-sm transition-colors inline-flex items-center gap-2"
        >
          <Icon name="Send" size={16} />
          Принести на диагностику
        </button>
      </div>
    </section>
  );
}
