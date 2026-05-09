import React from "react";
import Icon from "@/components/ui/icon";

const PUBLIC_CHAT_URL = "https://functions.poehali.dev/db114166-21ce-4b87-9d05-59286ee73d6e";
const LS_KEY = "live_alert_seen_v1";

type Props = {
  token: string;
  isLiveOpen: boolean;
  onOpenLive: () => void;
};

type ClientMsg = {
  id: number;
  room_id: number;
  room_title: string;
  room_type: string;
  author_name: string;
  text: string | null;
  photo_url: string | null;
  created_at: string;
};

const playPing = () => {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = 720;
    g.gain.value = 0.06;
    o.connect(g); g.connect(ctx.destination);
    o.start();
    o.frequency.exponentialRampToValueAtTime(960, ctx.currentTime + 0.15);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45);
    o.stop(ctx.currentTime + 0.45);
  } catch { /* */ }
};

export default function LiveChatWatcher({ token, isLiveOpen, onOpenLive }: Props) {
  const [toasts, setToasts] = React.useState<ClientMsg[]>([]);
  const seenIdsRef = React.useRef<Set<number>>(new Set(JSON.parse(localStorage.getItem(LS_KEY) || "[]")));
  const initializedRef = React.useRef(false);

  React.useEffect(() => {
    if (isLiveOpen) setToasts([]);
  }, [isLiveOpen]);

  const poll = React.useCallback(async () => {
    if (!token) return;
    if (typeof document !== "undefined" && document.hidden) return;
    if (isLiveOpen) return;
    try {
      const r = await fetch(`${PUBLIC_CHAT_URL}?action=staff_rooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Employee-Token": token },
        body: "{}",
      });
      const d = await r.json();
      if (!d.ok) return;
      // Для каждой комнаты с unread > 0 — подгружаем последние сообщения
      type RoomItem = { id: number; type: string; title: string; unread?: number };
      const rooms = (d.rooms || []) as RoomItem[];
      const fresh: ClientMsg[] = [];
      for (const room of rooms.filter(x => (x.unread || 0) > 0)) {
        const rr = await fetch(`${PUBLIC_CHAT_URL}?action=staff_poll`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Employee-Token": token },
          body: JSON.stringify({ room_id: room.id, after_id: -1, limit: 5 }),
        });
        const rd = await rr.json();
        if (!rd.ok) continue;
        type SrvMsg = { id: number; author_type: string; author_name: string; text: string | null; photo_url: string | null; created_at: string };
        const msgs = (rd.messages || []) as SrvMsg[];
        for (const m of msgs) {
          if (m.author_type !== "client") continue;
          if (seenIdsRef.current.has(m.id)) continue;
          seenIdsRef.current.add(m.id);
          fresh.push({
            id: m.id, room_id: room.id, room_title: room.title || "Live",
            room_type: room.type, author_name: m.author_name,
            text: m.text, photo_url: m.photo_url, created_at: m.created_at,
          });
        }
      }
      if (!initializedRef.current) {
        initializedRef.current = true;
        // На первой инициализации не показываем тосты — только запоминаем
        try {
          const arr = Array.from(seenIdsRef.current).slice(-300);
          localStorage.setItem(LS_KEY, JSON.stringify(arr));
        } catch { /* */ }
        return;
      }
      if (fresh.length) {
        setToasts(prev => [...prev, ...fresh].slice(-4));
        playPing();
        try {
          const arr = Array.from(seenIdsRef.current).slice(-300);
          localStorage.setItem(LS_KEY, JSON.stringify(arr));
        } catch { /* */ }
        try {
          if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            for (const m of fresh.slice(-2)) {
              new Notification(`💬 Live: ${m.author_name}`, {
                body: (m.text || "📷 Фото").slice(0, 200),
                tag: `live-${m.id}`,
              });
            }
          }
        } catch { /* */ }
      }
    } catch { /* */ }
  }, [token, isLiveOpen]);

  React.useEffect(() => {
    poll();
    const id = setInterval(poll, 10000);
    return () => clearInterval(id);
  }, [poll]);

  if (toasts.length === 0) return null;

  const dismiss = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));
  const handleOpen = () => { onOpenLive(); setToasts([]); };

  return (
    <div className="fixed bottom-20 sm:bottom-6 left-3 sm:left-6 z-[195] flex flex-col gap-2 max-w-sm w-[calc(100vw-24px)] sm:w-[340px] pointer-events-none">
      {toasts.slice(-3).map(m => (
        <div key={m.id} className="pointer-events-auto rounded-xl border-2 border-emerald-400/60 bg-gradient-to-br from-emerald-600 to-teal-700 shadow-2xl shadow-emerald-500/30 text-white p-3 animate-in slide-in-from-bottom-2 fade-in duration-200">
          <div className="flex items-start gap-2">
            <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center text-sm font-bold shrink-0">
              {(m.author_name || "?").charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm truncate">{m.author_name}</span>
                <span className="ml-auto text-[9px] uppercase tracking-wider bg-white/15 px-1.5 py-0.5 rounded">{m.room_type === "public" ? "Live" : "Личка"}</span>
              </div>
              <div className="text-sm mt-0.5 line-clamp-2">{m.text || "📷 Фото"}</div>
            </div>
            <button onClick={() => dismiss(m.id)} className="opacity-70 hover:opacity-100 shrink-0">
              <Icon name="X" size={14} />
            </button>
          </div>
          <button onClick={handleOpen} className="mt-2 w-full bg-white/20 hover:bg-white/30 text-white rounded text-[11px] font-bold py-1.5 active:scale-95">
            <Icon name="Radio" size={11} className="inline mr-1" />
            Открыть Live
          </button>
        </div>
      ))}
    </div>
  );
}
