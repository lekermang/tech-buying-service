import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { SMARTLOMBARD_URL } from "../staff.types";

type Stats = {
  date_from: string;
  date_to: string;
  income: number;
  expense: number;
  period_income: number;
  period_costs: number;
  period_profit: number;
  sales_total?: number;
  sales_count?: number;
  pledge_total?: number;
  pledge_count?: number;
  buyout_total?: number;
  buyout_count?: number;
  kassa_income?: number;
  kassa_expense?: number;
  kassa_sales_total?: number;
  kassa_sales_count?: number;
  kassa_buyout_total?: number;
  kassa_buyout_count?: number;
  kassa_ok?: boolean;
  kassa_error?: string;
  operations_total: number;
  cached?: boolean;
  error?: string;
};

const fmt = (n: number) => (n || 0).toLocaleString("ru-RU");

// SmartLombard может вернуть error как строку, объект {message}, или массив [{field, message}].
// Превращаем что угодно в безопасную строку для рендера.
function errToText(v: unknown): string {
  if (v == null || v === '') return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (Array.isArray(v)) {
    return v.map(errToText).filter(Boolean).join('; ');
  }
  if (typeof v === 'object') {
    const o = v as Record<string, unknown>;
    if (typeof o.message === 'string') {
      return o.field ? `${o.field}: ${o.message}` : o.message;
    }
    if (typeof o.error === 'string') return o.error;
    try { return JSON.stringify(v); } catch { return '[object]'; }
  }
  return String(v);
}

function todayDmy() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}

function shiftDmy(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}

const PRESETS: { k: string; l: string; from: () => string; to: () => string }[] = [
  { k: "today", l: "Сегодня", from: () => todayDmy(), to: () => todayDmy() },
  { k: "yest",  l: "Вчера",   from: () => shiftDmy(-1), to: () => shiftDmy(-1) },
  { k: "w7",    l: "7 дней",  from: () => shiftDmy(-6), to: () => todayDmy() },
  { k: "m30",   l: "30 дней", from: () => shiftDmy(-29), to: () => todayDmy() },
];

export function SLDashboard({ token }: { token: string }) {
  const [preset, setPreset] = useState("today");
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Состояние токена SmartLombard (по доке: 1 запрос → 20 минут жизни)
  const [tokenAge, setTokenAge] = useState<number | null>(null);
  const [tokenTtl, setTokenTtl] = useState<number | null>(null);
  const [tokenError, setTokenError] = useState("");
  const [tokenChecking, setTokenChecking] = useState(false);

  // Диагностика API SmartLombard — что реально вернул /operations
  const [diagData, setDiagData] = useState<Record<string, unknown> | null>(null);
  const [diagLoading, setDiagLoading] = useState(false);

  const runDiag = useCallback(async () => {
    setDiagLoading(true);
    try {
      const cur = PRESETS.find(p => p.k === preset) || PRESETS[0];
      const url = `${SMARTLOMBARD_URL}?date_from=${cur.from()}&date_to=${cur.to()}&debug=1&nocache=1`;
      const res = await fetch(url, { headers: { "X-Employee-Token": token } });
      const data = await res.json();
      setDiagData(data);
    } catch (e) {
      setDiagData({ error: e instanceof Error ? e.message : String(e) });
    } finally {
      setDiagLoading(false);
    }
  }, [preset, token]);

  const checkToken = useCallback(async (force = false) => {
    setTokenChecking(true); setTokenError("");
    try {
      const url = `${SMARTLOMBARD_URL}?action=auth_check${force ? "&force=1" : ""}`;
      const res = await fetch(url, { headers: { "X-Employee-Token": token } });
      const data = await res.json();
      if (!res.ok || data.error) {
        setTokenError(errToText(data.error) || `HTTP ${res.status}`);
        setTokenAge(null); setTokenTtl(null);
      } else {
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
    const cur = PRESETS.find(p => p.k === preset) || PRESETS[0];
    const url = `${SMARTLOMBARD_URL}?date_from=${cur.from()}&date_to=${cur.to()}${force ? "&nocache=1" : ""}`;
    try {
      const res = await fetch(url, { headers: { "X-Employee-Token": token } });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(errToText(data.error) || `Ошибка ${res.status}`);
        setStats(null);
      } else {
        setStats(data);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [preset, token]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { checkToken(false); }, [checkToken]);

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {PRESETS.map(p => {
            const a = preset === p.k;
            return (
              <button key={p.k} onClick={() => setPreset(p.k)}
                className={`shrink-0 font-roboto text-[11px] px-3 py-1.5 rounded-full transition-all active:scale-95 ${
                  a ? "bg-[#FFD700] text-black font-bold" : "bg-[#141414] border border-[#1F1F1F] text-white/60 hover:text-white"
                }`}>{p.l}</button>
            );
          })}
        </div>
        <button onClick={() => load(true)} disabled={loading}
          title="Обновить"
          className="shrink-0 p-2 rounded-md bg-[#141414] border border-[#1F1F1F] text-white/60 hover:text-[#FFD700] active:scale-95 transition-all disabled:opacity-50">
          <Icon name={loading ? "Loader" : "RefreshCw"} size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Состояние токена SmartLombard */}
      <div className={`rounded-lg p-2.5 border flex items-center justify-between gap-2 ${
        tokenError
          ? "bg-red-500/10 border-red-500/30"
          : tokenTtl !== null && tokenTtl < 120
            ? "bg-orange-500/10 border-orange-500/30"
            : "bg-green-500/5 border-green-500/20"
      }`}>
        <div className="flex items-center gap-2 min-w-0">
          <Icon
            name={tokenError ? "AlertCircle" : "ShieldCheck"}
            size={14}
            className={tokenError ? "text-red-400 shrink-0" : "text-green-400 shrink-0"}
          />
          <div className="min-w-0">
            <div className={`font-oswald font-bold text-[10px] uppercase tracking-wide ${tokenError ? "text-red-300" : "text-green-300"}`}>
              Токен SmartLombard
            </div>
            <div className="font-roboto text-white/60 text-[11px] truncate">
              {tokenError ? (
                tokenError
              ) : tokenTtl !== null ? (
                <>
                  Действует ещё <span className="font-bold text-white tabular-nums">{Math.floor(tokenTtl / 60)} мин {tokenTtl % 60} сек</span>
                  {tokenAge !== null && <span className="text-white/30 ml-1">(возраст: {Math.floor(tokenAge / 60)}м)</span>}
                </>
              ) : (
                "Проверка..."
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={runDiag}
            disabled={diagLoading}
            title="Диагностика API: что реально вернул SmartLombard"
            className="flex items-center gap-1 px-2 py-1.5 rounded-md bg-blue-500/15 border border-blue-400/40 text-blue-300 hover:bg-blue-500/25 active:scale-95 transition-all font-oswald font-bold text-[10px] uppercase disabled:opacity-50"
          >
            <Icon name={diagLoading ? "Loader" : "Bug"} size={11} className={diagLoading ? "animate-spin" : ""} />
            Диагностика
          </button>
          <button
            onClick={() => checkToken(true)}
            disabled={tokenChecking}
            title="Принудительно перевыпустить токен (нужно при ошибках авторизации)"
            className="flex items-center gap-1 px-2 py-1.5 rounded-md bg-[#FFD700]/15 border border-[#FFD700]/40 text-[#FFD700] hover:bg-[#FFD700]/25 active:scale-95 transition-all font-oswald font-bold text-[10px] uppercase disabled:opacity-50"
          >
            <Icon name={tokenChecking ? "Loader" : "RefreshCw"} size={11} className={tokenChecking ? "animate-spin" : ""} />
            Перевыпустить
          </button>
        </div>
      </div>

      {/* Результаты диагностики API — полный аудит-лог */}
      {diagData && (() => {
        const d = diagData as {
          date_from?: string; date_to?: string;
          operations_total?: number; elem_operations_total?: number;
          error?: unknown; stage?: string;
          audit?: Array<Record<string, unknown>>;
          operations_debug?: Record<string, unknown>;
          elem_debug?: Record<string, unknown>;
          accounts_used?: string[];
          operations_per_account?: Array<{account_id: string; count: number; added?: number; error?: unknown}>;
          elem_per_account?: Array<{account_id: string; count: number; added?: number; error?: unknown}>;
        };
        const toText = errToText;
        const audit = d.audit || [];
        // Если backend не вернул audit — собираем его из operations_debug/elem_debug
        const fallbackAudit: Array<Record<string, unknown>> = [];
        if (audit.length === 0) {
          if (d.operations_debug) fallbackAudit.push({ stage: 'operations', ...d.operations_debug });
          if (d.elem_debug) fallbackAudit.push({ stage: 'elementary_operations', ...d.elem_debug });
        }
        const stages = audit.length > 0 ? audit : fallbackAudit;
        const copy = (text: string) => { try { navigator.clipboard.writeText(text); } catch { /* */ } };
        const fullReport = [
          `=== ДИАГНОСТИКА SMARTLOMBARD API ===`,
          `Период: ${d.date_from || '?'} → ${d.date_to || '?'}`,
          `Operations: ${d.operations_total ?? '?'} | Elementary: ${d.elem_operations_total ?? '?'}`,
          d.error ? `ОШИБКА: ${d.error} (stage: ${d.stage || '?'})` : '',
          '',
          ...stages.map((s) => {
            const stage = String(s.stage || '?');
            const lines: string[] = [`--- STAGE: ${stage} ---`];
            if (s.request_method) lines.push(`${s.request_method} ${s.request_url || ''}`);
            else if (s.request_url) lines.push(`GET ${s.request_url}`);
            if (s.request_body_form) lines.push(`Body (form): ${JSON.stringify(s.request_body_form)}`);
            if (s.request_headers) lines.push(`Headers: ${JSON.stringify(s.request_headers)}`);
            if (s.cached_token_age_sec !== undefined) lines.push(`Cached token age: ${s.cached_token_age_sec}s, fresh: ${s.cached_token_fresh}`);
            if (s.note) lines.push(`Note: ${s.note}`);
            if (s.response_status !== undefined) lines.push(`HTTP ${s.response_status}`);
            if (s.response_raw) lines.push(`Response: ${s.response_raw}`);
            if (s.page1_count !== undefined) lines.push(`Items on page 1: ${s.page1_count}`);
            return lines.join('\n');
          }),
          '',
          `=== RAW JSON ===`,
          JSON.stringify(diagData, null, 2),
        ].filter(Boolean).join('\n');

        return (
          <div className="bg-blue-500/5 border border-blue-400/30 rounded-lg p-3 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex items-center justify-between">
              <div className="font-oswald font-bold text-blue-300 text-[11px] uppercase flex items-center gap-1.5">
                <Icon name="Bug" size={12} />
                Аудит SmartLombard API
              </div>
              <button onClick={() => setDiagData(null)} className="text-white/40 hover:text-white p-1">
                <Icon name="X" size={13} />
              </button>
            </div>

            {d.error != null && d.error !== '' && (
              <div className="bg-red-500/10 border border-red-500/30 rounded p-2 text-red-300 text-[11px]">
                <div className="font-bold uppercase text-[9px] mb-1">Ошибка ({d.stage || '?'})</div>
                <div className="break-words">{toText(d.error)}</div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-md p-2">
                <div className="text-white/40 uppercase">Период</div>
                <div className="font-mono text-white">{d.date_from || '—'} → {d.date_to || '—'}</div>
              </div>
              <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-md p-2">
                <div className="text-white/40 uppercase">Ops / Elem</div>
                <div className="font-mono text-white">{String(d.operations_total ?? '—')} / {String(d.elem_operations_total ?? '—')}</div>
              </div>
            </div>

            {/* Что вернул каждый API-сотрудник */}
            {d.operations_per_account && d.operations_per_account.length > 0 && (
              <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-md p-2 space-y-1.5">
                <div className="text-white/40 uppercase text-[9px]">Операции по сотрудникам</div>
                <div className="space-y-1">
                  {d.operations_per_account.map((acc, i) => {
                    const errText = toText(acc.error);
                    const hasErr = !!errText;
                    const isOk = !hasErr && acc.count > 0;
                    const isEmpty = !hasErr && acc.count === 0;
                    return (
                      <div key={i} className={`flex items-center justify-between gap-2 px-2 py-1.5 rounded text-[10px] border ${
                        isOk ? 'bg-green-500/10 border-green-500/30' :
                        isEmpty ? 'bg-yellow-500/5 border-yellow-500/20' :
                        'bg-red-500/10 border-red-500/30'
                      }`}>
                        <span className="font-mono text-white/70 shrink-0">#{acc.account_id}</span>
                        <span className={`font-bold tabular-nums text-right break-all ${isOk ? 'text-green-300' : isEmpty ? 'text-yellow-300' : 'text-red-300'}`}>
                          {hasErr ? errText.slice(0, 60) : `${acc.count} оп.`}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="font-roboto text-white/40 text-[9px] leading-snug pt-1">
                  Зелёный = есть данные · Жёлтый = доступ есть, операций нет · Красный = ошибка авторизации
                </div>
              </div>
            )}

            {stages.length === 0 && (
              <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-md p-3 text-white/60 text-[11px] text-center">
                Backend не вернул audit-данные. Покажу сырой ответ ниже.
              </div>
            )}

            {stages.map((s, i) => {
              const stage = String(s.stage || '?');
              const reqUrl = String(s.request_url || '');
              const respStatus = s.response_status;
              const respRaw = String(s.response_raw || '');
              const cachedAge = s.cached_token_age_sec;
              const cachedFresh = s.cached_token_fresh;
              return (
                <div key={i} className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-md p-2 space-y-1.5">
                  <div className="font-oswald font-bold text-blue-300 text-[10px] uppercase">[{i + 1}] {stage}</div>
                  {reqUrl && (
                    <div>
                      <div className="text-white/40 uppercase text-[9px] mb-0.5">URL запроса</div>
                      <pre className="font-mono text-[10px] text-white/80 whitespace-pre-wrap break-all">{reqUrl}</pre>
                    </div>
                  )}
                  {s.request_body_form !== undefined && (
                    <div>
                      <div className="text-white/40 uppercase text-[9px] mb-0.5">Тело (form)</div>
                      <pre className="font-mono text-[10px] text-white/80 whitespace-pre-wrap break-all">{JSON.stringify(s.request_body_form, null, 2)}</pre>
                    </div>
                  )}
                  {cachedAge !== undefined && (
                    <div className="text-[10px] text-white/70">
                      Кэш токена: <span className="font-mono text-white">{String(cachedAge)}с</span> (свежий: {String(cachedFresh)})
                    </div>
                  )}
                  {s.note !== undefined && (
                    <div className="text-[10px] text-white/50 italic">{String(s.note)}</div>
                  )}
                  {respStatus !== undefined && (
                    <div>
                      <div className="text-white/40 uppercase text-[9px] mb-0.5">Ответ (HTTP {String(respStatus)})</div>
                      <pre className="font-mono text-[10px] text-white/80 whitespace-pre-wrap break-all max-h-[180px] overflow-auto">{respRaw || '(пусто)'}</pre>
                    </div>
                  )}
                  {s.page1_count !== undefined && (
                    <div className="text-[10px] text-white/70">
                      Записей на странице 1: <span className="font-mono text-white">{String(s.page1_count)}</span>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Сырой JSON всегда — если ничего не помогло */}
            <details className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-md p-2">
              <summary className="text-white/50 text-[10px] cursor-pointer uppercase">Сырой ответ от нашего backend</summary>
              <pre className="font-mono text-[10px] text-white/70 whitespace-pre-wrap break-all max-h-[260px] overflow-auto mt-2">
                {JSON.stringify(diagData, null, 2)}
              </pre>
            </details>

            <button
              onClick={() => copy(fullReport)}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-blue-500/20 border border-blue-400/40 text-blue-200 hover:bg-blue-500/30 active:scale-[0.98] transition-all font-oswald font-bold text-[11px] uppercase"
            >
              <Icon name="Copy" size={12} />
              Скопировать полный отчёт для поддержки
            </button>
          </div>
        );
      })()}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-start gap-2">
          <Icon name="AlertCircle" size={14} className="text-red-400 mt-0.5 shrink-0" />
          <div>
            <div className="font-oswald font-bold text-red-300 text-xs uppercase">Не удалось загрузить</div>
            <div className="font-roboto text-red-300/70 text-[11px] mt-1 break-words">{error}</div>
          </div>
        </div>
      )}

      {!error && stats && (
        <div className="grid grid-cols-2 gap-2">
          {/* ВЫДЕЛЕННАЯ карточка ПРОДАЖИ ТОВАРА (sell_realization) */}
          <div className="col-span-2">
            <Card
              label="Продажи товара (Iphone, Sony и т.д.)"
              value={stats.sales_total ?? 0}
              icon="ShoppingCart"
              tint="gold"
              big
              sub={`${stats.sales_count ?? 0} операций`}
            />
          </div>
          <Card label="Приход" value={stats.income} icon="ArrowDownToLine" tint="green" />
          <Card label="Расход" value={stats.expense} icon="ArrowUpFromLine" tint="red" />
          <Card label="Залоги" value={stats.pledge_total ?? 0} icon="ArrowDownToLine" tint="red" sub={`${stats.pledge_count ?? 0} операций`} />
          <Card label="Выкупы" value={stats.buyout_total ?? 0} icon="ArrowUpFromLine" tint="green" sub={`${stats.buyout_count ?? 0} операций`} />
          <Card label="Доход (%)" value={stats.period_income} icon="TrendingUp" tint="green" sub="проценты + сверх" />
          <Card label="Издержки" value={stats.period_costs} icon="TrendingDown" tint="red" sub="убытки" />
          <div className="col-span-2">
            <Card label="Прибыль" value={stats.period_profit}
              icon={stats.period_profit >= 0 ? "Sparkles" : "AlertTriangle"}
              tint={stats.period_profit >= 0 ? "gold" : "red"} big />
          </div>
          <div className="col-span-2 bg-[#141414] border border-[#1F1F1F] rounded-lg px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="Activity" size={14} className="text-white/40" />
              <span className="font-roboto text-white/50 text-[11px]">Операций за период</span>
            </div>
            <span className="font-oswald font-bold text-white text-base tabular-nums">{stats.operations_total}</span>
          </div>
          <div className="col-span-2 text-center font-roboto text-white/30 text-[10px]">
            {stats.date_from === stats.date_to ? `за ${stats.date_from}` : `${stats.date_from} — ${stats.date_to}`}
            {stats.cached && <span className="ml-2 text-white/20">(из кэша)</span>}
          </div>
        </div>
      )}

      {!error && !stats && loading && (
        <div className="flex items-center justify-center py-12 text-white/30">
          <Icon name="Loader" size={18} className="animate-spin mr-2 text-[#FFD700]" />
          <span className="font-roboto text-sm">Загружаю данные...</span>
        </div>
      )}
    </div>
  );
}

function Card({ label, value, icon, tint, sub, big }: {
  label: string; value: number; icon: string;
  tint: "green" | "red" | "gold"; sub?: string; big?: boolean;
}) {
  const palette = {
    green: { bg: "from-green-500/10 to-green-500/[0.02]", border: "border-green-500/20", text: "text-green-400" },
    red:   { bg: "from-red-500/10 to-red-500/[0.02]",     border: "border-red-500/20",   text: "text-red-400" },
    gold:  { bg: "from-[#FFD700]/15 to-[#FFD700]/[0.02]", border: "border-[#FFD700]/30", text: "text-[#FFD700]" },
  }[tint];
  return (
    <div className={`relative bg-gradient-to-br ${palette.bg} border ${palette.border} rounded-lg p-3 overflow-hidden`}>
      <div className="flex items-center justify-between mb-1">
        <span className="font-roboto text-white/50 text-[10px] uppercase tracking-wider">{label}</span>
        <Icon name={icon} size={13} className={palette.text} />
      </div>
      <div className={`font-oswald font-bold ${palette.text} tabular-nums leading-none ${big ? "text-3xl" : "text-xl"}`}>
        {fmt(value)} <span className="text-white/30 text-sm">₽</span>
      </div>
      {sub && <div className="font-roboto text-white/30 text-[9px] mt-1">{sub}</div>}
    </div>
  );
}

export default SLDashboard;