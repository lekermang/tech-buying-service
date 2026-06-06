/**
 * Сплэш-скрин для раздела Ремонт24 — стиль как на главной Скупка24,
 * но с темой сервисного центра: гаечный ключ, микросхемы, сканирование.
 */
import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";

const SPLASH_SYMBOLS = ["⌀", "⚙", "≋", "∿", "⌬", "◈", "⬡", "◉", "⌘", "≡", "⊞", "⌁"];

export default function RepairSplash({ onDone }: { onDone: () => void }) {
  const [hiding, setHiding]     = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage]       = useState(0); // 0=scan 1=brand 2=ready

  useEffect(() => {
    const start    = performance.now();
    const duration = 2200;
    let raf = 0;
    const tick = (now: number) => {
      const t      = Math.min(1, (now - start) / duration);
      const eased  = 1 - Math.pow(1 - t, 2.8);
      setProgress(Math.round(eased * 100));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const t1 = setTimeout(() => setStage(1), 400);
    const t2 = setTimeout(() => setStage(2), 1600);
    const t3 = setTimeout(() => setHiding(true), 2400);
    const t4 = setTimeout(() => onDone(), 2900);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4);
    };
  }, [onDone]);

  const particles = Array.from({ length: 18 }, (_, i) => i);

  return (
    <div
      className={`fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden transition-opacity duration-500 ${hiding ? "opacity-0 pointer-events-none" : "opacity-100"}`}
      style={{ background: "radial-gradient(ellipse at 40% 30%, #1a0e00 0%, #0d0d0d 55%, #000 100%)" }}
    >
      <style>{`
        @keyframes r24-float {
          0%,100% { transform: translateY(0) scale(1); opacity:.4; }
          50%      { transform: translateY(-20px) scale(1.3); opacity:.9; }
        }
        @keyframes r24-rise {
          from { transform: translateY(40px); opacity:0; }
          to   { transform: translateY(0);    opacity:1; }
        }
        @keyframes r24-scanH {
          0%   { top: -2px; }
          100% { top: 100%; }
        }
        @keyframes r24-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes r24-spinR {
          from { transform: rotate(0deg); }
          to   { transform: rotate(-360deg); }
        }
        @keyframes r24-glow {
          0%,100% { opacity:.5; }
          50%     { opacity:1; }
        }
        @keyframes r24-blink {
          0%,100% { opacity:1; }
          50%     { opacity:0; }
        }
        @keyframes r24-in {
          from { opacity:0; transform:translateY(12px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .r24-spin      { animation: r24-spin   7s linear infinite; }
        .r24-spin-slow { animation: r24-spin  20s linear infinite; }
        .r24-spinR     { animation: r24-spinR  7s linear infinite; }
        .r24-glow      { animation: r24-glow 2.5s ease-in-out infinite; }
      `}</style>

      {/* Фоновая сетка */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(255,215,0,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(255,215,0,0.06) 1px,transparent 1px)",
          backgroundSize: "52px 52px",
          maskImage: "radial-gradient(ellipse at center,#000 20%,transparent 78%)",
          WebkitMaskImage: "radial-gradient(ellipse at center,#000 20%,transparent 78%)",
        }} />

      {/* Угловые свечения */}
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none"
        style={{ background: "rgba(255,215,0,0.12)", animation: "r24-glow 4s ease-in-out infinite" }} />
      <div className="absolute -bottom-40 -right-40 w-[450px] h-[450px] rounded-full blur-3xl pointer-events-none"
        style={{ background: "rgba(255,140,0,0.08)", animation: "r24-glow 5s ease-in-out infinite 1s" }} />

      {/* Центральное золотое свечение */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at center,rgba(255,215,0,0.09) 0%,transparent 60%)" }} />

      {/* Угловые рамки */}
      {[["top-4 left-4","border-l-2 border-t-2"],["top-4 right-4","border-r-2 border-t-2"],["bottom-4 left-4","border-l-2 border-b-2"],["bottom-4 right-4","border-r-2 border-b-2"]].map(([pos, brd], i) => (
        <div key={i} className={`absolute w-8 h-8 sm:w-10 sm:h-10 border-[#FFD700]/50 pointer-events-none ${pos} ${brd}`} />
      ))}

      {/* Боковые линии */}
      <div className="absolute left-0 top-0 bottom-0 w-[1.5px] bg-gradient-to-b from-transparent via-[#FFD700]/60 to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-[1.5px] bg-gradient-to-b from-transparent via-[#FFD700]/30 to-transparent pointer-events-none" />

      {/* Горизонтальная сканирующая линия */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute left-0 right-0 h-[1.5px]"
          style={{ background: "linear-gradient(90deg,transparent,rgba(255,215,0,0.7),rgba(255,248,232,0.9),rgba(255,215,0,0.7),transparent)", animation: "r24-scanH 3s linear infinite", boxShadow: "0 0 12px rgba(255,215,0,0.5)" }} />
      </div>

      {/* Плавающие tech-символы */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map(i => (
          <span key={i}
            className="absolute text-[#FFD700] font-mono select-none"
            style={{
              left: `${(i * 23 + 5) % 95}%`,
              bottom: "-20px",
              fontSize: `${8 + (i % 4) * 3}px`,
              opacity: 0.35,
              animation: `r24-float ${5 + (i % 6)}s ease-in-out ${(i * 0.3) % 4}s infinite`,
              animationName: "r24-rise,r24-float",
              animationDuration: `0.6s,${5 + (i % 5)}s`,
              animationDelay: `${i * 0.08}s,${i * 0.3}s`,
              animationFillMode: "both,none",
            }}>
            {SPLASH_SYMBOLS[i % SPLASH_SYMBOLS.length]}
          </span>
        ))}
      </div>

      {/* Центральный контент */}
      <div className="relative flex flex-col items-center gap-6 px-6 z-10">

        {/* Медальон с гаечным ключом */}
        <div className="relative" style={{ animation: "r24-in 0.5s ease both" }}>
          {/* Свечение */}
          <div className="absolute inset-0 -m-6 rounded-full blur-2xl r24-glow pointer-events-none"
            style={{ background: "rgba(255,215,0,0.4)" }} />

          {/* Внешнее орбитальное кольцо */}
          <div className="absolute -inset-4 rounded-full border border-[#FFD700]/20 r24-spin-slow pointer-events-none">
            <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#FFD700]" style={{ boxShadow: "0 0 10px #FFD700" }} />
            <span className="absolute top-1/2 -right-1 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#fff3a0]" style={{ boxShadow: "0 0 8px #FFD700" }} />
          </div>

          {/* Основное кольцо */}
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full p-[2.5px] r24-spin"
            style={{
              background: "conic-gradient(from 0deg,#b8860b,#ffd700,#fff3a0,#ffd700,#d4a017,#b8860b)",
              boxShadow: "0 0 50px rgba(255,215,0,0.5),inset 0 0 20px rgba(255,215,0,0.1)",
            }}>
            <div className="w-full h-full rounded-full r24-spinR flex items-center justify-center"
              style={{ background: "radial-gradient(ellipse at 40% 30%,#1a1400,#0d0d0d)" }}>
              <Icon name="Wrench" size={36} className="text-[#FFD700]"
                style={{ filter: "drop-shadow(0 0 12px rgba(255,215,0,0.8))" }} />
            </div>
          </div>

          {/* Искры */}
          <Icon name="Sparkles" size={14} className="absolute -top-2 -right-2 text-[#FFD700] animate-pulse pointer-events-none" />
          <Icon name="Zap" size={10} className="absolute -bottom-1 -left-2 text-[#fff3a0] animate-pulse pointer-events-none" />
        </div>

        {/* Бренд */}
        <div className="flex flex-col items-center gap-2"
          style={{ animation: stage >= 1 ? "r24-in 0.45s ease both" : "none", opacity: stage >= 1 ? 1 : 0 }}>
          <span className="font-oswald font-black text-3xl sm:text-4xl tracking-[0.28em] uppercase"
            style={{ color: "#FFD700", textShadow: "0 0 20px rgba(255,215,0,0.5),0 0 40px rgba(255,215,0,0.2)" }}>
            Ремонт24
          </span>
          <span className="inline-flex items-center gap-1.5 bg-[#FFD700]/10 border border-[#FFD700]/35 px-3 py-1 rounded-full">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute animate-ping inline-flex h-full w-full rounded-full bg-[#FFD700] opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#FFD700]" />
            </span>
            <span className="font-roboto text-[10px] text-[#FFD700] uppercase tracking-[0.22em] font-semibold">
              Сервисный центр · Калуга
            </span>
          </span>
        </div>

        {/* Слоган */}
        <div className="flex flex-col items-center gap-1 text-center"
          style={{ animation: stage >= 2 ? "r24-in 0.45s ease both" : "none", opacity: stage >= 2 ? 1 : 0 }}>
          <span className="font-oswald font-bold text-2xl sm:text-3xl md:text-4xl uppercase text-white/90 tracking-tight">
            Ремонт любой
          </span>
          <span className="font-oswald font-black text-2xl sm:text-3xl md:text-4xl uppercase tracking-tight"
            style={{ background: "linear-gradient(90deg,#fff3a0,#FFD700,#fff3a0)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            сложности
          </span>
        </div>

        {/* Прогресс-бар */}
        <div className="w-48 sm:w-64 flex flex-col gap-1.5 items-center mt-1">
          <div className="w-full h-[3px] rounded-full overflow-hidden" style={{ background: "rgba(255,215,0,0.12)" }}>
            <div className="h-full rounded-full transition-all duration-100"
              style={{
                width: `${progress}%`,
                background: "linear-gradient(90deg,#b8860b,#ffd700,#fff3a0)",
                boxShadow: "0 0 8px rgba(255,215,0,0.7)",
              }} />
          </div>
          <div className="flex items-center justify-between w-full">
            <span className="font-roboto text-[9px] uppercase tracking-[0.2em] text-[#FFD700]/40">
              {progress < 40 ? "Инициализация..." : progress < 80 ? "Загрузка модулей..." : "Готово"}
            </span>
            <span className="font-mono text-[9px] text-[#FFD700]/50">{progress}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
