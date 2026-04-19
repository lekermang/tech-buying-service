import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { adminHeaders } from "@/lib/adminFetch";

const ADMIN_URL = "https://functions.poehali.dev/a105aede-d55d-4b99-9d3e-5e977887aa04";

type Group = "all" | "registered" | "repair" | "wh";
type Contact = { id: string; full_name: string; phone: string; source: "registered" | "repair" | "wh" };

const GROUPS: { key: Group; label: string; desc: string; icon: string; color: string }[] = [
  { key: "all",        label: "Все клиенты",       desc: "Зарегистрированные + клиенты ремонта + WH",  icon: "Users",        color: "text-[#FFD700]" },
  { key: "registered", label: "Программа скидок",  desc: "Зарегистрировались через личный кабинет",    icon: "Star",         color: "text-blue-400" },
  { key: "repair",     label: "Клиенты ремонта",   desc: "Сдавали технику в ремонт",                   icon: "Wrench",       color: "text-green-400" },
  { key: "wh",         label: "WH контакты",        desc: "Импортированные из WhatsApp",                icon: "MessageCircle", color: "text-purple-400" },
];

const MAX_SMS = 480;

const WH_YANDEX_URL = "https://disk.yandex.ru/d/5EfAAkfp_gdjkA";

export default function SmsBlastTab({ token }: { token: string }) {
  const [group, setGroup] = useState<Group>("all");
  const [message, setMessage] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number; total: number } | null>(null);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number } | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [smsCost, setSmsCost] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);

  const loadBalance = async () => {
    setLoadingBalance(true);
    try {
      const res = await fetch(ADMIN_URL, {
        method: "POST",
        headers: { ...adminHeaders(token), "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sms_balance" }),
      });
      const data = await res.json();
      if (data.ok) {
        setBalance(data.balance !== null && data.balance !== undefined ? parseFloat(data.balance) : null);
        setSmsCost(data.sms_cost !== null && data.sms_cost !== undefined ? parseFloat(data.sms_cost) : null);
      }
    } catch (_e) { /* ignore */ }
    setLoadingBalance(false);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadBalance(); }, []);

  const importWH = async () => {
    setImporting(true);
    setImportResult(null);
    setError("");
    try {
      const res = await fetch(ADMIN_URL, {
        method: "POST",
        headers: { ...adminHeaders(token), "Content-Type": "application/json" },
        body: JSON.stringify({ action: "import_wh_contacts", url: WH_YANDEX_URL }),
      });
      const data = await res.json();
      if (data.ok) {
        setImportResult({ imported: data.imported, skipped: data.skipped });
        loadContacts("wh");
      } else {
        setError(data.error || "Ошибка импорта");
      }
    } catch (e) {
      setError(`Ошибка: ${e}`);
    }
    setImporting(false);
  };

  const loadContacts = async (g: Group) => {
    setLoadingContacts(true);
    setContacts([]);
    setResult(null);
    setConfirmed(false);
    setError("");
    try {
      const res = await fetch(`${ADMIN_URL}?action=sms_contacts&group=${g}`, { headers: adminHeaders(token) });
      const data = await res.json();
      if (data.error) {
        setError(`Ошибка загрузки: ${data.error} (статус ${res.status})`);
      }
      setContacts(data.contacts || []);
    } catch (e) {
      setError(`Сетевая ошибка: ${e}`);
    }
    setLoadingContacts(false);
  };

  useEffect(() => { loadContacts(group); }, [group]);

  const handleSend = async () => {
    if (!message.trim()) { setError("Введите текст сообщения"); return; }
    if (!confirmed) { setError("Подтвердите отправку"); return; }
    setError("");
    setSending(true);
    setResult(null);
    const res = await fetch(ADMIN_URL, {
      method: "POST",
      headers: { ...adminHeaders(token), "Content-Type": "application/json" },
      body: JSON.stringify({ action: "sms_blast", message: message.trim(), group }),
    });
    const data = await res.json();
    setSending(false);
    if (data.ok) {
      setResult(data);
      setConfirmed(false);
    } else {
      setError(data.error || "Ошибка отправки");
    }
  };

  const charsLeft = MAX_SMS - message.length;
  const smsCount = Math.ceil(message.length / 160) || 1;

  return (
    <div className="p-5 max-w-3xl">
      <div className="mb-5">
        <div className="font-bold text-white text-sm uppercase tracking-wide mb-0.5">SMS Рассылка</div>
        <div className="text-white/40 text-xs">Акции и уведомления клиентам через sms.ru</div>
      </div>

      {/* Группа получателей */}
      <div className="mb-5">
        <div className="text-white/40 text-[10px] uppercase tracking-wider mb-2">Кому отправить</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {GROUPS.map(g => (
            <button
              key={g.key}
              onClick={() => setGroup(g.key)}
              className={`flex items-start gap-3 p-3 border text-left transition-all ${
                group === g.key
                  ? "border-[#FFD700] bg-[#FFD700]/5"
                  : "border-[#333] bg-[#1A1A1A] hover:border-white/20"
              }`}
            >
              <Icon name={g.icon} size={16} className={`mt-0.5 shrink-0 ${group === g.key ? g.color : "text-white/30"}`} />
              <div>
                <div className={`text-sm font-bold ${group === g.key ? "text-white" : "text-white/60"}`}>{g.label}</div>
                <div className="text-[10px] text-white/30 mt-0.5 leading-snug">{g.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Импорт WH контактов */}
      {group === "wh" && (
        <div className="mb-4 bg-purple-500/5 border border-purple-500/20 p-3 flex items-center justify-between gap-3">
          <div>
            <div className="text-purple-300 text-xs font-bold">WH контакты (WhatsApp)</div>
            <div className="text-white/30 text-[10px] mt-0.5">Загрузить номера из чата Яндекс Диска. Уже добавленные — пропускаются.</div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {importResult && (
              <span className="text-green-400 text-xs">+{importResult.imported} добавлено</span>
            )}
            <button
              onClick={importWH}
              disabled={importing}
              className="bg-purple-600 hover:bg-purple-500 disabled:opacity-60 text-white text-xs font-bold px-3 py-2 flex items-center gap-1.5 transition-colors"
            >
              {importing
                ? <Icon name="Loader2" size={13} className="animate-spin" />
                : <Icon name="Download" size={13} />}
              {importing ? "Импорт..." : "Импортировать"}
            </button>
          </div>
        </div>
      )}

      {/* Список контактов */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <div className="text-white/40 text-[10px] uppercase tracking-wider">
            Получатели
            {!loadingContacts && <span className="ml-1 text-white/60">({contacts.length})</span>}
          </div>
          <button onClick={() => loadContacts(group)} className="text-white/30 hover:text-white transition-colors">
            <Icon name="RefreshCw" size={12} />
          </button>
        </div>
        <div className="bg-[#111] border border-[#222] max-h-40 overflow-y-auto">
          {loadingContacts ? (
            <div className="text-white/30 text-xs text-center py-4">Загружаю...</div>
          ) : contacts.length === 0 ? (
            <div className="text-white/30 text-xs text-center py-4">Нет контактов</div>
          ) : (
            <div className="divide-y divide-white/5">
              {contacts.map(c => (
                <div key={c.id} className="flex items-center gap-3 px-3 py-1.5">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 uppercase shrink-0 ${
                    c.source === "registered" ? "bg-blue-500/15 text-blue-400"
                    : c.source === "wh" ? "bg-purple-500/15 text-purple-400"
                    : "bg-green-500/15 text-green-400"
                  }`}>
                    {c.source === "registered" ? "скидки" : c.source === "wh" ? "WH" : "ремонт"}
                  </span>
                  <span className="text-white/70 text-xs truncate flex-1">{c.full_name}</span>
                  <span className="text-white/40 text-xs font-mono shrink-0">{c.phone}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Текст SMS */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-white/40 text-[10px] uppercase tracking-wider">Текст сообщения</div>
          <div className={`text-[10px] ${charsLeft < 20 ? "text-red-400" : "text-white/30"}`}>
            {message.length} / {MAX_SMS} символов · {smsCount} СМС
          </div>
        </div>
        <textarea
          value={message}
          onChange={e => { if (e.target.value.length <= MAX_SMS) setMessage(e.target.value); }}
          placeholder={"Скупка24: Акция! Скидка 10% на ремонт смартфонов до конца месяца. Ждём вас!"}
          rows={4}
          className="w-full bg-[#0D0D0D] border border-[#333] text-white px-3 py-2.5 text-sm focus:outline-none focus:border-[#FFD700] resize-none font-roboto leading-relaxed"
        />
        <div className="mt-1.5 text-white/25 text-[10px]">
          Отправитель будет указан как «IPMamedov». Убедитесь, что имя зарегистрировано в sms.ru.
        </div>
      </div>

      {/* Предпросмотр */}
      {message && (
        <div className="mb-4 bg-[#1A1A1A] border border-[#333] p-3">
          <div className="text-white/40 text-[10px] uppercase tracking-wider mb-2">Предпросмотр</div>
          <div className="bg-[#0D0D0D] rounded px-3 py-2 text-white/80 text-sm leading-relaxed whitespace-pre-wrap">{message}</div>
        </div>
      )}

      {/* Подтверждение */}
      {contacts.length > 0 && message && (
        <div className="mb-4">
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={e => setConfirmed(e.target.checked)}
              className="accent-[#FFD700] w-4 h-4 mt-0.5 shrink-0"
            />
            <span className="text-white/60 text-sm leading-snug">
              Подтверждаю отправку <span className="text-white font-bold">{contacts.length} SMS</span> на все указанные номера.
              Отменить рассылку после запуска невозможно.
            </span>
          </label>
        </div>
      )}

      {error && (
        <div className="mb-3 flex items-center gap-2 text-red-400 text-sm">
          <Icon name="AlertCircle" size={14} />
          {error}
        </div>
      )}

      {result && (
        <div className="mb-4 bg-green-500/10 border border-green-500/30 p-4">
          <div className="flex items-center gap-2 text-green-400 font-bold mb-1">
            <Icon name="CheckCircle" size={16} />
            Рассылка завершена
          </div>
          <div className="text-white/60 text-sm">
            Отправлено: <span className="text-white font-bold">{result.sent}</span> &nbsp;·&nbsp;
            Ошибок: <span className={result.failed > 0 ? "text-red-400 font-bold" : "text-white/40"}>{result.failed}</span> &nbsp;·&nbsp;
            Всего: {result.total}
          </div>
        </div>
      )}

      {/* Стоимость и баланс */}
      <div className="mb-4 bg-[#111] border border-[#222] p-3 flex flex-wrap items-center gap-x-6 gap-y-2">
        <div className="flex items-center gap-2">
          <span className="text-white/40 text-[10px] uppercase tracking-wider">Цена за 1 SMS</span>
          <span className="text-white text-sm font-bold">
            {loadingBalance ? "..." : smsCost !== null ? `${smsCost.toFixed(2)} ₽` : "—"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white/40 text-[10px] uppercase tracking-wider">Итого за рассылку</span>
          <span className="text-[#FFD700] text-sm font-bold">
            {smsCost !== null && contacts.length > 0
              ? `≈ ${(smsCost * contacts.length).toFixed(2)} ₽`
              : "—"}
          </span>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-white/40 text-[10px] uppercase tracking-wider">Баланс sms.ru</span>
          <span className={`text-sm font-bold ${balance !== null && balance < 50 ? "text-red-400" : "text-green-400"}`}>
            {loadingBalance ? "..." : balance !== null ? `${balance.toFixed(2)} ₽` : "—"}
          </span>
          <button onClick={loadBalance} disabled={loadingBalance} className="text-white/30 hover:text-white transition-colors ml-1">
            <Icon name="RefreshCw" size={11} className={loadingBalance ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <button
        onClick={handleSend}
        disabled={sending || !message.trim() || contacts.length === 0 || !confirmed}
        className="flex items-center gap-2 bg-[#FFD700] text-black font-bold text-sm px-6 py-3 uppercase tracking-wide hover:bg-yellow-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Icon name={sending ? "Loader" : "Send"} size={15} className={sending ? "animate-spin" : ""} />
        {sending ? `Отправляю ${contacts.length} SMS...` : `Отправить ${contacts.length} SMS`}
      </button>
    </div>
  );
}