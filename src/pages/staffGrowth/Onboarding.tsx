const STEPS = [
  "Выберите задачу — начните с блока «Что делать сейчас».",
  "Нажмите «Беру в работу» — все увидят, что задача ваша.",
  "Когда закончите — нажмите «Готово».",
];

export default function Onboarding({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75" />
      <div className="relative w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-700 p-5">
        <h2 className="text-lg font-semibold text-white">Это план развития</h2>
        <p className="mt-1 text-sm text-zinc-400">Здесь собраны задачи, которые сделают работу проще и прибыльнее.</p>
        <ol className="mt-4 space-y-3">
          {STEPS.map((s, i) => (
            <li key={i} className="flex gap-3 text-sm text-zinc-200">
              <span className="shrink-0 h-7 w-7 rounded-full bg-amber-400 text-zinc-950 font-bold inline-flex items-center justify-center">{i + 1}</span>
              <span className="pt-1">{s}</span>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-sm text-zinc-400">Всё сохраняется автоматически.</p>
        <button onClick={onClose} className="mt-4 w-full min-h-[48px] rounded-lg bg-white text-zinc-950 text-base font-semibold">Понятно</button>
      </div>
    </div>
  );
}
