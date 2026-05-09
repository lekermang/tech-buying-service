import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import {
  c14dApi,
  type C14dDetail, type C14dCashAccount,
} from "./types";
import { SYNC_URL } from "../../staffAvitoPro/types";
import C14dDetailHeader from "./detailView/C14dDetailHeader";
import C14dPaymentsTable from "./detailView/C14dPaymentsTable";
import C14dPaymentModal from "./detailView/C14dPaymentModal";
import C14dActionModals from "./detailView/C14dActionModals";

type Props = { token: string; contractId: number; onBack: () => void };

type AvitoMatch = { id: number; title: string; price: number | null; url: string | null; main_photo: string | null };

export default function C14dDetailView({ token, contractId, onBack }: Props) {
  const [c, setC] = useState<C14dDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // payment modal
  const [payOpen, setPayOpen] = useState(false);
  const [paySum, setPaySum] = useState("");
  const [payType, setPayType] = useState<"partial" | "full">("partial");
  const [payComment, setPayComment] = useState("");
  const [paySaving, setPaySaving] = useState(false);
  const [accounts, setAccounts] = useState<C14dCashAccount[]>([]);
  const [payAccountId, setPayAccountId] = useState<string>("");
  const [paySkipCash, setPaySkipCash] = useState(false);
  // Дата операции (по умолчанию — сейчас, формат datetime-local)
  const nowLocal = () => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
  const [payPaidAt, setPayPaidAt] = useState<string>(nowLocal());

  // Авито-объявления для снятия после полного выкупа
  const [avitoMatches, setAvitoMatches] = useState<AvitoMatch[] | null>(null);
  const [avitoModalOpen, setAvitoModalOpen] = useState(false);
  const [avitoArchiving, setAvitoArchiving] = useState<number | null>(null);

  const [photoSrc, setPhotoSrc] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<null | { kind: "terminate" | "close"; reason?: string }>(null);
  const [confirmSaving, setConfirmSaving] = useState(false);
  const [cancelPaymentId, setCancelPaymentId] = useState<number | null>(null);
  const [cancelSaving, setCancelSaving] = useState(false);

  useEffect(() => {
    c14dApi<{ accounts: C14dCashAccount[] }>(token, "cash_accounts").then(r => {
      if (r.ok && r.data) {
        setAccounts(r.data.accounts);
        const def = r.data.accounts.find(a => a.is_default) || r.data.accounts[0];
        if (def) setPayAccountId(String(def.id));
      }
    });
  }, [token]);

  const reload = async () => {
    setLoading(true);
    const r = await c14dApi<C14dDetail>(token, "get", { params: { id: contractId } });
    setLoading(false);
    if (!r.ok || !r.data) { setErr(r.error || "Не удалось загрузить"); return; }
    setC(r.data); setErr(null);
  };

  useEffect(() => { reload();   }, [contractId]);

  const findAvitoListings = async () => {
    if (!c) return;
    const queryParts = [c.item_brand, c.item_model].filter(Boolean) as string[];
    const query = queryParts.join(" ").trim();
    const imei = c.serial_number || "";
    if (!query && !imei) {
      setAvitoMatches([]);
      setAvitoModalOpen(true);
      return;
    }
    try {
      const r = await fetch(
        `${SYNC_URL}?action=find_by_query&q=${encodeURIComponent(query)}&imei=${encodeURIComponent(imei)}`,
      );
      const d = await r.json();
      setAvitoMatches(d.ok && Array.isArray(d.items) ? d.items : []);
    } catch {
      setAvitoMatches([]);
    }
    setAvitoModalOpen(true);
  };

  const archiveAvitoItem = async (avitoId: number) => {
    setAvitoArchiving(avitoId);
    try {
      await fetch(`${SYNC_URL}?action=archive_product`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avito_id: avitoId }),
      });
      setAvitoMatches(prev => prev?.filter(m => m.id !== avitoId) || []);
    } finally {
      setAvitoArchiving(null);
    }
  };

  const submitPayment = async () => {
    if (!c) return;
    const a = Number(paySum);
    if (!a || a <= 0) { setErr("Сумма должна быть больше 0"); return; }
    setPaySaving(true);
    const r = await c14dApi<{ status?: string }>(token, "payment", {
      method: "POST",
      body: {
        contract_id: c.id, amount: a, payment_type: payType,
        comment: payComment || null,
        cash_account_id: payAccountId ? Number(payAccountId) : null,
        skip_cash: paySkipCash,
        paid_at: payPaidAt || null,
      },
    });
    setPaySaving(false);
    if (!r.ok) { setErr(r.error || "Ошибка платежа"); return; }
    const wasFullPayment = payType === "full" || r.data?.status === "closed";
    setPayOpen(false); setPaySum(""); setPayComment(""); setPayType("partial"); setPaySkipCash(false);
    setPayPaidAt(nowLocal());
    await reload();
    // После полного выкупа — ищем в Авито-каталоге, чтобы снять с продажи
    if (wasFullPayment) {
      findAvitoListings();
    }
  };

  const submitConfirm = async () => {
    if (!c || !confirm) return;
    setConfirmSaving(true);
    const action = confirm.kind === "terminate" ? "terminate" : "close";
    const r = await c14dApi(token, action, { method: "POST", body: { contract_id: c.id, reason: confirm.reason } });
    setConfirmSaving(false);
    if (!r.ok) { setErr(r.error || "Ошибка"); return; }
    setConfirm(null); reload();
  };

  const submitCancelPayment = async () => {
    if (!cancelPaymentId) return;
    setCancelSaving(true);
    const r = await c14dApi(token, "payment_cancel", {
      method: "POST",
      body: { payment_id: cancelPaymentId },
    });
    setCancelSaving(false);
    if (!r.ok) { setErr(r.error || "Не удалось отменить платёж"); return; }
    setCancelPaymentId(null);
    reload();
  };

  if (loading) return <div className="text-center py-8 text-white/40"><Icon name="Loader2" size={18} className="animate-spin inline" /></div>;
  if (err && !c) return (
    <div className="text-center py-6">
      <div className="text-red-300 text-sm mb-2">{err}</div>
      <button onClick={onBack} className="text-white/60 hover:text-white text-sm">← Назад</button>
    </div>
  );
  if (!c) return null;

  return (
    <div className="space-y-2">
      <C14dDetailHeader
        c={c}
        onBack={onBack}
        onPay={() => setPayOpen(true)}
        onClose={() => setConfirm({ kind: "close" })}
        onTerminate={() => setConfirm({ kind: "terminate" })}
        onPhotoClick={setPhotoSrc}
      />

      <C14dPaymentsTable
        c={c}
        onCancelPayment={setCancelPaymentId}
      />

      <C14dPaymentModal
        c={c}
        open={payOpen}
        saving={paySaving}
        paySum={paySum}
        setPaySum={setPaySum}
        payType={payType}
        setPayType={setPayType}
        payComment={payComment}
        setPayComment={setPayComment}
        payAccountId={payAccountId}
        setPayAccountId={setPayAccountId}
        paySkipCash={paySkipCash}
        setPaySkipCash={setPaySkipCash}
        payPaidAt={payPaidAt}
        setPayPaidAt={setPayPaidAt}
        accounts={accounts}
        onClose={() => setPayOpen(false)}
        onSubmit={submitPayment}
      />

      <C14dActionModals
        c={c}
        avitoMatches={avitoMatches}
        avitoModalOpen={avitoModalOpen}
        avitoArchiving={avitoArchiving}
        setAvitoModalOpen={setAvitoModalOpen}
        archiveAvitoItem={archiveAvitoItem}
        confirm={confirm}
        setConfirm={setConfirm}
        confirmSaving={confirmSaving}
        submitConfirm={submitConfirm}
        cancelPaymentId={cancelPaymentId}
        setCancelPaymentId={setCancelPaymentId}
        cancelSaving={cancelSaving}
        submitCancelPayment={submitCancelPayment}
        photoSrc={photoSrc}
        setPhotoSrc={setPhotoSrc}
      />

      {err && <div className="rounded-md bg-red-500/10 border border-red-500/30 text-red-300 px-2.5 py-1.5 text-[12px]">{err}</div>}
    </div>
  );
}
