import { useEffect, useState } from "react";
import { getActiveHoliday, type Holiday } from "./holidays";

/** Угловое праздничное украшение — лёгкий фон-оверлей в правом верхнем углу.
 *
 *  Не перекрывает контент, не реагирует на клики (pointer-events: none).
 *  Подключается к layout-у, чтобы быть видимым на всех страницах (Index, Staff, Cabinet и т.д.).
 *
 *  Уважает настройку «скрыть праздник» (localStorage holiday_dismissed_id) и админ-настройки.
 */
export default function HolidayCornerDecor() {
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
  // Если пользователь скрыл баннер — НЕ скрываем уголки (это другой уровень декора).
  // Но добавим возможность отключить и его через отдельный ключ.
  const cornerDismissed = typeof window !== "undefined" && localStorage.getItem("holiday_corner_dismissed") === active.holiday.id;
  if (cornerDismissed) return null;

  return <CornerForHoliday holiday={active.holiday} />;
}

function CornerForHoliday({ holiday }: { holiday: Holiday }) {
  // Глобальная анимация шевелилки/мерцания
  const css = `
    @keyframes holiday-corner-glow {
      0%, 100% { opacity: 0.55; transform: scale(1) rotate(0deg); }
      50% { opacity: 0.85; transform: scale(1.05) rotate(-1deg); }
    }
    @keyframes holiday-snow-fall {
      0% { transform: translateY(-10px) rotate(0deg); opacity: 0; }
      10% { opacity: 0.8; }
      100% { transform: translateY(110vh) rotate(360deg); opacity: 0; }
    }
    @keyframes holiday-ribbon-wave {
      0%, 100% { transform: translateY(0) rotate(-12deg); }
      50% { transform: translateY(-2px) rotate(-10deg); }
    }
  `;

  // Конфигурация декора по типу праздника
  if (holiday.pattern === "ribbon") {
    // 9 мая — Георгиевская лента в правом верхнем углу + эмоджи
    return (
      <>
        <style>{css}</style>
        <div aria-hidden className="fixed top-0 right-0 z-[15] pointer-events-none select-none">
          {/* Лента, повёрнутая под 45° */}
          <div
            className="absolute top-3 -right-12 w-44 h-7"
            style={{
              transform: "rotate(45deg)",
              background: "repeating-linear-gradient(90deg, #2A1A0A 0 12px, #FFA500 12px 22px, #2A1A0A 22px 34px, #FFA500 34px 44px)",
              boxShadow: "0 4px 14px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,165,0,0.4)",
              animation: "holiday-ribbon-wave 4s ease-in-out infinite",
            }}
          />
          {/* Эмоджи-звёздочка */}
          <div
            className="absolute top-2 right-2 text-2xl drop-shadow-[0_2px_8px_rgba(255,165,0,0.6)]"
            style={{ animation: "holiday-corner-glow 3s ease-in-out infinite" }}
          >
            🎗
          </div>
        </div>
      </>
    );
  }

  if (holiday.pattern === "snow") {
    // Новый год — снежинки по всему экрану
    return (
      <>
        <style>{css}</style>
        <div aria-hidden className="fixed inset-0 z-[15] pointer-events-none overflow-hidden">
          {[...Array(25)].map((_, i) => (
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
          {/* Эмоджи в углу */}
          <div className="absolute top-3 right-3 text-3xl drop-shadow-[0_2px_8px_rgba(0,150,80,0.5)]"
               style={{ animation: "holiday-corner-glow 3s ease-in-out infinite" }}>
            🎄
          </div>
        </div>
      </>
    );
  }

  if (holiday.pattern === "hearts" || holiday.pattern === "flowers" || holiday.pattern === "stars" || holiday.pattern === "fireworks" || holiday.pattern === "flag") {
    // Универсальный угловой эмоджи (без массивных украшений на всю страницу)
    return (
      <>
        <style>{css}</style>
        <div aria-hidden className="fixed top-3 right-3 z-[15] pointer-events-none select-none">
          <div className="text-3xl drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
               style={{ animation: "holiday-corner-glow 3s ease-in-out infinite" }}>
            {holiday.emoji}
          </div>
        </div>
      </>
    );
  }

  return null;
}
