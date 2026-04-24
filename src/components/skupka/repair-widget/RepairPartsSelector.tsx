import Icon from "@/components/ui/icon";
import { Part, ExtraWork, ClientInfo, PART_TYPE_LABEL, QUALITY_COLOR, STATIC_EXTRAS } from "./types";

type Props = {
  form: { model: string };
  partsLoading: boolean;
  parts: Part[];
  showPartsList: boolean;
  groupedParts: Record<string, Part[]>;
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

export default function RepairPartsSelector({
  form, partsLoading, parts, showPartsList, groupedParts,
  selectedPart, extraWorks, extraWorksList, extraTotal, grandTotal,
  clientInfo, onSelectPart, onToggleExtra, onChangeSelection,
}: Props) {
  return (
    <div>
      {partsLoading && (
        <div className="text-white/30 font-roboto text-[10px] mt-1.5 flex items-center gap-1">
          <Icon name="Loader" size={10} className="animate-spin" /> Ищу запчасти...
        </div>
      )}

      {/* Выпадающий список — показываем только пока не выбрано */}
      {!partsLoading && showPartsList && parts.length > 0 && (
        <div className="mt-2 border border-white/10 bg-[#0a0a0a]">
          <div className="px-3 py-2 border-b border-white/5 font-roboto text-[9px] text-white/30 uppercase tracking-wide flex items-center gap-1">
            <Icon name="Wrench" size={9} /> Выберите тип ремонта
          </div>
          <div className="max-h-64 overflow-y-auto">
            {Object.entries(groupedParts).map(([ptype, items]) => (
              <div key={ptype} className="border-b border-white/5 last:border-0">
                <div className="px-3 py-1 font-roboto text-[9px] text-white/40 uppercase tracking-wide bg-white/5 sticky top-0">
                  {PART_TYPE_LABEL[ptype] || ptype}
                </div>
                {items.map(part => (
                  <button key={part.id} type="button"
                    onClick={() => onSelectPart(part)}
                    className="w-full text-left px-3 py-2.5 block transition-colors border-l-2 border-transparent hover:bg-white/5 active:bg-[#FFD700]/10 hover:border-white/20">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <span className={`font-oswald font-bold text-[11px] mr-1.5 ${QUALITY_COLOR[part.quality] || "text-white/50"}`}>
                          {part.quality}
                        </span>
                        <span className="font-roboto text-[11px] text-white/80 leading-snug break-words">
                          {part.name}
                        </span>
                        {part.stock <= 3 && part.stock > 0 && (
                          <span className="ml-1 text-orange-400 font-roboto text-[9px]">мало</span>
                        )}
                        {part.is_latest_batch && (
                          <span className="ml-1.5 inline-flex items-center gap-0.5 bg-[#FFD700] text-black font-oswald font-bold text-[9px] px-1.5 py-0.5 uppercase tracking-wide">
                            NEW · 1–2 ч
                          </span>
                        )}
                        {!part.is_latest_batch && part.id.startsWith('moba_') && (
                          <span className="ml-1.5 inline-flex items-center gap-0.5 bg-green-500/15 text-green-400 font-roboto text-[9px] px-1.5 py-0.5 rounded-sm">
                            <Icon name="Clock" size={8} /> 1–2 часа
                          </span>
                        )}
                      </div>
                      <div className="shrink-0 text-right ml-3">
                        <div className="font-oswald font-bold text-sm text-[#FFD700] whitespace-nowrap">
                          {part.total.toLocaleString("ru-RU")} ₽
                        </div>
                        <div className="font-roboto text-[9px] text-white/30 whitespace-nowrap">
                          зап. {part.price.toLocaleString("ru-RU")} + раб. {part.labor_cost.toLocaleString("ru-RU")}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
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
        <div className="mt-2 border border-[#FFD700]/40 bg-[#FFD700]/5">
          {/* Шапка выбранного */}
          <div className="px-3 py-2.5 flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Icon name="CheckCircle" size={11} className="text-[#FFD700] shrink-0" />
                <span className="font-roboto text-[10px] text-[#FFD700] font-medium">
                  {PART_TYPE_LABEL[selectedPart.part_type] || selectedPart.part_type}
                </span>
                <span className={`font-oswald font-bold text-[10px] ${QUALITY_COLOR[selectedPart.quality] || "text-white/50"}`}>
                  {selectedPart.quality}
                </span>
              </div>
              <div className="font-roboto text-[10px] text-white/60 leading-snug break-words">
                {selectedPart.name}
              </div>
              <div className="font-roboto text-[9px] text-white/30 mt-0.5 flex items-center gap-2 flex-wrap">
                <span>зап. {selectedPart.price.toLocaleString("ru-RU")} + раб. {selectedPart.labor_cost.toLocaleString("ru-RU")} ₽</span>
                {selectedPart.is_latest_batch && (
                  <span className="inline-flex items-center gap-0.5 bg-[#FFD700] text-black font-oswald font-bold text-[9px] px-1.5 py-0.5 uppercase tracking-wide">
                    NEW · 1–2 ч
                  </span>
                )}
                {!selectedPart.is_latest_batch && selectedPart.id.startsWith('moba_') && (
                  <span className="inline-flex items-center gap-0.5 bg-green-500/15 text-green-400 font-roboto text-[9px] px-1.5 py-0.5 rounded-sm">
                    <Icon name="Clock" size={8} /> 1–2 часа
                  </span>
                )}
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div className="font-oswald font-bold text-base text-[#FFD700]">
                {selectedPart.total.toLocaleString("ru-RU")} ₽
              </div>
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

          {/* Итог с допами */}
          <div className="border-t border-[#FFD700]/10 px-3 py-2 flex items-center justify-between">
            <div>
              <div className="font-roboto text-[10px] text-white/50">Итого за ремонт</div>
              {extraTotal > 0 && (
                <div className="font-roboto text-[9px] text-white/30">
                  {selectedPart.total.toLocaleString("ru-RU")} + {extraTotal.toLocaleString("ru-RU")} ₽ доп.
                </div>
              )}
            </div>
            <div className="font-oswald font-bold text-xl text-[#FFD700]">
              {grandTotal.toLocaleString("ru-RU")} ₽
            </div>
          </div>

          {/* Кнопка изменить */}
          <div className="border-t border-white/5 px-3 py-1.5">
            <button type="button" onClick={onChangeSelection}
              className="font-roboto text-[9px] text-white/30 hover:text-white/60 flex items-center gap-1 transition-colors">
              <Icon name="ChevronDown" size={10} /> Изменить выбор
            </button>
          </div>
        </div>
      )}
    </div>
  );
}