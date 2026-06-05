import Icon from "@/components/ui/icon";

interface Props {
  syncing: boolean;
  photoSyncing: boolean;
  syncResult: { inserted: number; updated: number; total: number } | null;
  syncError: string | null;
  photoResult: { downloaded: number; remaining: number } | null;
  onSync: () => void;
  onPhotoSync: () => void;
}

export default function SmartberySyncBlock({
  syncing, photoSyncing, syncResult, syncError, photoResult, onSync, onPhotoSync,
}: Props) {
  return (
    <div className="rounded-xl bg-white/5 border border-white/10 p-3.5 mb-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-[#7dd3fc]/10">
          <Icon name="RefreshCcw" size={18} className="text-[#7dd3fc]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-roboto font-semibold text-sm text-white">Каталог iPhone · Smartbery</div>
          <div className="font-roboto text-[11px] text-white/40">
            Загрузить актуальные цены и наличие из smartbery-qrcode.ru
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={onSync}
            disabled={syncing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-oswald font-bold text-xs uppercase border border-[#7dd3fc]/40 text-[#7dd3fc] hover:bg-[#7dd3fc]/10 transition-colors disabled:opacity-40"
          >
            <Icon name={syncing ? "Loader2" : "RefreshCcw"} size={13} className={syncing ? "animate-spin" : ""} />
            {syncing ? "…" : "Цены"}
          </button>
          <button
            onClick={onPhotoSync}
            disabled={photoSyncing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-oswald font-bold text-xs uppercase border border-[#FFD700]/40 text-[#FFD700] hover:bg-[#FFD700]/10 transition-colors disabled:opacity-40"
          >
            <Icon name={photoSyncing ? "Loader2" : "Image"} size={13} className={photoSyncing ? "animate-spin" : ""} />
            {photoSyncing ? "…" : "Фото"}
          </button>
        </div>
      </div>
      {syncResult && (
        <div className="mt-2.5 flex items-center gap-2 font-roboto text-[11px] text-green-400">
          <Icon name="CheckCircle2" size={13} />
          Готово: {syncResult.total} позиций · добавлено {syncResult.inserted} · обновлено {syncResult.updated}
        </div>
      )}
      {photoResult && (
        <div className="mt-2.5 flex items-center gap-2 font-roboto text-[11px] text-[#FFD700]">
          <Icon name="Image" size={13} />
          Фото скачано: {photoResult.downloaded} · осталось в очереди: {photoResult.remaining}
          {photoResult.remaining > 0 && <span className="text-white/30">· нажми ещё раз</span>}
        </div>
      )}
      {syncError && (
        <div className="mt-2.5 flex items-center gap-2 font-roboto text-[11px] text-red-400">
          <Icon name="AlertCircle" size={13} />
          {syncError}
        </div>
      )}
    </div>
  );
}
