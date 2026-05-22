import { useCallback, useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import funcUrls from "../../../../backend/func2url.json";
import { useStaffToast } from "../StaffToast";
import useDebouncedValue from "@/hooks/useDebouncedValue";

const STAFF_CLIENTS_URL = (funcUrls as Record<string, string>)["staff-clients"];

type Filter = "" | "with_email" | "verified" | "no_passport";

type ClientRow = {
  id: number;
  full_name: string;
  phone: string;
  email: string | null;
  email_verified: boolean;
  passport_series: string | null;
  passport_number: string | null;
  address: string | null;
  discount_pct: number;
  loyalty_points: number;
  registered_at: string | null;
  last_login_at: string | null;
  client_group: string | null;
  avatar_url: string | null;
  notes: string | null;
  has_passport: boolean;
};

type ClientFull = ClientRow & {
  passport_issued_by: string | null;
  passport_issued_date: string | null;
  stats?: { repairs_total: number; repairs_active: number; offers_total: number };
};

const formatDate = (s: string | null) => {
  if (!s) return "—";
  try {
    const d = new Date(s);
    return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit" });
  } catch {
    return s;
  }
};

export default function CabinetClientsPanel({ token }: { token: string }) {
  const toast = useStaffToast();
  const [q, setQ] = useState("");
  const dq = useDebouncedValue(q, 350);
  const [filter, setFilter] = useState<Filter>("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [rows, setRows] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<ClientFull | null>(null);

  const perPage = 30;

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(STAFF_CLIENTS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Employee-Token": token },
        body: JSON.stringify({
          action: "list",
          q: dq,
          page,
          per_page: perPage,
          only: filter,
        }),
      });
      const d = await res.json();
      if (d.error) {
        toast.error(d.error);
        return;
      }
      setRows(d.clients || []);
      setTotal(d.total || 0);
    } catch {
      toast.error("Не удалось загрузить список");
    } finally {
      setLoading(false);
    }
  }, [token, dq, page, filter, toast]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [dq, filter]);

  const openEdit = async (id: number) => {
    const res = await fetch(STAFF_CLIENTS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Employee-Token": token },
      body: JSON.stringify({ action: "get", id }),
    });
    const d = await res.json();
    if (d.error) {
      toast.error(d.error);
      return;
    }
    setEditing(d.client);
  };

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="space-y-3">
      {/* Шапка */}
      <div className="bg-gradient-to-br from-[#0F0F0F] to-[#080808] border border-[#FFD700]/20 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-9 h-9 rounded-lg bg-[#FFD700]/15 border border-[#FFD700]/30 flex items-center justify-center">
            <Icon name="UserCircle" size={18} className="text-[#FFD700]" />
          </div>
          <div className="flex-1">
            <div className="text-[14px] font-bold text-white">Клиенты кабинета</div>
            <div className="text-[11px] text-white/40">
              Зарегистрированные через личный кабинет · {total} всего
            </div>
          </div>
          <button
            onClick={load}
            className="p-2 rounded-lg hover:bg-white/5 text-white/50 hover:text-[#FFD700]"
            title="Обновить"
          >
            <Icon name={loading ? "Loader" : "RefreshCw"} size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Icon
              name="Search"
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
            />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Имя, телефон, email, паспорт..."
              className="w-full bg-[#0A0A0A] border border-[#1F1F1F] focus:border-[#FFD700]/40 text-white pl-9 pr-3 py-2 rounded-lg text-[13px] focus:outline-none"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as Filter)}
            className="bg-[#0A0A0A] border border-[#1F1F1F] text-white px-3 py-2 rounded-lg text-[13px] focus:outline-none focus:border-[#FFD700]/40"
          >
            <option value="">Все клиенты</option>
            <option value="with_email">С email</option>
            <option value="verified">Email подтверждён</option>
            <option value="no_passport">Без паспорта</option>
          </select>
        </div>
      </div>

      {/* Таблица */}
      <div className="bg-gradient-to-br from-[#0F0F0F] to-[#080808] border border-[#1F1F1F] rounded-2xl overflow-hidden">
        {rows.length === 0 && !loading && (
          <div className="px-4 py-10 text-center text-white/40 text-sm">
            <Icon name="Users" size={28} className="mx-auto mb-2 text-white/20" />
            Клиенты не найдены
          </div>
        )}

        <div className="divide-y divide-[#1F1F1F]">
          {rows.map((c) => (
            <button
              key={c.id}
              onClick={() => openEdit(c.id)}
              className="w-full text-left px-3 sm:px-4 py-3 hover:bg-[#FFD700]/5 transition flex items-center gap-3"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FFD700]/30 to-[#FFD700]/5 border border-[#FFD700]/20 flex items-center justify-center shrink-0 overflow-hidden">
                {c.avatar_url ? (
                  <img src={c.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[12px] font-bold text-[#FFD700]">
                    {(c.full_name || "?").slice(0, 1).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[13px] font-bold text-white truncate">
                    {c.full_name || "Без имени"}
                  </span>
                  {c.email_verified && (
                    <span title="Email подтверждён">
                      <Icon name="BadgeCheck" size={12} className="text-emerald-400" />
                    </span>
                  )}
                  {c.has_passport && (
                    <span
                      className="text-[9px] bg-[#FFD700]/15 text-[#FFD700] px-1.5 py-0.5 rounded uppercase tracking-wider font-bold"
                      title="Паспортные данные внесены"
                    >
                      Паспорт
                    </span>
                  )}
                  {c.discount_pct > 0 && (
                    <span className="text-[9px] bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded font-bold">
                      -{c.discount_pct}%
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[11px] text-white/45 mt-0.5 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Icon name="Phone" size={10} />
                    {c.phone || "—"}
                  </span>
                  {c.email && (
                    <span className="flex items-center gap-1 truncate max-w-[200px]">
                      <Icon name="Mail" size={10} />
                      {c.email}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[10px] text-white/30">Последний вход</div>
                <div className="text-[11px] text-white/60">{formatDate(c.last_login_at)}</div>
              </div>
              <Icon name="ChevronRight" size={14} className="text-white/30 shrink-0" />
            </button>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="border-t border-[#1F1F1F] px-3 py-2 flex items-center justify-between text-[12px]">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 rounded bg-[#0A0A0A] border border-[#1F1F1F] text-white/70 disabled:opacity-30 hover:border-[#FFD700]/40"
            >
              ← Назад
            </button>
            <span className="text-white/50">
              Страница {page} из {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 rounded bg-[#0A0A0A] border border-[#1F1F1F] text-white/70 disabled:opacity-30 hover:border-[#FFD700]/40"
            >
              Вперёд →
            </button>
          </div>
        )}
      </div>

      {editing && (
        <ClientEditorModal
          token={token}
          client={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function ClientEditorModal({
  token,
  client,
  onClose,
  onSaved,
}: {
  token: string;
  client: ClientFull;
  onClose: () => void;
  onSaved: () => void;
}) {
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
