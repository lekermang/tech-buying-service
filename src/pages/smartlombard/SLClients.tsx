import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { smartlombardCall } from "../staff.types";

type Client = {
  id: number;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  phone?: string;
  email?: string;
  birthday?: string;
  is_blacklisted?: boolean;
  is_blocked?: boolean;
};

function fullName(c: Client) {
  if (c.full_name) return c.full_name;
  return [c.last_name, c.first_name, c.middle_name].filter(Boolean).join(" ").trim() || `#${c.id}`;
}

export function SLClients({ token, myRole }: { token: string; myRole: string }) {
  const [items, setItems] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState<Client | null>(null);

  const isOwnerOrAdmin = myRole === "owner" || myRole === "admin";

  const load = useCallback(async (resetPage = true, q = search) => {
    setLoading(true); setError("");
    const targetPage = resetPage ? 1 : page;
    const params: Record<string, string | number> = { page: targetPage, limit: 30 };
    if (q.trim()) params.search = q.trim();
    const r = await smartlombardCall<{ clients?: Client[] }>({ token, path: "/clients", params });
    if (!r.ok) {
      setError(r.error || "Ошибка"); setItems([]);
    } else {
      const list = r.data?.clients || [];
      setItems(prev => (resetPage ? list : [...prev, ...list]));
      setHasMore(list.length >= 30);
      if (resetPage) setPage(1);
    }
    setLoading(false);
  }, [token, page, search]);

  useEffect(() => {
    const t = setTimeout(() => load(true), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <div className="p-3 space-y-3">
      {/* Поиск + добавление */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Icon name="Search" size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="ФИО, телефон, паспорт..."
            className="w-full bg-[#0A0A0A] border border-[#1F1F1F] text-white pl-9 pr-3 py-2.5 font-roboto text-sm rounded-md focus:outline-none focus:border-[#FFD700]/50 placeholder:text-white/25" />
        </div>
        {isOwnerOrAdmin && (
          <button onClick={() => setShowAdd(true)}
            className="shrink-0 flex items-center gap-1.5 bg-gradient-to-b from-[#FFD700] to-yellow-500 text-black font-oswald font-bold px-3 py-2 text-xs uppercase rounded-md shadow-md shadow-[#FFD700]/20 active:scale-95 transition-all">
            <Icon name="UserPlus" size={13} />
            <span className="hidden sm:inline">Клиент</span>
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-300 font-roboto text-[11px] flex items-start gap-2">
          <Icon name="AlertCircle" size={14} className="mt-0.5 shrink-0" />
          <span className="break-words">{error}</span>
        </div>
      )}

      {/* Список */}
      <div className="space-y-1.5">
        {items.map(c => {
          const initials = fullName(c).trim().split(/\s+/).map(w => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "?";
          return (
            <button key={c.id} onClick={() => setSelected(c)}
              className="w-full bg-[#141414] border border-[#1F1F1F] hover:border-[#FFD700]/30 rounded-lg p-2.5 flex items-center gap-2.5 text-left transition-all active:scale-[0.98]">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500/30 to-blue-700/30 border border-blue-400/20 text-blue-200 flex items-center justify-center font-oswald font-bold text-[11px] shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-oswald font-bold text-white text-sm uppercase truncate">{fullName(c)}</div>
                <div className="flex items-center gap-2 font-roboto text-[10px] text-white/40 flex-wrap">
                  {c.phone && <span className="flex items-center gap-1"><Icon name="Phone" size={9} />{c.phone}</span>}
                  <span className="text-white/25">#{c.id}</span>
                  {c.is_blacklisted && <span className="bg-red-500/15 text-red-400 px-1.5 py-0.5 rounded text-[9px]">ЧС</span>}
                  {c.is_blocked && <span className="bg-orange-500/15 text-orange-400 px-1.5 py-0.5 rounded text-[9px]">блок</span>}
                </div>
              </div>
              <Icon name="ChevronRight" size={14} className="text-white/30 shrink-0" />
            </button>
          );
        })}

        {!loading && items.length === 0 && !error && (
          <div className="text-center py-12 text-white/30">
            <Icon name="Users" size={32} className="mx-auto mb-2 opacity-50" />
            <div className="font-roboto text-sm">Клиенты не найдены</div>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-6 text-white/30">
            <Icon name="Loader" size={16} className="animate-spin mr-2" />
            <span className="font-roboto text-sm">Загружаю...</span>
          </div>
        )}

        {hasMore && !loading && (
          <button onClick={() => { setPage(p => p + 1); load(false); }}
            className="w-full bg-[#141414] border border-[#1F1F1F] hover:border-[#FFD700]/40 hover:text-[#FFD700] text-white/60 font-roboto text-xs py-2.5 rounded-md transition-colors active:scale-95">
            Загрузить ещё
          </button>
        )}
      </div>

      {selected && <ClientDetailsModal token={token} client={selected} onClose={() => setSelected(null)} />}
      {showAdd && isOwnerOrAdmin && <AddClientModal token={token} onClose={() => setShowAdd(false)} onCreated={() => { setShowAdd(false); load(true); }} />}
    </div>
  );
}

function ClientDetailsModal({ token, client, onClose }: { token: string; client: Client; onClose: () => void }) {
  const [details, setDetails] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const r = await smartlombardCall<Record<string, unknown>>({ token, path: `/clients/${client.id}` });
      if (!r.ok) setError(r.error || "Ошибка");
      else setDetails(r.data || {});
      setLoading(false);
    })();
  }, [token, client.id]);

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        className="bg-gradient-to-br from-[#1A1A1A] to-[#111] border border-[#FFD700]/30 w-full sm:max-w-md max-h-[85vh] overflow-y-auto rounded-t-2xl sm:rounded-lg shadow-2xl">
        <div className="sticky top-0 bg-[#1A1A1A] border-b border-[#222] px-4 py-3 flex items-center justify-between">
          <div className="font-oswald font-bold text-white uppercase text-sm">Карточка клиента</div>
          <button onClick={onClose} className="text-white/40 hover:text-white p-1"><Icon name="X" size={18} /></button>
        </div>
        <div className="p-4 space-y-3">
          <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg p-3">
            <div className="font-oswald font-bold text-white text-base">{fullName(client)}</div>
            <div className="font-roboto text-white/40 text-[11px]">ID #{client.id}</div>
          </div>
          {loading && (
            <div className="text-center py-6 text-white/40 font-roboto text-sm flex items-center justify-center gap-2">
              <Icon name="Loader" size={14} className="animate-spin" />Загружаю детали...
            </div>
          )}
          {error && <div className="bg-red-500/10 border border-red-500/30 rounded p-2 text-red-300 font-roboto text-[11px]">{error}</div>}
          {details && (
            <div className="space-y-1.5 text-[11px] font-roboto">
              {Object.entries(details).filter(([_, v]) => v !== null && v !== "" && typeof v !== "object").map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 border-b border-[#1F1F1F] pb-1">
                  <span className="text-white/40">{k}</span>
                  <span className="text-white text-right break-all">{String(v)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AddClientModal({ token, onClose, onCreated }: { token: string; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    last_name: "", first_name: "", middle_name: "",
    phone: "", birthday: "",
    passport_series: "", passport_number: "", passport_issued_by: "", passport_issued_date: "",
    address: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!form.last_name || !form.first_name || !form.phone) {
      setError("Фамилия, имя и телефон обязательны"); return;
    }
    setSaving(true); setError("");
    const r = await smartlombardCall({
      token, path: "/clients", method: "POST",
      body: form,
    });
    setSaving(false);
    if (!r.ok) setError(r.error || "Не удалось создать");
    else onCreated();
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        className="bg-gradient-to-br from-[#1A1A1A] to-[#111] border border-[#FFD700]/30 w-full sm:max-w-md max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-lg shadow-2xl">
        <div className="sticky top-0 bg-[#1A1A1A] border-b border-[#222] px-4 py-3 flex items-center justify-between">
          <div className="font-oswald font-bold text-white uppercase text-sm">Новый клиент</div>
          <button onClick={onClose} className="text-white/40 hover:text-white p-1"><Icon name="X" size={18} /></button>
        </div>
        <div className="p-4 space-y-2.5">
          <Field label="Фамилия *" v={form.last_name}    onChange={v => setForm(p => ({ ...p, last_name: v }))} />
          <Field label="Имя *"      v={form.first_name}   onChange={v => setForm(p => ({ ...p, first_name: v }))} />
          <Field label="Отчество"   v={form.middle_name}  onChange={v => setForm(p => ({ ...p, middle_name: v }))} />
          <Field label="Телефон *"  v={form.phone}        onChange={v => setForm(p => ({ ...p, phone: v }))} type="tel" placeholder="+7 ..." />
          <Field label="Дата рождения (ДД.ММ.ГГГГ)" v={form.birthday} onChange={v => setForm(p => ({ ...p, birthday: v }))} placeholder="01.01.1990" />
          <div className="border-t border-[#1F1F1F] pt-2 mt-2 font-roboto text-white/40 text-[10px] uppercase tracking-wide">Паспорт</div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Серия" v={form.passport_series} onChange={v => setForm(p => ({ ...p, passport_series: v }))} />
            <Field label="Номер" v={form.passport_number} onChange={v => setForm(p => ({ ...p, passport_number: v }))} />
          </div>
          <Field label="Кем выдан"      v={form.passport_issued_by}   onChange={v => setForm(p => ({ ...p, passport_issued_by: v }))} />
          <Field label="Дата выдачи"    v={form.passport_issued_date} onChange={v => setForm(p => ({ ...p, passport_issued_date: v }))} placeholder="01.01.2020" />
          <Field label="Адрес" v={form.address} onChange={v => setForm(p => ({ ...p, address: v }))} />

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded p-2 text-red-300 font-roboto text-[11px] flex items-start gap-1.5">
              <Icon name="AlertCircle" size={12} className="mt-0.5 shrink-0" />
              <span className="break-words">{error}</span>
            </div>
          )}
          <button onClick={submit} disabled={saving}
            className="w-full bg-gradient-to-b from-[#FFD700] to-yellow-500 text-black font-oswald font-bold py-3 uppercase text-xs rounded-md shadow-md shadow-[#FFD700]/20 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5">
            {saving ? <Icon name="Loader" size={13} className="animate-spin" /> : <Icon name="Check" size={13} />}
            Создать клиента в SmartLombard
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, v, onChange, type, placeholder }: { label: string; v: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <label className="block">
      <span className="font-roboto text-white/40 text-[10px] uppercase tracking-wide">{label}</span>
      <input type={type || "text"} value={v} placeholder={placeholder} onChange={e => onChange(e.target.value)}
        className="w-full bg-[#0A0A0A] border border-[#1F1F1F] text-white px-3 py-2 font-roboto text-sm rounded-md focus:outline-none focus:border-[#FFD700]/50 placeholder:text-white/25 mt-1" />
    </label>
  );
}

export default SLClients;
