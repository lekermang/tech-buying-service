const STEPS = [
  { num: "1", title: "Оставьте заявку", text: "Опишите модель и проблему — это займёт меньше минуты" },
  { num: "2", title: "Диагностика", text: "Мастер свяжется с вами и назовёт точную стоимость работ" },
  { num: "3", title: "Ремонт", text: "Срочный ремонт при вас за 20 минут или приём в сервис" },
  { num: "4", title: "Готово!", text: "Получаете устройство и гарантию на выполненную работу" },
];

export default function RepairHowItWorks() {
  return (
    <section id="how" className="border-y border-white/[0.07] bg-[#111] px-4 sm:px-8 py-14 my-4 scroll-mt-20">
      <div className="text-center mb-9">
        <h2 className="font-oswald text-3xl sm:text-4xl font-bold uppercase">
          Как это <span className="text-[#FFD700]">работает</span>
        </h2>
        <p className="text-white/50 text-sm mt-2">4 простых шага</p>
      </div>
      <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {STEPS.map((s) => (
          <div key={s.num} className="text-center px-2">
            <div className="mx-auto mb-4 w-[52px] h-[52px] rounded-full bg-[#FFD700] flex items-center justify-center font-oswald text-2xl font-bold text-black">
              {s.num}
            </div>
            <div className="font-oswald text-base font-semibold uppercase mb-2">{s.title}</div>
            <div className="text-white/50 text-[13px] leading-relaxed">{s.text}</div>
          </div>
        ))}
      </div>
    </section>
  );
}