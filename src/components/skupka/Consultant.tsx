import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { useChatGPT } from "@/components/extensions/chatgpt-polza/useChatGPT";

const API_URL = "https://functions.poehali.dev/720613b1-3503-4345-a6eb-3d97329267ce";

const SYSTEM_PROMPT = `Ты — онлайн-консультант компании Скупка24. Компания занимается быстрой и честной скупкой техники и ювелирных украшений.

Что принимаем: смартфоны (iPhone, Samsung, Xiaomi), ноутбуки (MacBook, Dell, Lenovo), планшеты, умные часы, фотоаппараты, игровые консоли, ювелирные украшения (золото, серебро, бриллианты), AirPods и другую технику.

Адреса: ул. Кирова 11 и ул. Кирова 7/47. Работаем 24/7.
Телефоны: +7 (992) 999-03-33, 8 (800) 600-68-33 (бесплатно).

Принципы работы:
- Оценка за 15 минут
- Выплата в день обращения (наличными или на карту)
- Официальный договор на каждую сделку
- Честная рыночная цена без занижений

Отвечай коротко, по делу, на русском языке. Если спрашивают о цене — скажи, что точная оценка только при осмотре, но можно оставить заявку. Если не знаешь ответа — предложи позвонить +7 (992) 999-03-33.`;

const QUICK_QUESTIONS = [
  "Сколько стоит iPhone 14?",
  "Как быстро оценят?",
  "Принимаете сломанную технику?",
  "Как получить деньги?",
];

type Msg = { role: "user" | "assistant"; text: string };

const Consultant = () => {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "assistant", text: "Привет! Я консультант Скупки24 👋\n\nПомогу оценить вашу технику или ответить на вопросы. Что хотите узнать?" }
  ]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const { generate, isLoading } = useChatGPT({ apiUrl: API_URL });

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, open]);

  const send = async (text?: string) => {
    const message = text || input.trim();
    if (!message || isLoading) return;
    setInput("");

    const newMsgs: Msg[] = [...msgs, { role: "user", text: message }];
    setMsgs(newMsgs);

    const history = newMsgs.map(m => ({ role: m.role as "user" | "assistant", content: m.text }));

    const result = await generate({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...history,
      ],
      model: "openai/gpt-4o-mini",
      temperature: 0.7,
      max_tokens: 400,
    });

    setMsgs(prev => [...prev, {
      role: "assistant",
      text: result.success && result.content ? result.content : "Извините, не удалось ответить. Позвоните нам: +7 (992) 999-03-33"
    }]);
  };

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-5 right-4 z-50 w-14 h-14 bg-[#FFD700] text-black flex items-center justify-center shadow-2xl hover:bg-yellow-400 transition-all hover:scale-110"
        aria-label="Онлайн-консультант"
      >
        {open
          ? <Icon name="X" size={22} />
          : <Icon name="MessageCircle" size={24} />
        }
        {!open && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#0D0D0D] animate-pulse" />
        )}
      </button>

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-20 right-3 left-3 sm:left-auto sm:right-6 sm:w-80 md:w-96 z-50 flex flex-col bg-[#1A1A1A] border border-[#FFD700]/30 shadow-2xl"
          style={{ maxHeight: "75vh" }}>

          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-[#FFD700] shrink-0">
            <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center shrink-0">
              <Icon name="Bot" size={16} className="text-[#FFD700]" />
            </div>
            <div>
              <div className="font-oswald font-bold text-black text-sm uppercase">Консультант Скупки24</div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                <span className="font-roboto text-black/60 text-xs">Онлайн · Отвечаю мгновенно</span>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="ml-auto text-black/50 hover:text-black">
              <Icon name="X" size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "assistant" && (
                  <div className="w-6 h-6 bg-[#FFD700] rounded-full flex items-center justify-center shrink-0 mt-0.5 mr-2">
                    <Icon name="Bot" size={12} className="text-black" />
                  </div>
                )}
                <div className={`max-w-[80%] px-3 py-2 text-sm font-roboto leading-relaxed whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-[#FFD700] text-black"
                    : "bg-[#0D0D0D] text-white/80 border border-white/5"
                }`}>
                  {m.text}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="w-6 h-6 bg-[#FFD700] rounded-full flex items-center justify-center shrink-0 mt-0.5 mr-2">
                  <Icon name="Bot" size={12} className="text-black" />
                </div>
                <div className="bg-[#0D0D0D] border border-white/5 px-3 py-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick questions */}
          {msgs.length <= 1 && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5 shrink-0">
              {QUICK_QUESTIONS.map(q => (
                <button key={q} onClick={() => send(q)}
                  className="font-roboto text-[11px] text-[#FFD700] border border-[#FFD700]/30 hover:border-[#FFD700] px-2 py-1 transition-colors">
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="flex gap-2 px-3 py-3 border-t border-white/10 shrink-0">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
              placeholder="Напишите вопрос..."
              disabled={isLoading}
              className="flex-1 bg-[#0D0D0D] border border-[#333] text-white px-3 py-2 font-roboto text-sm focus:outline-none focus:border-[#FFD700] transition-colors placeholder:text-white/30 disabled:opacity-50"
            />
            <button onClick={() => send()} disabled={isLoading || !input.trim()}
              className="bg-[#FFD700] text-black px-3 py-2 hover:bg-yellow-400 transition-colors disabled:opacity-40 shrink-0">
              <Icon name="Send" size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Consultant;