import { useEffect, useRef, useState } from "react";
import { CHARACTERS } from "./characters";
import { useStaffTheme } from "./StaffThemeContext";

/** Аниме-маскот фиксированный в правом нижнем углу. Глаза / наклон следят за курсором. */
export default function AnimeMascot({ onOpenSettings }: { onOpenSettings?: () => void } = {}) {
  const { theme } = useStaffTheme();
  const boxRef = useRef<HTMLDivElement>(null);
  const [mouse, setMouse] = useState<{ x: number; y: number } | null>(null);
  const [hidden, setHidden] = useState(false);

  const char = CHARACTERS.find(c => c.id === theme.character_id) || CHARACTERS[0];

  useEffect(() => {
    if (!theme.enabled) return;
    const onMove = (e: MouseEvent) => setMouse({ x: e.clientX, y: e.clientY });
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) setMouse({ x: t.clientX, y: t.clientY });
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onTouch);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onTouch);
    };
  }, [theme.enabled]);

  if (!theme.enabled || hidden) return null;

  // Расчёт позиции зрачков / наклона
  let eyeOffsetLx = 0, eyeOffsetLy = 0, eyeOffsetRx = 0, eyeOffsetRy = 0;
  let tiltX = 0, tiltY = 0;
  if (mouse && boxRef.current) {
    const rect = boxRef.current.getBoundingClientRect();
    const lCx = rect.left + rect.width * char.eyes.lx;
    const lCy = rect.top + rect.height * char.eyes.ly;
    const rCx = rect.left + rect.width * char.eyes.rx;
    const rCy = rect.top + rect.height * char.eyes.ry;
    const maxOffset = rect.width * 0.012;
    const clamp = (cx: number, cy: number) => {
      const dx = mouse.x - cx, dy = mouse.y - cy;
      const dist = Math.hypot(dx, dy) || 1;
      const f = Math.min(1, dist / 200);
      return { x: (dx / dist) * maxOffset * f, y: (dy / dist) * maxOffset * f };
    };
    const lo = clamp(lCx, lCy); eyeOffsetLx = lo.x; eyeOffsetLy = lo.y;
    const ro = clamp(rCx, rCy); eyeOffsetRx = ro.x; eyeOffsetRy = ro.y;

    // наклон относительно центра маскота
    const cCx = rect.left + rect.width / 2;
    const cCy = rect.top + rect.height / 2;
    const tdx = mouse.x - cCx, tdy = mouse.y - cCy;
    const tdist = Math.hypot(tdx, tdy) || 1;
    const tf = Math.min(1, tdist / 400);
    tiltY = (tdx / tdist) * 8 * tf;
    tiltX = -(tdy / tdist) * 6 * tf;
  }

  const showEyes = theme.cursor_effect === "eyes";
  const showTilt = theme.cursor_effect === "tilt";

  return (
    <>
      <button
        ref={boxRef as unknown as React.RefObject<HTMLButtonElement>}
        onClick={onOpenSettings}
        title="Настроить тему"
        className="fixed z-[80] select-none cursor-pointer"
        style={{
          right: 12,
          bottom: 80,
          width: 96,
          height: 96,
          transform: showTilt ? `perspective(400px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)` : undefined,
          transition: "transform 0.15s ease-out",
          filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.55))",
          background: "transparent",
          border: 0,
          padding: 0,
        }}
      >
        <span className="absolute inset-0 rounded-full animate-ping" style={{ background: char.accent + "33" }} />
        <div className="absolute inset-0 rounded-full overflow-hidden border-2" style={{ borderColor: char.accent + "80" }}>
          <img src={char.image} alt={char.name} className="w-full h-full object-cover" draggable={false} />
          {showEyes && (
            <>
              <span
                className="absolute bg-black rounded-full"
                style={{
                  left: `calc(${char.eyes.lx * 100}% - ${char.eyes.radius * 96}px + ${eyeOffsetLx}px)`,
                  top:  `calc(${char.eyes.ly * 100}% - ${char.eyes.radius * 96}px + ${eyeOffsetLy}px)`,
                  width: char.eyes.radius * 2 * 96,
                  height: char.eyes.radius * 2 * 96,
                  transition: "left 0.08s, top 0.08s",
                  boxShadow: "0 0 6px rgba(0,0,0,0.6)",
                }}
              />
              <span
                className="absolute bg-black rounded-full"
                style={{
                  left: `calc(${char.eyes.rx * 100}% - ${char.eyes.radius * 96}px + ${eyeOffsetRx}px)`,
                  top:  `calc(${char.eyes.ry * 100}% - ${char.eyes.radius * 96}px + ${eyeOffsetRy}px)`,
                  width: char.eyes.radius * 2 * 96,
                  height: char.eyes.radius * 2 * 96,
                  transition: "left 0.08s, top 0.08s",
                  boxShadow: "0 0 6px rgba(0,0,0,0.6)",
                }}
              />
            </>
          )}
        </div>
        {/* ласковое покачивание */}
        <style>{`@keyframes mascotFloat { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-4px) } }`}</style>
      </button>

      {/* Кнопка скрыть */}
      <button
        onClick={(e) => { e.stopPropagation(); setHidden(true); }}
        className="fixed z-[82] right-[90px] bottom-[155px] w-5 h-5 rounded-full bg-black/70 border border-white/20 text-white/70 hover:text-white text-[10px] flex items-center justify-center"
        title="Скрыть маскота"
      >
        ×
      </button>
    </>
  );
}