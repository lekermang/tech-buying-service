import { useEffect, useState, useCallback, useMemo } from "react";
import Icon from "@/components/ui/icon";
import { slApi, type SLDocTemplate, type SLRequisite, OP_TYPE_LABELS } from "./types";
import { SLSection, SLField, SLInput, SLButton, SLPill, SLGrid } from "./slUI";

const FORMAT_LABEL: Record<string, string> = {
  a4: "A4",
  a5: "A5 (½ листа)",
  thermal: "Термопринтер 80мм",
};

export default function SLDocuments({ token, isOwner }: { token: string; isOwner: boolean }) {
  const [tab, setTab] = useState<"templates" | "requisites">("templates");
  return (
    <div>
      <div className="flex gap-1 mb-2">
        <button onClick={() => setTab("templates")}
          className={`flex-1 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wide transition active:scale-[0.97] ${tab === "templates" ? "bg-[#FFD700] text-black shadow-[0_2px_8px_rgba(255,215,0,0.25)]" : "bg-[#101010] border border-[#1A1A1A] text-white/55"}`}>
          <Icon name="FileText" size={11} className="inline mr-1" />Шаблоны
        </button>
        <button onClick={() => setTab("requisites")}
          className={`flex-1 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wide transition active:scale-[0.97] ${tab === "requisites" ? "bg-[#FFD700] text-black shadow-[0_2px_8px_rgba(255,215,0,0.25)]" : "bg-[#101010] border border-[#1A1A1A] text-white/55"}`}>
          <Icon name="Building2" size={11} className="inline mr-1" />Реквизиты
        </button>
      </div>
      {tab === "templates" ? <Templates token={token} isOwner={isOwner} /> : <Requisites token={token} isOwner={isOwner} />}
    </div>
  );
}

function Templates({ token, isOwner }: { token: string; isOwner: boolean }) {
  const [list, setList] = useState<SLDocTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const load = useCallback(async () => {
    setLoading(true);
    const r = await slApi<SLDocTemplate[]>(token, "doc_templates");
    if (r.ok && r.data) setList(r.data);
    setLoading(false);
  }, [token]);
  useEffect(() => { load(); }, [load]);

  const allOpTypes = useMemo(() => {
    const s = new Set<string>();
    list.forEach(t => t.op_types?.forEach(o => s.add(o)));
    return Array.from(s);
  }, [list]);

  const filtered = list.filter(t => {
    if (statusFilter === "active" && !t.is_active) return false;
    if (statusFilter === "inactive" && t.is_active) return false;
    if (filter && !(t.op_types || []).includes(filter)) return false;
    return true;
  });

  const toggle = async (id: number) => {
    if (!isOwner) { alert("Только владелец"); return; }
    const r = await slApi(token, "doc_template_toggle", { method: "POST", body: { id } });
    if (r.ok) load();
  };

  const pillCls = (active: boolean) =>
    `text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wide font-bold transition ${active ? "bg-[#FFD700] text-black" : "bg-[#0A0A0A] border border-[#1A1A1A] text-white/55 hover:border-[#FFD700]/30"}`;

  return (
    <div className="space-y-2">
      <div className="rounded-xl bg-[#101010] border border-[#1A1A1A] p-2 space-y-1.5">
        <div>
          <div className="text-[9px] uppercase tracking-[0.08em] text-white/45 font-bold mb-1">Тип операции</div>
          <div className="flex gap-1 flex-wrap">
            <button onClick={() => setFilter("")} className={pillCls(filter === "")}>Все</button>
            {allOpTypes.map(o => (
              <button key={o} onClick={() => setFilter(o)} className={pillCls(filter === o)}>
                {OP_TYPE_LABELS[o] || o}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="text-[9px] uppercase tracking-[0.08em] text-white/45 font-bold mb-1">Статус</div>
          <div className="flex gap-1">
            {[
              { v: "all", l: "Все" },
              { v: "active", l: "Активные" },
              { v: "inactive", l: "Не активные" },
            ].map(o => (
              <button key={o.v} onClick={() => setStatusFilter(o.v as typeof statusFilter)} className={pillCls(statusFilter === o.v)}>
                {o.l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading && <div className="text-white/30 text-[12px] py-3 text-center"><Icon name="Loader2" size={14} className="animate-spin inline" /></div>}
      <div className="text-[10px] text-white/35 px-1 leading-snug">
        Шаблоны можно включать/выключать. Включённые автоматически появляются в кнопке «Документы».
        {!isOwner && " Менять может только владелец."}
      </div>

      <div className="space-y-1">
        {filtered.map(t => (
          <div key={t.id} className="bg-[#101010] border border-[#1A1A1A] rounded-lg px-2.5 py-2 flex items-start gap-2">
            <button onClick={() => toggle(t.id)} disabled={!isOwner}
              className={`w-8 h-4 rounded-full relative transition-colors mt-0.5 shrink-0 ${t.is_active ? "bg-[#FFD700]" : "bg-[#1A1A1A]"} disabled:opacity-50`}>
              <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${t.is_active ? "left-4" : "left-0.5"}`} />
            </button>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-[12px] leading-tight">{t.name}</div>
              {t.description && <div className="text-[10px] text-white/45 leading-tight mt-0.5">{t.description}</div>}
              <div className="flex gap-1 flex-wrap mt-1">
                {(t.op_types || []).map(o => (
                  <span key={o} className="text-[9px] bg-[#0A0A0A] border border-[#1A1A1A] text-white/55 px-1.5 py-0.5 rounded">{OP_TYPE_LABELS[o] || o}</span>
                ))}
                <SLPill color="blue">{FORMAT_LABEL[t.print_format] || t.print_format}</SLPill>
                {t.copies > 1 && <SLPill color="orange">{t.copies} экз.</SLPill>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Requisites({ token, isOwner }: { token: string; isOwner: boolean }) {
  const [list, setList] = useState<SLRequisite[]>([]);
  const [editing, setEditing] = useState<Partial<SLRequisite> | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await slApi<SLRequisite[]>(token, "requisites");
    if (r.ok && r.data) setList(r.data);
    setLoading(false);
  }, [token]);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!editing) return;
    const r = await slApi(token, "requisite_save", { method: "POST", body: editing });
    if (r.ok) { setEditing(null); load(); }
    else alert(r.error || "Ошибка");
  };

  if (editing) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <button onClick={() => setEditing(null)} className="text-white/60 hover:text-white inline-flex items-center gap-1 text-[12px] font-semibold">
            <Icon name="ChevronLeft" size={14} /> Назад
          </button>
          <div className="font-oswald uppercase font-bold text-[13px] tracking-wide">{editing.id ? "Реквизиты" : "Новые реквизиты"}</div>
        </div>

        <SLSection icon="Building2" title="Организация">
          <div className="space-y-1.5">
            <SLField label="Полное наименование" required>
              <SLInput value={editing.legal_name || ""} onChange={e => setEditing({ ...editing, legal_name: e.target.value })} />
            </SLField>
            <SLField label="Краткое наименование">
              <SLInput value={editing.short_name || ""} onChange={e => setEditing({ ...editing, short_name: e.target.value })} />
            </SLField>
            <SLGrid cols={2}>
              <SLField label="ИНН"><SLInput value={editing.inn || ""} onChange={e => setEditing({ ...editing, inn: e.target.value })} /></SLField>
              <SLField label="ОГРН/ОГРНИП"><SLInput value={editing.ogrn || ""} onChange={e => setEditing({ ...editing, ogrn: e.target.value })} /></SLField>
            </SLGrid>
          </div>
        </SLSection>

        <SLSection icon="MapPin" title="Адреса и контакты">
          <div className="space-y-1.5">
            <SLField label="Юридический адрес"><SLInput value={editing.legal_address || ""} onChange={e => setEditing({ ...editing, legal_address: e.target.value })} /></SLField>
            <SLField label="Фактический адрес"><SLInput value={editing.actual_address || ""} onChange={e => setEditing({ ...editing, actual_address: e.target.value })} /></SLField>
            <SLGrid cols={2}>
              <SLField label="Телефон"><SLInput type="tel" value={editing.phone || ""} onChange={e => setEditing({ ...editing, phone: e.target.value })} /></SLField>
              <SLField label="Email"><SLInput type="email" value={editing.email || ""} onChange={e => setEditing({ ...editing, email: e.target.value })} /></SLField>
            </SLGrid>
          </div>
        </SLSection>

        <SLSection icon="Landmark" title="Банковские реквизиты">
          <div className="space-y-1.5">
            <SLField label="Банк"><SLInput value={editing.bank_name || ""} onChange={e => setEditing({ ...editing, bank_name: e.target.value })} /></SLField>
            <SLGrid cols={3}>
              <SLField label="БИК"><SLInput value={editing.bank_bic || ""} onChange={e => setEditing({ ...editing, bank_bic: e.target.value })} /></SLField>
              <SLField label="Р/с"><SLInput value={editing.bank_account || ""} onChange={e => setEditing({ ...editing, bank_account: e.target.value })} /></SLField>
              <SLField label="К/с"><SLInput value={editing.corr_account || ""} onChange={e => setEditing({ ...editing, corr_account: e.target.value })} /></SLField>
            </SLGrid>
          </div>
        </SLSection>

        <SLSection icon="UserCheck" title="Подписант">
          <SLGrid cols={2}>
            <SLField label="Должность"><SLInput value={editing.director_position || ""} onChange={e => setEditing({ ...editing, director_position: e.target.value })} /></SLField>
            <SLField label="ФИО"><SLInput value={editing.director_name || ""} onChange={e => setEditing({ ...editing, director_name: e.target.value })} /></SLField>
          </SLGrid>
          <div className="mt-1.5">
            <SLField label="Гарантия (дней)" hint="По умолчанию 365">
              <SLInput type="number" value={String(editing.warranty_days || 365)} onChange={e => setEditing({ ...editing, warranty_days: Number(e.target.value) || 365 })} />
            </SLField>
          </div>
        </SLSection>

        <SLButton variant="gold" size="lg" icon={isOwner ? "Save" : "Lock"} onClick={save} disabled={!isOwner} className="w-full">
          {isOwner ? "Сохранить" : "Только владелец"}
        </SLButton>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="text-[10px] text-white/35 px-1 leading-snug">
        Реквизиты автоматически подставляются в договоры, чеки и кассовые ордера.
      </div>
      {loading && <div className="text-white/30 text-[12px] py-3 text-center"><Icon name="Loader2" size={14} className="animate-spin inline" /></div>}
      <div className="space-y-1">
        {list.map(r => (
          <button key={r.id} onClick={() => setEditing(r)}
            className="w-full text-left bg-[#101010] border border-[#1A1A1A] rounded-lg px-2.5 py-2 hover:border-[#FFD700]/30 hover:bg-[#131313] transition active:scale-[0.99]">
            <div className="flex items-center gap-2">
              <div className="font-bold text-[12px] flex-1 truncate leading-tight">{r.legal_name}</div>
              {r.is_default && <SLPill color="gold">по умолч.</SLPill>}
            </div>
            <div className="text-[10px] text-white/45 mt-0.5 leading-tight truncate">
              {r.branch_name && <><Icon name="MapPin" size={9} className="inline" /> {r.branch_name} · </>}
              {r.actual_address}
            </div>
            <div className="text-[10px] text-white/35 mt-0.5">
              {r.inn && <>ИНН {r.inn} · </>}Гарантия {r.warranty_days} дн.
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
