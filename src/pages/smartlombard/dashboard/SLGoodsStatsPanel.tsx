import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { SMARTLOMBARD_URL } from "../../staff.types";

interface GoodsStats {
  ok: boolean;
  date_from: string;
  date_to: string;
  bought_count: number;
  bought_sum: number;
  sold_count: number;
  sold_sum: number;
  returned_count: number;
  returned_sum: number;
  on_shelf_count: number;
  on_shelf_sum: number;
  on_realization_count: number;
  on_realization_sum: number;
  total_unique_items: number;
  per_account?: Array<{ account_id: string; fetched: number; error: string | null }>;
}

interface Props {
  token: string;
  dateFrom: string;
  dateTo: string;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(n);

export function SLGoodsStatsPanel({ token, dateFrom, dateTo }: Props) {
  const [data, setData] = useState<GoodsStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const url = `${SMARTLOMBARD_URL}?action=goods_stats&date_from=${dateFrom}&date_to=${dateTo}`;
      const res = await fetch(url, { headers: { "X-Employee-Token": token } });
      const j = await res.json();
      if (!res.ok || j.error) {
        setError(typeof j.error === "string" ? j.error : `HTTP ${res.status}`);
        setData(null);
      } else {
        setData(j);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [token, dateFrom, dateTo]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="border rounded-lg bg-card">
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <div className="flex items-center gap-2">
          <Icon name="Package" size={16} className="text-muted-foreground" />
          <h3 className="text-sm font-semibold">Куплено / Продано (комиссионка)</h3>
          <span className="text-xs text-muted-foreground">
            {dateFrom} → {dateTo}
          </span>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="text-xs px-2 py-1 rounded border hover:bg-accent disabled:opacity-50"
        >
          {loading ? "Загрузка…" : "Обновить"}
        </button>
      </div>

      {error && (
        <div className="px-3 py-2 text-xs text-red-600 bg-red-50 dark:bg-red-950/30 border-b">
          {error}
        </div>
      )}

      {loading && !data && (
        <div className="px-3 py-6 text-center text-sm text-muted-foreground">
          Загружаем товары из SmartLombard…
        </div>
      )}

      {data && (
        <div className="p-3 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-lg border bg-emerald-50 dark:bg-emerald-950/30 p-4">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                <Icon name="ShoppingCart" size={18} />
                <span className="text-xs font-medium uppercase tracking-wide">Куплено</span>
              </div>
              <div className="mt-2 text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                {fmt(data.bought_count)} шт.
              </div>
              <div className="text-sm text-emerald-700 dark:text-emerald-300">
                на {fmt(data.bought_sum)} ₽
              </div>
              <div className="text-[11px] text-muted-foreground mt-1">
                Скуплено + принято на реализацию
              </div>
            </div>

            <div className="rounded-lg border bg-blue-50 dark:bg-blue-950/30 p-4">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                <Icon name="HandCoins" size={18} />
                <span className="text-xs font-medium uppercase tracking-wide">Продано</span>
              </div>
              <div className="mt-2 text-2xl font-bold text-blue-900 dark:text-blue-100">
                {fmt(data.sold_count)} шт.
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-300">
                на {fmt(data.sold_sum)} ₽
              </div>
              <div className="text-[11px] text-muted-foreground mt-1">
                Продажа выкупленных + комиссионных
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded border p-2">
              <div className="text-[11px] text-muted-foreground">На витрине</div>
              <div className="text-base font-semibold">{fmt(data.on_shelf_count)}</div>
              <div className="text-[11px] text-muted-foreground">{fmt(data.on_shelf_sum)} ₽</div>
            </div>
            <div className="rounded border p-2">
              <div className="text-[11px] text-muted-foreground">На реализации</div>
              <div className="text-base font-semibold">{fmt(data.on_realization_count)}</div>
              <div className="text-[11px] text-muted-foreground">
                {fmt(data.on_realization_sum)} ₽
              </div>
            </div>
            <div className="rounded border p-2">
              <div className="text-[11px] text-muted-foreground">Возвраты</div>
              <div className="text-base font-semibold">{fmt(data.returned_count)}</div>
              <div className="text-[11px] text-muted-foreground">
                {fmt(data.returned_sum)} ₽
              </div>
            </div>
          </div>

          {data.per_account && data.per_account.length > 0 && (
            <div className="text-[11px] text-muted-foreground border-t pt-2">
              Загружено товаров:{" "}
              {data.per_account.map((a, i) => (
                <span key={a.account_id}>
                  {i > 0 && " · "}
                  #{a.account_id}: {a.fetched}
                  {a.error && (
                    <span className="text-red-600"> ({a.error})</span>
                  )}
                </span>
              ))}
              {" · всего уникальных: "}
              <b>{data.total_unique_items}</b>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SLGoodsStatsPanel;
