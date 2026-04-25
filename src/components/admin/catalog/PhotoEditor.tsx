import { useState, useEffect, useCallback, useRef } from "react";
import Icon from "@/components/ui/icon";
import { adminHeaders } from "@/lib/adminFetch";
import { CatalogItem, PhotoItem, PHOTOS_URL } from "./types";

export default function PhotoEditor({ item, token, onClose }: { item: CatalogItem; token: string; onClose: () => void }) {
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadPhotos = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`${PHOTOS_URL}?item_id=${item.id}`, {
      headers: { ...adminHeaders(token) },
    });
    const data = await res.json();
    setPhotos(data.photos || []);
    setLoading(false);
  }, [item.id, token]);

  useEffect(() => { loadPhotos(); }, [loadPhotos]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    for (const file of files.slice(0, 5 - photos.length)) {
      const b64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.readAsDataURL(file);
      });
      await fetch(PHOTOS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...adminHeaders(token) },
        body: JSON.stringify({
          item_id: item.id,
          file_name: file.name,
          file_b64: b64,
          content_type: file.type || "image/jpeg",
        }),
      });
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
    loadPhotos();
  };

  const handleDelete = async (photoId: number) => {
    setDeleting(photoId);
    await fetch(`${PHOTOS_URL}?photo_id=${photoId}`, {
      method: "DELETE",
      headers: { ...adminHeaders(token) },
    });
    setDeleting(null);
    loadPhotos();
  };

  const canAdd = photos.length < 5;
  const label = [item.brand, item.model, item.color, item.storage].filter(Boolean).join(" ");

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-[#1A1A1A] border border-[#333] w-full max-w-lg rounded-none">
        {/* Шапка */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#2A2A2A]">
          <div>
            <div className="font-oswald font-bold text-white text-sm uppercase">{label}</div>
            <div className="font-roboto text-white/30 text-[10px]">{photos.length}/5 фото</div>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
            <Icon name="X" size={18} />
          </button>
        </div>

        {/* Фото */}
        <div className="p-4">
          {loading ? (
            <div className="text-center py-8 text-white/30 font-roboto text-sm">Загружаю...</div>
          ) : (
            <div className="grid grid-cols-3 gap-2 mb-4">
              {photos.map((p) => (
                <div key={p.id} className="relative aspect-square group">
                  <img src={p.url} alt="" className="w-full h-full object-cover bg-[#111]" />
                  <button
                    onClick={() => handleDelete(p.id)}
                    disabled={deleting === p.id}
                    className="absolute top-1 right-1 w-6 h-6 bg-red-500/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                  >
                    {deleting === p.id
                      ? <Icon name="Loader" size={10} className="animate-spin" />
                      : <Icon name="X" size={10} />}
                  </button>
                  <div className="absolute bottom-1 left-1 font-oswald text-[10px] text-white bg-black/60 px-1">
                    {p.sort_order}
                  </div>
                </div>
              ))}
              {/* Пустые слоты */}
              {Array.from({ length: Math.max(0, 5 - photos.length) }).map((_, i) => (
                <div key={`empty-${i}`}
                  className="aspect-square border-2 border-dashed border-[#333] flex items-center justify-center text-white/20">
                  <Icon name="Image" size={20} />
                </div>
              ))}
            </div>
          )}

          {canAdd && (
            <div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleUpload}
                className="hidden"
                id="photo-upload"
              />
              <label
                htmlFor="photo-upload"
                className={`w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-[#FFD700]/40 text-[#FFD700] font-oswald font-bold uppercase text-xs cursor-pointer hover:border-[#FFD700] transition-colors ${uploading ? "opacity-50 pointer-events-none" : ""}`}
              >
                {uploading
                  ? <><Icon name="Loader" size={13} className="animate-spin" /> Загружаю...</>
                  : <><Icon name="Upload" size={13} /> Добавить фото ({5 - photos.length} осталось)</>}
              </label>
            </div>
          )}
          {!canAdd && (
            <div className="text-center font-roboto text-white/30 text-xs py-2">
              Максимум 5 фото загружено
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
