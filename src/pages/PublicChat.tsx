import { useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import Icon from "@/components/ui/icon";

const PUBLIC_CHAT_URL = "https://functions.poehali.dev/81f2b98f-4c02-4f5a-afce-adf94d25dcac";
const MAX_BOT_LINK = "https://max.ru/skypka24bot";

const LS_AUTH = "pchat_auth";
const LS_ROOM = "pchat_room";
const LS_NAME = "pchat_name";

type Message = {
  id: number;
  author_type: "client" | "staff" | "system";
  author_id: number;
  author_name: string;
  text: string | null;
  is_system: boolean;
  created_at: string;
};

type ClientInfo = { id: number; phone: string; name: string };

const fmtTime = (iso: string) => {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
};

export default function PublicChat() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [authToken, setAuthToken] = useState<string>(() => localStorage.getItem(LS_AUTH) || "");
  const [roomId, setRoomId] = useState<number | null>(() => {
    const r = localStorage.getItem(LS_ROOM);
    return r ? parseInt(r, 10) || null : null;
  });
  const [clientName, setClientName] = useState<string>(() => localStorage.getItem(LS_NAME) || "");
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const lastIdRef = useRef<number>(0);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 50);
  }, []);

  const authByInvite = useCallback(async (token: string) => {
    try {
      const r = await fetch(`${PUBLIC_CHAT_URL}?action=auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const d = await r.json();
      if (!d || !d.ok) {
        setAuthError(d?.error || "Ссылка приглашения недействительна");
        return false;
      }
      const at: string = d.auth_token;
      const rid: number = d.room_id;
      const client: ClientInfo | undefined = d.client;
      setAuthToken(at);
      setRoomId(rid);
      if (client?.name) setClientName(client.name);
      localStorage.setItem(LS_AUTH, at);
      localStorage.setItem(LS_ROOM, String(rid));
      if (client?.name) localStorage.setItem(LS_NAME, client.name);
      return true;
    } catch {
      setAuthError("Не удалось подключиться. Проверьте интернет.");
      return false;
    }
  }, []);

  const loadRoom = useCallback(async (rid: number, at: string) => {
    try {
      const r = await fetch(`${PUBLIC_CHAT_URL}?action=room&room_id=${rid}`, {
        headers: { "X-Auth-Token": at },
      });
      if (r.status === 401 || r.status === 403) {
        localStorage.removeItem(LS_AUTH);
        localStorage.removeItem(LS_ROOM);
        setAuthToken("");
        setRoomId(null);
        setAuthError("Сессия истекла. Попросите менеджера прислать новую ссылку.");
        return;
      }
      const d = await r.json();
      if (d && d.ok && Array.isArray(d.messages)) {
        const msgs = d.messages as Message[];
        setMessages(msgs);
        if (msgs.length > 0) lastIdRef.current = msgs[msgs.length - 1].id;
        if (d.client?.display_name && !clientName) {
          setClientName(d.client.display_name);
          localStorage.setItem(LS_NAME, d.client.display_name);
        }
        scrollToBottom();
      }
    } catch {
      setError("Ошибка загрузки сообщений");
    }
  }, [clientName, scrollToBottom]);

  const sendMessage = async () => {
    const text = draft.trim();
    if (!text || !roomId || !authToken || sending) return;
    setSending(true);
    setError(null);

    // Пробуем до 2 раз при сетевой ошибке
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const r = await fetch(`${PUBLIC_CHAT_URL}?action=send`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Auth-Token": authToken },
          body: JSON.stringify({ room_id: roomId, text }),
        });
        const d = await r.json();
        if (!d || !d.ok) {
          setError(d?.error || "Ошибка отправки. Попробуйте ещё раз.");
          break;
        }
        setDraft("");
        const optimistic: Message = {
          id: d.message_id,
          author_type: "client",
          author_id: 0,
          author_name: clientName || "Вы",
          text,
          is_system: false,
          created_at: d.created_at || new Date().toISOString(),
        };
        setMessages(prev => [...prev, optimistic]);
        lastIdRef.current = Math.max(lastIdRef.current, d.message_id || 0);
        scrollToBottom();
        setSending(false);
        return;
      } catch {
        if (attempt === 0) {
          // Ждём секунду и повторяем
          await new Promise(res => setTimeout(res, 1000));
        } else {
          setError("Нет связи. Сообщение не отправлено — нажмите ещё раз.");
        }
      }
    }
    setSending(false);
  };

  // Инициализация: проверяем invite-токен, или localStorage
  useEffect(() => {
    const inv = searchParams.get("inv");
    const run = async () => {
      setLoading(true);
      if (inv) {
        const ok = await authByInvite(inv);
        if (ok) {
          // Очищаем токен из URL (чтобы случайно не делиться)
          const next = new URLSearchParams(searchParams);
          next.delete("inv");
          setSearchParams(next, { replace: true });
        }
      }
      setLoading(false);
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Когда есть авторизация — грузим комнату
  useEffect(() => {
    if (authToken && roomId) {
      loadRoom(roomId, authToken);
    }
  }, [authToken, roomId, loadRoom]);

  // Long-poll каждые 30 сек, пропускаем при скрытой вкладке
  useEffect(() => {
    if (!authToken || !roomId) return;
    const id = setInterval(async () => {
      if (typeof document !== "undefined" && document.hidden) return;
      try {
        const r = await fetch(
          `${PUBLIC_CHAT_URL}?action=poll&room_id=${roomId}&since=${lastIdRef.current}`,
          { headers: { "X-Auth-Token": authToken } }
        );
        if (!r.ok) return;
        const d = await r.json();
        if (d && Array.isArray(d.messages) && d.messages.length > 0) {
          const fresh = d.messages as Message[];
          setMessages(prev => {
            const existing = new Set(prev.map(m => m.id));
            const onlyNew = fresh.filter(m => !existing.has(m.id));
            return onlyNew.length ? [...prev, ...onlyNew] : prev;
          });
          const maxId = fresh[fresh.length - 1].id;
          if (maxId > lastIdRef.current) lastIdRef.current = maxId;
          scrollToBottom();
        }
      } catch {
        /* ignore */
      }
    }, 30000);
    return () => clearInterval(id);
  }, [authToken, roomId, scrollToBottom]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ─── Заглушка: нет инвайта и нет сохранённой сессии ───
  if (!loading && (!authToken || !roomId)) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#111] border border-[#FFD700]/20 rounded-2xl p-6 text-center">
          <div className="w-16 h-16 bg-[#FFD700]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="MessageSquare" size={32} className="text-[#FFD700]" />
          </div>
          <h1 className="font-oswald text-2xl font-bold uppercase mb-2">Чат недоступен</h1>
          <p className="font-roboto text-white/60 text-sm mb-6">
            {authError || "Попросите менеджера прислать ссылку для входа в чат."}
          </p>
          <div className="space-y-2">
            <a
              href={MAX_BOT_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-[#FFD700] text-black font-oswald font-bold py-3 uppercase tracking-wider hover:bg-yellow-400 transition-colors text-sm"
            >
              <Icon name="MessageCircle" size={16} className="inline mr-2" />
              Открыть в MAX
            </a>
            <a
              href="/"
              className="block w-full border border-white/20 text-white/70 font-roboto py-3 text-sm hover:bg-white/5 transition-colors"
            >
              На главную
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-white flex items-center justify-center">
        <Icon name="Loader" size={32} className="animate-spin text-[#FFD700]" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#0D0D0D] text-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#111]/95 backdrop-blur border-b border-[#FFD700]/15">
        <div className="max-w-[720px] mx-auto px-4 py-3 flex items-center gap-3">
          <a href="/" className="text-white/40 hover:text-white transition-colors">
            <Icon name="ArrowLeft" size={20} />
          </a>
          <div className="w-10 h-10 bg-[#FFD700] rounded-full flex items-center justify-center shrink-0">
            <span className="font-oswald font-bold text-black text-sm">С24</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-oswald font-bold text-base text-white truncate">
              Скупка24 · Чат с менеджером
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              <span className="font-roboto text-[11px] text-emerald-300/90">онлайн</span>
            </div>
          </div>
          <a
            href={MAX_BOT_LINK}
            target="_blank"
            rel="noopener noreferrer"
            title="Открыть в MAX"
            className="w-9 h-9 flex items-center justify-center text-white/50 hover:text-[#FFD700] transition-colors"
          >
            <Icon name="ExternalLink" size={18} />
          </a>
        </div>
      </header>

      {/* Messages list */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[720px] mx-auto px-4 py-4 space-y-2">
          {messages.length === 0 && (
            <div className="text-center text-white/40 font-roboto text-sm py-10">
              Напишите сообщение — менеджер ответит в течение нескольких минут.
            </div>
          )}
          {messages.map(m => {
            if (m.is_system || m.author_type === "system") {
              return (
                <div key={m.id} className="flex justify-center my-2">
                  <div className="font-roboto text-[11px] italic text-white/40 text-center max-w-[80%]">
                    {m.text}
                  </div>
                </div>
              );
            }
            const mine = m.author_type === "client";
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] sm:max-w-[70%] px-3.5 py-2 rounded-2xl ${
                    mine
                      ? "bg-[#FFD700] text-black rounded-br-sm"
                      : "bg-[#1A1A1A] text-white border border-white/5 rounded-bl-sm"
                  }`}
                >
                  {!mine && (
                    <div className="font-oswald text-[11px] uppercase tracking-wider text-[#FFD700]/80 mb-0.5">
                      {m.author_name}
                    </div>
                  )}
                  <div className="font-roboto text-sm whitespace-pre-wrap break-words">
                    {m.text}
                  </div>
                  <div
                    className={`font-roboto text-[10px] mt-1 ${
                      mine ? "text-black/50 text-right" : "text-white/35"
                    }`}
                  >
                    {fmtTime(m.created_at)}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input */}
      <footer className="sticky bottom-0 bg-[#111]/95 backdrop-blur border-t border-[#FFD700]/15">
        <div className="max-w-[720px] mx-auto px-3 py-2.5">
          {error && (
            <div className="mb-2 px-3 py-1.5 bg-red-500/10 border border-red-500/30 text-red-300 font-roboto text-xs rounded">
              {error}
            </div>
          )}
          <div className="flex items-end gap-1.5">
            <textarea
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Напишите сообщение..."
              rows={1}
              className="flex-1 bg-[#1A1A1A] border border-[#333] text-white px-3 py-2 font-roboto text-sm focus:outline-none focus:border-[#FFD700] transition-colors resize-none rounded-xl max-h-32"
              style={{ minHeight: 38 }}
            />
            <button
              type="button"
              onClick={sendMessage}
              disabled={!draft.trim() || sending}
              className="shrink-0 w-9 h-9 bg-[#FFD700] text-black flex items-center justify-center rounded-xl hover:bg-yellow-400 active:scale-95 transition-all disabled:opacity-35 disabled:cursor-not-allowed"
              aria-label="Отправить"
            >
              {sending ? (
                <Icon name="Loader" size={15} className="animate-spin" />
              ) : (
                <Icon name="Send" size={15} />
              )}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}