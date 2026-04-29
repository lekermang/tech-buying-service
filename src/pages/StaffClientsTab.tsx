import { useState, useMemo, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { AUTH_CLIENT_URL } from "./staff.types";
import { formatPhone } from "@/lib/phoneFormat";
import { useStaffToast } from "./staff/StaffToast";
import useDebouncedValue from "@/hooks/useDebouncedValue";
import { SMS_TEMPLATES, SMS_CATEGORIES, renderTemplate, type SmsTemplate } from "./staff/smsTemplates";

const REPAIR_ADMIN_URL = "https://functions.poehali.dev/a105aede-d55d-4b99-9d3e-5e977887aa04";

type Source = "registered" | "repair" | "wh";
type Group = "all" | "registered" | "repair";

type Contact = {
  id: string;
  full_name: string;
  phone: string;
  source: Source;
};

const MAX_SMS = 480;

const SOURCE_LABEL: Record<Source, string> = {
  registered: "Скидки",
  repair: "Ремонт",
  wh: "WH",
};

const SOURCE_STYLE: Record<Source, string> = {
  registered: "bg-blue-500/15 text-blue-300 border border-blue-400/30",
  repair: "bg-green-500/15 text-green-300 border border-green-400/30",
  wh: "bg-purple-500/15 text-purple-300 border border-purple-400/30",
};

export function ClientsTab({ token: _token }: { token: string }) {
  const toast = useStaffToast();

  // Поиск отдельного клиента
  const [phone, setPhone] = useState("");
  const [found, setFound] = useState<Record<string, unknown> | null>(null);
  const [searching, setSearching] = useState(false);

  // Добавление нового клиента
  const [addForm, setAddForm] = useState({ full_name: "", phone: "", email: "" });
  const [addLoading, setAddLoading] = useState(false);

  // База клиентов (объединение источников)
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [filter, setFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState<"all" | Source>("all");

  // SMS-рассылка
  const [smsOpen, setSmsOpen] = useState(false);
  const [smsGroup, setSmsGroup] = useState<Group>("all");
  const [smsMessage, setSmsMessage] = useState("");
  const [smsConfirm, setSmsConfirm] = useState(false);
  const [smsSending, setSmsSending] = useState(false);
  const [smsResult, setSmsResult] = useState<{ sent: number; failed: number; total: number } | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [smsCost, setSmsCost] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);

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

  const loadContacts = useCallback(async (signal?: AbortSignal) => {
    setLoadingContacts(true);
    try {
      const res = await fetch(`${REPAIR_ADMIN_URL}?action=sms_contacts&group=all`, { signal });
      const data = await res.json();
      const list: Contact[] = Array.isArray(data.contacts) ? data.contacts : [];
      setContacts(list);
    } catch (e) {
      if ((e as { name?: string })?.name !== "AbortError") {
        toast.error("Не удалось загрузить базу клиентов");
      }
    } finally {
      setLoadingContacts(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!showAll) return;
    const ctrl = new AbortController();
    loadContacts(ctrl.signal);
    return () => ctrl.abort();
  }, [showAll, loadContacts]);

  const loadBalance = useCallback(async () => {
    setLoadingBalance(true);
    try {
      const res = await fetch(REPAIR_ADMIN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sms_balance" }),
      });
      const data = await res.json();
      if (data.ok) {
        setBalance(data.balance != null ? parseFloat(data.balance) : null);
        setSmsCost(data.sms_cost != null ? parseFloat(data.sms_cost) : null);
      } else if (data.error) {
        toast.warning(`SMS.RU: ${data.error}`);
      }
    } catch {
      /* ignore */
    } finally {
      setLoadingBalance(false);
    }
  }, [toast]);

  useEffect(() => {
    if (smsOpen && balance == null) loadBalance();
  }, [smsOpen, balance, loadBalance]);

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
        if (showAll) loadContacts();
      } else {
        toast.update(tid, { kind: "error", message: data.error || "Не удалось добавить клиента", duration: 5000 });
      }
    } catch {
      toast.update(tid, { kind: "error", message: "Сбой сети при добавлении", duration: 5000 });
    } finally {
      setAddLoading(false);
    }
  };

  const sendSms = async () => {
    if (!smsMessage.trim()) {
      toast.warning("Введите текст сообщения");
      return;
    }
    if (!smsConfirm) {
      toast.warning("Подтвердите отправку");
      return;
    }
    setSmsSending(true);
    setSmsResult(null);
    const tid = toast.loading(`Отправляю SMS-рассылку (${smsTargetCount})...`);
    try {
      const res = await fetch(REPAIR_ADMIN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sms_blast", message: smsMessage.trim(), group: smsGroup }),
      });
      const data = await res.json();
      if (data.ok) {
        setSmsResult({ sent: data.sent || 0, failed: data.failed || 0, total: data.total || 0 });
        toast.update(tid, {
          kind: "success",
          message: `Отправлено: ${data.sent}, не доставлено: ${data.failed} из ${data.total}`,
          duration: 6000,
        });
        setSmsConfirm(false);
        setSmsMessage("");
        loadBalance();
      } else {
        toast.update(tid, { kind: "error", message: data.error || "Ошибка отправки", duration: 5000 });
      }
    } catch {
      toast.update(tid, { kind: "error", message: "Сбой сети при рассылке", duration: 5000 });
    } finally {
      setSmsSending(false);
    }
  };

  const debouncedFilter = useDebouncedValue(filter, 250);
  const visibleContacts = useMemo(() => {
    const q = debouncedFilter.trim().toLowerCase();
    return contacts.filter(c => {
      if (sourceFilter !== "all" && c.source !== sourceFilter) return false;
      if (!q) return true;
      return (
        c.full_name.toLowerCase().includes(q) ||
        c.phone.includes(q)
      );
    });
  }, [contacts, debouncedFilter, sourceFilter]);

  const counts = useMemo(() => {
    const acc = { all: contacts.length, registered: 0, repair: 0, wh: 0 };
    contacts.forEach(c => { acc[c.source] = (acc[c.source] || 0) + 1; });
    return acc;
  }, [contacts]);

  const smsTargetCount = useMemo(() => {
    if (smsGroup === "all") return counts.all;
    if (smsGroup === "registered") return counts.registered;
    if (smsGroup === "repair") return counts.repair;
    return 0;
  }, [smsGroup, counts]);

  const fName = (found as { full_name?: string })?.full_name || "";
  const fPhone = (found as { phone?: string })?.phone || "";
  const fEmail = (found as { email?: string })?.email || "";
  const fDiscount = (found as { discount_pct?: number })?.discount_pct || 0;
  const fPoints = (found as { loyalty_points?: number })?.loyalty_points || 0;
  const foundInitials = fName.trim().split(/\s+/).map(w => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "?";

  const charsLeft = MAX_SMS - smsMessage.length;
  const smsCount = Math.ceil(smsMessage.length / 70) || 1; // кириллица 70 симв./SMS
  const totalCost = smsCost && smsTargetCount ? smsCost * smsTargetCount * smsCount : null;

  return (
    <div className="p-3 space-y-4">
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

      {/* SMS-рассылка */}
      <div className="bg-gradient-to-br from-green-500/5 to-[#0A0A0A] border border-green-500/20 rounded-lg p-4">
        <button
          onClick={() => setSmsOpen(v => !v)}
          className="w-full flex items-center justify-between gap-2 mb-1 active:scale-[0.99] transition-transform"
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-green-500/15 border border-green-500/30 flex items-center justify-center">
              <Icon name="MessageSquare" size={14} className="text-green-400" />
            </div>
            <div className="text-left">
              <div className="font-oswald font-bold uppercase text-sm text-white">SMS-рассылка</div>
              <div className="font-roboto text-white/40 text-[10px]">Акции и уведомления через sms.ru</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {balance != null && (
              <span className="font-oswald font-bold tabular-nums text-[#FFD700] text-xs whitespace-nowrap">
                {balance.toFixed(2)} ₽
              </span>
            )}
            <Icon name={smsOpen ? "ChevronUp" : "ChevronDown"} size={16} className="text-white/40" />
          </div>
        </button>

        {smsOpen && (
          <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
            {/* Баланс */}
            <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-md p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <Icon name="Wallet" size={14} className="text-[#FFD700] shrink-0" />
                <div className="min-w-0">
                  <div className="font-roboto text-white/40 text-[9px] uppercase tracking-wide">Баланс sms.ru</div>
                  <div className="font-oswald font-bold text-white text-base tabular-nums truncate">
                    {loadingBalance ? "..." : balance != null ? `${balance.toFixed(2)} ₽` : "—"}
                    {smsCost && (
                      <span className="font-roboto text-white/40 text-[10px] ml-2">{smsCost.toFixed(2)} ₽/SMS</span>
                    )}
                  </div>
                </div>
              </div>
              <button onClick={loadBalance} disabled={loadingBalance}
                className="text-white/50 hover:text-white p-2 rounded-md hover:bg-white/5 transition-colors disabled:opacity-50">
                <Icon name="RefreshCw" size={14} className={loadingBalance ? "animate-spin" : ""} />
              </button>
            </div>

            {/* Группа получателей */}
            <div>
              <div className="font-roboto text-white/40 text-[10px] uppercase tracking-wide mb-2">Кому отправить</div>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { k: "all" as Group, l: "Всем", icon: "Users", count: counts.all },
                  { k: "registered" as Group, l: "Скидки", icon: "Star", count: counts.registered },
                  { k: "repair" as Group, l: "Ремонт", icon: "Wrench", count: counts.repair },
                ]).map(g => {
                  const a = smsGroup === g.k;
                  return (
                    <button key={g.k} onClick={() => setSmsGroup(g.k)}
                      className={`flex flex-col items-center gap-1 p-2.5 rounded-md border text-center transition-all active:scale-95 ${
                        a
                          ? "border-[#FFD700] bg-[#FFD700]/10 text-[#FFD700]"
                          : "border-[#1F1F1F] bg-[#0A0A0A] text-white/50 hover:border-white/20 hover:text-white"
                      }`}>
                      <Icon name={g.icon} size={14} />
                      <span className="font-oswald font-bold text-[11px] uppercase">{g.l}</span>
                      <span className="font-roboto text-[10px] tabular-nums opacity-80">{g.count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Текст */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="font-roboto text-white/40 text-[10px] uppercase tracking-wide">Текст сообщения</div>
                <div className={`font-oswald text-[10px] tabular-nums ${charsLeft < 0 ? "text-red-400" : "text-white/50"}`}>
                  {smsMessage.length} / {MAX_SMS} · {smsCount} SMS
                </div>
              </div>
              <textarea
                value={smsMessage}
                onChange={e => { setSmsMessage(e.target.value.slice(0, MAX_SMS)); setSmsConfirm(false); }}
                placeholder="Например: Скупка24 — повышенная цена за iPhone до конца недели! Звоните: +7 992 999-03-33"
                rows={4}
                className="w-full bg-[#0A0A0A] border border-[#1F1F1F] text-white px-3 py-2.5 font-roboto text-sm rounded-md focus:outline-none focus:border-[#FFD700]/50 placeholder:text-white/25 resize-none"
              />
              <div className="font-roboto text-white/30 text-[10px] mt-1 leading-tight">
                Подпись отправителя: <span className="text-[#FFD700]">IPMamedov</span>. Кириллица — 70 символов на 1 SMS.
              </div>
            </div>

            {/* Стоимость и подтверждение */}
            <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-md p-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-roboto text-white/50">Получателей</span>
                <span className="font-oswald font-bold text-white tabular-nums">{smsTargetCount}</span>
              </div>
              {totalCost != null && (
                <div className="flex items-center justify-between text-xs">
                  <span className="font-roboto text-white/50">Примерная стоимость</span>
                  <span className="font-oswald font-bold text-[#FFD700] tabular-nums">{totalCost.toFixed(2)} ₽</span>
                </div>
              )}
              {balance != null && totalCost != null && totalCost > balance && (
                <div className="bg-red-500/10 border border-red-500/30 rounded px-2 py-1.5 flex items-start gap-1.5 text-red-300 font-roboto text-[10px] leading-snug">
                  <Icon name="AlertTriangle" size={11} className="text-red-400 mt-0.5 shrink-0" />
                  Баланса может не хватить. Пополните счёт sms.ru.
                </div>
              )}
              <label className="flex items-center gap-2 cursor-pointer select-none pt-1">
                <input
                  type="checkbox"
                  checked={smsConfirm}
                  onChange={e => setSmsConfirm(e.target.checked)}
                  className="w-4 h-4 accent-[#FFD700]"
                />
                <span className="font-roboto text-white/70 text-xs">
                  Я подтверждаю отправку <b>{smsTargetCount}</b> SMS
                </span>
              </label>
              <button
                onClick={sendSms}
                disabled={!smsMessage.trim() || !smsConfirm || smsSending || smsTargetCount === 0}
                className="w-full bg-gradient-to-b from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-oswald font-bold py-3 uppercase tracking-wide text-sm rounded-md shadow-md shadow-green-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {smsSending ? (
                  <><Icon name="Loader" size={14} className="animate-spin" /> Отправляю...</>
                ) : (
                  <><Icon name="Send" size={14} /> Отправить рассылку</>
                )}
              </button>
              {smsResult && (
                <div className="bg-green-500/10 border border-green-500/30 rounded px-2.5 py-2 text-green-300 font-roboto text-xs flex items-center gap-2">
                  <Icon name="CheckCircle2" size={12} />
                  Доставлено: <b className="tabular-nums">{smsResult.sent}</b> · Ошибок: <b className="tabular-nums">{smsResult.failed}</b> из <b className="tabular-nums">{smsResult.total}</b>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* База клиентов (объединённая) */}
      <div className="bg-gradient-to-br from-[#141414] to-[#0A0A0A] border border-[#1F1F1F] rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="font-oswald font-bold uppercase text-sm text-white flex items-center gap-1.5">
            <Icon name="Users" size={14} className="text-[#FFD700]" />
            База клиентов
            {showAll && (
              <span className="bg-[#FFD700]/15 text-[#FFD700] font-oswald text-[11px] px-2 py-0.5 rounded-full tabular-nums">
                {contacts.length}
              </span>
            )}
          </div>
          {!showAll ? (
            <button onClick={() => setShowAll(true)} disabled={loadingContacts}
              className="bg-[#FFD700]/10 border border-[#FFD700]/30 text-[#FFD700] font-roboto text-xs px-3 py-1.5 rounded-md hover:bg-[#FFD700]/20 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-1.5">
              {loadingContacts ? <Icon name="Loader" size={11} className="animate-spin" /> : <Icon name="Download" size={11} />}
              {loadingContacts ? "Загружаю..." : "Показать всех"}
            </button>
          ) : (
            <button onClick={() => loadContacts()} disabled={loadingContacts} title="Обновить"
              className="text-white/40 hover:text-white p-2 rounded-md hover:bg-white/5 transition-colors">
              <Icon name="RefreshCw" size={13} className={loadingContacts ? "animate-spin" : ""} />
            </button>
          )}
        </div>

        {showAll && (
          <>
            {/* Фильтр-источник */}
            <div className="flex gap-1.5 mb-2 flex-wrap">
              {([
                { k: "all", l: "Все", count: counts.all },
                { k: "registered", l: "Скидки", count: counts.registered },
                { k: "repair", l: "Ремонт", count: counts.repair },
                ...(counts.wh > 0 ? [{ k: "wh" as const, l: "WH", count: counts.wh }] : []),
              ] as { k: "all" | Source; l: string; count: number }[]).map(s => {
                const a = sourceFilter === s.k;
                return (
                  <button key={s.k} onClick={() => setSourceFilter(s.k)}
                    className={`font-roboto text-[11px] px-3 py-1 rounded-full transition-all active:scale-95 ${
                      a
                        ? "bg-[#FFD700] text-black font-bold"
                        : "bg-[#141414] border border-[#1F1F1F] text-white/50 hover:text-white"
                    }`}>
                    {s.l} <span className="opacity-70 tabular-nums">{s.count}</span>
                  </button>
                );
              })}
            </div>

            {/* Текстовый фильтр */}
            <div className="mb-3 relative">
              <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
              <input
                value={filter}
                onChange={e => setFilter(e.target.value)}
                placeholder="Имя или телефон..."
                className="w-full bg-[#0A0A0A] border border-[#1F1F1F] text-white pl-9 pr-9 py-2 font-roboto text-sm rounded-md focus:outline-none focus:border-[#FFD700]/50 focus:bg-[#141414] placeholder:text-white/25 transition-all" />
              {filter && (
                <button onClick={() => setFilter("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white p-0.5 transition-colors">
                  <Icon name="X" size={14} />
                </button>
              )}
            </div>

            {loadingContacts ? (
              <div className="text-center py-10 text-white/30 font-roboto text-sm">
                <Icon name="Loader" size={16} className="animate-spin inline mr-2" />Загружаю клиентов...
              </div>
            ) : contacts.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-14 h-14 mx-auto mb-2 bg-[#141414] border border-[#222] rounded-full flex items-center justify-center">
                  <Icon name="Users" size={24} className="text-white/20" />
                </div>
                <div className="font-roboto text-white/40 text-sm">Нет клиентов</div>
              </div>
            ) : visibleContacts.length === 0 ? (
              <div className="text-center py-8 text-white/30 font-roboto text-sm">По фильтру ничего не найдено</div>
            ) : (
              <div className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-1">
                {visibleContacts.map(c => {
                  const initials = c.full_name.trim().split(/\s+/).map(w => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "?";
                  return (
                    <div key={c.id} className="group bg-[#0A0A0A] border border-[#1A1A1A] rounded-md px-3 py-2.5 flex items-center gap-3 hover:border-[#FFD700]/30 hover:bg-[#141414] transition-all">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#333] to-[#1a1a1a] border border-white/10 flex items-center justify-center font-oswald font-bold text-sm text-white/70 shrink-0 group-hover:border-[#FFD700]/40 transition-colors">
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-roboto text-white text-sm truncate font-medium">{c.full_name || <span className="text-white/30 italic">Без имени</span>}</div>
                        <a href={`tel:${c.phone}`} onClick={e => e.stopPropagation()}
                          className="font-roboto text-[#FFD700]/80 text-[11px] hover:text-[#FFD700] flex items-center gap-1 mt-0.5">
                          <Icon name="Phone" size={9} />{c.phone}
                        </a>
                      </div>
                      <span className={`font-oswald text-[9px] uppercase font-bold px-2 py-0.5 rounded-sm tracking-wide shrink-0 ${SOURCE_STYLE[c.source]}`}>
                        {SOURCE_LABEL[c.source]}
                      </span>
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