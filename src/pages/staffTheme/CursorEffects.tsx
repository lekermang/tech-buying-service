import { useEffect, useRef, useState } from "react";
import { useStaffTheme } from "./StaffThemeContext";

type Particle = { id: number; x: number; y: number; t: number; kind: string };

export default function CursorEffects() {
  const { theme } = useStaffTheme();
  const [parts, setParts] = useState<Particle[]>([]);
  const idRef = useRef(0);
  const lastSpawn = useRef(0);

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

  if (!theme.enabled || parts.length === 0) return null;

  const accent = theme.accent_color;

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
