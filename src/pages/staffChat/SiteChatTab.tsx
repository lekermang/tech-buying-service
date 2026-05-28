import { useCallback, useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/icon";
import {
  CHAT_URL, POLL_INTERVAL, Room, Message, ClientHistory, Tag,
  playNotificationSound, sendBrowserPush,
} from "./siteChatTypes";
import SiteChatRoomList from "./SiteChatRoomList";
import SiteChatConversation from "./SiteChatConversation";

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

  // подавляем предупреждение о неиспользуемых переменных
  void isTyping; void roomNotes;

  const scrollToBottom = () => setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);

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
        prevRoomsRef.current.forEach(prev => {
          const curr = newRooms.find(r => r.id === prev.id);
          if (curr && curr.unread_count > prev.unread_count && curr.id !== activeRoom) {
            playNotificationSound();
            sendBrowserPush(`Новое сообщение — ${curr.client_name || curr.title}`, curr.last_message_text || "Фото");
          }
        });
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

  const markRead = useCallback(async (roomId: number) => {
    try {
      await fetch(`${CHAT_URL}?action=mark_read&room_id=${roomId}`, {
        method: "POST", headers: { "X-Employee-Token": token }
      });
      setRooms(prev => prev.map(rm => rm.id === roomId ? { ...rm, unread_count: 0 } : rm));
    } catch { /* ignore */ }
  }, [token]);

  const archiveRoom = useCallback(async (roomId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Удалить этот чат из списка?")) return;
    try {
      await fetch(`${CHAT_URL}?action=archive_room&room_id=${roomId}`, {
        method: "POST", headers: { "X-Employee-Token": token }
      });
      setRooms(prev => prev.filter(rm => rm.id !== roomId));
      if (activeRoom === roomId) setActiveRoom(null);
    } catch { /* ignore */ }
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
        markRead(roomId);
      }
    } catch { /* ignore */ }
  }, [token, markRead]);

  const pollRoom = useCallback(async (roomId: number) => {
    try {
      const r = await fetch(`${CHAT_URL}?action=poll&room_id=${roomId}&since=${lastIdRef.current}`, { headers: { "X-Employee-Token": token } });
      if (!r.ok) return;
      const d = await r.json();
      if (d?.messages?.length) {
        const fresh = d.messages as Message[];
        setMessages(prev => {
          const existing = new Set(prev.map(m => m.id));
          const onlyNew = fresh.filter(m => !existing.has(m.id));
          if (!onlyNew.length) return prev;
          lastIdRef.current = onlyNew[onlyNew.length - 1].id;
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

  const loadClientHistory = async (phone: string) => {
    if (!phone || phone.startsWith("max:") || phone.startsWith("guest:")) return;
    setHistoryLoading(true);
    try {
      const digits = phone.replace(/\D/g, "");
      const [leadsR, repairsR] = await Promise.all([
        fetch(`https://functions.poehali.dev/9c054e9c-68a0-426f-9841-d979a65faa0c?action=client_history&phone=${digits}`, { headers: { "X-Employee-Token": token } }),
        fetch(`https://functions.poehali.dev/a105aede-d55d-4b99-9d3e-5e977887aa04?action=orders_by_phone&phone=${digits}`, { headers: { "X-Admin-Token": token } }),
      ]);
      const leads = leadsR.ok ? await leadsR.json() : null;
      const repairs = repairsR.ok ? await repairsR.json() : null;
      setClientHistory({
        leads: leads?.leads || leads?.items || [],
        repairs: repairs?.orders || repairs?.items || [],
      });
    } catch { setClientHistory({ leads: [], repairs: [] }); }
    finally { setHistoryLoading(false); }
  };

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

  const markAsRead = (roomId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    markRead(roomId);
  };

  const activeRoomData = rooms.find(r => r.id === activeRoom);
  const filteredRooms = search
    ? rooms.filter(r =>
        (r.client_name || r.title || "").toLowerCase().includes(search.toLowerCase()) ||
        (r.client_phone || "").includes(search) ||
        (r.last_message_text || "").toLowerCase().includes(search.toLowerCase())
      )
    : rooms;

  return (
    <div className="flex h-[calc(100dvh-120px)] overflow-hidden relative">

      {/* Лайтбокс */}
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

      {/* Скрытый input для фото */}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

      {/* Список комнат */}
      <SiteChatRoomList
        rooms={rooms}
        roomsLoading={roomsLoading}
        activeRoom={activeRoom}
        search={search}
        pushEnabled={pushEnabled}
        roomTags={roomTags}
        filteredRooms={filteredRooms}
        onSelectRoom={setActiveRoom}
        onSearch={setSearch}
        onRefresh={loadRooms}
        onRequestPush={requestPush}
        onMarkAsRead={markAsRead}
        onArchive={archiveRoom}
      />

      {/* Окно переписки */}
      {activeRoom ? (
        <SiteChatConversation
          activeRoom={activeRoom}
          activeRoomData={activeRoomData}
          messages={messages}
          draft={draft}
          sending={sending}
          msgError={msgError}
          photoPreview={photoPreview}
          photoBase64={photoBase64}
          showQuickReplies={showQuickReplies}
          showNoteInput={showNoteInput}
          noteText={noteText}
          showHistory={showHistory}
          clientHistory={clientHistory}
          historyLoading={historyLoading}
          roomTags={roomTags}
          endRef={endRef}
          onBack={() => setActiveRoom(null)}
          onSetLightbox={setLightbox}
          onDraftChange={handleDraftChange}
          onSend={sendMessage}
          onFileClick={() => fileInputRef.current?.click()}
          onClearPhoto={() => { setPhotoPreview(null); setPhotoBase64(null); }}
          onSetShowQuickReplies={setShowQuickReplies}
          onSetShowNoteInput={setShowNoteInput}
          onSetNoteText={setNoteText}
          onSendNote={sendNote}
          onSetShowHistory={setShowHistory}
          onLoadClientHistory={loadClientHistory}
          onPollRoom={pollRoom}
          onSetRoomTags={setRoomTags}
        />
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center text-white/20 flex-col gap-3">
          <Icon name="MessageSquare" size={40} />
          <p className="font-roboto text-sm">Выберите чат слева</p>
        </div>
      )}
    </div>
  );
}
