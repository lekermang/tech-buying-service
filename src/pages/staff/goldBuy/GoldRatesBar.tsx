import { useState } from "react";
import Icon from "@/components/ui/icon";
import GoldBuyModal from "./GoldBuyModal";
import { PURITIES, coef, exchangePrice, ourPrice, rub, useGoldRates } from "./useGoldRates";

export default function GoldRatesBar({ token }: { token: string }) {
  const rates = useGoldRates();
  const { exchange, competitors, loading, updatedAt, reload } = rates;
  const [open, setOpen] = useState(false);
  const [buyOpen, setBuyOpen] = useState(false);

  const sun = competitors.find(c => c.source === "SUNLIGHT");
  const sun585 = sun?.prices["585"];
  const our585 = ourPrice(exchange, 585);

  return (
    <div className="sticky top-0 z-20 border-b border-[#FFD700]/20"
      style={{ background: "rgba(10,8,3,0.96)", backdropFilter: "blur(8px)" }}>
      <div className="flex items-center gap-2 px-3 py-1.5">
        <button onClick={() => setOpen(o => !o)} className="flex-1 min-w-0 flex items-center gap-1.5 text-left">
          <Icon name="Gem" size={14} className="text-[#FFD700] shrink-0" />
          <span className="min-w-0 truncate text-[11px] sm:text-xs font-roboto text-white/80">
            <b className="text-[#FFD700]">Биржа {exchange ? rub(exchange.buy) : "…"}</b>
            <span className="text-white/40"> · 585: </span>
            мы <b className="text-white">{rub(our585)}</b>
            <span className="text-white/40"> / </span>
            SUNLIGHT <b className="text-emerald-400">{sun585 ? rub(sun585) : "…"}</b>
          </span>
          <Icon name="ChevronDown" size={14} className={`text-white/40 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        <button onClick={() => setBuyOpen(true)}
          className="shrink-0 flex items-center gap-1 px-3 h-8 rounded-lg bg-gradient-to-b from-[#FFD700] to-yellow-500 text-black font-oswald font-bold text-[11px] uppercase active:scale-95 transition-transform">
          <Icon name="Plus" size={13} /> Купить золото
        </button>
      </div>

      {open && (
        <div className="px-3 pb-3 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-3 gap-2 mb-2">
            <div className="rounded-lg bg-white/5 border border-white/10 px-2 py-1.5">
              <div className="text-[9px] uppercase text-white/40 font-roboto">Биржа, 999 ₽/г</div>
              <div className="font-oswald font-bold text-[#FFD700] text-sm">{exchange ? rub(exchange.buy) : "—"}</div>
            </div>
            <div className="rounded-lg bg-white/5 border border-white/10 px-2 py-1.5">
              <div className="text-[9px] uppercase text-white/40 font-roboto">Золото, $/унция</div>
              <div className="font-oswald font-bold text-white text-sm">{exchange ? exchange.xau_usd.toLocaleString("ru-RU") : "—"}</div>
            </div>
            <div className="rounded-lg bg-white/5 border border-white/10 px-2 py-1.5">
              <div className="text-[9px] uppercase text-white/40 font-roboto">Доллар, ₽</div>
              <div className="font-oswald font-bold text-white text-sm">{exchange ? exchange.usd_rub.toFixed(2) : "—"}</div>
            </div>
          </div>

          <div className="overflow-x-auto -mx-1 px-1">
            <table className="w-full text-[11px] font-roboto tabular-nums">
              <thead>
                <tr className="text-white/40 text-[10px] uppercase">
                  <th className="text-left py-1 pr-2 font-normal">Проба</th>
                  <th className="text-right py-1 px-1 font-normal">Коэф.</th>
                  <th className="text-right py-1 px-1 font-normal">Биржа</th>
                  <th className="text-right py-1 px-1 font-normal text-[#FFD700]">Мы</th>
                  {competitors.map(c => (
                    <th key={c.source} className="text-right py-1 px-1 font-normal">
                      <a href={c.url} target="_blank" rel="noreferrer" className="underline decoration-dotted">{c.source}</a>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PURITIES.map(p => {
                  const all = competitors.map(c => c.prices[String(p)]).filter(Boolean) as number[];
                  const best = all.length ? Math.max(...all) : 0;
                  return (
                    <tr key={p} className="border-t border-white/5">
                      <td className="py-1 pr-2 font-bold text-white">{p}</td>
                      <td className="py-1 px-1 text-right text-white/50">{coef(p).toFixed(3)}</td>
                      <td className="py-1 px-1 text-right text-white/60">{rub(exchangePrice(exchange, p))}</td>
                      <td className="py-1 px-1 text-right font-bold text-[#FFD700]">{rub(ourPrice(exchange, p))}</td>
                      {competitors.map(c => {
                        const v = c.prices[String(p)];
                        return (
                          <td key={c.source} className={`py-1 px-1 text-right ${v && v === best ? "text-emerald-400 font-bold" : "text-white/70"}`}>
                            {v ? rub(v) : "—"}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-white/35 font-roboto">
            <span>
              Зелёным — максимальная цена конкурентов. «Мы» — расчёт по бирже со скидкой сайта.
              {updatedAt && ` Обновлено ${updatedAt.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}.`}
            </span>
            <button onClick={reload} disabled={loading} className="shrink-0 flex items-center gap-1 text-[#FFD700]">
              <Icon name="RefreshCw" size={11} className={loading ? "animate-spin" : ""} /> Обновить
            </button>
          </div>
        </div>
      )}

      {buyOpen && <GoldBuyModal token={token} rates={rates} onClose={() => setBuyOpen(false)} />}
    </div>
  );
}
