import { useEffect, useRef, useState, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { pchatApi, fmtTime, fmtDate, POLL_INTERVAL_MS, type Message, type Room } from "./types";
import EmojiPicker from "../vipChat/EmojiPicker";

type Props = {
  token: string;
  myName: string;
  rooms: Room[];
  activeRoomId: number;
  setActiveRoomId: (id: number) => void;
  onLogout: () => void;
  onRoomsRefresh: () => void;
};

export default function PublicChatRoom({
  token, myName, rooms, activeRoomId, setActiveRoomId, onLogout, onRoomsRefresh,
}: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const listRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const lastIdRef = useRef(0);

  // Сбрасываем состояние при смене комнаты
  useEffect(() => {
    setMessages([]); lastIdRef.current = 0;
  }, [activeRoomId]);

  const scrollToBottom = (smooth = true) => {
    requestAnimationFrame(() => {
      const el = listRef.current;
      if (el) el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
    });
  };

  const poll = useCallback(async () => {
    if (!activeRoomId) return;
    const r = await pchatApi("poll", { room_id: activeRoomId, after_id: lastIdRef.current }, token);
    if (!r.ok) return;
    const msgs = (r.messages as Message[]) || [];
    if (msgs.length > 0) {
      const wasAtBottom = (() => {
        const el = listRef.current;
        if (!el) return true;
        return el.scrollHeight - el.scrollTop - el.clientHeight < 80;
      })();
      setMessages(prev => {
        const ids = new Set(prev.map(m => m.id));
        const merged = [...prev];
        for (const m of msgs) if (!ids.has(m.id)) merged.push(m);
        return merged;
      });
      const maxId = Math.max(...msgs.map(m => m.id));
      if (maxId > lastIdRef.current) lastIdRef.current = maxId;
      // mark_read
      await pchatApi("mark_read", { room_id: activeRoomId, msg_id: maxId }, token);
      if (wasAtBottom) scrollToBottom();
    }
  }, [activeRoomId, token]);

  useEffect(() => {
    poll();
    const id = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [poll]);

  const onPickFile = () => fileRef.current?.click();

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPhotoUploading(true); setPhotoUrl(null);
    setPhotoPreview(URL.createObjectURL(file));
    // base64
    const reader = new FileReader();
    reader.onload = async () => {
      const b64 = (reader.result as string).split(",")[1] || "";
      const r = await pchatApi("upload_photo", { photo_b64: b64 }, token);
      setPhotoUploading(false);
      if (r.ok) setPhotoUrl(r.url as string);
      else setErr("Не удалось загрузить фото");
    };
    reader.readAsDataURL(file);
  };

  const onSend = async () => {
    if ((!text.trim() && !photoUrl) || sending) return;
    setSending(true); setErr(null);
    const r = await pchatApi("send", { room_id: activeRoomId, text: text.trim(), photo_url: photoUrl }, token);
    setSending(false);
    if (!r.ok) { setErr((r.error as string) || "Ошибка отправки"); return; }
    setText(""); setPhotoUrl(null); setPhotoPreview(null);
    poll();
    onRoomsRefresh();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const activeRoom = rooms.find(r => r.id === activeRoomId);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#0A0A0A] text-white">
      {/* Шапка */}
      <header className="bg-[#101010] border-b border-[#1F1F1F] px-3 py-2 flex items-center gap-2 sticky top-0 z-10">
        <a href="/" className="text-white/55 hover:text-[#FFD700] p-1.5" title="На главную">
          <Icon name="ArrowLeft" size={18} />
        </a>
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FFD700] to-[#d4a017] flex items-center justify-center shrink-0">
          <Icon name="MessageCircle" size={16} className="text-black" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm truncate">{activeRoom?.title || "Чат"}</div>
          <div className="text-[10px] text-white/45">
            {activeRoom?.type === "public" ? "Открытый канал · все участники" : "Личный диалог с менеджером"}
          </div>
        </div>
        <button onClick={onLogout} title="Выйти из чата" className="text-white/45 hover:text-red-400 p-1.5">
          <Icon name="LogOut" size={16} />
        </button>
      </header>

      {/* Переключатель комнат */}
      <div className="bg-[#0F0F0F] border-b border-[#1F1F1F] px-2 py-2 flex gap-1.5 overflow-x-auto">
        {rooms.map(r => {
          const active = r.id === activeRoomId;
          return (
            <button
              key={r.id}
              onClick={() => setActiveRoomId(r.id)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold transition ${
                active
                  ? "bg-[#FFD700] text-black"
                  : "bg-[#141414] text-white/65 hover:bg-[#1A1A1A]"
              }`}
            >
              <Icon name={r.type === "public" ? "Users" : "MessageSquare"} size={12} />
              {r.title}
              {!!r.unread && r.unread > 0 && (
                <span className={`text-[10px] px-1.5 rounded-full ${active ? "bg-black/20" : "bg-red-500 text-white"}`}>
                  {r.unread}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Сообщения */}
      <div ref={listRef} className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-premium">
        {messages.length === 0 && (
          <div className="text-center py-8 text-white/35 text-sm">
            Сообщений пока нет — начните общение 👋
          </div>
        )}
        {messages.map((m, i) => {
          const prev = messages[i - 1];
          const showDate = !prev || fmtDate(prev.created_at) !== fmtDate(m.created_at);
          const isMine = m.author_type === "client";
          const isSystem = m.is_system;
          return (
            <div key={m.id}>
              {showDate && (
                <div className="text-center text-[10px] uppercase tracking-wider text-white/30 my-3 font-bold">
                  {fmtDate(m.created_at)}
                </div>
              )}
              {isSystem ? (
                <div className="mx-auto max-w-md text-center text-xs text-white/55 bg-[#FFD700]/5 border border-[#FFD700]/15 px-3 py-1.5 rounded-full">
                  {m.text}
                </div>
              ) : (
                <div className={`flex gap-2 ${isMine ? "flex-row-reverse" : ""}`}>
                  <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold ${
                    m.author_type === "employee" ? "bg-gradient-to-br from-[#FFD700] to-[#d4a017] text-black" : "bg-blue-500/30 text-blue-200 border border-blue-400/30"
                  }`}>
                    {m.author_avatar ? (
                      <img src={m.author_avatar} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      (m.author_name || "?").charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className={`max-w-[75%] ${isMine ? "items-end" : "items-start"} flex flex-col`}>
                    <div className="text-[10px] text-white/45 mb-0.5 px-1">
                      {m.author_name} · {fmtTime(m.created_at)}
                      {m.author_type === "employee" && <span className="ml-1 text-[#FFD700]">★</span>}
                    </div>
                    <div className={`px-3 py-2 rounded-2xl text-sm leading-snug whitespace-pre-wrap break-words ${
                      isMine
                        ? "bg-gradient-to-br from-[#FFD700] to-[#d4a017] text-black rounded-tr-md"
                        : m.author_type === "employee"
                          ? "bg-[#1A1A1A] border border-[#FFD700]/20 text-white rounded-tl-md"
                          : "bg-[#141414] border border-[#1F1F1F] text-white rounded-tl-md"
                    }`}>
                      {m.photo_url && (
                        <img src={m.photo_url} alt="" className="rounded-lg max-w-full mb-1.5 max-h-72 object-cover" />
                      )}
                      {m.text}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Превью фото */}
      {photoPreview && (
        <div className="px-3 py-2 border-t border-white/5 bg-black/40 flex items-center gap-3">
          <div className="relative">
            <img src={photoPreview} alt="" className="w-14 h-14 rounded-md object-cover ring-1 ring-[#FFD700]/30" />
            {photoUploading && (
              <div className="absolute inset-0 bg-black/60 rounded-md flex items-center justify-center">
                <Icon name="Loader" size={16} className="animate-spin text-[#FFD700]" />
              </div>
            )}
            {photoUrl && (
              <span className="absolute -top-1 -right-1 bg-green-500 rounded-full w-4 h-4 flex items-center justify-center">
                <Icon name="Check" size={9} className="text-white" />
              </span>
            )}
          </div>
          <div className="flex-1 text-xs text-white/65">
            {photoUploading ? "Загружаем фото..." : photoUrl ? "Фото готово к отправке" : ""}
          </div>
          <button onClick={() => { setPhotoPreview(null); setPhotoUrl(null); }} className="text-white/40 hover:text-red-400 p-1.5">
            <Icon name="X" size={14} />
          </button>
        </div>
      )}

      {/* Композер */}
      <div className="border-t border-[#1F1F1F] p-2 bg-[#0F0F0F] relative">
        <EmojiPicker open={emojiOpen} onClose={() => setEmojiOpen(false)} onPick={e => setText(text + e)} anchorClass="bottom-full left-3 mb-2" />
        <div className="flex items-end gap-1.5 bg-[#141414] border border-[#1F1F1F] rounded-xl px-1.5 py-1 focus-within:border-[#FFD700]/40">
          <input ref={fileRef} type="file" accept="image/*" onChange={onFileChange} className="hidden" />
          <button onClick={onPickFile} disabled={photoUploading} className="shrink-0 p-2 text-white/45 hover:text-[#FFD700] disabled:opacity-40">
            <Icon name="Paperclip" size={18} />
          </button>
          <button onClick={() => setEmojiOpen(v => !v)} className={`shrink-0 p-2 ${emojiOpen ? "text-[#FFD700]" : "text-white/45 hover:text-[#FFD700]"}`}>
            <Icon name="Smile" size={18} />
          </button>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={`Привет, ${myName}! Напишите сообщение...`}
            rows={1}
            className="flex-1 bg-transparent outline-none text-white text-sm resize-none py-2 max-h-32 placeholder:text-white/25"
          />
          <button
            onClick={onSend}
            disabled={(!text.trim() && !photoUrl) || sending}
            className="shrink-0 bg-[#FFD700] hover:bg-[#FFE34D] disabled:opacity-30 text-black font-bold rounded-lg px-3 py-2 active:scale-95"
          >
            {sending ? <Icon name="Loader" size={14} className="animate-spin" /> : <Icon name="Send" size={14} />}
          </button>
        </div>
        {err && <div className="text-red-400 text-xs mt-1 px-2">{err}</div>}
      </div>
    </div>
  );
}
