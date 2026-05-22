import Icon from "@/components/ui/icon";
import { toast } from "sonner";
import {
  fmt, fmtDate, STATUS_BADGE,
  type C14dDetail,
} from "../types";
import { printContract14d } from "../printContract14d";
import {
  SLSection, SLButton, SLPill, SLStat, SLGrid,
} from "../../slUI";

async function shareClientLink(contractNumber: string) {
  const url = `${window.location.origin}/p/c/${contractNumber}`;
  const text = `Договор ${contractNumber}. Сумма к возврату и сроки: ${url}`;
  try {
    const navAny = navigator as Navigator & {
      share?: (data: { title?: string; text?: string; url?: string }) => Promise<void>;
    };
    if (typeof navAny.share === "function") {
      await navAny.share({ title: `Договор ${contractNumber}`, text, url });
      return;
    }
  } catch {
    /* пользователь отменил — попробуем скопировать */
  }
  try {
    await navigator.clipboard.writeText(url);
    toast.success("Ссылка скопирована", { description: url });
  } catch {
    toast.message("Ссылка для клиента", { description: url });
  }
}

type Props = {
  c: C14dDetail;
  onBack: () => void;
  onPay: () => void;
  onClose: () => void;
  onTerminate: () => void;
  onExtend?: () => void;
  onPhotoClick: (url: string) => void;
};

export default function C14dDetailHeader({ c, onBack, onPay, onClose, onTerminate, onExtend, onPhotoClick }: Props) {
  const badge = STATUS_BADGE[c.status];
  const passport = c.passport_series ? `${c.passport_series} ${c.passport_number || ""}` : "";
  const passportFull = c.passport_issued_by ? `${passport}, ${c.passport_issued_by} ${fmtDate(c.passport_issue_date)}` : passport;

  return (
    <>
      {/* Шапка с действиями */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <button onClick={onBack} className="inline-flex items-center gap-1 text-white/60 hover:text-white text-[12px] font-semibold">
          <Icon name="ChevronLeft" size={14} /> К списку
        </button>
        <div className="flex flex-wrap gap-1">
          <SLButton variant="goldOutline" size="sm" icon="Printer" onClick={() => printContract14d(c)}>Печать</SLButton>
          {c.status === "active" && (
            <>
              <SLButton variant="goldOutline" size="sm" icon="Link2" onClick={() => shareClientLink(c.contract_number)}>Ссылка клиенту</SLButton>
              <SLButton variant="success" size="sm" icon="Wallet" onClick={onPay}>Платёж</SLButton>
              {onExtend && (
                c.extended ? (
                  <SLButton variant="goldOutline" size="sm" icon="TimerOff" onClick={onExtend}>Снять продление</SLButton>
                ) : (
                  <SLButton variant="goldOutline" size="sm" icon="Timer" onClick={onExtend}>Продлить</SLButton>
                )
              )}
              {Number(c.remaining_debt) <= 0 && (
                <SLButton variant="dark" size="sm" icon="CheckCircle2" onClick={onClose}>Закрыть</SLButton>
              )}
              <SLButton variant="danger" size="sm" icon="Ban" onClick={onTerminate}>Расторгнуть</SLButton>
            </>
          )}
        </div>
      </div>

      {/* Шапка договора */}
      <div className="rounded-xl bg-[#101010] border border-[#1A1A1A] px-3 py-2 flex items-center gap-2 flex-wrap">
        <div className="font-oswald font-bold text-[16px] uppercase tracking-wide text-[#FFD700]">{c.contract_number}</div>
        <span className={`text-[9px] px-2 py-0.5 rounded-full border uppercase tracking-wide font-bold ${badge.cls}`}>{badge.l}</span>
        {c.overdue && <SLPill color="red" icon="AlertCircle">Просрочка {c.overdue_days} дн.</SLPill>}
        {c.extended && <SLPill color="orange" icon="Timer">Продление активно</SLPill>}
        <div className="text-[10px] text-white/40 ml-auto">{fmtDate(c.created_at)} · {c.created_by || "—"}</div>
      </div>

      {c.extended && c.extended_note && (
        <div className="rounded-md bg-orange-500/10 border border-orange-500/30 px-2.5 py-1 text-[11px] text-orange-200">
          <Icon name="MessageSquare" size={11} className="inline mr-1" />
          Комментарий по продлению: {c.extended_note}
        </div>
      )}

      {/* Финансы */}
      <SLGrid cols={4}>
        <SLStat label="Выдача" value={`${fmt(c.amount)} ₽`} />
        <SLStat label="К возврату макс" value={`${fmt(c.total_due)} ₽`} color="gold" />
        <SLStat label="Оплачено" value={`${fmt(c.paid_total)} ₽`} color="green" />
        <SLStat label="Остаток" value={`${fmt(c.remaining_debt)} ₽`} color={Number(c.remaining_debt) > 0 ? "red" : "green"} />
      </SLGrid>

      {/* Сумма на сегодня */}
      {c.status === "active" && c.today_calc && (
        <div className={`rounded-xl border p-2.5 sm:p-3 ${
          c.today_calc.is_extended
            ? "bg-gradient-to-br from-orange-500/15 via-[#FFD700]/4 to-transparent border-orange-500/30"
            : "bg-gradient-to-br from-emerald-500/15 via-[#FFD700]/4 to-transparent border-emerald-500/30"
        }`}>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Icon name={c.today_calc.is_extended ? "Timer" : "Zap"} size={12} className={c.today_calc.is_extended ? "text-orange-300" : "text-emerald-300"} />
            <h3 className={`font-oswald uppercase text-[12px] tracking-wide font-bold ${c.today_calc.is_extended ? "text-orange-300" : "text-emerald-300"}`}>
              {c.today_calc.is_extended
                ? (c.today_calc.is_overdue_extended ? "Продление · проценты капают" : "Продление · сумма на сегодня")
                : (c.today_calc.is_early ? "Досрочный выкуп · сегодня" : "Сумма на сегодня")}
            </h3>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            <SLStat
              label="Прошло дней"
              value={c.today_calc.is_extended
                ? `${Math.max(0, c.today_calc.days_passed_raw)}`
                : `${Math.max(0, c.today_calc.days_passed_raw)}/${c.term_days}`}
              color={c.today_calc.is_overdue_extended ? "orange" : "white"}
            />
            <SLStat label="% за факт. дни" value={`${fmt(c.today_calc.interest_today)} ₽`} color="orange" />
            <SLStat label="К возврату сегодня" value={`${fmt(c.today_calc.today_due_full)} ₽`} color="green" />
            <SLStat label="Доплатить" value={`${fmt(c.today_calc.today_remaining)} ₽`} color={c.today_calc.today_remaining > 0 ? "gold" : "green"} />
          </div>
          {c.today_calc.is_overdue_extended && (c.today_calc.overdue_days ?? 0) > 0 && (
            <div className="mt-1.5 text-[10px] text-orange-300/90 flex items-center gap-1">
              <Icon name="AlertCircle" size={10} /> Срок истёк <b>{c.today_calc.overdue_days}</b> дн. назад — клиент предупредил, проценты продолжают начисляться.
            </div>
          )}
          {!c.today_calc.is_extended && c.today_calc.is_early && c.today_calc.saving > 0 && (
            <div className="mt-1.5 text-[10px] text-emerald-300/85 flex items-center gap-1">
              <Icon name="Sparkles" size={10} /> Экономия <b>{fmt(c.today_calc.saving)} ₽</b> vs полный срок ({fmt(c.today_calc.full_due)} ₽)
            </div>
          )}
        </div>
      )}

      {/* Клиент */}
      <SLSection icon="User" title="Клиент">
        <SLGrid cols={2}>
          <Row l="ФИО" v={c.client_name} />
          <Row l="Дата рождения" v={fmtDate(c.client_birth_date)} />
          <Row l="Паспорт" v={passportFull} />
          <Row l="Телефон" v={c.client_phone} />
          {c.client_email && <Row l="E-mail" v={c.client_email} />}
        </SLGrid>
      </SLSection>

      {/* Имущество */}
      <SLSection icon="Package" title="Имущество">
        <SLGrid cols={2}>
          <Row l="Тип" v={c.item_type} />
          <Row l="Состояние" v={c.condition} />
          <Row l="Марка / модель" v={[c.item_brand, c.item_model].filter(Boolean).join(" ")} />
          <Row l="Серийный" v={c.serial_number} />
          {(c.accessories?.length ?? 0) > 0 && <Row l="Комплект" v={(c.accessories || []).join(", ")} />}
          {c.item_notes && <Row l="Отметки" v={c.item_notes} />}
        </SLGrid>
      </SLSection>

      {/* Условия */}
      <SLSection icon="ScrollText" title="Условия">
        <SLGrid cols={4}>
          <Row l="Ставка" v={`${fmt(c.interest_rate)}%/день`} />
          <Row l="Срок" v={`${c.term_days} дн.`} />
          <Row l="Начало" v={fmtDate(c.start_date)} />
          <Row l="Конец" v={fmtDate(c.end_date)} />
        </SLGrid>
        <div className="mt-1.5 rounded-md bg-[#FFD700]/5 border border-[#FFD700]/15 px-2 py-1 text-[10px] text-white/60">
          <Icon name="Info" size={10} className="inline mr-1 text-[#FFD700]" />
          Запрет продажи имущества третьим лицам в течение 14 дней.
        </div>
      </SLSection>

      {/* Фото */}
      {c.photos && c.photos.length > 0 && (
        <SLSection icon="Camera" title="Фото">
          <div className="grid grid-cols-2 gap-1.5">
            {c.photos.map(p => (
              <button key={p.id} onClick={() => onPhotoClick(p.file_url)} className="relative group rounded-md overflow-hidden border border-[#1F1F1F] hover:border-[#FFD700]/40 bg-black/30">
                <img src={p.file_url} alt={p.photo_type} className="w-full h-24 sm:h-28 object-cover" />
                <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-[9px] text-white/85 px-1.5 py-0.5 uppercase tracking-wide font-bold">
                  {p.photo_type === "passport" ? "Паспорт" : "Устройство"}
                </div>
              </button>
            ))}
          </div>
        </SLSection>
      )}
    </>
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