import React from "react";
import Icon from "@/components/ui/icon";
import type { Stats } from "./types";

type Props = {
  stats: Stats | null;
  onOpen: () => void;
};

export default function FloatingButton({ stats, onOpen }: Props) {
  const overdue = stats?.overdue_count || 0;
  const newCount = stats?.new_count || 0;
  const totalActive = newCount + (stats?.taken_count || 0);

  return (
    <button
      onClick={onOpen}
      className={`fixed z-[150] bottom-20 right-3 sm:bottom-6 sm:right-6 rounded-full shadow-2xl border-2 transition-all active:scale-95 flex items-center gap-2 px-3.5 py-2.5 font-bold text-sm ${
        overdue > 0
          ? "bg-gradient-to-br from-red-500 to-red-600 border-red-300/50 text-white animate-pulse shadow-red-500/40"
          : newCount > 0
            ? "bg-gradient-to-br from-[#FFD700] to-[#d4a017] border-[#FFE34D] text-black shadow-[#FFD700]/30"
            : "bg-[#1A1A1A]/90 border-[#FFD700]/30 text-white/70 backdrop-blur"
      }`}
      title="Горящие заявки"
    >
      <Icon name={overdue > 0 ? "Flame" : "Inbox"} size={18} />
      {totalActive > 0 ? (
        <span>
          {overdue > 0 && <span className="font-black">🔥 {overdue}</span>}
          {overdue === 0 && newCount > 0 && <span>Новых: {newCount}</span>}
          {overdue === 0 && newCount === 0 && <span>В работе: {stats?.taken_count}</span>}
        </span>
      ) : <span>Заявки</span>}
    </button>
  );
}
