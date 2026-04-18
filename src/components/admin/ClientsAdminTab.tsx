import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { adminHeaders } from "@/lib/adminFetch";

const AUTH_CLIENT_URL = "https://functions.poehali.dev/58edd0bc-cce3-4ece-acca-a003e2260758";

type Client = {
  id: number;
  full_name: string;
  phone: string;
  email: string | null;
  discount_pct: number;
  loyalty_points: number;
  registered_at: string | null;
};

export default function ClientsAdminTab({ token }: { token: string }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch(`${AUTH_CLIENT_URL}?action=list`, { headers: adminHeaders(token) })
      .then(r => r.json())
      .then(d => { setClients(d.clients || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  const filtered = clients.filter(c => {
    const q = search.toLowerCase();
    return !q || c.full_name.toLowerCase().includes(q) || c.phone.includes(q) || (c.email || "").toLowerCase().includes(q);
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[#1d1d1f]">
          Клиенты программы скидок
          <span className="ml-2 text-sm font-normal text-[#1d1d1f]/40">({clients.length})</span>
        </h2>
      </div>

      <div className="relative mb-4">
        <Icon name="Search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1d1d1f]/30" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Поиск по имени, телефону или email..."
          className="w-full bg-[#f5f5f7] text-[#1d1d1f] pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0071e3]/30"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-[#1d1d1f]/30 text-sm">Загружаю...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-[#1d1d1f]/30 text-sm">Клиентов не найдено</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-black/6">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f5f5f7] text-[#1d1d1f]/40 text-xs uppercase tracking-wide">
                <th className="text-left px-4 py-3 font-semibold">#</th>
                <th className="text-left px-4 py-3 font-semibold">ФИО</th>
                <th className="text-left px-4 py-3 font-semibold">Телефон</th>
                <th className="text-left px-4 py-3 font-semibold">Email</th>
                <th className="text-center px-4 py-3 font-semibold">Скидка</th>
                <th className="text-center px-4 py-3 font-semibold">Баллы</th>
                <th className="text-left px-4 py-3 font-semibold">Регистрация</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={c.id} className={`border-t border-black/4 ${i % 2 === 0 ? "bg-white" : "bg-[#f5f5f7]/40"} hover:bg-blue-50/40 transition-colors`}>
                  <td className="px-4 py-3 text-[#1d1d1f]/30 text-xs">{c.id}</td>
                  <td className="px-4 py-3 font-medium text-[#1d1d1f]">{c.full_name}</td>
                  <td className="px-4 py-3 text-[#0071e3] font-mono text-xs">{c.phone}</td>
                  <td className="px-4 py-3 text-[#1d1d1f]/50 text-xs">{c.email || "—"}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-block bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                      {c.discount_pct}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-[#1d1d1f]/60 text-xs">{c.loyalty_points}</td>
                  <td className="px-4 py-3 text-[#1d1d1f]/40 text-xs">
                    {c.registered_at ? new Date(c.registered_at).toLocaleDateString("ru-RU") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
