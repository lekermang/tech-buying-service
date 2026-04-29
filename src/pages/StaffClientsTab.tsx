import { useState, useMemo } from "react";
import Icon from "@/components/ui/icon";
import { AUTH_CLIENT_URL, EMPLOYEE_AUTH_URL } from "./staff.types";
import { formatPhone } from "@/lib/phoneFormat";
import { useStaffToast } from "./staff/StaffToast";
import useDebouncedValue from "@/hooks/useDebouncedValue";

type Client = { id: number; full_name: string; phone: string; email: string | null; discount_pct: number; loyalty_points: number; registered_at: string | null };

export function ClientsTab({ token }: { token: string }) {
  const toast = useStaffToast();
  const [phone, setPhone] = useState("");
  const [found, setFound] = useState<Record<string, unknown> | null>(null);
  const [searching, setSearching] = useState(false);
  const [addForm, setAddForm] = useState({ full_name: "", phone: "", email: "" });
  const [addLoading, setAddLoading] = useState(false);
  const [allClients, setAllClients] = useState<Client[]>([]);
  const [loadingAll, setLoadingAll] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [filter, setFilter] = useState("");

  const search = async () => {
    if (!phone) return;
    setSearching(true);
    setFound(null);
    try {
      const res = await fetch(`${AUTH_CLIENT_URL}?action=profile&phone=${encodeURIComponent(phone)}`);
      const data = await res.json();
      if (data.id) {
        setFound(data);
        toast.success(`Найден: ${data.full_name || "клиент"}`);
      } else {
        toast.error("Клиент не найден");
      }
    } catch {
      toast.error("Ошибка поиска. Проверьте интернет.");
    } finally {
      setSearching(false);
    }
  };

  const addClient = async () => {
    if (!addForm.phone || !addForm.full_name) {
      toast.warning("Заполните ФИО и телефон");
      return;
    }
    setAddLoading(true);
    const tid = toast.loading("Добавляю клиента...");
    try {
      const res = await fetch(AUTH_CLIENT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "register", ...addForm }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && (data.ok !== false)) {
        toast.update(tid, { kind: "success", message: "Клиент добавлен", duration: 3000 });
        setAddForm({ full_name: "", phone: "", email: "" });
        if (showAll) loadAllClients();
      } else {
        toast.update(tid, { kind: "error", message: data.error || "Не удалось добавить клиента", duration: 5000 });
      }
    } catch {
      toast.update(tid, { kind: "error", message: "Сбой сети при добавлении", duration: 5000 });
    } finally {
      setAddLoading(false);
    }
  };

  const loadAllClients = async () => {
    setLoadingAll(true);
    const res = await fetch(`${EMPLOYEE_AUTH_URL}?action=clients`, { headers: { "X-Employee-Token": token } });
    const data = await res.json();
    setAllClients(data.clients || []);
    setLoadingAll(false);
    setShowAll(true);
  };

  const debouncedFilter = useDebouncedValue(filter, 250);
  const filtered = useMemo(() => {
    const q = debouncedFilter.trim().toLowerCase();
    if (!q) return allClients;
    return allClients.filter(c =>
      c.full_name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      (c.email || "").toLowerCase().includes(q)
    );
  }, [allClients, debouncedFilter]);

  const fName = (found as { full_name?: string })?.full_name || "";
  const fPhone = (found as { phone?: string })?.phone || "";
  const fEmail = (found as { email?: string })?.email || "";
  const fDiscount = (found as { discount_pct?: number })?.discount_pct || 0;
  const fPoints = (found as { loyalty_points?: number })?.loyalty_points || 0;
  const foundInitials = fName.trim().split(/\s+/).map(w => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "?";

  return (
    <div className="p-3 space-y-4">
      {/* Поиск клиента — premium */}
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

      {/* Добавить клиента — premium */}
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

      {/* Все клиенты — premium */}
      <div className="bg-gradient-to-br from-[#141414] to-[#0A0A0A] border border-[#1F1F1F] rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="font-oswald font-bold uppercase text-sm text-white flex items-center gap-1.5">
            <Icon name="Users" size={14} className="text-[#FFD700]" />
            База клиентов
            {showAll && <span className="bg-[#FFD700]/15 text-[#FFD700] font-oswald text-[11px] px-2 py-0.5 rounded-full tabular-nums">{allClients.length}</span>}
          </div>
          {!showAll && (
            <button onClick={loadAllClients} disabled={loadingAll}
              className="bg-[#FFD700]/10 border border-[#FFD700]/30 text-[#FFD700] font-roboto text-xs px-3 py-1.5 rounded-md hover:bg-[#FFD700]/20 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-1.5">
              {loadingAll ? <Icon name="Loader" size={11} className="animate-spin" /> : <Icon name="Download" size={11} />}
              {loadingAll ? "Загружаю..." : "Показать всех"}
            </button>
          )}
        </div>

        {showAll && (
          <>
            {/* Фильтр */}
            <div className="mb-3 relative">
              <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
              <input
                value={filter}
                onChange={e => setFilter(e.target.value)}
                placeholder="Фильтр: имя, телефон, email..."
                className="w-full bg-[#0A0A0A] border border-[#1F1F1F] text-white pl-9 pr-9 py-2 font-roboto text-sm rounded-md focus:outline-none focus:border-[#FFD700]/50 focus:bg-[#141414] placeholder:text-white/25 transition-all" />
              {filter && (
                <button onClick={() => setFilter("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white p-0.5 transition-colors">
                  <Icon name="X" size={14} />
                </button>
              )}
            </div>

            {allClients.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-14 h-14 mx-auto mb-2 bg-[#141414] border border-[#222] rounded-full flex items-center justify-center">
                  <Icon name="Users" size={24} className="text-white/20" />
                </div>
                <div className="font-roboto text-white/40 text-sm">Нет зарегистрированных клиентов</div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-8 text-white/30 font-roboto text-sm">По фильтру ничего не найдено</div>
            ) : (
              <div className="space-y-1.5">
                {filtered.map(c => {
                  const initials = c.full_name.trim().split(/\s+/).map(w => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "?";
                  return (
                    <div key={c.id} className="group bg-[#0A0A0A] border border-[#1A1A1A] rounded-md px-3 py-2.5 flex items-center gap-3 hover:border-[#FFD700]/30 hover:bg-[#141414] transition-all">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#333] to-[#1a1a1a] border border-white/10 flex items-center justify-center font-oswald font-bold text-sm text-white/70 shrink-0 group-hover:border-[#FFD700]/40 transition-colors">
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-roboto text-white text-sm truncate font-medium">{c.full_name}</div>
                        <div className="font-roboto text-white/40 text-[11px] flex items-center gap-2 mt-0.5">
                          <span className="flex items-center gap-1"><Icon name="Phone" size={9} />{c.phone}</span>
                          {c.email && <span className="flex items-center gap-1 truncate"><Icon name="Mail" size={9} />{c.email}</span>}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        {c.discount_pct > 0 && (
                          <div className="inline-flex items-center gap-1 bg-[#FFD700]/10 border border-[#FFD700]/30 px-1.5 py-0.5 rounded text-[#FFD700] font-oswald font-bold text-xs tabular-nums">
                            {c.discount_pct}%
                          </div>
                        )}
                        <div className="font-roboto text-white/30 text-[9px] mt-0.5">
                          {c.registered_at ? new Date(c.registered_at).toLocaleDateString("ru-RU", { day: "2-digit", month: "short" }) : "—"}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}