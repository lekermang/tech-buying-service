import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { EMPLOYEE_AUTH_URL } from "./staff.types";

type Employee = { id: number; full_name: string; login: string; role: string; is_active: boolean; created_at: string };

const ROLE_LABELS: Record<string, string> = { owner: "Владелец", admin: "Администратор", staff: "Сотрудник" };
const ROLE_STYLES: Record<string, { badge: string; avatar: string; icon: string; emoji: string }> = {
  owner: { badge: "bg-gradient-to-r from-[#FFD700] to-yellow-500 text-black", avatar: "from-[#FFD700] to-yellow-600 text-black", icon: "Crown", emoji: "👑" },
  admin: { badge: "bg-gradient-to-r from-blue-500/30 to-blue-600/20 text-blue-300 border border-blue-400/30", avatar: "from-blue-500 to-blue-700 text-white", icon: "Shield", emoji: "🛡️" },
  staff: { badge: "bg-white/10 text-white/70 border border-white/10", avatar: "from-[#333] to-[#1a1a1a] text-white/70", icon: "User", emoji: "👤" },
};

export function EmployeesTab({ token, myRole }: { token: string; myRole: string }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ full_name: "", login: "", password: "", role: "staff" });
  const [saving, setSaving] = useState(false);
  const [addError, setAddError] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [editPw, setEditPw] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editName, setEditName] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`${EMPLOYEE_AUTH_URL}?action=list`, { headers: { "X-Employee-Token": token } });
    const data = await res.json();
    setEmployees(data.employees || []);
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const createEmployee = async () => {
    if (!addForm.full_name || !addForm.login || !addForm.password) { setAddError("Заполните все поля"); return; }
    setSaving(true); setAddError("");
    const res = await fetch(EMPLOYEE_AUTH_URL, { method: "POST", headers: { "Content-Type": "application/json", "X-Employee-Token": token },
      body: JSON.stringify({ action: "create", ...addForm }) });
    const data = await res.json();
    setSaving(false);
    if (data.ok) { setShowAdd(false); setAddForm({ full_name: "", login: "", password: "", role: "staff" }); load(); }
    else setAddError(data.error || "Ошибка");
  };

  const updateEmployee = async (id: number, fields: Record<string, unknown>) => {
    await fetch(EMPLOYEE_AUTH_URL, { method: "PUT", headers: { "Content-Type": "application/json", "X-Employee-Token": token },
      body: JSON.stringify({ id, ...fields }) });
    setEditId(null); load();
  };

  const active = employees.filter(e => e.is_active).length;
  const inactive = employees.length - active;

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
        <div className="flex gap-2 text-[10px] font-roboto">
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

      {/* Форма добавления */}
      {showAdd && (
        <div className="bg-gradient-to-br from-[#1A1A1A] to-[#141414] border border-[#FFD700]/30 rounded-lg p-4 shadow-xl shadow-[#FFD700]/5 animate-in slide-in-from-top-2 duration-300">
          <div className="font-oswald font-bold text-[#FFD700] text-xs uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <Icon name="UserPlus" size={12} /> Новый сотрудник
          </div>
          <div className="space-y-2.5">
            {[
              { key: "full_name", label: "ФИО", placeholder: "Иванов Иван", icon: "User" },
              { key: "login", label: "Логин", placeholder: "ivanov", icon: "AtSign" },
              { key: "password", label: "Пароль", placeholder: "••••••••", type: "password", icon: "Lock" },
            ].map(f => (
              <div key={f.key}>
                <label className="font-roboto text-white/40 text-[10px] block mb-1 uppercase tracking-wide">{f.label}</label>
                <div className="relative">
                  <Icon name={f.icon} size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                  <input type={f.type || "text"} value={(addForm as Record<string,string>)[f.key]}
                    onChange={e => setAddForm(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full bg-[#0A0A0A] border border-[#1F1F1F] text-white pl-9 pr-3 py-2.5 font-roboto text-sm rounded-md focus:outline-none focus:border-[#FFD700]/50 focus:bg-[#141414] placeholder:text-white/25 transition-all" />
                </div>
              </div>
            ))}
            {myRole === "owner" && (
              <div>
                <label className="font-roboto text-white/40 text-[10px] block mb-1 uppercase tracking-wide">Роль</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { v: "staff", l: "Сотрудник", emoji: "👤" },
                    { v: "admin", l: "Администратор", emoji: "🛡️" },
                  ].map(r => {
                    const active = addForm.role === r.v;
                    return (
                      <button key={r.v} onClick={() => setAddForm(p => ({ ...p, role: r.v }))}
                        className={`py-2.5 px-3 rounded-md font-roboto text-sm transition-all active:scale-95 flex items-center justify-center gap-1.5 ${
                          active
                            ? "bg-[#FFD700]/15 border border-[#FFD700] text-[#FFD700] font-bold"
                            : "bg-[#0A0A0A] border border-[#1F1F1F] text-white/50 hover:text-white hover:border-[#333]"
                        }`}>
                        <span>{r.emoji}</span>{r.l}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {addError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded px-2.5 py-2 text-red-400 font-roboto text-xs flex items-center gap-1.5">
                <Icon name="AlertCircle" size={12} />{addError}
              </div>
            )}
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
          {employees.map(emp => {
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
                    <div>
                      <label className="font-roboto text-white/40 text-[10px] block mb-1 uppercase tracking-wide">ФИО</label>
                      <input value={editName} onChange={e => setEditName(e.target.value)} placeholder={emp.full_name}
                        className="w-full bg-[#0A0A0A] border border-[#1F1F1F] text-white px-3 py-2 font-roboto text-sm rounded-md focus:outline-none focus:border-[#FFD700]/50" />
                    </div>
                    <div>
                      <label className="font-roboto text-white/40 text-[10px] block mb-1 uppercase tracking-wide">Новый пароль (оставьте пустым чтобы не менять)</label>
                      <input type="password" value={editPw} onChange={e => setEditPw(e.target.value)} placeholder="••••••••"
                        className="w-full bg-[#0A0A0A] border border-[#1F1F1F] text-white px-3 py-2 font-roboto text-sm rounded-md focus:outline-none focus:border-[#FFD700]/50" />
                    </div>
                    {myRole === "owner" && emp.role !== "owner" && (
                      <div>
                        <label className="font-roboto text-white/40 text-[10px] block mb-1 uppercase tracking-wide">Роль</label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { v: "staff", l: "Сотрудник", emoji: "👤" },
                            { v: "admin", l: "Администратор", emoji: "🛡️" },
                          ].map(r => {
                            const activeRole = editRole === r.v;
                            return (
                              <button key={r.v} onClick={() => setEditRole(r.v)}
                                className={`py-2 px-2.5 rounded-md font-roboto text-xs transition-all active:scale-95 flex items-center justify-center gap-1 ${
                                  activeRole
                                    ? "bg-[#FFD700]/15 border border-[#FFD700] text-[#FFD700] font-bold"
                                    : "bg-[#0A0A0A] border border-[#1F1F1F] text-white/50 hover:text-white"
                                }`}>
                                <span>{r.emoji}</span>{r.l}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    <div className="flex gap-2 pt-1 flex-wrap">
                      <button onClick={() => updateEmployee(emp.id, { full_name: editName || undefined, password: editPw || undefined, role: editRole || undefined })}
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
                  <div className="p-3 flex items-center gap-3">
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
                      <div className="flex items-center gap-2 font-roboto text-[10px] text-white/40">
                        <span className="flex items-center gap-1"><Icon name="AtSign" size={9} />{emp.login}</span>
                        {!emp.is_active && (
                          <span className="bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded">неактивен</span>
                        )}
                      </div>
                    </div>
                    {emp.role !== "owner" && (
                      <button onClick={() => { setEditId(emp.id); setEditPw(""); setEditRole(emp.role); setEditName(emp.full_name); }}
                        className="text-white/30 hover:text-[#FFD700] hover:bg-[#FFD700]/10 active:scale-90 transition-all p-2 rounded-md shrink-0">
                        <Icon name="Pencil" size={14} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {employees.length === 0 && (
            <div className="text-center py-14">
              <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-[#1A1A1A] to-[#0D0D0D] border border-[#222] rounded-full flex items-center justify-center">
                <Icon name="Users" size={28} className="text-white/20" />
              </div>
              <div className="font-oswald font-bold text-white/60 text-base uppercase mb-1">Команда пуста</div>
              <div className="font-roboto text-white/30 text-xs">Добавьте первого сотрудника</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
