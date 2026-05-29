import { useState } from "react";
import Icon from "@/components/ui/icon";

// ─── CSS keyframes (shared between LoginScreen and PinScreen) ─────────────
export const LOGIN_KEYFRAMES = `
  @keyframes scanLine {
    0% { top: -2px; }
    100% { top: 100%; }
  }
  @keyframes glitch1 {
    0%, 90%, 100% { transform: translate(0); opacity: 0; }
    92% { transform: translate(2px, -1px); opacity: 0.8; }
    94% { transform: translate(-1px, 1px); opacity: 0.6; }
    96% { transform: translate(1px, 0); opacity: 0.4; }
  }
  @keyframes glitch2 {
    0%, 93%, 100% { transform: translate(0); opacity: 0; }
    95% { transform: translate(-2px, 1px); opacity: 0.7; }
    97% { transform: translate(1px, -1px); opacity: 0.5; }
  }
  @keyframes floatParticle {
    0%, 100% { transform: translateY(0px) scale(1); opacity: 0.4; }
    50% { transform: translateY(-20px) scale(1.2); opacity: 0.8; }
  }
  @keyframes shimmerBtn {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(200%); }
  }
  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(24px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes borderGlow {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 0.7; }
  }
  @keyframes typewriter {
    from { width: 0; }
    to { width: 100%; }
  }
  @keyframes pinPulse {
    0%, 100% { box-shadow: 0 0 0 0 transparent; }
    50% { box-shadow: 0 0 0 4px rgba(96,165,250,0.15); }
  }
`;

// ─── Animated corner brackets ─────────────────────────────────────────────
export function CornerBrackets({ color = "#FFD700" }: { color?: string }) {
  const s = "absolute w-5 h-5 pointer-events-none";
  const b = `2px solid ${color}`;
  return (
    <>
      <span className={s} style={{ top: 0, left: 0, borderTop: b, borderLeft: b }} />
      <span className={s} style={{ top: 0, right: 0, borderTop: b, borderRight: b }} />
      <span className={s} style={{ bottom: 0, left: 0, borderBottom: b, borderLeft: b }} />
      <span className={s} style={{ bottom: 0, right: 0, borderBottom: b, borderRight: b }} />
    </>
  );
}

// ─── Scanning line animation ──────────────────────────────────────────────
export function ScanLine({ color = "#FFD700" }: { color?: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-2xl">
      <div
        className="absolute left-0 right-0 h-[2px] opacity-20"
        style={{
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
          animation: "scanLine 3s linear infinite",
          top: 0,
        }}
      />
    </div>
  );
}

// ─── Glitch text ──────────────────────────────────────────────────────────
export function GlitchText({ children, color = "#FFD700" }: { children: string; color?: string }) {
  return (
    <span
      className="relative inline-block font-oswald font-black uppercase"
      style={{ color, letterSpacing: "0.1em" }}
      data-text={children}
    >
      {children}
      <span
        className="absolute inset-0 font-oswald font-black uppercase"
        style={{
          color: `${color}cc`,
          clipPath: "inset(30% 0 50% 0)",
          animation: "glitch1 4s infinite",
          left: "2px",
        }}
        aria-hidden
      >{children}</span>
      <span
        className="absolute inset-0 font-oswald font-black uppercase"
        style={{
          color: `${color}88`,
          clipPath: "inset(60% 0 20% 0)",
          animation: "glitch2 4s infinite",
          left: "-2px",
        }}
        aria-hidden
      >{children}</span>
    </span>
  );
}

// ─── Animated background ──────────────────────────────────────────────────
export function TechBackground({ accentColor = "#FFD700" }: { accentColor?: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Базовый фон */}
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 30% 20%, #0a0812 0%, #050508 60%, #000 100%)" }} />

      {/* Hex-сетка */}
      <div className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100'%3E%3Cpath d='M28 66L0 50V18L28 2l28 16v32L28 66zm0-2.31L54 49.2V19.8L28 5.11 2 19.8v29.4L28 63.69z' fill='%23FFD700'/%3E%3C/svg%3E")`,
          backgroundSize: "56px 100px",
        }}
      />

      {/* Сканирующие горизонтальные линии */}
      <div className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,215,0,0.3) 3px, rgba(255,215,0,0.3) 4px)",
          backgroundSize: "100% 4px",
        }}
      />

      {/* Вертикальные тонкие линии */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "repeating-linear-gradient(90deg, transparent, transparent 79px, rgba(255,215,0,0.5) 79px, rgba(255,215,0,0.5) 80px)",
        }}
      />

      {/* Угловые свечения */}
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full blur-[100px]"
        style={{ background: `radial-gradient(circle, ${accentColor}22 0%, transparent 70%)` }} />
      <div className="absolute -bottom-40 -right-40 w-[400px] h-[400px] rounded-full blur-[100px]"
        style={{ background: "radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)" }} />
      <div className="absolute top-1/3 right-0 w-[300px] h-[300px] rounded-full blur-[80px]"
        style={{ background: "radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)" }} />

      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <div key={i}
          className="absolute rounded-full"
          style={{
            width: `${[2, 3, 2, 4, 2, 3][i]}px`,
            height: `${[2, 3, 2, 4, 2, 3][i]}px`,
            background: accentColor,
            left: `${[10, 25, 60, 75, 45, 88][i]}%`,
            top: `${[20, 65, 30, 75, 50, 15][i]}%`,
            boxShadow: `0 0 6px ${accentColor}`,
            animation: `floatParticle ${[4, 6, 5, 7, 4.5, 6.5][i]}s ease-in-out infinite`,
            animationDelay: `${[0, 1, 2, 0.5, 1.5, 2.5][i]}s`,
            opacity: 0.4,
          }}
        />
      ))}
    </div>
  );
}

// ─── Status indicator ─────────────────────────────────────────────────────
export function StatusDot({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
      style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)" }}>
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-400" />
      </span>
      <span className="text-green-400 font-roboto text-[10px] uppercase tracking-widest font-semibold">{label}</span>
    </div>
  );
}

// ─── Input field ──────────────────────────────────────────────────────────
export function TechInput({
  type, value, onChange, onKeyDown, placeholder, icon, label, accentColor = "#FFD700", autoFocus,
}: {
  type: string; value: string; onChange: (v: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  placeholder: string; icon: string; label: string;
  accentColor?: string; autoFocus?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="font-roboto text-[10px] uppercase tracking-[0.15em] font-semibold"
          style={{ color: `${accentColor}70` }}>
          {label}
        </label>
        {focused && (
          <span className="text-[9px] font-roboto uppercase tracking-widest animate-pulse"
            style={{ color: `${accentColor}60` }}>
            ACTIVE
          </span>
        )}
      </div>
      <div className="relative">
        {/* Левая полоска-акцент */}
        <div className="absolute left-0 top-0 bottom-0 w-[2px] rounded-l transition-all duration-300"
          style={{
            background: focused
              ? `linear-gradient(180deg, transparent, ${accentColor}, transparent)`
              : "transparent",
            boxShadow: focused ? `0 0 8px ${accentColor}80` : "none",
          }}
        />
        <Icon name={icon} size={14} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200"
          style={{ color: focused ? accentColor : `${accentColor}40` }} />
        <input
          type={type}
          value={value}
          autoFocus={autoFocus}
          onChange={e => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          inputMode={type === "password" && placeholder === "••••" ? "numeric" : undefined}
          className="w-full pl-10 pr-4 py-3.5 font-roboto text-sm text-white outline-none transition-all duration-200 rounded-xl"
          style={{
            background: focused ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.02)",
            border: focused ? `1px solid ${accentColor}50` : "1px solid rgba(255,255,255,0.07)",
            boxShadow: focused ? `0 0 0 3px ${accentColor}10, inset 0 1px 0 rgba(255,255,255,0.05)` : "none",
          }}
        />
        {/* Правая угловая отметка */}
        {focused && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-mono"
            style={{ color: `${accentColor}50` }}>
            █
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Main login button ────────────────────────────────────────────────────
export function TechButton({
  onClick, disabled, loading, children, accentColor = "#FFD700",
}: {
  onClick: () => void; disabled?: boolean; loading?: boolean;
  children: React.ReactNode; accentColor?: string;
}) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      className="relative w-full overflow-hidden rounded-xl transition-all duration-150 disabled:opacity-40"
      style={{
        background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}cc 50%, ${accentColor}99 100%)`,
        boxShadow: disabled ? "none" : `0 0 20px ${accentColor}40, 0 4px 20px ${accentColor}30, inset 0 1px 0 rgba(255,255,255,0.2)`,
        transform: pressed ? "scale(0.98)" : "scale(1)",
        padding: "14px 20px",
      }}
    >
      {/* Shimmer overlay */}
      <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300"
        style={{
          background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)",
          animation: "shimmerBtn 2s infinite",
        }}
      />
      {/* Top highlight */}
      <div className="absolute inset-x-0 top-0 h-px" style={{ background: "rgba(255,255,255,0.3)" }} />

      <span className="relative flex items-center justify-center gap-2 font-oswald font-bold uppercase tracking-wider text-sm"
        style={{ color: "#000" }}>
        {loading
          ? <><Icon name="Loader" size={16} className="animate-spin" /> <span style={{ letterSpacing: "0.2em" }}>ОБРАБОТКА...</span></>
          : children
        }
      </span>
    </button>
  );
}
