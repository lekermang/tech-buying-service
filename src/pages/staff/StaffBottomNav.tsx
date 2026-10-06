import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { PROTECTED_TABS, type StaffTab } from "./staffConstants";
import { prefetchTab } from "./StaffLazy";

type TabDef = {
  k: StaffTab;
  l: string;
  icon: string;
  badge?: number;
  tip?: string;
  premium?: boolean;
  hot?: boolean;        // горящая вкладка — мигает красным (для заявок)
};

type Props = {
  tabs: TabDef[];
  drawerTabs?: TabDef[];
  tab: StaffTab;
  roleColor: string;
  isOwner: boolean;
  unlocked: Record<string, boolean>;
  onRequestTab: (t: StaffTab) => void;
};

// ── Кнопка таба — стиль Сбербанка ──────────────────────────────────────
function NavTab({
  t, active, locked, isHot, onPress, prefetch,
}: {
  t: TabDef; active: boolean; locked: boolean; isHot: boolean;
  roleColor?: string; onPress: (k: StaffTab) => void; prefetch: (k: string) => void;
}) {
  return (
    <button
      onClick={() => onPress(t.k)}
      onMouseEnter={() => prefetch(t.k)}
      onTouchStart={() => prefetch(t.k)}
      aria-label={t.l}
      aria-current={active ? "page" : undefined}
      className="relative flex flex-col items-center justify-center active:scale-90 transition-transform"
      style={{ flex: "1 0 60px", minWidth: "56px", minHeight: "62px", gap: "4px", paddingTop: 8, paddingBottom: 6 }}
    >
      <div className={`relative sber-nav-pill${active ? " active" : ""}`}>
        <Icon
          name={t.icon}
          size={24}
          style={{ color: active ? "var(--sber-green-2)" : t.hot ? "#ef4444" : "rgba(255,255,255,0.4)" }}
        />
        {isHot && (
          <span className="absolute flex items-center justify-center font-bold text-white" style={{
            top: "-6px", right: "-8px", minWidth: 17, height: 17, padding: "0 4px",
            fontSize: 10, borderRadius: 9, background: "#f97316", lineHeight: 1,
          }}>
            {(t.badge as number) > 99 ? "99+" : t.badge}
          </span>
        )}
        {locked && <span className="absolute" style={{ top: "-6px", right: "-6px", fontSize: 10 }}>🔒</span>}
      </div>
      <span className="leading-none select-none" style={{
        fontSize: 11, fontWeight: active ? 700 : 500,
        color: active ? "var(--sber-green-2)" : "rgba(255,255,255,0.45)",
      }}>
        {t.l}
      </span>
    </button>
  );
}

// ── Drawer — всплывающий список вкладок для owner ─────────────────────────
function DrawerMenu({
  tabs, tab, isOwner, unlocked, onSelect, onClose,
}: {
  tabs: TabDef[]; tab: StaffTab;
  isOwner: boolean; unlocked: Record<string, boolean>;
  onSelect: (k: StaffTab) => void; onClose: () => void;
}) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60]"
        style={{ background: "rgba(0,0,0,0.6)" }}
        onClick={onClose}
      />
      <div
        className="fixed left-0 right-0 z-[61]"
        style={{
          bottom: "calc(72px + env(safe-area-inset-bottom, 0px))",
          background: "var(--sber-card)",
          borderRadius: "28px 28px 0 0",
          padding: "14px 12px 12px",
          animation: "drawerUp 0.22s cubic-bezier(0.22,1,0.36,1) forwards",
        }}
      >
        <div className="flex justify-center mb-3">
          <div className="w-10 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.2)" }} />
        </div>
        <div className="text-[18px] font-extrabold mb-3 px-2 text-white">Ещё разделы</div>
        <div className="grid grid-cols-4 gap-2">
          {tabs.map(t => {
            const locked = PROTECTED_TABS.includes(t.k) && !isOwner && !unlocked[t.k];
            const active = tab === t.k;
            return (
              <button
                key={t.k}
                onClick={() => { onSelect(t.k); onClose(); }}
                onMouseEnter={() => prefetchTab(t.k)}
                className="relative flex flex-col items-center justify-center gap-1.5 py-3 px-1 active:scale-90 transition-transform"
                style={{ background: active ? "rgba(47,194,75,0.16)" : "linear-gradient(180deg,#2c2c2c,#222)", borderRadius: 20, boxShadow: active ? "inset 0 0 0 1.5px var(--sber-green-2)" : "inset 0 1px 0 rgba(255,255,255,0.07)" }}
              >
                <div className="relative">
                  <Icon name={t.icon} size={22} style={{ color: active ? "var(--sber-green-2)" : "#fff" }} />
                  {locked && <span className="absolute -top-1.5 -right-1.5 text-[9px]">🔒</span>}
                  {t.badge && t.badge > 0 ? (
                    <span className="absolute -top-2 -right-3 flex items-center justify-center text-white"
                      style={{ minWidth: 16, height: 16, fontSize: 9, borderRadius: 9, padding: "0 3px", background: "#f97316" }}>
                      {t.badge > 99 ? "99+" : t.badge}
                    </span>
                  ) : null}
                </div>
                <span className="text-[11px] leading-tight text-center select-none"
                  style={{ color: active ? "var(--sber-green-2)" : "rgba(255,255,255,0.8)", fontWeight: active ? 700 : 500 }}>
                  {t.l}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

export default function StaffBottomNav({ tabs, drawerTabs = [], tab, isOwner, unlocked, onRequestTab }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Закрыть drawer при смене вкладки
  useEffect(() => { setDrawerOpen(false); }, [tab]);

  // Активна ли одна из вкладок в drawer
  const drawerHasActive = drawerTabs.some(t => t.k === tab);
  const drawerHasBadge = drawerTabs.some(t => t.badge && t.badge > 0);

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
        @keyframes drawerUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes hotGlow {
          from { opacity: 0.5; }
          to   { opacity: 1; }
        }
        @keyframes hotIconPulse {
          from { filter: drop-shadow(0 0 4px rgba(239,68,68,0.6)); }
          to   { filter: drop-shadow(0 0 10px rgba(239,68,68,1)) drop-shadow(0 0 20px rgba(239,68,68,0.5)); }
        }
      `}</style>

      {/* Drawer (owner only) */}
      {drawerOpen && drawerTabs.length > 0 && (
        <DrawerMenu
          tabs={drawerTabs}
          tab={tab}
          isOwner={isOwner}
          unlocked={unlocked}
          onSelect={onRequestTab}
          onClose={() => setDrawerOpen(false)}
        />
      )}

      <nav
        className="fixed bottom-0 left-0 right-0 z-50"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="relative" style={{
          background: "#1a1a1a",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}>
          <div
            ref={scrollRef}
            className="flex overflow-x-auto sber-no-scrollbar"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {/* Основные табы */}
            {tabs.map((t) => {
              const locked = PROTECTED_TABS.includes(t.k) && !isOwner && !unlocked[t.k];
              const isHot = Boolean(t.badge && t.badge > 0);
              return (
                <NavTab key={t.k} t={t} active={tab === t.k} locked={locked}
                  isHot={isHot} onPress={onRequestTab} prefetch={prefetchTab} />
              );
            })}

            {drawerTabs.length > 0 && (
              <button
                onClick={() => setDrawerOpen(v => !v)}
                className="relative flex flex-col items-center justify-center active:scale-90 transition-transform"
                style={{ flex: "1 0 60px", minWidth: "56px", minHeight: "62px", gap: 4, paddingTop: 8, paddingBottom: 6 }}
                aria-label="Ещё разделы"
              >
                <div className="relative flex items-center justify-center" style={{ width: 28, height: 28 }}>
                  <Icon
                    name={drawerOpen ? "X" : "MoreHorizontal"}
                    size={24}
                    style={{ color: (drawerHasActive || drawerOpen) ? "var(--sber-green-2)" : "rgba(255,255,255,0.4)" }}
                  />
                  {drawerHasBadge && !drawerOpen && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full" style={{ background: "#f97316" }} />
                  )}
                </div>
                <span className="leading-none select-none" style={{
                  fontSize: 11, fontWeight: (drawerHasActive || drawerOpen) ? 700 : 500,
                  color: (drawerHasActive || drawerOpen) ? "var(--sber-green-2)" : "rgba(255,255,255,0.45)",
                }}>
                  {drawerOpen ? "Закрыть" : "Ещё"}
                </span>
              </button>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}