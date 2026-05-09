import { VIP_CHAT_URL } from "@/pages/vipChat/types";

/**
 * Глобальный хелпер: отправить сообщение в общий VIP-чат сотрудников
 * из любой точки приложения (заявки, СмартЛомбард, ремонт и т.д.).
 * Возвращает true при успехе, false при ошибке.
 */
export async function shareToChat(token: string, text: string, photoUrl?: string | null): Promise<boolean> {
  try {
    if (!token) return false;
    const body: Record<string, unknown> = { action: "send" };
    if (text) body.text = text;
    if (photoUrl) body.photo_url = photoUrl;
    const r = await fetch(VIP_CHAT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Employee-Token": token },
      body: JSON.stringify(body),
    });
    return r.ok;
  } catch {
    return false;
  }
}

/** Сформировать текст-карточку заявки для шаринга */
export function formatLeadShare(lead: {
  id: number;
  client_name: string;
  client_phone: string;
  category?: string | null;
  description?: string | null;
  source?: string;
}): string {
  const parts = [
    `📦 Заявка #${lead.id}`,
    `👤 ${lead.client_name}`,
    `📞 ${lead.client_phone}`,
  ];
  if (lead.category) parts.push(`🏷 ${lead.category}`);
  if (lead.description) parts.push(`📝 ${lead.description}`);
  parts.push("", "👆 Что думаете, ребят?");
  return parts.join("\n");
}

/** Сформировать текст-карточку товара СмартЛомбарда для шаринга */
export function formatSlItemShare(item: {
  id?: number;
  brand?: string | null;
  model?: string | null;
  imei?: string | null;
  buy_price?: number | null;
  sell_price?: number | null;
  status?: string | null;
  notes?: string | null;
}, comment?: string): string {
  const title = [item.brand, item.model].filter(Boolean).join(" ") || "Товар";
  const parts = [`📱 ${title}${item.id ? ` (#${item.id})` : ""}`];
  if (item.imei) parts.push(`🔢 IMEI: ${item.imei}`);
  if (item.buy_price) parts.push(`💰 Закуп: ${item.buy_price.toLocaleString("ru-RU")} ₽`);
  if (item.sell_price) parts.push(`🏷 Цена: ${item.sell_price.toLocaleString("ru-RU")} ₽`);
  if (item.status) parts.push(`📌 Статус: ${item.status}`);
  if (item.notes) parts.push(`📝 ${item.notes}`);
  parts.push("");
  parts.push(comment || "👆 Подскажите по этой позиции");
  return parts.join("\n");
}