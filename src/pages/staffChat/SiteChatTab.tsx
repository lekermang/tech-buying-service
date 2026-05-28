import { useCallback, useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/icon";

const CHAT_URL = "https://functions.poehali.dev/60644856-ff88-4875-b2a9-97c87d32a630";
const POLL_INTERVAL = 12000;

const QUICK_REPLIES = [
  "Здравствуйте! Чем могу помочь?",
  "Принял, сейчас уточню и отвечу.",
  "Оценим в течение 15 минут, ожидайте.",
  "Позвоните нам: +7 (992) 999-03-33",
  "Приезжайте к нам: ул. Кирова, 11",
  "Спасибо за обращение! Удачного дня 🙂",
];

const TAGS = ["VIP", "Срочно", "Закрыт", "Ждёт ответа"] as const;
type Tag = typeof TAGS[number];
const TAG_COLORS: Record<Tag, string> = {
  "VIP": "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
  "Срочно": "bg-red-500/20 text-red-400 border-red-500/40",
  "Закрыт": "bg-white/10 text-white/40 border-white/20",
  "Ждёт ответа": "bg-blue-500/20 text-blue-400 border-blue-500/40",
};

type Room = {
  id: number;
  title: string;
  client_phone: string;
  client_name: string;
  last_message_at: string | null;
  last_message_text: string | null;
  unread_count: number;
  tag?: Tag;
  note?: string;
};

type Message = {
  id: number;
  author_type: "client" | "staff" | "system";
  author_name: string;
  text: string | null;
  photo_url?: string;
  is_system: boolean;
  created_at: string;
  is_note?: boolean;
};

type ClientHistory = {
  leads: { id: number; category: string; created_at: string; status: string }[];
  repairs: { id: number; model: string; status: string; repair_amount: number | null; created_at: string }[];
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

// Звук уведомления (Web Audio API)
const playNotificationSound = () => {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(660, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } catch { /* ignore */ }
};

// Push-уведомление браузера
const sendBrowserPush = (title: string, body: string) => {
  if (typeof Notification === "undefined") return;
  if (Notification.permission === "granted") {
    new Notification(title, { body, icon: "/favicon.ico" });
  }
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
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [clientHistory, setClientHistory] = useState<ClientHistory | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [roomTags, setRoomTags] = useState<Record<number, Tag>>({});
  const [roomNotes, setRoomNotes] = useState<Record<number, string>>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const lastIdRef = useRef(0);
  const endRef = useRef<HTMLDivElement | null>(null);
  const prevRoomsRef = useRef<Room[]>([]);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollToBottom = () => setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);

  // Запрос разрешения на Push
  const requestPush = async () => {
    if (typeof Notification === "undefined") return;
    const perm = await Notification.requestPermission();
    setPushEnabled(perm === "granted");
  };
  useEffect(() => {
    if (typeof Notification !== "undefined" && Notification.permission === "granted") setPushEnabled(true);
  }, []);

  const loadRooms = useCallback(async () => {
    try {
      const r = await fetch(`${CHAT_URL}?action=staff_rooms`, { headers: { "X-Employee-Token": token } });
      const d = await r.json();
      if (d?.ok) {
        const newRooms: Room[] = d.rooms || [];
        // Звук + push при новом сообщении
        prevRoomsRef.current.forEach(prev => {
          const curr = newRooms.find(r => r.id === prev.id);
          if (curr && curr.unread_count > prev.unread_count && curr.id !== activeRoom) {
            playNotificationSound();
            sendBrowserPush(
              `Новое сообщение — ${curr.client_name || curr.title}`,
              curr.last_message_text || "Фото"
            );
          }
        });
        // Новая комната
        newRooms.forEach(nr => {
          if (!prevRoomsRef.current.find(p => p.id === nr.id) && nr.unread_count > 0) {
            playNotificationSound();
            sendBrowserPush("Новый чат с сайта", `${nr.client_name || nr.title}: ${nr.last_message_text || ""}`);
          }
        });
        prevRoomsRef.current = newRooms;
        setRooms(newRooms);
      }
    } catch { /* ignore */ } finally { setRoomsLoading(false); }
  }, [token, activeRoom]);

  const loadRoom = useCallback(async (roomId: number) => {
    try {
      const r = await fetch(`${CHAT_URL}?action=room&room_id=${roomId}`, { headers: { "X-Employee-Token": token } });
      const d = await r.json();
      if (d?.ok && Array.isArray(d.messages)) {
        setMessages(d.messages);
        const last = d.messages[d.messages.length - 1];
        if (last) lastIdRef.current = last.id;
        scrollToBottom();
        setRooms(prev => prev.map(rm => rm.id === roomId ? { ...rm, unread_count: 0 } : rm));
      }
    } catch { /* ignore */ }
  }, [token]);

  const pollRoom = useCallback(async (roomId: number) => {
    try {
      const r = await fetch(`${CHAT_URL}?action=poll&room_id=${roomId}&since=${lastIdRef.current}`, { headers: { "X-Employee-Token": token } });
      if (!r.ok) return;
      const d = await r.json();
      if (d?.messages?.length) {
        const fresh = (d.messages as Message[]);
        setMessages(prev => {
          const existing = new Set(prev.map(m => m.id));
          const onlyNew = fresh.filter(m => !existing.has(m.id));
          if (!onlyNew.length) return prev;
          lastIdRef.current = onlyNew[onlyNew.length - 1].id;
          // Звук если пришло от клиента
          const clientMsg = onlyNew.find(m => m.author_type === "client");
          if (clientMsg) {
            playNotificationSound();
            sendBrowserPush("Новое сообщение", clientMsg.text || "Фото");
          }
          scrollToBottom();
          return [...prev, ...onlyNew];
        });
        setRooms(prev => prev.map(rm => rm.id === roomId ? { ...rm, unread_count: 0 } : rm));
      }
    } catch { /* ignore */ }
  }, [token]);

  // Загрузка истории клиента
  const loadClientHistory = async (phone: string) => {
    if (!phone || phone.startsWith("max:") || phone.startsWith("guest:")) return;
    setHistoryLoading(true);
    try {
      const digits = phone.replace(/\D/g, "");
      const [leadsR, repairsR] = await Promise.all([
        fetch(`https://functions.poehali.dev/9c054e9c-68a0-426f-9841-d979a65faa0c?action=client_history&phone=${digits}`, { headers: { "X-Employee-Token": token } }),
        fetch(`https://functions.poehali.dev/a105aede-d55d-4b99-9d3e-5e977887aa04?action=orders_by_phone&phone=${digits}`, { headers: { "X-Admin-Token": token } }),
      ]);
      const leads = leadsR.ok ? (await leadsR.json()) : null;
      const repairs = repairsR.ok ? (await repairsR.json()) : null;
      setClientHistory({
        leads: leads?.leads || leads?.items || [],
        repairs: repairs?.orders || repairs?.items || [],
      });
    } catch { setClientHistory({ leads: [], repairs: [] }); }
    finally { setHistoryLoading(false); }
  };

  // Индикатор «печатает...» — сбрасывается через 3 сек после последнего ввода
  const handleDraftChange = (val: string) => {
    setDraft(val);
    setIsTyping(true);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => setIsTyping(false), 3000);
  };

  useEffect(() => { loadRooms(); }, [loadRooms]);
  useEffect(() => { const id = setInterval(loadRooms, 20000); return () => clearInterval(id); }, [loadRooms]);
  useEffect(() => {
    if (!activeRoom) return;
    lastIdRef.current = 0;
    setMessages([]);
    setShowHistory(false);
    setClientHistory(null);
    loadRoom(activeRoom);
  }, [activeRoom, loadRoom]);
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

  const sendMessage = async (overrideText?: string) => {
    const text = (overrideText ?? draft).trim();
    if (!text && !photoBase64) return;
    if (!activeRoom || sending) return;
    setSending(true);
    setMsgError(null);
    setShowQuickReplies(false);
    try {
      const r = await fetch(`${CHAT_URL}?action=send`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Employee-Token": token },
        body: JSON.stringify({ room_id: activeRoom, text: text || undefined, photo_base64: photoBase64 || undefined, photo_mime: photoBase64 ? photoMime : undefined }),
      });
      const d = await r.json();
      if (!d?.ok) { setMsgError(d?.error || "Ошибка отправки"); return; }
      setDraft("");
      setPhotoBase64(null);
      setPhotoPreview(null);
      const msg: Message = { id: d.message_id, author_type: "staff", author_name: "Менеджер", text: text || null, is_system: false, created_at: d.created_at || new Date().toISOString() };
      setMessages(prev => [...prev, msg]);
      lastIdRef.current = Math.max(lastIdRef.current, d.message_id || 0);
      scrollToBottom();
      setRooms(prev => prev.map(rm => rm.id === activeRoom ? { ...rm, last_message_text: text || "📷 Фото", last_message_at: msg.created_at } : rm));
    } catch { setMsgError("Нет связи"); }
    finally { setSending(false); }
  };

  const sendNote = () => {
    const text = noteText.trim();
    if (!text) return;
    const note: Message = { id: Date.now(), author_type: "staff", author_name: "Заметка", text, is_system: false, created_at: new Date().toISOString(), is_note: true };
    setMessages(prev => [...prev, note]);
    setRoomNotes(prev => ({ ...prev, [activeRoom!]: text }));
    setNoteText("");
    setShowNoteInput(false);
    scrollToBottom();
  };

  const activeRoomData = rooms.find(r => r.id === activeRoom);
  const filteredRooms = search
    ? rooms.filter(r => (r.client_name || r.title || "").toLowerCase().includes(search.toLowerCase()) || (r.client_phone || "").includes(search) || (r.last_message_text || "").toLowerCase().includes(search.toLowerCase()))
    : rooms;

  return (
    <div className="flex h-[calc(100dvh-120px)] overflow-hidden relative">

      {/* ─── Лайтбокс ─── */}
      {lightbox && (
        <div className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="Фото" className="max-w-full max-h-full object-contain rounded-lg" />
          <button className="absolute top-4 right-4 text-white/60 hover:text-white" onClick={() => setLightbox(null)}>
            <Icon name="X" size={28} />
          </button>
          <a href={lightbox} download className="absolute bottom-4 right-4 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors" onClick={e => e.stopPropagation()}>
            <Icon name="Download" size={16} />Скачать
          </a>
        </div>
      )}

      {/* ─── Список комнат ─── */}
      <div className={`${activeRoom ? "hidden md:flex" : "flex"} flex-col w-full md:w-72 shrink-0 border-r border-white/10`}>
        {/* Шапка + поиск */}
        <div className="px-3 py-3 border-b border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-oswald font-bold text-white text-base uppercase tracking-wide">Чаты с сайта</h2>
              <p className="text-white/40 text-[11px] font-roboto">{rooms.length} диалог{rooms.length === 1 ? "" : rooms.length < 5 ? "а" : "ов"}</p>
            </div>
            <div className="flex items-center gap-1">
              {!pushEnabled && (
                <button onClick={requestPush} title="Включить уведомления" className="text-white/30 hover:text-[#FFD700] transition-colors p-1">
                  <Icon name="Bell" size={15} />
                </button>
              )}
              {pushEnabled && <Icon name="BellRing" size={14} className="text-green-400" />}
              <button onClick={loadRooms} className="text-white/30 hover:text-[#FFD700] transition-colors p-1">
                <Icon name="RefreshCw" size={14} />
              </button>
            </div>
          </div>
          {/* Поиск */}
          <div className="relative">
            <Icon name="Search" size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Поиск по чатам..."
              className="w-full bg-white/5 border border-white/10 text-white text-xs pl-7 pr-3 py-2 rounded-lg outline-none focus:border-[#FFD700]/50 placeholder:text-white/25"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {roomsLoading && <div className="flex items-center justify-center py-12 text-white/30"><Icon name="Loader" size={16} className="animate-spin mr-2" />Загрузка...</div>}
          {!roomsLoading && filteredRooms.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center gap-2">
              <Icon name="MessageSquare" size={32} className="text-white/15" />
              <p className="text-white/30 font-roboto text-sm">{search ? "Ничего не найдено" : "Нет активных чатов"}</p>
            </div>
          )}
          {filteredRooms.map(rm => {
            const tag = roomTags[rm.id];
            return (
              <button key={rm.id} onClick={() => setActiveRoom(rm.id)}
                className={`w-full text-left px-4 py-3 border-b border-white/5 transition-colors hover:bg-white/5 ${activeRoom === rm.id ? "bg-[#FFD700]/10 border-l-2 border-l-[#FFD700]" : ""}`}>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#FFD700]/20 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="font-oswald font-bold text-[#FFD700] text-sm">{(rm.client_name || rm.title || "К")[0].toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-roboto font-semibold text-white text-sm truncate">{rm.client_name || rm.title}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        {rm.unread_count > 0 && <span className="bg-[#FFD700] text-black text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">{rm.unread_count}</span>}
                        {rm.last_message_at && <span className="text-white/30 text-[10px] font-roboto">{fmtTime(rm.last_message_at)}</span>}
                      </div>
                    </div>
                    <div className="text-white/40 text-xs font-roboto truncate mt-0.5">{rm.last_message_text || "Нет сообщений"}</div>
                    {tag && <span className={`inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded border ${TAG_COLORS[tag]}`}>{tag}</span>}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Окно переписки ─── */}
      {activeRoom ? (
        <div className="flex flex-col flex-1 min-w-0">
          {/* Шапка */}
          <div className="px-4 py-2.5 border-b border-white/10 flex items-center gap-3 shrink-0">
            <button onClick={() => setActiveRoom(null)} className="md:hidden text-white/40 hover:text-white transition-colors">
              <Icon name="ArrowLeft" size={20} />
            </button>
            <div className="w-9 h-9 rounded-full bg-[#FFD700]/20 flex items-center justify-center shrink-0">
              <span className="font-oswald font-bold text-[#FFD700] text-sm">{(activeRoomData?.client_name || "К")[0].toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-oswald font-bold text-white text-sm truncate">{activeRoomData?.client_name || activeRoomData?.title}</div>
              {activeRoomData?.client_phone && !activeRoomData.client_phone.startsWith("max:") && (
                <a href={`tel:${activeRoomData.client_phone}`} className="text-[#FFD700]/60 text-xs font-roboto hover:text-[#FFD700] transition-colors">+{activeRoomData.client_phone}</a>
              )}
            </div>
            {/* Теги */}
            <div className="flex items-center gap-1">
              {TAGS.map(tag => (
                <button key={tag} onClick={() => setRoomTags(prev => ({ ...prev, [activeRoom]: prev[activeRoom] === tag ? undefined as unknown as Tag : tag }))}
                  className={`text-[10px] px-1.5 py-0.5 rounded border transition-all ${roomTags[activeRoom] === tag ? TAG_COLORS[tag] : "border-white/10 text-white/20 hover:text-white/50"}`}>
                  {tag}
                </button>
              ))}
            </div>
            {/* Карточка клиента */}
            <button onClick={() => { setShowHistory(!showHistory); if (!showHistory && activeRoomData?.client_phone) loadClientHistory(activeRoomData.client_phone); }}
              className={`p-1.5 rounded transition-colors ${showHistory ? "text-[#FFD700] bg-[#FFD700]/10" : "text-white/30 hover:text-[#FFD700]"}`} title="История клиента">
              <Icon name="User" size={16} />
            </button>
            <button onClick={() => pollRoom(activeRoom)} className="text-white/30 hover:text-[#FFD700] transition-colors p-1.5">
              <Icon name="RefreshCw" size={14} />
            </button>
          </div>

          <div className="flex flex-1 min-h-0">
            {/* Сообщения */}
            <div className="flex flex-col flex-1 min-w-0">
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
                {messages.length === 0 && <div className="text-center text-white/30 font-roboto text-sm py-10">Нет сообщений — клиент ещё не написал</div>}
                {messages.map(m => {
                  if (m.is_system || m.author_type === "system") return (
                    <div key={m.id} className="flex justify-center">
                      <span className="text-white/25 text-xs font-roboto italic">{m.text}</span>
                    </div>
                  );
                  if (m.is_note) return (
                    <div key={m.id} className="flex justify-center">
                      <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 text-xs font-roboto px-3 py-1.5 rounded-xl max-w-[80%]">
                        📝 <span className="font-semibold">Заметка:</span> {m.text}
                      </div>
                    </div>
                  );
                  const mine = m.author_type === "staff";
                  return (
                    <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] rounded-2xl overflow-hidden ${mine ? "bg-[#FFD700] text-black rounded-br-sm" : "bg-[#1A1A1A] text-white border border-white/10 rounded-bl-sm"}`}>
                        {m.photo_url && (
                          <img src={m.photo_url} alt="Фото" className="max-w-[240px] w-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => setLightbox(m.photo_url!)} />
                        )}
                        {m.text && <p className="px-3 py-2 text-sm font-roboto whitespace-pre-wrap">{m.text}</p>}
                        <p className={`px-3 pb-1.5 text-[10px] text-right ${mine ? "text-black/50" : "text-white/30"}`}>{fmtTime(m.created_at)}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={endRef} />
              </div>

              {/* Ввод */}
              <div className="px-4 py-3 border-t border-white/10 shrink-0">
                {msgError && <p className="text-red-400 text-xs mb-2">{msgError}</p>}

                {/* Заметка */}
                {showNoteInput && (
                  <div className="mb-2 flex gap-2">
                    <input value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Внутренняя заметка (видна только менеджерам)..."
                      onKeyDown={e => { if (e.key === "Enter") sendNote(); }}
                      className="flex-1 bg-yellow-500/10 border border-yellow-500/30 text-yellow-100 text-sm px-3 py-2 rounded-xl outline-none placeholder:text-yellow-300/30" />
                    <button onClick={sendNote} className="px-3 py-2 bg-yellow-500/20 text-yellow-400 rounded-xl hover:bg-yellow-500/30 text-sm">Сохранить</button>
                    <button onClick={() => setShowNoteInput(false)} className="px-3 py-2 text-white/30 hover:text-white text-sm">✕</button>
                  </div>
                )}

                {/* Быстрые ответы */}
                {showQuickReplies && (
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {QUICK_REPLIES.map(qr => (
                      <button key={qr} onClick={() => sendMessage(qr)}
                        className="text-xs bg-white/5 hover:bg-[#FFD700]/10 border border-white/10 hover:border-[#FFD700]/40 text-white/70 hover:text-[#FFD700] px-2.5 py-1.5 rounded-xl transition-all">
                        {qr}
                      </button>
                    ))}
                  </div>
                )}

                {/* Превью фото */}
                {photoPreview && (
                  <div className="mb-2 relative inline-block">
                    <img src={photoPreview} alt="Фото" className="max-h-20 rounded-lg border border-white/20 object-cover" />
                    <button onClick={() => { setPhotoPreview(null); setPhotoBase64(null); }}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs leading-none">×</button>
                  </div>
                )}

                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                <div className="flex items-end gap-2">
                  <button onClick={() => fileInputRef.current?.click()} title="Прикрепить фото"
                    className="w-8 h-8 bg-white/5 border border-white/10 text-white/30 flex items-center justify-center rounded-xl hover:text-[#FFD700] hover:border-[#FFD700]/40 transition-all shrink-0">
                    <Icon name="ImagePlus" size={15} />
                  </button>
                  <button onClick={() => setShowQuickReplies(!showQuickReplies)} title="Быстрые ответы"
                    className={`w-8 h-8 border flex items-center justify-center rounded-xl transition-all shrink-0 ${showQuickReplies ? "bg-[#FFD700]/10 border-[#FFD700]/40 text-[#FFD700]" : "bg-white/5 border-white/10 text-white/30 hover:text-[#FFD700] hover:border-[#FFD700]/40"}`}>
                    <Icon name="Zap" size={15} />
                  </button>
                  <button onClick={() => setShowNoteInput(!showNoteInput)} title="Заметка"
                    className={`w-8 h-8 border flex items-center justify-center rounded-xl transition-all shrink-0 ${showNoteInput ? "bg-yellow-500/20 border-yellow-500/40 text-yellow-400" : "bg-white/5 border-white/10 text-white/30 hover:text-yellow-400 hover:border-yellow-500/40"}`}>
                    <Icon name="StickyNote" size={15} />
                  </button>
                  <textarea
                    value={draft}
                    onChange={e => handleDraftChange(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    placeholder="Написать клиенту..."
                    rows={1}
                    className="flex-1 bg-[#1A1A1A] border border-[#333] focus:border-[#FFD700] text-white px-3 py-2 font-roboto text-sm outline-none transition-colors resize-none rounded-xl max-h-28"
                    style={{ minHeight: 34 }}
                  />
                  <button onClick={() => sendMessage()} disabled={(!draft.trim() && !photoBase64) || sending}
                    className="w-9 h-9 bg-[#FFD700] text-black flex items-center justify-center rounded-xl hover:bg-yellow-400 active:scale-95 transition-all disabled:opacity-35 shrink-0">
                    {sending ? <Icon name="Loader" size={15} className="animate-spin" /> : <Icon name="Send" size={15} />}
                  </button>
                </div>
              </div>
            </div>

            {/* ─── Карточка клиента ─── */}
            {showHistory && (
              <div className="w-64 shrink-0 border-l border-white/10 flex flex-col overflow-hidden">
                <div className="px-4 py-3 border-b border-white/10">
                  <h3 className="font-oswald font-bold text-white text-sm uppercase">История клиента</h3>
                  <p className="text-white/40 text-xs mt-0.5">{activeRoomData?.client_name}</p>
                </div>
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
                  {historyLoading && <div className="text-white/30 text-xs text-center py-4"><Icon name="Loader" size={14} className="animate-spin inline mr-1" />Загрузка...</div>}
                  {!historyLoading && clientHistory && (
                    <>
                      {/* Заявки */}
                      <div>
                        <p className="text-[#FFD700] text-[11px] font-oswald font-bold uppercase tracking-wide mb-2">Заявки ({clientHistory.leads.length})</p>
                        {clientHistory.leads.length === 0 && <p className="text-white/25 text-xs">Нет заявок</p>}
                        {clientHistory.leads.slice(0, 5).map(l => (
                          <div key={l.id} className="mb-2 p-2 bg-white/5 rounded-lg border border-white/5">
                            <div className="text-white text-xs font-semibold">#{l.id} — {l.category || "Без категории"}</div>
                            <div className="text-white/40 text-[10px] mt-0.5">{l.created_at ? fmtTime(l.created_at) : ""}</div>
                          </div>
                        ))}
                      </div>
                      {/* Ремонты */}
                      <div>
                        <p className="text-[#FFD700] text-[11px] font-oswald font-bold uppercase tracking-wide mb-2">Ремонты ({clientHistory.repairs.length})</p>
                        {clientHistory.repairs.length === 0 && <p className="text-white/25 text-xs">Нет ремонтов</p>}
                        {clientHistory.repairs.slice(0, 5).map(r => (
                          <div key={r.id} className="mb-2 p-2 bg-white/5 rounded-lg border border-white/5">
                            <div className="text-white text-xs font-semibold">#{r.id} — {r.model || "Устройство"}</div>
                            <div className="text-white/40 text-[10px] mt-0.5">{r.status}{r.repair_amount ? ` · ${r.repair_amount} ₽` : ""}</div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  {!historyLoading && !clientHistory && (
                    <div className="text-white/25 text-xs text-center py-4">История недоступна<br/>(клиент без телефона)</div>
                  )}
                </div>
              </div>
            )}
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
