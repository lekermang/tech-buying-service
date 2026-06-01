import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const fmt = (n: number) =>
  new Intl.NumberFormat("ru-RU").format(Math.round(n)) + " ₽";

type EvalResult = {
  min_price: number; avg_price: number; max_price: number;
  recommended_buy: number; recommended_sell: number; margin_pct: number;
  liquidity: string; sell_time: string; sell_days: number;
  tips: string[]; factors: string; ad_title: string; risk: string;
  db_stats?: { found?: number; our_avg_buy?: number; our_avg_sell?: number; our_min_sell?: number; our_max_sell?: number };
};

type HistoryEntry = { model: string; result: EvalResult; ts: number; condition: string };

interface Props {
  history: HistoryEntry[];
  showHistory: boolean;
  onToggleHistory: () => void;
  onSelectHistory: (h: HistoryEntry) => void;
  onClearHistory: () => void;
}

export default function EvaluatorHeader({ history, showHistory, onToggleHistory, onSelectHistory, onClearHistory }: Props) {
  const navigate = useNavigate();

  return (
    <>
      <div className="sticky top-0 z-10" style={{
        background: "linear-gradient(180deg, rgba(14,11,6,0.99) 0%, rgba(10,8,4,0.97) 100%)",
        borderBottom: "1px solid rgba(255,215,0,0.15)",
        backdropFilter: "blur(20px)",
      }}>
        <div className="absolute top-0 left-0 right-0 h-px" style={{
          background: "linear-gradient(90deg, transparent, rgba(255,215,0,0.6), rgba(255,248,232,0.8), rgba(255,215,0,0.6), transparent)",
        }} />
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-all"
            style={{ color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.05)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "white")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
          >
            <Icon name="ArrowLeft" size={16} />
          </button>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{
            background: "linear-gradient(135deg, #FFE34D, #FFD700)",
            boxShadow: "0 0 16px rgba(255,215,0,0.5)",
          }}>
            <Icon name="TrendingUp" size={15} className="text-black" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-oswald font-bold uppercase tracking-wide text-sm" style={{
              background: "linear-gradient(90deg, #fff8e8, #FFD700)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            }}>ИИ Оценщик</div>
            <div className="font-roboto text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
              Авито · База ломбарда · GPT-4o
            </div>
          </div>
          <button onClick={onToggleHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-roboto text-xs transition-all"
            style={{
              background: showHistory ? "rgba(255,215,0,0.12)" : "rgba(255,255,255,0.05)",
              border: `1px solid ${showHistory ? "rgba(255,215,0,0.3)" : "rgba(255,255,255,0.08)"}`,
              color: showHistory ? "#FFD700" : "rgba(255,255,255,0.5)",
            }}
          >
            <Icon name="History" size={13} />
            {history.length > 0 && <span>{history.length}</span>}
          </button>
        </div>
      </div>

      {showHistory && history.length > 0 && (
        <div className="rounded-xl overflow-hidden" style={{
          background: "linear-gradient(145deg, rgba(18,14,8,0.97), rgba(10,8,5,0.99))",
          border: "1px solid rgba(255,215,0,0.12)",
        }}>
          <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <span className="font-roboto text-[11px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>История оценок</span>
            <button onClick={onClearHistory} className="font-roboto text-[11px]" style={{ color: "rgba(255,68,68,0.6)" }}>очистить</button>
          </div>
          <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
            {history.map((h, i) => (
              <button key={i} onClick={() => onSelectHistory(h)}
                className="w-full flex items-center justify-between px-4 py-2.5 text-left transition-all"
                style={{ background: "transparent" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,215,0,0.04)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <div>
                  <div className="font-roboto text-sm text-white/80">{h.model}</div>
                  <div className="font-roboto text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                    {h.condition} · {new Date(h.ts).toLocaleDateString("ru-RU")}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-oswald font-bold text-sm" style={{ color: "#34d399" }}>
                    {fmt(h.result.recommended_buy)}
                  </div>
                  <div className="font-roboto text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>закупка</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
