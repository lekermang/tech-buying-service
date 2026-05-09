import { useEffect, useRef, useState, useCallback } from "react";
import Icon from "@/components/ui/icon";
import EmojiPicker from "./vipChat/EmojiPicker";
import { PUBLIC_CHAT_URL, type Message, type Room, fmtTime, fmtDate, POLL_INTERVAL_MS } from "./publicChat/types";
import { isPhoneValid, formatPhone } from "@/lib/phoneFormat";

type Props = { token: string };

const callApi = async (token: string, action: string, body: Record<string, unknown> = {}, method: "GET"|"POST" = "POST") => {
  const url = `${PUBLIC_CHAT_URL}?action=${action}`;
  const opts: RequestInit = {
    method,
    headers: { "Content-Type": "application/json", "X-Employee-Token": token },
  };
  if (method === "POST") opts.body = JSON.stringify(body);
  const r = await fetch(url, opts);
  return r.json();
};

export default function StaffLiveChatTab({ token }: Props) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<number>(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [meId, setMeId] = useState<number>(0);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [invPhone, setInvPhone] = useState("+7");
  const [invName, setInvName] = useState("");
  const [invBusy, setInvBusy] = useState(false);
  const [invDone, setInvDone] = useState<string | null>(null);

  const listRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const lastIdRef = useRef(0);

  const loadRooms = useCallback(async () => {
    const r = await callApi(token, "staff_rooms", {}, "POST");
    if (r.ok) {
      setRooms(r.rooms || []);
      if (r.me) setMeId(r.me.id);
      if (!activeRoomId && r.rooms?.length) {
        // По умолчанию первый диалог с непрочитанными или общий
        const withUnread = r.rooms.find((x: Room) => (x.unread || 0) > 0);
        setActiveRoomId(withUnread ? withUnread.id : r.rooms[0].id);
      }
    }
  }, [token, activeRoomId]);

  useEffect(() => {
    loadRooms();
    const id = setInterval(loadRooms, 8000);
    return () => clearInterval(id);
  }, [loadRooms]);

  // poll сообщений активной комнаты
  useEffect(() => {
    setMessages([]); lastIdRef.current = 0;
  }, [activeRoomId]);

  const pollMessages = useCallback(async () => {
    if (!activeRoomId) return;
    const r = await callApi(token, "staff_poll", { room_id: activeRoomId, after_id: lastIdRef.current });
    if (!r.ok) return;
    const msgs = (r.messages as Message[]) || [];
    if (msgs.length) {
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
      callApi(token, "staff_mark_read", { room_id: activeRoomId, msg_id: maxId });
      if (wasAtBottom) {
        requestAnimationFrame(() => {
          const el = listRef.current;
          if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
        });
      }
    }
  }, [activeRoomId, token]);

  useEffect(() => {
    pollMessages();
    const id = setInterval(pollMessages, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [pollMessages]);

  const onPickFile = () => fileRef.current?.click();
  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPhotoUploading(true); setPhotoUrl(null);
    setPhotoPreview(URL.createObjectURL(file));
    const reader = new FileReader();
    reader.onload = async () => {
      const b64 = (reader.result as string).split(",")[1] || "";
      const r = await fetch(`${PUBLIC_CHAT_URL}?action=upload_photo`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Employee-Token": token },
        body: JSON.stringify({ photo_b64: b64 }),
      }).then(x => x.json()).catch(() => ({ ok: false }));
      setPhotoUploading(false);
      if (r.ok) setPhotoUrl(r.url as string);
    };
    reader.readAsDataURL(file);
  };

  const onSend = async () => {
    if ((!text.trim() && !photoUrl) || sending) return;
    setSending(true);
    const r = await callApi(token, "staff_send", { room_id: activeRoomId, text: text.trim(), photo_url: photoUrl });
    setSending(false);
    if (r.ok) { setText(""); setPhotoUrl(null); setPhotoPreview(null); pollMessages(); loadRooms(); }
  };

  const sendInvite = async () => {
    if (!isPhoneValid(invPhone)) return;
    setInvBusy(true);
    const r = await callApi(token, "invite_create", { phone: invPhone, name: invName });
    setInvBusy(false);
    if (r.ok) {
      setInvDone(r.url as string);
      setInvName(""); setInvPhone("+7");
      setTimeout(() => setInvDone(null), 5000);
    }
  };

  const activeRoom = rooms.find(r => r.id === activeRoomId);
  const totalUnread = rooms.reduce((s, r) => s + (r.unread || 0), 0);

  return (
    <div className="flex flex-col h-[calc(100dvh-72px)] bg-[#0A0A0A]">
      <div className="flex flex-1 overflow-hidden">
        {/* Сайдбар комнат */}
        <aside className="w-[280px] sm:w-[320px] border-r border-[#1F1F1F] bg-[#0F0F0F] flex flex-col">
          <div className="p-3 border-b border-[#1F1F1F]">
            <div className="flex items-center justify-between mb-2">
              <div className="font-oswald font-bold text-sm uppercase tracking-wide text-[#FFD700]">Клиенты Live</div>
              {totalUnread > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500 text-white">{totalUnread}</span>
              )}
            </div>
            <button
              onClick={() => setInviteOpen(true)}
              className="w-full bg-[#FFD700] hover:bg-[#FFE34D] text-black font-bold py-1.5 rounded-lg text-xs active:scale-95 transition flex items-center justify-center gap-1"
            >
              <Icon name="UserPlus" size={12} /> Пригласить клиента
            </button>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-premium">
            {rooms.length === 0 && <div className="text-center text-white/30 text-xs py-8">Нет диалогов</div>}
            {rooms.map(r => {
              const active = r.id === activeRoomId;
              return (
                <button
                  key={r.id}
                  onClick={() => setActiveRoomId(r.id)}
                  className={`w-full text-left px-3 py-2 border-b border-[#1A1A1A] flex items-start gap-2 transition ${active ? "bg-[#FFD700]/10 border-l-2 border-l-[#FFD700]" : "hover:bg-white/5"}`}
                >
                  <div className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-xs font-bold ${
                    r.type === "public" ? "bg-blue-500/30 text-blue-200" : "bg-[#FFD700]/20 text-[#FFD700]"
                  }`}>
                    <Icon name={r.type === "public" ? "Users" : "MessageCircle"} size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-white truncate">{r.title || "Чат"}</span>
                      {!!r.unread && r.unread > 0 && (
                        <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">{r.unread}</span>
                      )}
                    </div>
                    {r.client_phone && <div className="text-[10px] text-[#FFD700]/70 font-mono">{r.client_phone}</div>}
                    {r.last_message_text && <div className="text-[11px] text-white/45 truncate mt-0.5">{r.last_message_text}</div>}
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Окно беседы */}
        <main className="flex-1 flex flex-col bg-[#0A0A0A] min-w-0">
          {!activeRoomId ? (
            <div className="flex-1 flex items-center justify-center text-white/35">Выберите диалог</div>
          ) : (
            <>
              {/* Шапка комнаты */}
              <div className="border-b border-[#1F1F1F] px-3 py-2 bg-[#0F0F0F]">
                <div className="font-bold text-sm">{activeRoom?.title}</div>
                <div className="text-[11px] text-white/50">
                  {activeRoom?.type === "public" ? "Открытый канал" : `Личный диалог · ${activeRoom?.client_phone || ""}`}
                </div>
              </div>
              {/* Сообщения */}
              <div ref={listRef} className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-premium">
                {messages.length === 0 && <div className="text-center text-white/30 text-sm py-8">Сообщений пока нет</div>}
                {messages.map((m, i) => {
                  const prev = messages[i - 1];
                  const showDate = !prev || fmtDate(prev.created_at) !== fmtDate(m.created_at);
                  const isMine = m.author_type === "employee" && m.author_id === meId;
                  if (m.is_system) {
                    return (
                      <div key={m.id} className="text-center text-xs text-white/55 bg-[#FFD700]/5 border border-[#FFD700]/15 px-3 py-1.5 rounded-full mx-auto max-w-md">
                        {m.text}
                      </div>
                    );
                  }
                  return (
                    <div key={m.id}>
                      {showDate && (
                        <div className="text-center text-[10px] uppercase tracking-wider text-white/30 my-3 font-bold">
                          {fmtDate(m.created_at)}
                        </div>
                      )}
                      <div className={`flex gap-2 ${isMine ? "flex-row-reverse" : ""}`}>
                        <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold ${
                          m.author_type === "employee" ? "bg-gradient-to-br from-[#FFD700] to-[#d4a017] text-black" : "bg-blue-500/30 text-blue-200"
                        }`}>
                          {m.author_avatar ? (
                            <img src={m.author_avatar} alt="" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            (m.author_name || "?").charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className={`max-w-[75%] flex flex-col ${isMine ? "items-end" : "items-start"}`}>
                          <div className="text-[10px] text-white/45 mb-0.5 px-1">
                            {m.author_name} · {fmtTime(m.created_at)}
                            {m.author_type === "employee" && <span className="ml-1 text-[#FFD700]">★</span>}
                          </div>
                          <div className={`px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words ${
                            isMine
                              ? "bg-gradient-to-br from-[#FFD700] to-[#d4a017] text-black rounded-tr-md"
                              : m.author_type === "employee"
                                ? "bg-[#1A1A1A] border border-[#FFD700]/20 text-white rounded-tl-md"
                                : "bg-[#141414] border border-[#1F1F1F] text-white rounded-tl-md"
                          }`}>
                            {m.photo_url && <img src={m.photo_url} alt="" className="rounded-lg max-w-full mb-1.5 max-h-72 object-cover" />}
                            {m.text}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Превью фото */}
              {photoPreview && (
                <div className="px-3 py-2 border-t border-white/5 bg-black/40 flex items-center gap-3">
                  <img src={photoPreview} alt="" className="w-12 h-12 rounded-md object-cover ring-1 ring-[#FFD700]/30" />
                  <div className="flex-1 text-xs text-white/65">{photoUploading ? "Загружаем фото..." : "Готово"}</div>
                  <button onClick={() => { setPhotoPreview(null); setPhotoUrl(null); }} className="text-white/40 hover:text-red-400 p-1.5"><Icon name="X" size={14} /></button>
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
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); } }}
                    placeholder="Сообщение клиенту..."
                    rows={1}
                    className="flex-1 bg-transparent outline-none text-white text-sm resize-none py-2 max-h-32 placeholder:text-white/25"
                  />
                  <button onClick={onSend} disabled={(!text.trim() && !photoUrl) || sending}
                    className="shrink-0 bg-[#FFD700] hover:bg-[#FFE34D] disabled:opacity-30 text-black font-bold rounded-lg px-3 py-2 active:scale-95">
                    {sending ? <Icon name="Loader" size={14} className="animate-spin" /> : <Icon name="Send" size={14} />}
                  </button>
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {/* Модал приглашения */}
      {inviteOpen && (
        <div className="fixed inset-0 z-[180] bg-black/85 flex items-center justify-center p-4" onClick={() => setInviteOpen(false)}>
          <div className="bg-[#0F0F0F] border border-[#FFD700]/40 rounded-2xl w-full max-w-sm p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <div className="font-oswald text-lg font-bold text-[#FFD700]">Пригласить в чат</div>
              <button onClick={() => setInviteOpen(false)} className="text-white/55 hover:text-white"><Icon name="X" size={18} /></button>
            </div>
            <div className="text-xs text-white/55 mb-3">
              Клиент получит SMS со ссылкой на персональный чат — войдёт без регистрации.
            </div>
            <label className="text-[10px] uppercase tracking-wider text-white/40 font-bold block mb-1">Имя</label>
            <input value={invName} onChange={e => setInvName(e.target.value)} placeholder="Иван" className="w-full bg-[#0A0A0A] border border-[#1F1F1F] focus:border-[#FFD700]/40 text-white text-sm px-3 py-2 rounded-lg outline-none mb-2" />
            <label className="text-[10px] uppercase tracking-wider text-white/40 font-bold block mb-1">Телефон</label>
            <input
              type="tel" inputMode="tel" value={invPhone}
              onChange={e => setInvPhone(formatPhone(e.target.value))}
              placeholder="+7 (___) ___-__-__"
              className="w-full bg-[#0A0A0A] border border-[#1F1F1F] focus:border-[#FFD700]/40 text-white text-sm px-3 py-2 rounded-lg outline-none mb-3"
            />
            {invDone && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-2 mb-2 text-[11px] text-emerald-300">
                ✅ Приглашение отправлено по SMS
                <div className="text-emerald-200/70 mt-1 break-all">{invDone}</div>
              </div>
            )}
            <button
              onClick={sendInvite}
              disabled={invBusy || !isPhoneValid(invPhone)}
              className="w-full bg-[#FFD700] hover:bg-[#FFE34D] text-black font-bold py-2.5 rounded-lg disabled:opacity-50 active:scale-95 transition"
            >
              {invBusy ? "Отправляем..." : "Отправить приглашение"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
