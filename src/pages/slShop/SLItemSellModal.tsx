import { useState } from "react";
import Icon from "@/components/ui/icon";
import { slApi, type SLItem, PAYMENT_METHODS, type SLDocTemplate, type SLDocContext } from "./types";
import { triggerReaction } from "@/components/FunReaction";
import { Inp2 } from "./SLItemsCommon";
import { SLModal, SLField, SLInput, SLButton } from "./slUI";

const SEND_CHECK_URL = "https://functions.poehali.dev/3e5c5c1a-5e16-4ae2-8b34-8618e4f6558d";
const ADMIN_TOKEN = "Mark2015N";

function buildSaleCheckHtml(item: SLItem, amount: number, payment: string, orderId: number): string {
  const dateStr = new Date().toLocaleDateString("ru-RU");
  const timeStr = new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  const pmLabel: Record<string, string> = { cash: "Наличные", card: "Карта", transfer: "Перевод" };
  return `<div style="font-family:Arial,sans-serif;font-size:12px;color:#000;max-width:500px">
  <h2 style="text-align:center;margin:0 0 4px;font-size:16px">Скупка24</h2>
  <div style="font-size:10px;text-align:center;color:#555;margin-bottom:12px">ИП Мамедов Адиль Мирза Оглы · г.Калуга, ул.Кирова, 7 / 11 · skypka24.com</div>
  <div style="font-size:10px;font-weight:bold;text-transform:uppercase;letter-spacing:.5px;border-bottom:1px solid #000;padding-bottom:3px;margin:10px 0 6px">Товарный чек</div>
  <div style="display:flex;justify-content:space-between;margin-bottom:4px;font-size:11px"><span style="color:#666">№ чека:</span><span style="font-weight:600">#${orderId}</span></div>
  <div style="display:flex;justify-content:space-between;margin-bottom:4px;font-size:11px"><span style="color:#666">Дата:</span><span style="font-weight:600">${dateStr} ${timeStr}</span></div>
  <div style="border-top:1px dashed #bbb;margin:8px 0"></div>
  <div style="display:flex;justify-content:space-between;margin-bottom:4px;font-size:11px"><span style="color:#666">Товар:</span><span style="font-weight:600">${item.title}</span></div>
  ${item.specs_short ? `<div style="display:flex;justify-content:space-between;margin-bottom:4px;font-size:11px"><span style="color:#666">Характеристики:</span><span style="font-weight:600">${item.specs_short}</span></div>` : ""}
  <div style="border-top:1px dashed #bbb;margin:8px 0"></div>
  <div style="display:flex;justify-content:space-between;margin-bottom:4px;font-size:11px"><span style="color:#666">Способ оплаты:</span><span style="font-weight:600">${pmLabel[payment] || payment}</span></div>
  <div style="display:flex;justify-content:space-between;font-size:14px;font-weight:bold;border-top:2px solid #000;padding-top:8px;margin-top:8px"><span>Итого:</span><span>${amount.toLocaleString("ru-RU")} ₽</span></div>
  <div style="font-size:9px;color:#888;margin-top:12px">ИНН: 402810962699 · ОГРНИП: 307402814200032<br>Товар надлежащего качества обмену и возврату не подлежит.</div>
</div>`;
}

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
  const [emailInput, setEmailInput] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const sellQtyNum = Math.max(1, Math.min(stockQty, parseInt(sellQty, 10) || 1));

  // Экран выбора документов после продажи
  const [docsScreen, setDocsScreen] = useState(false);
  const [docTpls, setDocTpls] = useState<SLDocTemplate[]>([]);
  const [docCtx, setDocCtx] = useState<SLDocContext | null>(null);
  const [docsLoading, setDocsLoading] = useState(false);
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
      triggerReaction("item_sold", Number(amount) || undefined);

      // Отправляем чек на email если указан
      if (emailInput.trim()) {
        const checkHtml = buildSaleCheckHtml(item, Number(amount), payment, Date.now());
        setEmailSending(true);
        fetch(SEND_CHECK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Admin-Token": ADMIN_TOKEN },
          body: JSON.stringify({ email: emailInput.trim(), check_html: checkHtml, check_type: "sale", client_name: "" }),
        }).then(res => res.json()).then(d => {
          if (d.sent) setEmailSent(true);
        }).catch(() => {}).finally(() => setEmailSending(false));
      }

      // Загружаем документы и показываем экран выбора
      setDocsLoading(true);
      setDocsScreen(true);
      try {
        const [ctxRes, tplRes] = await Promise.all([
          slApi<SLDocContext>(token, "doc_context", { params: { item_id: item.id } }),
          slApi<SLDocTemplate[]>(token, "doc_templates", { params: { only_active: "1", op_type: "sell" } }),
        ]);
        if (ctxRes.ok && ctxRes.data) setDocCtx(ctxRes.data);
        if (tplRes.ok && tplRes.data) setDocTpls(tplRes.data);

        // Автопечать товарного чека если включено
        if (autoPrint && ctxRes.ok && tplRes.ok && tplRes.data && tplRes.data.length > 0) {
          const { printDoc } = await import("./docPrinter");
          const tpl = tplRes.data.find(t => t.code === "sales_receipt") || tplRes.data[0];
          printDoc(tpl as never, ctxRes.data as never);
        }
      } catch (e) {
        console.error("docs-load sale", e);
      } finally {
        setDocsLoading(false);
      }
    } else setErr(r.error || "Ошибка");
  };
  // ── Экран выбора документов после успешной продажи ─────────────
  if (docsScreen) {
    return (
      <SLModal
        open
        onClose={onDone}
        title="Продано — выберите документы"
        icon="CheckCircle2"
        footer={
          <SLButton variant="ghost" size="lg" icon="X" onClick={onDone} className="w-full">
            Закрыть
          </SLButton>
        }
      >
        <div className="space-y-3">
          {/* Итог продажи */}
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <Icon name="CheckCircle2" size={18} className="text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-emerald-300 truncate">{item.title}</div>
              <div className="text-[11px] text-white/50">
                {Number(amount).toLocaleString("ru-RU")} ₽ ·{" "}
                {payment === "cash" ? "Наличные" : payment === "card" ? "Карта" : "Перевод"}
              </div>
            </div>
          </div>

          {/* Список документов */}
          {docsLoading && (
            <div className="flex items-center justify-center py-8 gap-2 text-white/40">
              <Icon name="Loader2" size={16} className="animate-spin text-[#FFD700]" />
              <span className="text-sm">Загружаю документы…</span>
            </div>
          )}

          {!docsLoading && docTpls.length === 0 && (
            <div className="text-center text-white/30 text-sm py-6">
              Нет активных шаблонов.<br />
              <span className="text-[11px]">Включите шаблоны в разделе «Документы».</span>
            </div>
          )}

          {!docsLoading && docTpls.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[11px] text-white/40 uppercase tracking-wider font-bold px-0.5">Печать документов</div>
              {docTpls.map(t => (
                <button
                  key={t.id}
                  onClick={async () => {
                    if (!docCtx) return;
                    const { printDoc } = await import("./docPrinter");
                    printDoc(t as never, docCtx as never);
                  }}
                  className="w-full text-left bg-[#0F0F0F] border border-[#1F1F1F] hover:border-[#FFD700]/50 hover:bg-[#FFD700]/5 rounded-xl p-3 transition-all active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#FFD700]/10 border border-[#FFD700]/20 flex items-center justify-center flex-shrink-0">
                      <Icon name="FileText" size={15} className="text-[#FFD700]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-white">{t.name}</div>
                      {t.description && <div className="text-[10px] text-white/40 truncate">{t.description}</div>}
                    </div>
                    <Icon name="Printer" size={14} className="text-white/30 flex-shrink-0" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </SLModal>
    );
  }

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

        {/* Email чека клиенту */}
        <div className="bg-[#141414] border border-[#1F1F1F] rounded-lg p-2.5">
          <div className="flex items-center gap-1.5 text-[12px] text-white/60 mb-2">
            <Icon name="Mail" size={12} className="text-blue-400" />
            Отправить чек на email (необязательно)
          </div>
          <div className="flex gap-1.5">
            <input
              type="email"
              value={emailInput}
              onChange={e => setEmailInput(e.target.value)}
              placeholder="email@example.com"
              className="flex-1 px-2.5 py-1.5 text-[12px] bg-[#0A0A0A] border border-[#1F1F1F] rounded-md text-white placeholder-white/20 outline-none focus:border-blue-400/40"
            />
            {emailSent && <div className="flex items-center gap-1 text-emerald-400 text-[11px]"><Icon name="Check" size={12} />Отправлено</div>}
          </div>
        </div>

        {err && <div className="text-red-400 text-sm">{err}</div>}
      </div>
    </SLModal>
  );
}