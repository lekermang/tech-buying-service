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

export default function SettingsTab({ token }: { token: string }) {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [edited, setEdited] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<string | null>(null);
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
      setSaved(key);
      setTimeout(() => setSaved(null), 2000);
      await load();
    } catch {
      setError("Не удалось сохранить");
    }
    setSaving(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40 text-white/40 text-sm">
        Загрузка...
      </div>
    );
  }

  return (
    <div className="p-5 max-w-xl">
      <div className="text-white/40 text-xs uppercase tracking-widest mb-4">Параметры системы</div>

      {error && (
        <div className="mb-4 bg-red-900/30 border border-red-500/30 text-red-400 text-sm px-3 py-2">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {settings.map((s) => (
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
              <button
                onClick={() => save(s.key)}
                disabled={saving === s.key}
                className="bg-[#FFD700] text-black font-bold px-4 py-2 text-sm uppercase tracking-wide hover:bg-yellow-400 transition-colors disabled:opacity-60 flex items-center gap-2 shrink-0"
              >
                {saving === s.key ? (
                  <Icon name="Loader2" size={14} className="animate-spin" />
                ) : saved === s.key ? (
                  <Icon name="Check" size={14} />
                ) : (
                  <Icon name="Save" size={14} />
                )}
                {saving === s.key ? "..." : saved === s.key ? "Сохранено" : "Сохранить"}
              </button>
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
  );
}