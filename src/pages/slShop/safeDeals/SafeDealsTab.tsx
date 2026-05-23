/** Главная вкладка «Безопасные сделки» в админке СЛ-Шопа. */
import { useCallback, useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { SLStat, SLPill, SLInput, SLButton, SLGrid, SLTabs } from "../slUI";
import {
  sdApi, fmtRub, fmtDate, STATUS_LABEL, STATUS_OPTIONS,
  type AdminListItem, type AdminStats, type DealStatus,
} from "./types";
import SafeDealDetail from "./SafeDealDetail";

type View = "all" | "active" | "completed" | "stats";

export default function SafeDealsTab({ token }: { token: string }) {
  const [view, setView] = useState<View>("all");
  const [items, setItems] = useState<AdminListItem[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<DealStatus | "all">("all");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);

  const fetchStats = useCallback(async () => {
    const r = await sdApi<AdminStats>(token, "admin_stats");
    if (r.ok && r.data) setStats(r.data);
  }, [token]);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    let statusParam: string = filter;
    if (view === "active") statusParam = "all";
    if (view === "completed") statusParam = "completed";
    const r = await sdApi<{ items: AdminListItem[] }>(token, "admin_list", {
      params: { status: statusParam, q, limit: 200 },
    });
    setLoading(false);
    if (!r.ok || !r.data) { setErr(r.error || "Ошибка"); return; }
    let result = r.data.items;
    if (view === "active") {
      result = result.filter(i => ["submitted", "review", "on_shelf", "reserved"].includes(i.status));
    }
    setItems(result);
  }, [token, filter, q, view]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { if (view !== "stats") load(); }, [view, load]);

  if (openId) {
    return (
      <SafeDealDetail
        token={token}
        dealId={openId}
        onBack={() => { setOpenId(null); load(); fetchStats(); }}
      />
    );
  }

  return (
    <div className="space-y-2">
      {/* Шапка модуля */}
      <div className="rounded-xl bg-[#101010] border border-[#1A1A1A] px-2 py-2">
        <div className="flex items-center gap-2 px-1">
          <div className="w-8 h-8 rounded-lg bg-[#FFD700]/15 flex items-center justify-center shrink-0">
            <Icon name="Shield" size={16} className="text-[#FFD700]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-oswald uppercase font-bold text-[14px] tracking-wide leading-tight">Безопасные сделки</div>
            <div className="text-[10px] text-white/45 leading-tight">Комиссионка с гарантом · 10% · 14 дней</div>
          </div>
        </div>

        {stats && (
          <>
            <SLGrid cols={4} className="mt-2">
              <SLStat label="Подано" value={String(stats.submitted_count + stats.review_count)} color="blue" icon="FileText" />
              <SLStat label="На витрине" value={String(stats.on_shelf_count + stats.reserved_count)} color="green" icon="Store" />
              <SLStat label="Завершено" value={String(stats.completed_count)} color="gold" icon="CheckCircle2" />
              <SLStat label="Отменено" value={String(stats.cancelled_count + stats.returned_count)} color="red" icon="X" />
            </SLGrid>
            <SLGrid cols={3} className="mt-2">
              <SLStat
                label="Комиссия сегодня"
                value={fmtRub(stats.commission_today)}
                color="gold"
                icon="TrendingUp"
              />
              <SLStat
                label={`За месяц (${stats.completed_month} шт)`}
                value={fmtRub(stats.commission_month)}
                color="gold"
                icon="CalendarCheck"
              />
              <SLStat
                label={`Всего (${stats.completed_count} шт)`}
                value={fmtRub(stats.commission_total)}
                color="gold"
                icon="Wallet"
              />
            </SLGrid>
          </>
        )}
      </div>

      {/* Табы */}
      <SLTabs
        items={[
          { v: "all",       l: "Все",         icon: "List" },
          { v: "active",    l: "В работе",    icon: "Activity" },
          { v: "completed", l: "Завершённые", icon: "CheckCircle2" },
          { v: "stats",     l: "Статистика",  icon: "BarChart3" },
        ]}
        value={view}
        onChange={(v) => setView(v as View)}
      />

      {view !== "stats" && (
        <div className="rounded-xl bg-[#101010] border border-[#1A1A1A] p-2 sm:p-2.5">
          <div className="grid sm:grid-cols-3 gap-1.5">
            <SLInput
              iconLeft="Search"
              placeholder="№ сделки, ФИО, телефон, товар"
              value={q}
              onChange={e => setQ(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") load(); }}
              className="sm:col-span-2"
            />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as DealStatus | "all")}
              className="bg-[#0F0F0F] border border-[#1F1F1F] rounded-md px-2 py-1.5 text-[12px] text-white/85 focus:border-[#FFD700]/40 outline-none"
            >
              {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="flex justify-end mt-1.5 gap-1.5">
            <SLButton variant="dark" size="sm" icon="RefreshCw" onClick={() => { load(); fetchStats(); }}>Обновить</SLButton>
            <SLButton variant="gold" size="sm" icon="Search" onClick={load}>Найти</SLButton>
          </div>
        </div>
      )}

      {view === "stats" && stats && <StatsView stats={stats} />}

      {view !== "stats" && (
        <DealsList items={items} loading={loading} err={err} onOpen={setOpenId} />
      )}
    </div>
  );
}

function DealsList({ items, loading, err, onOpen }: {
  items: AdminListItem[];
  loading: boolean;
  err: string | null;
  onOpen: (id: number) => void;
}) {
  if (loading) return (
    <div className="text-center py-8 text-white/40">
      <Icon name="Loader2" size={18} className="animate-spin inline" />
    </div>
  );
  if (err) return (
    <div className="rounded-md bg-red-500/10 border border-red-500/30 text-red-300 px-2.5 py-1.5 text-[12px]">{err}</div>
  );
  if (items.length === 0) return (
    <div className="text-center py-8 text-white/35">
      <Icon name="Shield" size={24} className="inline mb-1.5 opacity-50" />
      <div className="text-[12px]">Сделок нет</div>
    </div>
  );
  return (
    <div className="space-y-1.5">
      {items.map(it => {
        const badge = STATUS_LABEL[it.status];
        const item = [it.product_brand, it.product_model].filter(Boolean).join(" ") || it.product_title;
        return (
          <button
            key={it.id}
            onClick={() => onOpen(it.id)}
            className="w-full text-left rounded-lg bg-[#101010] border border-[#1A1A1A] hover:border-[#FFD700]/40 hover:bg-[#131313] px-2.5 py-2 transition active:scale-[0.99]"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                  <div className="font-oswald font-bold text-[13px] text-[#FFD700]">{it.deal_number}</div>
                  <span className={`text-[9px] px-1.5 py-0 rounded-full border uppercase tracking-wide font-bold ${badge.cls}`}>
                    {badge.label}
                  </span>
                  {it.photos_count > 0 && (
                    <SLPill color="blue"><Icon name="Image" size={9} className="inline mr-0.5" />{it.photos_count}</SLPill>
                  )}
                </div>
                <div className="text-[12px] text-white/85 truncate leading-tight">{item}</div>
                <div className="text-[10px] text-white/45 truncate leading-tight">
                  {it.seller_name} · {it.seller_phone}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-oswald font-bold text-[14px] text-white leading-tight">{fmtRub(it.price)}</div>
                <div className="text-[9px] text-[#FFD700]/80 leading-tight">комиссия {fmtRub(it.commission_amount)}</div>
                <div className="text-[9px] text-white/45 uppercase tracking-wide mt-0.5">
                  {it.completed_at ? `сдано ${fmtDate(it.completed_at).split(",")[0]}` : `создано ${fmtDate(it.created_at).split(",")[0]}`}
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function StatsView({ stats }: { stats: AdminStats }) {
  const maxC = Math.max(1, ...stats.daily.map(d => d.commission));
  const today = new Date().toISOString().slice(0, 10);
  return (
    <div className="space-y-2">
      <SLGrid cols={3}>
        <SLStat label="Оборот сегодня" value={fmtRub(stats.turnover_today)} color="gold" icon="ShoppingBag" />
        <SLStat label="Оборот за месяц" value={fmtRub(stats.turnover_month)} color="gold" icon="CalendarCheck" />
        <SLStat label="Оборот всего" value={fmtRub(stats.turnover_total)} color="gold" icon="Wallet" />
      </SLGrid>

      <div className="rounded-xl bg-[#101010] border border-[#1A1A1A] p-2 sm:p-2.5">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Icon name="BarChart3" size={12} className="text-[#FFD700]" />
          <h3 className="font-oswald uppercase text-[11px] tracking-wide font-bold text-white/85">
            Комиссия по дням · последние 14 дней
          </h3>
        </div>
        {stats.daily.length === 0 ? (
          <div className="text-center text-white/40 text-[11px] py-4">Пока нет завершённых сделок</div>
        ) : (
          <div className="space-y-0.5">
            {stats.daily.map(d => {
              const isToday = d.day === today;
              const w = Math.max(2, Math.round((d.commission / maxC) * 100));
              return (
                <div key={d.day} className="flex items-center gap-2 text-[11px]">
                  <div className={`w-20 shrink-0 ${isToday ? "text-[#FFD700] font-bold" : "text-white/55"}`}>
                    {new Date(d.day).toLocaleDateString("ru-RU")}
                  </div>
                  <div className="flex-1 min-w-0 relative h-4 bg-white/5 rounded-sm overflow-hidden">
                    <div
                      className={`absolute inset-y-0 left-0 ${isToday ? "bg-[#FFD700]/70" : "bg-emerald-500/45"}`}
                      style={{ width: `${w}%` }}
                    />
                  </div>
                  <div className="w-16 shrink-0 text-right text-white/65">{d.count} шт</div>
                  <div className={`w-24 shrink-0 text-right font-bold ${isToday ? "text-[#FFD700]" : "text-emerald-300"}`}>
                    {fmtRub(d.commission)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
