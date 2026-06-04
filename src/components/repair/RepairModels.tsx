import Icon from "@/components/ui/icon";

const MODELS = [
  "iPhone 15",
  "iPhone 14",
  "iPhone 13",
  "iPhone 12",
  "iPhone 11",
  "iPhone XR",
  "iPhone X",
  "iPhone SE",
];

export default function RepairModels({ onOrder }: { onOrder: () => void }) {
  return (
    <section className="px-4 sm:px-8 py-14 max-w-5xl mx-auto">
      <div className="text-center mb-9">
        <h2 className="font-oswald text-3xl sm:text-4xl font-bold uppercase">
          Ремонт популярных <span className="text-[#FFD700]">iPhone</span>
        </h2>
        <p className="text-white/50 text-sm mt-2">Чиним все модели — выберите свою или оставьте заявку</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {MODELS.map((m) => (
          <button
            key={m}
            onClick={onOrder}
            className="group bg-[#111] border border-white/[0.07] hover:border-[#FFD700]/50 rounded-xl p-4 flex items-center justify-between transition-all hover:-translate-y-0.5"
          >
            <span className="flex items-center gap-2">
              <Icon name="Smartphone" size={18} className="text-[#FFD700]" />
              <span className="font-oswald text-sm font-semibold uppercase">{m}</span>
            </span>
            <Icon name="ArrowRight" size={15} className="text-white/30 group-hover:text-[#FFD700] transition-colors" />
          </button>
        ))}
      </div>
    </section>
  );
}
