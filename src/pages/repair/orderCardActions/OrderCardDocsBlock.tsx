import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Order, printReceipt, printAct, printActHTML } from "../types";
import { useStaffToast } from "../../staff/StaffToast";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { AuthHeader } from "./orderCardActionsTypes";

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

  const handleSendAct = async () => {
    setActSending(true);
    const tid = toast.loading(`Отправляю акт по заявке #${o.id} в Telegram...`);
    try {
      const res = await fetch("https://functions.poehali.dev/a105aede-d55d-4b99-9d3e-5e977887aa04", {
        method: "POST",
        headers: { "Content-Type": "application/json", [authHeader]: token },
        body: JSON.stringify({ action: "send_act", id: o.id }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json().catch(() => ({}));
      if (data.ok) {
        setActSent(true);
        setTimeout(() => setActSent(false), 3000);
        toast.update(tid, { kind: "success", message: "Акт отправлен в Telegram", duration: 3000 });
      } else {
        toast.update(tid, { kind: "error", message: data.error || "Не удалось отправить акт", duration: 5000 });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Ошибка соединения";
      toast.update(tid, { kind: "error", message: `Ошибка отправки акта: ${msg}`, duration: 5000 });
    } finally {
      setActSending(false);
    }
  };

  return (
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
              className="group relative flex-1 overflow-hidden font-roboto text-[12px] py-3 px-4 rounded-lg border border-[#FFD700]/40 bg-gradient-to-br from-[#FFD700]/15 via-[#FFD700]/5 to-transparent text-[#FFD700] hover:from-[#FFD700]/25 hover:via-[#FFD700]/10 hover:border-[#FFD700]/60 hover:shadow-lg hover:shadow-[#FFD700]/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 min-h-[48px] font-bold uppercase tracking-wider">
              {/* блик */}
              <span className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-white/5 to-transparent" />
              <Icon
                name={actSending ? "Loader" : "FileText"}
                size={15}
                className={actSending ? "animate-spin" : ""}
              />
              <span className="relative">{actSending ? "Отправка..." : "Документы"}</span>
              <Icon name="ChevronDown" size={13} className="relative opacity-60 group-hover:opacity-100 transition-opacity" />
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

        {/* Быстрая кнопка «Чек» — частое действие */}
        <button
          onClick={() => printReceipt(o)}
          title="Распечатать чек"
          className="font-roboto text-[11px] py-3 px-4 rounded-lg border border-emerald-500/25 bg-emerald-500/5 text-emerald-300 hover:bg-emerald-500/15 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10 active:scale-95 transition-all flex items-center justify-center gap-1.5 min-h-[48px] shrink-0"
        >
          <Icon name="Receipt" size={14} />
          <span className="hidden sm:inline font-bold">Чек</span>
        </button>
      </div>
    </div>
  );
}
