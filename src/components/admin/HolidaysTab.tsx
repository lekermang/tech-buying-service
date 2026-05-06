import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import {
  HOLIDAYS,
  loadHolidaysSettings,
  saveHolidaysSettings,
  getActiveHoliday,
  getHolidayCountdownText,
  type HolidaysSettings,
} from "@/components/holidays/holidays";
import HolidayBanner from "@/components/holidays/HolidayBanner";

/** Вкладка «Праздники» в админке — управление праздничным оформлением сайта. */
export default function HolidaysTab() {
  const [settings, setSettings] = useState<HolidaysSettings>(() => loadHolidaysSettings());
  const [active, setActive] = useState(() => getActiveHoliday());
  const [savedAt, setSavedAt] = useState<number | null>(null);

  // Применить и сохранить
  const apply = (next: HolidaysSettings) => {
    setSettings(next);
    saveHolidaysSettings(next);
    setActive(getActiveHoliday());
    setSavedAt(Date.now());
  };

  useEffect(() => {
    if (!savedAt) return;
    const t = setTimeout(() => setSavedAt(null), 2000);
    return () => clearTimeout(t);
  }, [savedAt]);

  const toggleAll = () => apply({ ...settings, enabled: !settings.enabled });
  const toggleHoliday = (id: string) => {
    const isOn = !settings.disabled.includes(id);
    apply({
      ...settings,
      disabled: isOn ? [...settings.disabled, id] : settings.disabled.filter(x => x !== id),
    });
  };
  const setForced = (id: string | null) => apply({ ...settings, forced: id });
  const resetDismissed = () => {
    localStorage.removeItem("holiday_dismissed_id");
    setSavedAt(Date.now());
    window.dispatchEvent(new CustomEvent("holidays-settings-changed"));
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-5">
      {/* Заголовок */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-oswald font-bold text-2xl text-white uppercase tracking-wide flex items-center gap-2">
            <span>🎉</span> Праздники
          </h1>
          <p className="text-sm text-white/55 mt-0.5">
            Автоматическое праздничное оформление главной страницы. За 3 дня до и 3 после.
          </p>
        </div>
        {savedAt && (
          <span className="text-emerald-300 text-xs inline-flex items-center gap-1 animate-pulse">
            <Icon name="Check" size={14} /> Сохранено
          </span>
        )}
      </div>

      {/* Превью текущего активного баннера */}
      <div className="rounded-xl overflow-hidden border border-white/10 bg-[#0F0F0F]">
        <div className="px-4 py-2.5 flex items-center justify-between border-b border-white/10">
          <span className="font-oswald uppercase text-xs tracking-wider text-white/60">Превью на сайте</span>
          {active ? (
            <span className="text-[10px] text-emerald-300 inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Активно: {active.holiday.name} · {getHolidayCountdownText(active.daysToHoliday)}
            </span>
          ) : (
            <span className="text-[10px] text-white/40">Сейчас праздничного оформления нет</span>
          )}
        </div>
        <div className="bg-black">
          {active ? <HolidayBanner dismissible={false} /> : (
            <div className="p-6 text-center text-white/30 text-sm">Включи любой праздник через «Принудительно показать», чтобы увидеть превью</div>
          )}
        </div>
      </div>

      {/* Главный выключатель */}
      <div className="rounded-xl border border-white/10 bg-[#141414] p-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="font-oswald uppercase text-sm text-white">Праздничное оформление сайта</div>
          <div className="text-xs text-white/50 mt-0.5">
            Главный выключатель. Выключи — баннер не будет появляться ни на один праздник.
          </div>
        </div>
        <button
          onClick={toggleAll}
          className={`relative shrink-0 w-14 h-8 rounded-full transition-colors ${settings.enabled ? "bg-emerald-500" : "bg-white/15"}`}
          aria-label={settings.enabled ? "Выключить" : "Включить"}
        >
          <span className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white shadow-md transition-transform ${settings.enabled ? "translate-x-6" : "translate-x-0"}`} />
        </button>
      </div>

      {/* Список праздников */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-oswald uppercase text-sm tracking-wider text-white/70">Праздники в году</h2>
          <span className="text-[10px] text-white/35">Включенных: {HOLIDAYS.length - settings.disabled.length} из {HOLIDAYS.length}</span>
        </div>
        <div className="grid sm:grid-cols-2 gap-2">
          {HOLIDAYS.map(h => {
            const isOn = !settings.disabled.includes(h.id);
            const isForced = settings.forced === h.id;
            const before = h.daysBefore ?? 3;
            const after = h.daysAfter ?? 3;
            return (
              <div
                key={h.id}
                className={`relative rounded-lg border p-3 transition-all ${
                  isForced
                    ? "border-amber-400/60 bg-amber-500/5 shadow-[0_0_14px_rgba(251,191,36,0.2)]"
                    : isOn
                      ? "border-white/10 bg-[#141414] hover:border-white/20"
                      : "border-white/5 bg-[#0E0E0E] opacity-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl shrink-0" style={{ filter: isOn ? "none" : "grayscale(1)" }}>{h.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-oswald font-bold text-sm text-white uppercase tracking-tight">
                        {h.name}
                      </span>
                      <span className="text-[10px] tabular-nums text-white/40">
                        {String(h.day).padStart(2, "0")}.{String(h.month).padStart(2, "0")}
                      </span>
                      {isForced && (
                        <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/30 text-amber-200 border border-amber-400/50 font-oswald font-bold">
                          Тест
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-white/50 mt-0.5 truncate">
                      «{h.greeting}»
                    </div>
                    <div className="text-[10px] text-white/35 mt-1">
                      Активен: −{before} → +{after} дней
                    </div>
                  </div>
                  <button
                    onClick={() => toggleHoliday(h.id)}
                    className={`relative shrink-0 w-10 h-6 rounded-full transition-colors ${isOn ? "bg-emerald-500" : "bg-white/15"}`}
                    aria-label={isOn ? "Выключить" : "Включить"}
                    title={isOn ? "Выключить этот праздник" : "Включить этот праздник"}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${isOn ? "translate-x-4" : "translate-x-0"}`} />
                  </button>
                </div>
                {/* Цвета + тест */}
                <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                  <span
                    className="w-4 h-4 rounded-full border border-white/15"
                    style={{ background: h.primaryColor }}
                    title={h.primaryColor}
                  />
                  <span
                    className="w-4 h-4 rounded-full border border-white/15"
                    style={{ background: h.secondaryColor }}
                    title={h.secondaryColor}
                  />
                  <span className="text-[10px] text-white/40 ml-1">узор: {h.pattern}</span>
                  <button
                    onClick={() => setForced(isForced ? null : h.id)}
                    className={`ml-auto text-[10px] uppercase tracking-wider px-2 py-1 rounded font-oswald font-bold transition-colors inline-flex items-center gap-1 ${
                      isForced
                        ? "bg-amber-500/25 text-amber-200 border border-amber-400/50 hover:bg-amber-500/35"
                        : "bg-white/5 text-white/50 border border-white/10 hover:bg-white/10 hover:text-white/80"
                    }`}
                    title={isForced ? "Выключить тестовый показ" : "Принудительно показать на сайте сейчас"}
                  >
                    <Icon name={isForced ? "EyeOff" : "Eye"} size={10} />
                    {isForced ? "Не показывать" : "Показать сейчас"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Дополнительные действия */}
      <div className="rounded-xl border border-white/10 bg-[#141414] p-4 space-y-3">
        <div className="font-oswald uppercase text-sm text-white/70">Дополнительно</div>
        <div className="flex items-start justify-between gap-3">
          <div className="text-xs text-white/55 flex-1">
            Если посетитель закрыл баннер крестиком — он больше не увидит его до следующего праздника.
            Этой кнопкой можно сбросить «скрытие» — баннер снова появится у всех.
          </div>
          <button
            onClick={resetDismissed}
            className="shrink-0 text-xs uppercase tracking-wider px-3 py-2 rounded font-oswald font-bold bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 hover:text-white inline-flex items-center gap-1.5"
          >
            <Icon name="RotateCcw" size={12} />
            Показать снова
          </button>
        </div>
        {settings.forced && (
          <div className="flex items-start justify-between gap-3 pt-3 border-t border-white/10">
            <div className="text-xs text-amber-200 flex-1">
              <Icon name="AlertCircle" size={12} className="inline mr-1" />
              Сейчас принудительно показывается «{HOLIDAYS.find(h => h.id === settings.forced)?.name}». Не забудь выключить тест после проверки!
            </div>
            <button
              onClick={() => setForced(null)}
              className="shrink-0 text-xs uppercase tracking-wider px-3 py-2 rounded font-oswald font-bold bg-amber-500/15 text-amber-200 border border-amber-400/40 hover:bg-amber-500/25 inline-flex items-center gap-1.5"
            >
              <Icon name="X" size={12} />
              Выключить тест
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
