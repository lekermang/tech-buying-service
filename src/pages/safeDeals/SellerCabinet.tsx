/** Личный кабинет продавца: статус сделки, QR-код, история событий, отмена. */
import { useCallback, useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "sonner";
import Icon from "@/components/ui/icon";
import {
  apiCall, fmtDate, fmtRub, OFFICE_ADDRESS, STATUS_LABEL,
  type SafeDealDetail,
} from "./api";
import { FeatureUpgradeCTA, ReferralBlock, CourierPaymentCTA } from "./LandingExtras";

export default function SellerCabinet({ token, onBack }: { token: string; onBack: () => void }) {
  const [deal, setDeal] = useState<SafeDealDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await apiCall<SafeDealDetail>("get_by_token", { params: { token } });
    setLoading(false);
    if (!r.ok || !r.data) { setErr(r.error || "Ошибка"); return; }
    setDeal(r.data); setErr(null);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const cancel = async () => {
    if (!deal) return;
    const reason = window.prompt("Причина отмены (необязательно):", "");
    if (reason === null) return;
    const r = await apiCall("cancel_by_token", {
      method: "POST",
      body: { token, reason: reason || null },
    });
    if (!r.ok) { toast.error(r.error || "Не удалось отменить"); return; }
    toast.success("Сделка отменена");
    load();
  };

  if (loading) return (
    <div className="max-w-2xl mx-auto px-5 py-10 text-center">
      <Icon name="Loader2" size={28} className="animate-spin text-[#FFD700] mx-auto" />
      <p className="text-sm text-[#777] mt-3">Загружаем сделку...</p>
    </div>
  );
  if (err || !deal) return (
    <div className="max-w-md mx-auto px-5 py-10 text-center">
      <Icon name="AlertCircle" size={32} className="text-[#FF453A] mx-auto mb-2" />
      <p className="text-sm text-[#bbb]">{err || "Не найдено"}</p>
      <button onClick={onBack} className="mt-4 text-sm text-[#FFD700] hover:underline">← Назад</button>
    </div>
  );

  const status = STATUS_LABEL[deal.status];
  const canCancel = !["completed", "cancelled", "returned"].includes(deal.status);
  const qrLink = `${window.location.origin}/safe-deals/qr/${deal.qr_code}`;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-5 py-5 space-y-4">
      <button onClick={onBack} className="text-sm text-[#FFD700] flex items-center gap-1">
        <Icon name="ChevronLeft" size={14} /> К началу
      </button>

      {/* Шапка */}
      <div className="bg-gradient-to-br from-[#FFD700]/[0.1] to-transparent border border-[#FFD700]/30 rounded-2xl p-4 sm:p-5">
        <div className="flex items-start gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="text-xs uppercase tracking-wider text-[#777] mb-1">Сделка</div>
            <div className="text-xl font-extrabold text-[#FFD700] tracking-wide">{deal.deal_number}</div>
            <div className="text-sm text-[#bbb] mt-2 truncate">{deal.product_title}</div>
            <a href={`/safe-deals/item/${deal.deal_number}`} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-[#FFD700] hover:underline mt-2">
              <Icon name="ExternalLink" size={11} /> Посмотреть как видит покупатель
            </a>
          </div>
          <span className={`text-[10px] px-2.5 py-1 rounded-full border uppercase tracking-wider font-bold ${status.cls} flex items-center gap-1 shrink-0`}>
            <Icon name={status.icon} size={10} /> {status.label}
          </span>
        </div>
      </div>

      {/* QR */}
      <section className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-4 sm:p-5 text-center">
        <h3 className="text-xs uppercase tracking-wider text-[#FFD700] font-bold mb-3">QR-код сделки</h3>
        <div className="bg-white p-3 rounded-xl inline-flex">
          <QRCodeCanvas value={qrLink} size={160} level="M" />
        </div>
        <div className="mt-3 text-2xl font-extrabold text-[#FFD700] tracking-[6px] tabular-nums">{deal.qr_code}</div>
        <p className="text-xs text-[#777] mt-2 leading-relaxed">
          Покажите код покупателю при встрече.<br />
          Он отсканирует и подтвердит получение.
        </p>
        <button
          onClick={() => navigator.clipboard.writeText(qrLink).then(() => toast.success("Ссылка скопирована"))}
          className="mt-3 text-sm text-[#FFD700] hover:underline"
        >
          <Icon name="Link2" size={13} className="inline mr-1" /> Скопировать ссылку
        </button>
      </section>

      {/* Платный апгрейд — только для активных */}
      {["on_shelf", "submitted", "review"].includes(deal.status) && (
        <>
          <FeatureUpgradeCTA token={token} />
          <CourierPaymentCTA token={token} />
        </>
      )}

      {/* Реферальная программа */}
      <ReferralBlock token={token} />

      {/* Финансы */}
      <section className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-4 sm:p-5">
        <h3 className="text-xs uppercase tracking-wider text-[#FFD700] font-bold mb-3 flex items-center gap-2">
          <Icon name="Wallet" size={13} /> Расчёт
        </h3>
        <div className="grid grid-cols-3 gap-2">
          <Stat label="Цена" value={fmtRub(deal.price)} color="#FFD700" />
          <Stat label={`Комиссия ${deal.commission_pct}%`} value={fmtRub(deal.commission_amount)} color="#FF7AB8" />
          <Stat label="К выплате" value={fmtRub(deal.seller_payout)} color="#3DDC84" />
        </div>
      </section>

      {/* Адрес и условия */}
      <section className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-4 sm:p-5 space-y-2">
        <h3 className="text-xs uppercase tracking-wider text-[#FFD700] font-bold mb-2 flex items-center gap-2">
          <Icon name="MapPin" size={13} /> Куда привезти
        </h3>
        <p className="text-base font-bold">{OFFICE_ADDRESS}</p>
        <p className="text-xs text-[#777]">Часы работы: ежедневно 10:00–20:00. Принесите товар + документ покупки (если есть).</p>
      </section>

      {/* Фото */}
      {deal.photos.length > 0 && (
        <section className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-4 sm:p-5">
          <h3 className="text-xs uppercase tracking-wider text-[#FFD700] font-bold mb-3 flex items-center gap-2">
            <Icon name="Image" size={13} /> Фото товара
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {deal.photos.map((p, i) => (
              <a key={i} href={p.url} target="_blank" rel="noopener noreferrer"
                className="aspect-square rounded-lg overflow-hidden bg-[#1C1C1C] block">
                <img src={p.url} alt="" className="w-full h-full object-cover" loading="lazy" />
              </a>
            ))}
          </div>
        </section>
      )}

      {/* События */}
      <section className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-4 sm:p-5">
        <h3 className="text-xs uppercase tracking-wider text-[#FFD700] font-bold mb-3 flex items-center gap-2">
          <Icon name="History" size={13} /> История
        </h3>
        <ul className="space-y-2">
          {deal.events.map(e => (
            <li key={e.id} className="text-sm flex items-start gap-2 border-l-2 border-[#2A2A2A] pl-3">
              <Icon name="Circle" size={6} className="mt-2 text-[#FFD700] fill-[#FFD700]" />
              <div className="flex-1">
                <div className="text-[#ddd]">{eventText(e.event_type)}</div>
                <div className="text-[10px] text-[#666] mt-0.5">{fmtDate(e.created_at)} {e.actor ? `· ${e.actor}` : ""}</div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {canCancel && (
        <button onClick={cancel}
          className="w-full py-3 rounded-2xl border-2 border-[#FF453A]/40 text-[#FF453A] font-bold text-sm hover:border-[#FF453A]">
          Отменить сделку
        </button>
      )}

      <button onClick={load} className="w-full py-3 rounded-2xl border-2 border-[#2A2A2A] text-sm text-[#999]">
        <Icon name="RefreshCw" size={13} className="inline mr-1" /> Обновить статус
      </button>
    </div>
  );
}

function eventText(t: string): string {
  switch (t) {
    case "submitted": return "Заявка подана";
    case "office_checked": return "Товар проверен в офисе";
    case "on_shelf": return "Размещён на витрине";
    case "reserved": return "Зарезервирован покупателем";
    case "completed": return "Сделка завершена";
    case "cancelled": return "Отменено";
    case "returned": return "Возвращён продавцу";
    case "ip_logged": return "IP зафиксирован для безопасности";
    default: return t;
  }
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-[#1C1C1C] border border-[#2A2A2A] rounded-xl px-3 py-2.5 text-center">
      <div className="text-[10px] uppercase tracking-wider text-[#777] mb-0.5">{label}</div>
      <div className="text-sm font-extrabold" style={{ color }}>{value}</div>
    </div>
  );
}