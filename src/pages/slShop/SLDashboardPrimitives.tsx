import { useState } from "react";
import Icon from "@/components/ui/icon";
import { fmt } from "./types";

// ── Пульсирующий статус-индикатор ──────────────────────────────────────────
export function LiveDot({ color = "#22c55e" }: { color?: string }) {
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
      <div className="absolute top-0 left-0 right-0 h-[1px]"
        style={{ background: `linear-gradient(90deg, transparent, ${accentColor}60, transparent)` }} />
      <div className="absolute top-0 right-0 w-16 h-16 rounded-full blur-2xl pointer-events-none"
        style={{ background: `${accentColor}18`, transform: "translate(30%, -30%)" }} />

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

      <div className="font-oswald font-black leading-none mb-1.5"
        style={{
          fontSize: "clamp(20px, 5vw, 26px)",
          color: accentColor,
          textShadow: `0 0 16px ${accentColor}50`,
        }}>
        {value}
      </div>

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

// ── Строка товара ──────────────────────────────────────────────────────────
export function ItemRow({
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
export function ActionButton({
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
      <div className="absolute top-0 left-0 right-0 h-[1px]"
        style={{ background: `linear-gradient(90deg, transparent, ${accentColor}50, transparent)` }} />
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

      <div className="absolute bottom-3 right-3"
        style={{ color: `${accentColor}40` }}>
        <Icon name="ArrowRight" size={14} />
      </div>
    </button>
  );
}

// ── Секция с заголовком ───────────────────────────────────────────────────
export function Section({
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
