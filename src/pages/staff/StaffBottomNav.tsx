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

export default function StaffBottomNav({ tabs, tab, roleColor, isOwner, unlocked, onRequestTab }: Props) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      {/* Градиент-тень сверху */}
      <div className="absolute -top-8 left-0 right-0 h-8 bg-gradient-to-t from-[#050508]/95 to-transparent pointer-events-none" />

      <div className="relative"
        style={{
          background: "rgba(5,5,8,0.95)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderTop: `1px solid ${roleColor}25`,
          boxShadow: `0 -1px 0 ${roleColor}15, 0 -20px 40px rgba(5,5,8,0.8)`,
        }}>

        <div className="absolute top-0 left-0 right-0 h-[1px] pointer-events-none"
          style={{ background: `linear-gradient(90deg, transparent, ${roleColor}40, transparent)` }} />

        <div className="flex overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {tabs.map(t => {
            const locked = !isOwner && !unlocked[t.k] && (PROTECTED_TABS as readonly string[]).includes(t.k);
            const active = tab === t.k;
            const isHot = ("badge" in t) && typeof t.badge === "number" && t.badge > 0;

            return (
              <SLTooltip key={t.k} placement="top" delay={400} as="flex"
                content={<><b style={{ color: roleColor }}>{t.l}</b>{t.tip && <><br />{t.tip}</>}{locked && <><br /><span className="text-red-300">🔒 Пароль владельца</span></>}</>}>
                <button
                  onClick={() => onRequestTab(t.k)}
                  onMouseEnter={() => prefetchTab(t.k)}
                  onTouchStart={() => prefetchTab(t.k)}
                  aria-label={t.l}
                  aria-current={active ? "page" : undefined}
                  className="relative flex flex-col items-center justify-center gap-1 pt-2.5 pb-2 min-w-[52px] min-h-[60px] transition-all duration-200 active:scale-90 group"
                  style={{ flex: "1 0 52px" }}
                >
                  {active && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-10 rounded-b"
                      style={{
                        background: `linear-gradient(90deg, transparent, ${roleColor}, transparent)`,
                        boxShadow: `0 0 8px ${roleColor}cc, 0 0 20px ${roleColor}66`,
                      }} />
                  )}
                  {active && (
                    <span className="absolute inset-x-1 inset-y-1 rounded-xl pointer-events-none"
                      style={{
                        background: `radial-gradient(ellipse at 50% 0%, ${roleColor}18 0%, transparent 70%)`,
                        border: `1px solid ${roleColor}20`,
                      }} />
                  )}
                  {t.premium && !active && (
                    <span className="absolute inset-x-1 inset-y-1 rounded-xl pointer-events-none"
                      style={{ background: "rgba(255,215,0,0.04)", border: "1px solid rgba(255,215,0,0.10)" }} />
                  )}

                  <div className="relative">
                    <Icon name={t.icon}
                      size={active ? 19 : 17}
                      style={{
                        color: active ? roleColor : t.premium ? "rgba(255,215,0,0.55)" : "rgba(255,255,255,0.35)",
                        filter: active ? `drop-shadow(0 0 6px ${roleColor}aa)` : "none",
                        transition: "all 0.2s",
                      }}
                    />
                    {isHot && (
                      <span className="absolute -top-2 -right-2 min-w-[15px] h-[15px] px-0.5 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
                        style={{ background: "#ef4444", boxShadow: "0 0 8px rgba(239,68,68,0.7)", animation: "pulse 2s infinite" }}>
                        {(t.badge as number) > 99 ? "99+" : t.badge}
                      </span>
                    )}
                    {locked && (
                      <span className="absolute -top-1.5 -right-1.5 text-[8px]">🔒</span>
                    )}
                    {t.premium && !active && (
                      <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full"
                        style={{ background: "#FFD700", boxShadow: "0 0 5px rgba(255,215,0,0.9)" }} />
                    )}
                  </div>

                  <span className="font-roboto leading-none tracking-tight transition-all duration-200"
                    style={{
                      fontSize: "9px",
                      color: active ? roleColor : "rgba(255,255,255,0.3)",
                      fontWeight: active ? 700 : 400,
                      textShadow: active ? `0 0 8px ${roleColor}66` : "none",
                    }}>
                    {t.l}
                  </span>
                </button>
              </SLTooltip>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
