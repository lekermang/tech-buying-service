import Icon from "@/components/ui/icon";
import { Employee, FormFields, ROLE_LABELS, ROLE_STYLES } from "./employeesTabTypes";

type Props = {
  emp: Employee;
  isEditing: boolean;
  editForm: FormFields;
  setEditForm: React.Dispatch<React.SetStateAction<FormFields>>;
  myRole: string;
  startEdit: (emp: Employee) => void;
  cancelEdit: () => void;
  updateEmployee: (id: number, fields: Record<string, unknown>) => void;
};

export default function EmployeeCard({
  emp, isEditing, editForm, setEditForm, myRole,
  startEdit, cancelEdit, updateEmployee,
}: Props) {
  const style = ROLE_STYLES[emp.role] || ROLE_STYLES.staff;
  const initials = emp.full_name.trim().split(/\s+/).map(w => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "?";

  return (
    <div
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
            <button onClick={cancelEdit}
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
}
