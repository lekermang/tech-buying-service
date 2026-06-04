import { useState } from "react";
import { ymGoal, Goals } from "@/lib/ym";
import { REPAIR_ORDER_URL, PART_TYPE_LABEL, STATIC_EXTRAS, Part, ExtraWork } from "./types";
import { isPhoneValid } from "@/lib/phoneFormat";

type SubmitParams = {
  form: { name: string; phone: string; model: string; fault: string };
  selectedPart: Part | null;
  extraWorks: string[];
  extraWorksList: ExtraWork[];
  grandTotal: number;
  contactChannels?: string[];
  contactTime?: string;
};

/** Отправка заявки на ремонт. */
export function useRepairSubmit() {
  const [sending, setSending] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);

  const submit = async ({ form, selectedPart, extraWorks, extraWorksList, grandTotal, contactChannels, contactTime }: SubmitParams) => {
    if (!form.name || !form.model || !form.fault) return;
    if (!isPhoneValid(form.phone)) {
      alert("Введите номер телефона целиком в формате +7 (___) ___-__-__");
      return;
    }
    setSending(true);
    // Цель: попытка отправки заявки на ремонт (микроконверсия)
    ymGoal(Goals.REPAIR_SUBMIT, {
      model: form.model,
      has_part: !!selectedPart,
      total: selectedPart ? grandTotal : null,
    });
    const extraLabels = extraWorksList.filter(w => extraWorks.includes(String(w.id))).map(w => w.label);
    const staticExtraLabels = STATIC_EXTRAS.filter(w => extraWorks.includes(w.id)).map(w => w.label);
    const staticExtraTotal = STATIC_EXTRAS.filter(w => extraWorks.includes(w.id)).reduce((s, w) => s + w.price, 0);
    const allExtras = [...extraLabels, ...staticExtraLabels];
    // Итоговая сумма заявки: суммируем выбранную запчасть (если есть) + ВСЕ позиции (динамические + статические доп.услуги).
    // Это значение придёт в Staff и автоматически встанет в поле «Принято от клиента» (repair_amount).
    const totalToSubmit = (selectedPart ? grandTotal : 0) + (selectedPart ? 0 : staticExtraTotal);
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 12000);
    try {
      const res = await fetch(REPAIR_ORDER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: ctrl.signal,
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          model: form.model,
          repair_type: selectedPart
            ? `${PART_TYPE_LABEL[selectedPart.part_type] || selectedPart.part_type}${allExtras.length ? " + " + allExtras.join(", ") : ""}`
            : [form.fault, ...staticExtraLabels].filter(Boolean).join(" + "),
          price: totalToSubmit > 0 ? totalToSubmit : undefined,
          comment: form.fault,
          // Полная информация о выбранной запчасти — чтобы Staff знал откуда заказывать
          selected_part: selectedPart ? {
            id: selectedPart.id,
            name: selectedPart.name,
            quality: selectedPart.quality,
            category: selectedPart.category,
            in_stock: selectedPart.in_stock,
            supplier_price: selectedPart.supplier_price,
          } : null,
          contact_channels: contactChannels || [],
          contact_time: contactTime || "",
          device: form.model,
        }),
      });
      const data = await res.json();
      if (data.order_id) {
        setOrderId(data.order_id);
        // Главная цель: успешная заявка на ремонт (макроконверсия) ★
        ymGoal(Goals.REPAIR_SUCCESS, {
          order_id: data.order_id,
          model: form.model,
          total: selectedPart ? grandTotal : null,
        });
        // Аналитика /staff/analytics: фиксируем конверсию
        try {
          (window as unknown as { skypkaConvert?: (d: Record<string, unknown>) => void }).skypkaConvert?.({
            type: "repair_order",
            form_type: "repair_order",
            phone: form.phone,
            amount: totalToSubmit > 0 ? totalToSubmit : null,
            order_id: data.order_id,
            model: form.model,
            name: form.name,
          });
        } catch { /* noop */ }
      }
    } catch (_e) { /* ignore */ }
    finally { clearTimeout(timeout); }
    setSending(false);
  };

  const resetOrder = () => setOrderId(null);

  return { sending, orderId, submit, resetOrder };
}