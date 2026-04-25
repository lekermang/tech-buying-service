import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import Icon from "@/components/ui/icon";
import {
  isPushSupported, vipChatPushState, enableVipChatPush, disableVipChatPush,
} from "@/lib/vipChatPush";

const VIP_CHAT_URL = "https://functions.poehali.dev/f4a88e67-03e7-4387-a091-32588d90df73";
const POLL_INTERVAL_MS = 4000;
const ONLINE_THRESHOLD_MS = 90 * 1000; // 1.5 минуты — считаем онлайн

type Member = {
  id: number;
  full_name: string;
  role: string;
  avatar_url: string | null;
  last_seen_at: string | null;
  is_active: boolean;
};

type Message = {
  id: number;
  employee_id: number;
  full_name: string;
  avatar_url: string | null;
  role: string;
  text: string | null;
  photo_url: string | null;
  created_at: string;
};

type PollResp = {
  me?: { id: number; role: string; full_name: string };
  messages: Message[];
  members: Member[];
  unread: number;
  max_id: number;
  error?: string;
};

const ROLE_BADGE: Record<string, string> = {
  owner: "bg-gradient-to-r from-[#FFD700] to-yellow-500 text-black",
  admin: "bg-gradient-to-r from-blue-500/30 to-blue-600/20 text-blue-300 border border-blue-400/30",
  staff: "bg-white/10 text-white/60",
};
const ROLE_LABEL: Record<string, string> = { owner: "Владелец", admin: "Админ", staff: "Сотрудник" };

const initials = (name: string) =>
  name.trim().split(/\s+/).map(w => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "?";

const isOnline = (m: Member) => {
  if (!m.last_seen_at) return false;
  const last = new Date(m.last_seen_at).getTime();
  return Date.now() - last < ONLINE_THRESHOLD_MS;
};

const lastSeenText = (m: Member) => {
  if (!m.last_seen_at) return "ещё не заходил";
  const ms = Date.now() - new Date(m.last_seen_at).getTime();
  if (ms < ONLINE_THRESHOLD_MS) return "сейчас в сети";
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `был ${mins} мин назад`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `был ${hours} ч назад`;
  const days = Math.floor(hours / 24);
  return `был ${days} д назад`;
};

const fmtTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
};

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "long" });
};

type Props = { token: string; onUnread?: (n: number) => void };

export default function StaffVipChatTab({ token, onUnread }: Props) {
  const [meId, setMeId] = useState<number>(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [unread, setUnread] = useState(0);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [showMembers, setShowMembers] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Web Push
  const [pushSupported, setPushSupported] = useState(false);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>("default");
  const [pushBusy, setPushBusy] = useState(false);
  const [pushHint, setPushHint] = useState<string | null>(null);

  const listRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const lastIdRef = useRef(0);
  const initialLoadDone = useRef(false);

  const api = useCallback(async (action: string, extra: Record<string, unknown> = {}) => {
    const res = await fetch(VIP_CHAT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Employee-Token": token },
      body: JSON.stringify({ action, ...extra }),
    });
    return res.json();
  }, [token]);

  const scrollToBottom = (smooth: boolean = true) => {
    requestAnimationFrame(() => {
      const el = listRef.current;
      if (el) el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
    });
  };

  const poll = useCallback(async () => {
    try {
      const data: PollResp = await api("poll", { after_id: lastIdRef.current });
      if (data.error) { setError(data.error); return; }
      setError(null);
      if (data.me) setMeId(data.me.id);
      if (data.members) setMembers(data.members);
      if (data.unread != null) {
        setUnread(data.unread);
        onUnread?.(data.unread);
      }

      if (data.messages?.length) {
        const wasAtBottom = (() => {
          const el = listRef.current;
          if (!el) return true;
          return el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        })();

        setMessages(prev => {
          if (lastIdRef.current === 0) return data.messages;
          const ids = new Set(prev.map(m => m.id));
          const merged = [...prev];
          for (const m of data.messages) if (!ids.has(m.id)) merged.push(m);
          return merged;
        });
        const maxId = Math.max(...data.messages.map(m => m.id));
        if (maxId > lastIdRef.current) lastIdRef.current = maxId;

        if (!initialLoadDone.current) {
          initialLoadDone.current = true;
          scrollToBottom(false);
        } else if (wasAtBottom) {
          scrollToBottom(true);
        }
      } else if (!initialLoadDone.current) {
        initialLoadDone.current = true;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка соединения");
    }
  }, [api, onUnread]);

  // Polling каждые N секунд
  useEffect(() => {
    poll();
    const t = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(t);
  }, [poll]);

  // Стартовое состояние Web Push
  useEffect(() => {
    setPushSupported(isPushSupported());
    vipChatPushState().then(s => {
      setPushSubscribed(s.subscribed);
      setPushPermission(s.permission);
    });
  }, []);

  const togglePush = async () => {
    if (pushBusy) return;
    setPushBusy(true);
    setPushHint(null);
    try {
      if (pushSubscribed) {
        await disableVipChatPush(token);
        setPushSubscribed(false);
        setPushHint("Уведомления отключены");
      } else {
        const res = await enableVipChatPush(token);
        if (res.ok) {
          setPushSubscribed(true);
          setPushPermission("granted");
          setPushHint("✓ Уведомления включены");
        } else {
          setPushHint(res.error || "Не удалось включить");
        }
      }
    } finally {
      setPushBusy(false);
      setTimeout(() => setPushHint(null), 4000);
    }
  };

  // Отметка о прочтении при просмотре
  useEffect(() => {
    if (!messages.length) return;
    const maxId = messages[messages.length - 1].id;
    api("mark_read", { msg_id: maxId }).catch(() => {});
  }, [messages, api]);

  // Загрузка фото
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Можно загружать только изображения"); return; }
    if (file.size > 8 * 1024 * 1024) { setError("Файл больше 8 МБ"); return; }

    setError(null);
    const objUrl = URL.createObjectURL(file);
    setPhotoPreview(objUrl);
    setPhotoUploading(true);
    setPhotoUrl(null);

    try {
      const b64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(((reader.result as string) || "").split(",")[1] || "");
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
      const data = await api("upload_photo", { base64: b64, mime_type: file.type });
      if (data.error) { setError(data.error); setPhotoPreview(null); return; }
      setPhotoUrl(data.photo_url);
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : "Ошибка загрузки");
      setPhotoPreview(null);
    } finally {
      setPhotoUploading(false);
    }
  };

  const cancelPhoto = () => {
    setPhotoPreview(null);
    setPhotoUrl(null);
  };

  const send = async () => {
    const t = text.trim();
    if (!t && !photoUrl) return;
    if (sending || photoUploading) return;
    setSending(true);
    try {
      const data = await api("send", { text: t, photo_url: photoUrl });
      if (data.error) { setError(data.error); return; }
      setText("");
      setPhotoPreview(null);
      setPhotoUrl(null);
      await poll();
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

  // Группировка по дням
  const grouped = useMemo(() => {
    const out: { day: string; items: Message[] }[] = [];
    let lastDay = "";
    for (const m of messages) {
      const d = fmtDate(m.created_at);
      if (d !== lastDay) {
        out.push({ day: d, items: [m] });
        lastDay = d;
      } else {
        out[out.length - 1].items.push(m);
      }
    }
    return out;
  }, [messages]);

  const onlineCount = members.filter(isOnline).length;

  return (
    <div className="flex h-[calc(100vh-200px)] min-h-[480px] bg-[#0A0A0A] text-white">
      {/* ─── СПИСОК УЧАСТНИКОВ ─── */}
      <aside className={`${showMembers ? "block" : "hidden"} lg:block w-full lg:w-64 shrink-0 border-r border-white/5 bg-black/40 overflow-y-auto`}>
        <div className="p-3 border-b border-white/5 sticky top-0 bg-[#0A0A0A]/95 backdrop-blur z-10">
          <div className="font-oswald font-bold text-[#FFD700] text-sm uppercase tracking-wider">Участники</div>
          <div className="font-roboto text-white/40 text-[10px] mt-0.5">
            {members.length} всего · <span className="text-green-400">{onlineCount} онлайн</span>
          </div>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {members.map(m => {
            const online = isOnline(m);
            return (
              <div key={m.id} className="flex items-center gap-2.5 p-2.5 hover:bg-white/[0.03] transition-colors">
                <div className="relative shrink-0">
                  {m.avatar_url ? (
                    <img src={m.avatar_url} alt={m.full_name} className="w-9 h-9 rounded-full object-cover ring-1 ring-white/10" />
                  ) : (
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-oswald font-bold text-[12px]
                      ${m.role === "owner" ? "bg-gradient-to-br from-[#FFD700] to-yellow-600 text-black"
                        : m.role === "admin" ? "bg-gradient-to-br from-blue-500 to-blue-700 text-white"
                        : "bg-gradient-to-br from-[#333] to-[#1a1a1a] text-white/70"}`}>
                      {initials(m.full_name)}
                    </div>
                  )}
                  <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 border-2 border-[#0A0A0A] rounded-full ${online ? "bg-green-400" : "bg-gray-500"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-roboto text-sm text-white truncate flex items-center gap-1.5">
                    {m.full_name}
                    {m.id === meId && <span className="text-[9px] text-[#FFD700]/60 font-bold">ВЫ</span>}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className={`text-[9px] font-bold px-1 rounded ${ROLE_BADGE[m.role] || "bg-white/10 text-white/50"}`}>
                      {ROLE_LABEL[m.role] || m.role}
                    </span>
                    <span className={`font-roboto text-[10px] ${online ? "text-green-400" : "text-white/35"}`}>
                      {lastSeenText(m)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      {/* ─── ОСНОВНАЯ ОБЛАСТЬ ЧАТА ─── */}
      <section className={`${showMembers ? "hidden" : "flex"} lg:flex flex-1 flex-col min-w-0`}>
        {/* Шапка */}
        <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/5 bg-gradient-to-r from-[#FFD700]/[0.06] to-transparent">
          <div className="flex items-center gap-3 min-w-0">
            <button className="lg:hidden text-white/40 hover:text-[#FFD700]" onClick={() => setShowMembers(true)}>
              <Icon name="Users" size={18} />
            </button>
            <div className="w-10 h-10 rounded-md bg-gradient-to-br from-[#FFD700] to-yellow-600 flex items-center justify-center shrink-0 shadow-lg shadow-[#FFD700]/20">
              <span className="font-oswald font-bold text-black text-sm">VIP</span>
            </div>
            <div className="min-w-0">
              <div className="font-oswald font-bold uppercase tracking-wider text-base truncate">СКУПКА24<span className="text-[#FFD700]">Vip</span></div>
              <div className="font-roboto text-white/40 text-[10px]">
                <span className="text-green-400">● {onlineCount} онлайн</span> · {members.length} участников
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {pushSupported && (
              <button
                onClick={togglePush}
                disabled={pushBusy || pushPermission === "denied"}
                title={
                  pushPermission === "denied"
                    ? "Уведомления заблокированы — разблокируйте в настройках браузера"
                    : pushSubscribed
                      ? "Отключить уведомления"
                      : "Включить браузерные уведомления о новых сообщениях"
                }
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-[10px] font-roboto font-bold uppercase tracking-wide transition-all
                  ${pushSubscribed
                    ? "bg-green-500/15 border-green-500/40 text-green-400 hover:bg-green-500/25"
                    : pushPermission === "denied"
                      ? "bg-red-500/10 border-red-500/30 text-red-400/70 cursor-not-allowed"
                      : "bg-[#FFD700]/10 border-[#FFD700]/30 text-[#FFD700] hover:bg-[#FFD700]/20"}
                  ${pushBusy ? "opacity-60" : ""}`}>
                <Icon name={pushBusy ? "Loader" : pushSubscribed ? "BellRing" : "BellOff"}
                  size={12} className={pushBusy ? "animate-spin" : ""} />
                <span className="hidden sm:inline">
                  {pushBusy ? "..." : pushSubscribed ? "Уведомления вкл" : pushPermission === "denied" ? "Заблокированы" : "Уведомления"}
                </span>
              </button>
            )}
            {unread > 0 && (
              <span className="font-oswald font-bold text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full animate-pulse">
                +{unread}
              </span>
            )}
          </div>
        </header>

        {/* Hint про push */}
        {pushHint && (
          <div className="px-4 py-1.5 text-center text-[11px] font-roboto bg-[#FFD700]/8 text-[#FFD700]/80 border-b border-[#FFD700]/10">
            {pushHint}
          </div>
        )}

        {/* Лента сообщений */}
        <div ref={listRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3 scrollbar-premium">
          {error && (
            <div className="text-center text-red-400 font-roboto text-xs py-2">⚠ {error}</div>
          )}
          {!messages.length && !error && (
            <div className="flex-1 flex flex-col items-center justify-center py-16 text-center text-white/30 font-roboto">
              <Icon name="MessageCircle" size={42} className="text-[#FFD700]/30 mb-3" />
              <div className="font-oswald font-bold text-base text-[#FFD700]/60 uppercase">Чат пуст</div>
              <div className="text-xs mt-1">Будьте первым, кто напишет в СКУПКА24Vip</div>
            </div>
          )}

          {grouped.map(group => (
            <div key={group.day}>
              <div className="flex items-center gap-2 my-3">
                <div className="flex-1 h-px bg-white/5" />
                <span className="font-roboto text-[10px] text-white/30 uppercase tracking-widest">{group.day}</span>
                <div className="flex-1 h-px bg-white/5" />
              </div>

              {group.items.map((m, i) => {
                const mine = m.employee_id === meId;
                const prev = i > 0 ? group.items[i - 1] : null;
                const sameAuthor = prev && prev.employee_id === m.employee_id
                  && (new Date(m.created_at).getTime() - new Date(prev.created_at).getTime() < 3 * 60 * 1000);

                return (
                  <div key={m.id} className={`flex gap-2 ${mine ? "flex-row-reverse" : ""} ${sameAuthor ? "mt-0.5" : "mt-2"}`}>
                    <div className="w-8 shrink-0">
                      {!sameAuthor && (
                        m.avatar_url ? (
                          <img src={m.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover ring-1 ring-white/10" />
                        ) : (
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-oswald font-bold text-[11px]
                            ${m.role === "owner" ? "bg-gradient-to-br from-[#FFD700] to-yellow-600 text-black"
                              : m.role === "admin" ? "bg-gradient-to-br from-blue-500 to-blue-700 text-white"
                              : "bg-gradient-to-br from-[#333] to-[#1a1a1a] text-white/70"}`}>
                            {initials(m.full_name)}
                          </div>
                        )
                      )}
                    </div>
                    <div className={`max-w-[78%] ${mine ? "items-end" : "items-start"} flex flex-col gap-0.5`}>
                      {!sameAuthor && (
                        <div className={`flex items-center gap-1.5 text-[10px] ${mine ? "flex-row-reverse" : ""}`}>
                          <span className="font-oswald font-bold text-white/85">{m.full_name}</span>
                          <span className="text-white/30">{fmtTime(m.created_at)}</span>
                        </div>
                      )}
                      <div className={`relative rounded-2xl ${mine
                        ? "bg-gradient-to-br from-[#FFD700]/25 to-[#FFD700]/10 border border-[#FFD700]/30 text-white"
                        : "bg-white/5 border border-white/5 text-white/90"} ${m.photo_url ? "p-1.5" : "px-3 py-2"}`}>
                        {m.photo_url && (
                          <button
                            type="button"
                            onClick={() => setLightbox(m.photo_url)}
                            className="block max-w-[260px]">
                            <img
                              src={m.photo_url}
                              alt="Фото"
                              className="rounded-xl w-full max-h-72 object-cover hover:opacity-90 transition-opacity cursor-zoom-in"
                              loading="lazy"
                            />
                          </button>
                        )}
                        {m.text && (
                          <div className={`font-roboto text-sm whitespace-pre-wrap break-words leading-snug ${m.photo_url ? "px-2 pb-1.5 pt-1" : ""}`}>
                            {m.text}
                          </div>
                        )}
                        {sameAuthor && (
                          <span className="absolute bottom-0.5 right-2 text-[9px] text-white/30 font-roboto">{fmtTime(m.created_at)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Превью прикрепляемого фото */}
        {photoPreview && (
          <div className="px-3 py-2 border-t border-white/5 bg-black/40 flex items-center gap-3">
            <div className="relative">
              <img src={photoPreview} alt="" className="w-16 h-16 rounded-md object-cover ring-1 ring-[#FFD700]/30" />
              {photoUploading && (
                <div className="absolute inset-0 bg-black/60 rounded-md flex items-center justify-center">
                  <Icon name="Loader" size={18} className="animate-spin text-[#FFD700]" />
                </div>
              )}
              {photoUrl && (
                <span className="absolute -top-1 -right-1 bg-green-500 rounded-full w-5 h-5 flex items-center justify-center">
                  <Icon name="Check" size={11} className="text-white" />
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-roboto text-xs text-white/70">
                {photoUploading ? "Загружаю фото…" : photoUrl ? "Фото готово к отправке" : "Подготовка…"}
              </div>
            </div>
            <button onClick={cancelPhoto} className="text-white/30 hover:text-red-400 transition-colors p-2">
              <Icon name="X" size={16} />
            </button>
          </div>
        )}

        {/* Поле ввода */}
        <div className="border-t border-white/5 p-3 bg-black/40">
          <div className="flex items-end gap-2 bg-[#141414] border border-white/10 rounded-xl px-2 py-1.5 focus-within:border-[#FFD700]/40 transition-colors">
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={photoUploading}
              title="Прикрепить фото"
              className="shrink-0 p-2 text-white/40 hover:text-[#FFD700] transition-colors disabled:opacity-40">
              <Icon name="Paperclip" size={18} />
            </button>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Сообщение… (Enter — отправить, Shift+Enter — новая строка)"
              rows={1}
              className="flex-1 bg-transparent outline-none text-white font-roboto text-sm resize-none py-2 max-h-32 leading-snug placeholder:text-white/25"
              style={{ minHeight: "20px" }}
            />
            <button
              onClick={send}
              disabled={(!text.trim() && !photoUrl) || sending || photoUploading}
              title="Отправить"
              className="btn-gold-premium btn-sm shrink-0 disabled:opacity-40">
              {sending ? <Icon name="Loader" size={14} className="animate-spin" /> : <Icon name="Send" size={14} />}
              <span className="hidden sm:inline">Отправить</span>
            </button>
          </div>
        </div>
      </section>

      {/* ─── LIGHTBOX просмотра фото ─── */}
      {lightbox && (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 text-white/70 hover:text-white p-2" onClick={() => setLightbox(null)}>
            <Icon name="X" size={24} />
          </button>
          <img src={lightbox} alt="" className="max-w-full max-h-full object-contain rounded" onClick={e => e.stopPropagation()} />
          <a href={lightbox} download className="absolute bottom-4 right-4 btn-gold-outline btn-sm" onClick={e => e.stopPropagation()}>
            <Icon name="Download" size={14} /> Скачать
          </a>
        </div>
      )}
    </div>
  );
}