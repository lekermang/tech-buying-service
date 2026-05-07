import { useEffect, useRef } from "react";

/** Реалистичные канвас-эффекты для праздников.
 *
 *  Поддерживаемые режимы:
 *   - "fireworks" → салют (для 9 мая, фейерверков, дня народного единства, дня России)
 *   - "snow"      → реалистичные снежинки с глубиной, ветром и блёстками (для НГ)
 *   - "petals"    → лепестки роз/тюльпанов (для 8 марта, 1 мая)
 *   - "stars"     → падающие звёзды-блёстки (для 23 февраля)
 *   - "hearts"    → летящие сердечки (для дней любви)
 *
 *  Производительность:
 *   - requestAnimationFrame с ограничением частиц
 *   - Уважает prefers-reduced-motion
 *   - DPR-aware (Retina)
 *   - z-index 14 (за баннером и углом, но поверх фона)
 *   - pointer-events: none — не мешает кликам
 */

type Mode = "fireworks" | "snow" | "petals" | "stars" | "hearts";

interface Props {
  mode: Mode;
  /** ключ — для ремоунта при смене праздника */
  flavorKey?: string;
  /** базовые цвета частиц (по умолчанию подбираются под режим) */
  colors?: string[];
}

export default function HolidayCanvasFX({ mode, flavorKey, colors }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = 0;
    let H = 0;
    let dpr = 1;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    /* ── Универсальные частицы ─────────────────────────────────── */
    type Particle = {
      x: number; y: number; vx: number; vy: number;
      life: number; maxLife: number; size: number;
      color: string; rot: number; vr: number; type: number;
    };
    const parts: Particle[] = [];

    const palette = colors ?? defaultPalette(mode);
    const rand = (a: number, b: number) => a + Math.random() * (b - a);
    const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

    /* ── FIREWORKS: запуск ракеты + взрыв ──────────────────────── */
    const launchRocket = () => {
      const targetX = rand(W * 0.15, W * 0.85);
      const targetY = rand(H * 0.15, H * 0.45);
      const startX = targetX + rand(-30, 30);
      const startY = H + 10;
      const dx = targetX - startX;
      const dy = targetY - startY;
      const dist = Math.hypot(dx, dy);
      const speed = rand(7, 10);
      parts.push({
        x: startX, y: startY,
        vx: (dx / dist) * speed,
        vy: (dy / dist) * speed,
        life: 0, maxLife: 60,
        size: 2.2, color: pick(palette),
        rot: 0, vr: 0, type: 1, // ракета
      });
    };

    const explode = (x: number, y: number, color: string) => {
      const count = 50 + Math.floor(Math.random() * 30);
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + rand(-0.1, 0.1);
        const speed = rand(2, 5.5);
        parts.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0, maxLife: rand(50, 90),
          size: rand(1.6, 2.6), color,
          rot: 0, vr: 0, type: 2, // частица взрыва
        });
      }
      // Дополнительные искры с другим цветом для красоты
      const sparkColor = pick(palette);
      for (let i = 0; i < 16; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = rand(0.5, 2);
        parts.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0, maxLife: rand(30, 60),
          size: rand(1, 1.8), color: sparkColor,
          rot: 0, vr: 0, type: 2,
        });
      }
    };

    /* ── SNOW ──────────────────────────────────────────────────── */
    const initSnow = () => {
      const count = Math.min(140, Math.floor((W * H) / 9000));
      for (let i = 0; i < count; i++) {
        parts.push({
          x: Math.random() * W,
          y: Math.random() * H,
          vx: rand(-0.3, 0.3),
          vy: rand(0.4, 1.4),
          life: 0, maxLife: Infinity,
          size: rand(0.8, 3.2),
          color: pick(palette),
          rot: Math.random() * Math.PI,
          vr: rand(-0.02, 0.02),
          type: 0,
        });
      }
    };

    /* ── PETALS / HEARTS / STARS ──────────────────────────────── */
    const initFloaters = (icon: number) => {
      const count = Math.min(60, Math.floor((W * H) / 18000));
      for (let i = 0; i < count; i++) {
        parts.push({
          x: Math.random() * W,
          y: Math.random() * H,
          vx: rand(-0.5, 0.5),
          vy: rand(0.5, 1.6),
          life: 0, maxLife: Infinity,
          size: rand(8, 18),
          color: pick(palette),
          rot: Math.random() * Math.PI * 2,
          vr: rand(-0.04, 0.04),
          type: icon, // 10=petal, 11=heart, 12=star
        });
      }
    };

    /* ── Инициализация по режиму ──────────────────────────────── */
    if (mode === "snow") initSnow();
    else if (mode === "petals") initFloaters(10);
    else if (mode === "hearts") initFloaters(11);
    else if (mode === "stars") initFloaters(12);
    else if (mode === "fireworks") {
      // запуски с интервалами
      const schedule = () => {
        const t = setTimeout(() => {
          if (Math.random() < 0.7) launchRocket();
          if (Math.random() < 0.35) launchRocket();
          schedule();
        }, rand(700, 1700));
        timersRef.current.push(t);
      };
      schedule();
      // первые две ракеты сразу для эффекта
      launchRocket();
      setTimeout(launchRocket, 400);
    }

    /* ── Рисование форм ───────────────────────────────────────── */
    const drawSnowflake = (x: number, y: number, size: number, color: string, rot: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.shadowBlur = size * 2;
      ctx.shadowColor = color;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(0, 0, size, 0, Math.PI * 2);
      ctx.fill();
      // 6 лучей
      if (size > 1.6) {
        ctx.strokeStyle = color;
        ctx.lineWidth = size * 0.35;
        ctx.lineCap = "round";
        for (let i = 0; i < 6; i++) {
          const a = (Math.PI * i) / 3;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(a) * size * 2.4, Math.sin(a) * size * 2.4);
          ctx.stroke();
        }
      }
      ctx.restore();
    };

    const drawPetal = (x: number, y: number, size: number, color: string, rot: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.shadowBlur = size * 0.6;
      ctx.shadowColor = color;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(0, 0, size * 0.45, size, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const drawHeart = (x: number, y: number, size: number, color: string, rot: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.shadowBlur = size * 0.8;
      ctx.shadowColor = color;
      ctx.fillStyle = color;
      const s = size / 14;
      ctx.beginPath();
      ctx.moveTo(0, 4 * s);
      ctx.bezierCurveTo(0, -2 * s, -10 * s, -2 * s, -10 * s, 4 * s);
      ctx.bezierCurveTo(-10 * s, 9 * s, 0, 14 * s, 0, 14 * s);
      ctx.bezierCurveTo(0, 14 * s, 10 * s, 9 * s, 10 * s, 4 * s);
      ctx.bezierCurveTo(10 * s, -2 * s, 0, -2 * s, 0, 4 * s);
      ctx.fill();
      ctx.restore();
    };

    const drawStar = (x: number, y: number, size: number, color: string, rot: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.shadowBlur = size;
      ctx.shadowColor = color;
      ctx.fillStyle = color;
      const spikes = 5;
      const outer = size;
      const inner = size * 0.45;
      ctx.beginPath();
      for (let i = 0; i < spikes * 2; i++) {
        const r = i % 2 === 0 ? outer : inner;
        const a = (Math.PI * i) / spikes - Math.PI / 2;
        const px = Math.cos(a) * r;
        const py = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    /* ── Главный цикл ─────────────────────────────────────────── */
    const wind = { x: 0, t: 0 };

    const tick = () => {
      ctx.clearRect(0, 0, W, H);

      // Лёгкая «вуаль» только для салюта — оставляет след
      if (mode === "fireworks") {
        ctx.fillStyle = "rgba(13,13,13,0.18)";
        ctx.fillRect(0, 0, W, H);
      }

      wind.t += 0.005;
      wind.x = Math.sin(wind.t) * 0.3;

      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];

        if (mode === "fireworks") {
          if (p.type === 1) {
            // ракета
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.02;
            p.life++;
            // хвост
            ctx.save();
            ctx.shadowBlur = 12;
            ctx.shadowColor = p.color;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            // искра
            ctx.fillStyle = "rgba(255,255,255,0.5)";
            ctx.beginPath();
            ctx.arc(p.x - p.vx * 0.6, p.y - p.vy * 0.6, p.size * 0.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            if (p.vy >= -0.5 || p.life > p.maxLife) {
              explode(p.x, p.y, p.color);
              parts.splice(i, 1);
            }
          } else {
            // частица взрыва
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.06; // гравитация
            p.vx *= 0.985;
            p.vy *= 0.985;
            p.life++;
            const alpha = Math.max(0, 1 - p.life / p.maxLife);
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.shadowBlur = 10;
            ctx.shadowColor = p.color;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            if (p.life > p.maxLife) parts.splice(i, 1);
          }
        } else if (mode === "snow") {
          p.x += p.vx + wind.x;
          p.y += p.vy;
          p.rot += p.vr;
          if (p.y > H + 10) { p.y = -10; p.x = Math.random() * W; }
          if (p.x < -10) p.x = W + 10;
          if (p.x > W + 10) p.x = -10;
          drawSnowflake(p.x, p.y, p.size, p.color, p.rot);
        } else {
          // floaters: petals/hearts/stars
          p.x += p.vx + wind.x * 1.5;
          p.y += p.vy;
          p.rot += p.vr;
          if (p.y > H + 20) { p.y = -20; p.x = Math.random() * W; }
          if (p.x < -20) p.x = W + 20;
          if (p.x > W + 20) p.x = -20;
          if (p.type === 10) drawPetal(p.x, p.y, p.size, p.color, p.rot);
          else if (p.type === 11) drawHeart(p.x, p.y, p.size, p.color, p.rot);
          else if (p.type === 12) drawStar(p.x, p.y, p.size, p.color, p.rot);
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      timersRef.current.forEach((t) => clearTimeout(t));
      timersRef.current = [];
      window.removeEventListener("resize", resize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, flavorKey]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="fixed inset-0 pointer-events-none select-none"
      style={{ width: "100vw", height: "100vh", zIndex: 14, mixBlendMode: mode === "fireworks" ? "screen" : "normal" }}
    />
  );
}

function defaultPalette(mode: Mode): string[] {
  if (mode === "fireworks") return ["#FFD700", "#FF8C00", "#FF4444", "#FFFFFF", "#FFB347"];
  if (mode === "snow") return ["#ffffff", "#dceeff", "#cfe6ff"];
  if (mode === "petals") return ["#ff6fa3", "#ff9ec0", "#ffd1dc", "#ffb84d", "#ffd700"];
  if (mode === "stars") return ["#FFD700", "#fff3a0", "#ffffff", "#FF8C00"];
  if (mode === "hearts") return ["#ff4d6d", "#ff8095", "#ffd166", "#ff1744"];
  return ["#FFD700"];
}
