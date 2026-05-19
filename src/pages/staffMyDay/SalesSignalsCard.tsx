import Icon from "@/components/ui/icon";
import type { SalesSignals } from "./types";

const money = (n: number) => Math.round(n).toLocaleString("ru-RU") + " ₽";

export default function SalesSignalsCard({ signals }: { signals: SalesSignals }) {
  const idx = signals.avito_index;
  const ok = signals.avito_index_ok;

  return (
    <div className="space-y-3">
      {/* Авито-индекс */}
      <div className={`rounded-xl p-4 border ${
        ok
          ? "bg-gradient-to-br from-emerald-500/10 to-emerald-500/0 border-emerald-500/30"
          : "bg-gradient-to-br from-rose-500/15 to-rose-500/5 border-rose-500/40"
      }`}>
        <div className="flex items-center gap-2 mb-1">
          <Icon name={ok ? "TrendingUp" : "AlertTriangle"} size={14} className={ok ? "text-emerald-400" : "text-rose-400"} />
          <div className="text-[11px] uppercase tracking-wider font-bold text-white/70">
            Авито-индекс {ok ? "(норма)" : "(тревога)"}
          </div>
        </div>
        <div className="flex items-baseline gap-3">
          <div className={`text-3xl font-bold tabular-nums ${ok ? "text-emerald-300" : "text-rose-300"}`}>
            {idx.toFixed(2)}
          </div>
          <div className="text-[11px] text-white/55">цель ≥ 0.70</div>
        </div>
        <div className="text-[12px] text-white/55 mt-1.5">
          На Авито: <span className="text-white font-medium tabular-nums">{signals.on_avito_count}</span>
          {" / "}
          На витрине: <span className="text-white font-medium tabular-nums">{signals.showcase_count}</span>
        </div>
        {!ok && (
          <div className="mt-2 text-[11px] text-rose-300 font-medium">
            🚨 Нужно добавить на Авито ещё {Math.max(0, Math.ceil(signals.showcase_count * 0.7 - signals.on_avito_count))} товаров
          </div>
        )}
      </div>

      {/* Сегодняшние скупки */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg p-3 bg-gradient-to-br from-sky-500/10 to-sky-500/0 border border-sky-500/30">
          <div className="text-[10px] uppercase tracking-wider text-white/55">Скупки Б/У сегодня</div>
          <div className="text-xl font-bold tabular-nums text-white mt-0.5">{signals.today_buyouts}</div>
        </div>
        <div className="rounded-lg p-3 bg-gradient-to-br from-[#FFD700]/10 to-[#FFD700]/0 border border-[#FFD700]/30">
          <div className="text-[10px] uppercase tracking-wider text-white/55">Скупки золота сегодня</div>
          <div className="text-xl font-bold tabular-nums text-white mt-0.5">{signals.today_gold}</div>
        </div>
      </div>

      {/* Б/У без описания/фото */}
      {signals.incomplete_items_count > 0 && (
        <div className="rounded-lg p-3 bg-gradient-to-br from-amber-500/10 to-amber-500/0 border border-amber-500/30">
          <div className="flex items-center gap-2">
            <Icon name="ImageOff" size={14} className="text-amber-400" />
            <div className="text-[12px] text-white/85">
              <span className="font-bold text-amber-300">{signals.incomplete_items_count}</span> товаров без описания или фото
            </div>
          </div>
        </div>
      )}

      {/* Stale Avito */}
      <div className="bg-gradient-to-br from-[#0E0E0E] to-[#080808] border border-[#1F1F1F] rounded-xl overflow-hidden">
        <div className="px-3 py-2 border-b border-[#1F1F1F] flex items-center gap-2">
          <Icon name="RefreshCcw" size={14} className="text-amber-400" />
          <div className="text-[11px] uppercase tracking-wider text-white/60 font-bold">
            Объявления без обновления &gt;3 дней
          </div>
          <span className="ml-auto text-[11px] tabular-nums text-white/55">{signals.stale_avito_count}</span>
        </div>
        {signals.stale_avito.length === 0 ? (
          <div className="p-6 text-center text-emerald-400/80 text-sm">
            ✅ Все объявления актуальны
          </div>
        ) : (
          <div className="divide-y divide-[#1F1F1F]/60 max-h-[350px] overflow-y-auto">
            {signals.stale_avito.map(s => (
              <div key={s.id} className="p-2.5 hover:bg-[#FFD700]/5 transition flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] text-white/85 truncate">{s.title}</div>
                  <div className="text-[10px] text-white/40">
                    {s.updated
                      ? `обновлено ${new Date(s.updated).toLocaleDateString("ru-RU")}`
                      : "никогда не обновлялось"}
                  </div>
                </div>
                <div className="text-[12px] font-bold tabular-nums text-white/75">{money(s.price)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
