import { useState } from "react";
import Icon from "@/components/ui/icon";
import { fmt, STATUS_LABEL } from "./types";

// ── Главная кликабельная карточка ──────────────────────────────────────────
export function StatCard({
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
export function StatusCard({
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

// ── Детализация направлений ───────────────────────────────────────────────
export function DirectionCard({
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

// ── Группа: 4 главные карточки ────────────────────────────────────────────
export function StatCardsGrid({
  data, onNav,
}: {
  data: import("./types").SLStats | null;
  onNav: (k: string) => void;
}) {
  const stockCount = (data?.by_status?.stock?.count || 0)
    + (data?.by_status?.showcase?.count || 0)
    + (data?.by_status?.consignment?.count || 0);
  const stockSum = (data?.by_status?.stock?.sum || 0)
    + (data?.by_status?.showcase?.sum || 0)
    + (data?.by_status?.consignment?.sum || 0);

  return (
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
  );
}

// ── Группа: разбивка по статусам склада ──────────────────────────────────
export function StatusCardsRow({
  data, onNav,
}: {
  data: import("./types").SLStats | null;
  onNav: (k: string) => void;
}) {
  const statusMeta: Record<string, { color: string; nav: string }> = {
    stock:       { color: "#60a5fa", nav: "stock" },
    showcase:    { color: "#34d399", nav: "stock" },
    consignment: { color: "#a78bfa", nav: "stock" },
  };

  return (
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
  );
}

// ── Группа: детализация направлений (Б/У + Ломбард) ──────────────────────
export function DirectionCards({
  data,
}: {
  data: import("./types").SLStats | null;
}) {
  if (!((data?.profit_used ?? 0) > 0 || (data?.contract_closed_count ?? 0) > 0)) return null;

  return (
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
  );
}
