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

export default function StaffHeader({
  empName, empRole, myName, myAvatar, initials, roleColor,
  isMobile, isOwnerOrAdmin, sending, sendResult,
  sendReminderNow, onOpenProfile, onOpenTheme, logout,
}: Props) {
  return (
    <header className="relative shrink-0 safe-top z-10">
      {/* Стеклянный фон шапки */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          background: "linear-gradient(180deg, rgba(5,5,8,0.98) 0%, rgba(5,5,8,0.85) 100%)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      />
      {/* Неоновая полоска сверху */}
      <div className="absolute top-0 left-0 right-0 h-[2px] pointer-events-none z-10"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${roleColor}99 30%, ${roleColor} 50%, ${roleColor}99 70%, transparent 100%)`,
          boxShadow: `0 0 12px ${roleColor}88, 0 0 30px ${roleColor}44`,
        }} />
      {/* Нижняя граница */}
      <div className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
        style={{ background: `linear-gradient(90deg, transparent, ${roleColor}30, transparent)` }} />

      <div className={`relative flex items-center gap-2 ${isMobile ? "px-2.5 py-2" : "px-4 py-2.5"}`}>
        {/* Аватар */}
        <SLTooltip as="flex" content={<><b>{myName || empName}</b><br />{ROLE_LABEL[empRole] || empRole} · нажми для профиля</>} placement="bottom">
          <button onClick={onOpenProfile} className="flex items-center gap-2.5 min-w-0 flex-1 text-left active:scale-95 transition group">
            <div className="relative shrink-0">
              <div className="relative w-9 h-9 rounded-xl overflow-hidden"
                style={{ boxShadow: `0 0 0 1.5px ${roleColor}60, 0 0 12px ${roleColor}30` }}>
                {myAvatar ? (
                  <img src={myAvatar} alt="ava" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-oswald font-bold text-sm"
                    style={{ background: `linear-gradient(135deg, ${roleColor}40, ${roleColor}15)`, color: roleColor }}>
                    {initials}
                  </div>
                )}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#050508]"
                style={{ background: "#22c55e", boxShadow: "0 0 6px rgba(34,197,94,0.8)" }} />
            </div>
            <div className="min-w-0 flex flex-col gap-0.5">
              <div className="font-oswald font-bold text-sm uppercase tracking-wide truncate leading-none"
                style={{ color: roleColor, textShadow: `0 0 12px ${roleColor}60` }}>
                {myName || empName}
              </div>
              <div className="flex items-center gap-1">
                <span className="inline-flex items-center gap-1 text-[9px] font-roboto px-1.5 py-0.5 rounded"
                  style={{ background: `${roleColor}18`, border: `1px solid ${roleColor}35`, color: roleColor }}>
                  {empRole === "owner" && "👑 "}
                  {ROLE_LABEL[empRole] || empRole}
                </span>
              </div>
            </div>
          </button>
        </SLTooltip>

        {/* Часы — только десктоп */}
        {!isMobile && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg font-roboto text-xs"
            style={{ background: "rgba(255,215,0,0.06)", border: "1px solid rgba(255,215,0,0.12)", color: "rgba(255,255,255,0.5)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shrink-0" />
            <MskClock />
          </div>
        )}

        {/* Кнопки справа */}
        <div className="flex items-center gap-0.5 shrink-0">
          {isOwnerOrAdmin && !isMobile && (
            <SLTooltip content="Отправить напоминание @PluXan" placement="bottom">
              <button onClick={sendReminderNow} disabled={sending}
                className="p-2 rounded-lg transition-all active:scale-95"
                style={{
                  background: sendResult === true ? "rgba(34,197,94,0.15)" : sendResult === false ? "rgba(239,68,68,0.15)" : "rgba(255,215,0,0.08)",
                  border: `1px solid ${sendResult === true ? "rgba(34,197,94,0.3)" : sendResult === false ? "rgba(239,68,68,0.3)" : "rgba(255,215,0,0.2)"}`,
                  color: sendResult === true ? "#22c55e" : sendResult === false ? "#ef4444" : "#FFD700",
                }}>
                <Icon name={sending ? "Loader" : sendResult === true ? "Check" : "Bell"} size={14} className={sending ? "animate-spin" : ""} />
              </button>
            </SLTooltip>
          )}
          <InstallPwaButton />
          <HolidayShowAgainButton />
          <AppSettingsMenu />
          <SLTooltip content={<><b>Мой профиль</b><br />Аватар, имя, пин-код</>} placement="bottom">
            <button onClick={onOpenProfile}
              className="p-2 rounded-lg text-white/30 hover:text-white/70 transition-all hover:bg-white/5">
              <Icon name="UserCog" size={15} />
            </button>
          </SLTooltip>
          <SLTooltip content={<><b>Оформление</b><br />Тема, цвета, эффекты</>} placement="bottom">
            <button onClick={onOpenTheme}
              className="p-2 rounded-lg transition-all"
              style={{ color: `${roleColor}99` }}
              onMouseEnter={e => (e.currentTarget.style.color = roleColor)}
              onMouseLeave={e => (e.currentTarget.style.color = `${roleColor}99`)}>
              <Icon name="Sparkles" size={15} />
            </button>
          </SLTooltip>
          <SLTooltip content={<><b>Выйти</b><br />Завершить сессию</>} placement="bottom">
            <button onClick={logout}
              className="p-2 rounded-lg text-white/20 hover:text-red-400 transition-all hover:bg-red-500/10">
              <Icon name="LogOut" size={15} />
            </button>
          </SLTooltip>
        </div>
      </div>
    </header>
  );
}
