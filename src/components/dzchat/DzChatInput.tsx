/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRef, useState } from "react";
import Icon from "@/components/ui/icon";
import { VoiceRecorder } from "./DzChatVoice";

// ── Эмодзи по категориям ──────────────────────────────────────────
const EMOJI_CATEGORIES = [
  { label: "😊", emojis: ["😀","😃","😄","😁","😆","😅","😂","🤣","😊","😇","🙂","🙃","😉","😌","😍","🥰","😘","😗","😙","😚","😋","😛","😝","😜","🤪","🤨","🧐","🤓","😎","🤩","🥳","😏","😒","😞","😔","😟","😕","🙁","☹️","😣","😖","😫","😩","🥺","😢","😭","😤","😠","😡","🤬","🤯","😳","🥵","🥶","😱","😨","😰","😥","😓","🤗","🤔","🫣","🤭","🫡","🤫","🫠","🤥","😶","😐","😑","😬","🙄","😯","😦","😧","😮","😲","🥱","😴","🤤","😪","😵","🤐","🥴","🤢","🤮","🤧","😷","🤒","🤕"] },
  { label: "👍", emojis: ["👋","🤚","🖐","✋","🖖","🫱","🫲","🤙","👌","🤌","🤏","✌️","🤞","🫰","🤟","🤘","👈","👉","👆","🖕","👇","☝️","🫵","👍","👎","✊","👊","🤛","🤜","👏","🙌","🫶","👐","🤲","🤝","🙏","✍️","💅","🤳","💪","🦾","🦿","🦵","🦶","👂","🦻","👃","🫀","🫁","🧠","🦷","🦴","👀","👁","👅","👄","🫦"] },
  { label: "❤️", emojis: ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","❤️‍🔥","❤️‍🩹","💔","💕","💞","💓","💗","💖","💘","💝","💟","☮️","✝️","☯️","🕉","🛐","💯","💢","💥","💫","💦","💨","🕳","💬","💭","💤","🔥","🌟","✨","🎉","🎊","🥂","🍾","🎁","🎈"] },
  { label: "🐶", emojis: ["🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯","🦁","🐮","🐷","🐸","🐵","🙈","🙉","🙊","🐔","🐧","🐦","🦆","🦅","🦉","🦇","🐺","🐗","🐴","🦄","🐝","🐛","🦋","🐌","🐞","🐜","🦟","🦗","🕷","🦂","🐢","🐍","🦎","🦖","🦕","🐙","🦑","🦐","🦞","🦀","🐡","🐠","🐟","🐬","🐳","🐋","🦈","🐊","🐅","🐆","🦓","🦍","🦧","🦣","🐘","🦛","🦏","🐪","🐫","🦒","🦘","🦬","🐃","🐂","🐄","🐎","🐖","🐏","🐑","🦙","🐐","🦌","🐕","🐩","🦮","🐈","🐓","🦃","🦤","🦚","🦜","🦢","🦩","🕊","🐇","🦝","🦨","🦡","🦫","🦦","🦥","🐿","🦔"] },
  { label: "🍕", emojis: ["🍎","🍐","🍊","🍋","🍌","🍉","🍇","🍓","🫐","🍈","🍒","🍑","🥭","🍍","🥥","🥝","🍅","🍆","🥑","🥦","🥬","🥒","🌶","🫑","🧄","🧅","🥔","🍠","🥐","🥯","🍞","🥖","🥨","🧀","🥚","🍳","🧈","🥞","🧇","🥓","🥩","🍗","🍖","🦴","🌭","🍔","🍟","🍕","🫓","🥪","🥙","🧆","🌮","🌯","🫔","🥗","🥘","🫕","🍝","🍜","🍲","🍛","🍣","🍱","🥟","🦪","🍤","🍙","🍚","🍘","🍥","🥮","🍢","🧁","🍰","🎂","🍮","🍭","🍬","🍫","🍿","🍩","🍪","🌰","🥜","🍯","🧃","🥤","🧋","☕","🍵","🍺","🍻","🥂","🍷","🥃","🍸","🍹","🧉","🍾"] },
  { label: "⚽", emojis: ["⚽","🏀","🏈","⚾","🥎","🎾","🏐","🏉","🥏","🎱","🪀","🏓","🏸","🏒","🥍","🏑","🥅","⛳","🪁","🎣","🤿","🎽","🎿","🛷","🥌","🎯","🪃","🏋️","🤼","🤸","⛹️","🤺","🤾","🏌️","🏇","🧘","🏄","🏊","🤽","🚣","🧗","🚵","🚴","🏆","🥇","🥈","🥉","🏅","🎖","🎗","🎫","🎟","🎪","🎭","🎨","🎬","🎤","🎧","🎼","🎹","🎸","🎺","🎻","🪕","🥁","🪘","🎷"] },
];

// ── EmojiPicker ────────────────────────────────────────────────────
const EmojiPicker = ({ onSelect, onClose }: { onSelect: (e: string) => void; onClose: () => void }) => {
  const [cat, setCat] = useState(0);
  return (
    <div className="absolute bottom-14 left-0 w-72 bg-[#1a2634] border border-white/10 rounded-2xl shadow-2xl z-40 overflow-hidden">
      {/* Категории */}
      <div className="flex border-b border-white/10">
        {EMOJI_CATEGORIES.map((c, i) => (
          <button key={i} onClick={() => setCat(i)}
            className={`flex-1 py-2 text-base transition-colors ${cat === i ? "bg-white/10" : "hover:bg-white/5"}`}>
            {c.label}
          </button>
        ))}
      </div>
      {/* Сетка эмодзи */}
      <div className="grid grid-cols-8 gap-0.5 p-2 max-h-52 overflow-y-auto">
        {EMOJI_CATEGORIES[cat].emojis.map(e => (
          <button key={e} onClick={() => { onSelect(e); onClose(); }}
            className="text-xl p-1 hover:bg-white/10 rounded-lg transition-colors leading-none">
            {e}
          </button>
        ))}
      </div>
    </div>
  );
};

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
          {imagePreview.startsWith("data:video") || imagePreview.startsWith("blob:") ? (
            <video src={imagePreview} className="h-12 w-12 object-cover rounded-lg" muted playsInline />
          ) : (
            <img src={imagePreview} alt="preview" className="h-12 w-12 object-cover rounded-lg" />
          )}
          <p className="text-xs text-white/50 flex-1">{imagePreview.startsWith("data:video") || imagePreview.startsWith("blob:") ? "Видео" : "Фото"} готово к отправке</p>
          <button onClick={onClearImage} className="text-white/40 hover:text-white"><Icon name="X" size={16} /></button>
        </div>
      )}
    </div>
  );
};

// ── ChatInput ─────────────────────────────────────────────────────
export const ChatInput = ({ text, setText, sending, uploadingPhoto, imageB64, textareaRef, onSend, onSendVoice, onPhotoSelect, onTyping }: {
  text: string;
  setText: (v: string) => void;
  sending: boolean;
  uploadingPhoto: boolean;
  imageB64: string | null;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  onSend: () => void;
  onSendVoice: (b64: string, dur: number, mime: string) => void;
  onPhotoSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTyping?: () => void;
}) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [showEmoji, setShowEmoji] = useState(false);

  const autoResize = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  };

  const insertEmoji = (emoji: string) => {
    const ta = textareaRef.current;
    if (!ta) { setText(text + emoji); return; }
    const start = ta.selectionStart ?? text.length;
    const end = ta.selectionEnd ?? text.length;
    const next = text.slice(0, start) + emoji + text.slice(end);
    setText(next);
    // восстанавливаем курсор после emoji
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start + emoji.length, start + emoji.length);
      autoResize();
    });
  };

  return (
    <div className="px-2 py-2 bg-[#1a2634] border-t border-white/10 flex items-end gap-1.5 shrink-0 relative"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}>
      {/* Эмодзи-пикер */}
      {showEmoji && (
        <EmojiPicker
          onSelect={insertEmoji}
          onClose={() => setShowEmoji(false)}
        />
      )}

      {/* Кнопка фото/видео — всегда видна */}
      <button onClick={() => fileRef.current?.click()}
        className="w-10 h-10 flex items-center justify-center text-white/60 hover:text-[#25D366] active:text-[#25D366] transition-colors shrink-0">
        <Icon name="Image" size={23} />
      </button>
      <input ref={fileRef} type="file" accept="image/*,video/*" onChange={onPhotoSelect} className="hidden" />

      {/* Поле ввода + эмодзи */}
      <div className="flex-1 bg-[#0f1923] rounded-2xl px-3 py-2 flex items-end gap-1 min-w-0">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => { setText(e.target.value); autoResize(); onTyping?.(); }}
          rows={1}
          placeholder="Сообщение..."
          className="flex-1 bg-transparent text-white placeholder-white/30 outline-none resize-none text-sm leading-relaxed min-w-0"
          style={{ maxHeight: 120 }}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); } }}
          onFocus={() => setShowEmoji(false)}
        />
        <button
          type="button"
          onClick={() => setShowEmoji(s => !s)}
          className={`shrink-0 transition-colors mb-0.5 ${showEmoji ? "text-[#25D366]" : "text-white/30 hover:text-white/70"}`}>
          <Icon name="Smile" size={19} />
        </button>
      </div>

      {/* Отправить / микрофон */}
      {text.trim() || imageB64 ? (
        <button onClick={onSend} disabled={sending}
          className="w-10 h-10 bg-[#25D366] rounded-full flex items-center justify-center text-white active:bg-[#1da851] transition-colors disabled:opacity-50 shrink-0">
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