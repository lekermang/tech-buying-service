/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";

const API = "https://functions.poehali.dev/608c7976-816a-4e3e-b374-5dd617b045bf";

const api = async (action: string, method = "GET", body?: object, token?: string) => {
  const res = await fetch(`${API}?action=${action}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "X-Session-Token": token } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
};

const formatTime = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Вчера";
  if (diffDays < 7) return d.toLocaleDateString("ru-RU", { weekday: "short" });
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
};

const Avatar = ({ name, url, size = 40 }: { name: string; url?: string; size?: number }) => {
  const colors = ["#e53e3e","#dd6b20","#d69e2e","#38a169","#3182ce","#805ad5","#d53f8c"];
  const color = colors[name.charCodeAt(0) % colors.length];
  const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  return url
    ? <img src={url} alt={name} className="rounded-full object-cover shrink-0" style={{ width: size, height: size }} loading="lazy" />
    : <div className="rounded-full flex items-center justify-center shrink-0 text-white font-bold"
        style={{ width: size, height: size, background: color, fontSize: size * 0.35 }}>{initials}</div>;
};

// ── AUTH SCREEN ──────────────────────────────────────────────────
const AuthScreen = ({ onAuth }: { onAuth: (token: string, user: any) => void }) => {
  const [step, setStep] = useState<"form" | "otp">("form");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [demoOtp, setDemoOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async () => {
    if (!phone.trim() || !name.trim()) return setError("Введите имя и телефон");
    setLoading(true); setError("");
    const res = await api("register", "POST", { phone, name });
    setLoading(false);
    if (res.error) return setError(res.error);
    setDemoOtp(res.otp);
    setStep("otp");
  };

  const handleVerify = async () => {
    if (!otp.trim()) return setError("Введите код");
    setLoading(true); setError("");
    const res = await api("verify", "POST", { phone, otp });
    setLoading(false);
    if (res.error) return setError(res.error);
    const me = await api("me", "GET", undefined, res.token);
    localStorage.setItem("dzchat_token", res.token);
    onAuth(res.token, me);
  };

  return (
    <div className="min-h-screen bg-[#0f1923] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-[#25D366] rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="MessageCircle" size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">DzChat</h1>
          <p className="text-white/50 text-sm mt-1">Мессенджер нового поколения</p>
        </div>

        {step === "form" ? (
          <div className="space-y-3">
            <input
              type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="Ваше имя"
              className="w-full bg-white/10 text-white placeholder-white/40 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-[#25D366]"
            />
            <input
              type="tel" value={phone} onChange={e => setPhone(e.target.value)}
              placeholder="+7 (999) 000-00-00"
              className="w-full bg-white/10 text-white placeholder-white/40 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-[#25D366]"
              onKeyDown={e => e.key === "Enter" && handleRegister()}
            />
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            <button onClick={handleRegister} disabled={loading}
              className="w-full bg-[#25D366] text-white font-bold py-3 rounded-xl hover:bg-[#1da851] transition-colors disabled:opacity-50">
              {loading ? "Отправка..." : "Продолжить"}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-white/60 text-sm text-center">Код подтверждения для <b className="text-white">{phone}</b></p>
            {demoOtp && (
              <div className="bg-yellow-500/20 border border-yellow-500/40 rounded-xl p-3 text-center">
                <p className="text-yellow-400 text-xs mb-1">Демо-режим: ваш код</p>
                <p className="text-yellow-300 text-2xl font-bold tracking-widest">{demoOtp}</p>
              </div>
            )}
            <input
              type="text" value={otp} onChange={e => setOtp(e.target.value)} maxLength={6}
              placeholder="000000"
              className="w-full bg-white/10 text-white placeholder-white/40 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-[#25D366] text-center text-xl tracking-widest"
              onKeyDown={e => e.key === "Enter" && handleVerify()}
            />
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            <button onClick={handleVerify} disabled={loading}
              className="w-full bg-[#25D366] text-white font-bold py-3 rounded-xl hover:bg-[#1da851] transition-colors disabled:opacity-50">
              {loading ? "Проверка..." : "Войти"}
            </button>
            <button onClick={() => { setStep("form"); setError(""); setOtp(""); }} className="w-full text-white/40 text-sm py-2">
              Изменить номер
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ── CHAT VIEW ────────────────────────────────────────────────────
const ChatView = ({ chat, me, token, onBack }: { chat: any; me: any; token: string; onBack: () => void }) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [forwardMsg, setForwardMsg] = useState<any>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageB64, setImageB64] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [contextMsg, setContextMsg] = useState<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval>>();

  const loadMessages = useCallback(async () => {
    const data = await api(`messages&chat_id=${chat.id}`, "GET", undefined, token);
    if (Array.isArray(data)) setMessages(data);
    await api("read", "POST", { chat_id: chat.id }, token);
  }, [chat.id, token]);

  useEffect(() => {
    loadMessages();
    pollRef.current = setInterval(loadMessages, 3000);
    return () => clearInterval(pollRef.current);
  }, [loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const result = ev.target?.result as string;
      setImagePreview(result);
      setImageB64(result.split(",")[1]);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const send = async () => {
    if (!text.trim() && !imageB64) return;
    setSending(true);
    let photo_url = "";
    if (imageB64) {
      setUploadingPhoto(true);
      const res = await api("upload", "POST", { image: imageB64, mime: "image/jpeg" }, token);
      setUploadingPhoto(false);
      if (res.url) photo_url = res.url;
    }
    const res = await api("send", "POST", {
      chat_id: chat.id,
      text: text.trim() || undefined,
      photo_url: photo_url || undefined,
      forwarded_from: forwardMsg?.id,
    }, token);
    setSending(false);
    if (res.ok) {
      setText(""); setImagePreview(null); setImageB64(null); setForwardMsg(null);
      await loadMessages();
    }
  };

  const removeMsg = async (msg: any) => {
    await api("remove", "POST", { msg_id: msg.id }, token);
    setContextMsg(null);
    await loadMessages();
  };

  return (
    <div className="flex flex-col h-full bg-[#0f1923]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-[#1a2634] border-b border-white/10">
        <button onClick={onBack} className="text-white/60 hover:text-white md:hidden">
          <Icon name="ArrowLeft" size={22} />
        </button>
        <Avatar name={chat.name || "?"} url={chat.avatar_url} size={40} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white truncate">{chat.name}</p>
          <p className="text-xs text-white/40">
            {chat.partner?.last_seen_at ? `был(а) ${formatTime(chat.partner.last_seen_at)}` : "в сети"}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1" onClick={() => setContextMsg(null)}>
        {messages.map((msg, i) => {
          const isMine = msg.sender_id === me.id;
          const showAvatar = !isMine && (i === 0 || messages[i - 1]?.sender_id !== msg.sender_id);
          return (
            <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"} items-end gap-2`}>
              {!isMine && (
                <div style={{ width: 32 }}>
                  {showAvatar && <Avatar name={msg.sender_name} url={msg.sender_avatar} size={32} />}
                </div>
              )}
              <div
                className={`relative max-w-[75%] group`}
                onContextMenu={e => { e.preventDefault(); setContextMsg(msg); }}
                onLongPress={() => setContextMsg(msg)}
              >
                {msg.removed ? (
                  <div className={`px-3 py-2 rounded-2xl text-sm italic text-white/30 ${isMine ? "bg-[#1da851]/30" : "bg-white/10"}`}>
                    Сообщение удалено
                  </div>
                ) : (
                  <div className={`px-3 py-2 rounded-2xl text-sm ${isMine ? "bg-[#25D366] text-white rounded-br-sm" : "bg-[#1a2634] text-white rounded-bl-sm"}`}>
                    {!isMine && showAvatar && <p className="text-xs text-[#25D366] font-semibold mb-0.5">{msg.sender_name}</p>}
                    {msg.forwarded_from && <p className="text-xs opacity-50 mb-1 border-l-2 border-white/30 pl-2">Пересланное</p>}
                    {msg.photo_url && (
                      <img src={msg.photo_url} alt="фото" className="rounded-xl max-w-full mb-1 cursor-pointer"
                        style={{ maxHeight: 300 }} loading="lazy"
                        onClick={() => window.open(msg.photo_url, "_blank")} />
                    )}
                    {msg.text && <p className="whitespace-pre-wrap break-words">{msg.text}</p>}
                    <p className={`text-[10px] mt-0.5 text-right ${isMine ? "text-white/60" : "text-white/30"}`}>
                      {formatTime(msg.created_at)}
                      {isMine && <Icon name="CheckCheck" size={12} className="inline ml-1" />}
                    </p>
                  </div>
                )}
                {/* Context menu */}
                {contextMsg?.id === msg.id && (
                  <div className={`absolute ${isMine ? "right-0" : "left-0"} bottom-full mb-1 bg-[#1a2634] border border-white/10 rounded-xl shadow-xl z-20 min-w-[160px]`}
                    onClick={e => e.stopPropagation()}>
                    <button onClick={() => { setForwardMsg(msg); setContextMsg(null); }}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-white/80 hover:bg-white/5 text-sm">
                      <Icon name="Forward" size={15} /> Переслать
                    </button>
                    <button onClick={() => { navigator.clipboard.writeText(msg.text || ""); setContextMsg(null); }}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-white/80 hover:bg-white/5 text-sm">
                      <Icon name="Copy" size={15} /> Копировать
                    </button>
                    {isMine && !msg.removed && (
                      <button onClick={() => removeMsg(msg)}
                        className="flex items-center gap-2 w-full px-4 py-2.5 text-red-400 hover:bg-white/5 text-sm">
                        <Icon name="Trash2" size={15} /> Удалить
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Forward / Image preview */}
      {(forwardMsg || imagePreview) && (
        <div className="px-4 py-2 bg-[#1a2634] border-t border-white/10 flex items-center gap-3">
          {forwardMsg && (
            <>
              <div className="flex-1 border-l-2 border-[#25D366] pl-2">
                <p className="text-xs text-[#25D366]">Пересылка</p>
                <p className="text-xs text-white/60 truncate">{forwardMsg.text || "Фото"}</p>
              </div>
              <button onClick={() => setForwardMsg(null)} className="text-white/40"><Icon name="X" size={16} /></button>
            </>
          )}
          {imagePreview && (
            <>
              <img src={imagePreview} alt="preview" className="h-14 w-14 object-cover rounded-lg" />
              <button onClick={() => { setImagePreview(null); setImageB64(null); }} className="text-white/40"><Icon name="X" size={16} /></button>
            </>
          )}
        </div>
      )}

      {/* Input */}
      <div className="px-3 py-3 bg-[#1a2634] border-t border-white/10 flex items-end gap-2">
        <button onClick={() => fileRef.current?.click()} className="text-white/50 hover:text-white p-2 shrink-0">
          <Icon name="Image" size={22} />
        </button>
        <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
        <textarea
          value={text} onChange={e => setText(e.target.value)} rows={1}
          placeholder="Сообщение..."
          className="flex-1 bg-white/10 text-white placeholder-white/40 px-4 py-2.5 rounded-2xl outline-none resize-none text-sm max-h-32"
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          style={{ lineHeight: "1.4" }}
        />
        <button onClick={send} disabled={sending || uploadingPhoto || (!text.trim() && !imageB64)}
          className="w-10 h-10 bg-[#25D366] rounded-full flex items-center justify-center shrink-0 hover:bg-[#1da851] transition-colors disabled:opacity-40">
          {(sending || uploadingPhoto) ? <Icon name="Loader" size={18} className="text-white animate-spin" /> : <Icon name="Send" size={18} className="text-white" />}
        </button>
      </div>
    </div>
  );
};

// ── NEW CHAT MODAL ───────────────────────────────────────────────
const NewChatModal = ({ token, onClose, onChatCreated }: { token: string; onClose: () => void; onChatCreated: (id: number) => void }) => {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const search = async (q: string) => {
    setQuery(q);
    if (!q.trim()) return setUsers([]);
    setLoading(true);
    const res = await api(`users&q=${encodeURIComponent(q)}`, "GET", undefined, token);
    setLoading(false);
    if (Array.isArray(res)) setUsers(res);
  };

  const start = async (partnerId: number) => {
    const res = await api("create", "POST", { partner_id: partnerId }, token);
    if (res.chat_id) { onChatCreated(res.chat_id); onClose(); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-[#1a2634] w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">Новый чат</h3>
          <button onClick={onClose} className="text-white/40"><Icon name="X" size={18} /></button>
        </div>
        <input type="text" value={query} onChange={e => search(e.target.value)}
          placeholder="Поиск по имени или телефону..."
          className="w-full bg-white/10 text-white placeholder-white/40 px-4 py-2.5 rounded-xl outline-none mb-3" />
        {loading && <p className="text-white/40 text-sm text-center py-4">Поиск...</p>}
        <div className="space-y-1 max-h-60 overflow-y-auto">
          {users.map(u => (
            <button key={u.id} onClick={() => start(u.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors">
              <Avatar name={u.name} url={u.avatar_url} size={40} />
              <div className="text-left">
                <p className="text-white text-sm font-medium">{u.name}</p>
                <p className="text-white/40 text-xs">{u.phone}</p>
              </div>
            </button>
          ))}
          {!loading && query && users.length === 0 && (
            <p className="text-white/30 text-sm text-center py-4">Никого не найдено</p>
          )}
        </div>
      </div>
    </div>
  );
};

// ── PROFILE MODAL ────────────────────────────────────────────────
const ProfileModal = ({ me, token, onClose, onUpdate }: { me: any; token: string; onClose: () => void; onUpdate: (u: any) => void }) => {
  const [name, setName] = useState(me.name);
  const [avatarB64, setAvatarB64] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(me.avatar_url);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { const r = ev.target?.result as string; setAvatarPreview(r); setAvatarB64(r.split(",")[1]); };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const save = async () => {
    setSaving(true);
    let avatar_url = me.avatar_url;
    if (avatarB64) {
      const res = await api("upload", "POST", { image: avatarB64, mime: "image/jpeg" }, token);
      if (res.url) avatar_url = res.url;
    }
    await api("profile", "POST", { name, avatar_url }, token);
    setSaving(false);
    onUpdate({ ...me, name, avatar_url });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-[#1a2634] w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-semibold">Профиль</h3>
          <button onClick={onClose} className="text-white/40"><Icon name="X" size={18} /></button>
        </div>
        <div className="flex flex-col items-center gap-4 mb-5">
          <div className="relative cursor-pointer" onClick={() => fileRef.current?.click()}>
            <Avatar name={name || "?"} url={avatarPreview || undefined} size={80} />
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <Icon name="Camera" size={20} className="text-white" />
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
        </div>
        <input type="text" value={name} onChange={e => setName(e.target.value)}
          placeholder="Ваше имя"
          className="w-full bg-white/10 text-white placeholder-white/40 px-4 py-2.5 rounded-xl outline-none mb-3" />
        <p className="text-white/30 text-xs mb-4">Телефон: {me.phone}</p>
        <button onClick={save} disabled={saving}
          className="w-full bg-[#25D366] text-white font-bold py-3 rounded-xl hover:bg-[#1da851] transition-colors disabled:opacity-50">
          {saving ? "Сохранение..." : "Сохранить"}
        </button>
      </div>
    </div>
  );
};

// ── MAIN ─────────────────────────────────────────────────────────
const DzChat = () => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("dzchat_token"));
  const [me, setMe] = useState<any>(null);
  const [chats, setChats] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [loadingChats, setLoadingChats] = useState(false);
  const [newChatId, setNewChatId] = useState<number | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval>>();

  const loadChats = useCallback(async (tok: string) => {
    const data = await api("chats", "GET", undefined, tok);
    if (Array.isArray(data)) setChats(data);
  }, []);

  useEffect(() => {
    if (!token) return;
    setLoadingChats(true);
    api("me", "GET", undefined, token).then(u => {
      if (u.error) { localStorage.removeItem("dzchat_token"); setToken(null); return; }
      setMe(u);
      loadChats(token).finally(() => setLoadingChats(false));
      pollRef.current = setInterval(() => loadChats(token), 4000);
    });
    return () => clearInterval(pollRef.current);
  }, [token, loadChats]);

  useEffect(() => {
    if (newChatId && chats.length > 0) {
      const chat = chats.find(c => c.id === newChatId);
      if (chat) { setActiveChat(chat); setNewChatId(null); }
    }
  }, [chats, newChatId]);

  const logout = () => { localStorage.removeItem("dzchat_token"); setToken(null); setMe(null); setChats([]); setActiveChat(null); };

  if (!token || !me) return <AuthScreen onAuth={(tok, user) => { setToken(tok); setMe(user); }} />;

  const totalUnread = chats.reduce((s, c) => s + (c.unread || 0), 0);

  return (
    <div className="h-screen bg-[#0f1923] flex overflow-hidden">
      {/* SIDEBAR */}
      <div className={`${activeChat ? "hidden md:flex" : "flex"} flex-col w-full md:w-80 lg:w-96 bg-[#1a2634] border-r border-white/10 shrink-0`}>
        {/* Sidebar header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#1a2634] border-b border-white/10">
          <button onClick={() => setShowProfile(true)} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Avatar name={me.name} url={me.avatar_url} size={36} />
            <div className="text-left hidden sm:block">
              <p className="text-white text-sm font-semibold leading-none">{me.name}</p>
              <p className="text-white/40 text-xs mt-0.5">DzChat</p>
            </div>
          </button>
          <div className="flex items-center gap-1">
            <button onClick={() => setShowNewChat(true)}
              className="w-9 h-9 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-colors">
              <Icon name="SquarePen" size={20} />
            </button>
            <button onClick={logout}
              className="w-9 h-9 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-colors">
              <Icon name="LogOut" size={18} />
            </button>
          </div>
        </div>

        {/* DzChat brand */}
        <div className="px-4 py-2 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-[#25D366] rounded-md flex items-center justify-center">
              <Icon name="MessageCircle" size={12} className="text-white" />
            </div>
            <span className="text-white/60 text-xs font-medium uppercase tracking-wider">DzChat</span>
            {totalUnread > 0 && <span className="ml-auto bg-[#25D366] text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{totalUnread}</span>}
          </div>
        </div>

        {/* Chat list */}
        <div className="flex-1 overflow-y-auto">
          {loadingChats && chats.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-white/30"><Icon name="Loader" size={24} className="animate-spin" /></div>
          ) : chats.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Icon name="MessageSquarePlus" size={40} className="text-white/20 mx-auto mb-3" />
              <p className="text-white/40 text-sm">Нет чатов</p>
              <button onClick={() => setShowNewChat(true)} className="mt-3 text-[#25D366] text-sm">Начать диалог</button>
            </div>
          ) : chats.map(chat => (
            <button key={chat.id} onClick={() => setActiveChat(chat)}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 ${activeChat?.id === chat.id ? "bg-white/10" : ""}`}>
              <div className="relative shrink-0">
                <Avatar name={chat.name || "?"} url={chat.avatar_url} size={48} />
                {chat.unread > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#25D366] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {chat.unread > 9 ? "9+" : chat.unread}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between">
                  <p className="text-white text-sm font-semibold truncate">{chat.name}</p>
                  {chat.last_message && <p className="text-white/30 text-xs shrink-0 ml-2">{formatTime(chat.last_message.created_at)}</p>}
                </div>
                <p className="text-white/40 text-xs truncate mt-0.5">
                  {chat.last_message?.text || (chat.last_message?.photo_url ? "📷 Фото" : "Нет сообщений")}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* CHAT AREA */}
      <div className={`${activeChat ? "flex" : "hidden md:flex"} flex-1 flex-col`}>
        {activeChat ? (
          <ChatView chat={activeChat} me={me} token={token} onBack={() => setActiveChat(null)} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-white/20">
            <Icon name="MessageCircle" size={60} className="mb-4" />
            <p className="text-lg">Выберите чат</p>
            <p className="text-sm mt-1">или начните новый диалог</p>
          </div>
        )}
      </div>

      {showNewChat && <NewChatModal token={token} onClose={() => setShowNewChat(false)} onChatCreated={id => { setNewChatId(id); loadChats(token); }} />}
      {showProfile && <ProfileModal me={me} token={token} onClose={() => setShowProfile(false)} onUpdate={u => setMe(u)} />}
    </div>
  );
};

export default DzChat;