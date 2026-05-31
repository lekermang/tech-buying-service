import { useEffect, useRef } from "react";

const CHARS = "01アイウエオカキクケコサシスセソタチツテトナニヌネノ";
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
  const raf = useRef<number>(0);

  useEffect(() => {
    const isMobile = window.matchMedia("(pointer: coarse)").matches;
    if (isMobile) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = window.innerWidth;
    let H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;

    const resize = () => {
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = W; canvas.height = H;
      initColumns();
    };
    window.addEventListener("resize", resize);

    // Matrix rain columns
    const COL_SIZE = 18;
    let columns: Column[] = [];
    const initColumns = () => {
      const count = Math.floor(W / COL_SIZE);
      columns = Array.from({ length: count }, (_, i) => ({
        x: i * COL_SIZE + COL_SIZE / 2,
        y: Math.random() * H,
        speed: 0.4 + Math.random() * 0.8,
        opacity: 0.03 + Math.random() * 0.08,
      }));
    };
    initColumns();

    // Floating particles
    const particles: Particle[] = [];
    const MAX_PARTICLES = 28;

    const spawnParticle = () => {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -0.3 - Math.random() * 0.5,
        alpha: 0,
        size: 9 + Math.random() * 7,
        char: CHARS[Math.floor(Math.random() * CHARS.length)],
        life: 0,
        maxLife: 140 + Math.random() * 120,
      });
    };

    let frame = 0;
    const draw = () => {
      frame++;
      ctx.clearRect(0, 0, W, H);

      // Matrix rain
      ctx.font = `${COL_SIZE - 2}px 'Courier New', monospace`;
      for (const col of columns) {
        col.y += col.speed;
        if (col.y > H) { col.y = -COL_SIZE; col.opacity = 0.03 + Math.random() * 0.07; }
        ctx.fillStyle = `${GOLD}${col.opacity})`;
        ctx.fillText(CHARS[Math.floor(Math.random() * CHARS.length)], col.x - 6, col.y);
      }

      // Spawn particles
      if (frame % 12 === 0 && particles.length < MAX_PARTICLES) spawnParticle();

      // Draw floating chars
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        p.x += p.vx; p.y += p.vy;
        const prog = p.life / p.maxLife;
        p.alpha = prog < 0.2 ? prog / 0.2 : prog > 0.8 ? (1 - prog) / 0.2 : 1;
        ctx.font = `${p.size}px 'Courier New', monospace`;
        ctx.fillStyle = `${GOLD}${p.alpha * 0.7})`;
        ctx.fillText(p.char, p.x, p.y);
        if (p.life >= p.maxLife) particles.splice(i, 1);
      }

      // Grid overlay — subtle dotted grid
      if (frame % 60 === 0) {
        ctx.clearRect(0, 0, W, H);
      }

      raf.current = requestAnimationFrame(draw);
    };

    raf.current = requestAnimationFrame(draw);
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed", inset: 0, zIndex: 0,
        pointerEvents: "none",
        opacity: 0.25,
        display: "block",
      }}
      className="hidden md:block"
    />
  );
}