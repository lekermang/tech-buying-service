import { useState, useEffect, useRef } from "react";
import RepairWidgetHeader from "./repair-widget/RepairWidgetHeader";
import RepairWidgetBody from "./repair-widget/RepairWidgetBody";
import { useRepairParts } from "./repair-widget/useRepairParts";
import { useRepairStatus } from "./repair-widget/useRepairStatus";
import { useRepairSubmit } from "./repair-widget/useRepairSubmit";
import { isPhoneValid } from "@/lib/phoneFormat";

export default function RepairWidget() {
  const [tab, setTab] = useState<"form" | "status">("form");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Открыть виджет ремонта извне (по событию или хэшу #repair) и проскроллить к нему
  useEffect(() => {
    const openAndScroll = () => {
      setOpen(true);
      setTimeout(() => {
        rootRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 50);
    };
    const onCustom = () => openAndScroll();
    const onHash = () => {
      if (window.location.hash === "#repair") openAndScroll();
    };
    window.addEventListener("open-repair", onCustom);
    window.addEventListener("hashchange", onHash);
    if (window.location.hash === "#repair") openAndScroll();
    return () => {
      window.removeEventListener("open-repair", onCustom);
      window.removeEventListener("hashchange", onHash);
    };
  }, []);

  const [form, setForm] = useState({ name: "", phone: "", model: "", fault: "" });
  const [agreed, setAgreed] = useState(true);
  const [contactChannels, setContactChannels] = useState<string[]>([]);
  const [contactTime, setContactTime] = useState("");

  const parts = useRepairParts({ model: form.model, phone: form.phone });
  const status = useRepairStatus();
  const order = useRepairSubmit();

  const canSubmit = !!(form.name && isPhoneValid(form.phone) && form.model && form.fault && agreed);

  const handleSubmit = () => order.submit({
    form,
    selectedPart: parts.selectedPart,
    extraWorks: parts.extraWorks,
    extraWorksList: parts.extraWorksList,
    grandTotal: parts.grandTotal,
    contactChannels,
    contactTime,
  });

  const reset = () => {
    setForm({ name: "", phone: "", model: "", fault: "" });
    setAgreed(false);
    setContactChannels([]);
    setContactTime("");
    order.resetOrder();
    parts.resetPartsState();
  };

  const orderId = order.orderId;

  /* ── Экран успеха после отправки ─────────────────────────────────────── */
  if (orderId) {
    return (
      <div ref={rootRef} id="repair"
        className="relative w-full rounded-xl overflow-hidden"
        style={{
          background: "linear-gradient(135deg,rgba(10,9,4,0.98) 0%,rgba(6,6,10,0.99) 100%)",
          border: "2px solid rgba(255,215,0,0.5)",
          boxShadow: "0 0 0 1px rgba(255,215,0,0.1),0 0 60px rgba(255,215,0,0.12),0 20px 40px rgba(0,0,0,0.6)",
        }}>
        {/* Верхняя неоновая полоска */}
        <span aria-hidden className="absolute top-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg,transparent,rgba(255,215,0,1),transparent)" }} />
        {/* Угловые скобки */}
        <span aria-hidden className="absolute top-1.5 left-1.5 w-3 h-3 border-l-2 border-t-2 border-[#FFD700]" />
        <span aria-hidden className="absolute top-1.5 right-1.5 w-3 h-3 border-r-2 border-t-2 border-[#FFD700]" />
        <span aria-hidden className="absolute bottom-1.5 left-1.5 w-3 h-3 border-l-2 border-b-2 border-[#FFD700]" />
        <span aria-hidden className="absolute bottom-1.5 right-1.5 w-3 h-3 border-r-2 border-b-2 border-[#FFD700]" />

        {/* Фоновое свечение */}
        <div aria-hidden className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 70% 50% at 50% 0%,rgba(255,215,0,0.07) 0%,transparent 70%)" }} />

        <div className="relative p-5 sm:p-6">
          {/* Иконка галочки */}
          <div className="flex justify-center mb-4">
            <div className="relative w-16 h-16 rounded-full flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg,#1a1400,#0a0a0a)",
                border: "2px solid rgba(255,215,0,0.6)",
                boxShadow: "0 0 30px rgba(255,215,0,0.3),0 0 60px rgba(255,215,0,0.1)",
              }}>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="14" stroke="rgba(255,215,0,0.3)" strokeWidth="1.5" />
                <path d="M9 16.5L13.5 21L23 11" stroke="#FFD700"
                  strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  style={{ filter: "drop-shadow(0 0 6px rgba(255,215,0,0.8))" }} />
              </svg>
            </div>
          </div>

          {/* Заголовок */}
          <div className="text-center mb-1">
            <div className="font-roboto text-[11px] uppercase tracking-[0.2em] mb-2"
              style={{ color: "rgba(255,215,0,0.5)" }}>
              Заявка #{orderId} принята
            </div>
            <h3 className="font-oswald font-black text-2xl sm:text-3xl uppercase text-white mb-1"
              style={{ textShadow: "0 0 20px rgba(255,255,255,0.1)" }}>
              Спасибо за обращение!
            </h3>
            <p className="font-roboto text-white/50 text-sm leading-relaxed max-w-sm mx-auto">
              Мы получили вашу заявку. Мастер перезвонит в течение{" "}
              <span className="text-white/80 font-medium">15 минут</span> и согласует детали.
            </p>
          </div>

          {/* Разделитель */}
          <div className="my-4 h-px" style={{ background: "linear-gradient(90deg,transparent,rgba(255,215,0,0.2),transparent)" }} />

          {/* Инфо: модель + номер заявки */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="rounded-xl p-3 text-center"
              style={{ background: "rgba(255,215,0,0.06)", border: "1px solid rgba(255,215,0,0.15)" }}>
              <div className="font-roboto text-[10px] uppercase tracking-widest text-white/35 mb-1">Устройство</div>
              <div className="font-oswald font-bold text-sm text-white truncate">{form.model || "—"}</div>
            </div>
            <div className="rounded-xl p-3 text-center"
              style={{ background: "rgba(255,215,0,0.06)", border: "1px solid rgba(255,215,0,0.15)" }}>
              <div className="font-roboto text-[10px] uppercase tracking-widest text-white/35 mb-1">Номер заявки</div>
              <div className="font-oswald font-bold text-sm" style={{ color: "#FFD700" }}>#{orderId}</div>
            </div>
          </div>

          {/* Telegram CTA */}
          <a href={`https://t.me/Skypkaklgbot?start=${orderId}`}
            target="_blank" rel="noopener noreferrer"
            className="group flex items-center justify-center gap-2.5 w-full py-3 rounded-xl font-oswald font-bold text-sm uppercase tracking-wide transition-all mb-3"
            style={{
              background: "linear-gradient(135deg,rgba(34,158,217,0.15),rgba(34,158,217,0.08))",
              border: "1px solid rgba(34,158,217,0.4)",
              color: "#7dd3fc",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(34,158,217,0.7)"; (e.currentTarget as HTMLElement).style.background = "rgba(34,158,217,0.18)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(34,158,217,0.4)"; (e.currentTarget as HTMLElement).style.background = "linear-gradient(135deg,rgba(34,158,217,0.15),rgba(34,158,217,0.08))"; }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z"/>
            </svg>
            Получать статус в Telegram · #{orderId}
          </a>

          {/* Предоплата (если есть сумма) */}
          {parts.grandTotal > 0 && (
            <div className="rounded-xl p-4 mb-4"
              style={{ background: "rgba(255,215,0,0.04)", border: "1px solid rgba(255,215,0,0.15)" }}>
              <div className="font-roboto text-[10px] uppercase tracking-widest text-white/35 mb-2 flex items-center gap-2">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="#FFD700"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                Подтвердить приоритет
              </div>
              <p className="font-roboto text-white/45 text-xs mb-3 leading-relaxed">
                Внесите предоплату 30% — мы зарезервируем запчасть и вынесем ваш ремонт вперёд очереди.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => { order.resetOrder(); reset(); }}
                  className="flex-1 py-2.5 rounded-lg font-roboto text-xs text-white/40 hover:text-white/70 transition-colors"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  Оплачу при получении
                </button>
                <div className="flex-1">
                  {/* PayButton встроен через импорт в RepairForm, здесь показываем сумму */}
                  <button className="w-full py-2.5 rounded-lg font-oswald font-bold text-sm uppercase transition-all"
                    style={{
                      background: "linear-gradient(180deg,#fff3a0 0%,#ffd700 45%,#d4a017 100%)",
                      color: "#000",
                      boxShadow: "0 0 0 1px rgba(255,215,0,0.5),0 6px 20px rgba(255,215,0,0.3)",
                    }}>
                    {Math.round(parts.grandTotal * 0.3).toLocaleString("ru-RU")} ₽ → оплатить
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Шаги что дальше */}
          <div className="space-y-2 mb-4">
            {[
              { icon: "Phone", text: "Мастер перезвонит вам в течение 15 минут", color: "#FFD700" },
              { icon: "MapPin", text: "Привозите телефон: ул. Кирова, 7 — бесплатная диагностика", color: "#6ee7b7" },
              { icon: "Wrench", text: "Ремонт при вас — в 90% случаев занимает 20–60 минут", color: "#7dd3fc" },
            ].map(({ icon, text, color }) => (
              <div key={icon} className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${color}14`, border: `1px solid ${color}25` }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {icon === "Phone" && <><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8 19.79 19.79 0 01.12 1.18 2 2 0 012.1 0h3a2 2 0 012 1.72c.13 1 .38 1.97.73 2.9a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.93.35 1.9.6 2.9.73A2 2 0 0122 14.92z"/></>}
                    {icon === "MapPin" && <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></>}
                    {icon === "Wrench" && <><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></>}
                  </svg>
                </div>
                <span className="font-roboto text-xs text-white/55 leading-snug">{text}</span>
              </div>
            ))}
          </div>

          {/* Кнопки внизу */}
          <div className="flex items-center gap-3">
            <button onClick={() => { order.resetOrder(); reset(); }}
              className="flex-1 py-2.5 rounded-xl font-roboto text-xs text-white/40 hover:text-white/70 transition-all"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              Новая заявка
            </button>
            <button onClick={() => { status.setStatusId(String(orderId)); setTab("status"); setOpen(true); order.resetOrder(); }}
              className="flex-1 py-2.5 rounded-xl font-roboto text-xs transition-all"
              style={{ color: "rgba(255,215,0,0.7)", background: "rgba(255,215,0,0.06)", border: "1px solid rgba(255,215,0,0.2)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,215,0,0.4)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,215,0,0.2)"; }}>
              Статус заявки →
            </button>
          </div>
        </div>

        <span aria-hidden className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg,transparent,rgba(255,215,0,0.25),transparent)" }} />
      </div>
    );
  }

  return (
    <div ref={rootRef} id="repair" className="hero-premium-btn group relative bg-gradient-to-br from-white/[0.06] via-white/[0.02] to-transparent backdrop-blur-sm border-2 border-[#FFD700]/30 hover:border-[#FFD700]/70 px-4 py-4 w-full rounded-xl overflow-hidden scroll-mt-24 transition-all">
      <span aria-hidden className="absolute top-0 left-0 right-0 h-px opacity-70" style={{ background: "linear-gradient(90deg, transparent, rgba(255,215,0,0.9), transparent)" }} />
      <span aria-hidden className="absolute top-1.5 left-1.5 w-3 h-3 border-l-2 border-t-2 border-[#FFD700]/70 group-hover:border-[#FFD700] transition-colors" />
      <span aria-hidden className="absolute top-1.5 right-1.5 w-3 h-3 border-r-2 border-t-2 border-[#FFD700]/70 group-hover:border-[#FFD700] transition-colors" />
      <span aria-hidden className="absolute bottom-1.5 left-1.5 w-3 h-3 border-l-2 border-b-2 border-[#FFD700]/70 group-hover:border-[#FFD700] transition-colors" />
      <span aria-hidden className="absolute bottom-1.5 right-1.5 w-3 h-3 border-r-2 border-b-2 border-[#FFD700]/70 group-hover:border-[#FFD700] transition-colors" />

      <div className="relative">
        <RepairWidgetHeader open={open} onToggle={() => setOpen(v => !v)} />
      </div>

      {open && (
        <RepairWidgetBody
          tab={tab}
          setTab={setTab}
          form={form}
          setForm={setForm}
          sending={order.sending}
          orderId={order.orderId}
          agreed={agreed}
          setAgreed={setAgreed}
          canSubmit={canSubmit}
          grandTotal={parts.grandTotal}
          selectedPart={parts.selectedPart}
          clientInfo={parts.clientInfo}
          partsLoading={parts.partsLoading}
          parts={parts.parts}
          showPartsList={parts.showPartsList}
          groupedParts={parts.groupedParts}
          extraWorks={parts.extraWorks}
          extraWorksList={parts.extraWorksList}
          extraTotal={parts.extraTotal}
          onSelectPart={parts.handleSelectPart}
          onToggleExtra={parts.toggleExtra}
          onChangeSelection={parts.changeSelection}
          onSubmit={handleSubmit}
          onReset={reset}
          contactChannels={contactChannels}
          setContactChannels={setContactChannels}
          contactTime={contactTime}
          setContactTime={setContactTime}
          statusId={status.statusId}
          setStatusId={status.setStatusId}
          statusLoading={status.statusLoading}
          statusError={status.statusError}
          statusResult={status.statusResult}
          phoneResults={status.phoneResults}
          phoneLoading={status.phoneLoading}
          phoneError={status.phoneError}
          onCheckStatus={status.checkStatus}
          onCheckByPhone={status.checkStatusByPhone}
        />
      )}
    </div>
  );
}