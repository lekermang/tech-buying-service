import { useState } from "react";
import Icon from "@/components/ui/icon";
import { useStaffToast } from "../StaffToast";
import { STAFF_CLIENTS_URL, type ClientFull } from "./cabinetClientsTypes";

type Props = {
  token: string;
  client: ClientFull;
  onClose: () => void;
  onSaved: () => void;
};

export default function ClientEditorModal({ token, client, onClose, onSaved }: Props) {
  const toast = useStaffToast();
  const [form, setForm] = useState({
    full_name: client.full_name || "",
    phone: client.phone || "",
    email: client.email || "",
    passport_series: client.passport_series || "",
    passport_number: client.passport_number || "",
    passport_issued_by: client.passport_issued_by || "",
    passport_issued_date: client.passport_issued_date || "",
    address: client.address || "",
    discount_pct: client.discount_pct ?? 0,
    loyalty_points: client.loyalty_points ?? 0,
    client_group: client.client_group || "",
    notes: client.notes || "",
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(STAFF_CLIENTS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Employee-Token": token },
        body: JSON.stringify({ action: "update", id: client.id, ...form }),
      });
      const d = await res.json();
      if (d.error) {
        toast.error(d.error);
        return;
      }
      toast.success("Сохранено");
      onSaved();
    } catch {
      toast.error("Сбой сети");
    } finally {
      setSaving(false);
    }
  };

  const resetPassword = async () => {
    if (!confirm("Сбросить пароль клиенту? Будет выдан временный пароль для передачи лично.")) return;
    const res = await fetch(STAFF_CLIENTS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Employee-Token": token },
      body: JSON.stringify({ action: "reset_password", id: client.id }),
    });
    const d = await res.json();
    if (d.error) {
      toast.error(d.error);
      return;
    }
    alert(`Временный пароль для ${d.email || "клиента"}:\n\n${d.temp_password}\n\nСкажи клиенту лично или отправь в Telegram. После входа клиент сможет сменить пароль.`);
  };

  const verifyEmail = async () => {
    const res = await fetch(STAFF_CLIENTS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Employee-Token": token },
      body: JSON.stringify({ action: "verify_email", id: client.id }),
    });
    const d = await res.json();
    if (d.error) {
      toast.error(d.error);
      return;
    }
    toast.success("Email подтверждён вручную");
    onSaved();
  };

  const remove = async () => {
    if (!confirm("Удалить клиента безвозвратно? Действие нельзя отменить.")) return;
    const res = await fetch(STAFF_CLIENTS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Employee-Token": token },
      body: JSON.stringify({ action: "delete", id: client.id }),
    });
    const d = await res.json();
    if (d.error) {
      toast.error(d.error);
      return;
    }
    toast.success("Клиент удалён");
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-gradient-to-br from-[#0F0F0F] to-[#080808] border border-[#FFD700]/30 rounded-2xl">
        <div className="sticky top-0 bg-[#0A0A0A]/95 backdrop-blur border-b border-[#1F1F1F] px-4 py-3 flex items-center gap-3 z-10">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FFD700]/30 to-[#FFD700]/5 border border-[#FFD700]/20 flex items-center justify-center overflow-hidden">
            {client.avatar_url ? (
              <img src={client.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-[#FFD700]">
                {(form.full_name || "?").slice(0, 1).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[14px] font-bold text-white truncate">{form.full_name}</div>
            <div className="text-[11px] text-white/40 flex items-center gap-2">
              ID #{client.id} · {client.email_verified ? "Email подтверждён" : "Email не подтверждён"}
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 text-white/60">
            <Icon name="X" size={18} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {client.stats && (
            <div className="grid grid-cols-3 gap-2">
              <Stat
                icon="Wrench"
                label="Ремонты"
                value={`${client.stats.repairs_total}`}
                hint={`${client.stats.repairs_active} в работе`}
              />
              <Stat
                icon="Send"
                label="Предложения"
                value={`${client.stats.offers_total}`}
                hint="за всё время"
              />
              <Stat
                icon="Gift"
                label="Баллы"
                value={`${form.loyalty_points}`}
                hint={`скидка ${form.discount_pct}%`}
              />
            </div>
          )}

          <Section title="Основные данные" icon="User">
            <Row>
              <FormField label="Имя и фамилия" v={form.full_name} on={(v) => setForm({ ...form, full_name: v })} />
            </Row>
            <Row>
              <FormField label="Телефон" v={form.phone} on={(v) => setForm({ ...form, phone: v })} />
              <FormField label="Email" v={form.email} on={(v) => setForm({ ...form, email: v })} />
            </Row>
            <Row>
              <FormField label="Адрес" v={form.address} on={(v) => setForm({ ...form, address: v })} />
            </Row>
          </Section>

          <Section title="Паспортные данные" icon="FileText">
            <Row>
              <FormField
                label="Серия"
                v={form.passport_series}
                on={(v) => setForm({ ...form, passport_series: v })}
                placeholder="1234"
              />
              <FormField
                label="Номер"
                v={form.passport_number}
                on={(v) => setForm({ ...form, passport_number: v })}
                placeholder="567890"
              />
            </Row>
            <Row>
              <FormField
                label="Кем выдан"
                v={form.passport_issued_by}
                on={(v) => setForm({ ...form, passport_issued_by: v })}
                placeholder="ОВД района..."
              />
            </Row>
            <Row>
              <FormField
                label="Дата выдачи"
                v={form.passport_issued_date}
                on={(v) => setForm({ ...form, passport_issued_date: v })}
                type="date"
              />
            </Row>
          </Section>

          <Section title="Программа лояльности" icon="Gift">
            <Row>
              <FormField
                label="Скидка, %"
                v={String(form.discount_pct)}
                on={(v) => setForm({ ...form, discount_pct: Math.max(0, Math.min(50, parseInt(v) || 0)) })}
                type="number"
              />
              <FormField
                label="Бонусные баллы"
                v={String(form.loyalty_points)}
                on={(v) => setForm({ ...form, loyalty_points: Math.max(0, parseInt(v) || 0) })}
                type="number"
              />
            </Row>
            <Row>
              <FormField
                label="Группа (VIP, опт и т.д.)"
                v={form.client_group}
                on={(v) => setForm({ ...form, client_group: v })}
                placeholder="VIP, оптовик..."
              />
            </Row>
          </Section>

          <Section title="Внутренние заметки" icon="StickyNote">
            <div>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
                placeholder="Видны только сотрудникам. Клиент НЕ видит этот текст."
                className="w-full bg-[#0A0A0A] border border-[#1F1F1F] focus:border-[#FFD700]/40 text-white px-3 py-2 rounded-lg text-[13px] focus:outline-none resize-none"
              />
            </div>
          </Section>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={save}
              disabled={saving}
              className="flex-1 min-w-[140px] py-2.5 rounded-lg bg-gradient-to-b from-[#FFE34D] to-[#d4a017] text-black text-[13px] font-bold uppercase tracking-wider disabled:opacity-50 hover:brightness-110 flex items-center justify-center gap-2"
            >
              {saving ? (
                <Icon name="Loader" size={14} className="animate-spin" />
              ) : (
                <Icon name="Save" size={14} />
              )}
              Сохранить
            </button>
            {!client.email_verified && client.email && (
              <button
                onClick={verifyEmail}
                className="px-3 py-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[12px] font-bold flex items-center gap-1.5"
              >
                <Icon name="BadgeCheck" size={14} />
                Подтвердить email
              </button>
            )}
            <button
              onClick={resetPassword}
              className="px-3 py-2.5 rounded-lg bg-[#FFD700]/10 border border-[#FFD700]/30 text-[#FFD700] text-[12px] font-bold flex items-center gap-1.5"
            >
              <Icon name="KeyRound" size={14} />
              Сбросить пароль
            </button>
            <button
              onClick={remove}
              className="px-3 py-2.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-[12px] font-bold flex items-center gap-1.5"
              title="Удалить (только для администратора)"
            >
              <Icon name="Trash2" size={14} />
              Удалить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-xl p-3">
      <div className="flex items-center gap-2 mb-2">
        <Icon name={icon} size={13} className="text-[#FFD700]" />
        <span className="text-[11px] font-bold uppercase tracking-wider text-white/70">{title}</span>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{children}</div>;
}

function FormField({
  label,
  v,
  on,
  type = "text",
  placeholder,
}: {
  label: string;
  v: string;
  on: (s: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-[10px] text-white/40 mb-0.5 uppercase tracking-wider">{label}</label>
      <input
        type={type}
        value={v}
        onChange={(e) => on(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-[#0D0D0D] border border-[#1F1F1F] focus:border-[#FFD700]/40 text-white px-2.5 py-1.5 rounded text-[12.5px] focus:outline-none"
      />
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  hint,
}: {
  icon: string;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-xl p-3">
      <Icon name={icon} size={14} className="text-[#FFD700] mb-1" />
      <div className="text-[10px] text-white/40 uppercase tracking-wider">{label}</div>
      <div className="text-[18px] font-bold text-white leading-none mt-0.5">{value}</div>
      <div className="text-[10px] text-white/35 mt-0.5">{hint}</div>
    </div>
  );
}
