/** Детальная карточка сделки в админке — для сотрудника. */
import { useCallback, useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "sonner";
import Icon from "@/components/ui/icon";
import { SLButton, SLPill, SLStat, SLGrid, SLSection } from "../slUI";
import {
  sdApi, fmtRub, fmtDate, STATUS_LABEL,
  type AdminDeal,
} from "./types";

export default function SafeDealDetail({ token, dealId, onBack }: {
  token: string;
  dealId: number;
  onBack: () => void;
}) {
  const [deal, setDeal] = useState<AdminDeal | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [checkModal, setCheckModal] = useState(false);
  const [reserveModal, setReserveModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await sdApi<AdminDeal>(token, "admin_get", { params: { id: dealId } });
    setLoading(false);
    if (!r.ok || !r.data) { setErr(r.error || "Ошибка"); return; }
    setDeal(r.data); setErr(null);
  }, [token, dealId]);

  useEffect(() => { load(); }, [load]);

  const setStatus = async (status: string, note?: string) => {
    if (!deal) return;
    setActionLoading(status);
    const r = await sdApi(token, "admin_set_status", {
      method: "POST",
      body: { id: deal.id, status, note },
    });
    setActionLoading(null);
    if (!r.ok) { toast.error(r.error || "Ошибка"); return; }
    toast.success("Статус обновлён");
    load();
  };

  if (loading) return (
    <div className="text-center py-8 text-white/40">
      <Icon name="Loader2" size={18} className="animate-spin inline" />
    </div>
  );
  if (err || !deal) return (
    <div className="text-center py-6">
      <div className="text-red-300 text-sm mb-2">{err || "Не найдено"}</div>
      <button onClick={onBack} className="text-white/60 hover:text-white text-sm">← Назад</button>
    </div>
  );

  const badge = STATUS_LABEL[deal.status];
  const qrLink = `${window.location.origin}/safe-deals/qr/${deal.qr_code}`;

  return (
    <div className="space-y-2">
      {/* Верхняя шапка */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <button onClick={onBack} className="inline-flex items-center gap-1 text-white/60 hover:text-white text-[12px] font-semibold">
          <Icon name="ChevronLeft" size={14} /> К списку
        </button>
        <div className="flex flex-wrap gap-1">
          {deal.status === "submitted" && (
            <SLButton variant="goldOutline" size="sm" icon="Eye"
              onClick={() => setStatus("review")}
              disabled={actionLoading !== null}>На проверку</SLButton>
          )}
          {(deal.status === "submitted" || deal.status === "review") && (
            <SLButton variant="success" size="sm" icon="ClipboardCheck"
              onClick={() => setCheckModal(true)}>Отчёт о проверке</SLButton>
          )}
          {deal.status === "on_shelf" && (
            <SLButton variant="goldOutline" size="sm" icon="Bookmark"
              onClick={() => setReserveModal(true)}>Зарезервировать</SLButton>
          )}
          {(deal.status === "on_shelf" || deal.status === "reserved") && (
            <SLButton variant="success" size="sm" icon="CheckCircle2"
              onClick={() => setStatus("completed")}>Завершить сделку</SLButton>
          )}
          {!["completed", "cancelled", "returned"].includes(deal.status) && (
            <>
              <SLButton variant="dark" size="sm" icon="RotateCcw"
                onClick={() => setStatus("returned")}>Возврат</SLButton>
              <SLButton variant="danger" size="sm" icon="Ban"
                onClick={() => setStatus("cancelled")}>Отменить</SLButton>
            </>
          )}
        </div>
      </div>

      {/* Заголовок */}
      <div className="rounded-xl bg-[#101010] border border-[#1A1A1A] px-3 py-2 flex items-center gap-2 flex-wrap">
        <div className="font-oswald font-bold text-[16px] uppercase tracking-wide text-[#FFD700]">{deal.deal_number}</div>
        <span className={`text-[9px] px-2 py-0.5 rounded-full border uppercase tracking-wide font-bold ${badge.cls}`}>{badge.label}</span>
        {deal.photos.length > 0 && (
          <SLPill color="blue"><Icon name="Image" size={9} className="inline mr-0.5" />{deal.photos.length} фото</SLPill>
        )}
        <div className="text-[10px] text-white/40 ml-auto">{fmtDate(deal.created_at)}</div>
      </div>

      {/* Финансы */}
      <SLGrid cols={4}>
        <SLStat label="Цена" value={fmtRub(deal.price)} color="gold" />
        <SLStat label={`Комиссия ${deal.commission_pct}%`} value={fmtRub(deal.commission_amount)} color="orange" />
        <SLStat label="К выплате продавцу" value={fmtRub(deal.seller_payout)} color="green" />
        <SLStat
          label="QR-код"
          value={deal.qr_code}
          color="white"
        />
      </SLGrid>

      {/* QR */}
      <SLSection icon="QrCode" title="QR-код для покупателя">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="bg-white p-2 rounded-lg shrink-0">
            <QRCodeCanvas value={qrLink} size={140} level="M" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Ссылка для покупателя</div>
            <div className="text-[12px] text-white/85 truncate">{qrLink}</div>
            <button
              onClick={() => navigator.clipboard.writeText(qrLink).then(() => toast.success("Скопировано"))}
              className="mt-2 text-[11px] text-[#FFD700] hover:underline">
              <Icon name="Link2" size={11} className="inline mr-1" /> Скопировать ссылку
            </button>
          </div>
        </div>
      </SLSection>

      {/* Продавец */}
      <SLSection icon="User" title="Продавец">
        <SLGrid cols={2}>
          <Row l="ФИО" v={deal.seller_name} />
          <Row l="Телефон" v={deal.seller_phone} />
          {deal.seller_email && <Row l="Email" v={deal.seller_email} />}
          <Row l="Способ выплаты" v={deal.payout_method === "transfer" ? "Перевод" : "Наличные в офисе"} />
          {deal.payout_details && <Row l="Реквизиты" v={deal.payout_details} />}
        </SLGrid>
      </SLSection>

      {/* Покупатель */}
      {(deal.buyer_name || deal.buyer_phone) && (
        <SLSection icon="UserCheck" title="Покупатель">
          <SLGrid cols={2}>
            <Row l="ФИО" v={deal.buyer_name} />
            <Row l="Телефон" v={deal.buyer_phone} />
            {deal.reservation_until && <Row l="Бронь до" v={fmtDate(deal.reservation_until)} />}
            {deal.completed_at && <Row l="Завершено" v={fmtDate(deal.completed_at)} />}
          </SLGrid>
        </SLSection>
      )}

      {/* Товар */}
      <SLSection icon="Package" title="Товар">
        <SLGrid cols={2}>
          <Row l="Название" v={deal.product_title} />
          <Row l="Категория" v={deal.product_category} />
          <Row l="Бренд" v={deal.product_brand} />
          <Row l="Модель" v={deal.product_model} />
          <Row l="Состояние" v={deal.product_condition} />
          <Row l="Серийный/IMEI" v={deal.product_serial} />
        </SLGrid>
        {deal.product_description && (
          <div className="mt-2 rounded-md bg-[#0F0F0F] border border-[#1F1F1F] p-2.5 text-[12px] text-white/80 whitespace-pre-wrap">
            {deal.product_description}
          </div>
        )}
      </SLSection>

      {/* Фото */}
      {deal.photos.length > 0 && (
        <SLSection icon="Camera" title={`Фото (${deal.photos.length})`}>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
            {deal.photos.map((p, i) => (
              <a key={i} href={p.url} target="_blank" rel="noopener noreferrer"
                className="aspect-square rounded-md overflow-hidden border border-[#1F1F1F] bg-black/30 block">
                <img src={p.url} alt="" className="w-full h-full object-cover" loading="lazy" />
              </a>
            ))}
          </div>
        </SLSection>
      )}

      {/* ИИ-проверка */}
      {deal.ai_check && deal.ai_check.summary && (
        <SLSection icon="Sparkles" title="ИИ-проверка заявки">
          <div className={`rounded-md border px-3 py-2 mb-2 ${
            deal.ai_check.risk_level === "high" ? "bg-red-500/10 border-red-500/30 text-red-300"
            : deal.ai_check.risk_level === "medium" ? "bg-orange-500/10 border-orange-500/30 text-orange-300"
            : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
          }`}>
            <div className="text-[10px] uppercase tracking-wider font-bold mb-1">
              Уровень риска: {deal.ai_check.risk_level || "—"}
            </div>
            <div className="text-[12px]">{deal.ai_check.summary}</div>
          </div>
          {deal.ai_check.warnings && deal.ai_check.warnings.length > 0 && (
            <div className="mb-2">
              <div className="text-[10px] uppercase tracking-wider text-white/40 font-bold mb-1">Предупреждения</div>
              <ul className="text-[12px] text-white/80 space-y-0.5">
                {deal.ai_check.warnings.map((w, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <Icon name="AlertCircle" size={11} className="mt-0.5 text-orange-400 shrink-0" />
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {deal.ai_check.suggestions && deal.ai_check.suggestions.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-white/40 font-bold mb-1">Рекомендации</div>
              <ul className="text-[12px] text-white/80 space-y-0.5">
                {deal.ai_check.suggestions.map((s, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <Icon name="Sparkles" size={11} className="mt-0.5 text-[#FFD700] shrink-0" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </SLSection>
      )}

      {/* Паспорт продавца */}
      {(deal.seller_passport || deal.seller_passport_photo_url) && (
        <SLSection icon="ScanLine" title="Паспорт продавца">
          <SLGrid cols={2}>
            <Row l="ФИО" v={deal.seller_passport?.fullName} />
            <Row l="Серия/номер" v={`${deal.seller_passport?.series || ""} ${deal.seller_passport?.number || ""}`.trim()} />
            <Row l="Кем выдан" v={deal.seller_passport?.issuedBy} />
            <Row l="Дата выдачи" v={deal.seller_passport?.issuedDate} />
            <Row l="Дата рождения" v={deal.seller_passport?.birthDate} />
          </SLGrid>
          {deal.seller_passport_photo_url && (
            <a href={deal.seller_passport_photo_url} target="_blank" rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-[#FFD700] hover:underline">
              <Icon name="Image" size={11} /> Открыть фото паспорта
            </a>
          )}
        </SLSection>
      )}

      {/* Авито и Яндекс ID */}
      {(deal.avito_url || deal.seller_yandex_id) && (
        <SLSection icon="ExternalLink" title="Внешние данные">
          {deal.avito_url && (
            <div className="mb-2 text-[12px]">
              <span className="text-white/40 mr-2">Импорт с Авито:</span>
              <a href={deal.avito_url} target="_blank" rel="noopener noreferrer" className="text-[#FFD700] hover:underline break-all">
                {deal.avito_url}
              </a>
            </div>
          )}
          {deal.seller_yandex_id && (
            <div className="text-[12px]">
              <span className="text-white/40 mr-2">Яндекс ID:</span>
              <span className="text-white/85">{deal.seller_yandex_id}</span>
              <span className="ml-2 px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 text-[9px] font-bold uppercase">верифицирован</span>
            </div>
          )}
        </SLSection>
      )}

      {/* Премиум-карточка */}
      {deal.is_featured && (
        <SLSection icon="Crown" title="Премиум-карточка">
          <div className="text-[12px] text-[#FFD700]">
            ⭐ Товар выделен в топе витрины {deal.featured_until ? `до ${fmtDate(deal.featured_until)}` : ""}
          </div>
        </SLSection>
      )}

      {/* Отчёт о проверке */}
      {deal.office_check_notes && (
        <SLSection icon="ClipboardCheck" title="Отчёт о проверке">
          <div className="text-[12px] text-white/80 whitespace-pre-wrap mb-2">{deal.office_check_notes}</div>
          <div className="text-[10px] text-white/40">
            {deal.office_checked_by} · {fmtDate(deal.office_checked_at)}
          </div>
        </SLSection>
      )}

      {/* Журнал */}
      <SLSection icon="History" title="Журнал событий">
        <div className="space-y-1">
          {deal.events.map(e => (
            <div key={e.id} className="flex items-start gap-2 text-[11px] border-l-2 border-[#1F1F1F] pl-2 py-1">
              <Icon name="Circle" size={6} className="mt-1.5 text-[#FFD700] fill-[#FFD700]" />
              <div className="flex-1">
                <div className="text-white/85">{e.event_type}</div>
                <div className="text-[9px] text-white/40 mt-0.5">{fmtDate(e.created_at)} {e.actor ? `· ${e.actor}` : ""}</div>
                {e.details && Object.keys(e.details).length > 0 && (
                  <pre className="text-[9px] text-white/40 mt-0.5 whitespace-pre-wrap break-all">
                    {JSON.stringify(e.details, null, 0)}
                  </pre>
                )}
              </div>
            </div>
          ))}
        </div>
      </SLSection>

      {checkModal && (
        <CheckModal
          onClose={() => setCheckModal(false)}
          onSave={async (notes) => {
            setActionLoading("check");
            const r = await sdApi(token, "admin_set_check", {
              method: "POST", body: { id: deal.id, notes },
            });
            setActionLoading(null);
            if (!r.ok) { toast.error(r.error || "Ошибка"); return; }
            toast.success("Отчёт сохранён, товар на витрине");
            setCheckModal(false);
            load();
          }}
        />
      )}

      {reserveModal && (
        <ReserveModal
          onClose={() => setReserveModal(false)}
          onSave={async (buyerName, buyerPhone, hours) => {
            setActionLoading("reserve");
            const r = await sdApi(token, "admin_reserve", {
              method: "POST",
              body: { id: deal.id, buyerName, buyerPhone, hours },
            });
            setActionLoading(null);
            if (!r.ok) { toast.error(r.error || "Ошибка"); return; }
            toast.success("Зарезервировано");
            setReserveModal(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function Row({ l, v }: { l: string; v: string | number | null | undefined }) {
  return (
    <div className="min-w-0">
      <div className="text-[9px] uppercase tracking-wider text-white/40 font-bold">{l}</div>
      <div className="text-[12px] text-white/85 truncate">{v || "—"}</div>
    </div>
  );
}

function CheckModal({ onClose, onSave }: { onClose: () => void; onSave: (notes: string) => void }) {
  const [notes, setNotes] = useState("");
  return (
    <ModalShell title="Отчёт о проверке в офисе" onClose={onClose}>
      <p className="text-[11px] text-white/55 mb-2">
        Опишите состояние, найденные дефекты, что входит в комплект. Заметки увидит покупатель.
      </p>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={5}
        placeholder="Например: Состояние отличное, царапин нет. Аккумулятор 92%. В комплекте: коробка, кабель, чек..."
        className="w-full bg-[#0F0F0F] border border-[#1F1F1F] rounded-md p-2 text-[12px] text-white/85 focus:border-[#FFD700]/40 outline-none resize-none"
      />
      <div className="flex gap-2 mt-3">
        <button onClick={onClose} className="flex-1 py-2 rounded-md border border-[#2A2A2A] text-[12px] text-white/60">Отмена</button>
        <button onClick={() => onSave(notes)} className="flex-1 py-2 rounded-md bg-[#FFD700] text-black text-[12px] font-bold">
          Сохранить и на витрину
        </button>
      </div>
    </ModalShell>
  );
}

function ReserveModal({ onClose, onSave }: { onClose: () => void; onSave: (name: string, phone: string, hours: number) => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [hours, setHours] = useState(24);
  return (
    <ModalShell title="Резерв для покупателя" onClose={onClose}>
      <div className="space-y-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="ФИО покупателя"
          className="w-full bg-[#0F0F0F] border border-[#1F1F1F] rounded-md p-2 text-[12px] focus:border-[#FFD700]/40 outline-none" />
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Телефон" type="tel"
          className="w-full bg-[#0F0F0F] border border-[#1F1F1F] rounded-md p-2 text-[12px] focus:border-[#FFD700]/40 outline-none" />
        <label className="block">
          <span className="text-[10px] uppercase tracking-wider text-white/40">Срок брони (часов)</span>
          <input value={hours} onChange={(e) => setHours(Number(e.target.value) || 24)} type="number" min={1} max={168}
            className="w-full bg-[#0F0F0F] border border-[#1F1F1F] rounded-md p-2 text-[12px] focus:border-[#FFD700]/40 outline-none mt-1" />
        </label>
      </div>
      <div className="flex gap-2 mt-3">
        <button onClick={onClose} className="flex-1 py-2 rounded-md border border-[#2A2A2A] text-[12px] text-white/60">Отмена</button>
        <button onClick={() => onSave(name, phone, hours)} className="flex-1 py-2 rounded-md bg-[#FFD700] text-black text-[12px] font-bold">
          Зарезервировать
        </button>
      </div>
    </ModalShell>
  );
}

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-2 sm:p-5">
      <div className="w-full max-w-md bg-[#0D0D0D] border border-[#2A2A2A] rounded-2xl p-4 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-extrabold">{title}</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-[#1C1C1C] flex items-center justify-center text-white/60 hover:text-white">
            <Icon name="X" size={14} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}