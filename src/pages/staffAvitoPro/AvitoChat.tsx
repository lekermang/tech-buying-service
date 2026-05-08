import { useEffect, useState, useCallback, useRef } from "react";
import Icon from "@/components/ui/icon";
import { ChatItem, ChatStats, ChatMessage, SYNC_URL, formatDate } from "./types";

export default function AvitoChat() {
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [stats, setStats] = useState<ChatStats>({ unread_chats: 0, unread_total: 0, total: 0 });
  const [activeChat, setActiveChat] = useState<ChatItem | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const flash = (type: "ok" | "err", text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  const loadChats = useCallback(async () => {
    try {
      const r = await fetch(`${SYNC_URL}?action=chats_list${unreadOnly ? "&unread=1" : ""}`);
      const d = await r.json();
      if (d.ok) {
        setChats(d.chats || []);
        setStats(d.stats || { unread_chats: 0, unread_total: 0, total: 0 });
      }
    } finally {
      setLoading(false);
    }
  }, [unreadOnly]);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  const syncFromAvito = async () => {
    setSyncing(true);
    try {
      const r = await fetch(`${SYNC_URL}?action=sync_chats`);
      const d = await r.json();
      if (d.ok) {
        flash("ok", `Загружено ${d.added} новых, обновлено ${d.updated}`);
        loadChats();
      } else {
        flash("err", d.error || "Не удалось");
      }
    } finally {
      setSyncing(false);
    }
  };

  const openChat = async (c: ChatItem) => {
    setActiveChat(c);
    setMessages([]);
    try {
      const r = await fetch(`${SYNC_URL}?action=chat_messages&chat_id=${encodeURIComponent(c.chat_id)}`);
      const d = await r.json();
      if (d.ok) {
        setMessages(d.messages || []);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      }
    } catch {
      flash("err", "Не удалось загрузить переписку");
    }
  };

  const send = async () => {
    if (!text.trim() || !activeChat || sending) return;
    setSending(true);
    const t = text.trim();
    setText("");
    try {
      const r = await fetch(`${SYNC_URL}?action=send_message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: activeChat.chat_id, text: t }),
      });
      const d = await r.json();
      if (d.ok) {
        openChat(activeChat);
        loadChats();
      } else {
        flash("err", d.error || "Не отправлено");
        setText(t);
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Шапка */}
      <div className="rounded-xl bg-gradient-to-br from-violet-500/10 to-transparent border border-violet-500/30 p-3">
        <div className="flex items-start sm:items-center justify-between flex-col sm:flex-row gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Icon name="MessageCircle" size={16} className="text-violet-300" />
              <span className="font-oswald font-bold text-white text-sm uppercase tracking-wide">
                Чат Авито
              </span>
              {stats.unread_total > 0 && (
                <span className="bg-red-500 text-white font-oswald font-bold text-[10px] px-1.5 py-0.5 rounded-full">
                  {stats.unread_total}
                </span>
              )}
            </div>
            <div className="text-[11px] text-white/60 mt-0.5">
              Диалогов: {stats.total} · Непрочитанных: {stats.unread_chats}
            </div>
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={() => setUnreadOnly(v => !v)}
              className={`flex items-center gap-1.5 text-xs font-roboto px-2.5 py-1.5 rounded transition-all ${
                unreadOnly
                  ? "bg-red-500/20 text-red-300 border border-red-500/40"
                  : "bg-white/5 text-white/60 border border-white/10 hover:text-white"
              }`}
            >
              <Icon name="Mail" size={12} />
              {unreadOnly ? "Только непрочитанные" : "Все"}
            </button>
            <button
              onClick={syncFromAvito}
              disabled={syncing}
              className="flex items-center gap-1.5 bg-gradient-to-r from-violet-600 to-purple-500 text-white font-oswald font-bold text-xs px-3 py-1.5 rounded uppercase tracking-wide disabled:opacity-50"
            >
              <Icon name={syncing ? "Loader2" : "RefreshCw"} size={12} className={syncing ? "animate-spin" : ""} />
              Загрузить
            </button>
          </div>
        </div>
      </div>

      {msg && (
        <div className={`text-[11px] rounded px-3 py-2 flex items-center gap-2 ${
          msg.type === "ok" ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300" : "bg-red-500/10 border border-red-500/30 text-red-300"
        }`}>
          <Icon name={msg.type === "ok" ? "CheckCircle2" : "AlertCircle"} size={13} />
          {msg.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-3 h-[calc(100vh-280px)] min-h-[400px]">
        {/* Список чатов */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden flex flex-col">
          {loading ? (
            <div className="p-3 space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-14 rounded bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : chats.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-white/40 p-6">
              <Icon name="MessageCircle" size={32} className="mb-2 opacity-50" />
              <div className="text-xs">
                {unreadOnly ? "Все диалоги прочитаны" : "Нет диалогов — нажмите «Загрузить» чтобы синхронизировать с Авито"}
              </div>
            </div>
          ) : (
            <div className="overflow-y-auto scrollbar-premium divide-y divide-white/5">
              {chats.map(c => (
                <button
                  key={c.chat_id}
                  onClick={() => openChat(c)}
                  className={`w-full text-left p-2.5 hover:bg-white/[0.04] transition-colors flex items-start gap-2 ${
                    activeChat?.chat_id === c.chat_id ? "bg-violet-500/10" : ""
                  }`}
                >
                  <div className="shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                    {c.user_avatar ? (
                      <img src={c.user_avatar} alt="" className="w-full h-full object-cover rounded-full" />
                    ) : (
                      (c.user_name || "?").substring(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <div className="font-roboto text-xs text-white truncate">
                        {c.user_name || "Покупатель"}
                      </div>
                      {c.unread_count > 0 && (
                        <span className="bg-red-500 text-white font-bold text-[9px] w-4 h-4 rounded-full flex items-center justify-center shrink-0">
                          {c.unread_count}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-[#FFD700]/70 truncate mt-0.5">
                      {c.item_title || ""}
                    </div>
                    <div className="text-[10px] text-white/50 truncate mt-0.5">
                      {c.last_message || "—"}
                    </div>
                    <div className="text-[9px] text-white/30 mt-0.5">
                      {formatDate(c.last_message_at)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Окно переписки */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden flex flex-col">
          {!activeChat ? (
            <div className="flex-1 flex flex-col items-center justify-center text-white/30 p-6 text-center">
              <Icon name="MessageSquare" size={40} className="mb-2 opacity-50" />
              <div className="text-sm font-oswald uppercase tracking-wide">Выберите диалог</div>
            </div>
          ) : (
            <>
              <div className="shrink-0 p-3 border-b border-white/10 flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <div className="font-roboto text-sm text-white truncate">{activeChat.user_name || "Покупатель"}</div>
                  <div className="text-[10px] text-[#FFD700]/70 truncate">{activeChat.item_title || ""}</div>
                </div>
                {activeChat.avito_id && (
                  <a
                    href={`https://www.avito.ru/profile/messenger/channel/${activeChat.chat_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-white/40 hover:text-[#FFD700] flex items-center gap-1"
                  >
                    <Icon name="ExternalLink" size={10} />
                    На Авито
                  </a>
                )}
              </div>

              <div className="flex-1 overflow-y-auto scrollbar-premium p-3 space-y-2">
                {messages.length === 0 ? (
                  <div className="text-center text-white/40 text-xs py-6">Загружаю сообщения...</div>
                ) : (
                  messages.map(m => (
                    <div
                      key={m.message_id}
                      className={`flex ${m.is_outgoing ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] px-3 py-2 rounded-lg text-xs ${
                          m.is_outgoing
                            ? "bg-gradient-to-br from-violet-600/40 to-purple-600/30 text-white border border-violet-500/30"
                            : "bg-white/5 text-white/90 border border-white/10"
                        }`}
                      >
                        <div className="whitespace-pre-wrap break-words">{m.text || `[${m.type}]`}</div>
                        <div className="text-[9px] text-white/40 mt-1">{formatDate(m.created_at)}</div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="shrink-0 border-t border-white/10 p-2 flex gap-2 bg-black/30">
                <input
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  placeholder="Напишите ответ покупателю..."
                  className="flex-1 bg-[#0D0D0D] border border-white/15 text-white px-3 py-2 font-roboto text-sm rounded focus:outline-none focus:border-violet-500"
                />
                <button
                  onClick={send}
                  disabled={!text.trim() || sending}
                  className="bg-gradient-to-r from-violet-600 to-purple-500 text-white font-oswald font-bold text-xs px-3 py-2 rounded uppercase tracking-wide disabled:opacity-40"
                >
                  <Icon name={sending ? "Loader2" : "Send"} size={14} className={sending ? "animate-spin" : ""} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
