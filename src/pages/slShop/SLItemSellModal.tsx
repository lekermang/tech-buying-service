import { useState } from "react";
import Icon from "@/components/ui/icon";
import { slApi, type SLItem, PAYMENT_METHODS } from "./types";
import { Inp2 } from "./SLItemsCommon";

export default function SLItemSellModal({ token, item, onClose, onDone }: { token: string; item: SLItem; onClose: () => void; onDone: () => void }) {
  const [amount, setAmount] = useState(String(item.sell_price || ""));
  const [payment, setPayment] = useState("cash");
  const [contract, setContract] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [autoPrint, setAutoPrint] = useState(true);
  const submit = async () => {
    if (!amount || Number(amount) <= 0) { setErr("Укажите сумму"); return; }
    setSaving(true); setErr(null);
    const r = await slApi(token, "item_sell", { method: "POST", body: {
      item_id: item.id, amount: Number(amount), payment_method: payment, contract_number: contract, note,
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
    <div className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center p-2" onClick={onClose}>
      <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="p-3 border-b border-[#1F1F1F] flex items-center justify-between">
          <div className="font-bold">Продажа</div>
          <button onClick={onClose}><Icon name="X" size={16} /></button>
        </div>
        <div className="p-3 space-y-2">
          <div className="bg-[#141414] rounded-lg p-2.5 text-sm">
            <div className="font-bold">{item.title}</div>
            <div className="text-white/40 text-xs">{item.specs_short}</div>
          </div>
          <Inp2 l="Сумма ₽" v={amount} s={setAmount} />
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
          <button onClick={submit} disabled={saving}
            className="w-full bg-emerald-500 text-black font-bold py-2.5 rounded-lg disabled:opacity-50">
            {saving ? "..." : "Продать"}
          </button>
        </div>
      </div>
    </div>
  );
}
