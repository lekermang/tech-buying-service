/** Форма подачи заявки продавцом.
 * Расширенные возможности:
 * - Быстрая регистрация Яндекс ID (авто-заполнение ФИО/email/телефон)
 * - Импорт объявления с Авито (название, цена, описание, фото)
 * - ИИ-распознавание товара по фото (название, бренд, модель, состояние)
 * - ИИ-проверка на признаки мошенничества (после загрузки фото)
 * - Скан паспорта (OCR через GPT-4o)
 * - Категории из БД (slshop_categories)
 */
import { useEffect, useState } from "react";
import { toast } from "sonner";
import Icon from "@/components/ui/icon";
import {
  apiCall, COMMISSION_PCT, OFFICE_ADDRESS, REALIZATION_DAYS, saveSellerToken,
  listCategories, uploadTempPhoto, aiFill, aiCheck, scanPassport, getYandexConfig, yandexAuth, aiPrice,
  type CreateResponse, type CategoryItem, type AiCheckResult, type AvitoParsed, type PassportData, type AiPriceResult,
} from "./api";
import AvitoImportModal from "./AvitoImportModal";
import { fileToBase64Compressed, type PhotoItem } from "./sellerForm/primitives";
import { QuickStartBlock, SellerInfoSection } from "./sellerForm/SellerInfoSection";
import {
  PhotoUploadSection, ProductFieldsSection, PriceSection, AiCheckSection,
} from "./sellerForm/ProductSections";

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

  // ─── courier (выкуп за 1 час) + реферал ───
  const [courierPickup, setCourierPickup] = useState(false);
  const [courierAddress, setCourierAddress] = useState("");
  const [referrerToken, setReferrerToken] = useState<string | null>(null);

  // ─── photos ───
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [photoUploading, setPhotoUploading] = useState(false);

  // ─── passport ───
  const [passport, setPassport] = useState<PassportData | null>(null);
  const [passportScanning, setPassportScanning] = useState(false);

  // ─── ai check ───
  const [aiResult, setAiResult] = useState<AiCheckResult | null>(null);
  const [aiChecking, setAiChecking] = useState(false);
  const [aiFilling, setAiFilling] = useState(false);

  // ─── ai price ───
  const [priceResult, setPriceResult] = useState<AiPriceResult | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);

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
    // Реферальный токен из URL ?ref=XXXX
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) setReferrerToken(ref);
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
      toast.error("Яндекс ID временно недоступен. Войдите вручную или используйте Импорт с Авито.");
      return;
    }
    const redirectUri = `${window.location.origin}/safe-deals/yandex-callback`;
    const authUrl =
      `https://oauth.yandex.ru/authorize?response_type=code` +
      `&client_id=${encodeURIComponent(yandexClientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}`;
    const popup = window.open(authUrl, "yandex_oauth", "width=520,height=640");
    if (!popup) {
      toast.error("Браузер заблокировал попап. Разрешите всплывающие окна для сайта.");
    }
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

  const handleAiPrice = async () => {
    if (!productTitle.trim() && !productModel.trim()) {
      toast.error("Сначала укажите название или модель"); return;
    }
    setPriceLoading(true);
    const r = await aiPrice({
      productTitle, productBrand, productModel, productCondition,
      productDescription: description,
      photoUrls: photos.map(p => p.url),
    });
    setPriceLoading(false);
    if (!r.ok || !r.data) { toast.error(r.error || "Ошибка"); return; }
    setPriceResult(r.data);
    if (!price && r.data.fair_price) {
      setPrice(String(r.data.fair_price));
      toast.success("Цена установлена по рынку");
    } else {
      toast.success("Оценка готова");
    }
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
        referrerToken,
        courierPickup,
        courierAddress: courierPickup ? courierAddress.trim() : null,
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
    // Аналитика /staff/analytics: фиксируем конверсию (безопасная сделка)
    try {
      (window as unknown as { skypkaConvert?: (d: Record<string, unknown>) => void }).skypkaConvert?.({
        type: "safe_deal",
        form_type: "safe_deal",
        phone: sellerPhone.trim(),
        amount: priceNum,
        deal_number: r.data.dealNumber,
        name: sellerName.trim(),
        product: productTitle.trim(),
      });
    } catch { /* noop */ }
    toast.success(`Заявка ${r.data.dealNumber} принята!`);
    onSubmitted(r.data.sellerToken, r.data);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-5 py-6 space-y-5">
      <QuickStartBlock
        yandexAvailable={yandexAvailable}
        onYandex={openYandexAuth}
        onAvito={() => setAvitoModalOpen(true)}
      />

      <SellerInfoSection
        sellerName={sellerName} setSellerName={setSellerName}
        sellerPhone={sellerPhone} setSellerPhone={setSellerPhone}
        sellerEmail={sellerEmail} setSellerEmail={setSellerEmail}
        passport={passport} setPassport={setPassport}
        passportScanning={passportScanning}
        onScanPassport={handleScanPassport}
      />

      <PhotoUploadSection
        photos={photos}
        onAddPhotos={addPhotos}
        onRemovePhoto={removePhoto}
        photoUploading={photoUploading}
        aiFilling={aiFilling}
        onAiFill={handleAiFill}
      />

      <ProductFieldsSection
        productTitle={productTitle} setProductTitle={setProductTitle}
        productCategoryId={productCategoryId} setProductCategoryId={setProductCategoryId}
        setProductCategoryName={setProductCategoryName}
        productCondition={productCondition} setProductCondition={setProductCondition}
        productBrand={productBrand} setProductBrand={setProductBrand}
        productModel={productModel} setProductModel={setProductModel}
        productSerial={productSerial} setProductSerial={setProductSerial}
        description={description} setDescription={setDescription}
        categories={categories}
      />

      <PriceSection
        price={price} setPrice={setPrice}
        priceNum={priceNum} commission={commission} payout={payout}
        priceResult={priceResult} priceLoading={priceLoading} onAiPrice={handleAiPrice}
        paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod}
        payoutMethod={payoutMethod} setPayoutMethod={setPayoutMethod}
        payoutDetails={payoutDetails} setPayoutDetails={setPayoutDetails}
      />

      <AiCheckSection
        productTitle={productTitle} priceNum={priceNum}
        aiResult={aiResult} aiChecking={aiChecking} onAiCheck={handleAiCheck}
      />

      {/* Выкуп за 1 час — курьер */}
      <div className="bg-gradient-to-br from-orange-500/[0.08] to-transparent border border-orange-500/30 rounded-2xl p-4">
        <label className="flex items-start gap-2.5 cursor-pointer">
          <input type="checkbox" checked={courierPickup} onChange={e => setCourierPickup(e.target.checked)} className="mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Icon name="Truck" size={14} className="text-orange-300" />
              <span className="text-sm font-bold text-orange-300">Выкуп за 1 час · курьер к вам</span>
              <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-orange-500/15 text-orange-300 font-bold">+400 ₽</span>
            </div>
            <div className="text-xs text-[#999] leading-relaxed">
              Не можете приехать в офис? Наш курьер заберёт товар у вас в течение часа. Калуга и пригороды.
            </div>
          </div>
        </label>
        {courierPickup && (
          <input value={courierAddress} onChange={e => setCourierAddress(e.target.value)}
            placeholder="Адрес: улица, дом, квартира"
            className="input mt-3" />
        )}
      </div>

      <div className="bg-[#FFD700]/[0.06] border border-[#FFD700]/[0.2] rounded-2xl px-4 py-3.5 text-sm text-[#ddd] leading-relaxed">
        <Icon name="Shield" size={14} className="inline mr-1.5 text-[#FFD700]" />
        Срок реализации — <b>{REALIZATION_DAYS} дней</b>. Сделки проходят только в офисе{" "}
        <b>{OFFICE_ADDRESS}</b>. Если товар не продан — забираете его обратно без штрафов.
      </div>

      {referrerToken && (
        <div className="bg-emerald-500/[0.06] border border-emerald-500/30 rounded-2xl px-4 py-2.5 text-xs text-emerald-300">
          <Icon name="Users" size={12} className="inline mr-1.5" />
          Реферал активирован. Друг, который пригласил вас, получит бонус с этой сделки.
        </div>
      )}

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