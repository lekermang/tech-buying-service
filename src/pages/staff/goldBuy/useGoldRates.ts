import { useCallback, useEffect, useState } from "react";
import funcUrls from "../../../../backend/func2url.json";

const GOLD_PRICE_URL = (funcUrls as Record<string, string>)["gold-price"];

export const PURITIES = [999, 958, 916, 900, 875, 850, 750, 585, 500, 375];

export type Exchange = {
  buy: number;
  xau_usd: number;
  usd_rub: number;
  date: string;
  settings: { retail_discount: number; retail_deduction: number };
};

export type Competitor = {
  source: string;
  url: string;
  note: string;
  prices: Record<string, number>;
  updated_at: string;
};

export const coef = (purity: number) => purity / 1000;
export const exchangePrice = (ex: Exchange | null, purity: number) =>
  ex ? Math.round(ex.buy * coef(purity)) : null;
export const ourPrice = (ex: Exchange | null, purity: number) =>
  ex
    ? Math.round(
        ex.buy * coef(purity) * (1 - (ex.settings.retail_discount ?? 15) / 100) -
          (ex.settings.retail_deduction ?? 0),
      )
    : null;

export const rub = (v: number | null | undefined) =>
  v == null ? "—" : Math.round(v).toLocaleString("ru-RU") + " ₽";

export function useGoldRates() {
  const [exchange, setExchange] = useState<Exchange | null>(null);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(GOLD_PRICE_URL);
      const d = await r.json();
      if (typeof d.buy === "number") {
        setExchange({
          buy: d.buy,
          xau_usd: d.xau_usd,
          usd_rub: d.usd_rub,
          date: d.date || "",
          settings: {
            retail_discount: Number(d.settings?.retail_discount ?? 15),
            retail_deduction: Number(d.settings?.retail_deduction ?? 0),
          },
        });
        setUpdatedAt(new Date());
      }
    } catch {
      /* ignore */
    }
    setLoading(false);
    try {
      const r2 = await fetch(`${GOLD_PRICE_URL}?action=competitors`);
      const d2 = await r2.json();
      if (d2.ok && Array.isArray(d2.competitors)) setCompetitors(d2.competitors);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    reload();
    const id = setInterval(reload, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [reload]);

  return { exchange, competitors, loading, updatedAt, reload };
}
