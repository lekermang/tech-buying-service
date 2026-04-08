import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { adminHeaders } from "@/lib/adminFetch";

const ADMIN_URL = "https://functions.poehali.dev/a105aede-d55d-4b99-9d3e-5e977887aa04";

interface Recipient {
  id: number;
  name: string;
  telegram_chat_id: string;
  is_active: boolean;
  notify_repair: boolean;
  created_at: string | null;
}

export default function NotificationsTab({ token }: { token: string }) {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", telegram_chat_id: "", notify_repair: true });
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await fetch(`${ADMIN_URL}?action=recipients`, { headers: adminHeaders(token) });
    const data = await res.json();
    setRecipients(data.recipients || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!form.name.trim() || !form.telegram_chat_id.trim()) {
      setError("Заполните имя и chat_id");
      return;
    }
    setSaving(true);
    setError("");
    const res = await fetch(ADMIN_URL, {
      method: "POST",
      headers: { ...adminHeaders(token), "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add_recipient", ...form }),
    });
    const data = await res.json();
    if (!data.ok) { setError(data.error || "Ошибка"); setSaving(false); return; }
    setForm({ name: "", telegram_chat_id: "", notify_repair: true });
    setShowForm(false);
    setSaving(false);
    load();
  };

  const remove = async (id: number) => {
    if (!confirm("Удалить получателя?")) return;
    await fetch(ADMIN_URL, {
      method: "POST",
      headers: { ...adminHeaders(token), "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete_recipient", id }),
    });
    load();
  };

  const toggle = async (id: number) => {
    await fetch(ADMIN_URL, {
      method: "POST",
      headers: { ...adminHeaders(token), "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggle_recipient", id }),
    });
    load();
  };

  return (
    <div className="p-5 max-w-2xl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="font-bold text-white text-sm uppercase tracking-wide">Получатели уведомлений</div>
          <div className="text-white/40 text-xs mt-0.5">Telegram chat_id, которым отправляются заявки в ремонт</div>
        </div>
        <button
          onClick={() => { setShowForm(f => !f); setError(""); }}
          className="flex items-center gap-1.5 bg-[#FFD700] text-black font-bold text-xs px-3 py-2 uppercase tracking-wide hover:bg-yellow-400 transition-colors"
        >
          <Icon name="Plus" size={13} />
          Добавить
        </button>
      </div>

      {showForm && (
        <div className="bg-[#1A1A1A] border border-[#333] p-4 mb-4">
          <div className="text-white/60 text-xs uppercase tracking-wider mb-3">Новый получатель</div>
          <div className="flex flex-col gap-2">
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Имя (например: Иван)"
              className="bg-[#0D0D0D] border border-[#444] text-white px-3 py-2 text-sm focus:outline-none focus:border-[#FFD700]"
            />
            <input
              value={form.telegram_chat_id}
              onChange={e => setForm(f => ({ ...f, telegram_chat_id: e.target.value }))}
              placeholder="Telegram Chat ID (например: -1001234567890)"
              className="bg-[#0D0D0D] border border-[#444] text-white px-3 py-2 text-sm focus:outline-none focus:border-[#FFD700]"
            />
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.notify_repair}
                onChange={e => setForm(f => ({ ...f, notify_repair: e.target.checked }))}
                className="accent-[#FFD700] w-4 h-4"
              />
              <span className="text-white/70 text-sm">Уведомлять о заявках в ремонт</span>
            </label>
            {error && <div className="text-red-400 text-xs">{error}</div>}
            <div className="flex gap-2 mt-1">
              <button
                onClick={add}
                disabled={saving}
                className="bg-[#FFD700] text-black font-bold text-xs px-4 py-2 uppercase tracking-wide hover:bg-yellow-400 disabled:opacity-60 transition-colors"
              >
                {saving ? "Сохраняю..." : "Сохранить"}
              </button>
              <button
                onClick={() => { setShowForm(false); setError(""); }}
                className="text-white/40 hover:text-white text-xs px-3 py-2 transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-white/30 text-sm py-8 text-center">Загрузка...</div>
      ) : recipients.length === 0 ? (
        <div className="bg-[#1A1A1A] border border-[#333] p-8 text-center">
          <Icon name="BellOff" size={28} className="text-white/20 mx-auto mb-2" />
          <div className="text-white/40 text-sm">Получатели не добавлены</div>
          <div className="text-white/25 text-xs mt-1">Уведомления идут только на основной чат из настроек сервера</div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {recipients.map(r => (
            <div
              key={r.id}
              className={`flex items-center gap-3 bg-[#1A1A1A] border px-4 py-3 transition-colors ${r.is_active ? "border-[#333]" : "border-[#2A2A2A] opacity-50"}`}
            >
              <div className={`w-2 h-2 rounded-full shrink-0 ${r.is_active ? "bg-green-400" : "bg-white/20"}`} />
              <div className="flex-1 min-w-0">
                <div className="text-white text-sm font-medium truncate">{r.name}</div>
                <div className="text-white/40 text-xs font-mono mt-0.5">{r.telegram_chat_id}</div>
              </div>
              {r.notify_repair && (
                <span className="shrink-0 bg-[#FFD700]/10 text-[#FFD700] text-[10px] font-bold uppercase px-2 py-0.5 tracking-wide">
                  Ремонт
                </span>
              )}
              <button
                onClick={() => toggle(r.id)}
                title={r.is_active ? "Отключить" : "Включить"}
                className="text-white/30 hover:text-white transition-colors p-1 shrink-0"
              >
                <Icon name={r.is_active ? "BellOff" : "Bell"} size={15} />
              </button>
              <button
                onClick={() => remove(r.id)}
                title="Удалить"
                className="text-white/30 hover:text-red-400 transition-colors p-1 shrink-0"
              >
                <Icon name="Trash2" size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 bg-[#111] border border-[#222] px-4 py-3">
        <div className="flex items-start gap-2">
          <Icon name="Info" size={14} className="text-white/30 mt-0.5 shrink-0" />
          <div className="text-white/30 text-xs leading-relaxed">
            Chat ID можно узнать через бота <span className="text-white/50">@userinfobot</span> или <span className="text-white/50">@getmyid_bot</span> в Telegram. Для групп ID начинается с минуса.
          </div>
        </div>
      </div>
    </div>
  );
}
