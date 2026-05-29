import { useCallback, useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/icon";

const API_URL = "https://functions.poehali.dev/d5ad3fdc-9ae3-41a2-93da-859bf3cb852b";

type WishItem = {
  id: number;
  client_name: string;
  client_phone: string;
  item_name: string;
  category: string;
  budget: string;
  condition: string;
  comment: string;
  status: string;
  status_label: string;
  staff_note: string;
  staff_name: string;
  found_at: string | null;
  created_at: string;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  new:       { label: "🆕 Новая",    color: "text-yellow-400",  bg: "bg-yellow-500/10",  border: "border-yellow-500/30" },
  in_work:   { label: "🔍 Ищем",     color: "text-blue-400",    bg: "bg-blue-500/10",    border: "border-blue-500/30" },
  found:     { label: "✅ Нашли",    color: "text-green-400",   bg: "bg-green-500/10",   border: "border-green-500/30" },
  closed:    { label: "🤝 Продано",  color: "text-white/50",    bg: "bg-white/5",        border: "border-white/15" },
  cancelled: { label: "❌ Отменена", color: "text-red-400/60",  bg: "bg-red-500/5",      border: "border-red-500/15" },
};

const CONDITION_LABELS: Record<string, string> = {
  new: "Новое", like_new: "Как новое", good: "Хорошее б/у", any: "Любое",
};

const fmtTime = (iso: string) => {
  try {
    const d = new Date(iso);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
  } catch { return ""; }
};

export default function WantToBuyTab({ token }: { token: string }) {
  const [items, setItems] = useState<WishItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState<WishItem | null>(null);
  const [noteText, setNoteText] = useState("");
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState<Record<string, number>>({});
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadItems = useCallback(async () => {
    try {
      const params = new URLSearchParams({ action: "list" });
      if (statusFilter) params.set("status", statusFilter);
      if (search) params.set("search", search);
      const r = await fetch(`${API_URL}?${params}`, { headers: { "X-Employee-Token": token } });
      const d = await r.json();
      if (d?.ok) setItems(d.items || []);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [token, statusFilter, search]);

  const loadStats = useCallback(async () => {
    try {
      const r = await fetch(`${API_URL}?action=stats`, { headers: { "X-Employee-Token": token } });
      const d = await r.json();
      if (d?.ok) setStats(d.counts || {});
    } catch { /* ignore */ }
  }, [token]);

  useEffect(() => {
    loadItems();
    loadStats();
  }, [loadItems, loadStats]);

  useEffect(() => {
    pollingRef.current = setInterval(() => { loadItems(); loadStats(); }, 30000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [loadItems, loadStats]);

  const updateStatus = async (id: number, status: string) => {
    setSaving(true);
    try {
      await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Employee-Token": token },
        body: JSON.stringify({ action: "update_status", id, status }),
      });
      await loadItems();
      await loadStats();
      if (selected?.id === id) setSelected(prev => prev ? { ...prev, status, status_label: STATUS_CONFIG[status]?.label || status } : prev);
    } finally { setSaving(false); }
  };

  const saveNote = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Employee-Token": token },
        body: JSON.stringify({ action: "add_note", id: selected.id, note: noteText }),
      });
      await loadItems();
      setSelected(prev => prev ? { ...prev, staff_note: noteText } : prev);
    } finally { setSaving(false); }
  };

  const openItem = (item: WishItem) => {
    setSelected(item);
    setNoteText(item.staff_note || "");
  };

  const newCount = stats.new || 0;
  const totalActive = (stats.new || 0) + (stats.in_work || 0);

  return (
    <div className="flex h-[calc(100dvh-120px)] overflow-hidden">
      {/* Левая панель — список */}
      <div className={`${selected ? "hidden md:flex" : "flex"} flex-col w-full md:w-80 shrink-0 border-r border-white/10`}>
        {/* Шапка */}
        <div className="px-3 py-3 border-b border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-oswald font-bold text-white text-base uppercase tracking-wide flex items-center gap-2">
                Хочу купить
                {newCount > 0 && (
                  <span className="bg-blue-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none animate-pulse">
                    {newCount}
                  </span>
                )}
              </h2>
              <p className="text-white/40 text-[11px] font-roboto">{totalActive} активных заявок</p>
            </div>
            <button onClick={() => { loadItems(); loadStats(); }} className="text-white/30 hover:text-blue-400 transition-colors p-1">
              <Icon name="RefreshCw" size={14} />
            </button>
          </div>

          {/* Поиск */}
          <div className="relative">
            <Icon name="Search" size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Поиск по заявкам..."
              className="w-full bg-white/5 border border-white/10 text-white text-xs pl-7 pr-3 py-2 rounded-lg outline-none focus:border-blue-500/50 placeholder:text-white/25"
            />
          </div>

          {/* Фильтр по статусу */}
          <div className="flex gap-1 flex-wrap">
            {[["", "Все"], ["new", "Новые"], ["in_work", "Ищем"], ["found", "Нашли"], ["closed", "Продано"]].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setStatusFilter(val)}
                className={`text-[10px] px-2 py-1 rounded-lg border font-roboto transition-all ${
                  statusFilter === val
                    ? "bg-blue-500/20 border-blue-500/50 text-blue-300"
                    : "bg-white/5 border-white/10 text-white/40 hover:text-white/70"
                }`}
              >
                {label}
                {val && stats[val] ? ` (${stats[val]})` : ""}
              </button>
            ))}
          </div>
        </div>

        {/* Список */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-12 text-white/30">
              <Icon name="Loader" size={16} className="animate-spin mr-2" />Загрузка...
            </div>
          )}
          {!loading && items.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center gap-2">
              <Icon name="ShoppingBag" size={32} className="text-white/15" />
              <p className="text-white/30 font-roboto text-sm">Нет заявок</p>
            </div>
          )}
          {items.map(item => {
            const st = STATUS_CONFIG[item.status] || STATUS_CONFIG.new;
            return (
              <button
                key={item.id}
                onClick={() => openItem(item)}
                className={`w-full text-left px-4 py-3 border-b border-white/5 transition-colors hover:bg-white/5 ${
                  selected?.id === item.id ? "bg-blue-500/10 border-l-2 border-l-blue-500" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full ${st.bg} border ${st.border} flex items-center justify-center shrink-0 mt-0.5`}>
                    <Icon name="ShoppingBag" size={14} className={st.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-roboto font-semibold text-white text-sm truncate">{item.client_name}</span>
                      <span className="text-white/30 text-[10px] font-roboto shrink-0">{fmtTime(item.created_at)}</span>
                    </div>
                    <p className="text-blue-300/80 text-xs font-roboto truncate mt-0.5">{item.item_name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border ${st.bg} ${st.border} ${st.color}`}>
                        {st.label}
                      </span>
                      {item.budget && <span className="text-white/30 text-[10px]">до {item.budget}</span>}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Правая панель — детали */}
      {selected ? (
        <div className="flex flex-col flex-1 min-w-0">
          {/* Шапка карточки */}
          <div className="px-4 py-3 border-b border-white/10 flex items-center gap-3 shrink-0">
            <button onClick={() => setSelected(null)} className="md:hidden text-white/40 hover:text-white transition-colors">
              <Icon name="ArrowLeft" size={20} />
            </button>
            <div className={`w-10 h-10 rounded-full ${STATUS_CONFIG[selected.status]?.bg || "bg-blue-500/10"} border ${STATUS_CONFIG[selected.status]?.border || "border-blue-500/30"} flex items-center justify-center shrink-0`}>
              <Icon name="ShoppingBag" size={16} className={STATUS_CONFIG[selected.status]?.color || "text-blue-400"} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-oswald font-bold text-white text-sm">{selected.client_name}</div>
              <a href={`tel:${selected.client_phone}`} className="text-blue-400/70 text-xs font-roboto hover:text-blue-400 transition-colors">
                {selected.client_phone}
              </a>
            </div>
            <span className="text-white/30 text-xs font-roboto shrink-0">#{selected.id}</span>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {/* Основные данные */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
              <div>
                <p className="text-white/40 text-[10px] uppercase tracking-wider font-roboto mb-1">Что ищет</p>
                <p className="text-white font-roboto font-semibold">{selected.item_name}</p>
              </div>
              {selected.category && (
                <div>
                  <p className="text-white/40 text-[10px] uppercase tracking-wider font-roboto mb-1">Категория</p>
                  <p className="text-white/70 font-roboto text-sm">{selected.category}</p>
                </div>
              )}
              <div className="flex gap-4">
                {selected.budget && (
                  <div>
                    <p className="text-white/40 text-[10px] uppercase tracking-wider font-roboto mb-1">Бюджет</p>
                    <p className="text-green-400 font-roboto font-semibold text-sm">до {selected.budget}</p>
                  </div>
                )}
                <div>
                  <p className="text-white/40 text-[10px] uppercase tracking-wider font-roboto mb-1">Состояние</p>
                  <p className="text-white/70 font-roboto text-sm">{CONDITION_LABELS[selected.condition] || selected.condition}</p>
                </div>
              </div>
              {selected.comment && (
                <div>
                  <p className="text-white/40 text-[10px] uppercase tracking-wider font-roboto mb-1">Комментарий клиента</p>
                  <p className="text-white/70 font-roboto text-sm whitespace-pre-wrap">{selected.comment}</p>
                </div>
              )}
              <div>
                <p className="text-white/40 text-[10px] uppercase tracking-wider font-roboto mb-1">Дата заявки</p>
                <p className="text-white/50 font-roboto text-xs">{new Date(selected.created_at).toLocaleString("ru-RU")}</p>
              </div>
            </div>

            {/* Смена статуса */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-white/40 text-[10px] uppercase tracking-wider font-roboto mb-3">Статус заявки</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
                  <button
                    key={val}
                    disabled={saving}
                    onClick={() => updateStatus(selected.id, val)}
                    className={`text-xs px-3 py-1.5 rounded-xl border font-roboto transition-all ${
                      selected.status === val
                        ? `${cfg.bg} ${cfg.border} ${cfg.color} font-semibold`
                        : "bg-white/5 border-white/10 text-white/40 hover:text-white/70"
                    }`}
                  >
                    {cfg.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Заметка сотрудника */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-white/40 text-[10px] uppercase tracking-wider font-roboto mb-3">Заметка сотрудника</p>
              <textarea
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                placeholder="Нашёл на Авито за 45 000 ₽, спросить клиента..."
                rows={3}
                className="w-full bg-white/5 border border-white/10 focus:border-blue-500/40 text-white text-sm px-3 py-2 rounded-xl outline-none resize-none font-roboto placeholder:text-white/20 transition-colors"
              />
              <button
                onClick={saveNote}
                disabled={saving}
                className="mt-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-300 text-xs font-roboto rounded-xl transition-all disabled:opacity-50 flex items-center gap-1"
              >
                {saving ? <><Icon name="Loader" size={12} className="animate-spin" /> Сохраняю...</> : <><Icon name="Save" size={12} /> Сохранить заметку</>}
              </button>
              {selected.staff_note && (
                <p className="mt-2 text-white/30 text-xs font-roboto">
                  Сохранено{selected.staff_name ? ` · ${selected.staff_name}` : ""}
                </p>
              )}
            </div>

            {/* Быстрые действия */}
            <div className="flex gap-2">
              <a
                href={`tel:${selected.client_phone}`}
                className="flex-1 flex items-center justify-center gap-2 bg-green-500/10 border border-green-500/30 text-green-400 py-3 rounded-xl text-sm font-roboto hover:bg-green-500/20 transition-colors"
              >
                <Icon name="Phone" size={16} /> Позвонить
              </a>
              <a
                href={`https://wa.me/${selected.client_phone.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-white/60 py-3 rounded-xl text-sm font-roboto hover:bg-white/10 transition-colors"
              >
                <Icon name="MessageCircle" size={16} /> WhatsApp
              </a>
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center text-white/20 flex-col gap-3">
          <Icon name="ShoppingBag" size={40} />
          <p className="font-roboto text-sm">Выберите заявку слева</p>
        </div>
      )}
    </div>
  );
}