/**
 * Экран сравнения периодов — наложение до 4 отчётов.
 * Показывает: расходы по категориям, доходы, деньги, прибыль — всё в одном экране.
 */
import { useState } from "react";
import Icon from "@/components/ui/icon";
import type { HistoryEntry } from "./useFinanceHistory";
import HistoryPeriodList from "./historyView/HistoryPeriodList";
import HistoryCharts from "./historyView/HistoryCharts";

interface Props {
  history: HistoryEntry[];
  onRemove: (id: string) => void;
  onClear: () => void;
}

export default function FinanceHistoryView({ history, onRemove, onClear }: Props) {
  const [selected, setSelected] = useState<string[]>(() =>
    history.slice(0, 4).map(e => e.id)
  );
  const [section, setSection] = useState<"overview" | "expenses" | "income" | "problems">("overview");

  const active = history.filter(e => selected.includes(e.id));

  const toggleSelect = (id: string) => {
    setSelected(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : prev.length < 4 ? [...prev, id] : prev
    );
  };

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-6">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{
          background: "rgba(255,215,0,0.08)", border: "1px solid rgba(255,215,0,0.2)",
        }}>
          <Icon name="History" size={24} style={{ color: "rgba(255,215,0,0.5)" }} />
        </div>
        <div className="font-oswald font-bold text-base uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.4)" }}>
          История пуста
        </div>
        <div className="font-roboto text-sm" style={{ color: "rgba(255,255,255,0.25)" }}>
          Сформируйте первый отчёт — он сохранится автоматически.
          Загружайте выписки за разные периоды для сравнения.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <HistoryPeriodList
        history={history}
        selected={selected}
        active={active}
        onToggle={toggleSelect}
        onRemove={onRemove}
        onClear={onClear}
      />

      {active.length < 2 ? (
        <div className="px-4 py-8 rounded-xl text-center font-roboto text-sm" style={{ color: "rgba(255,255,255,0.25)", border: "1px dashed rgba(255,255,255,0.1)" }}>
          Выберите минимум 2 периода для сравнения
        </div>
      ) : (
        <HistoryCharts
          active={active}
          section={section}
          onSection={setSection}
        />
      )}
    </div>
  );
}
