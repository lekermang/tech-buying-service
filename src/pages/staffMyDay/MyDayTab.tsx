import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import Checklist from "./Checklist";
import RepairSignalsCard from "./RepairSignalsCard";
import SalesSignalsCard from "./SalesSignalsCard";
import OwnerSummaryCard from "./OwnerSummaryCard";
import SalesPlanCard, { type PlanData } from "./SalesPlanCard";
import PlanOwnerStats from "./PlanOwnerStats";
import AppDownloadCard from "@/components/AppDownloadCard";
import { STAFF_DAILY_URL, type MyDayResponse, type DailyRole, type RepairSignals, type SalesSignals } from "./types";

const ROLE_LABEL: Record<DailyRole, string> = {
  repair: "Кабинет ремонта",
  sales: "Кабинет продаж и Авито",
  owner: "Кабинет владельца",
};

const ROLE_ICON: Record<DailyRole, string> = {
  repair: "Wrench",
  sales: "Store",
  owner: "Crown",
};

export default function MyDayTab({ token }: { token: string }) {
  const [data, setData] = useState<MyDayResponse | null>(null);
  const [planData, setPlanData] = useState<PlanData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<DailyRole | null>(null);

  const load = useCallback(async (forceRole?: DailyRole | null) => {
    setLoading(true);
    setError(null);
    try {
      const qs = forceRole ? `&role=${forceRole}` : "";
      const r = await fetch(`${STAFF_DAILY_URL}?action=my-day${qs}`, {
        headers: { "X-Employee-Token": token },
      });
      const d = await r.json();
      if (d.error) setError(d.error);
      else {
        setData(d);
        if (!view) setView(d.role);
      }
    } catch {
      setError("Не удалось загрузить данные");
    } finally { setLoading(false); }
  }, [token, view]);

  useEffect(() => { load();   }, [token]);

  const toggle = async (key: string, isDone: boolean) => {
    try {
      const r = await fetch(`${STAFF_DAILY_URL}?action=toggle`, {
        method: "POST",
        headers: { "X-Employee-Token": token, "Content-Type": "application/json" },
        body: JSON.stringify({ task_key: key, is_done: isDone }),
      });
      const d = await r.json();
      if (d.error) {
        setError(d.error);
        return;
      }
      // Локально обновляем чек-лист, без полной перезагрузки
      setData(prev => {
        if (!prev) return prev;
        const tasks = prev.checklist.tasks.map(t =>
          t.key === key ? { ...t, is_done: d.is_done, completed_at: d.completed_at } : t,
        );
        const done = tasks.filter(t => t.is_done).length;
        return { ...prev, checklist: { ...prev.checklist, tasks, done } };
      });
    } catch {
      setError("Не удалось сохранить");
    }
  };

  const isOwner = data?.employee.role === "owner";
  const role = view || data?.role || "sales";

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <Icon name={ROLE_ICON[role]} size={16} className="text-[#FFD700]" />
        <div className="text-sm font-bold text-white">{ROLE_LABEL[role]}</div>
        {data && (
          <span className="text-[11px] text-white/45 tabular-nums">
            {new Date(data.today).toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" })}
          </span>
        )}
        <button
          onClick={() => load(view)}
          disabled={loading}
          className="ml-auto p-2 rounded-md bg-gradient-to-br from-[#141414] to-[#0E0E0E] border border-[#1F1F1F] text-white/45 hover:text-[#FFD700] hover:border-[#FFD700]/40 transition"
          title="Обновить"
        >
          <Icon name={loading ? "Loader" : "RefreshCw"} size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Переключатель ролей — только владельцу */}
      {isOwner && (
        <div className="inline-flex p-1 rounded-full bg-gradient-to-br from-[#0E0E0E] to-[#080808] border border-[#1F1F1F]">
          {(["owner", "repair", "sales"] as DailyRole[]).map(r => (
            <button
              key={r}
              onClick={() => { setView(r); load(r); }}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition inline-flex items-center gap-1.5 ${
                view === r
                  ? "bg-gradient-to-b from-[#FFE34D] to-[#d4a017] text-black shadow-[0_3px_10px_rgba(255,215,0,0.4)]"
                  : "text-white/55 hover:text-[#FFD700]"
              }`}
            >
              <Icon name={ROLE_ICON[r]} size={11} />
              {ROLE_LABEL[r].replace("Кабинет ", "")}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="px-3 py-2 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 text-xs flex items-center gap-2">
          <Icon name="AlertCircle" size={14} />
          {error}
          <button onClick={() => load(view)} className="ml-auto underline hover:text-white">Повторить</button>
        </div>
      )}

      {loading && !data && (
        <div className="flex flex-col items-center justify-center py-14 gap-2 text-white/40">
          <Icon name="Loader" size={20} className="animate-spin text-[#FFD700]" />
          <span className="font-roboto text-sm">Готовлю твой день…</span>
        </div>
      )}

      {/* План продаж — виден всем ролям */}
      <SalesPlanCard token={token} onData={setPlanData} />

      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Слева — чек-лист */}
          <div className="lg:col-span-1">
            <Checklist
              checklist={data.checklist}
              token={token}
              onToggle={toggle}
              onRefresh={() => load(view)}
              accent={data.role === "repair" ? "blue" : data.role === "owner" ? "violet" : "gold"}
            />
          </div>

          {/* Справа — сигналы */}
          <div className="lg:col-span-2">
            {data.role === "repair" && (
              <RepairSignalsCard signals={data.signals as RepairSignals} />
            )}
            {data.role === "sales" && (
              <SalesSignalsCard signals={data.signals as SalesSignals} />
            )}
            {data.role === "owner" && (
              <>
                <OwnerSummaryCard
                  repair={(data.signals as { repair: RepairSignals; sales: SalesSignals }).repair}
                  sales={(data.signals as { repair: RepairSignals; sales: SalesSignals }).sales}
                  team={data.team}
                />
                {planData && <PlanOwnerStats data={planData} />}
              </>
            )}
          </div>
        </div>
      )}

      {/* Скачать нативное приложение */}
      <AppDownloadCard
        title="Установи приложение"
        subtitle="Работает быстрее сайта · офлайн-поиск клиентов"
      />
    </div>
  );
}