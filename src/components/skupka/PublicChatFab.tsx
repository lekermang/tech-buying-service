import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";

const PUBLIC_CHAT_URL = "https://functions.poehali.dev/81f2b98f-4c02-4f5a-afce-adf94d25dcac";

const LS_AUTH = "pchat_auth";
const LS_ROOM = "pchat_room";
const LS_LAST_SEEN = "pchat_last_seen_id";

/**
 * Плавающая кнопка «Чат» внизу-справа.
 * Показывается ТОЛЬКО если в localStorage уже есть pchat_auth (т.е. клиента приглашали).
 */
export default function PublicChatFab() {
  const [visible, setVisible] = useState(false);
  const [unread, setUnread] = useState(false);

  useEffect(() => {
    const auth = localStorage.getItem(LS_AUTH);
    const room = localStorage.getItem(LS_ROOM);
    if (auth && room) setVisible(true);
  }, []);

  // Опционально проверяем новые сообщения раз в минуту
  useEffect(() => {
    if (!visible) return;
    const auth = localStorage.getItem(LS_AUTH);
    const room = localStorage.getItem(LS_ROOM);
    if (!auth || !room) return;

    let cancelled = false;

    const check = async () => {
      try {
        const since = parseInt(localStorage.getItem(LS_LAST_SEEN) || "0", 10) || 0;
        const r = await fetch(
          `${PUBLIC_CHAT_URL}?action=poll&room_id=${room}&since=${since}`,
          { headers: { "X-Auth-Token": auth } }
        );
        if (!r.ok || cancelled) return;
        const d = await r.json();
        if (d && Array.isArray(d.messages) && d.messages.length > 0) {
          const newest = d.messages
            .filter((m: { author_type?: string }) => m.author_type !== "client")
            .pop();
          if (newest) setUnread(true);
        }
      } catch {
        /* ignore */
      }
    };

    check();
    const id = setInterval(check, 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [visible]);

  if (!visible) return null;
  if (window.location.pathname === "/chat") return null;

  return (
    <a
      href="/chat"
      aria-label="Чат с менеджером"
      className="fixed z-[60] right-4 bottom-[84px] md:bottom-6 w-14 h-14 rounded-full bg-[#FFD700] text-black flex items-center justify-center shadow-[0_8px_24px_rgba(255,215,0,0.35)] hover:bg-yellow-400 active:scale-95 transition-all"
    >
      <Icon name="MessageSquare" size={24} />
      {unread && (
        <span className="absolute top-1 right-1 w-3 h-3 rounded-full bg-red-500 border-2 border-[#0D0D0D]" />
      )}
    </a>
  );
}
