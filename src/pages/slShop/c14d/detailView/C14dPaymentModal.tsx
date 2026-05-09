import Icon from "@/components/ui/icon";
import { fmt, type C14dDetail, type C14dCashAccount } from "../types";
import {
  SLField, SLInput, SLTextarea, SLSelect,
  SLButton, SLModal, SLCheckbox,
} from "../../slUI";

type Props = {
  c: C14dDetail;
  open: boolean;
  saving: boolean;
  paySum: string;
  setPaySum: (v: string) => void;
  payType: "partial" | "full";
  setPayType: (v: "partial" | "full") => void;
  payComment: string;
  setPayComment: (v: string) => void;
  payAccountId: string;
  setPayAccountId: (v: string) => void;
  paySkipCash: boolean;
  setPaySkipCash: (v: boolean) => void;
  payPaidAt: string;
  setPayPaidAt: (v: string) => void;
  accounts: C14dCashAccount[];
  onClose: () => void;
  onSubmit: () => void;
};

export default function C14dPaymentModal({
  c, open, saving, paySum, setPaySum, payType, setPayType, payComment, setPayComment,
  payAccountId, setPayAccountId, paySkipCash, setPaySkipCash, payPaidAt, setPayPaidAt,
  accounts, onClose, onSubmit,
}: Props) {
  return (
    <SLModal
      open={open}
      onClose={() => !saving && onClose()}
      title="Внести платёж"
      icon="Wallet"
      footer={
        <SLButton
          variant="gold"
          size="lg"
          icon={saving ? "Loader2" : "Check"}
          onClick={onSubmit}
          disabled={saving}
          className="w-full"
        >
          Подтвердить платёж
        </SLButton>
      }
    >
      <div className="text-[11px] text-white/55 mb-2">Остаток: <b className="text-red-300">{fmt(c.remaining_debt)} ₽</b></div>

      {c.today_calc && c.today_calc.is_early && Number(c.today_calc.today_remaining) > 0 && (
        <div className="rounded-md bg-emerald-500/10 border border-emerald-500/30 p-2 mb-2 text-[11px] text-emerald-300/90">
          <div className="flex items-center gap-1 mb-0.5"><Icon name="Zap" size={11} /> <b>Досрочный выкуп · {Math.max(0, c.today_calc.days_passed_raw)}/{c.term_days} дн.</b></div>
          <div>Сегодня: <b className="text-emerald-300">{fmt(c.today_calc.today_due_full)} ₽</b> · доплата <b className="text-[#FFD700]">{fmt(c.today_calc.today_remaining)} ₽</b>{c.today_calc.saving > 0 && <span className="text-emerald-300/70"> (экономия {fmt(c.today_calc.saving)} ₽)</span>}</div>
          <button
            type="button"
            onClick={() => { setPaySum(String(c.today_calc!.today_remaining)); setPayType("full"); }}
            className="mt-1.5 w-full inline-flex items-center justify-center gap-1 px-2 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-200 text-[10px] font-bold uppercase tracking-wide"
          >
            <Icon name="ChevronsRight" size={10} /> Подставить
          </button>
        </div>
      )}

      <div className="space-y-2">
        <SLField label="Сумма ₽">
          <SLInput type="number" value={paySum} onChange={e => setPaySum(e.target.value)} className="font-bold text-[14px]" />
        </SLField>
        <SLField label="Тип">
          <SLSelect value={payType} onChange={e => setPayType(e.target.value as "partial" | "full")}>
            <option value="partial">Частичный</option>
            <option value="full">Полный расчёт</option>
          </SLSelect>
          {payType === "full" && c.today_calc && (
            <div className="text-[9px] text-emerald-300/70 mt-0.5">Сумма приведётся к {fmt(c.today_calc.today_remaining)} ₽ (на сегодня)</div>
          )}
        </SLField>
        <SLField
          label="Дата операции"
          hint="По умолчанию — сейчас. Поменяй для проведения задним числом — проценты пересчитаются на эту дату."
        >
          <SLInput type="datetime-local" value={payPaidAt} onChange={e => setPayPaidAt(e.target.value)} iconLeft="Calendar" />
          {payPaidAt && new Date(payPaidAt).toDateString() !== new Date().toDateString() && (
            <div className="mt-1 rounded-md bg-amber-500/10 border border-amber-500/30 p-1.5 text-[10px] text-amber-300/90 flex items-start gap-1">
              <Icon name="Info" size={10} className="mt-0.5 shrink-0" />
              <span>Платёж задним числом: проценты пересчитаются на выбранную дату, договор закроется этой же датой.</span>
            </div>
          )}
        </SLField>
        <SLField label="Касса прихода">
          <SLSelect value={payAccountId} onChange={e => setPayAccountId(e.target.value)} disabled={paySkipCash}>
            {accounts.length === 0 && <option value="">Нет касс</option>}
            {accounts.map(a => <option key={a.id} value={a.id}>{a.name} · {fmt(a.balance)} ₽{a.is_default ? " ★" : ""}</option>)}
          </SLSelect>
        </SLField>
        <SLCheckbox checked={paySkipCash} onChange={setPaySkipCash} label="Не вносить в кассу" />
        <SLField label="Комментарий">
          <SLTextarea rows={2} value={payComment} onChange={e => setPayComment(e.target.value)} />
        </SLField>
      </div>
    </SLModal>
  );
}
