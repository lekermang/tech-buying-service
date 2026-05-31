import { useEffect, useRef } from "react";

type Props = { roleColor: string };

// ── Кинематографический canvas: лучи света + пыль ─────────────────────────
function CinemaCanvas({ roleColor }: { roleColor: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf: number;
    let w = 0, h = 0;

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

    // Пылинки в луче света
    const N = Math.min(60, Math.floor(window.innerWidth / 12));
    type Dust = {
      x: number; y: number; vx: number; vy: number;
      r: number; alpha: number; phase: number; speed: number;
    };
    const dust: Dust[] = Array.from({ length: N }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.15,
      vy: -Math.random() * 0.3 - 0.05,
      r: Math.random() * 1.2 + 0.2,
      alpha: Math.random() * 0.4 + 0.05,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.008 + 0.003,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const t = Date.now() / 1000;

      // Кинематографические лучи света сверху
      const beams = [
        { x: w * 0.15, angle: 0.12, width: 180, alpha: 0.028, color: `${r},${g},${b}` },
        { x: w * 0.55, angle: -0.06, width: 280, alpha: 0.018, color: "255,215,0" },
        { x: w * 0.82, angle: 0.18, width: 140, alpha: 0.022, color: `${r},${g},${b}` },
      ];

      for (const beam of beams) {
        ctx.save();
        ctx.translate(beam.x, 0);
        ctx.rotate(beam.angle);
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, `rgba(${beam.color},${beam.alpha})`);
        grad.addColorStop(0.4, `rgba(${beam.color},${beam.alpha * 0.6})`);
        grad.addColorStop(1, `rgba(${beam.color},0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(-beam.width / 2, 0);
        ctx.lineTo(beam.width / 2, 0);
        ctx.lineTo(beam.width * 1.8, h);
        ctx.lineTo(-beam.width * 1.8, h);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // Пылинки
      for (const d of dust) {
        d.x += d.vx + Math.sin(t * d.speed * 3 + d.phase) * 0.2;
        d.y += d.vy;
        if (d.y < -10) { d.y = h + 10; d.x = Math.random() * w; }
        if (d.x < 0) d.x = w;
        if (d.x > w) d.x = 0;

        const pulse = Math.sin(t * d.speed * 6 + d.phase) * 0.3 + 0.7;
        const alpha = d.alpha * pulse;

        // Свечение пылинки
        const grd = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.r * 5);
        grd.addColorStop(0, `rgba(${r},${g},${b},${alpha * 0.5})`);
        grd.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r * 5, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        // Ядро
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r * pulse, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${alpha * 0.8})`;
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
      style={{ opacity: 0.9 }}
    />
  );
}

export default function StaffBackground({ roleColor }: Props) {
  return (
    <>
      {/* ── Глубокий кинематографический фон ── */}
      <div className="fixed inset-0 pointer-events-none z-0" style={{
        background: `
          radial-gradient(ellipse 120% 60% at 50% 0%, #1a1208 0%, transparent 60%),
          radial-gradient(ellipse 80% 50% at 20% 100%, #0d0a04 0%, transparent 50%),
          radial-gradient(ellipse 60% 80% at 80% 50%, #080608 0%, transparent 60%),
          linear-gradient(180deg, #050403 0%, #020202 40%, #030202 100%)
        `,
      }} />

      {/* ── Кинематографические лучи и пыль ── */}
      <CinemaCanvas roleColor={roleColor} />

      {/* ── Тонкие горизонтальные линии — эффект киноплёнки ── */}
      <div className="fixed inset-0 pointer-events-none z-0" style={{
        backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.008) 2px, rgba(255,255,255,0.008) 3px)",
        backgroundSize: "100% 3px",
      }} />

      {/* ── Перспективная сетка (пол) 3D эффект ── */}
      <div className="fixed inset-0 pointer-events-none z-0" style={{
        backgroundImage: `
          linear-gradient(rgba(255,215,0,0.018) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,215,0,0.018) 1px, transparent 1px)
        `,
        backgroundSize: "60px 60px",
        backgroundPosition: "center center",
        maskImage: "radial-gradient(ellipse 100% 70% at 50% 100%, black 0%, transparent 70%)",
        WebkitMaskImage: "radial-gradient(ellipse 100% 70% at 50% 100%, black 0%, transparent 70%)",
        transform: "perspective(600px) rotateX(35deg) scaleY(2.5) translateY(20%)",
        transformOrigin: "50% 100%",
        opacity: 0.7,
      }} />

      {/* ── Атмосферный золотой свет — источник сверху ── */}
      <div className="fixed pointer-events-none z-0" style={{
        top: "-15%", left: "30%", right: "30%",
        height: "50%",
        background: `radial-gradient(ellipse at 50% 0%, rgba(255,200,50,0.07) 0%, transparent 70%)`,
        filter: "blur(40px)",
        animation: "noirLight 12s ease-in-out infinite",
      }} />

      {/* ── Боковые виньетки — кинематографичность ── */}
      <div className="fixed inset-0 pointer-events-none z-0" style={{
        background: `
          radial-gradient(ellipse 40% 100% at 0% 50%, rgba(0,0,0,0.7) 0%, transparent 100%),
          radial-gradient(ellipse 40% 100% at 100% 50%, rgba(0,0,0,0.7) 0%, transparent 100%)
        `,
      }} />

      {/* ── Виньетка углов (letterbox effect) ── */}
      <div className="fixed inset-0 pointer-events-none z-0" style={{
        background: `radial-gradient(ellipse 90% 90% at 50% 50%, transparent 50%, rgba(0,0,0,0.65) 100%)`,
      }} />

      {/* ── Динамический свет от roleColor ── */}
      <div className="fixed pointer-events-none z-0 rounded-full" style={{
        top: "-10%", left: "50%", transform: "translateX(-50%)",
        width: "800px", height: "400px",
        background: `radial-gradient(ellipse at 50% 30%, ${roleColor}08 0%, transparent 70%)`,
        filter: "blur(80px)",
        animation: "noirPulse 8s ease-in-out infinite",
      }} />

      {/* ── CSS анимации ── */}
      <style>{`
        @keyframes noirLight {
          0%, 100% { opacity: 0.6; transform: scaleX(1); }
          50%       { opacity: 1;   transform: scaleX(1.15); }
        }
        @keyframes noirPulse {
          0%, 100% { opacity: 0.5; }
          50%       { opacity: 1; }
        }
        @keyframes cinemaFlicker {
          0%, 100% { opacity: 1; }
          92%       { opacity: 1; }
          93%       { opacity: 0.85; }
          94%       { opacity: 1; }
          97%       { opacity: 0.92; }
          98%       { opacity: 1; }
        }
        @keyframes breatheGlow {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50%       { transform: scale(1.15); opacity: 1; }
        }
      `}</style>
    </>
  );
}
