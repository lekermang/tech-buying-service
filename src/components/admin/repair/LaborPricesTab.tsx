import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";

const ADMIN_URL = "https://functions.poehali.dev/a105aede-d55d-4b99-9d3e-5e977887aa04";
const PARTS_URL = "https://functions.poehali.dev/68da5b17-ae5f-4568-8e27-0d945b995d82";

const LABELS: Record<string, string> = {
  display:        "Дисплей",
  battery:        "Аккумулятор",
  glass:          "Стекло / тачскрин",
  camera_glass:   "Стекло камеры",
  flex_board:     "Шлейф / плата",
  accessory:      "Аксессуары",
  rear_glass:     "Заднее стекло iPhone",
  battery_iphone: "Аккумулятор iPhone",
  battery_other:  "Аккумулятор (другое)",
  speaker_ear:    "Динамик слуховой",
  speaker_loud:   "Динамик громкий (звонок)",
  vibro:          "Вибромотор",
  back_cover:     "Задняя крышка / Рамка / Корпус",
};

type LaborPrice = { part_type: string; label: string; price: number };
type ExtraWork = { id?: number; label: string; price: number; is_active: boolean; sort_order: number };

export default function LaborPricesTab({
  token,
  authHeader,
}: {
  token: string;
  authHeader: "X-Admin-Token" | "X-Employee-Token";
}) {
  const [prices, setPrices] = useState<LaborPrice[]>([]);
  const [edited, setEdited] = useState<Record<string, string>>({});
  const [markup, setMarkup] = useState("0");
  const [extras, setExtras] = useState<ExtraWork[]>([]);
  const [editedExtras, setEditedExtras] = useState<ExtraWork[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ ok: boolean; synced?: number } | null>(null);
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
      setMarkup(String(data.parts_markup ?? 0));
      const extList: ExtraWork[] = data.extra_works || [];
      setExtras(extList);
      setEditedExtras(extList.map(e => ({...e})));
    } catch {
      setError("Не удалось загрузить цены");
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const syncCatalog = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch(PARTS_URL, { method: "POST", headers });
      const data = await res.json();
      setSyncResult({ ok: !!data.ok, synced: data.synced });
    } catch {
      setSyncResult({ ok: false });
    }
    setSyncing(false);
  };

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
        body: JSON.stringify({
          action: "labor_prices_set",
          prices: payload,
          parts_markup: parseInt(markup) || 0,
          extra_works: editedExtras,
        }),
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
      {/* Наценка на детали */}
      <div className="font-oswald font-bold text-white text-base uppercase mb-1">Наценка на детали</div>
      <div className="font-roboto text-white/30 text-[10px] mb-2">
        Прибавляется к закупочной цене запчасти. Клиент видит: закупка + наценка + работа.
      </div>
      <div className="flex items-center gap-2 border border-[#333] px-3 py-2.5 bg-black/20 mb-5">
        <div className="flex-1 font-roboto text-white/80 text-xs">Наценка на запчасть</div>
        <div className="flex items-center gap-1.5 shrink-0">
          <input
            type="number" min={0} step={100}
            value={markup}
            onChange={e => setMarkup(e.target.value)}
            className={`${inp} w-24`}
          />
          <span className="font-roboto text-white/40 text-xs">₽</span>
        </div>
      </div>

      {/* Цены работ */}
      <div className="font-oswald font-bold text-white text-base uppercase mb-1">Цены работ</div>
      <div className="font-roboto text-white/30 text-[10px] mb-3">
        Стоимость работы по каждой категории.
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
                type="number" min={0} step={100}
                value={edited[p.part_type] ?? ""}
                onChange={e => setEdited(prev => ({ ...prev, [p.part_type]: e.target.value }))}
                className={`${inp} w-24`}
              />
              <span className="font-roboto text-white/40 text-xs">₽</span>
            </div>
          </div>
        ))}
      </div>

      {/* Доп. работы */}
      <div className="font-oswald font-bold text-white text-base uppercase mb-1 mt-5">Доп. работы</div>
      <div className="font-roboto text-white/30 text-[10px] mb-3">
        Клиент может добавить их к основному ремонту.
      </div>
      <div className="flex flex-col gap-2">
        {editedExtras.map((ew, i) => (
          <div key={i} className="flex items-center gap-2 border border-[#222] px-3 py-2 bg-black/20">
            <input
              value={ew.label}
              onChange={e => setEditedExtras(prev => prev.map((x, j) => j === i ? {...x, label: e.target.value} : x))}
              className="flex-1 bg-transparent text-white font-roboto text-xs focus:outline-none border-b border-[#333] focus:border-[#FFD700] py-0.5"
              placeholder="Название работы"
            />
            <input
              type="number" min={0} step={100}
              value={ew.price}
              onChange={e => setEditedExtras(prev => prev.map((x, j) => j === i ? {...x, price: parseInt(e.target.value)||0} : x))}
              className="w-20 bg-[#0D0D0D] border border-[#333] text-white px-2 py-1 font-roboto text-xs focus:outline-none focus:border-[#FFD700] text-right"
            />
            <span className="text-white/30 text-xs">₽</span>
            <button type="button" onClick={() => setEditedExtras(prev => prev.filter((_, j) => j !== i))}
              className="text-red-400/50 hover:text-red-400 transition-colors">
              <Icon name="X" size={12} />
            </button>
          </div>
        ))}
      </div>
      <button type="button"
        onClick={() => setEditedExtras(prev => [...prev, {label: '', price: 0, is_active: true, sort_order: prev.length}])}
        className="mt-2 flex items-center gap-1 font-roboto text-[10px] text-white/30 hover:text-white transition-colors">
        <Icon name="Plus" size={11} /> Добавить работу
      </button>

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
          ? <><Icon name="Check" size={14} /> Цены сохранены и пересчитаны</>
          : "Сохранить"}
      </button>

      {/* Кнопка синхронизации каталога запчастей */}
      <div className="mt-4 border-t border-[#222] pt-4">
        <div className="font-roboto text-white/30 text-[10px] uppercase tracking-wide mb-2 flex items-center gap-1">
          <Icon name="Database" size={10} /> Каталог запчастей (МойСклад)
        </div>
        <button onClick={syncCatalog} disabled={syncing}
          className="w-full border border-[#333] text-white/60 font-roboto text-xs py-2.5 hover:border-[#FFD700]/40 hover:text-white transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
          <Icon name={syncing ? "Loader" : "RefreshCw"} size={13} className={syncing ? "animate-spin" : ""} />
          {syncing ? "Обновляем..." : "Обновить БД из МойСклад"}
        </button>
        {syncResult && (
          <div className={`mt-2 font-roboto text-[10px] flex items-center gap-1.5 ${syncResult.ok ? "text-green-400" : "text-red-400"}`}>
            <Icon name={syncResult.ok ? "CheckCircle" : "AlertCircle"} size={11} />
            {syncResult.ok
              ? `Готово — обновлено ${syncResult.synced?.toLocaleString("ru-RU")} позиций`
              : "Ошибка синхронизации"}
          </div>
        )}
      </div>
    </div>
  );
}