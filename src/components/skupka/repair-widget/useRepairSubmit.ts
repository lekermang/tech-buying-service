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
};

/** Отправка заявки на ремонт. */
export function useRepairSubmit() {
  const [sending, setSending] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);

  const submit = async ({ form, selectedPart, extraWorks, extraWorksList, grandTotal }: SubmitParams) => {
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
    try {
      const res = await fetch(REPAIR_ORDER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      }
    } catch (_e) { /* ignore */ }
    setSending(false);
  };

  const resetOrder = () => setOrderId(null);

  return { sending, orderId, submit, resetOrder };
}