/** Дополнения для лендинга /safe-deals:
 * - UTP-блок «Деньги сегодня, без комиссии для продавца?»
 * - Правила безопасности
 * - Платный апгрейд (Премиум-карточка)
 */
import { useState } from "react";
import { toast } from "sonner";
import Icon from "@/components/ui/icon";
import { featureDeal } from "./api";

export function ReferralBlock({ token }: { token: string }) {
  const refLink = `${window.location.origin}/safe-deals?ref=${token}`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(refLink);
      toast.success("Ссылка скопирована");
    } catch {
      toast.message(refLink);
    }
  };
  const share = async () => {
    const nav = navigator as Navigator & { share?: (data: { title?: string; text?: string; url?: string }) => Promise<void> };
    const text = "Продайте Б/У технику безопасно через гаранта Скупка24 — деньги сразу, без обмана!";
    if (typeof nav.share === "function") {
      try { await nav.share({ title: "Скупка24 · Безопасная сделка", text, url: refLink }); return; } catch { /* отменили */ }
    }
    copy();
  };
  return (
    <div className="bg-gradient-to-br from-emerald-500/[0.08] via-[#0D0D0D] to-emerald-500/[0.04] border border-emerald-500/30 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon name="Users" size={16} className="text-emerald-300" />
        <h3 className="text-sm font-extrabold text-emerald-300">Пригласи друга — получи 50% от его комиссии</h3>
      </div>
      <p className="text-xs text-[#999] leading-relaxed mb-3">
        Поделитесь ссылкой. Когда друг сдаст товар через вашу ссылку — вам автоматически начислится 50% от нашей комиссии с его сделки.
      </p>
      <div className="bg-[#1C1C1C] border border-[#2A2A2A] rounded-xl px-3 py-2.5 mb-3 text-xs text-white/85 break-all font-mono">
        {refLink}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={copy} className="py-2.5 rounded-xl border-2 border-[#2A2A2A] text-xs font-bold text-[#F0F0F0] hover:border-[#FFD700] transition flex items-center justify-center gap-1.5">
          <Icon name="Copy" size={12} /> Скопировать
        </button>
        <button onClick={share} className="py-2.5 rounded-xl bg-emerald-500 text-black font-bold text-xs flex items-center justify-center gap-1.5">
          <Icon name="Share2" size={12} /> Поделиться
        </button>
      </div>
    </div>
  );
}

export function UtpBlock() {
  return (
    <section className="max-w-3xl mx-auto px-4 sm:px-5 py-10 border-t border-[#1A1A1A]">
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#FFD700]/[0.15] via-[#0D0D0D] to-[#FFD700]/[0.05] border-2 border-[#FFD700]/40 p-6 sm:p-8">
        <div aria-hidden className="absolute -top-20 -right-20 w-[300px] h-[300px] rounded-full blur-3xl pointer-events-none"
          style={{ background: "rgba(255,215,0,0.15)" }} />
        <div className="relative">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FFD700]/[0.2] border border-[#FFD700]/40 text-[10px] font-bold tracking-wider uppercase text-[#FFD700] mb-3">
            <Icon name="Zap" size={11} /> Срочный выкуп · Калуга
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight">
            Деньги сегодня. <br className="sm:hidden" />
            <span className="bg-gradient-to-r from-[#FFD700] via-[#fff3a0] to-[#FFD700] bg-clip-text text-transparent">
              Без комиссии для продавца?
            </span>
          </h2>
          <p className="text-sm sm:text-base text-white/85 mt-4 leading-relaxed">
            Выставьте товар за 2 минуты — отдайте его в Калуге за 2 часа. Мы берём на себя общение с покупателем,
            фото для витрины, обработку звонков и оформление. Вы просто получаете деньги.
          </p>
          <div className="grid sm:grid-cols-3 gap-3 mt-5">
            <UtpStat icon="Clock" title="2 минуты" desc="на создание объявления" />
            <UtpStat icon="MapPin" title="Кирова, 11" desc="безопасная сделка в офисе" />
            <UtpStat icon="Wallet" title="10%" desc="комиссия только после продажи" />
          </div>
          <div className="mt-5 text-xs text-white/55">
            * Без комиссии — если товар не продан за 14 дней, вы забираете его обратно без штрафов.
          </div>
        </div>
      </div>
    </section>
  );
}

function UtpStat({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="bg-black/40 border border-[#FFD700]/20 rounded-2xl p-4">
      <Icon name={icon} size={20} className="text-[#FFD700] mb-2" />
      <div className="text-lg font-extrabold text-white">{title}</div>
      <div className="text-xs text-white/55 mt-0.5">{desc}</div>
    </div>
  );
}

export function SafetyRules() {
  const rules: Array<{ icon: string; title: string; desc: string }> = [
    {
      icon: "MapPin",
      title: "Встреча только в офисе",
      desc: "ул. Кирова, 11. Никаких парковок, ТЦ, метро. У сотрудника на руках чёрный список мошенников.",
    },
    {
      icon: "QrCode",
      title: "QR-код сделки",
      desc: "Покупатель сканирует код только после того, как осмотрел товар и подтвердил, что всё работает.",
    },
    {
      icon: "ShieldAlert",
      title: "Чёрный список",
      desc: "База недобросовестных покупателей и продавцов. Заявки с жалобами автоматически блокируются.",
    },
    {
      icon: "Eye",
      title: "Видеофиксация",
      desc: "Процесс проверки товара и сделки фиксируется на видео и хранится 30 дней (для арбитража).",
    },
    {
      icon: "FileCheck",
      title: "Паспорт продавца",
      desc: "Сотрудник сверяет паспорт продавца перед приёмом товара. Данные видны только админу, покупателю — никогда.",
    },
    {
      icon: "ShieldCheck",
      title: "Гарантия Скупка24",
      desc: "Если что-то пошло не так — обращайтесь в офис. Мы возьмём ситуацию на арбитраж.",
    },
  ];
  return (
    <section className="max-w-3xl mx-auto px-4 sm:px-5 py-10 border-t border-[#1A1A1A]">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/[0.1] border border-red-500/30 text-[10px] font-bold tracking-wider uppercase text-red-400 mb-2">
          <Icon name="ShieldAlert" size={11} /> Безопасность
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold">Правила безопасной сделки</h2>
        <p className="text-sm text-[#777] mt-1.5">Что мы делаем, чтобы вы не пострадали от мошенников</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {rules.map((r, i) => (
          <div key={i} className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-4 hover:border-[#FFD700]/30 transition">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-500/15 text-red-400 flex items-center justify-center shrink-0">
                <Icon name={r.icon} size={18} />
              </div>
              <div>
                <div className="text-sm font-bold mb-1">{r.title}</div>
                <div className="text-xs text-[#999] leading-relaxed">{r.desc}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function FeatureUpgradeCTA({ token }: { token: string }) {
  const [loading, setLoading] = useState(false);
  const [enabled, setEnabled] = useState(false);

  const submit = async () => {
    if (!window.confirm("Включить «Золотую карточку» — товар будет в топе витрины 7 дней за 100 ₽. Подтвердить?")) return;
    setLoading(true);
    const r = await featureDeal(token);
    setLoading(false);
    if (!r.ok) { toast.error(r.error || "Ошибка"); return; }
    setEnabled(true);
    toast.success("Карточка теперь в топе!");
  };

  if (enabled) {
    return (
      <div className="bg-gradient-to-br from-[#FFD700]/[0.15] to-transparent border-2 border-[#FFD700] rounded-2xl p-4 text-center">
        <Icon name="Crown" size={20} className="text-[#FFD700] mx-auto mb-1" />
        <div className="text-sm font-bold text-[#FFD700]">Золотая карточка активирована</div>
        <div className="text-xs text-white/60 mt-0.5">Товар в топе витрины 7 дней</div>
      </div>
    );
  }

  return (
    <button onClick={submit} disabled={loading}
      className="w-full bg-gradient-to-r from-[#FFD700]/[0.1] to-transparent border border-[#FFD700]/40 hover:border-[#FFD700] rounded-2xl p-3.5 text-left transition active:scale-[0.98] disabled:opacity-50">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#FFD700]/15 text-[#FFD700] flex items-center justify-center shrink-0">
          <Icon name="Crown" size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-[#FFD700]">Золотая карточка в топе · 100 ₽</div>
          <div className="text-[11px] text-[#999] mt-0.5">Ваш товар будет показан первым на витрине 7 дней — быстрее найдётся покупатель</div>
        </div>
        <Icon name="ArrowRight" size={16} className="text-[#FFD700] shrink-0" />
      </div>
    </button>
  );
}