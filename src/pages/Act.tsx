import { useState } from "react";

const REPAIR_URL = "https://functions.poehali.dev/a105aede-d55d-4b99-9d3e-5e977887aa04";

const items = [
  {
    num: "01",
    title: null,
    text: <>Правила и условия проведения ремонтных работ изложены на сайте <span className="text-[#FFD700] font-bold">skypka24.com/act</span></>,
  },
  {
    num: "02",
    title: null,
    text: "Устройство Клиента принимается без разборки и проверки внутренних неисправностей.",
  },
  {
    num: "03",
    title: null,
    text: "Клиент согласен с тем, что гарантия от производителя после произведённого ремонта не возможна.",
  },
  {
    num: "04",
    title: null,
    text: "Клиент принимает на себя риск, связанный с возможным проявлением при ремонте скрытых дефектов, имеющихся в устройстве на момент приёмки от клиента, которые невозможно проверить и зафиксировать в данном документе (наличие следов коррозии, попадания влаги, посторонних предметов, следов механических повреждений и прочих непредусмотренных производителем в устройство и его компоненты).",
  },
  {
    num: "05",
    title: null,
    text: "Ремонт и обслуживание осуществляется в соответствии с требованиями нормативных документов, в том числе ГОСТ Р МЭК 60065-2002, ГОСТ Р МЭК 60950-2002, ГОСТ Р 50936-2013, ГОСТ Р 57137-2016, ГОСТ Р 50938-2013 и согласно Федеральному закону «О защите прав потребителей».",
  },
  {
    num: "06",
    title: null,
    text: "Установленные узлы и расходные материалы возврату не подлежат согласно Перечню сложных технических товаров, не подлежащих обмену или возврату.",
  },
  {
    num: "07",
    title: null,
    text: "Исполнитель не несёт ответственности за сохранность гарантийных пломб сторонних сервисных центров и производителя устройства.",
  },
  {
    num: "08",
    title: null,
    text: "Исполнитель не несёт ответственности за возможную потерю информации на внутренних носителях устройства, связанную с заменой узлов и компонентов.",
  },
  {
    num: "09",
    title: null,
    text: "Факт возврата устройства из ремонта фиксируется в форме ВО-13, которую исполнитель заполняет в двух экземплярах при возврате устройства клиенту.",
  },
  {
    num: "10",
    title: null,
    text: "Клиент согласен с тем, что при ремонте устройства могут быть заменены компоненты, узлы, модули, влияющие на идентификацию IMEI номера устройства.",
  },
  {
    num: "11",
    title: "Ремонт устройств после попадания влаги",
    text: "В том случае, если Устройство Клиента подвергалось взаимодействию с водной средой, то в Устройстве возможны окисления мест соединения. Клиент согласен, что при обнаружении следов взаимодействия с водной средой есть риск выхода из строя многофункциональных шлейфов, а также других узлов Устройства (вибромотор, полифонический и слуховой динамики, кнопка Home с функцией Touch ID, основная камера, системы антенн и др.), за который Исполнитель ответственности не несёт. Клиент уведомлён о вероятности самопроизвольного выхода из строя материнской платы (частично или полностью), потери или полной утраты функциональности Устройства. Клиент предупреждён, что указанные неисправности могут проявиться как во время проведения ремонта, так и в течение трёх месяцев после выдачи Устройства Клиенту.",
  },
  {
    num: "12",
    title: "Ремонт устройств с неоригинальными комплектующими",
    text: "С Клиентом согласовано, что при проведении сложного ремонта в случае обнаружения на Устройстве установленных ранее неоригинальных комплектующих с нарушением заводских допусков в работоспособности и установке последних есть риск частичного или полного выхода из строя функциональных узлов (дисплейный модуль, системы антенн), за который Исполнитель ответственности не несёт. Клиент согласен, что если Устройство ранее подвергалось некачественному ремонту в другом сервисном центре, то возможен риск выхода из строя материнской платы Устройства по одной из следующих причин: трещины в текстолите, отсутствие необходимых для работы микроэлементов на поверхности платы, нарушение системы пайки (BGA) микросхем на поверхности платы, за который Исполнитель ответственности не несёт, равно как и за полный выход Устройства из строя без возможности его восстановления.",
  },
  {
    num: "13",
    title: null,
    text: "Клиент согласен с тем, что Исполнитель не несёт ответственности за возможную неработоспособность Устройства или его отдельных компонентов из-за невозможности проверки всех функций Устройства.",
  },
];

const Act = () => {
  const [form, setForm] = useState({ name: "", phone: "", model: "", comment: "" });
  const [agreed, setAgreed] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.name || !form.phone || !agreed) return;
    setSending(true);
    setErr("");
    try {
      const res = await fetch(REPAIR_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", ...form }),
      });
      const data = await res.json();
      if (data.ok) { setSent(true); setForm({ name: "", phone: "", model: "", comment: "" }); setAgreed(false); }
      else setErr("Ошибка при отправке. Попробуйте ещё раз.");
    } catch { setErr("Нет связи. Попробуйте ещё раз."); }
    setSending(false);
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      {/* Шапка */}
      <div className="border-b border-[#FFD700]/20 bg-[#0D0D0D]/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-5 py-3 flex items-center justify-between">
          <span className="font-oswald text-[#FFD700] text-lg font-bold uppercase tracking-wide">Скупка24</span>
          <span className="font-roboto text-white/40 text-xs">г. Калуга, ул. Кирова, 21а</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-5 py-10">
        {/* Заголовок */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-1 h-8 bg-[#FFD700]" />
            <h1 className="font-oswald text-2xl sm:text-3xl font-bold uppercase tracking-wide text-white">
              Правила и условия
            </h1>
          </div>
          <p className="font-roboto text-white/50 text-sm ml-4">
            Проведения ремонтных работ · ИП Мамедов Адиль Мирза Оглы
          </p>
        </div>

        {/* Пункты */}
        <div className="flex flex-col gap-4">
          {items.map((item) => (
            <div
              key={item.num}
              className="border border-[#222] bg-[#111] hover:border-[#FFD700]/20 transition-colors"
            >
              <div className="flex gap-0">
                {/* Номер */}
                <div className="flex-shrink-0 w-12 flex items-start justify-center pt-4 border-r border-[#222]">
                  <span className="font-oswald text-[#FFD700]/60 text-sm font-bold">{item.num}</span>
                </div>
                {/* Контент */}
                <div className="flex-1 px-5 py-4">
                  {item.title && (
                    <div className="font-oswald text-[#FFD700] text-sm font-bold uppercase tracking-wide mb-2">
                      {item.title}
                    </div>
                  )}
                  <p className="font-roboto text-white/75 text-sm leading-relaxed">{item.text}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ФОРМА ЗАПИСИ */}
        <div className="mt-10 border border-[#FFD700]/20 bg-[#111]">
          <div className="flex items-center gap-3 px-5 py-3 border-b border-[#222]">
            <div className="w-1 h-5 bg-[#FFD700]" />
            <span className="font-oswald text-white text-base font-bold uppercase tracking-wide">Записаться в ремонт</span>
          </div>
          <div className="p-5">
            {sent ? (
              <div className="text-center py-6">
                <div className="font-oswald text-[#FFD700] text-xl font-bold uppercase mb-2">Заявка принята!</div>
                <p className="font-roboto text-white/50 text-sm">Мы свяжемся с вами в ближайшее время.</p>
                <button onClick={() => setSent(false)} className="mt-4 font-roboto text-[#FFD700]/60 text-xs hover:text-[#FFD700] transition-colors underline">
                  Отправить ещё одну
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="font-roboto text-white/40 text-[10px] block mb-1">Ваше имя *</label>
                    <input
                      value={form.name} onChange={e => set("name", e.target.value)}
                      placeholder="Иван Иванов"
                      className="w-full bg-[#0D0D0D] border border-[#333] text-white px-3 py-2 font-roboto text-xs focus:outline-none focus:border-[#FFD700] transition-colors placeholder:text-white/20"
                    />
                  </div>
                  <div>
                    <label className="font-roboto text-white/40 text-[10px] block mb-1">Телефон *</label>
                    <input
                      value={form.phone} onChange={e => set("phone", e.target.value)}
                      placeholder="+7 (999) 000-00-00"
                      className="w-full bg-[#0D0D0D] border border-[#333] text-white px-3 py-2 font-roboto text-xs focus:outline-none focus:border-[#FFD700] transition-colors placeholder:text-white/20"
                    />
                  </div>
                  <div>
                    <label className="font-roboto text-white/40 text-[10px] block mb-1">Модель устройства</label>
                    <input
                      value={form.model} onChange={e => set("model", e.target.value)}
                      placeholder="iPhone 14, Samsung A54..."
                      className="w-full bg-[#0D0D0D] border border-[#333] text-white px-3 py-2 font-roboto text-xs focus:outline-none focus:border-[#FFD700] transition-colors placeholder:text-white/20"
                    />
                  </div>
                  <div>
                    <label className="font-roboto text-white/40 text-[10px] block mb-1">Что сломалось</label>
                    <input
                      value={form.comment} onChange={e => set("comment", e.target.value)}
                      placeholder="Замена дисплея, зарядка..."
                      className="w-full bg-[#0D0D0D] border border-[#333] text-white px-3 py-2 font-roboto text-xs focus:outline-none focus:border-[#FFD700] transition-colors placeholder:text-white/20"
                    />
                  </div>
                </div>

                <div className="flex items-start justify-between gap-3 mb-4">
                  <label className="flex items-start gap-2 cursor-pointer group flex-1">
                    <div
                      onClick={() => setAgreed(v => !v)}
                      className={`mt-0.5 w-4 h-4 shrink-0 border flex items-center justify-center transition-colors ${agreed ? "bg-[#FFD700] border-[#FFD700]" : "border-white/30 group-hover:border-[#FFD700]/60"}`}
                    >
                      {agreed && <span className="text-black text-[9px] font-bold">✓</span>}
                    </div>
                    <span className="font-roboto text-white/50 text-[11px] leading-relaxed">
                      Ознакомлен с условиями ремонта и согласен
                    </span>
                  </label>
                  <a href="/act" className="font-roboto text-[#FFD700]/70 text-[10px] hover:text-[#FFD700] transition-colors shrink-0 underline underline-offset-2 mt-0.5">
                    Условия
                  </a>
                </div>

                {err && <p className="font-roboto text-red-400 text-xs mb-3">{err}</p>}

                <button
                  onClick={handleSubmit}
                  disabled={sending || !form.name || !form.phone || !agreed}
                  className="bg-[#FFD700] text-black font-oswald font-bold px-6 py-2.5 uppercase text-sm hover:bg-yellow-400 transition-colors disabled:opacity-40 tracking-wide"
                >
                  {sending ? "Отправляю..." : "Записаться в ремонт"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Футер */}
        <div className="mt-10 pt-6 border-t border-[#222]">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-1 h-4 bg-[#FFD700]/50 mt-0.5 flex-shrink-0" />
            <p className="font-roboto text-white/30 text-xs leading-relaxed">
              ИП Мамедов Адиль Мирза Оглы · г. Калуга, ул. Кирова, 21а · Тел.: +7 (992) 990-33-33<br />
              ИНН: 402810962699 · ОГРНИП: 307402814200032<br />
              Р/с: 40802810422270001866 · КАЛУЖСКОЕ ОТДЕЛЕНИЕ N8608 ПАО СБЕРБАНК · БИК: 042908612
            </p>
          </div>
          <a
            href="/"
            className="font-roboto text-[#FFD700]/60 text-xs hover:text-[#FFD700] transition-colors"
          >
            ← На главную
          </a>
        </div>
      </div>
    </div>
  );
};

export default Act;