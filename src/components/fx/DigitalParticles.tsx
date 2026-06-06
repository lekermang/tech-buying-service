/**
 * DigitalParticles — оптимизированный Matrix rain.
 * Изменения vs оригинал:
 * - throttle до 30 FPS (достаточно для фона)
 * - ctx.font не меняется в цикле частиц без необходимости
 * - убрана двойная clearRect (frame%60 был лишний)
 * - MAX_PARTICLES снижен до 16 — на мобиле 0
 * - will-change: transform на canvas убран (оно на fixed)
 */
import { useEffect, useRef } from "react";

const CHARS = "01アイウエオカキクケコサシスセソ";
const GOLD = "rgba(255,215,0,";

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  alpha: number; size: number;
  char: string; life: number; maxLife: number;
}

interface Column {
  x: number; y: number; speed: number; opacity: number;
}

export default function DigitalParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);

  useEffect(() => {
    const isMobile = window.matchMedia("(pointer: coarse)").matches;
    if (isMobile) return; // мобиль — без Canvas совсем

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let W = window.innerWidth;
    let H = window.innerHeight;
    canvas.width  = W;
    canvas.height = H;

    // Matrix rain columns
    const COL_SIZE = 20;
    let columns: Column[] = [];
    const initColumns = () => {
      const count = Math.floor(W / COL_SIZE);
      columns = Array.from({ length: count }, (_, i) => ({
        x: i * COL_SIZE + COL_SIZE / 2,
        y: Math.random() * H,
        speed: 0.5 + Math.random() * 0.7,
        opacity: 0.03 + Math.random() * 0.07,
      }));
    };
    initColumns();

    const resize = () => {
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = W; canvas.height = H;
      initColumns();
    };
    window.addEventListener("resize", resize, { passive: true });

    // Floating particles
    const particles: Particle[] = [];
    const MAX_P = 16;

    const spawnParticle = () => {
      if (particles.length >= MAX_P) return;
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -0.25 - Math.random() * 0.4,
        alpha: 0,
        size: 9 + Math.random() * 6,
        char: CHARS[Math.floor(Math.random() * CHARS.length)],
        life: 0,
        maxLife: 150 + Math.random() * 100,
      });
    };

    // Throttle: рисуем раз в ~33ms (30fps)
    let lastTs = 0;
    let spawnTick = 0;
    const INTERVAL = 33;

    const draw = (ts: number) => {
      rafRef.current = requestAnimationFrame(draw);
      if (ts - lastTs < INTERVAL) return;
      lastTs = ts;

      ctx.clearRect(0, 0, W, H);

      // Matrix rain — один ctx.font на всю группу
      ctx.font = `${COL_SIZE - 3}px 'Courier New', monospace`;
      for (const col of columns) {
        col.y += col.speed;
        if (col.y > H) { col.y = -COL_SIZE; col.opacity = 0.03 + Math.random() * 0.06; }
        ctx.fillStyle = `${GOLD}${col.opacity})`;
        ctx.fillText(CHARS[Math.floor(Math.random() * CHARS.length)], col.x - 6, col.y);
      }

      // Spawn
      spawnTick++;
      if (spawnTick % 15 === 0) spawnParticle();

      // Draw floating chars
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        p.x += p.vx;
        p.y += p.vy;
        const prog = p.life / p.maxLife;
        p.alpha = prog < 0.2 ? prog / 0.2 : prog > 0.8 ? (1 - prog) / 0.2 : 1;
        ctx.font  = `${p.size}px 'Courier New', monospace`;
        ctx.fillStyle = `${GOLD}${(p.alpha * 0.65).toFixed(2)})`;
        ctx.fillText(p.char, p.x, p.y);
        if (p.life >= p.maxLife) particles.splice(i, 1);
      }
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="hidden md:block"
      style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", opacity: 0.22 }}
    />
  );
}
