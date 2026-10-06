import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Icon from "@/components/ui/icon";
import { formatPhone } from "@/lib/phoneFormat";
import funcUrls from "../../../../backend/func2url.json";
import { PURITIES, coef, ourPrice, rub, type useGoldRates } from "./useGoldRates";

const GOLD_URL = (funcUrls as Record<string, string>)["gold-admin"];
const INP = "w-full bg-[#0D0D0D] border border-[#333] text-white px-3 h-11 rounded-lg font-roboto text-base focus:outline-none focus:border-[#FFD700] placeholder:text-white/25";

type Props = { token: string; rates: ReturnType<typeof useGoldRates>; onClose: () => void };

export default function GoldBuyModal({ token, rates, onClose }: Props) {
  const { exchange, competitors } = rates;
  const [purity, setPurity] = useState(585);
  const [weight, setWeight] = useState("");
  const [phone, setPhone] = useState("+7");
  const [name, setName] = useState("");
  const [item, setItem] = useState("");
  const [total, setTotal] = useState("");
  const [perGram, setPerGram] = useState("");
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<null | { id: number }>(null);

  const w = parseFloat(weight.replace(",", ".")) || 0;
  const t = parseInt(total.replace(/\D/g, ""), 10) || 0;
  const suggested = ourPrice(exchange, purity);
  const sunPrice = competitors.find(c => c.source === "SUNLIGHT")?.prices[String(purity)];
  const maxComp = useMemo(() => {
    const vals = competitors.map(c => c.prices[String(purity)]).filter(Boolean) as number[];
    return vals.length ? Math.max(...vals) : 0;
  }, [competitors, purity]);
  const w585 = +(w * coef(purity) / coef(585)).toFixed(2);
  const effective = w > 0 && t > 0 ? Math.round(t / w) : 0;

  const phoneDigits = phone.replace(/\D/g, "");
  const errs = {
    phone: phoneDigits.length !== 11,
    weight: w <= 0,
    total: t <= 0,
  };
  const invalid = errs.phone || errs.weight || errs.total;

  const onPerGram = (v: string) => {
    setPerGram(v);
    const g = parseFloat(v.replace(",", ".")) || 0;
    if (g > 0 && w > 0) setTotal(String(Math.round(g * w)));
  };
  const onWeight = (v: string) => {
    setWeight(v);
    const ww = parseFloat(v.replace(",", ".")) || 0;
    const g = parseFloat(perGram.replace(",", ".")) || 0;
    if (g > 0 && ww > 0) setTotal(String(Math.round(g * ww)));
  };
  const useSuggested = () => {
    if (suggested) onPerGram(String(suggested));
  };

  const save = async () => {
    setTouched(true);
    if (invalid) return;
    setSaving(true); setError("");
    try {
      const res = await fetch(GOLD_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Employee-Token": token },
        body: JSON.stringify({
          action: "create", strict: true,
          name: name.trim(), phone: phoneDigits ? `+${phoneDigits}` : "",
          item_name: item.trim() || null,
          weight: w, purity: String(purity), buy_price: t,
          comment: `Коэф. ${coef(purity).toFixed(3)} · ${effective} ₽/г` + (suggested ? ` · наш расчёт ${suggested} ₽/г` : ""),
        }),
      });
      const d = await res.json();
      if (d.order_id) setDone({ id: d.order_id });
      else setError(d.error || "Не удалось сохранить");
    } catch {
      setError("Нет связи, попробуйте ещё раз");
    }
    setSaving(false);
  };

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); };
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-3" onClick={onClose}>
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl bg-[#121212] border border-[#FFD700]/30 p-4 shadow-2xl shadow-black"
        onClick={e => e.stopPropagation()}>
        {done ? (
          <div className="text-center py-6">
            <div className="text-5xl mb-3">✅</div>
            <div className="font-oswald font-bold text-xl text-white uppercase mb-1">Золото куплено</div>
            <div className="text-white/60 text-sm mb-1">{weight} г · проба {purity} · {rub(t)}</div>
            <div className="text-white/30 text-xs mb-5">Заявка №{done.id}, уведомление ушло в MAX</div>
            <button onClick={onClose} className="w-full h-12 rounded-xl bg-gradient-to-b from-[#FFD700] to-yellow-500 text-black font-oswald font-bold uppercase">Закрыть</button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <div className="font-oswald font-bold text-[#FFD700] uppercase tracking-wide flex items-center gap-2">
                <Icon name="Gem" size={16} /> Покупка золота
              </div>
              <button onClick={onClose} className="w-9 h-9 flex items-center justify-center text-white/50"><Icon name="X" size={18} /></button>
            </div>

            <div className="text-[11px] uppercase text-white/40 mb-1 font-roboto">Проба *</div>
            <div className="grid grid-cols-5 gap-1.5 mb-3">
              {PURITIES.slice().reverse().map(p => (
                <button key={p} onClick={() => { setPurity(p); setPerGram(""); }}
                  className={`h-11 rounded-lg font-oswald font-bold text-sm border transition-colors ${
                    purity === p ? "bg-[#FFD700] text-black border-[#FFD700]" : "bg-[#0D0D0D] text-white/70 border-[#333]"
                  }`}>{p}</button>
              ))}
            </div>

            <div className="rounded-xl border border-[#FFD700]/20 bg-[#FFD700]/5 p-2.5 mb-3 text-[12px] font-roboto">
              <div className="flex justify-between"><span className="text-white/50">Коэффициент пробы</span><b className="text-white tabular-nums">{coef(purity).toFixed(3)}</b></div>
              <div className="flex justify-between"><span className="text-white/50">Наш расчёт за 1 г</span><b className="text-[#FFD700] tabular-nums">{rub(suggested)}</b></div>
              <div className="flex justify-between"><span className="text-white/50">SUNLIGHT за 1 г</span><b className="text-emerald-400 tabular-nums">{sunPrice ? rub(sunPrice) : "—"}</b></div>
              {maxComp > 0 && maxComp !== sunPrice && (
                <div className="flex justify-between"><span className="text-white/50">Макс. у конкурентов</span><b className="text-emerald-400 tabular-nums">{rub(maxComp)}</b></div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <div className="text-[11px] uppercase text-white/40 mb-1 font-roboto">Вес, г *</div>
                <input inputMode="decimal" className={`${INP} ${touched && errs.weight ? "!border-red-500" : ""}`} placeholder="0,00"
                  value={weight} onChange={e => onWeight(e.target.value.replace(/[^\d.,]/g, ""))} />
              </div>
              <div>
                <div className="text-[11px] uppercase text-white/40 mb-1 font-roboto">Цена за 1 г (по желанию)</div>
                <input inputMode="numeric" className={INP} placeholder={suggested ? String(suggested) : "₽/г"}
                  value={perGram} onChange={e => onPerGram(e.target.value.replace(/[^\d.,]/g, ""))} />
              </div>
            </div>
            {suggested ? (
              <button onClick={useSuggested} className="mb-2 text-[11px] text-[#FFD700] underline decoration-dotted">
                Подставить наш расчёт {rub(suggested)}/г
              </button>
            ) : null}

            <div className="mb-2">
              <div className="text-[11px] uppercase text-white/40 mb-1 font-roboto">Общая выданная сумма, ₽ *</div>
              <input inputMode="numeric" className={`${INP} !text-lg font-bold ${touched && errs.total ? "!border-red-500" : ""}`} placeholder="0"
                value={total ? Number(total).toLocaleString("ru-RU") : ""} onChange={e => setTotal(e.target.value.replace(/\D/g, ""))} />
            </div>

            {w > 0 && (
              <div className="rounded-xl bg-white/5 border border-white/10 p-2.5 mb-3 text-[12px] font-roboto">
                <div className="flex justify-between"><span className="text-white/50">В пересчёте на 585</span><b className="text-white tabular-nums">{w585.toFixed(2)} г</b></div>
                {suggested && (
                  <div className="flex justify-between"><span className="text-white/50">По нашему расчёту всего</span><b className="text-white tabular-nums">{rub(suggested * w)}</b></div>
                )}
                {effective > 0 && (
                  <div className="flex justify-between"><span className="text-white/50">Фактически за 1 г</span>
                    <b className={`tabular-nums ${suggested && effective > suggested ? "text-orange-400" : "text-emerald-400"}`}>{rub(effective)}</b>
                  </div>
                )}
              </div>
            )}

            <div className="text-[11px] uppercase text-white/40 mb-1 font-roboto">Телефон клиента *</div>
            <input inputMode="tel" className={`${INP} mb-1 ${touched && errs.phone ? "!border-red-500" : ""}`} placeholder="+7 (___) ___-__-__"
              value={phone} onChange={e => setPhone(formatPhone(e.target.value))} />
            {touched && errs.phone && <div className="text-red-400 text-[11px] mb-1">Введите номер полностью</div>}

            <div className="grid grid-cols-2 gap-2 my-2">
              <input className={INP} placeholder="Имя клиента" value={name} onChange={e => setName(e.target.value)} />
              <input className={INP} placeholder="Изделие" value={item} onChange={e => setItem(e.target.value)} />
            </div>

            {touched && invalid && (
              <div className="text-red-400 text-[12px] mb-2">
                Заполните: {[errs.phone && "телефон", errs.weight && "вес", errs.total && "сумму"].filter(Boolean).join(", ")}
              </div>
            )}
            {error && <div className="text-red-400 text-[12px] mb-2">{error}</div>}

            <button onClick={save} disabled={saving}
              className="w-full h-12 rounded-xl bg-gradient-to-b from-[#FFD700] to-yellow-500 text-black font-oswald font-bold uppercase flex items-center justify-center gap-2 disabled:opacity-60 active:scale-95 transition-transform">
              {saving ? <><Icon name="Loader" size={16} className="animate-spin" />Сохраняю…</> : <><Icon name="Check" size={17} />Оформить покупку</>}
            </button>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
