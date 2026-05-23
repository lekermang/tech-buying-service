/** Видимый FAQ-блок: семантический и помогает в SEO (часть FAQPage из Schema). */
import Icon from "@/components/ui/icon";

const FAQ = [
  {
    q: "Как перенести данные с iPhone на Android?",
    a: "Откройте сайт на iPhone — нажмите «Старый телефон». Выберите контакты, фото, заметки, Wi-Fi. На Android-телефоне зайдите по QR-коду или введите 6-значный код. Перенос идёт через защищённое хранилище без проводов.",
  },
  {
    q: "Как перенести фото с Android на iPhone?",
    a: "На Android выберите «Старый телефон» → «Фото и видео». Загрузите снимки. На iPhone откройте /transfer, отсканируйте QR — получите ZIP-архив или каждое фото отдельно.",
  },
  {
    q: "Как перенести контакты со старого телефона на новый?",
    a: "Браузер запросит доступ к контактам (Chrome Android, Safari iOS 14.5+). Все номера сохранятся в .vcf, новый телефон сам предложит «Импортировать в адресную книгу».",
  },
  {
    q: "Можно ли передавать большие видео (несколько гигабайт)?",
    a: "Да. Выберите режим «С компьютера» — файлы любого размера загружаются напрямую в защищённое хранилище, минуя сервер. Никаких лимитов 25 МБ.",
  },
  {
    q: "Безопасно ли это?",
    a: "Соединение по HTTPS, файлы хранятся не более 30 минут и автоматически удаляются. Доступ возможен только по уникальному 6-значному коду, который вы передаёте только своему новому устройству.",
  },
  {
    q: "Нужно ли устанавливать приложение?",
    a: "Нет. Сервис работает в браузере: на iOS — Safari, на Android — Chrome. Никаких приложений ставить не нужно.",
  },
  {
    q: "Что если интернет медленный?",
    a: "Загружайте порциями — каждый файл идёт независимо. Если связь оборвётся, добавьте файл заново. Сессия действительна 30 минут.",
  },
];

export default function TransferFAQ() {
  return (
    <section className="max-w-2xl mx-auto px-4 sm:px-5 py-12 border-t border-[#1A1A1A] mt-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FFD700]/[0.1] border border-[#FFD700]/30 text-[10px] font-bold tracking-wider uppercase text-[#FFD700] mb-2">
          <Icon name="HelpCircle" size={11} /> FAQ
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold">Частые вопросы</h2>
        <p className="text-sm text-[#777] mt-1.5">Перенос данных между телефонами — как, зачем и безопасно ли</p>
      </div>
      <div className="space-y-2">
        {FAQ.map((it, i) => (
          <details key={i} className="group bg-[#141414] border border-[#2A2A2A] rounded-xl px-4 py-3 hover:border-[#FFD700]/30 transition">
            <summary className="cursor-pointer font-bold text-sm flex items-center justify-between list-none">
              <span className="pr-3">{it.q}</span>
              <span className="text-[#FFD700] text-lg transition-transform group-open:rotate-45 shrink-0">+</span>
            </summary>
            <p className="text-sm text-[#bbb] mt-2.5 leading-relaxed">{it.a}</p>
          </details>
        ))}
      </div>
      <div className="text-center mt-6">
        <a href="/transfer/guide" className="text-sm text-[#FFD700] hover:underline inline-flex items-center gap-1">
          Подробная инструкция по моделям <Icon name="ArrowRight" size={14} />
        </a>
      </div>
    </section>
  );
}
