import { useEffect, useState, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { slApi, type SLRole, type SLPermissions } from "./types";

type Employee = {
  id: number;
  full_name: string;
  login: string;
  role: string;
  is_active: boolean;
  created_at?: string;
  last_seen_at?: string | null;
  email?: string | null;
  phone?: string | null;
  role_name?: string | null;
};

// Группировка прав по разделам — для удобства настройки
const PERM_GROUPS: { title: string; perms: { key: string; label: string }[] }[] = [
  {
    title: "Комиссионный магазин",
    perms: [
      { key: "shop_buy", label: "Создание скупки" },
      { key: "shop_sell", label: "Создание продажи" },
      { key: "shop_return", label: "Возврат товара" },
      { key: "shop_move", label: "Перемещение между филиалами" },
      { key: "shop_writeoff", label: "Списание / изъятие" },
      { key: "shop_reserve", label: "Резервирование товара" },
      { key: "shop_view", label: "Просмотр товаров и операций" },
      { key: "consignment_create", label: "Приём на реализацию" },
      { key: "consignment_view", label: "Просмотр реализации" },
      { key: "edit_price", label: "Изменение цены товара" },
      { key: "discount", label: "Раздел уценки товара" },
      { key: "labels", label: "Печать ценников" },
    ],
  },
  {
    title: "Ремонт",
    perms: [
      { key: "repair_create", label: "Приём в ремонт" },
      { key: "repair_view", label: "Просмотр ремонтов" },
      { key: "repair_edit_parts", label: "Редактирование запчастей" },
      { key: "repair_edit_works", label: "Редактирование работ" },
      { key: "repair_remove_finished", label: "Удалять оплаченные ремонты" },
      { key: "repair_change_master", label: "Смена мастера после оплаты" },
    ],
  },
  {
    title: "Новые товары и запчасти",
    perms: [
      { key: "newgoods_create", label: "Создание операций" },
      { key: "newgoods_view", label: "Просмотр" },
      { key: "newgoods_edit", label: "Редактирование категории, наименования, цены" },
      { key: "newgoods_move", label: "Перемещение" },
      { key: "newgoods_edit_storage", label: "Редактирование места хранения" },
    ],
  },
  {
    title: "Общие возможности",
    perms: [
      { key: "edit_all_ops", label: "Редактирование всех операций" },
      { key: "edit_open_shift_ops", label: "Редактирование операций только в открытых сменах" },
      { key: "remove_all_ops", label: "Удаление всех операций" },
      { key: "remove_open_shift_ops", label: "Удаление операций только в открытых сменах" },
      { key: "remove_sold_item", label: "Удалять/менять цену проданного товара" },
      { key: "edit_sold_price", label: "Менять цену продажи" },
      { key: "backdate", label: "Операции задним числом" },
      { key: "excel_export", label: "Скачивание таблиц в Excel" },
      { key: "clients", label: "Доступ к клиентам" },
      { key: "revision", label: "Проведение ревизии" },
    ],
  },
  {
    title: "Касса и смены",
    perms: [
      { key: "shifts_open_close", label: "Открытие/закрытие смены" },
      { key: "shifts_view_closed", label: "Закрытые смены" },
      { key: "shifts_view_dates", label: "Операции по датам" },
      { key: "shifts_view_profit", label: "Просмотр дохода и прибыли" },
      { key: "cashflow_create", label: "Приходно-расходные операции" },
      { key: "cashflow_view", label: "Просмотр кассы" },
      { key: "accounts_view_all", label: "Все расчётные счета" },
      { key: "accounts_view_own_branch", label: "Счета только своего филиала" },
    ],
  },
  {
    title: "Зарплата",
    perms: [
      { key: "salary_view_all", label: "Просмотр всех зарплат" },
      { key: "salary_view_own", label: "Просмотр своей зарплаты" },
      { key: "salary_edit_all", label: "Редактирование всех табелей" },
      { key: "salary_edit_own", label: "Редактирование своего табеля" },
    ],
  },
  {
    title: "Настройки",
    perms: [
      { key: "settings_employees", label: "Сотрудники" },
      { key: "settings_branches", label: "Филиалы" },
      { key: "settings_categories", label: "Категории товаров" },
      { key: "settings_storage", label: "Места хранения" },
      { key: "settings_loyalty", label: "Программа лояльности" },
      { key: "settings_metals", label: "Металлы и цены" },
      { key: "settings_discount_auto", label: "Автоматическая уценка" },
      { key: "settings_requisites", label: "Реквизиты" },
      { key: "settings_kkt", label: "Онлайн-касса" },
      { key: "documents_templates", label: "Шаблоны документов" },
    ],
  },
];

export default function SLRoles({ token, isOwner }: { token: string; isOwner: boolean }) {
  const [tab, setTab] = useState<"roles" | "team">("team");
  const [roles, setRoles] = useState<SLRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<SLRole | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await slApi<SLRole[]>(token, "roles");
    if (r.ok && r.data) setRoles(r.data);
    setLoading(false);
  }, [token]);
  useEffect(() => { load(); }, [load]);

  if (!isOwner) {
    return (
      <div className="text-white/40 text-center py-12">
        <Icon name="Lock" size={32} className="mx-auto mb-2 opacity-30" />
        Управление ролями доступно только владельцу
      </div>
    );
  }

  if (editing) {
    return <RoleEditor token={token} role={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); setMsg("Сохранено"); }} />;
  }

  return (
    <div>
      {/* Переключатель вкладок */}
      <div className="flex gap-1.5 mb-3">
        <button onClick={() => setTab("team")}
          className={`flex-1 py-2 rounded-lg text-sm font-bold ${tab === "team" ? "bg-[#FFD700] text-black" : "bg-[#141414] border border-[#1F1F1F] text-white/60"}`}>
          <Icon name="Users" size={13} className="inline mr-1" />Команда
        </button>
        <button onClick={() => setTab("roles")}
          className={`flex-1 py-2 rounded-lg text-sm font-bold ${tab === "roles" ? "bg-[#FFD700] text-black" : "bg-[#141414] border border-[#1F1F1F] text-white/60"}`}>
          <Icon name="ShieldCheck" size={13} className="inline mr-1" />Роли
        </button>
      </div>

      {msg && <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-2.5 rounded-lg mb-3 text-sm">{msg}</div>}

      {tab === "team" ? (
        <TeamPanel token={token} roles={roles} onMsg={setMsg} />
      ) : (
        <>
          <div className="text-[11px] uppercase tracking-wide text-white/50 mb-2">Роли и права доступа</div>
          {loading && <div className="text-white/30 text-sm py-4 text-center">Загрузка...</div>}
          <div className="space-y-2">
            {roles.map(r => (
              <button key={r.id} onClick={() => setEditing(r)}
                className="w-full text-left bg-[#0F0F0F] border border-[#1F1F1F] rounded-lg p-3 hover:border-[#FFD700]/30">
                <div className="flex items-center gap-2 mb-1">
                  <div className="font-bold text-sm">{r.name}</div>
                  {r.is_system && <span className="text-[10px] bg-[#141414] text-white/40 border border-[#1F1F1F] px-1.5 py-0.5 rounded">system</span>}
                  {r.code === "owner" && <span className="text-[10px] bg-[#FFD700]/15 text-[#FFD700] border border-[#FFD700]/30 px-1.5 py-0.5 rounded">{"всё доступно"}</span>}
                </div>
                {r.description && <div className="text-[11px] text-white/50">{r.description}</div>}
                <div className="text-[10px] text-white/30 mt-1.5">
                  Прав включено: {Object.values(r.permissions || {}).filter(v => v === true).length}
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function TeamPanel({ token, roles, onMsg }: { token: string; roles: SLRole[]; onMsg: (m: string) => void }) {
  const [emps, setEmps] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await slApi<Employee[]>(token, "employees_list");
    if (r.ok && r.data) setEmps(r.data);
    setLoading(false);
  }, [token]);
  useEffect(() => { load(); }, [load]);

  const setRole = async (empId: number, role: string) => {
    setSavingId(empId);
    const r = await slApi(token, "employee_set_role", { method: "POST", body: { employee_id: empId, role } });
    setSavingId(null);
    if (r.ok) { onMsg("Роль обновлена"); load(); }
    else onMsg(r.error || "Ошибка");
  };

  const initials = (name: string) => name.trim().split(/\s+/).map(s => s[0]).slice(0, 2).join("").toUpperCase();
  const ROLE_BADGES: Record<string, { l: string; emoji: string; color: string }> = {
    owner: { l: "Владелец", emoji: "👑", color: "bg-[#FFD700]/15 text-[#FFD700] border-[#FFD700]/30" },
    manager: { l: "Руководитель", emoji: "🎯", color: "bg-purple-500/15 text-purple-300 border-purple-500/30" },
    admin: { l: "Администратор", emoji: "🛡️", color: "bg-blue-500/15 text-blue-300 border-blue-500/30" },
    master: { l: "Мастер", emoji: "🔧", color: "bg-orange-500/15 text-orange-300 border-orange-500/30" },
    seller: { l: "Продавец", emoji: "🛒", color: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
    accountant: { l: "Бухгалтер", emoji: "📊", color: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30" },
    investor: { l: "Инвестор", emoji: "💼", color: "bg-pink-500/15 text-pink-300 border-pink-500/30" },
    staff: { l: "Сотрудник", emoji: "👤", color: "bg-white/10 text-white/60 border-white/15" },
  };

  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-white/50 mb-2">Сотрудники и их роли</div>
      <div className="text-[10px] text-white/40 mb-3">
        Кликните на роль сотрудника, чтобы изменить. Права для каждой роли настраиваются на вкладке «Роли».
      </div>

      {loading && <div className="text-white/30 text-sm py-4 text-center">Загрузка...</div>}

      <div className="space-y-2">
        {emps.map(e => {
          const cfg = ROLE_BADGES[e.role] || ROLE_BADGES.staff;
          return (
            <div key={e.id}
              className={`bg-[#0F0F0F] border rounded-lg p-3 ${e.is_active ? "border-[#1F1F1F]" : "border-red-500/30 opacity-70"}`}>
              <div className="flex items-start gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                  e.role === "owner" ? "bg-gradient-to-br from-[#FFD700] to-yellow-600 text-black" : "bg-[#141414] text-white/70 border border-white/10"
                }`}>
                  {initials(e.full_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm">{e.full_name}</div>
                  <div className="text-[11px] text-white/40">
                    {e.login}
                    {!e.is_active && <span className="ml-2 text-red-300">неактивен</span>}
                  </div>
                  <div className="text-[10px] text-white/30 mt-0.5">
                    {e.created_at && <>добавлен {new Date(e.created_at).toLocaleDateString("ru-RU")}</>}
                  </div>
                </div>
                <span className={`text-[10px] px-2 py-1 rounded border ${cfg.color} shrink-0 whitespace-nowrap`}>
                  {cfg.emoji} {cfg.l}
                </span>
              </div>
              {/* Список ролей для смены */}
              <div className="mt-2 pt-2 border-t border-[#1F1F1F]">
                <div className="text-[10px] text-white/40 mb-1.5">Назначить роль:</div>
                <div className="flex gap-1 flex-wrap">
                  {roles.map(r => {
                    const isCur = r.code === e.role;
                    const badge = ROLE_BADGES[r.code] || ROLE_BADGES.staff;
                    return (
                      <button key={r.code}
                        onClick={() => !isCur && setRole(e.id, r.code)}
                        disabled={savingId === e.id || isCur}
                        className={`text-[10px] px-2 py-1 rounded border transition-all ${
                          isCur ? `${badge.color} font-bold ring-1 ring-white/20` : "bg-[#141414] border-[#1F1F1F] text-white/60 hover:border-[#FFD700]/40"
                        } disabled:opacity-50`}>
                        {savingId === e.id && !isCur ? "..." : `${badge.emoji} ${r.name}`}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RoleEditor({ token, role, onClose, onSaved }: { token: string; role: SLRole; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(role.name);
  const [description, setDescription] = useState(role.description || "");
  const [perms, setPerms] = useState<SLPermissions>({ ...(role.permissions || {}) });
  const [saving, setSaving] = useState(false);

  const isOwnerRole = role.code === "owner";

  const toggle = (key: string) => {
    setPerms(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const save = async () => {
    setSaving(true);
    const r = await slApi(token, "role_save", { method: "POST", body: {
      id: role.id, code: role.code, name, description, permissions: perms,
    }});
    setSaving(false);
    if (r.ok) onSaved();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button onClick={onClose}><Icon name="ArrowLeft" size={16} /></button>
        <div className="flex-1">
          <div className="font-bold">Редактирование роли</div>
          <div className="text-[10px] text-white/40">code: {role.code}</div>
        </div>
      </div>

      <div className="bg-[#0F0F0F] border border-[#1F1F1F] rounded-xl p-3 space-y-2">
        <div>
          <div className="text-[11px] text-white/50 mb-0.5">Название</div>
          <input value={name} onChange={e => setName(e.target.value)} disabled={isOwnerRole}
            className="w-full bg-[#0A0A0A] border border-[#1F1F1F] rounded px-3 py-2 text-sm disabled:opacity-50" />
        </div>
        <div>
          <div className="text-[11px] text-white/50 mb-0.5">Описание</div>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
            disabled={isOwnerRole}
            className="w-full bg-[#0A0A0A] border border-[#1F1F1F] rounded px-3 py-2 text-sm resize-none disabled:opacity-50" />
        </div>
      </div>

      {isOwnerRole ? (
        <div className="bg-[#FFD700]/10 border border-[#FFD700]/30 rounded-xl p-3 text-sm text-[#FFD700]/90">
          <Icon name="Crown" size={14} className="inline mr-1" />
          Суперадминистратору доступно всё без исключения. Эта роль не редактируется.
        </div>
      ) : (
        PERM_GROUPS.map(group => (
          <div key={group.title} className="bg-[#0F0F0F] border border-[#1F1F1F] rounded-xl p-3">
            <div className="text-[11px] uppercase font-bold tracking-wide text-white/40 mb-2">{group.title}</div>
            <div className="space-y-1">
              {group.perms.map(p => (
                <label key={p.key} className="flex items-center justify-between cursor-pointer py-1 hover:bg-white/5 rounded px-1">
                  <span className="text-sm">{p.label}</span>
                  <button onClick={() => toggle(p.key)}
                    className={`w-9 h-5 rounded-full relative transition-colors shrink-0 ${perms[p.key] ? "bg-[#FFD700]" : "bg-[#1F1F1F]"}`}>
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${perms[p.key] ? "left-4" : "left-0.5"}`} />
                  </button>
                </label>
              ))}
            </div>
          </div>
        ))
      )}

      {!isOwnerRole && (
        <div className="flex gap-2 sticky bottom-0 bg-[#0A0A0A] py-2">
          <button onClick={onClose} className="flex-1 bg-[#141414] py-2.5 rounded-lg">Отмена</button>
          <button onClick={save} disabled={saving} className="flex-1 bg-[#FFD700] text-black font-bold py-2.5 rounded-lg disabled:opacity-50">
            {saving ? "..." : "Сохранить"}
          </button>
        </div>
      )}
    </div>
  );
}