import { useEffect, useState, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { slApi, type SLClient } from "./types";
import { SLField, SLInput, SLTextarea, SLButton, SLModal, SLGrid } from "./slUI";

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
      <div className="flex gap-1.5 mb-2">
        <div className="flex-1">
          <SLInput iconLeft="Search" value={q} onChange={e => setQ(e.target.value)} placeholder="Поиск ФИО / телефон" />
        </div>
        <SLButton variant="gold" size="md" icon="Plus" onClick={() => setCreating(true)}>Новый</SLButton>
      </div>

      {loading && <div className="text-white/30 text-[12px] py-3 text-center"><Icon name="Loader2" size={14} className="animate-spin inline" /></div>}
      {!loading && list.length === 0 && (
        <div className="text-white/30 text-[12px] py-6 text-center">
          <Icon name="Users" size={20} className="inline mb-1 opacity-50" />
          <div>Клиентов нет</div>
        </div>
      )}

      <div className="space-y-1">
        {list.map(c => (
          <button key={c.id} onClick={() => setOpen(c)}
            className="w-full text-left bg-[#101010] border border-[#1A1A1A] rounded-lg px-2.5 py-1.5 hover:border-[#FFD700]/30 hover:bg-[#131313] transition active:scale-[0.99]">
            <div className="font-bold text-[12px] text-white/90 leading-tight">{c.full_name}</div>
            <div className="text-[10px] text-white/45 flex flex-wrap gap-x-2 mt-0.5">
              {c.phone && <span><Icon name="Phone" size={9} className="inline mr-0.5" />{c.phone}</span>}
              {c.passport_series && <span><Icon name="IdCard" size={9} className="inline mr-0.5" />{c.passport_series} {c.passport_number}</span>}
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
    <SLModal
      open={true}
      onClose={onClose}
      title={client ? "Редактировать клиента" : "Новый клиент"}
      icon="UserPlus"
      footer={
        <SLButton variant="gold" size="md" icon={saving ? "Loader2" : "Check"} onClick={save} disabled={saving || !d.full_name?.trim()} className="w-full">
          {saving ? "Сохраняю…" : "Сохранить"}
        </SLButton>
      }
    >
      <div className="space-y-2">
        <SLField label="ФИО" required>
          <SLInput value={d.full_name || ""} onChange={e => setD({ ...d, full_name: e.target.value })} />
        </SLField>
        <SLField label="Телефон">
          <SLInput type="tel" value={d.phone || ""} onChange={e => setD({ ...d, phone: e.target.value })} placeholder="+7 (___) ___-__-__" />
        </SLField>
        <SLGrid cols={2}>
          <SLField label="Серия">
            <SLInput value={d.passport_series || ""} onChange={e => setD({ ...d, passport_series: e.target.value })} placeholder="0000" maxLength={5} />
          </SLField>
          <SLField label="Номер">
            <SLInput value={d.passport_number || ""} onChange={e => setD({ ...d, passport_number: e.target.value })} placeholder="000000" maxLength={7} />
          </SLField>
        </SLGrid>
        <SLField label="Кем выдан">
          <SLInput value={d.passport_issued_by || ""} onChange={e => setD({ ...d, passport_issued_by: e.target.value })} />
        </SLField>
        <SLGrid cols={2}>
          <SLField label="Дата выдачи">
            <SLInput type="date" value={d.passport_issued_date || ""} onChange={e => setD({ ...d, passport_issued_date: e.target.value })} />
          </SLField>
          <SLField label="Дата рождения">
            <SLInput type="date" value={d.birth_date || ""} onChange={e => setD({ ...d, birth_date: e.target.value })} />
          </SLField>
        </SLGrid>
        <SLField label="Адрес">
          <SLInput value={d.address || ""} onChange={e => setD({ ...d, address: e.target.value })} />
        </SLField>
        <SLField label="Заметки">
          <SLTextarea rows={2} value={d.notes || ""} onChange={e => setD({ ...d, notes: e.target.value })} />
        </SLField>
      </div>
    </SLModal>
  );
}
