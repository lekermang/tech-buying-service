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
  const [deletedExtraIds, setDeletedExtraIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{ done: number; total: number } | null>(null);
  const [syncResult, setSyncResult] = useState<{ ok: boolean; synced?: number; error?: string } | null>(null);
  const [mobaSyncing, setMobaSyncing] = useState(false);
  const [mobaSyncProgress, setMobaSyncProgress] = useState<{ done: number; total: number } | null>(null);
  const [mobaSyncResult, setMobaSyncResult] = useState<{ ok: boolean; synced?: number; error?: string } | null>(null);
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
      setDeletedExtraIds([]);
    } catch {
      setError("Не удалось загрузить цены");
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const syncCatalog = async () => {
    setSyncing(true);
    setSyncResult(null);
    setSyncProgress(null);
    let totalSynced = 0;
    let offset = 0;
    try {
      while (true) {
        const res = await fetch(PARTS_URL, {
          method: "POST",
          headers,
          body: JSON.stringify({ offset }),
        });
        const data = await res.json();
        if (!data.ok) {
          setSyncResult({ ok: false, error: data.error });
          setSyncing(false);
          setSyncProgress(null);
          return;
        }
        totalSynced += data.saved;
        setSyncProgress({ done: offset + data.saved, total: data.total || (offset + data.saved) });
        if (!data.has_more) break;
        offset = data.next_offset;
      }
      setSyncResult({ ok: true, synced: totalSynced });
    } catch (e) {
      setSyncResult({ ok: false, error: String(e) });
    }
    setSyncing(false);
    setSyncProgress(null);
  };

  const syncMoba = async () => {
    setMobaSyncing(true);
    setMobaSyncResult(null);
    setMobaSyncProgress(null);
    let totalSynced = 0;
    let offset = 0;
    try {
      while (true) {
        const res = await fetch(PARTS_URL, {
          method: "POST",
          headers,
          body: JSON.stringify({ action: "moba_sync", offset }),
        });
        const data = await res.json();
        if (!data.ok) {
          setMobaSyncResult({ ok: false, error: data.error });
          setMobaSyncing(false);
          setMobaSyncProgress(null);
          return;
        }
        totalSynced += data.saved;
        setMobaSyncProgress({ done: offset + data.saved, total: data.total || (offset + data.saved) });
        if (!data.has_more) break;
        offset = data.next_offset;
      }
      setMobaSyncResult({ ok: true, synced: totalSynced });
    } catch (e) {
      setMobaSyncResult({ ok: false, error: String(e) });
    }
    setMobaSyncing(false);
    setMobaSyncProgress(null);
  };

  const removeExtra = (i: number) => {
    const ew = editedExtras[i];
    if (!window.confirm(`Удалить «${ew.label || 'без названия'}»?`)) return;
    if (ew.id) setDeletedExtraIds(prev => [...prev, ew.id!]);
    setEditedExtras(prev => prev.filter((_, j) => j !== i));
  };

  const save = async () => {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      // Удаляем помеченные записи
      await Promise.all(deletedExtraIds.map(id =>
        fetch(ADMIN_URL, {
          method: "POST",
          headers,
          body: JSON.stringify({ action: "extra_work_delete", id }),
        })
      ));
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
      if (data.ok) {
        setDeletedExtraIds([]);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        load();
      } else setError("Ошибка сохранения");
    } catch {
      setError("Ошибка соединения");
    }
    setSaving(false);
  };

  const inp = "w-full bg-gradient-to-br from-[#0E0E0E] to-[#0A0A0A] border border-[#1F1F1F] hover:border-[#262626] focus:border-[#FFD700]/60 focus:bg-[#101010] focus:shadow-[0_0_0_3px_rgba(255,215,0,0.08)] text-white px-3 py-2 font-roboto text-xs rounded-md focus:outline-none transition-all text-right tabular-nums font-bold";

  if (loading) return (
    <div className="flex flex-col items-center gap-2 text-white/40 font-roboto text-sm p-12">
      <div className="relative">
        <span className="absolute inset-0 rounded-full bg-[#FFD700]/30 blur-md animate-pulse" />
        <Icon name="Loader" size={22} className="relative animate-spin text-[#FFD700] drop-shadow-[0_0_8px_rgba(255,215,0,0.7)]" />
      </div>
      <span>Загружаю прайс…</span>
    </div>
  );

  const sectionTitle = "font-oswald font-bold text-base uppercase mb-1 bg-gradient-to-r from-[#FFD700] via-[#fff3a0] to-[#FFD700] bg-clip-text text-transparent animate-shimmer flex items-center gap-1.5";
  const rowCls = "relative flex items-center gap-2 border border-[#1F1F1F] px-3 py-2.5 bg-gradient-to-br from-[#141414] to-[#0E0E0E] rounded-md hover:border-[#FFD700]/30 hover:shadow-[0_0_10px_rgba(255,215,0,0.10)] transition-all";

  return (
    <div className="p-4 max-w-sm">
      {/* Наценка на детали */}
      <div className={sectionTitle}><Icon name="Percent" size={13} className="text-[#FFD700] drop-shadow-[0_0_4px_rgba(255,215,0,0.5)]" />Наценка на детали</div>
      <div className="font-roboto text-white/40 text-[10px] mb-2">
        Прибавляется к закупочной цене запчасти. Клиент видит: закупка + наценка + работа.
      </div>
      <div className={rowCls + " mb-5"}>
        <div className="flex-1 font-roboto text-white/85 text-xs">Наценка на запчасть</div>
        <div className="flex items-center gap-1.5 shrink-0">
          <input
            type="number" min={0} step={100}
            value={markup}
            onChange={e => setMarkup(e.target.value)}
            className={`${inp} w-24`}
          />
          <span className="font-roboto text-[#FFD700]/70 text-xs font-bold">₽</span>
        </div>
      </div>

      {/* Цены работ */}
      <div className={sectionTitle}><Icon name="Wrench" size={13} className="text-[#FFD700] drop-shadow-[0_0_4px_rgba(255,215,0,0.5)]" />Цены работ</div>
      <div className="font-roboto text-white/40 text-[10px] mb-3">
        Стоимость работы по каждой категории.
      </div>

      <div className="flex flex-col gap-2">
        {prices.map(p => (
          <div key={p.part_type} className={rowCls + " justify-between"}>
            <div>
              <div className="font-roboto text-white/85 text-xs font-medium">{LABELS[p.part_type] || p.label}</div>
              <div className="font-roboto text-white/35 text-[9px]">{p.part_type}</div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <input
                type="number" min={0} step={100}
                value={edited[p.part_type] ?? ""}
                onChange={e => setEdited(prev => ({ ...prev, [p.part_type]: e.target.value }))}
                className={`${inp} w-24`}
              />
              <span className="font-roboto text-[#FFD700]/70 text-xs font-bold">₽</span>
            </div>
          </div>
        ))}
      </div>

      {/* Доп. работы */}
      <div className={sectionTitle + " mt-5"}><Icon name="Plus" size={13} className="text-[#FFD700] drop-shadow-[0_0_4px_rgba(255,215,0,0.5)]" />Доп. работы</div>
      <div className="font-roboto text-white/40 text-[10px] mb-3">
        Клиент может добавить их к основному ремонту.
      </div>
      <div className="flex flex-col gap-2">
        {editedExtras.map((ew, i) => (
          <div key={ew.id ?? `new-${i}`} className={rowCls}>
            <input
              value={ew.label}
              onChange={e => setEditedExtras(prev => prev.map((x, j) => j === i ? {...x, label: e.target.value} : x))}
              className="flex-1 bg-transparent text-white font-roboto text-xs focus:outline-none border-b border-[#333] focus:border-[#FFD700] pb-0.5 transition-colors"
              placeholder="Название работы"
            />
            <div className="flex items-center gap-1.5 shrink-0">
              <input
                type="number" min={0} step={100}
                value={ew.price}
                onChange={e => setEditedExtras(prev => prev.map((x, j) => j === i ? {...x, price: parseInt(e.target.value)||0} : x))}
                className="w-20 bg-[#0A0A0A] border border-[#1F1F1F] hover:border-[#262626] focus:border-[#FFD700]/60 focus:shadow-[0_0_0_3px_rgba(255,215,0,0.08)] text-white px-2 py-1 font-roboto text-xs rounded-md focus:outline-none text-right transition-all"
              />
              <span className="text-[#FFD700]/70 text-xs font-bold">₽</span>
              <button type="button" onClick={() => removeExtra(i)}
                title="Удалить работу"
                className="text-white/30 hover:text-red-300 hover:bg-red-500/10 rounded-md p-1 transition-colors ml-1 active:scale-90">
                <Icon name="Trash2" size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>
      <button type="button"
        onClick={() => setEditedExtras(prev => [...prev, {label: '', price: 0, is_active: true, sort_order: prev.length}])}
        className="mt-2 inline-flex items-center gap-1 font-roboto text-[11px] text-white/50 hover:text-[#FFD700] hover:drop-shadow-[0_0_4px_rgba(255,215,0,0.5)] transition-all px-2 py-1 rounded-md hover:bg-[#FFD700]/5">
        <Icon name="Plus" size={12} /> Добавить работу
      </button>

      {error && (
        <div className="mt-3 bg-gradient-to-r from-red-500/15 to-red-500/5 border border-red-500/40 rounded-md px-3 py-2 text-red-300 font-roboto text-xs flex items-center gap-1.5 shadow-[0_0_12px_rgba(239,68,68,0.20)]">
          <Icon name="AlertCircle" size={12} /> {error}
        </div>
      )}

      <button onClick={save} disabled={saving}
        title="Сохранить и пересчитать цены"
        className="btn-gold-premium w-full mt-4 !py-2.5 disabled:opacity-40 disabled:cursor-not-allowed">
        {saving
          ? <><Icon name="Loader" size={14} className="animate-spin" /> Сохраняем...</>
          : saved
          ? <><Icon name="Check" size={14} /> Цены сохранены и пересчитаны</>
          : <><Icon name="Save" size={14} /> Сохранить</>}
      </button>

      {/* Кнопка синхронизации каталога запчастей — премиум */}
      <div className="relative mt-5 pt-4">
        <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FFD700]/35 to-transparent" />
        <div className="font-roboto text-[#FFD700]/70 text-[10px] uppercase tracking-[0.08em] font-bold mb-2 flex items-center gap-1.5">
          <Icon name="Database" size={11} className="text-[#FFD700] drop-shadow-[0_0_4px_rgba(255,215,0,0.5)]" /> Каталог запчастей (МойСклад)
        </div>
        <button onClick={syncCatalog} disabled={syncing}
          title="Обновить базу данных запчастей из МойСклад"
          className="relative w-full bg-gradient-to-br from-[#141414] to-[#0E0E0E] border border-[#1F1F1F] text-white/70 font-roboto text-xs py-2.5 rounded-md hover:border-[#FFD700]/50 hover:text-[#FFD700] hover:shadow-[0_0_14px_rgba(255,215,0,0.20)] transition-all disabled:opacity-40 inline-flex items-center justify-center gap-2 active:scale-[0.98] overflow-hidden group">
          <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FFD700]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <Icon name={syncing ? "Loader" : "RefreshCw"} size={13} className={syncing ? "animate-spin text-[#FFD700]" : ""} />
          {syncing
            ? syncProgress
              ? `Загружено ${syncProgress.done.toLocaleString("ru-RU")} из ${syncProgress.total.toLocaleString("ru-RU")}...`
              : "Подключаемся..."
            : "Обновить БД из МойСклад"}
        </button>
        {syncing && syncProgress && (
          <div className="mt-2">
            <div className="w-full bg-[#0A0A0A] border border-[#1F1F1F] h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#FFD700] via-[#fff3a0] to-[#FFD700] transition-all duration-300 shadow-[0_0_8px_rgba(255,215,0,0.6)]"
                style={{ width: `${Math.round((syncProgress.done / syncProgress.total) * 100)}%` }}
              />
            </div>
            <div className="text-right font-roboto text-[9px] text-[#FFD700]/70 mt-0.5 tabular-nums font-bold">
              {Math.round((syncProgress.done / syncProgress.total) * 100)}%
            </div>
          </div>
        )}
        {syncResult && (
          <div className={`mt-2 font-roboto text-[10px] flex items-center gap-1.5 px-2 py-1 rounded-md ${syncResult.ok ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.18)]" : "bg-red-500/10 border border-red-500/30 text-red-300 shadow-[0_0_10px_rgba(239,68,68,0.18)]"}`}>
            <Icon name={syncResult.ok ? "CheckCircle" : "AlertCircle"} size={11} />
            {syncResult.ok
              ? `Готово — обновлено ${syncResult.synced?.toLocaleString("ru-RU")} позиций`
              : `Ошибка: ${syncResult.error || "нет ответа"}`}
          </div>
        )}
      </div>

      {/* Синхронизация с Moba.ru — премиум */}
      <div className="relative mt-3 pt-4">
        <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
        <div className="font-roboto text-emerald-300/80 text-[10px] uppercase tracking-[0.08em] font-bold mb-2 flex items-center gap-1.5">
          <Icon name="Database" size={11} className="text-emerald-300 drop-shadow-[0_0_4px_rgba(16,185,129,0.5)]" /> Каталог запчастей (Moba.ru)
        </div>
        <button onClick={syncMoba} disabled={mobaSyncing}
          title="Обновить базу данных запчастей из Moba.ru"
          className="relative w-full bg-gradient-to-br from-[#141414] to-[#0E0E0E] border border-[#1F1F1F] text-white/70 font-roboto text-xs py-2.5 rounded-md hover:border-emerald-500/50 hover:text-emerald-300 hover:shadow-[0_0_14px_rgba(16,185,129,0.20)] transition-all disabled:opacity-40 inline-flex items-center justify-center gap-2 active:scale-[0.98] overflow-hidden group">
          <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <Icon name={mobaSyncing ? "Loader" : "RefreshCw"} size={13} className={mobaSyncing ? "animate-spin text-emerald-300" : ""} />
          {mobaSyncing
            ? mobaSyncProgress
              ? `Загружено ${mobaSyncProgress.done.toLocaleString("ru-RU")} из ${mobaSyncProgress.total.toLocaleString("ru-RU")}...`
              : "Подключаемся к Moba.ru..."
            : "Обновить БД из Moba.ru"}
        </button>
        {mobaSyncing && mobaSyncProgress && (
          <div className="mt-2">
            <div className="w-full bg-[#0A0A0A] border border-[#1F1F1F] h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500 transition-all duration-300 shadow-[0_0_8px_rgba(16,185,129,0.6)]"
                style={{ width: `${Math.round((mobaSyncProgress.done / mobaSyncProgress.total) * 100)}%` }}
              />
            </div>
            <div className="text-right font-roboto text-[9px] text-emerald-300/70 mt-0.5 tabular-nums font-bold">
              {Math.round((mobaSyncProgress.done / mobaSyncProgress.total) * 100)}%
            </div>
          </div>
        )}
        {mobaSyncResult && (
          <div className={`mt-2 font-roboto text-[10px] flex items-center gap-1.5 px-2 py-1 rounded-md ${mobaSyncResult.ok ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.18)]" : "bg-red-500/10 border border-red-500/30 text-red-300 shadow-[0_0_10px_rgba(239,68,68,0.18)]"}`}>
            <Icon name={mobaSyncResult.ok ? "CheckCircle" : "AlertCircle"} size={11} />
            {mobaSyncResult.ok
              ? `Готово — обновлено ${mobaSyncResult.synced?.toLocaleString("ru-RU")} позиций`
              : `Ошибка: ${mobaSyncResult.error || "нет ответа"}`}
          </div>
        )}
      </div>
    </div>
  );
}