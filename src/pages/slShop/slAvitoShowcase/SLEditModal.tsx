import Icon from "@/components/ui/icon";
import { AvitoProduct } from "./types";
import { useEditModalState } from "./editModal/useEditModalState";
import EditModalHeader from "./editModal/EditModalHeader";
import EditModalPhotos from "./editModal/EditModalPhotos";
import EditModalForm from "./editModal/EditModalForm";

export default function SLEditModal({
  item,
  token,
  onClose,
  onUpdated,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}: {
  item: AvitoProduct;
  token: string;
  onClose: () => void;
  onUpdated: (p: Partial<AvitoProduct> & { id: number }) => void;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}) {
  const s = useEditModalState({ item, token, onClose, onUpdated, onPrev, onNext, hasPrev, hasNext });

  return (
    <div
      className="fixed inset-0 z-[300] bg-black/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-2xl max-h-[95vh] bg-gradient-to-br from-[#1a1a1a] to-[#0D0D0D] border-2 border-[#FFD700]/30 rounded-t-2xl sm:rounded-xl overflow-hidden flex flex-col shadow-[0_0_60px_rgba(255,215,0,0.2)] animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-4 duration-300"
        onClick={e => e.stopPropagation()}
      >
        <span aria-hidden className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(255,215,0,0.9), transparent)" }} />

        <EditModalHeader
          item={item}
          isReady={s.isReady}
          onClose={onClose}
          onPrev={onPrev}
          onNext={onNext}
          hasPrev={hasPrev}
          hasNext={hasNext}
        />

        <div className="flex-1 overflow-y-auto p-3 scrollbar-premium">
          <EditModalPhotos
            photos={s.photos}
            busy={s.busy}
            totalPhotosLeft={s.totalPhotosLeft}
            uploadProgress={s.uploadProgress}
            draggingIdx={s.draggingIdx}
            dragOverIdx={s.dragOverIdx}
            fileRef={s.fileRef}
            onPickFiles={s.onPickFiles}
            removePhoto={s.removePhoto}
            movePhoto={s.movePhoto}
            setAsMain={s.setAsMain}
            onDragStart={s.onDragStart}
            onDragOver={s.onDragOver}
            onDrop={s.onDrop}
            onDragEnd={s.onDragEnd}
          />

          <EditModalForm
            description={s.description}
            isVisible={s.isVisible}
            busy={s.busy}
            err={s.err}
            savedTimer={s.savedTimer}
            onDescChange={s.onDescChange}
            toggleVisible={s.toggleVisible}
          />
        </div>

        {/* Футер */}
        <div className="shrink-0 border-t border-white/10 bg-black/40 p-2 flex items-center justify-between">
          <div className="text-[10px] text-white/40 flex items-center gap-1">
            <Icon name="Keyboard" size={10} />
            <span className="hidden sm:inline">← → переключение</span>
          </div>
          <button
            onClick={onClose}
            className="bg-white/10 hover:bg-white/20 text-white font-oswald font-bold text-xs px-4 py-1.5 rounded uppercase tracking-wide transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
