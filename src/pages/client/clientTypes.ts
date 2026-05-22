export type ClientProfile = {
  id: number;
  full_name: string;
  phone: string;
  email: string | null;
  email_verified?: boolean;
  login?: string | null;
  avatar_url: string | null;
  discount_pct: number;
  loyalty_points: number;
};

export type Repair = {
  id: number;
  created_at: string | null;
  name: string;
  model: string | null;
  repair_type: string | null;
  price: number | null;
  comment: string | null;
  status: string;
  status_updated_at: string | null;
  admin_note: string | null;
  completed_at: string | null;
  picked_up_at: string | null;
  advance: number;
  is_paid: boolean;
};

export type ContractItem = {
  type: string | null;
  brand: string | null;
  model: string | null;
  serial: string | null;
  condition: string | null;
  notes: string | null;
  accessories: string[];
};

export type Contract14d = {
  id: number;
  contract_number: string;
  amount: number;
  interest_rate: number;
  term_days: number;
  total_due: number;
  paid_total: number;
  remaining_debt: number;
  start_date: string | null;
  end_date: string | null;
  days_left: number | null;
  status: string;
  created_at: string | null;
  item: ContractItem;
  client_full_name: string;
};

export type Offer = {
  id: number;
  category: 'skupka' | 'repair' | 'lombard' | 'other';
  title: string;
  description: string | null;
  expected_price: number | null;
  contact_phone: string | null;
  photos: string[];
  status: 'new' | 'viewed' | 'in_progress' | 'accepted' | 'rejected';
  admin_reply: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type Summary = {
  repairs: { total: number; active: number };
  contracts: { total: number; active: number; amount_active: number };
  offers: { total: number; new: number };
};

export const REPAIR_STATUS_LABELS: Record<string, { text: string; color: string }> = {
  new: { text: 'Принят', color: '#FFD700' },
  accepted: { text: 'Принят', color: '#FFD700' },
  in_progress: { text: 'В ремонте', color: '#3B82F6' },
  waiting_parts: { text: 'Ждём запчасти', color: '#A855F7' },
  ready: { text: 'Готов к выдаче', color: '#10B981' },
  completed: { text: 'Выдан', color: '#10B981' },
  cancelled: { text: 'Отменён', color: '#EF4444' },
};

export const OFFER_CATEGORY_LABELS: Record<string, string> = {
  skupka: 'Сдать в скупку',
  repair: 'Хочу отремонтировать',
  lombard: 'Заложить в ломбард',
  other: 'Другое',
};

export const OFFER_STATUS_LABELS: Record<string, { text: string; color: string }> = {
  new: { text: 'На рассмотрении', color: '#FFD700' },
  viewed: { text: 'Просмотрено', color: '#3B82F6' },
  in_progress: { text: 'В работе', color: '#A855F7' },
  accepted: { text: 'Принято', color: '#10B981' },
  rejected: { text: 'Отклонено', color: '#EF4444' },
};

export const fmtMoney = (n: number | null | undefined) =>
  (n ?? 0).toLocaleString('ru-RU', { maximumFractionDigits: 0 }) + ' ₽';

export const fmtDate = (s: string | null) =>
  s ? new Date(s).toLocaleDateString('ru-RU') : '—';