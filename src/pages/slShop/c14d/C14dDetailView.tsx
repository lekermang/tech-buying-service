import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import {
  c14dApi,
  fmt,
  fmtDate,
  STATUS_BADGE,
  type C14dDetail,
  type C14dCashAccount,
} from "./types";
import { printContract14d } from "./printContract14d";

type Props = {
  token: string;
  contractId: number;
  onBack: () => void;
};

const card = "rounded-xl bg-[#141414] border border-[#1F1F1F] p-3 sm:p-4";
const lbl = "text-[10px] uppercase tracking-wider text-white/50 font-semibold";

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

  useEffect(() => {
    c14dApi<{ accounts: C14dCashAccount[] }>(token, "cash_accounts").then(r => {
      if (r.ok && r.data) {
        setAccounts(r.data.accounts);
        const def = r.data.accounts.find(a => a.is_default) || r.data.accounts[0];
        if (def) setPayAccountId(String(def.id));
      }
    });
  }, [token]);

  // photo modal
  const [photoSrc, setPhotoSrc] = useState<string | null>(null);

  // confirms
  const [confirm, setConfirm] = useState<null | { kind: "terminate" | "close"; reason?: string }>(null);
  const [confirmSaving, setConfirmSaving] = useState(false);

  const reload = async () => {
    setLoading(true);
    const r = await c14dApi<C14dDetail>(token, "get", { params: { id: contractId } });
    setLoading(false);
    if (!r.ok || !r.data) {
      setErr(r.error || "Не удалось загрузить");
      return;
    }
    setC(r.data);
    setErr(null);
  };

  useEffect(() => { reload();   }, [contractId]);

  const submitPayment = async () => {
    if (!c) return;
    const a = Number(paySum);
    if (!a || a <= 0) { setErr("Сумма должна быть больше 0"); return; }
    setPaySaving(true);
    const r = await c14dApi(token, "payment", {
      method: "POST",
      body: {
        contract_id: c.id,
        amount: a,
        payment_type: payType,
        comment: payComment || null,
        cash_account_id: payAccountId ? Number(payAccountId) : null,
        skip_cash: paySkipCash,
      },
    });
    setPaySaving(false);
    if (!r.ok) { setErr(r.error || "Ошибка платежа"); return; }
    setPayOpen(false); setPaySum(""); setPayComment(""); setPayType("partial"); setPaySkipCash(false);
    reload();
  };

  const submitConfirm = async () => {
    if (!c || !confirm) return;
    setConfirmSaving(true);
    const action = confirm.kind === "terminate" ? "terminate" : "close";
    const r = await c14dApi(token, action, {
      method: "POST",
      body: { contract_id: c.id, reason: confirm.reason },
    });
    setConfirmSaving(false);
    if (!r.ok) { setErr(r.error || "Ошибка"); return; }
    setConfirm(null);
    reload();
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-white/40">
        <Icon name="Loader2" size={20} className="animate-spin inline" />
      </div>
    );
  }
  if (err && !c) {
    return (
      <div className="text-center py-8">
        <div className="text-red-300 mb-3">{err}</div>
        <button onClick={onBack} className="text-white/60 hover:text-white text-sm">← Назад</button>
      </div>
    );
  }
  if (!c) return null;

  const badge = STATUS_BADGE[c.status];
  const passport = c.passport_series ? `${c.passport_series} ${c.passport_number || ""}` : "—";
  const passportFull = c.passport_issued_by ? `${passport}, выдан ${c.passport_issued_by} ${fmtDate(c.passport_issue_date)}` : passport;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <button onClick={onBack} className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm">
          <Icon name="ChevronLeft" size={16} /> К списку
        </button>
        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => printContract14d(c)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FFD700]/10 hover:bg-[#FFD700]/20 border border-[#FFD700]/30 text-[#FFD700] text-xs font-bold uppercase tracking-wide">
            <Icon name="Printer" size={13} /> Печать / PDF
          </button>
          {c.status === "active" && (
            <>
              <button onClick={() => setPayOpen(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-wide">
                <Icon name="Wallet" size={13} /> Внести платёж
              </button>
              {Number(c.remaining_debt) <= 0 && (
                <button onClick={() => setConfirm({ kind: "close" })} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-300 text-xs font-bold uppercase tracking-wide">
                  <Icon name="CheckCircle2" size={13} /> Закрыть
                </button>
              )}
              <button onClick={() => setConfirm({ kind: "terminate" })} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 text-xs font-bold uppercase tracking-wide">
                <Icon name="Ban" size={13} /> Расторгнуть
              </button>
            </>
          )}
        </div>
      </div>

      {/* Шапка */}
      <div className={card}>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="font-oswald font-bold text-lg uppercase tracking-wide text-[#FFD700]">{c.contract_number}</div>
          <span className={`text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-wide font-semibold ${badge.cls}`}>{badge.l}</span>
          {c.overdue && (
            <span className="text-[10px] px-2 py-0.5 rounded-full border bg-red-500/15 text-red-300 border-red-500/30 uppercase tracking-wide font-semibold">
              Просрочка {c.overdue_days} дн.
            </span>
          )}
        </div>
        <div className="text-[12px] text-white/50 mt-1">
          Создан {fmtDate(c.created_at)} {c.created_by ? `· ${c.created_by}` : ""}
        </div>
      </div>

      {/* Финансы */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { l: "Сумма выдачи", v: c.amount, c: "text-white" },
          { l: "К возврату (макс)", v: c.total_due, c: "text-[#FFD700]" },
          { l: "Оплачено", v: c.paid_total, c: "text-emerald-300" },
          { l: "Остаток", v: c.remaining_debt, c: Number(c.remaining_debt) > 0 ? "text-red-300" : "text-emerald-300" },
        ].map(x => (
          <div key={x.l} className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-2.5">
            <div className={lbl}>{x.l}</div>
            <div className={`font-oswald text-base font-bold ${x.c}`}>{fmt(x.v)} ₽</div>
          </div>
        ))}
      </div>

      {/* Сумма на сегодня (досрочный выкуп) */}
      {c.status === "active" && c.today_calc && (
        <div className="rounded-xl bg-gradient-to-br from-emerald-500/15 via-[#FFD700]/8 to-transparent border border-emerald-500/30 p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-2">
            <Icon name="Zap" size={16} className="text-emerald-300" />
            <h3 className="font-oswald uppercase text-sm tracking-wide text-emerald-300">
              {c.today_calc.is_early ? "Досрочный выкуп · сумма на сегодня" : "Сумма на сегодня"}
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="rounded-lg bg-black/30 border border-white/5 p-2.5">
              <div className={lbl}>Прошло дней</div>
              <div className="font-oswald text-base font-bold text-white">
                {c.today_calc.days_passed_raw < 0 ? 0 : c.today_calc.days_passed_raw} <span className="text-white/40 text-sm">из {c.term_days}</span>
              </div>
            </div>
            <div className="rounded-lg bg-black/30 border border-white/5 p-2.5">
              <div className={lbl}>% за фактич. дни</div>
              <div className="font-oswald text-base font-bold text-orange-300">{fmt(c.today_calc.interest_today)} ₽</div>
            </div>
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-2.5">
              <div className={lbl + " text-emerald-300/80"}>К возврату сегодня</div>
              <div className="font-oswald text-lg font-bold text-emerald-300">{fmt(c.today_calc.today_due_full)} ₽</div>
            </div>
            <div className="rounded-lg bg-black/30 border border-white/5 p-2.5">
              <div className={lbl}>Доплатить сейчас</div>
              <div className={`font-oswald text-lg font-bold ${Number(c.today_calc.today_remaining) > 0 ? "text-[#FFD700]" : "text-emerald-300"}`}>
                {fmt(c.today_calc.today_remaining)} ₽
              </div>
            </div>
          </div>
          {c.today_calc.is_early && c.today_calc.saving > 0 && (
            <div className="mt-2 text-[12px] text-emerald-300/90 flex items-center gap-1.5">
              <Icon name="Sparkles" size={12} />
              Клиент сэкономит <b>{fmt(c.today_calc.saving)} ₽</b> по сравнению с полным сроком ({fmt(c.today_calc.full_due)} ₽).
            </div>
          )}
        </div>
      )}

      {/* Клиент */}
      <div className={card}>
        <div className="flex items-center gap-2 mb-2">
          <Icon name="User" size={14} className="text-[#FFD700]" />
          <h3 className="font-oswald uppercase text-sm tracking-wide">Клиент</h3>
        </div>
        <div className="grid sm:grid-cols-2 gap-2 text-sm">
          <Row l="ФИО" v={c.client_name} />
          <Row l="Дата рождения" v={fmtDate(c.client_birth_date)} />
          <Row l="Паспорт" v={passportFull} />
          <Row l="Телефон" v={c.client_phone} />
          {c.client_email && <Row l="E-mail" v={c.client_email} />}
        </div>
      </div>

      {/* Имущество */}
      <div className={card}>
        <div className="flex items-center gap-2 mb-2">
          <Icon name="Package" size={14} className="text-[#FFD700]" />
          <h3 className="font-oswald uppercase text-sm tracking-wide">Имущество</h3>
        </div>
        <div className="grid sm:grid-cols-2 gap-2 text-sm">
          <Row l="Тип" v={c.item_type} />
          <Row l="Состояние" v={c.condition} />
          <Row l="Марка / модель" v={[c.item_brand, c.item_model].filter(Boolean).join(" ")} />
          <Row l="Серийный номер" v={c.serial_number} />
          {(c.accessories?.length ?? 0) > 0 && <Row l="Комплектация" v={(c.accessories || []).join(", ")} />}
          {c.item_notes && <Row l="Отметки" v={c.item_notes} />}
        </div>
      </div>

      {/* Условия */}
      <div className={card}>
        <div className="flex items-center gap-2 mb-2">
          <Icon name="ScrollText" size={14} className="text-[#FFD700]" />
          <h3 className="font-oswald uppercase text-sm tracking-wide">Условия</h3>
        </div>
        <div className="grid sm:grid-cols-2 gap-2 text-sm">
          <Row l="Ставка" v={`${fmt(c.interest_rate)}% в день`} />
          <Row l="Срок" v={`${c.term_days} дней`} />
          <Row l="Дата начала" v={fmtDate(c.start_date)} />
          <Row l="Дата окончания" v={fmtDate(c.end_date)} />
        </div>
        <div className="mt-2 rounded-lg bg-[#FFD700]/5 border border-[#FFD700]/20 px-3 py-2 text-[12px] text-white/70">
          <Icon name="Info" size={12} className="inline mr-1 text-[#FFD700]" />
          Запрет продажи имущества третьим лицам в течение 14 дней с момента подписания договора.
        </div>
      </div>

      {/* Фото */}
      {c.photos && c.photos.length > 0 && (
        <div className={card}>
          <div className="flex items-center gap-2 mb-2">
            <Icon name="Camera" size={14} className="text-[#FFD700]" />
            <h3 className="font-oswald uppercase text-sm tracking-wide">Фото</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {c.photos.map(p => (
              <button key={p.id} onClick={() => setPhotoSrc(p.file_url)} className="relative group rounded-lg overflow-hidden border border-[#222] hover:border-[#FFD700]/40 bg-black/30">
                <img src={p.file_url} alt={p.photo_type} className="w-full h-32 sm:h-40 object-contain" />
                <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-[10px] text-white/80 px-2 py-1 uppercase tracking-wide font-semibold">
                  {p.photo_type === "passport" ? "Паспорт" : "Устройство"}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Платежи */}
      <div className={card}>
        <div className="flex items-center gap-2 mb-2">
          <Icon name="History" size={14} className="text-[#FFD700]" />
          <h3 className="font-oswald uppercase text-sm tracking-wide">Платежи ({c.payments?.length || 0})</h3>
        </div>
        {(c.payments?.length || 0) === 0 ? (
          <div className="text-center py-3 text-white/40 text-sm">Платежей пока нет</div>
        ) : (
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] text-white/40 uppercase tracking-wider">
                  <th className="text-left p-1.5">Дата</th>
                  <th className="text-right p-1.5">Сумма</th>
                  <th className="text-left p-1.5">Тип</th>
                  <th className="text-left p-1.5">Доход</th>
                  <th className="text-left p-1.5">Касса</th>
                  <th className="text-left p-1.5">Принял</th>
                </tr>
              </thead>
              <tbody>
                {c.payments.map(p => {
                  const incomeLbl = p.income_type === "interest" ? "Проценты" :
                    p.income_type === "principal" ? "Тело" :
                    p.income_type === "mixed" ? "Смешанный" :
                    p.income_type === "penalty" ? "Пеня" : "—";
                  return (
                    <tr key={p.id} className="border-t border-[#1F1F1F]">
                      <td className="p-1.5 text-white/70">{fmtDate(p.paid_at)}</td>
                      <td className="p-1.5 text-right text-emerald-300 font-semibold">{fmt(p.amount)} ₽</td>
                      <td className="p-1.5 text-white/60">{p.payment_type === "full" ? "Полный" : "Частичный"}</td>
                      <td className="p-1.5 text-white/60">{incomeLbl}</td>
                      <td className="p-1.5 text-white/60">
                        {p.cash_movement_id ? (
                          <span className="inline-flex items-center gap-1 text-emerald-300/80">
                            <Icon name="Wallet" size={11} /> в кассу
                          </span>
                        ) : <span className="text-white/30">не в кассу</span>}
                      </td>
                      <td className="p-1.5 text-white/60">{p.recorded_by || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Журнал действий */}
      {(c.log?.length || 0) > 0 && (
        <div className={card}>
          <div className="flex items-center gap-2 mb-2">
            <Icon name="ClipboardList" size={14} className="text-[#FFD700]" />
            <h3 className="font-oswald uppercase text-sm tracking-wide">Журнал</h3>
          </div>
          <div className="space-y-1.5 max-h-60 overflow-y-auto scrollbar-premium">
            {c.log.map(l => (
              <div key={l.id} className="text-[12px] text-white/70 flex items-start gap-2">
                <span className="text-white/40 shrink-0">{fmtDate(l.created_at)}</span>
                <span className="text-[#FFD700] shrink-0 font-semibold">{l.action}</span>
                <span className="text-white/50 truncate">{l.actor_name || "—"}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Модал внесения платежа */}
      {payOpen && (
        <div className="fixed inset-0 z-[80] bg-black/70 flex items-center justify-center p-3" onClick={() => !paySaving && setPayOpen(false)}>
          <div className="w-full max-w-md rounded-xl bg-[#141414] border border-[#1F1F1F] p-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-oswald uppercase text-base tracking-wide">Внести платёж</h3>
              <button onClick={() => setPayOpen(false)} className="text-white/40 hover:text-white"><Icon name="X" size={16} /></button>
            </div>
            <div className="text-[12px] text-white/60 mb-2">
              Остаток долга: <b className="text-red-300">{fmt(c.remaining_debt)} ₽</b>
            </div>
            {c.today_calc && c.today_calc.is_early && Number(c.today_calc.today_remaining) > 0 && (
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-2.5 mb-3 text-[12px] text-emerald-300/90">
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon name="Zap" size={12} /> <b>Досрочный выкуп · {c.today_calc.days_passed_raw < 0 ? 0 : c.today_calc.days_passed_raw} дн. из {c.term_days}</b>
                </div>
                <div>К возврату сегодня: <b className="text-emerald-300">{fmt(c.today_calc.today_due_full)} ₽</b></div>
                <div>Доплатить: <b className="text-[#FFD700]">{fmt(c.today_calc.today_remaining)} ₽</b> {c.today_calc.saving > 0 && <span className="text-emerald-300/80">(экономия {fmt(c.today_calc.saving)} ₽)</span>}</div>
                <button
                  type="button"
                  onClick={() => { setPaySum(String(c.today_calc!.today_remaining)); setPayType("full"); }}
                  className="mt-2 w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-200 text-[11px] font-bold uppercase tracking-wide"
                >
                  <Icon name="ChevronsRight" size={12} /> Подставить досрочный выкуп
                </button>
              </div>
            )}
            <div className="space-y-3">
              <div>
                <label className={lbl}>Сумма платежа, ₽</label>
                <input className="w-full rounded-lg bg-[#0F0F0F] border border-[#222] focus:border-[#FFD700] outline-none px-3 py-2 text-base font-bold text-white" type="number" value={paySum} onChange={e => setPaySum(e.target.value)} />
                {payType === "full" && c.today_calc && (
                  <div className="text-[10px] text-emerald-300/70 mt-1">
                    При «полный расчёт» сумма будет автоматически приведена к {fmt(c.today_calc.today_remaining)} ₽ (на сегодня)
                  </div>
                )}
              </div>
              <div>
                <label className={lbl}>Тип платежа</label>
                <select className="w-full rounded-lg bg-[#0F0F0F] border border-[#222] focus:border-[#FFD700] outline-none px-3 py-2 text-sm text-white" value={payType} onChange={e => setPayType(e.target.value as "partial" | "full")}>
                  <option value="partial">Частичный платёж</option>
                  <option value="full">Полный расчёт</option>
                </select>
              </div>
              <div>
                <label className={lbl}>Касса прихода</label>
                <select
                  className="w-full rounded-lg bg-[#0F0F0F] border border-[#222] focus:border-[#FFD700] outline-none px-3 py-2 text-sm text-white"
                  value={payAccountId}
                  onChange={e => setPayAccountId(e.target.value)}
                  disabled={paySkipCash}
                >
                  {accounts.length === 0 && <option value="">Нет активных касс</option>}
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({fmt(a.balance)} ₽){a.is_default ? " ★" : ""}
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-2 text-[11px] text-white/60 mt-1.5 cursor-pointer">
                  <input type="checkbox" checked={paySkipCash} onChange={e => setPaySkipCash(e.target.checked)} className="accent-[#FFD700]" />
                  Не вносить в кассу (только зафиксировать платёж)
                </label>
              </div>
              <div>
                <label className={lbl}>Комментарий</label>
                <textarea className="w-full rounded-lg bg-[#0F0F0F] border border-[#222] focus:border-[#FFD700] outline-none px-3 py-2 text-sm text-white min-h-[60px] resize-y" value={payComment} onChange={e => setPayComment(e.target.value)} />
              </div>
              <button onClick={submitPayment} disabled={paySaving} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#FFD700] hover:bg-[#FFE34D] text-black font-bold uppercase tracking-wider text-sm transition active:scale-95 disabled:opacity-50">
                {paySaving ? <Icon name="Loader2" size={14} className="animate-spin" /> : <Icon name="Check" size={14} />}
                Подтвердить платёж
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модал расторжения / закрытия */}
      {confirm && (
        <div className="fixed inset-0 z-[80] bg-black/70 flex items-center justify-center p-3" onClick={() => !confirmSaving && setConfirm(null)}>
          <div className="w-full max-w-sm rounded-xl bg-[#141414] border border-[#1F1F1F] p-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-2 text-red-300">
              <Icon name="AlertTriangle" size={18} />
              <h3 className="font-oswald uppercase text-base tracking-wide">
                {confirm.kind === "terminate" ? "Расторгнуть договор?" : "Закрыть договор?"}
              </h3>
            </div>
            <div className="text-[12px] text-white/60 mb-3">
              {confirm.kind === "terminate"
                ? "Действие необратимо. Договор будет помечен как «расторгнут»."
                : "Договор будет переведён в архив со статусом «завершён»."}
            </div>
            {confirm.kind === "terminate" && (
              <textarea
                placeholder="Причина расторжения (опционально)"
                className="w-full mb-3 rounded-lg bg-[#0F0F0F] border border-[#222] focus:border-[#FFD700] outline-none px-3 py-2 text-sm text-white min-h-[60px] resize-y"
                value={confirm.reason || ""}
                onChange={e => setConfirm({ ...confirm, reason: e.target.value })}
              />
            )}
            <div className="flex gap-2">
              <button onClick={() => setConfirm(null)} disabled={confirmSaving} className="flex-1 px-3 py-2 rounded-lg bg-[#0F0F0F] border border-[#222] text-white/70 text-sm font-semibold">Отмена</button>
              <button onClick={submitConfirm} disabled={confirmSaving} className={`flex-1 px-3 py-2 rounded-lg text-sm font-bold uppercase tracking-wide ${confirm.kind === "terminate" ? "bg-red-500/80 hover:bg-red-500 text-white" : "bg-[#FFD700] hover:bg-[#FFE34D] text-black"} disabled:opacity-50`}>
                {confirmSaving ? <Icon name="Loader2" size={14} className="animate-spin inline" /> : "Подтвердить"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модал просмотра фото */}
      {photoSrc && (
        <div className="fixed inset-0 z-[90] bg-black/90 flex items-center justify-center p-3" onClick={() => setPhotoSrc(null)}>
          <img src={photoSrc} alt="" className="max-w-full max-h-[90vh] object-contain" />
          <button onClick={() => setPhotoSrc(null)} className="absolute top-3 right-3 text-white/80 hover:text-white bg-black/60 rounded-full p-2"><Icon name="X" size={18} /></button>
        </div>
      )}

      {err && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 px-3 py-2 text-sm">{err}</div>
      )}
    </div>
  );
}

function Row({ l, v }: { l: string; v: string | number | null | undefined }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">{l}</div>
      <div className="text-white/90">{v || "—"}</div>
    </div>
  );
}