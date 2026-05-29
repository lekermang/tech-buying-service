import { useEffect, useState, useCallback } from "react";
import { slApi, type SLStats, type SLSoldItem, type SLBoughtItem } from "./types";

export type SLDashboardState = {
  data: SLStats | null;
  sold: SLSoldItem[];
  bought: SLBoughtItem[];
  loading: boolean;
  err: string | null;
  load: () => void;
};

export function useSLDashboardData(token: string, period: string): SLDashboardState {
  const [data, setData] = useState<SLStats | null>(null);
  const [sold, setSold] = useState<SLSoldItem[]>([]);
  const [bought, setBought] = useState<SLBoughtItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setErr(null);
    const [r1, r2, r3] = await Promise.all([
      slApi<SLStats>(token, "stats", { params: { period } }),
      slApi<SLSoldItem[]>(token, "sold", { params: { period } }),
      slApi<SLBoughtItem[]>(token, "bought", { params: { period } }),
    ]);
    if (r1.ok && r1.data) setData(r1.data);
    else setErr(r1.error || "Ошибка");
    if (r2.ok && r2.data) setSold(r2.data);
    if (r3.ok && r3.data) setBought(r3.data);
    setLoading(false);
  }, [token, period]);

  useEffect(() => { load(); }, [load]);

  return { data, sold, bought, loading, err, load };
}
