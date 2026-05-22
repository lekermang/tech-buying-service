import Icon from "@/components/ui/icon";

const BENEFITS = [
  {
    icon: "Wrench",
    title: "Видишь статус ремонта",
    text: "В реальном времени, без звонков. Push о каждом изменении.",
  },
  {
    icon: "ScrollText",
    title: "Контролируешь залог",
    text: "Залог в ломбарде по договору 14 дней, дата выкупа, сумма, проценты — всё в одном месте.",
  },
  {
    icon: "Send",
    title: "Отправляешь предложения",
    text: "Фото + описание за 30 секунд — мы оценим и перезвоним.",
  },
  {
    icon: "Bell",
    title: "Push-уведомления",
    text: "Готов ремонт, изменился статус, ответил менеджер — узнаешь первым.",
  },
  {
    icon: "Gift",
    title: "Личная скидка",
    text: "Скидка и бонусные баллы за каждое обращение — копятся автоматически.",
  },
  {
    icon: "WifiOff",
    title: "Работает офлайн",
    text: "В метро или без интернета — приложение остаётся под рукой.",
  },
];

const downloadExe = () =>
  window.open(
    "https://github.com/lekermang/tech-buying-service/releases/latest/download/Skupka24-Setup.exe",
    "_blank",
  );

const downloadApk = () =>
  window.open(
    "https://github.com/lekermang/tech-buying-service/releases/latest/download/Skupka24.apk",
    "_blank",
  );

export default function EasierWithUsBlock() {
  return (
    <section className="relative py-12 sm:py-16 px-4 bg-gradient-to-b from-[#0A0A0A] via-[#0C0C0C] to-[#0A0A0A] overflow-hidden">
      {/* Декор */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -left-20 w-96 h-96 rounded-full bg-[#FFD700]/[0.04] blur-3xl" />
        <div className="absolute -bottom-32 -right-20 w-96 h-96 rounded-full bg-[#FFD700]/[0.04] blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto">
        {/* Заголовок */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFD700]/10 border border-[#FFD700]/20 mb-4">
            <Icon name="Sparkles" size={12} className="text-[#FFD700]" />
            <span className="text-[10px] uppercase tracking-wider font-bold text-[#FFD700]">
              Приложение Скупка 24
            </span>
          </div>
          <h2 className="font-oswald text-3xl sm:text-5xl font-bold uppercase tracking-wider text-white mb-3">
            С нами стало{" "}
            <span className="bg-gradient-to-r from-[#FFE34D] to-[#d4a017] bg-clip-text text-transparent">
              проще
            </span>
          </h2>
          <p className="text-sm sm:text-base text-white/60 max-w-xl mx-auto leading-relaxed">
            Скачай приложение — и весь сервис у тебя в кармане. Ремонты, залоги, предложения и
            уведомления в одном клике.
          </p>
        </div>

        {/* Сетка преимуществ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-10">
          {BENEFITS.map((b) => (
            <div
              key={b.title}
              className="group bg-gradient-to-br from-[#0F0F0F] to-[#080808] border border-[#1F1F1F] hover:border-[#FFD700]/30 rounded-2xl p-5 transition-all hover:shadow-[0_0_30px_rgba(255,215,0,0.07)]"
            >
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#FFD700]/20 to-[#FFD700]/5 border border-[#FFD700]/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Icon name={b.icon} size={20} className="text-[#FFD700]" />
              </div>
              <div className="text-[14px] sm:text-[15px] font-bold text-white mb-1.5">
                {b.title}
              </div>
              <div className="text-[12px] sm:text-[13px] text-white/55 leading-relaxed">
                {b.text}
              </div>
            </div>
          ))}
        </div>

        {/* Кнопки скачивания */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-2xl mx-auto">
          <button
            onClick={downloadExe}
            className="flex-1 group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] border border-[#FFD700]/20 hover:border-[#FFD700]/50 p-5 transition-all hover:scale-[1.02] active:scale-[0.99]"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/30 to-blue-700/10 border border-blue-500/30 flex items-center justify-center">
                <Icon name="MonitorDown" size={22} className="text-blue-400" />
              </div>
              <div className="flex-1 text-left">
                <div className="text-[10px] text-white/40 uppercase tracking-wider">Скачать для</div>
                <div className="text-[16px] font-bold text-white">Windows</div>
                <div className="text-[11px] text-white/50">Установщик .exe · Push-уведомления</div>
              </div>
              <Icon name="ArrowRight" size={18} className="text-[#FFD700] group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          <button
            onClick={downloadApk}
            className="flex-1 group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] border border-[#FFD700]/20 hover:border-[#FFD700]/50 p-5 transition-all hover:scale-[1.02] active:scale-[0.99]"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/30 to-green-700/10 border border-green-500/30 flex items-center justify-center">
                <Icon name="Smartphone" size={22} className="text-green-400" />
              </div>
              <div className="flex-1 text-left">
                <div className="text-[10px] text-white/40 uppercase tracking-wider">Скачать для</div>
                <div className="text-[16px] font-bold text-white">Android</div>
                <div className="text-[11px] text-white/50">Файл .apk · Камера и уведомления</div>
              </div>
              <Icon name="ArrowRight" size={18} className="text-[#FFD700] group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>

        {/* Ссылка на кабинет клиента */}
        <div className="mt-6 text-center">
          <a
            href="/client"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#FFD700]/10 hover:bg-[#FFD700]/20 border border-[#FFD700]/30 text-[#FFD700] text-[12px] font-bold uppercase tracking-wider transition"
          >
            <Icon name="UserCircle" size={14} />
            Открыть кабинет клиента
            <Icon name="ArrowRight" size={12} />
          </a>
          <div className="text-[11px] text-white/35 mt-2">
            Уже зарегистрирован? Войди по логину и паролю.
          </div>
        </div>
      </div>
    </section>
  );
}
