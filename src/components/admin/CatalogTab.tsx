import { useState, useEffect, useCallback, useRef } from "react";
import Icon from "@/components/ui/icon";

const TG_PARSER_URL = "https://functions.poehali.dev/2e98b33f-0f6a-4bc3-9c93-6bbb80277fac";
const TG_AUTO_SYNC_URL = "https://functions.poehali.dev/79437e4a-387b-4d66-952b-a6e8e8d627a2";
const PHOTOS_URL = "https://functions.poehali.dev/76998fa9-f1f9-4986-8449-ecfe56cc3ee8";
const AUTO_INTERVAL = 5 * 60; // 5 минут

type CatalogItem = {
  id: number;
  brand: string;
  model: string;
  color: string | null;
  storage: string | null;
  region: string | null;
  category: string;
  price: number | null;
  availability: string;
  photo_url: string | null;
  photo_count: number;
  can_add: boolean;
};

type PhotoItem = {
  id: number;
  url: string;
  sort_order: number;
  product_name: string;
};

// ─── Редактор фото товара ─────────────────────────────────────────────────────
function PhotoEditor({ item, token, onClose }: { item: CatalogItem; token: string; onClose: () => void }) {
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadPhotos = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`${PHOTOS_URL}?item_id=${item.id}`, {
      headers: { "X-Admin-Token": token },
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
        headers: { "Content-Type": "application/json", "X-Admin-Token": token },
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
      headers: { "X-Admin-Token": token },
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

// ─── Список товаров для редактирования фото ───────────────────────────────────
function PhotosManager({ token }: { token: string }) {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<CatalogItem | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (q: string, p: number) => {
    setLoading(true);
    const url = `${PHOTOS_URL}?search=${encodeURIComponent(q)}&page=${p}`;
    const res = await fetch(url, { headers: { "X-Admin-Token": token } });
    const data = await res.json();
    setItems(data.items || []);
    setTotalPages(data.pages || 1);
    setLoading(false);
  }, [token]);

  useEffect(() => { load(search, page); }, [page]);

  const handleSearch = (val: string) => {
    setSearch(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setPage(1); load(val, 1); }, 400);
  };

  return (
    <div>
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Icon name="Search" size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Поиск товара..."
            className="w-full bg-[#0D0D0D] border border-[#333] text-white pl-8 pr-3 py-2 font-roboto text-xs focus:outline-none focus:border-[#FFD700] transition-colors"
          />
        </div>
        <button onClick={() => load(search, page)} className="text-white/40 hover:text-white transition-colors px-2">
          <Icon name="RefreshCw" size={14} />
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-white/30 font-roboto text-sm">Загружаю...</div>
      ) : (
        <div className="space-y-1">
          {items.map((item) => (
            <div key={item.id}
              className="bg-[#111] border border-[#222] px-3 py-2 flex items-center gap-3 hover:border-[#333] transition-colors">
              {/* Превью */}
              <div className="w-10 h-10 shrink-0 bg-[#1A1A1A] flex items-center justify-center overflow-hidden">
                {item.photo_url
                  ? <img src={item.photo_url} alt="" className="w-full h-full object-cover" />
                  : <Icon name="Image" size={16} className="text-white/20" />}
              </div>
              {/* Инфо */}
              <div className="flex-1 min-w-0">
                <div className="font-roboto text-sm text-white truncate">
                  {item.brand} {item.model} {item.color} {item.storage}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-roboto text-[10px] text-white/30">{item.category}</span>
                  {item.region && <span className="font-roboto text-[10px] text-white/20">{item.region}</span>}
                </div>
              </div>
              {/* Фото каунтер */}
              <div className={`shrink-0 font-oswald font-bold text-xs px-2 py-0.5 ${
                item.photo_count === 0 ? "text-red-400 bg-red-400/10" :
                item.photo_count < 3 ? "text-yellow-400 bg-yellow-400/10" :
                "text-green-400 bg-green-400/10"
              }`}>
                {item.photo_count}/5
              </div>
              {/* Кнопка */}
              <button
                onClick={() => setEditing(item)}
                className="shrink-0 flex items-center gap-1 font-oswald font-bold text-xs px-2.5 py-1.5 bg-[#FFD700] text-black hover:bg-yellow-400 transition-colors uppercase"
              >
                <Icon name="Camera" size={11} /> Фото
              </button>
            </div>
          ))}
          {items.length === 0 && (
            <div className="text-center py-8 text-white/30 font-roboto text-sm">Ничего не найдено</div>
          )}
        </div>
      )}

      {/* Пагинация */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-3">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="text-white/40 hover:text-white disabled:opacity-30 transition-colors">
            <Icon name="ChevronLeft" size={16} />
          </button>
          <span className="font-roboto text-white/40 text-xs">{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="text-white/40 hover:text-white disabled:opacity-30 transition-colors">
            <Icon name="ChevronRight" size={16} />
          </button>
        </div>
      )}

      {editing && (
        <PhotoEditor
          item={editing}
          token={token}
          onClose={() => { setEditing(null); load(search, page); }}
        />
      )}
    </div>
  );
}

// ─── Основной компонент ───────────────────────────────────────────────────────
export default function CatalogTab({ token }: { token: string }) {
  const [activeSection, setActiveSection] = useState<"parser" | "photos">("parser");
  const [running, setRunning] = useState(false);
  const [webhookSetup, setWebhookSetup] = useState(false);
  const [settingWebhook, setSettingWebhook] = useState(false);
  const [lastResult, setLastResult] = useState<{
    parsed?: number; updated?: number; inserted?: number; changed?: number; message?: string
  } | null>(null);
  const [lastRun, setLastRun] = useState<string | null>(() => localStorage.getItem("tg_parser_last_run"));
  const [nextRun, setNextRun] = useState<number>(AUTO_INTERVAL);
  const [autoEnabled, setAutoEnabled] = useState(() => localStorage.getItem("tg_parser_auto") === "1");

  const runParser = useCallback(async () => {
    setRunning(true);
    try {
      const res = await fetch(TG_PARSER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Token": token },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      setLastResult(data);
      const now = new Date().toLocaleString("ru-RU");
      setLastRun(now);
      localStorage.setItem("tg_parser_last_run", now);
      setNextRun(AUTO_INTERVAL);
    } finally {
      setRunning(false);
    }
  }, [token]);

  useEffect(() => {
    if (!autoEnabled) return;
    const interval = setInterval(() => {
      setNextRun((n) => {
        if (n <= 1) { runParser(); return AUTO_INTERVAL; }
        return n - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [autoEnabled, runParser]);

  const toggleAuto = () => {
    const next = !autoEnabled;
    setAutoEnabled(next);
    localStorage.setItem("tg_parser_auto", next ? "1" : "0");
    if (next) setNextRun(AUTO_INTERVAL);
  };

  const setupWebhook = async () => {
    setSettingWebhook(true);
    try {
      const res = await fetch(
        `${TG_AUTO_SYNC_URL}?action=setup&url=${encodeURIComponent(TG_AUTO_SYNC_URL)}`,
        { headers: { "X-Admin-Token": token } }
      );
      const data = await res.json();
      setWebhookSetup(data?.webhook?.ok === true || data?.webhook?.result === true);
    } finally {
      setSettingWebhook(false);
    }
  };

  const fmt2 = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div className="px-4 py-4">
      {/* Переключатель секций */}
      <div className="flex gap-1 mb-4">
        {[
          { key: "parser", label: "Синхронизация", icon: "RefreshCw" },
          { key: "photos", label: "Фото товаров", icon: "Camera" },
        ].map((s) => (
          <button key={s.key} onClick={() => setActiveSection(s.key as "parser" | "photos")}
            className={`flex items-center gap-1.5 font-oswald font-bold text-xs px-3 py-1.5 uppercase transition-colors ${
              activeSection === s.key ? "bg-[#FFD700] text-black" : "border border-[#333] text-white/40 hover:text-white"
            }`}>
            <Icon name={s.icon} size={12} />
            {s.label}
          </button>
        ))}
      </div>

      {/* Секция: Синхронизация */}
      {activeSection === "parser" && (
        <div className="max-w-lg">
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] p-4 mb-4">
            <div className="flex items-center gap-2 mb-1">
              <Icon name="Bot" size={14} className="text-[#FFD700]" />
              <span className="font-oswald font-bold text-white uppercase text-sm tracking-wide">Прайс @Bas713bot</span>
            </div>
            <p className="font-roboto text-white/40 text-xs mb-4">
              Автоматически читает прайс и обновляет цены + наличие. Цена = оптовая + 3 500 ₽.
            </p>

            <div className="flex gap-2 mb-4">
              <button onClick={runParser} disabled={running}
                className="flex-1 bg-[#FFD700] text-black font-oswald font-bold py-2.5 uppercase tracking-wide hover:bg-yellow-400 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                {running
                  ? <><Icon name="Loader" size={15} className="animate-spin" /> Синхронизирую...</>
                  : <><Icon name="RefreshCw" size={14} /> Обновить</>}
              </button>
              <button onClick={setupWebhook} disabled={settingWebhook}
                title="Подключить автоматический приём от бота"
                className={`px-3 py-2.5 font-oswald font-bold text-xs uppercase flex items-center gap-1.5 transition-colors disabled:opacity-50 ${webhookSetup ? "bg-green-500/20 text-green-400 border border-green-500/30" : "border border-[#444] text-white/50 hover:text-white hover:border-[#666]"}`}>
                {settingWebhook
                  ? <Icon name="Loader" size={13} className="animate-spin" />
                  : <Icon name={webhookSetup ? "CheckCircle" : "Webhook"} size={13} />}
                {webhookSetup ? "Подключён" : "Webhook"}
              </button>
            </div>

            <div className="flex items-center justify-between border-t border-[#2A2A2A] pt-3">
              <div>
                <div className="font-roboto text-white/60 text-xs">Автосинхронизация каждые 5 мин</div>
                {autoEnabled && (
                  <div className="font-roboto text-white/30 text-[10px]">
                    Следующий запуск через {fmt2(nextRun)}
                  </div>
                )}
              </div>
              <button onClick={toggleAuto}
                className={`w-11 h-6 rounded-full transition-colors relative ${autoEnabled ? "bg-[#FFD700]" : "bg-[#333]"}`}>
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${autoEnabled ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </div>
          </div>

          {lastRun && (
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] p-3 mb-3">
              <div className="font-roboto text-white/30 text-[10px] uppercase tracking-wide mb-2">
                Последний запуск: {lastRun}
              </div>
              {lastResult && (
                lastResult.message ? (
                  <div className="font-roboto text-yellow-400 text-xs">{lastResult.message}</div>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: "Обработано", val: lastResult.parsed ?? 0, color: "text-white" },
                      { label: "Изменилось", val: lastResult.changed ?? 0, color: "text-yellow-400" },
                      { label: "Обновлено", val: lastResult.updated ?? 0, color: "text-blue-400" },
                      { label: "Добавлено", val: lastResult.inserted ?? 0, color: "text-green-400" },
                    ].map((s) => (
                      <div key={s.label} className="text-center">
                        <div className={`font-oswald font-bold text-xl ${s.color}`}>{s.val}</div>
                        <div className="font-roboto text-white/30 text-[10px]">{s.label}</div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          )}

          <div className="bg-[#1A1A1A] border border-[#2A2A2A] p-3">
            <div className="font-roboto text-white/30 text-[10px] uppercase tracking-wide mb-2">Как работает</div>
            <ol className="space-y-1.5">
              {[
                "Бот принимает прайс от @Bas713bot автоматически через webhook",
                "Парсит: регион, модель, память, цвет, цену (+3 500 ₽), наличие",
                "Обновляет каталог только если изменились цена или наличие",
                "Фото из @appledysonphoto привязываются автоматически",
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="font-oswald font-bold text-[#FFD700] text-xs shrink-0">{i + 1}.</span>
                  <span className="font-roboto text-white/50 text-xs">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}

      {/* Секция: Фото товаров */}
      {activeSection === "photos" && (
        <PhotosManager token={token} />
      )}
    </div>
  );
}