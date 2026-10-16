import { useEffect, useState } from "react";
import funcUrls from "../../../../backend/func2url.json";

const GOLD_PRICE_URL = (funcUrls as Record<string, string>)["gold-price"];

export type GoldNewsItem = { title: string; url: string; source: string; ts: string };

let cache: { at: number; items: GoldNewsItem[] } | null = null;

export function useGoldNews(enabled: boolean) {
  const [items, setItems] = useState<GoldNewsItem[]>(cache?.items || []);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    if (cache && Date.now() - cache.at < 5 * 60 * 1000) { setItems(cache.items); return; }
    let alive = true;
    setLoading(true);
    fetch(`${GOLD_PRICE_URL}?action=news`)
      .then(r => r.json())
      .then(d => {
        const list: GoldNewsItem[] = (d.news || []).slice(0, 5);
        cache = { at: Date.now(), items: list };
        if (alive) setItems(list);
      })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [enabled]);

  return { items, loading };
}
