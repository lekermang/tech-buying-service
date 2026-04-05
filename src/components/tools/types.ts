export interface Product {
  article: string; name: string; brand: string; category: string;
  base_price: number; discount_price: number; amount: string;
  image_url: string; is_hit: boolean; is_new: boolean;
}

export interface CartItem extends Product { qty: number; }

export interface CatMeta { name: string; count: number; }

export const fmt = (n: number) =>
  n > 0 ? n.toLocaleString("ru-RU", { maximumFractionDigits: 0 }) + " ₽" : "—";

export const disc = (p: Product) =>
  p.base_price > 0 && p.discount_price > 0 && p.base_price > p.discount_price
    ? Math.round((1 - p.discount_price / p.base_price) * 100) : 0;
