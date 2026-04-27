import { useState } from "react";
import Icon from "@/components/ui/icon";

export type SmartlombardStats = {
  date_from: string;
  date_to: string;
  income: number;
  expense: number;
  period_income: number;
  period_costs: number;
  period_profit: number;
};

type Props = {
  period: string;
  slData: SmartlombardStats | null;
  slLoading: boolean;
  slError: string | null;
  loadSmartlombard: (force?: boolean) => void;
  token: string;
  smartlombardUrl: string;
};

export default function AnalyticsSmartlombard({ period, slData, slLoading, slError, loadSmartlombard, token, smartlombardUrl }: Props) {
  const [debugOpen, setDebugOpen] = useState(false);
  const [debugLoading, setDebugLoading] = useState(false);
  const [debugData, setDebugData] = useState<unknown>(null);
  const [debugError, setDebugError] = useState<string | null>(null);

  const runDebug = async () => {
    setDebugOpen(true);
    setDebugLoading(true);
    setDebugError(null);
    setDebugData(null);
    try {
      const now = new Date();
      const msk = new Date(now.getTime() + (now.getTimezoneOffset() + 180) * 60000);
      if (period === "yesterday") msk.setDate(msk.getDate() - 1);
      const date = msk.toISOString().slice(0, 10);
      const url = `${smartlombardUrl}?date=${date}&debug=1&nocache=1`;
      const res = await fetch(url, { headers: { "X-Employee-Token": token } });
      const d = await res.json();
      setDebugData(d);
    } catch (e) {
      setDebugError(String(e));
    } finally {
      setDebugLoading(false);
    }
  };

  if (period !== "today" && period !== "yesterday") return null;

  return (
    <div className="relative bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-transparent border border-purple-400/25 rounded-xl p-4 mb-3 overflow-hidden">
      <div className="absolute -top-6 -right-6 text-7xl opacity-[0.06] select-none">📦</div>
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <div className="font-roboto text-purple-300/80 text-[10px] uppercase tracking-wider flex items-center gap-1.5">
            <Icon name="ShoppingCart" size={12} />
            Продажи б/у техники · smartlombard
          </div>
          <div className="flex items-center gap-2">
            {slData && <span className="font-roboto text-white/30 text-[10px] tabular-nums">{slData.date_from}{(slData as SmartlombardStats & { cached?: boolean }).cached ? " · кэш" : ""}</span>}
            <button onClick={runDebug} disabled={debugLoading}
              title="Диагностика парсера"
              className="text-white/40 hover:text-yellow-300 active:scale-90 p-1 rounded transition-all">
              <Icon name={debugLoading ? "Loader" : "Bug"} size={11} className={debugLoading ? "animate-spin" : ""} />
            </button>
            <button onClick={() => loadSmartlombard(true)} disabled={slLoading}
              className="text-white/40 hover:text-purple-300 active:scale-90 p-1 rounded transition-all">
              <Icon name={slLoading ? "Loader" : "RefreshCw"} size={11} className={slLoading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {slError && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 font-roboto text-[11px] p-2 mb-2 rounded-md flex items-center gap-1.5">
            <Icon name="AlertCircle" size={11} />
            {slError}
          </div>
        )}

        {!slError && slData && (
          <>
            <div className="grid grid-cols-3 gap-2 mb-2">
              <div className="bg-black/40 border border-[#1F1F1F] rounded-lg p-2.5">
                <div className="font-roboto text-white/40 text-[9px] uppercase tracking-wide mb-0.5">Приход</div>
                <div className="font-oswald font-bold text-green-400 text-lg tabular-nums">{slData.income.toLocaleString("ru-RU")} ₽</div>
              </div>
              <div className="bg-black/40 border border-[#1F1F1F] rounded-lg p-2.5">
                <div className="font-roboto text-white/40 text-[9px] uppercase tracking-wide mb-0.5">Расход</div>
                <div className="font-oswald font-bold text-orange-400 text-lg tabular-nums">{slData.expense.toLocaleString("ru-RU")} ₽</div>
              </div>
              <div className={`border rounded-lg p-2.5 ${slData.period_profit >= 0 ? "bg-green-500/10 border-green-400/20" : "bg-red-500/10 border-red-400/20"}`}>
                <div className={`font-roboto text-[9px] uppercase tracking-wide mb-0.5 ${slData.period_profit >= 0 ? "text-green-300/70" : "text-red-300/70"}`}>Прибыль</div>
                <div className={`font-oswald font-bold text-lg tabular-nums ${slData.period_profit >= 0 ? "text-green-300" : "text-red-300"}`}>
                  {slData.period_profit >= 0 ? "+" : ""}{slData.period_profit.toLocaleString("ru-RU")} ₽
                </div>
              </div>
            </div>
            <div className="font-roboto text-white/30 text-[9px] flex flex-wrap gap-x-3 gap-y-0.5">
              <span>Доход за период: <span className="text-white/60 tabular-nums">{slData.period_income.toLocaleString("ru-RU")} ₽</span></span>
              <span>Затраты: <span className="text-white/60 tabular-nums">{slData.period_costs.toLocaleString("ru-RU")} ₽</span></span>
            </div>
          </>
        )}

        {!slError && !slData && slLoading && (
          <div className="font-roboto text-white/40 text-[11px] flex items-center gap-1.5 py-2">
            <Icon name="Loader" size={11} className="animate-spin text-purple-300" />
            Загружаю данные smartlombard…
          </div>
        )}

        {debugOpen && (
          <div className="mt-3 bg-black/60 border border-yellow-500/30 rounded-lg p-2 relative">
            <div className="flex items-center justify-between mb-1.5">
              <div className="font-roboto text-yellow-300/80 text-[10px] uppercase tracking-wider flex items-center gap-1">
                <Icon name="Bug" size={10} /> Диагностика парсера
              </div>
              <button onClick={() => setDebugOpen(false)} className="text-white/40 hover:text-white/80 p-0.5">
                <Icon name="X" size={11} />
              </button>
            </div>
            {debugLoading && <div className="text-white/40 text-[11px]">Запрашиваю…</div>}
            {debugError && <div className="text-red-400 text-[11px]">{debugError}</div>}
            {debugData != null && (
              <pre className="text-white/70 text-[10px] font-mono whitespace-pre-wrap break-all max-h-72 overflow-auto leading-tight">
{JSON.stringify(debugData, null, 2)}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}