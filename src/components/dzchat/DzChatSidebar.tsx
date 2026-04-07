/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import Icon from "@/components/ui/icon";
import { formatTime } from "@/components/dzchat/dzchat.utils";
import DzChatAvatar from "@/components/dzchat/DzChatAvatar";
import { DzChatInstallBanner } from "@/components/dzchat/DzChatInstall";

type FilterTab = "all" | "unread" | "favorites" | "groups";

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
  me, chats, activeChat, loadingChats, searchQuery,
  notifGranted, installPrompt, incomingCall,
  totalUnread, filteredChats,
  onSetActiveChat, onShowProfile, onShowNewGroup, onShowNewChat,
  onSearchChange, onRequestNotifications, onInstallApp, onOpenSetupGuide,
}: DzChatSidebarProps) => {
  const [filter, setFilter] = useState<FilterTab>("all");

  // Применяем фильтр поверх filteredChats
  const visibleChats = filteredChats.filter(chat => {
    if (filter === "unread") return (chat.unread || 0) > 0;
    if (filter === "groups") return chat.type === "group";
    if (filter === "favorites") return chat.pinned;
    return true;
  });

  return (
    <div
      className={`${activeChat ? "hidden" : "flex"} flex-col w-full shrink-0`}
      style={{ background: "#000", height: "100dvh" }}>

      {/* ── Шапка ── */}
      <div className="flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top),14px)] pb-1">
        {/* Меню / аватар */}
        <button
          onClick={onShowProfile}
          className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center bg-[#1c1c1e] shrink-0">
          <DzChatAvatar name={me.name || "?"} url={me.avatar_url} size={36} bust={me.avatar_bust} />
        </button>

        <h1 className="text-white font-bold text-[22px] tracking-tight flex-1 ml-3">Чаты</h1>

        <div className="flex items-center gap-1">
          {/* Камера */}
          <button
            onClick={() => onShowNewChat()}
            className="w-9 h-9 rounded-full bg-[#1c1c1e] flex items-center justify-center">
            <Icon name="Camera" size={18} className="text-white" />
          </button>
          {/* Новый чат */}
          <button
            onClick={onShowNewChat}
            className="w-9 h-9 rounded-full bg-[#1c1c1e] flex items-center justify-center">
            <Icon name="Plus" size={20} className="text-white" />
          </button>
        </div>
      </div>

      {/* ── Поиск ── */}
      <div className="px-4 pt-2 pb-2">
        <div className="flex items-center gap-2 rounded-[10px] px-3 py-2" style={{ background: "#1c1c1e" }}>
          <Icon name="Search" size={15} className="text-white/40 shrink-0" />
          <input
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Поиск"
            className="flex-1 bg-transparent text-white text-[15px] outline-none placeholder-white/40 min-w-0"
          />
          {searchQuery && (
            <button onClick={() => onSearchChange("")} className="text-white/40">
              <Icon name="X" size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ── Фильтр-таблетки ── */}
      <div className="flex gap-2 px-4 pb-2 overflow-x-auto scrollbar-none">
        {([ 
          { id: "all",       label: "Все" },
          { id: "unread",    label: "Непрочитанное" },
          { id: "favorites", label: "Избранное" },
          { id: "groups",    label: "Группы" },
        ] as { id: FilterTab; label: string }[]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className="shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
            style={{
              background: filter === tab.id ? "#25D366" : "#1c1c1e",
              color: filter === tab.id ? "#fff" : "rgba(255,255,255,0.7)",
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* PWA баннер */}
      <DzChatInstallBanner installPrompt={installPrompt} onInstall={onInstallApp} onOpenGuide={onOpenSetupGuide} />

      {/* ── Список чатов ── */}
      <div className="flex-1 overflow-y-auto overscroll-contain">

        {/* Уведомления — строка если не разрешены */}
        {!notifGranted && "Notification" in window && (
          <button
            onClick={onRequestNotifications}
            className="w-full flex items-center gap-3 px-4 py-2.5 border-b border-white/5">
            <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0">
              <Icon name="Bell" size={18} className="text-yellow-400" />
            </div>
            <p className="text-yellow-400 text-sm flex-1 text-left">Включить уведомления</p>
            <Icon name="ChevronRight" size={16} className="text-white/20" />
          </button>
        )}

        {loadingChats && chats.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-white/20">
            <Icon name="Loader" size={28} className="animate-spin" />
          </div>
        ) : visibleChats.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
              <Icon name="MessageSquarePlus" size={30} className="text-white/20" />
            </div>
            <p className="text-white/30 text-sm">
              {searchQuery ? "Ничего не найдено" : filter !== "all" ? "Нет чатов в этой категории" : "Нет чатов"}
            </p>
            {!searchQuery && filter === "all" && (
              <button
                onClick={onShowNewChat}
                className="mt-4 bg-[#25D366] text-white text-sm px-5 py-2.5 rounded-xl font-medium">
                Начать диалог
              </button>
            )}
          </div>
        ) : visibleChats.map((chat, idx) => {
          const lm = chat.last_message;
          const isOnline = chat.partner?.is_online;
          const hasActiveCall = incomingCall?.chat_id === chat.id;
          const isLast = idx === visibleChats.length - 1;

          const lastText = hasActiveCall ? "📞 Входящий звонок..."
            : lm?.voice_url ? "🎤 Голосовое"
            : lm?.video_url ? "🎥 Видео"
            : lm?.photo_url ? "📷 Фото"
            : lm?.text || "";

          return (
            <button
              key={chat.id}
              onClick={() => onSetActiveChat(chat)}
              className="w-full flex items-center gap-3 px-4 py-2.5 active:bg-white/5 transition-colors"
              style={{ borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.05)" }}>

              {/* Аватар */}
              <div className="relative shrink-0">
                <DzChatAvatar name={chat.name || "?"} url={chat.avatar_url} size={50} />
                {isOnline && chat.type === "direct" && !hasActiveCall && (
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-[#25D366] border-2 border-black" />
                )}
                {hasActiveCall && (
                  <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-green-500 border-2 border-black flex items-center justify-center animate-pulse">
                    <Icon name="Phone" size={8} className="text-white" />
                  </span>
                )}
              </div>

              {/* Контент */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <p className="text-white font-semibold text-[15px] truncate leading-tight">{chat.name}</p>
                  <p className="text-[12px] shrink-0" style={{ color: (chat.unread || 0) > 0 ? "#25D366" : "rgba(255,255,255,0.35)" }}>
                    {lm ? formatTime(lm.created_at) : ""}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[13px] truncate flex-1" style={{ color: hasActiveCall ? "#22c55e" : "rgba(255,255,255,0.45)" }}>
                    {lm?.sender_id === me.id && (
                      <span className="mr-1">
                        {lm.is_read
                          ? <Icon name="CheckCheck" size={12} className="inline text-[#25D366] -mt-0.5" />
                          : <Icon name="CheckCheck" size={12} className="inline text-white/30 -mt-0.5" />}
                      </span>
                    )}
                    {lastText || "Нет сообщений"}
                  </p>
                  <div className="flex items-center gap-1 shrink-0">
                    {chat.pinned && <Icon name="Pin" size={12} className="text-white/25 rotate-45" />}
                    {(chat.unread || 0) > 0 && (
                      <span className="text-white text-[11px] font-bold min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center bg-[#25D366]">
                        {chat.unread > 99 ? "99+" : chat.unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Нижний таббар (WhatsApp стиль) ── */}
      <div
        className="flex items-center justify-around border-t"
        style={{
          background: "#111",
          borderColor: "rgba(255,255,255,0.08)",
          paddingBottom: "max(env(safe-area-inset-bottom), 8px)",
          paddingTop: "8px",
        }}>
        {/* Статус */}
        <button className="flex flex-col items-center gap-0.5 min-w-[48px]" onClick={onShowProfile}>
          <Icon name="Circle" size={22} className="text-white/30" />
          <span className="text-[10px] text-white/30">Статус</span>
        </button>
        {/* Звонки */}
        <button className="flex flex-col items-center gap-0.5 min-w-[48px]" onClick={onShowNewChat}>
          <Icon name="Phone" size={22} className="text-white/30" />
          <span className="text-[10px] text-white/30">Звонки</span>
        </button>
        {/* Инструменты */}
        <button className="flex flex-col items-center gap-0.5 min-w-[48px]" onClick={onShowNewGroup}>
          <Icon name="Grid3x3" size={22} className="text-white/30" />
          <span className="text-[10px] text-white/30">Инструменты</span>
        </button>
        {/* Чаты — активный */}
        <button className="flex flex-col items-center gap-0.5 min-w-[48px] relative">
          <div className="relative">
            <Icon name="MessageCircle" size={24} className="text-[#25D366]" />
            {totalUnread > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#25D366] text-white text-[9px] font-bold min-w-[14px] h-[14px] rounded-full flex items-center justify-center px-0.5">
                {totalUnread > 9 ? "9+" : totalUnread}
              </span>
            )}
          </div>
          <span className="text-[10px] text-[#25D366] font-medium">Чаты</span>
        </button>
        {/* Настройки */}
        <button className="flex flex-col items-center gap-0.5 min-w-[48px] relative" onClick={onOpenSetupGuide}>
          <div className="relative">
            <Icon name="Settings" size={22} className="text-white/30" />
            {!notifGranted && "Notification" in window && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </div>
          <span className="text-[10px] text-white/30">Настройки</span>
        </button>
      </div>
    </div>
  );
};

export default DzChatSidebar;
