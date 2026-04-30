import Icon from "@/components/ui/icon";

type ApiResult = {
  path?: string;
  body_variant?: unknown;
  status?: number;
  content_type?: string;
  cookies_set?: string[];
  response_preview?: string;
  looks_ok?: boolean;
  error?: string;
};

type Step = {
  stage?: string;
  url?: string;
  status?: number;
  final_url?: string;
  redirects?: Array<{ from?: string; status?: number; to?: string }>;
  set_cookies?: string[];
  html_len?: number;
  html_preview?: string;
  still_on_login_page?: boolean;
  error?: string;
  tried?: number;
  successful_count?: number;
  best_match?: ApiResult | null;
  all_results?: ApiResult[];
};

type FormInfo = {
  found?: boolean;
  action_attr?: string | null;
  method?: string;
  resolved_action_url?: string;
  fields?: Array<{ name: string; type: string; has_value: boolean; value_preview: string }>;
  csrf_like_fields?: string[];
  payload_to_send?: Record<string, string>;
};

type DiagData = {
  ok?: boolean;
  login_page?: string;
  verdict?: string;
  env?: Record<string, unknown>;
  form?: FormInfo;
  final?: {
    final_url?: string;
    still_on_login_page?: boolean;
    cookies_after?: string[];
    page_error_messages?: string[];
  };
  steps?: Step[];
};

type Props = {
  data: DiagData | null;
  loading: boolean;
  onRun: () => void;
  onClose: () => void;
};

export function SLKassaDiagPanel({ data, loading, onRun, onClose }: Props) {
  const success = !!data?.ok;
  const env = (data?.env || {}) as Record<string, unknown>;
  const form = data?.form || {};
  const steps = data?.steps || [];

  return (
    <div className="bg-orange-500/5 border border-orange-400/30 rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="font-oswald font-bold text-orange-300 text-[11px] uppercase flex items-center gap-1.5">
          <Icon name="LogIn" size={12} />
          Тест логина в кассу
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onRun}
            disabled={loading}
            className="flex items-center gap-1 px-2 py-1.5 rounded-md bg-orange-500/15 border border-orange-400/40 text-orange-200 hover:bg-orange-500/25 active:scale-95 transition-all font-oswald font-bold text-[10px] uppercase disabled:opacity-50"
          >
            <Icon name={loading ? "Loader" : "Play"} size={11} className={loading ? "animate-spin" : ""} />
            {data ? "Перепроверить" : "Запустить"}
          </button>
          {data && (
            <button onClick={onClose} className="text-white/40 hover:text-white p-1">
              <Icon name="X" size={13} />
            </button>
          )}
        </div>
      </div>

      {!data && !loading && (
        <div className="font-roboto text-white/50 text-[11px] leading-relaxed">
          Зайдёт на online.smartlombard.ru/login с твоими логином/паролем и покажет:
          какие поля у формы, что вернул сервер, остался ли ты на странице логина и почему.
        </div>
      )}

      {data && (
        <>
          {/* ВЕРДИКТ */}
          <div className={`rounded-md p-2.5 border ${
            success ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30"
          }`}>
            <div className={`font-oswald font-bold text-[10px] uppercase mb-1 ${success ? "text-green-300" : "text-red-300"}`}>
              {success ? "✓ Вход выполнен" : "✗ Логин не удался"}
            </div>
            <div className="font-roboto text-white/80 text-[11px] leading-snug">
              {data.verdict || "—"}
            </div>
          </div>

          {/* ENV */}
          <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-md p-2 space-y-1">
            <div className="text-white/40 uppercase text-[9px]">Секреты</div>
            <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono">
              <div>
                <span className="text-white/40">LOGIN: </span>
                <span className="text-white">{String(env.SMARTLOMBARD_LOGIN_present) === "true" ? `${env.SMARTLOMBARD_LOGIN_mask} (${env.SMARTLOMBARD_LOGIN_len} симв.)` : "не задан"}</span>
              </div>
              <div>
                <span className="text-white/40">PASSWORD: </span>
                <span className="text-white">{String(env.SMARTLOMBARD_PASSWORD_present) === "true" ? `*** (${env.SMARTLOMBARD_PASSWORD_len} симв.)` : "не задан"}</span>
              </div>
            </div>
          </div>

          {/* ОШИБКИ СО СТРАНИЦЫ */}
          {data.final?.page_error_messages && data.final.page_error_messages.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-md p-2 space-y-1">
              <div className="text-red-300 uppercase text-[9px] font-bold">Сообщения со страницы логина</div>
              {data.final.page_error_messages.map((m, i) => (
                <div key={i} className="font-mono text-[10px] text-red-200 break-words">• {m}</div>
              ))}
            </div>
          )}

          {/* ФОРМА */}
          {form.found !== undefined && (
            <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-md p-2 space-y-1.5">
              <div className="text-white/40 uppercase text-[9px]">Форма логина</div>
              <div className="text-[10px] font-mono space-y-0.5">
                <div><span className="text-white/40">found: </span><span className="text-white">{String(form.found)}</span></div>
                <div><span className="text-white/40">method: </span><span className="text-white">{form.method || "—"}</span></div>
                <div className="break-all"><span className="text-white/40">action: </span><span className="text-white">{form.resolved_action_url || "—"}</span></div>
                {form.csrf_like_fields && form.csrf_like_fields.length > 0 && (
                  <div><span className="text-white/40">csrf-поля: </span><span className="text-yellow-300">{form.csrf_like_fields.join(", ")}</span></div>
                )}
              </div>
              {form.fields && form.fields.length > 0 && (
                <div className="space-y-0.5">
                  <div className="text-white/40 uppercase text-[9px]">Поля ({form.fields.length})</div>
                  {form.fields.map((f, i) => (
                    <div key={i} className="font-mono text-[10px] flex gap-2">
                      <span className="text-white/70 w-[90px] shrink-0 truncate">{f.name}</span>
                      <span className="text-white/40 w-[60px] shrink-0">{f.type}</span>
                      <span className="text-white/60 truncate">{f.has_value ? `= ${f.value_preview || "(скрыто)"}` : "(пусто)"}</span>
                    </div>
                  ))}
                </div>
              )}
              {form.payload_to_send && (
                <details className="text-[10px]">
                  <summary className="text-white/50 cursor-pointer uppercase text-[9px]">Что отправили (POST)</summary>
                  <pre className="font-mono text-white/70 mt-1 whitespace-pre-wrap break-all">{JSON.stringify(form.payload_to_send, null, 2)}</pre>
                </details>
              )}
            </div>
          )}

          {/* ШАГИ */}
          {steps.map((s, i) => (
            <div key={i} className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-md p-2 space-y-1">
              <div className="font-oswald font-bold text-orange-300 text-[10px] uppercase">[{i + 1}] {s.stage || "?"}</div>
              {s.error && (
                <div className="font-mono text-[10px] text-red-300 break-all">Error: {s.error}</div>
              )}
              {s.url && (
                <div className="font-mono text-[10px] text-white/70 break-all"><span className="text-white/40">→ </span>{s.url}</div>
              )}
              {s.status !== undefined && (
                <div className="font-mono text-[10px]">
                  <span className="text-white/40">HTTP </span>
                  <span className={s.status >= 400 ? "text-red-300" : s.status >= 300 ? "text-yellow-300" : "text-green-300"}>{s.status}</span>
                  {s.final_url && s.final_url !== s.url && (
                    <span className="text-white/60"> → final: {s.final_url}</span>
                  )}
                </div>
              )}
              {s.redirects && s.redirects.length > 0 && (
                <div className="text-[10px] font-mono space-y-0.5">
                  <div className="text-white/40 uppercase text-[9px]">Редиректы ({s.redirects.length})</div>
                  {s.redirects.map((r, j) => (
                    <div key={j} className="text-white/60 break-all">{r.status} {r.from} → {r.to || "(?)"}</div>
                  ))}
                </div>
              )}
              {s.set_cookies && s.set_cookies.length > 0 && (
                <div className="text-[10px] font-mono">
                  <span className="text-white/40">Cookies: </span>
                  <span className="text-white/80">{s.set_cookies.join(", ")}</span>
                </div>
              )}
              {s.still_on_login_page !== undefined && (
                <div className="text-[10px] font-mono">
                  <span className="text-white/40">На странице логина: </span>
                  <span className={s.still_on_login_page ? "text-red-300" : "text-green-300"}>{String(s.still_on_login_page)}</span>
                </div>
              )}
              {s.html_preview && (
                <details>
                  <summary className="text-white/50 cursor-pointer uppercase text-[9px]">HTML preview ({s.html_len} симв.)</summary>
                  <pre className="font-mono text-[9px] text-white/60 mt-1 whitespace-pre-wrap break-all max-h-[200px] overflow-auto">{s.html_preview}</pre>
                </details>
              )}
              {/* Шаг "API endpoints scan" */}
              {s.tried !== undefined && (
                <div className="space-y-1.5">
                  <div className="font-mono text-[10px]">
                    <span className="text-white/40">Проверено эндпоинтов: </span>
                    <span className="text-white">{s.tried}</span>
                    <span className="text-white/40"> · успешных: </span>
                    <span className={s.successful_count ? "text-green-300 font-bold" : "text-red-300"}>{s.successful_count || 0}</span>
                  </div>
                  {s.best_match && (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-md p-2 space-y-1">
                      <div className="text-green-300 uppercase text-[9px] font-bold">✓ Рабочий API логина найден!</div>
                      <div className="font-mono text-[10px] text-white space-y-0.5">
                        <div><span className="text-white/40">POST </span>{s.best_match.path}</div>
                        <div><span className="text-white/40">status: </span>{s.best_match.status}</div>
                        <div><span className="text-white/40">body: </span>{JSON.stringify(s.best_match.body_variant)}</div>
                        {s.best_match.cookies_set && s.best_match.cookies_set.length > 0 && (
                          <div><span className="text-white/40">cookies: </span>{s.best_match.cookies_set.join(", ")}</div>
                        )}
                      </div>
                      {s.best_match.response_preview && (
                        <pre className="font-mono text-[9px] text-white/70 whitespace-pre-wrap break-all max-h-[120px] overflow-auto">{s.best_match.response_preview}</pre>
                      )}
                    </div>
                  )}
                  {s.all_results && s.all_results.length > 0 && (
                    <details>
                      <summary className="text-white/50 cursor-pointer uppercase text-[9px]">Все попытки ({s.all_results.length})</summary>
                      <div className="mt-1 space-y-1">
                        {s.all_results.map((r, ri) => {
                          const ok = r.looks_ok;
                          const status = r.status;
                          const color = ok ? "text-green-300" : status === 404 ? "text-white/40" : status && status >= 400 ? "text-red-300" : status && status >= 300 ? "text-yellow-300" : "text-white/60";
                          return (
                            <div key={ri} className="font-mono text-[9px] flex items-center gap-2 border border-[#1F1F1F] rounded px-1.5 py-1">
                              <span className={`w-[40px] shrink-0 ${color}`}>{r.error ? "ERR" : status ?? "?"}</span>
                              <span className="text-white/80 w-[150px] shrink-0 truncate">{r.path}</span>
                              <span className="text-white/40 truncate">{Array.isArray(r.body_variant) ? r.body_variant.join("+") : String(r.body_variant)}</span>
                              {ok && <span className="text-green-300 ml-auto">✓</span>}
                            </div>
                          );
                        })}
                      </div>
                    </details>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* СЫРОЙ JSON */}
          <details className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-md p-2">
            <summary className="text-white/50 text-[10px] cursor-pointer uppercase">Сырой ответ</summary>
            <pre className="font-mono text-[9px] text-white/60 whitespace-pre-wrap break-all max-h-[260px] overflow-auto mt-2">
              {JSON.stringify(data, null, 2)}
            </pre>
          </details>
        </>
      )}
    </div>
  );
}

export default SLKassaDiagPanel;