import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { getActiveHoliday, getHolidayCountdownText, type Holiday } from "./holidays";

/** Декоративный узор для конкретного праздника */
function HolidayPattern({ pattern, color }: { pattern: Holiday["pattern"]; color: string }) {
  if (pattern === "ribbon") {
    // 9 мая — Георгиевская лента: горизонтальные тонкие полосы (правильное направление, как у настоящей ленты — вдоль).
    return (
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-25"
        style={{
          background: "repeating-linear-gradient(0deg, #FF8C00 0 5px, #1a0d00 5px 7px, #FF8C00 7px 12px, #1a0d00 12px 14px)",
          maskImage: "linear-gradient(90deg, transparent 0%, black 30%, black 70%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(90deg, transparent 0%, black 30%, black 70%, transparent 100%)",
        }}
      />
    );
  }
  if (pattern === "snow") {
    return (
      <div aria-hidden className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <span
            key={i}
            className="absolute text-white/60 select-none"
            style={{
              left: `${(i * 13) % 100}%`,
              top: `${(i * 7) % 100}%`,
              fontSize: `${10 + (i % 3) * 4}px`,
              animation: `holiday-fall ${5 + (i % 4)}s linear ${i * 0.3}s infinite`,
            }}
          >
            ❄
          </span>
        ))}
      </div>
    );
  }
  if (pattern === "hearts") {
    return (
      <div aria-hidden className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <span key={i} className="absolute text-pink-300/40 animate-pulse"
            style={{ left: `${(i * 17 + 5) % 95}%`, top: `${(i * 23) % 80}%`, fontSize: `${14 + (i % 3) * 4}px` }}>
            ❤
          </span>
        ))}
      </div>
    );
  }
  if (pattern === "fireworks") {
    return (
      <div aria-hidden className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <span key={i} className="absolute animate-pulse"
            style={{ left: `${(i * 19 + 5) % 90}%`, top: `${(i * 29) % 70}%`, fontSize: "18px", opacity: 0.5 }}>
            ✨
          </span>
        ))}
      </div>
    );
  }
  if (pattern === "flag") {
    // Триколор полоской
    return (
      <div aria-hidden className="absolute inset-0 pointer-events-none opacity-40"
        style={{ background: "linear-gradient(180deg, #FFFFFF 0% 33%, #0033A0 33% 66%, #D52B1E 66% 100%)" }}
      />
    );
  }
  if (pattern === "stars") {
    return (
      <div aria-hidden className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(10)].map((_, i) => (
          <span key={i} className="absolute" style={{ left: `${(i * 13) % 95}%`, top: `${(i * 19) % 80}%`, fontSize: "14px", color, opacity: 0.5 }}>★</span>
        ))}
      </div>
    );
  }
  if (pattern === "flowers") {
    return (
      <div aria-hidden className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(10)].map((_, i) => (
          <span key={i} className="absolute" style={{ left: `${(i * 11 + 3) % 95}%`, top: `${(i * 17) % 80}%`, fontSize: `${14 + (i % 2) * 6}px`, opacity: 0.5 }}>
            {i % 2 === 0 ? "🌷" : "🌸"}
          </span>
        ))}
      </div>
    );
  }
  return null;
}

type Props = {
  /** Если true — показать даже когда нет активного праздника (для превью) */
  forcedHolidayId?: string;
  /** Можно скрыть баннер пользователю — записывается в localStorage */
  dismissible?: boolean;
  className?: string;
};

/**
 * Праздничный баннер. Автоматически появляется за N дней до праздника
 * и остаётся ещё N дней после. Сейчас (май 2026) — это 9 мая.
 */
// Версия dismiss-логики. Если меняется (например, добавили новый декор) —
// один раз сбрасываем у всех пользователей сохранённое скрытие, чтобы баннер появился снова.
const DISMISS_VERSION = "may9-2026-v2";

export default function HolidayBanner({ forcedHolidayId, dismissible = true, className = "" }: Props) {
  const [active, setActive] = useState(() => getActiveHoliday());
  const [dismissed, setDismissed] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    // Один раз на новой версии очищаем старое скрытие
    const ver = localStorage.getItem("holiday_dismiss_version");
    if (ver !== DISMISS_VERSION) {
      localStorage.removeItem("holiday_dismissed_id");
      localStorage.removeItem("holiday_corner_dismissed");
      localStorage.setItem("holiday_dismiss_version", DISMISS_VERSION);
      return null;
    }
    return localStorage.getItem("holiday_dismissed_id");
  });

  // Пересчитываем активный праздник каждые 30 минут + при изменении настроек из админки
  useEffect(() => {
    const refresh = () => {
      setActive(getActiveHoliday());
      setDismissed(localStorage.getItem("holiday_dismissed_id"));
    };
    const t = setInterval(refresh, 30 * 60 * 1000);
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
  const { holiday, daysToHoliday } = active;
  if (forcedHolidayId && holiday.id !== forcedHolidayId) return null;
  if (dismissible && dismissed === holiday.id) return null;

  const countdown = getHolidayCountdownText(daysToHoliday);
  const textColor = holiday.textColor || "#FFFFFF";

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <style>{`
        @keyframes holiday-fall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 0.7; }
          100% { transform: translateY(120px) rotate(360deg); opacity: 0; }
        }
        @keyframes holiday-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>

      <div
        className="relative px-3 py-2.5 flex items-center justify-center gap-3 border-y"
        style={{
          background: `linear-gradient(90deg, ${holiday.primaryColor} 0%, ${holiday.primaryColor}DD 50%, ${holiday.primaryColor} 100%)`,
          borderColor: holiday.secondaryColor + "55",
          color: textColor,
          boxShadow: `0 0 24px ${holiday.primaryColor}55, inset 0 1px 0 ${holiday.secondaryColor}30`,
        }}
      >
        {/* Декоративный узор */}
        <HolidayPattern pattern={holiday.pattern} color={holiday.secondaryColor} />

        {/* Бликовый эффект (золотой shimmer) */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${holiday.secondaryColor}66 50%, transparent 100%)`,
            backgroundSize: "200% 100%",
            animation: "holiday-shimmer 4s linear infinite",
          }}
        />

        {/* Контент */}
        <div className="relative flex items-center gap-2.5 min-w-0">
          <span className="text-2xl shrink-0 drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]" aria-hidden>
            {holiday.emoji}
          </span>
          <div className="min-w-0">
            <div
              className="font-oswald font-bold text-base sm:text-lg uppercase tracking-wide leading-tight"
              style={{ color: textColor, textShadow: `0 1px 4px rgba(0,0,0,0.5), 0 0 12px ${holiday.secondaryColor}66` }}
            >
              {holiday.greeting}
            </div>
            <div
              className="font-roboto text-[10px] sm:text-[11px] uppercase tracking-[0.15em] opacity-90 leading-tight mt-0.5"
              style={{ color: textColor }}
            >
              <span style={{ color: holiday.secondaryColor }}>{holiday.name}</span>
              {" · "}
              <span>{countdown}</span>
            </div>
          </div>
        </div>

        {/* Закрыть */}
        {dismissible && (
          <button
            onClick={() => {
              localStorage.setItem("holiday_dismissed_id", holiday.id);
              setDismissed(holiday.id);
            }}
            aria-label="Скрыть праздничное оформление"
            className="relative shrink-0 ml-auto p-1.5 rounded-full hover:bg-black/20 active:bg-black/30 transition-colors"
            style={{ color: textColor }}
          >
            <Icon name="X" size={14} />
          </button>
        )}
      </div>
    </div>
  );
}