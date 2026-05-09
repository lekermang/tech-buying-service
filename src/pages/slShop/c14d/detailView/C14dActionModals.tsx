import Icon from "@/components/ui/icon";
import { fmt, fmtDate, type C14dDetail } from "../types";
import {
  SLField, SLTextarea,
  SLButton, SLModal,
} from "../../slUI";

type AvitoMatch = { id: number; title: string; price: number | null; url: string | null; main_photo: string | null };

type Props = {
  c: C14dDetail;
  // Avito
  avitoMatches: AvitoMatch[] | null;
  avitoModalOpen: boolean;
  avitoArchiving: number | null;
  setAvitoModalOpen: (v: boolean) => void;
  archiveAvitoItem: (id: number) => void;
  // Confirm (terminate / close)
  confirm: null | { kind: "terminate" | "close"; reason?: string };
  setConfirm: (v: null | { kind: "terminate" | "close"; reason?: string }) => void;
  confirmSaving: boolean;
  submitConfirm: () => void;
  // Cancel payment
  cancelPaymentId: number | null;
  setCancelPaymentId: (v: number | null) => void;
  cancelSaving: boolean;
  submitCancelPayment: () => void;
  // Photo viewer
  photoSrc: string | null;
  setPhotoSrc: (v: string | null) => void;
};

export default function C14dActionModals({
  c,
  avitoMatches, avitoModalOpen, avitoArchiving, setAvitoModalOpen, archiveAvitoItem,
  confirm, setConfirm, confirmSaving, submitConfirm,
  cancelPaymentId, setCancelPaymentId, cancelSaving, submitCancelPayment,
  photoSrc, setPhotoSrc,
}: Props) {
  const cancelPayment = c.payments?.find(x => x.id === cancelPaymentId);
  const wasFullClose = cancelPayment?.payment_type === "full" && c.status === "closed";

  return (
    <>
      {/* Модал: Авито-объявления для снятия после полного выкупа */}
      <SLModal
        open={avitoModalOpen}
        onClose={() => setAvitoModalOpen(false)}
        title="Снять с Авито"
        icon="Search"
        maxWidth="max-w-lg"
        footer={
          <SLButton variant="dark" onClick={() => setAvitoModalOpen(false)}>Закрыть</SLButton>
        }
      >
        <div className="rounded-md bg-emerald-500/10 border border-emerald-500/30 p-2 mb-3 text-[11px] text-emerald-300/90">
          <Icon name="CheckCircle2" size={11} className="inline -mt-0.5 mr-1" />
          Договор закрыт, телефон возвращён клиенту. Товар автоматически убран из раздела б/у.
          {avitoMatches && avitoMatches.length > 0 && " Ниже — активные объявления на Авито с похожим названием. Сними их с публикации, чтобы не продать тот же телефон повторно."}
        </div>

        {avitoMatches === null && (
          <div className="text-center py-6 text-white/40"><Icon name="Loader2" size={16} className="animate-spin inline" /> Ищу объявления...</div>
        )}

        {avitoMatches && avitoMatches.length === 0 && (
          <div className="text-center py-4 text-white/50 text-[12px]">
            <Icon name="Inbox" size={20} className="inline mb-1 text-white/30" />
            <div>Совпадений в Авито-каталоге не найдено</div>
            <div className="text-[10px] text-white/35 mt-0.5">Возможно, телефона уже нет на витрине</div>
          </div>
        )}

        {avitoMatches && avitoMatches.length > 0 && (
          <div className="space-y-2">
            {avitoMatches.map(m => (
              <div key={m.id} className="rounded-lg bg-white/5 border border-white/10 p-2 flex gap-2">
                {m.main_photo && (
                  <img src={m.main_photo} alt="" className="w-14 h-14 rounded object-cover shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-bold text-white truncate">{m.title}</div>
                  {m.price !== null && <div className="text-[11px] text-[#FFD700]">{fmt(m.price)} ₽</div>}
                  <div className="flex gap-1.5 mt-1.5 flex-wrap">
                    {m.url && (
                      <a
                        href={m.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-200 text-[10px] font-bold uppercase tracking-wide"
                      >
                        <Icon name="ExternalLink" size={10} /> Открыть на Авито
                      </a>
                    )}
                    <button
                      onClick={() => archiveAvitoItem(m.id)}
                      disabled={avitoArchiving === m.id}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-200 text-[10px] font-bold uppercase tracking-wide disabled:opacity-50"
                    >
                      <Icon name={avitoArchiving === m.id ? "Loader2" : "Archive"} size={10} className={avitoArchiving === m.id ? "animate-spin" : ""} />
                      Снять
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </SLModal>

      {/* Модал расторжения / закрытия */}
      <SLModal
        open={!!confirm}
        onClose={() => !confirmSaving && setConfirm(null)}
        title={confirm?.kind === "terminate" ? "Расторгнуть договор?" : "Закрыть договор?"}
        icon="AlertTriangle"
        maxWidth="max-w-sm"
        footer={
          <>
            <SLButton variant="dark" onClick={() => setConfirm(null)} disabled={confirmSaving}>Отмена</SLButton>
            <SLButton
              variant={confirm?.kind === "terminate" ? "danger" : "gold"}
              icon={confirmSaving ? "Loader2" : "Check"}
              onClick={submitConfirm}
              disabled={confirmSaving}
            >Подтвердить</SLButton>
          </>
        }
      >
        <div className="text-[12px] text-white/65 mb-2">
          {confirm?.kind === "terminate"
            ? "Действие необратимо. Договор будет помечен как «расторгнут»."
            : "Договор будет переведён в архив со статусом «завершён»."}
        </div>
        {confirm?.kind === "terminate" && (
          <SLField label="Причина (опционально)">
            <SLTextarea rows={2} value={confirm.reason || ""} onChange={e => setConfirm({ ...confirm, reason: e.target.value })} />
          </SLField>
        )}
      </SLModal>

      {/* Модал отмены платежа */}
      <SLModal
        open={!!cancelPaymentId}
        onClose={() => !cancelSaving && setCancelPaymentId(null)}
        title="Отменить платёж?"
        icon="AlertTriangle"
        maxWidth="max-w-sm"
        footer={
          <>
            <SLButton variant="dark" onClick={() => setCancelPaymentId(null)} disabled={cancelSaving}>Назад</SLButton>
            <SLButton
              variant="danger"
              icon={cancelSaving ? "Loader2" : "Trash2"}
              onClick={submitCancelPayment}
              disabled={cancelSaving}
            >{cancelSaving ? "Отменяю..." : "Отменить платёж"}</SLButton>
          </>
        }
      >
        <div className="text-[12px] text-white/70 space-y-2">
          {cancelPayment && (
            <div className="rounded-md bg-white/5 border border-white/10 p-2">
              <div className="text-[10px] text-white/40 uppercase tracking-wide font-bold mb-0.5">Платёж</div>
              <div><b className="text-emerald-300">{fmt(cancelPayment.amount)} ₽</b> · {cancelPayment.payment_type === "full" ? "Полный расчёт" : "Частичный"}</div>
              <div className="text-[11px] text-white/50">{fmtDate(cancelPayment.paid_at)} · {cancelPayment.recorded_by || "—"}</div>
            </div>
          )}
          <div>Что произойдёт:</div>
          <ul className="text-[11px] text-white/65 space-y-1 pl-4 list-disc">
            <li>Платёж удалится из истории</li>
            <li>Сумма вернётся в кассу обратным движением (той же датой)</li>
            <li>Остаток долга и проценты пересчитаются заново</li>
            {wasFullClose && <li className="text-amber-300">Договор снова станет активным</li>}
          </ul>
          <div className="rounded-md bg-amber-500/10 border border-amber-500/30 p-1.5 text-[10px] text-amber-300/90">
            <Icon name="Info" size={10} className="inline mr-1" />
            После отмены проведи платёж заново с правильной датой.
          </div>
        </div>
      </SLModal>

      {/* Просмотр фото */}
      {photoSrc && (
        <div className="fixed inset-0 z-[90] bg-black/95 flex items-center justify-center p-2" onClick={() => setPhotoSrc(null)}>
          <img src={photoSrc} alt="" className="max-w-full max-h-[92vh] object-contain" />
          <button onClick={() => setPhotoSrc(null)} className="absolute top-2 right-2 text-white/80 hover:text-white bg-black/60 rounded-full p-1.5"><Icon name="X" size={16} /></button>
        </div>
      )}
    </>
  );
}
