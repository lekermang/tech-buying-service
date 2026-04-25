import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { adminHeaders } from "@/lib/adminFetch";
import { TG_PARSER_URL, TG_AUTO_SYNC_URL, PRICE_SCHEDULER_URL, AUTO_INTERVAL } from "./types";

export default function ParserSection({ token }: { token: string }) {
  const [running, setRunning] = useState(false);
  const [webhookSetup, setWebhookSetup] = useState(false);
  const [settingWebhook, setSettingWebhook] = useState(false);
  const [lastResult, setLastResult] = useState<{
    parsed?: number; updated?: number; inserted?: number; changed?: number; message?: string
  } | null>(null);
  const [lastRun, setLastRun] = useState<string | null>(() => localStorage.getItem("tg_parser_last_run"));
  const [nextRun, setNextRun] = useState<number>(AUTO_INTERVAL);
  const [autoEnabled, setAutoEnabled] = useState(() => localStorage.getItem("tg_parser_auto") === "1");
  const [publishing, setPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<{
    sent?: boolean; categories?: number; items?: number;
    edited?: number; new_messages?: number; reason?: string; error?: string;
  } | null>(null);
  const [publishedAt, setPublishedAt] = useState<string | null>(() => localStorage.getItem("tg_price_published_at"));

  const runParser = useCallback(async () => {
    setRunning(true);
    try {
      const res = await fetch(TG_PARSER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...adminHeaders(token) },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      setLastResult(data);
      const now = new Date().toLocaleString("ru-RU");
      setLastRun(now);
      localStorage.setItem("tg_parser_last_run", now);
      setNextRun(AUTO_INTERVAL);
    } finally {
      setRunning(false);
    }
  }, [token]);

  useEffect(() => {
    if (!autoEnabled) return;
    const interval = setInterval(() => {
      setNextRun((n) => {
        if (n <= 1) { runParser(); return AUTO_INTERVAL; }
        return n - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [autoEnabled, runParser]);

  const toggleAuto = () => {
    const next = !autoEnabled;
    setAutoEnabled(next);
    localStorage.setItem("tg_parser_auto", next ? "1" : "0");
    if (next) setNextRun(AUTO_INTERVAL);
  };

  const publishPrice = async () => {
    setPublishing(true);
    setPublishResult(null);
    try {
      const res = await fetch(`${PRICE_SCHEDULER_URL}?action=send_now`, {
        headers: { ...adminHeaders(token) },
      });
      const data = await res.json();
      setPublishResult(data);
      if (data?.sent) {
        const now = new Date().toLocaleString("ru-RU");
        setPublishedAt(now);
        localStorage.setItem("tg_price_published_at", now);
      }
    } catch (e) {
      setPublishResult({ error: e instanceof Error ? e.message : "Ошибка" });
    } finally {
      setPublishing(false);
    }
  };

  const setupWebhook = async () => {
    setSettingWebhook(true);
    try {
      const res = await fetch(
        `${TG_AUTO_SYNC_URL}?action=setup&url=${encodeURIComponent(TG_AUTO_SYNC_URL)}`,
        { headers: { ...adminHeaders(token) } }
      );
      const data = await res.json();
      setWebhookSetup(data?.webhook?.ok === true || data?.webhook?.result === true);
    } finally {
      setSettingWebhook(false);
    }
  };

  const fmt2 = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div className="max-w-lg">
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] p-4 mb-4">
        <div className="flex items-center gap-2 mb-1">
          <Icon name="Bot" size={14} className="text-[#FFD700]" />
          <span className="font-oswald font-bold text-white uppercase text-sm tracking-wide">Прайс @Bas713bot</span>
        </div>
        <p className="font-roboto text-white/40 text-xs mb-4">
          Автоматически читает прайс и обновляет цены + наличие. Цена = оптовая + 3 500 ₽.
        </p>

        <div className="flex gap-2 mb-4">
          <button onClick={runParser} disabled={running}
            className="flex-1 bg-[#FFD700] text-black font-oswald font-bold py-2.5 uppercase tracking-wide hover:bg-yellow-400 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            {running
              ? <><Icon name="Loader" size={15} className="animate-spin" /> Синхронизирую...</>
              : <><Icon name="RefreshCw" size={14} /> Обновить</>}
          </button>
          <button onClick={setupWebhook} disabled={settingWebhook}
            title="Подключить автоматический приём от бота"
            className={`px-3 py-2.5 font-oswald font-bold text-xs uppercase flex items-center gap-1.5 transition-colors disabled:opacity-50 ${webhookSetup ? "bg-green-500/20 text-green-400 border border-green-500/30" : "border border-[#444] text-white/50 hover:text-white hover:border-[#666]"}`}>
            {settingWebhook
              ? <Icon name="Loader" size={13} className="animate-spin" />
              : <Icon name={webhookSetup ? "CheckCircle" : "Webhook"} size={13} />}
            {webhookSetup ? "Подключён" : "Webhook"}
          </button>
        </div>

        <div className="flex items-center justify-between border-t border-[#2A2A2A] pt-3">
          <div>
            <div className="font-roboto text-white/60 text-xs">Автосинхронизация каждые 5 мин</div>
            {autoEnabled && (
              <div className="font-roboto text-white/30 text-[10px]">
                Следующий запуск через {fmt2(nextRun)}
              </div>
            )}
          </div>
          <button onClick={toggleAuto}
            className={`w-11 h-6 rounded-full transition-colors relative ${autoEnabled ? "bg-[#FFD700]" : "bg-[#333]"}`}>
            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${autoEnabled ? "translate-x-5" : "translate-x-0.5"}`} />
          </button>
        </div>
      </div>

      {lastRun && (
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] p-3 mb-3">
          <div className="font-roboto text-white/30 text-[10px] uppercase tracking-wide mb-2">
            Последний запуск: {lastRun}
          </div>
          {lastResult && (
            lastResult.message ? (
              <div className="font-roboto text-yellow-400 text-xs">{lastResult.message}</div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: "Обработано", val: lastResult.parsed ?? 0, color: "text-white" },
                  { label: "Изменилось", val: lastResult.changed ?? 0, color: "text-yellow-400" },
                  { label: "Обновлено", val: lastResult.updated ?? 0, color: "text-blue-400" },
                  { label: "Добавлено", val: lastResult.inserted ?? 0, color: "text-green-400" },
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

      <div className="bg-[#1A1A1A] border border-[#2A2A2A] p-4 mb-4">
        <div className="flex items-center gap-2 mb-1">
          <Icon name="Send" size={14} className="text-[#FFD700]" />
          <span className="font-oswald font-bold text-white uppercase text-sm tracking-wide">Прайс в Telegram-канале</span>
        </div>
        <p className="font-roboto text-white/40 text-xs mb-4">
          Обновляет существующие сообщения с прайсом в канале. Новых постов не публикует — подписчикам не приходит спам.
        </p>

        <button onClick={publishPrice} disabled={publishing}
          className="w-full bg-[#FFD700] text-black font-oswald font-bold py-2.5 uppercase tracking-wide hover:bg-yellow-400 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
          {publishing
            ? <><Icon name="Loader" size={15} className="animate-spin" /> Обновляю...</>
            : <><Icon name="Send" size={14} /> Обновить прайс в канале</>}
        </button>

        {publishedAt && (
          <div className="font-roboto text-white/30 text-[10px] mt-3">
            Последнее обновление: {publishedAt}
          </div>
        )}

        {publishResult && (
          <div className="mt-3 pt-3 border-t border-[#2A2A2A]">
            {publishResult.error || publishResult.reason ? (
              <div className="font-roboto text-red-400 text-xs">
                {publishResult.error || (publishResult.reason === "catalog_empty" ? "Каталог пуст" : publishResult.reason)}
              </div>
            ) : publishResult.sent ? (
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: "Категорий", val: publishResult.categories ?? 0, color: "text-white" },
                  { label: "Товаров", val: publishResult.items ?? 0, color: "text-white" },
                  { label: "Обновлено", val: publishResult.edited ?? 0, color: "text-yellow-400" },
                  { label: "Новых", val: publishResult.new_messages ?? 0, color: "text-green-400" },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <div className={`font-oswald font-bold text-xl ${s.color}`}>{s.val}</div>
                    <div className="font-roboto text-white/30 text-[10px]">{s.label}</div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        )}
      </div>

      <div className="bg-[#1A1A1A] border border-[#2A2A2A] p-3">
        <div className="font-roboto text-white/30 text-[10px] uppercase tracking-wide mb-2">Как работает</div>
        <ol className="space-y-1.5">
          {[
            "Бот принимает прайс от @Bas713bot автоматически через webhook",
            "Парсит: регион, модель, память, цвет, цену (+3 500 ₽), наличие",
            "Обновляет каталог только если изменились цена или наличие",
            "Фото из @appledysonphoto привязываются автоматически",
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
