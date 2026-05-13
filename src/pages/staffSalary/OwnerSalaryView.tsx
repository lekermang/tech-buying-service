import { useEffect, useState, useCallback, useMemo } from "react";
import { SALARY_URL, type EmployeeOverview } from "@/pages/staff.types";
import {
  isoLocal, startOfMonth, endOfMonth,
  type CalendarDay, type DetailState, type LogRow,
} from "./ownerSalary/ownerSalaryTypes";
import { DayEditModal, PayoutModal, BulkFillModal } from "./ownerSalary/OwnerSalaryModals";
import OwnerEmployeesList from "./ownerSalary/OwnerEmployeesList";
import OwnerEmployeeDetail from "./ownerSalary/OwnerEmployeeDetail";

interface Props {
  token: string;
}

export default function OwnerSalaryView({ token }: Props) {
  const [employees, setEmployees] = useState<EmployeeOverview[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<DetailState | null>(null);
  const [editing, setEditing] = useState<{ daily_rate: string; bonus_percent: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [viewMonth, setViewMonth] = useState<Date>(() => startOfMonth(new Date()));
  const [dayEdit, setDayEdit] = useState<{ date: string; log: LogRow | null } | null>(null);
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);

  const headers = {
    "X-Employee-Token": token,
    "Content-Type": "application/json",
  };

  const fetchOverview = useCallback(async () => {
    const r = await fetch(`${SALARY_URL}?action=owner_overview`, { headers: { "X-Employee-Token": token } });
    if (r.ok) {
      const d = await r.json();
      setEmployees(d.employees || []);
    }
  }, [token]);

  const fetchDetail = useCallback(async (empId: number, month: Date) => {
    const from = isoLocal(startOfMonth(month));
    const to = isoLocal(endOfMonth(month));
    const r = await fetch(
      `${SALARY_URL}?action=owner_employee_detail&employee_id=${empId}&from=${from}&to=${to}`,
      { headers: { "X-Employee-Token": token } },
    );
    if (r.ok) setDetail(await r.json());
  }, [token]);

  useEffect(() => {
    fetchOverview().finally(() => setLoading(false));
  }, [fetchOverview]);

  useEffect(() => {
    if (selectedId) {
      setDetail(null);
      fetchDetail(selectedId, viewMonth);
    }
  }, [selectedId, viewMonth, fetchDetail]);

  const selected = employees.find(e => e.id === selectedId) || null;

  const beginEdit = () => {
    if (!selected) return;
    setEditing({
      daily_rate: String(selected.daily_rate),
      bonus_percent: String(selected.bonus_percent),
    });
  };

  const saveConfig = async () => {
    if (!selected || !editing) return;
    setBusy(true);
    try {
      await fetch(`${SALARY_URL}?action=owner_set_config`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          employee_id: selected.id,
          daily_rate: Number(editing.daily_rate) || 0,
          bonus_percent: Number(editing.bonus_percent) || 0,
        }),
      });
      setEditing(null);
      await fetchOverview();
    } finally {
      setBusy(false);
    }
  };

  const reloadAfterChange = async () => {
    if (selected) {
      await fetchDetail(selected.id, viewMonth);
      await fetchOverview();
    }
  };

  const deletePayout = async (id: number) => {
    if (!confirm("Отменить эту выплату?")) return;
    setBusy(true);
    try {
      await fetch(`${SALARY_URL}?action=owner_delete_payout`, {
        method: "POST",
        headers,
        body: JSON.stringify({ payout_id: id }),
      });
      await reloadAfterChange();
    } finally {
      setBusy(false);
    }
  };

  const goPrevMonth = () => setViewMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const goNextMonth = () => setViewMonth(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  const goCurrentMonth = () => setViewMonth(startOfMonth(new Date()));

  // Сетка месяца, понедельник-первый
  const monthGrid = useMemo(() => {
    const first = startOfMonth(viewMonth);
    const last = endOfMonth(viewMonth);
    const daysInMonth = last.getDate();
    const firstWd = (first.getDay() + 6) % 7;
    type Cell = { date: string | null; status: CalendarDay["status"] | null; total: number; payout: number };
    const cells: Cell[] = [];
    const calMap = new Map((detail?.calendar || []).map(d => [d.shift_date.slice(0, 10), d.status]));
    const logMap = new Map((detail?.history || []).map(l => [l.shift_date.slice(0, 10), l.total || 0]));
    const payMap = new Map<string, number>();
    for (const p of detail?.payouts || []) {
      const k = p.payout_date.slice(0, 10);
      payMap.set(k, (payMap.get(k) || 0) + (p.amount || 0));
    }
    for (let i = 0; i < firstWd; i++) cells.push({ date: null, status: null, total: 0, payout: 0 });
    for (let d = 1; d <= daysInMonth; d++) {
      const cur = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d);
      const iso = isoLocal(cur);
      cells.push({
        date: iso,
        status: calMap.get(iso) || null,
        total: logMap.get(iso) || 0,
        payout: payMap.get(iso) || 0,
      });
    }
    while (cells.length % 7 !== 0) cells.push({ date: null, status: null, total: 0, payout: 0 });
    return cells;
  }, [viewMonth, detail]);

  const monthSummary = useMemo(() => {
    if (!detail) return { earned: 0, paid: 0, remaining: 0 };
    const from = isoLocal(startOfMonth(viewMonth));
    const to = isoLocal(endOfMonth(viewMonth));
    let earned = 0;
    for (const h of detail.history) {
      const d = h.shift_date.slice(0, 10);
      if (d >= from && d <= to) earned += Number(h.total) || 0;
    }
    let paid = 0;
    for (const p of detail.payouts) {
      const d = p.payout_date.slice(0, 10);
      if (d >= from && d <= to) paid += Number(p.amount) || 0;
    }
    return { earned, paid, remaining: earned - paid };
  }, [detail, viewMonth]);

  const isCurrentMonth = useMemo(() => {
    const now = new Date();
    return now.getFullYear() === viewMonth.getFullYear() && now.getMonth() === viewMonth.getMonth();
  }, [viewMonth]);

  const todayIso = isoLocal(new Date());
  const logByDate = useMemo(() => {
    const m = new Map<string, LogRow>();
    for (const h of detail?.history || []) m.set(h.shift_date.slice(0, 10), h);
    return m;
  }, [detail]);

  if (loading) {
    return <div className="p-6 text-center text-white/50">Загрузка...</div>;
  }

  // === ЭКРАН СПИСКА ===
  if (!selectedId) {
    return (
      <OwnerEmployeesList
        employees={employees}
        onSelect={(id) => { setSelectedId(id); setViewMonth(startOfMonth(new Date())); }}
      />
    );
  }

  // === ЭКРАН ДЕТАЛЕЙ ===
  return (
    <>
      {selected && (
        <OwnerEmployeeDetail
          selected={selected}
          detail={detail}
          editing={editing}
          busy={busy}
          viewMonth={viewMonth}
          isCurrentMonth={isCurrentMonth}
          todayIso={todayIso}
          monthGrid={monthGrid}
          monthSummary={monthSummary}
          logByDate={logByDate}
          onBack={() => { setSelectedId(null); setEditing(null); setDetail(null); }}
          onBeginEdit={beginEdit}
          onCancelEdit={() => setEditing(null)}
          onChangeEditing={setEditing}
          onSaveConfig={saveConfig}
          onPrevMonth={goPrevMonth}
          onNextMonth={goNextMonth}
          onCurrentMonth={goCurrentMonth}
          onDayClick={(date, log) => setDayEdit({ date, log })}
          onOpenBulk={() => setBulkOpen(true)}
          onOpenPayout={() => setPayoutOpen(true)}
          onDeletePayout={deletePayout}
        />
      )}

      {/* Модалки */}
      {dayEdit && selected && (
        <DayEditModal
          open={!!dayEdit}
          day={dayEdit.date}
          employeeId={selected.id}
          defaultRate={selected.daily_rate}
          defaultPercent={selected.bonus_percent}
          currentLog={dayEdit.log}
          token={token}
          onClose={() => setDayEdit(null)}
          onSaved={reloadAfterChange}
        />
      )}
      {selected && (
        <PayoutModal
          open={payoutOpen}
          employeeId={selected.id}
          token={token}
          onClose={() => setPayoutOpen(false)}
          onSaved={reloadAfterChange}
        />
      )}
      {selected && (
        <BulkFillModal
          open={bulkOpen}
          employeeId={selected.id}
          defaultRate={selected.daily_rate}
          defaultPercent={selected.bonus_percent}
          token={token}
          onClose={() => setBulkOpen(false)}
          onSaved={reloadAfterChange}
        />
      )}
    </>
  );
}
