import { useState, useEffect, useRef } from "react";
import { AvitoProduct, PHOTOS_URL, compressImage } from "../types";

type Args = {
  item: AvitoProduct;
  token: string;
  onClose: () => void;
  onUpdated: (p: Partial<AvitoProduct> & { id: number }) => void;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
};

export function useEditModalState({ item, token, onClose, onUpdated, onPrev, onNext, hasPrev, hasNext }: Args) {
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
  const onDragEnd = () => {
    setDraggingIdx(null);
    setDragOverIdx(null);
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

  return {
    photos,
    description,
    isVisible,
    busy,
    err,
    savedTimer,
    uploadProgress,
    draggingIdx,
    dragOverIdx,
    fileRef,
    totalPhotosLeft,
    isReady,
    onPickFiles,
    removePhoto,
    movePhoto,
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnd,
    setAsMain,
    onDescChange,
    toggleVisible,
  };
}
