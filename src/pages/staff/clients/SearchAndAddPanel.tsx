import Icon from "@/components/ui/icon";
import { formatPhone } from "@/lib/phoneFormat";

type SearchAndAddProps = {
  phone: string;
  setPhone: (v: string) => void;
  search: () => void;
  searching: boolean;
  found: Record<string, unknown> | null;
  addForm: { full_name: string; phone: string; email: string };
  setAddForm: React.Dispatch<React.SetStateAction<{ full_name: string; phone: string; email: string }>>;
  addClient: () => void;
  addLoading: boolean;
};

export default function SearchAndAddPanel({
  phone, setPhone, search, searching, found,
  addForm, setAddForm, addClient, addLoading,
}: SearchAndAddProps) {
  const fName = (found as { full_name?: string })?.full_name || "";
  const fPhone = (found as { phone?: string })?.phone || "";
  const fEmail = (found as { email?: string })?.email || "";
  const fDiscount = (found as { discount_pct?: number })?.discount_pct || 0;
  const fPoints = (found as { loyalty_points?: number })?.loyalty_points || 0;
  const foundInitials = fName.trim().split(/\s+/).map(w => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "?";

  return (
    <>
      {/* Поиск клиента */}
      <div className="bg-gradient-to-br from-[#141414] to-[#0A0A0A] border border-[#1F1F1F] rounded-lg p-4">
        <div className="font-oswald font-bold uppercase text-sm text-white mb-3 flex items-center gap-1.5">
          <Icon name="Search" size={14} className="text-[#FFD700]" />
          Поиск клиента
        </div>
        <div className="flex gap-2 mb-3">
          <div className="flex-1 relative">
            <Icon name="Phone" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
            <input value={phone} onChange={e => setPhone(formatPhone(e.target.value))} onKeyDown={e => e.key === "Enter" && search()}
              placeholder="+7 (___) ___-__-__"
              className="w-full bg-[#0A0A0A] border border-[#1F1F1F] text-white pl-9 pr-3 py-2.5 font-roboto text-sm rounded-md focus:outline-none focus:border-[#FFD700]/50 focus:bg-[#141414] placeholder:text-white/25 transition-all" />
          </div>
          <button onClick={search} disabled={!phone || searching}
            className="bg-gradient-to-b from-[#FFD700] to-yellow-500 text-black font-oswald font-bold px-4 py-2.5 uppercase text-xs rounded-md shadow-md shadow-[#FFD700]/20 hover:shadow-[#FFD700]/40 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-1.5">
            {searching ? <Icon name="Loader" size={13} className="animate-spin" /> : <Icon name="Search" size={13} />}
            Найти
          </button>
        </div>

        {found && (
          <div className="bg-gradient-to-br from-[#FFD700]/10 to-transparent border border-[#FFD700]/30 rounded-lg p-3 animate-in fade-in slide-in-from-top-1 duration-300">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#FFD700] to-yellow-600 flex items-center justify-center font-oswald font-bold text-black shrink-0">
                {foundInitials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-oswald font-bold text-white text-base uppercase truncate">{fName}</div>
                <div className="font-roboto text-[#FFD700]/80 text-sm flex items-center gap-1.5 mt-0.5">
                  <Icon name="Phone" size={11} />{fPhone}
                </div>
                {fEmail && (
                  <div className="font-roboto text-white/50 text-xs flex items-center gap-1.5 mt-0.5">
                    <Icon name="Mail" size={10} />{fEmail}
                  </div>
                )}
                <div className="flex gap-3 mt-2">
                  <div className="bg-[#FFD700]/10 border border-[#FFD700]/30 px-2 py-1 rounded-md">
                    <div className="font-roboto text-[#FFD700]/60 text-[9px] uppercase">Скидка</div>
                    <div className="font-oswald font-bold text-[#FFD700] text-sm tabular-nums">{fDiscount}%</div>
                  </div>
                  <div className="bg-green-500/10 border border-green-500/30 px-2 py-1 rounded-md">
                    <div className="font-roboto text-green-400/60 text-[9px] uppercase">Баллы</div>
                    <div className="font-oswald font-bold text-green-400 text-sm tabular-nums">{fPoints}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Добавить клиента */}
      <div className="bg-gradient-to-br from-[#141414] to-[#0A0A0A] border border-[#1F1F1F] rounded-lg p-4">
        <div className="font-oswald font-bold uppercase text-sm text-white mb-3 flex items-center gap-1.5">
          <Icon name="UserPlus" size={14} className="text-[#FFD700]" />
          Новый клиент
        </div>
        <div className="space-y-2.5">
          {[
            { key: "full_name", label: "ФИО", placeholder: "Иванов Иван Иванович", icon: "User" },
            { key: "phone", label: "Телефон *", placeholder: "+7 (___) ___-__-__", icon: "Phone" },
            { key: "email", label: "Email", placeholder: "mail@example.com", icon: "Mail" },
          ].map(f => (
            <div key={f.key}>
              <label className="font-roboto text-white/40 text-[10px] block mb-1 uppercase tracking-wide">{f.label}</label>
              <div className="relative">
                <Icon name={f.icon} size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                <input
                  value={(addForm as Record<string, string>)[f.key]}
                  onChange={e => setAddForm(p => ({ ...p, [f.key]: f.key === "phone" ? formatPhone(e.target.value) : e.target.value }))}
                  placeholder={f.placeholder}
                  className="w-full bg-[#0A0A0A] border border-[#1F1F1F] text-white pl-9 pr-3 py-2.5 font-roboto text-sm rounded-md focus:outline-none focus:border-[#FFD700]/50 focus:bg-[#141414] placeholder:text-white/25 transition-all" />
              </div>
            </div>
          ))}
          <button onClick={addClient} disabled={!addForm.phone || !addForm.full_name || addLoading}
            className="w-full bg-gradient-to-b from-[#FFD700] to-yellow-500 text-black font-oswald font-bold py-3 uppercase text-xs rounded-md shadow-md shadow-[#FFD700]/20 hover:shadow-[#FFD700]/40 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 mt-2">
            {addLoading ? <Icon name="Loader" size={13} className="animate-spin" /> : <Icon name="UserPlus" size={13} />}
            Добавить клиента
          </button>
        </div>
      </div>
    </>
  );
}
