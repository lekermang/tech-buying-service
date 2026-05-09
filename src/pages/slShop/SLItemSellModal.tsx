import { useState } from "react";
import Icon from "@/components/ui/icon";
import { slApi, type SLItem, PAYMENT_METHODS } from "./types";
import { Inp2 } from "./SLItemsCommon";
import { SLModal, SLField, SLInput, SLButton } from "./slUI";

const nowLocal = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function SLItemSellModal({ token, item, onClose, onDone }: { token: string; item: SLItem; onClose: () => void; onDone: () => void }) {
  const stockQty = Math.max(1, Number(item.quantity ?? 1) || 1);
  const isBatch = stockQty > 1;
  const unitPrice = Number(item.sell_price || 0);
  const [sellQty, setSellQty] = useState<string>("1");
  const [amount, setAmount] = useState(String(unitPrice || ""));
  const [payment, setPayment] = useState("cash");
  const [contract, setContract] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [autoPrint, setAutoPrint] = useState(true);
  const [soldAt, setSoldAt] = useState<string>(nowLocal());
  const sellQtyNum = Math.max(1, Math.min(stockQty, parseInt(sellQty, 10) || 1));
  const submit = async () => {
    if (!amount || Number(amount) <= 0) { setErr("Укажите сумму"); return; }
    if (sellQtyNum > stockQty) {
      setErr(`На складе только ${stockQty} шт`);
      return;
    }
    setSaving(true); setErr(null);
    const r = await slApi(token, "item_sell", { method: "POST", body: {
      item_id: item.id, amount: Number(amount), payment_method: payment, contract_number: contract, note,
      quantity: sellQtyNum,
      sold_at: soldAt || null,
    }});
    setSaving(false);
    if (r.ok) {
      // Автопечать товарного чека сразу после продажи
      if (autoPrint) {
        try {
          const ctxRes = await slApi(token, "doc_context", { params: { item_id: item.id } });
          const tplRes = await slApi<{ id: number; code: string; name: string }[]>(
            token, "doc_templates", { params: { only_active: "1", op_type: "sell" } }
          );
          if (ctxRes.ok && tplRes.ok && tplRes.data && tplRes.data.length > 0) {
            const { printDoc } = await import("./docPrinter");
            const tpl = tplRes.data.find(t => t.code === "sales_receipt") || tplRes.data[0];
            printDoc(tpl as never, ctxRes.data as never);
          }
        } catch (e) {
          console.error("auto-print sale", e);
        }
      }
      onDone();
    } else setErr(r.error || "Ошибка");
  };
  return (
    <SLModal
      open
      onClose={() => !saving && onClose()}
      title="Продажа"
      icon="ShoppingCart"
      footer={
        <SLButton
          variant="success"
          size="lg"
          icon={saving ? "Loader2" : "Check"}
          onClick={submit}
          disabled={saving}
          className="w-full"
        >
          {saving ? "Сохраняю..." : "Продать"}
        </SLButton>
      }
    >
      <div className="space-y-2">
        <div className="bg-[#141414] rounded-lg p-2.5 text-sm">
          <div className="font-bold flex items-center gap-1.5">
            <span className="truncate">{item.title}</span>
            {isBatch && (
              <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-[#FFD700]/15 border border-[#FFD700]/40 text-[#FFD700] font-bold">
                на складе {stockQty} шт
              </span>
            )}
          </div>
          <div className="text-white/40 text-xs">{item.specs_short}</div>
        </div>

        {isBatch && (
          <div>
            <div className="text-[11px] text-white/50 mb-1">Сколько штук продаём</div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  const n = Math.max(1, sellQtyNum - 1);
                  setSellQty(String(n));
                  if (unitPrice > 0) setAmount(String(unitPrice * n));
                }}
                className="w-9 h-9 rounded-md bg-[#0E0E0E] border border-[#1F1F1F] hover:border-[#FFD700]/40 text-white/80 active:scale-95"
              >
                <Icon name="Minus" size={14} className="mx-auto" />
              </button>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={stockQty}
                value={sellQty}
                onChange={e => {
                  const raw = e.target.value.replace(/[^\d]/g, "");
                  setSellQty(raw);
                  const n = Math.max(1, Math.min(stockQty, parseInt(raw, 10) || 1));
                  if (unitPrice > 0) setAmount(String(unitPrice * n));
                }}
                onBlur={() => {
                  if (!sellQty || sellQtyNum < 1) setSellQty("1");
                  else if (sellQtyNum > stockQty) setSellQty(String(stockQty));
                }}
                className="flex-1 bg-[#0A0A0A] border border-[#FFD700]/40 rounded-lg px-3 py-2 text-center font-bold tabular-nums text-lg text-[#FFD700]"
              />
              <span className="text-white/50 text-sm w-10 text-center">из {stockQty}</span>
              <button
                type="button"
                onClick={() => {
                  const n = Math.min(stockQty, sellQtyNum + 1);
                  setSellQty(String(n));
                  if (unitPrice > 0) setAmount(String(unitPrice * n));
                }}
                className="w-9 h-9 rounded-md bg-[#0E0E0E] border border-[#1F1F1F] hover:border-[#FFD700]/40 text-white/80 active:scale-95"
              >
                <Icon name="Plus" size={14} className="mx-auto" />
              </button>
            </div>
            {unitPrice > 0 && (
              <div className="text-[10px] text-white/40 mt-1">
                Цена за шт: {unitPrice.toLocaleString("ru-RU")} ₽ — сумма обновляется автоматически
              </div>
            )}
          </div>
        )}

        <Inp2 l={isBatch ? `Сумма за ${sellQtyNum} шт, ₽` : "Сумма ₽"} v={amount} s={setAmount} />

        <SLField label="Дата операции" hint="По умолчанию — сейчас. Поменяй для проведения задним числом.">
          <SLInput type="datetime-local" value={soldAt} onChange={e => setSoldAt(e.target.value)} iconLeft="Calendar" />
        </SLField>

        <div>
          <div className="text-[11px] text-white/50 mb-1">Способ оплаты</div>
          <div className="flex gap-1">
            {PAYMENT_METHODS.map(p => (
              <button key={p.v} onClick={() => setPayment(p.v)}
                className={`flex-1 text-[11px] py-1.5 rounded ${payment === p.v ? "bg-[#FFD700] text-black font-bold" : "bg-[#141414] border border-[#1F1F1F] text-white/60"}`}>
                {p.l}
              </button>
            ))}
          </div>
        </div>
        <Inp2 l="Договор №" v={contract} s={setContract} />
        <Inp2 l="Примечание" v={note} s={setNote} />
        <label className="flex items-center justify-between bg-[#141414] border border-[#1F1F1F] rounded-lg p-2 cursor-pointer">
          <div className="flex items-center gap-1.5 text-[12px]">
            <Icon name="Printer" size={12} className="text-[#FFD700]" />
            Печатать чек сразу после продажи
          </div>
          <button type="button" onClick={() => setAutoPrint(!autoPrint)}
            className={`w-9 h-5 rounded-full relative transition-colors ${autoPrint ? "bg-[#FFD700]" : "bg-[#1F1F1F]"}`}>
            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${autoPrint ? "left-4" : "left-0.5"}`} />
          </button>
        </label>
        {err && <div className="text-red-400 text-sm">{err}</div>}
      </div>
    </SLModal>
  );
}
