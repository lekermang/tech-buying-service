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

          {/* Описание */}
          {item.description && (
            <p className="text-sm text-[#1d1d1f]/60 mb-4 leading-relaxed">{item.description}</p>
          )}

          {/* Характеристики */}
          {item.specs && Object.keys(item.specs).length > 0 && (
            <div className="bg-[#f5f5f7] rounded-2xl p-4 mb-5">
              <div className="text-xs font-semibold text-[#1d1d1f]/40 uppercase tracking-wide mb-3">Характеристики</div>
              <div className="space-y-2">
                {Object.entries(item.specs).map(([key, val]) => (
                  <div key={key} className="flex items-start justify-between gap-3">
                    <span className="text-xs text-[#1d1d1f]/40 shrink-0">{key}</span>
                    <span className="text-xs font-medium text-[#1d1d1f] text-right">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {sent ? (
            <div className="text-center">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Icon name="Check" size={26} className="text-green-600" />
              </div>
              <h4 className="text-lg font-semibold text-[#1d1d1f] mb-1">Заявка принята!</h4>
              <p className="text-sm text-[#1d1d1f]/40 mb-4">Перезвоним в течение 15 минут</p>

              {/* QR + реквизиты Сбербанк */}
              <div className="bg-[#f5f5f7] rounded-2xl p-4 mb-4">
                <div className="text-xs font-semibold text-[#1d1d1f]/40 uppercase tracking-wide mb-3">Оплата через СБП · Сбербанк</div>
                <div className="flex items-center gap-4">
                  {/* QR */}
                  <div className="shrink-0 w-24 h-24 bg-white rounded-xl overflow-hidden flex items-center justify-center p-1.5 border border-black/8">
                    <img
                      src="https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/c4300d94-dd25-455c-82c9-2da4f7f45c86.jpg"
                      alt="QR Сбербанк"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-xs text-[#1d1d1f]/40 mb-1">Номер телефона</div>
                    <div className="text-lg font-bold text-[#1d1d1f] tracking-tight">8 992 999-03-33</div>
                    <div className="text-[11px] text-[#1d1d1f]/35 mt-0.5">Сбербанк · Получатель подтвердится</div>
                    <button
                      onClick={() => navigator.clipboard.writeText("89929990333")}
                      className="mt-2 inline-flex items-center gap-1 text-[#21A038] text-xs font-medium">
                      <Icon name="Copy" size={11} />
                      Скопировать номер
                    </button>
                  </div>
                </div>
                {item.price && (
                  <div className="mt-3 pt-3 border-t border-black/6 flex items-center justify-between">
                    <span className="text-xs text-[#1d1d1f]/40">Сумма к переводу:</span>
                    <span className="text-base font-bold text-[#1d1d1f]">{(item.price + PRICE_MARKUP).toLocaleString("ru-RU")} ₽</span>
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

              {/* QR перед отправкой */}
              <div className="bg-[#f5f5f7] rounded-2xl p-4">
                <div className="text-xs font-semibold text-[#1d1d1f]/40 uppercase tracking-wide mb-3">Оплата · Сбербанк СБП</div>
                <div className="flex items-center gap-3">
                  <div className="shrink-0 w-20 h-20 bg-white rounded-xl overflow-hidden flex items-center justify-center p-1 border border-black/8">
                    <img
                      src="https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/c4300d94-dd25-455c-82c9-2da4f7f45c86.jpg"
                      alt="QR"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-bold text-[#1d1d1f]">8 992 999-03-33</div>
                    <div className="text-[11px] text-[#1d1d1f]/35 mt-0.5">Сбербанк</div>
                    <button type="button"
                      onClick={() => navigator.clipboard.writeText("89929990333")}
                      className="mt-1.5 inline-flex items-center gap-1 text-[#21A038] text-xs font-medium">
                      <Icon name="Copy" size={11} />
                      Скопировать
                    </button>
                  </div>
                </div>
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