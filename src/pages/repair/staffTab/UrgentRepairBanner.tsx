import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";

type Props = {
  count: number;
  onClick: () => void;
};

export default function UrgentRepairBanner({ count, onClick }: Props) {
  const [attract, setAttract] = useState(false);

  // Эффект "притягивания" — кнопка каждые 4с дёргается к себе
  useEffect(() => {
    if (count === 0) return;
    const id = setInterval(() => {
      setAttract(true);
      setTimeout(() => setAttract(false), 800);
    }, 4000);
    return () => clearInterval(id);
  }, [count]);

  if (count === 0) return null;

  return (
    <>
      <style>{`
        @keyframes urgentPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.9), 0 0 20px rgba(239,68,68,0.4); }
          50%       { box-shadow: 0 0 0 10px rgba(239,68,68,0), 0 0 40px rgba(239,68,68,0.6); }
        }
        @keyframes urgentGlow {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.55; }
        }
        @keyframes urgentAttract {
          0%   { transform: scale(1) translateY(0); }
          15%  { transform: scale(1.12) translateY(-4px); }
          30%  { transform: scale(0.96) translateY(1px); }
          45%  { transform: scale(1.06) translateY(-2px); }
          60%  { transform: scale(0.99) translateY(0px); }
          100% { transform: scale(1) translateY(0); }
        }
        @keyframes urgentBlink {
          0%, 90%, 100% { opacity: 1; }
          95%            { opacity: 0.3; }
        }
      `}</style>

      <div
        className="fixed left-0 right-0 z-[49] flex items-center justify-center pointer-events-none"
        style={{ bottom: "calc(72px + env(safe-area-inset-bottom, 0px) + 8px)" }}
      >
        <button
          onClick={onClick}
          className="pointer-events-auto relative flex items-center gap-2.5 font-oswald font-black uppercase tracking-widest select-none overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #dc2626 0%, #ef4444 40%, #ff5555 60%, #dc2626 100%)",
            borderRadius: "100px",
            padding: "10px 22px 10px 16px",
            fontSize: "15px",
            color: "#fff",
            letterSpacing: "0.1em",
            border: "1.5px solid rgba(255,120,120,0.6)",
            animation: attract
              ? "urgentAttract 0.8s cubic-bezier(0.36,0.07,0.19,0.97)"
              : "urgentPulse 1.8s ease-in-out infinite",
            boxShadow: "0 0 0 0 rgba(239,68,68,0.9), 0 0 20px rgba(239,68,68,0.4)",
          }}
        >
          {/* Блик */}
          <span
            className="absolute inset-x-0 top-0 pointer-events-none"
            style={{
              height: "45%",
              background: "linear-gradient(180deg, rgba(255,255,255,0.25) 0%, transparent 100%)",
              borderRadius: "100px 100px 0 0",
            }}
          />

          {/* Мигающая иконка */}
          <span style={{ animation: "urgentGlow 0.9s ease-in-out infinite", display: "flex", alignItems: "center" }}>
            <Icon name="AlertTriangle" size={18} />
          </span>

          {/* Текст */}
          <span style={{ animation: "urgentBlink 3s ease-in-out infinite" }}>
            СРОЧНО
          </span>

          {/* Счётчик */}
          <span
            className="flex items-center justify-center font-black"
            style={{
              background: "rgba(0,0,0,0.35)",
              borderRadius: "100px",
              minWidth: "24px",
              height: "24px",
              fontSize: "13px",
              padding: "0 6px",
              border: "1px solid rgba(255,255,255,0.25)",
            }}
          >
            {count}
          </span>

          {/* Стрела — "нажми меня" */}
          <span style={{ opacity: 0.75, marginLeft: "-2px" }}>
            <Icon name="ChevronUp" size={15} />
          </span>
        </button>
      </div>
    </>
  );
}
