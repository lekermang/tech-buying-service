import { useState, useMemo, useEffect, useCallback } from "react";
import { AUTH_CLIENT_URL } from "./staff.types";
import { useStaffToast } from "./staff/StaffToast";
import useDebouncedValue from "@/hooks/useDebouncedValue";
import { SMS_TEMPLATES, SMS_CATEGORIES, renderTemplate, type SmsTemplate } from "./staff/smsTemplates";
import SearchAndAddPanel from "./staff/clients/SearchAndAddPanel";
import DiscountClientsPanel, { type DiscountClient } from "./staff/clients/DiscountClientsPanel";
import SmsBlastPanel, { type Group } from "./staff/clients/SmsBlastPanel";
import AllContactsPanel, { type Contact, type Source } from "./staff/clients/AllContactsPanel";

const REPAIR_ADMIN_URL = "https://functions.poehali.dev/a105aede-d55d-4b99-9d3e-5e977887aa04";

// Подавляем неиспользуемые импорты, сохраняя их для совместимости
void SMS_TEMPLATES; void SMS_CATEGORIES; void renderTemplate;
type _Sms = SmsTemplate;
void (null as unknown as _Sms);

const MAX_SMS = 480;

export function ClientsTab({ token }: { token: string }) {
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

  // База клиентов программы скидок (как в админке)
  const [discountClients, setDiscountClients] = useState<DiscountClient[]>([]);
  const [loadingDiscount, setLoadingDiscount] = useState(false);
  const [discountOpen, setDiscountOpen] = useState(false);
  const [discountFilter, setDiscountFilter] = useState("");

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

  const loadDiscountClients = useCallback(async (signal?: AbortSignal) => {
    if (!token) return;
    setLoadingDiscount(true);
    try {
      const res = await fetch(`${AUTH_CLIENT_URL}?action=list`, {
        signal,
        headers: { "X-Employee-Token": token },
      });
      const data = await res.json();
      if (Array.isArray(data.clients)) {
        setDiscountClients(data.clients);
      } else if (data.error) {
        toast.error(data.error);
      }
    } catch (e) {
      if ((e as { name?: string })?.name !== "AbortError") {
        toast.error("Не удалось загрузить базу клиентов скидок");
      }
    } finally {
      setLoadingDiscount(false);
    }
  }, [token, toast]);

  useEffect(() => {
    if (!discountOpen) return;
    const ctrl = new AbortController();
    loadDiscountClients(ctrl.signal);
    return () => ctrl.abort();
  }, [discountOpen, loadDiscountClients]);

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

  const debouncedDiscount = useDebouncedValue(discountFilter, 250);
  const visibleDiscountClients = useMemo(() => {
    const q = debouncedDiscount.trim().toLowerCase();
    if (!q) return discountClients;
    return discountClients.filter(c =>
      c.full_name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      (c.email || "").toLowerCase().includes(q)
    );
  }, [discountClients, debouncedDiscount]);

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

  const charsLeft = MAX_SMS - smsMessage.length;
  const smsCount = Math.ceil(smsMessage.length / 70) || 1; // кириллица 70 симв./SMS
  const totalCost = smsCost && smsTargetCount ? smsCost * smsTargetCount * smsCount : null;

  return (
    <div className="p-3 space-y-4">
      <SearchAndAddPanel
        phone={phone}
        setPhone={setPhone}
        search={search}
        searching={searching}
        found={found}
        addForm={addForm}
        setAddForm={setAddForm}
        addClient={addClient}
        addLoading={addLoading}
      />

      <DiscountClientsPanel
        discountOpen={discountOpen}
        setDiscountOpen={setDiscountOpen}
        discountClients={discountClients}
        visibleDiscountClients={visibleDiscountClients}
        discountFilter={discountFilter}
        setDiscountFilter={setDiscountFilter}
        loadingDiscount={loadingDiscount}
        loadDiscountClients={loadDiscountClients}
      />

      <SmsBlastPanel
        smsOpen={smsOpen}
        setSmsOpen={setSmsOpen}
        balance={balance}
        smsCost={smsCost}
        loadingBalance={loadingBalance}
        loadBalance={loadBalance}
        smsGroup={smsGroup}
        setSmsGroup={setSmsGroup}
        counts={counts}
        smsMessage={smsMessage}
        setSmsMessage={setSmsMessage}
        setSmsConfirm={setSmsConfirm}
        smsConfirm={smsConfirm}
        smsTargetCount={smsTargetCount}
        smsCount={smsCount}
        charsLeft={charsLeft}
        totalCost={totalCost}
        smsSending={smsSending}
        sendSms={sendSms}
        smsResult={smsResult}
        MAX_SMS={MAX_SMS}
      />

      <AllContactsPanel
        showAll={showAll}
        setShowAll={setShowAll}
        contacts={contacts}
        visibleContacts={visibleContacts}
        loadingContacts={loadingContacts}
        loadContacts={loadContacts}
        filter={filter}
        setFilter={setFilter}
        sourceFilter={sourceFilter}
        setSourceFilter={setSourceFilter}
        counts={counts}
      />
    </div>
  );
}
