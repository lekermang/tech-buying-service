import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/icon";
import { pchatApi, PCHAT_TOKEN_KEY, PCHAT_NAME_KEY, PCHAT_DIRECT_KEY } from "./types";
import { formatPhone, isPhoneValid } from "@/lib/phoneFormat";

type Props = { onSuccess: () => void };
type Method = "menu" | "sms" | "tg_widget" | "tg_bot" | "guest" | "zvonok";

type TelegramAuthUser = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
};

declare global {
  interface Window {
    onTelegramAuth?: (user: TelegramAuthUser) => void;
  }
}

const TG_BOT_USERNAME = "Skupka24Bot"; // должен совпадать с TELEGRAM_BOT_USERNAME (без @)

const saveAndGo = (token: string, name: string, directRoomId?: number) => {
  localStorage.setItem(PCHAT_TOKEN_KEY, token);
  localStorage.setItem(PCHAT_NAME_KEY, name);
  if (directRoomId) localStorage.setItem(PCHAT_DIRECT_KEY, String(directRoomId));
};

export default function PublicChatLogin({ onSuccess }: Props) {
  const [method, setMethod] = useState<Method>("menu");

  const [phone, setPhone] = useState("+7");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [smsStep, setSmsStep] = useState<"phone" | "code">("phone");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [botCode, setBotCode] = useState("");
  const [botLink, setBotLink] = useState("");
  const [botPolling, setBotPolling] = useState(false);

  const [zvStep, setZvStep] = useState<"phone" | "code">("phone");
  const [zvHint, setZvHint] = useState("");

  const [guestName, setGuestName] = useState("");

  const tgWidgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (method !== "tg_widget" || !tgWidgetRef.current) return;
    tgWidgetRef.current.innerHTML = "";
    window.onTelegramAuth = async (user: TelegramAuthUser) => {
      setBusy(true); setErr(null);
      const r = await pchatApi("verify_telegram", { tg: user });
      setBusy(false);
      if (!r.ok) { setErr((r.error as string) || "Ошибка входа через Telegram"); return; }
      saveAndGo(r.token as string, (r.name as string) || "Клиент TG", r.direct_room_id as number);
      onSuccess();
    };
    const s = document.createElement("script");
    s.src = "https://telegram.org/js/telegram-widget.js?22";
    s.async = true;
    s.setAttribute("data-telegram-login", TG_BOT_USERNAME);
    s.setAttribute("data-size", "large");
    s.setAttribute("data-radius", "10");
    s.setAttribute("data-onauth", "onTelegramAuth(user)");
    s.setAttribute("data-request-access", "write");
    tgWidgetRef.current.appendChild(s);
  }, [method, onSuccess]);

  const requestOtp = async () => {
    if (!isPhoneValid(phone)) { setErr("Введите номер целиком"); return; }
    setBusy(true); setErr(null);
    const r = await pchatApi("request_otp", { phone });
    setBusy(false);
    if (!r.ok) { setErr((r.error as string) || "Ошибка"); return; }
    setSmsStep("code");
  };
  const verifyOtp = async () => {
    if (code.length !== 4) { setErr("Введите 4-значный код"); return; }
    setBusy(true); setErr(null);
    const r = await pchatApi("verify_otp", { phone, code, name });
    setBusy(false);
    if (!r.ok) { setErr((r.error as string) || "Неверный код"); return; }
    saveAndGo(r.token as string, (r.name as string) || name, r.direct_room_id as number);
    onSuccess();
  };

  const requestBotCode = async () => {
    setBusy(true); setErr(null);
    const r = await pchatApi("bot_request_code", { name });
    setBusy(false);
    if (!r.ok) { setErr((r.error as string) || "Ошибка"); return; }
    setBotCode(r.code as string);
    setBotLink(r.deep_link as string);
    setBotPolling(true);
  };
  useEffect(() => {
    if (!botPolling || !botCode) return;
    const id = setInterval(async () => {
      const r = await pchatApi("bot_check", { code: botCode });
      if (r.ok && r.used) {
        clearInterval(id);
        saveAndGo(r.token as string, r.name as string, r.direct_room_id as number);
        onSuccess();
      }
    }, 2500);
    return () => clearInterval(id);
  }, [botPolling, botCode, onSuccess]);

  const zvRequest = async () => {
    if (!isPhoneValid(phone)) { setErr("Введите номер целиком"); return; }
    setBusy(true); setErr(null);
    const r = await pchatApi("zvonok_request", { phone });
    setBusy(false);
    if (!r.ok) { setErr((r.error as string) || "Ошибка вызова"); return; }
    setZvHint(r.pin_known
      ? "Сейчас вам поступит звонок. После звонка введите PIN-код, который продиктует робот."
      : "Сейчас вам поступит звонок. Сбросьте его и введите ПОСЛЕДНИЕ 4 ЦИФРЫ номера, с которого звонили.");
    setZvStep("code");
  };
  const zvVerify = async () => {
    if (code.length !== 4) { setErr("Введите 4-значный код"); return; }
    setBusy(true); setErr(null);
    const r = await pchatApi("zvonok_verify", { phone, code, name });
    setBusy(false);
    if (!r.ok) { setErr((r.error as string) || "Неверный код"); return; }
    saveAndGo(r.token as string, (r.name as string) || name, r.direct_room_id as number);
    onSuccess();
  };

  const guestLogin = async () => {
    if (!guestName.trim() || guestName.trim().length < 2) { setErr("Введите имя"); return; }
    setBusy(true); setErr(null);
    const r = await pchatApi("guest_login", { name: guestName.trim() });
    setBusy(false);
    if (!r.ok) { setErr((r.error as string) || "Ошибка"); return; }
    saveAndGo(r.token as string, r.name as string);
    onSuccess();
  };

  return (
    <div className="min-h-[100dvh] bg-[#0A0A0A] text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FFD700] to-[#d4a017] items-center justify-center shadow-[0_8px_24px_rgba(255,215,0,0.3)] mb-3">
            <Icon name="MessageCircle" size={26} className="text-black" />
          </div>
          <h1 className="font-oswald text-2xl font-bold uppercase tracking-wide">Скупка24 LIVE</h1>
          <p className="text-white/55 text-sm mt-1">Чат с командой и клиентами</p>
        </div>

        <div className="bg-[#101010] border border-[#1F1F1F] rounded-2xl p-5 shadow-xl">
          {method === "menu" && (
            <>
              <div className="text-[12px] text-white/55 mb-3 text-center">Выберите способ входа</div>
              <button onClick={() => setMethod("tg_widget")}
                className="w-full bg-[#229ED9] hover:bg-[#1d8bbf] text-white font-bold py-3 rounded-lg active:scale-95 transition flex items-center justify-center gap-2 mb-2">
                <Icon name="Send" size={18} />
                Войти через Telegram
              </button>
              <button onClick={() => setMethod("tg_bot")}
                className="w-full bg-[#0F0F0F] border border-[#229ED9]/40 hover:border-[#229ED9] text-[#229ED9] font-bold py-2.5 rounded-lg active:scale-95 transition flex items-center justify-center gap-2 mb-2 text-sm">
                <Icon name="Bot" fallback="MessageCircle" size={16} />
                Получить код в Telegram-боте
              </button>
              <button onClick={() => setMethod("zvonok")}
                className="w-full bg-[#0F0F0F] border border-emerald-500/40 hover:border-emerald-500 text-emerald-300 font-bold py-2.5 rounded-lg active:scale-95 transition flex items-center justify-center gap-2 mb-2 text-sm">
                <Icon name="Phone" size={16} />
                Звонок-код на телефон
              </button>
              <button onClick={() => setMethod("sms")}
                className="w-full bg-[#0F0F0F] border border-[#FFD700]/40 hover:border-[#FFD700] text-[#FFD700] font-bold py-2.5 rounded-lg active:scale-95 transition flex items-center justify-center gap-2 mb-2 text-sm">
                <Icon name="MessageSquare" size={16} />
                Код по SMS
              </button>
              <div className="flex items-center gap-2 my-3">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-[10px] text-white/30 uppercase tracking-wider">или</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>
              <button onClick={() => setMethod("guest")}
                className="w-full bg-transparent border border-white/15 hover:border-white/30 text-white/70 font-medium py-2 rounded-lg active:scale-95 transition flex items-center justify-center gap-2 text-xs">
                <Icon name="UserPlus" size={14} />
                Войти как гость (только общий канал)
              </button>
            </>
          )}

          {method === "tg_widget" && (
            <div className="text-center">
              <div className="text-sm text-white/70 mb-3">Нажмите кнопку — Telegram попросит подтвердить вход.</div>
              <div ref={tgWidgetRef} className="flex justify-center my-4 min-h-[42px]" />
              {err && <div className="text-red-400 text-xs mb-2">{err}</div>}
              {busy && <div className="text-white/55 text-xs">Заходим...</div>}
              <button onClick={() => { setMethod("menu"); setErr(null); }} className="text-white/45 hover:text-white text-xs mt-2">← К способам входа</button>
            </div>
          )}

          {method === "tg_bot" && (
            <div>
              {!botCode ? (
                <>
                  <div className="text-sm text-white/70 mb-2">Откроется наш Telegram-бот. После «Старт» — вы автоматически войдёте в чат.</div>
                  <label className="text-[10px] uppercase tracking-wider text-white/40 font-bold block mb-1">Имя (по желанию)</label>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="Иван"
                    className="w-full bg-[#0A0A0A] border border-[#1F1F1F] focus:border-[#229ED9]/40 text-white text-sm px-3 py-2.5 rounded-lg outline-none mb-3" />
                  {err && <div className="text-red-400 text-xs mb-2">{err}</div>}
                  <button onClick={requestBotCode} disabled={busy}
                    className="w-full bg-[#229ED9] hover:bg-[#1d8bbf] text-white font-bold py-3 rounded-lg disabled:opacity-50 active:scale-95">
                    {busy ? "Подготовка..." : "Открыть Telegram-бота"}
                  </button>
                </>
              ) : (
                <>
                  <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 mb-3 text-[12px] text-emerald-300">
                    1. Откройте бота по ссылке<br />
                    2. Нажмите «Start»<br />
                    3. Возвращайтесь — войдёте автоматически
                  </div>
                  <a href={botLink} target="_blank" rel="noreferrer"
                    className="block w-full bg-[#229ED9] hover:bg-[#1d8bbf] text-white text-center font-bold py-3 rounded-lg active:scale-95 mb-2">
                    <Icon name="ExternalLink" size={14} className="inline mr-1" />
                    Открыть Telegram-бота
                  </a>
                  <div className="text-[11px] text-white/45 text-center">Ждём вашего нажатия в боте...</div>
                </>
              )}
              <button onClick={() => { setMethod("menu"); setBotCode(""); setBotPolling(false); setErr(null); }}
                className="w-full mt-3 text-white/45 hover:text-white text-xs">← К способам входа</button>
            </div>
          )}

          {method === "sms" && (
            <>
              {smsStep === "phone" ? (
                <>
                  <label className="text-[10px] uppercase tracking-wider text-white/40 font-bold block mb-1">Имя (по желанию)</label>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="Иван"
                    className="w-full bg-[#0A0A0A] border border-[#1F1F1F] focus:border-[#FFD700]/40 text-white text-sm px-3 py-2.5 rounded-lg outline-none mb-3" />
                  <label className="text-[10px] uppercase tracking-wider text-white/40 font-bold block mb-1">Телефон</label>
                  <input type="tel" inputMode="tel" value={phone}
                    onChange={e => setPhone(formatPhone(e.target.value))}
                    placeholder="+7 (___) ___-__-__"
                    className="w-full bg-[#0A0A0A] border border-[#1F1F1F] focus:border-[#FFD700]/40 text-white text-sm px-3 py-2.5 rounded-lg outline-none mb-3" />
                  {err && <div className="text-red-400 text-xs mb-2">{err}</div>}
                  <button onClick={requestOtp} disabled={busy}
                    className="w-full bg-[#FFD700] hover:bg-[#FFE34D] text-black font-bold py-3 rounded-lg disabled:opacity-50 active:scale-95">
                    {busy ? "Отправляем..." : "Получить код в SMS"}
                  </button>
                </>
              ) : (
                <>
                  <div className="text-sm text-white/70 mb-3">Код отправлен на <b className="text-[#FFD700]">{phone}</b></div>
                  <input value={code} onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    inputMode="numeric" maxLength={4} placeholder="0000"
                    className="w-full bg-[#0A0A0A] border border-[#1F1F1F] focus:border-[#FFD700]/40 text-white text-2xl text-center tracking-[0.6em] font-bold px-3 py-3 rounded-lg outline-none mb-3" />
                  {err && <div className="text-red-400 text-xs mb-2">{err}</div>}
                  <button onClick={verifyOtp} disabled={busy || code.length !== 4}
                    className="w-full bg-[#FFD700] hover:bg-[#FFE34D] text-black font-bold py-3 rounded-lg disabled:opacity-50 active:scale-95">
                    {busy ? "Проверяем..." : "Войти"}
                  </button>
                  <button onClick={() => { setSmsStep("phone"); setCode(""); setErr(null); }}
                    className="w-full mt-2 text-white/55 hover:text-white text-xs">← Изменить номер</button>
                </>
              )}
              <button onClick={() => { setMethod("menu"); setSmsStep("phone"); setCode(""); setErr(null); }}
                className="w-full mt-2 text-white/35 hover:text-white text-[10px] uppercase tracking-wider">← К способам входа</button>
            </>
          )}

          {method === "zvonok" && (
            <>
              {zvStep === "phone" ? (
                <>
                  <div className="text-xs text-white/55 mb-3">Вам поступит короткий звонок — это бесплатно для вас. После звонка введите код.</div>
                  <label className="text-[10px] uppercase tracking-wider text-white/40 font-bold block mb-1">Имя (по желанию)</label>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="Иван"
                    className="w-full bg-[#0A0A0A] border border-[#1F1F1F] focus:border-emerald-500/40 text-white text-sm px-3 py-2.5 rounded-lg outline-none mb-3" />
                  <label className="text-[10px] uppercase tracking-wider text-white/40 font-bold block mb-1">Телефон</label>
                  <input type="tel" inputMode="tel" value={phone}
                    onChange={e => setPhone(formatPhone(e.target.value))}
                    placeholder="+7 (___) ___-__-__"
                    className="w-full bg-[#0A0A0A] border border-[#1F1F1F] focus:border-emerald-500/40 text-white text-sm px-3 py-2.5 rounded-lg outline-none mb-3" />
                  {err && <div className="text-red-400 text-xs mb-2">{err}</div>}
                  <button onClick={zvRequest} disabled={busy}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-lg disabled:opacity-50 active:scale-95">
                    {busy ? "Звоним..." : "Позвонить мне"}
                  </button>
                </>
              ) : (
                <>
                  <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 mb-3 text-[12px] text-emerald-300">{zvHint}</div>
                  <input value={code} onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    inputMode="numeric" maxLength={4} placeholder="0000"
                    className="w-full bg-[#0A0A0A] border border-[#1F1F1F] focus:border-emerald-500/40 text-white text-2xl text-center tracking-[0.6em] font-bold px-3 py-3 rounded-lg outline-none mb-3" />
                  {err && <div className="text-red-400 text-xs mb-2">{err}</div>}
                  <button onClick={zvVerify} disabled={busy || code.length !== 4}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-lg disabled:opacity-50 active:scale-95">
                    {busy ? "Проверяем..." : "Войти"}
                  </button>
                </>
              )}
              <button onClick={() => { setMethod("menu"); setZvStep("phone"); setCode(""); setErr(null); }}
                className="w-full mt-2 text-white/35 hover:text-white text-[10px] uppercase tracking-wider">← К способам входа</button>
            </>
          )}

          {method === "guest" && (
            <>
              <div className="text-xs text-white/55 mb-3">В гостевом режиме доступен только общий канал. Для личного диалога с менеджером — войдите через Telegram, звонок или SMS.</div>
              <label className="text-[10px] uppercase tracking-wider text-white/40 font-bold block mb-1">Как вас называть?</label>
              <input value={guestName} onChange={e => setGuestName(e.target.value)} placeholder="Иван" maxLength={40}
                className="w-full bg-[#0A0A0A] border border-[#1F1F1F] focus:border-white/40 text-white text-sm px-3 py-2.5 rounded-lg outline-none mb-3" />
              {err && <div className="text-red-400 text-xs mb-2">{err}</div>}
              <button onClick={guestLogin} disabled={busy || guestName.trim().length < 2}
                className="w-full bg-white/15 hover:bg-white/25 text-white font-bold py-3 rounded-lg disabled:opacity-50 active:scale-95">
                {busy ? "Заходим..." : "Войти как гость"}
              </button>
              <button onClick={() => { setMethod("menu"); setErr(null); }}
                className="w-full mt-2 text-white/35 hover:text-white text-[10px] uppercase tracking-wider">← К способам входа</button>
            </>
          )}
        </div>

        <div className="mt-4 text-center">
          <a href="/" className="text-white/40 hover:text-[#FFD700] text-xs">← Вернуться на сайт</a>
        </div>
      </div>
    </div>
  );
}
