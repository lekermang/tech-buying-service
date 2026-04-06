/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRef } from "react";
import Icon from "@/components/ui/icon";
import { VoiceRecorder } from "./DzChatVoice";

// ── ReplyPreview ──────────────────────────────────────────────────
export const ReplyPreview = ({ replyTo, forwardMsg, imagePreview, onClearReply, onClearForward, onClearImage }: {
  replyTo: any;
  forwardMsg: any;
  imagePreview: string | null;
  onClearReply: () => void;
  onClearForward: () => void;
  onClearImage: () => void;
}) => {
  if (!replyTo && !forwardMsg && !imagePreview) return null;
  return (
    <div className="px-3 py-2 bg-[#1a2634] border-t border-white/10 shrink-0">
      {replyTo && (
        <div className="flex items-center gap-2">
          <div className="flex-1 border-l-2 border-[#25D366] pl-2">
            <p className="text-xs text-[#25D366] font-medium">Ответ: {replyTo.sender_name}</p>
            <p className="text-xs text-white/50 truncate">
              {replyTo.voice_url ? "🎤 Голосовое" : replyTo.photo_url ? "📷 Фото" : replyTo.text}
            </p>
          </div>
          <button onClick={onClearReply} className="text-white/40 hover:text-white"><Icon name="X" size={16} /></button>
        </div>
      )}
      {forwardMsg && !replyTo && (
        <div className="flex items-center gap-2">
          <div className="flex-1 border-l-2 border-blue-400 pl-2">
            <p className="text-xs text-blue-400">Пересылка</p>
            <p className="text-xs text-white/50 truncate">{forwardMsg.text || "Фото"}</p>
          </div>
          <button onClick={onClearForward} className="text-white/40 hover:text-white"><Icon name="X" size={16} /></button>
        </div>
      )}
      {imagePreview && (
        <div className="flex items-center gap-2 mt-1">
          <img src={imagePreview} alt="preview" className="h-12 w-12 object-cover rounded-lg" />
          <p className="text-xs text-white/50 flex-1">Фото готово к отправке</p>
          <button onClick={onClearImage} className="text-white/40 hover:text-white"><Icon name="X" size={16} /></button>
        </div>
      )}
    </div>
  );
};

// ── ChatInput ─────────────────────────────────────────────────────
export const ChatInput = ({ text, setText, sending, uploadingPhoto, imageB64, textareaRef, onSend, onSendVoice, onPhotoSelect }: {
  text: string;
  setText: (v: string) => void;
  sending: boolean;
  uploadingPhoto: boolean;
  imageB64: string | null;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  onSend: () => void;
  onSendVoice: (b64: string, dur: number) => void;
  onPhotoSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => {
  const fileRef = useRef<HTMLInputElement>(null);

  const autoResize = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  };

  return (
    <div className="px-2 py-2 bg-[#1a2634] border-t border-white/10 flex items-end gap-1.5 shrink-0">
      <button onClick={() => fileRef.current?.click()}
        className="text-white/50 hover:text-white p-2 shrink-0 transition-colors">
        <Icon name="Paperclip" size={22} />
      </button>
      <input ref={fileRef} type="file" accept="image/*,video/*" onChange={onPhotoSelect} className="hidden" />
      <div className="flex-1 bg-[#0f1923] rounded-2xl px-3 py-2">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => { setText(e.target.value); autoResize(); }}
          rows={1}
          placeholder="Сообщение..."
          className="w-full bg-transparent text-white placeholder-white/30 outline-none resize-none text-sm leading-relaxed"
          style={{ maxHeight: 120 }}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); } }}
        />
      </div>
      {text.trim() || imageB64 ? (
        <button onClick={onSend} disabled={sending}
          className="w-10 h-10 bg-[#25D366] rounded-full flex items-center justify-center text-white hover:bg-[#1da851] transition-colors disabled:opacity-50 shrink-0">
          {sending || uploadingPhoto
            ? <Icon name="Loader" size={18} className="animate-spin" />
            : <Icon name="Send" size={18} />}
        </button>
      ) : (
        <VoiceRecorder onSend={onSendVoice} disabled={sending} />
      )}
    </div>
  );
};
