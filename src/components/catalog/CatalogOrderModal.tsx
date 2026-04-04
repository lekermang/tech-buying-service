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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#1A1A1A] border border-[#FFD700]/30 w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-[#FFD700]/20">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-[#FFD700]" />
            <h3 className="font-oswald font-bold text-lg uppercase">Оформить заявку</h3>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
            <Icon name="X" size={20} />
          </button>
        </div>

        <div className="p-5">
          <div className="bg-[#111] border border-[#333] p-3 mb-5">
            <div className="font-oswald font-bold text-sm uppercase">{title}</div>
            <div className="font-oswald text-[#FFD700] font-bold text-lg mt-1">{displayPrice}</div>
            {item.availability === "on_order" && (
              <div className="font-roboto text-white/30 text-xs mt-1">🚗 Под заказ — доставка на следующий день (заказ до 17:00)</div>
            )}
          </div>

          {sent ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-[#FFD700] flex items-center justify-center mx-auto mb-3">
                <Icon name="Check" size={28} className="text-black" />
              </div>
              <h4 className="font-oswald font-bold text-xl text-[#FFD700] mb-1">ЗАЯВКА ОТПРАВЛЕНА</h4>
              <p className="font-roboto text-white/50 text-sm mb-4">Перезвоним в течение 15 минут</p>

              <div className="bg-[#111] border border-[#FFD700]/20 p-4 text-left">
                <div className="font-roboto text-white/40 text-xs uppercase tracking-wider mb-2">Оплата переводом СБП</div>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="font-oswald font-bold text-lg text-white">8 992 999-03-33</div>
                    <div className="font-roboto text-white/30 text-xs mt-0.5">Банк получателя подберётся автоматически</div>
                  </div>
                  <button onClick={() => navigator.clipboard.writeText("89929990333")}
                    className="shrink-0 border border-[#FFD700]/30 text-[#FFD700] font-roboto text-xs px-3 py-2 hover:border-[#FFD700] transition-colors flex items-center gap-1.5">
                    <Icon name="Copy" size={12} />
                    Копировать
                  </button>
                </div>
                {item.price && (
                  <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                    <span className="font-roboto text-white/40 text-xs">Сумма к оплате:</span>
                    <span className="font-oswald font-bold text-[#FFD700]">{(item.price + PRICE_MARKUP).toLocaleString("ru-RU")} ₽</span>
                  </div>
                )}
              </div>

              <a href="tel:+79929990333" className="flex items-center justify-center gap-2 mt-3 text-[#FFD700] font-oswald font-bold">
                <Icon name="Phone" size={16} />
                +7 (992) 999-03-33
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="font-roboto text-white/40 text-xs uppercase tracking-wider block mb-1">Ваше имя</label>
                <input type="text" required value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Иван"
                  className="w-full bg-[#0D0D0D] border border-[#333] text-white px-3 py-2.5 font-roboto text-sm focus:outline-none focus:border-[#FFD700] transition-colors" />
              </div>
              <div>
                <label className="font-roboto text-white/40 text-xs uppercase tracking-wider block mb-1">Телефон</label>
                <input type="tel" required value={form.phone}
                  onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                  placeholder="+7 (___) ___-__-__"
                  className="w-full bg-[#0D0D0D] border border-[#333] text-white px-3 py-2.5 font-roboto text-sm focus:outline-none focus:border-[#FFD700] transition-colors" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-[#FFD700] text-black font-oswald font-bold py-3 uppercase tracking-wide hover:bg-yellow-400 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                <Icon name="Phone" size={16} />
                {loading ? "Отправляем..." : "Отправить заявку"}
              </button>
              <div className="border border-white/10 p-3 flex items-center justify-between gap-2">
                <div>
                  <div className="font-roboto text-white/30 text-[10px] uppercase tracking-wider">Оплата СБП сразу</div>
                  <div className="font-oswald font-bold text-sm text-white">8 992 999-03-33</div>
                </div>
                <button type="button" onClick={() => navigator.clipboard.writeText("89929990333")}
                  className="border border-[#FFD700]/20 text-[#FFD700]/60 hover:text-[#FFD700] hover:border-[#FFD700] font-roboto text-xs px-2 py-1.5 transition-colors flex items-center gap-1">
                  <Icon name="Copy" size={11} />
                  Копировать
                </button>
              </div>
              <p className="font-roboto text-white/20 text-[10px] text-center">
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
