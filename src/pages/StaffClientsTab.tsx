import { useState } from "react";
import Icon from "@/components/ui/icon";
import { AUTH_CLIENT_URL, EMPLOYEE_AUTH_URL } from "./staff.types";
import { formatPhone } from "@/lib/phoneFormat";

type Client = { id: number; full_name: string; phone: string; email: string | null; discount_pct: number; loyalty_points: number; registered_at: string | null };

export function ClientsTab({ token }: { token: string }) {
  const [phone, setPhone] = useState("");
  const [found, setFound] = useState<Record<string, unknown> | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [addForm, setAddForm] = useState({ full_name: "", phone: "", email: "" });
  const [added, setAdded] = useState(false);
  const [allClients, setAllClients] = useState<Client[]>([]);
  const [loadingAll, setLoadingAll] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const search = async () => {
    if (!phone) return;
    setNotFound(false); setFound(null);
    const res = await fetch(`${AUTH_CLIENT_URL}?action=profile&phone=${encodeURIComponent(phone)}`);
    const data = await res.json();
    if (data.id) setFound(data);
    else setNotFound(true);
  };

  const addClient = async () => {
    if (!addForm.phone || !addForm.full_name) return;
    await fetch(AUTH_CLIENT_URL, { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "register", ...addForm }) });
    setAdded(true); setAddForm({ full_name: "", phone: "", email: "" });
    if (showAll) loadAllClients();
  };

  const loadAllClients = async () => {
    setLoadingAll(true);
    const res = await fetch(`${EMPLOYEE_AUTH_URL}?action=clients`, { headers: { "X-Employee-Token": token } });
    const data = await res.json();
    setAllClients(data.clients || []);
    setLoadingAll(false);
    setShowAll(true);
  };

  return (
    <div className="p-4">
      <div className="font-oswald font-bold uppercase text-sm text-white mb-3">Поиск клиента</div>
      <div className="flex gap-2 mb-3">
        <input value={phone} onChange={e => setPhone(formatPhone(e.target.value))} onKeyDown={e => e.key === "Enter" && search()}
          placeholder="+7 (___) ___-__-__"
          className="flex-1 bg-[#0D0D0D] border border-[#333] text-white px-3 py-2 font-roboto text-sm focus:outline-none focus:border-[#FFD700]" />
        <button onClick={search} className="bg-[#FFD700] text-black font-oswald font-bold px-4 py-2 uppercase text-xs hover:bg-yellow-400">Найти</button>
      </div>
      {found && (
        <div className="bg-[#1A1A1A] border border-[#FFD700]/30 p-3 mb-4">
          <div className="font-oswald font-bold text-[#FFD700] mb-1">{(found as {full_name: string}).full_name}</div>
          <div className="font-roboto text-white/60 text-sm">{(found as {phone: string}).phone} {(found as {email: string}).email ? `· ${(found as {email: string}).email}` : ""}</div>
          <div className="font-roboto text-xs text-white/40 mt-1">Скидка: {(found as {discount_pct: number}).discount_pct}% · Баллы: {(found as {loyalty_points: number}).loyalty_points}</div>
        </div>
      )}
      {notFound && <div className="text-white/40 font-roboto text-sm mb-4">Клиент не найден</div>}

      <div className="border-t border-white/10 pt-4 mt-4">
        <div className="font-oswald font-bold uppercase text-sm text-white mb-3">Добавить клиента</div>
        {added ? (
          <div className="text-[#FFD700] font-roboto text-sm flex items-center gap-2 mb-3"><Icon name="CheckCircle" size={14} /> Клиент добавлен!</div>
        ) : (
          <div className="space-y-2 mb-4">
            {[{ key: "full_name", label: "ФИО", placeholder: "Иванов Иван Иванович" }, { key: "phone", label: "Телефон *", placeholder: "+7 (___) ___-__-__" }, { key: "email", label: "Email", placeholder: "mail@example.com" }].map(f => (
              <div key={f.key}>
                <label className="font-roboto text-white/30 text-[10px] block mb-1">{f.label}</label>
                <input value={(addForm as Record<string,string>)[f.key]} onChange={e => setAddForm(p => ({ ...p, [f.key]: f.key === "phone" ? formatPhone(e.target.value) : e.target.value }))} placeholder={f.placeholder}
                  className="w-full bg-[#0D0D0D] border border-[#333] text-white px-3 py-2 font-roboto text-sm focus:outline-none focus:border-[#FFD700]" />
              </div>
            ))}
            <button onClick={addClient} disabled={!addForm.phone || !addForm.full_name}
              className="bg-[#FFD700] text-black font-oswald font-bold px-4 py-2 uppercase text-xs hover:bg-yellow-400 transition-colors disabled:opacity-50">
              Добавить
            </button>
          </div>
        )}
      </div>

      {/* Список всех клиентов */}
      <div className="border-t border-white/10 pt-4 mt-2">
        <div className="flex items-center justify-between mb-3">
          <div className="font-oswald font-bold uppercase text-sm text-white">
            Все клиенты{showAll ? <span className="text-white/40 ml-1">({allClients.length})</span> : ""}
          </div>
          {!showAll && (
            <button onClick={loadAllClients} disabled={loadingAll}
              className="text-[#FFD700] font-roboto text-xs hover:underline disabled:opacity-50">
              {loadingAll ? "Загружаю..." : "Показать список"}
            </button>
          )}
        </div>
        {showAll && (
          <div className="space-y-1">
            {allClients.length === 0 ? (
              <div className="text-white/30 font-roboto text-sm text-center py-4">Нет зарегистрированных клиентов</div>
            ) : allClients.map(c => (
              <div key={c.id} className="bg-[#1A1A1A] border border-[#2A2A2A] px-3 py-2.5 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-roboto text-white text-sm truncate">{c.full_name}</div>
                  <div className="font-roboto text-white/40 text-xs">{c.phone}{c.email ? ` · ${c.email}` : ""}</div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-oswald font-bold text-[#FFD700] text-sm">{c.discount_pct}%</div>
                  <div className="font-roboto text-white/30 text-[10px]">{c.registered_at ? new Date(c.registered_at).toLocaleDateString("ru-RU") : "—"}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
