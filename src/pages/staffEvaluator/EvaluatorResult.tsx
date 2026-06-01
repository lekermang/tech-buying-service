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

interface Props {
  result: EvalResult;
  brand: string;
  model: string;
  category: string;
  condition: string;
  kit: string;
  copied: boolean;
  onCopy: () => void;
}

const liqColor = (l: string) =>
  l === "высокая" ? "#34d399" : l === "средняя" ? "#FFD700" : "#f87171";

const riskColor = (r: string) =>
  r === "низкий" ? "#34d399" : r === "средний" ? "#FFD700" : "#f87171";

export default function EvaluatorResult({ result, brand, model, category, condition, kit, copied, onCopy }: Props) {
  return (
    <div className="rounded-xl overflow-hidden" style={{
      background: "linear-gradient(145deg, rgba(18,14,8,0.97), rgba(10,8,5,0.99))",
      border: "1px solid rgba(255,215,0,0.2)",
      boxShadow: "0 0 40px rgba(255,215,0,0.06), 0 2px 0 rgba(255,255,255,0.03) inset",
    }}>
      <div className="h-px w-full" style={{
        background: "linear-gradient(90deg, transparent, rgba(255,215,0,0.5), rgba(255,248,232,0.7), rgba(255,215,0,0.5), transparent)",
      }} />

      <div className="p-4 space-y-4">
        {/* Заголовок */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-oswald font-bold text-lg text-white leading-tight">{brand} {model}</div>
            <div className="font-roboto text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
              {category} · {condition} · {kit}
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <div className="px-2.5 py-1 rounded-lg font-roboto text-xs font-bold" style={{
              background: `${liqColor(result.liquidity)}18`,
              border: `1px solid ${liqColor(result.liquidity)}35`,
              color: liqColor(result.liquidity),
            }}>
              {result.liquidity}
            </div>
            <div className="px-2.5 py-1 rounded-lg font-roboto text-xs font-bold" style={{
              background: `${riskColor(result.risk)}18`,
              border: `1px solid ${riskColor(result.risk)}35`,
              color: riskColor(result.risk),
            }}>
              риск {result.risk}
            </div>
          </div>
        </div>

        {/* Главные цены — закупка/продажа */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl p-3 text-center" style={{
            background: "linear-gradient(145deg, rgba(52,211,153,0.12), rgba(52,211,153,0.05))",
            border: "1px solid rgba(52,211,153,0.25)",
          }}>
            <div className="font-roboto text-[10px] uppercase tracking-widest mb-1" style={{ color: "rgba(52,211,153,0.7)" }}>
              Закупить у клиента
            </div>
            <div className="font-oswald font-black text-2xl" style={{ color: "#34d399" }}>
              {fmt(result.recommended_buy)}
            </div>
            <div className="font-roboto text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>рекомендуемая</div>
          </div>
          <div className="rounded-xl p-3 text-center" style={{
            background: "linear-gradient(145deg, rgba(255,215,0,0.12), rgba(255,215,0,0.05))",
            border: "1px solid rgba(255,215,0,0.25)",
          }}>
            <div className="font-roboto text-[10px] uppercase tracking-widest mb-1" style={{ color: "rgba(255,215,0,0.7)" }}>
              Продать на витрине
            </div>
            <div className="font-oswald font-black text-2xl" style={{ color: "#FFD700" }}>
              {fmt(result.recommended_sell)}
            </div>
            <div className="font-roboto text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>маржа {result.margin_pct}%</div>
          </div>
        </div>

        {/* Рынок Авито */}
        <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="font-roboto text-[10px] uppercase tracking-widest mb-2.5" style={{ color: "rgba(255,255,255,0.3)" }}>
            Рынок Авито · {result.sell_time}
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { l: "Минимум", v: result.min_price },
              { l: "Средняя", v: result.avg_price },
              { l: "Максимум", v: result.max_price },
            ].map(({ l, v }) => (
              <div key={l}>
                <div className="font-oswald font-bold text-base text-white/90">{fmt(v)}</div>
                <div className="font-roboto text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Наша БД */}
        {result.db_stats?.found && result.db_stats.found > 0 && (
          <div className="rounded-xl p-3" style={{
            background: "rgba(96,165,250,0.06)", border: "1px solid rgba(96,165,250,0.15)",
          }}>
            <div className="flex items-center gap-2 mb-2">
              <Icon name="Database" size={12} style={{ color: "rgba(96,165,250,0.8)" }} />
              <span className="font-roboto text-[10px] uppercase tracking-widest" style={{ color: "rgba(96,165,250,0.7)" }}>
                Наши продажи: {result.db_stats.found} похожих за 90 дней
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div>
                <div className="font-oswald font-bold text-sm" style={{ color: "#34d399" }}>
                  {result.db_stats.our_avg_buy ? fmt(result.db_stats.our_avg_buy) : "—"}
                </div>
                <div className="font-roboto text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>Закупали</div>
              </div>
              <div>
                <div className="font-oswald font-bold text-sm" style={{ color: "#FFD700" }}>
                  {result.db_stats.our_avg_sell ? fmt(result.db_stats.our_avg_sell) : "—"}
                </div>
                <div className="font-roboto text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>Продавали</div>
              </div>
            </div>
          </div>
        )}

        {/* Факторы */}
        {result.factors && (
          <div className="font-roboto text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
            {result.factors}
          </div>
        )}

        {/* Советы */}
        {result.tips?.length > 0 && (
          <div className="space-y-1.5">
            <div className="font-roboto text-[10px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>Советы</div>
            {result.tips.map((tip, i) => (
              <div key={i} className="flex items-start gap-2">
                <Icon name="ArrowRight" size={12} className="shrink-0 mt-0.5" style={{ color: "#34d399" }} />
                <span className="font-roboto text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>{tip}</span>
              </div>
            ))}
          </div>
        )}

        {/* Заголовок объявления */}
        {result.ad_title && (
          <div className="rounded-xl p-3" style={{
            background: "rgba(96,165,250,0.06)", border: "1px solid rgba(96,165,250,0.15)",
          }}>
            <div className="font-roboto text-[10px] uppercase tracking-widest mb-1.5" style={{ color: "rgba(96,165,250,0.6)" }}>
              Заголовок для Авито
            </div>
            <div className="font-roboto text-sm font-semibold" style={{ color: "#60a5fa" }}>{result.ad_title}</div>
          </div>
        )}

        {/* Кнопка копировать */}
        <button onClick={onCopy}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-roboto text-sm transition-all"
          style={{
            background: copied ? "rgba(52,211,153,0.12)" : "rgba(255,255,255,0.05)",
            border: `1px solid ${copied ? "rgba(52,211,153,0.3)" : "rgba(255,255,255,0.1)"}`,
            color: copied ? "#34d399" : "rgba(255,255,255,0.5)",
          }}
        >
          <Icon name={copied ? "Check" : "Copy"} size={14} />
          {copied ? "Скопировано!" : "Скопировать оценку"}
        </button>
      </div>
    </div>
  );
}
