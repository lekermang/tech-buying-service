import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Order, printReceipt, printAct, printActHTML, sendReceiptByEmail, sendIntakeEmailBundle } from "../types";
import { useStaffToast } from "../../staff/StaffToast";
import { humanizeError } from "../staffTab/humanizeError";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { AuthHeader } from "./orderCardActionsTypes";
import { INP, LBL } from "../types";

type EmailDoc = "receipt" | "intake_bundle";

type Props = {
  o: Order;
  isOwner: boolean;
  token: string;
  authHeader: AuthHeader;
  onDelete: (id: number) => void;
};

export default function OrderCardDocsBlock({ o, isOwner, token, authHeader, onDelete }: Props) {
  const toast = useStaffToast();
  const [actSending, setActSending] = useState(false);
  const [actSent, setActSent] = useState(false);
  const [emailDialog, setEmailDialog] = useState<EmailDoc | null>(null);
  const [emailInput, setEmailInput] = useState(o.client_email || "");
  const [emailSending, setEmailSending] = useState(false);

  const openEmailDialog = (doc: EmailDoc) => {
    setEmailInput(o.client_email || "");
    setEmailDialog(doc);
  };

  const handleSendEmail = async () => {
    if (!emailInput.trim() || !emailDialog) return;
    setEmailSending(true);
    const label = emailDialog === "intake_bundle" ? "Акт приёмки + гарантия" : "Гарантийный чек";
    const tid = toast.loading(`Отправляю «${label}» на ${emailInput}...`);
    try {
      if (emailDialog === "intake_bundle") {
        await sendIntakeEmailBundle(o, emailInput.trim(), token);
      } else {
        await sendReceiptByEmail(o, emailInput.trim(), token);
      }
      toast.update(tid, { kind: "success", message: `Отправлено на ${emailInput}`, duration: 4000 });
      setEmailDialog(null);
      setEmailInput("");
    } catch (e) {
      toast.update(tid, { kind: "error", message: String((e as Error).message), duration: 5000 });
    } finally {
      setEmailSending(false);
    }
  };

  const handleSendAct = async () => {
    setActSending(true);
    const tid = toast.loading(`Отправляю акт по заявке #${o.id} в Telegram...`);
    try {
      const res = await fetch("https://functions.poehali.dev/a105aede-d55d-4b99-9d3e-5e977887aa04", {
        method: "POST",
        headers: { "Content-Type": "application/json", [authHeader]: token },
        body: JSON.stringify({ action: "send_act", id: o.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        toast.update(tid, {
          kind: "error",
          message: humanizeError({ action: "send_act", httpStatus: res.status, serverError: data.error }),
          duration: 6000,
        });
      } else {
        setActSent(true);
        setTimeout(() => setActSent(false), 3000);
        toast.update(tid, { kind: "success", message: "Акт отправлен в Telegram", duration: 3000 });
      }
    } catch (e) {
      toast.update(tid, {
        kind: "error",
        message: humanizeError({ action: "send_act", thrown: e }),
        duration: 6000,
      });
    } finally {
      setActSending(false);
    }
  };

  return (
    <>
    <div className="relative overflow-hidden rounded-xl border border-[#FFD700]/20 bg-gradient-to-br from-[#FFD700]/[0.05] via-[#0E0E0E] to-[#0A0A0A] p-3 shadow-[0_0_30px_-15px_rgba(255,215,0,0.3)]">
      {/* декоративные блики */}
      <div className="pointer-events-none absolute -top-16 -left-10 w-40 h-40 bg-[#FFD700]/10 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -right-10 w-40 h-40 bg-amber-500/8 rounded-full blur-3xl" />

      {/* Header */}
      <div className="relative flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#FFD700] to-yellow-600 text-black flex items-center justify-center shrink-0 shadow-lg shadow-[#FFD700]/20">
          <Icon name="FileText" size={13} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-oswald font-bold text-white text-[12px] uppercase tracking-wider leading-tight">Документы и действия</div>
          <div className="font-roboto text-[10px] text-white/40 leading-tight">акт приёмки, чек, отправка клиенту</div>
        </div>
        {actSent && (
          <span className="flex items-center gap-1 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[9px] font-roboto animate-in fade-in zoom-in-95">
            <Icon name="Check" size={9} />Отправлен
          </span>
        )}
      </div>

      {/* Главная строка действий */}
      <div className="relative flex gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              disabled={actSending}
              className="btn-gold-premium flex-1 !py-3 disabled:opacity-50 disabled:cursor-not-allowed">
              <Icon
                name={actSending ? "Loader" : "FileText"}
                size={15}
                className={actSending ? "animate-spin" : ""}
              />
              <span className="relative">{actSending ? "Отправка..." : "Документы"}</span>
              <Icon name="ChevronDown" size={13} className="relative opacity-70" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-[260px] bg-gradient-to-br from-[#141414] to-[#0A0A0A] border border-[#FFD700]/20 shadow-2xl shadow-black/60 rounded-xl p-1.5 backdrop-blur-xl"
          >
            <DropdownMenuLabel className="font-oswald uppercase text-[9px] tracking-widest text-white/40 px-2 py-1.5">
              Акт приёмки
            </DropdownMenuLabel>

            <DropdownMenuItem
              onClick={handleSendAct}
              disabled={actSending}
              className="group/item rounded-lg cursor-pointer focus:bg-[#229ED9]/10 px-2 py-2 gap-2.5 transition-colors"
            >
              <div className="w-8 h-8 rounded-md bg-[#229ED9]/15 border border-[#229ED9]/30 flex items-center justify-center shrink-0">
                <Icon name="Send" size={14} className="text-[#229ED9]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-roboto text-[12px] text-white font-bold leading-tight">Отправить в Telegram</div>
                <div className="font-roboto text-[10px] text-white/40 leading-tight">клиенту через бота</div>
              </div>
              <Icon name="ChevronRight" size={12} className="text-white/30 group-hover/item:text-white/60 transition-colors" />
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => printActHTML(o)}
              className="group/item rounded-lg cursor-pointer focus:bg-[#FFD700]/10 px-2 py-2 gap-2.5 transition-colors"
            >
              <div className="w-8 h-8 rounded-md bg-[#FFD700]/15 border border-[#FFD700]/30 flex items-center justify-center shrink-0">
                <Icon name="Printer" size={14} className="text-[#FFD700]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-roboto text-[12px] text-white font-bold leading-tight">Распечатать акт</div>
                <div className="font-roboto text-[10px] text-white/40 leading-tight">HTML — на принтер</div>
              </div>
              <Icon name="ChevronRight" size={12} className="text-white/30 group-hover/item:text-white/60 transition-colors" />
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => printAct(o)}
              className="group/item rounded-lg cursor-pointer focus:bg-[#FFD700]/10 px-2 py-2 gap-2.5 transition-colors"
            >
              <div className="w-8 h-8 rounded-md bg-[#FFD700]/10 border border-[#FFD700]/20 flex items-center justify-center shrink-0">
                <Icon name="Download" size={14} className="text-[#FFD700]/80" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-roboto text-[12px] text-white font-bold leading-tight">Скачать .docx</div>
                <div className="font-roboto text-[10px] text-white/40 leading-tight">для редактирования</div>
              </div>
              <Icon name="ChevronRight" size={12} className="text-white/30 group-hover/item:text-white/60 transition-colors" />
            </DropdownMenuItem>

            <DropdownMenuSeparator className="bg-white/5 my-1" />

            <DropdownMenuLabel className="font-oswald uppercase text-[9px] tracking-widest text-white/40 px-2 py-1.5">
              Финансы
            </DropdownMenuLabel>

            <DropdownMenuItem
              onClick={() => printReceipt(o)}
              className="group/item rounded-lg cursor-pointer focus:bg-emerald-500/10 px-2 py-2 gap-2.5 transition-colors"
            >
              <div className="w-8 h-8 rounded-md bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <Icon name="Receipt" size={14} className="text-emerald-300" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-roboto text-[12px] text-white font-bold leading-tight">Чек / квитанция</div>
                <div className="font-roboto text-[10px] text-white/40 leading-tight">распечатать клиенту</div>
              </div>
              <Icon name="ChevronRight" size={12} className="text-white/30 group-hover/item:text-white/60 transition-colors" />
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => openEmailDialog("intake_bundle")}
              className="group/item rounded-lg cursor-pointer focus:bg-blue-500/10 px-2 py-2 gap-2.5 transition-colors"
            >
              <div className="w-8 h-8 rounded-md bg-blue-500/15 border border-blue-500/30 flex items-center justify-center shrink-0">
                <Icon name="MailCheck" size={14} className="text-blue-300" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-roboto text-[12px] text-white font-bold leading-tight">Акт приёмки + Гарантия</div>
                <div className="font-roboto text-[10px] text-white/40 leading-tight">2 документа на email клиенту</div>
              </div>
              <Icon name="ChevronRight" size={12} className="text-white/30 group-hover/item:text-white/60 transition-colors" />
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => openEmailDialog("receipt")}
              className="group/item rounded-lg cursor-pointer focus:bg-blue-400/10 px-2 py-2 gap-2.5 transition-colors"
            >
              <div className="w-8 h-8 rounded-md bg-blue-400/10 border border-blue-400/20 flex items-center justify-center shrink-0">
                <Icon name="Mail" size={14} className="text-blue-200" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-roboto text-[12px] text-white font-bold leading-tight">Гарантийный чек</div>
                <div className="font-roboto text-[10px] text-white/40 leading-tight">1 документ на email</div>
              </div>
              <Icon name="ChevronRight" size={12} className="text-white/30 group-hover/item:text-white/60 transition-colors" />
            </DropdownMenuItem>

            {isOwner && (
              <>
                <DropdownMenuSeparator className="bg-white/5 my-1" />
                <DropdownMenuLabel className="font-oswald uppercase text-[9px] tracking-widest text-rose-400/60 px-2 py-1.5">
                  Опасная зона
                </DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => onDelete(o.id)}
                  className="group/item rounded-lg cursor-pointer focus:bg-rose-500/15 px-2 py-2 gap-2.5 transition-colors"
                >
                  <div className="w-8 h-8 rounded-md bg-rose-500/15 border border-rose-500/30 flex items-center justify-center shrink-0">
                    <Icon name="Trash2" size={14} className="text-rose-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-roboto text-[12px] text-rose-300 font-bold leading-tight">Удалить заявку</div>
                    <div className="font-roboto text-[10px] text-rose-400/50 leading-tight">безвозвратно</div>
                  </div>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Быстрая кнопка «Чек» — премиум */}
        <button
          onClick={() => printReceipt(o)}
          title="Распечатать чек / квитанцию для клиента"
          className="relative font-roboto text-[11px] py-3 px-4 rounded-lg border border-emerald-500/40 bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent text-emerald-200 hover:from-emerald-500/25 hover:via-emerald-500/10 hover:border-emerald-500/70 hover:shadow-[0_0_18px_rgba(16,185,129,0.35)] active:scale-95 transition-all inline-flex items-center justify-center gap-1.5 min-h-[48px] shrink-0 overflow-hidden group"
        >
          <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />
          <Icon name="Receipt" size={14} className="drop-shadow-[0_0_4px_rgba(16,185,129,0.7)]" />
          <span className="hidden sm:inline font-bold relative">Чек</span>
        </button>

        {/* Кнопка «Email» */}
        <button
          onClick={() => openEmailDialog("intake_bundle")}
          title={o.client_email ? `Отправить на ${o.client_email}` : "Отправить акты на email клиенту"}
          className="relative font-roboto text-[11px] py-3 px-4 rounded-lg border border-blue-500/40 bg-gradient-to-br from-blue-500/15 via-blue-500/5 to-transparent text-blue-200 hover:from-blue-500/25 hover:border-blue-500/70 active:scale-95 transition-all inline-flex items-center justify-center gap-1.5 min-h-[48px] shrink-0"
        >
          <Icon name="Mail" size={14} />
          <span className="hidden sm:inline font-bold relative">Email</span>
          {o.client_email && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 absolute top-1.5 right-1.5" />}
        </button>
      </div>
    </div>

    {/* Диалог отправки на email */}
    {emailDialog && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
        <div className="w-full max-w-sm bg-gradient-to-br from-[#141414] to-[#0e0e0e] border border-[#FFD700]/20 rounded-2xl p-5 shadow-2xl shadow-black/80">
          {/* Шапка */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0">
              <Icon name={emailDialog === "intake_bundle" ? "MailCheck" : "Mail"} size={16} className="text-blue-300" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-oswald font-bold text-white text-sm uppercase tracking-wide">
                {emailDialog === "intake_bundle" ? "Акт приёмки + Гарантия" : "Гарантийный чек"}
              </div>
              <div className="font-roboto text-[10px] text-white/40">#{o.id} · {o.model || o.name}</div>
            </div>
            <button onClick={() => setEmailDialog(null)} className="text-white/30 hover:text-white/70 transition-colors">
              <Icon name="X" size={16} />
            </button>
          </div>

          {/* Что будет отправлено */}
          <div className="bg-blue-500/[0.07] border border-blue-500/20 rounded-xl p-3 mb-4 space-y-1.5">
            {emailDialog === "intake_bundle" ? (
              <>
                <div className="flex items-center gap-2 text-[11px] text-blue-200/80 font-roboto">
                  <Icon name="FileCheck" size={11} className="text-blue-400 shrink-0" />
                  Акт приёмки — номер, устройство, проблема, стоимость
                </div>
                <div className="flex items-center gap-2 text-[11px] text-blue-200/80 font-roboto">
                  <Icon name="Shield" size={11} className="text-blue-400 shrink-0" />
                  Гарантийный талон — условия, сроки, ссылки
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 text-[11px] text-blue-200/80 font-roboto">
                <Icon name="Receipt" size={11} className="text-blue-400 shrink-0" />
                Гарантийный чек — итоговая сумма, гарантия 30 дней
              </div>
            )}
          </div>

          {/* Email */}
          <label className={LBL}>Email клиента</label>
          <input
            type="email"
            value={emailInput}
            onChange={e => setEmailInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSendEmail()}
            placeholder="ivan@mail.ru"
            autoFocus
            className={INP + " mb-4"}
          />

          <div className="flex gap-2">
            <button
              onClick={() => setEmailDialog(null)}
              className="flex-1 py-2.5 rounded-lg border border-white/10 text-white/50 text-sm font-roboto hover:border-white/20 transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={handleSendEmail}
              disabled={emailSending || !emailInput.trim()}
              className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold text-sm font-roboto transition-colors flex items-center justify-center gap-1.5"
            >
              {emailSending
                ? <><Icon name="Loader2" size={13} className="animate-spin" />Отправляю...</>
                : <><Icon name="Send" size={13} />Отправить</>
              }
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}