/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { api, formatTime } from "@/components/dzchat/dzchat.utils";
import DzChatAvatar from "@/components/dzchat/DzChatAvatar";
import DzChatAuth from "@/components/dzchat/DzChatAuth";
import DzChatView from "@/components/dzchat/DzChatView";
import { NewChatModal, ProfileModal, CreateGroupModal, playNotificationSound } from "@/components/dzchat/DzChatModals";

const NOTIF_ICON = "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/dce22ed0-7e15-4a0f-84c3-9987477dea5a.jpg";

const DzChat = () => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("dzchat_token"));
  const [me, setMe] = useState<any>(null);
  const [chats, setChats] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [loadingChats, setLoadingChats] = useState(false);
  const [newChatId, setNewChatId] = useState<number | null>(null);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [notifGranted, setNotifGranted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval>>();
  const pingRef = useRef<ReturnType<typeof setInterval>>();
  const prevUnreadRef = useRef<Record<number, number>>({});

  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
    const handler = (e: any) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const requestNotifications = async () => {
    if (!("Notification" in window)) return;
    const perm = await Notification.requestPermission();
    setNotifGranted(perm === "granted");
  };

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "granted") setNotifGranted(true);
  }, []);

  const notifyNewMessages = useCallback((newChats: any[]) => {
    newChats.forEach(chat => {
      const prev = prevUnreadRef.current[chat.id] ?? 0;
      if (chat.unread > prev && chat.last_message) {
        const soundId = localStorage.getItem("dzchat_sound") || "default";
        playNotificationSound(soundId);
        if (notifGranted && document.visibilityState !== "visible") {
          new Notification(`DzChat — ${chat.name}`, {
            body: chat.last_message.text || "📷 Фото",
            icon: NOTIF_ICON,
            tag: `dzchat-${chat.id}`,
          });
        }
      }
      prevUnreadRef.current[chat.id] = chat.unread;
    });
  }, [notifGranted]);

  const loadChats = useCallback(async (tok: string) => {
    const data = await api("chats", "GET", undefined, tok);
    if (Array.isArray(data)) {
      setChats(data);
      notifyNewMessages(data);
      // обновляем активный чат (онлайн-статус партнёра)
      setActiveChat((prev: any) => {
        if (!prev) return prev;
        const updated = data.find((c: any) => c.id === prev.id);
        return updated || prev;
      });
    }
  }, [notifyNewMessages]);

  useEffect(() => {
    if (!token) return;
    setLoadingChats(true);
    api("me", "GET", undefined, token).then(u => {
      if (u.error) { localStorage.removeItem("dzchat_token"); setToken(null); return; }
      setMe(u);
      loadChats(token).finally(() => setLoadingChats(false));
      pollRef.current = setInterval(() => loadChats(token), 4000);
      // ping каждые 30 секунд для онлайн-статуса
      pingRef.current = setInterval(() => api("ping", "POST", {}, token), 30000);
    });
    return () => { clearInterval(pollRef.current); clearInterval(pingRef.current); };
  }, [token, loadChats]);

  useEffect(() => {
    if (newChatId && chats.length > 0) {
      const chat = chats.find(c => c.id === newChatId);
      if (chat) { setActiveChat(chat); setNewChatId(null); }
    }
  }, [chats, newChatId]);

  const logout = () => {
    localStorage.removeItem("dzchat_token");
    setToken(null); setMe(null); setChats([]); setActiveChat(null);
  };

  const installApp = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") setInstallPrompt(null);
  };

  if (!token || !me) return <DzChatAuth onAuth={(tok, user) => { setToken(tok); setMe(user); }} />;

  const totalUnread = chats.reduce((s, c) => s + (c.unread || 0), 0);

  const filteredChats = searchQuery.trim()
    ? chats.filter(c => c.name?.toLowerCase().includes(searchQuery.toLowerCase()))
    : chats;

  return (
    <div className="h-screen bg-[#0a1929] flex overflow-hidden">

      {/* ── SIDEBAR ── */}
      <div className={`${activeChat ? "hidden md:flex" : "flex"} flex-col w-full md:w-80 lg:w-96 bg-[#111b26] border-r border-white/8 shrink-0`}>

        {/* Sidebar header */}
        <div className="flex items-center justify-between px-3 py-2.5 bg-[#1a2634] border-b border-white/10">
          <button onClick={() => setShowProfile(true)} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity min-w-0">
            <DzChatAvatar name={me.name} url={me.avatar_url} size={38} />
            <div className="text-left hidden sm:block min-w-0">
              <p className="text-white text-sm font-semibold leading-tight truncate">{me.name}</p>
              <p className="text-[#25D366] text-xs">● в сети</p>
            </div>
          </button>
          <div className="flex items-center gap-0.5 shrink-0">
            {installPrompt && (
              <button onClick={installApp} title="Установить приложение"
                className="w-9 h-9 flex items-center justify-center text-[#FFD700] hover:bg-white/10 rounded-full transition-colors">
                <Icon name="Download" size={18} />
              </button>
            )}
            {!notifGranted && "Notification" in window && (
              <button onClick={requestNotifications} title="Уведомления"
                className="w-9 h-9 flex items-center justify-center text-white/40 hover:text-[#25D366] hover:bg-white/10 rounded-full transition-colors">
                <Icon name="Bell" size={18} />
              </button>
            )}
            <button onClick={() => setShowNewGroup(true)} title="Новая группа"
              className="w-9 h-9 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors">
              <Icon name="Users" size={18} />
            </button>
            <button onClick={() => setShowNewChat(true)} title="Новый чат"
              className="w-9 h-9 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors">
              <Icon name="SquarePen" size={19} />
            </button>
            <button onClick={logout} title="Выйти"
              className="w-9 h-9 flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-white/10 rounded-full transition-colors">
              <Icon name="LogOut" size={17} />
            </button>
          </div>
        </div>

        {/* Поиск по чатам */}
        <div className="px-3 py-2 bg-[#111b26] border-b border-white/5">
          <div className="flex items-center gap-2 bg-white/8 rounded-xl px-3 py-1.5">
            <Icon name="Search" size={15} className="text-white/30 shrink-0" />
            <input
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Поиск или начните новый чат"
              className="flex-1 bg-transparent text-white placeholder-white/30 text-sm outline-none"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="text-white/30 hover:text-white">
                <Icon name="X" size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Список чатов */}
        <div className="flex-1 overflow-y-auto">
          {loadingChats && chats.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-white/30">
              <Icon name="Loader" size={24} className="animate-spin" />
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Icon name="MessageSquarePlus" size={40} className="text-white/15 mx-auto mb-3" />
              <p className="text-white/30 text-sm">{searchQuery ? "Не найдено" : "Нет чатов"}</p>
              {!searchQuery && (
                <button onClick={() => setShowNewChat(true)} className="mt-3 text-[#25D366] text-sm">Начать диалог</button>
              )}
            </div>
          ) : filteredChats.map(chat => {
            const isActive = activeChat?.id === chat.id;
            const lm = chat.last_message;
            const isOnline = chat.partner?.is_online;
            return (
              <button key={chat.id} onClick={() => setActiveChat(chat)}
                className={`w-full flex items-center gap-3 px-3 py-3 transition-colors border-b border-white/4 ${isActive ? "bg-[#2a3d52]" : "hover:bg-white/5"}`}>
                <div className="relative shrink-0">
                  <DzChatAvatar name={chat.name || "?"} url={chat.avatar_url} size={50} />
                  {isOnline && chat.type === "direct" && (
                    <span className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-[#25D366] border-2 border-[#111b26] rounded-full" />
                  )}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-white text-sm font-semibold truncate">{chat.name}</p>
                    <div className="flex items-center gap-1 shrink-0">
                      {lm && lm.sender_id === me.id && (
                        lm.is_read
                          ? <Icon name="CheckCheck" size={13} className="text-blue-400" />
                          : <Icon name="CheckCheck" size={13} className="text-white/30" />
                      )}
                      {lm && <p className="text-white/30 text-[11px]">{formatTime(lm.created_at)}</p>}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-1 mt-0.5">
                    <p className="text-white/40 text-xs truncate">
                      {lm?.voice_url ? "🎤 Голосовое" : lm?.photo_url ? "📷 Фото" : lm?.text || "Нет сообщений"}
                    </p>
                    {chat.unread > 0 && (
                      <span className="bg-[#25D366] text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center shrink-0">
                        {chat.unread > 99 ? "99+" : chat.unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Итого непрочитанных */}
        {totalUnread > 0 && (
          <div className="px-4 py-2 bg-[#111b26] border-t border-white/5 text-center">
            <p className="text-[#25D366] text-xs">{totalUnread} непрочитанных</p>
          </div>
        )}
      </div>

      {/* ── CHAT AREA ── */}
      <div className={`${activeChat ? "flex" : "hidden md:flex"} flex-1 flex-col relative`}>
        {activeChat ? (
          <DzChatView
            chat={activeChat}
            me={me}
            token={token}
            onBack={() => setActiveChat(null)}
            onChatUpdate={() => loadChats(token)}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-white/15"
            style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)", backgroundSize: "24px 24px" }}>
            <div className="w-24 h-24 bg-[#25D366]/10 rounded-full flex items-center justify-center mb-6">
              <Icon name="MessageCircle" size={48} className="text-[#25D366]/40" />
            </div>
            <p className="text-white/30 text-xl font-light">DzChat</p>
            <p className="text-white/20 text-sm mt-2">Выберите чат или начните новый</p>
          </div>
        )}
      </div>

      {showNewChat && <NewChatModal token={token} onClose={() => setShowNewChat(false)} onChatCreated={id => { setNewChatId(id); loadChats(token); }} />}
      {showNewGroup && <CreateGroupModal token={token} onClose={() => setShowNewGroup(false)} onCreated={id => { setNewChatId(id); loadChats(token); }} />}
      {showProfile && <ProfileModal me={me} token={token} onClose={() => setShowProfile(false)} onUpdate={u => setMe(u)} />}
    </div>
  );
};

export default DzChat;
