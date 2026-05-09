import React from "react";
import Icon from "@/components/ui/icon";
import { VIP_CHAT_URL, type Message } from "../vipChat/types";

const LS_LAST_SEEN = "chat_alert_last_seen_id";

type Props = {
  token: string;
  isChatOpen: boolean;            // открыт ли таб "Чат" сейчас
  onOpenChat: () => void;         // переключить на таб чата
};

const playPing = () => {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = 1040;
    g.gain.value = 0.05;
    o.connect(g); g.connect(ctx.destination);
    o.start();
    o.frequency.exponentialRampToValueAtTime(1480, ctx.currentTime + 0.12);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
    o.stop(ctx.currentTime + 0.4);
  } catch { /* */ }
};

const fmtTime = (iso: string) => {
  try {
    return new Date(iso).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  } catch { return ""; }
};

export default function ChatAlertWatcher({ token, isChatOpen, onOpenChat }: Props) {
  const [toasts, setToasts] = React.useState<Message[]>([]);
  const lastSeenIdRef = React.useRef<number>(parseInt(localStorage.getItem(LS_LAST_SEEN) || "0", 10) || 0);
  const initializedRef = React.useRef<boolean>(false);

  // Когда чат открыт — обнуляем счётчик «не показанных»: следующие сообщения будут считаться прочитанными
  React.useEffect(() => {
    if (isChatOpen) {
      setToasts([]);
    }
  }, [isChatOpen]);

  const poll = React.useCallback(async () => {
    if (!token) return;
    if (typeof document !== "undefined" && document.hidden) return;
    if (isChatOpen) return; // не дублируем уведомления когда юзер уже в чате
    try {
      const after = lastSeenIdRef.current || -1;
      const r = await fetch(VIP_CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Employee-Token": token },
        body: JSON.stringify({ action: "poll", after_id: after, limit: 20 }),
      });
      if (!r.ok) return;
      const d: { messages?: Message[]; max_id?: number; me?: { id: number } } = await r.json();
      const myId = d?.me?.id;
      const msgs = d.messages || [];
      // На первой инициализации — если ничего не прочитано, начинаем с max_id (не показываем "историю")
      if (!initializedRef.current) {
        initializedRef.current = true;
        if (lastSeenIdRef.current === 0 && d.max_id) {
          lastSeenIdRef.current = d.max_id;
          localStorage.setItem(LS_LAST_SEEN, String(d.max_id));
        }
        return;
      }
      // Сообщения от других сотрудников
      const fresh = msgs.filter(m => m.id > lastSeenIdRef.current && m.employee_id !== myId);
      if (fresh.length > 0) {
        setToasts(prev => [...prev, ...fresh].slice(-5));
        playPing();
        try {
          if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            for (const m of fresh.slice(-2)) {
              const body = m.text ? m.text : (m.photo_url ? "📷 Фото" : "");
              new Notification(`💬 ${m.full_name}`, { body, tag: `chat-${m.id}` });
            }
          }
        } catch { /* */ }
      }
      if (d.max_id && d.max_id > lastSeenIdRef.current) {
        lastSeenIdRef.current = d.max_id;
        localStorage.setItem(LS_LAST_SEEN, String(d.max_id));
      }
    } catch { /* */ }
  }, [token, isChatOpen]);

  React.useEffect(() => {
    poll();
    const id = setInterval(poll, 8000);
    return () => clearInterval(id);
  }, [poll]);

  const dismiss = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));

  const openChatFromToast = (id: number) => {
    dismiss(id);
    onOpenChat();
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 sm:left-auto sm:right-6 sm:top-24 sm:translate-x-0 z-[195] flex flex-col gap-2 max-w-sm w-[calc(100vw-24px)] sm:w-[360px] pointer-events-none">
      {toasts.slice(-3).map(m => (
        <div
          key={m.id}
          className="pointer-events-auto rounded-xl border-2 border-blue-400/60 bg-gradient-to-br from-blue-600 to-indigo-700 shadow-2xl shadow-blue-500/30 text-white p-3 animate-in slide-in-from-top-2 fade-in duration-200"
        >
          <div className="flex items-start gap-2">
            <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center text-base font-bold shrink-0 overflow-hidden">
              {m.avatar_url
                ? <img src={m.avatar_url} alt="" className="w-full h-full object-cover" />
                : <span>{(m.full_name || "?").charAt(0).toUpperCase()}</span>
              }
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm truncate">{m.full_name}</span>
                <span className="text-[10px] opacity-70">{fmtTime(m.created_at)}</span>
                <span className="ml-auto text-[9px] uppercase tracking-wider bg-white/15 px-1.5 py-0.5 rounded">Чат</span>
              </div>
              <div className="text-sm mt-0.5 line-clamp-2">
                {m.text || (m.photo_url ? "📷 Фото" : "")}
              </div>
              {m.photo_url && (
                <img src={m.photo_url} alt="" className="mt-1.5 max-h-32 rounded-lg object-cover w-full" />
              )}
            </div>
            <button onClick={() => dismiss(m.id)} className="opacity-70 hover:opacity-100 shrink-0">
              <Icon name="X" size={14} />
            </button>
          </div>
          <button
            onClick={() => openChatFromToast(m.id)}
            className="mt-2 w-full bg-white/20 hover:bg-white/30 text-white rounded text-[11px] font-bold py-1.5 active:scale-95"
          >
            <Icon name="MessageCircle" size={11} className="inline mr-1" />
            Открыть чат
          </button>
        </div>
      ))}
    </div>
  );
}
