import { useEffect, useState, useCallback } from "react";
import Icon from "@/components/ui/icon";
import {
  c14dApi, fmt, fmtDate, STATUS_BADGE,
  type C14dListItem, type C14dStats, type C14dDailyProfit,
} from "./types";
import C14dCreateForm from "./C14dCreateForm";
import C14dDetailView from "./C14dDetailView";
import C14dReportTab from "./C14dReportTab";
import { SLStat, SLPill, SLInput, SLButton, SLGrid, SLTabs } from "../slUI";

// ─── Расчёт рекомендуемой цены продажи ───────────────────────────────────────
// Логика: сумма закупки * 2, затем округляем до красивого числа
function calcSellPrice(amount: number): number {
  const raw = amount * 2;
  // Округляем до ближайшего "красивого": 999, 1499, 1999 ...
  const thresholds = [499,999,1499,1999,2499,2999,3499,3999,4499,4999,
    5999,6999,7999,8999,9999,11999,12999,14999,16999,19999,
    24999,29999,34999,39999,44999,49999,59999,69999,79999,89999,99999];
  for (const t of thresholds) {
    if (raw <= t + t * 0.15) return t;
  }
  // Fallback: округляем до 999 вверх
  return Math.ceil(raw / 1000) * 1000 - 1;
}

// ─── Модал «Перевести на склад» ──────────────────────────────────────────────
function ToWarehouseModal({
  contract, token, onClose, onDone,
}: {
  contract: C14dListItem;
  token: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const amount = Number(contract.amount) || 0;
  const suggestedPrice = calcSellPrice(amount);
  const [sellPrice, setSellPrice] = useState(String(suggestedPrice));
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const itemName = [contract.item_brand, contract.item_model].filter(Boolean).join(" ") || contract.item_type || "Товар";

  const handleConfirm = async () => {
    const price = parseInt(sellPrice.replace(/\D/g, ""), 10);
    if (!price || price < 1) { setErr("Укажите цену продажи"); return; }
    setLoading(true); setErr(null);
    // Переводим на склад: action=to_warehouse
    const r = await c14dApi(token, "to_warehouse", {
      method: "POST",
      body: {
        contract_id: contract.id,
        sell_price: price,
      },
    });
    setLoading(false);
    if (!r.ok) { setErr(r.error || "Ошибка"); return; }
    onDone();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-t-2xl sm:rounded-2xl bg-[#111] border border-[#FFD700]/30 shadow-2xl flex flex-col"
        style={{ maxHeight: '92dvh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Скроллируемый контент */}
        <div className="overflow-y-auto p-4 space-y-3 flex-1">
          {/* Шапка */}
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FFD700] to-[#b8860b] flex items-center justify-center shrink-0">
              <Icon name="PackagePlus" size={18} className="text-black" />
            </div>
            <div>
              <div className="font-oswald font-bold text-[14px] text-white uppercase tracking-wide">На склад</div>
              <div className="text-[10px] text-white/45">{contract.contract_number}</div>
            </div>
          </div>

          {/* Товар */}
          <div className="rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] px-3 py-2 space-y-1">
            <div className="text-[11px] text-white/50 uppercase tracking-wide">Товар</div>
            <div className="font-bold text-[14px] text-white">{itemName}</div>
            <div className="flex items-center gap-3 mt-1">
              <div>
                <div className="text-[10px] text-white/40">Закуплен за</div>
                <div className="font-oswald font-bold text-[15px] text-white">{fmt(amount)} ₽</div>
              </div>
              <Icon name="ArrowRight" size={14} className="text-white/30" />
              <div>
                <div className="text-[10px] text-[#FFD700]/70">Продажа (рекомен.)</div>
                <div className="font-oswald font-bold text-[15px] text-[#FFD700]">{fmt(suggestedPrice)} ₽</div>
              </div>
            </div>
          </div>

          {/* Ввод цены продажи */}
          <div>
            <label className="text-[11px] text-white/50 uppercase tracking-wide mb-1 block">
              Цена продажи (итоговая)
            </label>
            <div className="relative">
              <input
                type="number"
                inputMode="numeric"
                value={sellPrice}
                onChange={e => setSellPrice(e.target.value)}
                className="w-full rounded-lg bg-[#1A1A1A] border border-[#FFD700]/30 focus:border-[#FFD700] text-white font-oswald font-bold text-[18px] px-3 py-2.5 outline-none pr-10 transition"
                placeholder="7999"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#FFD700] font-bold text-[16px]">₽</span>
            </div>
            <div className="text-[10px] text-white/30 mt-1">
              Процент обнуляется · закупка {fmt(amount)} ₽ → продажа {sellPrice || "?"} ₽
            </div>
          </div>

          {err && <div className="text-red-400 text-[11px] bg-red-500/10 rounded-lg px-2.5 py-1.5">{err}</div>}
        </div>

        {/* Кнопки — всегда видны внизу */}
        <div className="flex gap-2 p-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-white/5 bg-[#111]">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-white/15 text-white/50 text-[12px] py-3 font-bold uppercase tracking-wide hover:border-white/30 transition"
          >
            Отмена
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 rounded-lg bg-gradient-to-r from-[#FFD700] to-[#b8860b] text-black font-bold uppercase tracking-wide text-[12px] py-3 hover:opacity-90 active:scale-[0.98] transition disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {loading ? <Icon name="Loader2" size={14} className="animate-spin" /> : <Icon name="PackagePlus" size={14} />}
            На склад
          </button>
        </div>
      </div>
    </div>
  );
}

type View = "active" | "archive" | "create" | "search" | "reports";
type Props = { token: string };

function pluralDays(n: number): string {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return "дней";
  if (b > 1 && b < 5) return "дня";
  if (b === 1) return "день";
  return "дней";
}

function DailyProfitPanel({ daily }: { daily: C14dDailyProfit[] }) {
  const maxProfit = Math.max(1, ...daily.map(d => d.profit));
  const todayIso = new Date().toISOString().slice(0, 10);
  return (
    <div className="mt-2 rounded-xl bg-[#101010] border border-[#1A1A1A] p-2 sm:p-2.5">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon name="BarChart3" size={12} className="text-[#FFD700]" />
        <h3 className="font-oswald uppercase text-[11px] tracking-wide font-bold text-white/85">
          Прибыль по дням · последние 14 дней
        </h3>
      </div>
      <div className="space-y-0.5">
        {daily.map(d => {
          const isToday = d.day === todayIso;
          const w = Math.max(2, Math.round((d.profit / maxProfit) * 100));
          return (
            <div key={d.day} className="flex items-center gap-2 text-[11px]">
              <div className={`w-16 shrink-0 ${isToday ? "text-[#FFD700] font-bold" : "text-white/55"}`}>
                {fmtDate(d.day)}
              </div>
              <div className="flex-1 min-w-0 relative h-4 bg-white/5 rounded-sm overflow-hidden">
                <div
                  className={`absolute inset-y-0 left-0 ${isToday ? "bg-[#FFD700]/70" : "bg-emerald-500/45"}`}
                  style={{ width: `${w}%` }}
                />
              </div>
              <div className="w-16 shrink-0 text-right text-white/65">
                {d.count} шт
              </div>
              <div className={`w-24 shrink-0 text-right font-bold ${isToday ? "text-[#FFD700]" : "text-emerald-300"}`}>
                {fmt(d.profit)} ₽
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function C14dTab({ token }: Props) {
  const [view, setView] = useState<View>("active");
  const [items, setItems] = useState<C14dListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [stats, setStats] = useState<C14dStats | null>(null);

  const [q, setQ] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [openId, setOpenId] = useState<number | null>(null);

  const fetchStats = useCallback(async () => {
    const r = await c14dApi<C14dStats>(token, "stats");
    if (r.ok && r.data) setStats(r.data);
  }, [token]);

  const load = useCallback(async () => {
    setLoading(true); setErr(null);
    const params: Record<string, string> = {};
    if (view === "active") params.status = "active";
    else if (view === "archive") params.status = "archive";
    else if (view === "search") {
      params.status = "all";
      if (q.trim()) params.q = q.trim();
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
    }
    const r = await c14dApi<{ items: C14dListItem[] }>(token, "list", { params });
    setLoading(false);
    if (!r.ok || !r.data) { setErr(r.error || "Не удалось загрузить"); setItems([]); return; }
    setItems(r.data.items || []);
  }, [view, q, dateFrom, dateTo, token]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => {
    if (view === "active" || view === "archive" || view === "search") load();
  }, [load, view]);

  const subTabs: { k: View; l: string; icon: string; badge?: number }[] = [
    { k: "active",  l: "Активные", icon: "FileSignature", badge: stats?.active_count },
    { k: "archive", l: "Архив",    icon: "Archive", badge: stats?.archive_count },
    { k: "create",  l: "Создать",  icon: "Plus" },
    { k: "search",  l: "Поиск",    icon: "Search" },
    { k: "reports", l: "Отчёты",   icon: "BarChart3" },
  ];

  if (openId != null) {
    return <C14dDetailView token={token} contractId={openId} onBack={() => { setOpenId(null); load(); fetchStats(); }} />;
  }

  return (
    <div className="space-y-2">
      {/* Премиум-шапка */}
      <div className="rounded-xl bg-gradient-to-br from-[#FFD700]/12 via-[#FFD700]/4 to-transparent border border-[#FFD700]/25 p-2.5 sm:p-3 shadow-[0_0_24px_rgba(255,215,0,0.06)]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FFD700] to-[#b8860b] flex items-center justify-center shrink-0 shadow-[0_2px_10px_rgba(255,215,0,0.3)]">
            <Icon name="Handshake" size={16} className="text-black" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-oswald uppercase font-bold text-[14px] tracking-wide leading-tight">Договор продажи на 14 дней</div>
            <div className="text-[10px] text-white/45 leading-tight">Скупка с правом обратного выкупа · 4% / день</div>
          </div>
        </div>
        {stats && (
          <>
            <SLGrid cols={4} className="mt-2">
              <SLStat label="Активных" value={String(stats.active_count)} color="green" icon="CheckCircle2" />
              <SLStat label="Просрочка" value={String(stats.overdue_count)} color="red" icon="AlertTriangle" />
              <SLStat label="В архиве" value={String(stats.archive_count)} color="blue" icon="Archive" />
              <SLStat label="Долг" value={`${fmt(stats.total_active_debt)} ₽`} color="gold" icon="Coins" />
            </SLGrid>
            <SLGrid cols={4} className="mt-2">
              <SLStat
                label="Забрали сегодня"
                value={String(stats.closed_today_count ?? 0)}
                color="green"
                icon="PackageCheck"
              />
              <SLStat
                label="Прибыль сегодня"
                value={`${fmt(stats.profit_today ?? 0)} ₽`}
                color="gold"
                icon="TrendingUp"
              />
              <SLStat
                label={`За месяц (${stats.closed_month_count ?? 0} шт)`}
                value={`${fmt(stats.profit_month ?? 0)} ₽`}
                color="gold"
                icon="CalendarCheck"
              />
              <SLStat
                label={`Всего (${stats.closed_total_count ?? 0} шт)`}
                value={`${fmt(stats.profit_total ?? 0)} ₽`}
                color="gold"
                icon="Wallet"
              />
            </SLGrid>
            <SLGrid cols={2} className="mt-2">
              <SLStat
                label="Средний срок"
                value={`${stats.avg_days_active ?? 0} ${pluralDays(stats.avg_days_active ?? 0)}`}
                color="orange"
                icon="Clock"
              />
              <SLStat
                label="Макс. срок"
                value={`${stats.max_days_active ?? 0} ${pluralDays(stats.max_days_active ?? 0)}`}
                color="orange"
                icon="History"
              />
            </SLGrid>
            {stats.daily && stats.daily.length > 0 && (
              <DailyProfitPanel daily={stats.daily} />
            )}
          </>
        )}
      </div>

      {/* Табы */}
      <SLTabs
        items={subTabs.map(t => ({ v: t.k, l: t.l, icon: t.icon, badge: t.badge }))}
        value={view}
        onChange={(v) => setView(v as View)}
      />

      {view === "create" && (
        <C14dCreateForm
          token={token}
          onCancel={() => setView("active")}
          onCreated={(id) => { fetchStats(); setView("active"); setOpenId(id); }}
        />
      )}

      {view === "search" && (
        <div className="rounded-xl bg-[#101010] border border-[#1A1A1A] p-2 sm:p-2.5">
          <div className="grid sm:grid-cols-4 gap-1.5">
            <SLInput
              iconLeft="Search"
              placeholder="№ договора, ФИО, телефон"
              value={q}
              onChange={e => setQ(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") load(); }}
              className="sm:col-span-2"
            />
            <SLInput type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            <SLInput type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
          <div className="flex justify-end mt-1.5">
            <SLButton variant="gold" size="sm" icon="Search" onClick={load}>Найти</SLButton>
          </div>
        </div>
      )}

      {(view === "active" || view === "archive" || view === "search") && (
        <ContractsList
          items={items}
          loading={loading}
          err={err}
          onOpen={setOpenId}
          token={token}
          onRefresh={() => { load(); fetchStats(); }}
        />
      )}

      {view === "reports" && <C14dReportTab token={token} />}
    </div>
  );
}

function ContractsList({
  items, loading, err, onOpen, token, onRefresh,
}: {
  items: C14dListItem[];
  loading: boolean;
  err: string | null;
  onOpen: (id: number) => void;
  token: string;
  onRefresh: () => void;
}) {
  const [extendingId, setExtendingId] = useState<number | null>(null);
  const [warehouseContract, setWarehouseContract] = useState<C14dListItem | null>(null);

  const handleExtend = async (e: React.MouseEvent, it: C14dListItem) => {
    e.stopPropagation();
    if (extendingId) return;
    setExtendingId(it.id);
    await c14dApi(token, "extend", {
      method: "POST",
      body: { contract_id: it.id, enable: true, note: "Продлён из списка" },
    });
    setExtendingId(null);
    onRefresh();
  };

  if (loading) return <div className="text-center py-8 text-white/40"><Icon name="Loader2" size={18} className="animate-spin inline" /></div>;
  if (err) return <div className="rounded-md bg-red-500/10 border border-red-500/30 text-red-300 px-2.5 py-1.5 text-[12px]">{err}</div>;
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-white/35">
        <Icon name="FileText" size={24} className="inline mb-1.5 opacity-50" />
        <div className="text-[12px]">Договоров нет</div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-1.5">
        {items.map(it => {
          const badge = STATUS_BADGE[it.status];
          const item = [it.item_brand, it.item_model].filter(Boolean).join(" ") || it.item_type || "—";
          const isActive = it.status === "active";
          return (
            <div
              key={it.id}
              className="rounded-lg bg-[#101010] border border-[#1A1A1A] hover:border-[#FFD700]/30 hover:bg-[#131313] transition overflow-hidden"
            >
              {/* Основная строка — открывает детали */}
              <button
                onClick={() => onOpen(it.id)}
                className="w-full text-left px-2.5 py-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                      <div className="font-oswald font-bold text-[13px] text-[#FFD700]">{it.contract_number}</div>
                      <span className={`text-[9px] px-1.5 py-0 rounded-full border uppercase tracking-wide font-bold ${badge.cls}`}>{badge.l}</span>
                      {it.overdue && <SLPill color="red">Просрочка {it.overdue_days} дн.</SLPill>}
                      {it.extended && <SLPill color="orange">Продление</SLPill>}
                    </div>
                    <div className="text-[12px] text-white/85 truncate leading-tight">{it.client_name}</div>
                    <div className="text-[10px] text-white/45 truncate leading-tight">{item}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-oswald font-bold text-[14px] text-white leading-tight">{fmt(it.amount)} ₽</div>
                    <div className="text-[9px] text-white/45 uppercase tracking-wide">До {fmtDate(it.end_date)}</div>
                    {Number(it.remaining_debt) > 0 && (
                      <div className="text-[10px] text-red-300 font-bold mt-0.5">−{fmt(it.remaining_debt)} ₽</div>
                    )}
                  </div>
                </div>
              </button>

              {/* Кнопки действий — только для активных */}
              {isActive && (
                <div className="flex gap-1.5 px-2.5 pb-2">
                  {/* Продлить */}
                  <button
                    onClick={e => handleExtend(e, it)}
                    disabled={extendingId === it.id || !!it.extended}
                    className={`
                      flex-1 flex items-center justify-center gap-1 rounded-md py-1.5 text-[11px] font-bold uppercase tracking-wide border transition active:scale-[0.97]
                      ${it.extended
                        ? "bg-orange-500/10 border-orange-500/30 text-orange-300 cursor-default"
                        : "bg-[#1A1A1A] border-[#FFD700]/25 text-[#FFD700] hover:bg-[#FFD700]/10 hover:border-[#FFD700]/60"
                      }
                    `}
                  >
                    {extendingId === it.id
                      ? <Icon name="Loader2" size={11} className="animate-spin" />
                      : <Icon name="Timer" size={11} />
                    }
                    {it.extended ? "Продлён" : "Продлить"}
                  </button>

                  {/* На склад */}
                  <button
                    onClick={e => { e.stopPropagation(); setWarehouseContract(it); }}
                    className="flex-1 flex items-center justify-center gap-1 rounded-md py-1.5 text-[11px] font-bold uppercase tracking-wide border bg-[#1A1A1A] border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 hover:border-emerald-500/60 transition active:scale-[0.97]"
                  >
                    <Icon name="PackagePlus" size={11} />
                    На склад
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {warehouseContract && (
        <ToWarehouseModal
          contract={warehouseContract}
          token={token}
          onClose={() => setWarehouseContract(null)}
          onDone={() => { setWarehouseContract(null); onRefresh(); }}
        />
      )}
    </>
  );
}