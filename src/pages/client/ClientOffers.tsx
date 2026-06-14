import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/icon";
import funcUrls from "../../../backend/func2url.json";
import { Offer, OFFER_CATEGORY_LABELS, OFFER_STATUS_LABELS, fmtDate, fmtMoney } from "./clientTypes";

const URL = (funcUrls as Record<string, string>)["client-cabinet"];

export default function ClientOffers({ token }: { token: string }) {
  const [items, setItems] = useState<Offer[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      const r = await fetch(URL, {
        method: "POST",
        headers: { "X-Client-Token": token, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "my_offers" }),
      });
      const d = await r.json();
      if (d.error) setError(d.error);
      else setItems(d.offers || []);
    } catch (e) {
      setError(String(e));
    }
  };

  useEffect(() => {
    load();
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-3">
      <button
        onClick={() => setShowForm(true)}
        className="w-full px-4 py-3 rounded-xl bg-gradient-to-b from-[#FFE34D] to-[#d4a017] text-black text-[13px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:brightness-110"
      >
        <Icon name="Plus" size={16} />
        Отправить предложение
      </button>

      {error && (
        <div className="px-3 py-2 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 text-xs">
          {error}
        </div>
      )}

      {items === null && (
        <div className="flex flex-col items-center py-10 gap-2 text-white/40">
          <Icon name="Loader" size={20} className="animate-spin text-[#FFD700]" />
          <span className="text-xs">Загружаю…</span>
        </div>
      )}

      {items && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#FFD700]/10 border border-[#FFD700]/20 flex items-center justify-center mb-2">
            <Icon name="Send" size={28} className="text-[#FFD700]/70" />
          </div>
          <div className="text-[15px] font-bold text-white">Предложений пока нет</div>
          <div className="text-[12px] text-white/50 max-w-xs">
            Расскажите что хотите продать, заложить или отремонтировать — менеджер свяжется с
            вами.
          </div>
        </div>
      )}

      {items?.map((o) => {
        const st = OFFER_STATUS_LABELS[o.status] || { text: o.status, color: "#888" };
        return (
          <div
            key={o.id}
            className="bg-gradient-to-br from-[#0E0E0E] to-[#080808] border border-[#1F1F1F] rounded-2xl p-4"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="min-w-0">
                <div className="text-[10px] text-white/40 uppercase tracking-wider">
                  {OFFER_CATEGORY_LABELS[o.category] || o.category} · {fmtDate(o.created_at)}
                </div>
                <div className="text-[15px] font-bold text-white truncate mt-0.5">{o.title}</div>
              </div>
              <span
                className="shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                style={{ background: `${st.color}20`, color: st.color, border: `1px solid ${st.color}40` }}
              >
                {st.text}
              </span>
            </div>
            {o.description && (
              <div className="text-[12px] text-white/65 mb-2 whitespace-pre-wrap line-clamp-3">
                {o.description}
              </div>
            )}
            {o.expected_price !== null && (
              <div className="text-[12px] text-white/80">
                Ожидаемая цена:{" "}
                <span className="font-bold text-[#FFD700]">{fmtMoney(o.expected_price)}</span>
              </div>
            )}
            {o.photos && o.photos.length > 0 && (
              <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1">
                {o.photos.map((p, i) => (
                  <img
                    key={i}
                    src={p}
                    alt=""
                    className="w-16 h-16 rounded-md object-cover shrink-0 cursor-zoom-in border border-white/10"
                    onClick={() => window.open(p, "_blank")}
                  />
                ))}
              </div>
            )}
            {o.admin_reply && (
              <div className="mt-2 px-3 py-2 rounded-lg bg-[#FFD700]/10 border border-[#FFD700]/20 text-[12px] text-[#FFD700]">
                <Icon name="MessageSquare" size={12} className="inline mr-1.5" />
                {o.admin_reply}
              </div>
            )}
          </div>
        );
      })}

      {showForm && (
        <NewOfferModal token={token} onClose={() => setShowForm(false)} onCreated={load} />
      )}
    </div>
  );
}

function NewOfferModal({
  token,
  onClose,
  onCreated,
}: {
  token: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [category, setCategory] = useState<Offer["category"]>("skupka");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Сжимаем большие фото перед отправкой (особенно важно для Android-камер и iPhone HEIC)
  const compressImage = async (file: File): Promise<{ blob: Blob; mime: string }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();
      reader.onload = () => {
        img.onload = () => {
          const MAX = 1600;
          let { width, height } = img;
          if (width > MAX || height > MAX) {
            if (width > height) {
              height = Math.round((height * MAX) / width);
              width = MAX;
            } else {
              width = Math.round((width * MAX) / height);
              height = MAX;
            }
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Не удалось обработать фото"));
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (b) => (b ? resolve({ blob: b, mime: "image/jpeg" }) : reject(new Error("Сжатие не удалось"))),
            "image/jpeg",
            0.85,
          );
        };
        img.onerror = () => reject(new Error("Файл не похож на картинку"));
        img.src = String(reader.result || "");
      };
      reader.onerror = () => reject(new Error("Не удалось прочитать файл"));
      reader.readAsDataURL(file);
    });
  };

  const blobToBase64 = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result || "").split(",")[1] || "");
      r.onerror = () => reject(new Error("Не удалось прочитать файл"));
      r.readAsDataURL(blob);
    });

  const uploadPhoto = async (file: File) => {
    setError(null);
    setUploadingPhoto(true);
    try {
      // Размер до сжатия > 12 МБ — отказ
      if (file.size > 12 * 1024 * 1024) {
        setError("Фото больше 12 МБ — выбери поменьше");
        return;
      }
      // Сжимаем (заодно конвертируем HEIC/PNG/WebP в JPEG)
      let blob: Blob = file;
      let mime: string = file.type || "image/jpeg";
      try {
        const c = await compressImage(file);
        blob = c.blob;
        mime = c.mime;
      } catch {
        // Если canvas не сработал (APK WebView), отправим как есть
      }
      const b64 = await blobToBase64(blob);
      const r = await fetch(URL, {
        method: "POST",
        headers: { "X-Client-Token": token, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "upload_photo", base64: b64, mime_type: mime }),
      });
      const d = await r.json();
      if (d.error) setError(d.error);
      else if (d.photo_url) setPhotos((p) => [...p, d.photo_url]);
    } catch (e) {
      setError((e as Error)?.message || "Не удалось загрузить фото");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const submit = async () => {
    setError(null);
    if (title.trim().length < 2) {
      setError("Укажите название");
      return;
    }
    setSending(true);
    try {
      const r = await fetch(URL, {
        method: "POST",
        headers: { "X-Client-Token": token, "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_offer",
          category,
          title: title.trim(),
          description: description.trim() || undefined,
          expected_price: price ? Number(price) : undefined,
          photos,
        }),
      });
      const d = await r.json();
      if (d.error) {
        setError(d.error);
        return;
      }
      onCreated();
      onClose();
    } catch (e) {
      setError(String(e));
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-[#0E0E0E] border border-[#FFD700]/30 rounded-t-2xl sm:rounded-2xl p-5 w-full max-w-md overflow-y-auto"
        style={{ maxHeight: "calc(95dvh - env(safe-area-inset-bottom, 0px))", paddingBottom: "max(20px, env(safe-area-inset-bottom, 0px))" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 mb-4">
          <Icon name="Send" size={18} className="text-[#FFD700]" />
          <h3 className="font-oswald font-bold text-white uppercase tracking-wider">
            Новое предложение
          </h3>
          <button onClick={onClose} className="ml-auto p-1 rounded hover:bg-white/10">
            <Icon name="X" size={18} className="text-white/60" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-[11px] text-white/50 mb-1.5 uppercase tracking-wider">
              Что вы хотите?
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(OFFER_CATEGORY_LABELS) as Offer["category"][]).map((k) => (
                <button
                  key={k}
                  onClick={() => setCategory(k)}
                  className={`px-3 py-2 rounded-lg text-[12px] font-semibold border ${
                    category === k
                      ? "bg-[#FFD700]/15 border-[#FFD700]/40 text-[#FFD700]"
                      : "bg-[#0A0A0A] border-[#1F1F1F] text-white/70"
                  }`}
                >
                  {OFFER_CATEGORY_LABELS[k]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-white/50 mb-1 uppercase tracking-wider">
              Название
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например: iPhone 13 Pro 256GB"
              className="w-full bg-[#0A0A0A] border border-[#1F1F1F] focus:border-[#FFD700]/40 text-white px-3 py-2.5 rounded-lg text-[13px] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] text-white/50 mb-1 uppercase tracking-wider">
              Описание
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Состояние, комплект, что не работает…"
              rows={3}
              className="w-full bg-[#0A0A0A] border border-[#1F1F1F] focus:border-[#FFD700]/40 text-white px-3 py-2.5 rounded-lg text-[13px] focus:outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-[11px] text-white/50 mb-1 uppercase tracking-wider">
              Желаемая цена (₽)
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Необязательно"
              className="w-full bg-[#0A0A0A] border border-[#1F1F1F] focus:border-[#FFD700]/40 text-white px-3 py-2.5 rounded-lg text-[13px] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] text-white/50 mb-1.5 uppercase tracking-wider">
              Фото ({photos.length}/10)
            </label>
            <div className="flex gap-2 flex-wrap">
              {photos.map((p, i) => (
                <div key={i} className="relative">
                  <img src={p} alt="" className="w-16 h-16 rounded-lg object-cover border border-white/10" />
                  <button
                    onClick={() => setPhotos((arr) => arr.filter((_, idx) => idx !== i))}
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ))}
              {photos.length < 10 && (
                <>
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={uploadingPhoto}
                    className="w-16 h-16 rounded-lg border border-dashed border-[#FFD700]/40 text-[#FFD700] flex flex-col items-center justify-center gap-0.5 hover:bg-[#FFD700]/5 disabled:opacity-50"
                  >
                    {uploadingPhoto ? (
                      <Icon name="Loader" size={18} className="animate-spin" />
                    ) : (
                      <>
                        <Icon name="Image" size={18} />
                        <span className="text-[8px] uppercase tracking-wider">Галерея</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => cameraRef.current?.click()}
                    disabled={uploadingPhoto}
                    className="w-16 h-16 rounded-lg border border-dashed border-[#FFD700]/40 text-[#FFD700] flex flex-col items-center justify-center gap-0.5 hover:bg-[#FFD700]/5 disabled:opacity-50"
                  >
                    <Icon name="Camera" size={18} />
                    <span className="text-[8px] uppercase tracking-wider">Снять</span>
                  </button>
                </>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadPhoto(f);
                  e.target.value = "";
                }}
              />
              <input
                ref={cameraRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadPhoto(f);
                  e.target.value = "";
                }}
              />
            </div>
          </div>

          {error && (
            <div className="px-3 py-2 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 text-xs">
              {error}
            </div>
          )}

          <button
            onClick={submit}
            disabled={sending}
            className="w-full px-4 py-3 rounded-lg bg-gradient-to-b from-[#FFE34D] to-[#d4a017] text-black text-[13px] font-bold uppercase tracking-wider disabled:opacity-50 hover:brightness-110 flex items-center justify-center gap-2"
          >
            {sending ? (
              <Icon name="Loader" size={16} className="animate-spin" />
            ) : (
              <Icon name="Send" size={16} />
            )}
            Отправить
          </button>
        </div>
      </div>
    </div>
  );
}