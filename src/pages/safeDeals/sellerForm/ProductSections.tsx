/** Фото товара + Товар + Цена/расчёт + ИИ-проверка качества. */
import { useRef } from "react";
import Icon from "@/components/ui/icon";
import {
  COMMISSION_PCT, fmtRub,
  type CategoryItem, type AiCheckResult, type AiPriceResult,
} from "../api";
import { Section, Field, Stat, PriceOpt, AiCheckBlock, type PhotoItem } from "./primitives";

const CONDITIONS = ["Новое (в упаковке)", "Отличное", "Хорошее", "Удовлетворительное"];

export function PhotoUploadSection({
  photos, onAddPhotos, onRemovePhoto, photoUploading,
  aiFilling, onAiFill,
}: {
  photos: PhotoItem[];
  onAddPhotos: (files: File[]) => void;
  onRemovePhoto: (i: number) => void;
  photoUploading: boolean;
  aiFilling: boolean;
  onAiFill: () => void;
}) {
  const photoInputRef = useRef<HTMLInputElement>(null);
  return (
    <Section title="Фото товара" icon="Camera">
      <input ref={photoInputRef} type="file" multiple accept="image/*" style={{ display: "none" }}
        onChange={e => { onAddPhotos(Array.from(e.target.files || [])); e.target.value = ""; }} />
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {photos.map((p, i) => (
          <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-[#1C1C1C]">
            <img src={p.preview || p.url} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <button onClick={() => onRemovePhoto(i)}
              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center">
              <Icon name="X" size={12} />
            </button>
          </div>
        ))}
        {photos.length < 6 && (
          <button onClick={() => photoInputRef.current?.click()} disabled={photoUploading}
            className="aspect-square rounded-lg border-2 border-dashed border-[#2A2A2A] flex flex-col items-center justify-center text-[#777] hover:border-[#FFD700] hover:text-[#FFD700] transition disabled:opacity-50">
            {photoUploading
              ? <Icon name="Loader2" size={18} className="animate-spin" />
              : <><Icon name="Plus" size={20} /><span className="text-[10px] mt-1">Фото</span></>}
          </button>
        )}
      </div>

      {photos.length > 0 && (
        <button onClick={onAiFill} disabled={aiFilling}
          className="mt-3 w-full py-3 rounded-xl bg-gradient-to-r from-[#B8A4FF] to-[#7AB8FF] text-black font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
          {aiFilling
            ? (<><Icon name="Loader2" size={14} className="animate-spin" /> Распознаём товар...</>)
            : (<><Icon name="Sparkles" size={14} /> Распознать по фото (ИИ заполнит поля)</>)}
        </button>
      )}
    </Section>
  );
}

export function ProductFieldsSection({
  productTitle, setProductTitle,
  productCategoryId, setProductCategoryId,
  setProductCategoryName,
  productCondition, setProductCondition,
  productBrand, setProductBrand,
  productModel, setProductModel,
  productSerial, setProductSerial,
  description, setDescription,
  categories,
}: {
  productTitle: string; setProductTitle: (v: string) => void;
  productCategoryId: number | null; setProductCategoryId: (v: number | null) => void;
  setProductCategoryName: (v: string) => void;
  productCondition: string; setProductCondition: (v: string) => void;
  productBrand: string; setProductBrand: (v: string) => void;
  productModel: string; setProductModel: (v: string) => void;
  productSerial: string; setProductSerial: (v: string) => void;
  description: string; setDescription: (v: string) => void;
  categories: CategoryItem[];
}) {
  return (
    <Section title="Товар" icon="Package">
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Название*" full>
          <input value={productTitle} onChange={e => setProductTitle(e.target.value)}
            className="input" placeholder="iPhone 13 Pro 256GB" />
        </Field>
        <Field label="Категория">
          <select
            value={productCategoryId || ""}
            onChange={(e) => {
              const id = e.target.value ? Number(e.target.value) : null;
              setProductCategoryId(id);
              const c = categories.find(x => x.id === id);
              setProductCategoryName(c?.name || "");
            }}
            className="input"
          >
            <option value="">— Выберите —</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
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
          <input value={productSerial} onChange={e => setProductSerial(e.target.value)} className="input" />
        </Field>
        <Field label="Описание / комплектация" full>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="input resize-none"
            placeholder="Использовался 1 год, коробка, зарядка, царапин нет..." />
        </Field>
      </div>
    </Section>
  );
}

export function PriceSection({
  price, setPrice,
  priceNum, commission, payout,
  priceResult, priceLoading, onAiPrice,
  paymentMethod, setPaymentMethod,
  payoutMethod, setPayoutMethod,
  payoutDetails, setPayoutDetails,
}: {
  price: string; setPrice: (v: string) => void;
  priceNum: number; commission: number; payout: number;
  priceResult: AiPriceResult | null;
  priceLoading: boolean;
  onAiPrice: () => void;
  paymentMethod: "cash" | "transfer"; setPaymentMethod: (v: "cash" | "transfer") => void;
  payoutMethod: "cash" | "transfer"; setPayoutMethod: (v: "cash" | "transfer") => void;
  payoutDetails: string; setPayoutDetails: (v: string) => void;
}) {
  return (
    <Section title="Цена и расчёт" icon="Wallet">
      <Field label="Желаемая цена продажи (₽)*" full>
        <input value={price} onChange={e => setPrice(e.target.value.replace(/\D/g, ""))}
          className="input text-2xl font-extrabold text-[#FFD700]"
          placeholder="35 000" inputMode="numeric" />
      </Field>

      {/* ИИ-оценка цены */}
      <button onClick={onAiPrice} disabled={priceLoading}
        className="mt-3 w-full py-3 rounded-xl bg-gradient-to-r from-[#FFD700] via-[#FFE033] to-[#FFD700] text-black font-bold text-sm hover:shadow-[0_8px_25px_-8px_rgba(255,215,0,0.6)] transition disabled:opacity-50 flex items-center justify-center gap-2">
        {priceLoading
          ? (<><Icon name="Loader2" size={14} className="animate-spin" /> Оцениваем по рынку...</>)
          : (<><Icon name="Sparkles" size={14} /> ИИ-оценка: сколько просить?</>)}
      </button>

      {priceResult && (
        <div className="mt-3 bg-gradient-to-br from-[#FFD700]/[0.08] to-transparent border border-[#FFD700]/30 rounded-xl p-3">
          <div className="text-xs font-bold text-[#FFD700] uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Icon name="TrendingUp" size={12} /> Рыночная оценка
          </div>
          <div className="grid grid-cols-3 gap-2">
            <PriceOpt label="Быстро (1-3 дня)" value={priceResult.fast_price} color="#3DDC84" onClick={() => setPrice(String(priceResult.fast_price))} />
            <PriceOpt label="Справедливо" value={priceResult.fair_price} color="#FFD700" onClick={() => setPrice(String(priceResult.fair_price))} highlighted />
            <PriceOpt label="Максимум" value={priceResult.top_price} color="#FF7AB8" onClick={() => setPrice(String(priceResult.top_price))} />
          </div>
          <div className="text-[11px] text-[#bbb] mt-2 leading-relaxed">
            <Icon name="Clock" size={10} className="inline mr-1 text-[#FFD700]" />
            По справедливой цене продаётся за ~<b>{priceResult.days_to_sell} дней</b>. {priceResult.summary}
          </div>
        </div>
      )}

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
  );
}

export function AiCheckSection({
  productTitle, priceNum,
  aiResult, aiChecking, onAiCheck,
}: {
  productTitle: string;
  priceNum: number;
  aiResult: AiCheckResult | null;
  aiChecking: boolean;
  onAiCheck: () => void;
}) {
  if (!productTitle || priceNum <= 0) return null;
  return (
    <Section title="ИИ-проверка качества заявки" icon="Sparkles">
      <button onClick={onAiCheck} disabled={aiChecking}
        className="w-full py-3 rounded-xl border-2 border-[#FFD700]/40 text-[#FFD700] font-bold text-sm hover:border-[#FFD700] transition flex items-center justify-center gap-2 disabled:opacity-50">
        {aiChecking
          ? (<><Icon name="Loader2" size={14} className="animate-spin" /> Анализируем...</>)
          : (<><Icon name="ShieldCheck" size={14} /> Проверить заявку ИИ-модератором</>)}
      </button>
      {aiResult && <AiCheckBlock result={aiResult} />}
    </Section>
  );
}
