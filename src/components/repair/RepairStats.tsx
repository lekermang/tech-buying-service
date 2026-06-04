const STATS = [
  { num: "5000+", label: "Выполненных ремонтов" },
  { num: "20 мин", label: "Срочный ремонт при вас" },
  { num: "90 дней", label: "Гарантия на работу" },
  { num: "100%", label: "Оригинальные запчасти" },
];

export default function RepairStats() {
  return (
    <section className="border-y border-white/[0.07] bg-[#111] px-4 py-8 sm:py-10">
      <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
        {STATS.map((s) => (
          <div key={s.label} className="text-center">
            <div className="font-oswald font-bold text-3xl sm:text-4xl text-[#FFD700]">{s.num}</div>
            <div className="text-white/40 text-[11px] sm:text-xs mt-1">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
