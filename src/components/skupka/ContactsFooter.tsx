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
      {/* CONTACTS — премиум в стиле Trade In */}
      <section id="contacts" className="relative py-14 md:py-20 border-t border-[#FFD700]/10 overflow-hidden">
        {/* Фоновые свечения Trade-In DNA */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(135deg, rgba(255,215,0,0.06) 0%, transparent 50%, rgba(34,158,217,0.05) 100%)" }} />
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(255,215,0,0.10)" }} />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(34,158,217,0.08)" }} />

        <div className="relative max-w-7xl mx-auto px-4">
          {/* Заголовок в стиле Trade In */}
          <div className="mb-8 md:mb-12">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 bg-[#FFD700]/15 border border-[#FFD700]/40 text-[#FFD700] font-roboto text-[10px] md:text-xs uppercase tracking-widest px-2.5 py-1 rounded-full">
                <Icon name="Headphones" size={12} />
                На связи 24/7
              </span>
              <span className="font-roboto text-[#FFD700] text-sm uppercase tracking-widest">Контакты</span>
            </div>
            <h2 className="font-oswald text-3xl md:text-5xl font-bold leading-[1.05]">
              <span className="text-[#FFD700]">Звоните,</span> пишите,<br />
              <span className="text-white">приезжайте.</span>
            </h2>
          </div>

          {/* ── ГЛАВНАЯ ТЕЛЕФОННАЯ КАПСУЛА — продающий блок ───────────────── */}
          <div className="relative mb-6 md:mb-8 group">
            <div className="absolute -inset-2 bg-gradient-to-r from-[#FFD700]/30 via-[#FFD700]/10 to-[#FFD700]/30 blur-2xl pointer-events-none" />
            <a href="tel:88006006833"
              onClick={() => ymGoal(Goals.CALL_CLICK, { place: "footer_main" })}
              className="relative block bg-gradient-to-br from-[#1a1a1a] via-black to-[#1a1a1a] border border-[#FFD700]/40 hover:border-[#FFD700] rounded-md p-5 md:p-7 transition-all overflow-hidden">
              {/* Бегущий блик */}
              <span className="absolute inset-0 bg-[linear-gradient(115deg,transparent_40%,rgba(255,215,0,0.08)_50%,transparent_60%)] bg-[length:250%_100%] -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />

              <div className="relative flex flex-col md:flex-row items-start md:items-center gap-5 md:gap-6">
                {/* Огромная золотая иконка-телефон */}
                <div className="relative shrink-0">
                  <div className="absolute inset-0 rounded-full blur-xl animate-pulse" style={{ background: "rgba(255,215,0,0.4)" }} />
                  <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-full bg-[radial-gradient(circle_at_30%_30%,#fff3a0,#ffd700_45%,#b8860b_100%)] flex items-center justify-center
                                  shadow-[0_0_30px_rgba(255,215,0,0.4),inset_0_2px_0_rgba(255,255,255,0.4),inset_0_-2px_4px_rgba(0,0,0,0.3)]">
                    <Icon name="Phone" size={28} className="text-black" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-oswald font-bold text-[10px] md:text-xs text-[#FFD700]/70 uppercase tracking-[0.3em] mb-1">Звонок бесплатный по России</div>
                  <div className="font-oswald font-bold text-[#FFD700] text-3xl md:text-5xl tracking-tight leading-none whitespace-nowrap"
                       style={{ textShadow: '0 0 30px rgba(255,215,0,0.3)' }}>
                    8 800 600-68-33
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <button type="button"
                       onClick={(e) => {
                         e.stopPropagation();
                         e.preventDefault();
                         ymGoal(Goals.CALL_CLICK, { place: "footer_secondary" });
                         window.location.href = "tel:+79929990333";
                       }}
                       className="font-roboto text-white/60 hover:text-[#FFD700] text-xs md:text-sm transition-colors bg-transparent border-0 p-0 cursor-pointer">
                      или +7 (992) 999-03-33
                    </button>
                    <span className="text-[#FFD700]/30">·</span>
                    <span className="font-roboto text-white/40 text-xs md:text-sm flex items-center gap-1">
                      <Icon name="Clock" size={11} className="text-[#FFD700]/60" />
                      перезвоним за 15 минут
                    </span>
                  </div>
                </div>

                <Icon name="ArrowRight" size={24} className="hidden md:block text-[#FFD700]/40 group-hover:text-[#FFD700] group-hover:translate-x-1 transition-all" />
              </div>
            </a>
          </div>

          {/* ── КНОПКИ-МЕССЕНДЖЕРЫ ───────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
            <a href="https://t.me/skypka24" target="_blank" rel="noopener noreferrer"
              onClick={() => ymGoal(Goals.TELEGRAM_CLICK, { place: "footer" })}
              className="group relative overflow-hidden flex items-center gap-3 bg-gradient-to-br from-[#229ED9]/15 to-[#229ED9]/5 border border-[#229ED9]/40 hover:border-[#229ED9] rounded-md px-4 py-4 transition-all">
              <div className="absolute -inset-1 bg-gradient-to-br from-[#229ED9]/20 to-transparent blur-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <div className="relative w-11 h-11 rounded-full bg-[#229ED9] flex items-center justify-center shrink-0 shadow-[0_4px_14px_rgba(34,158,217,0.4)]">
                <Icon name="Send" size={20} className="text-white" />
              </div>
              <div className="relative flex-1 min-w-0">
                <div className="font-oswald font-bold text-white text-sm uppercase tracking-wide">Telegram</div>
                <div className="font-roboto text-[#229ED9] text-xs">@skypka24 · ответ за 5 мин</div>
              </div>
              <Icon name="ArrowUpRight" size={16} className="relative text-[#229ED9]/50 group-hover:text-[#229ED9] transition-colors" />
            </a>

            <a href="https://wa.me/79929990333" target="_blank" rel="noopener noreferrer"
              onClick={() => ymGoal(Goals.TELEGRAM_CLICK, { place: "footer_wa" })}
              className="group relative overflow-hidden flex items-center gap-3 bg-gradient-to-br from-[#25D366]/15 to-[#25D366]/5 border border-[#25D366]/40 hover:border-[#25D366] rounded-md px-4 py-4 transition-all">
              <div className="absolute -inset-1 bg-gradient-to-br from-[#25D366]/20 to-transparent blur-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <div className="relative w-11 h-11 rounded-full bg-[#25D366] flex items-center justify-center shrink-0 shadow-[0_4px_14px_rgba(37,211,102,0.4)]">
                <Icon name="MessageCircle" size={20} className="text-white" />
              </div>
              <div className="relative flex-1 min-w-0">
                <div className="font-oswald font-bold text-white text-sm uppercase tracking-wide">WhatsApp</div>
                <div className="font-roboto text-[#25D366] text-xs">Быстрая связь без звонка</div>
              </div>
              <Icon name="ArrowUpRight" size={16} className="relative text-[#25D366]/50 group-hover:text-[#25D366] transition-colors" />
            </a>

            <a href="mailto:lekermany@yandex.ru"
              className="group relative overflow-hidden flex items-center gap-3 bg-gradient-to-br from-[#FFD700]/15 to-[#FFD700]/5 border border-[#FFD700]/40 hover:border-[#FFD700] rounded-md px-4 py-4 transition-all">
              <div className="absolute -inset-1 bg-gradient-to-br from-[#FFD700]/20 to-transparent blur-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <div className="relative w-11 h-11 rounded-full bg-[#FFD700] flex items-center justify-center shrink-0 shadow-[0_4px_14px_rgba(255,215,0,0.4)]">
                <Icon name="Mail" size={20} className="text-black" />
              </div>
              <div className="relative flex-1 min-w-0">
                <div className="font-oswald font-bold text-white text-sm uppercase tracking-wide">Email</div>
                <div className="font-roboto text-[#FFD700] text-xs">lekermany@yandex.ru</div>
              </div>
              <Icon name="ArrowUpRight" size={16} className="relative text-[#FFD700]/50 group-hover:text-[#FFD700] transition-colors" />
            </a>
          </div>

          {/* ── КАРТА ДВУХ ОФИСОВ ────────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 mb-6 md:mb-8">
            {[
              { addr: "ул. Кирова, 11", oid: "114124804072", rt: "~54.510800,36.253900", num: "01" },
              { addr: "ул. Кирова, 7/47", oid: "52473097879", rt: "~54.513200,36.257100", num: "02" },
            ].map(b => (
              <div key={b.addr} className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-br from-[#FFD700]/15 to-transparent blur-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <div className="relative bg-[#0D0D0D] border border-[#FFD700]/20 hover:border-[#FFD700]/50 rounded-md overflow-hidden transition-colors">
                  {/* Шапка */}
                  <div className="px-4 py-3 bg-gradient-to-r from-[#FFD700]/10 to-transparent border-b border-[#FFD700]/20 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-md bg-[#FFD700]/15 border border-[#FFD700]/40 flex items-center justify-center shrink-0">
                        <Icon name="MapPin" size={16} className="text-[#FFD700]" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-oswald font-bold text-white text-sm uppercase truncate">Калуга · {b.addr}</div>
                        <div className="font-roboto text-white/50 text-[10px] flex items-center gap-1">
                          <Icon name="Clock" size={10} className="text-[#FFD700]/60" />
                          24/7 без выходных
                        </div>
                      </div>
                    </div>
                    <span className="font-oswald font-bold text-3xl text-[#FFD700]/20 leading-none shrink-0">{b.num}</span>
                  </div>
                  {/* Карта */}
                  <iframe
                    src={`https://yandex.ru/map-widget/v1/?z=15&ol=biz&oid=${b.oid}`}
                    className="w-full h-[220px] md:h-[260px] block"
                    frameBorder="0"
                    title={`Карта ${b.addr}`}
                    loading="lazy"
                  />
                  {/* Кнопки */}
                  <div className="grid grid-cols-2 gap-px bg-[#FFD700]/15">
                    <a href={`tel:+79929990333`}
                      onClick={() => ymGoal(Goals.CALL_CLICK, { place: "footer_branch" })}
                      className="bg-black/60 hover:bg-[#FFD700]/10 text-[#FFD700] font-oswald font-bold text-xs uppercase tracking-wide py-3 transition-colors flex items-center justify-center gap-1.5">
                      <Icon name="Phone" size={13} />
                      Позвонить
                    </a>
                    <a href={`https://yandex.ru/maps/?rtext=${b.rt}&rtt=auto&oid=${b.oid}`}
                      target="_blank" rel="noopener noreferrer"
                      className="bg-[#FFD700] text-black font-oswald font-bold text-xs uppercase tracking-wide py-3 hover:bg-[#FFED4E] transition-colors flex items-center justify-center gap-1.5">
                      <Icon name="Navigation" size={13} />
                      Маршрут
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── ФИНАЛЬНЫЙ CTA «Готовы продать технику?» ──────────────────── */}
          <div className="relative overflow-hidden rounded-md">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,#fff3a0_0%,#ffd700_50%,#d4a017_100%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent_30%,rgba(255,255,255,0.4)_50%,transparent_70%)] bg-[length:250%_100%] animate-gold-shimmer pointer-events-none" />
            <div className="relative p-5 md:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 bg-black/20 border border-black/30 text-black font-oswald font-bold text-[10px] uppercase tracking-[0.25em] px-2.5 py-1 rounded-full mb-2">
                  <Icon name="Zap" size={11} />
                  Прямо сейчас
                </div>
                <h3 className="font-oswald text-2xl md:text-3xl font-bold text-black uppercase leading-tight">Готовы продать технику?</h3>
                <p className="font-roboto text-black/70 text-sm md:text-base mt-1">Оценим бесплатно. Деньги в день обращения.</p>
              </div>
              <button onClick={() => scrollTo("#evaluate")}
                className="w-full sm:w-auto bg-black hover:bg-[#1A1A1A] text-[#FFD700] font-oswald font-bold text-base md:text-lg px-7 md:px-8 py-3.5 md:py-4 uppercase tracking-wide active:scale-95 transition-all shrink-0 flex items-center justify-center gap-2 rounded-md
                           shadow-[0_8px_24px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,215,0,0.2)] ring-1 ring-[#FFD700]/40 group">
                <Icon name="Zap" size={18} />
                Оценить сейчас
                <Icon name="ArrowRight" size={16} className="opacity-60 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
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