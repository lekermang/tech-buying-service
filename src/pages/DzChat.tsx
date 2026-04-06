/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { api, formatTime } from "@/components/dzchat/dzchat.utils";
import DzChatAvatar from "@/components/dzchat/DzChatAvatar";
import DzChatAuth from "@/components/dzchat/DzChatAuth";
import DzChatView from "@/components/dzchat/DzChatView";
import { NewChatModal, ProfileModal, CreateGroupModal, playNotificationSound } from "@/components/dzchat/DzChatModals";
import { DzChatInstallBanner, DzChatSetupGuide } from "@/components/dzchat/DzChatInstall";
import { unlockAudio } from "@/components/dzchat/dzchat.sounds";
import { loadAndApplyTheme, getTheme } from "@/components/dzchat/dzchat.theme";

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
  const [theme, setTheme] = useState(() => loadAndApplyTheme());
  const [showSetupGuide, setShowSetupGuide] = useState(false);
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

    // Суммарный unread для Badge API
    const totalUnread = newChats.reduce((sum, c) => sum + (c.unread || 0), 0);
    if ("setAppBadge" in navigator) {
      if (totalUnread > 0) (navigator as any).setAppBadge(totalUnread).catch(() => {});
      else (navigator as any).clearAppBadge().catch(() => {});
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
        // Пуш — только если страница не видима (SW сам показывает если она закрыта)
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
              silent: false,
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

  // При открытии чата — сбрасываем badge
  useEffect(() => {
    if (activeChat) {
      // Сбрасываем бэдж через SW
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.ready.then(reg => {
          reg.active?.postMessage({ type: "CLEAR_BADGE" });
        }).catch(() => {});
      }
      // Сбрасываем бэдж напрямую тоже (на случай если SW не ответил)
      if ("clearAppBadge" in navigator) {
        (navigator as any).clearAppBadge().catch(() => {});
      }
    }
  }, [activeChat?.id]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const isGlass = theme.isGlass;

  return (
    /* Внешняя обёртка — центрирует чат, запрещает растягивание */
    <div className="h-[100dvh] w-full flex items-stretch justify-center overflow-hidden"
      style={{ background: isGlass ? "linear-gradient(135deg,#0a0a2e,#001a0e)" : "#000" }}>

    <div className="flex w-full max-w-[430px] h-[100dvh] overflow-hidden relative"
      style={{ background: isGlass ? "transparent" : theme.bg }}>

      {/* Glass: системный фон просвечивает насквозь */}
      {isGlass && (
        <div className="absolute inset-0 -z-10"
          style={{ background: "linear-gradient(135deg, #0a0a2e 0%, #001a0e 50%, #0a0a2e 100%)" }} />
      )}

      {/* ── SIDEBAR ── */}
      <div
        className={`${activeChat ? "hidden" : "flex"} flex-col w-full shrink-0 border-r ${isGlass ? "dz-glass" : ""}`}
        style={{ background: theme.sidebar, borderColor: theme.border }}>

        {/* Header */}
        <div className={`flex items-center justify-between px-3 py-2.5 border-b safe-top ${isGlass ? "dz-glass" : ""}`}
          style={{ background: theme.sidebarHeader, borderColor: theme.border }}>
          <button onClick={() => { unlockAudio(); setShowProfile(true); }}
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
              <button onClick={requestNotifications} title="Разрешить уведомления"
                className="w-8 h-8 flex items-center justify-center text-yellow-400 hover:bg-white/10 rounded-full">
                <Icon name="Bell" size={17} />
              </button>
            ) : null}
            <button onClick={() => setShowNewGroup(true)}
              className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors"
              style={{ color: theme.textMuted }}>
              <Icon name="Users" size={17} />
            </button>
            <button onClick={() => setShowNewChat(true)}
              className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors"
              style={{ color: theme.textMuted }}>
              <Icon name="SquarePen" size={17} />
            </button>
            <button onClick={() => { unlockAudio(); setShowProfile(true); }}
              className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors"
              style={{ color: theme.textMuted }}>
              <Icon name="Settings" size={17} />
            </button>
          </div>
        </div>

        {/* PWA баннер */}
        <DzChatInstallBanner installPrompt={installPrompt} onInstall={installApp} onOpenGuide={() => setShowSetupGuide(true)} />

        {/* Поиск */}
        <div className="px-3 py-2 border-b" style={{ background: theme.sidebar, borderColor: theme.border }}>
          <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: "rgba(255,255,255,0.07)" }}>
            <Icon name="Search" size={15} className="shrink-0" style={{ color: theme.textMuted } as any} />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Поиск чатов..."
              className="flex-1 bg-transparent text-sm outline-none min-w-0 placeholder-white/30"
              style={{ color: theme.text }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="shrink-0" style={{ color: theme.textMuted }}>
                <Icon name="X" size={14} />
              </button>
            )}
            <button onClick={() => setShowNewChat(true)} style={{ color: theme.accent }}>
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
                <button onClick={() => setShowNewChat(true)}
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
            return (
              <button key={chat.id} onClick={() => setActiveChat(chat)}
                className="w-full flex items-center gap-3 px-3 py-3 transition-colors border-b active:bg-white/10"
                style={{
                  background: isActive ? (theme.accent + "20") : "transparent",
                  borderColor: theme.border,
                }}>
                <div className="relative shrink-0">
                  <DzChatAvatar name={chat.name || "?"} url={chat.avatar_url} size={48} />
                  {isOnline && chat.type === "direct" && (
                    <span className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full border-2"
                      style={{ background: theme.accent, borderColor: theme.sidebar }} />
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
                  <p className="text-xs truncate mt-0.5" style={{ color: theme.textMuted }}>
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

        {totalUnread > 0 && (
          <div className="px-4 py-1.5 border-t text-center safe-bottom"
            style={{ background: theme.sidebar, borderColor: theme.border }}>
            <p className="text-xs" style={{ color: theme.accent }}>{totalUnread} непрочитанных</p>
          </div>
        )}
      </div>

      {/* ── CHAT AREA ── */}
      <div className={`${activeChat ? "flex" : "hidden"} flex-1 flex-col relative overflow-hidden ${isGlass ? "dz-glass" : ""}`}
        style={{ background: theme.chatBg }}>
        {activeChat ? (
          <DzChatView
            chat={activeChat}
            me={me}
            token={token}
            theme={theme}
            onBack={() => setActiveChat(null)}
            onChatUpdate={() => loadChats(token)}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center"
            style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.025) 1px, transparent 0)", backgroundSize: "24px 24px" }}>
            <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
              style={{ background: theme.accent + "18" }}>
              <Icon name="MessageCircle" size={48} style={{ color: theme.accent + "55" } as any} />
            </div>
            <p className="text-xl font-light" style={{ color: theme.textMuted }}>DzChat</p>
            <p className="text-sm mt-2" style={{ color: theme.textMuted + "99" }}>Выберите чат или начните новый</p>
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
          onThemeChange={() => setTheme(getTheme(localStorage.getItem("dzchat_theme") ?? "dark"))}
          onOpenSetupGuide={() => { setShowProfile(false); setShowSetupGuide(true); }}
        />
      )}

      {/* Экран установки и уведомлений */}
      {showSetupGuide && (
        <div className="absolute inset-0 z-[70] flex flex-col" style={{ background: theme.bg }}>
          <div className="flex items-center gap-2 px-3 py-3 border-b" style={{ background: theme.sidebarHeader, borderColor: theme.border }}>
            <button onClick={() => setShowSetupGuide(false)}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
              style={{ color: theme.textMuted }}>
              <Icon name="ArrowLeft" size={20} />
            </button>
            <p className="text-white font-semibold text-sm flex-1">Установка и уведомления</p>
          </div>
          <div className="flex-1 overflow-hidden">
            <DzChatSetupGuide installPrompt={installPrompt} onInstall={installApp} />
          </div>
        </div>
      )}
    </div>
    </div>
  );
};

export default DzChat;