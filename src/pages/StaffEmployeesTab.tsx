import { useState, useEffect, useCallback, useMemo } from "react";
import Icon from "@/components/ui/icon";
import { EMPLOYEE_AUTH_URL } from "./staff.types";
import { useStaffToast } from "./staff/StaffToast";
import useDebouncedValue from "@/hooks/useDebouncedValue";
import { Employee, EmployeeSession, FormFields, EMPTY_FORM } from "./employeesTab/employeesTabTypes";
import EmployeesHeader from "./employeesTab/EmployeesHeader";
import EmployeesFilters from "./employeesTab/EmployeesFilters";
import EmployeesAddForm from "./employeesTab/EmployeesAddForm";
import EmployeeCard from "./employeesTab/EmployeeCard";

export function EmployeesTab({ token, myRole }: { token: string; myRole: string }) {
  const toast = useStaffToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [sessions, setSessions] = useState<EmployeeSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<FormFields>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<FormFields>(EMPTY_FORM);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const loadSessions = useCallback(async () => {
    if (myRole !== "owner") return;
    try {
      const res = await fetch(`${EMPLOYEE_AUTH_URL}?action=sessions`, { headers: { "X-Employee-Token": token } });
      const data = await res.json();
      setSessions(data.sessions || []);
    } catch (_) { /* ignore */ }
  }, [token, myRole]);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const res = await fetch(`${EMPLOYEE_AUTH_URL}?action=list`, { headers: { "X-Employee-Token": token }, signal });
      const data = await res.json();
      setEmployees(data.employees || []);
    } catch (_) { /* abort/network */ }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => {
    const ctrl = new AbortController();
    load(ctrl.signal);
    loadSessions();
    // Обновляем сессии каждые 30 секунд
    const id = setInterval(loadSessions, 30_000);
    return () => { ctrl.abort(); clearInterval(id); };
  }, [load, loadSessions]);

  const debouncedSearch = useDebouncedValue(search, 250);
  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return employees.filter(e => {
      if (statusFilter === "active" && !e.is_active) return false;
      if (statusFilter === "inactive" && e.is_active) return false;
      if (roleFilter !== "all" && e.role !== roleFilter) return false;
      if (!q) return true;
      const hay = [e.full_name, e.login, e.email || "", e.phone || "", e.position || ""].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [employees, debouncedSearch, statusFilter, roleFilter]);

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
      <EmployeesHeader
        total={employees.length}
        active={active}
        inactive={inactive}
        showAdd={showAdd}
        setShowAdd={setShowAdd}
      />

      <EmployeesFilters
        search={search}
        setSearch={setSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        roleFilter={roleFilter}
        setRoleFilter={setRoleFilter}
      />

      {showAdd && (
        <EmployeesAddForm
          addForm={addForm}
          setAddForm={setAddForm}
          saving={saving}
          rolesAvailable={ROLES_AVAILABLE}
          createEmployee={createEmployee}
        />
      )}

      {/* Список сотрудников */}
      {loading ? (
        <div className="flex items-center justify-center py-14 gap-2 text-white/40">
          <Icon name="Loader" size={18} className="animate-spin text-[#FFD700]" />
          <span className="font-roboto text-sm">Загружаю команду...</span>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(emp => (
            <EmployeeCard
              key={emp.id}
              emp={emp}
              isEditing={editId === emp.id}
              editForm={editForm}
              setEditForm={setEditForm}
              myRole={myRole}
              startEdit={startEdit}
              cancelEdit={() => setEditId(null)}
              updateEmployee={updateEmployee}
              sessions={sessions}
            />
          ))}

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