export const REPAIR_ORDER_URL = "https://functions.poehali.dev/8d0ee3bd-41eb-44fe-9d30-aab6ddc2042d";
export const REPAIR_STATUS_URL = "https://functions.poehali.dev/1fb5db63-4cb6-41be-af0f-80d6f9ce8fdf";
export const REPAIR_PARTS_URL = "https://functions.poehali.dev/68da5b17-ae5f-4568-8e27-0d945b995d82";

export const STATUS_COLOR: Record<string, string> = {
  new: "text-white/60",
  accepted: "text-purple-400",
  in_progress: "text-blue-400",
  waiting_parts: "text-orange-400",
  ready: "text-[#FFD700]",
  done: "text-green-400",
  warranty: "text-teal-400",
  cancelled: "text-red-400",
};

export const PART_TYPE_LABEL: Record<string, string> = {
  display: "Дисплей",
  battery: "Аккумулятор",
  glass: "Стекло / тачскрин",
  camera_glass: "Стекло камеры",
  flex_board: "Шлейф / плата",
  accessory: "Прочее",
};

export const QUALITY_COLOR: Record<string, string> = {
  ORIG: "text-[#FFD700]",
  AAA: "text-green-400",
  AA: "text-blue-400",
  A: "text-white/50",
};

export const INP = "w-full bg-[#0D0D0D] border border-[#333] text-white px-3 py-2 font-roboto text-xs focus:outline-none focus:border-[#FFD700] transition-colors";

export const STATIC_EXTRAS = [
  { id: "wl1", label: "Восстановление влагозащиты", price: 700 },
  { id: "wl2", label: "Чистка динамиков", price: 200 },
  { id: "wl3", label: "Убрать окисления", price: 500 },
  { id: "wl4", label: "Установка защитного стекла", price: 1000 },
  { id: "wl5", label: "Восстановление модема iPhone", price: 5000 },
];

export type ExtraWork = { id: number; label: string; price: number };

export type Part = {
  id: string; name: string; category: string;
  price: number; stock: number; quality: string;
  part_type: string; labor_cost: number; total: number;
  is_latest_batch?: boolean;
  supplier_price?: number | null;
};

export type OrderStatus = {
  id: number; name: string; model: string; repair_type: string;
  status: string; status_label: string; admin_note: string | null;
};

export type ClientInfo = { found: boolean; full_name?: string; discount_pct: number };