/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { api, formatTime } from "@/components/dzchat/dzchat.utils";
import DzChatAvatar from "@/components/dzchat/DzChatAvatar";
import DzChatAuth from "@/components/dzchat/DzChatAuth";
import DzChatView from "@/components/dzchat/DzChatView";
import { NewChatModal, ProfileModal, CreateGroupModal, playNotificationSound } from "@/components/dzchat/DzChatModals";
import { DzChatInstallBanner } from "@/components/dzchat/DzChatInstall";

const NOTIF_ICON = "/dzchat-icon.svg";

const DzChat = () => {
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem("dzchat_token") || sessionStorage.getItem("dzchat_token_session")
  );
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
  const initializedRef = useRef(false);
  const fetchingRef = useRef(false);
  const notifGrantedRef = useRef(false);

  // ── Service Worker ────────────────────────────────────────────
  const sendTokenToSW = async (tok: string | null) => {
    if (!("serviceWorker" in navigator)) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      reg.active?.postMessage({ type: tok ? "SET_TOKEN" : "LOGOUT", token: tok });
    } catch (_e) { /* SW not available */ }
  };

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").then(async () => {
      const tok = localStorage.getItem("dzchat_token");
      if (tok) await sendTokenToSW(tok);
    }).catch(() => {});
    const onMsg = (e: MessageEvent) => {
      if (e.data?.type === "PLAY_SOUND") {
        const soundId = localStorage.getItem("dzchat_sound") || "default";
        playNotificationSound(soundId);
        // Вибрация при новом сообщении (мобайл)
        if (localStorage.getItem("dzchat_vibrate") !== "off" && navigator.vibrate) {
          navigator.vibrate([100, 50, 100]);
        }
      }
    };
    navigator.serviceWorker.addEventListener("message", onMsg);
    return () => navigator.serviceWorker.removeEventListener("message", onMsg);
  }, []);

  useEffect(() => {
    const handler = (e: any) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // ── Уведомления ───────────────────────────────────────────────
  const requestNotifications = async () => {
    if (!("Notification" in window)) return;
    const perm = await Notification.requestPermission();
    const granted = perm === "granted";
    setNotifGranted(granted);
    notifGrantedRef.current = granted;
    sendTokenToSW(token); // заново посылаем токен чтобы SW знал о разрешении
  };

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "granted") {
      setNotifGranted(true);
      notifGrantedRef.current = true;
    }
  }, []);

  const notifyNewMessages = useCallback((newChats: any[]) => {
    if (!initializedRef.current) {
      newChats.forEach(c => { prevUnreadRef.current[c.id] = c.unread; });
      initializedRef.current = true;
      return;
    }
    newChats.forEach(chat => {
      const prev = prevUnreadRef.current[chat.id] ?? 0;
      if (chat.unread > prev && chat.last_message) {
        const soundId = localStorage.getItem("dzchat_sound") || "default";
        playNotificationSound(soundId);
        // Вибрация (мобайл)
        if (localStorage.getItem("dzchat_vibrate") !== "off" && navigator.vibrate) {
          navigator.vibrate([150, 60, 150]);
        }
        // Пуш с именем отправителя и текстом
        if (notifGrantedRef.current && document.visibilityState !== "visible") {
          try {
            const lm = chat.last_message;
            const body = lm.voice_url ? "🎤 Голосовое сообщение"
              : lm.photo_url ? "📷 Фото"
              : lm.video_url ? "🎥 Видео"
              : (lm.text || "Новое сообщение");
            new Notification(`DzChat — ${chat.name}`, {
              body,
              icon: NOTIF_ICON,
              badge: NOTIF_ICON,
              tag: `dzchat-${chat.id}`,
              renotify: true,
              silent: true,
            });
          } catch (_e) { /* not supported */ }
        }
      }
      prevUnreadRef.current[chat.id] = chat.unread;
    });
  }, []);

  const loadChats = useCallback(async (tok: string) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      const data = await api("chats", "GET", undefined, tok);
      if (Array.isArray(data)) {
        setChats(data);
        notifyNewMessages(data);
        setActiveChat((prev: any) => {
          if (!prev) return prev;
          return data.find((c: any) => c.id === prev.id) || prev;
        });
      }
    } finally {
      fetchingRef.current = false;
    }
  }, [notifyNewMessages]);

  useEffect(() => {
    if (!token) return;
    initializedRef.current = false;
    fetchingRef.current = false;
    setLoadingChats(true);
    sendTokenToSW(token);
    api("me", "GET", undefined, token).then(u => {
      if (u.error) { localStorage.removeItem("dzchat_token"); setToken(null); sendTokenToSW(null); return; }
      setMe(u);
      loadChats(token).finally(() => setLoadingChats(false));
      pollRef.current = setInterval(() => loadChats(token), 1500);
      pingRef.current = setInterval(() => api("ping", "POST", {}, token), 20000);
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
    sendTokenToSW(null);
    setToken(null); setMe(null); setChats([]); setActiveChat(null);
  };

  const installApp = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") setInstallPrompt(null);
  };

  if (!token || !me) return <DzChatAuth onAuth={(tok, user) => { sendTokenToSW(tok); setToken(tok); setMe(user); }} />;

  const totalUnread = chats.reduce((s, c) => s + (c.unread || 0), 0);
  const filteredChats = searchQuery.trim()
    ? chats.filter(c => c.name?.toLowerCase().includes(searchQuery.toLowerCase()))
    : chats;

  return (
    <div className="h-[100dvh] bg-[#0a1929] flex overflow-hidden">

      {/* ── SIDEBAR ── */}
      <div className={`${activeChat ? "hidden md:flex" : "flex"} flex-col w-full md:w-80 lg:w-96 bg-[#111b26] border-r border-white/8 shrink-0`}>

        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2.5 bg-[#1a2634] border-b border-white/10 safe-top">
          <button onClick={() => setShowProfile(true)}
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity min-w-0 flex-1">
            {/* Аватар всегда виден на мобайле */}
            <div className="shrink-0">
              <DzChatAvatar name={me.name || "?"} url={me.avatar_url} size={38} />
            </div>
            <div className="text-left min-w-0 flex-1">
              <p className="text-white text-sm font-semibold leading-tight truncate">{me.name}</p>
              <p className="text-[#25D366] text-xs">● в сети</p>
            </div>
          </button>

          {/* Кнопки действий */}
          <div className="flex items-center gap-0.5 shrink-0 ml-1">
            {/* Уведомления */}
            {notifGranted ? (
              <div className="w-8 h-8 flex items-center justify-center text-[#25D366]/50">
                <Icon name="BellRing" size={16} />
              </div>
            ) : "Notification" in window ? (
              <button onClick={requestNotifications}
                title="Разрешить уведомления"
                className="w-8 h-8 flex items-center justify-center text-yellow-400 hover:bg-white/10 rounded-full">
                <Icon name="Bell" size={17} />
              </button>
            ) : null}
            {/* Новая группа */}
            <button onClick={() => setShowNewGroup(true)}
              className="w-8 h-8 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 rounded-full">
              <Icon name="Users" size={17} />
            </button>
            {/* Новый чат */}
            <button onClick={() => setShowNewChat(true)}
              className="w-8 h-8 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 rounded-full">
              <Icon name="SquarePen" size={17} />
            </button>
            {/* Настройки */}
            <button onClick={() => setShowProfile(true)}
              className="w-8 h-8 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 rounded-full">
              <Icon name="Settings" size={17} />
            </button>
          </div>
        </div>

        {/* PWA баннер */}
        <DzChatInstallBanner installPrompt={installPrompt} onInstall={installApp} />

        {/* Поиск */}
        <div className="px-3 py-2 bg-[#111b26] border-b border-white/5">
          <div className="flex items-center gap-2 bg-white/8 rounded-xl px-3 py-2">
            <Icon name="Search" size={15} className="text-white/30 shrink-0" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Поиск чатов..."
              className="flex-1 bg-transparent text-white placeholder-white/30 text-sm outline-none min-w-0"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="text-white/30 hover:text-white shrink-0">
                <Icon name="X" size={14} />
              </button>
            )}
            {/* Кнопка нового чата прямо в поиске */}
            <button onClick={() => setShowNewChat(true)}
              className="shrink-0 text-[#25D366] hover:text-[#1da851]">
              <Icon name="UserPlus" size={16} />
            </button>
          </div>
        </div>

        {/* Список чатов */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {loadingChats && chats.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-white/30">
              <Icon name="Loader" size={28} className="animate-spin" />
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-16 h-16 bg-[#25D366]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Icon name="MessageSquarePlus" size={32} className="text-[#25D366]/40" />
              </div>
              <p className="text-white/30 text-sm">{searchQuery ? "Не найдено" : "Нет чатов"}</p>
              {!searchQuery && (
                <button onClick={() => setShowNewChat(true)}
                  className="mt-4 bg-[#25D366] text-white text-sm px-5 py-2.5 rounded-xl font-medium">
                  Начать диалог
                </button>
              )}
            </div>
          ) : filteredChats.map(chat => {
            const isActive = activeChat?.id === chat.id;
            const lm = chat.last_message;
            const isOnline = chat.partner?.is_online;
            return (
              <button key={chat.id} onClick={() => setActiveChat(chat)}
                className={`w-full flex items-center gap-3 px-3 py-3 transition-colors border-b border-white/4 active:bg-white/10 ${isActive ? "bg-[#2a3d52]" : "hover:bg-white/5"}`}>
                <div className="relative shrink-0">
                  <DzChatAvatar name={chat.name || "?"} url={chat.avatar_url} size={48} />
                  {isOnline && chat.type === "direct" && (
                    <span className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-[#25D366] border-2 border-[#111b26] rounded-full" />
                  )}
                  {chat.unread > 0 && (
                    <span className="absolute -top-1 -right-1 bg-[#25D366] text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center">
                      {chat.unread > 99 ? "99+" : chat.unread}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-white text-sm font-semibold truncate">{chat.name}</p>
                    <div className="flex items-center gap-1 shrink-0">
                      {lm?.sender_id === me.id && (
                        lm.is_read
                          ? <Icon name="CheckCheck" size={12} className="text-blue-400" />
                          : <Icon name="CheckCheck" size={12} className="text-white/30" />
                      )}
                      {lm && <p className="text-white/30 text-[10px]">{formatTime(lm.created_at)}</p>}
                    </div>
                  </div>
                  <p className="text-white/40 text-xs truncate mt-0.5">
                    {lm?.voice_url ? "🎤 Голосовое"
                      : lm?.video_url ? "🎥 Видео"
                      : lm?.photo_url ? "📷 Фото"
                      : lm?.text || "Нет сообщений"}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Непрочитанные */}
        {totalUnread > 0 && (
          <div className="px-4 py-1.5 bg-[#111b26] border-t border-white/5 text-center safe-bottom">
            <p className="text-[#25D366] text-xs">{totalUnread} непрочитанных</p>
          </div>
        )}
      </div>

      {/* ── CHAT AREA ── */}
      <div className={`${activeChat ? "flex" : "hidden md:flex"} flex-1 flex-col relative overflow-hidden md:border md:border-white/5 md:rounded-2xl md:m-2`}>
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

      {showNewChat && <NewChatModal token={token} chats={chats} onClose={() => setShowNewChat(false)} onChatCreated={id => { setNewChatId(id); loadChats(token); }} />}
      {showNewGroup && <CreateGroupModal token={token} onClose={() => setShowNewGroup(false)} onCreated={id => { setNewChatId(id); loadChats(token); }} />}
      {showProfile && (
        <ProfileModal
          me={me} token={token}
          onClose={() => setShowProfile(false)}
          onUpdate={u => setMe(u)}
          onLogout={() => { setShowProfile(false); logout(); }}
          onSwitchAccount={() => { setShowProfile(false); logout(); }}
        />
      )}
    </div>
  );
};

export default DzChat;