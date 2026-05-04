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

  const inp = "w-full bg-gradient-to-br from-[#0E0E0E] to-[#0A0A0A] border border-[#1F1F1F] hover:border-[#262626] focus:border-[#FFD700]/60 focus:bg-[#101010] focus:shadow-[0_0_0_3px_rgba(255,215,0,0.08)] text-white pl-9 pr-3 py-2.5 font-roboto text-sm rounded-md focus:outline-none placeholder:text-white/25 transition-all";

  return (
    <>
      {/* Премиум-карточка «Поиск клиента» */}
      <div className="relative rounded-xl overflow-hidden">
        <div className="absolute -inset-1 rounded-xl pointer-events-none opacity-50" style={{ background: "radial-gradient(closest-side,rgba(255,215,0,0.12),transparent 70%)", filter: "blur(12px)" }} />
        <div className="relative bg-gradient-to-br from-[#1A1A1A] via-[#141414] to-[#0E0E0E] border border-[#FFD700]/20 rounded-xl p-4 shadow-[0_4px_18px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,215,0,0.04)] overflow-hidden">
          <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FFD700]/55 to-transparent pointer-events-none" />
          <span aria-hidden className="absolute -top-10 -left-10 w-28 h-28 rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(255,215,0,0.10)" }} />
          <div className="relative font-oswald font-bold uppercase text-sm mb-3 flex items-center gap-1.5">
            <Icon name="Search" size={14} className="text-[#FFD700] drop-shadow-[0_0_4px_rgba(255,215,0,0.5)]" />
            <span className="bg-gradient-to-r from-[#FFD700] via-[#fff3a0] to-[#FFD700] bg-clip-text text-transparent animate-shimmer">Поиск клиента</span>
          </div>
          <div className="relative flex gap-2 mb-3">
            <div className="flex-1 relative">
              <Icon name="Phone" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#FFD700]/60 pointer-events-none z-10" />
              <input value={phone} onChange={e => setPhone(formatPhone(e.target.value))} onKeyDown={e => e.key === "Enter" && search()}
                placeholder="+7 (___) ___-__-__"
                className={inp} />
            </div>
            <button onClick={search} disabled={!phone || searching}
              title="Найти клиента по телефону"
              className="btn-gold-premium !py-2.5 !px-4 disabled:opacity-50 disabled:cursor-not-allowed">
              {searching ? <Icon name="Loader" size={13} className="animate-spin" /> : <Icon name="Search" size={13} />}
              Найти
            </button>
          </div>

          {found && (
            <div className="relative bg-gradient-to-br from-[#FFD700]/15 via-[#FFD700]/5 to-transparent border border-[#FFD700]/40 rounded-lg p-3 animate-in fade-in slide-in-from-top-1 duration-300 shadow-[0_0_18px_rgba(255,215,0,0.18)] overflow-hidden">
              <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FFD700]/55 to-transparent" />
              <div className="relative flex items-start gap-3">
                {/* Conic-медальон с инициалами */}
                <div className="relative w-12 h-12 rounded-full p-[1.5px] bg-[conic-gradient(from_0deg,#b8860b,#ffd700,#fff3a0,#ffd700,#b8860b)] shadow-[0_0_14px_rgba(255,215,0,0.5)] shrink-0">
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-[#FFE34D] via-[#FFD700] to-[#d4a017] flex items-center justify-center font-oswald font-bold text-black drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
                    {foundInitials}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-oswald font-bold text-white text-base uppercase truncate">{fName}</div>
                  <a href={`tel:${fPhone}`} className="font-roboto text-[#FFD700] text-sm flex items-center gap-1.5 mt-0.5 hover:drop-shadow-[0_0_6px_rgba(255,215,0,0.6)] transition">
                    <Icon name="Phone" size={11} />{fPhone}
                  </a>
                  {fEmail && (
                    <div className="font-roboto text-white/55 text-xs flex items-center gap-1.5 mt-0.5">
                      <Icon name="Mail" size={10} />{fEmail}
                    </div>
                  )}
                  <div className="flex gap-2 mt-2">
                    <div className="bg-[#FFD700]/15 border border-[#FFD700]/40 px-2 py-1 rounded-md shadow-[0_0_10px_rgba(255,215,0,0.20)]">
                      <div className="font-roboto text-[#FFD700]/70 text-[9px] uppercase tracking-wider font-bold">Скидка</div>
                      <div className="font-oswald font-bold text-[#FFD700] text-sm tabular-nums drop-shadow-[0_0_4px_rgba(255,215,0,0.4)]">{fDiscount}%</div>
                    </div>
                    <div className="bg-emerald-500/15 border border-emerald-500/40 px-2 py-1 rounded-md shadow-[0_0_10px_rgba(16,185,129,0.20)]">
                      <div className="font-roboto text-emerald-300/70 text-[9px] uppercase tracking-wider font-bold">Баллы</div>
                      <div className="font-oswald font-bold text-emerald-300 text-sm tabular-nums drop-shadow-[0_0_4px_rgba(16,185,129,0.4)]">{fPoints}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Премиум-карточка «Новый клиент» */}
      <div className="relative rounded-xl overflow-hidden">
        <div className="absolute -inset-1 rounded-xl pointer-events-none opacity-40" style={{ background: "radial-gradient(closest-side,rgba(255,215,0,0.10),transparent 70%)", filter: "blur(10px)" }} />
        <div className="relative bg-gradient-to-br from-[#1A1A1A] via-[#141414] to-[#0E0E0E] border border-[#1F1F1F] rounded-xl p-4 shadow-[0_4px_18px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,215,0,0.04)] overflow-hidden">
          <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FFD700]/35 to-transparent pointer-events-none" />
          <div className="relative font-oswald font-bold uppercase text-sm mb-3 flex items-center gap-1.5">
            <Icon name="UserPlus" size={14} className="text-[#FFD700] drop-shadow-[0_0_4px_rgba(255,215,0,0.5)]" />
            <span className="bg-gradient-to-r from-[#FFD700] via-[#fff3a0] to-[#FFD700] bg-clip-text text-transparent animate-shimmer">Новый клиент</span>
          </div>
          <div className="relative space-y-2.5">
            {[
              { key: "full_name", label: "ФИО", placeholder: "Иванов Иван Иванович", icon: "User" },
              { key: "phone", label: "Телефон *", placeholder: "+7 (___) ___-__-__", icon: "Phone" },
              { key: "email", label: "Email", placeholder: "mail@example.com", icon: "Mail" },
            ].map(f => (
              <div key={f.key}>
                <label className="font-roboto text-white/55 text-[10px] block mb-1 uppercase tracking-[0.06em] font-bold">{f.label}</label>
                <div className="relative">
                  <Icon name={f.icon} size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#FFD700]/60 pointer-events-none z-10" />
                  <input
                    value={(addForm as Record<string, string>)[f.key]}
                    onChange={e => setAddForm(p => ({ ...p, [f.key]: f.key === "phone" ? formatPhone(e.target.value) : e.target.value }))}
                    placeholder={f.placeholder}
                    className={inp} />
                </div>
              </div>
            ))}
            <button onClick={addClient} disabled={!addForm.phone || !addForm.full_name || addLoading}
              title="Добавить нового клиента в базу"
              className="btn-gold-premium w-full !py-3 mt-2 disabled:opacity-50 disabled:cursor-not-allowed">
              {addLoading ? <Icon name="Loader" size={13} className="animate-spin" /> : <Icon name="UserPlus" size={13} />}
              Добавить клиента
            </button>
          </div>
        </div>
      </div>
    </>
  );
}