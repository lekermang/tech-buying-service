import { RefObject, useRef } from "react";
import Icon from "@/components/ui/icon";

type Props = {
  photos: string[];
  busy: boolean;
  totalPhotosLeft: number;
  uploadProgress: { done: number; total: number } | null;
  draggingIdx: number | null;
  dragOverIdx: number | null;
  fileRef: RefObject<HTMLInputElement>;
  onPickFiles: (files: FileList) => void;
  removePhoto: (url: string) => void;
  movePhoto: (idx: number, dir: -1 | 1) => void;
  setAsMain: (i: number) => void;
  onDragStart: (i: number) => void;
  onDragOver: (e: React.DragEvent, i: number) => void;
  onDrop: (e: React.DragEvent, i: number) => void;
  onDragEnd: () => void;
};

export default function EditModalPhotos({
  photos,
  busy,
  totalPhotosLeft,
  uploadProgress,
  draggingIdx,
  dragOverIdx,
  fileRef,
  onPickFiles,
  removePhoto,
  movePhoto,
  setAsMain,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: Props) {
  const galleryRef = useRef<HTMLInputElement>(null);
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="font-oswald font-bold text-white text-xs uppercase tracking-wide">
            Фотографии
          </div>
          <div className="text-[10px] text-white/40 mt-0.5">
            {photos.length}/5 · перетащи чтобы изменить порядок
          </div>
        </div>
        {totalPhotosLeft > 0 && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              className="flex items-center gap-1 bg-gradient-to-r from-[#FFD700] to-[#FFE55C] text-black font-oswald font-bold text-[11px] px-2.5 py-1.5 rounded uppercase tracking-wide hover:shadow-[0_0_12px_rgba(255,215,0,0.4)] disabled:opacity-50 transition-all"
              title="Снять с камеры"
            >
              <Icon name="Camera" size={12} />
              Камера
            </button>
            <button
              onClick={() => galleryRef.current?.click()}
              disabled={busy}
              className="flex items-center gap-1 bg-[#FFD700]/15 border border-[#FFD700]/40 text-[#FFD700] font-oswald font-bold text-[11px] px-2.5 py-1.5 rounded uppercase tracking-wide hover:bg-[#FFD700]/25 disabled:opacity-50 transition-all"
              title="Выбрать из галереи"
            >
              <Icon name="Image" size={12} />
              Галерея ({totalPhotosLeft})
            </button>
          </div>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={e => {
          const fs = e.target.files;
          if (fs && fs.length) onPickFiles(fs);
          e.target.value = "";
        }}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={e => {
          const fs = e.target.files;
          if (fs && fs.length) onPickFiles(fs);
          e.target.value = "";
        }}
      />

      {uploadProgress && (
        <div className="mb-2 bg-[#FFD700]/10 border border-[#FFD700]/30 rounded-lg p-2">
          <div className="flex items-center justify-between text-[11px] text-white/80 mb-1">
            <span className="flex items-center gap-1.5">
              <Icon name="Loader2" size={11} className="animate-spin text-[#FFD700]" />
              Загружаю фото...
            </span>
            <span className="font-oswald font-bold text-[#FFD700]">
              {uploadProgress.done} / {uploadProgress.total}
            </span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#FFD700] to-[#FFE55C] transition-all duration-300"
              style={{ width: `${Math.round((uploadProgress.done / uploadProgress.total) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {photos.length === 0 ? (
        <div className="w-full rounded-lg border-2 border-dashed border-[#FFD700]/30 hover:border-[#FFD700]/60 p-4 transition-all">
          <div className="flex flex-col items-center justify-center gap-1.5 text-white/60 mb-3">
            <Icon name="ImagePlus" size={32} className="text-[#FFD700]/70" />
            <div className="font-oswald font-bold text-sm uppercase tracking-wide text-white/80">Добавить фото товара</div>
            <div className="text-[10px] text-white/40">До 5 фото · с камеры или из галереи</div>
          </div>
          <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto">
            <button
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              className="inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-[#FFD700] to-[#FFE55C] text-black font-oswald font-bold text-[11px] px-3 py-2 rounded uppercase tracking-wide hover:shadow-[0_0_12px_rgba(255,215,0,0.4)] disabled:opacity-50 transition-all"
            >
              <Icon name="Camera" size={13} />
              Снять
            </button>
            <button
              onClick={() => galleryRef.current?.click()}
              disabled={busy}
              className="inline-flex items-center justify-center gap-1.5 bg-[#FFD700]/15 border border-[#FFD700]/40 text-[#FFD700] font-oswald font-bold text-[11px] px-3 py-2 rounded uppercase tracking-wide hover:bg-[#FFD700]/25 disabled:opacity-50 transition-all"
            >
              <Icon name="Image" size={13} />
              Из галереи
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {photos.map((url, i) => (
            <div
              key={url}
              draggable
              onDragStart={() => onDragStart(i)}
              onDragOver={e => onDragOver(e, i)}
              onDrop={e => onDrop(e, i)}
              onDragEnd={onDragEnd}
              className={`relative group aspect-square rounded overflow-hidden bg-black cursor-grab active:cursor-grabbing transition-all ${
                draggingIdx === i ? "opacity-40 scale-95" : ""
              } ${dragOverIdx === i && draggingIdx !== i ? "ring-2 ring-[#FFD700] scale-105" : ""}`}
            >
              <img src={url} alt="" className="w-full h-full object-cover pointer-events-none" />
              {i === 0 && (
                <div className="absolute top-1 left-1 bg-gradient-to-r from-[#FFD700] to-[#FFE55C] text-black font-oswald font-bold text-[9px] px-1 py-0.5 rounded uppercase shadow-md flex items-center gap-0.5">
                  <Icon name="Star" size={8} />
                  Главное
                </div>
              )}
              <div className="absolute top-1 right-1 bg-black/70 text-white/80 text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {i + 1}
              </div>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/70 transition-all flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 p-1">
                <div className="flex gap-1">
                  {i > 0 && (
                    <button
                      onClick={() => setAsMain(i)}
                      disabled={busy}
                      className="w-7 h-7 bg-[#FFD700] hover:bg-[#FFE55C] rounded text-black"
                      title="Сделать главным"
                    >
                      <Icon name="Star" size={12} />
                    </button>
                  )}
                  <button
                    onClick={() => removePhoto(url)}
                    disabled={busy}
                    className="w-7 h-7 bg-red-600 hover:bg-red-500 rounded text-white"
                    title="Удалить"
                  >
                    <Icon name="Trash2" size={12} />
                  </button>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => movePhoto(i, -1)}
                    disabled={i === 0 || busy}
                    className="w-7 h-7 bg-white/20 hover:bg-white/30 rounded text-white disabled:opacity-30"
                    title="Влево"
                  >
                    <Icon name="ChevronLeft" size={12} />
                  </button>
                  <button
                    onClick={() => movePhoto(i, 1)}
                    disabled={i === photos.length - 1 || busy}
                    className="w-7 h-7 bg-white/20 hover:bg-white/30 rounded text-white disabled:opacity-30"
                    title="Вправо"
                  >
                    <Icon name="ChevronRight" size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {totalPhotosLeft > 0 && (
            <button
              onClick={() => galleryRef.current?.click()}
              disabled={busy}
              className="aspect-square rounded border-2 border-dashed border-[#FFD700]/30 hover:border-[#FFD700] hover:bg-[#FFD700]/5 flex flex-col items-center justify-center gap-1 text-white/50 hover:text-[#FFD700] transition-all disabled:opacity-50"
              title="Добавить из галереи"
            >
              <Icon name="Plus" size={20} />
              <span className="text-[9px] font-roboto uppercase tracking-wide">+{totalPhotosLeft}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}