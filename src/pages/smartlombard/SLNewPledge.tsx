import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { smartlombardCall } from "../staff.types";

type Branch = { id: number; name?: string; title?: string };
type Category = { id: number; name?: string; title?: string };
type Tariff = { id: number; name?: string; title?: string; period_days?: number; percent?: number };
type Metal = { id: number; name?: string };
type Probe = { id: number; name?: string; metal_id?: number };

type ClientLite = { id: number; full_name?: string; first_name?: string; last_name?: string; phone?: string };

function clientLabel(c: ClientLite) {
  return c.full_name || [c.last_name, c.first_name].filter(Boolean).join(" ").trim() || `#${c.id}`;
}

export function SLNewPledge({ token }: { token: string }) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Шаг 1 — клиент
  const [clientSearch, setClientSearch] = useState("");
  const [clientResults, setClientResults] = useState<ClientLite[]>([]);
  const [client, setClient] = useState<ClientLite | null>(null);
  const [searching, setSearching] = useState(false);

  // Шаг 2 — справочники
  const [branches, setBranches] = useState<Branch[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [metals, setMetals] = useState<Metal[]>([]);
  const [probes, setProbes] = useState<Probe[]>([]);

  const [branchId, setBranchId] = useState<number | "">("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [tariffId, setTariffId] = useState<number | "">("");
  const [metalId, setMetalId] = useState<number | "">("");
  const [probeId, setProbeId] = useState<number | "">("");

  // Шаг 3 — параметры имущества и сумма
  const [name, setName] = useState("");
  const [weight, setWeight] = useState("");
  const [pawnSum, setPawnSum] = useState("");

  // Шаг 4 — результат
  const [submitting, setSubmitting] = useState(false);
  const [resultId, setResultId] = useState<number | null>(null);
  const [error, setError] = useState("");

  // Подгрузка справочников при первом входе на шаг 2
  useEffect(() => {
    if (step !== 2) return;
    if (branches.length || categories.length) return;
    (async () => {
      const [b, c, t, m, p] = await Promise.all([
        smartlombardCall<{ branches?: Branch[] }>({ token, path: "/branches", params: { page: 1, limit: 50 } }),
        smartlombardCall<{ categories?: Category[] }>({ token, path: "/categories", params: { page: 1, limit: 100 } }),
        smartlombardCall<{ tariffs?: Tariff[] }>({ token, path: "/tariffs", params: { page: 1, limit: 50 } }),
        smartlombardCall<{ metals?: Metal[] }>({ token, path: "/metals", params: { page: 1, limit: 50 } }),
        smartlombardCall<{ probes?: Probe[] }>({ token, path: "/probes", params: { page: 1, limit: 50 } }),
      ]);
      if (b.ok) setBranches(b.data?.branches || []);
      if (c.ok) setCategories(c.data?.categories || []);
      if (t.ok) setTariffs(t.data?.tariffs || []);
      if (m.ok) setMetals(m.data?.metals || []);
      if (p.ok) setProbes(p.data?.probes || []);
    })();
  }, [step, token, branches.length, categories.length]);

  // Поиск клиента
  useEffect(() => {
    if (!clientSearch.trim() || step !== 1) return;
    const t = setTimeout(async () => {
      setSearching(true);
      const r = await smartlombardCall<{ clients?: ClientLite[] }>({
        token, path: "/clients", params: { search: clientSearch.trim(), page: 1, limit: 10 },
      });
      if (r.ok) setClientResults(r.data?.clients || []);
      setSearching(false);
    }, 350);
    return () => clearTimeout(t);
  }, [clientSearch, token, step]);

  const submit = async () => {
    if (!client || !branchId || !categoryId || !tariffId || !pawnSum) {
      setError("Заполните все обязательные поля"); return;
    }
    setSubmitting(true); setError("");
    const r = await smartlombardCall<{ id?: number; pawn_ticket_id?: number }>({
      token, path: "/pawn_tickets/operations", method: "POST",
      body: {
        client_id: client.id,
        branch_id: branchId,
        tariff_id: tariffId,
        pawn_sum: Number(pawnSum),
        pawn_goods: [{
          category_id: categoryId,
          name: name || "Имущество",
          weight: weight ? Number(weight) : undefined,
          metal_id: metalId || undefined,
          probe_id: probeId || undefined,
          pawn_sum: Number(pawnSum),
        }],
      },
    });
    setSubmitting(false);
    if (!r.ok) {
      setError(r.error || "Не удалось создать залог");
    } else {
      setResultId(r.data?.id || r.data?.pawn_ticket_id || 0);
      setStep(4);
    }
  };

  const reset = () => {
    setStep(1); setClient(null); setClientSearch(""); setClientResults([]);
    setBranchId(""); setCategoryId(""); setTariffId(""); setMetalId(""); setProbeId("");
    setName(""); setWeight(""); setPawnSum("");
    setResultId(null); setError("");
  };

  return (
    <div className="p-3 space-y-3">
      <Stepper step={step} />

      {step === 1 && (
        <div className="space-y-2.5">
          <div className="font-oswald font-bold text-white/80 text-sm uppercase">Шаг 1. Клиент</div>
          <div className="relative">
            <Icon name="Search" size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
            <input value={clientSearch} onChange={e => setClientSearch(e.target.value)}
              placeholder="ФИО, телефон, паспорт..."
              className="w-full bg-[#0A0A0A] border border-[#1F1F1F] text-white pl-9 pr-3 py-2.5 font-roboto text-sm rounded-md focus:outline-none focus:border-[#FFD700]/50 placeholder:text-white/25" />
          </div>
          {searching && <div className="text-white/30 font-roboto text-xs flex items-center gap-1.5"><Icon name="Loader" size={11} className="animate-spin" />Ищу...</div>}
          <div className="space-y-1">
            {clientResults.map(c => (
              <button key={c.id} onClick={() => { setClient(c); setStep(2); }}
                className="w-full text-left bg-[#141414] border border-[#1F1F1F] hover:border-[#FFD700]/40 rounded-md p-2.5 active:scale-[0.98] transition-all">
                <div className="font-oswald font-bold text-white text-sm uppercase">{clientLabel(c)}</div>
                <div className="font-roboto text-[10px] text-white/40 flex items-center gap-2">
                  {c.phone && <span><Icon name="Phone" size={9} className="inline mr-0.5" />{c.phone}</span>}
                  <span>#{c.id}</span>
                </div>
              </button>
            ))}
          </div>
          {clientSearch && !searching && clientResults.length === 0 && (
            <div className="text-white/30 font-roboto text-xs text-center py-3">Никто не найден. Перейди в «Клиенты» → Создать.</div>
          )}
        </div>
      )}

      {step === 2 && client && (
        <div className="space-y-2.5">
          <SelectedClient client={client} onChange={() => setStep(1)} />
          <div className="font-oswald font-bold text-white/80 text-sm uppercase">Шаг 2. Параметры</div>
          <Select label="Филиал *" value={branchId} options={branches.map(b => ({ v: b.id, l: b.name || b.title || `#${b.id}` }))} onChange={v => setBranchId(v)} />
          <Select label="Категория *" value={categoryId} options={categories.map(c => ({ v: c.id, l: c.name || c.title || `#${c.id}` }))} onChange={v => setCategoryId(v)} />
          <Select label="Тариф *" value={tariffId} options={tariffs.map(t => ({ v: t.id, l: t.name || t.title || `#${t.id}` }))} onChange={v => setTariffId(v)} />
          <button onClick={() => setStep(3)} disabled={!branchId || !categoryId || !tariffId}
            className="w-full bg-gradient-to-b from-[#FFD700] to-yellow-500 text-black font-oswald font-bold py-2.5 uppercase text-xs rounded-md disabled:opacity-50 active:scale-95">
            Далее
          </button>
        </div>
      )}

      {step === 3 && client && (
        <div className="space-y-2.5">
          <SelectedClient client={client} onChange={() => setStep(1)} />
          <div className="font-oswald font-bold text-white/80 text-sm uppercase">Шаг 3. Имущество и сумма</div>
          <Input label="Наименование" value={name} onChange={setName} placeholder="Кольцо золотое" />
          <div className="grid grid-cols-2 gap-2">
            <Select label="Металл" value={metalId} options={metals.map(m => ({ v: m.id, l: m.name || `#${m.id}` }))} onChange={v => setMetalId(v)} />
            <Select label="Проба" value={probeId} options={probes.filter(p => !metalId || p.metal_id === metalId).map(p => ({ v: p.id, l: p.name || `#${p.id}` }))} onChange={v => setProbeId(v)} />
          </div>
          <Input label="Вес (г)" value={weight} onChange={setWeight} type="number" placeholder="3.5" />
          <Input label="Сумма залога (₽) *" value={pawnSum} onChange={setPawnSum} type="number" placeholder="5000" />
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded p-2 text-red-300 font-roboto text-[11px] flex items-start gap-1.5">
              <Icon name="AlertCircle" size={12} className="mt-0.5 shrink-0" />
              <span className="break-words">{error}</span>
            </div>
          )}
          <button onClick={submit} disabled={submitting || !pawnSum}
            className="w-full bg-gradient-to-b from-[#FFD700] to-yellow-500 text-black font-oswald font-bold py-3 uppercase text-xs rounded-md shadow-md shadow-[#FFD700]/20 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5">
            {submitting ? <Icon name="Loader" size={13} className="animate-spin" /> : <Icon name="Check" size={13} />}
            Оформить залог
          </button>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-3 text-center py-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center">
            <Icon name="Check" size={32} className="text-green-400" />
          </div>
          <div className="font-oswald font-bold text-white text-lg uppercase">Залог оформлен</div>
          {resultId ? (
            <div className="font-roboto text-white/60 text-sm">№ операции: <span className="text-[#FFD700] font-bold">{resultId}</span></div>
          ) : (
            <div className="font-roboto text-white/40 text-xs">Запись создана в SmartLombard.</div>
          )}
          <button onClick={reset}
            className="bg-[#FFD700] text-black font-oswald font-bold px-5 py-2.5 uppercase text-xs rounded-md active:scale-95">
            Новый залог
          </button>
        </div>
      )}
    </div>
  );
}

function Stepper({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className={`flex-1 h-1 rounded-full ${i <= step ? "bg-[#FFD700]" : "bg-white/10"}`} />
      ))}
    </div>
  );
}

function SelectedClient({ client, onChange }: { client: ClientLite; onChange: () => void }) {
  return (
    <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-md px-3 py-2 flex items-center justify-between">
      <div className="min-w-0">
        <div className="font-oswald font-bold text-white text-sm uppercase truncate">{clientLabel(client)}</div>
        <div className="font-roboto text-[10px] text-white/40">#{client.id}{client.phone ? ` · ${client.phone}` : ""}</div>
      </div>
      <button onClick={onChange} className="text-white/40 hover:text-[#FFD700] font-roboto text-[10px] underline">сменить</button>
    </div>
  );
}

function Input({ label, value, onChange, type, placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <label className="block">
      <span className="font-roboto text-white/40 text-[10px] uppercase tracking-wide">{label}</span>
      <input type={type || "text"} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)}
        className="w-full bg-[#0A0A0A] border border-[#1F1F1F] text-white px-3 py-2 font-roboto text-sm rounded-md focus:outline-none focus:border-[#FFD700]/50 placeholder:text-white/25 mt-1" />
    </label>
  );
}

function Select({ label, value, options, onChange }: {
  label: string; value: number | "";
  options: { v: number; l: string }[];
  onChange: (v: number | "") => void;
}) {
  return (
    <label className="block">
      <span className="font-roboto text-white/40 text-[10px] uppercase tracking-wide">{label}</span>
      <select value={value} onChange={e => onChange(e.target.value ? Number(e.target.value) : "")}
        className="w-full bg-[#0A0A0A] border border-[#1F1F1F] text-white px-3 py-2 font-roboto text-sm rounded-md focus:outline-none focus:border-[#FFD700]/50 mt-1">
        <option value="">— выбрать —</option>
        {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </label>
  );
}

export default SLNewPledge;
