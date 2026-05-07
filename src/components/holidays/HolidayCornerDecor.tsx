import { useEffect, useState } from "react";
import { getActiveHoliday, type Holiday } from "./holidays";

/** Угловое праздничное украшение — лёгкий фон-оверлей в правом нижнем углу.
 *
 *  Не перекрывает контент, не реагирует на клики (pointer-events: none).
 *  Подключается к layout-у, чтобы быть видимым на всех страницах (Index, Staff, Cabinet и т.д.).
 *
 *  Уважает настройку «скрыть праздник» (localStorage holiday_dismissed_id) и админ-настройки.
 */
export default function HolidayCornerDecor() {
  const [active, setActive] = useState(() => getActiveHoliday());

  useEffect(() => {
    const refresh = () => setActive(getActiveHoliday());
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
  const cornerDismissed = typeof window !== "undefined" && localStorage.getItem("holiday_corner_dismissed") === active.holiday.id;
  if (cornerDismissed) return null;

  return <CornerForHoliday holiday={active.holiday} />;
}

/** Аккуратная Георгиевская лента — SVG-медальон в правом нижнем углу. */
function GeorgeRibbonBadge() {
  return (
    <div
      aria-hidden
      className="fixed bottom-3 right-3 z-[15] pointer-events-none select-none"
      style={{ animation: "holiday-corner-pulse 3s ease-in-out infinite" }}
    >
      <svg width="56" height="72" viewBox="0 0 56 72" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="ribbonGold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFD700" />
            <stop offset="100%" stopColor="#B8860B" />
          </linearGradient>
          <filter id="ribbonShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.5" />
          </filter>
        </defs>

        <g filter="url(#ribbonShadow)">
          {/* Левый хвост ленты */}
          <polygon
            points="6,8 22,8 22,52 14,46 6,52"
            fill="url(#georgeStripes)"
            stroke="#1a0d00"
            strokeWidth="0.5"
          />
          {/* Правый хвост ленты */}
          <polygon
            points="34,8 50,8 50,52 42,46 34,52"
            fill="url(#georgeStripes)"
            stroke="#1a0d00"
            strokeWidth="0.5"
          />
          {/* Центральная розетка */}
          <circle cx="28" cy="42" r="14" fill="url(#georgeStripes)" stroke="#1a0d00" strokeWidth="0.6" />
          {/* Звезда по центру */}
          <polygon
            points="28,32 30.4,38.6 37.4,38.6 31.7,42.7 33.9,49.3 28,45.2 22.1,49.3 24.3,42.7 18.6,38.6 25.6,38.6"
            fill="url(#ribbonGold)"
            stroke="#8B4513"
            strokeWidth="0.4"
          />
        </g>

        {/* Полосы Георгиевской ленты — паттерн */}
        <defs>
          <pattern id="georgeStripes" patternUnits="userSpaceOnUse" width="6" height="6">
            <rect width="6" height="6" fill="#FF8C00" />
            <rect y="0" width="6" height="1.5" fill="#1a0d00" />
            <rect y="3" width="6" height="1.5" fill="#1a0d00" />
          </pattern>
        </defs>
      </svg>
    </div>
  );
}

function CornerForHoliday({ holiday }: { holiday: Holiday }) {
  const css = `
    @keyframes holiday-corner-pulse {
      0%, 100% { opacity: 0.85; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.04); }
    }
    @keyframes holiday-snow-fall {
      0% { transform: translateY(-10px) rotate(0deg); opacity: 0; }
      10% { opacity: 0.8; }
      100% { transform: translateY(110vh) rotate(360deg); opacity: 0; }
    }
  `;

  if (holiday.pattern === "ribbon") {
    // 9 мая — Георгиевская медаль в углу
    return (
      <>
        <style>{css}</style>
        <GeorgeRibbonBadge />
      </>
    );
  }

  if (holiday.pattern === "snow") {
    // Новый год — снежинки + ёлка в углу
    return (
      <>
        <style>{css}</style>
        <div aria-hidden className="fixed inset-0 z-[15] pointer-events-none overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <span
              key={i}
              className="absolute text-white/55 select-none"
              style={{
                left: `${(i * 7 + 3) % 100}%`,
                top: "-10px",
                fontSize: `${10 + (i % 3) * 6}px`,
                animation: `holiday-snow-fall ${8 + (i % 5) * 2}s linear ${i * 0.4}s infinite`,
              }}
            >
              ❄
            </span>
          ))}
        </div>
        <div
          aria-hidden
          className="fixed bottom-3 right-3 z-[15] pointer-events-none text-3xl select-none drop-shadow-[0_2px_8px_rgba(0,150,80,0.5)]"
          style={{ animation: "holiday-corner-pulse 3s ease-in-out infinite" }}
        >
          🎄
        </div>
      </>
    );
  }

  if (holiday.pattern === "hearts" || holiday.pattern === "flowers" || holiday.pattern === "stars" || holiday.pattern === "fireworks" || holiday.pattern === "flag") {
    return (
      <>
        <style>{css}</style>
        <div
          aria-hidden
          className="fixed bottom-3 right-3 z-[15] pointer-events-none select-none text-3xl drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
          style={{ animation: "holiday-corner-pulse 3s ease-in-out infinite" }}
        >
          {holiday.emoji}
        </div>
      </>
    );
  }

  return null;
}
