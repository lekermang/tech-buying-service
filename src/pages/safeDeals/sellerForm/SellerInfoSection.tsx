/** Блок «Быстрый старт» + «О вас» + Скан паспорта. */
import { useRef } from "react";
import Icon from "@/components/ui/icon";
import { type PassportData } from "../api";
import { Section, Field } from "./primitives";

export function QuickStartBlock({ yandexAvailable, onYandex, onAvito }: {
  yandexAvailable: boolean;
  onYandex: () => void;
  onAvito: () => void;
}) {
  return (
    <div className="bg-gradient-to-br from-[#FFD700]/[0.08] to-transparent border border-[#FFD700]/25 rounded-2xl p-3.5">
      <div className="text-xs uppercase tracking-wider font-bold text-[#FFD700] mb-2">⚡ Быстрый старт</div>
      <div className="grid grid-cols-2 gap-2">
        {yandexAvailable && (
          <button onClick={onYandex}
            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#FF0000] text-white font-bold text-sm hover:bg-[#cc0000] transition">
            <Icon name="LogIn" size={16} /> Войти через Яндекс ID
          </button>
        )}
        <button onClick={onAvito}
          className={`flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[#0AF] to-[#0080FF] text-white font-bold text-sm hover:opacity-90 transition ${!yandexAvailable ? "col-span-2" : ""}`}>
          <Icon name="Download" size={16} /> Импорт с Авито
        </button>
      </div>
      <div className="text-[10px] text-[#777] mt-2 text-center">
        За 5 секунд — без ручного ввода
      </div>
    </div>
  );
}

export function SellerInfoSection({
  sellerName, setSellerName,
  sellerPhone, setSellerPhone,
  sellerEmail, setSellerEmail,
  passport, setPassport,
  passportScanning,
  onScanPassport,
}: {
  sellerName: string; setSellerName: (v: string) => void;
  sellerPhone: string; setSellerPhone: (v: string) => void;
  sellerEmail: string; setSellerEmail: (v: string) => void;
  passport: PassportData | null;
  setPassport: (p: PassportData | null) => void;
  passportScanning: boolean;
  onScanPassport: (file: File) => void;
}) {
  const passportInputRef = useRef<HTMLInputElement>(null);

  return (
    <Section title="О вас" icon="User">
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Ваше имя*">
          <input value={sellerName} onChange={e => setSellerName(e.target.value)}
            className="input" placeholder="Иван Иванов" />
        </Field>
        <Field label="Телефон*">
          <input value={sellerPhone} onChange={e => setSellerPhone(e.target.value)}
            className="input" placeholder="+7 900 123-45-67" type="tel" />
        </Field>
        <Field label="Email (необязательно)" full>
          <input value={sellerEmail} onChange={e => setSellerEmail(e.target.value)}
            className="input" placeholder="you@mail.ru" type="email" />
        </Field>
      </div>

      {/* Скан паспорта */}
      <div className="mt-4 pt-4 border-t border-[#2A2A2A]">
        <input ref={passportInputRef} type="file" accept="image/*" style={{ display: "none" }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onScanPassport(f); e.target.value = ""; }} />
        {!passport && (
          <button onClick={() => passportInputRef.current?.click()} disabled={passportScanning}
            className="w-full py-3 rounded-xl border-2 border-dashed border-[#FFD700]/40 text-[#FFD700] font-bold text-sm hover:border-[#FFD700] transition flex items-center justify-center gap-2 disabled:opacity-50">
            {passportScanning
              ? (<><Icon name="Loader2" size={14} className="animate-spin" /> Распознаём паспорт...</>)
              : (<><Icon name="ScanLine" size={14} /> Загрузить и распознать паспорт (ИИ)</>)}
          </button>
        )}
        {passport && (
          <div className="bg-emerald-500/[0.06] border border-emerald-500/30 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                <Icon name="CheckCircle2" size={12} className="inline mr-1" /> Паспорт загружен
              </span>
              <button onClick={() => setPassport(null)} className="text-xs text-[#777] hover:text-[#FF453A]">
                Заменить
              </button>
            </div>
            <div className="text-xs text-[#bbb] space-y-1">
              {passport.fullName && <div>ФИО: <span className="text-white">{passport.fullName}</span></div>}
              {(passport.series || passport.number) && <div>Серия/номер: <span className="text-white">{passport.series} {passport.number}</span></div>}
              {passport.issuedBy && <div>Кем выдан: <span className="text-white">{passport.issuedBy}</span></div>}
            </div>
          </div>
        )}
        <div className="text-[10px] text-[#666] mt-2 text-center">
          Паспорт нужен сотруднику для оформления при сделке. Видит только админ.
        </div>
      </div>
    </Section>
  );
}
