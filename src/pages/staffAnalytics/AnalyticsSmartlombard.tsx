import Icon from "@/components/ui/icon";

export type SmartlombardStats = {
  date_from: string;
  date_to: string;
  income: number;
  expense: number;
  period_income: number;
  period_costs: number;
  period_profit: number;
  // Чистые цифры по комиссионке (Б/У техника)
  kom_income?: number;
  kom_costs?: number;
  kom_profit?: number;
  sales_total?: number;
  sales_count?: number;
  buyout_total?: number;
  buyout_count?: number;
  cached?: boolean;
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

export default function AnalyticsSmartlombard({ period: _period, slData, slLoading, slError, loadSmartlombard, token: _token, smartlombardUrl: _smartlombardUrl }: Props) {
  // показываем для всех периодов (today/yesterday/week/month)

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
            {slData && <span className="font-roboto text-white/30 text-[10px] tabular-nums">{slData.date_from}</span>}
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
            {(() => {
              const hasKom = slData.kom_income !== undefined || slData.kom_profit !== undefined;
              const income = hasKom ? (slData.kom_income || 0) : slData.income;
              const costs = hasKom ? (slData.kom_costs || 0) : slData.expense;
              const profit = hasKom ? (slData.kom_profit || 0) : slData.period_profit;
              return (
                <>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <div className="bg-black/40 border border-[#1F1F1F] rounded-lg p-2.5">
                      <div className="font-roboto text-white/40 text-[9px] uppercase tracking-wide mb-0.5">Выручка</div>
                      <div className="font-oswald font-bold text-green-400 text-lg tabular-nums">{income.toLocaleString("ru-RU")} ₽</div>
                    </div>
                    <div className="bg-black/40 border border-[#1F1F1F] rounded-lg p-2.5">
                      <div className="font-roboto text-white/40 text-[9px] uppercase tracking-wide mb-0.5">Затраты</div>
                      <div className="font-oswald font-bold text-orange-400 text-lg tabular-nums">{costs.toLocaleString("ru-RU")} ₽</div>
                    </div>
                    <div className={`border rounded-lg p-2.5 ${profit >= 0 ? "bg-green-500/10 border-green-400/20" : "bg-red-500/10 border-red-400/20"}`}>
                      <div className={`font-roboto text-[9px] uppercase tracking-wide mb-0.5 ${profit >= 0 ? "text-green-300/70" : "text-red-300/70"}`}>Чистая прибыль</div>
                      <div className={`font-oswald font-bold text-lg tabular-nums ${profit >= 0 ? "text-green-300" : "text-red-300"}`}>
                        {profit >= 0 ? "+" : ""}{profit.toLocaleString("ru-RU")} ₽
                      </div>
                    </div>
                  </div>
                  {hasKom && (
                    <div className="font-roboto text-white/30 text-[9px] mb-1">
                      Касса всего (ломбард + комиссионка): приход <span className="text-white/50 tabular-nums">{slData.income.toLocaleString("ru-RU")} ₽</span>, расход <span className="text-white/50 tabular-nums">{slData.expense.toLocaleString("ru-RU")} ₽</span>
                    </div>
                  )}
                </>
              );
            })()}
            <div className="font-roboto text-white/30 text-[9px] flex flex-wrap gap-x-3 gap-y-0.5">
              {!!slData.sales_total && (
                <span>Продажи товара: <span className="text-purple-200/80 tabular-nums">{slData.sales_total.toLocaleString("ru-RU")} ₽</span> <span className="text-white/30">({slData.sales_count ?? 0})</span></span>
              )}
              {!!slData.buyout_total && (
                <span>Скупка: <span className="text-orange-200/80 tabular-nums">{slData.buyout_total.toLocaleString("ru-RU")} ₽</span> <span className="text-white/30">({slData.buyout_count ?? 0})</span></span>
              )}
              <span className="text-white/30">{slData.date_from === slData.date_to ? `за ${slData.date_from}` : `${slData.date_from} — ${slData.date_to}`}</span>
            </div>
          </>
        )}

        {!slError && !slData && slLoading && (
          <div className="font-roboto text-white/40 text-[11px] flex items-center gap-1.5 py-2">
            <Icon name="Loader" size={11} className="animate-spin text-purple-300" />
            Загружаю данные комиссионки…
          </div>
        )}
      </div>
    </div>
  );
}