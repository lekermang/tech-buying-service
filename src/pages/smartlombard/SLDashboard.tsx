import { useState, useEffect, useCallback } from "react";
import { SMARTLOMBARD_URL } from "../staff.types";
import {
  Stats,
  errToText,
  todayDmy,
  PRESETS,
} from "./dashboard/SLDashboardTypes";
import { SLDateRangePicker } from "./dashboard/SLDateRangePicker";
import { SLTokenStatusBar } from "./dashboard/SLTokenStatusBar";
import { SLDiagnosticsPanel } from "./dashboard/SLDiagnosticsPanel";
import { SLAccountCheckPanel } from "./dashboard/SLAccountCheckPanel";
import { SLStatsGrid } from "./dashboard/SLStatsGrid";

export function SLDashboard({ token }: { token: string }) {
  const [preset, setPreset] = useState("m30");
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Произвольный диапазон дат (используется когда preset === "custom")
  const [customFrom, setCustomFrom] = useState(todayDmy());
  const [customTo, setCustomTo] = useState(todayDmy());
  const [showCustom, setShowCustom] = useState(false);

  // Состояние токена SmartLombard (по доке: 1 запрос → 20 минут жизни)
  const [tokenAge, setTokenAge] = useState<number | null>(null);
  const [tokenTtl, setTokenTtl] = useState<number | null>(null);
  const [tokenError, setTokenError] = useState("");
  const [tokenRateLimited, setTokenRateLimited] = useState(false);
  const [tokenChecking, setTokenChecking] = useState(false);

  // Диагностика API SmartLombard — что реально вернул /operations
  const [diagData, setDiagData] = useState<Record<string, unknown> | null>(null);
  const [diagLoading, setDiagLoading] = useState(false);

  // Проверка содержимого аккаунта (branches/employees/clients/pawn_tickets)
  const [accountData, setAccountData] = useState<Record<string, unknown> | null>(null);
  const [accountLoading, setAccountLoading] = useState(false);

  const runAccountCheck = useCallback(async () => {
    setAccountLoading(true);
    try {
      const url = `${SMARTLOMBARD_URL}?action=account_check`;
      const res = await fetch(url, { headers: { "X-Employee-Token": token } });
      const data = await res.json();
      setAccountData(data);
    } catch (e) {
      setAccountData({ error: e instanceof Error ? e.message : String(e) });
    } finally {
      setAccountLoading(false);
    }
  }, [token]);

  // Возвращает {from, to} для текущего пресета (или кастомного диапазона)
  const getRange = useCallback(() => {
    if (preset === "custom") return { from: customFrom, to: customTo };
    const p = PRESETS.find(x => x.k === preset) || PRESETS[0];
    return { from: p.from(), to: p.to() };
  }, [preset, customFrom, customTo]);

  const runDiag = useCallback(async () => {
    setDiagLoading(true);
    try {
      const r = getRange();
      const url = `${SMARTLOMBARD_URL}?date_from=${r.from}&date_to=${r.to}&debug=1&nocache=1`;
      const res = await fetch(url, { headers: { "X-Employee-Token": token } });
      const data = await res.json();
      setDiagData(data);
    } catch (e) {
      setDiagData({ error: e instanceof Error ? e.message : String(e) });
    } finally {
      setDiagLoading(false);
    }
  }, [getRange, token]);

  const checkToken = useCallback(async (force = false) => {
    setTokenChecking(true); setTokenError(""); setTokenRateLimited(false);
    try {
      const url = `${SMARTLOMBARD_URL}?action=auth_check${force ? "&force=1" : ""}`;
      const res = await fetch(url, { headers: { "X-Employee-Token": token } });
      const data = await res.json();
      if (!res.ok || data.error) {
        setTokenError(errToText(data.error) || `HTTP ${res.status}`);
        setTokenAge(null); setTokenTtl(null);
      } else {
        // rate_limited — лимит на перевыпуск, но старый токен ещё рабочий
        if (data.rate_limited) {
          setTokenRateLimited(true);
        }
        setTokenAge(data.token_age_sec ?? 0);
        setTokenTtl(data.token_expires_in_sec ?? null);
      }
    } catch (e) {
      setTokenError(e instanceof Error ? e.message : String(e));
    } finally {
      setTokenChecking(false);
    }
  }, [token]);

  const load = useCallback(async (force = false) => {
    setLoading(true); setError("");
    const r = getRange();
    // Используем парсер «Касса и банк» (HTML) — REST API ломбарда возвращает 0,
    // т.к. ключи выписаны на пустой ломбардный профиль. Реальные данные
    // (продажи айфонов, скупка) живут в комиссионке и доступны через парсер.
    const url = `${SMARTLOMBARD_URL}?action=kassa_period&date_from=${r.from}&date_to=${r.to}${force ? "&nocache=1" : ""}`;
    try {
      const res = await fetch(url, { headers: { "X-Employee-Token": token } });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(errToText(data.error) || `Ошибка ${res.status}`);
        setStats(null);
      } else {
        // Маппим ответ kassa_period на стандартную структуру Stats:
        // income_total → income (Приход)
        // expense_total → expense (Расход)
        // sales_total/sales_count → продажи товара
        // buyout_total/buyout_count → скупка (= "Залоги" в нашей сетке)
        // Прибыль считаем как income - expense (приход минус расход кассы).
        const incomeNum = Number(data.income_total) || 0;
        const expenseNum = Number(data.expense_total) || 0;
        const salesNum = Number(data.sales_total) || 0;
        const buyoutNum = Number(data.buyout_total) || 0;
        const profit = incomeNum - expenseNum;
        const opsCount = (Number(data.sales_count) || 0) + (Number(data.buyout_count) || 0);
        setStats({
          date_from: data.date_from || r.from,
          date_to: data.date_to || r.to,
          income: incomeNum,
          expense: expenseNum,
          period_income: 0,
          period_costs: 0,
          period_profit: profit,
          sales_total: salesNum,
          sales_count: Number(data.sales_count) || 0,
          pledge_total: buyoutNum,
          pledge_count: Number(data.buyout_count) || 0,
          buyout_total: 0,
          buyout_count: 0,
          operations_total: opsCount,
          cached: !!data.cached,
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [getRange, token]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { checkToken(false); }, [checkToken]);

  return (
    <div className="p-3 space-y-3">
      <SLDateRangePicker
        preset={preset}
        setPreset={setPreset}
        customFrom={customFrom}
        setCustomFrom={setCustomFrom}
        customTo={customTo}
        setCustomTo={setCustomTo}
        showCustom={showCustom}
        setShowCustom={setShowCustom}
        loading={loading}
        onLoad={load}
      />

      <SLTokenStatusBar
        tokenError={tokenError}
        tokenRateLimited={tokenRateLimited}
        tokenTtl={tokenTtl}
        tokenAge={tokenAge}
        diagLoading={diagLoading}
        tokenChecking={tokenChecking}
        onRunDiag={runDiag}
        onCheckToken={checkToken}
      />

      <SLDiagnosticsPanel diagData={diagData} onClose={() => setDiagData(null)} />

      <SLAccountCheckPanel
        data={accountData}
        loading={accountLoading}
        onRun={runAccountCheck}
        onClose={() => setAccountData(null)}
      />

      <SLStatsGrid error={error} stats={stats} loading={loading} />
    </div>
  );
}

export default SLDashboard;