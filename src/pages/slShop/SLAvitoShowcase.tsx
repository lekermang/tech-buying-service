import { useState, useEffect, useCallback, useRef, useMemo } from "react";
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
type FilterMode = "no" | "yes" | "all";

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
  const [filter, setFilter] = useState<FilterMode>("no");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<AvitoProduct | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const debRef = useRef<ReturnType<typeof setTimeout>>();

  const load = useCallback(
    (q: string, f: FilterMode) => {
      setLoading(true);
      const params = new URLSearchParams({ action: "list", limit: "120", has_photo: f });
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

  const flash = (type: "ok" | "err", text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4500);
  };

  const runSync = async () => {
    setSyncing(true);
    try {
      const r = await fetch(`${SYNC_URL}?action=firstrun`);
      const d = await r.json();
      if (d.ok) {
        flash(
          "ok",
          d.skipped
            ? `Уже синхронизировано: ${d.count} товаров`
            : `Готово: добавлено ${d.added}, обновлено ${d.updated}`,
        );
        load(query, filter);
      } else {
        flash("err", `Ошибка: ${d.error || "не удалось"}`);
      }
    } catch {
      flash("err", "Ошибка соединения");
    } finally {
      setSyncing(false);
    }
  };

  const progress = useMemo(() => {
    if (!stats.total_active) return 0;
    return Math.round((stats.with_photos / stats.total_active) * 100);
  }, [stats]);

  // Bookmarklet-инструкция и polling: показываем модал, опрашиваем БД на новые фото
  const [showHelper, setShowHelper] = useState(false);
  const [pollSince, setPollSince] = useState<number | null>(null);

  // Когда модалка открыта — раз в 5 сек обновляем список, чтобы увидеть результат
  useEffect(() => {
    if (!showHelper) return;
    const t = setInterval(() => load(query, filter), 5000);
    return () => clearInterval(t);
  }, [showHelper, load, query, filter]);

  void pollSince;
  void setPollSince;

  return (
    <div className="space-y-3">
      {/* Шапка с прогрессом */}
      <div className="relative rounded-xl bg-gradient-to-br from-[#FFD700]/12 via-[#FFD700]/4 to-transparent border border-[#FFD700]/30 p-3 overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-[#FFD700]/8 blur-3xl pointer-events-none" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FFD700]/40 to-transparent" />

        <div className="relative flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#FFE34D] via-[#FFD700] to-[#b8860b] flex items-center justify-center shrink-0 shadow-[0_4px_12px_rgba(255,215,0,0.4)]">
              <Icon name="Sparkles" size={18} className="text-black drop-shadow" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-oswald font-bold uppercase text-[14px] tracking-[0.04em] leading-tight bg-gradient-to-r from-[#FFD700] via-[#FFE34D] to-[#FFD700] bg-clip-text text-transparent">
                Витрина Авито
              </div>
              <div className="text-[11px] text-white/60 mt-0.5">
                Загрузи фото с телефона — товары появятся в премиум-карточках на сайте
              </div>
            </div>
          </div>
          <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-1.5">
            <button
              onClick={() => setShowHelper(true)}
              disabled={stats.no_photos === 0}
              className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-purple-600 to-violet-500 hover:shadow-[0_0_16px_rgba(168,85,247,0.5)] text-white font-oswald font-bold text-xs px-3 py-2 rounded uppercase tracking-wide disabled:opacity-40 transition-all"
              title="Открыть инструкцию по авто-загрузке фото с Авито"
            >
              <Icon name="Wand2" size={14} />
              🪄 Авто-загрузка фото
            </button>
            <button
              onClick={runSync}
              disabled={syncing}
              className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-[#FFD700] to-[#FFE55C] hover:shadow-[0_0_16px_rgba(255,215,0,0.5)] text-black font-oswald font-bold text-xs px-3 py-2 rounded uppercase tracking-wide disabled:opacity-50 transition-all"
            >
              <Icon name={syncing ? "Loader2" : "RefreshCw"} size={14} className={syncing ? "animate-spin" : ""} />
              {syncing ? "Синхронизирую..." : "Обновить список"}
            </button>
          </div>
        </div>

        {/* Прогресс-бар */}
        <div className="relative mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-white/50 font-roboto uppercase tracking-wide">
              Готовность витрины
            </span>
            <span className="font-oswald font-bold text-[11px] text-[#FFD700]">{progress}%</span>
          </div>
          <div className="relative h-2 bg-white/5 rounded-full overflow-hidden border border-white/10">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#b8860b] via-[#FFD700] to-[#FFE34D] rounded-full transition-all duration-700 shadow-[0_0_10px_rgba(255,215,0,0.5)]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1.5 text-[10px] text-white/55 font-roboto">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <b className="text-emerald-400">{stats.with_photos}</b> готовы
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
              <b className="text-orange-400">{stats.no_photos}</b> ждут фото
            </span>
            <span>всего {stats.total_active}</span>
          </div>
        </div>
      </div>

      {msg && (
        <div
          className={`text-[11px] rounded px-3 py-2 flex items-center gap-2 ${
            msg.type === "ok"
              ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
              : "bg-red-500/10 border border-red-500/30 text-red-300"
          }`}
        >
          <Icon name={msg.type === "ok" ? "CheckCircle2" : "AlertCircle"} size={13} />
          {msg.text}
        </div>
      )}

      {/* Sticky фильтры */}
      <div className="sticky top-0 z-10 bg-[#0D0D0D]/95 backdrop-blur-md py-2 -mx-1 px-1 border-b border-white/5">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Icon name="Search" size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              value={query}
              onChange={e => onSearch(e.target.value)}
              placeholder="Поиск по названию или ID..."
              className="w-full bg-[#0D0D0D] border border-white/15 text-white pl-8 pr-8 py-2 font-roboto text-sm rounded-lg focus:outline-none focus:border-[#FFD700] focus:shadow-[0_0_12px_rgba(255,215,0,0.15)] transition-all"
            />
            {query && (
              <button
                onClick={() => onSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70"
              >
                <Icon name="X" size={11} />
              </button>
            )}
          </div>
          <div className="flex gap-1">
            {([
              { k: "no", l: "Без фото", n: stats.no_photos, icon: "ImagePlus" },
              { k: "yes", l: "С фото", n: stats.with_photos, icon: "ImageCheck" },
              { k: "all", l: "Все", n: stats.total_active, icon: "Layers" },
            ] as const).map(b => (
              <button
                key={b.k}
                onClick={() => setFilter(b.k)}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-1 text-xs font-roboto px-3 py-2 rounded-lg transition-all ${
                  filter === b.k
                    ? "bg-[#FFD700] text-black font-semibold shadow-[0_0_10px_rgba(255,215,0,0.35)]"
                    : "bg-white/5 text-white/70 hover:bg-white/10 border border-white/10"
                }`}
              >
                <Icon name={b.icon} size={12} />
                <span className="hidden sm:inline">{b.l}</span>
                <span className="opacity-70 text-[10px]">·{b.n}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading && items.length === 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="aspect-square bg-white/5 rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="text-center py-12 border border-dashed border-white/10 rounded-xl">
          <Icon
            name={filter === "no" ? "PartyPopper" : "PackageOpen"}
            size={32}
            className="text-[#FFD700]/50 mx-auto mb-2"
          />
          <div className="text-white/70 font-oswald font-bold text-sm uppercase tracking-wide">
            {filter === "no" ? "Все товары с фото" : "Ничего не найдено"}
          </div>
          <div className="text-white/40 font-roboto text-[11px] mt-1">
            {filter === "no"
              ? "Витрина полностью оформлена — отличная работа!"
              : "Попробуйте изменить фильтр или запрос"}
          </div>
        </div>
      )}

      {/* Сетка товаров */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {items.map((it, idx) => (
          <button
            key={it.id}
            onClick={() => setEditing(it)}
            style={{ animationDelay: `${Math.min(idx * 25, 300)}ms` }}
            className="group relative bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-[#FFD700]/60 rounded-lg overflow-hidden text-left transition-all hover:shadow-[0_4px_20px_rgba(255,215,0,0.15)] hover:-translate-y-0.5 animate-in fade-in slide-in-from-bottom-2 fill-mode-both"
          >
            <div className="relative aspect-square bg-[#0D0D0D]">
              {it.main_photo ? (
                <>
                  <img src={it.main_photo} alt="" className="w-full h-full object-cover" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-1 bg-gradient-to-br from-orange-500/15 via-orange-500/5 to-transparent border border-dashed border-orange-400/40">
                  <Icon name="ImagePlus" size={28} className="text-orange-400/80" />
                  <span className="text-[9px] text-orange-300/90 font-roboto uppercase tracking-wide font-semibold">
                    Добавить фото
                  </span>
                </div>
              )}
              {it.photos.length > 0 && (
                <div className="absolute top-1 right-1 bg-emerald-500/95 text-white font-oswald font-bold text-[10px] px-1.5 py-0.5 rounded shadow-md flex items-center gap-0.5">
                  <Icon name="Images" size={10} />
                  {it.photos.length}
                </div>
              )}
              {!it.is_visible && (
                <div className="absolute top-1 left-1 bg-red-600/95 text-white font-roboto text-[9px] px-1.5 py-0.5 rounded uppercase shadow-md flex items-center gap-0.5">
                  <Icon name="EyeOff" size={9} />
                  скрыт
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="bg-[#FFD700] text-black font-oswald font-bold text-[10px] px-2 py-1 rounded uppercase tracking-wider shadow-lg flex items-center gap-1">
                  <Icon name={it.main_photo ? "Pencil" : "Camera"} size={10} />
                  {it.main_photo ? "Изменить" : "Сфото"}
                </div>
              </div>
            </div>
            <div className="p-2">
              <div className="font-roboto text-[11px] text-white truncate">{it.title}</div>
              <div className="flex items-center justify-between mt-0.5">
                <div className="font-oswald font-bold text-[#FFD700] text-sm">{formatPrice(it.price)}</div>
                {it.category && (
                  <div className="font-roboto text-[8px] text-white/40 truncate ml-1 max-w-[60%]">
                    {it.category}
                  </div>
                )}
              </div>
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
            setEditing(prev => (prev ? { ...prev, ...updated } : prev));
            if ("photos" in updated) {
              const oldHad = (editing.photos || []).length > 0;
              const newHas = ((updated.photos as string[]) || []).length > 0;
              if (oldHad !== newHas) {
                setStats(s => ({
                  ...s,
                  with_photos: newHas ? s.with_photos + 1 : Math.max(0, s.with_photos - 1),
                  no_photos: newHas ? Math.max(0, s.no_photos - 1) : s.no_photos + 1,
                }));
              }
            }
          }}
          onPrev={() => {
            const i = items.findIndex(p => p.id === editing.id);
            if (i > 0) setEditing(items[i - 1]);
          }}
          onNext={() => {
            const i = items.findIndex(p => p.id === editing.id);
            if (i >= 0 && i < items.length - 1) setEditing(items[i + 1]);
          }}
          hasPrev={items.findIndex(p => p.id === editing.id) > 0}
          hasNext={items.findIndex(p => p.id === editing.id) < items.length - 1}
        />
      )}

      {showHelper && (
        <BookmarkletHelper token={token} onClose={() => setShowHelper(false)} />
      )}
    </div>
  );
}

function BookmarkletHelper({ token, onClose }: { token: string; onClose: () => void }) {
  const apiUrl = PHOTOS_URL;
  const bookmarkletCode = `javascript:(function(){var TOKEN=${JSON.stringify(token)};var API=${JSON.stringify(apiUrl)};function note(t,c){var d=document.createElement('div');d.style.cssText='position:fixed;top:20px;right:20px;z-index:999999;background:'+(c||'#000')+';color:#fff;padding:14px 18px;border-radius:8px;font:14px/1.4 Arial;box-shadow:0 8px 24px rgba(0,0,0,.5);max-width:300px';d.textContent=t;document.body.appendChild(d);setTimeout(function(){d.remove();},5000);return d;}var m=location.pathname.match(/_(\\d{6,})(?:\\/|$)/);if(!m){alert('Откройте страницу товара Авито');return;}var avitoId=parseInt(m[1]);var imgs=[];document.querySelectorAll('meta[property="og:image"]').forEach(function(e){var u=e.getAttribute('content');if(u)imgs.push(u);});document.querySelectorAll('img').forEach(function(i){var s=i.src||'';if(s.indexOf('avito.st/image')>0&&imgs.indexOf(s)<0)imgs.push(s);});imgs=imgs.slice(0,5);var d='';var dm=document.querySelector('meta[property="og:description"]');if(dm)d=dm.getAttribute('content')||'';var dd=document.querySelector('[data-marker="item-view/item-description"]');if(dd&&dd.textContent)d=dd.textContent.trim();if(!imgs.length){alert('Фото не найдены на странице');return;}var loader=note('Загружаю '+imgs.length+' фото...','#7e22ce');Promise.all(imgs.map(function(u){return fetch(u).then(function(r){return r.blob();}).then(function(b){return new Promise(function(res){var fr=new FileReader();fr.onload=function(){res(fr.result);};fr.readAsDataURL(b);});});})).then(function(b64){return fetch(API+'?action=bookmarklet_save',{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify({token:TOKEN,avito_id:avitoId,images:b64,description:d})}).then(function(r){return r.json();});}).then(function(r){loader.remove();if(r.ok){note('Готово! Загружено '+r.added+' фото к товару: '+r.title,'#059669');}else{note('Ошибка: '+(r.error||'неизвестно'),'#dc2626');}}).catch(function(e){loader.remove();note('Ошибка: '+e.message,'#dc2626');});})();`;

  const copyBookmarklet = () => {
    navigator.clipboard.writeText(bookmarkletCode);
  };

  return (
    <div className="fixed inset-0 z-[400] bg-black/85 backdrop-blur flex items-center justify-center p-4 animate-in fade-in" onClick={onClose}>
      <div className="relative w-full max-w-2xl max-h-[95vh] bg-gradient-to-br from-[#1a1a1a] to-[#0D0D0D] border-2 border-purple-500/40 rounded-xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="shrink-0 flex items-start justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center">
              <Icon name="Wand2" size={18} className="text-white" />
            </div>
            <div>
              <div className="font-oswald font-bold text-white uppercase tracking-wide">Авто-загрузка фото с Авито</div>
              <div className="text-[11px] text-white/50">Один клик на странице товара = все фото загружены</div>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-white"><Icon name="X" size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 scrollbar-premium space-y-4">
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
            <div className="flex items-center gap-2 text-purple-300 font-oswald font-bold text-sm uppercase tracking-wide mb-1">
              <Icon name="Info" size={14} />
              Почему так?
            </div>
            <div className="text-[12px] text-white/70 leading-relaxed">
              Авито жёстко блокирует серверы — поэтому фото невозможно скачать с нашего бэкенда. Но <b>браузер сотрудника</b> на странице Авито всё видит. Этот «волшебный bookmarklet» работает 100%, без CORS-проблем.
            </div>
          </div>

          <div>
            <div className="font-oswald font-bold text-white text-sm uppercase tracking-wide mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#FFD700] text-black flex items-center justify-center font-bold text-xs">1</span>
              Скопируй магическую ссылку
            </div>
            <button
              onClick={copyBookmarklet}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-violet-500 hover:shadow-[0_0_16px_rgba(168,85,247,0.5)] text-white font-oswald font-bold text-sm px-4 py-3 rounded-lg uppercase tracking-wide transition-all"
            >
              <Icon name="Copy" size={16} />
              Скопировать в буфер
            </button>
            <div className="text-[10px] text-white/40 mt-1">или перетащи кнопку ниже в закладки браузера:</div>
            <a
              href={bookmarkletCode}
              onClick={e => { e.preventDefault(); copyBookmarklet(); }}
              className="mt-2 inline-flex items-center gap-1.5 bg-[#FFD700] text-black font-oswald font-bold text-xs px-3 py-2 rounded uppercase tracking-wide hover:bg-[#FFE55C] cursor-grab active:cursor-grabbing"
              draggable
            >
              <Icon name="Star" size={12} />
              📥 Загрузить фото с Авито
            </a>
          </div>

          <div>
            <div className="font-oswald font-bold text-white text-sm uppercase tracking-wide mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#FFD700] text-black flex items-center justify-center font-bold text-xs">2</span>
              Создай закладку в браузере
            </div>
            <div className="text-[12px] text-white/70 space-y-1.5 ml-8">
              <div><b className="text-white">На компьютере:</b> CTRL+D → имя «Фото с Авито» → URL: вставить из буфера → Сохранить</div>
              <div><b className="text-white">На телефоне (Chrome):</b> ⋮ → «Добавить в закладки» → редактировать → URL: вставить → Сохранить</div>
            </div>
          </div>

          <div>
            <div className="font-oswald font-bold text-white text-sm uppercase tracking-wide mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#FFD700] text-black flex items-center justify-center font-bold text-xs">3</span>
              Открой товар на Авито и нажми закладку
            </div>
            <div className="text-[12px] text-white/70 ml-8 space-y-1.5">
              <div>Все 5 фото и описание автоматически добавятся к этому товару на сайте.</div>
              <div className="text-emerald-400">✓ Делается за 3 секунды</div>
              <div className="text-emerald-400">✓ Можно делать прямо с телефона</div>
              <div className="text-emerald-400">✓ Никаких прокси и серверов — всё работает в твоём браузере</div>
            </div>
          </div>

          <div className="bg-[#FFD700]/10 border border-[#FFD700]/30 rounded-lg p-3">
            <div className="flex items-center gap-2 text-[#FFD700] font-oswald font-bold text-sm uppercase tracking-wide mb-1">
              <Icon name="Lightbulb" size={14} />
              Совет
            </div>
            <div className="text-[12px] text-white/70 leading-relaxed">
              Эта вкладка автоматически обновляется каждые 5 секунд — открой её на втором экране и сразу увидишь, как товары переходят из «Без фото» в «С фото».
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SLEditModal({
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