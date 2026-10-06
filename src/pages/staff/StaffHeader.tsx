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

function HeaderBtn({
  icon, tooltip, onClick, size = 18,
}: {
  icon: string; tooltip: React.ReactNode; onClick?: () => void;
  color?: string; activeColor?: string; size?: number;
}) {
  return (
    <SLTooltip content={tooltip} placement="bottom">
      <button onClick={onClick}
        className="flex items-center justify-center active:scale-90 transition-transform rounded-2xl"
        style={{ width: 44, height: 44, background: "var(--sber-card)", color: "#fff" }}>
        <Icon name={icon} size={size} />
      </button>
    </SLTooltip>
  );
}

export default function StaffHeader({
  empName, empRole, myName, myAvatar, initials,
  isMobile, isOwnerOrAdmin, sending, sendResult,
  sendReminderNow, onOpenProfile, onOpenTheme, logout,
}: Props) {
  const reminderIcon = sending ? "Loader" : sendResult === true ? "CheckCircle" : "Bell";

  return (
    <header className="relative shrink-0 safe-top z-10"
      style={{ background: "linear-gradient(180deg, #0f5a2a 0%, #123d22 55%, var(--sber-bg) 100%)" }}>
      <div className={`flex items-center gap-2 ${isMobile ? "px-3 py-3" : "px-4 py-3"}`}>
        <button onClick={onOpenProfile} className="flex items-center gap-3 min-w-0 flex-1 text-left active:scale-95 transition-transform">
          <div className="shrink-0 w-12 h-12 rounded-2xl overflow-hidden flex items-center justify-center font-extrabold"
            style={{ background: "var(--sber-card-2)", border: "2px solid var(--sber-green-2)", color: "#fff" }}>
            {myAvatar ? <img src={myAvatar} alt="avatar" className="w-full h-full object-cover" /> : initials}
          </div>
          <div className="min-w-0">
            <div className="text-[16px] font-bold text-white truncate leading-tight">{myName || empName}</div>
            <div className="text-[12px] leading-tight" style={{ color: "rgba(255,255,255,0.65)" }}>{ROLE_LABEL[empRole] || empRole}</div>
          </div>
        </button>

        <div className="flex items-center gap-2 shrink-0">
          {isOwnerOrAdmin && !isMobile && (
            <HeaderBtn icon={reminderIcon} tooltip={<><b>Напоминание</b><br />Отправить @PluXan</>} onClick={sendReminderNow} />
          )}
          <InstallPwaButton />
          <HolidayShowAgainButton />
          <AppSettingsMenu />
          <HeaderBtn icon="Sparkles" tooltip="Оформление" onClick={onOpenTheme} />
          <HeaderBtn icon="LogOut" tooltip="Выйти" onClick={logout} />
        </div>
      </div>
    </header>
  );
}
