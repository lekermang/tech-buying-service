import { useCallback, useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/icon";

const CHAT_URL = "https://functions.poehali.dev/60644856-ff88-4875-b2a9-97c87d32a630";
const POLL_INTERVAL = 15000;

type Room = {
  id: number;
  title: string;
  client_phone: string;
  client_name: string;
  last_message_at: string | null;
  last_message_text: string | null;
  unread_count: number;
};

type Message = {
  id: number;
  author_type: "client" | "staff" | "system";
  author_name: string;
  text: string | null;
  is_system: boolean;
  created_at: string;
};

const fmtTime = (iso: string) => {
  try {
    const d = new Date(iso);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
  } catch { return ""; }
};

export default function SiteChatTab({ token }: { token: string }) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [activeRoom, setActiveRoom] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [msgError, setMsgError] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [photoMime, setPhotoMime] = useState("image/jpeg");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const lastIdRef = useRef(0);
  const endRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);

  const loadRooms = useCallback(async () => {
    try {
      const r = await fetch(`${CHAT_URL}?action=staff_rooms`, {
        headers: { "X-Employee-Token": token },
      });
      const d = await r.json();
      if (d?.ok) setRooms(d.rooms || []);
    } catch { /* ignore */ } finally { setRoomsLoading(false); }
  }, [token]);

  const loadRoom = useCallback(async (roomId: number) => {
    try {
      const r = await fetch(`${CHAT_URL}?action=room&room_id=${roomId}`, {
        headers: { "X-Employee-Token": token },
      });
      const d = await r.json();
      if (d?.ok && Array.isArray(d.messages)) {
        setMessages(d.messages);
        const last = d.messages[d.messages.length - 1];
        if (last) lastIdRef.current = last.id;
        scrollToBottom();
      }
    } catch { /* ignore */ }
  }, [token]);

  const pollRoom = useCallback(async (roomId: number) => {
    try {
      const r = await fetch(`${CHAT_URL}?action=poll&room_id=${roomId}&since=${lastIdRef.current}`, {
        headers: { "X-Employee-Token": token },
      });
      if (!r.ok) return;
      const d = await r.json();
      if (d?.messages?.length) {
        setMessages(prev => {
          const existing = new Set(prev.map(m => m.id));
          const fresh = (d.messages as Message[]).filter(m => !existing.has(m.id));
          if (!fresh.length) return prev;
          lastIdRef.current = fresh[fresh.length - 1].id;
          scrollToBottom();
          return [...prev, ...fresh];
        });
        // обновим счётчик в списке комнат
        setRooms(prev => prev.map(rm => rm.id === roomId ? { ...rm, unread_count: 0 } : rm));
      }
    } catch { /* ignore */ }
  }, [token]);

  // Первичная загрузка комнат
  useEffect(() => { loadRooms(); }, [loadRooms]);

  // Периодическое обновление списка комнат
  useEffect(() => {
    const id = setInterval(loadRooms, 30000);
    return () => clearInterval(id);
  }, [loadRooms]);

  // При смене активной комнаты — загружаем историю
  useEffect(() => {
    if (!activeRoom) return;
    lastIdRef.current = 0;
    setMessages([]);
    loadRoom(activeRoom);
  }, [activeRoom, loadRoom]);

  // Поллинг новых сообщений в активной комнате
  useEffect(() => {
    if (!activeRoom) return;
    const id = setInterval(() => pollRoom(activeRoom), POLL_INTERVAL);
    return () => clearInterval(id);
  }, [activeRoom, pollRoom]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoMime(file.type || "image/jpeg");
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setPhotoPreview(result);
      setPhotoBase64(result.split(",")[1]);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const sendMessage = async () => {
    const text = draft.trim();
    if (!text && !photoBase64) return;
    if (!activeRoom || sending) return;
    setSending(true);
    setMsgError(null);
    try {
      const r = await fetch(`${CHAT_URL}?action=send`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Employee-Token": token },
        body: JSON.stringify({
          room_id: activeRoom,
          text: text || undefined,
          photo_base64: photoBase64 || undefined,
          photo_mime: photoBase64 ? photoMime : undefined,
        }),
      });
      const d = await r.json();
      if (!d?.ok) { setMsgError(d?.error || "Ошибка отправки"); return; }
      setDraft("");
      setPhotoBase64(null);
      setPhotoPreview(null);
      const msg: Message = {
        id: d.message_id,
        author_type: "staff",
        author_name: "Менеджер",
        text: text || null,
        is_system: false,
        created_at: d.created_at || new Date().toISOString(),
      };
      setMessages(prev => [...prev, msg]);
      lastIdRef.current = Math.max(lastIdRef.current, d.message_id || 0);
      scrollToBottom();
      setRooms(prev => prev.map(rm => rm.id === activeRoom
        ? { ...rm, last_message_text: text || "📷 Фото", last_message_at: msg.created_at }
        : rm
      ));
    } catch { setMsgError("Нет связи"); }
    finally { setSending(false); }
  };

  const activeRoomData = rooms.find(r => r.id === activeRoom);

  return (
    <div className="flex h-[calc(100dvh-120px)] overflow-hidden">
      {/* ─── Список комнат ─── */}
      <div className={`${activeRoom ? "hidden md:flex" : "flex"} flex-col w-full md:w-72 shrink-0 border-r border-white/10`}>
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="font-oswald font-bold text-white text-base uppercase tracking-wide">Чаты с сайта</h2>
            <p className="text-white/40 text-xs font-roboto mt-0.5">{rooms.length} диалог{rooms.length === 1 ? "" : rooms.length < 5 ? "а" : "ов"}</p>
          </div>
          <button onClick={loadRooms} className="text-white/30 hover:text-[#FFD700] transition-colors p-1">
            <Icon name="RefreshCw" size={14} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {roomsLoading && (
            <div className="flex items-center justify-center py-12 text-white/30">
              <Icon name="Loader" size={16} className="animate-spin mr-2" />Загрузка...
            </div>
          )}
          {!roomsLoading && rooms.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center gap-2">
              <Icon name="MessageSquare" size={32} className="text-white/15" />
              <p className="text-white/30 font-roboto text-sm">Нет активных чатов</p>
              <p className="text-white/20 font-roboto text-xs">Клиенты появятся здесь когда напишут с сайта</p>
            </div>
          )}
          {rooms.map(rm => (
            <button
              key={rm.id}
              onClick={() => setActiveRoom(rm.id)}
              className={`w-full text-left px-4 py-3 border-b border-white/5 transition-colors hover:bg-white/5 ${activeRoom === rm.id ? "bg-[#FFD700]/10 border-l-2 border-l-[#FFD700]" : ""}`}
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-[#FFD700]/20 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="font-oswald font-bold text-[#FFD700] text-sm">
                    {(rm.client_name || rm.title || "К")[0].toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-roboto font-semibold text-white text-sm truncate">
                      {rm.client_name || rm.title}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      {rm.unread_count > 0 && (
                        <span className="bg-[#FFD700] text-black text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">
                          {rm.unread_count}
                        </span>
                      )}
                      {rm.last_message_at && (
                        <span className="text-white/30 text-[10px] font-roboto">{fmtTime(rm.last_message_at)}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-white/40 text-xs font-roboto truncate mt-0.5">
                    {rm.client_phone && <span className="text-white/25 mr-1">{rm.client_phone}</span>}
                    {rm.last_message_text || "Нет сообщений"}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ─── Окно переписки ─── */}
      {activeRoom ? (
        <div className="flex flex-col flex-1 min-w-0">
          {/* Шапка */}
          <div className="px-4 py-3 border-b border-white/10 flex items-center gap-3 shrink-0">
            <button onClick={() => setActiveRoom(null)} className="md:hidden text-white/40 hover:text-white transition-colors">
              <Icon name="ArrowLeft" size={20} />
            </button>
            <div className="w-9 h-9 rounded-full bg-[#FFD700]/20 flex items-center justify-center shrink-0">
              <span className="font-oswald font-bold text-[#FFD700] text-sm">
                {(activeRoomData?.client_name || "К")[0].toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-oswald font-bold text-white text-sm truncate">
                {activeRoomData?.client_name || activeRoomData?.title}
              </div>
              {activeRoomData?.client_phone && (
                <a href={`tel:${activeRoomData.client_phone}`} className="text-[#FFD700]/60 text-xs font-roboto hover:text-[#FFD700] transition-colors">
                  +{activeRoomData.client_phone}
                </a>
              )}
            </div>
            <button onClick={() => loadRoom(activeRoom)} className="text-white/30 hover:text-[#FFD700] transition-colors p-1">
              <Icon name="RefreshCw" size={14} />
            </button>
          </div>

          {/* Сообщения */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
            {messages.length === 0 && (
              <div className="text-center text-white/30 font-roboto text-sm py-10">
                Нет сообщений — клиент ещё не написал
              </div>
            )}
            {messages.map(m => {
              if (m.is_system || m.author_type === "system") return (
                <div key={m.id} className="flex justify-center">
                  <span className="text-white/30 text-xs font-roboto italic">{m.text}</span>
                </div>
              );
              const mine = m.author_type === "staff";
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] rounded-2xl text-sm font-roboto leading-relaxed overflow-hidden ${
                    mine
                      ? "bg-[#FFD700] text-black rounded-br-sm"
                      : "bg-[#1A1A1A] text-white border border-white/10 rounded-bl-sm"
                  }`}>
                    {(m as Message & { photo_url?: string }).photo_url && (
                      <img src={(m as Message & { photo_url?: string }).photo_url} alt="Фото"
                        className="max-w-[240px] w-full object-cover cursor-pointer"
                        onClick={() => window.open((m as Message & { photo_url?: string }).photo_url, '_blank')} />
                    )}
                    {m.text && <p className="px-3 py-2 whitespace-pre-wrap">{m.text}</p>}
                    <p className={`px-3 pb-1.5 text-[10px] text-right ${mine ? "text-black/50" : "text-white/30"}`}>
                      {fmtTime(m.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={endRef} />
          </div>

          {/* Ввод */}
          <div className="px-4 py-3 border-t border-white/10 shrink-0">
            {msgError && <p className="text-red-400 text-xs mb-2">{msgError}</p>}
            {photoPreview && (
              <div className="mb-2 relative inline-block">
                <img src={photoPreview} alt="Фото" className="max-h-20 rounded-lg border border-white/20 object-cover" />
                <button onClick={() => { setPhotoPreview(null); setPhotoBase64(null); }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs leading-none">×</button>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            <div className="flex items-end gap-2">
              <button onClick={() => fileInputRef.current?.click()}
                className="w-9 h-9 bg-[#1A1A1A] border border-[#333] text-white/40 flex items-center justify-center rounded-xl hover:text-[#FFD700] hover:border-[#FFD700] transition-all shrink-0"
                title="Прикрепить фото">
                <Icon name="ImagePlus" size={16} />
              </button>
              <textarea
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Написать клиенту..."
                rows={1}
                className="flex-1 bg-[#1A1A1A] border border-[#333] focus:border-[#FFD700] text-white px-3 py-2 font-roboto text-sm outline-none transition-colors resize-none rounded-xl max-h-28"
                style={{ minHeight: 38 }}
              />
              <button
                onClick={sendMessage}
                disabled={(!draft.trim() && !photoBase64) || sending}
                className="w-9 h-9 bg-[#FFD700] text-black flex items-center justify-center rounded-xl hover:bg-yellow-400 active:scale-95 transition-all disabled:opacity-35 shrink-0"
              >
                {sending
                  ? <Icon name="Loader" size={15} className="animate-spin" />
                  : <Icon name="Send" size={15} />
                }
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center text-white/20 flex-col gap-3">
          <Icon name="MessageSquare" size={40} />
          <p className="font-roboto text-sm">Выберите чат слева</p>
        </div>
      )}
    </div>
  );
}