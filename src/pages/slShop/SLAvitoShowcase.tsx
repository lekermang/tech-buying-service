import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import SLAvitoHeader from "./slAvitoShowcase/SLAvitoHeader";
import SLAvitoGrid from "./slAvitoShowcase/SLAvitoGrid";
import BookmarkletHelper from "./slAvitoShowcase/BookmarkletHelper";
import SLEditModal from "./slAvitoShowcase/SLEditModal";
import { AvitoProduct, FilterMode, Stats, PHOTOS_URL, SYNC_URL } from "./slAvitoShowcase/types";

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
      <SLAvitoHeader
        stats={stats}
        progress={progress}
        syncing={syncing}
        msg={msg}
        onOpenHelper={() => setShowHelper(true)}
        onRunSync={runSync}
      />

      <SLAvitoGrid
        query={query}
        onSearch={onSearch}
        filter={filter}
        setFilter={setFilter}
        stats={stats}
        loading={loading}
        items={items}
        onEdit={setEditing}
      />

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
