/** Форма подачи заявки продавцом.
 * Расширенные возможности:
 * - Быстрая регистрация Яндекс ID (авто-заполнение ФИО/email/телефон)
 * - Импорт объявления с Авито (название, цена, описание, фото)
 * - ИИ-распознавание товара по фото (название, бренд, модель, состояние)
 * - ИИ-проверка на признаки мошенничества (после загрузки фото)
 * - Скан паспорта (OCR через GPT-4o)
 * - Категории из БД (slshop_categories)
 */
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import Icon from "@/components/ui/icon";
import {
  apiCall, COMMISSION_PCT, OFFICE_ADDRESS, REALIZATION_DAYS, fmtRub, saveSellerToken,
  listCategories, uploadTempPhoto, aiFill, aiCheck, scanPassport, getYandexConfig, yandexAuth,
  type CreateResponse, type CategoryItem, type AiCheckResult, type AvitoParsed, type PassportData,
} from "./api";
import AvitoImportModal from "./AvitoImportModal";

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

type PhotoItem = { url: string; preview?: string };

export default function SellerForm({ onSubmitted }: { onSubmitted: (token: string, resp: CreateResponse) => void }) {
  // ─── seller fields ───
  const [sellerName, setSellerName] = useState("");
  const [sellerPhone, setSellerPhone] = useState("");
  const [sellerEmail, setSellerEmail] = useState("");
  const [yandexId, setYandexId] = useState<string | null>(null);

  // ─── product fields ───
  const [productTitle, setProductTitle] = useState("");
  const [productCategoryId, setProductCategoryId] = useState<number | null>(null);
  const [productCategoryName, setProductCategoryName] = useState("");
  const [productBrand, setProductBrand] = useState("");
  const [productModel, setProductModel] = useState("");
  const [productCondition, setProductCondition] = useState("");
  const [productSerial, setProductSerial] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<string>("");
  const [avitoUrl, setAvitoUrl] = useState<string | null>(null);

  // ─── payment ───
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "transfer">("cash");
  const [payoutMethod, setPayoutMethod] = useState<"cash" | "transfer">("cash");
  const [payoutDetails, setPayoutDetails] = useState("");
  const [agree, setAgree] = useState(false);

  // ─── photos ───
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [photoUploading, setPhotoUploading] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // ─── passport ───
  const [passport, setPassport] = useState<PassportData | null>(null);
  const [passportScanning, setPassportScanning] = useState(false);
  const passportInputRef = useRef<HTMLInputElement>(null);

  // ─── ai check ───
  const [aiResult, setAiResult] = useState<AiCheckResult | null>(null);
  const [aiChecking, setAiChecking] = useState(false);
  const [aiFilling, setAiFilling] = useState(false);

  // ─── ui state ───
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [avitoModalOpen, setAvitoModalOpen] = useState(false);
  const [yandexAvailable, setYandexAvailable] = useState(false);
  const [yandexClientId, setYandexClientId] = useState("");
  const [loading, setLoading] = useState(false);

  // ─── derived ───
  const priceNum = Number(price) || 0;
  const commission = Math.round((priceNum * COMMISSION_PCT) / 100);
  const payout = priceNum - commission;

  // ─── init ───
  useEffect(() => {
    listCategories().then(r => {
      if (r.ok && r.data) {
        // только верхний уровень
        setCategories(r.data.items.filter(c => !c.parent_id || c.depth === 0));
      }
    });
    getYandexConfig().then(r => {
      if (r.ok && r.data) {
        setYandexAvailable(r.data.available);
        setYandexClientId(r.data.clientId);
      }
    });
  }, []);

  // Принимаем code от Яндекса (popup закроется и postMessage)
  useEffect(() => {
    const handler = async (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      const data = e.data as { type?: string; code?: string };
      if (data?.type !== "yandex_oauth_code" || !data.code) return;
      const redirectUri = `${window.location.origin}/safe-deals/yandex-callback`;
      const r = await yandexAuth(data.code, redirectUri);
      if (!r.ok || !r.data) { toast.error(r.error || "Не удалось войти через Яндекс"); return; }
      if (r.data.fullName) setSellerName(r.data.fullName);
      if (r.data.email) setSellerEmail(r.data.email);
      if (r.data.phone) setSellerPhone(r.data.phone);
      setYandexId(r.data.yandexId);
      toast.success("Данные заполнены через Яндекс ID");
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  // ─── handlers ───
  const openYandexAuth = () => {
    if (!yandexAvailable || !yandexClientId) {
      toast.error("Яндекс ID временно недоступен");
      return;
    }
    const redirectUri = `${window.location.origin}/safe-deals/yandex-callback`;
    const authUrl =
      `https://oauth.yandex.ru/authorize?response_type=code` +
      `&client_id=${encodeURIComponent(yandexClientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}`;
    const popup = window.open(authUrl, "yandex_oauth", "width=520,height=640");
    if (!popup) toast.error("Браузер заблокировал попап");
  };

  const addPhotos = async (incoming: File[]) => {
    if (incoming.length === 0) return;
    setPhotoUploading(true);
    const slots = 6 - photos.length;
    const next: PhotoItem[] = [];
    for (const f of incoming.slice(0, slots)) {
      try {
        const b64 = await fileToBase64Compressed(f);
        const r = await uploadTempPhoto(b64);
        if (r.ok && r.data) {
          next.push({ url: r.data.url, preview: URL.createObjectURL(f) });
        }
      } catch {/* skip */}
    }
    setPhotos(prev => [...prev, ...next]);
    setPhotoUploading(false);
    if (next.length > 0) toast.success(`Загружено фото: ${next.length}`);
  };

  const removePhoto = (i: number) => setPhotos(prev => prev.filter((_, idx) => idx !== i));

  const handleAvitoImport = (data: AvitoParsed) => {
    setProductTitle(data.title);
    setDescription(data.description);
    if (data.price > 0) setPrice(String(data.price));
    if (data.category) setProductCategoryName(data.category);
    setAvitoUrl(data.url);
    // Импортируем фото как уже-загруженные URL (Авито хостит сам)
    const importedPhotos: PhotoItem[] = data.photos.slice(0, 6).map(u => ({ url: u, preview: u }));
    setPhotos(prev => [...importedPhotos, ...prev].slice(0, 6));
  };

  const handleAiFill = async () => {
    if (photos.length === 0) { toast.error("Сначала загрузите фото товара"); return; }
    setAiFilling(true);
    const r = await aiFill(photos.map(p => p.url));
    setAiFilling(false);
    if (!r.ok || !r.data) { toast.error(r.error || "Не удалось распознать"); return; }
    const d = r.data;
    if (d.title && !productTitle) setProductTitle(d.title);
    if (d.brand && !productBrand) setProductBrand(d.brand);
    if (d.model && !productModel) setProductModel(d.model);
    if (d.category && !productCategoryName) setProductCategoryName(d.category);
    if (d.condition && !productCondition) setProductCondition(d.condition);
    if (d.description && !description) setDescription(d.description);
    if (d.price_hint && !price) setPrice(String(d.price_hint));
    toast.success("ИИ заполнил поля");
  };

  const handleAiCheck = async () => {
    if (!productTitle.trim()) { toast.error("Сначала укажите название товара"); return; }
    setAiChecking(true);
    const r = await aiCheck({
      productTitle,
      productDescription: description,
      price: priceNum,
      photoUrls: photos.map(p => p.url),
    });
    setAiChecking(false);
    if (!r.ok || !r.data) { toast.error(r.error || "Ошибка"); return; }
    setAiResult(r.data);
  };

  const handleScanPassport = async (file: File) => {
    setPassportScanning(true);
    try {
      const b64 = await fileToBase64Compressed(file);
      const r = await scanPassport(b64);
      setPassportScanning(false);
      if (!r.ok || !r.data) { toast.error(r.error || "Не удалось распознать"); return; }
      setPassport(r.data);
      if (r.data.fullName && !sellerName) setSellerName(r.data.fullName);
      toast.success("Паспорт распознан");
    } catch (e) {
      setPassportScanning(false);
      toast.error((e as Error).message);
    }
  };

  const submit = async () => {
    if (!sellerName.trim() || sellerName.trim().length < 3) { toast.error("Укажите имя"); return; }
    if (!sellerPhone.trim()) { toast.error("Укажите телефон"); return; }
    if (!productTitle.trim()) { toast.error("Опишите товар"); return; }
    if (priceNum <= 0) { toast.error("Укажите цену"); return; }
    if (!agree) { toast.error("Подтвердите согласие с условиями"); return; }

    setLoading(true);
    const r = await apiCall<CreateResponse>("create", {
      method: "POST",
      body: {
        sellerName: sellerName.trim(),
        sellerPhone: sellerPhone.trim(),
        sellerEmail: sellerEmail.trim() || null,
        productTitle: productTitle.trim(),
        productBrand: productBrand.trim() || null,
        productModel: productModel.trim() || null,
        productCategory: productCategoryName || null,
        categoryId: productCategoryId,
        productCondition: productCondition || null,
        productDescription: description.trim() || null,
        productSerial: productSerial.trim() || null,
        price: priceNum,
        paymentMethod,
        payoutMethod,
        payoutDetails: payoutDetails.trim() || null,
        // Photo URLs (уже загружены)
        photoUrls: photos.map(p => p.url),
        // Доп. данные
        sellerYandexId: yandexId,
        sellerPassport: passport ? {
          fullName: passport.fullName,
          series: passport.series,
          number: passport.number,
          issuedBy: passport.issuedBy,
          issuedDate: passport.issuedDate,
          birthDate: passport.birthDate,
        } : null,
        sellerPassportPhotoUrl: passport?.photoUrl || null,
        avitoUrl,
        aiCheck: aiResult,
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
      {/* Быстрый старт */}
      <div className="bg-gradient-to-br from-[#FFD700]/[0.08] to-transparent border border-[#FFD700]/25 rounded-2xl p-3.5">
        <div className="text-xs uppercase tracking-wider font-bold text-[#FFD700] mb-2">⚡ Быстрый старт</div>
        <div className="grid grid-cols-2 gap-2">
          {yandexAvailable && (
            <button onClick={openYandexAuth}
              className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#FF0000] text-white font-bold text-sm hover:bg-[#cc0000] transition">
              <Icon name="LogIn" size={16} /> Войти через Яндекс ID
            </button>
          )}
          <button onClick={() => setAvitoModalOpen(true)}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[#0AF] to-[#0080FF] text-white font-bold text-sm hover:opacity-90 transition ${!yandexAvailable ? "col-span-2" : ""}`}>
            <Icon name="Download" size={16} /> Импорт с Авито
          </button>
        </div>
        <div className="text-[10px] text-[#777] mt-2 text-center">
          За 5 секунд — без ручного ввода
        </div>
      </div>

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
          <Field label="Email (необязательно)" full>
            <input value={sellerEmail} onChange={e => setSellerEmail(e.target.value)}
              className="input" placeholder="you@mail.ru" type="email" />
          </Field>
        </div>

        {/* Скан паспорта */}
        <div className="mt-4 pt-4 border-t border-[#2A2A2A]">
          <input ref={passportInputRef} type="file" accept="image/*" style={{ display: "none" }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleScanPassport(f); e.target.value = ""; }} />
          {!passport && (
            <button onClick={() => passportInputRef.current?.click()} disabled={passportScanning}
              className="w-full py-3 rounded-xl border-2 border-dashed border-[#FFD700]/40 text-[#FFD700] font-bold text-sm hover:border-[#FFD700] transition flex items-center justify-center gap-2 disabled:opacity-50">
              {passportScanning
                ? (<><Icon name="Loader2" size={14} className="animate-spin" /> Распознаём паспорт...</>)
                : (<><Icon name="ScanLine" size={14} /> Загрузить и распознать паспорт (ИИ)</>)}
            </button>
          )}
          {passport && (
            <div className="bg-emerald-500/[0.06] border border-emerald-500/30 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                  <Icon name="CheckCircle2" size={12} className="inline mr-1" /> Паспорт загружен
                </span>
                <button onClick={() => setPassport(null)} className="text-xs text-[#777] hover:text-[#FF453A]">
                  Заменить
                </button>
              </div>
              <div className="text-xs text-[#bbb] space-y-1">
                {passport.fullName && <div>ФИО: <span className="text-white">{passport.fullName}</span></div>}
                {(passport.series || passport.number) && <div>Серия/номер: <span className="text-white">{passport.series} {passport.number}</span></div>}
                {passport.issuedBy && <div>Кем выдан: <span className="text-white">{passport.issuedBy}</span></div>}
              </div>
            </div>
          )}
          <div className="text-[10px] text-[#666] mt-2 text-center">
            Паспорт нужен сотруднику для оформления при сделке. Видит только админ.
          </div>
        </div>
      </Section>

      <Section title="Фото товара" icon="Camera">
        <input ref={photoInputRef} type="file" multiple accept="image/*" style={{ display: "none" }}
          onChange={e => { addPhotos(Array.from(e.target.files || [])); e.target.value = ""; }} />
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {photos.map((p, i) => (
            <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-[#1C1C1C]">
              <img src={p.preview || p.url} alt="" className="absolute inset-0 w-full h-full object-cover" />
              <button onClick={() => removePhoto(i)}
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
          <button onClick={handleAiFill} disabled={aiFilling}
            className="mt-3 w-full py-3 rounded-xl bg-gradient-to-r from-[#B8A4FF] to-[#7AB8FF] text-black font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
            {aiFilling
              ? (<><Icon name="Loader2" size={14} className="animate-spin" /> Распознаём товар...</>)
              : (<><Icon name="Sparkles" size={14} /> Распознать по фото (ИИ заполнит поля)</>)}
          </button>
        )}
      </Section>

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

      {/* AI Check */}
      {productTitle && priceNum > 0 && (
        <Section title="ИИ-проверка качества заявки" icon="Sparkles">
          <button onClick={handleAiCheck} disabled={aiChecking}
            className="w-full py-3 rounded-xl border-2 border-[#FFD700]/40 text-[#FFD700] font-bold text-sm hover:border-[#FFD700] transition flex items-center justify-center gap-2 disabled:opacity-50">
            {aiChecking
              ? (<><Icon name="Loader2" size={14} className="animate-spin" /> Анализируем...</>)
              : (<><Icon name="ShieldCheck" size={14} /> Проверить заявку ИИ-модератором</>)}
          </button>
          {aiResult && <AiCheckBlock result={aiResult} />}
        </Section>
      )}

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

      {avitoModalOpen && (
        <AvitoImportModal
          onClose={() => setAvitoModalOpen(false)}
          onImport={handleAvitoImport}
        />
      )}
    </div>
  );
}

function AiCheckBlock({ result }: { result: AiCheckResult }) {
  const colorCls = {
    low: { bg: "bg-emerald-500/[0.06]", border: "border-emerald-500/30", text: "text-emerald-300", icon: "ShieldCheck" },
    medium: { bg: "bg-orange-500/[0.06]", border: "border-orange-500/30", text: "text-orange-300", icon: "AlertTriangle" },
    high: { bg: "bg-red-500/[0.06]", border: "border-red-500/30", text: "text-red-300", icon: "AlertCircle" },
    unknown: { bg: "bg-white/[0.04]", border: "border-white/15", text: "text-white/70", icon: "HelpCircle" },
  }[result.risk_level];
  const label = {
    low: "Всё отлично",
    medium: "Можно улучшить",
    high: "Есть подозрения",
    unknown: "Базовая проверка",
  }[result.risk_level];
  return (
    <div className={`mt-3 ${colorCls.bg} ${colorCls.border} border rounded-xl p-3.5`}>
      <div className={`text-xs font-bold uppercase tracking-wider ${colorCls.text} mb-2 flex items-center gap-1.5`}>
        <Icon name={colorCls.icon} size={13} /> {label}
      </div>
      <p className="text-sm text-[#ddd] mb-2">{result.summary}</p>
      {result.warnings.length > 0 && (
        <ul className="space-y-1 text-xs text-[#bbb]">
          {result.warnings.map((w, i) => (
            <li key={i} className="flex items-start gap-1.5">
              <Icon name="AlertCircle" size={11} className={`mt-0.5 shrink-0 ${colorCls.text}`} />
              <span>{w}</span>
            </li>
          ))}
        </ul>
      )}
      {result.suggestions.length > 0 && (
        <div className="mt-2 pt-2 border-t border-white/10">
          <div className="text-[10px] uppercase tracking-wider text-[#777] mb-1">Рекомендации</div>
          <ul className="space-y-1 text-xs text-[#bbb]">
            {result.suggestions.map((s, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <Icon name="Sparkles" size={11} className="mt-0.5 text-[#FFD700] shrink-0" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
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
