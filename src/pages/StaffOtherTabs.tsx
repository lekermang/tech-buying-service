import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { SALES_URL, AUTH_CLIENT_URL, EMPLOYEE_AUTH_URL, type Sale, type Analytics } from "./staff.types";
import { REPAIR_URL } from "./repair/types";

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
type RepairAnalytics = {
  total: number; done: number; revenue: number; costs: number;
  profit: number; master_total: number;
  daily: { day: string; revenue: number; costs: number; profit: number; done: number }[];
};

export function AnalyticsTab({ token }: { token: string }) {
  const [period, setPeriod] = useState("week");
  const [data, setData] = useState<Analytics | null>(null);
  const [repairData, setRepairData] = useState<RepairAnalytics | null>(null);
  const [loading, setLoading] = useState(false);

  const repairPeriod = period === "today" ? "day" : period === "week" ? "week" : "month";

  const load = useCallback(async () => {
    setLoading(true);
    const [salesRes, repairRes] = await Promise.all([
      fetch(`${SALES_URL}?action=analytics&period=${period}`, { headers: { "X-Employee-Token": token } }),
      fetch(`${REPAIR_URL}?action=analytics&period=${repairPeriod}`, { headers: { "X-Employee-Token": token } }),
    ]);
    const [salesD, repairD] = await Promise.all([salesRes.json(), repairRes.json()]);
    setData(salesD);
    setRepairData(repairD);
    setLoading(false);
  }, [period, repairPeriod, token]);

  useEffect(() => { load(); }, [load]);

  const PERIODS = [
    { v: "today", l: "Сегодня" },
    { v: "week", l: "7 дней" },
    { v: "month", l: "30 дней" },
  ];
  const TYPE_LABELS: Record<string, string> = { goods: "📦 Продажи", repair: "🔧 Ремонт", purchase: "💰 Закупка" };

  const totalRevenue = (data?.total_revenue || 0) + (repairData?.revenue || 0);
  const repairProfit = repairData?.profit || 0;
  const masterIncome = repairData?.master_total || 0;

  // Объединяем daily данные ремонта для графика
  const dailyRepair = repairData?.daily || [];
  const maxRevRepair = Math.max(...dailyRepair.map(d => d.revenue), 1);

  return (
    <div className="p-4">
      {/* Переключатель периода */}
      <div className="flex gap-1 mb-4 flex-wrap items-center">
        {PERIODS.map(p => (
          <button key={p.v} onClick={() => setPeriod(p.v)}
            className={`font-roboto text-xs px-3 py-1.5 border transition-colors ${period === p.v ? "border-[#FFD700] text-[#FFD700] bg-[#FFD700]/10" : "border-white/10 text-white/40 hover:text-white"}`}>
            {p.l}
          </button>
        ))}
        <button onClick={load} disabled={loading} className="ml-auto text-white/30 hover:text-white transition-colors p-1">
          <Icon name={loading ? "Loader" : "RefreshCw"} size={13} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {loading && <div className="text-center py-8 text-white/30 text-sm">Загружаю...</div>}

      {!loading && (
        <>
          {/* Главные KPI */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] p-3">
              <div className="font-roboto text-white/30 text-[10px] mb-1">Общая выручка</div>
              <div className="font-oswald font-bold text-2xl text-[#FFD700]">{totalRevenue.toLocaleString("ru-RU")} ₽</div>
              <div className="font-roboto text-white/20 text-[10px]">{(data?.total_deals || 0) + (repairData?.done || 0)} сделок</div>
            </div>
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] p-3">
              <div className="font-roboto text-white/30 text-[10px] mb-1">Прибыль ремонта</div>
              <div className={`font-oswald font-bold text-2xl ${repairProfit >= 0 ? "text-green-400" : "text-red-400"}`}>
                {repairProfit.toLocaleString("ru-RU")} ₽
              </div>
              <div className="font-roboto text-orange-400/60 text-[10px]">закупка: {(repairData?.costs || 0).toLocaleString("ru-RU")} ₽</div>
            </div>
          </div>

          {/* Доход мастера */}
          {masterIncome > 0 && (
            <div className="bg-green-500/10 border border-green-500/20 p-3 mb-3 flex items-center justify-between">
              <div>
                <div className="font-roboto text-green-400/60 text-[10px] uppercase tracking-wide mb-0.5">Доход мастера (50% прибыли)</div>
                <div className="font-oswald font-bold text-green-400 text-2xl">{masterIncome.toLocaleString("ru-RU")} ₽</div>
              </div>
              <span className="text-3xl opacity-40">🏆</span>
            </div>
          )}

          {/* Ремонт: статусы */}
          {repairData && (
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] p-3 mb-3">
              <div className="font-roboto text-white/40 text-[10px] uppercase tracking-wide mb-2">🔧 Ремонт за период</div>
              <div className="grid grid-cols-4 gap-2 mb-2">
                {[
                  { label: "Всего", value: repairData.total, color: "text-white" },
                  { label: "Выдано", value: repairData.done, color: "text-green-400" },
                  { label: "Выручка", value: (repairData.revenue || 0).toLocaleString("ru-RU") + " ₽", color: "text-[#FFD700]" },
                  { label: "Закупка", value: (repairData.costs || 0).toLocaleString("ru-RU") + " ₽", color: "text-orange-400" },
                ].map(c => (
                  <div key={c.label} className="text-center">
                    <div className={`font-oswald font-bold text-base ${c.color}`}>{c.value}</div>
                    <div className="font-roboto text-white/30 text-[9px]">{c.label}</div>
                  </div>
                ))}
              </div>

              {/* Мини-график ремонта по дням */}
              {dailyRepair.length > 1 && (
                <div className="space-y-1 mt-2">
                  {dailyRepair.slice().reverse().slice(0, 7).map(d => {
                    const barW = Math.round((d.revenue / maxRevRepair) * 100);
                    const profitBarW = Math.round((Math.max(0, d.profit) / maxRevRepair) * 100);
                    return (
                      <div key={d.day} className="flex items-center gap-2">
                        <span className="font-roboto text-[9px] text-white/30 w-10 shrink-0">
                          {new Date(d.day).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" })}
                        </span>
                        <div className="flex-1 h-4 bg-[#111] relative overflow-hidden">
                          <div className="h-full bg-[#FFD700]/20 absolute left-0 top-0" style={{ width: barW + "%" }} />
                          <div className="h-full bg-green-500/30 absolute left-0 top-0" style={{ width: profitBarW + "%" }} />
                        </div>
                        <span className="font-roboto text-[9px] text-white/40 w-16 text-right shrink-0">
                          {d.revenue > 0 ? d.revenue.toLocaleString("ru-RU") + " ₽" : "—"}
                        </span>
                        <span className={`font-roboto text-[9px] w-14 text-right shrink-0 ${d.profit > 0 ? "text-green-400" : d.profit < 0 ? "text-red-400" : "text-white/20"}`}>
                          {d.profit !== 0 ? (d.profit > 0 ? "+" : "") + d.profit.toLocaleString("ru-RU") : "—"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* По направлениям (продажи) */}
          {Object.entries(data?.by_type || {}).length > 0 && (
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] p-3 mb-3">
              <div className="font-roboto text-white/40 text-[10px] uppercase tracking-wide mb-2">По направлениям (продажи)</div>
              {Object.entries(data!.by_type).map(([type, stat]) => (
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

          {/* Мотивация сотрудников */}
          {(data?.staff_stats?.length || 0) > 0 && (
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] p-3">
              <div className="font-roboto text-white/40 text-[10px] uppercase tracking-wide mb-2">Рейтинг сотрудников</div>
              {data!.staff_stats.map((s, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-2">
                    {i === 0 && <Icon name="Trophy" size={12} className="text-[#FFD700]" />}
                    {i > 0 && <span className="font-roboto text-white/20 text-xs w-4 text-center">{i + 1}</span>}
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

// ─── Таб Сотрудники (только owner/admin) ─────────────────────────────────────
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