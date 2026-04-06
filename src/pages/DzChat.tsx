/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { api, formatTime } from "@/components/dzchat/dzchat.utils";
import DzChatAvatar from "@/components/dzchat/DzChatAvatar";
import DzChatAuth from "@/components/dzchat/DzChatAuth";
import DzChatView from "@/components/dzchat/DzChatView";
import { NewChatModal, ProfileModal, CreateGroupModal } from "@/components/dzchat/DzChatModals";

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
  const pollRef = useRef<ReturnType<typeof setInterval>>();
  const prevUnreadRef = useRef<Record<number, number>>({});

  // Регистрация SW
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    // PWA install prompt
    const handler = (e: any) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // Запрос уведомлений
  const requestNotifications = async () => {
    if (!("Notification" in window)) return;
    const perm = await Notification.requestPermission();
    setNotifGranted(perm === "granted");
  };

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "granted") setNotifGranted(true);
  }, []);

  // Показ уведомления при новом сообщении
  const notifyNewMessages = useCallback((newChats: any[]) => {
    if (!notifGranted || document.visibilityState === "visible") return;
    newChats.forEach(chat => {
      const prev = prevUnreadRef.current[chat.id] ?? 0;
      if (chat.unread > prev && chat.last_message) {
        new Notification(`DzChat — ${chat.name}`, {
          body: chat.last_message.text || "📷 Фото",
          icon: NOTIF_ICON,
          tag: `dzchat-${chat.id}`,
        });
      }
      prevUnreadRef.current[chat.id] = chat.unread;
    });
  }, [notifGranted]);

  const loadChats = useCallback(async (tok: string) => {
    const data = await api("chats", "GET", undefined, tok);
    if (Array.isArray(data)) {
      setChats(data);
      notifyNewMessages(data);
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
    });
    return () => clearInterval(pollRef.current);
  }, [token, loadChats]);

  useEffect(() => {
    if (newChatId && chats.length > 0) {
      const chat = chats.find(c => c.id === newChatId);
      if (chat) { setActiveChat(chat); setNewChatId(null); }
    }
  }, [chats, newChatId]);

  const logout = () => { localStorage.removeItem("dzchat_token"); setToken(null); setMe(null); setChats([]); setActiveChat(null); };

  const installApp = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") setInstallPrompt(null);
  };

  if (!token || !me) return <DzChatAuth onAuth={(tok, user) => { setToken(tok); setMe(user); }} />;

  const totalUnread = chats.reduce((s, c) => s + (c.unread || 0), 0);

  return (
    <div className="h-screen bg-[#0f1923] flex overflow-hidden">
      {/* SIDEBAR */}
      <div className={`${activeChat ? "hidden md:flex" : "flex"} flex-col w-full md:w-80 lg:w-96 bg-[#1a2634] border-r border-white/10 shrink-0`}>
        {/* Sidebar header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#1a2634] border-b border-white/10">
          <button onClick={() => setShowProfile(true)} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <DzChatAvatar name={me.name} url={me.avatar_url} size={36} />
            <div className="text-left hidden sm:block">
              <p className="text-white text-sm font-semibold leading-none">{me.name}</p>
              <p className="text-white/40 text-xs mt-0.5">DzChat</p>
            </div>
          </button>
          <div className="flex items-center gap-1">
            {installPrompt && (
              <button onClick={installApp} title="Установить приложение"
                className="w-9 h-9 flex items-center justify-center text-[#FFD700] hover:bg-white/10 rounded-full transition-colors">
                <Icon name="Download" size={18} />
              </button>
            )}
            {!notifGranted && "Notification" in window && (
              <button onClick={requestNotifications} title="Включить уведомления"
                className="w-9 h-9 flex items-center justify-center text-white/40 hover:text-[#25D366] hover:bg-white/10 rounded-full transition-colors">
                <Icon name="Bell" size={18} />
              </button>
            )}
            <button onClick={() => setShowNewGroup(true)} title="Новая группа"
              className="w-9 h-9 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-colors">
              <Icon name="Users" size={18} />
            </button>
            <button onClick={() => setShowNewChat(true)} title="Новый чат"
              className="w-9 h-9 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-colors">
              <Icon name="SquarePen" size={20} />
            </button>
            <button onClick={logout}
              className="w-9 h-9 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-colors">
              <Icon name="LogOut" size={18} />
            </button>
          </div>
        </div>

        {/* DzChat brand */}
        <div className="px-4 py-2 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-[#25D366] rounded-md flex items-center justify-center">
              <Icon name="MessageCircle" size={12} className="text-white" />
            </div>
            <span className="text-white/60 text-xs font-medium uppercase tracking-wider">DzChat</span>
            {totalUnread > 0 && <span className="ml-auto bg-[#25D366] text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{totalUnread}</span>}
          </div>
        </div>

        {/* Chat list */}
        <div className="flex-1 overflow-y-auto">
          {loadingChats && chats.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-white/30"><Icon name="Loader" size={24} className="animate-spin" /></div>
          ) : chats.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Icon name="MessageSquarePlus" size={40} className="text-white/20 mx-auto mb-3" />
              <p className="text-white/40 text-sm">Нет чатов</p>
              <button onClick={() => setShowNewChat(true)} className="mt-3 text-[#25D366] text-sm">Начать диалог</button>
            </div>
          ) : chats.map(chat => (
            <button key={chat.id} onClick={() => setActiveChat(chat)}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 ${activeChat?.id === chat.id ? "bg-white/10" : ""}`}>
              <div className="relative shrink-0">
                <DzChatAvatar name={chat.name || "?"} url={chat.avatar_url} size={48} />
                {chat.unread > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#25D366] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {chat.unread > 9 ? "9+" : chat.unread}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between">
                  <p className="text-white text-sm font-semibold truncate">{chat.name}</p>
                  {chat.last_message && <p className="text-white/30 text-xs shrink-0 ml-2">{formatTime(chat.last_message.created_at)}</p>}
                </div>
                <p className="text-white/40 text-xs truncate mt-0.5">
                  {chat.last_message?.text || (chat.last_message?.photo_url ? "📷 Фото" : "Нет сообщений")}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* CHAT AREA */}
      <div className={`${activeChat ? "flex" : "hidden md:flex"} flex-1 flex-col`}>
        {activeChat ? (
          <DzChatView chat={activeChat} me={me} token={token} onBack={() => setActiveChat(null)} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-white/20">
            <Icon name="MessageCircle" size={60} className="mb-4" />
            <p className="text-lg">Выберите чат</p>
            <p className="text-sm mt-1">или начните новый диалог</p>
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
