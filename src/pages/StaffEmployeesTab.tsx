import { useState, useEffect, useCallback, useMemo } from "react";
import Icon from "@/components/ui/icon";
import { EMPLOYEE_AUTH_URL } from "./staff.types";
import { useStaffToast } from "./staff/StaffToast";

type Employee = {
  id: number;
  full_name: string;
  login: string;
  role: string;
  is_active: boolean;
  created_at: string;
  position?: string | null;
  email?: string | null;
  phone?: string | null;
  note?: string | null;
};

const ROLE_LABELS: Record<string, string> = { owner: "Владелец", admin: "Администратор", staff: "Сотрудник", master: "Мастер" };
const ROLE_STYLES: Record<string, { badge: string; avatar: string; icon: string; emoji: string }> = {
  owner: { badge: "bg-gradient-to-r from-[#FFD700] to-yellow-500 text-black", avatar: "from-[#FFD700] to-yellow-600 text-black", icon: "Crown", emoji: "👑" },
  admin: { badge: "bg-gradient-to-r from-blue-500/30 to-blue-600/20 text-blue-300 border border-blue-400/30", avatar: "from-blue-500 to-blue-700 text-white", icon: "Shield", emoji: "🛡️" },
  master: { badge: "bg-gradient-to-r from-purple-500/30 to-purple-600/20 text-purple-300 border border-purple-400/30", avatar: "from-purple-500 to-purple-700 text-white", icon: "Wrench", emoji: "🔧" },
  staff: { badge: "bg-white/10 text-white/70 border border-white/10", avatar: "from-[#333] to-[#1a1a1a] text-white/70", icon: "User", emoji: "👤" },
};

const POSITION_SUGGESTIONS = ["Приёмщик", "Мастер по ремонту", "Оценщик золота", "Управляющий", "Курьер"];

type FormFields = {
  full_name: string;
  login: string;
  password: string;
  role: string;
  position: string;
  email: string;
  phone: string;
  note: string;
};

const EMPTY_FORM: FormFields = { full_name: "", login: "", password: "", role: "staff", position: "", email: "", phone: "", note: "" };

export function EmployeesTab({ token, myRole }: { token: string; myRole: string }) {
  const toast = useStaffToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<FormFields>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<FormFields>(EMPTY_FORM);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`${EMPLOYEE_AUTH_URL}?action=list`, { headers: { "X-Employee-Token": token } });
    const data = await res.json();
    setEmployees(data.employees || []);
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return employees.filter(e => {
      if (statusFilter === "active" && !e.is_active) return false;
      if (statusFilter === "inactive" && e.is_active) return false;
      if (roleFilter !== "all" && e.role !== roleFilter) return false;
      if (!q) return true;
      const hay = [e.full_name, e.login, e.email || "", e.phone || "", e.position || ""].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [employees, search, statusFilter, roleFilter]);

  const createEmployee = async () => {
    if (!addForm.full_name || !addForm.login || !addForm.password) {
      toast.warning("Заполните ФИО, логин и пароль");
      return;
    }
    setSaving(true);
    const tid = toast.loading("Создаю сотрудника...");
    try {
      const res = await fetch(EMPLOYEE_AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Employee-Token": token },
        body: JSON.stringify({ action: "create", ...addForm }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.update(tid, { kind: "success", message: `Сотрудник «${addForm.full_name}» добавлен`, duration: 3000 });
        setShowAdd(false);
        setAddForm(EMPTY_FORM);
        load();
      } else {
        toast.update(tid, { kind: "error", message: data.error || "Не удалось создать сотрудника", duration: 5000 });
      }
    } catch {
      toast.update(tid, { kind: "error", message: "Сбой сети при создании", duration: 5000 });
    } finally {
      setSaving(false);
    }
  };

  const updateEmployee = async (id: number, fields: Record<string, unknown>) => {
    const tid = toast.loading("Сохраняю изменения...");
    try {
      const res = await fetch(EMPLOYEE_AUTH_URL, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "X-Employee-Token": token },
        body: JSON.stringify({ id, ...fields }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok !== false) {
        toast.update(tid, { kind: "success", message: "Изменения сохранены", duration: 2500 });
        setEditId(null);
        load();
      } else {
        toast.update(tid, { kind: "error", message: data.error || "Не удалось сохранить", duration: 5000 });
      }
    } catch {
      toast.update(tid, { kind: "error", message: "Сбой сети при сохранении", duration: 5000 });
    }
  };

  const startEdit = (emp: Employee) => {
    setEditId(emp.id);
    setEditForm({
      full_name: emp.full_name,
      login: emp.login,
      password: "",
      role: emp.role,
      position: emp.position || "",
      email: emp.email || "",
      phone: emp.phone || "",
      note: emp.note || "",
    });
  };

  const active = employees.filter(e => e.is_active).length;
  const inactive = employees.length - active;

  const ROLES_AVAILABLE = myRole === "owner"
    ? [
        { v: "staff", l: "Сотрудник", emoji: "👤" },
        { v: "master", l: "Мастер", emoji: "🔧" },
        { v: "admin", l: "Администратор", emoji: "🛡️" },
      ]
    : [
        { v: "staff", l: "Сотрудник", emoji: "👤" },
        { v: "master", l: "Мастер", emoji: "🔧" },
      ];

  return (
    <div className="p-3 space-y-3">
      {/* Шапка со статами */}
      <div className="bg-gradient-to-br from-[#FFD700]/10 via-transparent to-blue-500/5 border border-[#FFD700]/20 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-roboto text-[#FFD700]/70 text-[10px] uppercase tracking-wider">Команда</div>
            <div className="font-oswald font-bold text-white text-2xl tabular-nums">{employees.length}</div>
          </div>
          <button onClick={() => setShowAdd(v => !v)}
            className={`flex items-center gap-1.5 font-oswald font-bold px-3.5 py-2.5 text-xs uppercase rounded-md transition-all active:scale-95 ${
              showAdd
                ? "bg-[#2A2A2A] text-white/60 border border-[#333]"
                : "bg-gradient-to-b from-[#FFD700] to-yellow-500 text-black shadow-lg shadow-[#FFD700]/20"
            }`}>
            <Icon name={showAdd ? "X" : "UserPlus"} size={14} />
            {showAdd ? "Отмена" : "Добавить"}
          </button>
        </div>
        <div className="flex gap-2 text-[10px] font-roboto flex-wrap">
          <div className="flex items-center gap-1 bg-green-500/10 border border-green-500/20 px-2 py-1 rounded-md">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-green-400 font-bold tabular-nums">{active}</span>
            <span className="text-green-400/70">активны</span>
          </div>
          {inactive > 0 && (
            <div className="flex items-center gap-1 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-md">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              <span className="text-red-400 font-bold tabular-nums">{inactive}</span>
              <span className="text-red-400/70">неактивны</span>
            </div>
          )}
        </div>
      </div>

      {/* Поиск + фильтры */}
      <div className="space-y-2">
        <div className="relative">
          <Icon name="Search" size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Поиск по ФИО, логину, email, телефону, должности"
            className="w-full bg-[#0A0A0A] border border-[#1F1F1F] text-white pl-9 pr-3 py-2.5 font-roboto text-sm rounded-md focus:outline-none focus:border-[#FFD700]/50 placeholder:text-white/25" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {[
            { v: "all", l: "Все" },
            { v: "active", l: "Активные" },
            { v: "inactive", l: "Неактивные" },
          ].map(s => {
            const a = statusFilter === s.v;
            return (
              <button key={s.v} onClick={() => setStatusFilter(s.v as "all" | "active" | "inactive")}
                className={`font-roboto text-[11px] px-3 py-1 rounded-full transition-all active:scale-95 ${
                  a ? "bg-[#FFD700] text-black font-bold" : "bg-[#141414] border border-[#1F1F1F] text-white/50 hover:text-white"
                }`}>{s.l}</button>
            );
          })}
          <span className="text-white/15">|</span>
          {[
            { v: "all", l: "Все роли" },
            { v: "owner", l: "👑" },
            { v: "admin", l: "🛡️" },
            { v: "master", l: "🔧" },
            { v: "staff", l: "👤" },
          ].map(s => {
            const a = roleFilter === s.v;
            return (
              <button key={s.v} onClick={() => setRoleFilter(s.v)}
                className={`font-roboto text-[11px] px-3 py-1 rounded-full transition-all active:scale-95 ${
                  a ? "bg-blue-500/30 border border-blue-400 text-blue-200 font-bold" : "bg-[#141414] border border-[#1F1F1F] text-white/50 hover:text-white"
                }`}>{s.l}</button>
            );
          })}
        </div>
      </div>

      {/* Форма добавления */}
      {showAdd && (
        <div className="bg-gradient-to-br from-[#1A1A1A] to-[#141414] border border-[#FFD700]/30 rounded-lg p-4 shadow-xl shadow-[#FFD700]/5 animate-in slide-in-from-top-2 duration-300">
          <div className="font-oswald font-bold text-[#FFD700] text-xs uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <Icon name="UserPlus" size={12} /> Новый сотрудник
          </div>
          <div className="space-y-2.5">
            {[
              { key: "full_name", label: "ФИО *", placeholder: "Иванов Иван Сергеевич", icon: "User" },
              { key: "login", label: "Логин *", placeholder: "ivanov", icon: "AtSign" },
              { key: "password", label: "Пароль *", placeholder: "••••••••", type: "password", icon: "Lock" },
              { key: "position", label: "Должность", placeholder: "Приёмщик", icon: "Briefcase", list: "positions" },
              { key: "email", label: "Email", placeholder: "ivanov@mail.ru", icon: "Mail", type: "email" },
              { key: "phone", label: "Телефон", placeholder: "+7 ...", icon: "Phone", type: "tel" },
            ].map(f => (
              <div key={f.key}>
                <label className="font-roboto text-white/40 text-[10px] block mb-1 uppercase tracking-wide">{f.label}</label>
                <div className="relative">
                  <Icon name={f.icon} size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                  <input type={f.type || "text"} value={(addForm as unknown as Record<string,string>)[f.key]}
                    list={f.list}
                    onChange={e => setAddForm(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full bg-[#0A0A0A] border border-[#1F1F1F] text-white pl-9 pr-3 py-2.5 font-roboto text-sm rounded-md focus:outline-none focus:border-[#FFD700]/50 focus:bg-[#141414] placeholder:text-white/25 transition-all" />
                </div>
              </div>
            ))}
            <datalist id="positions">
              {POSITION_SUGGESTIONS.map(p => <option key={p} value={p} />)}
            </datalist>
            <div>
              <label className="font-roboto text-white/40 text-[10px] block mb-1 uppercase tracking-wide">Заметка</label>
              <textarea value={addForm.note} onChange={e => setAddForm(p => ({ ...p, note: e.target.value }))}
                placeholder="Любая внутренняя информация"
                rows={2}
                className="w-full bg-[#0A0A0A] border border-[#1F1F1F] text-white px-3 py-2 font-roboto text-sm rounded-md focus:outline-none focus:border-[#FFD700]/50 placeholder:text-white/25 resize-none" />
            </div>
            <div>
              <label className="font-roboto text-white/40 text-[10px] block mb-1 uppercase tracking-wide">Роль</label>
              <div className="grid grid-cols-3 gap-2">
                {ROLES_AVAILABLE.map(r => {
                  const a = addForm.role === r.v;
                  return (
                    <button key={r.v} onClick={() => setAddForm(p => ({ ...p, role: r.v }))}
                      className={`py-2.5 px-2 rounded-md font-roboto text-xs transition-all active:scale-95 flex items-center justify-center gap-1 ${
                        a
                          ? "bg-[#FFD700]/15 border border-[#FFD700] text-[#FFD700] font-bold"
                          : "bg-[#0A0A0A] border border-[#1F1F1F] text-white/50 hover:text-white hover:border-[#333]"
                      }`}>
                      <span>{r.emoji}</span><span className="truncate">{r.l}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <button onClick={createEmployee} disabled={saving}
              className="w-full bg-gradient-to-b from-[#FFD700] to-yellow-500 text-black font-oswald font-bold py-3 uppercase text-xs rounded-md shadow-md shadow-[#FFD700]/20 hover:shadow-[#FFD700]/40 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5">
              {saving ? <Icon name="Loader" size={13} className="animate-spin" /> : <Icon name="Check" size={13} />}
              Создать сотрудника
            </button>
          </div>
        </div>
      )}

      {/* Список сотрудников */}
      {loading ? (
        <div className="flex items-center justify-center py-14 gap-2 text-white/40">
          <Icon name="Loader" size={18} className="animate-spin text-[#FFD700]" />
          <span className="font-roboto text-sm">Загружаю команду...</span>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(emp => {
            const style = ROLE_STYLES[emp.role] || ROLE_STYLES.staff;
            const initials = emp.full_name.trim().split(/\s+/).map(w => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "?";
            const isEditing = editId === emp.id;
            return (
              <div key={emp.id}
                className={`border rounded-lg transition-all overflow-hidden ${
                  isEditing
                    ? "bg-gradient-to-br from-[#1A1A1A] to-[#141414] border-[#FFD700]/40 shadow-lg shadow-[#FFD700]/5"
                    : emp.is_active
                      ? "bg-[#141414] border-[#1F1F1F] hover:border-[#2A2A2A]"
                      : "bg-[#0F0F0F] border-[#1A1A1A] opacity-60"
                }`}>
                {isEditing ? (
                  <div className="p-3 space-y-2.5">
                    <div className="flex items-center gap-2 pb-2 border-b border-[#1F1F1F]">
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${style.avatar} flex items-center justify-center font-oswald font-bold text-sm`}>
                        {initials}
                      </div>
                      <div>
                        <div className="font-oswald font-bold text-white text-sm">{emp.full_name}</div>
                        <div className="font-roboto text-white/40 text-[10px]">@{emp.login}</div>
                      </div>
                    </div>
                    {[
                      { key: "full_name", label: "ФИО", placeholder: emp.full_name, icon: "User" },
                      { key: "position", label: "Должность", placeholder: "Приёмщик", icon: "Briefcase", list: "positions" },
                      { key: "email", label: "Email", placeholder: "ivanov@mail.ru", icon: "Mail", type: "email" },
                      { key: "phone", label: "Телефон", placeholder: "+7 ...", icon: "Phone", type: "tel" },
                      { key: "password", label: "Новый пароль (пусто — не менять)", placeholder: "••••••••", type: "password", icon: "Lock" },
                    ].map(f => (
                      <div key={f.key}>
                        <label className="font-roboto text-white/40 text-[10px] block mb-1 uppercase tracking-wide">{f.label}</label>
                        <div className="relative">
                          <Icon name={f.icon} size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                          <input type={f.type || "text"} value={(editForm as unknown as Record<string,string>)[f.key]}
                            list={f.list}
                            onChange={e => setEditForm(p => ({ ...p, [f.key]: e.target.value }))}
                            placeholder={f.placeholder}
                            className="w-full bg-[#0A0A0A] border border-[#1F1F1F] text-white pl-9 pr-3 py-2 font-roboto text-sm rounded-md focus:outline-none focus:border-[#FFD700]/50" />
                        </div>
                      </div>
                    ))}
                    <div>
                      <label className="font-roboto text-white/40 text-[10px] block mb-1 uppercase tracking-wide">Заметка</label>
                      <textarea value={editForm.note} onChange={e => setEditForm(p => ({ ...p, note: e.target.value }))}
                        rows={2} placeholder="Внутренняя заметка"
                        className="w-full bg-[#0A0A0A] border border-[#1F1F1F] text-white px-3 py-2 font-roboto text-sm rounded-md focus:outline-none focus:border-[#FFD700]/50 placeholder:text-white/25 resize-none" />
                    </div>
                    {myRole === "owner" && emp.role !== "owner" && (
                      <div>
                        <label className="font-roboto text-white/40 text-[10px] block mb-1 uppercase tracking-wide">Роль</label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { v: "staff", l: "Сотрудник", emoji: "👤" },
                            { v: "master", l: "Мастер", emoji: "🔧" },
                            { v: "admin", l: "Администратор", emoji: "🛡️" },
                          ].map(r => {
                            const a = editForm.role === r.v;
                            return (
                              <button key={r.v} onClick={() => setEditForm(p => ({ ...p, role: r.v }))}
                                className={`py-2 px-2 rounded-md font-roboto text-xs transition-all active:scale-95 flex items-center justify-center gap-1 ${
                                  a
                                    ? "bg-[#FFD700]/15 border border-[#FFD700] text-[#FFD700] font-bold"
                                    : "bg-[#0A0A0A] border border-[#1F1F1F] text-white/50 hover:text-white"
                                }`}>
                                <span>{r.emoji}</span><span className="truncate">{r.l}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    <div className="flex gap-2 pt-1 flex-wrap">
                      <button onClick={() => updateEmployee(emp.id, {
                        full_name: editForm.full_name || undefined,
                        password: editForm.password || undefined,
                        role: editForm.role || undefined,
                        position: editForm.position,
                        email: editForm.email,
                        phone: editForm.phone,
                        note: editForm.note,
                      })}
                        className="flex-1 bg-gradient-to-b from-[#FFD700] to-yellow-500 text-black font-oswald font-bold px-3 py-2 uppercase text-xs rounded-md shadow-md shadow-[#FFD700]/20 active:scale-95 transition-all flex items-center justify-center gap-1">
                        <Icon name="Save" size={12} />Сохранить
                      </button>
                      {emp.role !== "owner" && (
                        <button onClick={() => updateEmployee(emp.id, { is_active: !emp.is_active })}
                          className={`font-roboto text-xs px-3 py-2 border rounded-md transition-all active:scale-95 flex items-center gap-1 ${
                            emp.is_active
                              ? "border-red-400/40 text-red-400 hover:bg-red-400/10"
                              : "border-green-400/40 text-green-400 hover:bg-green-400/10"
                          }`}>
                          <Icon name={emp.is_active ? "UserX" : "UserCheck"} size={12} />
                          {emp.is_active ? "Деактивировать" : "Активировать"}
                        </button>
                      )}
                      <button onClick={() => setEditId(null)}
                        className="text-white/40 hover:text-white font-roboto text-xs px-3 py-2 rounded-md border border-[#2A2A2A] transition-colors">
                        Отмена
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 flex items-start gap-3">
                    <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${style.avatar} flex items-center justify-center font-oswald font-bold text-sm shrink-0 relative`}>
                      {initials}
                      {emp.is_active && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-[#141414] rounded-full" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-oswald font-bold text-white text-sm uppercase truncate">{emp.full_name}</span>
                        <span className={`font-roboto text-[9px] px-2 py-0.5 rounded-full shrink-0 ${style.badge}`}>
                          {style.emoji} {ROLE_LABELS[emp.role] || emp.role}
                        </span>
                      </div>
                      {emp.position && (
                        <div className="font-roboto text-[11px] text-white/60 mb-0.5 flex items-center gap-1">
                          <Icon name="Briefcase" size={9} />{emp.position}
                        </div>
                      )}
                      <div className="flex items-center gap-2 font-roboto text-[10px] text-white/40 flex-wrap">
                        <span className="flex items-center gap-1"><Icon name="AtSign" size={9} />{emp.login}</span>
                        {emp.email && <span className="flex items-center gap-1"><Icon name="Mail" size={9} />{emp.email}</span>}
                        {emp.phone && <span className="flex items-center gap-1"><Icon name="Phone" size={9} />{emp.phone}</span>}
                        {!emp.is_active && (
                          <span className="bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded">неактивен</span>
                        )}
                      </div>
                      {emp.created_at && (
                        <div className="font-roboto text-[9px] text-white/25 mt-1 flex items-center gap-1">
                          <Icon name="Calendar" size={9} />
                          добавлен {new Date(emp.created_at).toLocaleDateString("ru-RU")}
                        </div>
                      )}
                    </div>
                    {emp.role !== "owner" && (
                      <button onClick={() => startEdit(emp)}
                        className="text-white/30 hover:text-[#FFD700] hover:bg-[#FFD700]/10 active:scale-90 transition-all p-2 rounded-md shrink-0">
                        <Icon name="Pencil" size={14} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="text-center py-14">
              <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-[#1A1A1A] to-[#0D0D0D] border border-[#222] rounded-full flex items-center justify-center">
                <Icon name="Users" size={28} className="text-white/20" />
              </div>
              <div className="font-oswald font-bold text-white/60 text-base uppercase mb-1">
                {employees.length === 0 ? "Команда пуста" : "Никого не нашлось"}
              </div>
              <div className="font-roboto text-white/30 text-xs">
                {employees.length === 0 ? "Добавьте первого сотрудника" : "Попробуй изменить поиск или фильтры"}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default EmployeesTab;