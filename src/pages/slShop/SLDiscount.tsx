import { useEffect, useState, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { slApi, fmt, type SLDiscountRule, type SLCategory } from "./types";
import CategoryTreeSelect from "./CategoryTreeSelect";

const ROUNDING_OPTIONS = [
  { v: "one_decimal", l: "До 1 знака" },
  { v: "integer", l: "До рубля" },
  { v: "tens", l: "До 10 ₽" },
  { v: "fifty", l: "До 50 ₽" },
  { v: "hundred", l: "До 100 ₽" },
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
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <button onClick={() => setEditing(null)} className="text-white/50 hover:text-white">
            <Icon name="ArrowLeft" size={16} />
          </button>
          <div className="font-bold">{editing.id ? "Правило уценки" : "Новое правило"}</div>
        </div>

        <Section title="Основное">
          <F l="Название *" v={editing.name || ""} s={v => setEditing({ ...editing, name: v })} ph="Например: Уценка ювелирки" />

          <Sw l="Все категории" v={!!editing.apply_to_all} s={v => setEditing({ ...editing, apply_to_all: v })} />

          {!editing.apply_to_all && (
            <div>
              <div className="text-[11px] text-white/50 mb-1">Категория</div>
              <CategoryTreeSelect categories={cats} value={editing.category_id ?? ""} onChange={(id) => setEditing({ ...editing, category_id: id || null })} />
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <F l="Период уценки, дней" v={String(editing.period_days || 30)} s={v => setEditing({ ...editing, period_days: Number(v) || 30 })} />
            <F l="Процент уценки, %" v={String(editing.percent || 5)} s={v => setEditing({ ...editing, percent: Number(v) || 5 })} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <F l="Минимальная цена ₽" v={String(editing.min_price || "")} s={v => setEditing({ ...editing, min_price: v ? Number(v) : null })} ph="Не уценивать ниже" />
            <F l="Макс. уценка от исходной %" v={String(editing.max_discount_percent || "")} s={v => setEditing({ ...editing, max_discount_percent: v ? Number(v) : null })} ph="Например 50" />
          </div>
        </Section>

        <Section title="Округление">
          <div className="flex gap-1 flex-wrap">
            {ROUNDING_OPTIONS.map(o => (
              <button key={o.v} onClick={() => setEditing({ ...editing, rounding: o.v })}
                className={`text-[11px] px-2.5 py-1 rounded-full transition-all ${
                  editing.rounding === o.v ? "bg-[#FFD700] text-black font-bold" : "bg-[#141414] border border-[#1F1F1F] text-white/60"
                }`}>{o.l}</button>
            ))}
          </div>
        </Section>

        <Section title="Зависимости">
          <Sw l="От средней рыночной цены" v={!!editing.use_market_price} s={v => setEditing({ ...editing, use_market_price: v })} />
          <Sw l="От количества одинаковых моделей" v={!!editing.use_duplicates_dependency} s={v => setEditing({ ...editing, use_duplicates_dependency: v })} />
          <Sw l="Активно" v={!!editing.is_active} s={v => setEditing({ ...editing, is_active: v })} />
        </Section>

        {msg && <div className="text-emerald-400 text-sm">{msg}</div>}

        <div className="flex gap-2 sticky bottom-0 bg-[#0A0A0A] py-2">
          <button onClick={() => setEditing(null)} className="flex-1 bg-[#141414] py-2.5 rounded-lg">Отмена</button>
          <button onClick={save} className="flex-1 bg-[#FFD700] text-black font-bold py-2.5 rounded-lg">Сохранить</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-[11px] uppercase tracking-wide text-white/50">Правила уценки</div>
        <button onClick={startNew} className="bg-[#FFD700] text-black font-bold px-3 py-1.5 rounded-lg text-sm flex items-center gap-1">
          <Icon name="Plus" size={13} />Новое правило
        </button>
      </div>

      {msg && <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-2.5 rounded-lg mb-3 text-sm">{msg}</div>}
      {loading && <div className="text-white/30 text-sm py-4 text-center">Загрузка...</div>}

      {!loading && rules.length === 0 && (
        <div className="text-white/30 text-sm py-12 text-center">
          <Icon name="TrendingDown" size={32} className="mx-auto mb-2 opacity-30" />
          Правил уценки пока нет. Создайте первое — система будет автоматически снижать цены товаров,
          которые долго лежат на складе.
        </div>
      )}

      <div className="space-y-2">
        {rules.map(r => (
          <div key={r.id} className="bg-[#0F0F0F] border border-[#1F1F1F] rounded-lg p-3">
            <div className="flex items-start gap-2">
              <button onClick={() => toggle(r.id)}
                className={`w-9 h-5 rounded-full relative transition-colors mt-0.5 shrink-0 ${r.is_active ? "bg-[#FFD700]" : "bg-[#1F1F1F]"}`}>
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${r.is_active ? "left-4" : "left-0.5"}`} />
              </button>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm">{r.name}</div>
                <div className="text-[11px] text-white/50">
                  {r.apply_to_all ? "Все категории" : (r.category_name || "—")} • каждые {r.period_days} дн. на {r.percent}%
                </div>
                {r.min_price && <div className="text-[10px] text-white/40">Не ниже {fmt(r.min_price)} ₽</div>}
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => apply(r.id)} title="Применить сейчас"
                  className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 px-2 py-1 rounded text-[10px]">
                  <Icon name="Play" size={10} className="inline mr-1" />Применить
                </button>
                <button onClick={() => setEditing(r)}
                  className="bg-[#141414] border border-[#1F1F1F] px-2 py-1 rounded text-[10px]">
                  <Icon name="Pencil" size={10} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#0F0F0F] border border-[#1F1F1F] rounded-xl p-3">
      <div className="text-[10px] uppercase font-bold tracking-wide text-white/40 mb-2">{title}</div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function F({ l, v, s, ph }: { l: string; v: string; s: (x: string) => void; ph?: string }) {
  return (
    <div>
      <div className="text-[11px] text-white/50 mb-0.5">{l}</div>
      <input value={v} onChange={e => s(e.target.value)} placeholder={ph}
        className="w-full bg-[#0A0A0A] border border-[#1F1F1F] rounded px-2 py-1.5 text-sm focus:border-[#FFD700]/40 outline-none" />
    </div>
  );
}

function Sw({ l, v, s }: { l: string; v: boolean; s: (x: boolean) => void }) {
  return (
    <label className="flex items-center justify-between cursor-pointer py-1">
      <span className="text-sm">{l}</span>
      <button onClick={() => s(!v)}
        className={`w-9 h-5 rounded-full relative transition-colors ${v ? "bg-[#FFD700]" : "bg-[#1F1F1F]"}`}>
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${v ? "left-4" : "left-0.5"}`} />
      </button>
    </label>
  );
}
