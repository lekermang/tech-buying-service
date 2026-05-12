import { useEffect } from "react";
import Icon from "@/components/ui/icon";

interface Props {
  photos: string[];
  index: number;
  onClose: () => void;
  onIndexChange?: (next: number) => void;
}

export default function PhotoLightbox({ photos, index, onClose, onIndexChange }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && onIndexChange && index > 0) onIndexChange(index - 1);
      if (e.key === "ArrowRight" && onIndexChange && index < photos.length - 1) onIndexChange(index + 1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [index, photos.length, onClose, onIndexChange]);

  if (photos.length === 0 || index < 0 || index >= photos.length) return null;

  const url = photos[index];

  return (
    <div
      className="fixed inset-0 z-[300] bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
        aria-label="Закрыть"
      >
        <Icon name="X" size={20} />
      </button>

      {photos.length > 1 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-white/10 text-white font-roboto text-xs">
          {index + 1} / {photos.length}
        </div>
      )}

      <img
        src={url}
        alt={`фото ${index + 1}`}
        className="max-w-[95vw] max-h-[90vh] object-contain select-none"
        onClick={e => e.stopPropagation()}
      />

      {onIndexChange && photos.length > 1 && (
        <>
          {index > 0 && (
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onIndexChange(index - 1); }}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              aria-label="Предыдущее фото"
            >
              <Icon name="ChevronLeft" size={24} />
            </button>
          )}
          {index < photos.length - 1 && (
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onIndexChange(index + 1); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              aria-label="Следующее фото"
            >
              <Icon name="ChevronRight" size={24} />
            </button>
          )}
        </>
      )}
    </div>
  );
}
