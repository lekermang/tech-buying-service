import Icon from "@/components/ui/icon";
import { FormFields, POSITION_SUGGESTIONS } from "./employeesTabTypes";

type RoleOption = { v: string; l: string; emoji: string };

type Props = {
  addForm: FormFields;
  setAddForm: React.Dispatch<React.SetStateAction<FormFields>>;
  saving: boolean;
  rolesAvailable: RoleOption[];
  createEmployee: () => void;
};

export default function EmployeesAddForm({ addForm, setAddForm, saving, rolesAvailable, createEmployee }: Props) {
  return (
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
            {rolesAvailable.map(r => {
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
  );
}
