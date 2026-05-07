import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { getActiveHoliday } from "./holidays";

/** Маленькая кнопка-эмоджи в углу шапки.
 *
 *  Показывается ТОЛЬКО когда:
 *  - сейчас активен какой-то праздник (по календарю)
 *  - пользователь скрыл его баннер крестиком (localStorage holiday_dismissed_id)
 *
 *  По клику — возвращает баннер.
 *  Если активного праздника нет — кнопка не отображается.
 */
export default function HolidayShowAgainButton({ className = "" }: { className?: string }) {
  const [active, setActive] = useState(() => getActiveHoliday());
  const [dismissed, setDismissed] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("holiday_dismissed_id");
  });

  useEffect(() => {
    const refresh = () => {
      setActive(getActiveHoliday());
      setDismissed(localStorage.getItem("holiday_dismissed_id"));
    };
    const t = setInterval(refresh, 60 * 1000); // обновляем чаще — раз в минуту
    window.addEventListener("holidays-settings-changed", refresh);
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      clearInterval(t);
      window.removeEventListener("holidays-settings-changed", refresh);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  if (!active) return null;
  if (dismissed !== active.holiday.id) return null;

  return (
    <button
      onClick={() => {
        localStorage.removeItem("holiday_dismissed_id");
        localStorage.removeItem("holiday_corner_dismissed");
        window.dispatchEvent(new CustomEvent("holidays-settings-changed"));
        setDismissed(null);
      }}
      title={`Показать праздничное оформление: ${active.holiday.name}`}
      className={`relative inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-white/[0.04] to-transparent border border-white/10 hover:border-[#FFD700]/50 hover:bg-[#FFD700]/[0.06] transition-all active:scale-95 ${className}`}
    >
      <span className="text-base drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]">{active.holiday.emoji}</span>
      <span aria-hidden className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_currentColor]" />
    </button>
  );
}
