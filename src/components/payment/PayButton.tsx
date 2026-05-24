/** Универсальная кнопка оплаты через ЮKassa.
 * Работает для любого раздела сайта: ремонт, покупка товара, бронь, перенос данных и т.д.
 *
 * Использование:
 *   <PayButton purpose="repair" amount={2500} description="Замена экрана iPhone 12" />
 */
import { useState } from "react";
import { toast } from "sonner";
import Icon from "@/components/ui/icon";
import { createUniversalPayment } from "@/pages/safeDeals/api";

export type PayButtonProps = {
  /** Назначение: repair | repair_prepay | repair_urgent | buy_item | reserve_item | transfer_pro | custom */
  purpose: string;
  /** Сумма в рублях */
  amount: number;
  /** Описание для чека и кабинета ЮKassa */
  description: string;
  /** ID связанного объекта (например, repair_id, item_id, deal_number) */
  contextId?: string;
  /** Контакт клиента (email/телефон) — для возврата к нему */
  contactInfo?: string;
  /** Куда вернуть после оплаты (по умолчанию — текущая страница) */
  returnUrl?: string;
  /** Текст кнопки (по умолчанию — «Оплатить X ₽ через ЮKassa») */
  children?: React.ReactNode;
  /** Стиль */
  variant?: "gold" | "green" | "outline";
  size?: "sm" | "md" | "lg";
  className?: string;
  /** Запросить подтверждение перед оплатой */
  confirm?: boolean;
  /** Дополнительная иконка */
  icon?: string;
};

const fmt = (n: number) => n.toLocaleString("ru-RU");

export default function PayButton({
  purpose, amount, description, contextId, contactInfo, returnUrl, children,
  variant = "gold", size = "md", className = "", confirm = true, icon = "CreditCard",
}: PayButtonProps) {
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    if (amount <= 0) { toast.error("Некорректная сумма"); return; }
    if (confirm && !window.confirm(`Оплатить ${fmt(amount)} ₽ через ЮKassa?\n\n${description}`)) return;
    setLoading(true);
    const url = returnUrl || window.location.href;
    const r = await createUniversalPayment({
      purpose, amount, description,
      contextId: contextId || undefined,
      contactInfo: contactInfo || undefined,
      returnUrl: url,
    });
    if (!r.ok || !r.data?.confirmationUrl) {
      setLoading(false);
      toast.error(r.error || "Не удалось создать платёж");
      return;
    }
    // Переход на страницу оплаты ЮKassa
    window.location.href = r.data.confirmationUrl;
  };

  const sizeCls = size === "sm" ? "py-2 px-3 text-xs" : size === "lg" ? "py-4 px-6 text-base" : "py-3 px-4 text-sm";
  const variantCls = variant === "gold"
    ? "bg-gradient-to-br from-[#FFD700] via-[#FFE033] to-[#FFD700] text-black hover:shadow-[0_10px_30px_-10px_rgba(255,215,0,0.6)]"
    : variant === "green"
    ? "bg-emerald-500 text-black hover:bg-emerald-400"
    : "bg-transparent border-2 border-[#FFD700]/40 text-[#FFD700] hover:border-[#FFD700] hover:bg-[#FFD700]/[0.05]";

  return (
    <button
      type="button"
      onClick={handle}
      disabled={loading}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl font-bold transition active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed ${sizeCls} ${variantCls} ${className}`}
    >
      {loading ? (
        <Icon name="Loader2" size={size === "sm" ? 12 : size === "lg" ? 18 : 14} className="animate-spin" />
      ) : (
        <Icon name={icon} size={size === "sm" ? 12 : size === "lg" ? 18 : 14} />
      )}
      {children || `Оплатить ${fmt(amount)} ₽ через ЮKassa`}
    </button>
  );
}
