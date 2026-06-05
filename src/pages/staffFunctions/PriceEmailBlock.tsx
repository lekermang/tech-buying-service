import Icon from "@/components/ui/icon";

interface Props {
  expanded: boolean;
  markup: string;
  email: string;
  sendMax: boolean;
  sending: boolean;
  result: string | null;
  error: string | null;
  onToggleExpand: () => void;
  onMarkupChange: (v: string) => void;
  onEmailChange: (v: string) => void;
  onToggleMax: () => void;
  onSend: () => void;
}

export default function PriceEmailBlock({
  expanded, markup, email, sendMax, sending, result, error,
  onToggleExpand, onMarkupChange, onEmailChange, onToggleMax, onSend,
}: Props) {
  return (
    <div className="rounded-xl bg-white/5 border border-white/10 mb-4 overflow-hidden">
      <button
        onClick={onToggleExpand}
        className="w-full flex items-center gap-3 p-3.5 text-left"
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-[#FFD700]/10">
          <Icon name="Mail" size={18} className="text-[#FFD700]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-roboto font-semibold text-sm text-white">Отправить прайс</div>
          <div className="font-roboto text-[11px] text-white/40">
            Актуальные цены Smartbery · с SIM/eSIM · на почту и/или в MAX
          </div>
        </div>
        <Icon name={expanded ? "ChevronUp" : "ChevronDown"} size={16} className="text-white/30 shrink-0" />
      </button>

      {expanded && (
        <div className="px-3.5 pb-3.5 pt-0 border-t border-white/[0.06] space-y-3">
          <div>
            <div className="font-roboto text-[11px] text-white/40 mb-1.5 mt-3">Наценка к каждой позиции</div>
            <div className="flex gap-2 flex-wrap">
              {["0", "500", "1000", "1500"].map(v => (
                <button key={v} onClick={() => onMarkupChange(v)}
                  className="px-3 py-1.5 rounded-lg font-oswald font-bold text-xs transition-all"
                  style={{
                    background: markup === v ? "rgba(255,215,0,0.15)" : "rgba(255,255,255,0.05)",
                    border: `1px solid ${markup === v ? "rgba(255,215,0,0.4)" : "rgba(255,255,255,0.1)"}`,
                    color: markup === v ? "#FFD700" : "rgba(255,255,255,0.45)",
                  }}>
                  {v === "0" ? "Без наценки" : `+${Number(v).toLocaleString("ru-RU")} ₽`}
                </button>
              ))}
              <input
                type="number" min="0" step="100"
                value={markup}
                onChange={e => onMarkupChange(e.target.value)}
                placeholder="Своя сумма"
                className="w-28 px-3 py-1.5 rounded-lg font-roboto text-xs text-white/80 outline-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)" }}
              />
            </div>
          </div>

          <div>
            <div className="font-roboto text-[11px] text-white/40 mb-1.5">Email получателя</div>
            <input
              type="email"
              value={email}
              onChange={e => onEmailChange(e.target.value)}
              placeholder="client@mail.ru (оставь пустым если только MAX)"
              className="w-full px-3 py-2.5 rounded-xl font-roboto text-sm text-white/80 outline-none"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
            />
          </div>

          <button
            onClick={onToggleMax}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-all"
            style={{
              background: sendMax ? "rgba(125,211,252,0.08)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${sendMax ? "rgba(125,211,252,0.3)" : "rgba(255,255,255,0.08)"}`,
            }}>
            <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${sendMax ? "bg-[#7dd3fc]" : "bg-white/10"}`}>
              {sendMax && <Icon name="Check" size={12} className="text-black" />}
            </div>
            <div className="text-left">
              <div className="font-roboto text-sm text-white/80">Отправить в общий чат MAX</div>
              <div className="font-roboto text-[10px] text-white/35">Группа Скупка24 · все сотрудники увидят прайс</div>
            </div>
          </button>

          {result && (
            <div className="flex items-center gap-2 font-roboto text-[11px] text-green-400 px-1">
              <Icon name="CheckCircle2" size={13} />
              {result}
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 font-roboto text-[11px] text-red-400 px-1">
              <Icon name="AlertCircle" size={13} />
              {error}
            </div>
          )}

          <button
            onClick={onSend}
            disabled={sending || (!email.trim() && !sendMax)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-oswald font-bold text-sm uppercase text-black transition-all disabled:opacity-40"
            style={{ background: "linear-gradient(135deg,#FFD700,#d4a017)" }}>
            <Icon name={sending ? "Loader2" : "Send"} size={16} className={sending ? "animate-spin" : ""} />
            {sending ? "Отправляю…" : "Отправить прайс"}
          </button>
        </div>
      )}
    </div>
  );
}
