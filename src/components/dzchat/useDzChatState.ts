/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "@/components/dzchat/dzchat.utils";
import { playNotificationSound } from "@/components/dzchat/DzChatModals";
import { loadAndApplyTheme } from "@/components/dzchat/dzchat.theme";

const NOTIF_ICON = "/dzchat-icon.svg";
const POLL_INTERVAL = 2500;   // polling чатов
const PING_INTERVAL = 30000;  // keep-alive
const CALL_POLL_INTERVAL = 3000;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const out = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) out[i] = rawData.charCodeAt(i);
  return out;
}

// Retry fetch /me до 3 раз с паузой — защита от медленной сети при старте PWA
async function fetchMeWithRetry(token: string, attempts = 3, delay = 1500): Promise<any> {
  for (let i = 0; i < attempts; i++) {
    try {
      const u = await api("me", "GET", undefined, token);
      if (u && !u.error) return u;
      if (u?.error === "Unauthorized") return { __unauthorized: true };
      // Любая другая ошибка — ждём и пробуем снова
    } catch (_) { /* сетевой сбой */ }
    if (i < attempts - 1) await new Promise(r => setTimeout(r, delay));
  }
  return null; // все попытки провалились
}

export function useDzChatState() {
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem("dzchat_token") || sessionStorage.getItem("dzchat_token_session")
  );
  const [me, setMe] = useState<any>(null);
  // bootLoading: true пока идёт первая загрузка — чтобы не мигал экран авторизации
  const [bootLoading, setBootLoading] = useState<boolean>(() => {
    const t = localStorage.getItem("dzchat_token") || sessionStorage.getItem("dzchat_token_session");
    return !!t; // если токен есть — показываем лоадер, не Auth экран
  });
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
  const [incomingCall, setIncomingCall] = useState<any>(null);

  const callPollRef = useRef<ReturnType<typeof setInterval>>();
  const pollRef = useRef<ReturnType<typeof setInterval>>();
  const pingRef = useRef<ReturnType<typeof setInterval>>();
  const prevUnreadRef = useRef<Record<number, number>>({});
  const initializedRef = useRef(false);
  const fetchingRef = useRef(false);
  const notifGrantedRef = useRef(false);

  // ── Service Worker ────────────────────────────────────────────
  const sendTokenToSW = useCallback(async (tok: string | null) => {
    if (!("serviceWorker" in navigator)) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      reg.active?.postMessage({ type: tok ? "SET_TOKEN" : "LOGOUT", token: tok });
    } catch (_e) { /* SW not available */ }
  }, []);

  // ── Web Push подписка ─────────────────────────────────────────
  const subscribePush = useCallback(async (tok: string) => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    if (Notification.permission !== "granted") return;
    try {
      const data = await api("vapid_public_key", "GET", undefined, tok);
      if (!data?.ready || !data?.public_key) return;
      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      const sub = existing || await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(data.public_key),
      });
      if (sub) {
        const j = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
        await api("push_subscribe", "POST", { subscription: j, user_agent: navigator.userAgent }, tok);
      }
    } catch (_e) { /* push not supported */ }
  }, []);

  // ── SW регистрация + pushsubscriptionchange ───────────────────
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").then(async (reg) => {
      const tok = localStorage.getItem("dzchat_token");
      if (tok) await sendTokenToSW(tok);

      // Обновление подписки когда она протухает (особенно нужно для Android)
      reg.addEventListener("pushsubscriptionchange" as any, async (event: any) => {
        const tok2 = localStorage.getItem("dzchat_token");
        if (!tok2) return;
        try {
          const newSub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: event.oldSubscription?.options?.applicationServerKey,
          });
          const j = newSub.toJSON() as any;
          await api("push_subscribe", "POST", { subscription: j, user_agent: navigator.userAgent }, tok2);
        } catch (_e) { /* resubscribe failed */ }
      });
    }).catch(() => {});

    const onMsg = (e: MessageEvent) => {
      if (e.data?.type === "PLAY_SOUND") {
        const soundId = localStorage.getItem("dzchat_sound") || "default";
        playNotificationSound(soundId);
        if (localStorage.getItem("dzchat_vibrate") !== "off" && navigator.vibrate) {
          navigator.vibrate([100, 50, 100]);
        }
      }
    };
    navigator.serviceWorker.addEventListener("message", onMsg);
    return () => navigator.serviceWorker.removeEventListener("message", onMsg);
  }, [sendTokenToSW]);

  // ── beforeinstallprompt ───────────────────────────────────────
  useEffect(() => {
    const handler = (e: any) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // ── Уведомления ───────────────────────────────────────────────
  const requestNotifications = useCallback(async () => {
    if (!("Notification" in window)) return;
    const perm = await Notification.requestPermission();
    const granted = perm === "granted";
    setNotifGranted(granted);
    notifGrantedRef.current = granted;
    if (token) sendTokenToSW(token);
    if (granted && token) subscribePush(token);
  }, [token, sendTokenToSW, subscribePush]);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "granted") {
      setNotifGranted(true);
      notifGrantedRef.current = true;
    }
  }, []);

  // ── Уведомления о новых сообщениях ───────────────────────────
  const notifyNewMessages = useCallback((newChats: any[]) => {
    if (!initializedRef.current) {
      newChats.forEach(c => { prevUnreadRef.current[c.id] = c.unread; });
      initializedRef.current = true;
      return;
    }
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
        if (localStorage.getItem("dzchat_vibrate") !== "off" && navigator.vibrate) {
          navigator.vibrate([150, 60, 150]);
        }
        if (notifGrantedRef.current && document.visibilityState !== "visible") {
          try {
            const lm = chat.last_message;
            const body = lm.voice_url ? "🎤 Голосовое"
              : lm.photo_url ? "📷 Фото"
              : lm.video_url ? "🎥 Видео"
              : (lm.text || "Новое сообщение");
            new Notification(`DzChat — ${chat.name}`, {
              body, icon: NOTIF_ICON, badge: NOTIF_ICON,
              tag: `dzchat-${chat.id}`, renotify: true, silent: false,
            });
          } catch (_e) { /* notification not supported */ }
        }
      }
      prevUnreadRef.current[chat.id] = chat.unread;
    });
  }, []);

  // ── Загрузка чатов ────────────────────────────────────────────
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

  // ── Инициализация: загрузка /me с retry ───────────────────────
  useEffect(() => {
    if (!token) {
      setBootLoading(false);
      return;
    }
    initializedRef.current = false;
    fetchingRef.current = false;
    setLoadingChats(true);
    sendTokenToSW(token);

    fetchMeWithRetry(token).then(u => {
      setBootLoading(false);

      if (!u || u.__unauthorized) {
        // Только явный 401 — выкидываем
        localStorage.removeItem("dzchat_token");
        sessionStorage.removeItem("dzchat_token_session");
        setToken(null);
        sendTokenToSW(null);
        setLoadingChats(false);
        return;
      }

      setMe(u);
      loadChats(token).finally(() => setLoadingChats(false));

      pollRef.current = setInterval(() => loadChats(token), POLL_INTERVAL);
      pingRef.current = setInterval(() => api("ping", "POST", {}, token).catch(() => {}), PING_INTERVAL);

      if ("Notification" in window && Notification.permission === "granted") {
        subscribePush(token);
      }

      const pollIncoming = async () => {
        const data = await api("call_status", "GET", undefined, token).catch(() => null);
        if (data?.call && data.call.status === "ringing") {
          setIncomingCall((prev: any) => prev?.id === data.call.id ? prev : data.call);
        }
      };
      callPollRef.current = setInterval(pollIncoming, CALL_POLL_INTERVAL);
    });

    return () => {
      clearInterval(pollRef.current);
      clearInterval(pingRef.current);
      clearInterval(callPollRef.current);
    };
  }, [token, loadChats, sendTokenToSW, subscribePush]);

  // ── Открытие нового чата ──────────────────────────────────────
  useEffect(() => {
    if (newChatId && chats.length > 0) {
      const chat = chats.find(c => c.id === newChatId);
      if (chat) { setActiveChat(chat); setNewChatId(null); }
    }
  }, [chats, newChatId]);

  // ── Сброс badge при открытии чата ────────────────────────────
  useEffect(() => {
    if (activeChat) {
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.ready
          .then(reg => reg.active?.postMessage({ type: "CLEAR_BADGE" }))
          .catch(() => {});
      }
      if ("clearAppBadge" in navigator) (navigator as any).clearAppBadge().catch(() => {});
    }
  }, [activeChat?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Logout ────────────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem("dzchat_token");
    sessionStorage.removeItem("dzchat_token_session");
    sendTokenToSW(null);
    setToken(null); setMe(null); setChats([]); setActiveChat(null);
    setBootLoading(false);
  }, [sendTokenToSW]);

  // ── Установка PWA ─────────────────────────────────────────────
  const installApp = useCallback(async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") setInstallPrompt(null);
  }, [installPrompt]);

  return {
    token, setToken,
    me, setMe,
    bootLoading,
    chats,
    activeChat, setActiveChat,
    showNewChat, setShowNewChat,
    showNewGroup, setShowNewGroup,
    showProfile, setShowProfile,
    loadingChats,
    newChatId, setNewChatId,
    installPrompt,
    notifGranted,
    searchQuery, setSearchQuery,
    theme, setTheme,
    showSetupGuide, setShowSetupGuide,
    incomingCall, setIncomingCall,
    sendTokenToSW,
    requestNotifications,
    loadChats,
    logout,
    installApp,
  };
}