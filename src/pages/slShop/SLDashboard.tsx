import { useEffect, useState, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { slApi, fmt, type SLStats, type SLSoldItem, type SLBoughtItem, STATUS_LABEL } from "./types";
import { printReceipt } from "./labelPrinter";
import { useSharedPeriod } from "./useSharedPeriod";
import { SLTabs } from "./slUI";
import EmployeeShiftMiniWidget from "@/pages/staffSalary/EmployeeShiftMiniWidget";

const PERIODS = [
  { v: "today",     l: "Сегодня" },
  { v: "yesterday", l: "Вчера" },
  { v: "7d",        l: "7 дн." },
  { v: "30d",       l: "30 дн." },
  { v: "year",      l: "Год" },
  { v: "all",       l: "Все время" },
];

// ── Пульсирующий статус-индикатор ──────────────────────────────────────────
function LiveDot({ color = "#22c55e" }: { color?: string }) {
  return (
    <span className="relative flex h-1.5 w-1.5 shrink-0">
      <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping"
        style={{ background: color }} />
      <span className="relative inline-flex h-1.5 w-1.5 rounded-full"
        style={{ background: color }} />
    </span>
  );
}

// ── Главная кликабельная карточка ──────────────────────────────────────────
function StatCard({
  title, value, sub, icon, accentColor, onClick, arrowLabel,
}: {
  title: string; value: string; sub: string; icon: string;
  accentColor: string; onClick?: () => void; arrowLabel?: string;
}) {
  const [pressed, setPressed] = useState(false);
  const Tag = onClick ? "button" : "div";

  return (
    <Tag
      onClick={onClick}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      className="relative overflow-hidden rounded-2xl text-left w-full transition-all duration-150"
      style={{
        background: `linear-gradient(145deg, ${accentColor}14 0%, ${accentColor}06 60%, transparent 100%)`,
        border: `1px solid ${accentColor}28`,
        boxShadow: `0 0 20px ${accentColor}0a, inset 0 1px 0 ${accentColor}15`,
        transform: pressed ? "scale(0.97)" : "scale(1)",
        cursor: onClick ? "pointer" : "default",
        padding: "14px",
      }}
    >
      {/* Верхняя неоновая линия */}
      <div className="absolute top-0 left-0 right-0 h-[1px]"
        style={{ background: `linear-gradient(90deg, transparent, ${accentColor}60, transparent)` }} />

      {/* Угловой акцент */}
      <div className="absolute top-0 right-0 w-16 h-16 rounded-full blur-2xl pointer-events-none"
        style={{ background: `${accentColor}18`, transform: "translate(30%, -30%)" }} />

      {/* Заголовок */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ background: `${accentColor}20`, border: `1px solid ${accentColor}30` }}>
            <Icon name={icon} size={12} style={{ color: accentColor }} />
          </div>
          <span className="text-[10px] font-roboto uppercase tracking-[0.12em] font-semibold"
            style={{ color: `${accentColor}90` }}>
            {title}
          </span>
        </div>
        {onClick && (
          <div className="flex items-center gap-1"
            style={{ color: `${accentColor}60` }}>
            <span className="text-[9px] font-roboto uppercase tracking-wider">{arrowLabel || "детали"}</span>
            <Icon name="ChevronRight" size={11} />
          </div>
        )}
      </div>

      {/* Значение */}
      <div className="font-oswald font-black leading-none mb-1.5"
        style={{
          fontSize: "clamp(20px, 5vw, 26px)",
          color: accentColor,
          textShadow: `0 0 16px ${accentColor}50`,
        }}>
        {value}
      </div>

      {/* Подзаголовок */}
      <div className="text-[11px] font-roboto"
        style={{ color: "rgba(255,255,255,0.38)" }}>
        {sub}
      </div>
    </Tag>
  );
}

// ── Мини-карточка статуса склада ──────────────────────────────────────────
function StatusCard({
  label, count, sum, accentColor, onClick,
}: {
  label: string; count: number; sum: number;
  accentColor: string; onClick?: () => void;
}) {
  const [pressed, setPressed] = useState(false);
  const Tag = onClick ? "button" : "div";

  return (
    <Tag
      onClick={onClick}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      className="relative rounded-xl text-center overflow-hidden w-full transition-all duration-150"
      style={{
        background: `linear-gradient(145deg, ${accentColor}0f 0%, transparent 100%)`,
        border: `1px solid ${accentColor}20`,
        transform: pressed ? "scale(0.96)" : "scale(1)",
        cursor: onClick ? "pointer" : "default",
        padding: "10px 8px",
      }}
    >
      <div className="text-[9px] uppercase tracking-[0.12em] font-bold mb-1.5 font-roboto"
        style={{ color: `${accentColor}70` }}>
        {label}
      </div>
      <div className="font-oswald font-black text-2xl leading-none"
        style={{ color: accentColor, textShadow: `0 0 10px ${accentColor}40` }}>
        {count}
      </div>
      <div className="text-[10px] font-roboto mt-1"
        style={{ color: "rgba(255,255,255,0.3)" }}>
        {fmt(sum)} ₽
      </div>
      {onClick && (
        <div className="absolute bottom-1.5 right-1.5">
          <Icon name="ChevronRight" size={10} style={{ color: `${accentColor}40` }} />
        </div>
      )}
    </Tag>
  );
}

// ── Строка товара ──────────────────────────────────────────────────────────
function ItemRow({
  title, meta, amount, amountColor, onPrint,
}: {
  title: string; meta: string; amount: string;
  amountColor: string; onPrint?: () => void;
}) {
  return (
    <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-colors"
      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium text-white truncate leading-tight">{title}</div>
        <div className="text-[10px] font-roboto truncate mt-0.5"
          style={{ color: "rgba(255,255,255,0.32)" }}>
          {meta}
        </div>
      </div>
      <div className="font-oswald font-bold text-[14px] shrink-0"
        style={{ color: amountColor }}>
        {amount} ₽
      </div>
      {onPrint && (
        <button onClick={onPrint}
          className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all active:scale-90"
          style={{ background: "rgba(255,215,0,0.08)", border: "1px solid rgba(255,215,0,0.2)", color: "#FFD700" }}>
          <Icon name="Receipt" size={12} />
        </button>
      )}
    </div>
  );
}

// ── Кнопка быстрого действия ──────────────────────────────────────────────
function ActionButton({
  icon, label, desc, accentColor, onClick,
}: {
  icon: string; label: string; desc: string;
  accentColor: string; onClick: () => void;
}) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onClick={onClick}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      className="relative overflow-hidden rounded-2xl text-left transition-all duration-150"
      style={{
        background: `linear-gradient(145deg, ${accentColor}18 0%, ${accentColor}08 60%, transparent 100%)`,
        border: `1px solid ${accentColor}30`,
        boxShadow: `0 0 20px ${accentColor}0a`,
        transform: pressed ? "scale(0.96)" : "scale(1)",
        padding: "14px",
      }}
    >
      {/* Верхняя линия */}
      <div className="absolute top-0 left-0 right-0 h-[1px]"
        style={{ background: `linear-gradient(90deg, transparent, ${accentColor}50, transparent)` }} />

      {/* Угловое свечение */}
      <div className="absolute -top-6 -right-6 w-16 h-16 rounded-full blur-2xl pointer-events-none"
        style={{ background: `${accentColor}20` }} />

      <div className="relative">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2.5"
          style={{ background: `${accentColor}20`, border: `1px solid ${accentColor}35` }}>
          <Icon name={icon} size={18} style={{ color: accentColor }} />
        </div>
        <div className="font-oswald font-bold text-sm text-white uppercase tracking-wide leading-tight">
          {label}
        </div>
        <div className="text-[11px] font-roboto mt-0.5"
          style={{ color: "rgba(255,255,255,0.38)" }}>
          {desc}
        </div>
      </div>

      {/* Стрелка */}
      <div className="absolute bottom-3 right-3"
        style={{ color: `${accentColor}40` }}>
        <Icon name="ArrowRight" size={14} />
      </div>
    </button>
  );
}

// ── Секция с заголовком ───────────────────────────────────────────────────
function Section({
  title, onMore, children, accentColor = "#FFD700",
}: {
  title: string; onMore?: () => void; children: React.ReactNode; accentColor?: string;
}) {
  return (
    <div className="rounded-2xl overflow-hidden mb-3"
      style={{
        background: "rgba(255,255,255,0.015)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}>
      {/* Заголовок секции */}
      <div className="flex items-center justify-between px-3.5 pt-3 pb-2.5"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="flex items-center gap-2">
          <LiveDot color={accentColor} />
          <span className="text-[11px] font-oswald font-bold uppercase tracking-[0.12em]"
            style={{ color: "rgba(255,255,255,0.6)" }}>
            {title}
          </span>
        </div>
        {onMore && (
          <button onClick={onMore}
            className="flex items-center gap-1 text-[10px] font-roboto uppercase tracking-wider transition-colors"
            style={{ color: `${accentColor}70` }}
            onMouseEnter={e => (e.currentTarget.style.color = accentColor)}
            onMouseLeave={e => (e.currentTarget.style.color = `${accentColor}70`)}>
            все <Icon name="ChevronRight" size={11} />
          </button>
        )}
      </div>
      <div className="p-3 space-y-1.5">{children}</div>
    </div>
  );
}

// ── Детализация направлений ───────────────────────────────────────────────
function DirectionCard({
  title, icon, accentColor, rows, footer,
}: {
  title: string; icon: string; accentColor: string;
  rows: { label: string; value: string; color: string }[];
  footer?: { label: string; value: string };
}) {
  return (
    <div className="rounded-xl overflow-hidden"
      style={{
        background: `linear-gradient(145deg, ${accentColor}0c 0%, transparent 100%)`,
        border: `1px solid ${accentColor}25`,
      }}>
      <div className="flex items-center gap-2 px-3 py-2.5"
        style={{ borderBottom: `1px solid ${accentColor}15` }}>
        <div className="w-5 h-5 rounded-md flex items-center justify-center"
          style={{ background: `${accentColor}20` }}>
          <Icon name={icon} size={11} style={{ color: accentColor }} />
        </div>
        <span className="text-[10px] font-oswald font-bold uppercase tracking-wider"
          style={{ color: accentColor }}>
          {title}
        </span>
      </div>
      <div className="px-3 py-2 space-y-1.5">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center justify-between">
            <span className="text-[11px] font-roboto" style={{ color: "rgba(255,255,255,0.45)" }}>{r.label}</span>
            <span className="text-[11px] font-roboto font-semibold" style={{ color: r.color }}>{r.value}</span>
          </div>
        ))}
        {footer && (
          <div className="flex items-center justify-between pt-1.5 mt-0.5"
            style={{ borderTop: `1px solid ${accentColor}15` }}>
            <span className="text-[11px] font-oswald font-bold uppercase tracking-wide text-white/70">{footer.label}</span>
            <span className="text-[12px] font-oswald font-black" style={{ color: accentColor }}>
              {footer.value}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════
export default function SLDashboard({ token, onNav, empName: _empName }: {
  token: string; onNav: (k: string) => void; empName?: string;
}) {
  const [period, setPeriod] = useSharedPeriod();
  const [data, setData] = useState<SLStats | null>(null);
  const [sold, setSold] = useState<SLSoldItem[]>([]);
  const [bought, setBought] = useState<SLBoughtItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setErr(null);
    const [r1, r2, r3] = await Promise.all([
      slApi<SLStats>(token, "stats", { params: { period } }),
      slApi<SLSoldItem[]>(token, "sold", { params: { period } }),
      slApi<SLBoughtItem[]>(token, "bought", { params: { period } }),
    ]);
    if (r1.ok && r1.data) setData(r1.data);
    else setErr(r1.error || "Ошибка");
    if (r2.ok && r2.data) setSold(r2.data);
    if (r3.ok && r3.data) setBought(r3.data);
    setLoading(false);
  }, [token, period]);

  useEffect(() => { load(); }, [load]);

  const stockCount = (data?.by_status?.stock?.count || 0)
    + (data?.by_status?.showcase?.count || 0)
    + (data?.by_status?.consignment?.count || 0);
  const stockSum = (data?.by_status?.stock?.sum || 0)
    + (data?.by_status?.showcase?.sum || 0)
    + (data?.by_status?.consignment?.sum || 0);

  const statusMeta: Record<string, { color: string; nav: string }> = {
    stock:       { color: "#60a5fa", nav: "stock" },
    showcase:    { color: "#34d399", nav: "stock" },
    consignment: { color: "#a78bfa", nav: "stock" },
  };

  return (
    <div className="px-3 pb-4 space-y-0">
      {/* Виджет смены */}
      <EmployeeShiftMiniWidget token={token} />

      {/* Период */}
      <div className="mb-3">
        <SLTabs
          size="sm"
          items={PERIODS.map(p => ({ v: p.v, l: p.l }))}
          value={period}
          onChange={setPeriod}
          right={
            <button onClick={load} disabled={loading}
              className="p-1.5 rounded-lg transition-all"
              style={{ color: loading ? "rgba(255,215,0,0.4)" : "rgba(255,215,0,0.6)" }}>
              <Icon name={loading ? "Loader2" : "RefreshCw"} size={13} className={loading ? "animate-spin" : ""} />
            </button>
          }
        />
      </div>

      {err && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-3 text-xs font-roboto"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
          <Icon name="AlertTriangle" size={13} className="shrink-0" />
          {err}
        </div>
      )}

      {/* ── 4 главные карточки ── */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <StatCard
          title="Куплено"
          value={`${data?.bought_count || 0} шт.`}
          sub={`на ${fmt(data?.spent)} ₽`}
          icon="ShoppingCart"
          accentColor="#34d399"
          onClick={() => onNav("buy")}
          arrowLabel="принять"
        />
        <StatCard
          title="Продано"
          value={`${data?.sold_count || 0} шт.`}
          sub={`на ${fmt(data?.revenue)} ₽`}
          icon="HandCoins"
          accentColor="#60a5fa"
          onClick={() => onNav("stock")}
          arrowLabel="продать"
        />
        <StatCard
          title="Прибыль"
          value={`${fmt(Math.max(0, Number(data?.profit ?? 0)))} ₽`}
          sub={(data?.contract_profit ?? 0) > 0
            ? `б/у ${fmt(data?.profit_used)} + ломбард ${fmt(data?.contract_profit)}`
            : "за выбранный период"}
          icon="TrendingUp"
          accentColor="#FFD700"
          onClick={() => onNav("analytics")}
          arrowLabel="аналитика"
        />
        <StatCard
          title="На складе"
          value={`${stockCount} шт.`}
          sub={`${fmt(stockSum)} ₽`}
          icon="Package"
          accentColor="#e2e8f0"
          onClick={() => onNav("stock")}
          arrowLabel="склад"
        />
      </div>

      {/* ── Разбивка по статусам склада ── */}
      <div className="grid grid-cols-3 gap-1.5 mb-3">
        {(["stock", "showcase", "consignment"] as const).map(s => {
          const cfg = STATUS_LABEL[s];
          const v = data?.by_status?.[s];
          const meta = statusMeta[s];
          return (
            <StatusCard
              key={s}
              label={cfg.l}
              count={v?.count || 0}
              sum={v?.sum || 0}
              accentColor={meta.color}
              onClick={() => onNav(meta.nav)}
            />
          );
        })}
      </div>

      {/* ── Детализация направлений ── */}
      {((data?.profit_used ?? 0) > 0 || (data?.contract_closed_count ?? 0) > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
          <DirectionCard
            title="Б/У техника"
            icon="Package"
            accentColor="#60a5fa"
            rows={[
              { label: "Продажи", value: `${data?.sold_count || 0} шт · ${fmt(data?.revenue || 0)} ₽`, color: "#34d399" },
              { label: "Скупка",  value: `${data?.bought_count || 0} шт · −${fmt(data?.spent || 0)} ₽`, color: "#7dd3fc" },
            ]}
            footer={{ label: "Прибыль", value: `+${fmt(Math.max(0, Number(data?.profit_used ?? 0)))} ₽` }}
          />
          <DirectionCard
            title="СмартЛомбард"
            icon="Coins"
            accentColor="#a78bfa"
            rows={[
              { label: "Выдано",     value: `${data?.contract_closed_count || 0} дог. · −${fmt(data?.contract_issued || 0)} ₽`, color: "#7dd3fc" },
              { label: "Возвращено", value: `+${fmt(data?.contract_returned || 0)} ₽`, color: "#34d399" },
              ...(((data?.contract_active_count ?? 0) > 0)
                ? [{ label: "В работе", value: `${data?.contract_active_count} дог. на ${fmt(data?.contract_active_issued || 0)} ₽`, color: "#fbbf24" }]
                : []),
            ]}
            footer={{ label: "Прибыль", value: `+${fmt(Math.max(0, Number(data?.contract_profit ?? 0)))} ₽` }}
          />
        </div>
      )}

      {/* ── Что продано ── */}
      <Section title="Что продано" onMore={() => onNav("operations")} accentColor="#34d399">
        {sold.length === 0 ? (
          <div className="text-center py-4 text-[12px] font-roboto"
            style={{ color: "rgba(255,255,255,0.2)" }}>
            Нет продаж за период
          </div>
        ) : (
          <>
            {sold.slice(0, 15).map(s => (
              <ItemRow
                key={s.id}
                title={s.title}
                meta={[
                  s.sell_at ? new Date(s.sell_at).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—",
                  s.branch_name,
                  s.client_name,
                ].filter(Boolean).join(" · ")}
                amount={fmt(s.amount || s.sell_price)}
                amountColor="#60a5fa"
                onPrint={() => printReceipt(s)}
              />
            ))}
            {sold.length > 15 && (
              <button onClick={() => onNav("operations")}
                className="w-full text-center py-2 text-[10px] font-roboto uppercase tracking-wider transition-colors"
                style={{ color: "rgba(52,211,153,0.5)" }}>
                ещё {sold.length - 15} →
              </button>
            )}
          </>
        )}
      </Section>

      {/* ── Что куплено ── */}
      <Section title="Что куплено" onMore={() => onNav("operations")} accentColor="#60a5fa">
        {bought.length === 0 ? (
          <div className="text-center py-4 text-[12px] font-roboto"
            style={{ color: "rgba(255,255,255,0.2)" }}>
            Нет скупок за период
          </div>
        ) : (
          <>
            {bought.slice(0, 15).map(b => (
              <ItemRow
                key={b.id}
                title={b.title}
                meta={[
                  b.buy_at ? new Date(b.buy_at).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—",
                  b.branch_name,
                  b.client_name,
                  b.employee_name,
                ].filter(Boolean).join(" · ")}
                amount={fmt(b.amount || b.buy_price)}
                amountColor="#34d399"
              />
            ))}
            {bought.length > 15 && (
              <button onClick={() => onNav("operations")}
                className="w-full text-center py-2 text-[10px] font-roboto uppercase tracking-wider transition-colors"
                style={{ color: "rgba(96,165,250,0.5)" }}>
                ещё {bought.length - 15} →
              </button>
            )}
          </>
        )}
      </Section>

      {/* ── Быстрые действия ── */}
      <div className="grid grid-cols-2 gap-2">
        <ActionButton icon="Plus"        label="Принять"    desc="скупка / комиссия"       accentColor="#34d399" onClick={() => onNav("buy")} />
        <ActionButton icon="HandCoins"   label="Продать"    desc="из склада / витрины"      accentColor="#60a5fa" onClick={() => onNav("stock")} />
        <ActionButton icon="Tag"         label="Ценники"    desc="печать на термопринтере"  accentColor="#FFD700" onClick={() => onNav("labels")} />
        <ActionButton icon="ArrowUpDown" label="Импорт"     desc="Excel / CSV / текст"      accentColor="#a78bfa" onClick={() => onNav("import")} />
      </div>
    </div>
  );
}
