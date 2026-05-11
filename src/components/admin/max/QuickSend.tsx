import { useState } from "react";
import Icon from "@/components/ui/icon";
import { adminHeaders } from "@/lib/adminFetch";

const MAX_BOT_URL = "https://functions.poehali.dev/4618b13e-cd61-4167-b943-0f3d439d0c8c";

const TEMPLATES: { label: string; text: string }[] = [
  { label: "Заявка принята", text: "✅ Ваша заявка принята! Менеджер свяжется в течение 15 минут." },
  { label: "Готово ✓", text: "🎉 Ваш ремонт готов! Можно забирать в любое время. Адрес: ул. Кирова, 7." },
  { label: "Перезвоним через 5 мин", text: "📞 Перезвоним вам в течение 5 минут — будьте на связи!" },
  { label: "Запчасть приехала", text: "📦 Запчасть приехала, начинаем ремонт. Сообщим о готовности." },
];

type Result = { ok: boolean; message: string; channel?: string };

type Props = {
  token: string;
  initialPhone?: string;
};

export default function QuickSend({ token, initialPhone = "" }: Props) {
  const [phone, setPhone] = useState(initialPhone);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const send = async () => {
    setResult(null);
    if (!phone.trim()) { setResult({ ok: false, message: "Укажите телефон или max_user_id клиента" }); return; }
    if (!text.trim()) { setResult({ ok: false, message: "Введите текст сообщения" }); return; }
    setSending(true);
    try {
      const res = await fetch(`${MAX_BOT_URL}?action=send`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...adminHeaders(token) },
        body: JSON.stringify({ phone: phone.trim(), text: text.trim() }),
      });
      const data = await res.json();
      if (data.delivered) {
        setResult({ ok: true, message: "Отправлено в MAX!" });
      } else if (data.reason === "no_max_chat_for_recipient") {
        setResult({ ok: false, message: "Клиент не привязан к MAX. Попросите написать /start MAX-боту." });
      } else if (data.error) {
        setResult({ ok: false, message: `Ошибка: ${data.error}` });
      } else {
        setResult({ ok: false, message: `Не доставлено: ${data.reason || "unknown"}` });
      }
    } catch (e) {
      setResult({ ok: false, message: `Сетевая ошибка: ${e}` });
    }
    setSending(false);
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-4">
        <div className="font-oswald font-bold text-white text-sm uppercase tracking-wide">Быстрая отправка в MAX</div>
        <div className="text-white/40 text-xs font-roboto">Отправить произвольное сообщение одному клиенту по номеру телефона</div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-white/40 text-[10px] uppercase tracking-wider font-roboto block mb-1">Телефон клиента</label>
          <input
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="+79991234567"
            className="w-full bg-[#0D0D0D] border border-[#333] text-white px-3 py-2 text-sm focus:outline-none focus:border-[#FFD700] transition-colors font-roboto"
          />
          <div className="text-white/30 text-[10px] mt-1 font-roboto">
            Можно вводить через 8 / +7 / 7 — нормализуется автоматически
          </div>
        </div>

        <div>
          <label className="text-white/40 text-[10px] uppercase tracking-wider font-roboto block mb-1">Текст сообщения</label>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            rows={5}
            placeholder="Текст сообщения для клиента в MAX..."
            className="w-full bg-[#0D0D0D] border border-[#333] text-white px-3 py-2 text-sm focus:outline-none focus:border-[#FFD700] transition-colors font-roboto resize-none"
          />
          <div className="text-white/30 text-[10px] mt-1 font-roboto">
            Поддерживается markdown: *жирный*, _курсив_
          </div>
        </div>

        <div>
          <div className="text-white/40 text-[10px] uppercase tracking-wider font-roboto mb-1.5">Быстрые шаблоны</div>
          <div className="flex flex-wrap gap-1.5">
            {TEMPLATES.map(t => (
              <button
                key={t.label}
                type="button"
                onClick={() => setText(t.text)}
                className="text-[10px] font-roboto px-2.5 py-1.5 border border-[#FFD700]/25 text-[#FFD700]/80 hover:bg-[#FFD700]/10 hover:text-[#FFD700] transition-colors flex items-center gap-1"
              >
                <Icon name="Zap" size={10} />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={send}
            disabled={sending}
            className="bg-[#FFD700] hover:bg-yellow-400 text-black font-oswald font-bold uppercase tracking-wide text-sm px-5 py-2.5 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Icon name={sending ? "Loader2" : "Send"} size={14} className={sending ? "animate-spin" : ""} />
            {sending ? "Отправляю..." : "Отправить в MAX"}
          </button>
          {result && (
            <div className={`text-xs font-roboto flex items-center gap-1.5 ${result.ok ? "text-green-400" : "text-orange-400"}`}>
              <Icon name={result.ok ? "CheckCircle" : "AlertCircle"} size={13} />
              {result.message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
