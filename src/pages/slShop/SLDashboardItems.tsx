import { useState } from "react";
import type { ReactNode } from "react";
import Icon from "@/components/ui/icon";
import { fmt, type SLSoldItem, type SLBoughtItem } from "./types";
import { printReceipt } from "./labelPrinter";

const SEND_CHECK_URL = "https://functions.poehali.dev/3e5c5c1a-5e16-4ae2-8b34-8618e4f6558d";
const ADMIN_TOKEN = "Mark2015N";

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
  title, meta, amount, amountColor, onPrint, onEmail,
}: {
  title: string; meta: string; amount: string;
  amountColor: string; onPrint?: () => void; onEmail?: () => void;
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl transition-colors"
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
      {onEmail && (
        <button onClick={onEmail}
          className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all active:scale-90"
          style={{ background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.25)", color: "#60a5fa" }}>
          <Icon name="Mail" size={12} />
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
function buildSaleCheckHtml(s: SLSoldItem): string {
  const dateStr = s.sell_at ? new Date(s.sell_at).toLocaleDateString("ru-RU") : new Date().toLocaleDateString("ru-RU");
  const timeStr = s.sell_at ? new Date(s.sell_at).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }) : "";
  const pmLabel: Record<string, string> = { cash: "Наличные", card: "Карта", transfer: "Перевод" };
  const amount = Number(s.amount || s.sell_price || 0);

  const row = (label: string, value: string) =>
    `<tr><td style="padding:7px 0;color:#aaa;font-size:13px;width:45%">${label}</td><td style="padding:7px 0;color:#fff;font-size:13px;font-weight:600;text-align:right">${value}</td></tr>`;

  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="color:#e0e0e0;font-family:Arial,sans-serif">
    ${row("№ операции", `#${s.operation_id || s.id}`)}
    ${row("Дата", `${dateStr}${timeStr ? " " + timeStr : ""}`)}
    <tr><td colspan="2" style="padding:4px 0"><div style="height:1px;background:#333"></div></td></tr>
    ${row("Товар", s.title)}
    ${s.specs_short ? row("Характеристики", s.specs_short) : ""}
    ${s.imei ? row("IMEI", s.imei) : ""}
    ${s.client_name ? row("Покупатель", s.client_name) : ""}
    ${s.client_phone ? row("Телефон", s.client_phone) : ""}
    <tr><td colspan="2" style="padding:4px 0"><div style="height:1px;background:#333"></div></td></tr>
    ${s.payment_method ? row("Способ оплаты", pmLabel[s.payment_method] || s.payment_method) : ""}
    <tr>
      <td style="padding:12px 0 4px;color:#FFD700;font-size:16px;font-weight:800">ИТОГО</td>
      <td style="padding:12px 0 4px;color:#FFD700;font-size:20px;font-weight:900;text-align:right">${amount.toLocaleString("ru-RU")} ₽</td>
    </tr>
    <tr><td colspan="2" style="padding:4px 0"><div style="height:2px;background:linear-gradient(90deg,#FFD700,transparent)"></div></td></tr>
    <tr><td colspan="2" style="padding:12px 0 0;font-size:11px;color:#555;line-height:1.7">
      Товар надлежащего качества обмену и возврату не подлежит.<br>
      ИНН: 402810962699 · ОГРНИП: 307402814200032
    </td></tr>
  </table>`;
}

export function SoldSection({
  sold, onNav,
}: {
  sold: SLSoldItem[];
  onNav: (k: string) => void;
}) {
  const [emailDialog, setEmailDialog] = useState<SLSoldItem | null>(null);
  const [emailInput, setEmailInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!emailInput.trim() || !emailDialog) return;
    setSending(true);
    try {
      const res = await fetch(SEND_CHECK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Token": ADMIN_TOKEN },
        body: JSON.stringify({
          email: emailInput.trim(),
          check_html: buildSaleCheckHtml(emailDialog),
          check_type: "sale",
          order_id: emailDialog.operation_id || emailDialog.id,
          client_name: emailDialog.client_name || "",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.sent) { setSent(true); setTimeout(() => { setEmailDialog(null); setSent(false); }, 1500); }
    } finally {
      setSending(false);
    }
  };

  return (
    <>
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
              onEmail={() => { setEmailInput(""); setSent(false); setEmailDialog(s); }}
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

    {/* Диалог отправки чека на email */}
    {emailDialog && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
        <div className="w-full max-w-sm rounded-2xl p-5 shadow-2xl"
          style={{ background: "#111", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(96,165,250,0.15)", border: "1px solid rgba(96,165,250,0.3)" }}>
              <Icon name="Mail" size={16} style={{ color: "#60a5fa" }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-oswald font-bold text-white text-sm uppercase tracking-wide">Отправить чек</div>
              <div className="font-roboto text-[10px] truncate" style={{ color: "rgba(255,255,255,0.35)" }}>
                {emailDialog.title}
              </div>
            </div>
            <button onClick={() => setEmailDialog(null)} style={{ color: "rgba(255,255,255,0.3)" }}>
              <Icon name="X" size={16} />
            </button>
          </div>

          {sent ? (
            <div className="flex items-center justify-center gap-2 py-4 text-emerald-400 font-roboto text-sm">
              <Icon name="CheckCircle2" size={18} /> Чек отправлен!
            </div>
          ) : (
            <>
              <div className="font-roboto text-[11px] mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>
                Email покупателя
              </div>
              <input
                type="email"
                value={emailInput}
                onChange={e => setEmailInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSend()}
                placeholder="email@example.com"
                autoFocus
                className="w-full px-3 py-2.5 rounded-lg text-white text-sm placeholder-white/20 outline-none mb-3 font-roboto"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
              />
              <div className="flex gap-2">
                <button onClick={() => setEmailDialog(null)}
                  className="flex-1 py-2.5 rounded-lg text-sm font-roboto transition-colors"
                  style={{ border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}>
                  Отмена
                </button>
                <button
                  onClick={handleSend}
                  disabled={sending || !emailInput.trim()}
                  className="flex-1 py-2.5 rounded-lg font-bold text-sm font-roboto flex items-center justify-center gap-1.5 transition-all disabled:opacity-40"
                  style={{ background: "#3b82f6", color: "#fff" }}>
                  {sending
                    ? <><Icon name="Loader2" size={13} className="animate-spin" /> Отправляю...</>
                    : <><Icon name="Send" size={13} /> Отправить</>}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    )}
    </>
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