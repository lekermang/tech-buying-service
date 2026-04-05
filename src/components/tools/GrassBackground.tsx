import { useEffect, useRef } from "react";

interface Blade {
  x: number;
  height: number;
  width: number;
  color: string;
  delay: number;
  speed: number;
  sway: number;
  phase: number;
}

export default function GrassBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bladesRef = useRef<Blade[]>([]);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      generateBlades();
    };

    const COLORS = [
      "#4ade80", "#22c55e", "#86efac", "#bbf7d0",
      "#6ee7b7", "#34d399", "#a7f3d0", "#d1fae5",
    ];

    const generateBlades = () => {
      if (!canvas) return;
      const count = Math.floor(canvas.width / 6);
      bladesRef.current = Array.from({ length: count }, (_, i) => ({
        x: (i / count) * canvas.width + Math.random() * 8 - 4,
        height: 30 + Math.random() * 60,
        width: 2 + Math.random() * 3,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        delay: Math.random() * Math.PI * 2,
        speed: 0.6 + Math.random() * 0.8,
        sway: 8 + Math.random() * 18,
        phase: Math.random() * Math.PI * 2,
      }));
    };

    const drawBlade = (blade: Blade, time: number) => {
      if (!ctx || !canvas) return;
      const angle = Math.sin(time * blade.speed + blade.delay + blade.phase) * (blade.sway / blade.height);
      const segments = 6;
      const segH = blade.height / segments;

      ctx.beginPath();
      ctx.lineWidth = blade.width;
      ctx.lineCap = "round";

      // gradient от корня к кончику
      const grad = ctx.createLinearGradient(blade.x, canvas.height, blade.x, canvas.height - blade.height);
      grad.addColorStop(0, blade.color + "cc");
      grad.addColorStop(0.5, blade.color);
      grad.addColorStop(1, blade.color + "55");
      ctx.strokeStyle = grad;

      // Изогнутая трава через кривые Безье
      let px = blade.x;
      let py = canvas.height;
      ctx.moveTo(px, py);

      for (let s = 0; s < segments; s++) {
        const t = (s + 1) / segments;
        const bend = Math.sin(t * Math.PI * 0.5) * angle * blade.height * t;
        const cpx = px + bend * 0.5;
        const cpy = py - segH;
        px = blade.x + bend;
        py = canvas.height - (s + 1) * segH;
        ctx.quadraticCurveTo(cpx, cpy, px, py);
      }

      ctx.stroke();
    };

    const animate = (time: number) => {
      if (!canvas || !ctx) return;
      const t = time * 0.001;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Мягкий градиент земли
      const groundGrad = ctx.createLinearGradient(0, canvas.height - 8, 0, canvas.height);
      groundGrad.addColorStop(0, "rgba(34,197,94,0.15)");
      groundGrad.addColorStop(1, "rgba(21,128,61,0.25)");
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, canvas.height - 8, canvas.width, 8);

      // Сортируем — сначала дальние (короткие)
      const sorted = [...bladesRef.current].sort((a, b) => a.height - b.height);
      sorted.forEach(blade => drawBlade(blade, t));

      frameRef.current = requestAnimationFrame(animate);
    };

    resize();
    window.addEventListener("resize", resize);
    frameRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute bottom-0 left-0 w-full pointer-events-none"
      style={{ height: "110px" }}
    />
  );
}