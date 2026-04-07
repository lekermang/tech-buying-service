/* eslint-disable @typescript-eslint/no-explicit-any */
import Icon from "@/components/ui/icon";
import { formatTime } from "@/components/dzchat/dzchat.utils";
import DzChatAvatar from "@/components/dzchat/DzChatAvatar";
import { DzChatInstallBanner } from "@/components/dzchat/DzChatInstall";
import { unlockAudio } from "@/components/dzchat/dzchat.sounds";

interface DzChatSidebarProps {
  me: any;
  chats: any[];
  activeChat: any;
  loadingChats: boolean;
  searchQuery: string;
  notifGranted: boolean;
  installPrompt: any;
  theme: any;
  incomingCall: any;
  totalUnread: number;
  filteredChats: any[];
  onSetActiveChat: (chat: any) => void;
  onShowProfile: () => void;
  onShowNewGroup: () => void;
  onShowNewChat: () => void;
  onSearchChange: (q: string) => void;
  onRequestNotifications: () => void;
  onInstallApp: () => void;
  onOpenSetupGuide: () => void;
}

const DzChatSidebar = ({
  me, chats, activeChat, loadingChats, searchQuery, notifGranted,
  installPrompt, theme, incomingCall, totalUnread, filteredChats,
  onSetActiveChat, onShowProfile, onShowNewGroup, onShowNewChat,
  onSearchChange, onRequestNotifications, onInstallApp, onOpenSetupGuide,
}: DzChatSidebarProps) => {
  const isGlass = theme.isGlass;

  return (
    <div
      className={`${activeChat ? "hidden" : "flex"} flex-col w-full shrink-0 border-r ${isGlass ? "dz-glass" : ""}`}
      style={{ background: theme.sidebar, borderColor: theme.border }}>

      {/* Header */}
      <div className={`flex items-center justify-between px-3 py-2.5 border-b safe-top ${isGlass ? "dz-glass" : ""}`}
        style={{ background: theme.sidebarHeader, borderColor: theme.border }}>
        <button onClick={() => { unlockAudio(); onShowProfile(); }}
          className="flex items-center gap-2.5 hover:opacity-80 transition-opacity min-w-0 flex-1">
          <div className="shrink-0">
            <DzChatAvatar name={me.name || "?"} url={me.avatar_url} size={38} />
          </div>
          <div className="text-left min-w-0 flex-1">
            <p className="text-sm font-semibold leading-tight truncate" style={{ color: theme.text }}>{me.name}</p>
            <p className="text-xs" style={{ color: theme.accent }}>● в сети</p>
          </div>
        </button>

        <div className="flex items-center gap-0.5 shrink-0 ml-1">
          {notifGranted ? (
            <div className="w-8 h-8 flex items-center justify-center opacity-50" style={{ color: theme.accent }}>
              <Icon name="BellRing" size={16} />
            </div>
          ) : "Notification" in window ? (
            <button onClick={onRequestNotifications} title="Разрешить уведомления"
              className="w-8 h-8 flex items-center justify-center text-yellow-400 hover:bg-white/10 rounded-full">
              <Icon name="Bell" size={17} />
            </button>
          ) : null}
          <button onClick={onShowNewGroup}
            className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors"
            style={{ color: theme.textMuted }}>
            <Icon name="Users" size={17} />
          </button>
          <button onClick={onShowNewChat}
            className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors"
            style={{ color: theme.textMuted }}>
            <Icon name="SquarePen" size={17} />
          </button>
          <button onClick={() => { unlockAudio(); onShowProfile(); }}
            className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors"
            style={{ color: theme.textMuted }}>
            <Icon name="Settings" size={17} />
          </button>
        </div>
      </div>

      {/* PWA баннер */}
      <DzChatInstallBanner installPrompt={installPrompt} onInstall={onInstallApp} onOpenGuide={onOpenSetupGuide} />

      {/* Поиск */}
      <div className="px-3 py-2 border-b" style={{ background: theme.sidebar, borderColor: theme.border }}>
        <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: "rgba(255,255,255,0.07)" }}>
          <Icon name="Search" size={15} className="shrink-0" style={{ color: theme.textMuted } as any} />
          <input
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Поиск чатов..."
            className="flex-1 bg-transparent text-sm outline-none min-w-0 placeholder-white/30"
            style={{ color: theme.text }}
          />
          {searchQuery && (
            <button onClick={() => onSearchChange("")} className="shrink-0" style={{ color: theme.textMuted }}>
              <Icon name="X" size={14} />
            </button>
          )}
          <button onClick={onShowNewChat} style={{ color: theme.accent }}>
            <Icon name="UserPlus" size={16} />
          </button>
        </div>
      </div>

      {/* Список чатов */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        {loadingChats && chats.length === 0 ? (
          <div className="flex items-center justify-center py-16" style={{ color: theme.textMuted }}>
            <Icon name="Loader" size={28} className="animate-spin" />
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3"
              style={{ background: theme.accent + "18" }}>
              <Icon name="MessageSquarePlus" size={32} style={{ color: theme.accent + "66" } as any} />
            </div>
            <p className="text-sm" style={{ color: theme.textMuted }}>{searchQuery ? "Не найдено" : "Нет чатов"}</p>
            {!searchQuery && (
              <button onClick={onShowNewChat}
                className="mt-4 text-white text-sm px-5 py-2.5 rounded-xl font-medium"
                style={{ background: theme.accent }}>
                Начать диалог
              </button>
            )}
          </div>
        ) : filteredChats.map(chat => {
          const isActive = activeChat?.id === chat.id;
          const lm = chat.last_message;
          const isOnline = chat.partner?.is_online;
          const hasActiveCall = incomingCall?.chat_id === chat.id;
          return (
            <button key={chat.id} onClick={() => onSetActiveChat(chat)}
              className="w-full flex items-center gap-3 px-3 py-3 transition-colors border-b active:bg-white/10"
              style={{
                background: isActive ? (theme.accent + "20") : "transparent",
                borderColor: theme.border,
              }}>
              <div className="relative shrink-0">
                <DzChatAvatar name={chat.name || "?"} url={chat.avatar_url} size={48} />
                {isOnline && chat.type === "direct" && !hasActiveCall && (
                  <span className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full border-2"
                    style={{ background: theme.accent, borderColor: theme.sidebar }} />
                )}
                {hasActiveCall && (
                  <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-green-500 border-2 flex items-center justify-center animate-pulse"
                    style={{ borderColor: theme.sidebar }}>
                    <Icon name="Phone" size={10} className="text-white" />
                  </span>
                )}
                {chat.unread > 0 && (
                  <span className="absolute -top-1 -right-1 text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center"
                    style={{ background: theme.accent }}>
                    {chat.unread > 99 ? "99+" : chat.unread}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between gap-1">
                  <p className="text-sm font-semibold truncate" style={{ color: theme.text }}>{chat.name}</p>
                  <div className="flex items-center gap-1 shrink-0">
                    {lm?.sender_id === me.id && (
                      lm.is_read
                        ? <Icon name="CheckCheck" size={12} className="text-blue-400" />
                        : <Icon name="CheckCheck" size={12} style={{ color: theme.textMuted } as any} />
                    )}
                    {lm && <p className="text-[10px]" style={{ color: theme.textMuted }}>{formatTime(lm.created_at)}</p>}
                  </div>
                </div>
                <p className="text-xs truncate mt-0.5" style={{ color: hasActiveCall ? "#22c55e" : theme.textMuted }}>
                  {hasActiveCall
                    ? "📞 Входящий звонок..."
                    : lm?.voice_url ? "🎤 Голосовое"
                    : lm?.video_url ? "🎥 Видео"
                    : lm?.photo_url ? "📷 Фото"
                    : lm?.text || "Нет сообщений"}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {totalUnread > 0 && (
        <div className="px-4 py-1.5 border-t text-center safe-bottom"
          style={{ background: theme.sidebar, borderColor: theme.border }}>
          <p className="text-xs" style={{ color: theme.accent }}>{totalUnread} непрочитанных</p>
        </div>
      )}
    </div>
  );
};

export default DzChatSidebar;
