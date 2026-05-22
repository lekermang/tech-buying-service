import { useEffect, useRef, useState, useCallback } from "react";
import Icon from "@/components/ui/icon";
import funcUrls from "../../../backend/func2url.json";
import EnableNotificationsBanner from "./EnableNotificationsBanner";

const VIP_CHAT_URL = (funcUrls as Record<string, string>)["vip-chat"];

type Msg = {
  id: number;
  author_id: number;
  author_name: string;
  author_avatar: string | null;
  text: string | null;
  photo_url: string | null;
  created_at: string;
};

type Participant = {
  id: number;
  full_name: string;
  avatar_url: string | null;
  role: string;
  last_seen_at: string | null;
};

type PollResp = {
  messages: Msg[];
  participants: Participant[];
  me: { id: number };
  last_id: number;
};

export default function VipChatTab({ token }: { token: string }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [meId, setMeId] = useState<number | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastIdRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const apiCall = useCallback(async (action: string, body: Record<string, unknown> = {}) => {
    const r = await fetch(VIP_CHAT_URL, {
      method: "POST",
      headers: { "X-Employee-Token": token, "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...body }),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  }, [token]);

  const poll = useCallback(async () => {
    try {
      const d: PollResp = await apiCall("poll", { last_id: lastIdRef.current });
      if (d.me?.id) setMeId(d.me.id);
      if (d.participants) setParticipants(d.participants);
      if (Array.isArray(d.messages) && d.messages.length > 0) {
        setMessages((prev) => {
          const ids = new Set(prev.map((m) => m.id));
          const fresh = d.messages.filter((m) => !ids.has(m.id));
          if (fresh.length === 0) return prev;
          const next = [...prev, ...fresh];
          lastIdRef.current = Math.max(lastIdRef.current, ...fresh.map((m) => m.id));
          return next;
        });
        // отметить прочитанным
        const lastId = d.messages[d.messages.length - 1].id;
        await apiCall("mark_read", { last_id: lastId }).catch(() => {});
      } else if (d.last_id) {
        lastIdRef.current = Math.max(lastIdRef.current, d.last_id);
      }
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  // первая загрузка + poll каждые 4 сек
  useEffect(() => {
    poll();
    const id = setInterval(poll, 4000);
    return () => clearInterval(id);
  }, [poll]);

  // автоскролл вниз при новых сообщениях
  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length]);

  const send = async () => {
    const t = text.trim();
    if (!t || sending) return;
    setSending(true);
    try {
      await apiCall("send", { text: t });
      setText("");
      await poll();
    } catch (e) {
      setError("Не удалось отправить: " + (e as Error).message);
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="p-3 flex flex-col h-[calc(100dvh-180px)] gap-3">
      <EnableNotificationsBanner token={token} />

      <div className="flex items-center gap-2 px-1">
        <Icon name="MessagesSquare" size={16} className="text-[#FFD700]" />
        <div className="font-oswald font-bold text-white uppercase tracking-wider text-sm">Чат команды</div>
        <span className="ml-auto text-[10px] text-white/45">
          {participants.length > 0 ? `${participants.length} участников` : ""}
        </span>
      </div>

      {error && (
        <div className="px-3 py-2 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 text-xs flex items-center gap-2">
          <Icon name="AlertCircle" size={14} />
          {error}
        </div>
      )}

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto bg-gradient-to-br from-[#0E0E0E] to-[#080808] border border-[#1F1F1F] rounded-xl p-3 space-y-2"
      >
        {loading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-14 gap-2 text-white/40">
            <Icon name="Loader" size={20} className="animate-spin text-[#FFD700]" />
            <span className="text-xs">Загружаю переписку…</span>
          </div>
        )}
        {!loading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-14 gap-2 text-white/40">
            <Icon name="MessagesSquare" size={24} className="text-white/20" />
            <span className="text-xs">Пока сообщений нет. Напиши первым!</span>
          </div>
        )}
        {messages.map((m) => {
          const mine = meId === m.author_id;
          return (
            <div key={m.id} className={`flex gap-2 ${mine ? "flex-row-reverse" : ""}`}>
              <div className="w-7 h-7 rounded-full bg-[#FFD700]/15 border border-[#FFD700]/30 flex items-center justify-center text-[10px] text-[#FFD700] font-bold shrink-0 overflow-hidden">
                {m.author_avatar ? (
                  <img src={m.author_avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  (m.author_name || "?").slice(0, 1).toUpperCase()
                )}
              </div>
              <div className={`max-w-[80%] ${mine ? "items-end" : "items-start"} flex flex-col`}>
                <div className={`text-[10px] text-white/45 px-2 ${mine ? "text-right" : ""}`}>
                  {m.author_name} · {new Date(m.created_at).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                </div>
                <div className={`px-3 py-1.5 rounded-2xl text-[13px] leading-snug whitespace-pre-wrap break-words ${
                  mine
                    ? "bg-gradient-to-br from-[#FFD700]/25 to-[#FFD700]/10 border border-[#FFD700]/30 text-white"
                    : "bg-[#1A1A1A] border border-white/5 text-white/90"
                }`}>
                  {m.photo_url && (
                    <img src={m.photo_url} alt="" className="max-w-[280px] rounded-md mb-1.5" />
                  )}
                  {m.text}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-2 items-end">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          placeholder="Напиши сообщение… (Enter — отправить)"
          className="flex-1 bg-[#0A0A0A] border border-[#1F1F1F] focus:border-[#FFD700]/40 text-white px-3 py-2.5 rounded-lg text-[13px] resize-none focus:outline-none max-h-32"
        />
        <button
          onClick={send}
          disabled={sending || !text.trim()}
          className="px-4 py-2.5 rounded-lg bg-gradient-to-b from-[#FFE34D] to-[#d4a017] text-black text-[13px] font-bold uppercase tracking-wider disabled:opacity-40 hover:brightness-110"
        >
          {sending ? <Icon name="Loader" size={14} className="animate-spin" /> : <Icon name="Send" size={14} />}
        </button>
      </div>
    </div>
  );
}
