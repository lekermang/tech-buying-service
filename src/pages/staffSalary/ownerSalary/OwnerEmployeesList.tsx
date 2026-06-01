import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import type { EmployeeOverview } from "@/pages/staff.types";
import { statusDot } from "./ownerSalaryTypes";

const SAVINGS_URL = "https://functions.poehali.dev/4b6d2cd3-a8ca-4aac-aec2-ba9664b21b07";
const fmt = (n: number) => Math.round(n).toLocaleString("ru-RU");

type MyStats = {
  profit_today: number;
  revenue_today: number;
  sales_today: number;
  profit_month: number;
  revenue_month: number;
  sales_month: number;
  sl_profit_today: number;
  repair_profit_today: number;
  contract_profit_today: number;
  gold_profit_today: number;
  gold_profit_month: number;
} | null;

type SavingsEmp = {
  id: number;
  full_name: string;
  total_saved: number;
  active_goals: number;
  done_goals: number;
  total_target: number;
};

export default function OwnerEmployeesList({
  employees,
  myStats,
  onSelect,
  token,
}: {
  employees: EmployeeOverview[];
  myStats?: MyStats;
  onSelect: (id: number) => void;
  token: string;
}) {
  const [savingsData, setSavingsData] = useState<{ employees: SavingsEmp[]; grand_total: number } | null>(null);
  const [savingsOpen, setSavingsOpen] = useState(false);

  useEffect(() => {
    if (!savingsOpen || savingsData) return;
    fetch(`${SAVINGS_URL}?action=owner_savings_overview`, { headers: { "X-Employee-Token": token } })
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setSavingsData(d));
  }, [savingsOpen, token, savingsData]);
  const now = new Date();
  const monthLabel = now.toLocaleString("ru-RU", { month: "long" });

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-5">

      {/* Шапка */}
      <div>
        <h2 className="font-oswald font-bold text-2xl text-white uppercase tracking-wide">Зарплаты</h2>
        <p className="text-white/50 text-sm mt-1 font-roboto">Управление сотрудниками</p>
      </div>

      {/* Прибыль магазина сегодня */}
      {myStats && (
        <div className="rounded-2xl overflow-hidden" style={{
          background: "linear-gradient(145deg,rgba(255,215,0,0.1),rgba(255,215,0,0.03))",
          border: "1.5px solid rgba(255,215,0,0.3)",
          boxShadow: "0 0 32px rgba(255,215,0,0.06)",
        }}>
          <div className="px-4 py-2.5 flex items-center gap-2" style={{ borderBottom: "1px solid rgba(255,215,0,0.1)" }}>
            <Icon name="TrendingUp" size={12} style={{ color: "rgba(255,215,0,0.7)" }} />
            <span className="font-roboto text-[10px] uppercase tracking-widest font-semibold" style={{ color: "rgba(255,215,0,0.6)" }}>
              Прибыль магазина сегодня
            </span>
          </div>
          <div className="px-4 py-4 space-y-4">
            {/* Главная цифра */}
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="font-roboto text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>
                  Чистая прибыль
                </div>
                <div className="font-oswald font-black text-4xl tabular-nums" style={{ color: "#FFD700" }}>
                  +{fmt(myStats.profit_today)} ₽
                </div>
                <div className="font-roboto text-xs mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>
                  выручка {fmt(myStats.revenue_today)} ₽
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-roboto text-[10px] uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>
                  За {monthLabel}
                </div>
                <div className="font-oswald font-bold text-xl tabular-nums" style={{ color: "rgba(255,215,0,0.7)" }}>
                  {fmt(myStats.profit_month)} ₽
                </div>
                <div className="font-roboto text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>
                  выручка {fmt(myStats.revenue_month)} ₽
                </div>
              </div>
            </div>

            {/* Разбивка по источникам */}
            <div className="grid grid-cols-2 gap-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "12px" }}>
              <div className="rounded-xl p-2.5 text-center" style={{ background: "rgba(52,211,153,0.07)", border: "1px solid rgba(52,211,153,0.15)" }}>
                <div className="font-roboto text-[9px] uppercase tracking-widest mb-1" style={{ color: "rgba(52,211,153,0.6)" }}>Ремонты</div>
                <div className="font-oswald font-bold text-base tabular-nums" style={{ color: "#34d399" }}>
                  {fmt(myStats.repair_profit_today)} ₽
                </div>
              </div>
              <div className="rounded-xl p-2.5 text-center" style={{ background: "rgba(167,139,250,0.07)", border: "1px solid rgba(167,139,250,0.15)" }}>
                <div className="font-roboto text-[9px] uppercase tracking-widest mb-1" style={{ color: "rgba(167,139,250,0.6)" }}>Б/У техника</div>
                <div className="font-oswald font-bold text-base tabular-nums" style={{ color: "#a78bfa" }}>
                  {fmt(myStats.sl_profit_today)} ₽
                </div>
              </div>
              <div className="rounded-xl p-2.5 text-center" style={{ background: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.15)" }}>
                <div className="font-roboto text-[9px] uppercase tracking-widest mb-1" style={{ color: "rgba(251,191,36,0.6)" }}>Договора</div>
                <div className="font-oswald font-bold text-base tabular-nums" style={{ color: "#fbbf24" }}>
                  {fmt(myStats.contract_profit_today)} ₽
                </div>
              </div>
              <div className="rounded-xl p-2.5 text-center" style={{ background: "rgba(250,204,21,0.07)", border: "1px solid rgba(250,204,21,0.15)" }}>
                <div className="font-roboto text-[9px] uppercase tracking-widest mb-1" style={{ color: "rgba(250,204,21,0.6)" }}>Золото</div>
                <div className="font-oswald font-bold text-base tabular-nums" style={{ color: "#facc15" }}>
                  {fmt(myStats.gold_profit_today)} ₽
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Накопления сотрудников */}
      <div className="rounded-xl overflow-hidden" style={{
        border: "1px solid rgba(167,139,250,0.25)",
        background: "rgba(167,139,250,0.04)",
      }}>
        <button
          className="w-full flex items-center justify-between px-4 py-3"
          onClick={() => setSavingsOpen(v => !v)}
        >
          <div className="flex items-center gap-2">
            <Icon name="PiggyBank" size={15} style={{ color: "#a78bfa" }} />
            <span className="font-oswald font-bold text-sm uppercase tracking-wide" style={{ color: "#a78bfa" }}>
              Копилки сотрудников
            </span>
          </div>
          <div className="flex items-center gap-3">
            {savingsData && (
              <span className="font-oswald font-bold tabular-nums text-sm" style={{ color: "#a78bfa" }}>
                {fmt(savingsData.grand_total)} ₽
              </span>
            )}
            <Icon name={savingsOpen ? "ChevronUp" : "ChevronDown"} size={15} style={{ color: "rgba(167,139,250,0.5)" }} />
          </div>
        </button>

        {savingsOpen && (
          <div className="px-4 pb-4 space-y-2" style={{ borderTop: "1px solid rgba(167,139,250,0.12)" }}>
            {!savingsData ? (
              <div className="py-4 flex items-center justify-center gap-2" style={{ color: "rgba(255,255,255,0.3)" }}>
                <Icon name="Loader2" size={14} className="animate-spin" />
                <span className="font-roboto text-sm">Загрузка...</span>
              </div>
            ) : savingsData.employees.length === 0 ? (
              <div className="py-4 text-center font-roboto text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
                Никто ещё не начал копить
              </div>
            ) : (
              <>
                {/* Итого */}
                <div className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <span className="font-roboto text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Всего накоплено командой</span>
                  <span className="font-oswald font-black text-lg tabular-nums" style={{ color: "#a78bfa" }}>
                    {fmt(savingsData.grand_total)} ₽
                  </span>
                </div>
                {/* По каждому */}
                {savingsData.employees.map(e => (
                  <div key={e.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5" style={{
                    background: e.total_saved > 0 ? "rgba(167,139,250,0.07)" : "rgba(255,255,255,0.02)",
                    border: e.total_saved > 0 ? "1px solid rgba(167,139,250,0.18)" : "1px solid rgba(255,255,255,0.05)",
                  }}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center font-oswald font-bold text-xs shrink-0" style={{
                      background: "rgba(167,139,250,0.15)", color: "#a78bfa",
                    }}>
                      {(e.full_name || "?").trim().split(/\s+/).map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-roboto text-sm font-semibold text-white truncate">{e.full_name}</div>
                      <div className="font-roboto text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                        {e.active_goals > 0 ? `${e.active_goals} активн. ${e.active_goals === 1 ? "цель" : e.active_goals < 5 ? "цели" : "целей"}` : "Нет активных целей"}
                        {e.done_goals > 0 && ` · ${e.done_goals} выполнено`}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-oswald font-bold tabular-nums" style={{
                        color: e.total_saved > 0 ? "#a78bfa" : "rgba(255,255,255,0.2)",
                      }}>
                        {e.total_saved > 0 ? `${fmt(e.total_saved)} ₽` : "—"}
                      </div>
                      {e.total_target > 0 && (
                        <div className="font-roboto text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>
                          цель {fmt(e.total_target)} ₽
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* Список сотрудников */}
      <div>
        <div className="font-roboto text-[10px] uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>
          Сотрудники
        </div>
        {employees.length === 0 ? (
          <div className="text-white/40 text-center py-8 font-roboto">Нет активных сотрудников</div>
        ) : (
          <div className="space-y-2">
            {employees.map(e => {
              const dot = statusDot(e.shift_status);
              return (
                <button
                  key={e.id}
                  onClick={() => onSelect(e.id)}
                  className="w-full text-left rounded-xl bg-white/5 hover:bg-white/[0.08] border border-white/10 hover:border-[#FFD700]/30 p-4 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="shrink-0 w-11 h-11 rounded-full bg-gradient-to-br from-[#FFD700]/20 to-[#FFD700]/5 border border-[#FFD700]/25 flex items-center justify-center font-oswald font-bold text-[#FFD700]">
                      {(e.full_name || "?").trim().split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-oswald font-bold text-white text-base truncate">{e.full_name}</span>
                        <span className="inline-flex items-center gap-1 text-[10px] text-white/40 font-roboto">
                          <span className={`w-1.5 h-1.5 rounded-full ${dot.color}`} />
                          {dot.label}
                        </span>
                      </div>
                      <div className="text-white/35 text-xs font-roboto mt-0.5">
                        {e.position || e.role} · {e.daily_rate.toLocaleString("ru-RU")} ₽/смена · {e.bonus_percent}%
                      </div>
                    </div>
                    {(e.unpaid_total ?? 0) > 0 && (
                      <div className="text-right shrink-0">
                        <div className="text-[10px] uppercase tracking-wide text-white/40 font-roboto">К выплате</div>
                        <div className="text-[#FFD700] font-bold font-oswald tabular-nums text-sm">
                          {Number(e.unpaid_total).toLocaleString("ru-RU")} ₽
                        </div>
                      </div>
                    )}
                    <Icon name="ChevronRight" size={15} className="text-white/25 shrink-0" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}