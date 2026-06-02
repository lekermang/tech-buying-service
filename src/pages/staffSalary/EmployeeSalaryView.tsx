import { useEffect, useState, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { SALARY_URL } from "@/pages/staff.types";
import SavingsView from "@/pages/staffSalary/SavingsView";
import EmployeeRepairHistory from "./EmployeeRepairHistory";
import EmployeeSalesHistory from "./EmployeeSalesHistory";
import {
  fmt, currentMonthRange,
  type TodayState, type DayRow, type PayoutRow,
  type DayDetail, type RepairHistory, type RepairDayDetail,
} from "./employee.types";

interface Props {
  token: string;
  employeeName: string;
}

export default function EmployeeSalaryView({ token, employeeName }: Props) {
  const [state, setState] = useState<TodayState | null>(null);
  const [days, setDays] = useState<DayRow[]>([]);
  const [payouts, setPayouts] = useState<PayoutRow[]>([]);
  const [loading, setLoading] = useState(true);

  const range = currentMonthRange();
  const [dateFrom, setDateFrom] = useState(range.from);
  const [dateTo, setDateTo] = useState(range.to);

  // Детализация обычных продаж
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [detailCache, setDetailCache] = useState<Record<string, DayDetail>>({});
  const [detailLoading, setDetailLoading] = useState<string | null>(null);

  // Главная вкладка (для мастера ремонтов: зарплата / копилка)
  const [mainTab, setMainTab] = useState<"salary" | "savings">("salary");

  // Ремонты
  const [repairHistory, setRepairHistory] = useState<RepairHistory | null>(null);
  const [repairLoading, setRepairLoading] = useState(false);
  const [expandedRepairDate, setExpandedRepairDate] = useState<string | null>(null);
  const [repairDetailCache, setRepairDetailCache] = useState<Record<string, RepairDayDetail>>({});
  const [repairDetailLoading, setRepairDetailLoading] = useState<string | null>(null);

  const fetchAll = useCallback(async (from: string, to: string) => {
    setLoading(true);
    const [r1, r2] = await Promise.all([
      fetch(`${SALARY_URL}?action=my_today`, { headers: { "X-Employee-Token": token } }),
      fetch(`${SALARY_URL}?action=my_history&date_from=${from}&date_to=${to}`, { headers: { "X-Employee-Token": token } }),
    ]);
    if (r1.ok) setState(await r1.json());
    if (r2.ok) { const d = await r2.json(); setDays(d.days || []); setPayouts(d.payouts || []); }
    setLoading(false);
  }, [token]);

  const fetchRepairs = useCallback(async (from: string, to: string) => {
    setRepairLoading(true);
    const r = await fetch(`${SALARY_URL}?action=my_repair_history&date_from=${from}&date_to=${to}`, {
      headers: { "X-Employee-Token": token },
    });
    if (r.ok) setRepairHistory(await r.json());
    setRepairLoading(false);
  }, [token]);

  useEffect(() => { fetchAll(dateFrom, dateTo); }, [fetchAll, dateFrom, dateTo]);

  useEffect(() => {
    if (state?.is_repair_master) {
      fetchRepairs(dateFrom, dateTo);
    }
  }, [state?.is_repair_master, dateFrom, dateTo, fetchRepairs]);

  // При смене дат перегружаем ремонты тоже
  useEffect(() => {
    if (state?.is_repair_master) fetchRepairs(dateFrom, dateTo);
  }, [dateFrom, dateTo, fetchRepairs, state?.is_repair_master]);

  const loadSaleDetail = async (date: string) => {
    if (expandedDate === date) { setExpandedDate(null); return; }
    if (detailCache[date]) { setExpandedDate(date); return; }
    setDetailLoading(date);
    try {
      const r = await fetch(`${SALARY_URL}?action=my_detail&date=${date}`, { headers: { "X-Employee-Token": token } });
      if (r.ok) { const d = await r.json(); setDetailCache(p => ({ ...p, [date]: d })); setExpandedDate(date); }
    } finally { setDetailLoading(null); }
  };

  const loadRepairDetail = async (date: string) => {
    if (expandedRepairDate === date) { setExpandedRepairDate(null); return; }
    if (repairDetailCache[date]) { setExpandedRepairDate(date); return; }
    setRepairDetailLoading(date);
    try {
      const r = await fetch(`${SALARY_URL}?action=my_repair_detail&date=${date}`, { headers: { "X-Employee-Token": token } });
      if (r.ok) { const d = await r.json(); setRepairDetailCache(p => ({ ...p, [date]: d })); setExpandedRepairDate(date); }
    } finally { setRepairDetailLoading(null); }
  };

  const totalEarned = days.reduce((s, d) => s + Number(d.total), 0);
  const totalPaid = payouts.filter(p => p.amount > 0).reduce((s, p) => s + Number(p.amount), 0);

  if (loading || !state) {
    return (
      <div className="p-8 flex items-center justify-center gap-2" style={{ color: "rgba(255,255,255,0.3)" }}>
        <Icon name="Loader2" size={18} className="animate-spin" />
        <span className="font-roboto text-sm">Загрузка...</span>
      </div>
    );
  }

  const isRepairMaster = state.is_repair_master;

  return (
    <div className="max-w-2xl mx-auto px-3 py-4 space-y-4">

      {/* Шапка */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{
          background: "linear-gradient(135deg,#FFE34D,#FFD700)", boxShadow: "0 0 16px rgba(255,215,0,0.35)",
        }}>
          <Icon name="Wallet" size={17} className="text-black" />
        </div>
        <div>
          <div className="font-oswald font-black uppercase tracking-wide text-sm" style={{
            background: "linear-gradient(90deg,#fff8e8,#FFD700)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>Моя зарплата</div>
          <div className="font-roboto text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{employeeName}</div>
        </div>
      </div>

      {/* Переключатель Зарплата / Копилка — для всех */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <button onClick={() => setMainTab("salary")}
          className="flex-1 py-2 rounded-lg font-roboto text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
          style={{
            background: mainTab === "salary" ? (isRepairMaster ? "rgba(52,211,153,0.15)" : "rgba(255,215,0,0.15)") : "transparent",
            color: mainTab === "salary" ? (isRepairMaster ? "#34d399" : "#FFD700") : "rgba(255,255,255,0.4)",
            border: mainTab === "salary" ? `1px solid ${isRepairMaster ? "rgba(52,211,153,0.35)" : "rgba(255,215,0,0.35)"}` : "1px solid transparent",
          }}>
          <Icon name={isRepairMaster ? "Wrench" : "Wallet"} size={13} />
          {isRepairMaster ? "Заработок" : "Зарплата"}
        </button>
        <button onClick={() => setMainTab("savings")}
          className="flex-1 py-2 rounded-lg font-roboto text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
          style={{
            background: mainTab === "savings" ? "rgba(167,139,250,0.15)" : "transparent",
            color: mainTab === "savings" ? "#a78bfa" : "rgba(255,255,255,0.4)",
            border: mainTab === "savings" ? "1px solid rgba(167,139,250,0.35)" : "1px solid transparent",
          }}>
          <Icon name="PiggyBank" size={13} /> Копилка
        </button>
      </div>

      {/* ── КОПИЛКА (для всех) ── */}
      {mainTab === "savings" && (
        <SavingsView token={token} />
      )}

      {/* ── ЗАРПЛАТА ── */}
      {mainTab === "salary" && <>

      {/* Итог */}
      {isRepairMaster ? (
        <div className="rounded-2xl p-5 text-center" style={{
          background: "linear-gradient(145deg,rgba(52,211,153,0.1),rgba(52,211,153,0.03))",
          border: "1.5px solid rgba(52,211,153,0.3)",
          boxShadow: "0 0 32px rgba(52,211,153,0.08)",
        }}>
          <div className="font-roboto text-[10px] uppercase tracking-widest mb-1" style={{ color: "rgba(52,211,153,0.6)" }}>Заработано за период</div>
          <div className="font-oswald font-black text-5xl tabular-nums" style={{ color: "#34d399" }}>
            {fmt(repairHistory?.total_earned ?? 0)} ₽
          </div>
          {repairHistory && repairHistory.days.length > 0 && (
            <div className="font-roboto text-xs mt-2" style={{ color: "rgba(255,255,255,0.35)" }}>
              {repairHistory.days.length} рабочих {repairHistory.days.length === 1 ? "день" : repairHistory.days.length < 5 ? "дня" : "дней"}
              · {repairHistory.days.reduce((s, d) => s + d.orders_count, 0)} ремонтов
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl p-5 text-center" style={{
          background: "linear-gradient(145deg,rgba(255,215,0,0.12),rgba(255,215,0,0.04))",
          border: "1.5px solid rgba(255,215,0,0.3)",
          boxShadow: "0 0 32px rgba(255,215,0,0.08)",
        }}>
          <div className="font-roboto text-[10px] uppercase tracking-widest mb-1" style={{ color: "rgba(255,215,0,0.6)" }}>К выплате</div>
          <div className="font-oswald font-black text-5xl tabular-nums" style={{ color: "#FFD700" }}>
            {fmt(state.remaining)} ₽
          </div>
          <div className="font-roboto text-xs mt-2" style={{ color: "rgba(255,255,255,0.35)" }}>
            Заработано {fmt(state.total_earned)} ₽ · Выплачено {fmt(state.total_paid)} ₽
          </div>
        </div>
      )}

      {/* Два показателя — только для обычных сотрудников */}
      {!isRepairMaster && (
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl p-3 text-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="font-roboto text-[10px] uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>Ставка / день</div>
            <div className="font-oswald font-bold text-xl text-white">{fmt(state.config.daily_rate)} ₽</div>
          </div>
          <div className="rounded-xl p-3 text-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="font-roboto text-[10px] uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>Бонус с продаж</div>
            <div className="font-oswald font-bold text-xl" style={{ color: "#a78bfa" }}>{state.config.bonus_percent}%</div>
          </div>
        </div>
      )}

      {/* Фильтр дат */}
      <div className="rounded-xl p-3 space-y-2" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="font-roboto text-[10px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>Период</div>
        <div className="flex items-center gap-2">
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl font-roboto text-sm text-white outline-none"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
          />
          <span className="font-roboto text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>—</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl font-roboto text-sm text-white outline-none"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
          />
        </div>
      </div>

      {/* ── РЕМОНТЫ ── */}
      {isRepairMaster && (
        <EmployeeRepairHistory
          repairHistory={repairHistory}
          repairLoading={repairLoading}
          expandedRepairDate={expandedRepairDate}
          repairDetailCache={repairDetailCache}
          repairDetailLoading={repairDetailLoading}
          onToggleDay={loadRepairDetail}
        />
      )}

      {/* ── ПРОДАЖИ (только обычные сотрудники) ── */}
      {!isRepairMaster && (
        <EmployeeSalesHistory
          days={days}
          payouts={payouts}
          totalEarned={totalEarned}
          totalPaid={totalPaid}
          expandedDate={expandedDate}
          detailCache={detailCache}
          detailLoading={detailLoading}
          onToggleDay={loadSaleDetail}
        />
      )}

      </>}

    </div>
  );
}
