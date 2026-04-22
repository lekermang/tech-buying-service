import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { EMPLOYEE_AUTH_URL } from "./staff.types";

type Employee = { id: number; full_name: string; login: string; role: string; is_active: boolean; created_at: string };

const ROLE_LABELS: Record<string, string> = { owner: "Владелец", admin: "Администратор", staff: "Сотрудник" };
const ROLE_COLORS: Record<string, string> = { owner: "text-[#FFD700] border-[#FFD700]/40", admin: "text-blue-400 border-blue-400/40", staff: "text-white/50 border-white/10" };

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

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <span className="font-oswald font-bold uppercase text-sm text-white">Сотрудники <span className="text-white/40">({employees.length})</span></span>
        <button onClick={() => setShowAdd(v => !v)}
          className="flex items-center gap-1 bg-[#FFD700] text-black font-oswald font-bold px-3 py-1.5 text-xs uppercase hover:bg-yellow-400 transition-colors">
          <Icon name="Plus" size={13} /> Добавить
        </button>
      </div>

      {showAdd && (
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] p-4 mb-4 space-y-2">
          <div className="font-roboto text-white/40 text-[10px] uppercase tracking-wide mb-1">Новый сотрудник</div>
          {[
            { key: "full_name", label: "ФИО", placeholder: "Иванов Иван" },
            { key: "login", label: "Логин", placeholder: "ivanov" },
            { key: "password", label: "Пароль", placeholder: "••••••••", type: "password" },
          ].map(f => (
            <div key={f.key}>
              <label className="font-roboto text-white/30 text-[10px] block mb-1">{f.label}</label>
              <input type={f.type || "text"} value={(addForm as Record<string,string>)[f.key]}
                onChange={e => setAddForm(p => ({ ...p, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className="w-full bg-[#0D0D0D] border border-[#333] text-white px-3 py-2 font-roboto text-sm focus:outline-none focus:border-[#FFD700] transition-colors" />
            </div>
          ))}
          {myRole === "owner" && (
            <div>
              <label className="font-roboto text-white/30 text-[10px] block mb-1">Роль</label>
              <select value={addForm.role} onChange={e => setAddForm(p => ({ ...p, role: e.target.value }))}
                className="w-full bg-[#0D0D0D] border border-[#333] text-white px-3 py-2 font-roboto text-sm focus:outline-none focus:border-[#FFD700] appearance-none">
                <option value="staff">Сотрудник</option>
                <option value="admin">Администратор</option>
              </select>
            </div>
          )}
          {addError && <div className="text-red-400 font-roboto text-xs">{addError}</div>}
          <div className="flex gap-2 pt-1">
            <button onClick={createEmployee} disabled={saving}
              className="bg-[#FFD700] text-black font-oswald font-bold px-4 py-1.5 uppercase text-xs hover:bg-yellow-400 disabled:opacity-50 transition-colors">
              {saving ? "..." : "Создать"}
            </button>
            <button onClick={() => { setShowAdd(false); setAddError(""); }} className="text-white/30 font-roboto text-xs hover:text-white">Отмена</button>
          </div>
        </div>
      )}

      {loading ? <div className="text-center py-8 text-white/30 text-sm">Загружаю...</div> : (
        <div className="space-y-2">
          {employees.map(emp => (
            <div key={emp.id} className={`bg-[#1A1A1A] border p-3 ${emp.is_active ? "border-[#2A2A2A]" : "border-white/5 opacity-50"}`}>
              {editId === emp.id ? (
                <div className="space-y-2">
                  <div>
                    <label className="font-roboto text-white/30 text-[10px] block mb-1">ФИО</label>
                    <input value={editName} onChange={e => setEditName(e.target.value)} placeholder={emp.full_name}
                      className="w-full bg-[#0D0D0D] border border-[#333] text-white px-2 py-1.5 font-roboto text-xs focus:outline-none focus:border-[#FFD700]" />
                  </div>
                  <div>
                    <label className="font-roboto text-white/30 text-[10px] block mb-1">Новый пароль (оставьте пустым чтобы не менять)</label>
                    <input type="password" value={editPw} onChange={e => setEditPw(e.target.value)} placeholder="••••••••"
                      className="w-full bg-[#0D0D0D] border border-[#333] text-white px-2 py-1.5 font-roboto text-xs focus:outline-none focus:border-[#FFD700]" />
                  </div>
                  {myRole === "owner" && emp.role !== "owner" && (
                    <div>
                      <label className="font-roboto text-white/30 text-[10px] block mb-1">Роль</label>
                      <select value={editRole} onChange={e => setEditRole(e.target.value)}
                        className="w-full bg-[#0D0D0D] border border-[#333] text-white px-2 py-1.5 font-roboto text-xs focus:outline-none focus:border-[#FFD700] appearance-none">
                        <option value="staff">Сотрудник</option>
                        <option value="admin">Администратор</option>
                      </select>
                    </div>
                  )}
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => updateEmployee(emp.id, { full_name: editName || undefined, password: editPw || undefined, role: editRole || undefined })}
                      className="bg-[#FFD700] text-black font-oswald font-bold px-3 py-1.5 uppercase text-xs hover:bg-yellow-400 transition-colors">
                      Сохранить
                    </button>
                    {emp.role !== "owner" && (
                      <button onClick={() => updateEmployee(emp.id, { is_active: !emp.is_active })}
                        className={`font-roboto text-xs px-3 py-1.5 border transition-colors ${emp.is_active ? "border-red-400/40 text-red-400 hover:bg-red-400/10" : "border-green-400/40 text-green-400 hover:bg-green-400/10"}`}>
                        {emp.is_active ? "Деактивировать" : "Активировать"}
                      </button>
                    )}
                    <button onClick={() => setEditId(null)} className="text-white/30 font-roboto text-xs hover:text-white">Отмена</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-roboto text-sm text-white">{emp.full_name}</span>
                      <span className={`font-roboto text-[10px] border px-1.5 py-0.5 ${ROLE_COLORS[emp.role] || "text-white/40 border-white/10"}`}>
                        {ROLE_LABELS[emp.role] || emp.role}
                      </span>
                      {!emp.is_active && <span className="font-roboto text-[10px] text-red-400">неактивен</span>}
                    </div>
                    <div className="font-roboto text-[10px] text-white/30">@{emp.login}</div>
                  </div>
                  {emp.role !== "owner" && (
                    <button onClick={() => { setEditId(emp.id); setEditPw(""); setEditRole(emp.role); setEditName(emp.full_name); }}
                      className="text-white/30 hover:text-[#FFD700] transition-colors p-1">
                      <Icon name="Pencil" size={13} />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
