/**
 * Публичная страница покупателя по QR-коду: /safe-deals/qr/:code
 * Показывает товар, цену, фото. Покупатель сканирует QR в офисе при получении —
 * вводит имя/телефон → статус сделки переходит в "completed".
 */
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import Icon from "@/components/ui/icon";
import { apiCall, fmtRub, OFFICE_ADDRESS, STATUS_LABEL, type SafeDealPublic } from "./safeDeals/api";

export default function SafeDealQR() {
  const { code = "" } = useParams<{ code: string }>();
  const codeUp = code.toUpperCase();
  const [deal, setDeal] = useState<SafeDealPublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [rating, setRating] = useState<number | null>(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    document.title = "Проверка сделки — Скупка24";
    (async () => {
      setLoading(true);
      const r = await apiCall<SafeDealPublic>("get_by_qr", { params: { code: codeUp } });
      setLoading(false);
      if (!r.ok || !r.data) { setErr(r.error || "Сделка не найдена"); return; }
      setDeal(r.data); setErr(null);
    })();
  }, [codeUp]);

  const confirm = async () => {
    if (!buyerName.trim()) { toast.error("Укажите имя"); return; }
    if (!buyerPhone.trim() || buyerPhone.replace(/\D/g, "").length < 10) {
      toast.error("Укажите телефон"); return;
    }
    setSubmitting(true);
    const r = await apiCall("confirm_by_qr", {
      method: "POST",
      body: {
        code: codeUp,
        buyerName: buyerName.trim(),
        buyerPhone: buyerPhone.trim(),
        rating,
        comment: comment.trim() || null,
      },
    });
    setSubmitting(false);
    if (!r.ok) { toast.error(r.error || "Ошибка"); return; }
    setDone(true);
    toast.success("Сделка подтверждена!");
  };

  if (loading) return (
    <Page>
      <div className="text-center py-12">
        <Icon name="Loader2" size={28} className="animate-spin text-[#FFD700] mx-auto" />
      </div>
    </Page>
  );

  if (err || !deal) return (
    <Page>
      <div className="max-w-md mx-auto px-5 py-10 text-center">
        <Icon name="AlertCircle" size={36} className="text-[#FF453A] mx-auto mb-3" />
        <h2 className="text-base font-bold">{err || "Сделка не найдена"}</h2>
        <p className="text-sm text-[#999] mt-2">Проверьте код или обратитесь к сотруднику Скупка24</p>
        <a href="/safe-deals" className="inline-block mt-5 px-5 py-2.5 rounded-xl bg-[#FFD700] text-black font-bold text-sm">На главную</a>
      </div>
    </Page>
  );

  const status = STATUS_LABEL[deal.status];
  const alreadyCompleted = deal.status === "completed" || deal.status === "cancelled" || deal.status === "returned";

  return (
    <Page>
      <div className="max-w-xl mx-auto px-4 sm:px-5 py-5 space-y-4">
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FFD700]/[0.1] border border-[#FFD700]/30 text-[10px] font-bold tracking-wider uppercase text-[#FFD700] mb-2">
            <Icon name="Shield" size={11} /> Проверено Скупка24
          </div>
          <h1 className="text-xl font-extrabold">{deal.productTitle}</h1>
          <div className="text-xs text-[#777] mt-1">Сделка {deal.dealNumber}</div>
        </div>

        {deal.photos.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {deal.photos.map((p, i) => (
              <a key={i} href={p.url} target="_blank" rel="noopener noreferrer"
                className="aspect-square rounded-lg overflow-hidden bg-[#1C1C1C] block">
                <img src={p.url} alt="" className="w-full h-full object-cover" loading="lazy" />
              </a>
            ))}
          </div>
        )}

        <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-4 sm:p-5 space-y-2">
          <Row label="Цена" value={<span className="text-[#FFD700] font-extrabold text-lg">{fmtRub(deal.price)}</span>} />
          {deal.productBrand && <Row label="Бренд" value={deal.productBrand} />}
          {deal.productModel && <Row label="Модель" value={deal.productModel} />}
          {deal.productCondition && <Row label="Состояние" value={deal.productCondition} />}
          {deal.productCategory && <Row label="Категория" value={deal.productCategory} />}
          <Row label="Продавец" value={deal.sellerNameMasked || "—"} />
          <Row label="Статус" value={
            <span className={`text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-wider font-bold ${status.cls}`}>
              {status.label}
            </span>
          } />
        </div>

        {deal.productDescription && (
          <section className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-4">
            <div className="text-xs uppercase tracking-wider text-[#FFD700] font-bold mb-2">Описание</div>
            <p className="text-sm text-[#ddd] leading-relaxed whitespace-pre-wrap">{deal.productDescription}</p>
          </section>
        )}

        {deal.officeCheckNotes && (
          <section className="bg-emerald-500/[0.06] border border-emerald-500/30 rounded-2xl p-4">
            <div className="text-xs uppercase tracking-wider text-emerald-300 font-bold mb-2 flex items-center gap-2">
              <Icon name="Eye" size={13} /> Отчёт о проверке
            </div>
            <p className="text-sm text-[#ddd] leading-relaxed whitespace-pre-wrap">{deal.officeCheckNotes}</p>
          </section>
        )}

        <section className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-4 sm:p-5">
          <div className="text-xs uppercase tracking-wider text-[#FFD700] font-bold mb-2 flex items-center gap-2">
            <Icon name="MapPin" size={13} /> Где забрать
          </div>
          <p className="text-base font-bold">{OFFICE_ADDRESS}</p>
          <p className="text-xs text-[#777] mt-1">Часы работы: ежедневно 10:00–20:00</p>
        </section>

        {/* Форма подтверждения */}
        {!alreadyCompleted && !done && (
          <section className="bg-gradient-to-br from-[#3DDC84]/[0.06] to-transparent border border-[#3DDC84]/30 rounded-2xl p-4 sm:p-5">
            <div className="text-xs uppercase tracking-wider text-emerald-300 font-bold mb-3 flex items-center gap-2">
              <Icon name="CheckCircle2" size={13} /> Подтвердите получение
            </div>
            <p className="text-sm text-[#bbb] mb-3">Вы осмотрели товар и забираете его? Подтвердите сделку:</p>

            <div className="space-y-2.5">
              <input value={buyerName} onChange={e => setBuyerName(e.target.value)}
                placeholder="Ваше имя"
                className="w-full bg-[#1C1C1C] border border-[#2A2A2A] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#FFD700]" />
              <input value={buyerPhone} onChange={e => setBuyerPhone(e.target.value)}
                placeholder="Ваш телефон"
                type="tel"
                className="w-full bg-[#1C1C1C] border border-[#2A2A2A] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#FFD700]" />

              <div className="bg-[#1C1C1C] border border-[#2A2A2A] rounded-xl px-4 py-3">
                <div className="text-xs text-[#777] mb-2">Оцените сделку</div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} onClick={() => setRating(n)} className="text-2xl"
                      aria-label={`${n} звёзд`}>
                      <span className={n <= (rating || 0) ? "text-[#FFD700]" : "text-[#333]"}>★</span>
                    </button>
                  ))}
                </div>
              </div>

              <textarea value={comment} onChange={e => setComment(e.target.value)}
                placeholder="Комментарий (необязательно)" rows={2}
                className="w-full bg-[#1C1C1C] border border-[#2A2A2A] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#FFD700] resize-none" />

              <button onClick={confirm} disabled={submitting}
                className="w-full py-3.5 rounded-2xl bg-emerald-500 text-black font-bold text-sm hover:bg-emerald-400 transition disabled:opacity-50 flex items-center justify-center gap-2">
                {submitting ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="CheckCircle2" size={16} />}
                {submitting ? "Подтверждаем..." : "Подтвердить получение"}
              </button>
            </div>
          </section>
        )}

        {(alreadyCompleted || done) && (
          <section className="bg-emerald-500/[0.08] border border-emerald-500/30 rounded-2xl p-5 text-center">
            <Icon name="CheckCircle2" size={36} className="text-emerald-400 mx-auto mb-2" />
            <h3 className="text-lg font-extrabold text-emerald-300">Сделка завершена</h3>
            <p className="text-sm text-[#bbb] mt-1">Спасибо! Деньги переданы продавцу через гаранта.</p>
          </section>
        )}

        <a href="/safe-deals" className="block text-center text-xs text-[#777] hover:text-[#FFD700] mt-2">
          ← На главную «Безопасная сделка»
        </a>
      </div>
    </Page>
  );
}

function Page({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0D0D0D] text-[#F0F0F0]" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" }}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#2A2A2A] bg-[#141414]">
        <a href="/" className="flex items-center gap-2.5 no-underline">
          <div className="w-8 h-8 rounded-lg bg-[#FFD700] flex items-center justify-center text-black font-extrabold text-base">С</div>
          <span className="text-[#FFD700] font-bold text-base">Скупка24</span>
        </a>
        <span className="text-sm text-[#777]">Сделка</span>
      </div>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-[#777]">{label}</span>
      <span className="text-[#F0F0F0] font-bold text-right">{value}</span>
    </div>
  );
}
