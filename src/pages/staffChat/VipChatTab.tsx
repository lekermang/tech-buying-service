import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import Icon from "@/components/ui/icon";
import funcUrls from "../../../backend/func2url.json";
import EnableNotificationsBanner from "./EnableNotificationsBanner";
import EmojiPicker, { EmojiStyle, Theme } from "emoji-picker-react";

const VIP_CHAT_URL = (funcUrls as Record<string, string>)["vip-chat"];

type Msg = {
  id: number;
  author_id: number;
  author_name: string;
  author_avatar: string | null;
  text: string | null;
  photo_url: string | null;
  created_at: string;
  recipient_id?: number | null;
};

type Member = {
  id: number;
  full_name: string;
  avatar_url: string | null;
  role: string;
  last_seen_at: string | null;
  unread?: number;
};

type Me = { id: number; role: string; full_name: string };

const isOnline = (lastSeen: string | null) => {
  if (!lastSeen) return false;
  return Date.now() - new Date(lastSeen).getTime() < 90_000; // 90 сек
};

export default function VipChatTab({ token }: { token: string }) {
  // peer = 0 — общий чат, иначе ID собеседника
  const [peer, setPeer] = useState<number>(0);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [me, setMe] = useState<Me | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const lastIdRef = useRef(0);
  const peerRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const apiCall = useCallback(
    async (action: string, body: Record<string, unknown> = {}) => {
      const r = await fetch(VIP_CHAT_URL, {
        method: "POST",
        headers: { "X-Employee-Token": token, "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...body }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.json();
    },
    [token],
  );

  const poll = useCallback(async () => {
    try {
      const d = await apiCall("poll", {
        after_id: lastIdRef.current,
        peer_id: peerRef.current,
      });
      if (d.me?.id) setMe(d.me);
      if (Array.isArray(d.members)) setMembers(d.members);
      if (Array.isArray(d.messages) && d.messages.length > 0) {
        setMessages((prev) => {
          const ids = new Set(prev.map((m) => m.id));
          const fresh = d.messages.filter((m: Msg) => !ids.has(m.id));
          if (fresh.length === 0) return prev;
          const next = [...prev, ...fresh];
          lastIdRef.current = Math.max(lastIdRef.current, ...fresh.map((m: Msg) => m.id));
          return next;
        });
        const lastId = d.messages[d.messages.length - 1].id;
        await apiCall("mark_read", { msg_id: lastId, peer_id: peerRef.current }).catch(() => {});
      }
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  // Смена диалога: сбрасываем сообщения и грузим заново
  useEffect(() => {
    peerRef.current = peer;
    lastIdRef.current = 0;
    setMessages([]);
    setLoading(true);
    poll();
  }, [peer, poll]);

  // Поллинг каждые 4 сек
  useEffect(() => {
    const id = setInterval(poll, 4000);
    return () => clearInterval(id);
  }, [poll]);

  // Автоскролл вниз
  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length]);

  const send = async () => {
    const t = text.trim();
    if (!t || sending) return;
    setSending(true);
    try {
      await apiCall("send", { text: t, recipient_id: peer || undefined });
      setText("");
      setShowEmoji(false);
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

  const uploadPhoto = async (file: File) => {
    setSending(true);
    try {
      const b64 = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => {
          const s = String(r.result || "");
          resolve(s.split(",")[1] || "");
        };
        r.onerror = reject;
        r.readAsDataURL(file);
      });
      const up = await apiCall("upload_photo", { base64: b64, mime_type: file.type });
      if (up?.photo_url) {
        await apiCall("send", {
          text: text.trim() || undefined,
          photo_url: up.photo_url,
          recipient_id: peer || undefined,
        });
        setText("");
        await poll();
      }
    } catch (e) {
      setError("Фото не загружено: " + (e as Error).message);
    } finally {
      setSending(false);
    }
  };

  const uploadMyAvatar = async (file: File) => {
    try {
      const b64 = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result || "").split(",")[1] || "");
        r.onerror = reject;
        r.readAsDataURL(file);
      });
      const up = await apiCall("upload_photo", { base64: b64, mime_type: file.type });
      if (up?.photo_url) {
        await apiCall("update_avatar", { avatar_url: up.photo_url });
        setShowAvatarModal(false);
        await poll();
      }
    } catch (e) {
      setError("Аватар не обновлён: " + (e as Error).message);
    }
  };

  const peerMember = useMemo(
    () => (peer ? members.find((m) => m.id === peer) || null : null),
    [peer, members],
  );
  const myAvatar = useMemo(
    () => (me ? members.find((m) => m.id === me.id)?.avatar_url || null : null),
    [me, members],
  );

  // Сортированный список собеседников: сначала с непрочитанными, потом онлайн, потом остальные
  const dialogList = useMemo(() => {
    if (!me) return [];
    return members
      .filter((m) => m.id !== me.id)
      .sort((a, b) => {
        const ua = a.unread || 0;
        const ub = b.unread || 0;
        if (ua !== ub) return ub - ua;
        const oa = isOnline(a.last_seen_at) ? 1 : 0;
        const ob = isOnline(b.last_seen_at) ? 1 : 0;
        if (oa !== ob) return ob - oa;
        return a.full_name.localeCompare(b.full_name, "ru");
      });
  }, [members, me]);

  const totalDmUnread = useMemo(
    () => dialogList.reduce((s, m) => s + (m.unread || 0), 0),
    [dialogList],
  );

  return (
    <div className="flex h-[calc(100dvh-180px)] gap-3 p-2 sm:p-3">
      {/* САЙДБАР: список диалогов */}
      <aside
        className={`${
          showMobileSidebar ? "absolute inset-0 z-40 bg-[#0A0A0A]" : "hidden"
        } md:relative md:block md:w-72 md:flex-shrink-0 bg-gradient-to-b from-[#0E0E0E] to-[#080808] border border-[#1F1F1F] rounded-xl overflow-hidden flex flex-col`}
      >
        <div className="p-3 border-b border-[#1F1F1F] flex items-center gap-2">
          <Icon name="MessagesSquare" size={16} className="text-[#FFD700]" />
          <div className="font-oswald font-bold text-white uppercase tracking-wider text-sm">
            Чат команды
          </div>
          <button
            onClick={() => setShowMobileSidebar(false)}
            className="ml-auto md:hidden p-1 rounded hover:bg-white/10"
          >
            <Icon name="X" size={16} className="text-white/60" />
          </button>
        </div>

        {/* Профиль (моя аватарка) */}
        {me && (
          <div className="p-3 border-b border-[#1F1F1F] flex items-center gap-2.5">
            <button
              onClick={() => setShowAvatarModal(true)}
              className="relative w-10 h-10 rounded-full bg-[#FFD700]/15 border-2 border-[#FFD700]/40 flex items-center justify-center text-sm text-[#FFD700] font-bold overflow-hidden group"
              title="Сменить аватарку"
            >
              {myAvatar ? (
                <img src={myAvatar} alt="" className="w-full h-full object-cover" />
              ) : (
                me.full_name.slice(0, 1).toUpperCase()
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                <Icon name="Camera" size={14} className="text-white" />
              </div>
            </button>
            <div className="min-w-0">
              <div className="text-[12px] font-semibold text-white truncate">{me.full_name}</div>
              <div className="text-[10px] text-white/40 capitalize">{me.role}</div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {/* Общий чат */}
          <button
            onClick={() => {
              setPeer(0);
              setShowMobileSidebar(false);
            }}
            className={`w-full flex items-center gap-3 p-3 border-b border-[#1F1F1F]/60 hover:bg-white/[0.03] text-left transition ${
              peer === 0 ? "bg-[#FFD700]/[0.08] border-l-2 border-l-[#FFD700]" : ""
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FFD700]/30 to-[#FFD700]/10 border border-[#FFD700]/30 flex items-center justify-center shrink-0">
              <Icon name="Users" size={18} className="text-[#FFD700]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold text-white truncate">Общий чат</div>
              <div className="text-[11px] text-white/40 truncate">Все сотрудники</div>
            </div>
          </button>

          {/* Личные диалоги */}
          <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-white/40 font-semibold flex items-center gap-2">
            Личные сообщения
            {totalDmUnread > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-[#FFD700] text-black text-[9px] font-bold">
                {totalDmUnread}
              </span>
            )}
          </div>

          {dialogList.map((m) => {
            const online = isOnline(m.last_seen_at);
            const active = peer === m.id;
            return (
              <button
                key={m.id}
                onClick={() => {
                  setPeer(m.id);
                  setShowMobileSidebar(false);
                }}
                className={`w-full flex items-center gap-3 p-3 border-b border-[#1F1F1F]/60 hover:bg-white/[0.03] text-left transition ${
                  active ? "bg-[#FFD700]/[0.08] border-l-2 border-l-[#FFD700]" : ""
                }`}
              >
                <div className="relative w-10 h-10 rounded-full bg-[#1A1A1A] border border-white/10 flex items-center justify-center text-sm text-white/70 font-bold shrink-0 overflow-hidden">
                  {m.avatar_url ? (
                    <img src={m.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    m.full_name.slice(0, 1).toUpperCase()
                  )}
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0A0A0A] ${
                      online ? "bg-green-500" : "bg-gray-500"
                    }`}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold text-white truncate flex items-center gap-1">
                    {m.full_name}
                  </div>
                  <div className="text-[11px] text-white/40 truncate capitalize">
                    {online ? "в сети" : m.role}
                  </div>
                </div>
                {!!m.unread && m.unread > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-[#FFD700] text-black text-[10px] font-bold min-w-[20px] text-center">
                    {m.unread}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </aside>

      {/* ОСНОВНАЯ ЧАСТЬ: переписка */}
      <div className="flex-1 flex flex-col gap-2 min-w-0">
        <EnableNotificationsBanner token={token} />

        {/* Заголовок текущего чата */}
        <div className="flex items-center gap-3 px-3 py-2 bg-[#0E0E0E] border border-[#1F1F1F] rounded-xl">
          <button
            onClick={() => setShowMobileSidebar(true)}
            className="md:hidden p-1 rounded hover:bg-white/10"
          >
            <Icon name="Menu" size={18} className="text-white/70" />
          </button>
          {peer === 0 ? (
            <>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FFD700]/30 to-[#FFD700]/10 border border-[#FFD700]/30 flex items-center justify-center">
                <Icon name="Users" size={16} className="text-[#FFD700]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-bold text-white truncate">Общий чат</div>
                <div className="text-[11px] text-white/40">
                  {members.length} {members.length === 1 ? "участник" : "участников"}
                </div>
              </div>
            </>
          ) : peerMember ? (
            <>
              <div className="relative w-9 h-9 rounded-full bg-[#1A1A1A] border border-white/10 flex items-center justify-center text-sm text-white/70 font-bold overflow-hidden">
                {peerMember.avatar_url ? (
                  <img src={peerMember.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  peerMember.full_name.slice(0, 1).toUpperCase()
                )}
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0E0E0E] ${
                    isOnline(peerMember.last_seen_at) ? "bg-green-500" : "bg-gray-500"
                  }`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-bold text-white truncate">
                  {peerMember.full_name}
                </div>
                <div className="text-[11px] text-white/40">
                  {isOnline(peerMember.last_seen_at) ? "в сети" : "не в сети"} ·{" "}
                  <span className="capitalize">{peerMember.role}</span>
                </div>
              </div>
            </>
          ) : null}
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
              <span className="text-xs">
                {peer === 0 ? "Пока сообщений нет. Напиши первым!" : "Начни переписку — напиши первым."}
              </span>
            </div>
          )}
          {messages.map((m) => {
            const mine = me?.id === m.author_id;
            return (
              <div key={m.id} className={`flex gap-2 ${mine ? "flex-row-reverse" : ""}`}>
                <div className="w-7 h-7 rounded-full bg-[#FFD700]/15 border border-[#FFD700]/30 flex items-center justify-center text-[10px] text-[#FFD700] font-bold shrink-0 overflow-hidden">
                  {m.author_avatar ? (
                    <img src={m.author_avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    (m.author_name || "?").slice(0, 1).toUpperCase()
                  )}
                </div>
                <div
                  className={`max-w-[80%] ${mine ? "items-end" : "items-start"} flex flex-col`}
                >
                  <div className={`text-[10px] text-white/45 px-2 ${mine ? "text-right" : ""}`}>
                    {m.author_name} ·{" "}
                    {new Date(m.created_at).toLocaleTimeString("ru-RU", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                  <div
                    className={`px-3 py-1.5 rounded-2xl text-[13px] leading-snug whitespace-pre-wrap break-words ${
                      mine
                        ? "bg-gradient-to-br from-[#FFD700]/25 to-[#FFD700]/10 border border-[#FFD700]/30 text-white"
                        : "bg-[#1A1A1A] border border-white/5 text-white/90"
                    }`}
                  >
                    {m.photo_url && (
                      <img
                        src={m.photo_url}
                        alt=""
                        className="max-w-[280px] rounded-md mb-1.5 cursor-zoom-in"
                        onClick={() => window.open(m.photo_url!, "_blank")}
                      />
                    )}
                    {m.text}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Emoji picker */}
        {showEmoji && (
          <div className="absolute bottom-24 right-6 z-30 shadow-2xl rounded-xl overflow-hidden">
            <EmojiPicker
              onEmojiClick={(e) => {
                setText((prev) => prev + e.emoji);
                setShowEmoji(false);
              }}
              theme={Theme.DARK}
              emojiStyle={EmojiStyle.NATIVE}
              width={320}
              height={400}
              searchPlaceHolder="Поиск смайлика…"
              previewConfig={{ showPreview: false }}
            />
          </div>
        )}

        {/* Поле ввода */}
        <div className="flex gap-2 items-end">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] text-white/70 hover:text-[#FFD700] hover:border-[#FFD700]/30"
            title="Прикрепить фото"
          >
            <Icon name="Paperclip" size={16} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadPhoto(f);
              e.target.value = "";
            }}
          />

          <button
            type="button"
            onClick={() => setShowEmoji((s) => !s)}
            className={`p-2.5 rounded-lg border ${
              showEmoji
                ? "bg-[#FFD700]/15 border-[#FFD700]/40 text-[#FFD700]"
                : "bg-[#1A1A1A] border-[#2A2A2A] text-white/70 hover:text-[#FFD700] hover:border-[#FFD700]/30"
            }`}
            title="Смайлики"
          >
            <Icon name="Smile" size={16} />
          </button>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder={
              peer === 0
                ? "Сообщение в общий чат… (Enter — отправить)"
                : `Сообщение для ${peerMember?.full_name || ""}… (Enter — отправить)`
            }
            className="flex-1 bg-[#0A0A0A] border border-[#1F1F1F] focus:border-[#FFD700]/40 text-white px-3 py-2.5 rounded-lg text-[13px] resize-none focus:outline-none max-h-32"
          />
          <button
            onClick={send}
            disabled={sending || !text.trim()}
            className="px-4 py-2.5 rounded-lg bg-gradient-to-b from-[#FFE34D] to-[#d4a017] text-black text-[13px] font-bold uppercase tracking-wider disabled:opacity-40 hover:brightness-110"
          >
            {sending ? (
              <Icon name="Loader" size={14} className="animate-spin" />
            ) : (
              <Icon name="Send" size={14} />
            )}
          </button>
        </div>
      </div>

      {/* МОДАЛКА: смена аватарки */}
      {showAvatarModal && me && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowAvatarModal(false)}
        >
          <div
            className="bg-[#0E0E0E] border border-[#FFD700]/30 rounded-2xl p-6 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <Icon name="UserCircle" size={20} className="text-[#FFD700]" />
              <h3 className="font-oswald font-bold text-white uppercase tracking-wider">
                Моя аватарка
              </h3>
              <button
                onClick={() => setShowAvatarModal(false)}
                className="ml-auto p-1 rounded hover:bg-white/10"
              >
                <Icon name="X" size={18} className="text-white/60" />
              </button>
            </div>
            <div className="flex flex-col items-center gap-4">
              <div className="w-32 h-32 rounded-full bg-[#FFD700]/15 border-2 border-[#FFD700]/40 flex items-center justify-center text-3xl text-[#FFD700] font-bold overflow-hidden">
                {myAvatar ? (
                  <img src={myAvatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  me.full_name.slice(0, 1).toUpperCase()
                )}
              </div>
              <button
                onClick={() => avatarInputRef.current?.click()}
                className="px-4 py-2.5 rounded-lg bg-gradient-to-b from-[#FFE34D] to-[#d4a017] text-black text-[12px] font-bold uppercase tracking-wider"
              >
                <Icon name="Upload" size={14} className="inline mr-1.5" />
                Загрузить фото
              </button>
              {myAvatar && (
                <button
                  onClick={async () => {
                    await apiCall("update_avatar", { avatar_url: "" }).catch(() => {});
                    setShowAvatarModal(false);
                    await poll();
                  }}
                  className="text-[11px] text-white/40 hover:text-red-400 underline"
                >
                  Удалить аватарку
                </button>
              )}
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadMyAvatar(f);
                  e.target.value = "";
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
