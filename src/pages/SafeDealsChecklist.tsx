/** Бесплатный чек-лист «Как не попасть на мошенника при продаже Б/У техники».
 * Лид-магнит — оставляет email/телефон и получает PDF/HTML. */
import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { subscribeLead } from "./safeDeals/api";

const CHECKLIST = [
  { icon: "MapPin", title: "Никогда не передавайте товар в чужой машине или в подъезде",
    desc: "Только людные места: ТЦ, кафе или офис гаранта (например, наш ул. Кирова, 11)." },
  { icon: "Banknote", title: "Не принимайте оплату по «фейк-чеку» Сбербанка",
    desc: "SMS-уведомление о переводе можно подделать. Дождитесь прихода денег на свой телефон или проверьте в приложении банка." },
  { icon: "FileText", title: "Проверяйте паспорт покупателя",
    desc: "При сделках от 30 000 ₽ — это нормально. Сфотографируйте, чтобы потом не было «я не я»." },
  { icon: "ShieldOff", title: "Не отдавайте товар «на проверку» в руки",
    desc: "Особенно если покупатель просит «отойти к свету» — частая схема краж в людных местах." },
  { icon: "Smartphone", title: "Удалите все аккаунты до сделки",
    desc: "Apple ID, Google-аккаунт, банковские приложения. Сделайте сброс к заводским настройкам при покупателе." },
  { icon: "Camera", title: "Снимайте сделку на камеру",
    desc: "Включите запись на втором телефоне или используйте видеонаблюдение в офисе. Защита от споров." },
  { icon: "Users", title: "Не ходите на сделку один с дорогой техникой",
    desc: "Приведите друга или встречайтесь у гаранта. Особенно касается ноутбуков и iPhone Pro." },
  { icon: "AlertCircle", title: "Не верьте «срочно надо, отдам полцены»",
    desc: "Если покупатель давит на скорость и торопит — это всегда красный флаг." },
  { icon: "Eye", title: "Проверяйте по серийнику / IMEI",
    desc: "Через CheckIMEI или у нас в офисе. Узнаете, не находится ли устройство в розыске." },
  { icon: "Ban", title: "Если что-то смущает — откажитесь",
    desc: "Лучше упустить сделку, чем потерять товар и нервы. Цена не стоит риска." },
];

export default function SafeDealsChecklist() {
  const [contact, setContact] = useState("");
  const [loading, setLoading] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    document.title = "Чек-лист: как не попасть на мошенника в Калуге — Скупка24";
    const desc = "10 правил безопасной продажи Б/У техники. Бесплатно — оставьте email или телефон. Скупка24, Калуга.";
    const setMeta = (n: string, c: string, p = false) => {
      const sel = p ? `meta[property="${n}"]` : `meta[name="${n}"]`;
      let el = document.head.querySelector<HTMLMetaElement>(sel);
      if (!el) { el = document.createElement("meta"); if (p) el.setAttribute("property", n); else el.setAttribute("name", n); document.head.appendChild(el); }
      el.setAttribute("content", c); return el;
    };
    const tags = [
      setMeta("description", desc),
      setMeta("keywords", "как продать телефон безопасно, мошенники бу техника, чек-лист продажи iphone, как обманывают на авито"),
    ];
    return () => tags.forEach(t => t.remove());
  }, []);

  const submit = async () => {
    if (contact.trim().length < 4) return;
    setLoading(true);
    const r = await subscribeLead(contact.trim(), "checklist");
    setLoading(false);
    if (r.ok) setUnlocked(true);
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-[#F0F0F0]" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" }}>
      <TopBar />
      <div className="max-w-3xl mx-auto px-4 sm:px-5 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FFD700]/[0.1] border border-[#FFD700]/30 text-[10px] font-bold tracking-wider uppercase text-[#FFD700] mb-3">
            <Icon name="Gift" size={11} /> Бесплатно
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight">
            10 правил: <span className="bg-gradient-to-r from-[#FFD700] to-[#fff3a0] bg-clip-text text-transparent">как не попасть на мошенника</span>
          </h1>
          <p className="text-sm text-[#999] mt-3 max-w-xl mx-auto">
            Чек-лист от Скупка24, основанный на 9 годах работы с Б/У техникой в Калуге.
          </p>
        </div>

        <div className="space-y-3 mb-8">
          {CHECKLIST.map((c, i) => (
            <div key={i} className={`bg-[#141414] border border-[#2A2A2A] rounded-2xl p-4 flex items-start gap-3 transition ${
              !unlocked && i >= 3 ? "opacity-40 blur-sm pointer-events-none" : ""
            }`}>
              <div className="w-9 h-9 rounded-xl bg-[#FFD700]/15 text-[#FFD700] flex items-center justify-center shrink-0 font-extrabold text-sm">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Icon name={c.icon} size={14} className="text-[#FFD700]" />
                  <h3 className="text-sm font-bold text-white">{c.title}</h3>
                </div>
                <p className="text-xs text-[#bbb] leading-relaxed">{c.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {!unlocked && (
          <div className="sticky bottom-4 bg-gradient-to-br from-[#FFD700]/[0.15] via-[#0D0D0D] to-[#FFD700]/[0.08] border-2 border-[#FFD700]/40 rounded-2xl p-5 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="Lock" size={16} className="text-[#FFD700]" />
              <h3 className="text-base font-extrabold text-[#FFD700]">Откройте остальные 7 правил</h3>
            </div>
            <p className="text-sm text-[#bbb] mb-3">Оставьте контакт — увидите весь чек-лист сразу.</p>
            <div className="flex gap-2 flex-wrap">
              <input value={contact} onChange={(e) => setContact(e.target.value)}
                placeholder="Email или телефон"
                className="flex-1 min-w-[180px] bg-[#1C1C1C] border border-[#2A2A2A] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#FFD700]" />
              <button onClick={submit} disabled={loading || contact.trim().length < 4}
                className="px-5 py-3 rounded-xl bg-[#FFD700] text-black font-bold text-sm disabled:opacity-50">
                {loading ? "..." : "Открыть"}
              </button>
            </div>
          </div>
        )}

        {unlocked && (
          <div className="bg-gradient-to-br from-[#FFD700]/[0.08] to-transparent border border-[#FFD700]/25 rounded-2xl p-5 text-center">
            <Icon name="CheckCircle2" size={28} className="text-emerald-400 mx-auto mb-2" />
            <h3 className="text-base font-extrabold text-emerald-300 mb-2">Спасибо! Все правила открыты</h3>
            <p className="text-sm text-[#999] mb-4">А ещё — приходите к нам в офис. Никаких мошенников там нет.</p>
            <a href="/safe-deals" className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#FFD700] text-black font-bold text-sm">
              <Icon name="Shield" size={16} /> Подать заявку на сделку
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function TopBar() {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-[#2A2A2A] bg-[#141414]">
      <a href="/" className="flex items-center gap-2.5 no-underline">
        <div className="w-8 h-8 rounded-lg bg-[#FFD700] flex items-center justify-center text-black font-extrabold text-base">С</div>
        <span className="text-[#FFD700] font-bold text-base">Скупка24</span>
      </a>
      <a href="/safe-deals" className="text-sm text-[#FFD700] hover:underline">← К сделке</a>
    </div>
  );
}
