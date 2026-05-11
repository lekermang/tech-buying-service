import { useEffect, useMemo, useState } from "react";
import Icon from "@/components/ui/icon";
import { adminHeaders } from "@/lib/adminFetch";

const MAX_BOT_URL = "https://functions.poehali.dev/4618b13e-cd61-4167-b943-0f3d439d0c8c";

export type MaxClient = {
  id: number;
  max_user_id: number | null;
  display_name: string;
  max_username: string;
  phone: string;
  last_seen_at: string | null;
  has_lead: boolean;
};

type Props = {
  token: string;
  onPickClient?: (c: MaxClient) => void;
};

const fmtDate = (iso: string | null) => {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  } catch { return "—"; }
};

export default function SubscribersList({ token, onPickClient }: Props) {
  const [clients, setClients] = useState<MaxClient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${MAX_BOT_URL}?action=list_clients`, { headers: adminHeaders(token) });
      const data = await res.json();
      if (res.status === 401) {
        setError("Нет доступа: проверь админ-токен");
        setClients([]);
      } else if (!data.ok) {
        setError(data.error || "Ошибка загрузки");
        setClients([]);
      } else {
        setClients(data.clients || []);
      }
    } catch (e) {
      setError(`Сетевая ошибка: ${e}`);
      setClients([]);
    }
    setLoading(false);
  };

  useEffect(() => { load();   }, [token]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(c =>
      (c.display_name || "").toLowerCase().includes(q) ||
      (c.max_username || "").toLowerCase().includes(q) ||
      (c.phone || "").toLowerCase().includes(q)
    );
  }, [clients, search]);

  return (
    <div>
      <div className="flex items-center justify-between mb-3 gap-3">
        <div>
          <div className="font-oswald font-bold text-white text-sm uppercase tracking-wide">Подписчики MAX</div>
          <div className="text-white/40 text-xs font-roboto">
            Клиенты, которые писали нашему MAX-боту {clients.length > 0 && <span className="text-white/60">· всего {clients.length}</span>}
          </div>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] border border-[#FFD700]/30 text-[#FFD700] hover:bg-[#FFD700]/10 transition-colors disabled:opacity-50"
        >
          <Icon name={loading ? "Loader2" : "RefreshCw"} size={12} className={loading ? "animate-spin" : ""} />
          Обновить
        </button>
      </div>

      <div className="mb-3">
        <div className="relative">
          <Icon name="Search" size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск по имени, username или телефону..."
            className="w-full pl-8 pr-3 py-2 bg-[#0D0D0D] border border-[#333] text-white text-sm focus:outline-none focus:border-[#FFD700] transition-colors font-roboto"
          />
        </div>
      </div>

      {error && (
        <div className="mb-3 px-3 py-2 border border-red-500/30 bg-red-500/10 text-red-300 text-xs font-roboto flex items-center gap-2">
          <Icon name="AlertCircle" size={14} />
          {error}
        </div>
      )}

      <div className="bg-[#111] border border-[#222]">
        {loading ? (
          <div className="text-white/30 text-xs text-center py-8 font-roboto">
            <Icon name="Loader2" size={14} className="animate-spin inline mr-2" />
            Загружаю подписчиков...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-white/30 text-xs text-center py-8 font-roboto">
            {clients.length === 0 ? "Пока нет подписчиков MAX" : "Никого не нашлось по запросу"}
          </div>
        ) : (
          <div className="divide-y divide-white/5 max-h-[60vh] overflow-y-auto">
            {filtered.map(c => (
              <button
                key={c.id}
                onClick={() => onPickClient?.(c)}
                className="w-full text-left flex items-center gap-3 px-3 py-2 hover:bg-white/5 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-[#FFD700]/15 flex items-center justify-center shrink-0 text-[#FFD700] font-oswald font-bold text-xs">
                  {(c.display_name || "?").charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-oswald font-bold text-white text-sm truncate">{c.display_name || "Без имени"}</span>
                    {c.max_username && <span className="text-white/40 text-[10px] font-roboto">@{c.max_username}</span>}
                    {c.has_lead && (
                      <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 bg-green-500/15 text-green-300 border border-green-500/30 font-roboto font-bold">
                        Заявка
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-[10px] text-white/40 font-roboto">
                    {c.phone && <span>📞 {c.phone}</span>}
                    <span>🕒 {fmtDate(c.last_seen_at)}</span>
                    <span className="text-white/25">id {c.id}</span>
                  </div>
                </div>
                <Icon name="ChevronRight" size={14} className="text-white/30 shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
