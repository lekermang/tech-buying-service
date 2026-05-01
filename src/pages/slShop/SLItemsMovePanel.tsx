import Icon from "@/components/ui/icon";

type Props = {
  branches: { id: number; name: string }[];
  movingTo: number | "";
  setMovingTo: (v: number | "") => void;
  selectedSize: number;
  itemsCount: number;
  moveBusy: boolean;
  moveMsg: string | null;
  onMove: (moveAll: boolean) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
};

export default function SLItemsMovePanel({
  branches, movingTo, setMovingTo,
  selectedSize, itemsCount, moveBusy, moveMsg,
  onMove, onSelectAll, onClearSelection,
}: Props) {
  return (
    <div className="bg-[#0F0F0F] border border-[#1F1F1F] rounded-xl p-2.5 mb-2">
      <div className="flex items-center gap-2 flex-wrap">
        <Icon name="Truck" size={14} className="text-[#FFD700]" />
        <span className="text-[11px] uppercase font-bold tracking-wide text-white/60">Перенос</span>
        <select value={movingTo} onChange={e => setMovingTo(e.target.value ? Number(e.target.value) : "")}
          className="bg-[#141414] border border-[#1F1F1F] rounded px-2 py-1 text-[12px]">
          <option value="">Выбрать филиал →</option>
          {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        {selectedSize > 0 ? (
          <>
            <span className="text-[10px] text-[#FFD700]">{selectedSize} выбрано</span>
            <button onClick={() => onMove(false)} disabled={moveBusy || !movingTo}
              className="bg-[#FFD700] text-black font-bold px-3 py-1 rounded text-[11px] disabled:opacity-50">
              Перенести {selectedSize}
            </button>
            <button onClick={onClearSelection} className="text-[10px] text-white/40 underline">сброс</button>
          </>
        ) : (
          <>
            <button onClick={onSelectAll} className="bg-[#141414] border border-[#1F1F1F] px-2 py-1 rounded text-[10px] text-white/60">
              Выбрать всё
            </button>
            <button onClick={() => onMove(true)} disabled={moveBusy || !movingTo}
              className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold px-3 py-1 rounded text-[11px] disabled:opacity-50">
              Перенести ВСЁ ({itemsCount})
            </button>
          </>
        )}
      </div>
      {moveMsg && <div className="text-[11px] text-emerald-300 mt-1.5">{moveMsg}</div>}
    </div>
  );
}
