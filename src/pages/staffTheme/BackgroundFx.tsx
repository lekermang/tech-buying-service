import { useMemo } from "react";
import { useStaffTheme } from "./StaffThemeContext";

export default function BackgroundFx() {
  const { theme } = useStaffTheme();
  const style = theme.bg_style;

  const items = useMemo(() => {
    const count = 28;
    return Array.from({ length: count }, (_, i) => ({
      i,
      left: Math.random() * 100,
      delay: Math.random() * 10,
      dur: 6 + Math.random() * 10,
      size: 6 + Math.random() * 14,
      drift: (Math.random() - 0.5) * 80,
    }));
  }, [style]);

  if (!theme.enabled || style === "default") return null;

  if (style === "neon-grid") {
    return (
      <div className="fixed inset-0 z-0 pointer-events-none" style={{
        backgroundImage: `linear-gradient(${theme.accent_color}22 1px, transparent 1px), linear-gradient(90deg, ${theme.accent_color}22 1px, transparent 1px)`,
        backgroundSize: "40px 40px",
        maskImage: "radial-gradient(ellipse at center, black 20%, transparent 80%)",
      }} />
    );
  }

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      <style>{`
        @keyframes fxFall { 0% { transform: translate3d(0,-10vh,0) rotate(0deg); opacity: 0 } 10% { opacity: 1 } 90% { opacity: 1 } 100% { transform: translate3d(var(--drift,0px),110vh,0) rotate(360deg); opacity: 0 } }
        @keyframes fxRise { 0% { transform: translate3d(0,110vh,0); opacity: 0 } 10% { opacity: .7 } 100% { transform: translate3d(var(--drift,0px),-10vh,0); opacity: 0 } }
        @keyframes fxTwinkle { 0%,100% { opacity: 0.3; transform: scale(1) } 50% { opacity: 1; transform: scale(1.4) } }
      `}</style>
      {items.map(p => {
        const common: React.CSSProperties = {
          position: "absolute",
          left: `${p.left}%`,
          width: p.size,
          height: p.size,
          // @ts-expect-error CSS var
          "--drift": `${p.drift}px`,
          animationDelay: `${p.delay}s`,
          animationDuration: `${p.dur}s`,
          animationIterationCount: "infinite",
          animationTimingFunction: "linear",
        };

        if (style === "sakura") {
          return <span key={p.i} style={{
            ...common, top: 0,
            animationName: "fxFall",
            background: "#FFB7D5",
            borderRadius: "60% 0 60% 0",
            boxShadow: "0 0 6px #FF8FB5aa",
          }} />;
        }
        if (style === "stars") {
          return <span key={p.i} style={{
            ...common,
            top: `${Math.random() * 100}%`,
            width: 3 + Math.random() * 3,
            height: 3 + Math.random() * 3,
            background: theme.accent_color,
            borderRadius: "50%",
            boxShadow: `0 0 8px ${theme.accent_color}`,
            animationName: "fxTwinkle",
            animationDuration: `${2 + Math.random() * 3}s`,
          }} />;
        }
        if (style === "rain") {
          return <span key={p.i} style={{
            ...common,
            top: 0,
            width: 2,
            height: 18,
            background: "linear-gradient(to bottom, transparent, #7DD3FC)",
            animationName: "fxFall",
            animationDuration: `${1 + Math.random() * 1.5}s`,
            opacity: 0.6,
          }} />;
        }
        if (style === "bubbles") {
          return <span key={p.i} style={{
            ...common,
            bottom: 0,
            top: "auto",
            background: "transparent",
            border: `1px solid ${theme.accent_color}77`,
            borderRadius: "50%",
            animationName: "fxRise",
          }} />;
        }
        return null;
      })}
    </div>
  );
}
