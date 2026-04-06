/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { api, formatTime } from "./dzchat.utils";
import DzChatAvatar from "./DzChatAvatar";

const DzChatView = ({ chat, me, token, onBack }: { chat: any; me: any; token: string; onBack: () => void }) => {
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
        <DzChatAvatar name={chat.name || "?"} url={chat.avatar_url} size={40} />
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
                  {showAvatar && <DzChatAvatar name={msg.sender_name} url={msg.sender_avatar} size={32} />}
                </div>
              )}
              <div
                className="relative max-w-[75%] group"
                onContextMenu={e => { e.preventDefault(); setContextMsg(msg); }}
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

export default DzChatView;
