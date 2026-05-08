export const PHOTOS_URL = "https://functions.poehali.dev/4e286b87-fc23-49ef-9b77-22611bb6e1f9";
export const SYNC_URL = "https://functions.poehali.dev/49e23745-1449-4e4c-80c2-e7967f3c5584";

export type AvitoProduct = {
  id: number;
  avito_id: number;
  title: string;
  price: number | null;
  url: string;
  category: string | null;
  photos: string[];
  main_photo: string | null;
  description: string | null;
  is_visible: boolean;
  sort_order: number;
};

export type Stats = { with_photos: number; no_photos: number; total_active: number };
export type FilterMode = "no" | "yes" | "all";

export const formatPrice = (p: number | null) => (p ? p.toLocaleString("ru-RU") + " ₽" : "—");

export async function compressImage(file: File, maxSize = 1600, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Не удалось прочитать файл"));
    reader.onload = ev => {
      const img = new Image();
      img.onerror = () => reject(new Error("Не удалось открыть изображение"));
      img.onload = () => {
        let { width: w, height: h } = img;
        if (w > maxSize || h > maxSize) {
          if (w > h) {
            h = Math.round((h * maxSize) / w);
            w = maxSize;
          } else {
            w = Math.round((w * maxSize) / h);
            h = maxSize;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas недоступен"));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}
