import { useEffect, useState, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { slApi, fmt, type SLDiscountRule, type SLCategory } from "./types";
import CategoryTreeSelect from "./CategoryTreeSelect";
import { SLSection, SLField, SLInput, SLButton, SLCheckbox, SLGrid, SLPill } from "./slUI";

const ROUNDING_OPTIONS = [
  { v: "one_decimal", l: "1 знак" },
  { v: "integer", l: "До ₽" },
  { v: "tens", l: "10 ₽" },
  { v: "fifty", l: "50 ₽" },
  { v: "hundred", l: "100 ₽" },
];

export default function SLDiscount({ token }: { token: string }) {
  const [rules, setRules] = useState<SLDiscountRule[]>([]);
  const [cats, setCats] = useState<SLCategory[]>([]);
  const [editing, setEditing] = useState<Partial<SLDiscountRule> | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [r1, r2] = await Promise.all([
      slApi<SLDiscountRule[]>(token, "discount_rules"),
      slApi<SLCategory[]>(token, "categories"),
    ]);
    if (r1.ok && r1.data) setRules(r1.data);
    if (r2.ok && r2.data) setCats(r2.data);
    setLoading(false);
  }, [token]);
  useEffect(() => { load(); }, [load]);

  const startNew = () => setEditing({
    name: "", apply_to_all: false, period_days: 30, percent: 5,
    use_market_price: false, use_duplicates_dependency: false,
    rounding: "one_decimal", is_active: true,
  });

  const save = async () => {
    if (!editing) return;
    if (!editing.name?.trim()) { setMsg("Введите название"); return; }
    const r = await slApi(token, "discount_rule_save", { method: "POST", body: editing });
    if (r.ok) { setEditing(null); setMsg("Сохранено"); load(); }
    else setMsg(r.error || "Ошибка");
  };

  const toggle = async (id: number) => {
    await slApi(token, "discount_rule_toggle", { method: "POST", body: { id } });
    load();
  };

  const apply = async (id: number) => {
    setMsg(null);
    const r = await slApi<{ applied: number }>(token, "discount_rule_apply", { method: "POST", body: { id } });
    if (r.ok) setMsg(`Применено к ${r.data?.applied ?? 0} товарам`);
    else setMsg(r.error || "Ошибка");
  };

  if (editing) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <button onClick={() => setEditing(null)} className="text-white/60 hover:text-white inline-flex items-center gap-1 text-[12px] font-semibold">
            <Icon name="ChevronLeft" size={14} /> Назад
          </button>
          <div className="font-oswald uppercase font-bold text-[13px] tracking-wide">{editing.id ? "Правило уценки" : "Новое правило"}</div>
        </div>

        <SLSection icon="Settings" title="Основное">
          <div className="space-y-1.5">
            <SLField label="Название" required>
              <SLInput value={editing.name || ""} onChange={e => setEditing({ ...editing, name: e.target.value })} placeholder="Например: Уценка ювелирки" />
            </SLField>
            <SLCheckbox checked={!!editing.apply_to_all} onChange={v => setEditing({ ...editing, apply_to_all: v })} label="Все категории" />
            {!editing.apply_to_all && (
              <SLField label="Категория">
                <CategoryTreeSelect categories={cats} value={editing.category_id ?? ""} onChange={(id) => setEditing({ ...editing, category_id: id || null })} />
              </SLField>
            )}
            <SLGrid cols={2}>
              <SLField label="Период, дней">
                <SLInput type="number" value={String(editing.period_days || 30)} onChange={e => setEditing({ ...editing, period_days: Number(e.target.value) || 30 })} />
              </SLField>
              <SLField label="Процент уценки %">
                <SLInput type="number" value={String(editing.percent || 5)} onChange={e => setEditing({ ...editing, percent: Number(e.target.value) || 5 })} />
              </SLField>
            </SLGrid>
            <SLGrid cols={2}>
              <SLField label="Мин. цена ₽" hint="Не уценивать ниже">
                <SLInput type="number" value={String(editing.min_price || "")} onChange={e => setEditing({ ...editing, min_price: e.target.value ? Number(e.target.value) : null })} />
              </SLField>
              <SLField label="Макс. уценка %" hint="От исходной цены">
                <SLInput type="number" value={String(editing.max_discount_percent || "")} onChange={e => setEditing({ ...editing, max_discount_percent: e.target.value ? Number(e.target.value) : null })} placeholder="50" />
              </SLField>
            </SLGrid>
          </div>
        </SLSection>

        <SLSection icon="CircleDollarSign" title="Округление">
          <div className="flex gap-1 flex-wrap">
            {ROUNDING_OPTIONS.map(o => (
              <button key={o.v} type="button" onClick={() => setEditing({ ...editing, rounding: o.v })}
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border transition ${editing.rounding === o.v ? "bg-[#FFD700] text-black border-[#FFD700]" : "bg-[#0A0A0A] text-white/55 border-[#1A1A1A] hover:border-[#FFD700]/40"}`}>
                {o.l}
              </button>
            ))}
          </div>
        </SLSection>

        <SLSection icon="GitBranch" title="Зависимости">
          <div className="space-y-1.5">
            <SLCheckbox checked={!!editing.use_market_price} onChange={v => setEditing({ ...editing, use_market_price: v })} label="От средней рыночной цены" />
            <SLCheckbox checked={!!editing.use_duplicates_dependency} onChange={v => setEditing({ ...editing, use_duplicates_dependency: v })} label="От количества одинаковых моделей" />
            <SLCheckbox checked={!!editing.is_active} onChange={v => setEditing({ ...editing, is_active: v })} label="Активно" />
          </div>
        </SLSection>

        {msg && <div className="rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-2.5 py-1.5 text-[12px]">{msg}</div>}

        <div className="flex gap-2 sticky bottom-0 bg-gradient-to-t from-[#0D0D0D] via-[#0D0D0D]/95 to-transparent pt-2 pb-1 -mx-1 px-1 z-10">
          <SLButton variant="dark" size="lg" onClick={() => setEditing(null)} className="flex-1">Отмена</SLButton>
          <SLButton variant="gold" size="lg" icon="Save" onClick={save} className="flex-1">Сохранить</SLButton>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[10px] uppercase tracking-[0.08em] font-bold text-white/45">Правила уценки</div>
        <SLButton variant="gold" size="sm" icon="Plus" onClick={startNew}>Новое правило</SLButton>
      </div>

      {msg && <div className="rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-2.5 py-1.5 text-[12px]">{msg}</div>}
      {loading && <div className="text-white/30 text-[12px] py-3 text-center"><Icon name="Loader2" size={14} className="animate-spin inline" /></div>}

      {!loading && rules.length === 0 && (
        <div className="text-white/35 text-[12px] py-8 text-center">
          <Icon name="TrendingDown" size={26} className="mx-auto mb-1.5 opacity-40" />
          <div>Правил уценки пока нет.</div>
          <div className="text-[10px] mt-0.5">Создайте первое — система будет авто-снижать цены товаров.</div>
        </div>
      )}

      <div className="space-y-1">
        {rules.map(r => (
          <div key={r.id} className="bg-[#101010] border border-[#1A1A1A] rounded-lg px-2.5 py-2">
            <div className="flex items-start gap-2">
              <button onClick={() => toggle(r.id)}
                className={`w-8 h-4 rounded-full relative transition-colors mt-0.5 shrink-0 ${r.is_active ? "bg-[#FFD700]" : "bg-[#1A1A1A]"}`}>
                <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${r.is_active ? "left-4" : "left-0.5"}`} />
              </button>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-[12px] leading-tight">{r.name}</div>
                <div className="text-[10px] text-white/50 leading-tight mt-0.5">
                  {r.apply_to_all ? "Все категории" : (r.category_name || "—")} · каждые {r.period_days} дн. на {r.percent}%
                </div>
                {r.min_price ? <SLPill color="white">Не ниже {fmt(r.min_price)} ₽</SLPill> : null}
              </div>
              <div className="flex gap-1 shrink-0">
                <SLButton variant="success" size="sm" icon="Play" onClick={() => apply(r.id)}>Применить</SLButton>
                <SLButton variant="dark" size="sm" icon="Pencil" onClick={() => setEditing(r)} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
