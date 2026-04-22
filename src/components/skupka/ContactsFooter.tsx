import { useState } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { ymGoal, Goals } from "@/lib/ym";

const ShareButton = () => {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = window.location.origin;
    const text = "Скупка24 — выкуп техники и золота за 15 минут. Честная оценка, деньги сразу.";
    if (navigator.share) {
      navigator.share({ title: "Скупка24", text, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button onClick={share}
      className="flex items-center gap-1.5 font-roboto text-xs text-white/30 hover:text-[#FFD700] transition-colors">
      <Icon name={copied ? "Check" : "Share2"} size={13} />
      {copied ? "Скопировано!" : "Поделиться"}
    </button>
  );
};

interface ContactsFooterProps {
  scrollTo: (href: string) => void;
}

const ContactsFooter = ({ scrollTo }: ContactsFooterProps) => {
  return (
    <>
      {/* CONTACTS */}
      <section id="contacts" className="py-12 md:py-20 border-t border-[#FFD700]/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-8 md:mb-12">
            <p className="font-roboto text-[#FFD700] text-sm uppercase tracking-widest mb-2">Связь</p>
            <h2 className="font-oswald text-3xl md:text-5xl font-bold">КОНТАКТЫ</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
            {[
              { icon: "MapPin", title: "Калуга, Кирова 11", lines: ["+7 (992) 999-03-33", "24/7 без выходных"], href: "tel:+79929990333", yandex: true },
              { icon: "Phone", title: "Бесплатный звонок", lines: ["8 (800) 600-68-33", "Бесплатно по России"], href: "tel:88006006833" },
              { icon: "MessageCircle", title: "Telegram", lines: ["@skupka24", "Ответим за 5 минут"], href: "https://t.me/skupka24" },
              { icon: "Mail", title: "Email", lines: ["lekermany@yandex.ru", "Деловые запросы"], href: "mailto:lekermany@yandex.ru" },
            ].map((c) => (
              <a key={c.title} href={c.href}
                onClick={() => {
                  if (c.href.startsWith("tel:")) ymGoal(Goals.CALL_CLICK, { place: "footer" });
                  else if (c.href.startsWith("https://t.me")) ymGoal(Goals.TELEGRAM_CLICK, { place: "footer" });
                }}
                className="border border-[#FFD700]/20 p-4 md:p-6 hover:border-[#FFD700] active:bg-[#FFD700]/5 transition-colors group block">
                <div className="w-10 h-10 md:w-12 md:h-12 border border-[#FFD700]/20 flex items-center justify-center mb-3 group-hover:bg-[#FFD700]/10 transition-colors">
                  <Icon name={c.icon} size={20} className="text-[#FFD700]" />
                </div>
                <h3 className="font-oswald text-sm md:text-base font-bold uppercase mb-1.5">{c.title}</h3>
                {"yandex" in c && c.yandex && (
                  <div className="mb-2" onClick={e => e.preventDefault()}>
                    <iframe
                      src="https://yandex.ru/sprav/widget/rating-badge/52473097879?type=rating&theme=dark"
                      width="150"
                      height="50"
                      frameBorder="0"
                      title="Рейтинг Яндекс"
                    />
                  </div>
                )}
                {c.lines.map(l => <p key={l} className="font-roboto text-white/60 text-xs md:text-sm">{l}</p>)}
              </a>
            ))}
          </div>

          <div className="mt-8 md:mt-12 bg-[#FFD700] p-5 md:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-oswald text-xl md:text-2xl font-bold text-black uppercase">Готовы продать технику?</h3>
              <p className="font-roboto text-black/60 text-sm mt-1">Оценим бесплатно. Деньги в день обращения.</p>
            </div>
            <button onClick={() => scrollTo("#evaluate")}
              className="w-full sm:w-auto bg-black text-[#FFD700] font-oswald font-bold text-lg px-8 py-4 uppercase tracking-wide hover:bg-[#1A1A1A] active:scale-95 transition-all shrink-0 flex items-center justify-center gap-2">
              <Icon name="Zap" size={18} />
              Оценить сейчас
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#0A0A0A] border-t border-[#FFD700]/10 py-6 md:py-8">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src="https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/bucket/9c9b4fca-bfd7-4841-a827-eb0354dad8da.JPG"
              alt="Скупка24"
              className="w-8 h-8 rounded-full object-cover"
              loading="lazy"
              decoding="async"
            />
            <div>
              <span className="font-oswald font-bold text-[#FFD700]">СКУПКА24</span>
              <div className="flex flex-col">
                <a href="tel:88006006833" className="font-roboto text-[#FFD700] text-[10px] font-bold hover:opacity-80 transition-opacity leading-tight">+7 (800) 600-68-33</a>
                <span className="font-roboto text-white/40 text-[10px] leading-tight">звонок бесплатный</span>
              </div>
            </div>
          </div>
          <p className="font-roboto text-white/30 text-sm">© 2015–2026 Скупка24. Все права защищены.</p>
          <div className="flex items-center gap-4">
            <ShareButton />
            {["Политика конфиденциальности", "Договор оферты"].map(l => (
              <a key={l} href="#" className="font-roboto text-white/30 text-xs hover:text-white/60 transition-colors hidden sm:block">{l}</a>
            ))}
            <Link to="/requisites" className="font-roboto text-white/30 text-xs hover:text-[#FFD700] transition-colors hidden sm:block">Реквизиты</Link>
          </div>
        </div>
      </footer>
    </>
  );
};

export default ContactsFooter;