import { useState } from "react";
import Icon from "@/components/ui/icon";
import { FAQS } from "./repairFaqData";

export default function RepairFAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="px-4 sm:px-8 py-14 max-w-3xl mx-auto">
      <div className="text-center mb-9">
        <h2 className="font-oswald text-3xl sm:text-4xl font-bold uppercase">
          Частые <span className="text-[#FFD700]">вопросы</span>
        </h2>
      </div>
      <div className="flex flex-col gap-2.5">
        {FAQS.map((f, i) => (
          <div key={f.q} className="bg-[#111] border border-white/[0.07] rounded-xl overflow-hidden">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left"
            >
              <span className="font-roboto font-medium text-[15px] text-white/90">{f.q}</span>
              <Icon
                name="ChevronDown"
                size={18}
                className={`shrink-0 text-[#FFD700] transition-transform ${open === i ? "rotate-180" : ""}`}
              />
            </button>
            {open === i && (
              <div className="px-5 pb-4 text-white/55 text-sm leading-relaxed">{f.a}</div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}