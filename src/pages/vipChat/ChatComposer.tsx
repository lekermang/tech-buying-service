import { forwardRef } from "react";
import Icon from "@/components/ui/icon";

type Props = {
  text: string;
  setText: (v: string) => void;
  sending: boolean;
  photoPreview: string | null;
  photoUploading: boolean;
  photoUrl: string | null;
  onCancelPhoto: () => void;
  onPickFile: () => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSend: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  lightbox: string | null;
  onCloseLightbox: () => void;
};

const ChatComposer = forwardRef<HTMLInputElement, Props>(function ChatComposer({
  text, setText, sending,
  photoPreview, photoUploading, photoUrl,
  onCancelPhoto, onPickFile, onFileChange, onSend, onKeyDown,
  lightbox, onCloseLightbox,
}, fileRef) {
  return (
    <>
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
          <button onClick={onCancelPhoto} className="text-white/30 hover:text-red-400 transition-colors p-2">
            <Icon name="X" size={16} />
          </button>
        </div>
      )}

      {/* Поле ввода */}
      <div className="border-t border-white/5 p-3 bg-black/40">
        <div className="flex items-end gap-2 bg-[#141414] border border-white/10 rounded-xl px-2 py-1.5 focus-within:border-[#FFD700]/40 transition-colors">
          <input ref={fileRef} type="file" accept="image/*" onChange={onFileChange} className="hidden" />
          <button
            onClick={onPickFile}
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
            onClick={onSend}
            disabled={(!text.trim() && !photoUrl) || sending || photoUploading}
            title="Отправить"
            className="btn-gold-premium btn-sm shrink-0 disabled:opacity-40">
            {sending ? <Icon name="Loader" size={14} className="animate-spin" /> : <Icon name="Send" size={14} />}
            <span className="hidden sm:inline">Отправить</span>
          </button>
        </div>
      </div>

      {/* ─── LIGHTBOX просмотра фото ─── */}
      {lightbox && (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={onCloseLightbox}>
          <button className="absolute top-4 right-4 text-white/70 hover:text-white p-2" onClick={onCloseLightbox}>
            <Icon name="X" size={24} />
          </button>
          <img src={lightbox} alt="" className="max-w-full max-h-full object-contain rounded" onClick={e => e.stopPropagation()} />
          <a href={lightbox} download className="absolute bottom-4 right-4 btn-gold-outline btn-sm" onClick={e => e.stopPropagation()}>
            <Icon name="Download" size={14} /> Скачать
          </a>
        </div>
      )}
    </>
  );
});

export default ChatComposer;
