import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { adminHeaders } from "@/lib/adminFetch";

const ADMIN_URL = "https://functions.poehali.dev/a105aede-d55d-4b99-9d3e-5e977887aa04";
const GOLD_PRICE_URL = "https://functions.poehali.dev/0e3260ee-7b92-4be2-833b-d3fcc9d2472d";

interface Setting {
  key: string;
  value: string;
  description: string | null;
  updated_at: string | null;
}

const CLIENT_GROUPS = [
  {
    label: "Физлицо",
    discountKey: "gold_retail_discount",
    deductionKey: "gold_retail_deduction",
  },
  {
    label: "Опт от 30 г",
    discountKey: "gold_wholesale_discount",
    deductionKey: "gold_wholesale_deduction",
  },
  {
    label: "Крупный опт от 300 г",
    discountKey: "gold_bulk_discount",
    deductionKey: "gold_bulk_deduction",
  },
];

export default function SettingsTab({ token }: { token: string }) {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [edited, setEdited] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [goldBuy, setGoldBuy] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${ADMIN_URL}?action=settings_get`, {
        headers: adminHeaders(token),
      });
      const data = await res.json();
      setSettings(data.settings || []);
      const init: Record<string, string> = {};
      (data.settings || []).forEach((s: Setting) => { init[s.key] = s.value; });
      setEdited(init);
    } catch {
      setError("Не удалось загрузить настройки");
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    fetch(GOLD_PRICE_URL).then(r => r.json()).then(d => {
      if (d?.buy) setGoldBuy(d.buy);
    }).catch(() => {});
  }, []);

  const save = async (key: string) => {
    setSaving(key);
    setError("");
    try {
      const res = await fetch(ADMIN_URL, {
        method: "POST",
        headers: { ...adminHeaders(token), "Content-Type": "application/json" },
        body: JSON.stringify({ action: "settings_set", key, value: edited[key] }),
      });
      if (!res.ok) throw new Error();
      setSaved(key);
      setTimeout(() => setSaved(null), 3000);
      await load();
    } catch {
      setError("Не удалось сохранить");
    }
    setSaving(null);
  };

  const calcPreview = (discountKey: string, deductionKey: string) => {
    if (!goldBuy) return null;
    const disc = parseFloat(edited[discountKey] ?? "0") / 100;
    const ded = parseFloat(edited[deductionKey] ?? "0");
    return Math.round(goldBuy * 0.585 * (1 - disc) - ded);
  };

  const otherSettings = settings.filter(s => !s.key.startsWith("gold_"));

  const SaveBtn = ({ keyName }: { keyName: string }) => (
    <button
      onClick={() => save(keyName)}
      disabled={saving === keyName}
      className="bg-[#FFD700] text-black font-bold px-3 py-2 text-xs uppercase tracking-wide hover:bg-yellow-400 transition-colors disabled:opacity-60 flex items-center gap-1.5 shrink-0"
    >
      {saving === keyName
        ? <Icon name="Loader2" size={13} className="animate-spin" />
        : saved === keyName
          ? <Icon name="Check" size={13} />
          : <Icon name="Save" size={13} />}
      {saving === keyName ? "..." : saved === keyName ? "OK" : "Сохранить"}
    </button>
  );

  if (loading) {
    return <div className="flex items-center justify-center h-40 text-white/40 text-sm">Загрузка...</div>;
  }

  return (
    <div className="p-5 max-w-2xl space-y-8">
      {error && (
        <div className="bg-red-900/30 border border-red-500/30 text-red-400 text-sm px-3 py-2">{error}</div>
      )}

      {/* Скупка золота */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1 h-5 bg-[#FFD700]" />
          <div className="text-white/60 text-xs uppercase tracking-widest">Скупка золота</div>
        </div>
        <div className="text-white/30 text-xs mb-4">
          Формула: биржа × проба × (1 − вычет%) − вычет ₽/г
          {goldBuy && <span className="ml-2">· Биржа сейчас: {goldBuy.toLocaleString("ru-RU", { maximumFractionDigits: 0 })} ₽/г</span>}
        </div>

        <div className="grid grid-cols-1 gap-4">
          {CLIENT_GROUPS.map(({ label, discountKey, deductionKey }) => {
            const preview = calcPreview(discountKey, deductionKey);
            const discUpdated = settings.find(s => s.key === discountKey)?.updated_at;
            return (
              <div key={discountKey} className="bg-[#1A1A1A] border border-[#333] p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-oswald font-bold text-white uppercase text-sm">{label}</div>
                  {preview !== null && (
                    <div className="text-[#FFD700] text-sm font-bold font-oswald">
                      585 проба: {preview.toLocaleString("ru-RU")} ₽/г
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-white/40 text-xs block mb-1">Вычет %</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={edited[discountKey] ?? ""}
                        onChange={e => setEdited(p => ({ ...p, [discountKey]: e.target.value }))}
                        className="flex-1 bg-[#0D0D0D] border border-[#444] text-white px-3 py-2 text-sm focus:outline-none focus:border-[#FFD700] transition-colors w-20"
                      />
                      <span className="text-white/40 text-sm self-center">%</span>
                      <SaveBtn keyName={discountKey} />
                    </div>
                  </div>

                  <div>
                    <label className="text-white/40 text-xs block mb-1">Вычет ₽/г</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={edited[deductionKey] ?? ""}
                        onChange={e => setEdited(p => ({ ...p, [deductionKey]: e.target.value }))}
                        className="flex-1 bg-[#0D0D0D] border border-[#444] text-white px-3 py-2 text-sm focus:outline-none focus:border-[#FFD700] transition-colors w-20"
                      />
                      <span className="text-white/40 text-sm self-center">₽</span>
                      <SaveBtn keyName={deductionKey} />
                    </div>
                  </div>
                </div>

                {discUpdated && (
                  <div className="text-white/20 text-[10px] mt-2">
                    Обновлено: {new Date(discUpdated).toLocaleString("ru-RU")}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="text-white/20 text-xs mt-3">
          Изменения отображаются на сайте в течение 30 секунд после сохранения
        </div>
      </div>

      {/* Прочие параметры */}
      {otherSettings.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-5 bg-[#FFD700]" />
            <div className="text-white/60 text-xs uppercase tracking-widest">Параметры системы</div>
          </div>
          <div className="flex flex-col gap-3">
            {otherSettings.map((s) => (
              <div key={s.key} className="bg-[#1A1A1A] border border-[#333] p-4">
                <div className="text-white text-sm font-medium mb-1">{s.description || s.key}</div>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    value={edited[s.key] ?? s.value}
                    onChange={(e) => setEdited(prev => ({ ...prev, [s.key]: e.target.value }))}
                    className="flex-1 bg-[#0D0D0D] border border-[#444] text-white px-3 py-2 text-sm focus:outline-none focus:border-[#FFD700] transition-colors"
                  />
                  <span className="text-white/40 text-sm shrink-0">₽</span>
                  <SaveBtn keyName={s.key} />
                </div>
                {s.updated_at && (
                  <div className="text-white/20 text-xs mt-2">
                    Обновлено: {new Date(s.updated_at).toLocaleString("ru-RU")}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
