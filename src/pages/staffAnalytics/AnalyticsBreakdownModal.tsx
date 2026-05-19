import Icon from "@/components/ui/icon";

type Row = {
  /** Подпись слева */
  label: string;
  /** Значение справа (число — будет отформатировано в ₽; строка — выводится как есть) */
  value: number | string;
  /** Цвет значения (text-emerald-300 / text-orange-400 и т.п.) */
  color?: string;
  /** Подсказка под подписью (мелким шрифтом) */
  hint?: string;
  /** Доп. иконка слева от label */
  icon?: string;
  /** Если true — рисует разделитель сверху */
  divider?: boolean;
};

/** Одна позиция в списке "что продали / купили / починили" */
export type BreakdownItem = {
  /** Заголовок позиции (модель / название) */
  title: string;
  /** Дата (форматированная) — выводится мелко справа от заголовка */
  date?: string;
  /** Доп. подпись слева (тип/проба/клиент) */
  subtitle?: string;
  /** Строки с цифрами: "куплено / продано / мастер / прибыль" */
  metrics?: Array<{ label: string; value: number; color?: string }>;
  /** Главное число справа (например, прибыль) */
  totalValue?: number;
  totalColor?: string;
  totalLabel?: string;
};

/** Группа — заголовок и список позиций (например, "Продано 3 шт") */
export type BreakdownGroup = {
  title: string;
  icon?: string;
  emptyText?: string;
  items: BreakdownItem[];
};

export type BreakdownContent = {
  /** Заголовок модалки */
  title: string;
  /** Эмоджи / иконка над заголовком */
  emoji?: string;
  /** Большое число вверху (итог раздела) */
  total: number;
  /** Подпись итога ("чистая прибыль" / "выручка" и т.п.) */
  totalLabel: string;
  /** Цвет акцента (для подсветки) */
  accentColor?: "emerald" | "gold" | "purple" | "blue" | "red";
  /** Список строк с детализацией: «за что» */
  rows: Row[];
  /** Группы со списком позиций (под строками) */
  groups?: BreakdownGroup[];
  /** Период, к которому относятся цифры */
  periodLabel: string;
  /** Дополнительная нижняя ссылка (например, открыть полный отчёт) */
  footer?: { label: string; onClick: () => void };
};

type Props = {
  content: BreakdownContent;
  onClose: () => void;
};

const fmt = (v: number | string): string => {
  if (typeof v === "string") return v;
  return v.toLocaleString("ru-RU") + " ₽";
};

const ACCENT_BG: Record<string, string> = {
  emerald: "from-emerald-500/20 via-emerald-500/8 to-transparent border-emerald-400/40",
  gold:    "from-[#FFD700]/20 via-[#FFD700]/8 to-transparent border-[#FFD700]/40",
  purple:  "from-purple-500/20 via-purple-500/8 to-transparent border-purple-400/40",
  blue:    "from-blue-500/20 via-blue-500/8 to-transparent border-blue-400/40",
  red:     "from-red-500/20 via-red-500/8 to-transparent border-red-400/40",
};

const ACCENT_TEXT: Record<string, string> = {
  emerald: "text-emerald-300",
  gold:    "text-[#FFD700]",
  purple:  "text-purple-300",
  blue:    "text-blue-300",
  red:     "text-red-300",
};

/**
 * Универсальная модалка для детализации финансовых блоков.
 *
 * Используется для виджетов «🔧 Ремонт +X», «🥇 Золото +X», «📦 Б/У +X»
 * на главном дашборде Staff — показывает за что эта сумма (выручка, закупка,
 * мастер-инкам, продажи, скупки и т.д.).
 */
export default function AnalyticsBreakdownModal({ content, onClose }: Props) {
  const accent = content.accentColor || "emerald";

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-md bg-gradient-to-br from-[#1A1A1A] via-[#141414] to-[#0E0E0E] sm:rounded-2xl rounded-t-2xl border-t sm:border border-white/10 max-h-[90vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Заголовок */}
        <div className={`relative bg-gradient-to-br ${ACCENT_BG[accent]} border-b ${ACCENT_BG[accent].split(" ").pop()} p-4`}>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-white/60 font-roboto text-[10px] uppercase tracking-wider mb-1">
                {content.emoji && <span className="text-base">{content.emoji}</span>}
                <span>{content.title}</span>
                <span className="text-white/30">· {content.periodLabel}</span>
              </div>
              <div className={`font-oswald font-bold text-3xl tabular-nums ${ACCENT_TEXT[accent]}`}>
                {content.total >= 0 ? "+" : ""}{content.total.toLocaleString("ru-RU")} ₽
              </div>
              <div className="font-roboto text-white/45 text-[10px] mt-0.5">{content.totalLabel}</div>
            </div>
            <button
              onClick={onClose}
              className="text-white/50 hover:text-red-300 hover:bg-red-500/10 p-1.5 rounded-md transition-colors active:scale-95 shrink-0"
              title="Закрыть"
            >
              <Icon name="X" size={20} />
            </button>
          </div>
        </div>

        {/* Список строк */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {content.rows.length === 0 && (
            <div className="text-center py-6 text-white/30 font-roboto text-sm">
              За этот период нет данных
            </div>
          )}
          {content.rows.map((r, i) => (
            <div
              key={i}
              className={`flex items-center justify-between gap-3 py-2 px-2.5 rounded-md ${
                r.divider ? "border-t border-white/8 mt-2 pt-3" : ""
              } hover:bg-white/[0.02] transition-colors`}
            >
              <div className="flex items-start gap-2 min-w-0 flex-1">
                {r.icon && (
                  <Icon name={r.icon} size={13} className="text-white/40 mt-0.5 shrink-0" />
                )}
                <div className="min-w-0">
                  <div className="font-roboto text-[12px] text-white/80 truncate">{r.label}</div>
                  {r.hint && (
                    <div className="font-roboto text-[10px] text-white/35 mt-0.5">{r.hint}</div>
                  )}
                </div>
              </div>
              <div className={`font-oswald font-bold text-sm tabular-nums shrink-0 ${r.color || "text-white/85"}`}>
                {fmt(r.value)}
              </div>
            </div>
          ))}

          {/* Группы со списком позиций (детализация по штукам) */}
          {content.groups?.map((g, gi) => (
            <div key={`g-${gi}`} className="mt-3 pt-3 border-t border-white/8">
              <div className="flex items-center gap-1.5 mb-2 px-1">
                {g.icon && <Icon name={g.icon} size={12} className={ACCENT_TEXT[accent]} />}
                <div className={`font-roboto text-[11px] uppercase tracking-wider ${ACCENT_TEXT[accent]}`}>
                  {g.title}
                </div>
              </div>
              {g.items.length === 0 ? (
                <div className="text-center py-3 text-white/25 font-roboto text-[11px]">
                  {g.emptyText || "Пусто"}
                </div>
              ) : (
                <div className="space-y-1.5">
                  {g.items.map((it, ii) => (
                    <div
                      key={ii}
                      className="rounded-md bg-black/30 border border-white/5 px-2.5 py-2 hover:bg-black/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="min-w-0 flex-1">
                          <div className="font-roboto text-[12px] text-white/90 font-medium truncate">
                            {it.title}
                          </div>
                          {it.subtitle && (
                            <div className="font-roboto text-[10px] text-white/40 mt-0.5 truncate">
                              {it.subtitle}
                            </div>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          {typeof it.totalValue === "number" && (
                            <div className={`font-oswald font-bold text-[14px] tabular-nums ${it.totalColor || (it.totalValue >= 0 ? "text-emerald-300" : "text-red-300")}`}>
                              {it.totalValue >= 0 ? "+" : ""}{it.totalValue.toLocaleString("ru-RU")} ₽
                            </div>
                          )}
                          {it.totalLabel && (
                            <div className="font-roboto text-[9px] text-white/35 mt-0.5">{it.totalLabel}</div>
                          )}
                          {it.date && (
                            <div className="font-roboto text-[9px] text-white/30 mt-0.5">{it.date}</div>
                          )}
                        </div>
                      </div>
                      {it.metrics && it.metrics.length > 0 && (
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
                          {it.metrics.map((m, mi) => (
                            <div key={mi} className="font-roboto text-[10px] flex items-baseline gap-1">
                              <span className="text-white/40">{m.label}:</span>
                              <span className={`font-oswald tabular-nums font-semibold ${m.color || "text-white/80"}`}>
                                {m.value.toLocaleString("ru-RU")} ₽
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Футер */}
        {content.footer && (
          <button
            onClick={content.footer.onClick}
            className="w-full px-4 py-2.5 border-t border-white/8 hover:bg-white/[0.03] transition-colors text-[11px] font-roboto text-[#FFD700]/80 hover:text-[#FFD700] inline-flex items-center justify-center gap-1.5"
          >
            <Icon name="ExternalLink" size={11} />
            {content.footer.label}
          </button>
        )}
      </div>
    </div>
  );
}