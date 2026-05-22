import funcUrls from "../../../../backend/func2url.json";

export const STAFF_CLIENTS_URL = (funcUrls as Record<string, string>)["staff-clients"];

export type Filter = "" | "with_email" | "verified" | "no_passport";

export type ClientRow = {
  id: number;
  full_name: string;
  phone: string;
  email: string | null;
  email_verified: boolean;
  passport_series: string | null;
  passport_number: string | null;
  address: string | null;
  discount_pct: number;
  loyalty_points: number;
  registered_at: string | null;
  last_login_at: string | null;
  client_group: string | null;
  avatar_url: string | null;
  notes: string | null;
  has_passport: boolean;
};

export type ClientFull = ClientRow & {
  passport_issued_by: string | null;
  passport_issued_date: string | null;
  stats?: { repairs_total: number; repairs_active: number; offers_total: number };
};

export const formatDate = (s: string | null) => {
  if (!s) return "—";
  try {
    const d = new Date(s);
    return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit" });
  } catch {
    return s;
  }
};
