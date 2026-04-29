import Icon from "@/components/ui/icon";
import { errToText } from "./SLDashboardTypes";

type Props = {
  diagData: Record<string, unknown> | null;
  onClose: () => void;
};

export function SLDiagnosticsPanel({ diagData, onClose }: Props) {
  if (!diagData) return null;
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
        <button onClick={onClose} className="text-white/40 hover:text-white p-1">
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
}

export default SLDiagnosticsPanel;
