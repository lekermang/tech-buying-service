import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";

const TG_PARSER_URL = "https://functions.poehali.dev/2e98b33f-0f6a-4bc3-9c93-6bbb80277fac";

export default function CatalogTab({ token }: { token: string }) {
  const [running, setRunning] = useState(false);
  const [lastResult, setLastResult] = useState<{ parsed: number; updated: number; inserted: number; message?: string } | null>(null);
  const [lastRun, setLastRun] = useState<string | null>(() => localStorage.getItem("tg_parser_last_run"));
  const [nextRun, setNextRun] = useState<number>(30 * 60);
  const [autoEnabled, setAutoEnabled] = useState(() => localStorage.getItem("tg_parser_auto") === "1");

  const runParser = useCallback(async () => {
    setRunning(true);
    try {
      const res = await fetch(TG_PARSER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Token": token },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      setLastResult(data);
      const now = new Date().toLocaleString("ru-RU");
      setLastRun(now);
      localStorage.setItem("tg_parser_last_run", now);
      setNextRun(30 * 60);
    } finally {
      setRunning(false);
    }
  }, [token]);

  useEffect(() => {
    if (!autoEnabled) return;
    const interval = setInterval(() => {
      setNextRun((n) => {
        if (n <= 1) { runParser(); return 30 * 60; }
        return n - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [autoEnabled, runParser]);

  const toggleAuto = () => {
    const next = !autoEnabled;
    setAutoEnabled(next);
    localStorage.setItem("tg_parser_auto", next ? "1" : "0");
    if (next) setNextRun(30 * 60);
  };

  const fmt2 = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div className="px-4 py-4 max-w-lg">
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] p-4 mb-4">
        <div className="flex items-center gap-2 mb-1">
          <Icon name="Send" size={14} className="text-[#FFD700]" />
          <span className="font-oswald font-bold text-white uppercase text-sm tracking-wide">Парсер @appledysonphoto</span>
        </div>
        <p className="font-roboto text-white/40 text-xs mb-4">
          Читает новые посты из канала и обновляет каталог товаров. Перешли боту посты с товарами — они появятся в каталоге.
        </p>

        <button onClick={runParser} disabled={running}
          className="w-full bg-[#FFD700] text-black font-oswald font-bold py-2.5 uppercase tracking-wide hover:bg-yellow-400 transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mb-4">
          {running ? <><Icon name="Loader" size={15} className="animate-spin" /> Парсю...</> : <><Icon name="RefreshCw" size={14} /> Запустить сейчас</>}
        </button>

        <div className="flex items-center justify-between border-t border-[#2A2A2A] pt-3">
          <div>
            <div className="font-roboto text-white/60 text-xs">Автообновление каждые 30 мин</div>
            {autoEnabled && <div className="font-roboto text-white/30 text-[10px]">Следующий запуск через {fmt2(nextRun)}</div>}
          </div>
          <button onClick={toggleAuto}
            className={`w-11 h-6 rounded-full transition-colors relative ${autoEnabled ? "bg-[#FFD700]" : "bg-[#333]"}`}>
            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${autoEnabled ? "translate-x-5" : "translate-x-0.5"}`} />
          </button>
        </div>
      </div>

      {lastRun && (
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] p-3 mb-3">
          <div className="font-roboto text-white/30 text-[10px] uppercase tracking-wide mb-2">Последний запуск: {lastRun}</div>
          {lastResult && (
            lastResult.message ? (
              <div className="font-roboto text-yellow-400 text-xs">{lastResult.message}</div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Обработано", val: lastResult.parsed, color: "text-white" },
                  { label: "Обновлено", val: lastResult.updated, color: "text-blue-400" },
                  { label: "Добавлено", val: lastResult.inserted, color: "text-green-400" },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <div className={`font-oswald font-bold text-xl ${s.color}`}>{s.val}</div>
                    <div className="font-roboto text-white/30 text-[10px]">{s.label}</div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      )}

      <div className="bg-[#1A1A1A] border border-[#2A2A2A] p-3">
        <div className="font-roboto text-white/30 text-[10px] uppercase tracking-wide mb-2">Как использовать</div>
        <ol className="space-y-1.5">
          {[
            "Открой Telegram → найди бота по токену",
            "Перешли боту посты из @appledysonphoto с товарами",
            "Нажми «Запустить сейчас» — товары появятся в каталоге",
            "Включи автообновление — каталог будет обновляться каждые 30 мин",
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="font-oswald font-bold text-[#FFD700] text-xs shrink-0">{i + 1}.</span>
              <span className="font-roboto text-white/50 text-xs">{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
