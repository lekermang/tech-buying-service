import { useEffect, useState, useCallback, useMemo } from "react";
import Icon from "@/components/ui/icon";
import { slApi, type SLDocTemplate, type SLRequisite, OP_TYPE_LABELS } from "./types";

const FORMAT_LABEL: Record<string, string> = {
  a4: "A4",
  a5: "A5 (½ листа)",
  thermal: "Термопринтер 80мм",
};

export default function SLDocuments({ token, isOwner }: { token: string; isOwner: boolean }) {
  const [tab, setTab] = useState<"templates" | "requisites">("templates");
  return (
    <div>
      <div className="flex gap-1.5 mb-3">
        <button onClick={() => setTab("templates")}
          className={`flex-1 py-2 rounded-lg text-sm font-bold ${tab === "templates" ? "bg-[#FFD700] text-black" : "bg-[#141414] border border-[#1F1F1F] text-white/60"}`}>
          <Icon name="FileText" size={13} className="inline mr-1" />Шаблоны
        </button>
        <button onClick={() => setTab("requisites")}
          className={`flex-1 py-2 rounded-lg text-sm font-bold ${tab === "requisites" ? "bg-[#FFD700] text-black" : "bg-[#141414] border border-[#1F1F1F] text-white/60"}`}>
          <Icon name="Building2" size={13} className="inline mr-1" />Реквизиты
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

  return (
    <div>
      <div className="bg-[#0F0F0F] border border-[#1F1F1F] rounded-xl p-3 mb-3">
        <div className="text-[11px] text-white/50 mb-1">Тип операции</div>
        <div className="flex gap-1 flex-wrap">
          <button onClick={() => setFilter("")}
            className={`text-[10px] px-2.5 py-1 rounded-full ${filter === "" ? "bg-[#FFD700] text-black font-bold" : "bg-[#141414] border border-[#1F1F1F] text-white/60"}`}>
            Все
          </button>
          {allOpTypes.map(o => (
            <button key={o} onClick={() => setFilter(o)}
              className={`text-[10px] px-2.5 py-1 rounded-full ${filter === o ? "bg-[#FFD700] text-black font-bold" : "bg-[#141414] border border-[#1F1F1F] text-white/60"}`}>
              {OP_TYPE_LABELS[o] || o}
            </button>
          ))}
        </div>
        <div className="text-[11px] text-white/50 mt-2 mb-1">Статус</div>
        <div className="flex gap-1">
          {[
            { v: "all", l: "Все шаблоны" },
            { v: "active", l: "Только активные" },
            { v: "inactive", l: "Только не активные" },
          ].map(o => (
            <button key={o.v} onClick={() => setStatusFilter(o.v as typeof statusFilter)}
              className={`text-[10px] px-2.5 py-1 rounded-full ${statusFilter === o.v ? "bg-[#FFD700] text-black font-bold" : "bg-[#141414] border border-[#1F1F1F] text-white/60"}`}>
              {o.l}
            </button>
          ))}
        </div>
      </div>

      {loading && <div className="text-white/30 text-sm py-4 text-center">Загрузка...</div>}
      <div className="text-[10px] text-white/40 mb-2 px-1">
        Шаблоны можно включать/выключать. Включённые шаблоны автоматически появляются в кнопке «Документы» в карточках операций.
        {!isOwner && " Менять состояние шаблона может только владелец."}
      </div>

      <div className="space-y-1.5">
        {filtered.map(t => (
          <div key={t.id} className="bg-[#0F0F0F] border border-[#1F1F1F] rounded-lg p-3 flex items-start gap-2">
            <button onClick={() => toggle(t.id)} disabled={!isOwner}
              className={`w-9 h-5 rounded-full relative transition-colors mt-0.5 shrink-0 ${t.is_active ? "bg-[#FFD700]" : "bg-[#1F1F1F]"} disabled:opacity-50`}>
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${t.is_active ? "left-4" : "left-0.5"}`} />
            </button>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm">{t.name}</div>
              {t.description && <div className="text-[11px] text-white/50">{t.description}</div>}
              <div className="flex gap-1 flex-wrap mt-1.5">
                {(t.op_types || []).map(o => (
                  <span key={o} className="text-[9px] bg-[#141414] border border-[#1F1F1F] text-white/50 px-1.5 py-0.5 rounded">
                    {OP_TYPE_LABELS[o] || o}
                  </span>
                ))}
                <span className="text-[9px] bg-blue-500/15 text-blue-300 border border-blue-500/30 px-1.5 py-0.5 rounded">
                  {FORMAT_LABEL[t.print_format] || t.print_format}
                </span>
                {t.copies > 1 && (
                  <span className="text-[9px] bg-purple-500/15 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 rounded">
                    {t.copies} экз.
                  </span>
                )}
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
          <button onClick={() => setEditing(null)}><Icon name="ArrowLeft" size={16} /></button>
          <div className="font-bold">{editing.id ? "Реквизиты" : "Новые реквизиты"}</div>
        </div>
        <div className="bg-[#0F0F0F] border border-[#1F1F1F] rounded-xl p-3 space-y-2">
          <F l="Полное наименование *" v={editing.legal_name || ""} s={v => setEditing({ ...editing, legal_name: v })} />
          <F l="Краткое наименование" v={editing.short_name || ""} s={v => setEditing({ ...editing, short_name: v })} />
          <div className="grid grid-cols-2 gap-2">
            <F l="ИНН" v={editing.inn || ""} s={v => setEditing({ ...editing, inn: v })} />
            <F l="ОГРН/ОГРНИП" v={editing.ogrn || ""} s={v => setEditing({ ...editing, ogrn: v })} />
          </div>
          <F l="Юридический адрес" v={editing.legal_address || ""} s={v => setEditing({ ...editing, legal_address: v })} />
          <F l="Фактический адрес" v={editing.actual_address || ""} s={v => setEditing({ ...editing, actual_address: v })} />
          <div className="grid grid-cols-2 gap-2">
            <F l="Телефон" v={editing.phone || ""} s={v => setEditing({ ...editing, phone: v })} />
            <F l="Email" v={editing.email || ""} s={v => setEditing({ ...editing, email: v })} />
          </div>
          <F l="Банк" v={editing.bank_name || ""} s={v => setEditing({ ...editing, bank_name: v })} />
          <div className="grid grid-cols-3 gap-2">
            <F l="БИК" v={editing.bank_bic || ""} s={v => setEditing({ ...editing, bank_bic: v })} />
            <F l="Р/с" v={editing.bank_account || ""} s={v => setEditing({ ...editing, bank_account: v })} />
            <F l="К/с" v={editing.corr_account || ""} s={v => setEditing({ ...editing, corr_account: v })} />
          </div>
          <F l="Должность подписанта" v={editing.director_position || ""} s={v => setEditing({ ...editing, director_position: v })} />
          <F l="ФИО подписанта" v={editing.director_name || ""} s={v => setEditing({ ...editing, director_name: v })} />
          <F l="Гарантия (дней)" v={String(editing.warranty_days || 365)} s={v => setEditing({ ...editing, warranty_days: Number(v) || 365 })} />
        </div>
        <button onClick={save} disabled={!isOwner}
          className="w-full bg-[#FFD700] text-black font-bold py-2.5 rounded-lg disabled:opacity-50">
          {isOwner ? "Сохранить" : "Только владелец"}
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="text-[10px] text-white/40 mb-2 px-1">
        Эти реквизиты автоматически подставляются в договоры, чеки и кассовые ордера. По филиалу — свой набор.
      </div>
      {loading && <div className="text-white/30 text-sm py-4 text-center">Загрузка...</div>}
      <div className="space-y-2">
        {list.map(r => (
          <button key={r.id} onClick={() => setEditing(r)}
            className="w-full text-left bg-[#0F0F0F] border border-[#1F1F1F] rounded-lg p-3 hover:border-[#FFD700]/30">
            <div className="flex items-center gap-2">
              <div className="font-bold text-sm flex-1">{r.legal_name}</div>
              {r.is_default && <span className="text-[10px] bg-[#FFD700]/15 text-[#FFD700] border border-[#FFD700]/30 px-1.5 py-0.5 rounded">по умолч.</span>}
            </div>
            <div className="text-[11px] text-white/50 mt-1">
              {r.branch_name && <><Icon name="MapPin" size={9} className="inline" /> {r.branch_name} • </>}
              {r.actual_address}
            </div>
            <div className="text-[10px] text-white/40 mt-1">
              {r.inn && <>ИНН {r.inn} • </>}
              Гарантия {r.warranty_days} дн.
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function F({ l, v, s }: { l: string; v: string; s: (x: string) => void }) {
  return (
    <div>
      <div className="text-[11px] text-white/50 mb-0.5">{l}</div>
      <input value={v} onChange={e => s(e.target.value)}
        className="w-full bg-[#0A0A0A] border border-[#1F1F1F] rounded px-3 py-2 text-sm" />
    </div>
  );
}
