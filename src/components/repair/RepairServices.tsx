import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import funcUrls from "../../../backend/func2url.json";

const SKFRP_URL = (funcUrls as Record<string, string>)["skfrp-proxy"];

type Service = {
  id: number;
  code: string;
  name: string;
  description?: string;
  price: number;
  currency?: string;
  requires_imei?: boolean;
  is_active?: boolean;
};

export default function RepairServices({ onOrder }: { onOrder: () => void }) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(SKFRP_URL)
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        if (d.ok && Array.isArray(d.services)) {
          setServices(d.services.filter((s: Service) => s.is_active !== false));
        } else {
          setError(true);
        }
      })
      .catch(() => alive && setError(true))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <section id="services" className="px-4 sm:px-8 py-14 max-w-6xl mx-auto scroll-mt-20">
      <div className="text-center mb-9">
        <h2 className="font-oswald text-3xl sm:text-4xl font-bold uppercase">
          Наши <span className="text-[#FFD700]">услуги</span>
        </h2>
        <p className="text-white/50 text-sm mt-2">Разблокировка, прошивка и восстановление устройств</p>
      </div>

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 rounded-xl bg-white/[0.04] border border-white/[0.06] animate-pulse" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="text-center py-12 text-white/40">
          <Icon name="WifiOff" size={36} className="mx-auto mb-3 text-white/30" />
          Не удалось загрузить услуги. Оставьте заявку — мастер подскажет цену.
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((s) => (
            <div
              key={s.id}
              className="group relative bg-[#111] border border-white/[0.07] hover:border-[#FFD700]/50 rounded-xl p-5 transition-all hover:-translate-y-0.5 overflow-hidden"
            >
              <span
                aria-hidden
                className="absolute top-0 left-0 right-0 h-0.5 bg-[#FFD700] scale-x-0 group-hover:scale-x-100 origin-left transition-transform"
              />
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="font-oswald text-base font-semibold uppercase leading-tight">{s.name}</div>
                {s.requires_imei && (
                  <span className="shrink-0 text-[10px] text-[#FFD700] bg-[#FFD700]/10 border border-[#FFD700]/20 px-2 py-0.5 rounded-full">
                    IMEI
                  </span>
                )}
              </div>
              <div className="text-white/50 text-[13px] leading-relaxed mb-4 min-h-[40px]">{s.description}</div>
              <div className="font-oswald text-2xl font-bold text-[#FFD700] mb-4">
                {Number(s.price).toLocaleString("ru-RU")}{" "}
                <span className="text-white/40 text-sm font-roboto font-normal">₽</span>
              </div>
              <button
                onClick={onOrder}
                className="w-full bg-[#FFD700] hover:bg-[#ffed4a] text-black font-oswald font-bold tracking-wide py-2.5 rounded-lg text-sm transition-colors inline-flex items-center justify-center gap-1.5"
              >
                Заказать
                <Icon name="ArrowRight" size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
