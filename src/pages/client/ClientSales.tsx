import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import funcUrls from "../../../backend/func2url.json";
import { fmtDate, fmtMoney } from "./clientTypes";

const URL = (funcUrls as Record<string, string>)["client-cabinet"];

type Sale = {
  id: number;
  title: string;
  category: string;
  brand: string | null;
  model: string | null;
  condition: string | null;
  purchase_price: number;
  sell_price: number;
  status: string;
  photo_url: string | null;
  added_at: string | null;
  sold_at: string | null;
  sale_amount: number | null;
  payment_method: string | null;
  sale_date: string | null;
};

const CONDITION_LABEL: Record<string, string> = {
  отличное: "Отличное",
  хорошее: "Хорошее",
  среднее: "Среднее",
  плохое: "Плохое",
};

const PAYMENT_LABEL: Record<string, string> = {
  cash: "Наличные",
  card: "Карта",
  transfer: "Перевод",
};

const STATUS_LABEL: Record<string, { text: string; color: string }> = {
  available: { text: "На продаже", color: "#3B82F6" },
  sold: { text: "Продано", color: "#10B981" },
  reserved: { text: "Резерв", color: "#A855F7" },
  returned: { text: "Возвращено", color: "#EF4444" },
};

export default function ClientSales({ token }: { token: string }) {
  const [items, setItems] = useState<Sale[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(URL, {
      method: "POST",
      headers: { "X-Client-Token": token, "Content-Type": "application/json" },
      body: JSON.stringify({ action: "my_sales" }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        if (d.error) setError(d.error);
        else setItems(d.sales || []);
      })
      .catch((e) => alive && setError(String(e)));
    return () => { alive = false; };
  }, [token]);

  if (error)
    return (
      <div className="px-3 py-2 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 text-xs flex items-center gap-2">
        <Icon name="AlertCircle" size={14} />{error}
      </div>
    );

  if (items === null)
    return (
      <div className="flex flex-col items-center py-16 gap-2 text-white/40">
        <Icon name="Loader" size={20} className="animate-spin text-[#FFD700]" />
        <span className="text-xs">Загружаю…</span>
      </div>
    );

  if (items.length === 0)
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#FFD700]/10 border border-[#FFD700]/20 flex items-center justify-center mb-2">
          <Icon name="PackageCheck" size={28} className="text-[#FFD700]/70" />
        </div>
        <div className="text-[15px] font-bold text-white">Истории сдачи пока нет</div>
        <div className="text-[12px] text-white/50 max-w-xs">
          Здесь появятся устройства, которые вы сдали нам в скупку или Trade-In.
        </div>
      </div>
    );

  const totalEarned = items
    .filter(i => i.sale_amount != null)
    .reduce((s, i) => s + (i.sale_amount || i.purchase_price || 0), 0);

  return (
    <div className="space-y-3">
      {/* Итог */}
      {totalEarned > 0 && (
        <div className="rounded-2xl bg-[#FFD700]/8 border border-[#FFD700]/20 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FFD700]/15 flex items-center justify-center">
            <Icon name="TrendingUp" size={18} className="text-[#FFD700]" />
          </div>
          <div>
            <div className="text-[11px] text-white/40 uppercase tracking-wide">Всего получено от нас</div>
            <div className="text-[18px] font-bold text-[#FFD700]">{fmtMoney(totalEarned)}</div>
          </div>
          <div className="ml-auto text-right">
            <div className="text-[11px] text-white/40 uppercase tracking-wide">Устройств</div>
            <div className="text-[18px] font-bold text-white">{items.length}</div>
          </div>
        </div>
      )}

      {items.map((s) => {
        const st = STATUS_LABEL[s.status] || { text: s.status, color: "#888" };
        const name = [s.brand, s.model].filter(Boolean).join(" ") || s.title;
        const paidOut = s.sale_amount ?? s.purchase_price;

        return (
          <div
            key={s.id}
            className="bg-gradient-to-br from-[#0E0E0E] to-[#080808] border border-[#1F1F1F] rounded-2xl overflow-hidden"
          >
            <div className="flex gap-3 p-4">
              {/* Фото */}
              <div className="w-14 h-14 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] shrink-0 overflow-hidden flex items-center justify-center">
                {s.photo_url ? (
                  <img src={s.photo_url} alt={name} className="w-full h-full object-cover" />
                ) : (
                  <Icon name="Smartphone" size={22} className="text-white/20" />
                )}
              </div>

              {/* Инфо */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-[14px] font-bold text-white leading-snug truncate">{name}</div>
                  <span
                    className="shrink-0 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide"
                    style={{ background: `${st.color}20`, color: st.color, border: `1px solid ${st.color}40` }}
                  >
                    {st.text}
                  </span>
                </div>
                <div className="text-[11px] text-white/40 mt-0.5 flex items-center gap-2 flex-wrap">
                  {s.category && <span>{s.category}</span>}
                  {s.condition && (
                    <><span>·</span><span>{CONDITION_LABEL[s.condition] || s.condition}</span></>
                  )}
                </div>
                <div className="text-[10px] text-white/30 mt-1">
                  Сдано {fmtDate(s.added_at)}
                </div>
              </div>
            </div>

            {/* Суммы */}
            <div className="px-4 pb-4 grid grid-cols-2 gap-2">
              <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-xl px-3 py-2">
                <div className="text-[9px] text-white/30 uppercase tracking-wide">Выплачено вам</div>
                <div className="text-[15px] font-bold text-[#FFD700] mt-0.5">
                  {fmtMoney(paidOut)}
                </div>
                {s.payment_method && (
                  <div className="text-[10px] text-white/30 mt-0.5">
                    {PAYMENT_LABEL[s.payment_method] || s.payment_method}
                  </div>
                )}
              </div>
              <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-xl px-3 py-2">
                <div className="text-[9px] text-white/30 uppercase tracking-wide">В нашем магазине</div>
                <div className="text-[15px] font-bold text-white/70 mt-0.5">
                  {fmtMoney(s.sell_price)}
                </div>
                {s.sold_at && (
                  <div className="text-[10px] text-[#10B981] mt-0.5">
                    Продано {fmtDate(s.sold_at)}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
