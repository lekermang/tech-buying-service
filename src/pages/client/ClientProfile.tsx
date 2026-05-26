import { useState } from "react";
import Icon from "@/components/ui/icon";
import { ClientProfile } from "./clientTypes";
import funcUrls from "../../../backend/func2url.json";

const AUTH_URL = (funcUrls as Record<string, string>)["client-auth"];

interface Props {
  token: string;
  profile: ClientProfile;
  onProfileUpdate: (updated: ClientProfile) => void;
}

type Section = "personal" | "passport" | "delivery";

const SECTION_LABELS: { id: Section; label: string; icon: string; desc: string }[] = [
  { id: "personal", label: "Личные данные", icon: "User", desc: "ФИО, телефон, дата рождения" },
  { id: "passport", label: "Паспорт", icon: "BookOpen", desc: "Серия, номер, кем выдан" },
  { id: "delivery", label: "Адрес доставки", icon: "MapPin", desc: "Для получения товаров и документов" },
];

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="py-2.5 border-b border-white/5 last:border-0">
      <div className="text-[10px] text-white/35 uppercase tracking-wider mb-0.5">{label}</div>
      <div className="text-[13px] text-white/90">{value}</div>
    </div>
  );
}

function InputField({
  label, value, onChange, placeholder, type = "text", required,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] text-white/40 uppercase tracking-wider">
        {label}{required && <span className="text-[#FFD700] ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-[13px] text-white placeholder:text-white/20 focus:outline-none focus:border-[#FFD700]/50 transition"
      />
    </div>
  );
}

export default function ClientProfileTab({ token, profile, onProfileUpdate }: Props) {
  const [section, setSection] = useState<Section>("personal");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    full_name: profile.full_name || "",
    birth_date: profile.birth_date || "",
    passport_series: profile.passport_series || "",
    passport_number: profile.passport_number || "",
    passport_issued: profile.passport_issued || "",
    delivery_name: profile.delivery_name || "",
    delivery_phone: profile.delivery_phone || "",
    delivery_city: profile.delivery_city || "",
    delivery_address: profile.delivery_address || "",
    delivery_postal: profile.delivery_postal || "",
  });

  const set = (k: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.full_name.trim()) { setError("ФИО обязательно"); return; }
    setSaving(true); setError("");
    try {
      const r = await fetch(AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Client-Token": token },
        body: JSON.stringify({ action: "update_profile", ...form }),
      });
      const d = await r.json();
      if (!r.ok || d.error) { setError(d.error || "Ошибка сохранения"); return; }
      onProfileUpdate({ ...profile, ...form });
      setSaved(true);
      setEditing(false);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("Нет соединения");
    } finally {
      setSaving(false);
    }
  };

  const profileComplete = !!(
    profile.full_name && profile.phone && profile.birth_date &&
    profile.delivery_city && profile.delivery_address
  );

  return (
    <div className="space-y-4">

      {/* Банер заполненности */}
      {!profileComplete && !editing && (
        <div className="rounded-2xl bg-[#FFD700]/8 border border-[#FFD700]/25 p-4 flex gap-3 items-start">
          <Icon name="AlertCircle" size={18} className="text-[#FFD700] shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-bold text-[#FFD700] mb-1">Заполните профиль</div>
            <div className="text-[11px] text-white/50 leading-relaxed">
              Укажите дату рождения, паспорт и адрес доставки — это нужно для оформления договоров и отправки товаров.
            </div>
          </div>
          <button
            onClick={() => setEditing(true)}
            className="shrink-0 bg-[#FFD700] text-black text-[11px] font-bold uppercase tracking-wide px-3 py-1.5 rounded-lg"
          >
            Заполнить
          </button>
        </div>
      )}

      {/* Карточка профиля */}
      <div className="rounded-2xl bg-white/[0.03] border border-white/8 overflow-hidden">
        {/* Хедер */}
        <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FFD700] to-[#d4a017] flex items-center justify-center">
              <span className="text-black font-bold text-sm">
                {(profile.full_name || "?").slice(0, 1).toUpperCase()}
              </span>
            </div>
            <div>
              <div className="text-[13px] font-bold text-white">{profile.full_name}</div>
              <div className="text-[10px] text-white/35">{profile.phone}</div>
            </div>
          </div>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="text-[11px] text-[#FFD700] flex items-center gap-1 hover:opacity-80 transition"
            >
              <Icon name="Pencil" size={12} />
              Изменить
            </button>
          ) : (
            <button
              onClick={() => { setEditing(false); setError(""); }}
              className="text-[11px] text-white/40 flex items-center gap-1"
            >
              <Icon name="X" size={12} />
              Отмена
            </button>
          )}
        </div>

        {/* Разделы */}
        {!editing ? (
          <>
            {/* Навигация по разделам */}
            <div className="flex border-b border-white/5">
              {SECTION_LABELS.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSection(s.id)}
                  className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-wide transition ${
                    section === s.id
                      ? "text-[#FFD700] border-b-2 border-[#FFD700]"
                      : "text-white/35 hover:text-white/60"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <div className="px-4 py-2">
              {section === "personal" && (
                <>
                  <Field label="ФИО" value={profile.full_name} />
                  <Field label="Телефон" value={profile.phone} />
                  <Field label="Email" value={profile.email ?? undefined} />
                  <Field label="Дата рождения" value={profile.birth_date ?? undefined} />
                  {!profile.birth_date && (
                    <div className="py-3 text-[12px] text-white/25 text-center">Не заполнено</div>
                  )}
                </>
              )}
              {section === "passport" && (
                <>
                  <Field label="Серия" value={profile.passport_series ?? undefined} />
                  <Field label="Номер" value={profile.passport_number ?? undefined} />
                  <Field label="Кем выдан / когда" value={profile.passport_issued ?? undefined} />
                  {!profile.passport_series && !profile.passport_number && (
                    <div className="py-3 text-[12px] text-white/25 text-center">Не заполнено</div>
                  )}
                </>
              )}
              {section === "delivery" && (
                <>
                  <Field label="Получатель" value={profile.delivery_name ?? undefined} />
                  <Field label="Телефон получателя" value={profile.delivery_phone ?? undefined} />
                  <Field label="Город" value={profile.delivery_city ?? undefined} />
                  <Field label="Адрес" value={profile.delivery_address ?? undefined} />
                  <Field label="Индекс" value={profile.delivery_postal ?? undefined} />
                  {!profile.delivery_city && !profile.delivery_address && (
                    <div className="py-3 text-[12px] text-white/25 text-center">Не заполнено</div>
                  )}
                </>
              )}
            </div>
          </>
        ) : (
          <div className="px-4 py-4 space-y-5">
            {/* Личные */}
            <div>
              <div className="flex items-center gap-1.5 mb-3">
                <Icon name="User" size={13} className="text-[#FFD700]" />
                <span className="text-[11px] font-bold text-[#FFD700] uppercase tracking-wider">Личные данные</span>
              </div>
              <div className="space-y-3">
                <InputField label="ФИО" value={form.full_name} onChange={set("full_name")} placeholder="Иванов Иван Иванович" required />
                <InputField label="Дата рождения" value={form.birth_date} onChange={set("birth_date")} type="date" />
              </div>
            </div>

            <div className="h-px bg-white/5" />

            {/* Паспорт */}
            <div>
              <div className="flex items-center gap-1.5 mb-3">
                <Icon name="BookOpen" size={13} className="text-[#FFD700]" />
                <span className="text-[11px] font-bold text-[#FFD700] uppercase tracking-wider">Паспорт</span>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <InputField label="Серия" value={form.passport_series} onChange={set("passport_series")} placeholder="1234" />
                  <InputField label="Номер" value={form.passport_number} onChange={set("passport_number")} placeholder="567890" />
                </div>
                <InputField label="Кем выдан / дата выдачи" value={form.passport_issued} onChange={set("passport_issued")} placeholder="ОВД г. Калуга, 01.01.2010" />
              </div>
            </div>

            <div className="h-px bg-white/5" />

            {/* Доставка */}
            <div>
              <div className="flex items-center gap-1.5 mb-3">
                <Icon name="MapPin" size={13} className="text-[#FFD700]" />
                <span className="text-[11px] font-bold text-[#FFD700] uppercase tracking-wider">Адрес доставки</span>
              </div>
              <div className="space-y-3">
                <InputField label="ФИО получателя" value={form.delivery_name} onChange={set("delivery_name")} placeholder="Иванов Иван Иванович" />
                <InputField label="Телефон получателя" value={form.delivery_phone} onChange={set("delivery_phone")} placeholder="+7 (900) 000-00-00" type="tel" />
                <InputField label="Город" value={form.delivery_city} onChange={set("delivery_city")} placeholder="Калуга" />
                <InputField label="Улица, дом, квартира" value={form.delivery_address} onChange={set("delivery_address")} placeholder="ул. Кирова, д.11, кв. 5" />
                <InputField label="Почтовый индекс" value={form.delivery_postal} onChange={set("delivery_postal")} placeholder="248000" />
              </div>
            </div>

            {error && (
              <div className="text-red-400 text-[12px] text-center">{error}</div>
            )}

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full btn-gold-premium py-3 text-sm rounded-xl"
            >
              {saving ? "Сохраняем..." : "Сохранить"}
            </button>
          </div>
        )}
      </div>

      {/* Скидка и баллы */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white/[0.03] border border-white/8 p-4 text-center">
          <div className="text-2xl font-bold text-[#FFD700]">{profile.discount_pct}%</div>
          <div className="text-[10px] text-white/35 mt-0.5 uppercase tracking-wide">Ваша скидка</div>
        </div>
        <div className="rounded-2xl bg-white/[0.03] border border-white/8 p-4 text-center">
          <div className="text-2xl font-bold text-[#FFD700]">{profile.loyalty_points}</div>
          <div className="text-[10px] text-white/35 mt-0.5 uppercase tracking-wide">Баллы</div>
        </div>
      </div>

      {saved && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-[#10B981] text-white text-[13px] font-bold px-5 py-2.5 rounded-full shadow-lg flex items-center gap-2 z-50">
          <Icon name="Check" size={14} />
          Профиль сохранён
        </div>
      )}
    </div>
  );
}
