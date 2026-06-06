/**
 * GlowCursor — золотое свечение следует за курсором.
 * Мягкий gradient-blob, который тянется за мышью с лагом.
 * Только десктоп (pointer: fine).
 */
import { useEffect, useRef } from "react";

export default function GlowCursor() {
  const ref = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: -300, y: -300 });
  const cur = useRef({ x: -300, y: -300 });
  const raf = useRef(0);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: fine)");
    if (!mq.matches) return;

    const onMove = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", onMove, { passive: true });

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const tick = () => {
      cur.current.x = lerp(cur.current.x, pos.current.x, 0.09);
      cur.current.y = lerp(cur.current.y, pos.current.y, 0.09);
      if (ref.current) {
        ref.current.style.transform = `translate(${cur.current.x - 200}px,${cur.current.y - 200}px)`;
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  return (
    <div aria-hidden className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      <div ref={ref}
        className="absolute w-[400px] h-[400px] rounded-full"
        style={{
          background: "radial-gradient(circle,rgba(255,215,0,0.06) 0%,rgba(255,215,0,0.02) 45%,transparent 70%)",
          willChange: "transform",
          top: 0,
          left: 0,
        }}
      />
    </div>
  );
}
