import Icon from "@/components/ui/icon";
import type { RepairSignals, SalesSignals, TeamRow } from "./types";

const money = (n: number) => Math.round(n).toLocaleString("ru-RU") + " ₽";

const ROLE_LABEL: Record<string, string> = {
  repair: "Ремонт",
  sales: "Продажи/Авито",
  owner: "Владелец",
};

export default function OwnerSummaryCard({
  repair, sales, team,
}: {
  repair: RepairSignals;
  sales: SalesSignals;
  team?: TeamRow[];
}) {
  const dangers: string[] = [];
  if (repair.dead_money >= 50000) dangers.push(`💀 Мёртвые деньги ${money(repair.dead_money)} — звонок Давиду`);
  if (sales.avito_index < 0.7) dangers.push(`📉 Авито-индекс ${sales.avito_index.toFixed(2)} — Богдану задача`);
  if (repair.count_stuck >= 5) dangers.push(`⏰ ${repair.count_stuck} ремонтов >2 дней — разобрать`);
  if (sales.incomplete_items_count >= 10) dangers.push(`🖼 ${sales.incomplete_items_count} товаров без описания/фото`);

  return (
    <div className="space-y-3">
      {/* Узкие места */}
      <div className="rounded-xl p-4 bg-gradient-to-br from-rose-500/10 to-rose-500/0 border border-rose-500/30">
        <div className="flex items-center gap-2 mb-2">
          <Icon name="AlertOctagon" size={14} className="text-rose-400" />
          <div className="text-[11px] uppercase tracking-wider font-bold text-rose-300">Узкие места дня</div>
        </div>
        {dangers.length === 0 ? (
          <div className="text-[13px] text-emerald-300/85">✅ Красных зон нет — продолжайте контроль</div>
        ) : (
          <ul className="space-y-1.5">
            {dangers.map((d, i) => (
              <li key={i} className="text-[13px] text-white/85">{d}</li>
            ))}
          </ul>
        )}
      </div>

      {/* Сводные KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <div className="rounded-lg p-3 bg-gradient-to-br from-amber-500/10 to-amber-500/0 border border-amber-500/30">
          <div className="text-[10px] uppercase tracking-wider text-white/55">Мёртвые деньги</div>
          <div className="text-lg font-bold tabular-nums text-amber-300 mt-0.5">{money(repair.dead_money)}</div>
          <div className="text-[10px] text-white/40">{repair.count_stuck} висяков</div>
        </div>
        <div className="rounded-lg p-3 bg-gradient-to-br from-emerald-500/10 to-emerald-500/0 border border-emerald-500/30">
          <div className="text-[10px] uppercase tracking-wider text-white/55">Готовы к выдаче</div>
          <div className="text-lg font-bold tabular-nums text-emerald-300 mt-0.5">{repair.ready_to_hand_off.length}</div>
          <div className="text-[10px] text-white/40">{money(repair.ready_to_hand_off.reduce((s, r) => s + r.amount, 0))}</div>
        </div>
        <div className={`rounded-lg p-3 ${
          sales.avito_index_ok
            ? "bg-gradient-to-br from-emerald-500/10 to-emerald-500/0 border border-emerald-500/30"
            : "bg-gradient-to-br from-rose-500/10 to-rose-500/0 border border-rose-500/30"
        }`}>
          <div className="text-[10px] uppercase tracking-wider text-white/55">Авито-индекс</div>
          <div className={`text-lg font-bold tabular-nums mt-0.5 ${sales.avito_index_ok ? "text-emerald-300" : "text-rose-300"}`}>
            {sales.avito_index.toFixed(2)}
          </div>
          <div className="text-[10px] text-white/40">{sales.on_avito_count}/{sales.showcase_count}</div>
        </div>
        <div className="rounded-lg p-3 bg-gradient-to-br from-sky-500/10 to-sky-500/0 border border-sky-500/30">
          <div className="text-[10px] uppercase tracking-wider text-white/55">Скупки сегодня</div>
          <div className="text-lg font-bold tabular-nums text-sky-300 mt-0.5">
            {sales.today_buyouts + sales.today_gold}
          </div>
          <div className="text-[10px] text-white/40">Б/У {sales.today_buyouts} · Au {sales.today_gold}</div>
        </div>
      </div>

      {/* Прогресс команды */}
      {team && team.length > 0 && (
        <div className="bg-gradient-to-br from-[#0E0E0E] to-[#080808] border border-[#1F1F1F] rounded-xl overflow-hidden">
          <div className="px-3 py-2 border-b border-[#1F1F1F] flex items-center gap-2">
            <Icon name="Users" size={14} className="text-[#FFD700]" />
            <div className="text-[11px] uppercase tracking-wider text-white/60 font-bold">Прогресс команды сегодня</div>
          </div>
          <div className="divide-y divide-[#1F1F1F]/60">
            {team.map(t => {
              const pct = t.total ? (t.done / t.total) * 100 : 0;
              const allDone = t.total > 0 && t.done >= t.total;
              return (
                <div key={t.id} className="p-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] text-white/85 font-medium truncate">
                      {t.full_name} <span className="text-white/40">· {ROLE_LABEL[t.role]}</span>
                    </div>
                    <div className="h-1 bg-[#1F1F1F] rounded-full overflow-hidden mt-1">
                      <div className="h-full bg-gradient-to-r from-[#FFD700] to-emerald-400 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div className={`text-[12px] tabular-nums font-bold ${allDone ? "text-emerald-300" : "text-white/65"}`}>
                    {t.done}/{t.total}
                    {allDone && <Icon name="CheckCircle" size={12} className="inline ml-1 text-emerald-400" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
