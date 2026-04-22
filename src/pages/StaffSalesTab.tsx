import { useState, useEffect } from "react";
import { SALES_URL, type Sale } from "./staff.types";

export function SalesTab({ token }: { token: string }) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`${SALES_URL}?action=list`, { headers: { "X-Employee-Token": token } })
      .then(r => r.json()).then(d => { setSales(d.sales || []); setLoading(false); }).catch(() => setLoading(false));
  }, [token]);

  const TYPE_LABELS: Record<string, string> = { goods: "Продажа", repair: "Ремонт", purchase: "Закупка" };

  return (
    <div className="p-4">
      <div className="font-oswald font-bold uppercase text-sm text-white mb-3">Продажи <span className="text-white/40">({sales.length})</span></div>
      {loading ? <div className="text-center py-8 text-white/30 text-sm">Загружаю...</div> :
        sales.length === 0 ? <div className="text-center py-8 text-white/30 font-roboto text-sm">Продаж пока нет</div> :
        <div className="space-y-2">
          {sales.map(s => (
            <div key={s.id} className="bg-[#1A1A1A] border border-[#2A2A2A] px-3 py-2.5">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-oswald font-bold text-[#FFD700] text-sm">#{s.id}</span>
                  <span className="font-roboto text-[10px] text-white/40 border border-white/10 px-1.5 py-0.5">{TYPE_LABELS[s.type] || s.type}</span>
                </div>
                <span className="font-oswald font-bold text-white">{s.amount.toLocaleString("ru-RU")} ₽</span>
              </div>
              <div className="font-roboto text-xs text-white/60">{s.client || "Без клиента"} {s.phone ? `· ${s.phone}` : ""}</div>
              <div className="flex justify-between mt-1">
                <span className="font-roboto text-[10px] text-white/30">{s.contract || "—"}</span>
                <span className="font-roboto text-[10px] text-white/30">{s.date ? new Date(s.date).toLocaleDateString("ru-RU") : ""}</span>
              </div>
            </div>
          ))}
        </div>}
    </div>
  );
}
