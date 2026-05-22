import Icon from "@/components/ui/icon";
import Reveal from "@/components/skupka/Reveal";

const BENEFITS = [
  {
    icon: "Wrench",
    title: "Статус ремонта",
    text: "В реальном времени, без звонков. Push о каждом изменении.",
  },
  {
    icon: "ScrollText",
    title: "Контроль залога",
    text: "Договор 14 дней, дата выкупа, сумма, проценты — в одном месте.",
  },
  {
    icon: "Send",
    title: "Предложения",
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
    text: "Скидка и бонусные баллы — копятся автоматически за каждое обращение.",
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
    <section
      id="app"
      className="relative py-14 md:py-20 border-t border-[#FFD700]/10 overflow-hidden"
    >
      {/* Премиум-подложка (как у Trade In) */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#FFD700]/[0.06] via-transparent to-emerald-500/[0.04] pointer-events-none" />
      <div className="absolute -top-20 -left-20 w-80 h-80 bg-[#FFD700]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4">
        {/* Заголовок секции (стиль Trade In) */}
        <Reveal className="mb-8 md:mb-12">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 bg-[#FFD700]/15 border border-[#FFD700]/40 text-[#FFD700] font-roboto text-[10px] md:text-xs uppercase tracking-widest px-2.5 py-1 rounded-full">
              <Icon name="Sparkles" size={12} />
              Приложение Скупка24
            </span>
            <span className="font-roboto text-emerald-400 text-sm uppercase tracking-widest">
              Mobile · Desktop
            </span>
          </div>
          <h2 className="font-oswald text-3xl md:text-5xl font-bold">
            С НАМИ СТАЛО ПРОЩЕ
            <br />
            <span className="text-[#FFD700]">для тебя.</span>{" "}
            <span className="text-emerald-400">Всё в кармане.</span>
          </h2>
        </Reveal>

        <div className="grid lg:grid-cols-2 gap-6 md:gap-10 items-start">
          {/* ЛЕВО — текст, фичи, CTA */}
          <Reveal>
            <p className="font-roboto text-white/70 text-sm md:text-base leading-relaxed mb-5 md:mb-6">
              Установи приложение{" "}
              <span className="text-[#FFD700] font-bold">Скупка24</span> — и весь сервис
              окажется под рукой: статусы ремонтов, залоги по договору 14 дней, твои
              предложения и уведомления о каждом изменении.
            </p>
            <p className="font-roboto text-white/60 text-sm md:text-base leading-relaxed mb-6 md:mb-8">
              Работает на{" "}
              <span className="text-emerald-400 font-semibold">Android и Windows</span>,
              а также как PWA в любом браузере. Авторизация по SMS, личная скидка и баллы
              копятся автоматически.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 md:gap-3 mb-6 md:mb-8">
              {BENEFITS.map((b) => (
                <div
                  key={b.title}
                  className="flex items-start gap-2 bg-[#0D0D0D] border border-[#FFD700]/15 px-3 py-2.5 hover:border-[#FFD700]/40 transition-colors"
                  title={b.text}
                >
                  <Icon name={b.icon} size={16} className="text-[#FFD700] shrink-0 mt-0.5" />
                  <span className="font-roboto text-white/80 text-xs md:text-sm leading-snug">
                    {b.title}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <a href="/client" className="btn-gold-premium btn-lg">
                <Icon name="UserCircle" size={18} />
                Открыть кабинет
                <Icon name="ArrowRight" size={16} />
              </a>
              <a href="tel:+79929990333" className="btn-gold-outline btn-lg flex-col leading-none">
                <span className="flex items-center gap-2">
                  <Icon name="Phone" size={16} />
                  Помощь со входом
                </span>
                <span className="font-roboto font-normal normal-case text-[10px] md:text-[11px] text-[#FFD700]/70 tracking-normal mt-1">
                  +7 (992) 999-03-33 · бесплатно
                </span>
              </a>
            </div>
          </Reveal>

          {/* ПРАВО — карточка скачивания приложения */}
          <Reveal delay={2}>
            <div className="relative">
              <div className="absolute -inset-2 bg-gradient-to-br from-[#FFD700]/20 to-emerald-500/20 blur-xl" />
              <div className="relative bg-[#0D0D0D] border border-[#FFD700]/20 p-5 md:p-7">
                <div className="flex items-center justify-between mb-5 md:mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 bg-[#FFD700]/10 border border-[#FFD700]/30 flex items-center justify-center">
                      <Icon name="Download" size={18} className="text-[#FFD700]" />
                    </div>
                    <div>
                      <div className="font-oswald font-bold text-white text-sm uppercase leading-tight">
                        Скачать приложение
                      </div>
                      <div className="font-roboto text-white/40 text-[11px]">
                        Установи за 30 секунд
                      </div>
                    </div>
                  </div>
                  <span className="font-oswald font-bold text-emerald-400 text-[11px] tracking-widest uppercase">
                    Free
                  </span>
                </div>

                <div className="space-y-3">
                  {/* Android */}
                  <button
                    onClick={downloadApk}
                    className="w-full group relative overflow-hidden bg-[#0A0A0A] border border-[#FFD700]/15 hover:border-emerald-400/60 transition-all p-4 flex items-center gap-4 text-left"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500/25 to-emerald-700/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
                      <Icon name="Smartphone" size={22} className="text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-roboto text-[10px] text-white/40 uppercase tracking-widest">
                        Скачать для
                      </div>
                      <div className="font-oswald font-bold text-white text-base md:text-lg uppercase leading-tight">
                        Android
                      </div>
                      <div className="font-roboto text-white/55 text-[11px] truncate">
                        Файл .apk · Камера и push-уведомления
                      </div>
                    </div>
                    <Icon
                      name="ArrowRight"
                      size={18}
                      className="text-[#FFD700]/60 group-hover:text-[#FFD700] group-hover:translate-x-1 transition-all shrink-0"
                    />
                  </button>

                  {/* Windows */}
                  <button
                    onClick={downloadExe}
                    className="w-full group relative overflow-hidden bg-[#0A0A0A] border border-[#FFD700]/15 hover:border-blue-400/60 transition-all p-4 flex items-center gap-4 text-left"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500/25 to-blue-700/10 border border-blue-500/30 flex items-center justify-center shrink-0">
                      <Icon name="MonitorDown" size={22} className="text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-roboto text-[10px] text-white/40 uppercase tracking-widest">
                        Скачать для
                      </div>
                      <div className="font-oswald font-bold text-white text-base md:text-lg uppercase leading-tight">
                        Windows
                      </div>
                      <div className="font-roboto text-white/55 text-[11px] truncate">
                        Установщик .exe · Уведомления на ПК
                      </div>
                    </div>
                    <Icon
                      name="ArrowRight"
                      size={18}
                      className="text-[#FFD700]/60 group-hover:text-[#FFD700] group-hover:translate-x-1 transition-all shrink-0"
                    />
                  </button>

                  {/* iOS / Браузер — PWA */}
                  <a
                    href="/client"
                    className="w-full group relative overflow-hidden bg-[#0A0A0A] border border-[#FFD700]/15 hover:border-[#FFD700]/60 transition-all p-4 flex items-center gap-4 text-left"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-[#FFD700]/25 to-[#FFD700]/5 border border-[#FFD700]/30 flex items-center justify-center shrink-0">
                      <Icon name="Globe" size={22} className="text-[#FFD700]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-roboto text-[10px] text-white/40 uppercase tracking-widest">
                        Открыть в браузере
                      </div>
                      <div className="font-oswald font-bold text-white text-base md:text-lg uppercase leading-tight">
                        iOS / Web
                      </div>
                      <div className="font-roboto text-white/55 text-[11px] truncate">
                        Без установки · Добавь на главный экран
                      </div>
                    </div>
                    <Icon
                      name="ArrowRight"
                      size={18}
                      className="text-[#FFD700]/60 group-hover:text-[#FFD700] group-hover:translate-x-1 transition-all shrink-0"
                    />
                  </a>
                </div>

                {/* Полоска доверия */}
                <div className="mt-5 pt-4 border-t border-[#FFD700]/10 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5 text-white/45">
                    <Icon name="ShieldCheck" size={13} className="text-emerald-400" />
                    Безопасно · Без рекламы
                  </div>
                  <div className="flex items-center gap-1.5 text-white/45">
                    <Icon name="Lock" size={13} className="text-[#FFD700]" />
                    Вход по SMS-коду
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
