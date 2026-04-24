import { useState, useMemo } from "react";
import Icon from "@/components/ui/icon";
import { Part, ExtraWork, ClientInfo, PART_TYPE_LABEL, QUALITY_COLOR, STATIC_EXTRAS } from "./types";

type Props = {
  form: { model: string };
  partsLoading: boolean;
  parts: Part[];
  showPartsList: boolean;
  groupedParts?: Record<string, Part[]>;
  selectedPart: Part | null;
  extraWorks: string[];
  extraWorksList: ExtraWork[];
  extraTotal: number;
  grandTotal: number;
  clientInfo: ClientInfo | null;
  onSelectPart: (part: Part) => void;
  onToggleExtra: (id: string) => void;
  onChangeSelection: () => void;
};

type Source = "stock" | "order";

/** Гарантия в зависимости от качества запчасти. */
const WARRANTY_BY_QUALITY: Record<string, { label: string; short: string; icon: Parameters<typeof Icon>[0]["name"]; color: string; accent: string }> = {
  ORIG: { label: "1 год гарантии",   short: "1 год",   icon: "ShieldCheck", color: "text-[#FFD700] bg-[#FFD700]/15 border-[#FFD700]/40", accent: "#FFD700" },
  AAA:  { label: "6 мес. гарантии",  short: "6 мес.",  icon: "Shield",      color: "text-green-400 bg-green-500/10 border-green-500/30", accent: "#4ade80" },
  AA:   { label: "3 мес. гарантии",  short: "3 мес.",  icon: "Shield",      color: "text-sky-400 bg-sky-500/10 border-sky-500/30",       accent: "#38bdf8" },
  A:    { label: "30 дней гарантии", short: "30 дней", icon: "Shield",      color: "text-white/60 bg-white/5 border-white/15",            accent: "#a3a3a3" },
};

const getWarranty = (quality: string) => WARRANTY_BY_QUALITY[quality] || WARRANTY_BY_QUALITY.A;

/** Премиум-шильдик гарантии с раскрывающимся тултипом. Останавливаем bubbling, чтобы не выбирать карточку. */
function WarrantyBadge({ quality }: { quality: string }) {
  const [open, setOpen] = useState(false);
  const w = getWarranty(quality);

  return (
    <span className="relative inline-block"
      onMouseLeave={() => setOpen(false)}>
      <span
        role="button"
        tabIndex={0}
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); setOpen(o => !o); }}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); setOpen(o => !o); } }}
        onMouseEnter={() => setOpen(true)}
        className={`inline-flex items-center gap-0.5 border font-oswald font-bold text-[8px] px-1.5 py-0.5 rounded-sm uppercase tracking-wider cursor-help transition-colors ${w.color} hover:brightness-125`}>
        <Icon name={w.icon} size={8} />
        {w.label}
      </span>

      {open && (
        <span
          onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
          className="absolute z-30 left-0 top-full mt-1.5 w-[260px] bg-[#0a0a0a] border rounded-md shadow-[0_8px_24px_rgba(0,0,0,0.5)] p-3 text-left animate-[fadeIn_0.15s_ease]"
          style={{ borderColor: w.accent + "55", boxShadow: `0 0 0 1px ${w.accent}22, 0 8px 24px rgba(0,0,0,0.5)` }}>
          {/* Стрелочка */}
          <span className="absolute -top-1.5 left-3 w-3 h-3 rotate-45 bg-[#0a0a0a]" style={{ borderTop: `1px solid ${w.accent}55`, borderLeft: `1px solid ${w.accent}55` }} />

          <div className="flex items-center gap-1.5 mb-2">
            <Icon name={w.icon} size={12} style={{ color: w.accent }} />
            <span className="font-oswald font-bold text-xs uppercase tracking-wide" style={{ color: w.accent }}>
              {w.label}
            </span>
          </div>

          <div className="space-y-1.5 mb-2">
            <div className="flex items-start gap-1.5">
              <Icon name="Check" size={10} className="text-green-400 mt-0.5 shrink-0" />
              <span className="font-roboto text-[10px] text-white/75 leading-snug">
                Заменим бесплатно при заводском браке
              </span>
            </div>
            <div className="flex items-start gap-1.5">
              <Icon name="Check" size={10} className="text-green-400 mt-0.5 shrink-0" />
              <span className="font-roboto text-[10px] text-white/75 leading-snug">
                Бесплатная диагностика в течение всего срока
              </span>
            </div>
            <div className="flex items-start gap-1.5">
              <Icon name="Check" size={10} className="text-green-400 mt-0.5 shrink-0" />
              <span className="font-roboto text-[10px] text-white/75 leading-snug">
                Официальный акт-договор на руки
              </span>
            </div>
            <div className="flex items-start gap-1.5">
              <Icon name="X" size={10} className="text-red-400/70 mt-0.5 shrink-0" />
              <span className="font-roboto text-[10px] text-white/45 leading-snug">
                Не покрывает механические повреждения и попадание влаги
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-white/5 flex items-center justify-between">
            <span className="font-roboto text-[9px] text-white/40 uppercase tracking-wide">Срок гарантии</span>
            <span className="font-oswald font-bold text-xs" style={{ color: w.accent }}>{w.short}</span>
          </div>
        </span>
      )}
    </span>
  );
}

/**
 * Премиум-селектор запчастей.
 * UX-решения проблемы «выпадающий список перекрывает доп. услуги»:
 *  1. Источник выбирается чипами «В наличии 20–60 мин» / «Под заказ 1–2 ч».
 *  2. Категории — горизонтальные чипы-фильтры, сужают выдачу без скролла.
 *  3. Список встроен в карту, без overlay → ничего не «выскакивает» поверх других виджетов.
 *  4. Кнопка «Не вижу нужного» — мгновенно скрывает список и оставляет описание проблемы.
 */
export default function RepairPartsSelector({
  form, partsLoading, parts, showPartsList,
  selectedPart, extraWorks, extraWorksList, extraTotal, grandTotal,
  clientInfo, onSelectPart, onToggleExtra, onChangeSelection,
}: Props) {
  const [source, setSource] = useState<Source>("stock");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [collapsed, setCollapsed] = useState(false);

  const inStock = useMemo(() => parts.filter(p => p.in_stock), [parts]);
  const onOrder = useMemo(() => parts.filter(p => !p.in_stock), [parts]);

  // Если в выбранном источнике пусто — автоматически переключаемся на другой
  const effectiveSource: Source =
    source === "stock" && inStock.length === 0 && onOrder.length > 0 ? "order"
    : source === "order" && onOrder.length === 0 && inStock.length > 0 ? "stock"
    : source;

  const sourceList = effectiveSource === "stock" ? inStock : onOrder;

  // Категории, доступные в выбранном источнике
  const categories = useMemo(() => {
    const map = new Map<string, number>();
    sourceList.forEach(p => map.set(p.part_type, (map.get(p.part_type) || 0) + 1));
    return Array.from(map.entries());
  }, [sourceList]);

  const filteredList = useMemo(() => {
    if (categoryFilter === "all") return sourceList;
    return sourceList.filter(p => p.part_type === categoryFilter);
  }, [sourceList, categoryFilter]);

  /** ID самой дешёвой позиции в каждом типе ремонта (внутри текущего источника) — для шильдика «🔥 Выгодно». */
  const cheapestIdByType = useMemo(() => {
    const map: Record<string, { id: string; total: number }> = {};
    sourceList.forEach(p => {
      const cur = map[p.part_type];
      if (!cur || p.total < cur.total) map[p.part_type] = { id: p.id, total: p.total };
    });
    const result: Record<string, true> = {};
    Object.values(map).forEach(v => { result[v.id] = true; });
    return result;
  }, [sourceList]);

  return (
    <div>
      {partsLoading && (
        <div className="text-white/40 font-roboto text-[10px] mt-1.5 flex items-center gap-1.5">
          <Icon name="Loader" size={11} className="animate-spin text-[#FFD700]" /> Подбираю запчасти под вашу модель…
        </div>
      )}

      {/* ── ПРЕМИУМ-СЕЛЕКТОР ЗАПЧАСТЕЙ ─────────────────────────────────────── */}
      {!partsLoading && showPartsList && parts.length > 0 && !selectedPart && !collapsed && (
        <div className="mt-2.5 relative">
          {/* Лёгкое золотое свечение за блоком */}
          <div className="absolute -inset-1 bg-gradient-to-br from-[#FFD700]/8 to-transparent blur-lg pointer-events-none" />

          <div className="relative bg-[#0a0a0a] border border-[#FFD700]/25 rounded-md overflow-hidden">

            {/* Шапка: заголовок + «свернуть» */}
            <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-[#FFD700]/10 to-transparent border-b border-[#FFD700]/15">
              <div className="flex items-center gap-1.5">
                <Icon name="Wrench" size={11} className="text-[#FFD700]" />
                <span className="font-oswald font-bold text-[10px] text-[#FFD700] uppercase tracking-wider">
                  Подобрали {parts.length} {parts.length === 1 ? "вариант" : "вариантов"}
                </span>
              </div>
              <button type="button" onClick={() => setCollapsed(true)}
                className="flex items-center gap-1 text-white/40 hover:text-white/70 font-roboto text-[10px] transition-colors">
                Свернуть
                <Icon name="ChevronUp" size={10} />
              </button>
            </div>

            {/* Чипы выбора источника (две вкладки) */}
            <div className="grid grid-cols-2 gap-px bg-[#FFD700]/10 border-b border-[#FFD700]/15">
              <button type="button"
                onClick={() => { setSource("stock"); setCategoryFilter("all"); }}
                disabled={inStock.length === 0}
                className={`flex flex-col items-center gap-0.5 py-2 px-2 transition-all relative
                  ${effectiveSource === "stock"
                    ? "bg-green-500/15 text-green-400"
                    : "bg-black/40 text-white/60 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                  }`}>
                <div className="flex items-center gap-1.5">
                  <Icon name="Zap" size={11} className={effectiveSource === "stock" ? "text-green-400" : ""} />
                  <span className="font-oswald font-bold text-[10px] uppercase tracking-wider">В наличии · 20–60 мин</span>
                  <span className={`px-1 py-0 rounded-sm text-[9px] font-bold ${effectiveSource === "stock" ? "bg-green-500/30 text-green-300" : "bg-white/5 text-white/40"}`}>
                    {inStock.length}
                  </span>
                </div>
                {effectiveSource === "stock" && (
                  <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-green-400" />
                )}
              </button>

              <button type="button"
                onClick={() => { setSource("order"); setCategoryFilter("all"); }}
                disabled={onOrder.length === 0}
                className={`flex flex-col items-center gap-0.5 py-2 px-2 transition-all relative
                  ${effectiveSource === "order"
                    ? "bg-[#FFD700]/15 text-[#FFD700]"
                    : "bg-black/40 text-white/60 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                  }`}>
                <div className="flex items-center gap-1.5">
                  <Icon name="Clock" size={11} className={effectiveSource === "order" ? "text-[#FFD700]" : ""} />
                  <span className="font-oswald font-bold text-[10px] uppercase tracking-wider">Под заказ · 1–2 ч</span>
                  {onOrder.some(p => p.is_latest_batch) && (
                    <span className="bg-[#FFD700] text-black font-oswald font-bold text-[8px] px-1 py-0 rounded-sm uppercase tracking-wider">NEW</span>
                  )}
                  <span className={`px-1 py-0 rounded-sm text-[9px] font-bold ${effectiveSource === "order" ? "bg-[#FFD700]/30 text-[#FFD700]" : "bg-white/5 text-white/40"}`}>
                    {onOrder.length}
                  </span>
                </div>
                {effectiveSource === "order" && (
                  <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-[#FFD700]" />
                )}
              </button>
            </div>

            {/* Чипы-фильтры по категории (если их ≥2) */}
            {categories.length >= 2 && (
              <div className="flex gap-1 overflow-x-auto px-2.5 py-1.5 border-b border-white/5 scrollbar-none">
                <button type="button"
                  onClick={() => setCategoryFilter("all")}
                  className={`shrink-0 px-2 py-0.5 rounded-full font-roboto text-[10px] uppercase tracking-wide transition-colors border
                    ${categoryFilter === "all"
                      ? "bg-[#FFD700]/15 text-[#FFD700] border-[#FFD700]/40"
                      : "text-white/40 hover:text-white border-white/10 hover:border-white/30"}`}>
                  Все · {sourceList.length}
                </button>
                {categories.map(([type, count]) => (
                  <button key={type} type="button"
                    onClick={() => setCategoryFilter(type)}
                    className={`shrink-0 px-2 py-0.5 rounded-full font-roboto text-[10px] uppercase tracking-wide transition-colors border
                      ${categoryFilter === type
                        ? "bg-[#FFD700]/15 text-[#FFD700] border-[#FFD700]/40"
                        : "text-white/40 hover:text-white border-white/10 hover:border-white/30"}`}>
                    {PART_TYPE_LABEL[type] || type} · {count}
                  </button>
                ))}
              </div>
            )}

            {/* Список вариантов — компактный, без скролла поверх других элементов */}
            <div className="max-h-72 overflow-y-auto scrollbar-premium">
              {filteredList.length === 0 ? (
                <div className="px-3 py-4 text-center font-roboto text-white/40 text-[11px]">
                  В этой категории пусто. Выберите другую.
                </div>
              ) : (
                filteredList.map(part => {
                  const isCheapest = cheapestIdByType[part.id] && (categories.length > 1 || filteredList.length > 1);
                  const isPremium = part.quality === "ORIG";
                  return (
                    <button key={part.id} type="button"
                      onClick={() => onSelectPart(part)}
                      className="w-full text-left px-3 py-2.5 block transition-colors border-b border-white/5 last:border-0 hover:bg-[#FFD700]/5 active:bg-[#FFD700]/15 group">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap mb-1">
                            <span className={`font-oswald font-bold text-[11px] ${QUALITY_COLOR[part.quality] || "text-white/50"}`}>
                              {part.quality}
                            </span>
                            <span className="font-roboto text-[9px] text-white/30 uppercase tracking-wide">
                              {PART_TYPE_LABEL[part.part_type] || part.part_type}
                            </span>
                            {/* Премиум-шильдики */}
                            {isPremium && (
                              <span className="inline-flex items-center gap-0.5 bg-gradient-to-r from-[#FFD700]/25 to-[#FFD700]/10 border border-[#FFD700]/50 text-[#FFD700] font-oswald font-bold text-[8px] px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                                <Icon name="Star" size={8} />
                                Премиум
                              </span>
                            )}
                            {isCheapest && !isPremium && (
                              <span className="inline-flex items-center gap-0.5 bg-gradient-to-r from-orange-500/25 to-orange-500/10 border border-orange-400/50 text-orange-300 font-oswald font-bold text-[8px] px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                                <Icon name="Flame" size={8} />
                                Выгодно
                              </span>
                            )}
                            {/* Гарантия по качеству — с тултипом */}
                            <WarrantyBadge quality={part.quality} />
                            {part.stock <= 3 && part.stock > 0 && (
                              <span className="text-orange-400 font-roboto text-[9px] uppercase">осталось {part.stock}</span>
                            )}
                            {part.is_latest_batch && !part.in_stock && (
                              <span className="bg-[#FFD700] text-black font-oswald font-bold text-[8px] px-1 py-0 rounded-sm uppercase tracking-wider">NEW</span>
                            )}
                          </div>
                          <div className="font-roboto text-[11px] text-white/85 leading-snug break-words">
                            {part.name}
                          </div>
                        </div>
                        <div className="shrink-0 text-right flex flex-col items-end justify-center">
                          <div className="font-oswald font-bold text-lg text-[#FFD700] whitespace-nowrap leading-none">
                            {part.total.toLocaleString("ru-RU")} ₽
                          </div>
                          <div className="font-roboto text-[9px] text-white/30 mt-1 uppercase tracking-wide">всё включено</div>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Подсказка снизу */}
            <div className="px-3 py-1.5 bg-black/40 border-t border-white/5 flex items-center justify-between gap-2">
              <span className="font-roboto text-[9px] text-white/30">
                Не нашли вашу модель?
              </span>
              <button type="button" onClick={() => setCollapsed(true)}
                className="font-roboto text-[9px] text-[#FFD700]/70 hover:text-[#FFD700] flex items-center gap-1 transition-colors">
                Описать вручную
                <Icon name="ChevronDown" size={10} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Список свёрнут — компактная плашка для возврата */}
      {!partsLoading && showPartsList && parts.length > 0 && !selectedPart && collapsed && (
        <button type="button" onClick={() => setCollapsed(false)}
          className="mt-2 w-full bg-[#FFD700]/10 hover:bg-[#FFD700]/15 border border-[#FFD700]/30 hover:border-[#FFD700]/60 rounded-md px-3 py-2 flex items-center justify-between transition-colors group">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-[#FFD700]/20 border border-[#FFD700]/40 flex items-center justify-center">
              <Icon name="Wrench" size={12} className="text-[#FFD700]" />
            </div>
            <div className="flex flex-col items-start leading-none">
              <span className="font-oswald font-bold text-[#FFD700] text-[11px] uppercase tracking-wide">Подобрано {parts.length} вариантов</span>
              <span className="font-roboto text-white/40 text-[9px] mt-0.5">от {Math.min(...parts.map(p => p.total)).toLocaleString("ru-RU")} ₽</span>
            </div>
          </div>
          <span className="font-roboto text-[10px] text-[#FFD700]/70 group-hover:text-[#FFD700] flex items-center gap-1">
            Развернуть
            <Icon name="ChevronDown" size={11} />
          </span>
        </button>
      )}

      {/* Запчасти не найдены — показываем статичные доп. услуги */}
      {!partsLoading && form.model.trim().length >= 3 && parts.length === 0 && !showPartsList && (
        <div>
          <div className="text-white/30 font-roboto text-[10px] mt-1 mb-2">
            Запчасти не найдены — опишите проблему ниже
          </div>
          <div className="border border-white/10 bg-[#0a0a0a] px-3 py-2.5">
            <div className="font-roboto text-[9px] text-white/30 uppercase tracking-wide mb-1.5">
              Добавить к ремонту:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {STATIC_EXTRAS.map(w => {
                const active = extraWorks.includes(w.id);
                return (
                  <button key={w.id} type="button" onClick={() => onToggleExtra(w.id)}
                    className={`flex items-center gap-1 px-2 py-1 border font-roboto text-[10px] transition-colors ${
                      active
                        ? "border-[#FFD700] bg-[#FFD700]/15 text-[#FFD700]"
                        : "border-white/15 text-white/40 hover:border-white/30 hover:text-white/70"
                    }`}>
                    {active && <Icon name="Check" size={9} />}
                    {w.label}
                    <span className={`ml-0.5 ${active ? "text-[#FFD700]/70" : "text-white/25"}`}>
                      +{w.price.toLocaleString("ru-RU")} ₽
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Выбранная запчасть — компактная карточка */}
      {selectedPart && (
        <div className="mt-2 border border-[#FFD700]/40 bg-[#FFD700]/5 rounded-md overflow-hidden">
          {/* Шапка выбранного */}
          <div className="px-3 py-2.5 flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                <Icon name="CheckCircle" size={11} className="text-[#FFD700] shrink-0" />
                <span className="font-roboto text-[10px] text-[#FFD700] font-medium">
                  {PART_TYPE_LABEL[selectedPart.part_type] || selectedPart.part_type}
                </span>
                <span className={`font-oswald font-bold text-[10px] ${QUALITY_COLOR[selectedPart.quality] || "text-white/50"}`}>
                  {selectedPart.quality}
                </span>
                {selectedPart.in_stock ? (
                  <span className="inline-flex items-center gap-0.5 bg-green-500/15 text-green-400 font-oswald font-bold text-[9px] px-1.5 py-0.5 uppercase tracking-wide rounded-sm">
                    <Icon name="Zap" size={8} /> В наличии · 20–60 мин
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-0.5 bg-[#FFD700]/15 text-[#FFD700] font-oswald font-bold text-[9px] px-1.5 py-0.5 uppercase tracking-wide rounded-sm">
                    <Icon name="Clock" size={8} /> Под заказ · 1–2 ч
                    {selectedPart.is_latest_batch && <span className="ml-1 bg-[#FFD700] text-black px-1 rounded-sm">NEW</span>}
                  </span>
                )}
                {/* Гарантия с тултипом */}
                <WarrantyBadge quality={selectedPart.quality} />
              </div>
              <div className="font-roboto text-[10px] text-white/60 leading-snug break-words">
                {selectedPart.name}
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div className="font-oswald font-bold text-base text-[#FFD700]">
                {selectedPart.total.toLocaleString("ru-RU")} ₽
              </div>
              <div className="font-roboto text-[8px] text-white/30 mt-0.5 uppercase tracking-wide">всё включено</div>
            </div>
          </div>

          {/* Доп. работы */}
          <div className="border-t border-[#FFD700]/10 px-3 py-2">
            <div className="font-roboto text-[9px] text-white/30 uppercase tracking-wide mb-1.5">
              Добавить к ремонту:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {extraWorksList.map(w => {
                const active = extraWorks.includes(String(w.id));
                return (
                  <button key={w.id} type="button" onClick={() => onToggleExtra(String(w.id))}
                    className={`flex items-center gap-1 px-2 py-1 border font-roboto text-[10px] transition-colors ${
                      active
                        ? "border-[#FFD700] bg-[#FFD700]/15 text-[#FFD700]"
                        : "border-white/15 text-white/40 hover:border-white/30 hover:text-white/70"
                    }`}>
                    {active && <Icon name="Check" size={9} />}
                    {w.label}
                    <span className={`ml-0.5 ${active ? "text-[#FFD700]/70" : "text-white/25"}`}>
                      +{w.price} ₽
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Скидка для постоянного клиента */}
          {clientInfo?.found && clientInfo.discount_pct > 0 && (
            <div className="border-t border-[#FFD700]/10 px-3 py-2 bg-green-500/5 flex items-center justify-between">
              <div>
                <div className="font-roboto text-[10px] text-green-400">Скидка для постоянного клиента</div>
                <div className="font-roboto text-[9px] text-white/40">{clientInfo.full_name}</div>
              </div>
              <div className="font-oswald font-bold text-sm text-green-400">-{clientInfo.discount_pct}%</div>
            </div>
          )}

          {/* Итог за ремонт — только финальная цифра */}
          <div className="border-t border-[#FFD700]/10 px-3 py-2.5 bg-gradient-to-r from-[#FFD700]/10 to-transparent flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-oswald font-bold text-[10px] text-[#FFD700]/70 uppercase tracking-[0.2em]">Итого за ремонт</span>
              <span className="font-roboto text-[9px] text-white/40 mt-0.5 flex items-center gap-1">
                <Icon name={getWarranty(selectedPart.quality).icon} size={9} className="text-[#FFD700]/60" />
                {clientInfo?.found && clientInfo.discount_pct > 0
                  ? `со скидкой −${clientInfo.discount_pct}% · ${getWarranty(selectedPart.quality).label}`
                  : `запчасть · работа · ${getWarranty(selectedPart.quality).label}`}
              </span>
            </div>
            <div className="font-oswald font-bold text-2xl text-[#FFD700]" style={{ textShadow: '0 0 14px rgba(255,215,0,0.25)' }}>
              {grandTotal.toLocaleString("ru-RU")} ₽
            </div>
          </div>

          {/* Кнопка изменить */}
          <div className="border-t border-white/5 px-3 py-1.5">
            <button type="button" onClick={() => { setCollapsed(false); onChangeSelection(); }}
              className="font-roboto text-[9px] text-white/30 hover:text-white/60 flex items-center gap-1 transition-colors">
              <Icon name="ChevronDown" size={10} /> Изменить выбор
            </button>
          </div>
        </div>
      )}
    </div>
  );
}