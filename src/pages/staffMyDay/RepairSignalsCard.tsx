import Icon from "@/components/ui/icon";
import type { RepairSignals } from "./types";

const STATUS_LABEL: Record<string, string> = {
  new: "Новый",
  in_progress: "В работе",
  waiting_parts: "Ждёт деталь",
  ready: "Готов к выдаче",
};

const STATUS_COLOR: Record<string, string> = {
  new: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  in_progress: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  waiting_parts: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  ready: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
};

const money = (n: number) => Math.round(n).toLocaleString("ru-RU") + " ₽";

export default function RepairSignalsCard({ signals }: { signals: RepairSignals }) {
  const critical = signals.dead_money >= 50000 || signals.count_stuck >= 5;

  return (
    <div className="space-y-3">
      {/* Главный KPI блок */}
      <div className={`relative rounded-xl p-4 border ${
        critical
          ? "bg-gradient-to-br from-rose-500/15 to-rose-500/5 border-rose-500/40"
          : "bg-gradient-to-br from-amber-500/10 to-amber-500/0 border-amber-500/30"
      }`}>
        <div className="flex items-center gap-2 mb-1">
          <Icon name="AlertTriangle" size={14} className={critical ? "text-rose-400" : "text-amber-400"} />
          <div className="text-[11px] uppercase tracking-wider font-bold text-white/70">Мёртвые деньги в ремонте</div>
        </div>
        <div className="text-3xl font-bold tabular-nums text-white">{money(signals.dead_money)}</div>
        <div className="text-[12px] text-white/55 mt-1">
          {signals.count_stuck} ремонт{signals.count_stuck === 1 ? "" : "ов"} стоит больше 2 дней
        </div>
        {critical && (
          <div className="mt-2 text-[11px] text-rose-300 font-medium">
            🚨 Цель на сегодня: разморозить минимум 20% ({money(signals.dead_money * 0.2)})
          </div>
        )}
      </div>

      {/* Готовые к выдаче */}
      {signals.ready_to_hand_off.length > 0 && (
        <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/0 border border-emerald-500/30 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <Icon name="PackageCheck" size={14} className="text-emerald-400" />
            <div className="text-[11px] uppercase tracking-wider font-bold text-emerald-300">
              Готовы к выдаче ({signals.ready_to_hand_off.length})
            </div>
          </div>
          <div className="space-y-1.5">
            {signals.ready_to_hand_off.slice(0, 5).map(r => (
              <div key={r.id} className="flex items-center gap-2 text-[12px] p-1.5 rounded bg-black/30">
                <span className="text-white/40">#{r.id}</span>
                <span className="text-white/85 truncate flex-1">{r.name} · {r.model || "—"}</span>
                <span className="font-bold tabular-nums text-emerald-300">{money(r.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Висящие ремонты */}
      <div className="bg-gradient-to-br from-[#0E0E0E] to-[#080808] border border-[#1F1F1F] rounded-xl overflow-hidden">
        <div className="px-3 py-2 border-b border-[#1F1F1F] flex items-center gap-2">
          <Icon name="Clock" size={14} className="text-amber-400" />
          <div className="text-[11px] uppercase tracking-wider text-white/60 font-bold">
            Висящие ремонты (старше 2 дней)
          </div>
        </div>
        {signals.stuck_orders.length === 0 ? (
          <div className="p-6 text-center text-emerald-400/80 text-sm">
            ✅ Висяков нет, отличная работа!
          </div>
        ) : (
          <div className="divide-y divide-[#1F1F1F]/60 max-h-[400px] overflow-y-auto">
            {signals.stuck_orders.map(o => (
              <div key={o.id} className="p-3 hover:bg-[#FFD700]/5 transition">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white/40 text-[11px] tabular-nums">#{o.id}</span>
                  <span className="text-white/85 text-[13px] font-medium truncate flex-1">
                    {o.name} · {o.model || "—"}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] border ${STATUS_COLOR[o.status] || "bg-white/5 text-white/55 border-white/10"}`}>
                    {STATUS_LABEL[o.status] || o.status}
                  </span>
                </div>
                <div className="flex flex-wrap gap-3 text-[11px] text-white/55">
                  <span className="inline-flex items-center gap-1">
                    <Icon name="Calendar" size={10} />
                    {o.days.toFixed(0)} дн.
                  </span>
                  {o.parts_cost > 0 && (
                    <span>Детали: <span className="text-white/85 tabular-nums">{money(o.parts_cost)}</span></span>
                  )}
                  {o.advance > 0 && (
                    <span>Аванс: <span className="text-white/85 tabular-nums">{money(o.advance)}</span></span>
                  )}
                  <span className="ml-auto text-rose-300 font-bold tabular-nums">
                    Заморожено: {money(o.frozen)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
