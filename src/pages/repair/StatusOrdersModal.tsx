import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { REPAIR_URL, Order, STATUSES, fmt } from "./types";

type Period = "day" | "yesterday" | "week" | "month";

type Props = {
  token?: string;
  period: Period;
  statuses: string[];
  title: string;
  accent: "revenue" | "costs" | "master" | "profit" | "status";
  onClose: () => void;
  /** Кастомный URL (для админки) */
  fetchUrl?: string;
  /** Кастомные заголовки (для админки) */
  fetchHeaders?: Record<string, string>;
  /** Клик по заказу — переход к карточке */
  onOrderClick?: (orderId: number) => void;
};

const periodLabel = (p: Period) =>
  p === "day" ? "сегодня" : p === "yesterday" ? "вчера" : p === "week" ? "за 7 дней" : "за 30 дней";

const money = (v: number | null | undefined) =>
  v != null ? v.toLocaleString("ru-RU") + " ₽" : "—";

const STATUS_LABEL: Record<string, string> = {
  new: "Принята", accepted: "Принят мастером", in_progress: "В работе",
  waiting_parts: "Ждём запчасть", ready: "Готово", done: "Выдано",
  warranty: "На гарантии", cancelled: "Отменено",
};

const csvEscape = (v: unknown): string => {
  const s = v == null ? "" : String(v);
  if (s.includes('"') || s.includes(";") || s.includes("\n") || s.includes("\r")) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
};

export default function StatusOrdersModal({ token, period, statuses, title, accent, onClose, fetchUrl, fetchHeaders, onOrderClick }: Props) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const sp = statuses.length ? `&statuses=${statuses.join(",")}` : "";
      const url = fetchUrl || REPAIR_URL;
      const headers = fetchHeaders || (token ? { "X-Employee-Token": token } : {});
      const res = await fetch(`${url}?action=analytics_orders&period=${period}${sp}`, { headers });
      const data = await res.json();
      setOrders(data.orders || []);
      setLoading(false);
    })();
  }, [token, period, statuses, fetchUrl, fetchHeaders]);

  const totals = orders.reduce(
    (a, o) => ({
      count: a.count + 1,
      revenue: a.revenue + (o.repair_amount || 0),
      costs: a.costs + (o.purchase_amount || 0),
      master: a.master + (o.master_income || 0),
    }),
    { count: 0, revenue: 0, costs: 0, master: 0 }
  );
  const profit = totals.revenue - totals.costs;

  const [exporting, setExporting] = useState(false);
  const exportCsv = async () => {
    if (!orders.length) return;
    setExporting(true);
    const { saveAs } = await import("file-saver");
    const header = [
      "№", "Дата", "Статус", "Клиент", "Телефон", "Модель", "Тип ремонта",
      "Запчасть", "Закупка", "Выручка", "Мастеру", "Прибыль",
      "Комментарий", "Заметка",
    ];
    const rows = orders.map((o) => {
      const when = o.status_updated_at || o.picked_up_at || o.completed_at || o.created_at;
      const p = (o.repair_amount || 0) - (o.purchase_amount || 0) - (o.master_income || 0);
      return [
        o.id,
        when ? new Date(when).toLocaleString("ru-RU") : "",
        STATUS_LABEL[o.status] || o.status,
        o.name,
        o.phone,
        o.model || "",
        o.repair_type || "",
        o.parts_name || "",
        o.purchase_amount != null ? o.purchase_amount : "",
        o.repair_amount != null ? o.repair_amount : "",
        o.master_income != null ? o.master_income : "",
        p,
        o.comment || "",
        o.admin_note || "",
      ];
    });
    const totalsRow = [
      "", "", "ИТОГО", `${orders.length} заказов`, "", "", "", "",
      totals.costs, totals.revenue, totals.master, profit - totals.master, "", "",
    ];
    const csv = [header, ...rows, totalsRow].map((r) => r.map(csvEscape).join(";")).join("\r\n");
    // UTF-8 BOM — чтобы Excel правильно открыл кириллицу
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const periodName = period === "day" ? "сегодня" : period === "yesterday" ? "вчера" : period === "week" ? "7-дней" : "30-дней";
    const stamp = new Date().toISOString().slice(0, 10);
    saveAs(blob, `ремонт-${periodName}-${stamp}.csv`);
    setExporting(false);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center animate-in fade-in duration-200" onClick={onClose}>
      <div
        className="relative w-full sm:max-w-2xl max-h-[90vh] sm:max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HALO + conic-gradient рамка */}
        <span aria-hidden className="absolute -inset-2 rounded-2xl pointer-events-none hidden sm:block" style={{ background: "radial-gradient(closest-side,rgba(255,215,0,0.20),transparent 75%)", filter: "blur(18px)" }} />
        <div className="relative p-[1.5px] sm:rounded-2xl bg-[conic-gradient(from_180deg_at_50%_50%,rgba(255,215,0,0.6)_0deg,rgba(255,215,0,0.15)_180deg,rgba(255,243,160,0.6)_360deg)] shadow-[0_12px_40px_rgba(255,215,0,0.20)] flex flex-col min-h-0 max-h-full">
        <div className="bg-gradient-to-br from-[#1A1A1A] via-[#0F0F0F] to-[#0A0A0A] sm:rounded-2xl flex-1 flex flex-col min-h-0 overflow-hidden">

        {/* Шапка */}
        <div className="relative flex items-center justify-between px-4 py-3 border-b border-[#FFD700]/15 shrink-0 gap-2">
          <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FFD700]/55 to-transparent pointer-events-none" />
          <div className="min-w-0 flex items-center gap-2">
            <div className="relative w-8 h-8 rounded-full p-[1.5px] bg-[conic-gradient(from_0deg,#b8860b,#ffd700,#fff3a0,#ffd700,#b8860b)] shadow-[0_0_12px_rgba(255,215,0,0.4)] shrink-0">
              <div className="w-full h-full rounded-full bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] flex items-center justify-center">
                <Icon name="ListOrdered" size={14} className="text-[#FFD700] drop-shadow-[0_0_4px_rgba(255,215,0,0.7)]" />
              </div>
            </div>
            <div>
              <div className="font-oswald font-bold text-base truncate bg-gradient-to-r from-[#FFD700] via-[#fff3a0] to-[#FFD700] bg-clip-text text-transparent animate-shimmer">{title}</div>
              <div className="font-roboto text-white/55 text-[10px] mt-0.5">
                {periodLabel(period)} · {orders.length} {orders.length === 1 ? "заказ" : "заказов"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={exportCsv}
              disabled={!orders.length || exporting}
              title="Выгрузить в Excel"
              className="relative inline-flex items-center gap-1 text-[#FFD700] bg-gradient-to-br from-[#FFD700]/15 to-transparent border border-[#FFD700]/40 hover:border-[#FFD700]/70 hover:shadow-[0_0_14px_rgba(255,215,0,0.30)] disabled:opacity-30 disabled:hover:shadow-none px-2.5 py-1.5 font-roboto text-[11px] rounded-md transition-all active:scale-95"
            >
              <Icon name={exporting ? "Loader" : "Download"} size={12} className={exporting ? "animate-spin" : ""} />
              <span className="font-bold">Excel</span>
            </button>
            <button onClick={onClose}
              title="Закрыть"
              className="text-white/50 hover:text-red-300 hover:bg-red-500/10 p-1.5 rounded-md transition-colors active:scale-95">
              <Icon name="X" size={20} />
            </button>
          </div>
        </div>

        {/* Итого — премиум-карточки */}
        {!loading && orders.length > 0 && (
          <div className="grid grid-cols-4 gap-2 px-4 py-3 border-b border-[#FFD700]/10 shrink-0 bg-black/20">
            {[
              { label: "Выручка", val: money(totals.revenue), col: "revenue", accentCol: "text-[#FFD700] drop-shadow-[0_0_4px_rgba(255,215,0,0.4)]" },
              { label: "Закупка", val: money(totals.costs), col: "costs", accentCol: "text-orange-300 drop-shadow-[0_0_4px_rgba(251,146,60,0.4)]" },
              { label: "Мастеру", val: money(totals.master), col: "master", accentCol: "text-blue-300 drop-shadow-[0_0_4px_rgba(59,130,246,0.4)]" },
              { label: "Прибыль", val: money(profit - totals.master), col: "profit", accentCol: profit - totals.master >= 0 ? "text-emerald-300 drop-shadow-[0_0_4px_rgba(16,185,129,0.4)]" : "text-red-400" },
            ].map((c) => {
              const isAccent = accent === c.col || (c.col === "profit");
              return (
                <div key={c.label} className="relative bg-gradient-to-br from-[#141414] to-[#0A0A0A] border border-[#1F1F1F] rounded-md px-2 py-1.5 overflow-hidden">
                  {isAccent && <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-current/30 to-transparent" />}
                  <div className="font-roboto text-white/40 text-[9px] uppercase tracking-wider">{c.label}</div>
                  <div className={`font-oswald font-bold text-sm ${isAccent ? c.accentCol : "text-white/80"}`}>{c.val}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* Список */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {loading && (
            <div className="text-center py-12">
              <div className="relative inline-block">
                <span className="absolute inset-0 rounded-full bg-[#FFD700]/30 blur-md animate-pulse" />
                <Icon name="Loader" size={22} className="relative animate-spin text-[#FFD700] drop-shadow-[0_0_8px_rgba(255,215,0,0.7)]" />
              </div>
              <div className="font-roboto text-white/40 text-sm mt-2">Загружаю заказы…</div>
            </div>
          )}
          {!loading && orders.length === 0 && (
            <div className="text-center py-12 text-white/40 font-roboto text-sm">
              <Icon name="Inbox" size={32} className="mx-auto mb-2 text-[#FFD700]/40" />
              Нет заказов {periodLabel(period)}
            </div>
          )}
          {!loading &&
            orders.map((o) => {
              const st = STATUSES.find((s) => s.key === o.status) || STATUSES[0];
              const when = o.status_updated_at || o.picked_up_at || o.completed_at || o.created_at;
              const clickable = !!onOrderClick;
              return (
                <div
                  key={o.id}
                  onClick={() => clickable && onOrderClick!(o.id)}
                  className={`px-4 py-3 border-b border-[#1F1F1F] transition-colors ${clickable ? "cursor-pointer hover:bg-white/[0.04] active:bg-white/[0.06]" : "hover:bg-white/[0.02]"}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`inline-block px-1.5 py-0.5 text-[9px] font-roboto ${st.color}`}>
                        {st.label}
                      </span>
                      <span className="font-oswald font-bold text-white text-sm">#{o.id}</span>
                      <span className="font-roboto text-white text-xs truncate">{o.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="font-roboto text-white/30 text-[10px]">
                        {when ? fmt(when) : "—"}
                      </span>
                      {clickable && <Icon name="ChevronRight" size={14} className="text-white/30" />}
                    </div>
                  </div>
                  <div className="font-roboto text-white/60 text-xs mb-1">
                    {o.model || "—"}
                    {o.repair_type && <span className="text-white/30"> · {o.repair_type}</span>}
                  </div>
                  {o.parts_name && (
                    <div className="font-roboto text-white/40 text-[11px] mb-1">
                      <span className="text-white/30">Запчасть: </span>
                      {o.parts_name}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-roboto">
                    {o.repair_amount != null && (
                      <span className="text-[#FFD700]">
                        Выручка: <b>{money(o.repair_amount)}</b>
                      </span>
                    )}
                    {o.purchase_amount != null && o.purchase_amount > 0 && (
                      <span className="text-orange-400">
                        Закупка: <b>{money(o.purchase_amount)}</b>
                      </span>
                    )}
                    {o.master_income != null && o.master_income > 0 && (
                      <span className="text-blue-400">
                        Мастеру: <b>{money(o.master_income)}</b>
                      </span>
                    )}
                    {o.repair_amount != null && o.purchase_amount != null && (
                      <span className="text-green-400">
                        Прибыль:{" "}
                        <b>{money((o.repair_amount || 0) - (o.purchase_amount || 0) - (o.master_income || 0))}</b>
                      </span>
                    )}
                  </div>
                  {o.phone && (
                    <div className="font-roboto text-white/30 text-[10px] mt-1" onClick={(e) => e.stopPropagation()}>
                      <a href={`tel:${o.phone}`} className="hover:text-white">
                        {o.phone}
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
        </div>
        </div>
      </div>
    </div>
  );
}