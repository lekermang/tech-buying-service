export const AVITO_URL = "https://functions.poehali.dev/d46cee41-3a2e-4973-a236-29fa6b90b7ce";
export const SYNC_URL = "https://functions.poehali.dev/49e23745-1449-4e4c-80c2-e7967f3c5584";
export const LEAD_URL = "https://functions.poehali.dev/52666ff7-db52-4b6a-a90e-d60aeed699de";

export type AvitoItem = {
  id: number;
  avito_id: number;
  title: string;
  price: number | null;
  url: string;
  address: string | null;
  category: string | null;
  main_photo: string | null;
  photos: string[];
  description?: string;
  avito_status?: string;
};

export type Category = { name: string; count: number };
export type Sort = "fresh" | "price_asc" | "price_desc";

export const formatPrice = (p: number | null | undefined) =>
  p ? p.toLocaleString("ru-RU") + " ₽" : "Цена по запросу";
