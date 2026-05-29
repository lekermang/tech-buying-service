import { useState } from "react";
import type { ReactNode } from "react";
import Icon from "@/components/ui/icon";
import { fmt, type SLSoldItem, type SLBoughtItem } from "./types";
import { printReceipt } from "./labelPrinter";

// ── Пульсирующий статус-индикатор ─────────────────────────────────────────
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
export function Section({
  title, onMore, children, accentColor = "#FFD700",
}: {
  title: string; onMore?: () => void; children: ReactNode; accentColor?: string;
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

// ── Секция «Что продано» ──────────────────────────────────────────────────
export function SoldSection({
  sold, onNav,
}: {
  sold: SLSoldItem[];
  onNav: (k: string) => void;
}) {
  return (
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
  );
}

// ── Секция «Что куплено» ──────────────────────────────────────────────────
export function BoughtSection({
  bought, onNav,
}: {
  bought: SLBoughtItem[];
  onNav: (k: string) => void;
}) {
  return (
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
  );
}

// ── Блок быстрых действий ─────────────────────────────────────────────────
export function QuickActions({ onNav }: { onNav: (k: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <ActionButton icon="Plus"        label="Принять"    desc="скупка / комиссия"       accentColor="#34d399" onClick={() => onNav("buy")} />
      <ActionButton icon="HandCoins"   label="Продать"    desc="из склада / витрины"      accentColor="#60a5fa" onClick={() => onNav("stock")} />
      <ActionButton icon="Tag"         label="Ценники"    desc="печать на термопринтере"  accentColor="#FFD700" onClick={() => onNav("labels")} />
      <ActionButton icon="ArrowUpDown" label="Импорт"     desc="Excel / CSV / текст"      accentColor="#a78bfa" onClick={() => onNav("import")} />
    </div>
  );
}
