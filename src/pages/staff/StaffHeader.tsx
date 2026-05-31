import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import InstallPwaButton from "./InstallPwaButton";
import HolidayShowAgainButton from "@/components/holidays/HolidayShowAgainButton";
import { ROLE_LABEL } from "./staffConstants";
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

// ── Живые часы ────────────────────────────────────────────────────────────
function LiveClock({ color }: { color: string }) {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const pad = (n: number) => String(n).padStart(2, "0");
  const blink = time.getSeconds() % 2 === 0;
  return (
    <span className="font-mono tabular-nums" style={{ color, letterSpacing: "0.08em", fontSize: "13px" }}>
      {pad(time.getHours())}
      <span style={{ opacity: blink ? 1 : 0.2, transition: "opacity 0.1s" }}>:</span>
      {pad(time.getMinutes())}
      <span style={{ opacity: blink ? 1 : 0.2, transition: "opacity 0.1s" }}>:</span>
      <span style={{ color: `${color}70`, fontSize: "0.8em" }}>{pad(time.getSeconds())}</span>
    </span>
  );
}

// ── Кнопка шапки ──────────────────────────────────────────────────────────
function HeaderBtn({
  icon, tooltip, onClick, color, activeColor, size = 15,
}: {
  icon: string; tooltip: React.ReactNode; onClick?: () => void;
  color?: string; activeColor?: string; size?: number;
}) {
  const [hov, setHov] = useState(false);
  return (
    <SLTooltip content={tooltip} placement="bottom">
      <button
        onClick={onClick}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        className="relative flex items-center justify-center transition-all duration-200 active:scale-90"
        style={{
          width: 36, height: 36,
          borderRadius: 10,
          background: hov
            ? (activeColor ? `${activeColor}18` : "rgba(255,215,0,0.06)")
            : "transparent",
          color: hov ? (activeColor || "#FFD700") : (color || "rgba(255,255,255,0.3)"),
          boxShadow: hov ? `0 0 12px ${activeColor || "#FFD700"}22` : "none",
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
  const [avatarHov, setAvatarHov] = useState(false);

  const reminderColor = sendResult === true ? "#22c55e" : sendResult === false ? "#ef4444" : "#FFD700";
  const reminderIcon = sending ? "Loader" : sendResult === true ? "CheckCircle" : "Bell";

  return (
    <header className="relative shrink-0 safe-top z-10">

      {/* ── Кинематографический фон шапки ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Основной glass */}
        <div className="absolute inset-0" style={{
          background: "linear-gradient(180deg, rgba(8,6,4,0.97) 0%, rgba(6,5,3,0.93) 100%)",
          backdropFilter: "blur(32px)",
          WebkitBackdropFilter: "blur(32px)",
        }} />
        {/* Зернистая текстура */}
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
          opacity: 0.6,
        }} />
        {/* Кинопланка — левый угол */}
        <div className="absolute top-0 left-0 pointer-events-none" style={{
          width: 120, height: "100%",
          background: `radial-gradient(ellipse at 0% 50%, ${roleColor}10 0%, transparent 70%)`,
        }} />
        {/* Кинопланка — правый угол */}
        <div className="absolute top-0 right-0 pointer-events-none" style={{
          width: 80, height: "100%",
          background: "radial-gradient(ellipse at 100% 50%, rgba(255,200,50,0.04) 0%, transparent 70%)",
        }} />
      </div>

      {/* ── Верхняя золотая линия — кадрирование ── */}
      <div className="absolute top-0 left-0 right-0 pointer-events-none z-10" style={{
        height: "2px",
        background: `linear-gradient(90deg,
          transparent 0%,
          ${roleColor}40 15%,
          ${roleColor}cc 40%,
          #fff8e8 50%,
          ${roleColor}cc 60%,
          ${roleColor}40 85%,
          transparent 100%
        )`,
        boxShadow: `0 0 20px ${roleColor}60, 0 0 60px ${roleColor}20`,
      }} />

      {/* ── Нижняя граница — тонкая золотая ── */}
      <div className="absolute bottom-0 left-0 right-0 h-px pointer-events-none" style={{
        background: `linear-gradient(90deg, transparent 0%, ${roleColor}20 30%, ${roleColor}40 50%, ${roleColor}20 70%, transparent 100%)`,
      }} />

      <div className={`relative flex items-center gap-2 ${isMobile ? "px-3 py-2.5" : "px-4 py-2.5"}`}>

        {/* ── АВАТАР + ИМЯ ── */}
        <SLTooltip as="flex" placement="bottom" delay={300}
          content={<><b style={{ color: roleColor }}>{myName || empName}</b><br />{ROLE_LABEL[empRole] || empRole} · профиль</>}>
          <button
            onClick={onOpenProfile}
            onMouseEnter={() => setAvatarHov(true)}
            onMouseLeave={() => setAvatarHov(false)}
            className="flex items-center gap-2.5 min-w-0 flex-1 text-left transition-all duration-200 active:scale-95"
          >
            {/* Аватар в 3D-раме */}
            <div className="relative shrink-0" style={{ perspective: "200px" }}>
              <div
                className="relative transition-all duration-300"
                style={{
                  width: 38, height: 38,
                  borderRadius: 10,
                  overflow: "hidden",
                  boxShadow: avatarHov
                    ? `0 0 0 1.5px ${roleColor}, 0 0 24px ${roleColor}70, 0 4px 16px rgba(0,0,0,0.8)`
                    : `0 0 0 1px ${roleColor}60, 0 0 12px ${roleColor}30, 0 2px 8px rgba(0,0,0,0.6)`,
                  transform: avatarHov
                    ? "perspective(200px) rotateY(-6deg) rotateX(3deg) scale(1.05)"
                    : "perspective(200px) rotateY(0) rotateX(0) scale(1)",
                }}
              >
                {myAvatar ? (
                  <img src={myAvatar} alt="ava" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-oswald font-black text-sm"
                    style={{
                      background: `linear-gradient(145deg, ${roleColor}40 0%, ${roleColor}15 50%, rgba(0,0,0,0.3) 100%)`,
                      color: roleColor,
                      textShadow: `0 0 10px ${roleColor}`,
                    }}>
                    {initials}
                  </div>
                )}
                {/* Hover оверлей */}
                <div className="absolute inset-0 flex items-center justify-center transition-opacity duration-200"
                  style={{
                    background: `linear-gradient(135deg, ${roleColor}35, rgba(0,0,0,0.3))`,
                    opacity: avatarHov ? 1 : 0,
                  }}>
                  <Icon name="UserCog" size={14} style={{ color: roleColor, filter: `drop-shadow(0 0 4px ${roleColor})` }} />
                </div>
                {/* Глянцевый блик */}
                <div className="absolute inset-0 pointer-events-none" style={{
                  background: "linear-gradient(145deg, rgba(255,255,255,0.12) 0%, transparent 50%)",
                }} />
              </div>
              {/* Онлайн точка */}
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#050403]"
                style={{ background: "#22c55e", boxShadow: "0 0 8px rgba(34,197,94,0.9), 0 0 16px rgba(34,197,94,0.4)" }}>
                <span className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-60" />
              </span>
            </div>

            {/* Имя + роль */}
            <div className="min-w-0 flex flex-col gap-0.5">
              <div className="font-oswald font-black text-sm uppercase tracking-wider truncate leading-none"
                style={{
                  background: `linear-gradient(90deg, #fff8e8, ${roleColor})`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  filter: `drop-shadow(0 0 8px ${roleColor}60)`,
                }}>
                {myName || empName}
              </div>
              <span className="inline-flex items-center gap-1 font-roboto font-semibold" style={{
                fontSize: "9px",
                padding: "2px 7px",
                background: `linear-gradient(90deg, ${roleColor}20, ${roleColor}08)`,
                border: `1px solid ${roleColor}30`,
                borderRadius: 4,
                color: roleColor,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}>
                <span>{empRole === "owner" ? "👑" : empRole === "admin" ? "⚡" : "●"}</span>
                {ROLE_LABEL[empRole] || empRole}
              </span>
            </div>
          </button>
        </SLTooltip>

        {/* ── ЧАСЫ (центр, не мобайл) ── */}
        {!isMobile && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-2 shrink-0" style={{
            background: "linear-gradient(135deg, rgba(20,16,10,0.8), rgba(10,8,6,0.9))",
            border: "1px solid rgba(255,200,50,0.12)",
            borderRadius: 10,
            boxShadow: "0 2px 12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)",
            minWidth: 110,
          }}>
            <span className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: "#22c55e", boxShadow: "0 0 8px rgba(34,197,94,0.9)", animation: "pulse 2s infinite" }} />
            <LiveClock color="rgba(255,240,200,0.75)" />
          </div>
        )}

        {/* ── КНОПКИ СПРАВА ── */}
        <div className="flex items-center gap-0.5 shrink-0">

          {isOwnerOrAdmin && !isMobile && (
            <SLTooltip content={<><b>Напоминание</b><br />Отправить @PluXan</>} placement="bottom">
              <button onClick={sendReminderNow} disabled={sending}
                className="relative flex items-center justify-center transition-all duration-200 active:scale-90"
                style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: `${reminderColor}12`,
                  border: `1px solid ${reminderColor}25`,
                  color: reminderColor,
                  boxShadow: `0 0 12px ${reminderColor}20`,
                }}>
                <Icon name={reminderIcon} size={15} className={sending ? "animate-spin" : ""} />
              </button>
            </SLTooltip>
          )}

          <InstallPwaButton />
          <HolidayShowAgainButton />
          <AppSettingsMenu />

          <HeaderBtn icon="UserCog" tooltip="Мой профиль" onClick={onOpenProfile}
            color="rgba(255,255,255,0.3)" activeColor={roleColor} />

          <HeaderBtn icon="Sparkles" tooltip="Оформление" onClick={onOpenTheme}
            color={`${roleColor}60`} activeColor={roleColor} />

          <SLTooltip content="Выйти" placement="bottom">
            <button onClick={logout}
              className="relative flex items-center justify-center transition-all duration-200 active:scale-90 group"
              style={{ width: 36, height: 36, borderRadius: 10, color: "rgba(255,255,255,0.25)" }}>
              <div className="absolute inset-0 rounded-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: "rgba(239,68,68,0.12)" }} />
              <Icon name="LogOut" size={15} className="group-hover:text-red-400 transition-colors" />
            </button>
          </SLTooltip>
        </div>
      </div>

      {/* ── Нижняя tech-полоса ── */}
      <div className="relative flex items-center justify-center gap-2 py-0.5 px-4 overflow-hidden"
        style={{ borderTop: "1px solid rgba(255,200,50,0.06)" }}>
        <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(255,200,50,0.15))" }} />
        <div className="flex items-center gap-1.5">
          {[6, 4, 5].map((sz, i) => (
            <span key={i} className="rounded-full" style={{
              width: sz, height: sz,
              background: i === 1 ? roleColor : "rgba(255,200,50,0.4)",
              boxShadow: i === 1 ? `0 0 6px ${roleColor}` : "none",
              animation: `pulse ${1.5 + i * 0.3}s ease-in-out infinite`,
              animationDelay: `${i * 0.2}s`,
            }} />
          ))}
          <span className="font-mono text-[7px] uppercase tracking-[0.2em]"
            style={{ color: "rgba(255,200,50,0.4)", letterSpacing: "0.25em" }}>
            SYS_OK
          </span>
        </div>
        <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, rgba(255,200,50,0.15), transparent)" }} />
      </div>
    </header>
  );
}
