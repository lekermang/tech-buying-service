import Icon from "@/components/ui/icon";
import { ymGoal, Goals } from "@/lib/ym";
import { APK_URL, EXE_URL } from "./goldTickerUtils";

interface GoldTickerActionsRowProps {
  onSellClick: () => void;
  compact: boolean;
}

/**
 * Строка 3 — Действия (компакт-премиум).
 * Высота h-7, тонкие рамки, ровный grid.
 */
const GoldTickerActionsRow = ({ onSellClick, compact }: GoldTickerActionsRowProps) => {
  const btn =
    "inline-flex items-center justify-center gap-1.5 h-7 px-2.5 rounded-md bg-black/60 hover:bg-black/80 border active:scale-95 transition-all";
  const txt = "font-oswald font-bold text-[10px] uppercase tracking-wider";

  return (
    <div className={`relative max-w-7xl mx-auto px-3 sm:px-5 flex items-center gap-1.5 border-t border-[#FFD700]/10 transition-[padding] duration-300 ${compact ? "py-1" : "py-1.5"}`}>
      <a
        href="/cabinet"
        title="Кабинет клиента"
        className={`${btn} border-[#FFD700]/25 hover:border-[#FFD700]/55 text-[#FFD700]`}
      >
        <Icon name="User" size={12} />
        <span className={txt}>Клиент</span>
      </a>
      <a
        href="/staff"
        title="Кабинет сотрудника"
        className={`${btn} border-[#FFD700]/25 hover:border-[#FFD700]/55 text-[#FFD700]`}
      >
        <Icon name="ShieldCheck" size={12} />
        <span className={txt}>Сотрудник</span>
      </a>
      <a
        href={EXE_URL}
        download="Skupka24-Setup.exe"
        title="Скачать для Windows"
        className={`hidden sm:inline-flex ${btn} border-[#FFD700]/30 hover:border-[#FFD700]/60 text-[#FFD700]`}
      >
        <Icon name="Monitor" size={12} />
        <span className={txt}>Windows</span>
      </a>
      <a
        href={APK_URL}
        download="Skupka24.apk"
        title="Скачать APK"
        className={`${btn} border-emerald-400/30 hover:border-emerald-400/60 text-emerald-300`}
      >
        <Icon name="Smartphone" size={12} />
        <span className={txt}>APK</span>
      </a>

      {/* Справа */}
      <div className="ml-auto flex items-center gap-1.5">
        <a
          href="tel:88006006833"
          onClick={() => ymGoal(Goals.CALL_CLICK, { place: "ticker" })}
          className={`hidden sm:inline-flex ${btn} border-[#FFD700]/25 hover:border-[#FFD700]/55`}
        >
          <Icon name="Phone" size={12} className="text-[#FFD700]" />
          <span className="font-oswald font-bold text-[#FFD700] text-[11px] tracking-wide whitespace-nowrap">8 800 600-68-33</span>
        </a>
        <a
          href="tel:88006006833"
          onClick={() => ymGoal(Goals.CALL_CLICK, { place: "ticker" })}
          title="Позвонить"
          className="sm:hidden inline-flex items-center justify-center w-7 h-7 rounded-md bg-black/60 border border-[#FFD700]/30 text-[#FFD700] active:scale-95 transition-all"
        >
          <Icon name="Phone" size={12} />
        </a>

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
