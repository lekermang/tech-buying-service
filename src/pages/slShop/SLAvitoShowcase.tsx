import { useState, useEffect, useCallback, useRef } from "react";
import Icon from "@/components/ui/icon";

const PHOTOS_URL = "https://functions.poehali.dev/4e286b87-fc23-49ef-9b77-22611bb6e1f9";
const SYNC_URL = "https://functions.poehali.dev/49e23745-1449-4e4c-80c2-e7967f3c5584";

type AvitoProduct = {
  id: number;
  avito_id: number;
  title: string;
  price: number | null;
  url: string;
  category: string | null;
  photos: string[];
  main_photo: string | null;
  description: string | null;
  is_visible: boolean;
  sort_order: number;
};

type Stats = { with_photos: number; no_photos: number; total_active: number };

const formatPrice = (p: number | null) => (p ? p.toLocaleString("ru-RU") + " ₽" : "—");

async function compressImage(file: File, maxSize = 1600, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Не удалось прочитать файл"));
    reader.onload = ev => {
      const img = new Image();
      img.onerror = () => reject(new Error("Не удалось открыть изображение"));
      img.onload = () => {
        let { width: w, height: h } = img;
        if (w > maxSize || h > maxSize) {
          if (w > h) {
            h = Math.round((h * maxSize) / w);
            w = maxSize;
          } else {
            w = Math.round((w * maxSize) / h);
            h = maxSize;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas недоступен"));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export default function SLAvitoShowcase({ token }: { token: string }) {
  const [items, setItems] = useState<AvitoProduct[]>([]);
  const [stats, setStats] = useState<Stats>({ with_photos: 0, no_photos: 0, total_active: 0 });
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"no" | "yes" | "all">("no");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<AvitoProduct | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [msg, setMsg] = useState<string>("");
  const debRef = useRef<ReturnType<typeof setTimeout>>();

  const load = useCallback(
    (q: string, f: "no" | "yes" | "all") => {
      setLoading(true);
      const params = new URLSearchParams({ action: "list", limit: "60", has_photo: f });
      if (q) params.set("q", q);
      fetch(`${PHOTOS_URL}?${params.toString()}`, {
        headers: { "X-Employee-Token": token, "X-Auth-Token": token },
      })
        .then(r => r.json())
        .then(d => {
          if (d.ok) {
            setItems(d.items || []);
            setStats(d.stats || { with_photos: 0, no_photos: 0, total_active: 0 });
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    },
    [token],
  );

  useEffect(() => {
    load("", filter);
  }, [load, filter]);

  const onSearch = (val: string) => {
    setQuery(val);
    clearTimeout(debRef.current);
    debRef.current = setTimeout(() => load(val, filter), 350);
  };

  const runSync = async () => {
    setSyncing(true);
    setMsg("");
    try {
      const r = await fetch(`${SYNC_URL}?action=firstrun`);
      const d = await r.json();
      if (d.ok) {
        setMsg(
          d.skipped
            ? `Уже синхронизировано: ${d.count} товаров`
            : `Готово: добавлено ${d.added}, обновлено ${d.updated}, архивировано ${d.archived ?? 0}`,
        );
        load(query, filter);
      } else {
        setMsg(`Ошибка: ${d.error || "не удалось"}`);
      }
    } catch {
      setMsg("Ошибка соединения");
    } finally {
      setSyncing(false);
      setTimeout(() => setMsg(""), 5000);
    }
  };

  return (
    <div className="space-y-3">
      <div className="rounded-lg bg-gradient-to-br from-[#FFD700]/10 to-transparent border border-[#FFD700]/30 p-3 flex flex-col sm:flex-row gap-2 items-start sm:items-center">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-[#FFD700]/20 flex items-center justify-center shrink-0">
            <Icon name="Sparkles" size={18} className="text-[#FFD700]" />
          </div>
          <div className="min-w-0">
            <div className="font-oswald font-bold text-white text-sm uppercase tracking-wide">
              Витрина Авито
            </div>
            <div className="text-[11px] text-white/60">
              {stats.total_active} товаров · с фото: <b className="text-emerald-400">{stats.with_photos}</b> · без фото:{" "}
              <b className="text-orange-400">{stats.no_photos}</b>
            </div>
          </div>
        </div>
        <button
          onClick={runSync}
          disabled={syncing}
          className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-[#FFD700] hover:bg-[#FFE55C] text-black font-oswald font-bold text-xs px-3 py-2 rounded uppercase tracking-wide disabled:opacity-50"
        >
          <Icon name={syncing ? "Loader2" : "RefreshCw"} size={14} className={syncing ? "animate-spin" : ""} />
          {syncing ? "Синхронизирую..." : "Обновить с Авито"}
        </button>
      </div>

      {msg && (
        <div className="text-[11px] text-white/80 bg-white/5 border border-white/10 rounded px-3 py-2">{msg}</div>
      )}

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Icon name="Search" size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            value={query}
            onChange={e => onSearch(e.target.value)}
            placeholder="Поиск по названию или ID..."
            className="w-full bg-[#0D0D0D] border border-white/15 text-white pl-8 pr-3 py-2 font-roboto text-sm rounded focus:outline-none focus:border-[#FFD700]"
          />
        </div>
        <div className="flex gap-1">
          {([
            { k: "no", l: "Без фото", n: stats.no_photos, color: "orange" },
            { k: "yes", l: "С фото", n: stats.with_photos, color: "emerald" },
            { k: "all", l: "Все", n: stats.total_active, color: "white" },
          ] as const).map(b => (
            <button
              key={b.k}
              onClick={() => setFilter(b.k)}
              className={`flex-1 sm:flex-none text-xs font-roboto px-3 py-2 rounded transition-all ${
                filter === b.k
                  ? "bg-[#FFD700] text-black font-semibold"
                  : "bg-white/5 text-white/70 hover:bg-white/10 border border-white/10"
              }`}
            >
              {b.l} <span className="opacity-70 text-[10px]">·{b.n}</span>
            </button>
          ))}
        </div>
      </div>

      {loading && items.length === 0 && (
        <div className="text-center py-8 text-white/40 font-roboto text-sm">Загружаю...</div>
      )}

      {!loading && items.length === 0 && (
        <div className="text-center py-8 text-white/40 font-roboto text-sm">
          {filter === "no" ? "Нет товаров без фото" : "Ничего не найдено"}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {items.map(it => (
          <button
            key={it.id}
            onClick={() => setEditing(it)}
            className="group relative bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-[#FFD700]/50 rounded-lg overflow-hidden text-left transition-all"
          >
            <div className="relative aspect-square bg-[#0D0D0D]">
              {it.main_photo ? (
                <img src={it.main_photo} alt="" className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-1 bg-gradient-to-br from-orange-500/10 to-transparent border border-dashed border-orange-400/30">
                  <Icon name="ImagePlus" size={28} className="text-orange-400/70" />
                  <span className="text-[9px] text-orange-300/80 font-roboto uppercase tracking-wide">
                    Добавить фото
                  </span>
                </div>
              )}
              {it.photos.length > 0 && (
                <div className="absolute top-1 right-1 bg-emerald-500/90 text-white font-oswald font-bold text-[10px] px-1.5 py-0.5 rounded">
                  {it.photos.length}
                </div>
              )}
              {!it.is_visible && (
                <div className="absolute top-1 left-1 bg-red-600/90 text-white font-roboto text-[9px] px-1.5 py-0.5 rounded uppercase">
                  скрыт
                </div>
              )}
            </div>
            <div className="p-2">
              <div className="font-roboto text-[11px] text-white truncate">{it.title}</div>
              <div className="font-oswald font-bold text-[#FFD700] text-sm mt-0.5">{formatPrice(it.price)}</div>
            </div>
          </button>
        ))}
      </div>

      {editing && (
        <SLEditModal
          item={editing}
          token={token}
          onClose={() => setEditing(null)}
          onUpdated={updated => {
            setItems(prev => prev.map(p => (p.id === updated.id ? { ...p, ...updated } : p)));
            setEditing(updated as AvitoProduct);
          }}
          onDeleted={id => {
            setItems(prev => prev.filter(p => p.id !== id));
            setEditing(null);
          }}
          reload={() => load(query, filter)}
        />
      )}
    </div>
  );
}

function SLEditModal({
  item,
  token,
  onClose,
  onUpdated,
  reload,
}: {
  item: AvitoProduct;
  token: string;
  onClose: () => void;
  onUpdated: (p: Partial<AvitoProduct> & { id: number }) => void;
  onDeleted: (id: number) => void;
  reload: () => void;
}) {
  const [photos, setPhotos] = useState<string[]>(item.photos || []);
  const [description, setDescription] = useState(item.description || "");
  const [isVisible, setIsVisible] = useState(item.is_visible);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string>("");
  const [savedTimer, setSavedTimer] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

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

  const onPickFile = async (file: File) => {
    setErr("");
    setBusy(true);
    try {
      const b64 = await compressImage(file, 1600, 0.85);
      const d = await apiCall("upload", { product_id: item.id, image_base64: b64 });
      if (d.ok) {
        setPhotos(d.photos);
        onUpdated({ id: item.id, photos: d.photos, main_photo: d.main_photo });
        flash("Фото загружено");
      } else {
        setErr(d.error || "Не удалось загрузить");
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setBusy(false);
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

  const saveDescription = async () => {
    setBusy(true);
    setErr("");
    try {
      const d = await apiCall("update", { product_id: item.id, description });
      if (d.ok) {
        onUpdated({ id: item.id, description });
        flash("Описание сохранено");
      } else {
        setErr(d.error || "Не удалось сохранить");
      }
    } finally {
      setBusy(false);
    }
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

  return (
    <div
      className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-2xl max-h-[95vh] bg-gradient-to-br from-[#1a1a1a] to-[#0D0D0D] border-2 border-[#FFD700]/30 rounded-t-2xl sm:rounded-xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="shrink-0 flex items-start justify-between gap-2 p-3 border-b border-white/10">
          <div className="min-w-0 flex-1">
            <div className="font-oswald font-bold text-white text-sm leading-tight line-clamp-2">{item.title}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-oswald font-bold text-[#FFD700] text-lg">{formatPrice(item.price)}</span>
              {item.category && <span className="text-[10px] text-white/40">· {item.category}</span>}
            </div>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[10px] text-[#FFD700]/70 hover:text-[#FFD700] mt-1"
            >
              <Icon name="ExternalLink" size={10} />
              Открыть на Авито
            </a>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white"
          >
            <Icon name="X" size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 scrollbar-premium">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="font-oswald font-bold text-white text-xs uppercase tracking-wide">
                Фотографии ({photos.length}/5)
              </div>
              {photos.length < 5 && (
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={busy}
                  className="flex items-center gap-1 bg-[#FFD700] text-black font-oswald font-bold text-[11px] px-2.5 py-1.5 rounded uppercase tracking-wide hover:bg-[#FFE55C] disabled:opacity-50"
                >
                  <Icon name="Camera" size={12} />
                  Добавить
                </button>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={e => {
                const f = e.target.files?.[0];
                if (f) onPickFile(f);
                e.target.value = "";
              }}
            />

            {photos.length === 0 && (
              <button
                onClick={() => fileRef.current?.click()}
                disabled={busy}
                className="w-full aspect-video rounded-lg border-2 border-dashed border-[#FFD700]/30 hover:border-[#FFD700] hover:bg-[#FFD700]/5 flex flex-col items-center justify-center gap-2 text-white/60 hover:text-[#FFD700] transition-all disabled:opacity-50"
              >
                <Icon name="ImagePlus" size={32} />
                <div className="font-oswald font-bold text-xs uppercase tracking-wide">Сфотографировать товар</div>
                <div className="text-[10px] text-white/40">Камера или галерея</div>
              </button>
            )}

            {photos.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {photos.map((url, i) => (
                  <div key={url} className="relative group aspect-square rounded overflow-hidden bg-black">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    {i === 0 && (
                      <div className="absolute top-1 left-1 bg-[#FFD700] text-black font-oswald font-bold text-[9px] px-1 py-0.5 rounded uppercase">
                        Главное
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                      <button
                        onClick={() => movePhoto(i, -1)}
                        disabled={i === 0 || busy}
                        className="w-7 h-7 bg-white/20 rounded text-white disabled:opacity-30"
                        title="Влево"
                      >
                        <Icon name="ChevronLeft" size={14} />
                      </button>
                      <button
                        onClick={() => removePhoto(url)}
                        disabled={busy}
                        className="w-7 h-7 bg-red-600 rounded text-white"
                        title="Удалить"
                      >
                        <Icon name="Trash2" size={12} />
                      </button>
                      <button
                        onClick={() => movePhoto(i, 1)}
                        disabled={i === photos.length - 1 || busy}
                        className="w-7 h-7 bg-white/20 rounded text-white disabled:opacity-30"
                        title="Вправо"
                      >
                        <Icon name="ChevronRight" size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mb-4">
            <div className="font-oswald font-bold text-white text-xs uppercase tracking-wide mb-2">
              Описание для витрины
            </div>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Краткое описание для покупателя: состояние, комплект, отличия от нового..."
              rows={4}
              className="w-full bg-[#0D0D0D] border border-white/15 text-white px-3 py-2 font-roboto text-sm rounded focus:outline-none focus:border-[#FFD700] resize-none"
            />
            <button
              onClick={saveDescription}
              disabled={busy}
              className="mt-2 bg-white/10 hover:bg-white/20 text-white font-oswald font-bold text-xs px-3 py-1.5 rounded uppercase tracking-wide"
            >
              Сохранить описание
            </button>
          </div>

          <div className="flex items-center justify-between p-2 rounded bg-white/5 border border-white/10">
            <div>
              <div className="font-oswald font-bold text-white text-xs uppercase tracking-wide">
                Показывать на сайте
              </div>
              <div className="text-[10px] text-white/40">
                {isVisible ? "Виден покупателям на сайте" : "Скрыт с витрины"}
              </div>
            </div>
            <button
              onClick={toggleVisible}
              disabled={busy}
              className={`w-12 h-6 rounded-full transition-all relative ${
                isVisible ? "bg-emerald-500" : "bg-white/20"
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${
                  isVisible ? "left-6" : "left-0.5"
                }`}
              />
            </button>
          </div>

          {err && (
            <div className="mt-3 text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded px-2 py-1.5">
              {err}
            </div>
          )}
          {savedTimer && (
            <div className="mt-3 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded px-2 py-1.5 flex items-center gap-1">
              <Icon name="CheckCircle2" size={12} />
              {savedTimer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
