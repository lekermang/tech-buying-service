import { useState } from "react";
import Icon from "@/components/ui/icon";
import { CatalogItem, SEND_LEAD_URL, PRICE_MARKUP } from "@/pages/catalog.types";

interface Props {
  item: CatalogItem;
  onClose: () => void;
}

const CatalogOrderModal = ({ item, onClose }: Props) => {
  const [form, setForm] = useState({ name: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const title = [item.brand, item.model, item.storage, item.color].filter(Boolean).join(" ");
  const displayPrice = item.price ? (item.price + PRICE_MARKUP).toLocaleString("ru-RU") + " ₽" : "Цену уточняйте";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) return;
    setLoading(true);
    try {
      await fetch(SEND_LEAD_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          category: item.category,
          desc: `Заявка на покупку: ${title}, цена: ${displayPrice}`,
        }),
      });
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4" onClick={onClose}>
      <div
        className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-black/10" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-4 pb-3">
          <h3 className="text-lg font-semibold text-[#1d1d1f]">Оформить заказ</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#f5f5f7] flex items-center justify-center hover:bg-[#e8e8ed] transition-colors">
            <Icon name="X" size={16} className="text-[#1d1d1f]/60" />
          </button>
        </div>

        <div className="px-6 pb-8">
          {/* Product info */}
          <div className="bg-[#f5f5f7] rounded-2xl p-4 mb-5">
            <div className="text-sm font-medium text-[#1d1d1f] leading-snug">{title}</div>
            <div className="text-xl font-semibold text-[#1d1d1f] mt-1">{displayPrice}</div>
            {item.availability === "on_order" && (
              <div className="text-xs text-[#1d1d1f]/40 mt-1">Доставка на следующий день (заказ до 17:00)</div>
            )}
          </div>

          {sent ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name="Check" size={28} className="text-green-600" />
              </div>
              <h4 className="text-lg font-semibold text-[#1d1d1f] mb-1">Заявка принята</h4>
              <p className="text-sm text-[#1d1d1f]/40 mb-5">Перезвоним в течение 15 минут</p>

              <div className="bg-[#f5f5f7] rounded-2xl p-4 text-left mb-4">
                <div className="text-xs text-[#1d1d1f]/40 uppercase tracking-wide mb-2">Оплата переводом СБП</div>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-lg font-semibold text-[#1d1d1f]">8 992 999-03-33</div>
                    <div className="text-xs text-[#1d1d1f]/30 mt-0.5">Банк подберётся автоматически</div>
                  </div>
                  <button
                    onClick={() => navigator.clipboard.writeText("89929990333")}
                    className="shrink-0 bg-white border border-black/10 text-[#0071e3] text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-[#f5f5f7] transition-colors flex items-center gap-1">
                    <Icon name="Copy" size={12} />
                    Скопировать
                  </button>
                </div>
                {item.price && (
                  <div className="mt-3 pt-3 border-t border-black/5 flex items-center justify-between">
                    <span className="text-xs text-[#1d1d1f]/40">К оплате:</span>
                    <span className="text-sm font-semibold text-[#1d1d1f]">{(item.price + PRICE_MARKUP).toLocaleString("ru-RU")} ₽</span>
                  </div>
                )}
              </div>

              <a href="tel:+79929990333"
                className="flex items-center justify-center gap-2 text-[#0071e3] font-medium text-sm">
                <Icon name="Phone" size={15} />
                +7 (992) 999-03-33
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-[#1d1d1f]/40 block mb-1.5">Ваше имя</label>
                <input
                  type="text" required value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Иван"
                  className="w-full bg-[#f5f5f7] text-[#1d1d1f] px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0071e3]/30 transition-all placeholder:text-[#1d1d1f]/25"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[#1d1d1f]/40 block mb-1.5">Телефон</label>
                <input
                  type="tel" required value={form.phone}
                  onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                  placeholder="+7 (___) ___-__-__"
                  className="w-full bg-[#f5f5f7] text-[#1d1d1f] px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0071e3]/30 transition-all placeholder:text-[#1d1d1f]/25"
                />
              </div>

              <button
                type="submit" disabled={loading}
                className="w-full bg-[#0071e3] hover:bg-[#0077ed] text-white font-medium py-3.5 rounded-xl transition-colors disabled:opacity-50 text-sm flex items-center justify-center gap-2">
                {loading ? "Отправляем..." : "Отправить заявку"}
              </button>

              <div className="bg-[#f5f5f7] rounded-xl p-3 flex items-center justify-between gap-2">
                <div>
                  <div className="text-[10px] text-[#1d1d1f]/30 uppercase tracking-wide">Оплата СБП</div>
                  <div className="text-sm font-medium text-[#1d1d1f]">8 992 999-03-33</div>
                </div>
                <button type="button"
                  onClick={() => navigator.clipboard.writeText("89929990333")}
                  className="text-[#0071e3] text-xs font-medium px-3 py-1.5 rounded-lg bg-white border border-black/8 hover:bg-[#f5f5f7] transition-colors flex items-center gap-1">
                  <Icon name="Copy" size={11} />
                  Скопировать
                </button>
              </div>

              <p className="text-[#1d1d1f]/25 text-[11px] text-center">
                Перезвоним в течение 15 минут и подтвердим заказ
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default CatalogOrderModal;
