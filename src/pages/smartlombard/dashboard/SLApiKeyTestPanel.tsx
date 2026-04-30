import { useState } from "react";
import Icon from "@/components/ui/icon";
import { SMARTLOMBARD_URL } from "../../staff.types";

type EndpointResult = {
  endpoint?: string;
  url?: string;
  http_status?: number;
  content_type?: string;
  response?: unknown;
  response_raw?: string;
  token_preview?: string;
  ok?: boolean;
  error?: string;
};

type TestResult = {
  ok?: boolean;
  account_id?: string;
  secret_key_len?: number;
  secret_key_preview?: string;
  endpoints?: EndpointResult[];
  verdict?: string;
  error?: string;
};

export function SLApiKeyTestPanel({ token }: { token: string }) {
  const [accountId, setAccountId] = useState("34914");
  const [secretKey, setSecretKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  const run = async () => {
    if (!accountId.trim() || !secretKey.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${SMARTLOMBARD_URL}?action=test_api_key`, {
        method: "POST",
        headers: { "X-Employee-Token": token, "Content-Type": "application/json" },
        body: JSON.stringify({ account_id: accountId.trim(), secret_key: secretKey.trim() }),
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setResult({ error: e instanceof Error ? e.message : String(e) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-cyan-500/5 border border-cyan-400/30 rounded-lg p-3 space-y-2">
      <div className="font-oswald font-bold text-cyan-300 text-[11px] uppercase flex items-center gap-1.5">
        <Icon name="KeyRound" size={12} />
        Тест API-ключа вручную
      </div>

      <div className="font-roboto text-white/50 text-[10px] leading-snug">
        Прямой запрос в SmartLombard на оба эндпоинта. Покажет точный ответ сервера —
        работает ли ключ и какая у него ошибка.
      </div>

      <div className="grid grid-cols-1 gap-2">
        <input
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          placeholder="account_id (например, 34914)"
          className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-md px-2.5 py-1.5 text-[11px] font-mono text-white placeholder:text-white/30 focus:border-cyan-400/50 outline-none"
        />
        <input
          value={secretKey}
          onChange={(e) => setSecretKey(e.target.value)}
          placeholder="secret_key (32 hex-символа)"
          className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-md px-2.5 py-1.5 text-[11px] font-mono text-white placeholder:text-white/30 focus:border-cyan-400/50 outline-none"
        />
        <button
          onClick={run}
          disabled={loading || !accountId.trim() || !secretKey.trim()}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-cyan-500/15 border border-cyan-400/40 text-cyan-200 hover:bg-cyan-500/25 active:scale-95 transition-all font-oswald font-bold text-[11px] uppercase disabled:opacity-50"
        >
          <Icon name={loading ? "Loader" : "Send"} size={12} className={loading ? "animate-spin" : ""} />
          Проверить ключ
        </button>
      </div>

      {result && (
        <div className="space-y-2 pt-1">
          <div className={`rounded-md p-2 border ${result.ok ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30"}`}>
            <div className={`font-oswald font-bold text-[10px] uppercase ${result.ok ? "text-green-300" : "text-red-300"}`}>
              {result.ok ? "✓ Ключ рабочий" : "✗ Ключ не подошёл"}
            </div>
            <div className="font-roboto text-white/80 text-[11px] mt-1">{result.verdict || result.error || "—"}</div>
            {result.account_id && (
              <div className="font-mono text-[10px] text-white/60 mt-1">
                account_id={result.account_id} · key={result.secret_key_preview} ({result.secret_key_len} симв.)
              </div>
            )}
          </div>

          {result.endpoints?.map((ep, i) => (
            <div key={i} className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-md p-2 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-oswald font-bold text-[10px] uppercase text-cyan-300">{ep.endpoint}</span>
                <span className={`font-mono text-[10px] ${ep.ok ? "text-green-300" : ep.http_status && ep.http_status >= 400 ? "text-red-300" : "text-white/60"}`}>
                  HTTP {ep.http_status ?? "ERR"}
                </span>
              </div>
              <div className="font-mono text-[9px] text-white/50 break-all">{ep.url}</div>
              {ep.token_preview && (
                <div className="font-mono text-[10px] text-green-300">token: {ep.token_preview}</div>
              )}
              {ep.error && (
                <div className="font-mono text-[10px] text-red-300">Error: {ep.error}</div>
              )}
              {(ep.response || ep.response_raw) && (
                <pre className="font-mono text-[9px] text-white/70 whitespace-pre-wrap break-all max-h-[140px] overflow-auto">
                  {ep.response ? JSON.stringify(ep.response, null, 2) : ep.response_raw}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SLApiKeyTestPanel;
