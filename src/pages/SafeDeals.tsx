/**
 * Публичная страница «Безопасная сделка» (/safe-deals).
 * Виды: лендинг → форма подачи → личный кабинет продавца (после отправки или по сохранённому токену).
 */
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Icon from "@/components/ui/icon";
import SellerForm from "./safeDeals/SellerForm";
import SellerCabinet from "./safeDeals/SellerCabinet";
import {
  COMMISSION_PCT, OFFICE_ADDRESS, REALIZATION_DAYS,
  loadSellerTokens,
  type CreateResponse,
} from "./safeDeals/api";

type View = "landing" | "form" | "cabinet";

export default function SafeDeals() {
  const [params, setParams] = useSearchParams();
  const [view, setView] = useState<View>("landing");
  const [token, setToken] = useState<string | null>(null);
  const myDeals = useMemo(() => loadSellerTokens(), [view]);

  // SEO
  useEffect(() => {
    const prev = document.title;
    document.title = "Безопасная сделка с гарантом — Скупка24 Калуга";
    const desc = "Продайте телефон, ноутбук или технику безопасно через офис Скупка24 (ул. Кирова, 11). Мы выступаем гарантом — проверяем товар, организуем встречу, фиксируем сделку по QR. Комиссия 10%.";
    const setMeta = (name: string, content: string, prop = false) => {
      const sel = prop ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let el = document.head.querySelector<HTMLMetaElement>(sel);
      if (!el) {
        el = document.createElement("meta");
        if (prop) el.setAttribute("property", name); else el.setAttribute("name", name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
      return el;
    };
    const created: HTMLElement[] = [];
    created.push(setMeta("description", desc));
    created.push(setMeta("keywords", "безопасная сделка калуга, продать телефон через гаранта, комиссионка калуга, скупка с проверкой, продать ноутбук калуга, гарант сделки"));
    created.push(setMeta("og:title", "Безопасная сделка — Скупка24", true));
    created.push(setMeta("og:description", desc, true));
    created.push(setMeta("og:url", "https://skupka24.com/safe-deals", true));
    return () => {
      document.title = prev;
      created.forEach(el => el.remove());
    };
  }, []);

  // Если в URL есть ?token — открываем кабинет
  useEffect(() => {
    const t = params.get("token");
    if (t) {
      setToken(t);
      setView("cabinet");
    }
  }, [params]);

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-[#F0F0F0]" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" }}>
      <TopBar />

      {view === "landing" && (
        <Landing
          myDeals={myDeals}
          onStart={() => setView("form")}
          onOpenDeal={(t) => { setToken(t); setView("cabinet"); setParams({ token: t }); }}
        />
      )}

      {view === "form" && (
        <SellerForm
          onSubmitted={(t: string, _r: CreateResponse) => {
            setToken(t);
            setView("cabinet");
            setParams({ token: t });
          }}
        />
      )}

      {view === "cabinet" && token && (
        <SellerCabinet token={token} onBack={() => {
          setView("landing");
          setParams({});
        }} />
      )}
    </div>
  );
}

function TopBar() {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-[#2A2A2A] bg-[#141414]">
      <a href="/" className="flex items-center gap-2.5 no-underline">
        <div className="w-8 h-8 rounded-lg bg-[#FFD700] flex items-center justify-center text-black font-extrabold text-base">С</div>
        <span className="text-[#FFD700] font-bold text-base">Скупка24</span>
      </a>
      <span className="text-sm text-[#777]">Безопасная сделка</span>
    </div>
  );
}

function Landing({ myDeals, onStart, onOpenDeal }: {
  myDeals: { token: string; dealNumber: string; title: string; createdAt: string }[];
  onStart: () => void;
  onOpenDeal: (token: string) => void;
}) {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-5 py-8 sm:py-12">
      {/* Hero */}
      <div className="text-center mb-10 relative">
        <div aria-hidden className="absolute -inset-10 blur-3xl opacity-50 pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(255,215,0,0.25), transparent 65%)" }} />
        <div className="relative inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FFD700]/[0.1] border border-[#FFD700]/30 text-[11px] font-bold tracking-wider uppercase text-[#FFD700] mb-4">
          <Icon name="Shield" size={12} /> Скупка24 — Гарант сделки
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight">
          Продайте безопасно<br />
          <span className="bg-gradient-to-r from-[#FFD700] via-[#fff3a0] to-[#FFD700] bg-clip-text text-transparent">через офис гаранта</span>
        </h1>
        <p className="text-sm sm:text-base text-[#999] mt-4 max-w-xl mx-auto leading-relaxed">
          Без обмана, без рисков, без потери времени. Привозите товар к нам — мы проверяем, находим покупателя, проводим сделку и передаём вам деньги. Комиссия {COMMISSION_PCT}%, срок {REALIZATION_DAYS} дней.
        </p>
        <button onClick={onStart}
          className="mt-7 inline-flex items-center gap-2 px-7 py-4 rounded-2xl bg-gradient-to-br from-[#FFD700] via-[#FFE033] to-[#FFD700] text-black font-bold text-base shadow-[0_15px_40px_-10px_rgba(255,215,0,0.5)] hover:shadow-[0_20px_50px_-10px_rgba(255,215,0,0.7)] transition active:scale-[0.97]">
          <Icon name="Shield" size={18} /> Подать заявку
        </button>
        <div className="mt-3 text-xs text-[#666]">Бесплатно · без регистрации · 2 минуты</div>
      </div>

      {/* Мои сделки */}
      {myDeals.length > 0 && (
        <section className="mb-10 bg-gradient-to-br from-[#FFD700]/[0.06] to-transparent border border-[#FFD700]/20 rounded-2xl p-4 sm:p-5">
          <h2 className="text-sm font-bold text-[#FFD700] uppercase tracking-wider mb-3 flex items-center gap-2">
            <Icon name="History" size={13} /> Мои заявки
          </h2>
          <div className="space-y-2">
            {myDeals.slice(0, 5).map(d => (
              <button key={d.token} onClick={() => onOpenDeal(d.token)}
                className="w-full text-left bg-[#141414] hover:bg-[#1A1A1A] border border-[#2A2A2A] hover:border-[#FFD700]/40 rounded-xl px-3 py-2.5 transition flex items-center gap-3">
                <Icon name="Package" size={16} className="text-[#FFD700] shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold truncate">{d.title}</div>
                  <div className="text-[10px] text-[#777] mt-0.5">{d.dealNumber} · {new Date(d.createdAt).toLocaleDateString("ru-RU")}</div>
                </div>
                <Icon name="ChevronRight" size={14} className="text-[#FFD700] shrink-0" />
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Этапы */}
      <section className="mb-10">
        <h2 className="text-xl font-extrabold text-center mb-2">Как это работает</h2>
        <p className="text-sm text-[#777] text-center mb-6">5 простых шагов — от заявки до денег в руках</p>
        <div className="grid sm:grid-cols-2 gap-3">
          {STEPS.map((s, i) => (
            <div key={i} className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-4 hover:border-[#FFD700]/40 transition">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#FFD700]/15 text-[#FFD700] flex items-center justify-center shrink-0 font-extrabold">
                  {i + 1}
                </div>
                <div>
                  <div className="text-sm font-bold mb-1">{s.title}</div>
                  <div className="text-xs text-[#999] leading-relaxed">{s.desc}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Гарантии */}
      <section className="mb-10 grid grid-cols-2 sm:grid-cols-4 gap-2">
        {GUARANTEES.map((g, i) => (
          <div key={i} className="bg-[#FFD700]/[0.04] border border-[#FFD700]/15 rounded-xl px-3 py-3 text-center">
            <Icon name={g.icon} size={20} className="text-[#FFD700] mx-auto mb-1.5" />
            <div className="text-[11px] font-bold leading-tight">{g.title}</div>
            <div className="text-[10px] text-[#777] mt-0.5 leading-tight">{g.desc}</div>
          </div>
        ))}
      </section>

      {/* Адрес */}
      <section className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-5 mb-10">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#FFD700]/15 text-[#FFD700] flex items-center justify-center shrink-0">
            <Icon name="MapPin" size={20} />
          </div>
          <div>
            <div className="text-sm text-[#FFD700] uppercase tracking-wider font-bold mb-1">Адрес офиса</div>
            <div className="text-lg font-extrabold">{OFFICE_ADDRESS}</div>
            <div className="text-xs text-[#999] mt-1">Ежедневно с 10:00 до 20:00. Все сделки проходят здесь.</div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <div className="text-center">
        <button onClick={onStart}
          className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-[#FFD700] text-black font-bold text-sm hover:shadow-[0_15px_40px_-10px_rgba(255,215,0,0.5)] transition">
          <Icon name="ArrowRight" size={16} /> Подать заявку сейчас
        </button>
      </div>
    </div>
  );
}

const STEPS = [
  { title: "Подайте заявку", desc: "Заполните форму: что продаёте, цена, ваши контакты. Добавьте фото товара." },
  { title: "Привезите в офис", desc: "Принесите товар на ул. Кирова, 11. Мы проверим состояние и зафиксируем характеристики." },
  { title: "Мы ищем покупателя", desc: "Размещаем товар на витрине с пометкой «Проверено Скупка24». Сообщаем при появлении интереса." },
  { title: "Сделка в офисе", desc: "Покупатель приходит, осматривает товар, сканирует QR-код сделки на месте." },
  { title: "Получаете деньги", desc: "Наличными в офисе или переводом на карту — за вычетом комиссии 10%. Готово!" },
];

const GUARANTEES = [
  { icon: "Eye",      title: "Проверяем сами",     desc: "Каждый товар осматриваем перед продажей" },
  { icon: "Shield",   title: "QR-сделка",          desc: "Подтверждение на месте, без обмана" },
  { icon: "MapPin",   title: "Только в офисе",     desc: "Никаких встреч на улицах" },
  { icon: "Wallet",   title: "Деньги сразу",       desc: "Наличными или на карту в день сделки" },
];
