import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import InstallPwaButton from "./InstallPwaButton";
import HolidayShowAgainButton from "@/components/holidays/HolidayShowAgainButton";
import { ROLE_LABEL } from "./staffConstants";
import { MskClock } from "./StaffPwa";
import { SLTooltip } from "../slShop/slUI";
import AppSettingsMenu from "@/components/AppSettingsMenu";

type Props = {
  empName: string;
  empRole: string;
  myName: string | null;
  myAvatar: string | null;
  initials: string;
  roleColor: string;
  isMobile: boolean;
  isOwnerOrAdmin: boolean;
  sending: boolean;
  sendResult: null | boolean;
  sendReminderNow: () => void;
  onOpenProfile: () => void;
  onOpenTheme: () => void;
  logout: () => void;
};

// ── Живые HH:MM:SS часы ───────────────────────────────────────────────────
function LiveClock({ color }: { color: string }) {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <span className="font-mono tabular-nums" style={{ color, letterSpacing: "0.05em" }}>
      {pad(time.getHours())}
      <span style={{ opacity: time.getSeconds() % 2 === 0 ? 1 : 0.3, transition: "opacity 0.15s" }}>:</span>
      {pad(time.getMinutes())}
      <span style={{ opacity: time.getSeconds() % 2 === 0 ? 1 : 0.3, transition: "opacity 0.15s" }}>:</span>
      <span style={{ color: `${color}80`, fontSize: "0.85em" }}>{pad(time.getSeconds())}</span>
    </span>
  );
}

// ── Пульсирующий статус-бейдж роли ────────────────────────────────────────
function RoleBadge({ role, color }: { role: string; color: string }) {
  const emoji = role === "owner" ? "👑" : role === "admin" ? "⚡" : "●";
  return (
    <span
      className="inline-flex items-center gap-1 font-roboto font-semibold rounded-md"
      style={{
        fontSize: "9px",
        padding: "2px 7px",
        background: `${color}15`,
        border: `1px solid ${color}35`,
        color,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
      }}
    >
      <span>{emoji}</span>
      {ROLE_LABEL[role] || role}
    </span>
  );
}

// ── Иконка-кнопка в шапке ─────────────────────────────────────────────────
function HeaderBtn({
  icon, tooltip, onClick, color, activeColor, size = 15,
}: {
  icon: string; tooltip: React.ReactNode; onClick?: () => void;
  color?: string; activeColor?: string; size?: number;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <SLTooltip content={tooltip} placement="bottom">
      <button
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="relative flex items-center justify-center rounded-xl transition-all duration-150 active:scale-90"
        style={{
          width: 36, height: 36,
          background: hovered ? (activeColor ? `${activeColor}18` : "rgba(255,255,255,0.07)") : "transparent",
          color: hovered ? (activeColor || "rgba(255,255,255,0.8)") : (color || "rgba(255,255,255,0.3)"),
        }}
      >
        <Icon name={icon} size={size} />
      </button>
    </SLTooltip>
  );
}

export default function StaffHeader({
  empName, empRole, myName, myAvatar, initials, roleColor,
  isMobile, isOwnerOrAdmin, sending, sendResult,
  sendReminderNow, onOpenProfile, onOpenTheme, logout,
}: Props) {
  const [avatarHovered, setAvatarHovered] = useState(false);

  return (
    <header className="relative shrink-0 safe-top z-10">

      {/* ── Стеклянный фон ── */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          background: "linear-gradient(180deg, rgba(5,5,8,0.98) 0%, rgba(5,5,8,0.88) 100%)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
        }}
      />

      {/* ── Топ неоновая полоска ── */}
      <div className="absolute top-0 left-0 right-0 pointer-events-none z-10"
        style={{ height: "2px", background: `linear-gradient(90deg, transparent 0%, ${roleColor}88 20%, ${roleColor} 50%, ${roleColor}88 80%, transparent 100%)`, boxShadow: `0 0 16px ${roleColor}aa, 0 0 40px ${roleColor}44` }}
      />

      {/* ── Боковые угловые акценты ── */}
      <div className="absolute top-0 left-0 w-24 h-24 pointer-events-none"
        style={{ background: `radial-gradient(circle at 0% 0%, ${roleColor}12 0%, transparent 70%)` }} />
      <div className="absolute top-0 right-0 w-24 h-24 pointer-events-none"
        style={{ background: `radial-gradient(circle at 100% 0%, ${roleColor}08 0%, transparent 70%)` }} />

      {/* ── Нижняя граница ── */}
      <div className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
        style={{ background: `linear-gradient(90deg, transparent, ${roleColor}25, transparent)` }} />

      <div className={`relative flex items-center gap-2 ${isMobile ? "px-3 py-2" : "px-4 py-2"}`}>

        {/* ── АВАТАР + ИМЯ ── */}
        <SLTooltip as="flex" placement="bottom" delay={300}
          content={<><b style={{ color: roleColor }}>{myName || empName}</b><br />{ROLE_LABEL[empRole] || empRole} · нажми для профиля</>}>
          <button
            onClick={onOpenProfile}
            onMouseEnter={() => setAvatarHovered(true)}
            onMouseLeave={() => setAvatarHovered(false)}
            className="flex items-center gap-2.5 min-w-0 flex-1 text-left transition-all duration-150 active:scale-95"
          >
            {/* Аватар */}
            <div className="relative shrink-0">
              <div
                className="relative w-9 h-9 rounded-xl overflow-hidden transition-all duration-300"
                style={{
                  boxShadow: avatarHovered
                    ? `0 0 0 2px ${roleColor}, 0 0 20px ${roleColor}60`
                    : `0 0 0 1.5px ${roleColor}50, 0 0 10px ${roleColor}25`,
                }}
              >
                {myAvatar ? (
                  <img src={myAvatar} alt="ava" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-oswald font-black text-sm"
                    style={{ background: `linear-gradient(135deg, ${roleColor}35, ${roleColor}12)`, color: roleColor }}>
                    {initials}
                  </div>
                )}
                {/* Hover-оверлей */}
                <div className="absolute inset-0 flex items-center justify-center transition-opacity duration-200"
                  style={{ background: `${roleColor}30`, opacity: avatarHovered ? 1 : 0 }}>
                  <Icon name="UserCog" size={14} style={{ color: roleColor }} />
                </div>
              </div>
              {/* Онлайн-точка */}
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#050508] flex items-center justify-center"
                style={{ background: "#22c55e", boxShadow: "0 0 8px rgba(34,197,94,0.9)" }}>
                <span className="w-1 h-1 rounded-full bg-white animate-ping absolute" />
              </span>
            </div>

            {/* Имя + роль */}
            <div className="min-w-0 flex flex-col gap-0.5">
              <div className="font-oswald font-black text-sm uppercase tracking-wide truncate leading-none"
                style={{ color: roleColor, textShadow: `0 0 14px ${roleColor}70` }}>
                {myName || empName}
              </div>
              <RoleBadge role={empRole} color={roleColor} />
            </div>
          </button>
        </SLTooltip>

        {/* ── ЧАСЫ (центр) ── */}
        {!isMobile && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              minWidth: 110,
            }}>
            <span className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: "#22c55e", boxShadow: "0 0 6px rgba(34,197,94,0.9)", animation: "pulse 2s infinite" }} />
            <LiveClock color="rgba(255,255,255,0.6)" />
          </div>
        )}

        {/* ── КНОПКИ СПРАВА ── */}
        <div className="flex items-center gap-0.5 shrink-0">
          {isOwnerOrAdmin && !isMobile && (
            <SLTooltip content={<><b>Напоминание</b><br />Отправить @PluXan</>} placement="bottom">
              <button onClick={sendReminderNow} disabled={sending}
                className="relative flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-150 active:scale-90 disabled:opacity-50"
                style={{
                  background: sendResult === true ? "rgba(34,197,94,0.15)" : sendResult === false ? "rgba(239,68,68,0.15)" : "rgba(255,215,0,0.08)",
                  border: `1px solid ${sendResult === true ? "rgba(34,197,94,0.3)" : sendResult === false ? "rgba(239,68,68,0.3)" : "rgba(255,215,0,0.2)"}`,
                  color: sendResult === true ? "#22c55e" : sendResult === false ? "#ef4444" : "#FFD700",
                  boxShadow: sendResult === true ? "0 0 12px rgba(34,197,94,0.3)" : "none",
                }}>
                <Icon name={sending ? "Loader" : sendResult === true ? "Check" : "Bell"} size={14} className={sending ? "animate-spin" : ""} />
              </button>
            </SLTooltip>
          )}

          <InstallPwaButton />
          <HolidayShowAgainButton />
          <AppSettingsMenu />

          <HeaderBtn icon="UserCog" tooltip={<><b>Мой профиль</b><br />Аватар, имя, PIN</>} onClick={onOpenProfile} />

          <HeaderBtn
            icon="Sparkles"
            tooltip={<><b>Оформление</b><br />Тема, эффекты</>}
            onClick={onOpenTheme}
            color={`${roleColor}60`}
            activeColor={roleColor}
          />

          <SLTooltip content={<><b>Выйти</b><br />Завершить сессию</>} placement="bottom">
            <button onClick={logout}
              className="flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-150 active:scale-90"
              style={{ color: "rgba(255,255,255,0.2)" }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.color = "#f87171";
                (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.1)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.2)";
                (e.currentTarget as HTMLElement).style.background = "transparent";
              }}>
              <Icon name="LogOut" size={15} />
            </button>
          </SLTooltip>
        </div>
      </div>

      {/* ── Декоративная нижняя tech-полоса ── */}
      <div className="relative flex items-center gap-2 px-3 pb-1.5" style={{ marginTop: "-2px" }}>
        <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${roleColor}30, transparent)` }} />
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map(i => (
            <span key={i} className="rounded-full"
              style={{
                width: i === 1 ? 4 : 3,
                height: i === 1 ? 4 : 3,
                background: i === 1 ? roleColor : `${roleColor}50`,
                boxShadow: i === 1 ? `0 0 6px ${roleColor}` : "none",
                animation: `pulse ${1.5 + i * 0.4}s ease-in-out infinite`,
                animationDelay: `${i * 0.2}s`,
              }} />
          ))}
        </div>
        <div className="font-mono text-[8px] uppercase tracking-[0.15em]"
          style={{ color: `${roleColor}40` }}>
          SYS_OK
        </div>
        <div className="flex-1 h-px" style={{ background: `linear-gradient(270deg, ${roleColor}15, transparent)` }} />
      </div>

    </header>
  );
}
