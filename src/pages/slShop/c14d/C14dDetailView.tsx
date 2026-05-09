import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import {
  c14dApi, fmt, fmtDate, STATUS_BADGE,
  type C14dDetail, type C14dCashAccount,
} from "./types";
import { SYNC_URL } from "../../staffAvitoPro/types";
import { printContract14d } from "./printContract14d";
import {
  SLSection, SLField, SLInput, SLTextarea, SLSelect,
  SLButton, SLPill, SLStat, SLModal, SLCheckbox, SLGrid,
} from "../slUI";

type Props = { token: string; contractId: number; onBack: () => void };

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
  type AvitoMatch = { id: number; title: string; price: number | null; url: string | null; main_photo: string | null };
  const [avitoMatches, setAvitoMatches] = useState<AvitoMatch[] | null>(null);
  const [avitoModalOpen, setAvitoModalOpen] = useState(false);
  const [avitoArchiving, setAvitoArchiving] = useState<number | null>(null);

  const [photoSrc, setPhotoSrc] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<null | { kind: "terminate" | "close"; reason?: string }>(null);
  const [confirmSaving, setConfirmSaving] = useState(false);

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

  if (loading) return <div className="text-center py-8 text-white/40"><Icon name="Loader2" size={18} className="animate-spin inline" /></div>;
  if (err && !c) return (
    <div className="text-center py-6">
      <div className="text-red-300 text-sm mb-2">{err}</div>
      <button onClick={onBack} className="text-white/60 hover:text-white text-sm">← Назад</button>
    </div>
  );
  if (!c) return null;

  const badge = STATUS_BADGE[c.status];
  const passport = c.passport_series ? `${c.passport_series} ${c.passport_number || ""}` : "";
  const passportFull = c.passport_issued_by ? `${passport}, ${c.passport_issued_by} ${fmtDate(c.passport_issue_date)}` : passport;

  return (
    <div className="space-y-2">
      {/* Шапка с действиями */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <button onClick={onBack} className="inline-flex items-center gap-1 text-white/60 hover:text-white text-[12px] font-semibold">
          <Icon name="ChevronLeft" size={14} /> К списку
        </button>
        <div className="flex flex-wrap gap-1">
          <SLButton variant="goldOutline" size="sm" icon="Printer" onClick={() => printContract14d(c)}>Печать</SLButton>
          {c.status === "active" && (
            <>
              <SLButton variant="success" size="sm" icon="Wallet" onClick={() => setPayOpen(true)}>Платёж</SLButton>
              {Number(c.remaining_debt) <= 0 && (
                <SLButton variant="dark" size="sm" icon="CheckCircle2" onClick={() => setConfirm({ kind: "close" })}>Закрыть</SLButton>
              )}
              <SLButton variant="danger" size="sm" icon="Ban" onClick={() => setConfirm({ kind: "terminate" })}>Расторгнуть</SLButton>
            </>
          )}
        </div>
      </div>

      {/* Шапка договора */}
      <div className="rounded-xl bg-[#101010] border border-[#1A1A1A] px-3 py-2 flex items-center gap-2 flex-wrap">
        <div className="font-oswald font-bold text-[16px] uppercase tracking-wide text-[#FFD700]">{c.contract_number}</div>
        <span className={`text-[9px] px-2 py-0.5 rounded-full border uppercase tracking-wide font-bold ${badge.cls}`}>{badge.l}</span>
        {c.overdue && <SLPill color="red" icon="AlertCircle">Просрочка {c.overdue_days} дн.</SLPill>}
        <div className="text-[10px] text-white/40 ml-auto">{fmtDate(c.created_at)} · {c.created_by || "—"}</div>
      </div>

      {/* Финансы */}
      <SLGrid cols={4}>
        <SLStat label="Выдача" value={`${fmt(c.amount)} ₽`} />
        <SLStat label="К возврату макс" value={`${fmt(c.total_due)} ₽`} color="gold" />
        <SLStat label="Оплачено" value={`${fmt(c.paid_total)} ₽`} color="green" />
        <SLStat label="Остаток" value={`${fmt(c.remaining_debt)} ₽`} color={Number(c.remaining_debt) > 0 ? "red" : "green"} />
      </SLGrid>

      {/* Сумма на сегодня */}
      {c.status === "active" && c.today_calc && (
        <div className="rounded-xl bg-gradient-to-br from-emerald-500/15 via-[#FFD700]/4 to-transparent border border-emerald-500/30 p-2.5 sm:p-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Icon name="Zap" size={12} className="text-emerald-300" />
            <h3 className="font-oswald uppercase text-[12px] tracking-wide font-bold text-emerald-300">
              {c.today_calc.is_early ? "Досрочный выкуп · сегодня" : "Сумма на сегодня"}
            </h3>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            <SLStat label="Прошло дней" value={`${Math.max(0, c.today_calc.days_passed_raw)}/${c.term_days}`} />
            <SLStat label="% за факт. дни" value={`${fmt(c.today_calc.interest_today)} ₽`} color="orange" />
            <SLStat label="К возврату сегодня" value={`${fmt(c.today_calc.today_due_full)} ₽`} color="green" />
            <SLStat label="Доплатить" value={`${fmt(c.today_calc.today_remaining)} ₽`} color={c.today_calc.today_remaining > 0 ? "gold" : "green"} />
          </div>
          {c.today_calc.is_early && c.today_calc.saving > 0 && (
            <div className="mt-1.5 text-[10px] text-emerald-300/85 flex items-center gap-1">
              <Icon name="Sparkles" size={10} /> Экономия <b>{fmt(c.today_calc.saving)} ₽</b> vs полный срок ({fmt(c.today_calc.full_due)} ₽)
            </div>
          )}
        </div>
      )}

      {/* Клиент */}
      <SLSection icon="User" title="Клиент">
        <SLGrid cols={2}>
          <Row l="ФИО" v={c.client_name} />
          <Row l="Дата рождения" v={fmtDate(c.client_birth_date)} />
          <Row l="Паспорт" v={passportFull} />
          <Row l="Телефон" v={c.client_phone} />
          {c.client_email && <Row l="E-mail" v={c.client_email} />}
        </SLGrid>
      </SLSection>

      {/* Имущество */}
      <SLSection icon="Package" title="Имущество">
        <SLGrid cols={2}>
          <Row l="Тип" v={c.item_type} />
          <Row l="Состояние" v={c.condition} />
          <Row l="Марка / модель" v={[c.item_brand, c.item_model].filter(Boolean).join(" ")} />
          <Row l="Серийный" v={c.serial_number} />
          {(c.accessories?.length ?? 0) > 0 && <Row l="Комплект" v={(c.accessories || []).join(", ")} />}
          {c.item_notes && <Row l="Отметки" v={c.item_notes} />}
        </SLGrid>
      </SLSection>

      {/* Условия */}
      <SLSection icon="ScrollText" title="Условия">
        <SLGrid cols={4}>
          <Row l="Ставка" v={`${fmt(c.interest_rate)}%/день`} />
          <Row l="Срок" v={`${c.term_days} дн.`} />
          <Row l="Начало" v={fmtDate(c.start_date)} />
          <Row l="Конец" v={fmtDate(c.end_date)} />
        </SLGrid>
        <div className="mt-1.5 rounded-md bg-[#FFD700]/5 border border-[#FFD700]/15 px-2 py-1 text-[10px] text-white/60">
          <Icon name="Info" size={10} className="inline mr-1 text-[#FFD700]" />
          Запрет продажи имущества третьим лицам в течение 14 дней.
        </div>
      </SLSection>

      {/* Фото */}
      {c.photos && c.photos.length > 0 && (
        <SLSection icon="Camera" title="Фото">
          <div className="grid grid-cols-2 gap-1.5">
            {c.photos.map(p => (
              <button key={p.id} onClick={() => setPhotoSrc(p.file_url)} className="relative group rounded-md overflow-hidden border border-[#1F1F1F] hover:border-[#FFD700]/40 bg-black/30">
                <img src={p.file_url} alt={p.photo_type} className="w-full h-24 sm:h-28 object-cover" />
                <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-[9px] text-white/85 px-1.5 py-0.5 uppercase tracking-wide font-bold">
                  {p.photo_type === "passport" ? "Паспорт" : "Устройство"}
                </div>
              </button>
            ))}
          </div>
        </SLSection>
      )}

      {/* Платежи */}
      <SLSection icon="History" title={`Платежи · ${c.payments?.length || 0}`}>
        {(c.payments?.length || 0) === 0 ? (
          <div className="text-center py-2 text-white/35 text-[12px]">Платежей пока нет</div>
        ) : (
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="text-[9px] text-white/40 uppercase tracking-wider">
                  <th className="text-left p-1">Дата</th>
                  <th className="text-right p-1">Сумма</th>
                  <th className="text-left p-1">Тип</th>
                  <th className="text-left p-1">Доход</th>
                  <th className="text-left p-1">Касса</th>
                  <th className="text-left p-1">Принял</th>
                </tr>
              </thead>
              <tbody>
                {c.payments.map(p => {
                  const il = p.income_type === "interest" ? "%" : p.income_type === "principal" ? "Тело" : p.income_type === "mixed" ? "Микс" : p.income_type === "penalty" ? "Пеня" : "—";
                  return (
                    <tr key={p.id} className="border-t border-[#1A1A1A]">
                      <td className="p-1 text-white/70">{fmtDate(p.paid_at)}</td>
                      <td className="p-1 text-right text-emerald-300 font-bold">{fmt(p.amount)} ₽</td>
                      <td className="p-1 text-white/55">{p.payment_type === "full" ? "Полн." : "Част."}</td>
                      <td className="p-1 text-white/55">{il}</td>
                      <td className="p-1">
                        {p.cash_movement_id
                          ? <span className="inline-flex items-center gap-0.5 text-emerald-300/80 text-[11px]"><Icon name="Wallet" size={10} /></span>
                          : <span className="text-white/25 text-[10px]">—</span>}
                      </td>
                      <td className="p-1 text-white/55 truncate max-w-[80px]">{p.recorded_by || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SLSection>

      {/* Журнал */}
      {(c.log?.length || 0) > 0 && (
        <SLSection icon="ClipboardList" title="Журнал">
          <div className="space-y-0.5 max-h-40 overflow-y-auto scrollbar-premium pr-1">
            {c.log.map(l => (
              <div key={l.id} className="text-[11px] text-white/65 flex items-center gap-1.5 py-0.5">
                <span className="text-white/35 shrink-0 w-16">{fmtDate(l.created_at)}</span>
                <span className="text-[#FFD700] shrink-0 font-semibold uppercase tracking-wide text-[10px]">{l.action}</span>
                <span className="text-white/40 truncate">{l.actor_name || "—"}</span>
              </div>
            ))}
          </div>
        </SLSection>
      )}

      {/* Модал платежа */}
      <SLModal
        open={payOpen}
        onClose={() => !paySaving && setPayOpen(false)}
        title="Внести платёж"
        icon="Wallet"
        footer={
          <SLButton
            variant="gold"
            size="lg"
            icon={paySaving ? "Loader2" : "Check"}
            onClick={submitPayment}
            disabled={paySaving}
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

      {/* Просмотр фото */}
      {photoSrc && (
        <div className="fixed inset-0 z-[90] bg-black/95 flex items-center justify-center p-2" onClick={() => setPhotoSrc(null)}>
          <img src={photoSrc} alt="" className="max-w-full max-h-[92vh] object-contain" />
          <button onClick={() => setPhotoSrc(null)} className="absolute top-2 right-2 text-white/80 hover:text-white bg-black/60 rounded-full p-1.5"><Icon name="X" size={16} /></button>
        </div>
      )}

      {err && <div className="rounded-md bg-red-500/10 border border-red-500/30 text-red-300 px-2.5 py-1.5 text-[12px]">{err}</div>}
    </div>
  );
}

function Row({ l, v }: { l: string; v: string | number | null | undefined }) {
  return (
    <div className="min-w-0">
      <div className="text-[9px] uppercase tracking-wider text-white/40 font-bold">{l}</div>
      <div className="text-[12px] text-white/85 truncate">{v || "—"}</div>
    </div>
  );
}