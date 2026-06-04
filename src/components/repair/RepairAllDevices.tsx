import Icon from "@/components/ui/icon";

const BRANDS = [
  "Samsung", "Xiaomi", "Huawei", "Honor", "Google Pixel",
  "OnePlus", "Nothing Phone", "Sony", "ASUS", "Motorola", "Tecno", "Infinix", "Realme",
];

const SPECS = [
  { icon: "Cpu", label: "Замена процессоров (CPU/APU)" },
  { icon: "Zap", label: "Контроллеры питания (PMIC)" },
  { icon: "Radio", label: "Аудиокодеки, Wi-Fi/Bluetooth-чипы" },
  { icon: "Database", label: "Память NAND Flash" },
  { icon: "RefreshCw", label: "Реболлинг чипов" },
  { icon: "Droplets", label: "УЗ-промывка, удаление окисления" },
];

export default function RepairAllDevices({ onOrder }: { onOrder: () => void }) {
  return (
    <section id="all-devices" className="px-4 sm:px-8 py-14 max-w-6xl mx-auto scroll-mt-20">

      {/* ── Заголовок ── */}
      <div className="text-center mb-9 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-[#FFD700]/10 border border-[#FFD700]/30 text-[#FFD700] px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium mb-4">
          <Icon name="Wrench" size={14} />
          Ремонт любой сложности
        </div>
        <h2 className="font-oswald text-2xl sm:text-4xl font-bold uppercase leading-tight">
          Ремонт телефонов <span className="text-[#FFD700]">любой сложности</span> в Калуге —<br className="hidden sm:block" />
          от замены дисплея до пайки процессора
        </h2>
        <p className="text-white/55 text-sm sm:text-base mt-4 leading-relaxed">
          Мы не просто скупка. «Скупка24» выполняет профессиональный ремонт сотовых телефонов всех брендов.
          Неважно, флагманский Samsung Galaxy S24 Ultra, складной Huawei Mate X3 или бюджетный Tecno Spark —
          наши мастера берутся за любые устройства. Даже если в других сервисах отказали из-за сложности
          или редкости модели — несите к нам.
        </p>
      </div>

      {/* ── Бренды ── */}
      <div className="flex flex-wrap justify-center gap-2 mb-10">
        {BRANDS.map((b) => (
          <span key={b} className="bg-white/[0.05] border border-white/10 text-white/70 text-xs sm:text-sm px-3 py-1.5 rounded-full">
            {b}
          </span>
        ))}
        <span className="bg-[#FFD700]/10 border border-[#FFD700]/30 text-[#FFD700] text-xs sm:text-sm px-3 py-1.5 rounded-full font-medium">
          + любые другие
        </span>
      </div>

      {/* ── BGA-пайка ── */}
      <div className="grid md:grid-cols-2 gap-5 mb-5">
        <div className="bg-[#111]/80 border border-white/[0.07] rounded-2xl p-6 flex flex-col backdrop-blur-sm">
          <div className="w-12 h-12 rounded-xl bg-[#FFD700]/10 flex items-center justify-center mb-4">
            <Icon name="Cpu" size={24} className="text-[#FFD700]" />
          </div>
          <h3 className="font-oswald text-xl font-bold uppercase mb-3">
            BGA-пайка и компонентный ремонт плат
          </h3>
          <p className="text-white/55 text-[13px] leading-relaxed mb-4">
            Мы не меняем материнские платы целиком — мы их восстанавливаем. Делаем сложный компонентный
            ремонт на уровне микросхем. Профессиональная BGA-пайка: замена вышедшего из строя процессора,
            контроллера питания, аудиокодека, чипа Wi-Fi/Bluetooth или микросхемы памяти NAND&nbsp;Flash.
            Выполняем реболлинг чипов с качественными трафаретами и паяльными пастами. Устраняем
            последствия попадания влаги: промываем платы в ультразвуковой ванне, удаляем окисление
            и восстанавливаем «сгнившие» контакты под микроскопом.
          </p>
          <div className="grid grid-cols-2 gap-2 mt-auto">
            {SPECS.map((s) => (
              <div key={s.label} className="flex items-center gap-2 text-white/65 text-[12px]">
                <Icon name={s.icon} size={13} className="text-[#FFD700] shrink-0" />
                {s.label}
              </div>
            ))}
          </div>
        </div>

        {/* ── FRP + iCloud ── */}
        <div className="flex flex-col gap-4">
          <div className="bg-[#111]/80 border border-white/[0.07] rounded-2xl p-6 flex-1 backdrop-blur-sm">
            <div className="w-12 h-12 rounded-xl bg-[#FFD700]/10 flex items-center justify-center mb-4">
              <Icon name="Unlock" size={24} className="text-[#FFD700]" />
            </div>
            <h3 className="font-oswald text-lg font-bold uppercase mb-2">
              Снятие FRP (Factory Reset Protection)
            </h3>
            <p className="text-white/55 text-[13px] leading-relaxed">
              Купили б/у телефон, а он привязан к чужому аккаунту? Или после сброса настроек устройство
              требует ввод старого пароля Google? Делаем обход FRP на Android всех производителей
              (Samsung, Xiaomi, Motorola, Huawei, Honor и др.). Работаем легально: перед началом работ
              проверяем статус устройства по IMEI. Удаляем старый неактивный аккаунт Google, который
              блокирует вход в систему.
            </p>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {["Samsung", "Xiaomi", "Huawei", "Motorola", "Honor"].map((t) => (
                <span key={t} className="text-[11px] text-[#FFD700]/80 bg-[#FFD700]/[0.06] border border-[#FFD700]/15 px-2 py-0.5 rounded-full">{t}</span>
              ))}
            </div>
          </div>

          <div className="bg-[#111]/80 border border-white/[0.07] rounded-2xl p-6 flex-1 backdrop-blur-sm">
            <div className="w-12 h-12 rounded-xl bg-[#FFD700]/10 flex items-center justify-center mb-4">
              <Icon name="ShieldOff" size={24} className="text-[#FFD700]" />
            </div>
            <h3 className="font-oswald text-lg font-bold uppercase mb-2">
              Разблокировка iCloud (Activation Lock)
            </h3>
            <p className="text-white/55 text-[13px] leading-relaxed">
              Помогаем с официальным снятием блокировки активации iCloud на iPhone и iPad. Работаем
              с проверкой статуса устройства по базам GSX перед началом работ. Если разблокировка
              возможна технически и юридически — вернём вам доступ к гаджету.
            </p>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {["iPhone", "iPad", "Activation Lock", "GSX-отчёт"].map((t) => (
                <span key={t} className="text-[11px] text-[#FFD700]/80 bg-[#FFD700]/[0.06] border border-[#FFD700]/15 px-2 py-0.5 rounded-full">{t}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── CTA ── */}
      <div className="mt-2 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-[#FFD700]/20 bg-[#FFD700]/[0.04] p-5 backdrop-blur-sm">
        <div className="text-center sm:text-left">
          <div className="font-oswald text-lg font-semibold uppercase">Не нашли свою поломку или редкий бренд?</div>
          <div className="text-white/50 text-sm mt-0.5">
            Приносите устройство на бесплатную диагностику. Мастер вскроет его при вас, покажет проблему
            под микроскопом и назовёт точную цену до начала работ.
          </div>
        </div>
        <button
          onClick={onOrder}
          className="group relative overflow-hidden shrink-0 text-black font-oswald font-bold uppercase tracking-wide px-7 py-3 rounded-lg text-sm active:scale-95 transition-all inline-flex items-center gap-2
                     bg-[linear-gradient(180deg,#fff3a0_0%,#ffd700_45%,#d4a017_100%)]
                     shadow-[0_0_0_1px_rgba(255,215,0,0.5),0_6px_20px_rgba(255,215,0,0.3),inset_0_1px_0_rgba(255,255,255,0.5)]
                     hover:shadow-[0_0_0_1px_rgba(255,215,0,0.8),0_10px_28px_rgba(255,215,0,0.5),inset_0_1px_0_rgba(255,255,255,0.6)]"
        >
          <span className="absolute inset-0 bg-[linear-gradient(115deg,transparent_35%,rgba(255,255,255,0.7)_50%,transparent_65%)] bg-[length:200%_100%] -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
          <Icon name="Microscope" size={16} className="relative" />
          <span className="relative">Принести на диагностику</span>
        </button>
      </div>
    </section>
  );
}