import { useState, useCallback, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { SMARTLOMBARD_URL } from "../staff.types";

type ApiOnly = {
  article: number;
  types: string[];
  last_type: string;
  last_sum: number;
  last_date: string;
  employee: string;
  client: string;
  relevant_for_goods: boolean;
};

type DbOnly = {
  article: number;
  item_type: number;
  name: string;
  price: number;
  organization: number | null;
  sold: number;
  withdrawn: number;
  hidden: number;
  removed: boolean;
  updated_at: string | null;
};

type InBoth = {
  article: number;
  api_types: string[];
  api_last_type: string;
  api_last_sum: number;
  api_last_date: string;
  api_employee: string;
  api_client: string;
  db_name: string;
  db_price: number;
  db_sold: number;
  db_withdrawn: number;
  db_removed: boolean;
};

type ReconcileData = {
  date_from: string;
  date_to: string;
  api_operations_total: number;
  api_articles_total: number;
  db_goods_total: number;
  only_in_api: ApiOnly[];
  only_in_db: DbOnly[];
  in_both: InBoth[];
  counts: { only_in_api: number; only_in_db: number; in_both: number };
};

const TYPE_RU: Record<string, string> = {
  pledge: "Залог",
  buyout: "Выкуп",
  prolongation: "Продление",
  prolongation_online: "Продление онлайн",
  repledge: "Перезалог",
  dobor: "Добор",
  part_buyout: "Частичный выкуп",
  part_buyout_pawn_good: "Частичный выкуп им.",
  sell_realization: "Реализация",
  send_to_realization: "В реализацию",
  seizure: "Изъятие",
};

function todayDmy() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}

function shiftDmy(days: number) {
  const d = new Date(); d.setDate(d.getDate() + days);
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}

function fmtMoney(v: number) {
  return Math.round(v).toLocaleString("ru-RU") + " ₽";
}

type Tab = "only_api" | "only_db" | "both";

export function SLReconcile({ token }: { token: string }) {
  const [dateFrom, setDateFrom] = useState(shiftDmy(-29));
  const [dateTo, setDateTo] = useState(todayDmy());
  const [data, setData] = useState<ReconcileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("only_api");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const url = `${SMARTLOMBARD_URL}?action=reconcile&date_from=${encodeURIComponent(dateFrom)}&date_to=${encodeURIComponent(dateTo)}`;
      const r = await fetch(url, { headers: { "X-Employee-Token": token } });
      const j = await r.json();
      if (!r.ok || j.error) {
        setError(j.error || `HTTP ${r.status}`);
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

  useEffect(() => { load();   }, []);

  const setPreset = (days: number) => {
    setDateFrom(shiftDmy(-days + 1));
    setDateTo(todayDmy());
  };

  const filterStr = search.trim().toLowerCase();
  const onlyApiFiltered = (data?.only_in_api || []).filter(r =>
    !filterStr || `${r.article} ${r.client} ${r.employee}`.toLowerCase().includes(filterStr));
  const onlyDbFiltered = (data?.only_in_db || []).filter(r =>
    !filterStr || `${r.article} ${r.name}`.toLowerCase().includes(filterStr));
  const bothFiltered = (data?.in_both || []).filter(r =>
    !filterStr || `${r.article} ${r.db_name} ${r.api_client}`.toLowerCase().includes(filterStr));

  return (
    <div className="px-3 pb-6">
      <div className="bg-[#0E0E0E] border border-[#1F1F1F] rounded-xl p-3 mb-3">
        <div className="font-oswald font-bold text-white text-sm uppercase mb-2 flex items-center gap-2">
          <Icon name="GitCompareArrows" size={16} className="text-[#FFD700]" />
          Сверка: API operations ↔ наша БД (sl_goods)
        </div>

        <div className="flex flex-wrap gap-2 mb-2">
          {[
            { l: "Сегодня", d: 1 },
            { l: "7 дней", d: 7 },
            { l: "30 дней", d: 30 },
            { l: "90 дней", d: 90 },
          ].map(p => (
            <button key={p.l} onClick={() => setPreset(p.d)}
              className="font-roboto text-[11px] px-3 py-1.5 rounded-md bg-[#141414] border border-[#1F1F1F] text-white/60 hover:text-white hover:border-[#FFD700]/40 transition-all">
              {p.l}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1">
            <span className="font-roboto text-[10px] text-white/40">С</span>
            <input value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              placeholder="DD.MM.YYYY"
              className="bg-[#141414] border border-[#1F1F1F] rounded-md px-2 py-1.5 font-roboto text-[12px] text-white w-28" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-roboto text-[10px] text-white/40">По</span>
            <input value={dateTo} onChange={e => setDateTo(e.target.value)}
              placeholder="DD.MM.YYYY"
              className="bg-[#141414] border border-[#1F1F1F] rounded-md px-2 py-1.5 font-roboto text-[12px] text-white w-28" />
          </label>
          <button onClick={load} disabled={loading}
            className="font-roboto text-[12px] font-bold px-4 py-1.5 rounded-md bg-[#FFD700] text-black hover:bg-yellow-400 transition-all disabled:opacity-50 flex items-center gap-1.5">
            {loading ? <Icon name="Loader" size={13} className="animate-spin" /> : <Icon name="RefreshCw" size={13} />}
            Сверить
          </button>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Поиск: билет, клиент, сотрудник, товар"
            className="flex-1 min-w-[200px] bg-[#141414] border border-[#1F1F1F] rounded-md px-3 py-1.5 font-roboto text-[12px] text-white placeholder:text-white/30" />
        </div>

        {error && (
          <div className="mt-2 px-3 py-2 rounded-md bg-red-500/10 border border-red-500/30 font-roboto text-[11px] text-red-300">
            {error}
          </div>
        )}
      </div>

      {data && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
            <div className="bg-[#0E0E0E] border border-[#1F1F1F] rounded-md px-3 py-2">
              <div className="font-roboto text-[10px] text-white/40 uppercase">Операций в API</div>
              <div className="font-oswald text-white text-lg font-bold">{data.api_operations_total}</div>
            </div>
            <div className="bg-[#0E0E0E] border border-[#1F1F1F] rounded-md px-3 py-2">
              <div className="font-roboto text-[10px] text-white/40 uppercase">Билетов в API</div>
              <div className="font-oswald text-white text-lg font-bold">{data.api_articles_total}</div>
            </div>
            <div className="bg-[#0E0E0E] border border-[#1F1F1F] rounded-md px-3 py-2">
              <div className="font-roboto text-[10px] text-white/40 uppercase">Товаров в БД</div>
              <div className="font-oswald text-white text-lg font-bold">{data.db_goods_total}</div>
            </div>
            <div className="bg-[#0E0E0E] border border-[#1F1F1F] rounded-md px-3 py-2">
              <div className="font-roboto text-[10px] text-white/40 uppercase">Совпало</div>
              <div className="font-oswald text-emerald-300 text-lg font-bold">{data.counts.in_both}</div>
            </div>
          </div>

          <div className="flex gap-1.5 mb-2 overflow-x-auto no-scrollbar">
            {([
              { k: "only_api", l: `Только в API`, c: data.counts.only_in_api, color: "amber" },
              { k: "only_db",  l: `Только в БД`,  c: data.counts.only_in_db,  color: "blue" },
              { k: "both",     l: `В обоих`,      c: data.counts.in_both,     color: "emerald" },
            ] as { k: Tab; l: string; c: number; color: string }[]).map(t => {
              const a = tab === t.k;
              return (
                <button key={t.k} onClick={() => setTab(t.k)}
                  className={`shrink-0 font-roboto text-[11px] px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                    a ? "bg-[#FFD700] text-black font-bold" : "bg-[#141414] border border-[#1F1F1F] text-white/60 hover:text-white"
                  }`}>
                  {t.l}
                  <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                    a ? "bg-black/20 text-black" : `bg-${t.color}-500/20 text-${t.color}-300`
                  }`}>{t.c}</span>
                </button>
              );
            })}
          </div>

          {tab === "only_api" && (
            <div className="bg-[#0E0E0E] border border-[#1F1F1F] rounded-xl overflow-hidden">
              <div className="px-3 py-2 border-b border-[#1F1F1F] font-roboto text-[10px] text-white/50 uppercase">
                Есть в API operations, но НЕТ в нашей БД sl_goods
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-[#0A0A0A]">
                    <tr className="text-left">
                      <th className="px-2 py-1.5 font-roboto text-[10px] text-white/50 uppercase">Билет</th>
                      <th className="px-2 py-1.5 font-roboto text-[10px] text-white/50 uppercase">Тип</th>
                      <th className="px-2 py-1.5 font-roboto text-[10px] text-white/50 uppercase">Сумма</th>
                      <th className="px-2 py-1.5 font-roboto text-[10px] text-white/50 uppercase">Клиент</th>
                      <th className="px-2 py-1.5 font-roboto text-[10px] text-white/50 uppercase">Сотрудник</th>
                      <th className="px-2 py-1.5 font-roboto text-[10px] text-white/50 uppercase">Дата</th>
                      <th className="px-2 py-1.5 font-roboto text-[10px] text-white/50 uppercase">Товар?</th>
                    </tr>
                  </thead>
                  <tbody>
                    {onlyApiFiltered.length === 0 && (
                      <tr><td colSpan={7} className="px-3 py-6 text-center font-roboto text-[12px] text-white/30">Нет расхождений</td></tr>
                    )}
                    {onlyApiFiltered.map(r => (
                      <tr key={r.article} className="border-t border-[#1F1F1F] hover:bg-[#141414]">
                        <td className="px-2 py-1.5 font-mono text-[12px] text-white">{r.article}</td>
                        <td className="px-2 py-1.5 font-roboto text-[11px] text-white/80">{TYPE_RU[r.last_type] || r.last_type}</td>
                        <td className="px-2 py-1.5 font-roboto text-[11px] text-white">{fmtMoney(r.last_sum)}</td>
                        <td className="px-2 py-1.5 font-roboto text-[11px] text-white/70">{r.client || "—"}</td>
                        <td className="px-2 py-1.5 font-roboto text-[11px] text-white/60">{r.employee || "—"}</td>
                        <td className="px-2 py-1.5 font-roboto text-[10px] text-white/50">{r.last_date || "—"}</td>
                        <td className="px-2 py-1.5">
                          {r.relevant_for_goods
                            ? <span className="font-roboto text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">⚠ должен быть</span>
                            : <span className="font-roboto text-[10px] text-white/30">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "only_db" && (
            <div className="bg-[#0E0E0E] border border-[#1F1F1F] rounded-xl overflow-hidden">
              <div className="px-3 py-2 border-b border-[#1F1F1F] font-roboto text-[10px] text-white/50 uppercase">
                Есть в нашей БД sl_goods, но НЕТ в API operations за период
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-[#0A0A0A]">
                    <tr className="text-left">
                      <th className="px-2 py-1.5 font-roboto text-[10px] text-white/50 uppercase">Артикул</th>
                      <th className="px-2 py-1.5 font-roboto text-[10px] text-white/50 uppercase">Название</th>
                      <th className="px-2 py-1.5 font-roboto text-[10px] text-white/50 uppercase">Цена</th>
                      <th className="px-2 py-1.5 font-roboto text-[10px] text-white/50 uppercase">Статус</th>
                      <th className="px-2 py-1.5 font-roboto text-[10px] text-white/50 uppercase">Обновлён</th>
                    </tr>
                  </thead>
                  <tbody>
                    {onlyDbFiltered.length === 0 && (
                      <tr><td colSpan={5} className="px-3 py-6 text-center font-roboto text-[12px] text-white/30">Нет расхождений</td></tr>
                    )}
                    {onlyDbFiltered.map(r => (
                      <tr key={`${r.article}-${r.item_type}`} className="border-t border-[#1F1F1F] hover:bg-[#141414]">
                        <td className="px-2 py-1.5 font-mono text-[12px] text-white">{r.article}</td>
                        <td className="px-2 py-1.5 font-roboto text-[11px] text-white/80 max-w-[300px] truncate">{r.name || "—"}</td>
                        <td className="px-2 py-1.5 font-roboto text-[11px] text-white">{fmtMoney(r.price)}</td>
                        <td className="px-2 py-1.5 flex flex-wrap gap-1">
                          {r.sold ? <span className="font-roboto text-[10px] px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-300">продан</span> : null}
                          {r.withdrawn ? <span className="font-roboto text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-300">изъят</span> : null}
                          {r.removed ? <span className="font-roboto text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/40">удалён</span> : null}
                          {!r.sold && !r.withdrawn && !r.removed ? <span className="font-roboto text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">в продаже</span> : null}
                        </td>
                        <td className="px-2 py-1.5 font-roboto text-[10px] text-white/50">{r.updated_at ? new Date(r.updated_at).toLocaleString("ru-RU") : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "both" && (
            <div className="bg-[#0E0E0E] border border-[#1F1F1F] rounded-xl overflow-hidden">
              <div className="px-3 py-2 border-b border-[#1F1F1F] font-roboto text-[10px] text-white/50 uppercase">
                Билет есть и в API, и в БД
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-[#0A0A0A]">
                    <tr className="text-left">
                      <th className="px-2 py-1.5 font-roboto text-[10px] text-white/50 uppercase">Билет</th>
                      <th className="px-2 py-1.5 font-roboto text-[10px] text-white/50 uppercase">Товар (БД)</th>
                      <th className="px-2 py-1.5 font-roboto text-[10px] text-white/50 uppercase">Цена БД</th>
                      <th className="px-2 py-1.5 font-roboto text-[10px] text-white/50 uppercase">Опер. API</th>
                      <th className="px-2 py-1.5 font-roboto text-[10px] text-white/50 uppercase">Сумма API</th>
                      <th className="px-2 py-1.5 font-roboto text-[10px] text-white/50 uppercase">Клиент</th>
                      <th className="px-2 py-1.5 font-roboto text-[10px] text-white/50 uppercase">Статус БД</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bothFiltered.length === 0 && (
                      <tr><td colSpan={7} className="px-3 py-6 text-center font-roboto text-[12px] text-white/30">Пусто</td></tr>
                    )}
                    {bothFiltered.map(r => (
                      <tr key={r.article} className="border-t border-[#1F1F1F] hover:bg-[#141414]">
                        <td className="px-2 py-1.5 font-mono text-[12px] text-white">{r.article}</td>
                        <td className="px-2 py-1.5 font-roboto text-[11px] text-white/80 max-w-[260px] truncate">{r.db_name || "—"}</td>
                        <td className="px-2 py-1.5 font-roboto text-[11px] text-white">{fmtMoney(r.db_price)}</td>
                        <td className="px-2 py-1.5 font-roboto text-[11px] text-white/80">{TYPE_RU[r.api_last_type] || r.api_last_type}</td>
                        <td className="px-2 py-1.5 font-roboto text-[11px] text-white">{fmtMoney(r.api_last_sum)}</td>
                        <td className="px-2 py-1.5 font-roboto text-[11px] text-white/70">{r.api_client || "—"}</td>
                        <td className="px-2 py-1.5 flex flex-wrap gap-1">
                          {r.db_sold ? <span className="font-roboto text-[10px] px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-300">продан</span> : null}
                          {r.db_withdrawn ? <span className="font-roboto text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-300">изъят</span> : null}
                          {r.db_removed ? <span className="font-roboto text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/40">удалён</span> : null}
                          {!r.db_sold && !r.db_withdrawn && !r.db_removed ? <span className="font-roboto text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">в продаже</span> : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {!data && !loading && !error && (
        <div className="text-center py-10 font-roboto text-[12px] text-white/30">
          Нажми «Сверить» чтобы загрузить расхождения за период.
        </div>
      )}
    </div>
  );
}

export default SLReconcile;
