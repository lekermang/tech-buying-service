import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { ymGoal, Goals } from "@/lib/ym";

const PHONE_TEL = "tel:+79929990333";
const PHONE_DISPLAY = "8 992 999-03-33";

export default function AntiqueCTA() {
  return (
    <>
      {/* ── CTA + контакты ── */}
      <section id="antique-contact" className="px-4 sm:px-8 py-14 max-w-3xl mx-auto scroll-mt-20">
        <div className="bg-[#111]/80 border border-[#FFD700]/20 rounded-2xl p-6 sm:p-10 backdrop-blur-sm text-center">
          <div className="w-14 h-14 rounded-xl bg-[#FFD700]/10 flex items-center justify-center mx-auto mb-5">
            <Icon name="Landmark" size={26} className="text-[#FFD700]" />
          </div>
          <h2 className="font-oswald text-2xl sm:text-3xl font-bold uppercase mb-2">
            Есть предмет для оценки?
          </h2>
          <p className="text-white/55 text-sm leading-relaxed mb-7 max-w-md mx-auto">
            Позвоните, напишите в Telegram или приходите лично — ул. Кирова, 7.
            Ежедневно 9:00–21:00. Выезд эксперта на дом при крупных коллекциях.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a href={PHONE_TEL}
              onClick={() => ymGoal(Goals.CALL_CLICK, { place: "antique_cta" })}
              className="group relative overflow-hidden text-black font-oswald font-bold uppercase tracking-wide px-8 py-4 rounded-xl text-base active:scale-95 transition-all inline-flex items-center gap-2
                         bg-[linear-gradient(180deg,#fff3a0_0%,#ffd700_45%,#d4a017_100%)]
                         shadow-[0_0_0_1px_rgba(255,215,0,0.6),0_10px_30px_rgba(255,215,0,0.35),inset_0_1px_0_rgba(255,255,255,0.5)]
                         hover:shadow-[0_0_0_1px_rgba(255,215,0,0.9),0_14px_40px_rgba(255,215,0,0.55),inset_0_1px_0_rgba(255,255,255,0.6)]">
              <span className="absolute inset-0 bg-[linear-gradient(115deg,transparent_35%,rgba(255,255,255,0.7)_50%,transparent_65%)] bg-[length:200%_100%] -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
              <Icon name="Phone" size={18} className="relative" />
              <span className="relative">{PHONE_DISPLAY}</span>
            </a>
            <a href="https://t.me/skypka24"
              target="_blank" rel="noopener noreferrer"
              className="group bg-black/40 backdrop-blur-sm border border-[#FFD700]/40 hover:border-[#FFD700] text-[#FFD700] px-8 py-4 rounded-xl text-base font-oswald font-bold uppercase tracking-wide active:scale-95 transition-all inline-flex items-center gap-2">
              <Icon name="Send" size={18} />
              Telegram
            </a>
          </div>
          <p className="mt-5 text-white/30 text-xs font-roboto">
            Калуга, ул. Кирова, 7 · Ежедневно 9:00–21:00
          </p>
        </div>
      </section>

      {/* ── SEO-текст ── */}
      <section className="px-4 sm:px-8 pb-12 max-w-3xl mx-auto border-t border-white/[0.05]">
        <div className="pt-8 text-white/35 text-sm leading-relaxed font-roboto space-y-3">
          <p>
            <strong className="text-white/50">Скупка антиквариата в Калуге</strong> — Скупка24 работает с предметами старины с 2014 года.
            Принимаем <strong className="text-white/50">царские монеты</strong>, монеты Николая II, Александра III, платиновые монеты Российской Империи.
            Покупаем <strong className="text-white/50">православные иконы</strong> всех школ — Новгородской, Московской, Строгановской — с окладами серебро, золото, финифть.
          </p>
          <p>
            Принимаем <strong className="text-white/50">фарфор ИФЗ, Гарднер, Кузнецов</strong>, агитфарфор ГФЗ.
            Покупаем <strong className="text-white/50">советские ордена и медали</strong>, плакаты 1920-х, конструктивизм, мебель советского авангарда.
            Оцениваем <strong className="text-white/50">древние монеты</strong> — ауреусы, тетрадрахмы, греческие драхмы, сребреники Киевской Руси.
            Покупаем <strong className="text-white/50">бронзовые статуэтки</strong> — античную бронзу, буддийские статуи, работы Родена, Бари, Ланте.
          </p>
          <p>
            <strong className="text-white/50">Где продать антиквариат в Калуге?</strong> Приходите к нам на ул. Кирова, 7 или позвоните — приедем сами при крупных коллекциях.
            Оценку проводим по международным аукционным каталогам: Heritage Auctions, Stack's Bowers, Coins.ru, Сотбис.
            <strong className="text-white/50"> Выкуп антиквариата</strong> с официальным договором и выплатой в день обращения.
          </p>
        </div>
      </section>

      {/* Подвал */}
      <footer className="border-t border-[#FFD700]/10 bg-[#0a0a0a]/80 px-4 py-8 text-center text-white/40 text-sm">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Icon name="Landmark" size={16} className="text-[#FFD700]" />
          <span className="font-oswald text-white/60 uppercase tracking-wide">Скупка 24 · Антиквариат · Калуга</span>
        </div>
        <a href={PHONE_TEL}
          onClick={() => ymGoal(Goals.CALL_CLICK, { place: "antique_footer" })}
          className="text-[#FFD700] font-oswald font-bold text-2xl hover:underline">
          {PHONE_DISPLAY}
        </a>
        <p className="mt-2">Калуга, ул. Кирова, 7 · ежедневно 9:00–21:00</p>
        <Link to="/" className="inline-flex items-center gap-1.5 text-[#FFD700] hover:text-[#ffed4a] text-sm transition-colors mt-4">
          <Icon name="ArrowLeft" size={14} />
          На главную Скупка24
        </Link>
      </footer>
    </>
  );
}
