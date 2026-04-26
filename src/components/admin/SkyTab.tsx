import { useState, useEffect, useCallback, useRef } from "react";
import Icon from "@/components/ui/icon";
import { adminHeaders } from "@/lib/adminFetch";

const CATALOG_API = "https://functions.poehali.dev/e0e6576c-f000-4288-86ef-1de08ad7bcc4";
const PHOTOS_API = "https://functions.poehali.dev/06375f20-54a8-439c-921c-6cff0f1cecf2";

const PHOTO_TYPES = [
  { key: "front", label: "Фронт", icon: "Camera", desc: "Основной вид товара" },
  { key: "detail", label: "Деталь", icon: "ZoomIn", desc: "Крупный план / шильдик" },
  { key: "packaging", label: "Упаковка", icon: "Package", desc: "Коробка / этикетка" },
  { key: "other", label: "Другое", icon: "Image", desc: "Доп. ракурс" },
];

type SkyItem = {
  id: number; sku: string | null; brand: string; model: string;
  category: string; price: number | null; availability: string;
  photos_count: number; real_count: number; valid_count: number; is_valid: boolean;
};

type Photo = {
  id: number; photo_type: string; file_name: string; url: string;
  sort_order: number; is_valid: boolean;
};

const INP = "w-full bg-[#0D0D0D] border border-[#333] text-white px-3 py-2 font-roboto text-xs focus:outline-none focus:border-[#FFD700] transition-colors placeholder:text-white/20";
const LBL = "font-roboto text-white/40 text-[10px] block mb-1 uppercase tracking-wide";

function PhotoUploader({ item, token, onDone }: { item: SkyItem; token: string; onDone: () => void }) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [photoType, setPhotoType] = useState("front");
  const fileRef = useRef<HTMLInputElement>(null);

  const loadPhotos = useCallback(async () => {
    const res = await fetch(`${PHOTOS_API}?item_id=${item.id}`);
    const data = await res.json();
    setPhotos(data.photos || []);
  }, [item.id]);

  useEffect(() => { loadPhotos(); }, [loadPhotos]);

  const productName = [item.brand, item.model].filter(Boolean).join(" ");
  const sku = item.sku || `SKY${item.id}`;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setResult(null);

    const reader = new FileReader();
    reader.onload = async () => {
      const b64 = (reader.result as string).split(",")[1];
      const res = await fetch(PHOTOS_API, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...adminHeaders(token) },
        body: JSON.stringify({
          item_id: item.id,
          sku,
          product_name: productName,
          photo_type: photoType,
          file_name: file.name,
          file_b64: b64,
          content_type: file.type || "image/jpeg",
        }),
      });
      const data = await res.json();
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";

      if (data.error) {
        setResult({ ok: false, msg: data.error });
      } else {
        setResult({
          ok: data.is_valid,
          msg: data.warning
            ? `⚠️ ${data.warning}`
            : `✅ Загружено! Валидных фото: ${data.valid_count}/3`,
        });
        loadPhotos();
        onDone();
      }
    };
    reader.readAsDataURL(file);
  };

  const validCount = photos.filter(p => p.is_valid).length;
  const isItemValid = validCount >= 3;

  return (
    <div className="bg-[#111] border border-[#2A2A2A] p-4 mt-3">
      {/* Заголовок товара */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="font-oswald font-bold text-sm text-white uppercase">{productName}</div>
          <div className="font-roboto text-white/40 text-[10px]">
            SKU: {sku} · {item.price ? `${item.price.toLocaleString("ru-RU")} ₽` : "Цена не указана"}
          </div>
        </div>
        <div className={`flex items-center gap-1.5 font-roboto text-xs px-2.5 py-1 border ${isItemValid ? "border-green-500/30 text-green-400 bg-green-900/20" : "border-orange-500/30 text-orange-400 bg-orange-900/20"}`}>
          <Icon name={isItemValid ? "CheckCircle" : "AlertTriangle"} size={12} />
          {validCount}/3 фото
        </div>
      </div>

      {/* Требуемое имя файла */}
      <div className="bg-[#0D0D0D] border border-[#333] px-3 py-2 mb-3">
        <div className="font-roboto text-white/30 text-[10px] mb-1 uppercase tracking-wide">Шаблон имени файла:</div>
        <div className="font-roboto text-[#FFD700] text-[11px] font-bold">
          {sku}_{productName.toLowerCase().replace(/\s+/g, "_")}_front_01.jpg
        </div>
        <div className="font-roboto text-white/20 text-[10px] mt-1">
          Типы: front / detail / packaging / other · Пример: {sku}_sky_model_detail_02.jpg
        </div>
      </div>

      {/* Загруженные фото */}
      {photos.length > 0 && (
        <div className="mb-3">
          <div className="font-roboto text-white/30 text-[10px] uppercase tracking-wide mb-2">Загруженные фото</div>
          <div className="grid grid-cols-3 gap-2">
            {photos.map(p => (
              <div key={p.id} className={`relative border ${p.is_valid ? "border-green-500/30" : "border-red-500/20"}`}>
                <img src={p.url} alt={p.file_name}
                  className="w-full aspect-square object-cover opacity-80" />
                <div className={`absolute bottom-0 left-0 right-0 px-1.5 py-1 text-[9px] font-roboto ${p.is_valid ? "bg-green-900/80 text-green-300" : "bg-red-900/80 text-red-300"}`}>
                  {PHOTO_TYPES.find(t => t.key === p.photo_type)?.label || p.photo_type}
                  {!p.is_valid && " ⚠️"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Форма загрузки */}
      <div>
        <div className="font-roboto text-white/30 text-[10px] uppercase tracking-wide mb-2">Добавить фото</div>
        <div className="flex gap-2 mb-2 flex-wrap">
          {PHOTO_TYPES.map(t => (
            <button key={t.key} onClick={() => setPhotoType(t.key)}
              className={`font-roboto text-[10px] px-2.5 py-1 border transition-colors flex items-center gap-1 ${photoType === t.key ? "border-[#FFD700] text-[#FFD700] bg-[#FFD700]/5" : "border-[#333] text-white/40 hover:text-white"}`}>
              <Icon name={t.icon} size={11} />
              {t.label}
            </button>
          ))}
        </div>

        <label className={`flex items-center gap-2 w-full border-2 border-dashed px-3 py-3 cursor-pointer transition-colors ${uploading ? "border-[#FFD700]/30 opacity-50" : "border-[#333] hover:border-[#FFD700]/40"}`}>
          <Icon name={uploading ? "Loader" : "Upload"} size={16}
            className={`shrink-0 ${uploading ? "animate-spin text-[#FFD700]" : "text-white/30"}`} />
          <span className="font-roboto text-white/40 text-xs">
            {uploading ? "Загружаю..." : `Выбрать файл (${PHOTO_TYPES.find(t => t.key === photoType)?.desc})`}
          </span>
          <input ref={fileRef} type="file" accept="image/*"
            onChange={handleUpload} disabled={uploading} className="hidden" />
        </label>

        {result && (
          <div className={`mt-2 font-roboto text-xs px-3 py-2 border ${result.ok ? "border-green-500/30 text-green-400 bg-green-900/10" : "border-orange-500/30 text-orange-400 bg-orange-900/10"}`}>
            {result.msg}
          </div>
        )}
      </div>

      {!isItemValid && (
        <div className="mt-3 font-roboto text-[10px] text-orange-400/70 border-t border-[#2A2A2A] pt-2">
          ⚠️ Недостаточно валидных фото — требуется минимум 3 (загружено валидных: {validCount})
        </div>
      )}
    </div>
  );
}

export default function SkyTab({ token }: { token: string }) {
  const [items, setItems] = useState<SkyItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    sku: "", brand: "SKY", model: "", price: "", availability: "in_stock",
  });

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(PHOTOS_API);
    const data = await res.json();
    setItems(data.items || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const addItem = async () => {
    if (!form.model) return;
    setSaving(true);
    const body = {
      category: "SKY",
      brand: form.brand || "SKY",
      model: form.model,
      sku: form.sku || null,
      price: form.price ? parseInt(form.price) : null,
      availability: form.availability,
      has_photo: false,
    };
    await fetch(CATALOG_API, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...adminHeaders(token) },
      body: JSON.stringify(body),
    });
    setSaving(false);
    setShowAddForm(false);
    setForm({ sku: "", brand: "SKY", model: "", price: "", availability: "in_stock" });
    load();
  };

  const validItems = items.filter(i => i.is_valid).length;

  return (
    <div className="px-4 py-3">
      {/* Статистика */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label: "Всего товаров", value: items.length, color: "text-white" },
          { label: "С фото ≥3", value: validItems, color: "text-green-400" },
          { label: "Нужны фото", value: items.length - validItems, color: "text-orange-400" },
        ].map(s => (
          <div key={s.label} className="bg-[#1A1A1A] border border-[#2A2A2A] px-3 py-2 text-center">
            <div className={`font-oswald font-bold text-xl ${s.color}`}>{s.value}</div>
            <div className="font-roboto text-white/30 text-[10px]">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Кнопка добавить */}
      <div className="flex items-center justify-between mb-3">
        <div className="font-roboto text-white/30 text-xs uppercase tracking-wide">SKY — товары категории</div>
        <button onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 bg-[#FFD700] text-black font-oswald font-bold px-3 py-1.5 text-xs uppercase hover:bg-yellow-400 transition-colors">
          <Icon name={showAddForm ? "X" : "Plus"} size={13} />
          {showAddForm ? "Отмена" : "Добавить товар"}
        </button>
      </div>

      {/* Форма добавления */}
      {showAddForm && (
        <div className="bg-[#1A1A1A] border border-[#FFD700]/30 p-4 mb-4">
          <div className="font-roboto text-white/40 text-[10px] uppercase tracking-widest mb-3">Новый SKY товар</div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <label className={LBL}>SKU (артикул)</label>
              <input value={form.sku} onChange={e => setForm(p => ({ ...p, sku: e.target.value }))}
                placeholder="SKY001" className={INP} />
            </div>
            <div>
              <label className={LBL}>Бренд</label>
              <input value={form.brand} onChange={e => setForm(p => ({ ...p, brand: e.target.value }))}
                placeholder="SKY" className={INP} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <label className={LBL}>Модель / название *</label>
              <input value={form.model} onChange={e => setForm(p => ({ ...p, model: e.target.value }))}
                placeholder="Air Purifier Pro" className={INP} />
            </div>
            <div>
              <label className={LBL}>Цена (₽)</label>
              <input type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                placeholder="5900" className={INP} />
            </div>
          </div>
          <div className="mb-3">
            <label className={LBL}>Наличие</label>
            <select value={form.availability} onChange={e => setForm(p => ({ ...p, availability: e.target.value }))}
              className={INP + " appearance-none"}>
              <option value="in_stock">В наличии</option>
              <option value="on_order">Под заказ</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={addItem} disabled={saving || !form.model}
              className="bg-[#FFD700] text-black font-oswald font-bold px-4 py-2 uppercase text-xs hover:bg-yellow-400 transition-colors disabled:opacity-50 flex items-center gap-1.5">
              <Icon name="Check" size={13} />
              {saving ? "Создаю..." : "Создать товар"}
            </button>
            <button onClick={() => setShowAddForm(false)}
              className="text-white/30 font-roboto text-xs hover:text-white transition-colors px-2">
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Список товаров */}
      {loading ? (
        <div className="text-center py-10 text-white/30 font-roboto text-sm">Загружаю...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-10">
          <Icon name="Package" size={32} className="text-white/10 mx-auto mb-2" />
          <div className="font-roboto text-white/30 text-sm">Нет SKY-товаров</div>
          <div className="font-roboto text-white/20 text-xs mt-1">Добавьте первый товар кнопкой выше</div>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(item => {
            const isExpanded = expandedId === item.id;
            const productName = [item.brand, item.model].filter(Boolean).join(" ");
            return (
              <div key={item.id}>
                <div
                  className={`bg-[#1A1A1A] border px-3 py-3 cursor-pointer transition-colors ${isExpanded ? "border-[#FFD700]/30" : "border-[#2A2A2A] hover:border-[#333]"}`}
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Индикатор валидности */}
                      <div className={`w-2 h-2 rounded-full shrink-0 ${item.is_valid ? "bg-green-400" : item.real_count > 0 ? "bg-orange-400" : "bg-red-500/60"}`} />
                      <div className="min-w-0">
                        <div className="font-roboto text-sm text-white truncate">{productName}</div>
                        <div className="font-roboto text-[10px] text-white/30">
                          {item.sku || `SKY${item.id}`}
                          {item.price ? ` · ${item.price.toLocaleString("ru-RU")} ₽` : ""}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`font-roboto text-[10px] px-2 py-0.5 border ${item.is_valid ? "border-green-500/30 text-green-400" : "border-orange-500/30 text-orange-400"}`}>
                        {item.valid_count}/3
                      </span>
                      <Icon name={isExpanded ? "ChevronUp" : "ChevronDown"} size={14} className="text-white/30" />
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <PhotoUploader item={item} token={token} onDone={load} />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Легенда */}
      <div className="mt-4 pt-3 border-t border-[#1A1A1A] flex gap-4 flex-wrap">
        {[
          { color: "bg-green-400", label: "Валидно (≥3 фото с правильным именем)" },
          { color: "bg-orange-400", label: "Есть фото, но < 3 валидных" },
          { color: "bg-red-500/60", label: "Нет фото" },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${l.color}`} />
            <span className="font-roboto text-white/30 text-[10px]">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}