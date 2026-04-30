import { useEffect, useState, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { slApi, type SLClient } from "./types";

export default function SLClientsList({ token }: { token: string }) {
  const [list, setList] = useState<SLClient[]>([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<SLClient | null>(null);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await slApi<SLClient[]>(token, "clients", { params: { q } });
    if (r.ok && r.data) setList(r.data);
    setLoading(false);
  }, [token, q]);
  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Поиск ФИО / телефон"
            className="w-full bg-[#0F0F0F] border border-[#1F1F1F] rounded-lg pl-9 pr-3 py-2 text-sm" />
        </div>
        <button onClick={() => setCreating(true)}
          className="bg-[#FFD700] text-black font-bold px-3 rounded-lg flex items-center gap-1 text-sm">
          <Icon name="Plus" size={14} />Новый
        </button>
      </div>

      {loading && <div className="text-white/30 text-sm py-4 text-center">Загрузка...</div>}
      {!loading && list.length === 0 && <div className="text-white/30 text-sm py-8 text-center">Клиентов нет</div>}

      <div className="space-y-1.5">
        {list.map(c => (
          <button key={c.id} onClick={() => setOpen(c)}
            className="w-full text-left bg-[#0F0F0F] border border-[#1F1F1F] rounded-lg p-2.5 hover:border-[#FFD700]/30">
            <div className="font-bold text-sm">{c.full_name}</div>
            <div className="text-[11px] text-white/50 flex flex-wrap gap-x-3">
              {c.phone && <span><Icon name="Phone" size={10} className="inline mr-1" />{c.phone}</span>}
              {c.passport_series && <span>пасп. {c.passport_series} {c.passport_number}</span>}
            </div>
          </button>
        ))}
      </div>

      {(open || creating) && (
        <ClientForm token={token} client={open} onClose={() => { setOpen(null); setCreating(false); }} onSaved={() => { setOpen(null); setCreating(false); load(); }} />
      )}
    </div>
  );
}

function ClientForm({ token, client, onClose, onSaved }: { token: string; client: SLClient | null; onClose: () => void; onSaved: () => void }) {
  const [d, setD] = useState<Partial<SLClient>>(client || {});
  const [saving, setSaving] = useState(false);
  const save = async () => {
    if (!d.full_name?.trim()) return;
    setSaving(true);
    const r = await slApi(token, "client_save", { method: "POST", body: { ...d, id: client?.id } });
    setSaving(false);
    if (r.ok) onSaved();
  };
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center p-2" onClick={onClose}>
      <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-[#0A0A0A] border-b border-[#1F1F1F] p-3 flex items-center justify-between">
          <div className="font-bold">{client ? "Редактировать" : "Новый клиент"}</div>
          <button onClick={onClose}><Icon name="X" size={16} /></button>
        </div>
        <div className="p-3 space-y-2">
          <F l="ФИО *" v={d.full_name || ""} s={v => setD({ ...d, full_name: v })} />
          <F l="Телефон" v={d.phone || ""} s={v => setD({ ...d, phone: v })} />
          <div className="grid grid-cols-2 gap-2">
            <F l="Серия паспорта" v={d.passport_series || ""} s={v => setD({ ...d, passport_series: v })} />
            <F l="Номер" v={d.passport_number || ""} s={v => setD({ ...d, passport_number: v })} />
          </div>
          <F l="Кем выдан" v={d.passport_issued_by || ""} s={v => setD({ ...d, passport_issued_by: v })} />
          <F l="Дата выдачи" v={d.passport_issued_date || ""} s={v => setD({ ...d, passport_issued_date: v })} type="date" />
          <F l="Адрес" v={d.address || ""} s={v => setD({ ...d, address: v })} />
          <F l="Дата рождения" v={d.birth_date || ""} s={v => setD({ ...d, birth_date: v })} type="date" />
          <F l="Заметки" v={d.notes || ""} s={v => setD({ ...d, notes: v })} />
          <button onClick={save} disabled={saving || !d.full_name?.trim()}
            className="w-full bg-[#FFD700] text-black font-bold py-2.5 rounded-lg disabled:opacity-50">
            {saving ? "..." : "Сохранить"}
          </button>
        </div>
      </div>
    </div>
  );
}

function F({ l, v, s, type = "text" }: { l: string; v: string; s: (x: string) => void; type?: string }) {
  return (
    <div>
      <div className="text-[11px] text-white/50 mb-0.5">{l}</div>
      <input type={type} value={v} onChange={e => s(e.target.value)}
        className="w-full bg-[#141414] border border-[#1F1F1F] rounded px-2 py-1.5 text-sm" />
    </div>
  );
}
