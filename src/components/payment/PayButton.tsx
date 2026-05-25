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
  purpose: string;
  amount: number;
  description: string;
  contextId?: string;
  contactInfo?: string;
  returnUrl?: string;
  children?: React.ReactNode;
  variant?: "gold" | "green" | "outline";
  size?: "sm" | "md" | "lg";
  className?: string;
  confirm?: boolean;
  icon?: string;
};

const fmt = (n: number) => n.toLocaleString("ru-RU");

export default function PayButton({
  purpose, amount, description, contextId, contactInfo, returnUrl, children,
  variant = "gold", size = "md", className = "", confirm = true, icon = "CreditCard",
}: PayButtonProps) {
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const startPay = async () => {
    if (amount <= 0) { toast.error("Некорректная сумма"); return; }
    setLoading(true);
    setShowConfirm(false);
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
    window.location.href = r.data.confirmationUrl;
  };

  const handle = () => {
    if (amount <= 0) { toast.error("Некорректная сумма"); return; }
    if (confirm) { setShowConfirm(true); return; }
    startPay();
  };

  const sizeCls = size === "sm" ? "py-2 px-3 text-xs" : size === "lg" ? "py-4 px-6 text-base" : "py-3 px-4 text-sm";
  const variantCls = variant === "gold"
    ? "bg-gradient-to-br from-[#FFD700] via-[#FFE033] to-[#FFD700] text-black hover:shadow-[0_10px_30px_-10px_rgba(255,215,0,0.6)]"
    : variant === "green"
    ? "bg-emerald-500 text-black hover:bg-emerald-400"
    : "bg-transparent border-2 border-[#FFD700]/40 text-[#FFD700] hover:border-[#FFD700] hover:bg-[#FFD700]/[0.05]";

  return (
    <>
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

      {/* Встроенный диалог подтверждения — вместо window.confirm */}
      {showConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowConfirm(false)}>
          <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-5 max-w-xs w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-[#FFD700]/15 flex items-center justify-center shrink-0">
                <Icon name="CreditCard" size={18} className="text-[#FFD700]" />
              </div>
              <div>
                <div className="font-bold text-white text-sm">Подтвердите оплату</div>
                <div className="text-white/50 text-xs mt-0.5">{description}</div>
              </div>
            </div>
            <div className="text-2xl font-extrabold text-[#FFD700] mb-4">{fmt(amount)} ₽</div>
            <div className="text-white/40 text-xs mb-4">Вы будете перенаправлены на страницу оплаты ЮKassa</div>
            <div className="flex gap-2">
              <button onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-[#333] text-white/60 text-sm font-medium hover:text-white transition">
                Отмена
              </button>
              <button onClick={startPay}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-br from-[#FFD700] to-[#FFB800] text-black text-sm font-bold hover:opacity-90 transition">
                Оплатить
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
