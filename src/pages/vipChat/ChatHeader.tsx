import Icon from "@/components/ui/icon";

type Props = {
  onlineCount: number;
  membersCount: number;
  unread: number;
  pushSupported: boolean;
  pushSubscribed: boolean;
  pushPermission: NotificationPermission;
  pushBusy: boolean;
  pushHint: string | null;
  onTogglePush: () => void;
  onShowMembers: () => void;
};

export default function ChatHeader({
  onlineCount, membersCount, unread,
  pushSupported, pushSubscribed, pushPermission, pushBusy, pushHint,
  onTogglePush, onShowMembers,
}: Props) {
  return (
    <>
      <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/5 bg-gradient-to-r from-[#FFD700]/[0.06] to-transparent">
        <div className="flex items-center gap-3 min-w-0">
          <button className="lg:hidden text-white/40 hover:text-[#FFD700]" onClick={onShowMembers}>
            <Icon name="Users" size={18} />
          </button>
          <div className="w-10 h-10 rounded-md bg-gradient-to-br from-[#FFD700] to-yellow-600 flex items-center justify-center shrink-0 shadow-lg shadow-[#FFD700]/20">
            <span className="font-oswald font-bold text-black text-sm">VIP</span>
          </div>
          <div className="min-w-0">
            <div className="font-oswald font-bold uppercase tracking-wider text-base truncate">СКУПКА24<span className="text-[#FFD700]">Vip</span></div>
            <div className="font-roboto text-white/40 text-[10px]">
              <span className="text-green-400">● {onlineCount} онлайн</span> · {membersCount} участников
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {pushSupported && (
            <button
              onClick={onTogglePush}
              disabled={pushBusy || pushPermission === "denied"}
              title={
                pushPermission === "denied"
                  ? "Уведомления заблокированы — разблокируйте в настройках браузера"
                  : pushSubscribed
                    ? "Отключить уведомления"
                    : "Включить браузерные уведомления о новых сообщениях"
              }
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-[10px] font-roboto font-bold uppercase tracking-wide transition-all
                ${pushSubscribed
                  ? "bg-green-500/15 border-green-500/40 text-green-400 hover:bg-green-500/25"
                  : pushPermission === "denied"
                    ? "bg-red-500/10 border-red-500/30 text-red-400/70 cursor-not-allowed"
                    : "bg-[#FFD700]/10 border-[#FFD700]/30 text-[#FFD700] hover:bg-[#FFD700]/20"}
                ${pushBusy ? "opacity-60" : ""}`}>
              <Icon name={pushBusy ? "Loader" : pushSubscribed ? "BellRing" : "BellOff"}
                size={12} className={pushBusy ? "animate-spin" : ""} />
              <span className="hidden sm:inline">
                {pushBusy ? "..." : pushSubscribed ? "Уведомления вкл" : pushPermission === "denied" ? "Заблокированы" : "Уведомления"}
              </span>
            </button>
          )}
          {unread > 0 && (
            <span className="font-oswald font-bold text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full animate-pulse">
              +{unread}
            </span>
          )}
        </div>
      </header>

      {pushHint && (
        <div className="px-4 py-1.5 text-center text-[11px] font-roboto bg-[#FFD700]/8 text-[#FFD700]/80 border-b border-[#FFD700]/10">
          {pushHint}
        </div>
      )}
    </>
  );
}
