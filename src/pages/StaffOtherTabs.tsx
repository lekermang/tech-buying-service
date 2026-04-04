import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { SALES_URL, AUTH_CLIENT_URL, type Sale, type Analytics } from "./staff.types";

// ─── Таб Продажи ─────────────────────────────────────────────────────────────
export function SalesTab({ token }: { token: string }) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`${SALES_URL}?action=list`, { headers: { "X-Employee-Token": token } })
      .then(r => r.json()).then(d => { setSales(d.sales || []); setLoading(false); }).catch(() => setLoading(false));
  }, [token]);

  const TYPE_LABELS: Record<string, string> = { goods: "Продажа", repair: "Ремонт", purchase: "Закупка" };

  return (
    <div className="p-4">
      <div className="font-oswald font-bold uppercase text-sm text-white mb-3">Продажи <span className="text-white/40">({sales.length})</span></div>
      {loading ? <div className="text-center py-8 text-white/30 text-sm">Загружаю...</div> :
        sales.length === 0 ? <div className="text-center py-8 text-white/30 font-roboto text-sm">Продаж пока нет</div> :
        <div className="space-y-2">
          {sales.map(s => (
            <div key={s.id} className="bg-[#1A1A1A] border border-[#2A2A2A] px-3 py-2.5">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-oswald font-bold text-[#FFD700] text-sm">#{s.id}</span>
                  <span className="font-roboto text-[10px] text-white/40 border border-white/10 px-1.5 py-0.5">{TYPE_LABELS[s.type] || s.type}</span>
                </div>
                <span className="font-oswald font-bold text-white">{s.amount.toLocaleString("ru-RU")} ₽</span>
              </div>
              <div className="font-roboto text-xs text-white/60">{s.client || "Без клиента"} {s.phone ? `· ${s.phone}` : ""}</div>
              <div className="flex justify-between mt-1">
                <span className="font-roboto text-[10px] text-white/30">{s.contract || "—"}</span>
                <span className="font-roboto text-[10px] text-white/30">{s.date ? new Date(s.date).toLocaleDateString("ru-RU") : ""}</span>
              </div>
            </div>
          ))}
        </div>}
    </div>
  );
}

// ─── Таб Клиенты ─────────────────────────────────────────────────────────────
export function ClientsTab({ token: _token }: { token: string }) {
  const [phone, setPhone] = useState("");
  const [found, setFound] = useState<Record<string, unknown> | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [addForm, setAddForm] = useState({ full_name: "", phone: "", email: "" });
  const [added, setAdded] = useState(false);

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
  };

  return (
    <div className="p-4">
      <div className="font-oswald font-bold uppercase text-sm text-white mb-3">Поиск клиента</div>
      <div className="flex gap-2 mb-3">
        <input value={phone} onChange={e => setPhone(e.target.value)} onKeyDown={e => e.key === "Enter" && search()}
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
          <div className="text-[#FFD700] font-roboto text-sm flex items-center gap-2"><Icon name="CheckCircle" size={14} /> Клиент добавлен!</div>
        ) : (
          <div className="space-y-2">
            {[{ key: "full_name", label: "ФИО", placeholder: "Иванов Иван Иванович" }, { key: "phone", label: "Телефон *", placeholder: "+7..." }, { key: "email", label: "Email", placeholder: "mail@example.com" }].map(f => (
              <div key={f.key}>
                <label className="font-roboto text-white/30 text-[10px] block mb-1">{f.label}</label>
                <input value={(addForm as Record<string,string>)[f.key]} onChange={e => setAddForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder}
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
    </div>
  );
}

// ─── Таб Аналитика ───────────────────────────────────────────────────────────
export function AnalyticsTab({ token }: { token: string }) {
  const [period, setPeriod] = useState("month");
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`${SALES_URL}?action=analytics&period=${period}`, { headers: { "X-Employee-Token": token } });
    const d = await res.json();
    setData(d); setLoading(false);
  }, [period, token]);

  useEffect(() => { load(); }, [load]);

  const PERIODS = [{ v: "today", l: "Сегодня" }, { v: "week", l: "Неделя" }, { v: "month", l: "Месяц" }, { v: "year", l: "Год" }];
  const TYPE_LABELS: Record<string, string> = { goods: "Продажи", repair: "Ремонт", purchase: "Закупка" };

  return (
    <div className="p-4">
      <div className="flex gap-1 mb-4 flex-wrap">
        {PERIODS.map(p => (
          <button key={p.v} onClick={() => setPeriod(p.v)}
            className={`font-roboto text-xs px-3 py-1.5 border transition-colors ${period === p.v ? "border-[#FFD700] text-[#FFD700]" : "border-white/10 text-white/40 hover:text-white"}`}>
            {p.l}
          </button>
        ))}
      </div>

      {loading ? <div className="text-center py-8 text-white/30 text-sm">Загружаю...</div> : data && (
        <>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] p-4 text-center">
              <div className="font-oswald font-bold text-2xl text-[#FFD700]">{(data.total_revenue || 0).toLocaleString("ru-RU")} ₽</div>
              <div className="font-roboto text-white/40 text-xs mt-1">Выручка</div>
            </div>
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] p-4 text-center">
              <div className="font-oswald font-bold text-2xl text-white">{data.total_deals || 0}</div>
              <div className="font-roboto text-white/40 text-xs mt-1">Сделок</div>
            </div>
          </div>

          {Object.entries(data.by_type || {}).length > 0 && (
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] p-3 mb-4">
              <div className="font-roboto text-white/40 text-[10px] uppercase tracking-wide mb-2">По направлениям</div>
              {Object.entries(data.by_type).map(([type, stat]) => (
                <div key={type} className="flex justify-between py-1.5 border-b border-white/5 last:border-0">
                  <span className="font-roboto text-sm text-white/70">{TYPE_LABELS[type] || type}</span>
                  <div className="text-right">
                    <span className="font-oswald font-bold text-[#FFD700] text-sm">{(stat.sum || 0).toLocaleString("ru-RU")} ₽</span>
                    <span className="font-roboto text-white/30 text-[10px] ml-2">{stat.count} сд.</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {data.staff_stats?.length > 0 && (
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] p-3">
              <div className="font-roboto text-white/40 text-[10px] uppercase tracking-wide mb-2">Мотивация сотрудников</div>
              {data.staff_stats.map((s, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-2">
                    {i === 0 && <Icon name="Trophy" size={12} className="text-[#FFD700]" />}
                    <span className="font-roboto text-sm text-white/80">{s.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-oswald font-bold text-[#FFD700] text-sm">{(s.revenue || 0).toLocaleString("ru-RU")} ₽</div>
                    <div className="font-roboto text-white/30 text-[10px]">{s.deals} сделок</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
