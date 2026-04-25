export const TG_PARSER_URL = "https://functions.poehali.dev/2e98b33f-0f6a-4bc3-9c93-6bbb80277fac";
export const TG_AUTO_SYNC_URL = "https://functions.poehali.dev/79437e4a-387b-4d66-952b-a6e8e8d627a2";
export const PHOTOS_URL = "https://functions.poehali.dev/76998fa9-f1f9-4986-8449-ecfe56cc3ee8";
export const PRICE_SCHEDULER_URL = "https://functions.poehali.dev/b09271ea-c662-4225-973f-4dd4c6a0e32c";
export const AUTO_INTERVAL = 5 * 60; // 5 минут

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
