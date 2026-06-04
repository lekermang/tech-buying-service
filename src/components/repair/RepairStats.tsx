const STATS = [
  { num: "10 лет", label: "Опыта в ремонте техники" },
  { num: "5 000+", label: "Довольных клиентов в Калуге" },
  { num: "95%", label: "Рекомендуют нас друзьям" },
  { num: "12 мес", label: "Гарантия на все работы" },
];

export default function RepairStats() {
  return (
    <section className="border-y border-[#FFD700]/10 bg-[#111]/70 backdrop-blur-sm px-4 py-8 sm:py-10">
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