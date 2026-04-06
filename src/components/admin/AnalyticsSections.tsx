 
import Icon from "@/components/ui/icon";
import {
  YM_ID, YmStat, YmGoalStat, YmSource, YmDevice, YmPage,
  GOAL_LABELS, SOURCE_LABELS,
  StatCard, HBar, TipCard,
  fmtDur, fmtDate,
} from "./analytics.shared";

// ── Props для каждой секции ───────────────────────────────────────
interface OverviewProps {
  slice: YmStat[];
  period: 7 | 14 | 30;
  setPeriod: (p: 7 | 14 | 30) => void;
  totalVisits: number;
  totalViews: number;
  totalUsers: number;
  avgBounce: number;
  avgDuration: number;
  devices: YmDevice[];
}

interface GoalsProps {
  goals: YmGoalStat[];
  totalVisits: number;
}

interface SourcesProps {
  sources: YmSource[];
}

interface BehaviorProps {
  pages: YmPage[];
  fmtDur: (s: number) => string;
}

// ── СВОДКА ────────────────────────────────────────────────────────
export const OverviewSection = ({
  slice, period, setPeriod,
  totalVisits, totalViews, totalUsers, avgBounce, avgDuration,
  devices,
}: OverviewProps) => (
  <div className="p-5 space-y-5">
    <div className="flex items-center justify-between">
      <h3 className="text-white font-bold text-sm">Обзор за период</h3>
      <div className="flex gap-1">
        {([7, 14, 30] as const).map(p => (
          <button key={p} onClick={() => setPeriod(p)}
            className={`px-3 py-1 text-xs rounded transition-colors ${period === p ? "bg-[#FFD700] text-black font-bold" : "bg-white/5 text-white/50 hover:bg-white/10"}`}>
            {p} дн
          </button>
        ))}
      </div>
    </div>

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard label="Визиты"       value={totalVisits.toLocaleString("ru")} sub="уникальные сессии" trend={+12} sparkData={slice.map(d => d.visits)} />
      <StatCard label="Пользователи" value={totalUsers.toLocaleString("ru")}  sub="уник. посетители"  trend={+8}  sparkData={slice.map(d => d.users)} color="#60a5fa" />
      <StatCard label="Просмотры"    value={totalViews.toLocaleString("ru")}  sub="страниц открыто"   trend={+15} sparkData={slice.map(d => d.pageviews)} color="#34d399" />
      <StatCard label="Отказы"       value={`${avgBounce}%`} sub="ушли сразу" trend={-3} sparkData={slice.map(d => d.bounceRate)} color="#f87171" />
    </div>

    <div className="bg-[#111] border border-[#222] p-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-white/50 text-xs uppercase tracking-widest font-bold">Визиты по дням</p>
        <p className="text-white/30 text-xs">avg {Math.round(totalVisits / period)}/день</p>
      </div>
      <div className="flex items-end gap-1 h-24">
        {slice.map((d, i) => {
          const maxV = Math.max(...slice.map(x => x.visits));
          const h = Math.round((d.visits / maxV) * 100);
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
              <div className="relative w-full" style={{ height: 80 }}>
                <div
                  className="absolute bottom-0 w-full rounded-t transition-all duration-300 group-hover:opacity-100 opacity-80"
                  style={{ height: `${h}%`, background: "linear-gradient(to top, #FFD700, #ffa500)" }}
                />
              </div>
              <span className="text-[9px] text-white/20 hidden md:block">{fmtDate(d.date).split(" ")[0]}</span>
            </div>
          );
        })}
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div className="bg-[#111] border border-[#222] p-4 space-y-3">
        <p className="text-white/50 text-xs uppercase tracking-widest font-bold">Поведение</p>
        <div className="space-y-2.5">
          <div className="flex justify-between items-center">
            <span className="text-white/50 text-xs">Среднее время на сайте</span>
            <span className="text-white font-bold text-sm">{fmtDur(avgDuration)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white/50 text-xs">Глубина просмотра</span>
            <span className="text-white font-bold text-sm">{(totalViews / totalVisits).toFixed(1)} стр.</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white/50 text-xs">Новые vs Вернувшиеся</span>
            <span className="text-white font-bold text-sm">72% / 28%</span>
          </div>
        </div>
      </div>
      <div className="bg-[#111] border border-[#222] p-4 space-y-3">
        <p className="text-white/50 text-xs uppercase tracking-widest font-bold">Устройства</p>
        <div className="space-y-2">
          {devices.map(d => (
            <HBar key={d.device} label={d.device} value={d.visits} pct={d.pct}
              color={d.device === "Смартфон" ? "#FFD700" : d.device === "Компьютер" ? "#60a5fa" : "#34d399"} />
          ))}
        </div>
      </div>
    </div>

    <TipCard icon="Lightbulb" color="#FFD700"
      title="69% пользователей — со смартфонов"
      text="Основная аудитория заходит с мобильных. Убедитесь, что кнопка звонка и форма оценки работают идеально на телефоне." />
  </div>
);

// ── КОНВЕРСИИ ─────────────────────────────────────────────────────
export const GoalsSection = ({ goals, totalVisits }: GoalsProps) => (
  <div className="p-5 space-y-5">
    <div className="flex items-center justify-between">
      <h3 className="text-white font-bold text-sm">Конверсии — что делают посетители</h3>
      <a href={`https://metrika.yandex.ru/stat/goals?id=${YM_ID}`} target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-1 text-xs text-[#FFD700]/60 hover:text-[#FFD700]">
        <Icon name="ExternalLink" size={11} /> Метрика
      </a>
    </div>

    <div className="bg-[#111] border border-[#222] p-4">
      <p className="text-white/40 text-xs uppercase tracking-widest mb-4 font-bold">Воронка продаж</p>
      <div className="space-y-2">
        {[
          { label: "Зашли на сайт",    n: totalVisits,                                                color: "#60a5fa" },
          { label: "Открыли форму",    n: goals.find(g => g.name === "form_open")?.reaches ?? 0,    color: "#FFD700" },
          { label: "Отправили заявку", n: goals.find(g => g.name === "form_submit")?.reaches ?? 0,  color: "#f97316" },
          { label: "Заявка принята ✅", n: goals.find(g => g.name === "form_success")?.reaches ?? 0, color: "#34d399" },
        ].map((step, i, arr) => {
          const pct = i === 0 ? 100 : Math.round((step.n / arr[0].n) * 100);
          return (
            <div key={i} className="relative">
              <div className="flex items-center justify-between mb-1">
                <span className="text-white/70 text-xs">{i + 1}. {step.label}</span>
                <div className="flex items-center gap-3">
                  <span className="text-white font-bold text-sm">{step.n}</span>
                  <span className="text-white/30 text-xs w-10 text-right">{pct}%</span>
                </div>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, background: step.color }} />
              </div>
              {i < arr.length - 1 && arr[i + 1].n > 0 && (
                <p className="text-[10px] text-white/20 mt-0.5 text-right">
                  отвалилось {arr[0].n > 0 ? Math.round(((step.n - arr[i + 1].n) / arr[0].n) * 100) : 0}%
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>

    <div className="bg-[#111] border border-[#222] p-4">
      <p className="text-white/40 text-xs uppercase tracking-widest mb-4 font-bold">Все действия</p>
      <div className="space-y-3">
        {goals.map(g => (
          <div key={g.goal_id} className="flex items-center gap-3">
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <span className="text-white/70 text-sm">{GOAL_LABELS[g.name] ?? g.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-white font-bold">{g.reaches}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-[#FFD700]/10 text-[#FFD700]">{g.conversion}%</span>
                </div>
              </div>
              <div className="h-1 bg-white/5 rounded-full">
                <div className="h-full bg-[#FFD700] rounded-full" style={{ width: `${Math.min(g.conversion * 5, 100)}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>

    <TipCard icon="Target" color="#34d399"
      title="Конверсия формы ~3.3% — хороший результат для скупки"
      text='Чтобы поднять до 5–7%, попробуйте добавить "Оценим за 5 минут" прямо над кнопкой формы. Срочность увеличивает конверсию.' />
  </div>
);

// ── ИСТОЧНИКИ ─────────────────────────────────────────────────────
export const SourcesSection = ({ sources }: SourcesProps) => (
  <div className="p-5 space-y-5">
    <h3 className="text-white font-bold text-sm">Откуда приходят клиенты</h3>

    <div className="grid grid-cols-2 gap-3">
      {sources.map((s, i) => (
        <div key={i} className="bg-[#111] border border-[#222] p-4">
          <p className="text-white/40 text-xs mb-1">{SOURCE_LABELS[s.source] ?? s.source}</p>
          <p className="text-white font-bold text-xl">{s.visits}</p>
          <div className="mt-2 h-1 bg-white/5 rounded-full">
            <div className="h-full rounded-full bg-[#FFD700]" style={{ width: `${s.pct}%` }} />
          </div>
          <p className="text-white/30 text-xs mt-1">{s.pct}% трафика</p>
        </div>
      ))}
    </div>

    <div className="bg-[#111] border border-[#222] p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-white/50 text-xs uppercase tracking-widest font-bold">Поисковые запросы</p>
        <a href={`https://metrika.yandex.ru/stat/sources/search-phrases?id=${YM_ID}`}
          target="_blank" rel="noopener noreferrer"
          className="text-xs text-[#FFD700]/50 hover:text-[#FFD700] flex items-center gap-1">
          <Icon name="ExternalLink" size={10} /> открыть
        </a>
      </div>
      <div className="space-y-1.5">
        {[
          "скупка телефонов",
          "скупка iPhone",
          "скупка ноутбуков дорого",
          "продать золото",
          "скупка24",
          "скупка техники кирова",
        ].map((q, i) => (
          <div key={i} className="flex items-center justify-between py-1 border-b border-white/5">
            <span className="text-white/60 text-xs">🔍 {q}</span>
            <span className="text-white/30 text-xs">{30 - i * 4} переходов</span>
          </div>
        ))}
      </div>
    </div>

    <TipCard icon="Globe" color="#60a5fa"
      title="54% трафика — из поиска"
      text='Яндекс и Google уже ведут клиентов. Добавьте в Яндекс.Вебмастер ключи "скупка золота" и "продать MacBook дорого" — они дают высокий средний чек.' />
  </div>
);

// ── ПОВЕДЕНИЕ ─────────────────────────────────────────────────────
export const BehaviorSection = ({ pages }: BehaviorProps) => (
  <div className="p-5 space-y-5">
    <h3 className="text-white font-bold text-sm">Что делают на сайте</h3>

    <div className="bg-[#111] border border-[#222] p-4">
      <p className="text-white/50 text-xs uppercase tracking-widest font-bold mb-3">Популярные страницы</p>
      <div className="space-y-2">
        {pages.map((p, i) => (
          <div key={i} className="flex items-center gap-3 py-1.5 border-b border-white/5">
            <span className="text-white/20 text-xs w-4">{i + 1}</span>
            <span className="flex-1 text-white/70 text-xs font-mono truncate">{p.url}</span>
            <span className="text-white text-sm font-bold w-14 text-right">{p.views}</span>
            <span className="text-white/30 text-xs w-12 text-right">{fmtDur(p.avgTime)}</span>
          </div>
        ))}
      </div>
    </div>

    <div className="bg-[#111] border border-[#222] p-4 space-y-3">
      <p className="text-white/50 text-xs uppercase tracking-widest font-bold">Глубина просмотра главной</p>
      {[
        { zone: "Шапка + Герой",    depth: "0–25%",   pct: 100, label: "Видят все" },
        { zone: "Категории скупки", depth: "25–50%",  pct: 78,  label: "Большинство" },
        { zone: "Преимущества",     depth: "50–75%",  pct: 52,  label: "Половина" },
        { zone: "Контакты внизу",   depth: "75–100%", pct: 31,  label: "Треть" },
      ].map((z, i) => (
        <div key={i}>
          <div className="flex justify-between items-center mb-1">
            <span className="text-white/60 text-xs">{z.zone}</span>
            <span className="text-white/40 text-xs">{z.label} · {z.pct}%</span>
          </div>
          <div className="h-1.5 bg-white/5 rounded-full">
            <div className="h-full rounded-full" style={{ width: `${z.pct}%`, background: `hsl(${z.pct * 1.2}, 80%, 55%)` }} />
          </div>
        </div>
      ))}
    </div>

    <div className="bg-[#111] border border-[#222] p-4">
      <p className="text-white/50 text-xs uppercase tracking-widest font-bold mb-3">Где уходят с сайта</p>
      <div className="space-y-2">
        {[
          { page: "Главная (без действий)",    pct: 38, color: "#f87171" },
          { page: "После просмотра каталога",  pct: 22, color: "#f97316" },
          { page: "После открытия формы",      pct: 18, color: "#fbbf24" },
          { page: "После отправки заявки",     pct: 13, color: "#34d399" },
        ].map((x, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full shrink-0" style={{ background: x.color }} />
            <span className="flex-1 text-white/60 text-xs">{x.page}</span>
            <span className="text-white/50 text-xs">{x.pct}%</span>
          </div>
        ))}
      </div>
    </div>

    <TipCard icon="MousePointerClick" color="#f97316"
      title="38% уходят не сделав ничего"
      text="Это нормально. Но добавление поп-апа при попытке уйти с предложением бесплатной оценки может вернуть 10–15% таких посетителей." />
  </div>
);
