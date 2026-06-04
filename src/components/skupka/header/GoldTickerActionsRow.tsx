import Icon from "@/components/ui/icon";
import { ymGoal, Goals } from "@/lib/ym";
import { APK_URL, EXE_URL } from "./goldTickerUtils";

interface GoldTickerActionsRowProps {
  onSellClick: () => void;
  compact: boolean;
}

/**
 * Строка 3 — Действия (премиум-группы).
 * Логически разбито на 3 блока:
 *  · Кабинеты:    Клиент · Сотрудник
 *  · Приложения:  Windows · Android (APK)
 *  · Контакт:     Телефон + кнопка «Продать»
 * Между блоками — тонкий золотой разделитель.
 */
const GoldTickerActionsRow = ({ onSellClick, compact }: GoldTickerActionsRowProps) => {
  const txt = "font-oswald font-bold text-[10px] uppercase tracking-wider";

  return (
    <div
      className={`relative max-w-7xl mx-auto px-3 sm:px-5 flex items-center gap-2 border-t border-[#FFD700]/10 transition-[padding] duration-300 ${
        compact ? "py-1" : "py-1.5"
      }`}
    >
      {/* ─── Группа 1: Кабинеты ─── */}
      <div className="inline-flex h-7 rounded-md border border-[#FFD700]/25 bg-black/50 overflow-hidden shadow-[inset_0_1px_0_rgba(255,215,0,0.05)]">
        <a
          href="/cabinet"
          title="Личный кабинет клиента"
          className={`inline-flex items-center justify-center gap-1.5 px-2.5 text-[#FFD700] hover:bg-[#FFD700]/10 active:scale-95 transition`}
        >
          <Icon name="User" size={12} />
          <span className={txt}>Клиент</span>
        </a>
        <span className="w-px self-stretch bg-[#FFD700]/15" aria-hidden />
        <a
          href="/staff"
          title="Кабинет сотрудника"
          className={`inline-flex items-center justify-center gap-1.5 px-2.5 text-[#FFD700] hover:bg-[#FFD700]/10 active:scale-95 transition`}
        >
          <Icon name="ShieldCheck" size={12} />
          <span className={txt}>Сотрудник</span>
        </a>
      </div>

      {/* Тонкий разделитель между блоками */}
      <span className="hidden sm:block h-4 w-px bg-gradient-to-b from-transparent via-[#FFD700]/30 to-transparent" aria-hidden />

      {/* ─── Группа 2: Приложения ─── */}
      <div className="hidden sm:inline-flex h-7 rounded-md border border-[#FFD700]/25 bg-black/50 overflow-hidden shadow-[inset_0_1px_0_rgba(255,215,0,0.05)]">
        <a
          href={EXE_URL}
          download="Skupka24-Setup.exe"
          title="Скачать приложение для Windows (.exe)"
          className={`inline-flex items-center justify-center gap-1.5 px-2.5 text-[#FFD700] hover:bg-[#FFD700]/10 active:scale-95 transition`}
        >
          <Icon name="Monitor" size={12} />
          <span className={txt}>Windows</span>
        </a>
        <span className="w-px self-stretch bg-[#FFD700]/15" aria-hidden />
        <a
          href={APK_URL}
          download="Skupka24.apk"
          title="Скачать Android-приложение (.apk)"
          className="inline-flex items-center justify-center gap-1.5 px-2.5 text-emerald-300 hover:bg-emerald-400/10 active:scale-95 transition"
        >
          <Icon name="Smartphone" size={12} />
          <span className={txt}>Android</span>
        </a>
      </div>

      {/* На мобильных оставим только APK (Windows нет смысла) */}
      <a
        href={APK_URL}
        download="Skupka24.apk"
        title="Скачать Android-приложение"
        className="sm:hidden inline-flex items-center justify-center gap-1.5 h-7 px-2.5 rounded-md border border-emerald-400/30 bg-black/60 text-emerald-300 active:scale-95 transition"
      >
        <Icon name="Smartphone" size={12} />
        <span className={txt}>APK</span>
      </a>

      {/* ─── Группа 3: Контакт и продажа (справа) ─── */}
      <div className="ml-auto flex items-center gap-1.5">
        {/* Телефон — десктоп */}
        <a
          href="tel:+79929990333"
          onClick={() => ymGoal(Goals.CALL_CLICK, { place: "ticker" })}
          className="hidden md:inline-flex items-center gap-1.5 h-7 px-3 rounded-md border border-[#FFD700]/30 bg-black/60 hover:bg-black/80 hover:border-[#FFD700]/60 active:scale-95 transition"
        >
          <Icon name="Phone" size={12} className="text-[#FFD700]" />
          <span className="font-oswald font-bold text-[#FFD700] text-[11px] tracking-wide whitespace-nowrap">
            8 992 999-03-33
          </span>
        </a>

        {/* Телефон — мобила (иконка) */}
        <a
          href="tel:+79929990333"
          onClick={() => ymGoal(Goals.CALL_CLICK, { place: "ticker" })}
          title="Позвонить"
          className="md:hidden inline-flex items-center justify-center w-7 h-7 rounded-md bg-black/60 border border-[#FFD700]/30 text-[#FFD700] active:scale-95 transition-all"
        >
          <Icon name="Phone" size={12} />
        </a>

        {/* CTA «Продать» */}
        <button
          onClick={onSellClick}
          className="relative overflow-hidden h-7 px-3 rounded-md font-oswald font-bold text-black text-[11px] uppercase tracking-wider active:scale-95 transition-all flex items-center gap-1 shrink-0
                     bg-[linear-gradient(180deg,#fff3a0_0%,#ffd700_45%,#d4a017_100%)]
                     shadow-[0_0_0_1px_rgba(255,215,0,0.6),0_2px_8px_rgba(255,215,0,0.25),inset_0_1px_0_rgba(255,255,255,0.5)]
                     hover:shadow-[0_0_0_1px_rgba(255,215,0,0.8),0_4px_14px_rgba(255,215,0,0.4),inset_0_1px_0_rgba(255,255,255,0.6)]
                     group"
        >
          <span className="absolute inset-0 bg-[linear-gradient(115deg,transparent_35%,rgba(255,255,255,0.7)_50%,transparent_65%)] bg-[length:200%_100%] -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          <Icon name="Zap" size={11} className="relative" />
          <span className="relative">Продать</span>
        </button>
      </div>
    </div>
  );
};

export default GoldTickerActionsRow;