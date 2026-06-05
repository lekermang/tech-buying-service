import { useState, useEffect, useCallback, useRef } from "react";
import Icon from "@/components/ui/icon";
import { adminHeaders } from "@/lib/adminFetch";
import {
  CATALOG_URL, PHOTOS_URL, MAX_PHOTOS,
  CATEGORIES, REGIONS, AVAIL_OPTIONS, EMPTY_FORM,
  inp, lbl,
  type Item, type Photo,
} from "./catalogTypes";

export function CatalogItemModal({
  item, token, onClose, onSaved,
}: {
  item: Item | null; token: string; onClose: () => void; onSaved: () => void;
}) {
  const isNew = !item;
  const [form, setForm] = useState(
    item
      ? {
          category: item.category, brand: item.brand, model: item.model,
          color: item.color || "", storage: item.storage || "",
          ram: item.ram || "", region: item.region || "EU",
          availability: item.availability, price: item.price ? String(item.price) : "",
        }
      : { ...EMPTY_FORM }
  );
  const [saving, setSaving] = useState(false);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [tab, setTab] = useState<"info" | "photos">("info");
  const fileRef = useRef<HTMLInputElement>(null);

  const loadPhotos = useCallback(async () => {
    if (!item) return;
    const res = await fetch(`${PHOTOS_URL}?item_id=${item.id}`, { headers: { ...adminHeaders(token) } });
    const d = await res.json();
    setPhotos(d.photos || []);
  }, [item, token]);

  useEffect(() => { loadPhotos(); }, [loadPhotos]);

  const f = (key: string, val: string) => setForm(p => ({ ...p, [key]: val }));

  const save = async () => {
    if (!form.brand || !form.model || !form.category) return;
    setSaving(true);
    const body = {
      category: form.category, brand: form.brand, model: form.model,
      color: form.color || null, storage: form.storage || null,
      ram: form.ram || null, region: form.region || null,
      availability: form.availability,
      price: form.price ? parseInt(form.price) : null,
      is_active: true,
    };
    if (isNew) {
      await fetch(CATALOG_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...adminHeaders(token) },
        body: JSON.stringify(body),
      });
    } else {
      await fetch(`${CATALOG_URL}?id=${item!.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...adminHeaders(token) },
        body: JSON.stringify(body),
      });
    }
    setSaving(false);
    onSaved();
    if (isNew) onClose();
    else setTab("photos");
  };

  const uploadPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!item) return;
    const files = Array.from(e.target.files || []).slice(0, MAX_PHOTOS - photos.length);
    if (!files.length) return;
    setUploading(true);
    for (const file of files) {
      const b64 = await new Promise<string>(res => {
        const r = new FileReader();
        r.onload = () => res((r.result as string).split(",")[1]);
        r.readAsDataURL(file);
      });
      await fetch(PHOTOS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...adminHeaders(token) },
        body: JSON.stringify({ item_id: item.id, file_name: file.name, file_b64: b64, content_type: file.type || "image/jpeg" }),
      });
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
    loadPhotos();
  };

  const deletePhoto = async (photoId: number) => {
    setDeleting(photoId);
    await fetch(`${PHOTOS_URL}?photo_id=${photoId}`, { method: "DELETE", headers: { ...adminHeaders(token) } });
    setDeleting(null);
    loadPhotos();
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-[#111] border border-[#2A2A2A] w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Шапка */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#222] shrink-0">
          <span className="font-oswald font-bold text-white uppercase text-sm">
            {isNew ? "Новый товар" : `${item!.brand} ${item!.model}`}
          </span>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
            <Icon name="X" size={18} />
          </button>
        </div>

        {/* Табы (только для существующих) */}
        {!isNew && (
          <div className="flex border-b border-[#222] shrink-0">
            {[{ key: "info", label: "Информация", icon: "FileText" }, { key: "photos", label: `Фото (${photos.length}/5)`, icon: "Camera" }].map(t => (
              <button key={t.key} onClick={() => setTab(t.key as "info" | "photos")}
                className={`flex items-center gap-1.5 px-4 py-2.5 font-oswald font-bold text-xs uppercase transition-colors ${tab === t.key ? "text-[#FFD700] border-b-2 border-[#FFD700]" : "text-white/30 hover:text-white"}`}>
                <Icon name={t.icon} size={12} /> {t.label}
              </button>
            ))}
          </div>
        )}

        <div className="overflow-y-auto flex-1 p-4">
          {tab === "info" && (
            <div className="space-y-3">
              {/* Категория + Бренд */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={lbl}>Категория *</label>
                  <select value={form.category} onChange={e => f("category", e.target.value)}
                    className={inp + " appearance-none"}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Бренд *</label>
                  <input value={form.brand} onChange={e => f("brand", e.target.value)}
                    placeholder="Apple" className={inp} />
                </div>
              </div>
              {/* Модель */}
              <div>
                <label className={lbl}>Модель *</label>
                <input value={form.model} onChange={e => f("model", e.target.value)}
                  placeholder="iPhone 17 Pro Max" className={inp} />
              </div>
              {/* Цвет + Память */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={lbl}>Цвет</label>
                  <input value={form.color} onChange={e => f("color", e.target.value)}
                    placeholder="Black Titanium" className={inp} />
                </div>
                <div>
                  <label className={lbl}>Память</label>
                  <input value={form.storage} onChange={e => f("storage", e.target.value)}
                    placeholder="256GB" className={inp} />
                </div>
              </div>
              {/* RAM + Регион */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={lbl}>RAM</label>
                  <input value={form.ram} onChange={e => f("ram", e.target.value)}
                    placeholder="8GB" className={inp} />
                </div>
                <div>
                  <label className={lbl}>Регион</label>
                  <select value={form.region} onChange={e => f("region", e.target.value)}
                    className={inp + " appearance-none"}>
                    <option value="">—</option>
                    {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              {/* Цена + Наличие */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={lbl}>Цена (₽)</label>
                  <input type="number" value={form.price} onChange={e => f("price", e.target.value)}
                    placeholder="134700" className={inp} />
                </div>
                <div>
                  <label className={lbl}>Наличие</label>
                  <select value={form.availability} onChange={e => f("availability", e.target.value)}
                    className={inp + " appearance-none"}>
                    {AVAIL_OPTIONS.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {tab === "photos" && item && (
            <div>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {photos.map(p => (
                  <div key={p.id} className="relative aspect-square group">
                    <img src={p.url} alt="" className="w-full h-full object-cover bg-[#1A1A1A]" />
                    <button onClick={() => deletePhoto(p.id)} disabled={deleting === p.id}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50">
                      {deleting === p.id ? <Icon name="Loader" size={10} className="animate-spin" /> : <Icon name="X" size={10} />}
                    </button>
                    <div className="absolute bottom-1 left-1 font-oswald text-[10px] text-white bg-black/60 px-1">{p.sort_order}</div>
                  </div>
                ))}
                {Array.from({ length: Math.max(0, MAX_PHOTOS - photos.length) }).map((_, i) => (
                  <div key={`e${i}`} className="aspect-square border-2 border-dashed border-[#2A2A2A] flex items-center justify-center text-white/15">
                    <Icon name="Plus" size={20} />
                  </div>
                ))}
              </div>
              {photos.length < MAX_PHOTOS && (
                <>
                  <input ref={fileRef} type="file" accept="image/*" multiple onChange={uploadPhotos} className="hidden" id="pe-upload" />
                  <label htmlFor="pe-upload"
                    className={`w-full flex items-center justify-center gap-2 py-2.5 border border-dashed cursor-pointer font-oswald font-bold text-xs uppercase transition-colors ${uploading ? "border-[#333] text-white/20 pointer-events-none" : "border-[#FFD700]/40 text-[#FFD700] hover:border-[#FFD700]"}`}>
                    {uploading ? <><Icon name="Loader" size={13} className="animate-spin" /> Загружаю...</> : <><Icon name="Upload" size={13} /> Добавить фото ({MAX_PHOTOS - photos.length} осталось)</>}
                  </label>
                </>
              )}
            </div>
          )}
        </div>

        {/* Футер */}
        <div className="flex gap-2 px-4 py-3 border-t border-[#222] shrink-0">
          {tab === "info" && (
            <button onClick={save} disabled={saving || !form.brand || !form.model}
              className="flex-1 bg-[#FFD700] text-black font-oswald font-bold py-2 uppercase text-xs hover:bg-yellow-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5">
              {saving ? <><Icon name="Loader" size={13} className="animate-spin" /> Сохраняю...</> : <><Icon name="Check" size={13} /> {isNew ? "Создать товар" : "Сохранить"}</>}
            </button>
          )}
          <button onClick={onClose} className="px-4 py-2 border border-[#333] text-white/30 font-oswald text-xs uppercase hover:text-white hover:border-[#555] transition-colors">
            {tab === "photos" ? "Готово" : "Отмена"}
          </button>
        </div>
      </div>
    </div>
  );
}
