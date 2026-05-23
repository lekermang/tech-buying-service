/** Форма подачи заявки продавцом. Поддерживает фото (до 6 шт), компрессию. */
import { useRef, useState } from "react";
import { toast } from "sonner";
import Icon from "@/components/ui/icon";
import { apiCall, COMMISSION_PCT, OFFICE_ADDRESS, REALIZATION_DAYS, fmtRub, saveSellerToken, type CreateResponse } from "./api";

const CATEGORIES = ["Смартфон", "Ноутбук", "Планшет", "Часы", "Игровая консоль", "Аудиотехника", "Фотоаппарат", "Другое"];
const CONDITIONS = ["Новое (в упаковке)", "Отличное", "Хорошее", "Удовлетворительное"];

async function fileToBase64Compressed(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res((r.result as string).split(",")[1] || "");
      r.onerror = rej;
      r.readAsDataURL(file);
    });
  }
  const dataUrl: string = await new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
  const img: HTMLImageElement = await new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = dataUrl;
  });
  const maxSide = 1600;
  let w = img.naturalWidth || img.width;
  let h = img.naturalHeight || img.height;
  if (Math.max(w, h) > maxSide) {
    const k = maxSide / Math.max(w, h);
    w = Math.round(w * k);
    h = Math.round(h * k);
  }
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl.split(",")[1] || "";
  ctx.drawImage(img, 0, 0, w, h);
  const out = canvas.toDataURL("image/jpeg", 0.82);
  return out.split(",")[1] || "";
}

export default function SellerForm({ onSubmitted }: { onSubmitted: (token: string, resp: CreateResponse) => void }) {
  const [sellerName, setSellerName] = useState("");
  const [sellerPhone, setSellerPhone] = useState("");
  const [sellerEmail, setSellerEmail] = useState("");
  const [productTitle, setProductTitle] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [productBrand, setProductBrand] = useState("");
  const [productModel, setProductModel] = useState("");
  const [productCondition, setProductCondition] = useState("");
  const [productSerial, setProductSerial] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "transfer">("cash");
  const [payoutMethod, setPayoutMethod] = useState<"cash" | "transfer">("cash");
  const [payoutDetails, setPayoutDetails] = useState("");
  const [agree, setAgree] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const priceNum = Number(price) || 0;
  const commission = Math.round((priceNum * COMMISSION_PCT) / 100);
  const payout = priceNum - commission;

  const addPhotos = (incoming: File[]) => {
    setPhotos(prev => {
      const total = [...prev, ...incoming].slice(0, 6);
      return total;
    });
  };

  const submit = async () => {
    if (!sellerName.trim() || sellerName.trim().length < 3) { toast.error("Укажите имя"); return; }
    if (!sellerPhone.trim()) { toast.error("Укажите телефон"); return; }
    if (!productTitle.trim()) { toast.error("Опишите товар"); return; }
    if (priceNum <= 0) { toast.error("Укажите цену"); return; }
    if (!agree) { toast.error("Подтвердите согласие с условиями"); return; }

    setLoading(true);
    toast.message("Загружаем фото...");

    const photosB64: string[] = [];
    for (const p of photos) {
      try { photosB64.push(await fileToBase64Compressed(p)); }
      catch { /* skip */ }
    }

    const r = await apiCall<CreateResponse>("create", {
      method: "POST",
      body: {
        sellerName: sellerName.trim(),
        sellerPhone: sellerPhone.trim(),
        sellerEmail: sellerEmail.trim() || null,
        productTitle: productTitle.trim(),
        productBrand: productBrand.trim() || null,
        productModel: productModel.trim() || null,
        productCategory: productCategory || null,
        productCondition: productCondition || null,
        productDescription: description.trim() || null,
        productSerial: productSerial.trim() || null,
        price: priceNum,
        paymentMethod,
        payoutMethod,
        payoutDetails: payoutDetails.trim() || null,
        photos: photosB64,
      },
    });
    setLoading(false);
    if (!r.ok || !r.data) { toast.error(r.error || "Ошибка отправки"); return; }
    saveSellerToken({
      token: r.data.sellerToken,
      dealNumber: r.data.dealNumber,
      title: productTitle,
      createdAt: new Date().toISOString(),
    });
    toast.success(`Заявка ${r.data.dealNumber} принята!`);
    onSubmitted(r.data.sellerToken, r.data);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-5 py-6 space-y-5">
      <Section title="О вас" icon="User">
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Ваше имя*">
            <input value={sellerName} onChange={e => setSellerName(e.target.value)}
              className="input" placeholder="Иван Иванов" />
          </Field>
          <Field label="Телефон*">
            <input value={sellerPhone} onChange={e => setSellerPhone(e.target.value)}
              className="input" placeholder="+7 900 123-45-67" type="tel" />
          </Field>
          <Field label="Email (необязательно)">
            <input value={sellerEmail} onChange={e => setSellerEmail(e.target.value)}
              className="input" placeholder="you@mail.ru" type="email" />
          </Field>
        </div>
      </Section>

      <Section title="Товар" icon="Package">
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Название*" full>
            <input value={productTitle} onChange={e => setProductTitle(e.target.value)}
              className="input" placeholder="iPhone 13 Pro 256GB" />
          </Field>
          <Field label="Категория">
            <select value={productCategory} onChange={e => setProductCategory(e.target.value)} className="input">
              <option value="">—</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Состояние">
            <select value={productCondition} onChange={e => setProductCondition(e.target.value)} className="input">
              <option value="">—</option>
              {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Бренд">
            <input value={productBrand} onChange={e => setProductBrand(e.target.value)} className="input" placeholder="Apple" />
          </Field>
          <Field label="Модель">
            <input value={productModel} onChange={e => setProductModel(e.target.value)} className="input" placeholder="iPhone 13 Pro" />
          </Field>
          <Field label="Серийный/IMEI (необязательно)" full>
            <input value={productSerial} onChange={e => setProductSerial(e.target.value)} className="input" placeholder="" />
          </Field>
          <Field label="Описание / комплектация" full>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="input resize-none"
              placeholder="Использовался 1 год, коробка, зарядка, царапин нет..." />
          </Field>
        </div>
      </Section>

      <Section title="Фото товара (до 6)" icon="Camera">
        <input ref={photoInputRef} type="file" multiple accept="image/*" style={{ display: "none" }}
          onChange={e => { addPhotos(Array.from(e.target.files || [])); e.target.value = ""; }} />
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {photos.map((p, i) => (
            <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-[#1C1C1C]">
              <img src={URL.createObjectURL(p)} alt="" className="absolute inset-0 w-full h-full object-cover" />
              <button onClick={() => setPhotos(prev => prev.filter((_, idx) => idx !== i))}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center">
                <Icon name="X" size={12} />
              </button>
            </div>
          ))}
          {photos.length < 6 && (
            <button onClick={() => photoInputRef.current?.click()}
              className="aspect-square rounded-lg border-2 border-dashed border-[#2A2A2A] flex flex-col items-center justify-center text-[#777] hover:border-[#FFD700] hover:text-[#FFD700] transition">
              <Icon name="Plus" size={20} />
              <span className="text-[10px] mt-1">Фото</span>
            </button>
          )}
        </div>
      </Section>

      <Section title="Цена и расчёт" icon="Wallet">
        <Field label="Желаемая цена продажи (₽)*" full>
          <input value={price} onChange={e => setPrice(e.target.value.replace(/\D/g, ""))}
            className="input text-2xl font-extrabold text-[#FFD700]"
            placeholder="35 000" inputMode="numeric" />
        </Field>
        {priceNum > 0 && (
          <div className="mt-3 grid grid-cols-3 gap-2">
            <Stat label="Цена" value={fmtRub(priceNum)} color="#FFD700" />
            <Stat label={`Комиссия ${COMMISSION_PCT}%`} value={fmtRub(commission)} color="#FF7AB8" />
            <Stat label="К выплате вам" value={fmtRub(payout)} color="#3DDC84" />
          </div>
        )}
        <div className="grid sm:grid-cols-2 gap-3 mt-3">
          <Field label="Как покупатель платит">
            <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as "cash" | "transfer")} className="input">
              <option value="cash">Наличными в офисе</option>
              <option value="transfer">Переводом</option>
            </select>
          </Field>
          <Field label="Как получить деньги">
            <select value={payoutMethod} onChange={e => setPayoutMethod(e.target.value as "cash" | "transfer")} className="input">
              <option value="cash">Наличными в офисе</option>
              <option value="transfer">На карту/счёт</option>
            </select>
          </Field>
          {payoutMethod === "transfer" && (
            <Field label="Реквизиты для перевода" full>
              <input value={payoutDetails} onChange={e => setPayoutDetails(e.target.value)} className="input"
                placeholder="Номер карты или СБП по телефону" />
            </Field>
          )}
        </div>
      </Section>

      <div className="bg-[#FFD700]/[0.06] border border-[#FFD700]/[0.2] rounded-2xl px-4 py-3.5 text-sm text-[#ddd] leading-relaxed">
        <Icon name="Shield" size={14} className="inline mr-1.5 text-[#FFD700]" />
        Срок реализации — <b>{REALIZATION_DAYS} дней</b>. Сделки проходят только в офисе{" "}
        <b>{OFFICE_ADDRESS}</b>. Если товар не продан — забираете его обратно без штрафов.
      </div>

      <label className="flex items-start gap-2.5 text-sm text-[#ccc] cursor-pointer">
        <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} className="mt-0.5" />
        <span>
          Подтверждаю, что товар принадлежит мне, не находится в залоге, не украден. Согласен на проверку в офисе и условия комиссии {COMMISSION_PCT}%.
        </span>
      </label>

      <button onClick={submit} disabled={loading}
        className="w-full py-4 rounded-2xl bg-gradient-to-br from-[#FFD700] via-[#FFE033] to-[#FFD700] text-black font-bold text-base transition active:scale-[0.97] hover:shadow-[0_15px_40px_-10px_rgba(255,215,0,0.6)] disabled:opacity-50 flex items-center justify-center gap-2">
        {loading ? <Icon name="Loader2" size={18} className="animate-spin" /> : <Icon name="Shield" size={18} />}
        {loading ? "Отправляем..." : "Подать заявку"}
      </button>

      <style>{`.input { width:100%; background:#1C1C1C; border:1px solid #2A2A2A; border-radius:12px; padding:10px 14px; font-size:14px; color:#F0F0F0; outline:none; }
      .input:focus { border-color:#FFD700; }`}</style>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <section className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-4 sm:p-5">
      <h2 className="text-sm font-bold text-[#FFD700] uppercase tracking-wider mb-3 flex items-center gap-2">
        <Icon name={icon} size={14} /> {title}
      </h2>
      {children}
    </section>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={`block ${full ? "sm:col-span-2" : ""}`}>
      <span className="block text-xs text-[#888] mb-1">{label}</span>
      {children}
    </label>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-[#1C1C1C] border border-[#2A2A2A] rounded-xl px-3 py-2.5 text-center">
      <div className="text-[10px] uppercase tracking-wider text-[#777] mb-0.5">{label}</div>
      <div className="text-sm font-extrabold" style={{ color }}>{value}</div>
    </div>
  );
}
