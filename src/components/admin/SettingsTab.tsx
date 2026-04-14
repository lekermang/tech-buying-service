import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { adminHeaders } from "@/lib/adminFetch";

const ADMIN_URL = "https://functions.poehali.dev/a105aede-d55d-4b99-9d3e-5e977887aa04";

interface Setting {
  key: string;
  value: string;
  description: string | null;
  updated_at: string | null;
}

const GOLD_KEYS = [
  { key: "gold_retail_discount",    label: "Физлицо — вычет",          unit: "%"  },
  { key: "gold_retail_deduction",   label: "Физлицо — вычет",          unit: "₽/г" },
  { key: "gold_wholesale_discount", label: "Опт от 30 г — вычет",      unit: "%"  },
  { key: "gold_wholesale_deduction",label: "Опт от 30 г — вычет",      unit: "₽/г" },
  { key: "gold_bulk_discount",      label: "Крупный опт от 300 г — вычет", unit: "%"  },
  { key: "gold_bulk_deduction",     label: "Крупный опт от 300 г — вычет", unit: "₽/г" },
];

export default function SettingsTab({ token }: { token: string }) {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [edited, setEdited] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState("");
  const [error, setError] = useState("");

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

  useEffect(() => { load(); }, []);

  const save = async (key: string) => {
    setSaving(key);
    setError("");
    try {
      const res = await fetch(ADMIN_URL, {
        method: "POST",
        headers: { ...adminHeaders(token), "Content-Type": "application/json" },
        body: JSON.stringify({ action: "settings_set", key, value: edited[key] }),
      });
      if (!res.ok) throw new Error("Ошибка сохранения");
      const data = await res.json();
      setSaved(key);
      if (data.prices_updated > 0) {
        setSavedMsg(`Сохранено. Обновлено цен в каталоге: ${data.prices_updated}`);
      } else {
        setSavedMsg("Сохранено");
      }
      setTimeout(() => { setSaved(null); setSavedMsg(""); }, 3000);
      await load();
    } catch {
      setError("Не удалось сохранить");
    }
    setSaving(null);
  };

  const otherSettings = settings.filter(s => !s.key.startsWith("gold_"));
  const goldSettings = GOLD_KEYS.map(g => ({
    ...g,
    value: edited[g.key] ?? "",
    updated_at: settings.find(s => s.key === g.key)?.updated_at ?? null,
  }));

  const SettingRow = ({ keyName, label, unit, value, updated_at }: {
    keyName: string; label: string; unit: string; value: string; updated_at: string | null;
  }) => (
    <div className="bg-[#1A1A1A] border border-[#333] p-4">
      <div className="text-white text-sm font-medium mb-1">
        {label} <span className="text-white/40 font-normal">({unit})</span>
      </div>
      <div className="flex gap-2 items-center">
        <input
          type="number"
          value={edited[keyName] ?? value}
          onChange={(e) => setEdited(prev => ({ ...prev, [keyName]: e.target.value }))}
          className="flex-1 bg-[#0D0D0D] border border-[#444] text-white px-3 py-2 text-sm focus:outline-none focus:border-[#FFD700] transition-colors"
        />
        <span className="text-white/40 text-sm shrink-0">{unit}</span>
        <button
          onClick={() => save(keyName)}
          disabled={saving === keyName}
          className="bg-[#FFD700] text-black font-bold px-4 py-2 text-sm uppercase tracking-wide hover:bg-yellow-400 transition-colors disabled:opacity-60 flex items-center gap-2 shrink-0"
        >
          {saving === keyName ? (
            <Icon name="Loader2" size={14} className="animate-spin" />
          ) : saved === keyName ? (
            <Icon name="Check" size={14} />
          ) : (
            <Icon name="Save" size={14} />
          )}
          {saving === keyName ? "..." : saved === keyName ? "Сохранено" : "Сохранить"}
        </button>
      </div>
      {saved === keyName && savedMsg && (
        <div className="text-green-400 text-xs mt-2">{savedMsg}</div>
      )}
      {updated_at && (
        <div className="text-white/20 text-xs mt-2">
          Обновлено: {new Date(updated_at).toLocaleString("ru-RU")}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40 text-white/40 text-sm">
        Загрузка...
      </div>
    );
  }

  return (
    <div className="p-5 max-w-xl space-y-8">
      {error && (
        <div className="bg-red-900/30 border border-red-500/30 text-red-400 text-sm px-3 py-2">
          {error}
        </div>
      )}

      {/* Скупка золота */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-5 bg-[#FFD700]" />
          <div className="text-white/60 text-xs uppercase tracking-widest">Скупка золота</div>
        </div>
        <div className="text-white/30 text-xs mb-3">
          Цена покупки = биржевая цена × проба × (1 − вычет%) − вычет ₽/г
        </div>
        <div className="grid grid-cols-1 gap-3">
          {goldSettings.map(g => (
            <SettingRow
              key={g.key}
              keyName={g.key}
              label={g.label}
              unit={g.unit}
              value={g.value}
              updated_at={g.updated_at}
            />
          ))}
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
              <SettingRow
                key={s.key}
                keyName={s.key}
                label={s.description || s.key}
                unit="₽"
                value={s.value}
                updated_at={s.updated_at}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
