import Icon from "@/components/ui/icon";

interface ContactsFooterProps {
  scrollTo: (href: string) => void;
}

const ContactsFooter = ({ scrollTo }: ContactsFooterProps) => {
  return (
    <>
      {/* CONTACTS */}
      <section id="contacts" className="py-20 border-t border-[#FFD700]/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-12">
            <p className="font-roboto text-[#FFD700] text-sm uppercase tracking-widest mb-2">Связь</p>
            <h2 className="font-oswald text-4xl md:text-5xl font-bold">КОНТАКТЫ</h2>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: "MapPin", title: "Филиал — Кирова 11", lines: ["+7 (992) 999-03-33", "24/7 без выходных"], href: "tel:+79929990333" },
              { icon: "MapPin", title: "Филиал — Кирова 7/47", lines: ["8 (800) 600-68-33", "Бесплатно по России"], href: "tel:88006006833" },
              { icon: "MessageCircle", title: "WhatsApp / Telegram", lines: ["@skupka24", "Ответим за 5 минут"], href: "https://t.me/skupka24" },
              { icon: "Mail", title: "Email", lines: ["info@skupka24.ru", "Для деловых запросов"], href: "mailto:info@skupka24.ru" },
            ].map((c) => (
              <a key={c.title} href={c.href}
                className="border border-[#FFD700]/20 p-6 hover:border-[#FFD700] transition-colors group block">
                <div className="w-12 h-12 border border-[#FFD700]/20 flex items-center justify-center mb-4 group-hover:bg-[#FFD700]/10 transition-colors">
                  <Icon name={c.icon} size={22} className="text-[#FFD700]" />
                </div>
                <h3 className="font-oswald text-lg font-bold uppercase mb-2">{c.title}</h3>
                {c.lines.map(l => <p key={l} className="font-roboto text-white/60 text-sm">{l}</p>)}
              </a>
            ))}
          </div>

          <div className="mt-12 bg-[#FFD700] p-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-oswald text-2xl font-bold text-black uppercase">Готовы продать технику?</h3>
              <p className="font-roboto text-black/60 text-sm mt-1">Оценим бесплатно. Деньги в день обращения.</p>
            </div>
            <button onClick={() => scrollTo("#evaluate")}
              className="bg-black text-[#FFD700] font-oswald font-bold text-lg px-8 py-4 uppercase tracking-wide hover:bg-[#1A1A1A] transition-colors">
              Оценить сейчас
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#0A0A0A] border-t border-[#FFD700]/10 py-8">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#FFD700] flex items-center justify-center">
              <span className="font-oswald font-bold text-black text-xs">С24</span>
            </div>
            <span className="font-oswald font-bold text-[#FFD700]">СКУПКА24</span>
          </div>
          <p className="font-roboto text-white/30 text-sm">© 2015–2026 Скупка24. Все права защищены.</p>
          <div className="flex gap-6">
            {["Политика конфиденциальности", "Договор оферты"].map(l => (
              <a key={l} href="#" className="font-roboto text-white/30 text-xs hover:text-white/60 transition-colors">{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </>
  );
};

export default ContactsFooter;
