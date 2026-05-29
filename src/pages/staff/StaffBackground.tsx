import { useEffect, useRef } from "react";

type Props = { roleColor: string };

// ── Живые частицы + нейросеть-линии на canvas ─────────────────────────────
function NeuralCanvas({ roleColor }: { roleColor: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf: number;
    let w = 0, h = 0;

    // Парсим цвет в RGB
    const hex = roleColor.replace("#", "");
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);

    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Частицы
    const N = Math.min(40, Math.floor(window.innerWidth / 30));
    type Particle = { x: number; y: number; vx: number; vy: number; r: number; alpha: number; pulse: number };
    const particles: Particle[] = Array.from({ length: N }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.8 + 0.4,
      alpha: Math.random() * 0.5 + 0.15,
      pulse: Math.random() * Math.PI * 2,
    }));

    const CONN_DIST = 160;

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      const t = Date.now() / 1000;

      // Обновляем позиции
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.pulse += 0.02;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;
      }

      // Связи между частицами
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONN_DIST) {
            const alpha = (1 - dist / CONN_DIST) * 0.12;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      // Сами точки
      for (const p of particles) {
        const pulse = Math.sin(p.pulse + t) * 0.3 + 0.7;
        const alpha = p.alpha * pulse;

        // Внешнее свечение
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
        grad.addColorStop(0, `rgba(${r},${g},${b},${alpha * 0.6})`);
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // Ядро точки
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * pulse, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [roleColor]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.6 }}
    />
  );
}

export default function StaffBackground({ roleColor }: Props) {
  return (
    <>
      {/* ── Базовый фон ── */}
      <div className="fixed inset-0 pointer-events-none z-0"
        style={{ background: "radial-gradient(ellipse at 25% 15%, #0a0812 0%, #050508 55%, #000 100%)" }}
      />

      {/* ── Живые нейросеть-частицы ── */}
      <NeuralCanvas roleColor={roleColor} />

      {/* ── Hex-сетка ── */}
      <div className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100'%3E%3Cpath d='M28 66L0 50V18L28 2l28 16v32L28 66zm0-2.31L54 49.2V19.8L28 5.11 2 19.8v29.4L28 63.69z' fill='%23FFD700' /%3E%3C/svg%3E")`,
          backgroundSize: "56px 100px",
          opacity: 0.025,
        }}
      />

      {/* ── Горизонтальные скан-линии ── */}
      <div className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.12) 3px,rgba(0,0,0,0.12) 4px)",
          backgroundSize: "100% 4px",
        }}
      />

      {/* ── Угловые атмосферные свечения ── */}
      <div className="fixed pointer-events-none z-0 rounded-full"
        style={{
          top: "-20%", left: "-10%",
          width: "600px", height: "600px",
          background: `radial-gradient(circle, ${roleColor}15 0%, transparent 70%)`,
          filter: "blur(60px)",
          animation: "breatheGlow 8s ease-in-out infinite",
        }}
      />
      <div className="fixed pointer-events-none z-0 rounded-full"
        style={{
          bottom: "-20%", right: "-10%",
          width: "500px", height: "500px",
          background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)",
          filter: "blur(80px)",
          animation: "breatheGlow 10s ease-in-out infinite reverse",
        }}
      />
      <div className="fixed pointer-events-none z-0 rounded-full"
        style={{
          top: "40%", right: "5%",
          width: "300px", height: "300px",
          background: "radial-gradient(circle, rgba(6,182,212,0.07) 0%, transparent 70%)",
          filter: "blur(60px)",
          animation: "breatheGlow 12s ease-in-out infinite",
          animationDelay: "3s",
        }}
      />

      {/* ── Вертикальные тонкие линии-сетка ── */}
      <div className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: "repeating-linear-gradient(90deg,transparent,transparent 119px,rgba(255,215,0,0.02) 119px,rgba(255,215,0,0.02) 120px)",
          opacity: 1,
        }}
      />

      {/* ── CSS анимации ── */}
      <style>{`
        @keyframes breatheGlow {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50%       { transform: scale(1.15); opacity: 1; }
        }
      `}</style>
    </>
  );
}
