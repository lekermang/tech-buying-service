import { useState } from "react";
import Icon from "@/components/ui/icon";
import { c14dApi, fmt, type C14dListItem } from "./types";

// ─── Расчёт рекомендуемой цены продажи ───────────────────────────────────────
// Логика: сумма закупки * 2, затем округляем до красивого числа
function calcSellPrice(amount: number): number {
  const raw = amount * 2;
  // Округляем до ближайшего "красивого": 999, 1499, 1999 ...
  const thresholds = [499,999,1499,1999,2499,2999,3499,3999,4499,4999,
    5999,6999,7999,8999,9999,11999,12999,14999,16999,19999,
    24999,29999,34999,39999,44999,49999,59999,69999,79999,89999,99999];
  for (const t of thresholds) {
    if (raw <= t + t * 0.15) return t;
  }
  // Fallback: округляем до 999 вверх
  return Math.ceil(raw / 1000) * 1000 - 1;
}

// ─── Модал «Перевести на склад» ──────────────────────────────────────────────
export default function C14dToWarehouseModal({
  contract, token, onClose, onDone,
}: {
  contract: C14dListItem;
  token: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const amount = Number(contract.amount) || 0;
  const suggestedPrice = calcSellPrice(amount);
  const [sellPrice, setSellPrice] = useState(String(suggestedPrice));
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const itemName = [contract.item_brand, contract.item_model].filter(Boolean).join(" ") || contract.item_type || "Товар";

  const handleConfirm = async () => {
    const price = parseInt(sellPrice.replace(/\D/g, ""), 10);
    if (!price || price < 1) { setErr("Укажите цену продажи"); return; }
    setLoading(true); setErr(null);
    // Переводим на склад: action=to_warehouse
    const r = await c14dApi(token, "to_warehouse", {
      method: "POST",
      body: {
        contract_id: contract.id,
        sell_price: price,
      },
    });
    setLoading(false);
    if (!r.ok) { setErr(r.error || "Ошибка"); return; }
    onDone();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-t-2xl sm:rounded-2xl bg-[#111] border border-[#FFD700]/30 shadow-2xl flex flex-col"
        style={{ maxHeight: '92dvh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Скроллируемый контент */}
        <div className="overflow-y-auto p-4 space-y-3 flex-1">
          {/* Шапка */}
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FFD700] to-[#b8860b] flex items-center justify-center shrink-0">
              <Icon name="PackagePlus" size={18} className="text-black" />
            </div>
            <div>
              <div className="font-oswald font-bold text-[14px] text-white uppercase tracking-wide">На склад</div>
              <div className="text-[10px] text-white/45">{contract.contract_number}</div>
            </div>
          </div>

          {/* Товар */}
          <div className="rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] px-3 py-2 space-y-1">
            <div className="text-[11px] text-white/50 uppercase tracking-wide">Товар</div>
            <div className="font-bold text-[14px] text-white">{itemName}</div>
            <div className="flex items-center gap-3 mt-1">
              <div>
                <div className="text-[10px] text-white/40">Закуплен за</div>
                <div className="font-oswald font-bold text-[15px] text-white">{fmt(amount)} ₽</div>
              </div>
              <Icon name="ArrowRight" size={14} className="text-white/30" />
              <div>
                <div className="text-[10px] text-[#FFD700]/70">Продажа (рекомен.)</div>
                <div className="font-oswald font-bold text-[15px] text-[#FFD700]">{fmt(suggestedPrice)} ₽</div>
              </div>
            </div>
          </div>

          {/* Ввод цены продажи */}
          <div>
            <label className="text-[11px] text-white/50 uppercase tracking-wide mb-1 block">
              Цена продажи (итоговая)
            </label>
            <div className="relative">
              <input
                type="number"
                inputMode="numeric"
                value={sellPrice}
                onChange={e => setSellPrice(e.target.value)}
                className="w-full rounded-lg bg-[#1A1A1A] border border-[#FFD700]/30 focus:border-[#FFD700] text-white font-oswald font-bold text-[18px] px-3 py-2.5 outline-none pr-10 transition"
                placeholder="7999"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#FFD700] font-bold text-[16px]">₽</span>
            </div>
            <div className="text-[10px] text-white/30 mt-1">
              Процент обнуляется · закупка {fmt(amount)} ₽ → продажа {sellPrice || "?"} ₽
            </div>
          </div>

          {err && <div className="text-red-400 text-[11px] bg-red-500/10 rounded-lg px-2.5 py-1.5">{err}</div>}
        </div>

        {/* Кнопки — всегда видны внизу */}
        <div className="flex gap-2 p-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-white/5 bg-[#111]">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-white/15 text-white/50 text-[12px] py-3 font-bold uppercase tracking-wide hover:border-white/30 transition"
          >
            Отмена
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 rounded-lg bg-gradient-to-r from-[#FFD700] to-[#b8860b] text-black font-bold uppercase tracking-wide text-[12px] py-3 hover:opacity-90 active:scale-[0.98] transition disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {loading ? <Icon name="Loader2" size={14} className="animate-spin" /> : <Icon name="PackagePlus" size={14} />}
            На склад
          </button>
        </div>
      </div>
    </div>
  );
}

