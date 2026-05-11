import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Order, STATUSES, PRIMARY_STATUS_KEYS } from "../types";
import { STATUS_FX, EditForm } from "./orderCardActionsTypes";

type Props = {
  o: Order;
  ef: EditForm;
  saving: boolean;
  financeBlocked: boolean;
  onChangeStatus: (id: number, status: string, extra?: Record<string, unknown>) => void;
  onOpenReadyModal: (o: Order) => void;
  onIssueOrder: (o: Order, issuedAt?: string) => void;
  onCallRobotReady?: (id: number) => Promise<boolean> | void;
  onInviteToMax?: (id: number) => Promise<boolean> | void;
};

/**
 * Воронка статусов для CRM-ремонта.
 *
 * 4 главные кнопки в одну линию: Принят → На согласование → Готов → Выдан.
 * Текущий статус подсвечен и не кликабелен. Остальные — кликабельны.
 *
 * Редкие статусы (В работе, Ждём запчасть, Гарантия, Отменено) скрыты в выпадающем меню «Прочее».
 *
 * Бизнес-логика:
 *   • «На согласование» → Telegram-уведомление мастеру (backend сам отправит)
 *   • «Готов» → автоматическая SMS клиенту (backend сам отправит)
 *   • «Выдан» — требует заполненные поля закупки и цены клиенту (financeBlocked)
 *   • «Принят» — стартовая точка, сюда обычно не возвращаются
 */
export default function OrderCardStatusBlock({
  o, ef, saving, financeBlocked,
  onChangeStatus, onOpenReadyModal, onIssueOrder, onCallRobotReady, onInviteToMax,
}: Props) {
  const [calling, setCalling] = useState(false);
  const [maxInviting, setMaxInviting] = useState(false);
  const callRobot = async () => {
    if (!onCallRobotReady || calling) return;
    setCalling(true);
    try { await onCallRobotReady(o.id); } finally { setCalling(false); }
  };
  const inviteMax = async () => {
    if (!onInviteToMax || maxInviting) return;
    setMaxInviting(true);
    try { await onInviteToMax(o.id); } finally { setMaxInviting(false); }
  };
  // Дата выдачи (для кнопки «Выдан»)
  const nowLocal = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };
  const [issuedAt, setIssuedAt] = useState<string>(nowLocal);
  const [moreOpen, setMoreOpen] = useState(false);

  // Главные статусы (4 кнопки воронки)
  const primary = STATUSES.filter(s => (PRIMARY_STATUS_KEYS as readonly string[]).includes(s.key));
  // Прочие (служебные статусы для редких случаев)
  const secondary = STATUSES.filter(s => !(PRIMARY_STATUS_KEYS as readonly string[]).includes(s.key));

  const handleClick = (key: string) => {
    if (key === o.status) return;
    if (key === "ready") onOpenReadyModal(o);
    else if (key === "done") onIssueOrder(o, issuedAt);
    else onChangeStatus(o.id, key, { admin_note: ef.admin_note });
    setMoreOpen(false);
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-[#FFD700]/15 bg-gradient-to-br from-[#1a1a1a] via-[#0E0E0E] to-[#0A0A0A] p-3">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#FFD700] to-yellow-600 text-black flex items-center justify-center shrink-0 shadow-lg shadow-[#FFD700]/20">
          <Icon name="Workflow" size={13} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-oswald font-bold text-white text-[12px] uppercase tracking-wider leading-tight">Этап ремонта</div>
          <div className="font-roboto text-[10px] text-white/40 leading-tight truncate">
            сейчас:{" "}
            <span className={STATUS_FX[o.status]?.text || "text-white/60"}>
              {(STATUSES.find(s => s.key === o.status)?.label) || o.status}
            </span>
          </div>
        </div>
        {saving && (
          <span className="flex items-center gap-1 bg-[#FFD700]/15 text-[#FFD700] border border-[#FFD700]/30 px-2 py-0.5 rounded-full text-[9px] font-roboto">
            <Icon name="Loader" size={9} className="animate-spin" />Сохраняю
          </span>
        )}
      </div>

      {/* ── Воронка 4 кнопок ── */}
      <div className="grid grid-cols-4 gap-1.5">
        {primary.map((s, idx) => {
          const fx = STATUS_FX[s.key] || STATUS_FX.new;
          const isCurrent = s.key === o.status;
          const blocked = s.key === "done" && financeBlocked;
          const isLoading = saving;
          const arrow = idx < primary.length - 1; // стрелка между шагами

          return (
            <div key={s.key} className="relative">
              {arrow && (
                <span aria-hidden className="absolute -right-1 top-1/2 -translate-y-1/2 z-10 text-white/20 hidden sm:inline">
                  <Icon name="ChevronRight" size={12} />
                </span>
              )}
              <button
                onClick={() => handleClick(s.key)}
                disabled={isCurrent || isLoading || blocked}
                title={
                  isCurrent ? `Сейчас: ${s.label}` :
                  blocked ? "Заполни «Закупка» и «Цена клиенту» перед выдачей" :
                  s.key === "pending_approval" ? "Перевести на согласование (мастер получит Telegram)" :
                  s.key === "ready" ? "Готов — клиенту уйдёт SMS автоматически" :
                  s.label
                }
                className={`group relative w-full rounded-lg border transition-all py-2.5 px-1.5 flex flex-col items-center justify-center gap-1 min-h-[68px] active:scale-[0.97] ${
                  isCurrent
                    ? `${fx.bg} ${fx.border} ${fx.text} ring-2 ring-current/30 cursor-default font-bold`
                    : blocked
                      ? "border-white/5 bg-black/40 text-white/25 cursor-not-allowed"
                      : isLoading
                        ? "opacity-50 cursor-not-allowed border-white/10 text-white/30"
                        : `border-white/10 bg-white/[0.02] text-white/55 hover:${fx.bg.replace("/10","/15")} hover:${fx.border} hover:${fx.text} hover:scale-[1.02]`
                }`}
              >
                {/* Иконка */}
                <span className={`relative w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                  isCurrent ? "bg-black/30 border border-current/30" : "bg-black/30 border border-white/10 group-hover:border-current/30"
                }`}>
                  {blocked
                    ? <Icon name="Lock" size={13} />
                    : isCurrent
                      ? <Icon name={fx.icon} size={13} className="drop-shadow-[0_0_4px_currentColor]" />
                      : <Icon name={fx.icon} size={13} />}
                </span>
                {/* Подпись */}
                <span className="font-oswald font-bold text-[10px] uppercase tracking-tight leading-tight text-center">
                  {s.label}
                </span>
                {/* Метки шагов */}
                {isCurrent && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-current animate-pulse shadow-[0_0_6px_currentColor]" />
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Дата выдачи — появляется только когда сейчас не "Выдан" и есть смысл выдать */}
      {o.status !== "done" && (o.status === "ready" || o.status === "pending_approval") && (
        <div className="mt-2.5 relative flex items-center gap-2 bg-gradient-to-r from-[#FFD700]/[0.08] via-[#FFD700]/[0.04] to-transparent border border-[#FFD700]/25 rounded-lg px-3 py-2">
          <Icon name="CalendarCheck" size={13} className="text-[#FFD700] shrink-0" />
          <span className="font-roboto text-[10px] text-[#FFD700]/80 shrink-0 uppercase tracking-wider font-bold">Дата выдачи</span>
          <input
            type="datetime-local"
            value={issuedAt}
            onChange={e => setIssuedAt(e.target.value)}
            className="flex-1 bg-transparent font-roboto text-[11px] text-white outline-none min-w-0 cursor-pointer tabular-nums text-right"
          />
        </div>
      )}

      {/* Подсказка о SMS на этапе "Готов" */}
      {o.status !== "ready" && o.status !== "done" && (
        <div className="mt-2 text-[10px] font-roboto text-white/40 flex items-start gap-1.5">
          <Icon name="MessageSquare" size={10} className="mt-0.5 shrink-0" />
          <span>
            При нажатии «<span className="text-[#FFD700]">Готов</span>» клиенту автоматически уйдёт SMS.{" "}
            «<span className="text-purple-300">На согласование</span>» — Telegram мастеру.
          </span>
        </div>
      )}

      {financeBlocked && o.status === "ready" && (
        <div className="mt-2 text-[10px] font-roboto text-orange-300/85 flex items-center gap-1.5 bg-gradient-to-r from-orange-500/10 to-transparent border border-orange-500/25 rounded-lg px-2.5 py-1.5">
          <Icon name="Info" size={11} className="text-orange-400 shrink-0" />
          Чтобы нажать «Выдан», заполни «Закупка» и «Цена клиенту» в финансовом блоке ниже.
        </div>
      )}

      {/* Ряд кнопок связи: робот-звонок (только при Готов/Выдан) + пригласить в MAX (всегда если есть телефон) */}
      {o.phone && (onCallRobotReady || onInviteToMax) && (
        <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {(o.status === "ready" || o.status === "done") && onCallRobotReady && (
            <button
              onClick={callRobot}
              disabled={calling}
              title="Робот Zvonok перезвонит клиенту и зачитает: ремонт готов, адрес, режим работы"
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500/15 to-emerald-500/5 hover:from-emerald-500/25 hover:to-emerald-500/10 border border-emerald-500/40 hover:border-emerald-400 text-emerald-300 hover:text-emerald-200 px-3 py-2 rounded-lg text-[11px] font-oswald font-bold uppercase tracking-wide transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <Icon name={calling ? "Loader" : "PhoneCall"} size={13} className={calling ? "animate-spin" : ""} />
              {calling ? "Робот звонит..." : "Робот: «Ремонт готов»"}
            </button>
          )}
          {onInviteToMax && (
            <button
              onClick={inviteMax}
              disabled={maxInviting}
              title="Открыть мессенджер MAX у сотрудника и параллельно отправить клиенту SMS со ссылкой на MAX-чат"
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500/15 to-cyan-500/5 hover:from-cyan-500/25 hover:to-cyan-500/10 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 hover:text-cyan-200 px-3 py-2 rounded-lg text-[11px] font-oswald font-bold uppercase tracking-wide transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <Icon name={maxInviting ? "Loader" : "Send"} size={13} className={maxInviting ? "animate-spin" : ""} />
              {maxInviting ? "Открываю MAX..." : "Пригласить в MAX"}
            </button>
          )}
        </div>
      )}

      {/* ── «Прочее» — служебные статусы ── */}
      <div className="mt-2.5 border-t border-white/5 pt-2.5">
        <button
          onClick={() => setMoreOpen(v => !v)}
          className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-md text-white/40 hover:text-white/70 hover:bg-white/[0.03] transition-colors text-[11px] font-roboto"
        >
          <span className="inline-flex items-center gap-1.5">
            <Icon name="MoreHorizontal" size={11} />
            Прочие статусы (для особых случаев)
          </span>
          <Icon name={moreOpen ? "ChevronUp" : "ChevronDown"} size={11} />
        </button>

        {moreOpen && (
          <div className="grid grid-cols-2 gap-1.5 mt-2">
            {secondary.map(s => {
              const fx = STATUS_FX[s.key] || STATUS_FX.new;
              const isCurrent = s.key === o.status;
              return (
                <button
                  key={s.key}
                  onClick={() => handleClick(s.key)}
                  disabled={isCurrent || saving}
                  title={isCurrent ? `Сейчас: ${s.label}` : s.label}
                  className={`relative font-roboto text-[11px] py-1.5 px-2 rounded-md border transition-all flex items-center gap-1.5 min-h-[34px] active:scale-95 ${
                    isCurrent
                      ? `${fx.bg} ${fx.border} ${fx.text} ring-1 ring-current/30 font-bold cursor-default`
                      : `border-white/8 bg-white/[0.02] text-white/50 hover:${fx.bg} hover:${fx.text} hover:${fx.border}`
                  }`}
                >
                  <Icon name={fx.icon} size={11} className="shrink-0" />
                  <span className="truncate">{s.label}</span>
                  {isCurrent && <span className={`ml-auto w-1.5 h-1.5 rounded-full ${fx.dot} animate-pulse`} />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}