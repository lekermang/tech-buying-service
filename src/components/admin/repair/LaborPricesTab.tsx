import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";

const ADMIN_URL = "https://functions.poehali.dev/a105aede-d55d-4b99-9d3e-5e977887aa04";

const LABELS: Record<string, string> = {
  display:      "Дисплей",
  battery:      "Аккумулятор",
  glass:        "Стекло / тачскрин",
  camera_glass: "Стекло камеры",
  flex_board:   "Шлейф / плата",
  accessory:    "Задняя крышка",
};

type LaborPrice = { part_type: string; label: string; price: number };

export default function LaborPricesTab({
  token,
  authHeader,
}: {
  token: string;
  authHeader: "X-Admin-Token" | "X-Employee-Token";
}) {
  const [prices, setPrices] = useState<LaborPrice[]>([]);
  const [edited, setEdited] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const headers = { "Content-Type": "application/json", [authHeader]: token };

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${ADMIN_URL}?action=labor_prices_get`, { headers });
      const data = await res.json();
      const list: LaborPrice[] = data.prices || [];
      setPrices(list);
      const init: Record<string, string> = {};
      list.forEach(p => { init[p.part_type] = String(p.price); });
      setEdited(init);
    } catch {
      setError("Не удалось загрузить цены");
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const payload = prices.map(p => ({
        part_type: p.part_type,
        price: parseInt(edited[p.part_type] || "0") || 0,
      }));
      const res = await fetch(ADMIN_URL, {
        method: "POST",
        headers,
        body: JSON.stringify({ action: "labor_prices_set", prices: payload }),
      });
      const data = await res.json();
      if (data.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
      else setError("Ошибка сохранения");
    } catch {
      setError("Ошибка соединения");
    }
    setSaving(false);
  };

  const inp = "w-full bg-[#0D0D0D] border border-[#333] text-white px-3 py-2 font-roboto text-xs focus:outline-none focus:border-[#FFD700] transition-colors text-right";

  if (loading) return (
    <div className="flex items-center gap-2 text-white/40 font-roboto text-xs p-4">
      <Icon name="Loader" size={14} className="animate-spin" /> Загрузка...
    </div>
  );

  return (
    <div className="p-4 max-w-sm">
      <div className="font-oswald font-bold text-white text-base uppercase mb-1">Цены работ</div>
      <div className="font-roboto text-white/30 text-[10px] mb-4">
        Стоимость работы по каждой категории запчастей. Цена в калькуляторе = цена запчасти + цена работы.
      </div>

      <div className="flex flex-col gap-2">
        {prices.map(p => (
          <div key={p.part_type} className="flex items-center justify-between gap-3 border border-[#222] px-3 py-2.5 bg-black/20">
            <div>
              <div className="font-roboto text-white/80 text-xs">{LABELS[p.part_type] || p.label}</div>
              <div className="font-roboto text-white/30 text-[9px]">{p.part_type}</div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <input
                type="number"
                min={0}
                step={100}
                value={edited[p.part_type] ?? ""}
                onChange={e => setEdited(prev => ({ ...prev, [p.part_type]: e.target.value }))}
                className={`${inp} w-24`}
              />
              <span className="font-roboto text-white/40 text-xs">₽</span>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="mt-3 text-red-400 font-roboto text-[10px] flex items-center gap-1">
          <Icon name="AlertCircle" size={11} /> {error}
        </div>
      )}

      <button onClick={save} disabled={saving}
        className="mt-4 w-full bg-[#FFD700] text-black font-oswald font-bold py-2.5 uppercase text-sm hover:bg-yellow-400 transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
        {saving
          ? <><Icon name="Loader" size={14} className="animate-spin" /> Сохраняем...</>
          : saved
          ? <><Icon name="Check" size={14} /> Сохранено</>
          : "Сохранить цены"}
      </button>
    </div>
  );
}
