import { useState } from "react";
import Icon from "@/components/ui/icon";
import { CatalogItem, SEND_LEAD_URL, MODEL_PHOTOS, MODEL_PHOTOS_EXTRA, MODEL_COLOR_PHOTOS, CATEGORY_PHOTOS } from "@/pages/catalog.types";
import { ymGoal, Goals } from "@/lib/ym";
import { formatPhone, isPhoneValid } from "@/lib/phoneFormat";
import { createUniversalPayment } from "@/pages/safeDeals/api";

interface Props {
  item: CatalogItem;
  onClose: () => void;
  markup?: number;
}

const CatalogOrderModal = ({ item, onClose, markup = 3500 }: Props) => {
  const [form, setForm] = useState({ fullName: "", phone: "", address: "" });
  const [loading, setLoading] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [error, setError] = useState("");

  const title = [item.brand, item.model, item.storage, item.color].filter(Boolean).join(" ");
  const totalPrice = item.price ? item.price + markup : 0;
  const displayPrice = totalPrice ? totalPrice.toLocaleString("ru-RU") + " ₽" : "Цену уточняйте";

  const colorKey = item.color ? `${item.model}::${item.color.toLowerCase()}` : null;
  const colorPhoto = colorKey ? (MODEL_COLOR_PHOTOS[colorKey] || null) : null;
  const mainPhoto = item.photo_url || colorPhoto || MODEL_PHOTOS[item.model] || CATEGORY_PHOTOS[item.category] || null;
  const extraPhotos = MODEL_PHOTOS_EXTRA[item.model] || [];
  const allPhotos = mainPhoto ? [mainPhoto, ...extraPhotos] : extraPhotos;

  const validate = (): boolean => {
    if (!form.fullName.trim()) { setError("Введите ФИО"); return false; }
    if (!isPhoneValid(form.phone)) { setError("Введите телефон в формате +7 (___) ___-__-__"); return false; }
    if (!form.address.trim()) { setError("Введите адрес доставки"); return false; }
    setError("");
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await fetch(SEND_LEAD_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.fullName,
          phone: form.phone,
          category: item.category,
          desc: `Заявка на покупку: ${title}, цена: ${displayPrice}. Адрес доставки: ${form.address}`,
        }),
      });
      setSent(true);
      ymGoal(Goals.CATALOG_ORDER, { source: "catalog", category: item.category });
    } finally {
      setLoading(false);
    }
  };

  const handleYookassa = async () => {
    if (!validate()) return;
    if (!totalPrice) { setError("Цена не указана — оформите заявку"); return; }
    setPayLoading(true);
    const r = await createUniversalPayment({
      purpose: "buy_item",
      amount: totalPrice,
      description: `Покупка: ${title}`,
      contactInfo: form.phone,
      returnUrl: window.location.href,
    });
    setPayLoading(false);
    if (r.ok && r.data?.confirmationUrl) {
      window.location.href = r.data.confirmationUrl;
    } else {
      setError(r.error || "Не удалось создать платёж");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4" onClick={onClose}>
      <div
        className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl max-h-[95vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden shrink-0">
          <div className="w-10 h-1 rounded-full bg-black/10" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-4 pb-3 shrink-0">
          <h3 className="text-lg font-semibold text-[#1d1d1f]">Оформить заказ</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#f5f5f7] flex items-center justify-center hover:bg-[#e8e8ed] transition-colors">
            <Icon name="X" size={16} className="text-[#1d1d1f]/60" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 pb-8">

          {/* Галерея фото */}
          {allPhotos.length > 0 && (
            <div className="mb-4">
              <div className="relative bg-[#f5f5f7] rounded-2xl aspect-square flex items-center justify-center overflow-hidden">
                <img key={allPhotos[photoIdx]} src={allPhotos[photoIdx]} alt={title}
                  className="w-4/5 h-4/5 object-contain" />
                {allPhotos.length > 1 && (
                  <>
                    <button onClick={() => setPhotoIdx(i => (i - 1 + allPhotos.length) % allPhotos.length)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center shadow">
                      <Icon name="ChevronLeft" size={16} className="text-[#1d1d1f]" />
                    </button>
                    <button onClick={() => setPhotoIdx(i => (i + 1) % allPhotos.length)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center shadow">
                      <Icon name="ChevronRight" size={16} className="text-[#1d1d1f]" />
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Товар + цена */}
          <div className="bg-[#f5f5f7] rounded-2xl p-4 mb-5">
            <div className="text-sm font-medium text-[#1d1d1f] leading-snug">{title}</div>
            <div className="text-xl font-semibold text-[#1d1d1f] mt-1">{displayPrice}</div>
            {item.availability === "on_order" && (
              <div className="text-xs text-[#1d1d1f]/40 mt-1">Доставка на следующий день (заказ до 17:00)</div>
            )}
          </div>

          {sent ? (
            /* ── Успех ── */
            <div className="text-center">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Icon name="Check" size={26} className="text-green-600" />
              </div>
              <h4 className="text-lg font-semibold text-[#1d1d1f] mb-1">Заявка принята!</h4>
              <p className="text-sm text-[#1d1d1f]/40 mb-4">Перезвоним в течение 15 минут</p>

              {/* СБП */}
              <div className="bg-[#f5f5f7] rounded-2xl p-4 mb-4 text-left">
                <div className="text-xs font-semibold text-[#1d1d1f]/40 uppercase tracking-wide mb-3">Способы оплаты</div>
                <div className="mb-3 pb-3 border-b border-black/6">
                  <div className="flex items-center gap-2 mb-2">
                    <img src="https://cdn.nspk.ru/upload/logos/sbp_color.svg" alt="СБП" className="h-5" onError={e => { (e.target as HTMLImageElement).style.display='none' }} />
                    <span className="text-xs font-semibold text-[#1d1d1f]">Система быстрых платежей</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="shrink-0 w-20 h-20 bg-white rounded-xl overflow-hidden flex items-center justify-center p-1 border border-black/8">
                      <img src="https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/c4300d94-dd25-455c-82c9-2da4f7f45c86.jpg" alt="QR СБП" className="w-full h-full object-contain" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-[#1d1d1f]/40 mb-0.5">Номер телефона</div>
                      <div className="text-base font-bold text-[#1d1d1f]">8 992 999-03-33</div>
                      <div className="text-[11px] text-[#1d1d1f]/35 mt-0.5">Сбербанк · Получатель подтвердится</div>
                      <button onClick={() => navigator.clipboard.writeText("89929990333")}
                        className="mt-1.5 inline-flex items-center gap-1 text-[#21A038] text-xs font-medium">
                        <Icon name="Copy" size={11} /> Скопировать
                      </button>
                    </div>
                  </div>
                </div>
                {totalPrice > 0 && (
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-[#1d1d1f]/40">Сумма к оплате</span>
                    <span className="text-base font-bold text-[#1d1d1f]">{displayPrice}</span>
                  </div>
                )}
              </div>

              <a href="tel:+79929990333" className="flex items-center justify-center gap-2 w-full border border-black/10 rounded-xl py-3 text-sm font-medium text-[#1d1d1f] hover:bg-[#f5f5f7] transition-colors">
                <Icon name="Phone" size={15} />+7 (992) 999-03-33
              </a>
            </div>
          ) : (
            /* ── Форма ── */
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-[#1d1d1f]/50 mb-1 block">ФИО *</label>
                <input
                  type="text"
                  placeholder="Иванов Иван Иванович"
                  value={form.fullName}
                  onChange={e => { setForm(f => ({ ...f, fullName: e.target.value })); setError(""); }}
                  className="w-full border border-black/12 rounded-xl px-3.5 py-2.5 text-sm text-[#1d1d1f] placeholder-black/25 focus:outline-none focus:border-[#0071e3] transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[#1d1d1f]/50 mb-1 block">Телефон *</label>
                <input
                  type="tel"
                  placeholder="+7 (___) ___-__-__"
                  value={form.phone}
                  onChange={e => { setForm(f => ({ ...f, phone: formatPhone(e.target.value) })); setError(""); }}
                  onFocus={() => { if (!form.phone) setForm(f => ({ ...f, phone: "+7 (" })); }}
                  className="w-full border border-black/12 rounded-xl px-3.5 py-2.5 text-sm text-[#1d1d1f] placeholder-black/25 focus:outline-none focus:border-[#0071e3] transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[#1d1d1f]/50 mb-1 block">Адрес доставки *</label>
                <input
                  type="text"
                  placeholder="г. Москва, ул. Примерная, д. 1, кв. 10"
                  value={form.address}
                  onChange={e => { setForm(f => ({ ...f, address: e.target.value })); setError(""); }}
                  className="w-full border border-black/12 rounded-xl px-3.5 py-2.5 text-sm text-[#1d1d1f] placeholder-black/25 focus:outline-none focus:border-[#0071e3] transition-colors"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-500 text-xs bg-red-50 rounded-xl px-3 py-2">
                  <Icon name="AlertCircle" size={13} />
                  {error}
                </div>
              )}

              {/* Кнопки действий */}
              <div className="pt-1 space-y-2">
                {/* ЮKassa */}
                {totalPrice > 0 && (
                  <button
                    type="button"
                    onClick={handleYookassa}
                    disabled={payLoading}
                    className="w-full bg-[#0071e3] hover:bg-[#0077ed] active:bg-[#006ed6] text-white font-semibold py-3.5 rounded-xl transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {payLoading
                      ? <Icon name="Loader2" size={15} className="animate-spin" />
                      : <Icon name="CreditCard" size={15} />
                    }
                    Оплатить {displayPrice} онлайн
                  </button>
                )}

                {/* Заявка-звонок */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#1d1d1f] font-medium py-3.5 rounded-xl transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {loading
                    ? <Icon name="Loader2" size={15} className="animate-spin" />
                    : <Icon name="Phone" size={15} />
                  }
                  Оставить заявку — перезвоним
                </button>
              </div>

              <p className="text-center text-[11px] text-[#1d1d1f]/30 pt-1">
                Гарантия 14 дней · Доставка курьером
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default CatalogOrderModal;
