/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { api, formatTime } from "./dzchat.utils";
import DzChatAvatar from "./DzChatAvatar";

const REACTIONS = ["❤️", "😂", "😮", "😢", "👍", "🙏"];

// Компонент голосового сообщения
const VoiceMessage = ({ url, duration, isMine }: { url: string; duration: number; isMine: boolean }) => {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play(); setPlaying(true); }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => { setCurrentTime(audio.currentTime); setProgress(audio.duration ? (audio.currentTime / audio.duration) * 100 : 0); };
    const onEnd = () => { setPlaying(false); setProgress(0); setCurrentTime(0); };
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnd);
    return () => { audio.removeEventListener("timeupdate", onTime); audio.removeEventListener("ended", onEnd); };
  }, []);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  return (
    <div className={`flex items-center gap-2 min-w-[180px] ${isMine ? "flex-row" : "flex-row"}`}>
      <audio ref={audioRef} src={url} preload="metadata" />
      <button onClick={toggle}
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${isMine ? "bg-white/20" : "bg-[#25D366]/80"}`}>
        <Icon name={playing ? "Pause" : "Play"} size={16} className="text-white" />
      </button>
      <div className="flex-1">
        <div className="relative h-1.5 rounded-full bg-white/20 cursor-pointer"
          onClick={e => {
            if (!audioRef.current) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const pct = (e.clientX - rect.left) / rect.width;
            audioRef.current.currentTime = pct * audioRef.current.duration;
          }}>
          <div className="absolute inset-y-0 left-0 rounded-full bg-white/70" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-[10px] mt-0.5 opacity-60">{fmt(currentTime || 0)} / {fmt(duration || 0)}</p>
      </div>
    </div>
  );
};

// Статус сообщения
const MsgStatus = ({ msg, me }: { msg: any; me: any }) => {
  if (msg.sender_id !== me.id) return null;
  if (msg.is_read) return <span className="text-blue-400 inline-flex items-center ml-1"><Icon name="CheckCheck" size={12} /></span>;
  return <span className="opacity-50 inline-flex items-center ml-1"><Icon name="CheckCheck" size={12} /></span>;
};

// Кнопка записи голосового
const VoiceRecorder = ({ onSend, disabled }: { onSend: (b64: string, dur: number) => void; disabled: boolean }) => {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const startRef = useRef<number>(0);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = e => chunksRef.current.push(e.data);
      mr.onstop = () => {
        const dur = Math.round((Date.now() - startRef.current) / 1000);
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onload = ev => {
          const b64 = (ev.target?.result as string).split(",")[1];
          onSend(b64, dur);
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start();
      mediaRef.current = mr;
      startRef.current = Date.now();
      setRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } catch {
      alert("Нет доступа к микрофону");
    }
  };

  const stop = () => {
    mediaRef.current?.stop();
    clearInterval(timerRef.current);
    setRecording(false);
  };

  const cancel = () => {
    if (mediaRef.current) {
      mediaRef.current.ondataavailable = null;
      mediaRef.current.onstop = null;
      mediaRef.current.stop();
      mediaRef.current.stream?.getTracks().forEach(t => t.stop());
    }
    clearInterval(timerRef.current);
    setRecording(false);
    setSeconds(0);
  };

  if (recording) {
    return (
      <div className="flex items-center gap-2">
        <button onClick={cancel} className="text-white/40 hover:text-red-400 p-2"><Icon name="X" size={18} /></button>
        <span className="text-red-400 text-sm font-mono animate-pulse">⏺ {Math.floor(seconds/60)}:{String(seconds%60).padStart(2,"0")}</span>
        <button onClick={stop} className="w-9 h-9 bg-[#25D366] rounded-full flex items-center justify-center text-white">
          <Icon name="Send" size={16} />
        </button>
      </div>
    );
  }

  return (
    <button onMouseDown={start} disabled={disabled}
      className="text-white/50 hover:text-[#25D366] p-2 transition-colors disabled:opacity-30">
      <Icon name="Mic" size={22} />
    </button>
  );
};

const DzChatView = ({ chat, me, token, onBack, onChatUpdate }: {
  chat: any; me: any; token: string; onBack: () => void; onChatUpdate?: () => void;
}) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState<any>(null);
  const [forwardMsg, setForwardMsg] = useState<any>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageB64, setImageB64] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [contextMsg, setContextMsg] = useState<any>(null);
  const [reactionPickerMsg, setReactionPickerMsg] = useState<any>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval>>();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const msgRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const loadMessages = useCallback(async () => {
    const data = await api(`messages&chat_id=${chat.id}`, "GET", undefined, token);
    if (Array.isArray(data)) setMessages(data);
    await api("read", "POST", { chat_id: chat.id }, token);
    onChatUpdate?.();
  }, [chat.id, token, onChatUpdate]);

  useEffect(() => {
    setMessages([]); setReplyTo(null); setContextMsg(null); setShowSearch(false);
    loadMessages();
    pollRef.current = setInterval(loadMessages, 3000);
    return () => clearInterval(pollRef.current);
  }, [chat.id, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

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
      const res = await api("upload", "POST", { image: imageB64, mime: "image/jpeg", kind: "photo" }, token);
      setUploadingPhoto(false);
      if (res.url) photo_url = res.url;
    }
    const res = await api("send", "POST", {
      chat_id: chat.id,
      text: text.trim() || undefined,
      photo_url: photo_url || undefined,
      forwarded_from: forwardMsg?.id,
      reply_to: replyTo?.id,
    }, token);
    setSending(false);
    if (res.ok) {
      setText(""); setImagePreview(null); setImageB64(null); setForwardMsg(null); setReplyTo(null);
      await loadMessages();
    }
  };

  const sendVoice = async (b64: string, duration: number) => {
    setSending(true);
    const res = await api("upload", "POST", { image: b64, mime: "audio/webm", kind: "voice" }, token);
    if (res.url) {
      await api("send", "POST", { chat_id: chat.id, voice_url: res.url, voice_duration: duration }, token);
      await loadMessages();
    }
    setSending(false);
  };

  const removeMsg = async (msg: any) => {
    await api("remove", "POST", { msg_id: msg.id }, token);
    setContextMsg(null);
    await loadMessages();
  };

  const react = async (msg: any, emoji: string) => {
    setReactionPickerMsg(null);
    await api("react", "POST", { msg_id: msg.id, emoji }, token);
    await loadMessages();
  };

  const doSearch = async (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) { setSearchResults([]); return; }
    const data = await api(`search_messages&chat_id=${chat.id}&q=${encodeURIComponent(q)}`, "GET", undefined, token);
    if (Array.isArray(data)) setSearchResults(data);
  };

  const scrollToMsg = (msgId: number) => {
    const el = msgRefs.current[msgId];
    if (el) { el.scrollIntoView({ behavior: "smooth", block: "center" }); el.classList.add("bg-yellow-400/10"); setTimeout(() => el.classList.remove("bg-yellow-400/10"), 1500); }
  };

  const loadGroupInfo = async () => {
    const data = await api(`group_info&chat_id=${chat.id}`, "GET", undefined, token);
    if (data.members) setGroupMembers(data.members);
    setShowGroupInfo(true);
  };

  const autoResize = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  };

  const partnerOnline = chat.partner?.is_online;
  const lastSeen = chat.partner?.last_seen_at;

  return (
    <div className="flex flex-col h-full bg-[#0a1929]" onClick={() => { setContextMsg(null); setReactionPickerMsg(null); }}>

      {/* ── HEADER ── */}
      <div className="flex items-center gap-3 px-3 py-2.5 bg-[#1a2634] border-b border-white/10 shrink-0">
        <button onClick={onBack} className="text-white/60 hover:text-white md:hidden p-1">
          <Icon name="ArrowLeft" size={22} />
        </button>
        <button onClick={chat.type === "group" ? loadGroupInfo : undefined} className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity">
          <div className="relative">
            <DzChatAvatar name={chat.name || "?"} url={chat.avatar_url} size={40} />
            {partnerOnline && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#25D366] border-2 border-[#1a2634] rounded-full" />
            )}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="font-semibold text-white truncate text-sm">{chat.name}</p>
            <p className="text-xs text-white/40 truncate">
              {chat.type === "group"
                ? "Нажми чтобы увидеть участников"
                : partnerOnline
                  ? <span className="text-[#25D366]">в сети</span>
                  : lastSeen ? `был(а) ${formatTime(lastSeen)}` : ""}
            </p>
          </div>
        </button>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => { setShowSearch(s => !s); setSearchQuery(""); setSearchResults([]); }}
            className="w-9 h-9 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors">
            <Icon name="Search" size={18} />
          </button>
        </div>
      </div>

      {/* ── SEARCH BAR ── */}
      {showSearch && (
        <div className="px-3 py-2 bg-[#1a2634] border-b border-white/10 shrink-0">
          <input autoFocus value={searchQuery} onChange={e => doSearch(e.target.value)}
            placeholder="Поиск по сообщениям..."
            className="w-full bg-white/10 text-white placeholder-white/30 px-3 py-2 rounded-xl text-sm outline-none focus:ring-1 focus:ring-[#25D366]" />
          {searchResults.length > 0 && (
            <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
              {searchResults.map(r => (
                <button key={r.id} onClick={() => { scrollToMsg(r.id); setShowSearch(false); }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 transition-colors">
                  <p className="text-xs text-[#25D366]">{r.sender_name}</p>
                  <p className="text-sm text-white/80 truncate">{r.text}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── MESSAGES ── */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5"
        style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)", backgroundSize: "24px 24px" }}>
        {messages.map((msg, i) => {
          const isMine = msg.sender_id === me.id;
          const prevMsg = messages[i - 1];
          const nextMsg = messages[i + 1];
          const showAvatar = !isMine && (!prevMsg || prevMsg.sender_id !== msg.sender_id);
          const isLast = !nextMsg || nextMsg.sender_id !== msg.sender_id;

          // Группировка по времени — показываем дату-разделитель
          const showDateSep = !prevMsg || new Date(msg.created_at).toDateString() !== new Date(prevMsg.created_at).toDateString();

          return (
            <div key={msg.id}>
              {showDateSep && (
                <div className="flex justify-center my-3">
                  <span className="bg-[#1a2634]/80 text-white/40 text-xs px-3 py-1 rounded-full">
                    {new Date(msg.created_at).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                </div>
              )}
              <div ref={el => { msgRefs.current[msg.id] = el; }}
                className={`flex ${isMine ? "justify-end" : "justify-start"} items-end gap-1.5 transition-colors rounded-lg ${isLast ? "mb-1" : "mb-0.5"}`}>
                {!isMine && (
                  <div style={{ width: 32, flexShrink: 0 }}>
                    {showAvatar && <DzChatAvatar name={msg.sender_name} url={msg.sender_avatar} size={28} />}
                  </div>
                )}
                <div className="relative max-w-[78%] group"
                  onContextMenu={e => { e.preventDefault(); e.stopPropagation(); setContextMsg(msg); setReactionPickerMsg(null); }}>
                  {msg.removed ? (
                    <div className={`px-3 py-2 rounded-2xl text-sm italic text-white/30 ${isMine ? "bg-[#1e4a2e]/60" : "bg-white/8"}`}>
                      🚫 Сообщение удалено
                    </div>
                  ) : (
                    <div className={`px-3 py-2 rounded-2xl text-sm shadow-sm ${
                      isMine
                        ? "bg-[#1e6f3e] text-white rounded-br-sm"
                        : "bg-[#1e2c3a] text-white rounded-bl-sm"
                    }`}>
                      {/* Имя в группе */}
                      {!isMine && showAvatar && chat.type === "group" && (
                        <p className="text-xs font-semibold mb-0.5" style={{ color: ["#ef4444","#f97316","#eab308","#22c55e","#3b82f6","#a855f7"][msg.sender_id % 6] }}>
                          {msg.sender_name}
                        </p>
                      )}
                      {/* Цитата reply */}
                      {msg.reply && (
                        <div className={`border-l-2 border-[#25D366] pl-2 mb-1.5 rounded-r cursor-pointer bg-white/5 py-1 pr-2`}
                          onClick={() => scrollToMsg(msg.reply.id)}>
                          <p className="text-[11px] text-[#25D366] font-medium">{msg.reply.sender_name}</p>
                          <p className="text-[11px] text-white/60 truncate">
                            {msg.reply.voice_url ? "🎤 Голосовое" : msg.reply.photo_url ? "📷 Фото" : msg.reply.text}
                          </p>
                        </div>
                      )}
                      {/* Пересланное */}
                      {msg.forwarded_from && (
                        <p className="text-xs text-white/40 mb-1 italic">↪ Пересланное сообщение</p>
                      )}
                      {/* Фото */}
                      {msg.photo_url && (
                        <img src={msg.photo_url} alt="фото" className="rounded-xl max-w-full mb-1 cursor-pointer block"
                          style={{ maxHeight: 280 }} loading="lazy"
                          onClick={() => window.open(msg.photo_url, "_blank")} />
                      )}
                      {/* Голосовое */}
                      {msg.voice_url && (
                        <VoiceMessage url={msg.voice_url} duration={msg.voice_duration || 0} isMine={isMine} />
                      )}
                      {/* Текст */}
                      {msg.text && <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.text}</p>}
                      {/* Время + статус */}
                      <div className="flex items-center justify-end gap-1 mt-0.5">
                        <span className={`text-[10px] ${isMine ? "text-white/50" : "text-white/30"}`}>
                          {formatTime(msg.created_at)}
                        </span>
                        <MsgStatus msg={msg} me={me} />
                      </div>
                    </div>
                  )}

                  {/* Реакции */}
                  {msg.reactions && msg.reactions.length > 0 && (
                    <div className={`flex flex-wrap gap-0.5 mt-0.5 ${isMine ? "justify-end" : "justify-start"}`}>
                      {msg.reactions.map((r: any) => (
                        <button key={r.emoji} onClick={() => react(msg, r.emoji)}
                          className="bg-[#1a2634] border border-white/10 rounded-full px-1.5 py-0.5 text-xs hover:border-[#25D366]/50 transition-colors"
                          title={r.users?.join(", ")}>
                          {r.emoji} {r.count > 1 ? r.count : ""}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Быстрая реакция при наведении */}
                  {!msg.removed && (
                    <button
                      onClick={e => { e.stopPropagation(); setReactionPickerMsg(msg.id === reactionPickerMsg ? null : msg); setContextMsg(null); }}
                      className={`absolute ${isMine ? "-left-8" : "-right-8"} top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-[#1a2634] border border-white/10 items-center justify-center text-white/40 hover:text-white hidden group-hover:flex transition-colors z-10`}>
                      <Icon name="Smile" size={14} />
                    </button>
                  )}

                  {/* Пикер реакций */}
                  {reactionPickerMsg?.id === msg.id && (
                    <div className={`absolute ${isMine ? "right-0" : "left-0"} -top-12 bg-[#1a2634] border border-white/15 rounded-2xl px-2 py-1.5 flex gap-1 z-30 shadow-xl`}
                      onClick={e => e.stopPropagation()}>
                      {REACTIONS.map(e => (
                        <button key={e} onClick={() => react(msg, e)}
                          className="text-lg hover:scale-125 transition-transform p-0.5">{e}</button>
                      ))}
                    </div>
                  )}

                  {/* Контекстное меню */}
                  {contextMsg?.id === msg.id && (
                    <div className={`absolute ${isMine ? "right-0" : "left-0"} bottom-full mb-1 bg-[#1e2c3a] border border-white/10 rounded-2xl shadow-2xl z-20 min-w-[180px] overflow-hidden`}
                      onClick={e => e.stopPropagation()}>
                      <button onClick={() => { setReplyTo(msg); setContextMsg(null); textareaRef.current?.focus(); }}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-white/80 hover:bg-white/5 text-sm">
                        <Icon name="Reply" size={15} className="text-[#25D366]" /> Ответить
                      </button>
                      <button onClick={() => { setForwardMsg(msg); setContextMsg(null); }}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-white/80 hover:bg-white/5 text-sm">
                        <Icon name="Forward" size={15} className="text-blue-400" /> Переслать
                      </button>
                      {msg.text && (
                        <button onClick={() => { navigator.clipboard.writeText(msg.text || ""); setContextMsg(null); }}
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-white/80 hover:bg-white/5 text-sm">
                          <Icon name="Copy" size={15} className="text-white/50" /> Копировать
                        </button>
                      )}
                      {isMine && !msg.removed && (
                        <button onClick={() => removeMsg(msg)}
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-red-400 hover:bg-white/5 text-sm border-t border-white/5">
                          <Icon name="Trash2" size={15} /> Удалить
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* ── REPLY / FORWARD PREVIEW ── */}
      {(replyTo || forwardMsg || imagePreview) && (
        <div className="px-3 py-2 bg-[#1a2634] border-t border-white/10 shrink-0">
          {replyTo && (
            <div className="flex items-center gap-2">
              <div className="flex-1 border-l-2 border-[#25D366] pl-2">
                <p className="text-xs text-[#25D366] font-medium">Ответ: {replyTo.sender_name}</p>
                <p className="text-xs text-white/50 truncate">
                  {replyTo.voice_url ? "🎤 Голосовое" : replyTo.photo_url ? "📷 Фото" : replyTo.text}
                </p>
              </div>
              <button onClick={() => setReplyTo(null)} className="text-white/40 hover:text-white"><Icon name="X" size={16} /></button>
            </div>
          )}
          {forwardMsg && !replyTo && (
            <div className="flex items-center gap-2">
              <div className="flex-1 border-l-2 border-blue-400 pl-2">
                <p className="text-xs text-blue-400">Пересылка</p>
                <p className="text-xs text-white/50 truncate">{forwardMsg.text || "Фото"}</p>
              </div>
              <button onClick={() => setForwardMsg(null)} className="text-white/40 hover:text-white"><Icon name="X" size={16} /></button>
            </div>
          )}
          {imagePreview && (
            <div className="flex items-center gap-2 mt-1">
              <img src={imagePreview} alt="preview" className="h-12 w-12 object-cover rounded-lg" />
              <p className="text-xs text-white/50 flex-1">Фото готово к отправке</p>
              <button onClick={() => { setImagePreview(null); setImageB64(null); }} className="text-white/40 hover:text-white"><Icon name="X" size={16} /></button>
            </div>
          )}
        </div>
      )}

      {/* ── INPUT ── */}
      <div className="px-2 py-2 bg-[#1a2634] border-t border-white/10 flex items-end gap-1.5 shrink-0">
        <button onClick={() => fileRef.current?.click()}
          className="text-white/50 hover:text-white p-2 shrink-0 transition-colors">
          <Icon name="Paperclip" size={22} />
        </button>
        <input ref={fileRef} type="file" accept="image/*,video/*" onChange={handlePhoto} className="hidden" />
        <div className="flex-1 bg-[#0f1923] rounded-2xl px-3 py-2">
          <textarea
            ref={textareaRef}
            value={text} onChange={e => { setText(e.target.value); autoResize(); }} rows={1}
            placeholder="Сообщение..."
            className="w-full bg-transparent text-white placeholder-white/30 outline-none resize-none text-sm leading-relaxed"
            style={{ maxHeight: 120 }}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          />
        </div>
        {text.trim() || imageB64 ? (
          <button onClick={send} disabled={sending}
            className="w-10 h-10 bg-[#25D366] rounded-full flex items-center justify-center text-white hover:bg-[#1da851] transition-colors disabled:opacity-50 shrink-0">
            {sending || uploadingPhoto
              ? <Icon name="Loader" size={18} className="animate-spin" />
              : <Icon name="Send" size={18} />}
          </button>
        ) : (
          <VoiceRecorder onSend={sendVoice} disabled={sending} />
        )}
      </div>

      {/* ── GROUP INFO MODAL ── */}
      {showGroupInfo && (
        <div className="absolute inset-0 bg-black/60 z-50 flex items-end md:items-center justify-center" onClick={() => setShowGroupInfo(false)}>
          <div className="bg-[#1a2634] rounded-t-2xl md:rounded-2xl w-full max-w-sm max-h-[70vh] overflow-y-auto p-4"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Участники группы</h3>
              <button onClick={() => setShowGroupInfo(false)} className="text-white/40 hover:text-white"><Icon name="X" size={20} /></button>
            </div>
            {groupMembers.map(m => (
              <div key={m.id} className="flex items-center gap-3 py-2 border-b border-white/5">
                <div className="relative">
                  <DzChatAvatar name={m.name} url={m.avatar_url} size={36} />
                  {m.is_online && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#25D366] border-2 border-[#1a2634] rounded-full" />}
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{m.name}</p>
                  <p className="text-white/40 text-xs">{m.is_online ? <span className="text-[#25D366]">в сети</span> : m.last_seen_at ? formatTime(m.last_seen_at) : ""}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DzChatView;
