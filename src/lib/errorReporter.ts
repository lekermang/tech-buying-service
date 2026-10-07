const REPORT_URL = "https://functions.poehali.dev/80b20319-7006-44b5-bd6b-02840a55f2d6";
const MAX_PER_SESSION = 30;

const IGNORE = [
  /ResizeObserver loop/i,
  /Script error\.?$/i,
  /Non-Error promise rejection/i,
  /AbortError/i,
  /The operation was aborted/i,
  /Load failed/i,
  /Failed to fetch$/i,
  /NetworkError when attempting/i,
  /^Ошибка$/,
  /Failed to fetch dynamically imported module/i,
  /error loading dynamically imported module/i,
  /Importing a module script failed/i,
  /chrome-extension:|moz-extension:/i,
];

let sent = 0;
const seen = new Set<string>();
let installed = false;

function employee(): string {
  try { return localStorage.getItem("employee_name") || ""; } catch { return ""; }
}

export function reportError(kind: string, message: string, stack?: string, extraUrl?: string) {
  try {
    if (!message || sent >= MAX_PER_SESSION) return;
    if (IGNORE.some(r => r.test(message))) return;
    const key = `${kind}|${message}`.slice(0, 300);
    if (seen.has(key)) return;
    seen.add(key);
    sent += 1;
    const payload = JSON.stringify({
      kind,
      message: message.slice(0, 500),
      stack: (stack || "").slice(0, 1500),
      url: extraUrl || location.href,
      ua: navigator.userAgent,
      employee: employee(),
    });
    fetch(REPORT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
      // @ts-expect-error маркер, чтобы наш fetch-перехватчик не зациклился
      __noReport: true,
    }).catch(() => { /* ignore */ });
  } catch { /* ignore */ }
}

export function installErrorReporter() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  window.addEventListener("error", (e) => {
    const t = e.target as HTMLElement | null;
    if (t && t !== (window as unknown as HTMLElement) && (t as HTMLImageElement).src) {
      const src = (t as HTMLImageElement).src;
      return;
    }
    reportError("js", e.message || "Ошибка", e.error?.stack, location.href);
  }, true);

  window.addEventListener("unhandledrejection", (e) => {
    const r = e.reason;
    const msg = r instanceof Error ? r.message : typeof r === "string" ? r : JSON.stringify(r || {});
    reportError("promise", msg, r instanceof Error ? r.stack : undefined);
  });

  const origFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const isOwn = url.startsWith(REPORT_URL) || (init && (init as { __noReport?: boolean }).__noReport);
    try {
      const res = await origFetch(input, init);
      if (!isOwn && res.status >= 500 && url.includes("functions.poehali.dev")) {
        const action = (() => { try { return new URL(url).searchParams.get("action") || ""; } catch { return ""; } })();
        reportError("api", `HTTP ${res.status} от сервера${action ? ` (action=${action})` : ""}`, undefined, url.split("?")[0]);
      }
      return res;
    } catch (err) {
      if (!isOwn && url.includes("functions.poehali.dev") && navigator.onLine) {
        reportError("network", `Запрос не дошёл: ${(err as Error)?.message || "ошибка сети"}`, undefined, url.split("?")[0]);
      }
      throw err;
    }
  };
}
