import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import { AvitoProduct, PHOTOS_URL, formatPrice, compressImage } from "./types";

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
  const [photos, setPhotos] = useState<string[]>(item.photos || []);
  const [description, setDescription] = useState(item.description || "");
  const [isVisible, setIsVisible] = useState(item.is_visible);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string>("");
  const [savedTimer, setSavedTimer] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const descChangedRef = useRef(false);
  const descTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setPhotos(item.photos || []);
    setDescription(item.description || "");
    setIsVisible(item.is_visible);
    setErr("");
    setSavedTimer("");
    descChangedRef.current = false;
  }, [item.id]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && hasPrev && !(e.target instanceof HTMLTextAreaElement) && !(e.target instanceof HTMLInputElement)) onPrev();
      if (e.key === "ArrowRight" && hasNext && !(e.target instanceof HTMLTextAreaElement) && !(e.target instanceof HTMLInputElement)) onNext();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose, onPrev, onNext, hasPrev, hasNext]);

  const apiCall = async (action: string, body: object) => {
    const r = await fetch(`${PHOTOS_URL}?action=${action}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Employee-Token": token,
        "X-Auth-Token": token,
      },
      body: JSON.stringify(body),
    });
    return r.json();
  };

  const flash = (s: string) => {
    setSavedTimer(s);
    setTimeout(() => setSavedTimer(""), 2000);
  };

  const onPickFiles = async (files: FileList) => {
    setErr("");
    const arr = Array.from(files).slice(0, 5 - photos.length);
    if (arr.length === 0) {
      setErr("Достигнут лимит — 5 фото");
      return;
    }
    setBusy(true);
    setUploadProgress({ done: 0, total: arr.length });
    let curPhotos = [...photos];
    let curMain: string | null = null;
    let okN = 0;
    try {
      for (let i = 0; i < arr.length; i++) {
        try {
          const b64 = await compressImage(arr[i], 1600, 0.85);
          const d = await apiCall("upload", { product_id: item.id, image_base64: b64 });
          if (d.ok) {
            curPhotos = d.photos;
            curMain = d.main_photo;
            okN++;
          } else {
            setErr(d.error || "Не удалось загрузить");
          }
        } catch (e) {
          setErr(e instanceof Error ? e.message : "Ошибка");
        }
        setUploadProgress({ done: i + 1, total: arr.length });
      }
      setPhotos(curPhotos);
      onUpdated({ id: item.id, photos: curPhotos, main_photo: curMain });
      if (okN > 0) flash(okN === 1 ? "Фото загружено" : `Загружено: ${okN}`);
    } finally {
      setBusy(false);
      setTimeout(() => setUploadProgress(null), 600);
    }
  };

  const removePhoto = async (url: string) => {
    setBusy(true);
    setErr("");
    try {
      const d = await apiCall("delete_photo", { product_id: item.id, photo_url: url });
      if (d.ok) {
        setPhotos(d.photos);
        onUpdated({ id: item.id, photos: d.photos, main_photo: d.main_photo });
        flash("Удалено");
      } else {
        setErr(d.error || "Не удалось удалить");
      }
    } finally {
      setBusy(false);
    }
  };

  const movePhoto = async (idx: number, dir: -1 | 1) => {
    const newOrder = [...photos];
    const target = idx + dir;
    if (target < 0 || target >= newOrder.length) return;
    [newOrder[idx], newOrder[target]] = [newOrder[target], newOrder[idx]];
    setPhotos(newOrder);
    setBusy(true);
    try {
      const d = await apiCall("reorder", { product_id: item.id, photos: newOrder });
      if (d.ok) onUpdated({ id: item.id, photos: d.photos, main_photo: d.main_photo });
    } finally {
      setBusy(false);
    }
  };

  const onDragStart = (i: number) => setDraggingIdx(i);
  const onDragOver = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    setDragOverIdx(i);
  };
  const onDrop = async (e: React.DragEvent, i: number) => {
    e.preventDefault();
    if (draggingIdx == null || draggingIdx === i) {
      setDraggingIdx(null);
      setDragOverIdx(null);
      return;
    }
    const newOrder = [...photos];
    const [moved] = newOrder.splice(draggingIdx, 1);
    newOrder.splice(i, 0, moved);
    setPhotos(newOrder);
    setDraggingIdx(null);
    setDragOverIdx(null);
    setBusy(true);
    try {
      const d = await apiCall("reorder", { product_id: item.id, photos: newOrder });
      if (d.ok) {
        onUpdated({ id: item.id, photos: d.photos, main_photo: d.main_photo });
        flash("Порядок изменён");
      }
    } finally {
      setBusy(false);
    }
  };

  const setAsMain = async (i: number) => {
    if (i === 0) return;
    const newOrder = [...photos];
    const [moved] = newOrder.splice(i, 1);
    newOrder.unshift(moved);
    setPhotos(newOrder);
    setBusy(true);
    try {
      const d = await apiCall("reorder", { product_id: item.id, photos: newOrder });
      if (d.ok) {
        onUpdated({ id: item.id, photos: d.photos, main_photo: d.main_photo });
        flash("Главное фото обновлено");
      }
    } finally {
      setBusy(false);
    }
  };

  const onDescChange = (v: string) => {
    setDescription(v);
    descChangedRef.current = true;
    clearTimeout(descTimerRef.current);
    descTimerRef.current = setTimeout(async () => {
      if (!descChangedRef.current) return;
      setBusy(true);
      try {
        const d = await apiCall("update", { product_id: item.id, description: v });
        if (d.ok) {
          onUpdated({ id: item.id, description: v });
          flash("Описание сохранено");
          descChangedRef.current = false;
        }
      } finally {
        setBusy(false);
      }
    }, 1200);
  };

  const toggleVisible = async () => {
    const next = !isVisible;
    setIsVisible(next);
    setBusy(true);
    try {
      const d = await apiCall("update", { product_id: item.id, is_visible: next });
      if (d.ok) {
        onUpdated({ id: item.id, is_visible: next });
        flash(next ? "На витрине" : "Скрыт");
      }
    } finally {
      setBusy(false);
    }
  };

  const totalPhotosLeft = 5 - photos.length;
  const isReady = photos.length > 0 && description.trim().length > 0;

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

        {/* Шапка */}
        <div className="shrink-0 flex items-start justify-between gap-2 p-3 border-b border-white/10">
          <div className="flex items-start gap-2 min-w-0 flex-1">
            <button
              onClick={onPrev}
              disabled={!hasPrev}
              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#FFD700]/40 flex items-center justify-center text-white/70 disabled:opacity-30 transition-all shrink-0"
              title="Предыдущий"
            >
              <Icon name="ChevronLeft" size={16} />
            </button>
            <div className="min-w-0 flex-1">
              <div className="font-oswald font-bold text-white text-sm leading-tight line-clamp-2">{item.title}</div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="font-oswald font-bold text-[#FFD700] text-lg">{formatPrice(item.price)}</span>
                {item.category && <span className="text-[10px] text-white/40">· {item.category}</span>}
                {isReady && (
                  <span className="bg-emerald-500/20 text-emerald-300 font-roboto text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wide flex items-center gap-1">
                    <Icon name="CheckCircle2" size={9} />
                    Готов
                  </span>
                )}
              </div>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[10px] text-[#FFD700]/70 hover:text-[#FFD700] mt-1 transition-colors"
              >
                <Icon name="ExternalLink" size={10} />
                На Авито
              </a>
            </div>
            <button
              onClick={onNext}
              disabled={!hasNext}
              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#FFD700]/40 flex items-center justify-center text-white/70 disabled:opacity-30 transition-all shrink-0"
              title="Следующий"
            >
              <Icon name="ChevronRight" size={16} />
            </button>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-white shrink-0"
          >
            <Icon name="X" size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 scrollbar-premium">
          {/* Фотографии */}
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
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={busy}
                  className="flex items-center gap-1 bg-gradient-to-r from-[#FFD700] to-[#FFE55C] text-black font-oswald font-bold text-[11px] px-2.5 py-1.5 rounded uppercase tracking-wide hover:shadow-[0_0_12px_rgba(255,215,0,0.4)] disabled:opacity-50 transition-all"
                >
                  <Icon name="Camera" size={12} />
                  + Добавить ({totalPhotosLeft})
                </button>
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
              <button
                onClick={() => fileRef.current?.click()}
                disabled={busy}
                className="w-full aspect-video rounded-lg border-2 border-dashed border-[#FFD700]/30 hover:border-[#FFD700] hover:bg-[#FFD700]/5 flex flex-col items-center justify-center gap-2 text-white/60 hover:text-[#FFD700] transition-all disabled:opacity-50 group"
              >
                <Icon name="ImagePlus" size={36} className="group-hover:scale-110 transition-transform" />
                <div className="font-oswald font-bold text-sm uppercase tracking-wide">Сфотографировать товар</div>
                <div className="text-[10px] text-white/40">Камера или несколько фото из галереи</div>
              </button>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {photos.map((url, i) => (
                  <div
                    key={url}
                    draggable
                    onDragStart={() => onDragStart(i)}
                    onDragOver={e => onDragOver(e, i)}
                    onDrop={e => onDrop(e, i)}
                    onDragEnd={() => {
                      setDraggingIdx(null);
                      setDragOverIdx(null);
                    }}
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
                    onClick={() => fileRef.current?.click()}
                    disabled={busy}
                    className="aspect-square rounded border-2 border-dashed border-[#FFD700]/30 hover:border-[#FFD700] hover:bg-[#FFD700]/5 flex flex-col items-center justify-center gap-1 text-white/50 hover:text-[#FFD700] transition-all disabled:opacity-50"
                  >
                    <Icon name="Plus" size={20} />
                    <span className="text-[9px] font-roboto uppercase tracking-wide">+{totalPhotosLeft}</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Описание */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="font-oswald font-bold text-white text-xs uppercase tracking-wide">
                Описание для витрины
              </div>
              <span className="text-[10px] text-white/40">{description.length}/500</span>
            </div>
            <textarea
              value={description}
              onChange={e => onDescChange(e.target.value.slice(0, 500))}
              placeholder="Краткое описание для покупателя: состояние, комплект, что отличает от нового..."
              rows={4}
              className="w-full bg-[#0D0D0D] border border-white/15 text-white px-3 py-2 font-roboto text-sm rounded-lg focus:outline-none focus:border-[#FFD700] focus:shadow-[0_0_12px_rgba(255,215,0,0.15)] resize-none transition-all"
            />
            <div className="flex items-center gap-2 mt-1.5 text-[10px] text-white/40">
              <Icon name="Info" size={10} />
              Сохраняется автоматически через секунду после остановки ввода
            </div>
          </div>

          {/* Видимость */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-colors">
            <div>
              <div className="font-oswald font-bold text-white text-xs uppercase tracking-wide flex items-center gap-1.5">
                <Icon name={isVisible ? "Eye" : "EyeOff"} size={14} className={isVisible ? "text-emerald-400" : "text-white/40"} />
                Показывать на сайте
              </div>
              <div className="text-[10px] text-white/40 mt-0.5">
                {isVisible ? "Виден покупателям на витрине" : "Скрыт с витрины (только в БД)"}
              </div>
            </div>
            <button
              onClick={toggleVisible}
              disabled={busy}
              className={`w-12 h-6 rounded-full transition-all relative shrink-0 ${
                isVisible ? "bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.4)]" : "bg-white/15"
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all shadow ${
                  isVisible ? "left-6" : "left-0.5"
                }`}
              />
            </button>
          </div>

          {err && (
            <div className="mt-3 text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded px-2 py-1.5 flex items-center gap-1.5">
              <Icon name="AlertCircle" size={12} />
              {err}
            </div>
          )}
          {savedTimer && (
            <div className="mt-3 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded px-2 py-1.5 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
              <Icon name="CheckCircle2" size={12} />
              {savedTimer}
            </div>
          )}
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
