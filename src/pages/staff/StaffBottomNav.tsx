import { useState } from "react";
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

function NavTab({
  t, active, locked, isHot, roleColor, onRequestTab, prefetch,
}: {
  t: TabDef; active: boolean; locked: boolean; isHot: boolean;
  roleColor: string; onRequestTab: (k: StaffTab) => void; prefetch: (k: string) => void;
}) {
  const [pressed, setPressed] = useState(false);

  return (
    <SLTooltip
      placement="top"
      delay={600}
      as="flex"
      content={
        <>
          <b style={{ color: roleColor }}>{t.l}</b>
          {t.tip && <><br />{t.tip}</>}
          {locked && <><br /><span className="text-red-300">🔒 Пароль владельца</span></>}
        </>
      }
    >
      <button
        onClick={() => onRequestTab(t.k)}
        onMouseEnter={() => prefetch(t.k)}
        onTouchStart={() => prefetch(t.k)}
        onPointerDown={() => setPressed(true)}
        onPointerUp={() => setPressed(false)}
        onPointerLeave={() => setPressed(false)}
        aria-label={t.l}
        aria-current={active ? "page" : undefined}
        className="relative flex flex-col items-center justify-center"
        style={{
          flex: "1 0 52px",
          minWidth: "48px",
          minHeight: "58px",
          paddingTop: "10px",
          paddingBottom: "8px",
          gap: "5px",
          transition: "transform 0.12s ease",
          transform: pressed ? "scale(0.88)" : "scale(1)",
        }}
      >
        {/* Активный индикатор — неоновая линия сверху */}
        {active && (
          <span
            className="absolute top-0 left-1/2 -translate-x-1/2 rounded-b-full"
            style={{
              width: "32px",
              height: "3px",
              background: `linear-gradient(90deg, transparent, ${roleColor}, transparent)`,
              boxShadow: `0 0 10px ${roleColor}ee, 0 0 24px ${roleColor}66`,
            }}
          />
        )}

        {/* Активный фон — радиальный градиент */}
        {active && (
          <span
            className="absolute rounded-2xl pointer-events-none"
            style={{
              inset: "4px 4px 2px 4px",
              background: `radial-gradient(ellipse at 50% 0%, ${roleColor}22 0%, transparent 75%)`,
              border: `1px solid ${roleColor}22`,
            }}
          />
        )}

        {/* Premium-подложка */}
        {t.premium && !active && (
          <span
            className="absolute rounded-xl pointer-events-none"
            style={{
              inset: "4px",
              background: "rgba(255,215,0,0.05)",
              border: "1px solid rgba(255,215,0,0.12)",
            }}
          />
        )}

        {/* Иконка + бейджи */}
        <div className="relative flex items-center justify-center" style={{ width: 22, height: 22 }}>
          <Icon
            name={t.icon}
            size={active ? 21 : 18}
            style={{
              color: active
                ? roleColor
                : t.premium
                  ? "rgba(255,215,0,0.6)"
                  : "rgba(255,255,255,0.38)",
              filter: active ? `drop-shadow(0 0 7px ${roleColor}cc)` : "none",
              transition: "all 0.18s ease",
            }}
          />

          {/* Бейдж непрочитанных */}
          {isHot && (
            <span
              className="absolute flex items-center justify-center font-bold text-white"
              style={{
                top: "-7px",
                right: "-8px",
                minWidth: "16px",
                height: "16px",
                padding: "0 3px",
                fontSize: "8px",
                borderRadius: "8px",
                background: "#ef4444",
                boxShadow: "0 0 8px rgba(239,68,68,0.8)",
                animation: "pulse 2s infinite",
                lineHeight: 1,
              }}
            >
              {(t.badge as number) > 99 ? "99+" : t.badge}
            </span>
          )}

          {/* Замок */}
          {locked && (
            <span
              className="absolute"
              style={{ top: "-6px", right: "-7px", fontSize: "9px", lineHeight: 1 }}
            >
              🔒
            </span>
          )}

          {/* Premium точка */}
          {t.premium && !active && (
            <span
              className="absolute rounded-full"
              style={{
                top: "-2px",
                right: "-3px",
                width: "6px",
                height: "6px",
                background: "#FFD700",
                boxShadow: "0 0 6px rgba(255,215,0,1)",
              }}
            />
          )}
        </div>

        {/* Лейбл */}
        <span
          className="font-roboto leading-none select-none"
          style={{
            fontSize: active ? "10px" : "9px",
            fontWeight: active ? 700 : 400,
            color: active ? roleColor : "rgba(255,255,255,0.32)",
            textShadow: active ? `0 0 10px ${roleColor}80` : "none",
            letterSpacing: active ? "0.02em" : "0",
            transition: "all 0.18s ease",
          }}
        >
          {t.l}
        </span>
      </button>
    </SLTooltip>
  );
}

export default function StaffBottomNav({ tabs, tab, roleColor, isOwner, unlocked, onRequestTab }: Props) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      {/* Размытый fade сверху */}
      <div
        className="absolute left-0 right-0 pointer-events-none"
        style={{
          top: "-32px",
          height: "32px",
          background: "linear-gradient(to top, rgba(5,5,8,0.92), transparent)",
        }}
      />

      {/* Основная панель */}
      <div
        className="relative"
        style={{
          background: "rgba(5,5,8,0.96)",
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
          borderTop: `1px solid ${roleColor}22`,
          boxShadow: `0 -1px 0 ${roleColor}12, 0 -28px 48px rgba(5,5,8,0.85)`,
        }}
      >
        {/* Неоновая полоска по верхней границе */}
        <div
          className="absolute top-0 left-0 right-0 h-px pointer-events-none"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${roleColor}35 25%, ${roleColor}60 50%, ${roleColor}35 75%, transparent 100%)`,
          }}
        />

        {/* Скролл-контейнер */}
        <div
          className="flex overflow-x-auto"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {tabs.map(t => {
            const locked = !isOwner && !unlocked[t.k] && (PROTECTED_TABS as readonly string[]).includes(t.k);
            const active = tab === t.k;
            const isHot = "badge" in t && typeof t.badge === "number" && t.badge > 0;

            return (
              <NavTab
                key={t.k}
                t={t}
                active={active}
                locked={locked}
                isHot={isHot}
                roleColor={roleColor}
                onRequestTab={onRequestTab}
                prefetch={prefetchTab}
              />
            );
          })}
        </div>
      </div>
    </nav>
  );
}
