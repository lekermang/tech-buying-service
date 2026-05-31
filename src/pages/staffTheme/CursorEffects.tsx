import { useEffect, useRef, useState } from "react";
import { useStaffTheme } from "./StaffThemeContext";

type Particle = { id: number; x: number; y: number; t: number; kind: string };

export default function CursorEffects() {
  const { theme } = useStaffTheme();
  const [parts, setParts] = useState<Particle[]>([]);
  const idRef = useRef(0);
  const lastSpawn = useRef(0);

  // Кастомный курсор-точка (dot) с магнетизмом кнопок
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const mouse = useRef({ x: 0, y: 0 });
  const ring  = useRef({ x: 0, y: 0 });
  const rafDot = useRef(0);

  useEffect(() => {
    if (!theme.enabled || theme.cursor_effect !== "dot") return;
    document.body.style.cursor = "none";

    const onMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };

      // магнетизм: при наведении на кнопку/ссылку — притягиваемся к центру
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const mag = el?.closest("button, a, [data-magnetic]");
      if (mag && dotRef.current) {
        const r = mag.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top  + r.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        dotRef.current.style.transform = `translate(${cx + dx * 0.3 - 5}px, ${cy + dy * 0.3 - 5}px) scale(2.2)`;
        dotRef.current.style.opacity = "0.5";
      } else if (dotRef.current) {
        dotRef.current.style.transform = `translate(${e.clientX - 5}px, ${e.clientY - 5}px) scale(1)`;
        dotRef.current.style.opacity = "1";
      }
    };

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const loop = () => {
      ring.current.x = lerp(ring.current.x, mouse.current.x, 0.12);
      ring.current.y = lerp(ring.current.y, mouse.current.y, 0.12);
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${ring.current.x - 18}px, ${ring.current.y - 18}px)`;
      }
      rafDot.current = requestAnimationFrame(loop);
    };
    loop();

    window.addEventListener("mousemove", onMove);
    return () => {
      document.body.style.cursor = "";
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(rafDot.current);
    };
  }, [theme.enabled, theme.cursor_effect, theme.accent_color]);

  useEffect(() => {
    const fx = theme.cursor_effect;
    if (!theme.enabled || !["sparkles", "trail", "hearts"].includes(fx)) return;

    const onMove = (e: MouseEvent) => {
      const now = performance.now();
      const minGap = fx === "trail" ? 20 : fx === "sparkles" ? 45 : 90;
      if (now - lastSpawn.current < minGap) return;
      lastSpawn.current = now;
      const p: Particle = { id: ++idRef.current, x: e.clientX, y: e.clientY, t: now, kind: fx };
      setParts(arr => [...arr.slice(-40), p]);
    };
    window.addEventListener("mousemove", onMove);

    const clean = setInterval(() => {
      const now = performance.now();
      setParts(arr => arr.filter(p => now - p.t < 900));
    }, 300);

    return () => {
      window.removeEventListener("mousemove", onMove);
      clearInterval(clean);
    };
  }, [theme.enabled, theme.cursor_effect]);

  const accent = theme.accent_color;

  // Рендер кастомного курсора
  if (theme.enabled && theme.cursor_effect === "dot") {
    return (
      <>
        {/* Кольцо (lagged) */}
        <div
          ref={ringRef}
          className="fixed top-0 left-0 z-[9999] pointer-events-none"
          style={{
            width: 36, height: 36,
            border: `1.5px solid ${accent}`,
            borderRadius: "50%",
            opacity: 0.5,
            willChange: "transform",
            transition: "opacity 0.2s",
          }}
        />
        {/* Точка (instant) */}
        <div
          ref={dotRef}
          className="fixed top-0 left-0 z-[9999] pointer-events-none"
          style={{
            width: 10, height: 10,
            background: accent,
            borderRadius: "50%",
            boxShadow: `0 0 12px ${accent}, 0 0 24px ${accent}66`,
            willChange: "transform",
            transition: "transform 0.08s ease, opacity 0.15s, box-shadow 0.15s",
          }}
        />
      </>
    );
  }

  if (!theme.enabled || parts.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[90] pointer-events-none overflow-hidden">
      {parts.map(p => {
        const age = (performance.now() - p.t) / 900;
        const opacity = 1 - age;
        const scale = p.kind === "hearts" ? 1 + age * 0.5 : 1 - age * 0.6;
        const dy = p.kind === "hearts" ? -age * 40 : -age * 20;
        const common = {
          left: p.x, top: p.y,
          transform: `translate(-50%, calc(-50% + ${dy}px)) scale(${scale})`,
          opacity,
        } as React.CSSProperties;

        if (p.kind === "sparkles") {
          return (
            <span key={p.id} className="absolute" style={{ ...common }}>
              <span
                className="block rounded-full"
                style={{ width: 8, height: 8, background: accent, boxShadow: `0 0 12px ${accent}, 0 0 24px ${accent}88` }}
              />
            </span>
          );
        }
        if (p.kind === "trail") {
          return (
            <span key={p.id} className="absolute rounded-full" style={{
              ...common,
              width: 14, height: 14,
              background: `radial-gradient(circle, ${accent}bb 0%, transparent 70%)`,
            }} />
          );
        }
        // hearts
        return (
          <span key={p.id} className="absolute text-[14px]" style={{ ...common, color: accent, filter: `drop-shadow(0 0 4px ${accent}99)` }}>
            ♥
          </span>
        );
      })}
    </div>
  );
}