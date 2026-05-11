export const PHOTOS_URL = "https://functions.poehali.dev/06375f20-54a8-439c-921c-6cff0f1cecf2";
export const PRICE_SCHEDULER_URL = "https://functions.poehali.dev/b09271ea-c662-4225-973f-4dd4c6a0e32c";

export type CatalogItem = {
  id: number;
  brand: string;
  model: string;
  color: string | null;
  storage: string | null;
  region: string | null;
  category: string;
  price: number | null;
  availability: string;
  photo_url: string | null;
  photo_count: number;
  can_add: boolean;
};

export type PhotoItem = {
  id: number;
  url: string;
  sort_order: number;
  product_name: string;
};