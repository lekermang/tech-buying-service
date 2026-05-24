export const SAFE_DEALS_API = "https://functions.poehali.dev/00eed6a0-e6ef-4615-bc13-1d9879dc1c68";
export const OFFICE_ADDRESS = "г. Калуга, ул. Кирова, 11";
export const COMMISSION_PCT = 10;
export const REALIZATION_DAYS = 14;

export type DealStatus =
  | "submitted"
  | "review"
  | "on_shelf"
  | "reserved"
  | "completed"
  | "cancelled"
  | "returned";

export const STATUS_LABEL: Record<DealStatus, { label: string; cls: string; icon: string }> = {
  submitted:  { label: "Заявка подана",   cls: "bg-blue-500/15 text-blue-300 border-blue-500/30", icon: "FileText" },
  review:     { label: "На проверке",     cls: "bg-orange-500/15 text-orange-300 border-orange-500/30", icon: "Eye" },
  on_shelf:   { label: "На витрине",      cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30", icon: "Store" },
  reserved:   { label: "Зарезервировано", cls: "bg-purple-500/15 text-purple-300 border-purple-500/30", icon: "Bookmark" },
  completed:  { label: "Сделка завершена",cls: "bg-emerald-600/20 text-emerald-200 border-emerald-600/40", icon: "CheckCircle2" },
  cancelled:  { label: "Отменено",        cls: "bg-red-500/15 text-red-300 border-red-500/30", icon: "X" },
  returned:   { label: "Возврат продавцу",cls: "bg-gray-500/15 text-gray-300 border-gray-500/30", icon: "RotateCcw" },
};

export type SafeDealDetail = {
  id: number;
  deal_number: string;
  seller_token: string;
  qr_code: string;
  status: DealStatus;
  seller_name: string;
  seller_phone: string;
  seller_email?: string | null;
  product_title: string;
  product_brand?: string | null;
  product_model?: string | null;
  product_category?: string | null;
  product_condition?: string | null;
  product_description?: string | null;
  product_serial?: string | null;
  price: number;
  commission_pct: number;
  commission_amount: number;
  seller_payout: number;
  payment_method: string;
  payout_method: string;
  payout_details?: string | null;
  photos: { url: string; uploaded_at?: string }[];
  office_check_notes?: string | null;
  office_checked_by?: string | null;
  office_checked_at?: string | null;
  buyer_name?: string | null;
  buyer_phone?: string | null;
  reservation_until?: string | null;
  completed_at?: string | null;
  cancel_reason?: string | null;
  created_at: string;
  updated_at: string;
  expires_at: string;
  events: { id: number; event_type: string; details: Record<string, unknown>; actor?: string | null; created_at: string }[];
};

export type SafeDealPublic = {
  dealNumber: string;
  status: DealStatus;
  productTitle: string;
  productBrand?: string | null;
  productModel?: string | null;
  productCategory?: string | null;
  productCondition?: string | null;
  productDescription?: string | null;
  photos: { url: string }[];
  price: number;
  sellerNameMasked: string;
  officeCheckNotes?: string | null;
  officeCheckedAt?: string | null;
  createdAt: string;
  isFeatured?: boolean;
};

export type CreateResponse = {
  dealNumber: string;
  sellerToken: string;
  qrCode: string;
  commissionPct: number;
  commissionAmount: number;
  sellerPayout: number;
  realizationDays: number;
  officeAddress: string;
  photosUploaded: number;
};

export async function apiCall<T = unknown>(
  action: string,
  opts: { method?: "GET" | "POST"; params?: Record<string, string>; body?: unknown } = {},
): Promise<{ ok: boolean; data: T | null; error?: string }> {
  const method = opts.method || "GET";
  const url = new URL(SAFE_DEALS_API);
  url.searchParams.set("action", action);
  Object.entries(opts.params || {}).forEach(([k, v]) => url.searchParams.set(k, v));
  try {
    const init: RequestInit = {
      method,
      headers: method === "POST" ? { "Content-Type": "application/json" } : undefined,
      body: method === "POST" ? JSON.stringify(opts.body || {}) : undefined,
    };
    const r = await fetch(url.toString(), init);
    const d = await r.json().catch(() => ({}));
    if (!r.ok || d.error) return { ok: false, data: null, error: d.error || `HTTP ${r.status}` };
    return { ok: true, data: d as T };
  } catch (e) {
    return { ok: false, data: null, error: e instanceof Error ? e.message : String(e) };
  }
}

export const fmtRub = (n: number | string | null | undefined): string => {
  const v = Number(n) || 0;
  return v.toLocaleString("ru-RU", { maximumFractionDigits: 0 }) + " ₽";
};

export const fmtDate = (s: string | null | undefined): string => {
  if (!s) return "";
  try { return new Date(s).toLocaleString("ru-RU"); } catch { return s; }
};

export type CategoryItem = {
  id: number;
  name: string;
  slug: string;
  icon: string;
  color: string;
  parent_id?: number | null;
  depth?: number;
};

export type AvitoParsed = {
  title: string;
  price: number;
  description: string;
  category?: string | null;
  photos: string[];
  url: string;
};

export type AiCheckResult = {
  risk_level: "low" | "medium" | "high" | "unknown";
  warnings: string[];
  suggestions: string[];
  summary: string;
};

export type AiFillResult = {
  title: string;
  brand: string;
  model: string;
  category: string;
  condition: string;
  description: string;
  price_hint: number;
};

export type ShopItem = SafeDealPublic;

export async function parseAvitoUrl(url: string) {
  return apiCall<AvitoParsed>("parse_avito", { method: "POST", body: { url } });
}

export async function aiCheck(params: {
  productTitle: string;
  productDescription?: string;
  price?: number;
  photoUrls?: string[];
}) {
  return apiCall<AiCheckResult>("ai_check", { method: "POST", body: params });
}

export async function aiFill(photoUrls: string[]) {
  return apiCall<AiFillResult>("ai_fill", { method: "POST", body: { photoUrls } });
}

export async function uploadTempPhoto(fileBase64: string) {
  return apiCall<{ url: string; s3_key: string }>("upload_photo", {
    method: "POST",
    body: { fileBase64 },
  });
}

export async function listCategories() {
  return apiCall<{ items: CategoryItem[] }>("categories");
}

export async function listShop() {
  return apiCall<{ items: ShopItem[] }>("shop");
}

export async function getYandexConfig() {
  return apiCall<{ clientId: string; available: boolean }>("yandex_config");
}

export type YandexAuthData = {
  fullName: string;
  email: string;
  phone: string;
  yandexId: string;
};

export async function yandexAuth(code: string, redirectUri: string) {
  return apiCall<YandexAuthData>("yandex_auth", {
    method: "POST",
    body: { code, redirect_uri: redirectUri },
  });
}

export type PassportData = {
  fullName: string;
  series: string;
  number: string;
  issuedBy: string;
  issuedDate: string;
  birthDate: string;
  photoUrl: string;
};

export async function scanPassport(fileBase64: string) {
  return apiCall<PassportData>("scan_passport", {
    method: "POST",
    body: { fileBase64 },
  });
}

export type AiPriceResult = {
  fast_price: number;
  fair_price: number;
  top_price: number;
  days_to_sell: number;
  summary: string;
};

export async function aiPrice(params: {
  productTitle: string;
  productBrand?: string;
  productModel?: string;
  productCondition?: string;
  productDescription?: string;
  photoUrls?: string[];
}) {
  return apiCall<AiPriceResult>("ai_price", { method: "POST", body: params });
}

export async function featureDeal(token: string) {
  return apiCall<{ ok: boolean; amount: number; days: number }>("feature_deal", {
    method: "POST",
    body: { token },
  });
}

export type BlacklistEntry = {
  id: number;
  kind: string;
  masked: string;
  reason: string | null;
  role: "seller" | "buyer";
  incidents: number;
  createdAt: string | null;
};

export async function listBlacklist() {
  return apiCall<{ items: BlacklistEntry[]; count: number }>("blacklist_public");
}

export type ShopItemFull = ShopItem & {
  qrCode?: string;
  paymentMethod?: string;
  payoutMethod?: string;
  expiresAt?: string;
};

export async function getItemByNumber(number: string) {
  return apiCall<ShopItemFull>("item_view", { params: { number } });
}

export async function subscribeLead(contact: string, source = "checklist") {
  return apiCall<{ ok: boolean; downloadUrl: string }>("subscribe_lead", {
    method: "POST",
    body: { contact, source },
  });
}

export type PaymentPurpose = "feature" | "courier";

export async function createPayment(purpose: PaymentPurpose, token: string, returnUrl: string) {
  return apiCall<{ paymentId: string; confirmationUrl: string; status: string; amount: number }>(
    "create_payment",
    { method: "POST", body: { purpose, token, returnUrl } }
  );
}

export async function paymentStatus(paymentId: string) {
  return apiCall<{ status: string; purpose: string; amount: number }>(
    "payment_status",
    { params: { payment_id: paymentId } }
  );
}

/** Универсальная оплата ЮКассой — для любого purpose с произвольной суммой.
 * После оплаты webhook от ЮKassa приходит на сервер; фронт может проверить
 * статус через paymentStatus(paymentId). */
export async function createUniversalPayment(params: {
  purpose: string;
  amount: number;
  description: string;
  returnUrl: string;
  contextId?: string;
  contactInfo?: string;
}) {
  return apiCall<{ paymentId: string; confirmationUrl: string; status: string; amount: number }>(
    "create_payment_any",
    { method: "POST", body: params }
  );
}

/** localStorage — храним токены продавца, чтобы при возврате сразу видеть свои сделки. */
const LS_KEY = "skupka_safe_deals_tokens";
export function loadSellerTokens(): { token: string; dealNumber: string; title: string; createdAt: string }[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
export function saveSellerToken(item: { token: string; dealNumber: string; title: string; createdAt: string }) {
  const list = loadSellerTokens().filter(x => x.token !== item.token);
  list.unshift(item);
  try { localStorage.setItem(LS_KEY, JSON.stringify(list.slice(0, 20))); } catch { /* ignore */ }
}