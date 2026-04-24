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

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div
        className="bg-[#0F0F0F] border border-[#2A2A2A] w-full sm:max-w-2xl max-h-[90vh] sm:max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Шапка */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#2A2A2A] shrink-0">
          <div>
            <div className="font-oswald font-bold text-white text-base">{title}</div>
            <div className="font-roboto text-white/40 text-[10px] mt-0.5">
              {periodLabel(period)} · {orders.length} {orders.length === 1 ? "заказ" : "заказов"}
            </div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white p-1">
            <Icon name="X" size={20} />
          </button>
        </div>

        {/* Итого */}
        {!loading && orders.length > 0 && (
          <div className="grid grid-cols-4 gap-2 px-4 py-3 border-b border-[#2A2A2A] bg-[#151515] shrink-0">
            <div>
              <div className="font-roboto text-white/30 text-[9px] uppercase">Выручка</div>
              <div className={`font-oswald font-bold text-sm ${accent === "revenue" ? "text-[#FFD700]" : "text-white/80"}`}>
                {money(totals.revenue)}
              </div>
            </div>
            <div>
              <div className="font-roboto text-white/30 text-[9px] uppercase">Закупка</div>
              <div className={`font-oswald font-bold text-sm ${accent === "costs" ? "text-orange-400" : "text-white/80"}`}>
                {money(totals.costs)}
              </div>
            </div>
            <div>
              <div className="font-roboto text-white/30 text-[9px] uppercase">Мастеру</div>
              <div className={`font-oswald font-bold text-sm ${accent === "master" ? "text-blue-400" : "text-white/80"}`}>
                {money(totals.master)}
              </div>
            </div>
            <div>
              <div className="font-roboto text-white/30 text-[9px] uppercase">Прибыль</div>
              <div className={`font-oswald font-bold text-sm ${profit >= 0 ? "text-green-400" : "text-red-400"}`}>
                {money(profit - totals.master)}
              </div>
            </div>
          </div>
        )}

        {/* Список */}
        <div className="flex-1 overflow-y-auto">
          {loading && <div className="text-center py-12 text-white/30 font-roboto text-sm">Загружаю...</div>}
          {!loading && orders.length === 0 && (
            <div className="text-center py-12 text-white/30 font-roboto text-sm">
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
  );
}