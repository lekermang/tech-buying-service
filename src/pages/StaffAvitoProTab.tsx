import { useEffect, useState, useCallback } from "react";
import Icon from "@/components/ui/icon";
import AvitoStatsCards from "./staffAvitoPro/AvitoStatsCards";
import AvitoChart from "./staffAvitoPro/AvitoChart";
import AvitoTopList from "./staffAvitoPro/AvitoTopList";
import { Dashboard, SYNC_URL, formatDate } from "./staffAvitoPro/types";

export default function StaffAvitoProTab(_props: { token: string }) {
  void _props;
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [statsSyncing, setStatsSyncing] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const flash = (type: "ok" | "err", text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4500);
  };

  const load = useCallback(async () => {
    try {
      const r = await fetch(`${SYNC_URL}?action=dashboard`);
      const d = await r.json();
      if (d.ok) setData(d as Dashboard);
      else flash("err", d.error || "Не удалось загрузить дашборд");
    } catch (e) {
      flash("err", e instanceof Error ? e.message : "Ошибка соединения");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const runSync = async () => {
    setSyncing(true);
    try {
      const r = await fetch(`${SYNC_URL}?action=firstrun`);
      const d = await r.json();
      if (d.ok) {
        flash(
          "ok",
          d.skipped
            ? `Уже синхронизировано: ${d.count} товаров`
            : `Готово: добавлено ${d.added}, обновлено ${d.updated}`,
        );
        load();
      } else {
        flash("err", d.error || "Не удалось");
      }
    } catch {
      flash("err", "Ошибка соединения");
    } finally {
      setSyncing(false);
    }
  };

  const runStatsSync = async () => {
    setStatsSyncing(true);
    try {
      const r = await fetch(`${SYNC_URL}?action=sync_stats`);
      const d = await r.json();
      if (d.ok) {
        flash("ok", `Статистика обновлена: ${d.updated || 0} записей`);
        load();
      } else {
        flash("err", d.error || "Не удалось обновить статистику");
      }
    } catch {
      flash("err", "Ошибка соединения");
    } finally {
      setStatsSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-20 rounded-xl bg-white/5 animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-20 rounded-lg bg-white/5 animate-pulse" />
          ))}
        </div>
        <div className="h-40 rounded-xl bg-white/5 animate-pulse" />
        <div className="h-60 rounded-xl bg-white/5 animate-pulse" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12 border border-dashed border-white/10 rounded-xl">
        <Icon name="AlertCircle" size={32} className="text-red-400/70 mx-auto mb-2" />
        <div className="text-white/70 font-oswald font-bold text-sm uppercase tracking-wide">
          Не удалось загрузить дашборд
        </div>
        <button
          onClick={load}
          className="mt-3 inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white font-oswald font-bold text-xs px-3 py-1.5 rounded uppercase tracking-wide"
        >
          <Icon name="RefreshCw" size={12} />
          Попробовать снова
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Шапка */}
      <div className="relative rounded-xl bg-gradient-to-br from-[#FFD700]/12 via-[#FFD700]/4 to-transparent border border-[#FFD700]/30 p-3 overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-[#FFD700]/8 blur-3xl pointer-events-none" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FFD700]/40 to-transparent" />

        <div className="relative flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#FFE34D] via-[#FFD700] to-[#b8860b] flex items-center justify-center shrink-0 shadow-[0_4px_12px_rgba(255,215,0,0.4)]">
              <Icon name="Zap" size={18} className="text-black drop-shadow" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-oswald font-bold uppercase text-[14px] tracking-[0.04em] leading-tight bg-gradient-to-r from-[#FFD700] via-[#FFE34D] to-[#FFD700] bg-clip-text text-transparent">
                Авито PRO
              </div>
              <div className="text-[11px] text-white/60 mt-0.5">
                Сводка по объявлениям, статистика и автодействия. Последняя синхронизация: {formatDate(data.last_sync)}
              </div>
            </div>
          </div>
          <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-1.5">
            <button
              onClick={runStatsSync}
              disabled={statsSyncing}
              className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-blue-600 to-violet-500 hover:shadow-[0_0_16px_rgba(99,102,241,0.5)] text-white font-oswald font-bold text-xs px-3 py-2 rounded uppercase tracking-wide disabled:opacity-40 transition-all"
              title="Скачать просмотры и контакты с Авито за 30 дней"
            >
              <Icon name={statsSyncing ? "Loader2" : "BarChart2"} size={14} className={statsSyncing ? "animate-spin" : ""} />
              {statsSyncing ? "Загружаю..." : "Обновить статистику"}
            </button>
            <button
              onClick={runSync}
              disabled={syncing}
              className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-[#FFD700] to-[#FFE55C] hover:shadow-[0_0_16px_rgba(255,215,0,0.5)] text-black font-oswald font-bold text-xs px-3 py-2 rounded uppercase tracking-wide disabled:opacity-50 transition-all"
            >
              <Icon name={syncing ? "Loader2" : "RefreshCw"} size={14} className={syncing ? "animate-spin" : ""} />
              {syncing ? "Синхронизирую..." : "Синхронизировать товары"}
            </button>
          </div>
        </div>
      </div>

      {msg && (
        <div
          className={`text-[11px] rounded px-3 py-2 flex items-center gap-2 ${
            msg.type === "ok"
              ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
              : "bg-red-500/10 border border-red-500/30 text-red-300"
          }`}
        >
          <Icon name={msg.type === "ok" ? "CheckCircle2" : "AlertCircle"} size={13} />
          {msg.text}
        </div>
      )}

      <AvitoStatsCards totals={data.totals} />
      <AvitoChart chart={data.chart} />
      <AvitoTopList items={data.top} />

      <div className="rounded-xl bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20 p-3 flex items-start gap-2">
        <Icon name="Lightbulb" size={14} className="text-purple-300 shrink-0 mt-0.5" />
        <div className="text-[11px] text-white/65 leading-relaxed">
          Скоро здесь появится: <b className="text-white/80">Чат Авито</b> (вся переписка с клиентами в одном окне),{" "}
          <b className="text-white/80">Автопродвижение</b> (расписание поднятий объявлений) и{" "}
          <b className="text-white/80">Autoload</b> (публикация товаров на Авито одной кнопкой).
        </div>
      </div>
    </div>
  );
}
