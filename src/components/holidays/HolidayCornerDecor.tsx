import { useEffect, useState } from "react";
import { getActiveHoliday, type Holiday } from "./holidays";
import HolidayCanvasFX from "./HolidayCanvasFX";

/** Угловое праздничное украшение + полноэкранные канвас-эффекты.
 *
 *  Не перекрывает контент, не реагирует на клики (pointer-events: none).
 *  Уважает настройку «скрыть праздник» (localStorage holiday_corner_dismissed).
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

/** Реалистичная Георгиевская лента с волнующейся тканью и свечением звезды. */
function GeorgeRibbonBadge() {
  return (
    <div
      aria-hidden
      className="fixed bottom-4 right-4 z-[15] pointer-events-none select-none"
      style={{ animation: "holiday-corner-float 4.5s ease-in-out infinite" }}
    >
      <svg width="92" height="120" viewBox="0 0 92 120" xmlns="http://www.w3.org/2000/svg" style={{ filter: "drop-shadow(0 6px 14px rgba(0,0,0,0.6))" }}>
        <defs>
          {/* Полосы Георгиевской ленты — 3 чёрные на оранжевом */}
          <pattern id="gStripes" patternUnits="userSpaceOnUse" width="22" height="6" patternTransform="rotate(0)">
            <rect width="22" height="6" fill="#FF8C00" />
            <rect y="0" width="22" height="1.2" fill="#1a0d00" />
            <rect y="2.4" width="22" height="1.2" fill="#1a0d00" />
            <rect y="4.8" width="22" height="1.2" fill="#1a0d00" />
          </pattern>
          {/* Тень-блик на ткани */}
          <linearGradient id="gShade" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#000" stopOpacity="0.45" />
            <stop offset="50%" stopColor="#000" stopOpacity="0" />
            <stop offset="100%" stopColor="#000" stopOpacity="0.45" />
          </linearGradient>
          <linearGradient id="goldStar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fff3a0" />
            <stop offset="50%" stopColor="#FFD700" />
            <stop offset="100%" stopColor="#B8860B" />
          </linearGradient>
          <radialGradient id="starGlow" cx="0.5" cy="0.5" r="0.6">
            <stop offset="0%" stopColor="#FFD700" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#FFD700" stopOpacity="0" />
          </radialGradient>
          <filter id="gShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodColor="#000" floodOpacity="0.6" />
          </filter>
        </defs>

        {/* Левый волнующийся хвост */}
        <g filter="url(#gShadow)">
          <path
            d="M 8,10 Q 18,18 14,40 Q 10,62 22,82 L 32,76 Q 26,58 28,38 Q 30,20 26,10 Z"
            fill="url(#gStripes)"
            stroke="#1a0d00"
            strokeWidth="0.6"
          >
            <animate attributeName="d"
              dur="6s" repeatCount="indefinite"
              values="
                M 8,10 Q 18,18 14,40 Q 10,62 22,82 L 32,76 Q 26,58 28,38 Q 30,20 26,10 Z;
                M 8,10 Q 22,22 18,42 Q 14,64 24,84 L 34,78 Q 28,60 30,40 Q 32,22 26,10 Z;
                M 8,10 Q 18,18 14,40 Q 10,62 22,82 L 32,76 Q 26,58 28,38 Q 30,20 26,10 Z" />
          </path>
          <path
            d="M 8,10 Q 18,18 14,40 Q 10,62 22,82 L 32,76 Q 26,58 28,38 Q 30,20 26,10 Z"
            fill="url(#gShade)" opacity="0.5"
          />

          {/* Правый волнующийся хвост */}
          <path
            d="M 84,10 Q 74,18 78,40 Q 82,62 70,82 L 60,76 Q 66,58 64,38 Q 62,20 66,10 Z"
            fill="url(#gStripes)"
            stroke="#1a0d00"
            strokeWidth="0.6"
          >
            <animate attributeName="d"
              dur="6s" repeatCount="indefinite"
              values="
                M 84,10 Q 74,18 78,40 Q 82,62 70,82 L 60,76 Q 66,58 64,38 Q 62,20 66,10 Z;
                M 84,10 Q 70,22 74,42 Q 78,64 68,84 L 58,78 Q 64,60 62,40 Q 60,22 66,10 Z;
                M 84,10 Q 74,18 78,40 Q 82,62 70,82 L 60,76 Q 66,58 64,38 Q 62,20 66,10 Z" />
          </path>
          <path
            d="M 84,10 Q 74,18 78,40 Q 82,62 70,82 L 60,76 Q 66,58 64,38 Q 62,20 66,10 Z"
            fill="url(#gShade)" opacity="0.5"
          />

          {/* Розетка-петля */}
          <ellipse cx="46" cy="48" rx="22" ry="17" fill="url(#gStripes)" stroke="#1a0d00" strokeWidth="0.7" />
          <ellipse cx="46" cy="48" rx="22" ry="17" fill="url(#gShade)" opacity="0.3" />
          {/* Подложка для звезды */}
          <circle cx="46" cy="48" r="13" fill="#1a0d00" stroke="#8B4513" strokeWidth="0.6" opacity="0.85" />
        </g>

        {/* Свечение под звездой */}
        <circle cx="46" cy="48" r="20" fill="url(#starGlow)">
          <animate attributeName="r" values="18;24;18" dur="2.2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.5;1;0.5" dur="2.2s" repeatCount="indefinite" />
        </circle>

        {/* Золотая 5-конечная звезда */}
        <polygon
          points="46,36 49.5,46 60,46 51.5,52.2 54.5,62.5 46,56.3 37.5,62.5 40.5,52.2 32,46 42.5,46"
          fill="url(#goldStar)"
          stroke="#7a4a10"
          strokeWidth="0.6"
          style={{ filter: "drop-shadow(0 0 4px rgba(255,215,0,0.6))" }}
        />
      </svg>
    </div>
  );
}

/** Ёлочка-шарик в углу для НГ */
function NewYearCornerOrb() {
  return (
    <div
      aria-hidden
      className="fixed bottom-4 right-4 z-[15] pointer-events-none select-none"
      style={{ animation: "holiday-corner-float 4s ease-in-out infinite" }}
    >
      <div className="relative text-5xl drop-shadow-[0_4px_14px_rgba(0,200,100,0.55)]">
        <span className="absolute inset-0 blur-md opacity-70">🎄</span>
        <span className="relative">🎄</span>
      </div>
    </div>
  );
}

/** Универсальный «эмодзи-медальон» для остальных праздников. */
function GenericCornerOrb({ emoji, glowColor }: { emoji: string; glowColor: string }) {
  return (
    <div
      aria-hidden
      className="fixed bottom-4 right-4 z-[15] pointer-events-none select-none"
      style={{ animation: "holiday-corner-float 4s ease-in-out infinite" }}
    >
      <div className="relative text-5xl" style={{ filter: `drop-shadow(0 4px 14px ${glowColor})` }}>
        <span className="absolute inset-0 blur-md opacity-60">{emoji}</span>
        <span className="relative">{emoji}</span>
      </div>
    </div>
  );
}

function CornerForHoliday({ holiday }: { holiday: Holiday }) {
  const css = `
    @keyframes holiday-corner-float {
      0%, 100% { transform: translateY(0) rotate(-2deg); }
      50%      { transform: translateY(-6px) rotate(2deg); }
    }
  `;

  // Подбираем canvas-режим под паттерн
  let fxMode: "fireworks" | "snow" | "petals" | "stars" | "hearts" | null = null;
  let fxColors: string[] | undefined;
  if (holiday.pattern === "ribbon" || holiday.pattern === "fireworks") {
    fxMode = "fireworks";
    if (holiday.pattern === "ribbon") fxColors = ["#FFD700", "#FF8C00", "#ffffff", "#FF4444", "#fff3a0"];
  } else if (holiday.pattern === "snow") {
    fxMode = "snow";
  } else if (holiday.pattern === "flowers") {
    fxMode = "petals";
    fxColors = ["#ff6fa3", "#ff9ec0", "#ffd1dc", "#ffb84d", "#ffd700", "#ff4d8d"];
  } else if (holiday.pattern === "stars") {
    fxMode = "stars";
  } else if (holiday.pattern === "hearts") {
    fxMode = "hearts";
  } else if (holiday.pattern === "flag") {
    // флаг — мягкие звёздочки в цветах флага
    fxMode = "stars";
    fxColors = ["#ffffff", "#0039A6", "#D52B1E", "#FFD700"];
  }

  // Угловое украшение
  let corner: React.ReactNode = null;
  if (holiday.pattern === "ribbon") corner = <GeorgeRibbonBadge />;
  else if (holiday.pattern === "snow") corner = <NewYearCornerOrb />;
  else corner = <GenericCornerOrb emoji={holiday.emoji} glowColor={`${holiday.primaryColor}99`} />;

  return (
    <>
      <style>{css}</style>
      {fxMode && <HolidayCanvasFX mode={fxMode} flavorKey={holiday.id} colors={fxColors} />}
      {corner}
    </>
  );
}
