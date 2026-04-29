import Icon from "@/components/ui/icon";

export type Group = "all" | "registered" | "repair";

type Props = {
  smsOpen: boolean;
  setSmsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  balance: number | null;
  smsCost: number | null;
  loadingBalance: boolean;
  loadBalance: () => void;
  smsGroup: Group;
  setSmsGroup: (g: Group) => void;
  counts: { all: number; registered: number; repair: number; wh: number };
  smsMessage: string;
  setSmsMessage: (v: string) => void;
  setSmsConfirm: React.Dispatch<React.SetStateAction<boolean>>;
  smsConfirm: boolean;
  smsTargetCount: number;
  smsCount: number;
  charsLeft: number;
  totalCost: number | null;
  smsSending: boolean;
  sendSms: () => void;
  smsResult: { sent: number; failed: number; total: number } | null;
  MAX_SMS: number;
};

export default function SmsBlastPanel({
  smsOpen, setSmsOpen, balance, smsCost, loadingBalance, loadBalance,
  smsGroup, setSmsGroup, counts, smsMessage, setSmsMessage, setSmsConfirm,
  smsConfirm, smsTargetCount, smsCount, charsLeft, totalCost,
  smsSending, sendSms, smsResult, MAX_SMS,
}: Props) {
  return (
    <div className="bg-gradient-to-br from-green-500/5 to-[#0A0A0A] border border-green-500/20 rounded-lg p-4">
      <button
        onClick={() => setSmsOpen(v => !v)}
        className="w-full flex items-center justify-between gap-2 mb-1 active:scale-[0.99] transition-transform"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-green-500/15 border border-green-500/30 flex items-center justify-center">
            <Icon name="MessageSquare" size={14} className="text-green-400" />
          </div>
          <div className="text-left">
            <div className="font-oswald font-bold uppercase text-sm text-white">SMS-рассылка</div>
            <div className="font-roboto text-white/40 text-[10px]">Акции и уведомления через sms.ru</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {balance != null && (
            <span className="font-oswald font-bold tabular-nums text-[#FFD700] text-xs whitespace-nowrap">
              {balance.toFixed(2)} ₽
            </span>
          )}
          <Icon name={smsOpen ? "ChevronUp" : "ChevronDown"} size={16} className="text-white/40" />
        </div>
      </button>

      {smsOpen && (
        <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
          {/* Баланс */}
          <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-md p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Icon name="Wallet" size={14} className="text-[#FFD700] shrink-0" />
              <div className="min-w-0">
                <div className="font-roboto text-white/40 text-[9px] uppercase tracking-wide">Баланс sms.ru</div>
                <div className="font-oswald font-bold text-white text-base tabular-nums truncate">
                  {loadingBalance ? "..." : balance != null ? `${balance.toFixed(2)} ₽` : "—"}
                  {smsCost && (
                    <span className="font-roboto text-white/40 text-[10px] ml-2">{smsCost.toFixed(2)} ₽/SMS</span>
                  )}
                </div>
              </div>
            </div>
            <button onClick={loadBalance} disabled={loadingBalance}
              className="text-white/50 hover:text-white p-2 rounded-md hover:bg-white/5 transition-colors disabled:opacity-50">
              <Icon name="RefreshCw" size={14} className={loadingBalance ? "animate-spin" : ""} />
            </button>
          </div>

          {/* Группа получателей */}
          <div>
            <div className="font-roboto text-white/40 text-[10px] uppercase tracking-wide mb-2">Кому отправить</div>
            <div className="grid grid-cols-3 gap-2">
              {([
                { k: "all" as Group, l: "Всем", icon: "Users", count: counts.all },
                { k: "registered" as Group, l: "Скидки", icon: "Star", count: counts.registered },
                { k: "repair" as Group, l: "Ремонт", icon: "Wrench", count: counts.repair },
              ]).map(g => {
                const a = smsGroup === g.k;
                return (
                  <button key={g.k} onClick={() => setSmsGroup(g.k)}
                    className={`flex flex-col items-center gap-1 p-2.5 rounded-md border text-center transition-all active:scale-95 ${
                      a
                        ? "border-[#FFD700] bg-[#FFD700]/10 text-[#FFD700]"
                        : "border-[#1F1F1F] bg-[#0A0A0A] text-white/50 hover:border-white/20 hover:text-white"
                    }`}>
                    <Icon name={g.icon} size={14} />
                    <span className="font-oswald font-bold text-[11px] uppercase">{g.l}</span>
                    <span className="font-roboto text-[10px] tabular-nums opacity-80">{g.count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Текст */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="font-roboto text-white/40 text-[10px] uppercase tracking-wide">Текст сообщения</div>
              <div className={`font-oswald text-[10px] tabular-nums ${charsLeft < 0 ? "text-red-400" : "text-white/50"}`}>
                {smsMessage.length} / {MAX_SMS} · {smsCount} SMS
              </div>
            </div>
            <textarea
              value={smsMessage}
              onChange={e => { setSmsMessage(e.target.value.slice(0, MAX_SMS)); setSmsConfirm(false); }}
              placeholder="Например: Скупка24 — повышенная цена за iPhone до конца недели! Звоните: +7 992 999-03-33"
              rows={4}
              className="w-full bg-[#0A0A0A] border border-[#1F1F1F] text-white px-3 py-2.5 font-roboto text-sm rounded-md focus:outline-none focus:border-[#FFD700]/50 placeholder:text-white/25 resize-none"
            />
            <div className="font-roboto text-white/30 text-[10px] mt-1 leading-tight">
              Подпись отправителя: <span className="text-[#FFD700]">IPMamedov</span>. Кириллица — 70 символов на 1 SMS.
            </div>
          </div>

          {/* Стоимость и подтверждение */}
          <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-md p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-roboto text-white/50">Получателей</span>
              <span className="font-oswald font-bold text-white tabular-nums">{smsTargetCount}</span>
            </div>
            {totalCost != null && (
              <div className="flex items-center justify-between text-xs">
                <span className="font-roboto text-white/50">Примерная стоимость</span>
                <span className="font-oswald font-bold text-[#FFD700] tabular-nums">{totalCost.toFixed(2)} ₽</span>
              </div>
            )}
            {balance != null && totalCost != null && totalCost > balance && (
              <div className="bg-red-500/10 border border-red-500/30 rounded px-2 py-1.5 flex items-start gap-1.5 text-red-300 font-roboto text-[10px] leading-snug">
                <Icon name="AlertTriangle" size={11} className="text-red-400 mt-0.5 shrink-0" />
                Баланса может не хватить. Пополните счёт sms.ru.
              </div>
            )}
            <label className="flex items-center gap-2 cursor-pointer select-none pt-1">
              <input
                type="checkbox"
                checked={smsConfirm}
                onChange={e => setSmsConfirm(e.target.checked)}
                className="w-4 h-4 accent-[#FFD700]"
              />
              <span className="font-roboto text-white/70 text-xs">
                Я подтверждаю отправку <b>{smsTargetCount}</b> SMS
              </span>
            </label>
            <button
              onClick={sendSms}
              disabled={!smsMessage.trim() || !smsConfirm || smsSending || smsTargetCount === 0}
              className="w-full bg-gradient-to-b from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-oswald font-bold py-3 uppercase tracking-wide text-sm rounded-md shadow-md shadow-green-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {smsSending ? (
                <><Icon name="Loader" size={14} className="animate-spin" /> Отправляю...</>
              ) : (
                <><Icon name="Send" size={14} /> Отправить рассылку</>
              )}
            </button>
            {smsResult && (
              <div className="bg-green-500/10 border border-green-500/30 rounded px-2.5 py-2 text-green-300 font-roboto text-xs flex items-center gap-2">
                <Icon name="CheckCircle2" size={12} />
                Доставлено: <b className="tabular-nums">{smsResult.sent}</b> · Ошибок: <b className="tabular-nums">{smsResult.failed}</b> из <b className="tabular-nums">{smsResult.total}</b>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
