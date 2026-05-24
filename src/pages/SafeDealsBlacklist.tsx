/** Публичный анонимизированный чёрный список — /safe-deals/blacklist.
 * SEO-фактор + повышение доверия: «У нас есть открытая база мошенников». */
import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { listBlacklist, type BlacklistEntry } from "./safeDeals/api";

export default function SafeDealsBlacklist() {
  const [items, setItems] = useState<BlacklistEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Чёрный список мошенников Калуги — Скупка24";
    const setMeta = (n: string, c: string, p = false) => {
      const sel = p ? `meta[property="${n}"]` : `meta[name="${n}"]`;
      let el = document.head.querySelector<HTMLMetaElement>(sel);
      if (!el) { el = document.createElement("meta"); if (p) el.setAttribute("property", n); else el.setAttribute("name", n); document.head.appendChild(el); }
      el.setAttribute("content", c); return el;
    };
    const tags = [
      setMeta("description", "Открытый чёрный список недобросовестных покупателей и продавцов Б/У техники в Калуге. Защита от мошенников — Скупка24."),
      setMeta("keywords", "чёрный список мошенников калуга, неблагонадёжные покупатели, мошенники б/у техника"),
    ];
    listBlacklist().then(r => {
      if (r.ok && r.data) setItems(r.data.items);
      setLoading(false);
    });
    return () => tags.forEach(t => t.remove());
  }, []);

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-[#F0F0F0]" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" }}>
      <TopBar />
      <div className="max-w-3xl mx-auto px-4 sm:px-5 py-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/[0.12] border border-red-500/40 text-[10px] font-bold tracking-wider uppercase text-red-400 mb-3">
            <Icon name="ShieldAlert" size={11} /> Защита от мошенников
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight">
            Открытый <span className="text-red-400">чёрный список</span>
          </h1>
          <p className="text-sm text-[#999] mt-3 max-w-xl mx-auto leading-relaxed">
            База недобросовестных покупателей и продавцов из Калуги. Заявки от них автоматически блокируются.
            Данные анонимизированы. Не оставляем шанса обману.
          </p>
        </div>

        <div className="bg-[#FFD700]/[0.06] border border-[#FFD700]/15 rounded-2xl p-4 mb-5 text-sm text-[#ddd] leading-relaxed">
          <Icon name="Info" size={14} className="inline mr-1.5 text-[#FFD700]" />
          Если вас обманули — напишите в офис Кирова, 11. После проверки нарушитель попадёт в этот список.
          ИИ автоматически блокирует заявки от номеров из чёрного списка.
        </div>

        {loading && (
          <div className="text-center py-12 text-[#777]">
            <Icon name="Loader2" size={24} className="animate-spin inline" />
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="text-center py-16 bg-emerald-500/[0.05] border border-emerald-500/20 rounded-2xl">
            <Icon name="ShieldCheck" size={32} className="text-emerald-400 mx-auto mb-2" />
            <div className="text-base font-bold text-emerald-300">Список пуст — это отлично!</div>
            <div className="text-xs text-[#999] mt-1">Все сделки в Скупка24 пока проходят без нарушений</div>
          </div>
        )}

        {!loading && items.length > 0 && (
          <div className="space-y-2">
            {items.map(it => (
              <div key={it.id} className="bg-[#141414] border border-[#2A2A2A] rounded-xl p-3 sm:p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/15 text-red-400 flex items-center justify-center shrink-0">
                  <Icon name={it.role === "seller" ? "User" : "UserX"} size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-bold text-white">{it.masked}</span>
                    <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-300 font-bold">
                      {it.role === "seller" ? "Продавец" : "Покупатель"}
                    </span>
                    {it.incidents > 1 && (
                      <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-orange-500/15 text-orange-300 font-bold">
                        Инцидентов: {it.incidents}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[#bbb]">{it.reason || "Нарушение правил сделки"}</div>
                  {it.createdAt && (
                    <div className="text-[10px] text-[#666] mt-1">{new Date(it.createdAt).toLocaleDateString("ru-RU")}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 bg-gradient-to-br from-[#FFD700]/[0.08] to-transparent border border-[#FFD700]/20 rounded-2xl p-5 text-center">
          <h3 className="text-base font-extrabold mb-2">Хотите безопасно продать?</h3>
          <p className="text-sm text-[#999] mb-4">Все сделки проходят через наш офис. ИИ проверяет покупателя по чёрному списку.</p>
          <a href="/safe-deals" className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#FFD700] text-black font-bold text-sm hover:shadow-[0_15px_40px_-10px_rgba(255,215,0,0.5)] transition">
            <Icon name="Shield" size={16} /> Подать заявку
          </a>
        </div>
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
