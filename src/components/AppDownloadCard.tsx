import Icon from "@/components/ui/icon";

/**
 * Карточка "Скачать приложение Скупка 24" — три кнопки: Windows / Android / iOS.
 *
 * Где используется:
 *  - на странице /staff (только для сотрудников)
 *  - на главной странице сайта
 */

// Прямые ссылки на файлы из последнего релиза.
// GitHub автоматически отдаёт файл с тегом "latest" по фиксированному имени.
const REPO = "https://github.com/lekermang/tech-buying-service";
const WIN_URL = `${REPO}/releases/latest/download/Skupka24-Setup.exe`;
const APK_URL = `${REPO}/releases/latest/download/Skupka24.apk`;
const RELEASES_PAGE = `${REPO}/releases/latest`;

type Props = {
  /** Компактный вариант (одна строка) */
  compact?: boolean;
  /** Заголовок над карточкой */
  title?: string;
  /** Подпись под заголовком */
  subtitle?: string;
};

export default function AppDownloadCard({
  compact = false,
  title = "Приложение Скупка 24",
  subtitle = "Работает быстрее сайта, есть офлайн-режим",
}: Props) {
  return (
    <div className={`relative bg-gradient-to-br from-[#1A1A1A] via-[#141414] to-[#0E0E0E] border border-[#FFD700]/20 rounded-2xl overflow-hidden ${compact ? "p-3" : "p-4 sm:p-5"}`}>
      <div className="absolute -top-10 -right-10 text-[140px] opacity-[0.04] select-none">⬇️</div>

      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-9 h-9 rounded-lg bg-[#FFD700]/15 flex items-center justify-center shrink-0">
            <Icon name="Download" size={18} className="text-[#FFD700]" />
          </div>
          <div className="min-w-0">
            <div className="font-oswald font-bold text-white text-[15px] uppercase tracking-wide leading-tight">{title}</div>
            <div className="font-roboto text-white/50 text-[11px] leading-tight">{subtitle}</div>
          </div>
        </div>

        <div className={`grid ${compact ? "grid-cols-3" : "grid-cols-1 sm:grid-cols-3"} gap-2`}>
          {/* Windows — прямое скачивание .exe */}
          <a
            href={WIN_URL}
            download="Skupka24-Setup.exe"
            className="group flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[#FFD700]/10 hover:bg-[#FFD700]/20 border border-[#FFD700]/30 transition-colors active:scale-[0.98]"
          >
            <div className="w-7 h-7 rounded-md bg-black/40 flex items-center justify-center shrink-0">
              <Icon name="Monitor" size={14} className="text-[#FFD700]" />
            </div>
            <div className="min-w-0">
              <div className="font-roboto font-semibold text-[12px] text-white leading-tight">Windows</div>
              <div className="font-roboto text-[9px] text-white/45 leading-tight">.exe — установщик</div>
            </div>
          </a>

          {/* Android — прямое скачивание .apk */}
          <a
            href={APK_URL}
            download="Skupka24.apk"
            className="group flex items-center gap-2 px-3 py-2.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-400/30 transition-colors active:scale-[0.98]"
          >
            <div className="w-7 h-7 rounded-md bg-black/40 flex items-center justify-center shrink-0">
              <Icon name="Smartphone" size={14} className="text-emerald-300" />
            </div>
            <div className="min-w-0">
              <div className="font-roboto font-semibold text-[12px] text-white leading-tight">Android</div>
              <div className="font-roboto text-[9px] text-white/45 leading-tight">.apk — установщик</div>
            </div>
          </a>

          {/* iOS — в разработке */}
          <div
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/10 opacity-60 cursor-not-allowed"
            title="iOS-версия пока в разработке"
          >
            <div className="w-7 h-7 rounded-md bg-black/40 flex items-center justify-center shrink-0">
              <Icon name="Apple" size={14} className="text-white/50" fallback="Smartphone" />
            </div>
            <div className="min-w-0">
              <div className="font-roboto font-semibold text-[12px] text-white/60 leading-tight">iOS</div>
              <div className="font-roboto text-[9px] text-white/35 leading-tight">в разработке</div>
            </div>
          </div>
        </div>

        {/* Запасная ссылка — если файл не скачался напрямую */}
        <a
          href={RELEASES_PAGE}
          target="_blank"
          rel="noopener noreferrer"
          className="block mt-2 text-center text-[10px] font-roboto text-white/35 hover:text-[#FFD700] transition-colors"
        >
          Все версии и история обновлений →
        </a>
      </div>
    </div>
  );
}