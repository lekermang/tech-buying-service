import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";

const PROMO_API = "https://functions.poehali.dev/d0b139ce-b968-40cb-be48-3bdb67713efb";

interface Promo {
  id: number;
  slug: string;
  title: string;
  short_desc: string;
  image_url: string | null;
  ends_at: string | null;
}

function Countdown({ endsAt }: { endsAt: string }) {
  const [diff, setDiff] = useState(Math.max(0, new Date(endsAt).getTime() - Date.now()));
  useEffect(() => {
    const id = setInterval(() => setDiff(Math.max(0, new Date(endsAt).getTime() - Date.now())), 1000);
    return () => clearInterval(id);
  }, [endsAt]);
  if (diff <= 0) return null;
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return (
    <span className="flex items-center gap-1 text-[11px] font-bold text-white/50">
      <Icon name="Timer" size={11} className="text-[#FFD700]/60" />
      {d > 0 && `${d} д `}{h} ч {m} мин
    </span>
  );
}

export default function PromoBanner() {
  const [promos, setPromos] = useState<Promo[]>([]);

  useEffect(() => {
    fetch(`${PROMO_API}?action=list_active`)
      .then(r => r.json())
      .then(d => { if (d.promos?.length) setPromos(d.promos); })
      .catch(() => {});
  }, []);

  if (!promos.length) return null;

  const promo = promos[0];

  return (
    <section className="px-3 sm:px-4 py-2 max-w-[1400px] mx-auto">
      <a
        href={`/promo/${promo.slug}`}
        className="group relative flex items-center gap-0 rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
        style={{
          background: "linear-gradient(135deg, #1a0f00 0%, #0f0800 60%, #1a0a00 100%)",
          border: "1px solid rgba(255,215,0,0.25)",
          boxShadow: "0 4px 24px rgba(255,215,0,0.08), 0 0 0 1px rgba(255,255,255,0.03) inset",
          minHeight: 80,
        }}
      >
        {/* Декор-свечение */}
        <div className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(ellipse at 20% 50%, rgba(255,215,0,0.07) 0%, transparent 60%)" }} />
        <div className="pointer-events-none absolute top-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg,transparent,rgba(255,215,0,0.4),transparent)" }} />

        {/* Фото */}
        {promo.image_url && (
          <div className="shrink-0 hidden sm:block" style={{ width: 60, height: 80, overflow: "hidden" }}>
            <img src={promo.image_url} alt={promo.title}
              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
              style={{ borderRadius: 0 }} />
          </div>
        )}

        {/* Текст */}
        <div className="flex-1 px-4 py-3 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
              style={{ background: "rgba(255,215,0,0.15)", color: "#FFD700", border: "1px solid rgba(255,215,0,0.3)" }}>
              🎁 Акция
            </span>
            {promo.ends_at && <Countdown endsAt={promo.ends_at} />}
          </div>
          <div className="font-oswald font-bold text-base sm:text-lg text-white leading-tight truncate">
            {promo.title}
          </div>
          {promo.short_desc && (
            <div className="text-[12px] text-white/50 mt-0.5 truncate hidden sm:block">
              {promo.short_desc}
            </div>
          )}
        </div>

        {/* Кнопка */}
        <div className="shrink-0 px-4 pr-5">
          <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-oswald font-bold text-sm uppercase tracking-wide text-black transition-all group-hover:shadow-[0_0_20px_rgba(255,215,0,0.4)]"
            style={{ background: "linear-gradient(135deg,#FFD700,#f59e0b)" }}>
            Участвовать
            <Icon name="ArrowRight" size={14} className="transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>
      </a>
    </section>
  );
}