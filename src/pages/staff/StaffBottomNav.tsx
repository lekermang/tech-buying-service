import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { PROTECTED_TABS, type StaffTab } from "./staffConstants";
import { prefetchTab } from "./StaffLazy";
import { SLTooltip } from "../slShop/slUI";

type TabDef = {
  k: StaffTab;
  l: string;
  icon: string;
  badge?: number;
  tip?: string;
  premium?: boolean;
};

type Props = {
  tabs: TabDef[];
  tab: StaffTab;
  roleColor: string;
  isOwner: boolean;
  unlocked: Record<string, boolean>;
  onRequestTab: (t: StaffTab) => void;
};

// ── Кнопка таба — Dark Cinema стиль ──────────────────────────────────────
function NavTab({
  t, active, locked, isHot, roleColor, onPress, prefetch,
}: {
  t: TabDef; active: boolean; locked: boolean; isHot: boolean;
  roleColor: string; onPress: (k: StaffTab) => void; prefetch: (k: string) => void;
}) {
  const [pressed, setPressed] = useState(false);
  const [ripple, setRipple] = useState(false);

  const handleClick = () => {
    setRipple(true);
    setTimeout(() => setRipple(false), 500);
    onPress(t.k);
  };

  return (
    <SLTooltip
      placement="top"
      delay={600}
      as="flex"
      content={
        <>
          <b style={{ color: roleColor }}>{t.l}</b>
          {t.tip && <><br /><span style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px" }}>{t.tip}</span></>}
          {locked && <><br /><span className="text-red-300">🔒 Только для владельца</span></>}
        </>
      }
    >
      <button
        onClick={handleClick}
        onMouseEnter={() => prefetch(t.k)}
        onTouchStart={() => prefetch(t.k)}
        onPointerDown={() => setPressed(true)}
        onPointerUp={() => setPressed(false)}
        onPointerLeave={() => setPressed(false)}
        aria-label={t.l}
        aria-current={active ? "page" : undefined}
        className="relative flex flex-col items-center justify-center overflow-hidden"
        style={{
          flex: "1 0 52px",
          minWidth: "48px",
          minHeight: "62px",
          paddingTop: "10px",
          paddingBottom: "8px",
          gap: "5px",
          transform: pressed ? "scale(0.84) translateY(1px)" : "scale(1) translateY(0)",
          transition: "transform 0.12s cubic-bezier(0.23, 1, 0.32, 1)",
        }}
      >
        {/* ── Ripple ── */}
        {ripple && (
          <span className="absolute inset-0 pointer-events-none" style={{
            background: `radial-gradient(circle at 50% 60%, ${roleColor}30 0%, transparent 65%)`,
            animation: "noirRipple 0.5s ease-out forwards",
            borderRadius: "inherit",
          }} />
        )}

        {/* ── Активный фон — кинематографическое свечение снизу ── */}
        {active && (
          <>
            <span className="absolute pointer-events-none" style={{
              inset: "3px 2px 0px 2px",
              background: `radial-gradient(ellipse at 50% 100%, ${roleColor}22 0%, transparent 70%)`,
              borderRadius: "10px",
            }} />
            <span className="absolute pointer-events-none" style={{
              inset: "3px 2px 0px 2px",
              border: `1px solid ${roleColor}18`,
              borderRadius: "10px",
              background: `linear-gradient(180deg, ${roleColor}08 0%, transparent 60%)`,
            }} />
          </>
        )}

        {/* ── Premium подложка ── */}
        {t.premium && !active && (
          <span className="absolute pointer-events-none" style={{
            inset: "4px",
            background: "linear-gradient(135deg, rgba(255,215,0,0.05), rgba(255,215,0,0.02))",
            border: "1px solid rgba(255,215,0,0.08)",
            borderRadius: "8px",
          }} />
        )}

        {/* ── Верхний световой индикатор — как прожектор сверху ── */}
        {active && (
          <span className="absolute top-0 left-1/2 -translate-x-1/2" style={{
            width: "40px",
            height: "3px",
            borderRadius: "0 0 4px 4px",
            background: `linear-gradient(90deg, transparent, ${roleColor}dd, #fff8e8, ${roleColor}dd, transparent)`,
            boxShadow: `0 0 16px ${roleColor}, 0 0 32px ${roleColor}80, 0 0 64px ${roleColor}30`,
          }} />
        )}

        {/* ── Иконка ── */}
        <div className="relative flex items-center justify-center" style={{ width: 24, height: 24 }}>
          <Icon
            name={t.icon}
            size={active ? 22 : 19}
            style={{
              color: active
                ? roleColor
                : t.premium
                  ? "rgba(255,215,0,0.6)"
                  : "rgba(255,255,255,0.32)",
              filter: active
                ? `drop-shadow(0 0 6px ${roleColor}) drop-shadow(0 0 18px ${roleColor}70)`
                : t.premium
                  ? "drop-shadow(0 0 4px rgba(255,215,0,0.4))"
                  : "none",
              transition: "all 0.2s cubic-bezier(0.23, 1, 0.32, 1)",
            }}
          />

          {/* Бейдж */}
          {isHot && (
            <span className="absolute flex items-center justify-center font-bold text-white" style={{
              top: "-8px", right: "-9px",
              minWidth: "17px", height: "17px",
              padding: "0 3px", fontSize: "8px", borderRadius: "9px",
              background: "linear-gradient(135deg, #ff5555, #ef4444)",
              boxShadow: "0 0 10px rgba(239,68,68,0.9), 0 0 20px rgba(239,68,68,0.4)",
              animation: "pulse 1.5s infinite",
              lineHeight: 1,
            }}>
              {(t.badge as number) > 99 ? "99+" : t.badge}
            </span>
          )}

          {/* Замок */}
          {locked && (
            <span className="absolute" style={{ top: "-7px", right: "-7px", fontSize: "10px" }}>🔒</span>
          )}

          {/* Premium точка */}
          {t.premium && !active && (
            <span className="absolute rounded-full" style={{
              top: "-2px", right: "-3px",
              width: "7px", height: "7px",
              background: "linear-gradient(135deg, #FFE34D, #FFD700)",
              boxShadow: "0 0 8px rgba(255,215,0,1), 0 0 16px rgba(255,215,0,0.6)",
            }} />
          )}
        </div>

        {/* ── Лейбл ── */}
        <span
          className="font-roboto leading-none select-none"
          style={{
            fontSize: active ? "10px" : "9px",
            fontWeight: active ? 700 : 400,
            letterSpacing: active ? "0.04em" : "0.01em",
            color: active ? roleColor : "rgba(255,255,255,0.3)",
            textShadow: active ? `0 0 10px ${roleColor}90, 0 0 20px ${roleColor}40` : "none",
            transition: "all 0.2s cubic-bezier(0.23, 1, 0.32, 1)",
          }}
        >
          {t.l}
        </span>
      </button>
    </SLTooltip>
  );
}

// ── Разделитель ───────────────────────────────────────────────────────────
function Divider({ color }: { color: string }) {
  return (
    <div className="flex items-center justify-center shrink-0 self-stretch py-3" style={{ width: 10 }}>
      <div className="w-px h-7 rounded-full" style={{
        background: `linear-gradient(180deg, transparent, ${color}25, rgba(255,200,50,0.15), ${color}25, transparent)`,
      }} />
    </div>
  );
}

export default function StaffBottomNav({ tabs, tab, roleColor, isOwner, unlocked, onRequestTab }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollRef.current) return;
    const el = scrollRef.current.querySelector<HTMLElement>("[aria-current='page']");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [tab]);

  const main = tabs.slice(0, 6);
  const extra = tabs.slice(6);

  return (
    <>
      <style>{`
        @keyframes noirRipple {
          from { opacity: 0.8; transform: scale(0.6); }
          to   { opacity: 0;   transform: scale(2); }
        }
        @keyframes rippleOut {
          from { opacity: 0.6; transform: scale(0.7); }
          to   { opacity: 0;   transform: scale(1.8); }
        }
      `}</style>

      <nav
        className="fixed bottom-0 left-0 right-0 z-50"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {/* Fade сверху */}
        <div className="absolute left-0 right-0 pointer-events-none" style={{
          top: "-50px", height: "50px",
          background: "linear-gradient(to top, rgba(5,4,3,0.98), rgba(5,4,3,0.7), transparent)",
        }} />

        {/* 3D пластина */}
        <div className="relative" style={{
          background: `
            linear-gradient(180deg,
              rgba(18,14,8,0.97) 0%,
              rgba(10,8,5,0.99) 100%
            )
          `,
          backdropFilter: "blur(40px)",
          WebkitBackdropFilter: "blur(40px)",
          borderTop: `1px solid ${roleColor}20`,
          boxShadow: `
            0 -1px 0 rgba(255,255,255,0.04) inset,
            0 -20px 60px rgba(0,0,0,0.8),
            0 -4px 20px rgba(0,0,0,0.6)
          `,
        }}>

          {/* Верхняя золотая линия */}
          <div className="absolute top-0 left-0 right-0 pointer-events-none" style={{
            height: "2px",
            background: `linear-gradient(90deg,
              transparent 0%,
              ${roleColor}25 10%,
              ${roleColor}80 35%,
              #fff8e8cc 50%,
              ${roleColor}80 65%,
              ${roleColor}25 90%,
              transparent 100%
            )`,
            boxShadow: `0 0 20px ${roleColor}50, 0 0 40px ${roleColor}20`,
          }} />

          {/* Тонкий градиент сверху — глубина */}
          <div className="absolute top-0 left-0 right-0 h-12 pointer-events-none" style={{
            background: `radial-gradient(ellipse at 50% 0%, ${roleColor}08 0%, transparent 70%)`,
          }} />

          {/* Скролл-контейнер */}
          <div
            ref={scrollRef}
            className="flex overflow-x-auto scrollbar-none"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {/* Основные табы */}
            {main.map((t) => {
              const locked = PROTECTED_TABS.includes(t.k) && !isOwner && !unlocked[t.k];
              const isHot = Boolean(t.badge && t.badge > 0);
              return (
                <NavTab key={t.k} t={t} active={tab === t.k} locked={locked}
                  isHot={isHot} roleColor={roleColor} onPress={onRequestTab} prefetch={prefetchTab} />
              );
            })}

            {/* Разделитель */}
            {extra.length > 0 && <Divider color={roleColor} />}

            {/* Дополнительные табы */}
            {extra.map((t) => {
              const locked = PROTECTED_TABS.includes(t.k) && !isOwner && !unlocked[t.k];
              const isHot = Boolean(t.badge && t.badge > 0);
              return (
                <NavTab key={t.k} t={t} active={tab === t.k} locked={locked}
                  isHot={isHot} roleColor={roleColor} onPress={onRequestTab} prefetch={prefetchTab} />
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}
