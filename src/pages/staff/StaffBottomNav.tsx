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

// ── Отдельная кнопка таба ─────────────────────────────────────────────────
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
    setTimeout(() => setRipple(false), 400);
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
          minHeight: "60px",
          paddingTop: "10px",
          paddingBottom: "8px",
          gap: "5px",
          transform: pressed ? "scale(0.86)" : "scale(1)",
          transition: "transform 0.1s ease",
        }}
      >
        {/* ── Ripple при клике ── */}
        {ripple && (
          <span className="absolute inset-0 rounded-xl pointer-events-none"
            style={{
              background: `radial-gradient(circle, ${roleColor}25 0%, transparent 70%)`,
              animation: "rippleOut 0.4s ease-out forwards",
            }} />
        )}

        {/* ── Активный фон ── */}
        {active && (
          <span className="absolute rounded-2xl pointer-events-none"
            style={{
              inset: "4px 3px 2px 3px",
              background: `radial-gradient(ellipse at 50% 0%, ${roleColor}20 0%, transparent 75%)`,
              border: `1px solid ${roleColor}20`,
            }} />
        )}

        {/* ── Премиум подложка ── */}
        {t.premium && !active && (
          <span className="absolute rounded-xl pointer-events-none"
            style={{
              inset: "4px",
              background: "rgba(255,215,0,0.04)",
              border: "1px solid rgba(255,215,0,0.1)",
            }} />
        )}

        {/* ── Верхний неоновый индикатор ── */}
        {active && (
          <span className="absolute top-0 left-1/2 -translate-x-1/2 rounded-b-full"
            style={{
              width: "36px",
              height: "3px",
              background: `linear-gradient(90deg, transparent, ${roleColor}, transparent)`,
              boxShadow: `0 0 12px ${roleColor}, 0 0 28px ${roleColor}80, 0 2px 8px ${roleColor}60`,
            }} />
        )}

        {/* ── Иконка + бейджи ── */}
        <div className="relative flex items-center justify-center" style={{ width: 24, height: 24 }}>
          <Icon
            name={t.icon}
            size={active ? 22 : 19}
            style={{
              color: active
                ? roleColor
                : t.premium ? "rgba(255,215,0,0.65)" : "rgba(255,255,255,0.38)",
              filter: active
                ? `drop-shadow(0 0 8px ${roleColor}) drop-shadow(0 0 16px ${roleColor}80)`
                : t.premium ? "drop-shadow(0 0 5px rgba(255,215,0,0.5))" : "none",
              transition: "all 0.2s ease",
            }}
          />

          {/* Бейдж */}
          {isHot && (
            <span className="absolute flex items-center justify-center font-bold text-white"
              style={{
                top: "-8px", right: "-9px",
                minWidth: "17px", height: "17px",
                padding: "0 3px", fontSize: "8px", borderRadius: "9px",
                background: "#ef4444",
                boxShadow: "0 0 10px rgba(239,68,68,0.9), 0 0 20px rgba(239,68,68,0.5)",
                animation: "pulse 1.5s infinite",
                lineHeight: 1,
              }}>
              {(t.badge as number) > 99 ? "99+" : t.badge}
            </span>
          )}

          {/* Замок */}
          {locked && (
            <span className="absolute" style={{ top: "-7px", right: "-7px", fontSize: "10px" }}>
              🔒
            </span>
          )}

          {/* Premium точка */}
          {t.premium && !active && (
            <span className="absolute rounded-full"
              style={{
                top: "-2px", right: "-3px",
                width: "7px", height: "7px",
                background: "linear-gradient(135deg, #FFE34D, #FFD700)",
                boxShadow: "0 0 8px rgba(255,215,0,1), 0 0 16px rgba(255,215,0,0.6)",
              }} />
          )}
        </div>

        {/* ── Лейбл ── */}
        <span
          className="font-roboto leading-none select-none tracking-tight"
          style={{
            fontSize: active ? "10px" : "9px",
            fontWeight: active ? 700 : 400,
            color: active ? roleColor : "rgba(255,255,255,0.35)",
            textShadow: active ? `0 0 12px ${roleColor}90` : "none",
            transition: "all 0.18s ease",
          }}
        >
          {t.l}
        </span>
      </button>
    </SLTooltip>
  );
}

// ── Разделитель групп ─────────────────────────────────────────────────────
function Divider({ color }: { color: string }) {
  return (
    <div className="flex items-center justify-center shrink-0 self-stretch py-3" style={{ width: 10 }}>
      <div className="w-px h-6 rounded-full"
        style={{ background: `linear-gradient(180deg, transparent, ${color}30, transparent)` }} />
    </div>
  );
}

export default function StaffBottomNav({ tabs, tab, roleColor, isOwner, unlocked, onRequestTab }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Автоскролл к активному табу
  useEffect(() => {
    if (!scrollRef.current) return;
    const el = scrollRef.current.querySelector<HTMLElement>("[aria-current='page']");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [tab]);

  // Группируем: первые 6 — основные, остальные — дополнительные
  const main = tabs.slice(0, 6);
  const extra = tabs.slice(6);

  return (
    <>
      {/* CSS анимации */}
      <style>{`
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
        <div className="absolute left-0 right-0 pointer-events-none"
          style={{ top: "-40px", height: "40px", background: "linear-gradient(to top, rgba(5,5,8,0.95), transparent)" }} />

        {/* Панель */}
        <div className="relative"
          style={{
            background: "rgba(5,5,8,0.97)",
            backdropFilter: "blur(32px)",
            WebkitBackdropFilter: "blur(32px)",
            borderTop: `1px solid ${roleColor}18`,
          }}>

          {/* Неоновая верхняя линия */}
          <div className="absolute top-0 left-0 right-0 h-px pointer-events-none"
            style={{ background: `linear-gradient(90deg, transparent 0%, ${roleColor}30 20%, ${roleColor}65 50%, ${roleColor}30 80%, transparent 100%)` }} />

          {/* Скролл-контейнер */}
          <div
            ref={scrollRef}
            className="flex overflow-x-auto"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {/* Основная группа */}
            {main.map(t => {
              const locked = !isOwner && !unlocked[t.k] && (PROTECTED_TABS as readonly string[]).includes(t.k);
              const active = tab === t.k;
              const isHot = "badge" in t && typeof t.badge === "number" && t.badge > 0;
              return (
                <NavTab key={t.k} t={t} active={active} locked={locked} isHot={isHot}
                  roleColor={roleColor} onPress={onRequestTab} prefetch={prefetchTab} />
              );
            })}

            {/* Разделитель */}
            {extra.length > 0 && <Divider color={roleColor} />}

            {/* Дополнительная группа */}
            {extra.map(t => {
              const locked = !isOwner && !unlocked[t.k] && (PROTECTED_TABS as readonly string[]).includes(t.k);
              const active = tab === t.k;
              const isHot = "badge" in t && typeof t.badge === "number" && t.badge > 0;
              return (
                <NavTab key={t.k} t={t} active={active} locked={locked} isHot={isHot}
                  roleColor={roleColor} onPress={onRequestTab} prefetch={prefetchTab} />
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}
